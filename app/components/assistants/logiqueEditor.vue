<script setup>
const props = defineProps({
  logique: { type: Object, required: true },
})

const emit = defineEmits(['changed'])

const { deleteQuestion, updateLogique, createQuestion, updateQuestion, updateReponse } = useAssistants()

// ─── Sélection (panneau droit) ───────────────────────────────────────────
const selectedQuestionId = ref(null)

// Quand la logique change (rechargée), conserver la sélection si possible
watch(
  () => props.logique.id,
  () => { selectedQuestionId.value = null },
)

// ─── Map des questions par id (pour resolution rapide) ───────────────────
const questionsById = computed(() => {
  const m = new Map()
  for (const q of props.logique.questions || []) m.set(q.id, q)
  return m
})

// ─── Calcul des questions accessibles depuis start (BFS) ─────────────────
// La BFS s'arrête sur les questions génériques : elles sont rattachées au flux
// mais affichées dans leur section dédiée (pas inlined dans le tree principal).
const reachableIds = computed(() => {
  const startId = props.logique.start_question_id
  const set = new Set()
  if (!startId || !questionsById.value.has(startId)) return set
  const queue = [startId]
  while (queue.length > 0) {
    const id = queue.shift()
    if (set.has(id)) continue
    set.add(id)
    const q = questionsById.value.get(id)
    if (!q) continue
    // Si la question est générique, on ne descend pas dans son sous-arbre depuis ce contexte
    if (q.is_generic && id !== startId) continue
    if (q.type === 'multiple') {
      if (q.next_question_id) queue.push(q.next_question_id)
    } else {
      for (const r of q.reponses || []) {
        if (r.next_question_id) queue.push(r.next_question_id)
      }
    }
  }
  return set
})

const genericQuestions = computed(() =>
  (props.logique.questions || [])
    .filter((q) => q.is_generic)
    .sort((a, b) => (a.libelle || '').localeCompare(b.libelle || ''))
)

const unusedQuestions = computed(() => {
  return (props.logique.questions || [])
    .filter((q) => !q.is_generic && !reachableIds.value.has(q.id))
    .sort((a, b) => a.ordre - b.ordre)
})

// ─── Numérotation hiérarchique Q1, Q1.1, Q1.1.2… ─────────────────────────
const numbering = computed(() => {
  const map = new Map()
  const questions = props.logique.questions || []
  const byId = new Map(questions.map((q) => [q.id, q]))
  const startId = props.logique.start_question_id

  const assign = (id, prefix, visited = new Set()) => {
    if (!id || map.has(id) || visited.has(id) || !byId.has(id)) return
    const v = new Set(visited); v.add(id)
    map.set(id, prefix)
    const q = byId.get(id)
    // Pour les génériques, on numérote la racine mais on ne descend pas
    // depuis ce contexte (les sous-questions seront numérotées comme racines)
    if (q.is_generic && id !== startId) return
    if (q.type === 'multiple') {
      if (q.next_question_id) assign(q.next_question_id, `${prefix}.1`, v)
    } else {
      (q.reponses || []).forEach((r, i) => {
        if (r.next_question_id) assign(r.next_question_id, `${prefix}.${i + 1}`, v)
      })
    }
  }

  if (startId) assign(startId, 'Q1')

  // Racines secondaires : génériques d'abord, puis orphelines
  let nextRoot = startId ? 2 : 1
  for (const q of questions) {
    if (map.has(q.id) || !q.is_generic) continue
    assign(q.id, `Q${nextRoot}`)
    nextRoot++
  }
  for (const q of questions) {
    if (map.has(q.id)) continue
    assign(q.id, `Q${nextRoot}`)
    nextRoot++
  }

  return map
})

// ─── Etat expand/collapse questions ──────────────────────────────────────
// Par défaut tout déplié, mais on préserve les collapses manuels lors des reloads
const expanded = ref(new Set())
watch(
  () => props.logique.questions?.map((q) => q.id).join(',') ?? '',
  () => {
    const next = new Set(expanded.value)
    for (const q of props.logique.questions || []) next.add(q.id)
    expanded.value = next
  },
  { immediate: true }
)
const toggleExpanded = (id) => {
  const s = new Set(expanded.value)
  s.has(id) ? s.delete(id) : s.add(id)
  expanded.value = s
}

