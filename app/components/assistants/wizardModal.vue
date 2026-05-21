<script setup>
const props = defineProps({
  open:       { type: Boolean, required: true },
  logique:    { type: Object, required: true },   // logique hydratée (questions + reponses + articles + ensembles)
  commandeId: { type: String, required: true },
})

const emit = defineEmits(['close', 'imported'])

const { addLigne } = useCommandesMatieres()
const { addEnsembleToCommande } = useEnsemblesMatieres()
const { addToast } = useToast()

// Index question par id
const questionById = computed(() => {
  const m = new Map()
  for (const q of props.logique.questions || []) m.set(q.id, q)
  return m
})

// ─── État ──────────────────────────────────────────────────────────────────
const currentQuestionId = ref(null)
const visited = ref(new Set())   // anti-cycle runtime
const history = ref([])          // pour bouton retour : [{ questionId, articlesSnapshot, ensemblesSnapshot }]
const selectedSingle = ref(null) // pour unique / booleen
const selectedMultiple = ref(new Set()) // pour multiple

// Accumulateurs (Map<key, {quantite, item}>)
const articlesAccu = ref(new Map())
const ensemblesAccu = ref(new Map())

// Phases : 'wizard' (en cours) | 'recap' (écran final avant insert) | 'inserting'
const phase = ref('wizard')

const currentQuestion = computed(() => questionById.value.get(currentQuestionId.value) || null)

const reset = () => {
  currentQuestionId.value = props.logique.start_question_id ?? null
  visited.value = new Set()
  history.value = []
  articlesAccu.value = new Map()
  ensemblesAccu.value = new Map()
  selectedSingle.value = null
  selectedMultiple.value = new Set()
  phase.value = 'wizard'
}

watch(() => props.open, (v) => {
  if (v) reset()
}, { immediate: true })

// ─── Helpers accumulateurs ─────────────────────────────────────────────────
const addArticleToAccu = (article) => {
  const key = article.numero_symbole
  const prev = articlesAccu.value.get(key)
  const next = {
    quantite: (prev?.quantite ?? 0) + (article.quantite || 0),
    catalogue_matieres: article.catalogue_matieres ?? prev?.catalogue_matieres,
  }
  articlesAccu.value.set(key, next)
}

const addEnsembleToAccu = (ens) => {
  const key = ens.ensemble_id
  const prev = ensemblesAccu.value.get(key)
  const next = {
    quantite: (prev?.quantite ?? 0) + (ens.quantite || 0),
    ensembles_matieres: ens.ensembles_matieres ?? prev?.ensembles_matieres,
  }
  ensemblesAccu.value.set(key, next)
}

// ─── Navigation ────────────────────────────────────────────────────────────
const canGoNext = computed(() => {
  const q = currentQuestion.value
  if (!q) return false
  if (q.type === 'multiple') return true  // permet de ne rien cocher → juste avancer
  if (q.type === 'unique' || q.type === 'booleen') return selectedSingle.value !== null
  return false
})

const applyAnswers = () => {
  const q = currentQuestion.value
  if (!q) return null
  const reponses = q.reponses || []

  // Quelles réponses ont été choisies ?
  let chosen = []
  if (q.type === 'multiple') {
    chosen = reponses.filter((r) => selectedMultiple.value.has(r.id))
  } else {
    const sel = reponses.find((r) => r.id === selectedSingle.value)
    if (sel) chosen = [sel]
  }

  // Appliquer leurs actions
  for (const r of chosen) {
    for (const a of r.articles || []) addArticleToAccu(a)
    for (const e of r.ensembles || []) addEnsembleToAccu(e)
  }

  // Résoudre la prochaine question
  if (q.type === 'multiple') return q.next_question_id ?? null
  if (chosen.length > 0) return chosen[0].next_question_id ?? null
  return null
}

