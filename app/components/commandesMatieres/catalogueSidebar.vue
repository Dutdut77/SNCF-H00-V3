<script setup>
const props = defineProps({
  existingSymboles: { type: Array, default: () => [] },
  existingEnsembleIds: { type: Array, default: () => [] },
  articlesOnly: { type: Boolean, default: false },
  excludeId: { type: String, default: null }, // empêche d'ajouter un ensemble à lui-même
  targetLabel: { type: String, default: null }, // affiché quand on ajoute à un sous-nœud
  metier: { type: String, default: null }, // restreint les ensembles proposés à un métier
})
const emit = defineEmits(['add', 'add-ensemble'])

const { searchCatalogue } = useCommandesMatieres()
const { getEnsembles, getCategories, categoriePalette } = useEnsemblesMatieres()

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

// ─── Ensembles (regroupés par catégorie) ──────────────────────────────────────
const ensembles = ref([])
const categories = ref([])
const loadingEnsembles = ref(false)
const queryEnsembles = ref('')
const expandedCats = ref(new Set()) // ids de catégories dépliées (tout replié par défaut)
const UNCAT = '__none__'

// Liste filtrée par la recherche, puis groupée par catégorie (ordre des catégories,
// « Sans catégorie » en dernier). Chaque groupe porte sa pastille de palette.
const groupedEnsembles = computed(() => {
  const q = queryEnsembles.value.trim().toLowerCase()
  const filtered = ensembles.value
    .filter((e) => e.id !== props.excludeId)
    .filter((e) => !q || e.nom.toLowerCase().includes(q) || e.description?.toLowerCase().includes(q))

  const byCat = new Map()
  for (const e of filtered) {
    const key = e.categorie_id || UNCAT
    if (!byCat.has(key)) byCat.set(key, [])
    byCat.get(key).push(e)
  }

  const groups = []
  categories.value.forEach((c, i) => {
    const items = byCat.get(c.id)
    if (items?.length) groups.push({ id: c.id, nom: c.nom, palette: categoriePalette(i), items })
  })
  const uncat = byCat.get(UNCAT)
  if (uncat?.length) groups.push({ id: UNCAT, nom: 'Sans catégorie', palette: null, items: uncat })
  return groups
})

const totalFiltres = computed(() => groupedEnsembles.value.reduce((n, g) => n + g.items.length, 0))

// Une catégorie est ouverte si on cherche (tout est déplié) ou si elle a été dépliée.
const isCatOpen = (id) => queryEnsembles.value.trim() !== '' || expandedCats.value.has(id)
const toggleCat = (id) => {
  const next = new Set(expandedCats.value)
  next.has(id) ? next.delete(id) : next.add(id)
  expandedCats.value = next
}

const isEnsembleAdded = (id) => props.existingEnsembleIds?.includes(id)

const loadEnsembles = async () => {
  loadingEnsembles.value = true
  ;[ensembles.value, categories.value] = await Promise.all([
    getEnsembles(props.metier),
    getCategories(props.metier),
  ])
  loadingEnsembles.value = false
}

watch(activeTab, (tab) => {
  if (tab === 'ensembles' && ensembles.value.length === 0) loadEnsembles()
})

// Recharger si le métier change pendant que l'onglet ensembles est déjà ouvert.
watch(() => props.metier, () => {
  if (activeTab.value === 'ensembles') loadEnsembles()
})