// ─── Etat expand/collapse réponses ───────────────────────────────────────
const expandedResponses = ref(new Set())
watch(
  () => (props.logique.questions || []).flatMap((q) => (q.reponses || []).map((r) => r.id)).join(','),
  () => {
    const next = new Set(expandedResponses.value)
    for (const q of props.logique.questions || []) {
      for (const r of q.reponses || []) next.add(r.id)
    }
    expandedResponses.value = next
  },
  { immediate: true }
)
const toggleExpandedResponse = (id) => {
  const s = new Set(expandedResponses.value)
  s.has(id) ? s.delete(id) : s.add(id)
  expandedResponses.value = s
}

const expandAll = () => {
  const qSet = new Set()
  const rSet = new Set()
  for (const q of props.logique.questions || []) {
    qSet.add(q.id)
    for (const r of q.reponses || []) rSet.add(r.id)
  }
  expanded.value = qSet
  expandedResponses.value = rSet
}
const collapseAll = () => {
  expanded.value = new Set()
  expandedResponses.value = new Set()
}

// ─── Handlers depuis le tree ─────────────────────────────────────────────
// Clic sur une question → la sélectionne pour le panneau droit (pas de modale)
const onEdit = (question) => {
  selectedQuestionId.value = question?.id ?? null
}
const onDelete = (question) => {
  // La suppression se fait via le panneau, mais on garde un fallback pour le drapeau
  selectedQuestionId.value = question?.id ?? null
}
const onSetStart = async (questionId) => {
  await updateLogique(props.logique.id, { start_question_id: questionId })
  emit('changed')
}

// ─── Provide pour le tree récursif ──────────────────────────────────────
// ─── Création rapide d'une question suivante (depuis une réponse) ────────
const onCreateNextFromResponse = async (reponse) => {
  if (!reponse) return
  const created = await createQuestion(props.logique.id, {
    libelle: 'Nouvelle question',
    type: 'unique',
    description: '',
    ordre: (props.logique.questions || []).length,
  })
  if (!created) return
  await updateReponse(reponse.id, { next_question_id: created.id })
  emit('changed')
  selectedQuestionId.value = created.id
}

const onCreateNextFromQuestion = async (questionId) => {
  const created = await createQuestion(props.logique.id, {
    libelle: 'Nouvelle question',
    type: 'unique',
    description: '',
    ordre: (props.logique.questions || []).length,
  })
  if (!created) return
  await updateQuestion(questionId, { next_question_id: created.id })
  emit('changed')
  selectedQuestionId.value = created.id
}

provide('treeCtx', {
  questionsById,
  startQuestionId: computed(() => props.logique.start_question_id),
  reachableIds,
  numbering,
  expanded,
  toggleExpanded,
  expandedResponses,
  toggleExpandedResponse,
  selectedQuestionId,
  onEdit,
  onDelete,
  onSetStart,
  onCreateNextFromResponse,
  onCreateNextFromQuestion,
})

// ─── Nouvelle question (création immédiate + sélection) ──────────────────
const creatingQuestion = ref(false)
const openCreateQuestion = async () => {
  if (creatingQuestion.value) return
  creatingQuestion.value = true
  const created = await createQuestion(props.logique.id, {
    libelle: 'Nouvelle question',
    type: 'unique',
    description: '',
    ordre: (props.logique.questions || []).length,
  })
  creatingQuestion.value = false
  if (created) {
    emit('changed')
    // Sélectionne la nouvelle question dans le panneau
    selectedQuestionId.value = created.id
  }
}

// Callback du panneau quand le contenu change (autosave)
const handlePanelChange = () => emit('changed')
// Callback du panneau pour désélectionner (après suppression de la question)
const handlePanelSelect = (id) => { selectedQuestionId.value = id }

// ─── Stats globales ──────────────────────────────────────────────────────
const totalQuestions = computed(() => (props.logique.questions || []).length)
const totalReachable = computed(() => reachableIds.value.size)
</script>