const goNext = () => {
  if (!canGoNext.value) return
  const q = currentQuestion.value
  if (!q) return

  // Snapshot pour pouvoir revenir
  history.value.push({
    questionId: currentQuestionId.value,
    articlesSnapshot: new Map(articlesAccu.value),
    ensemblesSnapshot: new Map(ensemblesAccu.value),
    selectedSingle: selectedSingle.value,
    selectedMultiple: new Set(selectedMultiple.value),
  })

  const nextId = applyAnswers()

  if (nextId && visited.value.has(nextId)) {
    addToast({ title: 'Cycle détecté', message: 'Logique mal configurée — fin du wizard', type: 'Warning' })
    phase.value = 'recap'
    return
  }
  if (!nextId) {
    phase.value = 'recap'
    return
  }
  visited.value.add(currentQuestionId.value)
  currentQuestionId.value = nextId
  selectedSingle.value = null
  selectedMultiple.value = new Set()
}

const goBack = () => {
  if (history.value.length === 0) return
  const prev = history.value.pop()
  currentQuestionId.value = prev.questionId
  articlesAccu.value = new Map(prev.articlesSnapshot)
  ensemblesAccu.value = new Map(prev.ensemblesSnapshot)
  selectedSingle.value = prev.selectedSingle
  selectedMultiple.value = new Set(prev.selectedMultiple)
  visited.value.delete(prev.questionId)
  phase.value = 'wizard'
}

