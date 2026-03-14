<script setup>
definePageMeta({
  requiresAuth: true,
  requiredRole: 'admin'
})

useHead({
  title: 'H00 - Statistiques',
  description: 'Statistiques des chantiers'
})

const { getChantiers, getAllChantiers } = useChantiers()
const { getAllWeekends } = useTimeline()
const { getAllUsers, getUsersRltVoie, getUsersRltSes, getUsersRltCat, getUsersKvVoie, getUsersKvSes, getUsersKvCat } = useUsers()
const { setLoader } = useLoader()

const allWeekends = useState('allWeekends')

// Chargement des données
onMounted(async () => {
  setLoader(true)
  try {
    await Promise.all([getChantiers(), getAllWeekends(), getAllUsers()])
  } finally {
    setLoader(false)
  }
})

// --- DONNÉES CALCULÉES ---

// KPI : nombre d'utilisateurs par profil
const kpiRoles = computed(() => [
  { label: 'RLT Voie', count: getUsersRltVoie.value.length, color: 'text-sky-600' },
  { label: 'RLT SES', count: getUsersRltSes.value.length, color: 'text-indigo-600' },
  { label: 'RLT CAT', count: getUsersRltCat.value.length, color: 'text-violet-600' },
  { label: 'Contrôleur Voie', count: getUsersKvVoie.value.length, color: 'text-emerald-600' },
  { label: 'Contrôleur SES', count: getUsersKvSes.value.length, color: 'text-teal-600' },
  { label: 'Contrôleur CAT', count: getUsersKvCat.value.length, color: 'text-cyan-600' }
])

// Années disponibles
const allYears = computed(() => {
  const years = new Set()
  getAllChantiers.value.forEach((c) => {
    if (Array.isArray(c.date_rea)) {
      c.date_rea.forEach((p) => {
        if (p.date_start_travaux) years.add(new Date(p.date_start_travaux).getFullYear())
        if (p.date_end_travaux) years.add(new Date(p.date_end_travaux).getFullYear())
      })
    }
    if (Array.isArray(c.date_prepa)) {
      c.date_prepa.forEach((p) => {
        if (p.date_start_prepa) years.add(new Date(p.date_start_prepa).getFullYear())
        if (p.date_end_prepa) years.add(new Date(p.date_end_prepa).getFullYear())
      })
    }
  })
  return [...years].sort()
})

// Helper : un chantier est-il visible pour une année donnée
const isChantierInYear = (chantier, year) => {
  const inRea = chantier.date_rea?.some((p) => {
    const s = p.date_start_travaux ? new Date(p.date_start_travaux).getFullYear() : null
    const e = p.date_end_travaux ? new Date(p.date_end_travaux).getFullYear() : null
    return (s && s <= year && e && e >= year) || s === year || e === year
  })
  if (inRea) return true
  const inPrepa = chantier.date_prepa?.some((p) => {
    const s = p.date_start_prepa ? new Date(p.date_start_prepa).getFullYear() : null
    const e = p.date_end_prepa ? new Date(p.date_end_prepa).getFullYear() : null
    return (s && s <= year && e && e >= year) || s === year || e === year
  })
  return !!inPrepa
}

// Chantiers par année
const chantiersByYear = computed(() => {
  return allYears.value.map((year) => {
    return getAllChantiers.value.filter((c) => isChantierInYear(c, year)).length
  })
})

// Week-ends par année
const weekendsByYear = computed(() => {
  return allYears.value.map((year) => {
    return (allWeekends.value || []).filter((w) => w.annee_debut === year || w.annee_fin === year).length
  })
})

// Répartition des états par année (stacked bar)
const etatsByYear = computed(() => {
  const preop = []
  const rlt = []
  const externe = []
  const termine = []
  allYears.value.forEach((year) => {
    const chantiersOfYear = getAllChantiers.value.filter((c) => isChantierInYear(c, year))
    preop.push(chantiersOfYear.filter((c) => c.etat === 2).length)
    rlt.push(chantiersOfYear.filter((c) => c.etat === 0).length)
    externe.push(chantiersOfYear.filter((c) => c.etat === 1).length)
    termine.push(chantiersOfYear.filter((c) => c.etat === -1).length)
  })
  return { preop, rlt, externe, termine }
})

// --- CHARTS OPTIONS ---

