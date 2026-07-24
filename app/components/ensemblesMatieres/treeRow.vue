<script setup>
/**
 * Ligne récursive pour l'affichage d'un sous-ensemble et de sa descendance.
 * S'appelle elle-même sur les sous-ensembles imbriqués → profondeur illimitée.
 *
 * Contexte (handlers + état ouvert) injecté depuis tableBody.vue via provide/inject.
 */
const props = defineProps({
  item:  { type: Object, required: true }, // { id, quantite, sous_ensemble }
  depth: { type: Number, default: 0 },
})

const ctx = inject('ensemblesTreeCtx')

// Tailwind v4 : les classes doivent apparaître littéralement dans le source pour être générées.
const DEPTH_PALETTES = [
  { // 0 — indigo
    row:          'bg-indigo-50/60 dark:bg-indigo-900/10',
    rowBorder:    'border-indigo-200 dark:border-indigo-600',
    chevBtn:      'text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-800/40',
    icon:         'text-indigo-500 dark:text-indigo-400',
    label:        'text-indigo-700 dark:text-indigo-300',
    badge:        'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
    desc:         'text-indigo-400',
    input:        'border-indigo-200 text-indigo-700 focus:border-indigo-400 focus:ring-indigo-100 dark:border-indigo-700/50 dark:text-indigo-300',
    total:        'text-indigo-700 dark:text-indigo-300',
    childRow:     'bg-indigo-50/20 dark:bg-indigo-900/5',
    childBorder:  'border-indigo-50 dark:border-indigo-900/20',
    artBadge:     'bg-indigo-50 text-indigo-600 ring-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-300 dark:ring-indigo-800/40',
  },
  { // 1 — violet
    row:          'bg-violet-50/60 dark:bg-violet-900/10',
    rowBorder:    'border-violet-200 dark:border-violet-700/40',
    chevBtn:      'text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-800/40',
    icon:         'text-violet-500 dark:text-violet-400',
    label:        'text-violet-700 dark:text-violet-300',
    badge:        'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
    desc:         'text-violet-400',
    input:        'border-violet-200 text-violet-700 focus:border-violet-400 focus:ring-violet-100 dark:border-violet-700/50 dark:text-violet-300',
    total:        'text-violet-700 dark:text-violet-300',
    childRow:     'bg-violet-50/20 dark:bg-violet-900/5',
    childBorder:  'border-violet-50 dark:border-violet-900/10',
    artBadge:     'bg-violet-50 text-violet-600 ring-violet-100 dark:bg-violet-900/20 dark:text-violet-300 dark:ring-violet-800/40',
  },
  { // 2 — fuchsia
    row:          'bg-fuchsia-50/60 dark:bg-fuchsia-900/10',
    rowBorder:    'border-fuchsia-200 dark:border-fuchsia-700/40',
    chevBtn:      'text-fuchsia-400 hover:bg-fuchsia-100 dark:hover:bg-fuchsia-800/40',
    icon:         'text-fuchsia-500 dark:text-fuchsia-400',
    label:        'text-fuchsia-700 dark:text-fuchsia-300',
    badge:        'bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-900/30 dark:text-fuchsia-400',
    desc:         'text-fuchsia-400',
    input:        'border-fuchsia-200 text-fuchsia-700 focus:border-fuchsia-400 focus:ring-fuchsia-100 dark:border-fuchsia-700/50 dark:text-fuchsia-300',
    total:        'text-fuchsia-700 dark:text-fuchsia-300',
    childRow:     'bg-fuchsia-50/20 dark:bg-fuchsia-900/5',
    childBorder:  'border-fuchsia-50 dark:border-fuchsia-900/10',
    artBadge:     'bg-fuchsia-50 text-fuchsia-600 ring-fuchsia-100 dark:bg-fuchsia-900/20 dark:text-fuchsia-300 dark:ring-fuchsia-800/40',
  },
  { // 3 — pink
    row:          'bg-pink-50/60 dark:bg-pink-900/10',
    rowBorder:    'border-pink-200 dark:border-pink-700/40',
    chevBtn:      'text-pink-400 hover:bg-pink-100 dark:hover:bg-pink-800/40',
    icon:         'text-pink-500 dark:text-pink-400',
    label:        'text-pink-700 dark:text-pink-300',
    badge:        'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
    desc:         'text-pink-400',
    input:        'border-pink-200 text-pink-700 focus:border-pink-400 focus:ring-pink-100 dark:border-pink-700/50 dark:text-pink-300',
    total:        'text-pink-700 dark:text-pink-300',
    childRow:     'bg-pink-50/20 dark:bg-pink-900/5',
    childBorder:  'border-pink-50 dark:border-pink-900/10',
    artBadge:     'bg-pink-50 text-pink-600 ring-pink-100 dark:bg-pink-900/20 dark:text-pink-300 dark:ring-pink-800/40',
  },
  { // 4 — rose
    row:          'bg-rose-50/60 dark:bg-rose-900/10',
    rowBorder:    'border-rose-200 dark:border-rose-700/40',
    chevBtn:      'text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-800/40',
    icon:         'text-rose-500 dark:text-rose-400',
    label:        'text-rose-700 dark:text-rose-300',
    badge:        'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
    desc:         'text-rose-400',
    input:        'border-rose-200 text-rose-700 focus:border-rose-400 focus:ring-rose-100 dark:border-rose-700/50 dark:text-rose-300',
    total:        'text-rose-700 dark:text-rose-300',
    childRow:     'bg-rose-50/20 dark:bg-rose-900/5',
    childBorder:  'border-rose-50 dark:border-rose-900/10',
    artBadge:     'bg-rose-50 text-rose-600 ring-rose-100 dark:bg-rose-900/20 dark:text-rose-300 dark:ring-rose-800/40',
  },
]

