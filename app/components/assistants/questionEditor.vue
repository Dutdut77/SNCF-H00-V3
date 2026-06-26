<script setup>
const props = defineProps({
  logique:  { type: Object, required: true },
  question: { type: Object, default: null },   // null = création
})

const emit = defineEmits(['close', 'saved'])

const {
  createQuestion, updateQuestion,
  createReponse, updateReponse, deleteReponse,
  attachArticleToReponse, detachArticleFromReponse, updateAttachedArticleQuantite,
  attachEnsembleToReponse, detachEnsembleFromReponse, updateAttachedEnsembleQuantite,
} = useAssistants()

const { searchCatalogue } = useCommandesMatieres()
const { getEnsembles } = useEnsemblesMatieres()

// État local
const open = ref(true)
const saving = ref(false)
const isEditing = computed(() => !!props.question)

// Champs question
const libelle = ref(props.question?.libelle ?? '')
const type = ref(props.question?.type ?? 'unique')
const description = ref(props.question?.description ?? '')
const nextQuestionId = ref(props.question?.next_question_id ?? null)
const isGenericFlag = ref(props.question?.is_generic ?? false)

// Réponses (gérées en local, persistées au "Enregistrer")
const reponses = ref([])

// Initialise réponses depuis la question existante OU avec valeurs par défaut selon le type
const initReponses = (t, existingReponses) => {
  if (existingReponses && existingReponses.length > 0) {
    return existingReponses.map((r) => ({
      ...r,
      _isNew: false,
      _dirty: false,
      articles: r.articles || [],
      ensembles: r.ensembles || [],
    }))
  }
  if (t === 'booleen') {
    return [
      { _isNew: true, _tempId: cryptoUuid(), libelle: 'Oui', ordre: 0, next_question_id: null, articles: [], ensembles: [] },
      { _isNew: true, _tempId: cryptoUuid(), libelle: 'Non', ordre: 1, next_question_id: null, articles: [], ensembles: [] },
    ]
  }
  return []
}

const cryptoUuid = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

reponses.value = initReponses(type.value, props.question?.reponses)

// Si on change le type d'une nouvelle question booleen → repeuple
watch(type, (t, prev) => {
  if (isEditing.value) return  // ne pas écraser si on édite
  if (t === 'booleen' && prev !== 'booleen') {
    reponses.value = initReponses('booleen', null)
  } else if (prev === 'booleen' && t !== 'booleen') {
    reponses.value = []
  }
})

// ─── Liste des autres questions (pour le select "next") ──────────────────────
const otherQuestions = computed(() => {
  return (props.logique.questions || []).filter((q) => q.id !== props.question?.id)
})

