<script setup>
const props = defineProps({
  existingSymboles: { type: Array, default: () => [] },
  existingEnsembleIds: { type: Array, default: () => [] },
  articlesOnly: { type: Boolean, default: false },
  excludeId: { type: String, default: null }, // empêche d'ajouter un ensemble à lui-même
  targetLabel: { type: String, default: null }, // affiché quand on ajoute à un sous-nœud
})
const emit = defineEmits(['add', 'add-ensemble'])

const { searchCatalogue } = useCommandesMatieres()
const { getEnsembles } = useEnsemblesMatieres()

// ─── Onglets ──────────────────────────────────────────────────────────────────
const activeTab = ref('articles')

// ─── Articles ─────────────────────────────────────────────────────────────────
const query = ref('')
const results = ref([])
const loading = ref(false)
const searchDebounce = ref(null)

const quantities = reactive({})
const getQty = (symbole) => quantities[symbole] ?? 1
const setQty = (symbole, val) => {
  const n = parseFloat(val)
  quantities[symbole] = isNaN(n) || n < 0 ? 0 : n
}

watch(query, (val) => {
  clearTimeout(searchDebounce.value)
  if (!val || val.trim().length < 2) {
    results.value = []
    return
  }
  loading.value = true
  searchDebounce.value = setTimeout(async () => {
    results.value = await searchCatalogue(val)
    loading.value = false
  }, 300)
})

const isAlreadyAdded = (symbole) => props.existingSymboles?.includes(symbole)

// ─── Ensembles ────────────────────────────────────────────────────────────────
const ensembles = ref([])
const loadingEnsembles = ref(false)
const queryEnsembles = ref('')

const ensemblesFiltres = computed(() => {
  const q = queryEnsembles.value.trim().toLowerCase()
  const list = ensembles.value.filter((e) => e.id !== props.excludeId)
  if (!q) return list
  return list.filter((e) =>
    e.nom.toLowerCase().includes(q) || e.description?.toLowerCase().includes(q)
  )
})

const isEnsembleAdded = (id) => props.existingEnsembleIds?.includes(id)

watch(activeTab, async (tab) => {
  if (tab === 'ensembles' && ensembles.value.length === 0) {
    loadingEnsembles.value = true
    ensembles.value = await getEnsembles()
    loadingEnsembles.value = false
  }
})

