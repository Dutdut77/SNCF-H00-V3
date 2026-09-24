<script setup>
definePageMeta({
  requiresAuth: true,
  requiredRole: 'admin'
})

useHead({
  title: 'H00 - Statistiques',
  description: 'Statistiques des chantiers'
})

const { nomEntite } = useApplication()
const { isDark } = useDarkMode()
const { getChantiers, getAllChantiers } = useChantiers()
const { getAllWeekends } = useTimeline()
const { getAllUsers, getUsersRltVoie, getUsersRltSes, getUsersRltCat, getUsersKvVoie, getUsersKvSes, getUsersKvCat } =
  useUsers()
const { setLoader } = useLoader()

const allWeekends = useState('allWeekends')

onMounted(async () => {
  setLoader(true)
  try {
    await Promise.all([getChantiers(), getAllWeekends(), getAllUsers()])
  } finally {
    setLoader(false)
  }
})

// ============================================
// EFFECTIFS (barre latérale)
// ============================================
const effectifs = computed(() => [
  {
    groupe: 'RLT',
    roles: [
      { label: 'Voie', nb: getUsersRltVoie.value.length },
      { label: 'SES', nb: getUsersRltSes.value.length },
      { label: 'CAT', nb: getUsersRltCat.value.length }
    ]
  },
  {
    groupe: 'Contrôleurs',
    roles: [
      { label: 'Voie', nb: getUsersKvVoie.value.length },
      { label: 'SES', nb: getUsersKvSes.value.length },
      { label: 'CAT', nb: getUsersKvCat.value.length }
    ]
  }
])

// ============================================
// DONNÉES PAR ANNÉE
// ============================================
const allYears = computed(() => {
  const years = new Set()
  getAllChantiers.value.forEach((c) => {
    for (const p of c.date_rea || []) {
      if (p.date_start_travaux) years.add(new Date(p.date_start_travaux).getFullYear())
      if (p.date_end_travaux) years.add(new Date(p.date_end_travaux).getFullYear())
    }
    for (const p of c.date_prepa || []) {
      if (p.date_start_prepa) years.add(new Date(p.date_start_prepa).getFullYear())
      if (p.date_end_prepa) years.add(new Date(p.date_end_prepa).getFullYear())
    }
  })
  return [...years].sort()
})

// Un chantier est-il actif sur une année (réalisation ou préparation) ?
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

// États des chantiers (codes en base : 0 RLT, 2 Pré-op, 1 Externe, -1 Terminé), dans l'ordre des légendes
// des plans de charge. Couleurs d'état de l'application ; en sombre, bleu et vert un cran plus foncés
// (palette vérifiée : séparation daltonisme ≥ 16, contraste ≥ 3:1 sur la carte sombre).
const ETATS = [
  {
    code: 0,
    label: 'RLT',
    clair: '#0ea5e9',
    sombre: '#0284c7',
    tuile: 'bg-sky-100 text-sky-600 dark:bg-sky-400/15 dark:text-sky-300',
    icon: 'lucide:zap'
  },
  {
    code: 2,
    label: 'Pré-op',
    clair: '#84cc16',
    sombre: '#65a30d',
    tuile: 'bg-lime-100 text-lime-600 dark:bg-lime-400/15 dark:text-lime-300',
    icon: 'lucide:clipboard-check'
  },
  {
    code: 1,
    label: 'Externe',
    clair: '#a855f7',
    sombre: '#a855f7',
    tuile: 'bg-purple-100 text-purple-600 dark:bg-purple-400/15 dark:text-purple-300',
    icon: 'lucide:external-link'
  },
  {
    code: -1,
    label: 'Terminé',
    clair: '#64748b',
    sombre: '#71717a',
    tuile: 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300',
    icon: 'lucide:check-circle'
  }
]
const COULEUR_WEEKEND = '#f97316' // orange des week-ends dans les plans de charge

// Tableau des données : une ligne par année
const lignes = computed(() =>
  allYears.value.map((year) => {
    const chantiers = getAllChantiers.value.filter((c) => isChantierInYear(c, year))
    const parEtat = Object.fromEntries(ETATS.map((e) => [e.code, chantiers.filter((c) => c.etat === e.code).length]))
    const weekends = (allWeekends.value || []).filter((w) => w.annee_debut === year || w.annee_fin === year).length
    return { year, total: chantiers.length, parEtat, weekends }
  })
)