const palette = computed(() => DEPTH_PALETTES[props.depth % DEPTH_PALETTES.length])

// Indentation dynamique : +1rem par niveau pour le header, +1.5rem pour ses enfants.
const headerPad = computed(() => `${0.5 + props.depth * 1}rem`)
const childPad  = computed(() => `${2 + props.depth * 1}rem`)

const isOpen = computed(() => ctx.openIds.value.has(props.item.id))
const toggle = () => ctx.toggleOpen(props.item.id)

const se = computed(() => props.item.sous_ensemble ?? {})
const nbArticles = computed(() => ctx.countArticlesRecursive(se.value))
const totalPrix  = computed(() => ctx.prixTotalRecursive(se.value, ctx.udMap.value) * (props.item.quantite || 1))

// Enfants triés : sous-ensembles d'abord (par nom), puis articles (par symbole)
const childSousEnsembles = computed(() =>
  [...(se.value.ensembles_matieres_sous_ensembles ?? [])].sort((a, b) =>
    (a.sous_ensemble?.nom ?? '').localeCompare(b.sous_ensemble?.nom ?? ''),
  ),
)
const childArticles = computed(() =>
  [...(se.value.ensembles_matieres_lignes ?? [])].sort((a, b) =>
    a.numero_symbole.localeCompare(b.numero_symbole),
  ),
)

const fmtPrix = (v) =>
  v == null
    ? '—'
    : Number(v).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'

const prixUnitaire = (cat) => {
  if (!cat) return 0
  const qpu = ctx.udMap.value?.get?.(cat.unite_distribution)?.quantite_par_unite ?? 1
  return (cat.prix_ud ?? 0) / (qpu > 0 ? qpu : 1)
}

// Quantité à commander = quantité demandée arrondie au conditionnement (UD).
const qteACommander = (cat, qty) => {
  const qpu = ctx.udMap.value?.get?.(cat?.unite_distribution)?.quantite_par_unite
  if (!qpu || qpu <= 1) return qty || 0
  return Math.ceil((qty || 0) / qpu)
}

