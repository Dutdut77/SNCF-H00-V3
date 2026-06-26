<script setup>
/**
 * Panneau d'édition fluide d'une question, ancré à droite.
 * - Pas de modale : l'édition se fait directement, autosave (debounce sur texte, immédiat sur toggles/selects)
 * - 4 sections : Général · Réponses · Paramètres · Informations
 * - Sélection contrôlée par le parent via questionId
 */
const props = defineProps({
  questionId: { type: String, default: null },
  logique:    { type: Object, required: true },
})

const emit = defineEmits(['changed', 'select', 'duplicate'])

const {
  updateQuestion, deleteQuestion,
  createReponse, updateReponse, deleteReponse,
  attachArticleToReponse, detachArticleFromReponse, updateAttachedArticleQuantite,
  attachEnsembleToReponse, detachEnsembleFromReponse, updateAttachedEnsembleQuantite,
} = useAssistants()
const { searchCatalogue } = useCommandesMatieres()
const { getEnsembles } = useEnsemblesMatieres()

const question = computed(() =>
  (props.logique.questions || []).find((q) => q.id === props.questionId) || null
)

// ─── Champs locaux (synchros avec la question) ───────────────────────────
const libelleLocal = ref('')
const descriptionLocal = ref('')
const typeLocal = ref('unique')
const nextQuestionIdLocal = ref(null)

watch(question, (q) => {
  if (!q) return
  libelleLocal.value = q.libelle ?? ''
  descriptionLocal.value = q.description ?? ''
  typeLocal.value = q.type ?? 'unique'
  nextQuestionIdLocal.value = q.next_question_id ?? null
}, { immediate: true })

// ─── Autosave ────────────────────────────────────────────────────────────
let saveTimer = null
const saveDebounced = (payload) => {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => commit(payload), 500)
}
const commit = async (payload) => {
  if (!question.value) return
  const updated = await updateQuestion(question.value.id, payload)
  if (updated) emit('changed')
}

watch(libelleLocal, (v) => {
  if (!question.value) return
  const next = (v ?? '').trim()
  if (next === (question.value.libelle ?? '').trim()) return
  saveDebounced({ libelle: next })
})
watch(descriptionLocal, (v) => {
  if (!question.value) return
  const next = (v ?? '').trim()
  if (next === (question.value.description ?? '').trim()) return
  saveDebounced({ description: next })
})
watch(typeLocal, async (v) => {
  if (!question.value || v === question.value.type) return
  const id = question.value.id
  const hadNoResponses = (question.value.reponses || []).length === 0
  const payload = { type: v }
  if (v !== 'multiple') payload.next_question_id = null
  const updated = await updateQuestion(id, payload)
  if (!updated) return
  // « Oui / Non » : créer automatiquement les deux réponses si la question n'en a pas
  if (v === 'booleen' && hadNoResponses) {
    await createReponse(id, { libelle: 'Oui', ordre: 0 })
    await createReponse(id, { libelle: 'Non', ordre: 1 })
  }
  emit('changed')
})
watch(nextQuestionIdLocal, (v) => {
  if (!question.value || v === question.value.next_question_id) return
  commit({ next_question_id: v })
})

// ─── Duplication de la question ───────────────────────────────────────────
const onDuplicate = () => {
  if (question.value) emit('duplicate', question.value)
}

// ─── Suppression de la question ───────────────────────────────────────────
const showConfirmDelete = ref(false)
const confirmDelete = async () => {
  if (!question.value) return
  const id = question.value.id
  await deleteQuestion(id)
  showConfirmDelete.value = false
  emit('changed')
  emit('select', null)
}

// ─── Réponses (autosave par champ) ───────────────────────────────────────
const expandedResponses = ref(new Set())
const isExpanded = (rid) => expandedResponses.value.has(rid)
const toggleExpanded = (rid) => {
  const s = new Set(expandedResponses.value)
  s.has(rid) ? s.delete(rid) : s.add(rid)
  expandedResponses.value = s
}

const addResponse = async () => {
  if (!question.value) return
  const created = await createReponse(question.value.id, {
    libelle: 'Nouvelle réponse',
    ordre: (question.value.reponses || []).length,
  })
  if (created) {
    expandedResponses.value = new Set([...expandedResponses.value, created.id])
    emit('changed')
  }
}