<template>
  <div class="flex h-full flex-col overflow-hidden">

    <!-- Header de la logique -->
    <div class="flex flex-none flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-900">
      <div class="flex min-w-0 items-center gap-3">
        <Icon :name="logique.icone || 'lucide:workflow'" size="24" class="flex-none text-blue-500" />
        <div class="min-w-0">
          <h2 class="text-lg font-semibold text-gray-800 dark:text-white">{{ logique.nom }}</h2>
          <p v-if="logique.description" class="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{{ logique.description }}</p>
          <p class="mt-0.5 text-xs text-gray-400">
            {{ totalReachable }}/{{ totalQuestions }} question{{ totalQuestions !== 1 ? 's' : '' }} reliée{{ totalReachable !== 1 ? 's' : '' }} à l'arbre
          </p>
        </div>
      </div>
      <div class="flex items-center gap-1.5">
        <button
          type="button"
          class="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 transition hover:border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
          title="Tout déplier"
          @click="expandAll">
          <Icon name="lucide:chevrons-down" size="13" />
          Déplier
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 transition hover:border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
          title="Tout replier"
          @click="collapseAll">
          <Icon name="lucide:chevrons-up" size="13" />
          Replier
        </button>
        <button
          type="button"
          class="ml-1 flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-blue-700"
          @click="openCreateQuestion">
          <Icon name="lucide:plus" size="14" />
          Ajouter une question
        </button>
      </div>
    </div>

    <!-- Empty -->
    <div v-if="(logique.questions || []).length === 0" class="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center text-gray-400">
      <Icon name="lucide:help-circle" size="48" class="opacity-30" />
      <p class="text-base">Aucune question</p>
      <button
        type="button"
        class="mt-1 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-base font-medium text-blue-600 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
        @click="openCreateQuestion">
        <Icon name="lucide:plus" size="18" />
        Créer la première question
      </button>
    </div>

    <!-- Warning si pas de start_question_id -->
    <div v-else-if="!logique.start_question_id" class="m-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-700/40 dark:bg-amber-900/20">
      <Icon name="lucide:alert-circle" size="18" class="mt-0.5 flex-none text-amber-600" />
      <div class="min-w-0 text-sm">
        <p class="font-medium text-amber-700 dark:text-amber-300">Aucune question de départ définie</p>
        <p class="mt-1 text-amber-600/80 dark:text-amber-400/80">Clique sur le drapeau d'une question dans la liste « Non rattachées » ci-dessous pour la définir comme point d'entrée.</p>
      </div>
    </div>

    <!-- ── Layout : canvas plein écran + panneau slide-over ───────── -->
    <div v-if="(logique.questions || []).length > 0" class="relative flex min-h-0 flex-1 overflow-hidden">

      <!-- Canvas visuel (plein écran) -->
      <div class="min-w-0 flex-1">
        <AssistantsCanvas
          :logique="logique"
          :selected-question-id="selectedQuestionId"
          @select="onEdit"
          @set-start="onSetStart" />
      </div>

      <!-- Panneau droit slidant (sans backdrop : canvas reste interactif) -->
      <transition
        enter-from-class="translate-x-full"
        enter-active-class="transition-transform duration-300 ease-out"
        leave-active-class="transition-transform duration-200 ease-in"
        leave-to-class="translate-x-full">
        <div
          v-if="selectedQuestionId"
          class="absolute top-0 right-0 bottom-0 z-20 shadow-2xl">
          <!-- Onglet de fermeture sur le bord gauche -->
          <button
            type="button"
            class="absolute top-1/2 -left-3.5 z-10 flex h-12 w-7 -translate-y-1/2 items-center justify-center rounded-l-lg border border-r-0 border-gray-200 bg-white text-gray-400 shadow-md transition hover:bg-gray-50 hover:text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
            title="Fermer le panneau"
            @click="selectedQuestionId = null">
            <Icon name="lucide:chevron-right" size="14" />
          </button>
          <AssistantsQuestionPanel
            :question-id="selectedQuestionId"
            :logique="logique"
            @changed="handlePanelChange"
            @select="handlePanelSelect" />
        </div>
      </transition>
    </div>

  </div>
</template>
