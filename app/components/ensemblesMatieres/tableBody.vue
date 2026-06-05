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
  /** Mode lecture seule : pas d'inputs ni de boutons d'action */
  readonly:      { type: Boolean, default: false },
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
  readonly:                computed(() => props.readonly),
  countArticlesRecursive,
  prixTotalRecursive,
  onUpdateQuantiteLigne:   (ligne, val) => emit('update-quantite-ligne', ligne, val),
  onUpdateNotesLigne:      (ligne, val) => emit('update-notes-ligne', ligne, val),
  onDeleteLigne:           (ligne) => emit('delete-ligne', ligne),
  onUpdateQuantiteSe:      (item, val) => emit('update-quantite-se', item, val),
  onDeleteSe:              (item) => emit('delete-se', item),
  onAddTo:                 props.readonly ? null : props.onAddTo,
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
      class="group border-t border-slate-100 transition dark:border-slate-700/50"
      :class="i % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/50 dark:bg-slate-800/20'"
    >
      <td class="px-4 py-2.5">
        <span
          :title="item.data.catalogue_matieres?.origine === 'contrat_cadre' ? `Article issu d'un contrat cadre` : undefined"
          class="inline-flex items-center rounded-md px-2 py-0.5 font-mono text-sm font-semibold ring-1"
          :class="
            item.data.catalogue_matieres?.origine === 'contrat_cadre'
              ? 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:ring-amber-700/40'
              : 'bg-secondary-50 text-secondary-700 ring-secondary-100 dark:bg-secondary-900/20 dark:text-secondary-300 dark:ring-secondary-800/40'
          ">
          {{ item.data.numero_symbole }}
        </span>
      </td>
      <td class="px-4 py-2.5">
        <p class="text-sm font-medium text-slate-700 dark:text-slate-200">{{ item.data.catalogue_matieres?.description || '—' }}</p>
        <p v-if="item.data.catalogue_matieres?.famille" class="mt-0.5 text-sm text-slate-400">{{ item.data.catalogue_matieres.famille }}</p>
      </td>
      <td class="px-4 py-2.5 text-center">
        <span class="rounded bg-slate-100 px-1.5 py-0.5 text-sm font-medium text-slate-500 dark:bg-slate-700 dark:text-slate-400">
          {{ item.data.catalogue_matieres?.unite_distribution || '—' }}
        </span>
      </td>
      <td class="px-4 py-2.5 text-center">
        <input
          v-if="!readonly"
          type="number" min="0" step="any" :value="item.data.quantite"
          class="w-24 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-center text-sm font-medium text-slate-800 outline-none transition focus:border-secondary-400 focus:ring-2 focus:ring-secondary-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          @change="emit('update-quantite-ligne', item.data, $event.target.value)"
        />
        <span v-else class="text-sm font-semibold text-slate-800 dark:text-slate-100">{{ item.data.quantite }}</span>
      </td>
      <td class="whitespace-nowrap px-4 py-2.5 text-right text-sm text-slate-500 dark:text-slate-400">{{ fmtPrix(prixUnitaire(item.data.catalogue_matieres)) }}</td>
      <td class="whitespace-nowrap px-4 py-2.5 text-right">
        <span class="text-sm font-semibold text-slate-800 dark:text-slate-100">
          {{ fmtPrix(prixUnitaire(item.data.catalogue_matieres) * (item.data.quantite || 0)) }}
        </span>
      </td>
      <td v-if="showNotes" class="px-4 py-2.5">
        <input
          v-if="!readonly"
          type="text" :value="item.data.notes" placeholder="Ajouter une note…"
          class="w-full rounded-lg border border-transparent bg-transparent px-2 py-1 text-sm text-slate-600 outline-none transition placeholder:text-slate-300 hover:border-slate-200 hover:bg-white focus:border-secondary-300 focus:bg-white focus:ring-1 focus:ring-secondary-100 dark:text-slate-300 dark:placeholder-slate-600 dark:hover:border-slate-600 dark:hover:bg-slate-800 dark:focus:border-secondary-600 dark:focus:bg-slate-800"
          @change="emit('update-notes-ligne', item.data, $event.target.value)"
        />
        <span v-else class="text-sm text-slate-500 dark:text-slate-400">{{ item.data.notes || '—' }}</span>
      </td>
      <td class="px-2 py-2.5 text-center">
        <button v-if="!readonly" type="button"
          class="rounded-md p-1.5 text-slate-300 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:text-slate-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
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