const editResponseLibelle = async (reponse, val) => {
  const next = (val ?? '').trim() || '(sans libellé)'
  if (next === reponse.libelle) return
  await updateReponse(reponse.id, { libelle: next })
  emit('changed')
}
const editResponseNext = async (reponse, nextId) => {
  const v = nextId || null
  if (v === reponse.next_question_id) return
  await updateReponse(reponse.id, { next_question_id: v })
  emit('changed')
}
const showConfirmDeleteResponse = ref(null)
const askDeleteResponse = (reponse) => { showConfirmDeleteResponse.value = reponse }
const confirmDeleteResponse = async () => {
  const r = showConfirmDeleteResponse.value
  if (!r) return
  await deleteReponse(r.id)
  showConfirmDeleteResponse.value = null
  emit('changed')
}

// ─── Articles attachés ───────────────────────────────────────────────────
const removeArticle = async (article) => {
  await detachArticleFromReponse(article.id)
  emit('changed')
}
const updateArticleQty = async (article, value) => {
  const qty = Number(value)
  if (Number.isNaN(qty) || qty < 0) return
  if (qty === article.quantite) return
  await updateAttachedArticleQuantite(article.id, qty)
  emit('changed')
}

// ─── Ensembles attachés ──────────────────────────────────────────────────
const removeEnsemble = async (ens) => {
  await detachEnsembleFromReponse(ens.id)
  emit('changed')
}
const updateEnsembleQty = async (ens, value) => {
  const qty = Number(value)
  if (Number.isNaN(qty) || qty < 0) return
  if (qty === ens.quantite) return
  await updateAttachedEnsembleQuantite(ens.id, qty)
  emit('changed')
}

