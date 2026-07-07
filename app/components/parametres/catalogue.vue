<script setup>
const { getStats, getPage, getUnites, origineLabel } = useCatalogue()

// ─── État ─────────────────────────────────────────────────────────────────────
const stats = ref({ supplyChain: 0, contratCadre: 0, lastUpdate: null })
const rows = ref([])
const totalCount = ref(0)
const page = ref(1)
const pageSize = 50
const search = ref('')
const filtreOrigine = ref(null) // null = toutes
const loading = ref(false)
const unites = ref([])

const showImport = ref(false)
const editing = ref(null)

const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize)))
const hasSearch = computed(() => search.value.trim().length > 0)

const FILTRES_ORIGINE = [
  { id: null, label: 'Tous' },
  { id: 'supply_chain', label: 'Symbolisés' },
  { id: 'contrat_cadre', label: 'Contrats cadres' },
]

// ─── Chargement ───────────────────────────────────────────────────────────────
const loadPage = async () => {
  loading.value = true
  const { rows: data, count } = await getPage({
    page: page.value,
    pageSize,
    search: search.value,
    origine: filtreOrigine.value,
  })
  rows.value = data
  totalCount.value = count
  loading.value = false
}

const loadStats = async () => {
  stats.value = await getStats()
}

let searchTimer = null
watch(search, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    page.value = 1
    loadPage()
  }, 300)
})

watch(filtreOrigine, () => {
  page.value = 1
  loadPage()
})

watch(page, loadPage)

onMounted(async () => {
  await Promise.all([loadStats(), loadPage()])
  unites.value = await getUnites()
})

const refreshAll = () => {
  loadStats()
  loadPage()
}

// ─── Callbacks modales ────────────────────────────────────────────────────────
const onSaved = (updated) => {
  const idx = rows.value.findIndex((r) => r.numero_symbole === updated.numero_symbole)
  if (idx !== -1) rows.value[idx] = { ...rows.value[idx], ...updated }
  editing.value = null
  loadStats() // l'origine ou la date de maj peuvent avoir changé
}

const onImported = () => {
  showImport.value = false
  refreshAll()
}

// ─── Formatage ────────────────────────────────────────────────────────────────
const fmtPrix = (v) => {
  if (v == null) return '—'
  return Number(v).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}