// Vue Liste (showCommander) : prix par UD + total sur la quantité à commander.
// Sinon (éditeur d'ensembles) : prix ramené à la pièce × quantité.
const prixUnitaireAffiche = (cat) =>
  ctx.showCommander.value ? (cat?.prix_ud ?? 0) : prixUnitaire(cat)
const totalLigneAffiche = (cat, qty) =>
  ctx.showCommander.value
    ? (cat?.prix_ud ?? 0) * qteACommander(cat, qty)
    : prixUnitaire(cat) * (qty || 0)

// colspan pour la cellule "queue" de la rangée header : prix + total + [notes] + delete
const trailingColspan = computed(() => (ctx.showNotes.value ? 4 : 3))
</script>

<template>
  <!-- ── En-tête du sous-ensemble ───────────────────────────────────────────── -->
  <tr :class="['group border-t', palette.rowBorder, palette.row]">
    <td colspan="3" class="py-2.5 pr-4" :style="{ paddingLeft: headerPad }">
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="flex h-5 w-5 flex-none items-center justify-center rounded transition"
          :class="palette.chevBtn"
          @click="toggle"
        >
          <Icon :name="isOpen ? 'lucide:chevron-down' : 'lucide:chevron-right'" size="13" />
        </button>
        <Icon name="lucide:layers" size="14" class="flex-none" :class="palette.icon" />
        <span class="text-sm font-semibold" :class="palette.label">
          {{ se.nom }}
        </span>
        <span class="rounded-full px-2 py-0.5 text-sm font-medium" :class="palette.badge">
          {{ nbArticles }} art.
        </span>
        <p v-if="se.description" class="truncate text-sm" :class="palette.desc">
          {{ se.description }}
        </p>
      </div>
    </td>
    <td class="px-4 py-2.5 text-center">
      <input
        v-if="!ctx.readonly.value"
        type="number" min="1" step="1" :value="item.quantite ?? 1"
        class="w-24 rounded-lg border bg-white px-2 py-1.5 text-center text-sm font-medium outline-none transition focus:ring-2 dark:bg-slate-800"
        :class="palette.input"
        @change="ctx.onUpdateQuantiteSe(item, $event.target.value)"
      />
      <span v-else class="text-sm font-semibold" :class="palette.label">×{{ item.quantite ?? 1 }}</span>
    </td>
    <td v-if="ctx.showCommander.value" class="px-4 py-2.5"></td>
    <td class="px-4 py-2.5"></td>
    <td class="whitespace-nowrap px-4 py-2.5 text-right">
      <span class="text-sm font-semibold" :class="palette.total">{{ fmtPrix(totalPrix) }}</span>
    </td>
    <td v-if="ctx.showNotes.value" class="px-4 py-2.5"></td>
    <td class="px-2 py-2.5 text-center">
      <div v-if="!ctx.readonly.value" class="flex items-center justify-end gap-1">
        <button
          v-if="ctx.onAddTo"
          type="button"
          class="rounded-md p-1.5 text-slate-300 opacity-0 transition hover:bg-secondary-50 hover:text-secondary-500 group-hover:opacity-100 dark:text-slate-600 dark:hover:bg-secondary-900/20 dark:hover:text-secondary-400"
          title="Ajouter un article ou un sous-ensemble à ce niveau"
          @click="ctx.onAddTo(se.id)"
        >
          <Icon name="lucide:plus" size="13" />
        </button>
        <button
          type="button"
          class="rounded-md p-1.5 text-slate-300 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:text-slate-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
          title="Retirer"
          @click="ctx.onDeleteSe(item)"
        >
          <Icon name="lucide:trash-2" size="13" />
        </button>
      </div>
    </td>
  </tr>

  <!-- ── Enfants dépliés : sous-ensembles (récursif) puis articles ──────────── -->
  <template v-if="isOpen">
    <EnsemblesMatieresTreeRow
      v-for="childSe in childSousEnsembles"
      :key="'child-se-' + childSe.id"
      :item="childSe"
      :depth="depth + 1"
    />

    <tr
      v-for="art in childArticles"
      :key="'child-art-' + art.id"
      :class="['group border-t', palette.childBorder, palette.childRow]"
    >
      <td class="py-2 pr-4" :style="{ paddingLeft: childPad }">
        <span
          :title="art.catalogue_matieres?.origine === 'contrat_cadre' ? `Article issu d'un contrat cadre` : undefined"
          class="inline-flex items-center rounded-md px-2 py-0.5 font-mono text-sm font-semibold ring-1"
          :class="
            art.catalogue_matieres?.origine === 'contrat_cadre'
              ? 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:ring-amber-700/40'
              : palette.artBadge
          ">
          {{ art.numero_symbole }}
        </span>
      </td>
      <td class="px-4 py-2">
        <p class="text-sm font-medium text-slate-700 dark:text-slate-200">{{ art.catalogue_matieres?.description || '—' }}</p>
        <p v-if="art.catalogue_matieres?.famille" class="mt-0.5 text-sm text-slate-400">{{ art.catalogue_matieres.famille }}</p>
      </td>
      <td class="px-4 py-2 text-center">
        <span class="rounded bg-slate-100 px-1.5 py-0.5 text-sm font-medium text-slate-500 dark:bg-slate-700 dark:text-slate-400">
          {{ art.catalogue_matieres?.unite_distribution || '—' }}
        </span>
      </td>
      <td class="px-4 py-2 text-center">
        <input
          v-if="!ctx.readonly.value"
          type="number" min="0" step="any" :value="art.quantite"
          class="w-24 rounded-lg border border-slate-200 bg-white px-2 py-1 text-center text-sm font-medium text-slate-800 outline-none transition focus:border-secondary-400 focus:ring-2 focus:ring-secondary-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          @change="ctx.onUpdateQuantiteLigne(art, $event.target.value)"
        />
        <span v-else class="text-sm font-semibold text-slate-800 dark:text-slate-100">{{ art.quantite }}</span>
      </td>
      <td v-if="ctx.showCommander.value" class="px-4 py-2 text-center text-sm font-semibold tabular-nums text-secondary-700 dark:text-secondary-300">
        {{ qteACommander(art.catalogue_matieres, art.quantite) }}
      </td>
      <td class="whitespace-nowrap px-4 py-2 text-right text-sm text-slate-500 dark:text-slate-400">{{ fmtPrix(prixUnitaireAffiche(art.catalogue_matieres)) }}</td>
      <td class="whitespace-nowrap px-4 py-2 text-right text-sm font-medium text-slate-700 dark:text-slate-300">
        {{ fmtPrix(totalLigneAffiche(art.catalogue_matieres, art.quantite)) }}
      </td>
      <td v-if="ctx.showNotes.value" class="px-4 py-2">
        <input
          v-if="!ctx.readonly.value"
          type="text" :value="art.notes" placeholder="Ajouter une note…"
          class="w-full rounded-lg border border-transparent bg-transparent px-2 py-1 text-sm text-slate-600 outline-none transition placeholder:text-slate-300 hover:border-slate-200 hover:bg-white focus:border-secondary-300 focus:bg-white focus:ring-1 focus:ring-secondary-100 dark:text-slate-300 dark:placeholder-slate-600 dark:hover:border-slate-600 dark:hover:bg-slate-800 dark:focus:border-secondary-600 dark:focus:bg-slate-800"
          @change="ctx.onUpdateNotesLigne(art, $event.target.value)"
        />
        <span v-else class="text-sm text-slate-500 dark:text-slate-400">{{ art.notes || '—' }}</span>
      </td>
      <td class="px-2 py-2 text-center">
        <button
          v-if="!ctx.readonly.value"
          type="button"
          class="rounded-md p-1.5 text-slate-300 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:text-slate-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
          title="Retirer l'article"
          @click="ctx.onDeleteLigne(art)"
        >
          <Icon name="lucide:trash-2" size="13" />
        </button>
      </td>
    </tr>
  </template>
</template>