// ─── Mini-panneau de recherche (overlay) ─────────────────────────────────
const searchPanel = ref({ open: false, reponse: null, mode: 'article', query: '', results: [], loading: false })
// Quantité saisie par ligne de résultat (clé = symbole article ou id ensemble)
const rowQty = ref({})
const qtyKey = (item) => (searchPanel.value.mode === 'article' ? item.numero_symbole : item.id)
const qtyFor = (item) => {
  const v = rowQty.value[qtyKey(item)]
  return v == null || v === '' ? 1 : v
}
const setQty = (item, val) => { rowQty.value = { ...rowQty.value, [qtyKey(item)]: val } }
const openSearch = (reponse, mode) => {
  searchPanel.value = { open: true, reponse, mode, query: '', results: [], loading: false }
  rowQty.value = {}
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
  const list = await getEnsembles()
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
const attachItem = async (item) => {
  const reponse = searchPanel.value.reponse
  if (!reponse) return
  const qty = Math.max(0.001, Number(qtyFor(item)) || 1)
  if (searchPanel.value.mode === 'article') {
    const exists = (reponse.articles || []).some((a) => a.numero_symbole === item.numero_symbole)
    if (exists) return
    await attachArticleToReponse(reponse.id, item.numero_symbole, qty)
  } else {
    const exists = (reponse.ensembles || []).some((e) => e.ensemble_id === item.id)
    if (exists) return
    await attachEnsembleToReponse(reponse.id, item.id, qty)
  }
  emit('changed')
}

// ─── Helpers : statut / références / dropdown next ───────────────────────
const isStart = computed(() => props.logique.start_question_id === props.questionId)

const references = computed(() => {
  if (!question.value) return []
  const refs = []
  for (const q of props.logique.questions || []) {
    if (q.id === question.value.id) continue
    if (q.type === 'multiple') {
      if (q.next_question_id === question.value.id) {
        refs.push({ libelle: q.libelle, viaReponse: null })
      }
    } else {
      for (const r of q.reponses || []) {
        if (r.next_question_id === question.value.id) {
          refs.push({ libelle: q.libelle, viaReponse: r.libelle })
        }
      }
    }
  }
  return refs
})

// Numérotation hiérarchique Q1, Q1.1… partagée par le sélecteur de question
// suivante (pour grouper par branche de la question de départ).
const numbering = computed(() => {
  const map = new Map()
  const questions = props.logique.questions || []
  const ids = new Map(questions.map((q) => [q.id, q]))
  const startId = props.logique.start_question_id
  const assign = (id, prefix, visited = new Set()) => {
    if (!id || map.has(id) || visited.has(id) || !ids.has(id)) return
    const v = new Set(visited); v.add(id)
    map.set(id, prefix)
    const q = ids.get(id)
    if (q.type === 'multiple') {
      if (q.next_question_id) assign(q.next_question_id, `${prefix}.1`, v)
    } else {
      (q.reponses || []).forEach((r, i) => {
        if (r.next_question_id) assign(r.next_question_id, `${prefix}.${i + 1}`, v)
      })
    }
  }
  if (startId) assign(startId, 'Q1')
  let nextRoot = startId ? 2 : 1
  for (const q of questions) {
    if (map.has(q.id)) continue
    assign(q.id, `Q${nextRoot}`); nextRoot++
  }
  return map
})

const fmtDate = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

const shortId = computed(() => (question.value?.id || '').slice(0, 8))

const typeOptions = [
  { value: 'unique', label: 'Choix unique', icon: 'lucide:circle-dot' },
  { value: 'multiple', label: 'Choix multiple', icon: 'lucide:check-square' },
  { value: 'booleen', label: 'Oui / Non', icon: 'lucide:toggle-left' },
]
</script>

<template>
  <aside class="flex h-full w-96 flex-none flex-col border-l border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">

    <!-- ── Empty state ──────────────────────────────────────────── -->
    <div v-if="!question" class="flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-slate-400">
      <Icon name="lucide:mouse-pointer-click" size="36" class="opacity-30" />
      <p class="text-sm">Clique sur une question dans l'arbre pour l'éditer.</p>
    </div>

    <template v-else>
      <!-- ── Header ───────────────────────────────────────────── -->
      <div class="flex flex-none items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
        <div class="flex items-center gap-2">
          <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-200">Question sélectionnée</h3>
          <span class="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-500 dark:bg-slate-700 dark:text-slate-400" :title="question.id">
            {{ shortId }}
          </span>
        </div>
        <div class="flex items-center gap-0.5">
          <button
            type="button"
            title="Dupliquer la question"
            class="rounded p-1 text-slate-400 transition hover:bg-secondary-50 hover:text-secondary-600 dark:hover:bg-secondary-900/20 dark:hover:text-secondary-400"
            @click="onDuplicate">
            <Icon name="lucide:copy" size="14" />
          </button>
          <button
            type="button"
            title="Supprimer la question"
            class="rounded p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
            @click="showConfirmDelete = true">
            <Icon name="lucide:trash-2" size="14" />
          </button>
        </div>
      </div>

      <!-- ── Statut banner ────────────────────────────────────── -->
      <div v-if="isStart" class="flex items-center gap-2 border-b border-yellow-200 bg-yellow-50 px-4 py-2 text-xs text-yellow-700 dark:border-yellow-700/40 dark:bg-yellow-900/20 dark:text-yellow-300">
        <Icon name="lucide:flag" size="11" />
        Question de départ du wizard
      </div>
      <div v-else-if="references.length === 0" class="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900/30 dark:text-slate-300">
        <Icon name="lucide:circle-slash" size="11" />
        Question non utilisée
      </div>
      <div v-else class="flex items-center gap-2 border-b border-secondary-200 bg-secondary-50 px-4 py-2 text-xs text-secondary-700 dark:border-secondary-700/40 dark:bg-secondary-900/20 dark:text-secondary-300">
        <Icon name="lucide:link" size="11" />
        Référencée par {{ references.length }} réponse{{ references.length > 1 ? 's' : '' }}
      </div>

      <!-- ── Contenu scrollable ──────────────────────────────── -->
      <div class="flex-1 overflow-y-auto">

        <!-- ── Section Général ────────────────────────────── -->
        <section class="space-y-3 border-b border-slate-100 px-4 py-4 dark:border-slate-700">
          <h4 class="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Général</h4>

          <div>
            <label class="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Libellé</label>
            <input
              v-model="libelleLocal"
              type="text"
              placeholder="Texte de la question"
              class="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-sm text-slate-800 outline-none transition focus:border-secondary-400 focus:ring-1 focus:ring-secondary-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100" />
          </div>

          <div>
            <label class="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Type</label>
            <div class="grid grid-cols-3 gap-1">
              <label
                v-for="opt in typeOptions"
                :key="opt.value"
                class="flex cursor-pointer items-center justify-center gap-1 rounded-md border px-1 py-1.5 text-[11px] font-medium transition"
                :class="
                  typeLocal === opt.value
                    ? 'border-secondary-400 bg-secondary-50 text-secondary-700 dark:border-secondary-600 dark:bg-secondary-900/30 dark:text-secondary-300'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300'
                ">
                <input v-model="typeLocal" type="radio" :value="opt.value" class="sr-only" />
                <Icon :name="opt.icon" size="11" />
                {{ opt.label }}
              </label>
            </div>
          </div>

          <div>
            <label class="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Description</label>
            <textarea
              v-model="descriptionLocal"
              rows="2"
              placeholder="Aide contextuelle, optionnel…"
              class="w-full resize-none rounded-md border border-slate-200 px-2.5 py-1.5 text-sm text-slate-800 outline-none transition focus:border-secondary-400 focus:ring-1 focus:ring-secondary-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"></textarea>
          </div>
        </section>

        <!-- ── Section Réponses ───────────────────────────── -->
        <section class="space-y-2 border-b border-slate-100 px-4 py-4 dark:border-slate-700">
          <div class="flex items-center justify-between">
            <h4 class="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Réponses ({{ question.reponses?.length || 0 }})
            </h4>
          </div>

          <div
            v-for="r in question.reponses"
            :key="r.id"
            class="rounded-lg border border-slate-200 dark:border-slate-700">

            <!-- Header réponse (libellé + actions) -->
            <div class="flex items-center gap-1 px-2 py-1.5">
              <button
                type="button"
                class="flex-none rounded p-0.5 text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-700"
                @click="toggleExpanded(r.id)">
                <Icon :name="isExpanded(r.id) ? 'lucide:chevron-down' : 'lucide:chevron-right'" size="11" />
              </button>
              <input
                :value="r.libelle"
                type="text"
                :disabled="typeLocal === 'booleen'"
                placeholder="Libellé"
                class="min-w-0 flex-1 rounded border border-transparent bg-transparent px-1.5 py-0.5 text-xs font-medium text-slate-700 outline-none transition hover:border-slate-200 focus:border-secondary-400 focus:bg-white dark:text-slate-200 dark:hover:border-slate-600 dark:focus:bg-slate-800 disabled:opacity-60"
                @blur="editResponseLibelle(r, $event.target.value)"
                @keyup.enter="$event.target.blur()" />
              <button
                v-if="typeLocal !== 'booleen'"
                type="button"
                class="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                @click="askDeleteResponse(r)">
                <Icon name="lucide:x" size="11" />
              </button>
            </div>

            <!-- Corps de la réponse -->
            <div v-if="isExpanded(r.id)" class="space-y-2 border-t border-slate-100 px-2 py-2 dark:border-slate-700">

              <!-- Next question (unique/booleen) -->
              <div v-if="typeLocal !== 'multiple'">
                <label class="mb-0.5 block text-[10px] uppercase tracking-wide text-slate-400">Question suivante</label>
                <AssistantsQuestionSelect
                  :model-value="r.next_question_id"
                  :logique="logique"
                  :numbering="numbering"
                  :current-question-id="question.id"
                  @update:model-value="(v) => editResponseNext(r, v)" />
              </div>

              <!-- Articles -->
              <div>
                <div class="mb-1 flex items-center justify-between">
                  <label class="text-[10px] uppercase tracking-wide text-slate-400">Articles ({{ (r.articles || []).length }})</label>
                  <button
                    type="button"
                    class="inline-flex items-center gap-0.5 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-500 transition hover:border-secondary-300 hover:bg-secondary-50 hover:text-secondary-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    @click="openSearch(r, 'article')">
                    <Icon name="lucide:plus" size="9" />
                    Ajouter
                  </button>
                </div>
                <div
                  v-for="a in r.articles || []"
                  :key="a.id"
                  class="flex items-center gap-1.5 rounded bg-slate-50 px-1.5 py-1 text-[11px] dark:bg-slate-900/40">
                  <span
                    class="inline-flex items-center rounded px-1 py-0.5 font-mono text-[10px] font-semibold ring-1"
                    :class="
                      a.catalogue_matieres?.origine === 'contrat_cadre'
                        ? 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:ring-amber-700/40'
                        : 'bg-secondary-50 text-secondary-700 ring-secondary-100 dark:bg-secondary-900/20 dark:text-secondary-300 dark:ring-secondary-800/40'
                    ">
                    {{ a.numero_symbole }}
                  </span>
                  <span class="min-w-0 flex-1 truncate text-slate-600 dark:text-slate-300" :title="a.catalogue_matieres?.description">
                    {{ a.catalogue_matieres?.description || '—' }}
                  </span>
                  <input
                    :value="a.quantite"
                    type="number"
                    min="0"
                    step="any"
                    class="w-12 rounded border border-slate-200 px-1 py-0.5 text-center text-[10px] text-slate-800 outline-none focus:border-secondary-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    @change="updateArticleQty(a, $event.target.value)" />
                  <button
                    type="button"
                    class="rounded p-0.5 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                    @click="removeArticle(a)">
                    <Icon name="lucide:x" size="10" />
                  </button>
                </div>
              </div>

              <!-- Ensembles -->
              <div>
                <div class="mb-1 flex items-center justify-between">
                  <label class="text-[10px] uppercase tracking-wide text-slate-400">Ensembles ({{ (r.ensembles || []).length }})</label>
                  <button
                    type="button"
                    class="inline-flex items-center gap-0.5 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-500 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    @click="openSearch(r, 'ensemble')">
                    <Icon name="lucide:plus" size="9" />
                    Ajouter
                  </button>
                </div>
                <div
                  v-for="e in r.ensembles || []"
                  :key="e.id"
                  class="flex items-center gap-1.5 rounded bg-indigo-50/50 px-1.5 py-1 text-[11px] dark:bg-indigo-900/10">
                  <Icon name="lucide:layers" size="11" class="text-indigo-500" />
                  <span class="min-w-0 flex-1 truncate text-slate-700 dark:text-slate-200">{{ e.ensembles_matieres?.nom }}</span>
                  <input
                    :value="e.quantite"
                    type="number"
                    min="1"
                    step="1"
                    class="w-12 rounded border border-indigo-200 px-1 py-0.5 text-center text-[10px] text-indigo-700 outline-none focus:border-indigo-400 dark:border-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-300"
                    @change="updateEnsembleQty(e, $event.target.value)" />
                  <button
                    type="button"
                    class="rounded p-0.5 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                    @click="removeEnsemble(e)">
                    <Icon name="lucide:x" size="10" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Pas de réponses -->
          <p v-if="!question.reponses?.length" class="rounded-md border border-dashed border-slate-200 px-2 py-3 text-center text-[11px] italic text-slate-400 dark:border-slate-600">
            Aucune réponse — ajoute-en une
          </p>

          <!-- Bouton ajouter réponse -->
          <button
            v-if="typeLocal !== 'booleen'"
            type="button"
            class="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-slate-300 px-2 py-1.5 text-xs font-medium text-slate-600 transition hover:border-secondary-400 hover:bg-secondary-50 hover:text-secondary-600 dark:border-slate-600 dark:text-slate-300 dark:hover:border-secondary-500 dark:hover:bg-secondary-900/20 dark:hover:text-secondary-400"
            @click="addResponse">
            <Icon name="lucide:plus" size="12" />
            Ajouter une réponse
          </button>
        </section>

        <!-- ── Section Paramètres (choix multiple uniquement) ─────────── -->
        <section v-if="typeLocal === 'multiple'" class="space-y-3 border-b border-slate-100 px-4 py-4 dark:border-slate-700">
          <h4 class="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Paramètres</h4>

          <div>
            <label class="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Question suivante (après cochage)</label>
            <AssistantsQuestionSelect
              v-model="nextQuestionIdLocal"
              :logique="logique"
              :numbering="numbering"
              :current-question-id="question.id" />
          </div>
        </section>

        <!-- ── Section Informations ──────────────────────── -->
        <section class="space-y-1 px-4 py-4 text-xs text-slate-500 dark:text-slate-400">
          <h4 class="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Informations</h4>
          <div class="flex items-center justify-between">
            <span>ID question</span>
            <span class="font-mono" :title="question.id">{{ shortId }}…</span>
          </div>
          <div class="flex items-center justify-between">
            <span>Créée le</span>
            <span>{{ fmtDate(question.created_at) }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span>Modifiée le</span>
            <span>{{ fmtDate(question.updated_at) }}</span>
          </div>
        </section>
      </div>
    </template>

    <!-- ── Modal suppression question ───────────────────────────── -->
    <AppModal v-model="showConfirmDelete" size="sm">
      <template #header>
        <h3 class="text-base font-semibold text-slate-800 dark:text-white">Supprimer la question</h3>
      </template>
      <p class="text-sm text-slate-600 dark:text-slate-300">
        Supprimer la question <strong>« {{ question?.libelle }} »</strong> et toutes ses réponses ?
      </p>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button type="button" class="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700" @click="showConfirmDelete = false">Annuler</button>
          <button type="button" class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700" @click="confirmDelete">Supprimer</button>
        </div>
      </template>
    </AppModal>

    <!-- ── Modal suppression réponse ────────────────────────────── -->
    <AppModal :model-value="!!showConfirmDeleteResponse" size="sm" @update:model-value="(v) => !v && (showConfirmDeleteResponse = null)">
      <template #header>
        <h3 class="text-base font-semibold text-slate-800 dark:text-white">Retirer la réponse</h3>
      </template>
      <p class="text-sm text-slate-600 dark:text-slate-300">
        Retirer la réponse <strong>« {{ showConfirmDeleteResponse?.libelle }} »</strong> ?
      </p>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button type="button" class="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700" @click="showConfirmDeleteResponse = null">Annuler</button>
          <button type="button" class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700" @click="confirmDeleteResponse">Retirer</button>
        </div>
      </template>
    </AppModal>

    <!-- ── Search overlay ───────────────────────────────────────── -->
    <Teleport to="body">
      <Transition enter-active-class="duration-150 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100"
        leave-active-class="duration-100 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
        <div v-if="searchPanel.open" class="fixed inset-0 z-150 flex items-end justify-center p-4 sm:items-center">
          <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" @click="closeSearch"></div>
          <div class="relative flex max-h-[70vh] w-full max-w-lg flex-col overflow-hidden rounded-lg bg-white shadow-2xl dark:bg-slate-800">
            <div class="flex items-center gap-2 border-b border-slate-200 px-4 py-3 dark:border-slate-700">
              <Icon :name="searchPanel.mode === 'article' ? 'lucide:package' : 'lucide:layers'" size="16" class="text-slate-400" />
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
                  :placeholder="searchPanel.mode === 'article' ? 'Symbole ou désignation…' : 'Nom d\'ensemble…'"
                  class="w-full rounded-md border border-slate-200 bg-white py-1.5 pl-8 pr-2 text-sm text-slate-700 outline-none focus:border-secondary-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200" />
              </div>
            </div>
            <div class="flex-1 overflow-y-auto p-2">
              <div v-if="searchPanel.loading" class="flex items-center justify-center py-8">
                <div class="h-5 w-5 animate-spin rounded-full border-2 border-secondary-500 border-t-transparent"></div>
              </div>
              <div v-else-if="searchPanel.results.length === 0" class="py-8 text-center text-sm text-slate-400">
                <template v-if="searchPanel.mode === 'article' && (searchPanel.query || '').trim().length < 2">Tape au moins 2 caractères…</template>
                <template v-else>Aucun résultat</template>
              </div>
              <ul v-else class="space-y-1">
                <li
                  v-for="item in searchPanel.results"
                  :key="item.id || item.numero_symbole"
                  class="flex items-center gap-1.5 rounded pr-1 transition hover:bg-secondary-50 dark:hover:bg-secondary-900/20">
                  <button
                    type="button"
                    class="flex min-w-0 flex-1 items-center gap-2 rounded px-2 py-2 text-left text-sm text-slate-700 dark:text-slate-200"
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
                  </button>
                  <input
                    :value="qtyFor(item)"
                    type="number"
                    min="0"
                    step="any"
                    title="Quantité"
                    class="w-14 flex-none rounded-md border border-slate-200 bg-white px-1.5 py-1 text-center text-sm text-slate-700 outline-none focus:border-secondary-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
                    @input="setQty(item, $event.target.value)"
                    @keyup.enter="attachItem(item)" />
                  <button
                    type="button"
                    title="Ajouter"
                    class="flex-none rounded-md bg-secondary-600 p-1.5 text-white transition hover:bg-secondary-700"
                    @click="attachItem(item)">
                    <Icon name="lucide:plus" size="14" />
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </aside>
</template>
