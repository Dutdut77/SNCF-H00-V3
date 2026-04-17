<script setup>
/**
 * Tbody partagé : rendu récursif des ensembles / sous-ensembles à profondeur illimitée.
 *
 * Utilisé dans :
 *   - parametres/ensembles.vue      (showNotes=false, 7 colonnes)
 *   - chantier/commandesMatieres.vue (showNotes=true, 8 colonnes)
 *
 * Le rendu d'un nœud (sous-ensemble) est délégué à EnsemblesMatieresTreeRow,
 * qui s'appelle récursivement sur ses enfants via provide/inject.
 */
const props = defineProps({
  lignes:        { type: Array,   default: () => [] },
  sousEnsembles: { type: Array,   default: () => [] },
  showNotes:     { type: Boolean, default: false },
  udMap:         { type: Map,     default: () => new Map() },
  /** Optionnel : callback (ensembleId) => void pour proposer un ajout à ce niveau */
  onAddTo:       { type: Function, default: null },
})

const emit = defineEmits([
  'update-quantite-ligne',
  'update-notes-ligne',
  'delete-ligne',
  'update-quantite-se',
  'delete-se',
])

const { countArticlesRecursive, prixTotalRecursive } = useEnsemblesMatieres()

// État global des sous-ensembles ouverts (partagé via provide à toute la descendance)
const openIds = ref(new Set())
const toggleOpen = (id) => {
  const s = new Set(openIds.value)
  s.has(id) ? s.delete(id) : s.add(id)
  openIds.value = s
}

// Exposé à TreeRow via provide
provide('ensemblesTreeCtx', {
  openIds:                 readonly(openIds),
  toggleOpen,
  showNotes:               computed(() => props.showNotes),
  udMap:                   computed(() => props.udMap),
  countArticlesRecursive,
  prixTotalRecursive,
  onUpdateQuantiteLigne:   (ligne, val) => emit('update-quantite-ligne', ligne, val),
  onUpdateNotesLigne:      (ligne, val) => emit('update-notes-ligne', ligne, val),
  onDeleteLigne:           (ligne) => emit('delete-ligne', ligne),
  onUpdateQuantiteSe:      (item, val) => emit('update-quantite-se', item, val),
  onDeleteSe:              (item) => emit('delete-se', item),
  onAddTo:                 props.onAddTo,
})

// ─── Items de premier niveau : sous-ensembles d'abord, puis articles directs ────
const itemsAffiches = computed(() => {
  const se = [...props.sousEnsembles]
    .sort((a, b) => (a.sous_ensemble?.nom ?? '').localeCompare(b.sous_ensemble?.nom ?? ''))
    .map((s) => ({ type: 'sous-ensemble', data: s }))
  const arts = [...props.lignes]
    .sort((a, b) => a.numero_symbole.localeCompare(b.numero_symbole))
    .map((l) => ({ type: 'article', data: l }))
  return [...se, ...arts]
})

// ─── Rendu des articles directs (niveau racine) ────────────────────────────────
const fmtPrix = (v) =>
  v == null
    ? '—'
    : Number(v).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'

const prixUnitaire = (cat) => {
  if (!cat) return 0
  const qpu = props.udMap.get(cat.unite_distribution)?.quantite_par_unite ?? 1
  return (cat.prix_ud ?? 0) / (qpu > 0 ? qpu : 1)
}
</script>

<template>
  <template v-for="(item, i) in itemsAffiches" :key="item.data.id">

    <!-- Article racine -->
    <tr
      v-if="item.type === 'article'"
      class="group border-t border-gray-100 transition dark:border-gray-700/50"
      :class="i % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/20'"
    >
      <td class="px-4 py-2.5">
        <span class="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 font-mono text-sm font-semibold text-blue-700 ring-1 ring-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:ring-blue-800/40">
          {{ item.data.numero_symbole }}
        </span>
      </td>
      <td class="px-4 py-2.5">
        <p class="text-sm font-medium text-gray-700 dark:text-gray-200">{{ item.data.catalogue_matieres?.description || '—' }}</p>
        <p v-if="item.data.catalogue_matieres?.famille" class="mt-0.5 text-sm text-gray-400">{{ item.data.catalogue_matieres.famille }}</p>
      </td>
      <td class="px-4 py-2.5 text-center">
        <span class="rounded bg-gray-100 px-1.5 py-0.5 text-sm font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400">
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
      <td class="whitespace-nowrap px-4 py-2.5 text-right text-sm text-gray-500 dark:text-gray-400">{{ fmtPrix(prixUnitaire(item.data.catalogue_matieres)) }}</td>
      <td class="whitespace-nowrap px-4 py-2.5 text-right">
        <span class="text-sm font-semibold text-gray-800 dark:text-gray-100">
          {{ fmtPrix(prixUnitaire(item.data.catalogue_matieres) * (item.data.quantite || 0)) }}
        </span>
      </td>
      <td v-if="showNotes" class="px-4 py-2.5">
        <input
          type="text" :value="item.data.notes" placeholder="Ajouter une note…"
          class="w-full rounded-lg border border-transparent bg-transparent px-2 py-1 text-sm text-gray-600 outline-none transition placeholder:text-gray-300 hover:border-gray-200 hover:bg-white focus:border-blue-300 focus:bg-white focus:ring-1 focus:ring-blue-100 dark:text-gray-300 dark:placeholder-gray-600 dark:hover:border-gray-600 dark:hover:bg-gray-800 dark:focus:border-blue-600 dark:focus:bg-gray-800"
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

    <!-- Sous-ensemble racine → rendu récursif -->
    <EnsemblesMatieresTreeRow
      v-else
      :item="item.data"
      :depth="0"
    />

  </template>
</template>
