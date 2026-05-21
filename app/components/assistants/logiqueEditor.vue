<script setup>
const props = defineProps({
  logique: { type: Object, required: true },
})

const emit = defineEmits(['changed'])

const { deleteQuestion, updateLogique } = useAssistants()

// ─── Modales ─────────────────────────────────────────────────────────────
const showQuestionEditor = ref(false)
const editingQuestion = ref(null)
const showDeleteQuestion = ref(false)
const questionToDelete = ref(null)

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
const onEdit = (question) => {
  editingQuestion.value = question
  showQuestionEditor.value = true
}
const onDelete = (question) => {
  questionToDelete.value = question
  showDeleteQuestion.value = true
}
const onSetStart = async (questionId) => {
  await updateLogique(props.logique.id, { start_question_id: questionId })
  emit('changed')
}

// ─── Provide pour le tree récursif ──────────────────────────────────────
provide('treeCtx', {
  questionsById,
  startQuestionId: computed(() => props.logique.start_question_id),
  reachableIds,
  expanded,
  toggleExpanded,
  expandedResponses,
  toggleExpandedResponse,
  onEdit,
  onDelete,
  onSetStart,
})

// ─── Nouvelle question ───────────────────────────────────────────────────
const openCreateQuestion = () => {
  editingQuestion.value = null
  showQuestionEditor.value = true
}

const handleQuestionSaved = async () => {
  showQuestionEditor.value = false
  editingQuestion.value = null
  emit('changed')
}

const confirmDeleteQuestion = async () => {
  if (!questionToDelete.value) return
  const ok = await deleteQuestion(questionToDelete.value.id)
  if (ok) {
    if (props.logique.start_question_id === questionToDelete.value.id) {
      await updateLogique(props.logique.id, { start_question_id: null })
    }
    emit('changed')
  }
  showDeleteQuestion.value = false
  questionToDelete.value = null
}

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

    <!-- ── Arbre ─────────────────────────────────────────────────────── -->
    <div v-if="(logique.questions || []).length > 0" class="flex-1 overflow-auto px-6 py-5">
      <div class="min-w-min space-y-5">

        <!-- Arbre principal depuis la racine -->
        <section v-if="logique.start_question_id">
          <h3 class="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            <Icon name="lucide:flag" size="12" class="text-yellow-500" />
            Arbre principal
          </h3>
          <AssistantsTreeNode
            :question-id="logique.start_question_id"
            :depth="0" />
        </section>

        <!-- Questions génériques (partagées) -->
        <section v-if="genericQuestions.length > 0">
          <h3 class="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
            <Icon name="lucide:bookmark" size="12" />
            Questions génériques ({{ genericQuestions.length }})
          </h3>
          <p class="mb-2 text-xs text-gray-500 dark:text-gray-400">
            Affichées une seule fois — référencées depuis l'arbre par une puce. Modifier leurs articles impacte tous les parcours qui les utilisent.
          </p>
          <div class="space-y-3">
            <AssistantsTreeNode
              v-for="q in genericQuestions"
              :key="q.id"
              :question-id="q.id"
              :depth="0" />
          </div>
        </section>

        <!-- Questions non utilisées -->
        <section v-if="unusedQuestions.length > 0">
          <h3 class="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            <Icon name="lucide:circle-slash" size="12" />
            Questions non utilisées ({{ unusedQuestions.length }})
          </h3>
          <p class="mb-2 text-xs text-gray-500 dark:text-gray-400">
            Ces questions n'apparaissent ni dans l'arbre ni dans les génériques. Rattache-les via une réponse ou marque-les comme génériques.
          </p>
          <div class="space-y-3">
            <AssistantsTreeNode
              v-for="q in unusedQuestions"
              :key="q.id"
              :question-id="q.id"
              :depth="0" />
          </div>
        </section>

      </div>
    </div>

    <!-- ── Modales ──────────────────────────────────────────────────── -->
    <AssistantsQuestionEditor
      v-if="showQuestionEditor"
      :logique="logique"
      :question="editingQuestion"
      @close="showQuestionEditor = false"
      @saved="handleQuestionSaved" />

    <AppModal v-model="showDeleteQuestion" size="sm">
      <template #header>
        <h3 class="text-base font-semibold text-gray-800 dark:text-white">Supprimer la question</h3>
      </template>
      <p class="text-sm text-gray-600 dark:text-gray-300">
        Supprimer la question <strong>« {{ questionToDelete?.libelle }} »</strong> et toutes ses réponses ?
        Les autres questions pointant vers celle-ci verront leur lien réinitialisé.
      </p>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button
            type="button"
            class="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            @click="showDeleteQuestion = false">
            Annuler
          </button>
          <button
            type="button"
            class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            @click="confirmDeleteQuestion">
            Supprimer
          </button>
        </div>
      </template>
    </AppModal>
  </div>
</template>