const chartColors = {
  preop: '#84cc16',
  rlt: '#0ea5e9',
  externe: '#a855f7',
  termine: '#64748b',
  primary: '#6366f1',
  weekend: '#f97316'
}

// 1. Bar : chantiers + weekends par année
const barYearOptions = computed(() => ({
  chart: { type: 'bar', fontFamily: 'inherit', toolbar: { show: false }, stacked: false },
  xaxis: { categories: allYears.value.map(String) },
  colors: [chartColors.primary, chartColors.weekend],
  plotOptions: { bar: { borderRadius: 4, columnWidth: '60%' } },
  dataLabels: { enabled: true },
  legend: { position: 'top' },
  yaxis: { title: { text: 'Nombre' } }
}))
const barYearSeries = computed(() => [
  { name: 'Chantiers', data: chantiersByYear.value },
  { name: 'Week-ends', data: weekendsByYear.value }
])

// 2. Stacked bar : répartition des états par année
const stackedBarOptions = computed(() => ({
  chart: { type: 'bar', fontFamily: 'inherit', toolbar: { show: false }, stacked: true },
  xaxis: { categories: allYears.value.map(String) },
  colors: [chartColors.preop, chartColors.rlt, chartColors.externe, chartColors.termine],
  plotOptions: { bar: { borderRadius: 4, columnWidth: '55%' } },
  dataLabels: { enabled: true },
  legend: { position: 'top' },
  yaxis: { title: { text: 'Nombre de chantiers' } }
}))
const stackedBarSeries = computed(() => [
  { name: 'Pré-op', data: etatsByYear.value.preop },
  { name: 'RLT', data: etatsByYear.value.rlt },
  { name: 'Externe', data: etatsByYear.value.externe },
  { name: 'Terminé', data: etatsByYear.value.termine }
])

// --- PRINT ---
const printDate = computed(() => {
  return new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
})

const handlePrint = () => {
  // Laisser le temps aux charts du composant print de se dessiner
  setTimeout(() => window.print(), 500)
}
</script>

<template>
  <!-- Écran (caché à l'impression) -->
  <div class="flex h-full w-full flex-col overflow-y-auto print:hidden">
    <div class="mx-auto w-full max-w-7xl space-y-6 p-6">

      <!-- Screen header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">Statistiques Uo Travaux</h1>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Vue d'ensemble de l'activité des chantiers</p>
        </div>
        <button
          @click="handlePrint"
          class="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300">
          <Icon name="lucide:printer" class="h-4 w-4" />
          Imprimer
        </button>
      </div>

      <!-- KPI Cards : effectifs par rôle -->
      <div class="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <div
          v-for="kpi in kpiRoles"
          :key="kpi.label"
          class="rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p class="text-xs font-medium uppercase tracking-wide text-gray-500">{{ kpi.label }}</p>
          <p class="mt-1 text-2xl font-bold" :class="kpi.color">{{ kpi.count }}</p>
        </div>
      </div>

      <!-- Chantiers & WE par année + États par année -->
      <div class="grid gap-6 lg:grid-cols-2">
        <div class="rounded-xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h3 class="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">Chantiers & week-ends par année</h3>
          <ClientOnly>
            <apexchart v-if="allYears.length > 0" type="bar" height="320" :options="barYearOptions" :series="barYearSeries" />
            <div v-else class="flex h-80 items-center justify-center text-sm text-gray-400">Aucune donnée</div>
          </ClientOnly>
        </div>
        <div class="rounded-xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h3 class="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">Répartition des états par année</h3>
          <ClientOnly>
            <apexchart v-if="allYears.length > 0" type="bar" height="320" :options="stackedBarOptions" :series="stackedBarSeries" />
            <div v-else class="flex h-80 items-center justify-center text-sm text-gray-400">Aucune donnée</div>
          </ClientOnly>
        </div>
      </div>
    </div>
  </div>

  <!-- Page impression (cachée à l'écran) -->
  <DashboardPrintStatistiques
    :kpi-roles="kpiRoles"
    :all-years="allYears"
    :bar-year-options="barYearOptions"
    :bar-year-series="barYearSeries"
    :stacked-bar-options="stackedBarOptions"
    :stacked-bar-series="stackedBarSeries"
    :print-date="printDate"
  />
</template>

