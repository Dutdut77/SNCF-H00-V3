<script setup>
/**
 * Tbody partagé : ensembles/sous-ensembles en tête (triés par nom),
 * puis articles directs (triés par symbole).
 *
 * À l'intérieur d'un bloc ouvert : nested sous-ensembles d'abord (violet),
 * puis articles directs du bloc (indigo).
 *
 * Utilisé dans :
 *   - parametres/ensembles.vue  (showNotes=false, 7 colonnes)
 *   - chantier/commandesMatieres.vue  (showNotes=true, 8 colonnes)
 *
 * sousEnsembles = [{ id, quantite, sous_ensemble: { nom, description,
 *   ensembles_matieres_lignes, ensembles_matieres_sous_ensembles } }]
 */
const props = defineProps({
  lignes:       { type: Array, default: () => [] },
  sousEnsembles:{ type: Array, default: () => [] },
  showNotes:    { type: Boolean, default: false },
})

const emit = defineEmits([
  'update-quantite-ligne',
  'update-notes-ligne',
  'delete-ligne',
  'update-quantite-se',
  'delete-se',
])

// ─── Open/close state ────────────────────────────────────────────────────────
const openSousEnsembles = ref(new Set())
const toggleSousEnsemble = (id) => {
  const s = new Set(openSousEnsembles.value)
  s.has(id) ? s.delete(id) : s.add(id)
  openSousEnsembles.value = s
}

const openNestedSousEnsembles = ref(new Set())
const toggleNestedSousEnsemble = (id) => {
  const s = new Set(openNestedSousEnsembles.value)
  s.has(id) ? s.delete(id) : s.add(id)
  openNestedSousEnsembles.value = s
}

// ─── Tri ─────────────────────────────────────────────────────────────────────
const itemsAffiches = computed(() => {
  const se = [...props.sousEnsembles]
    .sort((a, b) => (a.sous_ensemble?.nom ?? '').localeCompare(b.sous_ensemble?.nom ?? ''))
    .map((s) => ({ type: 'sous-ensemble', data: s }))
  const arts = [...props.lignes]
    .sort((a, b) => a.numero_symbole.localeCompare(b.numero_symbole))
    .map((l) => ({ type: 'article', data: l }))
  return [...se, ...arts]
})

const sortedLignes = (lignes) =>
  [...(lignes ?? [])].sort((a, b) => a.numero_symbole.localeCompare(b.numero_symbole))

const sortedNestedSe = (sousEnsembles) =>
  [...(sousEnsembles ?? [])].sort((a, b) =>
    (a.sous_ensemble?.nom ?? '').localeCompare(b.sous_ensemble?.nom ?? ''))

// ─── Calculs ──────────────────────────────────────────────────────────────────
const fmtPrix = (v) => {
  if (v == null) return '—'
  return Number(v).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}

const computeTotalSe = (item) => {
  const direct = (item.sous_ensemble?.ensembles_matieres_lignes ?? []).reduce(
    (acc, l) => acc + (l.catalogue_matieres?.prix_ud ?? 0) * (l.quantite || 0), 0
  )
  const nested = (item.sous_ensemble?.ensembles_matieres_sous_ensembles ?? []).reduce(
    (acc, ns) =>
      acc +
      (ns.sous_ensemble?.ensembles_matieres_lignes ?? []).reduce(
        (a, l) => a + (l.catalogue_matieres?.prix_ud ?? 0) * (l.quantite || 0), 0
      ) * (ns.quantite || 1),
    0
  )
  return (direct + nested) * (item.quantite || 1)
}

const countArticlesSe = (se) =>
  (se?.ensembles_matieres_lignes?.length ?? 0) +
  (se?.ensembles_matieres_sous_ensembles ?? []).reduce(
    (a, ns) => a + (ns.sous_ensemble?.ensembles_matieres_lignes?.length ?? 0), 0
  )

// colspan de la cellule "queue" dans les lignes de nested SE
// (prix + total + [notes] + delete)
const trailingColspan = computed(() => props.showNotes ? 4 : 3)
</script>

