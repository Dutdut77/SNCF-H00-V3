<script setup>
definePageMeta({
  requiresAuth: true,
  requiredRole: '',
  layout: false
})

useHead({
  title: 'H00 - Impression Plan de Charge Général',
  description: 'Impression du plan de charge général'
})

const { getChantiers } = useChantiers()
const route = useRoute()
const { getAllContactsTravaux } = useContacts()
const { setLoader } = useLoader()
const { taches, getTaches } = useTaches()
const {} = useH00()
const { getAllWeekends } = useTimeline()
const { isAdmin, isSuperAdmin } = useLevelUser()

const searchQuery = ref('')

// Computed pour savoir si l'utilisateur peut modifier (admin ou superadmin)
const canEdit = computed(() => isAdmin.value || isSuperAdmin.value)

// Accès direct au state partagé des chantiers
const allChantiers = useState('allChantiers')

// État réactif pour l'année sélectionnée
const selectedYear = computed(() => Number(route.query.year))
const hoveredWeek = ref(null)

// Générer les semaines S1 à S53
const weeks = computed(() => {
  return Array.from({ length: 53 }, (_, i) => ({
    number: i + 1,
    label: `${i + 1}`
  }))
})

// Fonction pour obtenir le numéro de semaine ISO d'une date
const getWeekNumber = (date) => {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 4 - (d.getDay() || 7))
  const yearStart = new Date(d.getFullYear(), 0, 1)
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7)
}

// Fonction pour vérifier si une période chevauche l'année sélectionnée
const isPeriodInYear = (startDateStr, endDateStr, year) => {
  if (!startDateStr) return false
  const startDate = new Date(startDateStr)
  const endDate = endDateStr ? new Date(endDateStr) : startDate
  const startYear = startDate.getFullYear()
  const endYear = endDate.getFullYear()
  return startYear <= year && endYear >= year
}

// Fonction pour vérifier si un chantier a des données visibles sur l'année
const isChantierVisibleForYear = (chantier, year) => {
  // Vérifier les périodes de réalisation
  const hasReaInYear = chantier.date_rea?.some((p) => isPeriodInYear(p.date_start_travaux, p.date_end_travaux, year))
  if (hasReaInYear) return true

  // Vérifier les périodes de préparation
  const hasPrepaInYear = chantier.date_prepa?.some((p) => isPeriodInYear(p.date_start_prepa, p.date_end_prepa, year))
  if (hasPrepaInYear) return true

  // Vérifier les week-ends (via isWeekendForChantier ou directement)
  // Note: les week-ends sont stockés par semaine/année, on vérifie si l'année correspond
  const weekendsForChantier = allWeekends.value?.filter((w) => w.chantier_id === chantier.id) || []
  const hasWeekendInYear = weekendsForChantier.some((w) => w.annee_debut === year || w.annee_fin === year)
  if (hasWeekendInYear) return true

  return false
}

// Accès aux week-ends
const allWeekends = useState('allWeekends')

// Fonction mise à jour pour filtrer les chantiers (prépa, réa et week-ends)
const filteredChantiers = computed(() => {
  if (!allChantiers.value || !Array.isArray(allChantiers.value)) return []

  const search = searchQuery.value.toLowerCase().trim()

  return allChantiers.value
    .filter((chantier) => {
      // Filtre par recherche
      if (search) {
        const matchCompte = chantier.compte?.toLowerCase().includes(search)
        const matchName = chantier.name?.toLowerCase().includes(search)
        const matchLigne = chantier.ligne?.toLowerCase().includes(search)
        if (!matchCompte && !matchName && !matchLigne) return false
      }

      // Vérifier si le chantier a des données (prépa, réa ou week-end) pour l'année
      return isChantierVisibleForYear(chantier, selectedYear.value)
    })
    .sort((a, b) => {
      // Trier par la date de début de la première période de réalisation (ou prépa si pas de réa)
      const getFirstDate = (chantier) => {
        if (chantier.date_rea?.[0]?.date_start_travaux) {
          return new Date(chantier.date_rea[0].date_start_travaux)
        }
        if (chantier.date_prepa?.[0]?.date_start_prepa) {
          return new Date(chantier.date_prepa[0].date_start_prepa)
        }
        return new Date()
      }
      return getFirstDate(a) - getFirstDate(b)
    })
})

// Charger les chantiers au montage
onMounted(async () => {
  setLoader(true)
  try {
    await Promise.all([getChantiers(), getAllContactsTravaux(), getTaches(), getAllWeekends()])

    triggerPrint()
  } finally {
    setLoader(false)
  }
})

