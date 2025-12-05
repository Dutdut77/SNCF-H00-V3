<script setup>
definePageMeta({
  requiresAuth: true,
  requiredRole: ''
})

useHead({
  title: 'H00 - Plan de Charge Général',
  description: 'Calendrier annuel des chantiers'
})

const { getChantiers } = useChantiers()
const { setLoader } = useLoader()

// État réactif pour l'année sélectionnée
const selectedYear = ref(new Date().getFullYear())
const hoveredWeek = ref(null)

const newChantier = ref({
  compte: '',
  name: '',
  type_essais: '',
  decret: '',
  weekends: [],
  matieres: [],
  comptes: [],
  autre: []
})

const steps = [
  {
    label: 'Généralités',
    description: 'Les informations générales'
  },
  {
    label: 'Week-ends',
    description: 'Les week-ends du chantier'
  },
  {
    label: 'Contacts',
    description: 'Les contacts travaux du chantier'
  },
  {
    label: 'Récapitulatif',
    description: 'Récapitulatif des données du chantier'
  }
]

const handleComplete = () => {
  console.log('Processus terminé!')
  // Logique de finalisation
}

const handleStepChange = (from, to) => {
  console.log(`Changement de l'étape ${from} vers ${to}`)
}
// Barre de recherche
const searchQuery = ref('')
const drawerOpen = ref(false)
const toggleDrawer = () => {
  drawerOpen.value = !drawerOpen.value
}
// Accès direct au state partagé des chantiers
const allChantiers = useState('allChantiers')

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

// Filtrer les chantiers pour l'année sélectionnée et la recherche
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

      if (!chantier.date_start_travaux && !chantier.date_end_travaux) return false

      const startDate = chantier.date_start_travaux ? new Date(chantier.date_start_travaux) : null
      const endDate = chantier.date_end_travaux ? new Date(chantier.date_end_travaux) : null

      const startYear = startDate ? startDate.getFullYear() : null
      const endYear = endDate ? endDate.getFullYear() : null

      // Le chantier est visible si son année de début OU de fin correspond à l'année sélectionnée
      // OU si l'année sélectionnée est entre les deux
      if (startYear && endYear) {
        return startYear <= selectedYear.value && endYear >= selectedYear.value
      }
      if (startYear) return startYear === selectedYear.value
      if (endYear) return endYear === selectedYear.value

      return false
    })
    .sort((a, b) => {
      // Trier par date de début
      const dateA = a.date_start_travaux ? new Date(a.date_start_travaux) : new Date()
      const dateB = b.date_start_travaux ? new Date(b.date_start_travaux) : new Date()
      return dateA - dateB
    })
})
const getChantierColor = (week, selectedYear, chantier) => {
  if (!week || !selectedYear || !chantier) return null

  const { date_start_travaux, date_end_travaux, etat } = chantier

  // ------------------------------------
  // Convertir semaine ISO + année → lundi de la semaine
  // ------------------------------------
  const dateFromWeek = (week, year) => {
    const jan4 = new Date(year, 0, 4)
    const jan4Day = jan4.getDay() || 7 // dimanche => 7
    const mondayWeek1 = new Date(jan4)
    mondayWeek1.setDate(jan4.getDate() - (jan4Day - 1))

    const d = new Date(mondayWeek1)
    d.setDate(mondayWeek1.getDate() + (week - 1) * 7)
    return d
  }

  const weekDate = dateFromWeek(week, selectedYear)

  const start = new Date(date_start_travaux)
  const end = new Date(date_end_travaux)

  // ------------------------------------
  // Vérifier si la semaine est incluse dans la période
  // ------------------------------------
  if (weekDate < start || weekDate > end) return null

  // ------------------------------------
  // Retourner la couleur en fonction de l'état
  // ------------------------------------
  switch (etat) {
    case 2:
      return 'bg-lime-500/60 border-lime-600' // pré-op
    case 1:
      return 'bg-purple-500/60 border-purple-600' // externe
    case 0:
      return 'bg-sky-500/60 border-sky-600' // RLT
    case -1:
      return 'bg-slate-500/60 border-slate-600' // terminé
    default:
      return 'bg-gray-500/60 border-gray-600' // inconnu
  }
}