// Année des tuiles : l'année en cours si elle a des données, sinon la plus récente
const anneeCourante = new Date().getFullYear()
const annee = ref(anneeCourante)
const ligneAnnee = computed(
  () =>
    lignes.value.find((l) => l.year === annee.value) || {
      year: annee.value,
      total: 0,
      parEtat: {},
      weekends: 0
    }
)

// ============================================
// GRAPHIQUES (ApexCharts) : marques fines, grille en filet, textes aux couleurs du texte
// ============================================
const encre = computed(() => (isDark.value ? '#a1a1aa' : '#6b6470'))
const encreForte = computed(() => (isDark.value ? '#f4f4f5' : '#2b1f2a'))
const grille = computed(() => (isDark.value ? 'rgba(255,255,255,0.08)' : 'rgba(43,4,35,0.08)'))
const surface = computed(() => (isDark.value ? '#18181b' : '#ffffff'))
// Colonnes étroites : la largeur dépend du nombre d'années
const largeurColonne = computed(() => `${Math.min(40, 10 + allYears.value.length * 4)}%`)

const optionsCommunes = computed(() => ({
  chart: {
    type: 'bar',
    fontFamily: 'inherit',
    toolbar: { show: false },
    foreColor: encre.value,
    zoom: { enabled: false }
  },
  grid: {
    borderColor: grille.value,
    strokeDashArray: 0,
    xaxis: { lines: { show: false } },
    padding: { left: 4, right: 8 }
  },
  xaxis: {
    categories: allYears.value.map(String),
    axisBorder: { color: grille.value },
    axisTicks: { show: false },
    labels: { style: { colors: encre.value } }
  },
  yaxis: { forceNiceScale: true, decimalsInFloat: 0, labels: { style: { colors: encre.value } } },
  tooltip: { theme: isDark.value ? 'dark' : 'light', shared: true, intersect: false },
  // Filet de la couleur de la carte entre les segments empilés
  stroke: { show: true, width: 2, colors: [surface.value] },
  states: { active: { filter: { type: 'none' } } }
}))

// 1. Chantiers par année, par état (le total est écrit au-dessus de chaque colonne)
const etatsOptions = computed(() => ({
  ...optionsCommunes.value,
  chart: { ...optionsCommunes.value.chart, stacked: true },
  colors: ETATS.map((e) => (isDark.value ? e.sombre : e.clair)),
  plotOptions: {
    bar: {
      columnWidth: largeurColonne.value,
      borderRadius: 4,
      borderRadiusApplication: 'end',
      borderRadiusWhenStacked: 'last',
      dataLabels: {
        total: { enabled: true, offsetY: -4, style: { color: encreForte.value, fontSize: '12px', fontWeight: 600 } }
      }
    }
  },
  dataLabels: { enabled: false },
  legend: {
    position: 'top',
    horizontalAlign: 'left',
    fontSize: '13px',
    labels: { colors: encre.value },
    markers: { size: 6, shape: 'square', strokeWidth: 0 },
    itemMargin: { horizontal: 10 }
  }
}))
const etatsSeries = computed(() =>
  ETATS.map((e) => ({ name: e.label, data: lignes.value.map((l) => l.parEtat[e.code] || 0) }))
)

// 2. Week-ends par année : une seule série, valeur sur chaque colonne
const weekendsOptions = computed(() => ({
  ...optionsCommunes.value,
  colors: [COULEUR_WEEKEND],
  plotOptions: {
    bar: {
      columnWidth: largeurColonne.value,
      borderRadius: 4,
      borderRadiusApplication: 'end',
      dataLabels: { position: 'top' }
    }
  },
  dataLabels: {
    enabled: true,
    offsetY: -18,
    style: { colors: [encreForte.value], fontSize: '12px', fontWeight: 600 }
  },
  legend: { show: false }
}))
const weekendsSeries = computed(() => [{ name: 'Week-ends', data: lignes.value.map((l) => l.weekends) }])

// ============================================
// IMPRESSION
// ============================================
const tableauOuvert = ref(false)
const printDate = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
// Polices chargées, puis le temps aux graphiques de la page d'impression de se dessiner
const handlePrint = () => lancerImpression({ delai: 500 })
</script>