const fmtDate = (v) => {
  if (!v) return '—'
  return new Date(v).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

const fmtNombre = (v) => Number(v ?? 0).toLocaleString('fr-FR')

// Badge symbole : ambre pour contrat cadre, teal pour symbolisé (cf. ensemblesMatieres/tableBody)
const symboleBadge = (origine) =>
  origine === 'contrat_cadre'
    ? 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:ring-amber-700/40'
    : 'bg-secondary-50 text-secondary-700 ring-secondary-100 dark:bg-secondary-900/20 dark:text-secondary-300 dark:ring-secondary-800/40'
</script>

<template>
  <div class="flex h-full flex-col overflow-hidden">
    <!-- Titre -->
    <div class="flex flex-none items-center justify-between gap-4 border-b border-slate-200 px-4 py-3 dark:border-slate-700">
      <AppTitleMain title="Catalogue articles" description="Base commune des articles symbolisés et contrats cadres" />
    </div>

    <div class="min-h-0 flex-1 overflow-auto bg-slate-50/50 dark:bg-slate-900/30">
      <!-- Stats -->
      <div class="grid grid-cols-1 gap-3 px-6 pt-6 sm:grid-cols-3">
        <div class="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
          <div class="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-secondary-100 dark:bg-secondary-900/30">
            <Icon name="lucide:package" size="20" class="text-secondary-600 dark:text-secondary-400" />
          </div>
          <div>
            <p class="text-lg font-semibold text-slate-800 dark:text-slate-100">{{ fmtNombre(stats.supplyChain) }}</p>
            <p class="text-xs text-slate-500 dark:text-slate-400">Articles symbolisés</p>
          </div>
        </div>
        <div class="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
          <div class="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
            <Icon name="lucide:file-badge" size="20" class="text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p class="text-lg font-semibold text-slate-800 dark:text-slate-100">{{ fmtNombre(stats.contratCadre) }}</p>
            <p class="text-xs text-slate-500 dark:text-slate-400">Contrats cadres</p>
          </div>
        </div>
        <div class="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
          <div class="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700">
            <Icon name="lucide:calendar-clock" size="20" class="text-slate-500 dark:text-slate-400" />
          </div>
          <div>
            <p class="text-lg font-semibold text-slate-800 dark:text-slate-100">{{ fmtDate(stats.lastUpdate) }}</p>
            <p class="text-xs text-slate-500 dark:text-slate-400">Dernière mise à jour</p>
          </div>
        </div>
      </div>

      <!-- Barre d'outils -->
      <div class="flex flex-wrap items-center justify-between gap-3 px-6 pt-5">
        <div class="flex flex-wrap items-center gap-3">
          <div class="relative w-full max-w-xs">
            <Icon name="lucide:search" size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              v-model="search"
              type="text"
              placeholder="Rechercher un symbole ou une description…"
              class="h-9 w-72 rounded-lg border border-slate-200 bg-white pl-9 pr-8 text-sm text-slate-700 outline-none transition focus:border-secondary-300 focus:ring-1 focus:ring-secondary-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            />
            <button
              v-if="hasSearch"
              type="button"
              class="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              title="Effacer"
              @click="search = ''"
            >
              <Icon name="lucide:x" size="14" />
            </button>
          </div>

          <!-- Filtre origine -->
          <div class="flex rounded-lg border border-slate-200 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-800">
            <button
              v-for="f in FILTRES_ORIGINE"
              :key="String(f.id)"
              type="button"
              class="rounded-md px-3 py-1.5 text-xs font-medium transition"
              :class="filtreOrigine === f.id
                ? 'bg-secondary-100 text-secondary-700 dark:bg-secondary-900/40 dark:text-secondary-300'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'"
              @click="filtreOrigine = f.id"
            >
              {{ f.label }}
            </button>
          </div>
        </div>

        <button
          type="button"
          class="flex h-9 items-center gap-1.5 rounded-lg bg-secondary-600 px-3 text-sm font-medium text-white transition hover:bg-secondary-700"
          @click="showImport = true"
        >
          <Icon name="lucide:file-up" size="14" /> Importer un fichier
        </button>
      </div>

      <!-- Tableau -->
      <div class="px-6 py-5">
        <div class="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-slate-50 dark:bg-slate-800">
                <tr class="border-b border-slate-200 dark:border-slate-700">
                  <th class="px-4 py-2.5 text-left text-xs font-semibold text-slate-400">N° Symbole</th>
                  <th class="px-4 py-2.5 text-left text-xs font-semibold text-slate-400">Description</th>
                  <th class="px-4 py-2.5 text-center text-xs font-semibold text-slate-400">UD</th>
                  <th class="px-4 py-2.5 text-right text-xs font-semibold text-slate-400">Prix UD</th>
                  <th class="px-4 py-2.5 text-center text-xs font-semibold text-slate-400">Origine</th>
                  <th class="w-12 px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-700/50">
                <tr v-if="loading">
                  <td colspan="6" class="px-4 py-10 text-center">
                    <div class="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-secondary-500 border-t-transparent" />
                  </td>
                </tr>
                <tr v-else-if="!rows.length">
                  <td colspan="6" class="px-4 py-10 text-center text-sm text-slate-400">
                    Aucun article trouvé
                  </td>
                </tr>
                <tr
                  v-for="(article, i) in loading ? [] : rows"
                  :key="article.numero_symbole"
                  class="group transition"
                  :class="i % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/50 dark:bg-slate-800/20'"
                >
                  <td class="px-4 py-2.5">
                    <span
                      class="inline-flex items-center rounded-md px-2 py-0.5 font-mono text-sm font-semibold ring-1"
                      :class="symboleBadge(article.origine)"
                    >
                      {{ article.numero_symbole }}
                    </span>
                  </td>
                  <td class="px-4 py-2.5">
                    <p class="text-sm font-medium text-slate-700 dark:text-slate-200">{{ article.description || '—' }}</p>
                    <p v-if="article.famille" class="mt-0.5 text-xs text-slate-400">{{ article.famille }}</p>
                  </td>
                  <td class="px-4 py-2.5 text-center">
                    <span class="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                      {{ article.unite_distribution || '—' }}
                    </span>
                  </td>
                  <td class="px-4 py-2.5 text-right text-sm text-slate-600 dark:text-slate-300">{{ fmtPrix(article.prix_ud) }}</td>
                  <td class="px-4 py-2.5 text-center">
                    <span
                      class="rounded-full px-2 py-0.5 text-xs font-medium"
                      :class="article.origine === 'contrat_cadre'
                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300'
                        : 'bg-secondary-50 text-secondary-700 dark:bg-secondary-900/20 dark:text-secondary-300'"
                    >
                      {{ origineLabel(article.origine) }}
                    </span>
                  </td>
                  <td class="px-4 py-2.5 text-center">
                    <button
                      type="button"
                      class="rounded p-1 text-slate-400 opacity-0 transition group-hover:opacity-100 hover:bg-slate-100 hover:text-secondary-600 dark:hover:bg-slate-700 dark:hover:text-secondary-400"
                      title="Modifier l'article"
                      @click="editing = article"
                    >
                      <Icon name="lucide:pencil" size="15" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="flex items-center justify-between border-t border-slate-200 px-4 py-2.5 dark:border-slate-700">
            <p class="text-xs text-slate-400">
              {{ fmtNombre(totalCount) }} article{{ totalCount > 1 ? 's' : '' }}
            </p>
            <div class="flex items-center gap-3">
              <button
                type="button"
                :disabled="page <= 1 || loading"
                class="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                @click="page--"
              >
                <Icon name="lucide:chevron-left" size="14" /> Précédent
              </button>
              <span class="text-xs text-slate-500 dark:text-slate-400">Page {{ page }} sur {{ totalPages }}</span>
              <button
                type="button"
                :disabled="page >= totalPages || loading"
                class="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                @click="page++"
              >
                Suivant <Icon name="lucide:chevron-right" size="14" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modales -->
    <CatalogueMatieresEditModal
      :article="editing"
      :unites="unites"
      @saved="onSaved"
      @close="editing = null"
    />
    <CatalogueMatieresImportModal
      :open="showImport"
      @imported="onImported"
      @close="showImport = false"
    />
  </div>
</template>