// Calculer la position et la largeur de la barre pour un chantier
const getChantierBarStyle = (chantier) => {
  const startDate = chantier.date_start_travaux ? new Date(chantier.date_start_travaux) : null
  const endDate = chantier.date_end_travaux ? new Date(chantier.date_end_travaux) : null

  if (!startDate && !endDate) return { display: 'none' }

  let startWeek, endWeek

  // Calcul de la semaine de début
  if (startDate) {
    const startYear = startDate.getFullYear()
    if (startYear < selectedYear.value) {
      startWeek = 1
    } else if (startYear > selectedYear.value) {
      startWeek = 53
    } else {
      startWeek = getWeekNumber(startDate)
    }
  } else {
    startWeek = 1
  }

  // Calcul de la semaine de fin
  if (endDate) {
    const endYear = endDate.getFullYear()
    if (endYear > selectedYear.value) {
      endWeek = 53
    } else if (endYear < selectedYear.value) {
      endWeek = 1
    } else {
      endWeek = getWeekNumber(endDate)
    }
  } else {
    endWeek = startWeek
  }

  // S'assurer que startWeek <= endWeek
  if (startWeek > endWeek) {
    ;[startWeek, endWeek] = [endWeek, startWeek]
  }

  // Calculer la position en pourcentage
  const left = ((startWeek - 1) / 53) * 100
  const width = ((endWeek - startWeek + 1) / 53) * 100

  return {
    left: `${left}%`,
    width: `${Math.max(width, 1.5)}%`
  }
}

// Couleurs selon l'état du chantier
const getEtatColor = (etat) => {
  switch (etat) {
    case 2:
      return 'bg-amber-500'
    case 1:
      return 'bg-blue-500'
    case 0:
      return 'bg-emerald-500'
    case -1:
      return 'bg-gray-400'
    default:
      return 'bg-gray-300'
  }
}

const getEtatBorderColor = (etat) => {
  switch (etat) {
    case 2:
      return 'border-amber-600'
    case 1:
      return 'border-blue-600'
    case 0:
      return 'border-emerald-600'
    case -1:
      return 'border-gray-500'
    default:
      return 'border-gray-400'
  }
}

// Label pour l'état
const getEtatLabel = (etat) => {
  switch (etat) {
    case 2:
      return 'Pré-op'
    case 1:
      return 'Externe'
    case 0:
      return 'RLT'
    case -1:
      return 'Terminé'
    default:
      return 'Inconnu'
  }
}

// Formater une date
const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// Navigation par année
const previousYear = () => {
  selectedYear.value--
}

const nextYear = () => {
  selectedYear.value++
}

// Charger les chantiers au montage
onMounted(async () => {
  setLoader(true)
  try {
    await getChantiers()
  } finally {
    setLoader(false)
  }
})
</script>