const toggleMultiple = (id) => {
  const next = new Set(selectedMultiple.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  selectedMultiple.value = next
}

// ─── Insertion finale ──────────────────────────────────────────────────────
const inserting = ref(false)

const confirmAndInsert = async () => {
  if (inserting.value) return
  inserting.value = true
  phase.value = 'inserting'

  const insertedLignes = []
  const insertedEnsembles = []

  for (const [symbole, { quantite }] of articlesAccu.value.entries()) {
    if (quantite <= 0) continue
    const ligne = await addLigne(props.commandeId, symbole, quantite)
    if (ligne) insertedLignes.push(ligne)
  }

  for (const [ensembleId, { quantite }] of ensemblesAccu.value.entries()) {
    if (quantite <= 0) continue
    const item = await addEnsembleToCommande(props.commandeId, ensembleId)
    if (item) insertedEnsembles.push(item)
  }

  inserting.value = false
  addToast({
    title: 'Assistant terminé',
    message: `${insertedLignes.length} article(s) + ${insertedEnsembles.length} ensemble(s) ajouté(s)`,
    type: 'Success',
  })
  emit('imported', { lignes: insertedLignes, ensembles: insertedEnsembles })
}

// ─── UI helpers ─────────────────────────────────────────────────────────────
const articlesAccuList = computed(() => {
  return [...articlesAccu.value.entries()]
    .map(([symbole, { quantite, catalogue_matieres }]) => ({
      numero_symbole: symbole,
      quantite,
      catalogue_matieres,
    }))
    .sort((a, b) => a.numero_symbole.localeCompare(b.numero_symbole))
})

const ensemblesAccuList = computed(() => {
  return [...ensemblesAccu.value.entries()]
    .map(([id, { quantite, ensembles_matieres }]) => ({
      ensemble_id: id,
      quantite,
      ensembles_matieres,
    }))
    .sort((a, b) => (a.ensembles_matieres?.nom ?? '').localeCompare(b.ensembles_matieres?.nom ?? ''))
})

const stepIndex = computed(() => history.value.length + 1)

const onClose = () => emit('close')
</script>

<template>
  <AppModal :model-value="open" size="3xl" :persistent="inserting" @update:model-value="onClose">
    <template #header>
      <div class="flex items-center gap-2">
        <Icon :name="logique.icone || 'lucide:workflow'" size="18" class="text-blue-500" />
        <h3 class="text-base font-semibold text-gray-800 dark:text-white">
          {{ logique.nom }}
        </h3>
        <span
          v-if="phase === 'wizard' && currentQuestion"
          class="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
          Étape {{ stepIndex }}
        </span>
      </div>
    </template>

    <!-- ── Pas de start_question_id ─────────────────────────────────── -->
    <div v-if="!logique.start_question_id" class="py-8 text-center">
      <Icon name="lucide:alert-circle" size="40" class="mx-auto text-amber-500 opacity-70" />
      <p class="mt-3 text-sm text-gray-600 dark:text-gray-300">
        Cette logique n'a pas de question de départ configurée. Va dans Paramètres → Logiques métier pour en définir une.
      </p>
    </div>

    <!-- ── Wizard en cours ──────────────────────────────────────────── -->
    <div v-else-if="phase === 'wizard' && currentQuestion" class="space-y-5">
      <div>
        <h4 class="text-xl font-semibold text-gray-800 dark:text-gray-100">{{ currentQuestion.libelle }}</h4>
        <p v-if="currentQuestion.description" class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ currentQuestion.description }}</p>
      </div>

      <!-- Empty -->
      <p v-if="(currentQuestion.reponses || []).length === 0" class="rounded-lg border border-dashed border-amber-200 bg-amber-50 px-4 py-6 text-center text-sm text-amber-700 dark:border-amber-700/40 dark:bg-amber-900/20 dark:text-amber-300">
        Cette question n'a aucune réponse configurée — clique sur Suivant pour terminer.
      </p>

      <!-- Type unique / booleen -->
      <div v-else-if="currentQuestion.type !== 'multiple'" class="space-y-2">
        <label
          v-for="reponse in currentQuestion.reponses"
          :key="reponse.id"
          class="flex cursor-pointer items-start gap-3 rounded-xl border-2 px-4 py-3 transition"
          :class="
            selectedSingle === reponse.id
              ? 'border-blue-400 bg-blue-50 dark:border-blue-500 dark:bg-blue-900/20'
              : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600'
          ">
          <input
            v-model="selectedSingle"
            type="radio"
            :value="reponse.id"
            class="mt-1 h-4 w-4 accent-blue-600" />
          <div class="min-w-0 flex-1">
            <p class="text-base font-medium text-gray-800 dark:text-gray-100">{{ reponse.libelle }}</p>
            <div v-if="(reponse.articles?.length || reponse.ensembles?.length)" class="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span v-if="reponse.articles?.length" class="inline-flex items-center gap-1">
                <Icon name="lucide:package" size="11" />
                +{{ reponse.articles.length }} article{{ reponse.articles.length > 1 ? 's' : '' }}
              </span>
              <span v-if="reponse.ensembles?.length" class="inline-flex items-center gap-1">
                <Icon name="lucide:layers" size="11" />
                +{{ reponse.ensembles.length }} ensemble{{ reponse.ensembles.length > 1 ? 's' : '' }}
              </span>
            </div>
          </div>
        </label>
      </div>

      <!-- Type multiple -->
      <div v-else class="space-y-2">
        <label
          v-for="reponse in currentQuestion.reponses"
          :key="reponse.id"
          class="flex cursor-pointer items-start gap-3 rounded-xl border-2 px-4 py-3 transition"
          :class="
            selectedMultiple.has(reponse.id)
              ? 'border-blue-400 bg-blue-50 dark:border-blue-500 dark:bg-blue-900/20'
              : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600'
          ">
          <input
            type="checkbox"
            class="mt-1 h-4 w-4 accent-blue-600"
            :checked="selectedMultiple.has(reponse.id)"
            @change="toggleMultiple(reponse.id)" />
          <div class="min-w-0 flex-1">
            <p class="text-base font-medium text-gray-800 dark:text-gray-100">{{ reponse.libelle }}</p>
            <div v-if="(reponse.articles?.length || reponse.ensembles?.length)" class="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span v-if="reponse.articles?.length" class="inline-flex items-center gap-1">
                <Icon name="lucide:package" size="11" />
                +{{ reponse.articles.length }} article{{ reponse.articles.length > 1 ? 's' : '' }}
              </span>
              <span v-if="reponse.ensembles?.length" class="inline-flex items-center gap-1">
                <Icon name="lucide:layers" size="11" />
                +{{ reponse.ensembles.length }} ensemble{{ reponse.ensembles.length > 1 ? 's' : '' }}
              </span>
            </div>
          </div>
        </label>
      </div>
    </div>

    <!-- ── Écran récap final ────────────────────────────────────────── -->
    <div v-else-if="phase === 'recap' || phase === 'inserting'" class="space-y-5">
      <div class="text-center">
        <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <Icon name="lucide:check-circle-2" size="24" class="text-green-600 dark:text-green-400" />
        </div>
        <h4 class="mt-3 text-lg font-semibold text-gray-800 dark:text-gray-100">Récapitulatif</h4>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Voici ce qui va être ajouté à ta liste de matières.
        </p>
      </div>

      <div v-if="articlesAccuList.length === 0 && ensemblesAccuList.length === 0" class="rounded-lg border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-400 dark:border-gray-700">
        Rien à ajouter — aucune action déclenchée par les réponses
      </div>

      <div v-else class="space-y-4">
        <!-- Articles -->
        <div v-if="articlesAccuList.length > 0">
          <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            <Icon name="lucide:package" size="11" class="mr-1 inline" />
            Articles ({{ articlesAccuList.length }})
          </p>
          <div class="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th class="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Symbole</th>
                  <th class="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Désignation</th>
                  <th class="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Qté</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-gray-700/50">
                <tr v-for="a in articlesAccuList" :key="a.numero_symbole" class="bg-white dark:bg-gray-900">
                  <td class="px-3 py-2">
                    <span class="inline-flex items-center rounded-md px-1.5 py-0.5 font-mono text-xs font-semibold ring-1"
                      :class="
                        a.catalogue_matieres?.origine === 'contrat_cadre'
                          ? 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:ring-amber-700/40'
                          : 'bg-blue-50 text-blue-700 ring-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:ring-blue-800/40'
                      ">
                      {{ a.numero_symbole }}
                    </span>
                  </td>
                  <td class="px-3 py-2 text-xs text-gray-600 dark:text-gray-300">{{ a.catalogue_matieres?.description || '—' }}</td>
                  <td class="px-3 py-2 text-right text-sm font-semibold text-gray-800 dark:text-gray-100">{{ a.quantite }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Ensembles -->
        <div v-if="ensemblesAccuList.length > 0">
          <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            <Icon name="lucide:layers" size="11" class="mr-1 inline" />
            Ensembles ({{ ensemblesAccuList.length }})
          </p>
          <div class="space-y-1">
            <div
              v-for="e in ensemblesAccuList"
              :key="e.ensemble_id"
              class="flex items-center gap-2 rounded-lg border border-indigo-100 bg-indigo-50/50 px-3 py-2 dark:border-indigo-700/40 dark:bg-indigo-900/10">
              <Icon name="lucide:layers" size="14" class="text-indigo-500" />
              <span class="min-w-0 flex-1 text-sm font-medium text-gray-700 dark:text-gray-200">{{ e.ensembles_matieres?.nom }}</span>
              <span class="text-sm font-semibold text-indigo-600 dark:text-indigo-400">×{{ e.quantite }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-between gap-3">
        <button
          v-if="phase === 'wizard' && history.length > 0"
          type="button"
          class="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          @click="goBack">
          <Icon name="lucide:arrow-left" size="14" />
          Retour
        </button>
        <button
          v-else-if="phase === 'recap' && history.length > 0"
          type="button"
          class="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          @click="goBack">
          <Icon name="lucide:arrow-left" size="14" />
          Revenir aux questions
        </button>
        <div v-else />

        <div class="flex gap-3">
          <button
            type="button"
            class="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            :disabled="inserting"
            @click="onClose">
            Annuler
          </button>

          <button
            v-if="phase === 'wizard'"
            type="button"
            :disabled="!canGoNext || !logique.start_question_id"
            class="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
            @click="goNext">
            Suivant
            <Icon name="lucide:arrow-right" size="14" />
          </button>
          <button
            v-else
            type="button"
            :disabled="(articlesAccuList.length === 0 && ensemblesAccuList.length === 0) || inserting"
            class="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:opacity-50"
            @click="confirmAndInsert">
            <div v-if="inserting" class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            <Icon v-else name="lucide:check" size="14" />
            Confirmer et ajouter
          </button>
        </div>
      </div>
    </template>
  </AppModal>
</template>