// ─── Formatage ────────────────────────────────────────────────────────────────
const fmt = (v) => {
  if (v == null) return '—'
  return Number(v).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
</script>

<template>
  <div class="flex h-full w-80 flex-none flex-col border-l border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
    <!-- Header -->
    <div class="border-b border-gray-200 px-4 pt-4 dark:border-gray-700">
      <div class="mb-3 flex items-center gap-2">
        <div class="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
          <Icon name="lucide:package-search" size="16" class="text-blue-600 dark:text-blue-400" />
        </div>
        <div class="min-w-0 flex-1">
          <h2 class="text-base font-semibold text-gray-800 dark:text-white">Ajouter</h2>
          <p v-if="targetLabel" class="truncate text-sm text-indigo-500 dark:text-indigo-400" :title="targetLabel">
            dans « {{ targetLabel }} »
          </p>
          <p v-else class="text-sm text-gray-400">Article ou ensemble</p>
        </div>
      </div>
      <!-- Onglets (masqués si articlesOnly) -->
      <div v-if="!articlesOnly" class="flex gap-1">
        <button
          type="button"
          class="flex-1 rounded-t-lg px-3 py-2 text-sm font-semibold transition"
          :class="activeTab === 'articles'
            ? 'bg-white text-blue-600 shadow-sm dark:bg-gray-800 dark:text-blue-400'
            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'"
          @click="activeTab = 'articles'"
        >
          <Icon name="lucide:package" size="13" class="mr-1 inline" />
          Articles
        </button>
        <button
          type="button"
          class="flex-1 rounded-t-lg px-3 py-2 text-sm font-semibold transition"
          :class="activeTab === 'ensembles'
            ? 'bg-white text-blue-600 shadow-sm dark:bg-gray-800 dark:text-blue-400'
            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'"
          @click="activeTab = 'ensembles'"
        >
          <Icon name="lucide:layers" size="13" class="mr-1 inline" />
          Ensembles
        </button>
      </div>
    </div>

    <!-- ── Onglet Articles ─────────────────────────────────────────────────── -->
    <template v-if="activeTab === 'articles'">
      <div class="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
        <div class="relative">
          <Icon name="lucide:search" size="14" class="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
          <input
            v-model="query"
            type="text"
            placeholder="N° symbole ou description…"
            class="w-full rounded-lg border border-gray-200 bg-white py-2 pr-8 pl-8 text-base text-gray-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
          <button
            v-if="query"
            type="button"
            class="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-gray-400 hover:text-gray-600"
            @click="query = ''"
          >
            <Icon name="lucide:x" size="13" />
          </button>
        </div>
        <p class="mt-1 text-sm text-gray-400">Minimum 2 caractères</p>
      </div>

      <div class="flex-1 overflow-y-auto px-3 py-3">
        <div v-if="loading" class="flex items-center justify-center py-10">
          <div class="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
        </div>

        <div
          v-else-if="!query || query.trim().length < 2"
          class="flex flex-col items-center gap-2 py-10 text-center text-base text-gray-400"
        >
          <Icon name="lucide:package" size="32" class="opacity-40" />
          <span>Saisissez un numéro de symbole<br />ou une description</span>
        </div>

        <div
          v-else-if="results.length === 0"
          class="flex flex-col items-center gap-2 py-10 text-center text-base text-gray-400"
        >
          <Icon name="lucide:search-x" size="32" class="opacity-40" />
          <span>Aucun article trouvé<br />pour « {{ query }} »</span>
        </div>

        <template v-else>
          <p class="mb-2 text-sm text-gray-400">{{ results.length }} résultat{{ results.length > 1 ? 's' : '' }}</p>
          <ul class="space-y-2">
            <li
              v-for="article in results"
              :key="article.numero_symbole"
              class="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
            >
              <div class="mb-2">
                <div class="flex flex-wrap items-center gap-1.5">
                  <span class="font-mono text-sm font-bold text-blue-600 dark:text-blue-400">
                    {{ article.numero_symbole }}
                  </span>
                  <span
                    v-if="article.unite_distribution"
                    class="rounded bg-gray-100 px-1.5 py-0.5 text-sm text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                  >
                    {{ article.unite_distribution }}
                  </span>
                </div>
                <p class="mt-0.5 text-sm leading-snug text-gray-700 dark:text-gray-200">
                  {{ article.description }}
                </p>
                <div class="mt-1 flex items-center gap-2 text-sm text-gray-400">
                  <span v-if="article.famille" class="truncate">{{ article.famille }}</span>
                  <span v-if="article.prix_ud" class="ml-auto flex-none font-medium text-gray-600 dark:text-gray-300">
                    {{ fmt(article.prix_ud) }} €
                  </span>
                </div>
              </div>

              <div v-if="!isAlreadyAdded(article.numero_symbole)" class="flex items-center gap-2">
                <div class="flex flex-1 items-center rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-700">
                  <button
                    type="button"
                    class="flex h-7 w-7 flex-none items-center justify-center rounded-l-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600"
                    @click="setQty(article.numero_symbole, getQty(article.numero_symbole) - 1)"
                  >
                    <Icon name="lucide:minus" size="12" />
                  </button>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    :value="getQty(article.numero_symbole)"
                    class="w-full bg-transparent py-1 text-center text-sm text-gray-800 outline-none dark:text-white"
                    @change="setQty(article.numero_symbole, $event.target.value)"
                  />
                  <button
                    type="button"
                    class="flex h-7 w-7 flex-none items-center justify-center rounded-r-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600"
                    @click="setQty(article.numero_symbole, getQty(article.numero_symbole) + 1)"
                  >
                    <Icon name="lucide:plus" size="12" />
                  </button>
                </div>
                <button
                  type="button"
                  class="flex h-7 flex-none items-center gap-1 rounded-lg bg-blue-600 px-3 text-sm font-medium text-white transition hover:bg-blue-700"
                  @click="emit('add', { article, quantite: getQty(article.numero_symbole) })"
                >
                  <Icon name="lucide:plus" size="13" />
                  Ajouter
                </button>
              </div>

              <div v-else class="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400">
                <Icon name="lucide:check-circle" size="14" />
                Déjà dans la liste
              </div>
            </li>
          </ul>
        </template>
      </div>
    </template>

    <!-- ── Onglet Ensembles ───────────────────────────────────────────────── -->
    <template v-else>
      <!-- Recherche -->
      <div class="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
        <div class="relative">
          <Icon name="lucide:search" size="14" class="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
          <input
            v-model="queryEnsembles"
            type="text"
            placeholder="Rechercher un ensemble…"
            class="w-full rounded-lg border border-gray-200 bg-white py-2 pr-8 pl-8 text-base text-gray-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
          <button
            v-if="queryEnsembles"
            type="button"
            class="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-gray-400 hover:text-gray-600"
            @click="queryEnsembles = ''"
          >
            <Icon name="lucide:x" size="13" />
          </button>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto px-3 py-3">
        <div v-if="loadingEnsembles" class="flex items-center justify-center py-10">
          <div class="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
        </div>

        <div
          v-else-if="ensemblesFiltres.length === 0"
          class="flex flex-col items-center gap-2 py-10 text-center text-base text-gray-400"
        >
          <Icon name="lucide:layers" size="32" class="opacity-40" />
          <span v-if="ensembles.length === 0">Aucun ensemble disponible<br />Créez-en dans les paramètres</span>
          <span v-else>Aucun résultat pour « {{ queryEnsembles }} »</span>
        </div>

        <template v-else>
          <p class="mb-2 text-sm text-gray-400">{{ ensemblesFiltres.length }} ensemble{{ ensemblesFiltres.length > 1 ? 's' : '' }}</p>
          <ul class="space-y-2">
            <li
              v-for="ensemble in ensemblesFiltres"
              :key="ensemble.id"
              class="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
            >
              <div class="mb-2">
                <div class="flex items-start justify-between gap-2">
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-base font-semibold text-gray-800 dark:text-white">{{ ensemble.nom }}</p>
                    <p v-if="ensemble.description" class="mt-0.5 text-sm text-gray-400">{{ ensemble.description }}</p>
                  </div>
                  <span class="flex-none rounded-full bg-blue-50 px-2 py-0.5 text-sm font-medium text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                    {{ ensemble.nb_articles }} art.
                  </span>
                </div>
              </div>

              <div v-if="!isEnsembleAdded(ensemble.id)">
                <button
                  type="button"
                  class="flex w-full items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-blue-700"
                  @click="emit('add-ensemble', { ensemble })"
                >
                  <Icon name="lucide:layers" size="13" />
                  Ajouter l'ensemble
                </button>
              </div>

              <div v-else class="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400">
                <Icon name="lucide:check-circle" size="14" />
                Déjà ajouté
              </div>
            </li>
          </ul>
        </template>
      </div>
    </template>
  </div>
</template>
