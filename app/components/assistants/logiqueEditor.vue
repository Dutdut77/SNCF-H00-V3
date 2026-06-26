<script setup>
const props = defineProps({
  logique: { type: Object, required: true },
})

const emit = defineEmits(['changed'])

const { updateLogique, createQuestion, updateQuestion, updateReponse, duplicateQuestion } = useAssistants()

// ─── Sélection (panneau droit) ───────────────────────────────────────────
const selectedQuestionId = ref(null)
watch(() => props.logique.id, () => { selectedQuestionId.value = null })

// ─── Stats ───────────────────────────────────────────────────────────────
const totalQuestions = computed(() => (props.logique.questions || []).length)
const reachableCount = computed(() => {
  const startId = props.logique.start_question_id
  const byId = new Map((props.logique.questions || []).map((q) => [q.id, q]))
  const set = new Set()
  if (!startId || !byId.has(startId)) return 0
  const queue = [startId]
  while (queue.length > 0) {
    const id = queue.shift()
    if (set.has(id)) continue
    set.add(id)
    const q = byId.get(id)
    if (!q) continue
    if (q.type === 'multiple') {
      if (q.next_question_id) queue.push(q.next_question_id)
    } else {
      for (const r of q.reponses || []) {
        if (r.next_question_id) queue.push(r.next_question_id)
      }
    }
  }
  return set.size
})

// ─── Handlers depuis l'arbre ─────────────────────────────────────────────
const onSelect = (question) => { selectedQuestionId.value = question?.id ?? null }

const onSetStart = async (questionId) => {
  await updateLogique(props.logique.id, { start_question_id: questionId })
  emit('changed')
}

const onDuplicate = async (question) => {
  const created = await duplicateQuestion(props.logique.id, question)
  if (!created) return
  emit('changed')
  selectedQuestionId.value = created.id
}

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
  // Première question créée → la définir comme départ par défaut
  if (created && !props.logique.start_question_id) {
    await updateLogique(props.logique.id, { start_question_id: created.id })
  }
  creatingQuestion.value = false
  if (created) {
    emit('changed')
    selectedQuestionId.value = created.id
  }
}

// Callbacks du panneau
const handlePanelChange = () => emit('changed')
const handlePanelSelect = (id) => { selectedQuestionId.value = id }
const handlePanelDuplicate = (question) => onDuplicate(question)
</script>

<template>
  <div class="flex h-full flex-col overflow-hidden">

    <!-- Header de la logique -->
    <div class="flex flex-none flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-700 dark:bg-slate-900">
      <div class="flex min-w-0 items-center gap-3">
        <Icon :name="logique.icone || 'lucide:workflow'" size="24" class="flex-none text-secondary-500" />
        <div class="min-w-0">
          <h2 class="text-lg font-semibold text-slate-800 dark:text-white">{{ logique.nom }}</h2>
          <p v-if="logique.description" class="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{{ logique.description }}</p>
          <p class="mt-0.5 text-xs text-slate-400">
            {{ reachableCount }}/{{ totalQuestions }} question{{ totalQuestions !== 1 ? 's' : '' }} reliée{{ reachableCount !== 1 ? 's' : '' }} au wizard
          </p>
        </div>
      </div>
      <button
        type="button"
        class="flex items-center gap-1.5 rounded-lg bg-secondary-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-secondary-700"
        @click="openCreateQuestion">
        <Icon name="lucide:plus" size="14" />
        Ajouter une question
      </button>
    </div>

    <!-- Empty -->
    <div v-if="totalQuestions === 0" class="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center text-slate-400">
      <Icon name="lucide:help-circle" size="48" class="opacity-30" />
      <p class="text-base">Aucune question</p>
      <button
        type="button"
        class="mt-1 flex items-center gap-2 rounded-lg border border-secondary-200 bg-secondary-50 px-4 py-2 text-base font-medium text-secondary-600 hover:bg-secondary-100 dark:border-secondary-800 dark:bg-secondary-900/20 dark:text-secondary-400"
        @click="openCreateQuestion">
        <Icon name="lucide:plus" size="18" />
        Créer la première question
      </button>
    </div>

    <!-- ── Layout : arbre vertical + panneau slide-over ───────── -->
    <div v-else class="relative flex min-h-0 flex-1 overflow-hidden">

      <div class="min-w-0 flex-1">
        <AssistantsTreeView
          :logique="logique"
          :selected-question-id="selectedQuestionId"
          @select="onSelect"
          @set-start="onSetStart"
          @duplicate="onDuplicate"
          @create-next-from-response="onCreateNextFromResponse"
          @create-next-from-question="onCreateNextFromQuestion" />
      </div>

      <!-- Panneau droit slidant -->
      <transition
        enter-from-class="translate-x-full"
        enter-active-class="transition-transform duration-300 ease-out"
        leave-active-class="transition-transform duration-200 ease-in"
        leave-to-class="translate-x-full">
        <div
          v-if="selectedQuestionId"
          class="absolute top-0 right-0 bottom-0 z-20 shadow-2xl">
          <button
            type="button"
            class="absolute top-1/2 -left-3.5 z-10 flex h-12 w-7 -translate-y-1/2 items-center justify-center rounded-l-lg border border-r-0 border-slate-200 bg-white text-slate-400 shadow-md transition hover:bg-slate-50 hover:text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
            title="Fermer le panneau"
            @click="selectedQuestionId = null">
            <Icon name="lucide:chevron-right" size="14" />
          </button>
          <AssistantsQuestionPanel
            :question-id="selectedQuestionId"
            :logique="logique"
            @changed="handlePanelChange"
            @select="handlePanelSelect"
            @duplicate="handlePanelDuplicate" />
        </div>
      </transition>
    </div>

  </div>
</template>
