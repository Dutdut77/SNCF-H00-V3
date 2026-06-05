<script setup>
/**
 * Nœud récursif d'arbre de logique :
 * - Affiche une question (libellé, type, actions, indicateur départ)
 * - Liste ses réponses ; pour chaque réponse, rend récursivement la question suivante en dessous
 * - Coupe les cycles avec un Set `visited`
 */
const props = defineProps({
  questionId: { type: String, required: true },
  depth:      { type: Number, default: 0 },
  visited:    { type: Set, default: () => new Set() },
})

const ctx = inject('treeCtx')

// Palette par profondeur (cycle de 5 nuances)
const PALETTES = [
  { ring: 'ring-indigo-200',  bg: 'bg-indigo-50/60',  hdrBg: 'bg-indigo-100',   text: 'text-indigo-700',  dot: 'bg-indigo-500' },
  { ring: 'ring-violet-200',  bg: 'bg-violet-50/60',  hdrBg: 'bg-violet-100',   text: 'text-violet-700',  dot: 'bg-violet-500' },
  { ring: 'ring-fuchsia-200', bg: 'bg-fuchsia-50/60', hdrBg: 'bg-fuchsia-100',  text: 'text-fuchsia-700', dot: 'bg-fuchsia-500' },
  { ring: 'ring-amber-200',   bg: 'bg-amber-50/60',   hdrBg: 'bg-amber-100',    text: 'text-amber-700',   dot: 'bg-amber-500' },
  { ring: 'ring-emerald-200', bg: 'bg-emerald-50/60', hdrBg: 'bg-emerald-100',  text: 'text-emerald-700', dot: 'bg-emerald-500' },
  { ring: 'ring-sky-200',     bg: 'bg-sky-50/60',     hdrBg: 'bg-sky-100',      text: 'text-sky-700',     dot: 'bg-sky-500' },
  { ring: 'ring-rose-200',    bg: 'bg-rose-50/60',    hdrBg: 'bg-rose-100',     text: 'text-rose-700',    dot: 'bg-rose-500' },
]
const palette = computed(() => PALETTES[props.depth % PALETTES.length])

const isCycle = computed(() => props.visited.has(props.questionId))
const question = computed(() => ctx.questionsById.value.get(props.questionId) || null)

const childVisited = computed(() => {
  const next = new Set(props.visited)
  next.add(props.questionId)
  return next
})

const isStart = computed(() => ctx.startQuestionId.value === props.questionId)
const isExpanded = computed(() => ctx.expanded.value.has(props.questionId))
const toggleExpand = () => ctx.toggleExpanded(props.questionId)
const isGeneric = computed(() => question.value?.is_generic === true)
const isSelected = computed(() => ctx.selectedQuestionId.value === props.questionId)
const qNumber = computed(() => ctx.numbering.value.get(props.questionId) || '')

// Renvoie la question cible si elle existe
const targetQuestion = (id) => ctx.questionsById.value.get(id) || null

const typeLabel = (t) => ({
  unique: 'Choix unique',
  multiple: 'Choix multiple',
  booleen: 'Oui / Non',
}[t] || t)

const typeIcon = (t) => ({
  unique: 'lucide:circle-dot',
  multiple: 'lucide:check-square',
  booleen: 'lucide:toggle-left',
}[t] || 'lucide:help-circle')

// La question est-elle "feuille" (toutes les réponses → Fin) ?
const hasChildren = computed(() => {
  const q = question.value
  if (!q) return false
  if (q.type === 'multiple') return !!q.next_question_id
  return (q.reponses || []).some((r) => r.next_question_id)
})

// Réponses avec ou sans next pour styling
const labelOfQuestion = (id) => ctx.questionsById.value.get(id)?.libelle || '?'

const targetIdFor = (q, r) => q.type === 'multiple' ? q.next_question_id : r.next_question_id
</script>