<template>
  <template v-for="(item, i) in itemsAffiches" :key="item.data.id">

    <!-- ── Article direct ────────────────────────────────────────────────────── -->
    <tr
      v-if="item.type === 'article'"
      class="group border-t border-gray-100 transition dark:border-gray-700/50"
      :class="i % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/20'"
    >
      <td class="px-4 py-2.5">
        <span class="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 font-mono text-xs font-semibold text-blue-700 ring-1 ring-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:ring-blue-800/40">
          {{ item.data.numero_symbole }}
        </span>
      </td>
      <td class="px-4 py-2.5">
        <p class="text-xs font-medium text-gray-700 dark:text-gray-200">{{ item.data.catalogue_matieres?.description || '—' }}</p>
        <p v-if="item.data.catalogue_matieres?.famille" class="mt-0.5 text-xs text-gray-400">{{ item.data.catalogue_matieres.famille }}</p>
      </td>
      <td class="px-4 py-2.5 text-center">
        <span class="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400">
          {{ item.data.catalogue_matieres?.unite_distribution || '—' }}
        </span>
      </td>
      <td class="px-4 py-2.5 text-center">
        <input
          type="number" min="0" step="any" :value="item.data.quantite"
          class="w-24 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-center text-sm font-medium text-gray-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          @change="emit('update-quantite-ligne', item.data, $event.target.value)"
        />
      </td>
      <td class="whitespace-nowrap px-4 py-2.5 text-right text-xs text-gray-500 dark:text-gray-400">{{ fmtPrix(item.data.catalogue_matieres?.prix_ud) }}</td>
      <td class="whitespace-nowrap px-4 py-2.5 text-right">
        <span class="text-sm font-semibold text-gray-800 dark:text-gray-100">
          {{ fmtPrix((item.data.catalogue_matieres?.prix_ud ?? 0) * (item.data.quantite || 0)) }}
        </span>
      </td>
      <!-- Colonne Notes (chantier seulement) -->
      <td v-if="showNotes" class="px-4 py-2.5">
        <input
          type="text"
          :value="item.data.notes"
          placeholder="Ajouter une note…"
          class="w-full rounded-lg border border-transparent bg-transparent px-2 py-1 text-xs text-gray-600 outline-none transition placeholder:text-gray-300 hover:border-gray-200 hover:bg-white focus:border-blue-300 focus:bg-white focus:ring-1 focus:ring-blue-100 dark:text-gray-300 dark:placeholder-gray-600 dark:hover:border-gray-600 dark:hover:bg-gray-800 dark:focus:border-blue-600 dark:focus:bg-gray-800"
          @change="emit('update-notes-ligne', item.data, $event.target.value)"
        />
      </td>
      <td class="px-2 py-2.5 text-center">
        <button type="button"
          class="rounded-md p-1.5 text-gray-300 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:text-gray-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
          title="Retirer l'article"
          @click="emit('delete-ligne', item.data)"
        >
          <Icon name="lucide:trash-2" size="13" />
        </button>
      </td>
    </tr>

    <!-- ── Bloc ensemble / sous-ensemble ─────────────────────────────────────── -->
    <template v-else>
      <!-- En-tête du bloc (indigo) -->
      <tr class="group border-t border-gray-200 bg-indigo-50/60 dark:border-gray-600 dark:bg-indigo-900/10">
        <td colspan="3" class="px-4 py-2.5">
          <div class="flex items-center gap-2">
            <button
              type="button"
              class="flex h-5 w-5 flex-none items-center justify-center rounded text-indigo-400 transition hover:bg-indigo-100 dark:hover:bg-indigo-800/40"
              @click="toggleSousEnsemble(item.data.id)"
            >
              <Icon
                :name="openSousEnsembles.has(item.data.id) ? 'lucide:chevron-down' : 'lucide:chevron-right'"
                size="13"
              />
            </button>
            <Icon name="lucide:layers" size="14" class="flex-none text-indigo-500 dark:text-indigo-400" />
            <span class="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
              {{ item.data.sous_ensemble?.nom }}
            </span>
            <span class="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
              {{ countArticlesSe(item.data.sous_ensemble) }} art.
            </span>
            <p v-if="item.data.sous_ensemble?.description" class="truncate text-xs text-indigo-400">
              {{ item.data.sous_ensemble.description }}
            </p>
          </div>
        </td>
        <td class="px-4 py-2.5 text-center">
          <input
            type="number" min="1" step="1" :value="item.data.quantite ?? 1"
            class="w-24 rounded-lg border border-indigo-200 bg-white px-2 py-1.5 text-center text-sm font-medium text-indigo-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-indigo-700/50 dark:bg-gray-800 dark:text-indigo-300"
            @change="emit('update-quantite-se', item.data, $event.target.value)"
          />
        </td>
        <td class="px-4 py-2.5"></td>
        <td class="whitespace-nowrap px-4 py-2.5 text-right">
          <span class="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
            {{ fmtPrix(computeTotalSe(item.data)) }}
          </span>
        </td>
        <td v-if="showNotes" class="px-4 py-2.5"></td>
        <td class="px-2 py-2.5 text-center">
          <button type="button"
            class="rounded-md p-1.5 text-gray-300 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:text-gray-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
            title="Retirer"
            @click="emit('delete-se', item.data)"
          >
            <Icon name="lucide:trash-2" size="13" />
          </button>
        </td>
      </tr>

      <!-- Contenu déplié : nested SE en premier, puis articles directs -->
      <template v-if="openSousEnsembles.has(item.data.id)">

        <!-- Nested sous-ensembles (violet, cliquables) -->
        <template
          v-for="nestedSe in sortedNestedSe(item.data.sous_ensemble?.ensembles_matieres_sous_ensembles)"
          :key="'nested-se-' + nestedSe.id"
        >
          <tr
            class="cursor-pointer border-t border-violet-100 bg-violet-50/40 hover:bg-violet-50/70 dark:border-violet-900/20 dark:bg-violet-900/5 dark:hover:bg-violet-900/10"
            @click="toggleNestedSousEnsemble(nestedSe.id)"
          >
            <td colspan="3" class="py-2 pl-14 pr-4">
              <div class="flex items-center gap-2">
                <Icon
                  :name="openNestedSousEnsembles.has(nestedSe.id) ? 'lucide:chevron-down' : 'lucide:chevron-right'"
                  size="12"
                  class="flex-none text-violet-400 dark:text-violet-500"
                />
                <Icon name="lucide:layers" size="12" class="flex-none text-violet-400 dark:text-violet-500" />
                <span class="text-xs font-semibold text-violet-600 dark:text-violet-400">{{ nestedSe.sous_ensemble?.nom }}</span>
                <span class="rounded-full bg-violet-100 px-1.5 py-0.5 text-xs text-violet-500 dark:bg-violet-900/30 dark:text-violet-400">
                  {{ nestedSe.sous_ensemble?.ensembles_matieres_lignes?.length ?? 0 }} art.
                </span>
              </div>
            </td>
            <td class="px-4 py-2 text-center text-xs text-violet-500 dark:text-violet-400">× {{ nestedSe.quantite ?? 1 }}</td>
            <td :colspan="trailingColspan"></td>
          </tr>
          <!-- Articles du nested SE (sorted, lus seuls) -->
          <tr
            v-for="nestedLigne in (openNestedSousEnsembles.has(nestedSe.id) ? sortedLignes(nestedSe.sous_ensemble?.ensembles_matieres_lignes) : [])"
            :key="'nested-art-' + nestedLigne.id"
            class="border-t border-violet-50 bg-violet-50/20 dark:border-violet-900/10 dark:bg-violet-900/5"
          >
            <td class="py-2 pl-20 pr-4">
              <span class="inline-flex items-center rounded-md bg-violet-50 px-2 py-0.5 font-mono text-xs font-semibold text-violet-600 ring-1 ring-violet-100 dark:bg-violet-900/20 dark:text-violet-300 dark:ring-violet-800/40">
                {{ nestedLigne.numero_symbole }}
              </span>
            </td>
            <td class="px-4 py-2">
              <p class="text-xs font-medium text-gray-700 dark:text-gray-200">{{ nestedLigne.catalogue_matieres?.description || '—' }}</p>
            </td>
            <td class="px-4 py-2 text-center">
              <span class="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                {{ nestedLigne.catalogue_matieres?.unite_distribution || '—' }}
              </span>
            </td>
            <td class="px-4 py-2 text-center text-xs text-gray-500 dark:text-gray-400">{{ nestedLigne.quantite }}</td>
            <td class="whitespace-nowrap px-4 py-2 text-right text-xs text-gray-500 dark:text-gray-400">{{ fmtPrix(nestedLigne.catalogue_matieres?.prix_ud) }}</td>
            <td class="whitespace-nowrap px-4 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300">
              {{ fmtPrix((nestedLigne.catalogue_matieres?.prix_ud ?? 0) * (nestedLigne.quantite || 0)) }}
            </td>
            <td v-if="showNotes"></td>
            <td></td>
          </tr>
        </template>

        <!-- Articles directs du bloc (indigo, sorted, lus seuls) -->
        <tr
          v-for="sousligne in sortedLignes(item.data.sous_ensemble?.ensembles_matieres_lignes)"
          :key="'se-art-' + sousligne.id"
          class="border-t border-indigo-50 bg-indigo-50/20 dark:border-indigo-900/20 dark:bg-indigo-900/5"
        >
          <td class="py-2 pl-10 pr-4">
            <span class="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 font-mono text-xs font-semibold text-indigo-600 ring-1 ring-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-300 dark:ring-indigo-800/40">
              {{ sousligne.numero_symbole }}
            </span>
          </td>
          <td class="px-4 py-2">
            <p class="text-xs font-medium text-gray-700 dark:text-gray-200">{{ sousligne.catalogue_matieres?.description || '—' }}</p>
            <p v-if="sousligne.catalogue_matieres?.famille" class="mt-0.5 text-xs text-gray-400">{{ sousligne.catalogue_matieres.famille }}</p>
          </td>
          <td class="px-4 py-2 text-center">
            <span class="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400">
              {{ sousligne.catalogue_matieres?.unite_distribution || '—' }}
            </span>
          </td>
          <td class="px-4 py-2 text-center text-xs text-gray-500 dark:text-gray-400">{{ sousligne.quantite }}</td>
          <td class="whitespace-nowrap px-4 py-2 text-right text-xs text-gray-500 dark:text-gray-400">{{ fmtPrix(sousligne.catalogue_matieres?.prix_ud) }}</td>
          <td class="whitespace-nowrap px-4 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300">
            {{ fmtPrix((sousligne.catalogue_matieres?.prix_ud ?? 0) * (sousligne.quantite || 0)) }}
          </td>
          <td v-if="showNotes"></td>
          <td></td>
        </tr>

      </template>
    </template>

  </template>
</template>
