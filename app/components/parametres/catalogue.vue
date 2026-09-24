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

const filtresOrigine = computed(() => [
  { id: null, label: 'Tous', count: fmtNombre(stats.value.supplyChain + stats.value.contratCadre) },
  { id: 'supply_chain', label: 'Symbolisés', dot: 'bg-taupe-400', count: fmtNombre(stats.value.supplyChain) },
  { id: 'contrat_cadre', label: 'Contrats cadres', dot: 'bg-ochre-400', count: fmtNombre(stats.value.contratCadre) }
])

// ─── Chargement ───────────────────────────────────────────────────────────────
const loadPage = async () => {
  loading.value = true
  const { rows: data, count } = await getPage({
    page: page.value,
    pageSize,
    search: search.value,
    origine: filtreOrigine.value
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

function fmtNombre(v) {
  return Number(v ?? 0).toLocaleString('fr-FR')
}

// Étiquette du symbole : taupe pour un article symbolisé, ocre pour un contrat cadre
const symboleBadge = (origine) =>
  origine === 'contrat_cadre'
    ? 'rounded bg-ochre-100 px-2 py-0.5 text-xs font-semibold whitespace-nowrap text-ochre-700 tabular-nums ring-1 ring-ochre-300/60 ring-inset dark:bg-ochre-400/14 dark:text-ochre-300 dark:ring-0'
    : ETIQUETTE_TAUPE
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col gap-4 p-4 lg:px-8 lg:pt-4 lg:pb-4">
    <!-- Synthèse -->
    <div class="grid grid-cols-2 gap-3 xl:grid-cols-3">
      <div class="surface-card rounded-xl p-4">
        <p class="text-ink flex items-center gap-2 text-sm font-semibold">
          <span class="size-2 rounded-full bg-taupe-400" />
          Articles symbolisés
        </p>
        <p class="font-traverse text-ink mt-1 text-[1.75rem] leading-none tracking-[0.02em]">
          {{ fmtNombre(stats.supplyChain) }}
        </p>
      </div>
      <div class="surface-card rounded-xl p-4">
        <p class="text-ink flex items-center gap-2 text-sm font-semibold">
          <span class="bg-ochre-400 size-2 rounded-full" />
          Contrats cadres
        </p>
        <p class="font-traverse text-ink mt-1 text-[1.75rem] leading-none tracking-[0.02em]">
          {{ fmtNombre(stats.contratCadre) }}
        </p>
      </div>
      <div class="surface-card col-span-2 rounded-xl p-4 xl:col-span-1">
        <p class="text-ink text-sm font-semibold">Dernière mise à jour</p>
        <p class="text-ink mt-1.5 text-lg leading-tight font-semibold">{{ fmtDate(stats.lastUpdate) }}</p>
      </div>
    </div>

    <!-- Barre d'outils, puis le filtre par origine sur sa ligne -->
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
      <AppInputSearch
        v-model="search"
        boxed
        dense
        class="w-full sm:max-w-sm"
        placeholder="Rechercher un symbole ou une description…" />
      <AppButtonValidated theme="brand" type="button" class="shrink-0 sm:ml-auto" @click="showImport = true">
        <template #default>
          <span class="flex items-center gap-2">
            <Icon name="lucide:file-up" size="16" />
            Importer un fichier
          </span>
        </template>
      </AppButtonValidated>
    </div>

    <AppFilterPills v-model="filtreOrigine" :options="filtresOrigine" label="Filtrer par origine" />

    <!-- Tableau : défile dans la carte, pagination en pied -->
    <div class="surface-card flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl max-lg:max-h-[75vh]">
      <div class="min-h-0 flex-1 overflow-auto">
        <table class="w-full min-w-max text-sm">
          <thead :class="TABLEAU_TETE">
            <tr>
              <th class="px-4 py-2.5 text-left">N° symbole</th>
              <th class="px-4 py-2.5 text-left">Description</th>
              <th class="px-4 py-2.5 text-center">UD</th>
              <th class="px-4 py-2.5 text-right">Prix UD</th>
              <th class="px-4 py-2.5 text-center">Origine</th>
              <th class="w-14 px-4 py-2.5"><span class="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody :class="TABLEAU_CORPS">
            <tr
              v-for="article in loading ? [] : rows"
              :key="article.numero_symbole"
              :class="TABLEAU_LIGNE"
              @click="editing = article">
              <td class="px-4 py-2.5">
                <span :class="symboleBadge(article.origine)">{{ article.numero_symbole }}</span>
              </td>
              <td class="px-4 py-2.5">
                <p class="text-ink font-medium">{{ article.description || '—' }}</p>
                <p v-if="article.famille" class="text-ink-soft mt-0.5 text-xs">{{ article.famille }}</p>
              </td>
              <td class="px-4 py-2.5 text-center">
                <span
                  v-if="article.unite_distribution"
                  class="text-ink-soft rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium dark:bg-white/8">
                  {{ article.unite_distribution }}
                </span>
                <span v-else class="text-slate-300 dark:text-white/25">—</span>
              </td>
              <td class="text-ink px-4 py-2.5 text-right tabular-nums">{{ fmtPrix(article.prix_ud) }}</td>
              <td class="text-ink-soft px-4 py-2.5 text-center text-xs font-medium">
                {{ origineLabel(article.origine) }}
              </td>
              <td class="px-4 py-2">
                <button type="button" :class="BOUTON_ICONE" title="Modifier l'article" @click.stop="editing = article">
                  <Icon name="lucide:pencil" size="16" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="loading" class="flex justify-center p-10">
          <Icon name="lucide:loader-circle" size="24" class="text-magenta-600 animate-spin" />
        </div>
        <div v-else-if="!rows.length" class="text-ink-soft flex flex-col items-center gap-2 p-10 text-sm">
          <Icon name="lucide:package-search" size="28" class="opacity-40" />
          Aucun article trouvé
        </div>
      </div>

      <!-- Pagination -->
      <div class="border-rule flex flex-wrap items-center justify-between gap-3 border-t px-4 py-2.5">
        <p class="text-ink-soft text-xs">{{ fmtNombre(totalCount) }} article{{ totalCount > 1 ? 's' : '' }}</p>
        <div class="flex items-center gap-2">
          <button
            type="button"
            :disabled="page <= 1 || loading"
            :class="BOUTON_ICONE"
            class="disabled:cursor-default disabled:opacity-35 disabled:hover:bg-transparent"
            aria-label="Page précédente"
            @click="page--">
            <Icon name="lucide:chevron-left" size="16" />
          </button>
          <span class="text-ink-soft text-xs tabular-nums">Page {{ page }} sur {{ totalPages }}</span>
          <button
            type="button"
            :disabled="page >= totalPages || loading"
            :class="BOUTON_ICONE"
            class="disabled:cursor-default disabled:opacity-35 disabled:hover:bg-transparent"
            aria-label="Page suivante"
            @click="page++">
            <Icon name="lucide:chevron-right" size="16" />
          </button>
        </div>
      </div>
    </div>

    <!-- Fiche article et import -->
    <CatalogueMatieresEditModal :article="editing" :unites="unites" @saved="onSaved" @close="editing = null" />
    <CatalogueMatieresImportModal :open="showImport" @imported="onImported" @close="showImport = false" />
  </div>
</template>