<template>
  <AppPageLayout v4 sidebar-class="print:hidden!" class="print:hidden">
    <template #entete>
      <AppPageHero
        title="Statistiques"
        :description="`Vue d'ensemble de l'activité des chantiers${nomEntite ? ` de l'${nomEntite}` : ''}`"
        illustration="planning" />
    </template>

    <!-- ============ Barre latérale : année des chiffres, effectifs ============ -->
    <template #sidebar>
      <div class="flex flex-col gap-5 pb-6 lg:pt-2">
        <AppPeriodNav
          :label="String(annee)"
          prev-label="Année précédente"
          next-label="Année suivante"
          :prev-title="String(annee - 1)"
          :next-title="String(annee + 1)"
          @prev="annee--"
          @next="annee++">
          <p class="mt-1.5 text-xs text-white/80">
            {{ ligneAnnee.total }} chantier{{ ligneAnnee.total > 1 ? 's' : '' }}
          </p>
          <p class="mt-0.5 text-xs text-white/80">
            {{ ligneAnnee.weekends }} week-end{{ ligneAnnee.weekends > 1 ? 's' : '' }}
          </p>
        </AppPeriodNav>

        <!-- Effectifs par rôle -->
        <section
          v-for="g in effectifs"
          :key="g.groupe"
          class="flex flex-col gap-1.5"
          :aria-label="`Effectifs ${g.groupe}`">
          <p class="flex items-center justify-between px-3" :class="PANNEAU_TITRE">
            {{ g.groupe }}
            <span class="tabular-nums">{{ g.roles.reduce((n, r) => n + r.nb, 0) }}</span>
          </p>
          <div :class="PANNEAU_GROUPE">
            <div v-for="r in g.roles" :key="r.label" class="text-ink-soft flex items-center gap-3 px-3 py-1.5 text-sm">
              <Icon name="lucide:user-round" size="16" class="shrink-0 text-slate-400 dark:text-white/45" />
              <span class="flex-1">{{ r.label }}</span>
              <span
                class="inline-flex h-5.5 min-w-6.5 items-center justify-center rounded-full px-1.5 text-xs font-bold"
                :class="panneauBadge(false)">
                {{ r.nb }}
              </span>
            </div>
          </div>
        </section>
      </div>
    </template>

    <!-- ============ Contenu : chiffres de l'année, graphiques toutes années ============ -->
    <template #default>
      <div class="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4 lg:px-8 lg:pt-4 lg:pb-6">
        <div class="flex items-center gap-3">
          <p class="text-ink-soft text-sm">Chantiers actifs en {{ annee }}, par état</p>
          <AppButtonValidated type="button" theme="outline" class="max-lg:hidden lg:ml-auto" @click="handlePrint">
            <template #default>
              <span class="flex items-center gap-2">
                <Icon name="lucide:printer" size="16" />
                Imprimer
              </span>
            </template>
          </AppButtonValidated>
        </div>

        <!-- Tuiles de l'année : comme les tuiles de la liste des chantiers -->
        <div class="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <div class="bg-bandeau flex items-start gap-3 rounded-xl p-4 shadow-[0_10px_24px_-12px_rgb(43_4_35/0.45)]">
            <span class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/15 text-white">
              <Icon name="lucide:layers" size="20" />
            </span>
            <span class="min-w-0">
              <span class="font-traverse block text-[1.75rem] leading-[1.05] tracking-[0.02em] text-white">
                {{ ligneAnnee.total }}
              </span>
              <span class="block text-sm font-semibold text-white">Chantiers</span>
            </span>
          </div>
          <div v-for="e in ETATS" :key="e.code" class="surface-card flex items-start gap-3 rounded-xl p-4">
            <span class="flex size-10 shrink-0 items-center justify-center rounded-lg" :class="e.tuile">
              <Icon :name="e.icon" size="20" />
            </span>
            <span class="min-w-0">
              <span class="font-traverse text-ink block text-[1.75rem] leading-[1.05] tracking-[0.02em]">
                {{ ligneAnnee.parEtat[e.code] || 0 }}
              </span>
              <span class="text-ink block text-sm font-semibold">{{ e.label }}</span>
            </span>
          </div>
          <div class="surface-card flex items-start gap-3 rounded-xl p-4">
            <span
              class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-400/15 dark:text-orange-300">
              <Icon name="lucide:calendar-range" size="20" />
            </span>
            <span class="min-w-0">
              <span class="font-traverse text-ink block text-[1.75rem] leading-[1.05] tracking-[0.02em]">
                {{ ligneAnnee.weekends }}
              </span>
              <span class="text-ink block text-sm font-semibold">Week-ends</span>
            </span>
          </div>
        </div>

        <!-- Graphiques : toutes les années -->
        <div class="grid gap-5 xl:grid-cols-2">
          <section class="surface-card rounded-xl p-5" aria-labelledby="stats-etats">
            <h2 id="stats-etats" class="text-ink font-semibold">Chantiers par année, par état</h2>
            <p class="text-ink-soft mt-0.5 text-xs">
              Un chantier compte pour chaque année où il est préparé ou réalisé.
            </p>
            <ClientOnly>
              <apexchart
                v-if="allYears.length"
                :key="`etats-${isDark}`"
                type="bar"
                height="320"
                :options="etatsOptions"
                :series="etatsSeries" />
              <p v-else class="text-ink-soft flex h-80 items-center justify-center text-sm">Aucune donnée</p>
            </ClientOnly>
          </section>
          <section class="surface-card rounded-xl p-5" aria-labelledby="stats-weekends">
            <h2 id="stats-weekends" class="text-ink font-semibold">Week-ends travaillés par année</h2>
            <p class="text-ink-soft mt-0.5 text-xs">Week-ends planifiés sur l'ensemble des chantiers.</p>
            <ClientOnly>
              <apexchart
                v-if="allYears.length"
                :key="`weekends-${isDark}`"
                type="bar"
                height="320"
                :options="weekendsOptions"
                :series="weekendsSeries" />
              <p v-else class="text-ink-soft flex h-80 items-center justify-center text-sm">Aucune donnée</p>
            </ClientOnly>
          </section>
        </div>

        <!-- Les mêmes données en tableau (lecture sans couleur, copie des chiffres) -->
        <section class="surface-card overflow-hidden rounded-xl">
          <button
            type="button"
            class="text-ink flex w-full cursor-pointer items-center gap-2 px-5 py-3.5 text-left text-sm font-semibold"
            :aria-expanded="tableauOuvert"
            aria-controls="stats-tableau"
            @click="tableauOuvert = !tableauOuvert">
            <Icon name="lucide:table-2" size="16" class="text-slate-400" />
            Voir les données en tableau
            <Icon
              name="lucide:chevron-down"
              size="16"
              class="ml-auto text-slate-400 transition-transform"
              :class="{ 'rotate-180': tableauOuvert }" />
          </button>
          <div v-show="tableauOuvert" id="stats-tableau" class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-table-head table-head-text shadow-[inset_0_-1px_0_var(--color-rule)]">
                <tr class="text-[0.8125rem]">
                  <th class="px-5 py-2.5 text-left">Année</th>
                  <th v-for="e in ETATS" :key="e.code" class="px-3 py-2.5 text-right">{{ e.label }}</th>
                  <th class="px-3 py-2.5 text-right">Chantiers</th>
                  <th class="px-5 py-2.5 text-right">Week-ends</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-900/[0.07] dark:divide-white/[0.07]">
                <tr v-for="l in lignes" :key="l.year" :class="{ 'bg-magenta-50/60 dark:bg-white/4': l.year === annee }">
                  <td class="text-ink px-5 py-2 font-semibold">{{ l.year }}</td>
                  <td v-for="e in ETATS" :key="e.code" class="text-ink-soft px-3 py-2 text-right tabular-nums">
                    {{ l.parEtat[e.code] || 0 }}
                  </td>
                  <td class="text-ink px-3 py-2 text-right font-semibold tabular-nums">{{ l.total }}</td>
                  <td class="text-ink-soft px-5 py-2 text-right tabular-nums">{{ l.weekends }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </template>
  </AppPageLayout>

  <!-- Page d'impression (hors écran, pour que les graphiques soient dessinés) -->
  <DashboardPrintStatistiques
    :annee="annee"
    :ligne-annee="ligneAnnee"
    :etats="ETATS"
    :effectifs="effectifs"
    :has-data="allYears.length > 0"
    :etats-options="etatsOptions"
    :etats-series="etatsSeries"
    :weekends-options="weekendsOptions"
    :weekends-series="weekendsSeries"
    :print-date="printDate" />
</template>