// Lancer l'impression
const triggerPrint = async () => {
  // Attendre que toutes les polices soient chargées
  if (document.fonts) {
    await document.fonts.ready
  }
  setTimeout(() => {
    window.print()
  }, 800)
}
</script>

<template>
  <div class="flex w-full flex-col gap-4 p-4 lg:h-full lg:px-4 lg:py-0 lg:pt-4 print:h-full print:w-full print:p-0">
    <div class="flex justify-between">
      <!-- Header avec titre et navigation -->

      <div class="flex items-center gap-4">
        <img src="/images/logo_uo.png" alt="Logo" class="w-12" />
        <div class="flex flex-col items-start justify-center">
          <p class="text-primary-800 font-[Bangers] text-3xl font-semibold tracking-wider">
            Plan de charge général {{ selectedYear }}
          </p>
          <p class="text-primary-700 -mt-1 text-base italic">
            Calendrier des chantiers pour l'année {{ selectedYear }}
          </p>
        </div>
      </div>
      <div class="flex flex-col items-end justify-center gap-1">
        <div class="text-primary-700 ml-auto text-sm italic">
          Impression du {{ new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) }}
        </div>
        <div class="flex flex-col-reverse items-center justify-center gap-4">
          <div class="bg-red-20 flex flex-1 cursor-default items-center justify-center gap-2">
            <div class="rounded-md border border-slate-600 bg-slate-500/60 px-2 py-1 text-xs font-bold text-white">
              Terminé
            </div>
            <div class="rounded-md border border-sky-600 bg-sky-500/60 px-2 py-1 text-xs font-bold text-white">RLT</div>
            <div class="rounded-md border border-lime-600 bg-lime-500/60 px-2 py-1 text-xs font-bold text-white">
              Pré-op
            </div>
            <div class="rounded-md border border-purple-600 bg-purple-500/60 px-2 py-1 text-xs font-bold text-white">
              Externe
            </div>
            <div class="rounded-md border border-orange-600 bg-orange-500/60 px-2 py-1 text-xs font-bold text-white">
              Week-end
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tableau calendrier -->
    <div class="border-primary-200 w-full rounded border">
      <table class="w-full min-w-[1400px] print:table-fixed">
        <!-- Header avec les semaines -->
        <thead class="sticky top-0 z-30">
          <tr class="">
            <!-- Colonne chantier -->
            <th
              class="border-primary-200 text-primary-600 left-0 z-40 mx-auto min-w-[240px] border-r border-b px-3 py-2 text-left text-[10px] font-semibold tracking-wider uppercase lg:sticky print:w-32 print:max-w-32 print:min-w-0">
              <!-- Navigation par année -->
              <div class="flex items-center justify-center">
                <span class="text-primary-700 px-2 text-base font-semibold dark:text-white">
                  {{ selectedYear }}
                </span>
              </div>
            </th>
            <!-- Colonnes semaines -->
            <th
              v-for="week in weeks"
              :key="week.number"
              class="border-primary-200 text-primary-700 min-w-[24px] border-b px-0 text-center text-sm font-medium transition-colors print:w-auto"
              @mouseenter="hoveredWeek = week.number"
              @mouseleave="hoveredWeek = null">
              {{ week.label }}
            </th>
          </tr>
        </thead>

        <!-- Corps du tableau -->
        <tbody class="divide-primary-100 divide-y">
          <ChantierTimelineRow
            v-for="chantier in filteredChantiers"
            :key="chantier.id"
            :chantier="chantier"
            :weeks="weeks"
            :selected-year="selectedYear"
            :show-contacts="false" />
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Bangers&display=swap');
@font-face {
  font-family: 'Bangers';
  src: url('/fonts/Bangers-Regular.ttf') format('truetype');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@media print {
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  @page {
    size: A3 landscape;
    margin: 10mm;
  }

  /* Supprime le scroll horizontal */
  .overflow-x-auto {
    overflow-x: visible !important;
  }

  /* Table en layout fixe pour distribution égale */
  table {
    table-layout: fixed !important;
  }

  /* Première colonne réduite */
  th:first-child,
  td:first-child {
    width: 300px !important;
    max-width: 3000px !important;
    min-width: 0 !important;
  }

  /* Les autres colonnes prennent le reste de l'espace de manière égale */
  th:not(:first-child),
  td:not(:first-child) {
    width: auto !important;
    min-width: 0 !important;
  }
}
</style>