// ─── Formatage ────────────────────────────────────────────────────────────────
const fmt = (v) => {
  if (v == null) return '—'
  return Number(v).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
</script>

<template>
  <div class="flex h-full w-80 flex-none flex-col border-l border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900">
    <!-- Header -->
    <div class="border-b border-slate-200 px-4 pt-4 dark:border-slate-700">
      <div class="mb-3 flex items-center gap-2">
        <div class="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-secondary-100 dark:bg-secondary-900/30">
          <Icon name="lucide:package-search" size="16" class="text-secondary-600 dark:text-secondary-400" />
        </div>
        <div class="min-w-0 flex-1">
          <h2 class="text-base font-semibold text-slate-800 dark:text-white">Ajouter</h2>
          <p v-if="targetLabel" class="truncate text-sm text-indigo-500 dark:text-indigo-400" :title="targetLabel">
            dans « {{ targetLabel }} »
          </p>
          <p v-else class="text-sm text-slate-400">Article ou ensemble</p>
        </div>
      </div>
      <!-- Onglets (masqués si articlesOnly) -->
      <div v-if="!articlesOnly" class="flex gap-1">
        <button
          type="button"
          class="flex-1 rounded-t-lg px-3 py-2 text-sm font-semibold transition"
          :class="activeTab === 'articles'
            ? 'bg-white text-secondary-600 shadow-sm dark:bg-slate-800 dark:text-secondary-400'
            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'"
          @click="activeTab = 'articles'"
        >
          <Icon name="lucide:package" size="13" class="mr-1 inline" />
          Articles
        </button>
        <button
          type="button"
          class="flex-1 rounded-t-lg px-3 py-2 text-sm font-semibold transition"
          :class="activeTab === 'ensembles'
            ? 'bg-white text-secondary-600 shadow-sm dark:bg-slate-800 dark:text-secondary-400'
            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'"
          @click="activeTab = 'ensembles'"
        >
          <Icon name="lucide:layers" size="13" class="mr-1 inline" />
          Ensembles
        </button>
      </div>
    </div>

    <!-- ── Onglet Articles ─────────────────────────────────────────────────── -->
    <template v-if="activeTab === 'articles'">
      <div class="border-b border-slate-200 px-4 py-3 dark:border-slate-700">
        <div class="relative">
          <Icon name="lucide:search" size="14" class="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
          <input
            v-model="query"
            type="text"
            placeholder="N° symbole ou description…"
            class="w-full rounded-lg border border-slate-200 bg-white py-2 pr-8 pl-8 text-base text-slate-800 outline-none transition focus:border-secondary-400 focus:ring-2 focus:ring-secondary-100 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
          />
          <button
            v-if="query"
            type="button"
            class="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600"
            @click="query = ''"
          >
            <Icon name="lucide:x" size="13" />
          </button>
        </div>
        <p class="mt-1 text-sm text-slate-400">Minimum 2 caractères</p>
      </div>

      <div class="flex-1 overflow-y-auto px-3 py-3">
        <div v-if="loading" class="flex items-center justify-center py-10">
          <div class="h-5 w-5 animate-spin rounded-full border-2 border-secondary-500 border-t-transparent"></div>
        </div>

        <div
          v-else-if="!query || query.trim().length < 2"
          class="flex flex-col items-center gap-2 py-10 text-center text-base text-slate-400"
        >
          <Icon name="lucide:package" size="32" class="opacity-40" />
          <span>Saisissez un numéro de symbole<br />ou une description</span>
        </div>

        <div
          v-else-if="results.length === 0"
          class="flex flex-col items-center gap-2 py-10 text-center text-base text-slate-400"
        >
          <Icon name="lucide:search-x" size="32" class="opacity-40" />
          <span>Aucun article trouvé<br />pour « {{ query }} »</span>
        </div>

        <template v-else>
          <p class="mb-2 text-sm text-slate-400">{{ results.length }} résultat{{ results.length > 1 ? 's' : '' }}</p>
          <ul class="space-y-2">
            <li
              v-for="article in results"
              :key="article.numero_symbole"
              class="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800"
            >
              <div class="mb-2">
                <div class="flex flex-wrap items-center gap-1.5">
                  <span class="font-mono text-sm font-bold text-secondary-600 dark:text-secondary-400">
                    {{ article.numero_symbole }}
                  </span>
                  <span
                    v-if="article.unite_distribution"
                    class="rounded bg-slate-100 px-1.5 py-0.5 text-sm text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                  >
                    {{ article.unite_distribution }}
                  </span>
                </div>
                <p class="mt-0.5 text-sm leading-snug text-slate-700 dark:text-slate-200">
                  {{ article.description }}
                </p>
                <div class="mt-1 flex items-center gap-2 text-sm text-slate-400">
                  <span v-if="article.famille" class="truncate">{{ article.famille }}</span>
                  <span v-if="article.prix_ud" class="ml-auto flex-none font-medium text-slate-600 dark:text-slate-300">
                    {{ fmt(article.prix_ud) }} €
                  </span>
                </div>
              </div>

              <div v-if="!isAlreadyAdded(article.numero_symbole)" class="flex items-center gap-2">
                <div class="flex flex-1 items-center rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-600 dark:bg-slate-700">
                  <button
                    type="button"
                    class="flex h-7 w-7 flex-none items-center justify-center rounded-l-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600"
                    @click="setQty(article.numero_symbole, getQty(article.numero_symbole) - 1)"
                  >
                    <Icon name="lucide:minus" size="12" />
                  </button>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    :value="getQty(article.numero_symbole)"
                    class="w-full bg-transparent py-1 text-center text-sm text-slate-800 outline-none dark:text-white"
                    @change="setQty(article.numero_symbole, $event.target.value)"
                  />
                  <button
                    type="button"
                    class="flex h-7 w-7 flex-none items-center justify-center rounded-r-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600"
                    @click="setQty(article.numero_symbole, getQty(article.numero_symbole) + 1)"
                  >
                    <Icon name="lucide:plus" size="12" />
                  </button>
                </div>
                <button
                  type="button"
                  class="flex h-7 flex-none items-center gap-1 rounded-lg bg-secondary-600 px-3 text-sm font-medium text-white transition hover:bg-secondary-700"
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
      <div class="border-b border-slate-200 px-4 py-3 dark:border-slate-700">
        <div class="relative">
          <Icon name="lucide:search" size="14" class="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
          <input
            v-model="queryEnsembles"
            type="text"
            placeholder="Rechercher un ensemble…"
            class="w-full rounded-lg border border-slate-200 bg-white py-2 pr-8 pl-8 text-base text-slate-800 outline-none transition focus:border-secondary-400 focus:ring-2 focus:ring-secondary-100 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
          />
          <button
            v-if="queryEnsembles"
            type="button"
            class="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600"
            @click="queryEnsembles = ''"
          >
            <Icon name="lucide:x" size="13" />
          </button>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto px-3 py-3">
        <div v-if="loadingEnsembles" class="flex items-center justify-center py-10">
          <div class="h-5 w-5 animate-spin rounded-full border-2 border-secondary-500 border-t-transparent"></div>
        </div>

        <div
          v-else-if="totalFiltres === 0"
          class="flex flex-col items-center gap-2 py-10 text-center text-base text-slate-400"
        >
          <Icon name="lucide:layers" size="32" class="opacity-40" />
          <span v-if="ensembles.length === 0">Aucun ensemble disponible<br />Créez-en dans les paramètres</span>
          <span v-else>Aucun résultat pour « {{ queryEnsembles }} »</span>
        </div>

        <template v-else>
          <p class="mb-2 text-sm text-slate-400">
            {{ totalFiltres }} ensemble{{ totalFiltres > 1 ? 's' : '' }} · {{ groupedEnsembles.length }} catégorie{{ groupedEnsembles.length > 1 ? 's' : '' }}
          </p>

          <!-- Un accordéon par catégorie -->
          <div class="space-y-2">
            <div
              v-for="group in groupedEnsembles"
              :key="group.id"
              class="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700"
            >
              <!-- En-tête de catégorie (repliable) -->
              <button
                type="button"
                class="flex w-full items-center gap-2 px-3 py-2 text-left transition hover:bg-slate-100 dark:hover:bg-slate-800"
                :class="group.palette ? group.palette.hdrBg : 'bg-slate-100 dark:bg-slate-800'"
                @click="toggleCat(group.id)"
              >
                <span class="h-2.5 w-2.5 flex-none rounded-full" :class="group.palette ? group.palette.dot : 'bg-slate-400'" />
                <span class="min-w-0 flex-1 truncate text-sm font-semibold" :class="group.palette ? group.palette.text : 'text-slate-600 dark:text-slate-300'">
                  {{ group.nom }}
                </span>
                <span class="flex-none rounded-full bg-white/70 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-900/40 dark:text-slate-300">
                  {{ group.items.length }}
                </span>
                <Icon
                  name="lucide:chevron-down"
                  size="16"
                  class="flex-none text-slate-400 transition-transform duration-200"
                  :class="isCatOpen(group.id) ? '' : '-rotate-90'"
                />
              </button>

              <!-- Liste des ensembles de la catégorie -->
              <ul v-show="isCatOpen(group.id)" class="divide-y divide-slate-100 dark:divide-slate-700/60">
                <li
                  v-for="ensemble in group.items"
                  :key="ensemble.id"
                  class="group/ens flex items-center gap-2 px-3 py-2"
                >
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-medium text-slate-700 dark:text-slate-200">{{ ensemble.nom }}</p>
                    <p class="truncate text-xs text-slate-400">
                      {{ ensemble.nb_articles }} art.<template v-if="ensemble.description"> · {{ ensemble.description }}</template>
                    </p>
                  </div>

                  <!-- Déjà ajouté : pastille verte discrète -->
                  <Icon
                    v-if="isEnsembleAdded(ensemble.id)"
                    name="lucide:check"
                    size="16"
                    class="flex-none text-green-500"
                    title="Déjà ajouté"
                  />
                  <!-- Sinon : petit bouton + -->
                  <button
                    v-else
                    type="button"
                    class="flex h-6 w-6 flex-none items-center justify-center rounded-md text-secondary-600 transition hover:bg-secondary-600 hover:text-white dark:text-secondary-400"
                    title="Ajouter l'ensemble"
                    @click="emit('add-ensemble', { ensemble })"
                  >
                    <Icon name="lucide:plus" size="15" />
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </template>
      </div>
    </template>
  </div>
</template>