<template>
  <div class="flex h-full w-full flex-col gap-4 overflow-hidden p-4 lg:px-4 lg:py-0 lg:pt-4">
    <!-- Header avec titre et navigation -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <AppTitleMain title="Plan de charge générale" description="Calendrier des chantiers pour l'année en cours" />
    </div>

    <div class="flex flex-col items-center justify-between lg:flex-row">
      <div class="flex-1">
        <AppInputSearch v-model="searchQuery" class="h-fit w-full max-w-sm" placeholder="Rechercher un chantier ..." />
      </div>
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
      </div>
      <div class="flex flex-1 justify-end">
        <AppButtonValidated theme="primary" type="button" @click="drawerOpen = true" class="h-fit w-44">
          <template #default>
            <span class="flex items-center gap-2 text-sm">
              <Icon name="lucide:diamond-plus" size="18" />
              Nouveau chantier
            </span>
          </template>
        </AppButtonValidated>
      </div>
    </div>

    <!-- Tableau calendrier -->
    <div
      class="h-fit overflow-auto rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <table class="w-full min-w-[1400px]">
        <!-- Header avec les semaines -->
        <thead class="sticky top-0 z-30">
          <tr class="bg-gray-50 dark:bg-gray-900/50">
            <!-- Colonne chantier -->
            <th
              class="sticky left-0 z-40 mx-auto min-w-[240px] border-r border-b border-gray-200 bg-gray-50 px-3 py-2 text-left text-[10px] font-semibold tracking-wider text-gray-600 uppercase dark:border-gray-700 dark:bg-gray-900/50 dark:text-gray-400">
              <!-- Navigation par année -->
              <div class="flex items-center justify-center">
                <button
                  @click="previousYear"
                  class="flex cursor-pointer items-center rounded-l-lg px-2 text-gray-600 transition-colors hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700"
                  title="Année précédente">
                  <Icon name="lucide:chevron-left" size="18" />
                </button>

                <span class="px-2 text-base font-semibold text-gray-700 dark:text-white">
                  {{ selectedYear }}
                </span>

                <button
                  @click="nextYear"
                  class="flex cursor-pointer items-center rounded-r-lg px-2 text-gray-600 transition-colors hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700"
                  title="Année suivante">
                  <Icon name="lucide:chevron-right" size="18" />
                </button>
              </div>
            </th>
            <!-- Colonnes semaines -->
            <th
              v-for="week in weeks"
              :key="week.number"
              class="min-w-[24px] border-b border-gray-200 px-0 text-center text-xs font-medium text-gray-500 transition-colors dark:border-gray-700 dark:text-gray-400"
              :class="{
                'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-semibold':
                  week.number === getWeekNumber(new Date()) && selectedYear === new Date().getFullYear(),
                'bg-gray-200 dark:bg-gray-700/30': hoveredWeek === week.number
              }"
              @mouseenter="hoveredWeek = week.number"
              @mouseleave="hoveredWeek = null">
              {{ week.label }}
            </th>
          </tr>
        </thead>

        <!-- Corps du tableau -->
        <tbody class="divide-y divide-gray-100 dark:divide-gray-700/50">
          <tr
            v-for="chantier in filteredChantiers"
            :key="chantier.id"
            class="group py-0.5 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700/30">
            <!-- Info chantier -->

            <td
              class="sticky left-0 z-10 border-r border-gray-200 bg-white px-2 py-0.5 transition-colors group-hover:bg-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:group-hover:bg-gray-700/30">
              <NuxtLink
                :to="`/chantiers/${chantier.id}`"
                class="truncate text-xs font-medium text-gray-700 transition-colors dark:text-white"
                :title="chantier.name">
                <div class="flex items-center gap-1.5">
                  <span class="h-3 w-1 shrink-0 rounded-full" :class="getEtatColor(chantier.etat)"></span>
                  <span
                    class="shrink-0 rounded bg-gray-100 px-1 py-0.5 font-mono text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-400">
                    {{ chantier.compte || '-' }}
                  </span>

                  {{ chantier.name || 'Sans intitulé' }}

                  <!-- <span
                    class="shrink-0 rounded-md px-3 py-0.5 text-[11px] font-medium"
                    :class="{
                      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400': chantier.etat === 2,
                      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400': chantier.etat === 1,
                      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400':
                        chantier.etat === 0,
                      'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400': chantier.etat === -1
                    }">
                    {{ getEtatLabel(chantier.etat) }}
                  </span> -->
                </div>
              </NuxtLink>
            </td>

            <td
              v-for="week in weeks"
              :key="week.number"
              class="relative px-px"
              :class="{
                'bg-gray-200 dark:bg-gray-700/30': hoveredWeek === week.number,
                'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-semibold':
                  week.number === getWeekNumber(new Date()) && selectedYear === new Date().getFullYear()
              }"
              @mouseenter="hoveredWeek = week.number"
              @mouseleave="hoveredWeek = null">
              <div
                class="h-2.5 rounded border border-gray-300"
                :class="getChantierColor(week.number, selectedYear, chantier)"></div>
            </td>

            <!-- Cellules semaines avec barre de progression -->
            <!-- <td :colspan="53" class="relative h-6 p-0">
          

              <div class="absolute inset-0 flex">
      
                <div
                  v-for="week in weeks"
                  :key="week.number"
                  class="flex-1 border-r border-gray-100 transition-colors last:border-r-0 dark:border-gray-700/30"
                  :class="{
                    'bg-primary-200/50 dark:bg-primary-900/10':
                      week.number === getWeekNumber(new Date()) && selectedYear === new Date().getFullYear(),
                    'bg-gray-200 dark:bg-gray-700/30': hoveredWeek === week.number
                  }"
                  @mouseenter="hoveredWeek = week.number"
                  @mouseleave="hoveredWeek = null"></div>
              </div>

            
              <div
                class="absolute top-1/2 h-3 -translate-y-1/2 cursor-pointer rounded border shadow-sm transition-all duration-200 hover:scale-105 hover:shadow-md"
                :class="[getEtatColor(chantier.etat), getEtatBorderColor(chantier.etat)]"
                :style="getChantierBarStyle(chantier)"
                :title="`${chantier.compte} - ${chantier.name}\n${formatDate(chantier.date_start_travaux)} → ${formatDate(chantier.date_end_travaux)}`"></div>
            </td> -->
          </tr>

          <!-- Message si aucun chantier -->
          <tr v-if="filteredChantiers.length === 0">
            <td colspan="54" class="px-6 py-12 text-center">
              <div class="flex flex-col items-center gap-3">
                <Icon name="lucide:calendar-x" size="32" class="text-gray-300 dark:text-gray-600" />
                <p class="text-gray-500 dark:text-gray-400">Aucun chantier pour l'année {{ selectedYear }}</p>
                <div class="mt-2 flex gap-2">
                  <button
                    @click="selectedYear = new Date().getFullYear()"
                    class="text-primary-600 hover:text-primary-700 dark:text-primary-400 cursor-pointer text-sm font-medium">
                    Revenir à {{ new Date().getFullYear() }}
                  </button>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <AppDrawer :drawer-open="drawerOpen" :close-drawer="toggleDrawer">
      <template #default>
        <AppDrawerContent v-if="drawerOpen" :drawer-open="drawerOpen" :close-drawer="toggleDrawer">
          <div class="space-y-4">
            <AppTitleMain title="Ajouter un chantier" description="Ajoutez un nouveau chantier au plan de charge" />

            <div class="lg:px-8">
              <AppStepBar :steps="steps" :allow-skip="false" @complete="handleComplete" @step-change="handleStepChange">
                <!-- Étape 1: Informations personnelles -->
                <template #step-0>
                  <div class="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
                    <h2 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Informations personnelles</h2>
                    <div class="space-y-4">
                      <div>
                        <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Nom complet
                        </label>
                        <input
                          type="text"
                          class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                          placeholder="Jean Dupont" />
                      </div>
                      <div>
                        <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                        <input
                          type="email"
                          class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                          placeholder="jean@example.com" />
                      </div>
                    </div>
                  </div>
                </template>

                <!-- Étape 2: Adresse -->
                <template #step-1>
                  <div class="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
                    <h2 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Adresse</h2>
                    <div class="space-y-4">
                      <div>
                        <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Rue</label>
                        <input
                          type="text"
                          class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                          placeholder="123 Rue de la Paix" />
                      </div>
                      <div class="grid grid-cols-2 gap-4">
                        <div>
                          <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Code postal
                          </label>
                          <input
                            type="text"
                            class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            placeholder="75001" />
                        </div>
                        <div>
                          <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Ville</label>
                          <input
                            type="text"
                            class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            placeholder="Paris" />
                        </div>
                      </div>
                    </div>
                  </div>
                </template>

                <!-- Étape 3: Paiement -->
                <template #step-2>
                  <div class="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
                    <h2 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Informations de paiement</h2>
                    <div class="space-y-4">
                      <div>
                        <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Numéro de carte
                        </label>
                        <input
                          type="text"
                          class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                          placeholder="1234 5678 9012 3456" />
                      </div>
                    </div>
                  </div>
                </template>

                <!-- Étape 4: Confirmation -->
                <template #step-3>
                  <div class="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
                    <h2 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Confirmation</h2>
                    <div class="py-8 text-center">
                      <div
                        class="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                        <svg
                          class="h-8 w-8 text-green-600 dark:text-green-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24">
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M5 13l4 4L19 7"></path>
                        </svg>
                      </div>
                      <p class="text-gray-600 dark:text-gray-300">Vérifiez vos informations avant de finaliser</p>
                    </div>
                  </div>
                </template>
              </AppStepBar>
            </div>
          </div>
        </AppDrawerContent>
      </template>
    </AppDrawer>
  </div>
</template>

<style scoped>
/* Scroll smooth */
.overflow-auto {
  scroll-behavior: smooth;
}
</style>