// Calcul des questions accessibles depuis start (BFS) pour distinguer
// les questions "dans le flux" des "génériques / non rattachées"
const reachableIds = computed(() => {
  const startId = props.logique.start_question_id
  const map = new Map((props.logique.questions || []).map((q) => [q.id, q]))
  const set = new Set()
  if (!startId || !map.has(startId)) return set
  const queue = [startId]
  while (queue.length > 0) {
    const id = queue.shift()
    if (set.has(id)) continue
    set.add(id)
    const q = map.get(id)
    if (!q) continue
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

// 3 groupes : arbre, génériques (is_generic=true), non utilisées (le reste)
const questionsInFlow = computed(() =>
  otherQuestions.value.filter((q) => !q.is_generic && reachableIds.value.has(q.id))
)
const questionsGeneric = computed(() =>
  otherQuestions.value.filter((q) => q.is_generic)
)
const questionsUnused = computed(() =>
  otherQuestions.value.filter((q) => !q.is_generic && !reachableIds.value.has(q.id))
)

// Libellé d'option enrichi : "Libellé · Description tronquée"
const truncate = (s, n = 60) => {
  const t = String(s ?? '').trim()
  return t.length > n ? t.slice(0, n - 1) + '…' : t
}
const optionLabel = (q) => {
  const desc = truncate(q.description)
  return desc ? `${q.libelle}  ·  ${desc}` : q.libelle
}
const optionTitle = (q) => q.description ? `${q.libelle}\n\n${q.description}` : q.libelle

// ─── Références : qui pointe vers la question en cours d'édition ? ───────
// Liste de { questionLibelle, viaReponse } pour chaque référence
const references = computed(() => {
  if (!props.question) return []
  const targetId = props.question.id
  const refs = []
  for (const q of props.logique.questions || []) {
    if (q.id === targetId) continue
    if (q.type === 'multiple') {
      if (q.next_question_id === targetId) {
        refs.push({ questionLibelle: q.libelle, viaReponse: null })
      }
    } else {
      for (const r of q.reponses || []) {
        if (r.next_question_id === targetId) {
          refs.push({ questionLibelle: q.libelle, viaReponse: r.libelle })
        }
      }
    }
  }
  return refs
})

const isStart = computed(() => props.question && props.logique.start_question_id === props.question.id)
const isGeneric = computed(() => isGenericFlag.value)
const isUnused = computed(() => isEditing.value && !isStart.value && !isGeneric.value && references.value.length === 0)

// ─── Ajout / modification d'une réponse ──────────────────────────────────────
const addReponse = () => {
  reponses.value.push({
    _isNew: true,
    _tempId: cryptoUuid(),
    libelle: '',
    ordre: reponses.value.length,
    next_question_id: null,
    articles: [],
    ensembles: [],
  })
}

const removeReponse = (reponse) => {
  const idx = reponses.value.findIndex((r) => r === reponse)
  if (idx === -1) return
  // Si elle existe en base, on devra la supprimer au moment du save
  reponse._toDelete = true
  reponses.value = [...reponses.value]
}

const visibleReponses = computed(() => reponses.value.filter((r) => !r._toDelete))

// ─── Search articles (à l'intérieur d'une réponse) ───────────────────────────
const searchPanel = ref({ open: false, reponseId: null, mode: 'article', query: '', results: [], loading: false })

const openSearch = (reponse, mode) => {
  searchPanel.value = {
    open: true,
    reponse,
    mode,
    query: '',
    results: [],
    loading: false,
  }
  if (mode === 'ensemble') loadEnsembles()
}

const closeSearch = () => {
  searchPanel.value.open = false
  searchPanel.value.reponse = null
  searchPanel.value.results = []
}

const ensemblesCache = ref([])
const loadEnsembles = async () => {
  if (ensemblesCache.value.length > 0) {
    searchPanel.value.results = ensemblesCache.value
    return
  }
  searchPanel.value.loading = true
  // Restreint les ensembles proposés au métier de la logique.
  const list = await getEnsembles(props.logique.metier)
  ensemblesCache.value = list
  searchPanel.value.results = list
  searchPanel.value.loading = false
}

const searchDebounce = ref(null)
watch(() => searchPanel.value.query, (val) => {
  clearTimeout(searchDebounce.value)
  if (searchPanel.value.mode === 'ensemble') {
    const q = (val || '').trim().toLowerCase()
    searchPanel.value.results = !q
      ? ensemblesCache.value
      : ensemblesCache.value.filter((e) =>
          e.nom.toLowerCase().includes(q) ||
          (e.description || '').toLowerCase().includes(q))
    return
  }
  // mode='article'
  if (!val || val.trim().length < 2) {
    searchPanel.value.results = []
    return
  }
  searchPanel.value.loading = true
  searchDebounce.value = setTimeout(async () => {
    searchPanel.value.results = await searchCatalogue(val)
    searchPanel.value.loading = false
  }, 300)
})

const attachItem = (item) => {
  const reponse = searchPanel.value.reponse
  if (!reponse) return
  if (searchPanel.value.mode === 'article') {
    const exists = (reponse.articles || []).some((a) => a.numero_symbole === item.numero_symbole)
    if (exists) return
    reponse.articles.push({
      _isNew: true,
      _tempId: cryptoUuid(),
      numero_symbole: item.numero_symbole,
      quantite: 1,
      catalogue_matieres: item,
    })
  } else {
    const exists = (reponse.ensembles || []).some((e) => e.ensemble_id === item.id)
    if (exists) return
    reponse.ensembles.push({
      _isNew: true,
      _tempId: cryptoUuid(),
      ensemble_id: item.id,
      quantite: 1,
      ensembles_matieres: { id: item.id, nom: item.nom, description: item.description },
    })
  }
}

const detachItem = (reponse, item, kind) => {
  if (kind === 'article') {
    const idx = reponse.articles.indexOf(item)
    if (idx !== -1) {
      if (item._isNew) reponse.articles.splice(idx, 1)
      else { item._toDelete = true; reponse.articles = [...reponse.articles] }
    }
  } else {
    const idx = reponse.ensembles.indexOf(item)
    if (idx !== -1) {
      if (item._isNew) reponse.ensembles.splice(idx, 1)
      else { item._toDelete = true; reponse.ensembles = [...reponse.ensembles] }
    }
  }
}

// ─── Save ────────────────────────────────────────────────────────────────────
const canSave = computed(() => libelle.value.trim().length > 0)

const submit = async () => {
  if (!canSave.value || saving.value) return
  saving.value = true
  try {
    // 1. Créer ou maj la question
    const payloadQuestion = {
      libelle: libelle.value.trim(),
      type: type.value,
      description: description.value.trim(),
      next_question_id: type.value === 'multiple' ? (nextQuestionId.value || null) : null,
      is_generic: isGenericFlag.value,
    }

    let questionId
    if (isEditing.value) {
      const updated = await updateQuestion(props.question.id, payloadQuestion)
      questionId = updated?.id
    } else {
      const created = await createQuestion(props.logique.id, {
        ...payloadQuestion,
        ordre: (props.logique.questions || []).length,
      })
      questionId = created?.id
    }
    if (!questionId) throw new Error("Impossible d'enregistrer la question")

    // 2. Pour chaque réponse : créer/maj/supprimer
    for (let i = 0; i < reponses.value.length; i++) {
      const r = reponses.value[i]
      if (r._toDelete) {
        if (!r._isNew) await deleteReponse(r.id)
        continue
      }
      // Payload de la réponse — next_question_id seulement si question n'est pas multiple
      const payloadReponse = {
        libelle: (r.libelle || '').trim() || '(sans libellé)',
        ordre: i,
        next_question_id: type.value === 'multiple' ? null : (r.next_question_id || null),
      }
      let reponseId
      if (r._isNew) {
        const created = await createReponse(questionId, payloadReponse)
        reponseId = created?.id
      } else {
        await updateReponse(r.id, payloadReponse)
        reponseId = r.id
      }
      if (!reponseId) continue

      // 3. Articles
      for (const a of r.articles || []) {
        if (a._toDelete) {
          if (!a._isNew) await detachArticleFromReponse(a.id)
          continue
        }
        if (a._isNew) {
          await attachArticleToReponse(reponseId, a.numero_symbole, a.quantite || 1)
        } else if (a._dirty) {
          await updateAttachedArticleQuantite(a.id, a.quantite || 1)
        }
      }

      // 4. Ensembles
      for (const e of r.ensembles || []) {
        if (e._toDelete) {
          if (!e._isNew) await detachEnsembleFromReponse(e.id)
          continue
        }
        if (e._isNew) {
          await attachEnsembleToReponse(reponseId, e.ensemble_id, e.quantite || 1)
        } else if (e._dirty) {
          await updateAttachedEnsembleQuantite(e.id, e.quantite || 1)
        }
      }
    }

    emit('saved')
  } finally {
    saving.value = false
  }
}

// ─── Helpers UI ──────────────────────────────────────────────────────────────
const typeOptions = [
  { value: 'unique', label: 'Choix unique', icon: 'lucide:circle-dot' },
  { value: 'multiple', label: 'Choix multiple', icon: 'lucide:check-square' },
  { value: 'booleen', label: 'Oui / Non', icon: 'lucide:toggle-left' },
]

const onClose = () => emit('close')
</script>

<template>
  <AppModal v-model="open" size="4xl" :persistent="saving" @close="onClose">
    <template #header>
      <h3 class="text-base font-semibold text-slate-800 dark:text-white">
        {{ isEditing ? 'Modifier la question' : 'Nouvelle question' }}
      </h3>
    </template>

    <div class="space-y-5">
      <!-- ─── Bandeau de statut ───────────────────────────────────────── -->
      <div
        v-if="isEditing"
        class="flex items-start gap-3 rounded-lg border px-3 py-2.5"
        :class="
          isStart
            ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-700/40 dark:bg-yellow-900/20'
            : isGeneric
              ? 'border-amber-200 bg-amber-50 dark:border-amber-700/40 dark:bg-amber-900/20'
              : isUnused
                ? 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/30'
                : 'border-secondary-200 bg-secondary-50 dark:border-secondary-700/40 dark:bg-secondary-900/20'
        ">
        <Icon
          :name="isStart ? 'lucide:flag' : isGeneric ? 'lucide:bookmark' : isUnused ? 'lucide:circle-slash' : 'lucide:link'"
          size="16"
          class="mt-0.5 flex-none"
          :class="isStart ? 'text-yellow-600' : isGeneric ? 'text-amber-600' : isUnused ? 'text-slate-500' : 'text-secondary-600'" />
        <div class="min-w-0 flex-1 text-xs">
          <p class="font-semibold"
            :class="isStart ? 'text-yellow-700 dark:text-yellow-300' : isGeneric ? 'text-amber-700 dark:text-amber-300' : isUnused ? 'text-slate-600 dark:text-slate-300' : 'text-secondary-700 dark:text-secondary-300'">
            <template v-if="isStart">Question de départ du wizard</template>
            <template v-else-if="isGeneric">Question générique (partagée) — {{ references.length }} référence{{ references.length > 1 ? 's' : '' }}</template>
            <template v-else-if="isUnused">Question non utilisée</template>
            <template v-else>Question d'arbre — référencée par {{ references.length }} réponse{{ references.length > 1 ? 's' : '' }}</template>
          </p>
          <ul v-if="references.length > 0" class="mt-1 space-y-0.5">
            <li v-for="(ref, i) in references" :key="i" class="text-slate-600 dark:text-slate-300">
              <Icon name="lucide:corner-down-right" size="10" class="mr-0.5 inline text-slate-400" />
              <strong>{{ ref.questionLibelle }}</strong>
              <template v-if="ref.viaReponse"> · via la réponse <em>« {{ ref.viaReponse }} »</em></template>
            </li>
          </ul>
          <p v-else-if="isGeneric" class="mt-0.5 text-slate-500 dark:text-slate-400">
            Aucune réponse ne pointe encore vers cette question. Tu peux la cibler depuis n'importe quelle réponse.
          </p>
          <p v-else-if="isUnused" class="mt-0.5 text-slate-500 dark:text-slate-400">
            Cette question n'est ni dans l'arbre ni marquée comme générique. Active le toggle ci-dessous pour la rendre réutilisable.
          </p>
        </div>
      </div>

      <!-- ─── Champs question ──────────────────────────────────────────── -->
      <div class="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/50">
        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Libellé *</label>
          <input
            v-model="libelle"
            type="text"
            placeholder="Ex : Type de moteur ?"
            class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-secondary-400 focus:ring-2 focus:ring-secondary-100 dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Type</label>
          <div class="flex flex-wrap gap-2">
            <label
              v-for="opt in typeOptions"
              :key="opt.value"
              class="flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition"
              :class="
                type === opt.value
                  ? 'border-secondary-400 bg-secondary-50 text-secondary-700 dark:border-secondary-600 dark:bg-secondary-900/30 dark:text-secondary-300'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300'
              ">
              <input v-model="type" type="radio" :value="opt.value" class="sr-only" />
              <Icon :name="opt.icon" size="14" />
              {{ opt.label }}
            </label>
          </div>
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Description (optionnel)</label>
          <textarea
            v-model="description"
            rows="2"
            placeholder="Aide contextuelle…"
            class="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-secondary-400 focus:ring-2 focus:ring-secondary-100 dark:border-slate-600 dark:bg-slate-700 dark:text-white"></textarea>
        </div>

        <!-- Toggle question générique -->
        <label class="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5 transition hover:border-amber-300 dark:border-slate-600 dark:bg-slate-800">
          <input v-model="isGenericFlag" type="checkbox" class="mt-0.5 h-4 w-4 accent-amber-600" />
          <div class="min-w-0 flex-1">
            <p class="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
              <Icon name="lucide:bookmark" size="13" class="text-amber-500" />
              Question générique (réutilisable)
            </p>
            <p class="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              La question sera affichée dans une section partagée plutôt qu'inline dans l'arbre. Modifier ses articles impactera tous les parcours qui la référencent.
            </p>
          </div>
        </label>

        <!-- next_question_id au niveau question pour type=multiple -->
        <div v-if="type === 'multiple'">
          <label class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Question suivante</label>
          <select
            v-model="nextQuestionId"
            class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-secondary-400 focus:ring-2 focus:ring-secondary-100 dark:border-slate-600 dark:bg-slate-700 dark:text-white">
            <option :value="null">— Fin du wizard —</option>
            <optgroup v-if="questionsInFlow.length > 0" label="Dans l'arbre principal">
              <option v-for="q in questionsInFlow" :key="q.id" :value="q.id" :title="optionTitle(q)">{{ optionLabel(q) }}</option>
            </optgroup>
            <optgroup v-if="questionsGeneric.length > 0" label="Questions génériques (partagées)">
              <option v-for="q in questionsGeneric" :key="q.id" :value="q.id" :title="optionTitle(q)">{{ optionLabel(q) }}</option>
            </optgroup>
            <optgroup v-if="questionsUnused.length > 0" label="Questions non utilisées">
              <option v-for="q in questionsUnused" :key="q.id" :value="q.id" :title="optionTitle(q)">{{ optionLabel(q) }}</option>
            </optgroup>
          </select>
          <p class="mt-1 text-xs text-slate-400">Avec choix multiple, toutes les réponses cochées s'agrègent puis on passe à cette question. Survole une option pour voir la description complète.</p>
        </div>
      </div>

      <!-- ─── Réponses ─────────────────────────────────────────────────── -->
      <div>
        <div class="mb-2 flex items-center justify-between">
          <h4 class="text-sm font-semibold text-slate-700 dark:text-slate-200">Réponses</h4>
          <button
            v-if="type !== 'booleen'"
            type="button"
            class="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:border-secondary-300 hover:bg-secondary-50 hover:text-secondary-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
            @click="addReponse">
            <Icon name="lucide:plus" size="13" />
            Ajouter une réponse
          </button>
        </div>

        <div v-if="visibleReponses.length === 0" class="rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-400 dark:border-slate-700">
          Aucune réponse — ajoute au moins une option
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="(reponse, idx) in visibleReponses"
            :key="reponse.id || reponse._tempId"
            class="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">

            <!-- Header réponse -->
            <div class="flex items-start gap-2">
              <span class="mt-1.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-secondary-100 text-xs font-bold text-secondary-600 dark:bg-secondary-900/30 dark:text-secondary-400">
                {{ idx + 1 }}
              </span>
              <div class="min-w-0 flex-1 space-y-2">
                <input
                  v-model="reponse.libelle"
                  type="text"
                  :placeholder="`Libellé de la réponse #${idx + 1}`"
                  :disabled="type === 'booleen'"
                  class="w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm text-slate-800 outline-none transition focus:border-secondary-400 focus:ring-1 focus:ring-secondary-200 disabled:bg-slate-50 disabled:text-slate-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:disabled:bg-slate-800" />

                <!-- next pour unique/booleen -->
                <div v-if="type !== 'multiple'" class="flex items-center gap-2">
                  <span class="text-xs text-slate-400">Question suivante :</span>
                  <select
                    v-model="reponse.next_question_id"
                    class="flex-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 outline-none transition focus:border-secondary-400 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200">
                    <option :value="null">— Fin du wizard —</option>
                    <optgroup v-if="questionsInFlow.length > 0" label="Dans l'arbre principal">
                      <option v-for="q in questionsInFlow" :key="q.id" :value="q.id" :title="optionTitle(q)">{{ optionLabel(q) }}</option>
                    </optgroup>
                    <optgroup v-if="questionsGeneric.length > 0" label="Questions génériques (partagées)">
                      <option v-for="q in questionsGeneric" :key="q.id" :value="q.id" :title="optionTitle(q)">{{ optionLabel(q) }}</option>
                    </optgroup>
                    <optgroup v-if="questionsUnused.length > 0" label="Questions non utilisées">
                      <option v-for="q in questionsUnused" :key="q.id" :value="q.id" :title="optionTitle(q)">{{ optionLabel(q) }}</option>
                    </optgroup>
                  </select>
                </div>

                <!-- Articles attachés -->
                <div v-if="(reponse.articles || []).filter(a => !a._toDelete).length > 0" class="space-y-1">
                  <p class="text-xs font-medium uppercase tracking-wide text-slate-400">Articles</p>
                  <div
                    v-for="article in (reponse.articles || []).filter(a => !a._toDelete)"
                    :key="article.id || article._tempId"
                    class="flex items-center gap-2 rounded-md bg-slate-50 px-2 py-1.5 dark:bg-slate-900/30">
                    <span class="inline-flex items-center rounded-md px-1.5 py-0.5 font-mono text-xs font-semibold ring-1"
                      :class="
                        article.catalogue_matieres?.origine === 'contrat_cadre'
                          ? 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:ring-amber-700/40'
                          : 'bg-secondary-50 text-secondary-700 ring-secondary-100 dark:bg-secondary-900/20 dark:text-secondary-300 dark:ring-secondary-800/40'
                      ">
                      {{ article.numero_symbole }}
                    </span>
                    <span class="min-w-0 flex-1 truncate text-xs text-slate-600 dark:text-slate-300">{{ article.catalogue_matieres?.description || '—' }}</span>
                    <input
                      :value="article.quantite"
                      type="number"
                      min="0"
                      step="any"
                      class="w-16 rounded border border-slate-200 px-1.5 py-0.5 text-center text-xs text-slate-800 outline-none focus:border-secondary-400 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                      @input="article.quantite = parseFloat($event.target.value) || 0; article._dirty = true" />
                    <button
                      type="button"
                      class="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                      @click="detachItem(reponse, article, 'article')">
                      <Icon name="lucide:x" size="12" />
                    </button>
                  </div>
                </div>

                <!-- Ensembles attachés -->
                <div v-if="(reponse.ensembles || []).filter(e => !e._toDelete).length > 0" class="space-y-1">
                  <p class="text-xs font-medium uppercase tracking-wide text-slate-400">Ensembles</p>
                  <div
                    v-for="ens in (reponse.ensembles || []).filter(e => !e._toDelete)"
                    :key="ens.id || ens._tempId"
                    class="flex items-center gap-2 rounded-md bg-indigo-50/50 px-2 py-1.5 dark:bg-indigo-900/10">
                    <Icon name="lucide:layers" size="13" class="text-indigo-500" />
                    <span class="min-w-0 flex-1 truncate text-xs text-slate-700 dark:text-slate-200">{{ ens.ensembles_matieres?.nom }}</span>
                    <input
                      :value="ens.quantite"
                      type="number"
                      min="1"
                      step="1"
                      class="w-16 rounded border border-indigo-200 px-1.5 py-0.5 text-center text-xs text-indigo-700 outline-none focus:border-indigo-400 dark:border-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-300"
                      @input="ens.quantite = parseFloat($event.target.value) || 1; ens._dirty = true" />
                    <button
                      type="button"
                      class="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                      @click="detachItem(reponse, ens, 'ensemble')">
                      <Icon name="lucide:x" size="12" />
                    </button>
                  </div>
                </div>

                <!-- Boutons d'ajout -->
                <div class="flex gap-1.5">
                  <button
                    type="button"
                    class="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 transition hover:border-secondary-300 hover:bg-secondary-50 hover:text-secondary-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    @click="openSearch(reponse, 'article')">
                    <Icon name="lucide:package-plus" size="12" />
                    Article
                  </button>
                  <button
                    type="button"
                    class="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    @click="openSearch(reponse, 'ensemble')">
                    <Icon name="lucide:layers" size="12" />
                    Ensemble
                  </button>
                </div>
              </div>

              <!-- Suppression réponse (pas pour booleen) -->
              <button
                v-if="type !== 'booleen'"
                type="button"
                class="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                @click="removeReponse(reponse)">
                <Icon name="lucide:trash-2" size="14" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <button
          type="button"
          class="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
          :disabled="saving"
          @click="onClose">
          Annuler
        </button>
        <button
          type="button"
          :disabled="!canSave || saving"
          class="flex items-center gap-2 rounded-lg bg-secondary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-secondary-700 disabled:opacity-50"
          @click="submit">
          <div v-if="saving" class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
          {{ isEditing ? 'Enregistrer' : 'Créer' }}
        </button>
      </div>
    </template>

    <!-- ─── Mini panneau de recherche (overlay) ─────────────────────────── -->
    <Teleport to="body">
      <Transition enter-active-class="duration-150 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100"
        leave-active-class="duration-100 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
        <div v-if="searchPanel.open" class="fixed inset-0 z-150 flex items-end justify-center p-4 sm:items-center">
          <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" @click="closeSearch"></div>
          <div class="relative flex max-h-[70vh] w-full max-w-lg flex-col overflow-hidden rounded-lg bg-white shadow-2xl dark:bg-slate-800">
            <div class="flex items-center gap-2 border-b border-slate-200 px-4 py-3 dark:border-slate-700">
              <Icon
                :name="searchPanel.mode === 'article' ? 'lucide:package' : 'lucide:layers'"
                size="16"
                class="text-slate-400" />
              <h3 class="flex-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
                Ajouter {{ searchPanel.mode === 'article' ? 'un article' : 'un ensemble' }}
              </h3>
              <button type="button" class="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700" @click="closeSearch">
                <Icon name="lucide:x" size="14" />
              </button>
            </div>
            <div class="border-b border-slate-100 p-3 dark:border-slate-700">
              <div class="relative">
                <Icon name="lucide:search" size="14" class="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  v-model="searchPanel.query"
                  type="text"
                  :placeholder="searchPanel.mode === 'article' ? 'Symbole ou désignation…' : 'Nom d’ensemble…'"
                  class="w-full rounded-md border border-slate-200 bg-white py-1.5 pl-8 pr-2 text-sm text-slate-700 outline-none focus:border-secondary-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200" />
              </div>
            </div>
            <div class="flex-1 overflow-y-auto p-2">
              <div v-if="searchPanel.loading" class="flex items-center justify-center py-8">
                <div class="h-5 w-5 animate-spin rounded-full border-2 border-secondary-500 border-t-transparent"></div>
              </div>
              <div v-else-if="searchPanel.results.length === 0" class="py-8 text-center text-sm text-slate-400">
                <template v-if="searchPanel.mode === 'article' && (searchPanel.query || '').trim().length < 2">
                  Tape au moins 2 caractères…
                </template>
                <template v-else>Aucun résultat</template>
              </div>
              <ul v-else class="space-y-1">
                <li v-for="item in searchPanel.results" :key="item.id || item.numero_symbole">
                  <button
                    type="button"
                    class="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-sm text-slate-700 transition hover:bg-secondary-50 hover:text-secondary-700 dark:text-slate-200 dark:hover:bg-secondary-900/20 dark:hover:text-secondary-300"
                    @click="attachItem(item)">
                    <template v-if="searchPanel.mode === 'article'">
                      <span class="inline-flex items-center rounded-md px-1.5 py-0.5 font-mono text-xs font-semibold ring-1"
                        :class="
                          item.origine === 'contrat_cadre'
                            ? 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:ring-amber-700/40'
                            : 'bg-secondary-50 text-secondary-700 ring-secondary-100 dark:bg-secondary-900/20 dark:text-secondary-300 dark:ring-secondary-800/40'
                        ">
                        {{ item.numero_symbole }}
                      </span>
                      <span class="min-w-0 flex-1 truncate">{{ item.description || '—' }}</span>
                    </template>
                    <template v-else>
                      <Icon name="lucide:layers" size="14" class="flex-none text-indigo-500" />
                      <div class="min-w-0 flex-1">
                        <p class="truncate font-medium">{{ item.nom }}</p>
                        <p v-if="item.description" class="truncate text-xs text-slate-400">{{ item.description }}</p>
                      </div>
                    </template>
                    <Icon name="lucide:plus" size="13" class="flex-none text-slate-300" />
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </AppModal>
</template>