<template>
  <div v-if="isCycle" class="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-700/50 dark:bg-red-900/20 dark:text-red-300">
    <Icon name="lucide:alert-triangle" size="11" class="mr-1 inline" />
    Cycle détecté → boucle vers « {{ question?.libelle || '?' }} »
  </div>

  <div
    v-else-if="question"
    class="cursor-pointer overflow-hidden rounded-xl border-2 bg-white shadow-sm transition hover:shadow-md dark:bg-slate-800"
    :class="
      isSelected
        ? 'border-secondary-500 ring-4 ring-secondary-100 dark:border-secondary-500 dark:ring-secondary-900/30'
        : isStart
          ? 'border-yellow-300 dark:border-yellow-700/50'
          : isGeneric
            ? 'border-amber-300 dark:border-amber-700/50'
            : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'
    "
    @click.stop="ctx.onEdit(question)">

    <!-- Header card avec Q-number prominent -->
    <div class="flex items-center gap-2 border-b border-slate-100 px-3 py-2 dark:border-slate-700" :class="palette.hdrBg">
      <!-- Q-number badge -->
      <span
        class="inline-flex flex-none items-center rounded-md px-2 py-0.5 font-mono text-xs font-bold tracking-tight"
        :class="[palette.text, 'bg-white/70 dark:bg-slate-900/40']">
        {{ qNumber }}
      </span>
      <!-- Type -->
      <span class="inline-flex items-center gap-1 rounded text-[10px] font-semibold uppercase tracking-wide" :class="palette.text">
        <Icon :name="typeIcon(question.type)" size="10" />
        {{ typeLabel(question.type) }}
      </span>
      <!-- Badges statut -->
      <span
        v-if="isStart"
        class="inline-flex items-center gap-0.5 rounded bg-yellow-200 px-1 py-0.5 text-[9px] font-bold uppercase tracking-wide text-yellow-800">
        <Icon name="lucide:flag" size="9" />
        Départ
      </span>
      <span
        v-else-if="isGeneric"
        title="Question partagée — modifier impacte tous les parcours qui la référencent"
        class="inline-flex items-center gap-0.5 rounded bg-amber-200 px-1 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-800 dark:bg-amber-700/40 dark:text-amber-300">
        <Icon name="lucide:bookmark" size="9" />
        Générique
      </span>

      <!-- Spacer -->
      <span class="flex-1"></span>

      <!-- Chevron expand -->
      <button
        v-if="hasChildren"
        type="button"
        class="rounded p-1 text-slate-500 transition hover:bg-white/60 dark:hover:bg-slate-700"
        :title="isExpanded ? 'Replier' : 'Déplier'"
        @click.stop="toggleExpand">
        <Icon :name="isExpanded ? 'lucide:chevron-down' : 'lucide:chevron-right'" size="13" />
      </button>
      <!-- Drapeau quick action -->
      <button
        v-if="!isStart"
        type="button"
        title="Définir comme question de départ"
        class="rounded p-1 text-slate-400 transition hover:bg-yellow-100 hover:text-yellow-600 dark:hover:bg-yellow-900/30"
        @click.stop="ctx.onSetStart(question.id)">
        <Icon name="lucide:flag" size="11" />
      </button>
    </div>

    <!-- Corps card -->
    <div class="px-3 py-2.5">
      <h4 class="text-sm font-semibold text-slate-800 dark:text-slate-100">{{ question.libelle }}</h4>
      <p v-if="question.description" class="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{{ question.description }}</p>
    </div>

    <!-- Corps : réponses -->
    <div v-if="isExpanded" class="space-y-2 px-3 py-2">

      <!-- Type unique / booleen : chaque réponse a sa propre branche -->
      <template v-if="question.type !== 'multiple'">
        <div
          v-for="r in question.reponses"
          :key="r.id"
          class="space-y-2">

          <!-- Ligne réponse -->
          <div class="flex items-center gap-2 rounded-md bg-white px-2 py-1.5 text-xs shadow-sm dark:bg-slate-800">
            <!-- Chevron expand/collapse (uniquement si sous-arbre non-générique) -->
            <button
              v-if="r.next_question_id && !targetQuestion(r.next_question_id)?.is_generic"
              type="button"
              class="flex-none rounded p-0.5 text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-700"
              :title="ctx.expandedResponses.value.has(r.id) ? 'Replier la branche' : 'Déplier la branche'"
              @click.stop="ctx.toggleExpandedResponse(r.id)">
              <Icon
                :name="ctx.expandedResponses.value.has(r.id) ? 'lucide:chevron-down' : 'lucide:chevron-right'"
                size="11" />
            </button>
            <Icon v-else name="lucide:corner-down-right" size="11" class="flex-none text-slate-400" />
            <span class="min-w-0 flex-1 truncate font-medium text-slate-700 dark:text-slate-200">{{ r.libelle }}</span>
            <span v-if="(r.articles?.length || 0) > 0" class="inline-flex items-center gap-0.5 text-[10px] text-slate-500" :title="`${r.articles.length} article(s)`">
              <Icon name="lucide:package" size="10" />
              {{ r.articles.length }}
            </span>
            <span v-if="(r.ensembles?.length || 0) > 0" class="inline-flex items-center gap-0.5 text-[10px] text-indigo-500" :title="`${r.ensembles.length} ensemble(s)`">
              <Icon name="lucide:layers" size="10" />
              {{ r.ensembles.length }}
            </span>
            <!-- Si pas de next : badge Fin + bouton "+ Question" -->
            <template v-if="!targetIdFor(question, r)">
              <span class="inline-flex items-center gap-0.5 rounded bg-slate-100 px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                <Icon name="lucide:flag-triangle-right" size="8" />
                Fin
              </span>
              <button
                type="button"
                title="Ajouter une question après cette réponse"
                class="inline-flex items-center gap-0.5 rounded border border-dashed border-secondary-300 bg-secondary-50 px-1.5 py-0.5 text-[10px] font-medium text-secondary-600 transition hover:border-secondary-500 hover:bg-secondary-100 dark:border-secondary-700/50 dark:bg-secondary-900/20 dark:text-secondary-400"
                @click.stop="ctx.onCreateNextFromResponse(r)">
                <Icon name="lucide:plus" size="9" />
                Question
              </button>
            </template>
            <!-- Si replié : indicateur "branche masquée" -->
            <span
              v-else-if="r.next_question_id && !targetQuestion(r.next_question_id)?.is_generic && !ctx.expandedResponses.value.has(r.id)"
              class="inline-flex items-center gap-0.5 rounded bg-secondary-50 px-1 py-0.5 text-[9px] font-medium text-secondary-600 dark:bg-secondary-900/20 dark:text-secondary-400">
              <Icon name="lucide:arrow-right" size="8" />
              {{ targetQuestion(r.next_question_id)?.libelle || '?' }}
            </span>
          </div>

          <!-- Si next pointe vers une générique : chip seulement, pas de recursion -->
          <div
            v-if="r.next_question_id && targetQuestion(r.next_question_id)?.is_generic"
            class="ml-7 flex items-center gap-1.5">
            <Icon name="lucide:corner-down-right" size="11" class="text-slate-300" />
            <button
              type="button"
              :title="`Ouvrir la question générique « ${targetQuestion(r.next_question_id).libelle} »`"
              class="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 transition hover:border-amber-400 hover:bg-amber-100 dark:border-amber-700/40 dark:bg-amber-900/20 dark:text-amber-300"
              @click.stop="ctx.onEdit(targetQuestion(r.next_question_id))">
              <Icon name="lucide:bookmark" size="10" />
              {{ targetQuestion(r.next_question_id).libelle }}
              <Icon name="lucide:external-link" size="9" class="opacity-60" />
            </button>
          </div>

          <!-- Récursion : si next non-générique ET expand, on rend la sous-question indentée -->
          <div
            v-else-if="r.next_question_id && ctx.expandedResponses.value.has(r.id)"
            class="ml-5 border-l-2 border-slate-200 pl-3 dark:border-slate-700">
            <AssistantsTreeNode
              :question-id="r.next_question_id"
              :depth="depth + 1"
              :visited="childVisited" />
          </div>
        </div>

        <p v-if="!question.reponses?.length" class="rounded-md border border-dashed border-slate-300 bg-white px-2 py-1.5 text-center text-[10px] italic text-slate-400 dark:border-slate-600 dark:bg-slate-800">
          Aucune réponse — clique sur ✏️ pour en ajouter
        </p>
      </template>

      <!-- Type multiple : toutes les réponses convergent vers UNE seule question suivante -->
      <template v-else>
        <ul class="space-y-1">
          <li
            v-for="r in question.reponses"
            :key="r.id"
            class="flex items-center gap-2 rounded-md bg-white px-2 py-1.5 text-xs shadow-sm dark:bg-slate-800">
            <Icon name="lucide:square-check" size="11" class="flex-none text-slate-400" />
            <span class="min-w-0 flex-1 truncate font-medium text-slate-700 dark:text-slate-200">{{ r.libelle }}</span>
            <span v-if="(r.articles?.length || 0) > 0" class="inline-flex items-center gap-0.5 text-[10px] text-slate-500">
              <Icon name="lucide:package" size="10" />
              {{ r.articles.length }}
            </span>
            <span v-if="(r.ensembles?.length || 0) > 0" class="inline-flex items-center gap-0.5 text-[10px] text-indigo-500">
              <Icon name="lucide:layers" size="10" />
              {{ r.ensembles.length }}
            </span>
          </li>
        </ul>

        <!-- next question pour multiple : chip si générique, sinon récursion -->
        <div
          v-if="question.next_question_id && targetQuestion(question.next_question_id)?.is_generic"
          class="ml-5 flex items-center gap-1.5">
          <Icon name="lucide:arrow-down" size="11" class="text-secondary-400" />
          <span class="text-[10px] uppercase tracking-wide text-secondary-600 dark:text-secondary-400">Puis</span>
          <button
            type="button"
            :title="`Ouvrir la question générique « ${targetQuestion(question.next_question_id).libelle} »`"
            class="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 transition hover:border-amber-400 hover:bg-amber-100 dark:border-amber-700/40 dark:bg-amber-900/20 dark:text-amber-300"
            @click.stop="ctx.onEdit(targetQuestion(question.next_question_id))">
            <Icon name="lucide:bookmark" size="10" />
            {{ targetQuestion(question.next_question_id).libelle }}
            <Icon name="lucide:external-link" size="9" class="opacity-60" />
          </button>
        </div>
        <div
          v-else-if="question.next_question_id"
          class="ml-5 border-l-2 border-secondary-300 pl-3 dark:border-secondary-700">
          <p class="mb-1 text-[10px] uppercase tracking-wide text-secondary-600 dark:text-secondary-400">
            <Icon name="lucide:arrow-down" size="9" class="inline" />
            Puis
          </p>
          <AssistantsTreeNode
            :question-id="question.next_question_id"
            :depth="depth + 1"
            :visited="childVisited" />
        </div>
        <div v-else class="ml-5 flex items-center gap-2">
          <span class="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-700 dark:text-slate-400">
            <Icon name="lucide:flag-triangle-right" size="9" />
            Fin du wizard
          </span>
          <button
            type="button"
            title="Ajouter une question après ce groupe de réponses"
            class="inline-flex items-center gap-0.5 rounded border border-dashed border-secondary-300 bg-secondary-50 px-1.5 py-0.5 text-[10px] font-medium text-secondary-600 transition hover:border-secondary-500 hover:bg-secondary-100 dark:border-secondary-700/50 dark:bg-secondary-900/20 dark:text-secondary-400"
            @click.stop="ctx.onCreateNextFromQuestion(question.id)">
            <Icon name="lucide:plus" size="9" />
            Question suivante
          </button>
        </div>
      </template>
    </div>

    <!-- Repliée : juste une ligne récap -->
    <div v-else class="px-3 pb-2 text-[11px] italic text-slate-400">
      {{ (question.reponses?.length || 0) }} réponse{{ (question.reponses?.length || 0) > 1 ? 's' : '' }} masquée{{ (question.reponses?.length || 0) > 1 ? 's' : '' }} — clique ▶ pour déplier
    </div>
  </div>
</template>
