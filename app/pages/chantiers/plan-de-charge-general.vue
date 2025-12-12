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
const {
  getAllUsers,
  users,
  getUsersRltVoie,
  getUsersRltSes,
  getUsersRltCat,
  getUsersLogistique,
  getUsersKvVoie,
  getUsersKvSes,
  getUsersPreopVoie,
  getUsersPreopSes,
  getUsersRefRdu
} = useUsers()
const { getAllContactsTravaux, allContactsTravaux } = useContacts()
const { setLoader } = useLoader()
// const allContactsTravaux = useState('allContactsTravaux', () => [])
// Accès direct au state partagé des chantiers
const allChantiers = useState('allChantiers')

// État réactif pour l'année sélectionnée
const selectedYear = ref(new Date().getFullYear())
const hoveredWeek = ref(null)
const stepBarRef = ref(null)
const isRealisationAdd = ref(false)
const isPreparationAdd = ref(false)
const isWeekendAdd = ref(false)

const showAddDate = (type) => {
  switch (type) {
    case 'weekend':
      isWeekendAdd.value = !isWeekendAdd.value
      isRealisationAdd.value = false
      isPreparationAdd.value = false
      break
    case 'realisation':
      isRealisationAdd.value = !isRealisationAdd.value
      isWeekendAdd.value = false
      isPreparationAdd.value = false
      break
    case 'preparation':
      isPreparationAdd.value = !isPreparationAdd.value
      isWeekendAdd.value = false
      isRealisationAdd.value = false
      break
  }
}
const newChantier = ref({
  entite: 'uo_travaux',
  compte: '',
  name: '',
  weekends: [],
  preparation: [],
  realisation: [],
  autre: [],
  rlt_voie_principale: null,
  rlt_voie_secondaire: [],
  rlt_ses_principale: null,
  rlt_ses_secondaire: [],
  rlt_cat_principale: null,
  rlt_cat_secondaire: [],
  preop_ses: null,
  preop_voie: null,
  logistique: null,
  supervisor: []
})

const steps = [
  {
    label: 'Généralités',
    description: 'Les informations générales'
  },
  {
    label: 'Périodes',
    description: 'Dates programmées du chantier'
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
// Validation de l'étape 1
const isStep1Valid = computed(() => {
  return (
    newChantier.value.name.trim() !== '' &&
    newChantier.value.compte.trim() !== '' &&
    newChantier.value.entite.trim() !== ''
  )
})

// Validation de l'étape 2
const isStep2Valid = computed(() => {
  return newChantier.value.realisation.length > 0
})

// Validation de l'étape 3
const isStep3Valid = computed(() => {
  return true
})

// Fonction de validation pour le StepBar
const validateCurrentStep = (stepIndex) => {
  switch (stepIndex) {
    case 0:
      return isStep1Valid.value
    case 1:
      return isStep2Valid.value
    case 2:
      return isStep3Valid.value
    default:
      return true
  }
}

// Gestion du changement d'étape
const handleStepChange = (from, to) => {
  // console.log(`Passage de l'étape ${from + 1} à l'étape ${to + 1}`)
}

// Complétion de toutes les étapes
const handleComplete = () => {
  alert('Inscription terminée avec succès !')
  console.log('Données du formulaire :', formData.value)
}

// Formulaire pour nouveau week-end
const newWeekend = ref({
  semaineDebut: null,
  anneeDebut: new Date().getFullYear(),
  semaineFin: null,
  anneeFin: new Date().getFullYear()
})

const newPreparation = ref({
  date_start: null,
  date_end: null
})

const newRealisation = ref({
  date_start: null,
  date_end: null
})

// Options pour les semaines (1-53)
const semaineOptions = computed(() => {
  return Array.from({ length: 53 }, (_, i) => ({
    id: i + 1,
    label: `S${i + 1}`
  }))
})

// Options pour les années
const anneeOptions = computed(() => {
  const currentYear = new Date().getFullYear()
  return Array.from({ length: 5 }, (_, i) => ({
    id: currentYear - 2 + i,
    label: String(currentYear - 2 + i)
  }))
})

// Barre de recherche
const searchQuery = ref('')
const drawerOpen = ref(false)
const toggleDrawer = () => {
  drawerOpen.value = !drawerOpen.value
}

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
      return 'bg-lime-500/60 border border-lime-600 ' // pré-op
    case 1:
      return 'bg-purple-500/60 border border-purple-600 ' // externe
    case 0:
      return 'bg-sky-500/60 border border-sky-600 ' // RLT
    case -1:
      return 'bg-slate-500/60 border border-slate-600 ' // terminé
    default:
      return 'bg-gray-500/60 border border-gray-600' // inconnu
  }
}

// Couleurs selon l'état du chantier
const getEtatColor = (etat) => {
  switch (etat) {
    case 2:
      return 'bg-lime-500'
    case 1:
      return 'bg-purple-500'
    case 0:
      return 'bg-sky-500'
    case -1:
      return 'bg-slate-500'
    default:
      return 'bg-gray-500'
  }
}

// Navigation par année
const previousYear = () => {
  selectedYear.value--
}

const nextYear = () => {
  selectedYear.value++
}
// Ajouter un week-end
const handleAddWeekend = async () => {
  if (!newWeekend.value.semaineDebut || !newWeekend.value.semaineFin) return
  newChantier.value.weekends.push({
    debutSemaine: newWeekend.value.semaineDebut,
    debutAnnee: newWeekend.value.anneeDebut,
    finSemaine: newWeekend.value.semaineFin,
    finAnnee: newWeekend.value.anneeFin
  })
  isWeekendAdd.value = false
  newWeekend.value = {
    semaineDebut: null,
    anneeDebut: new Date().getFullYear(),
    semaineFin: null,
    anneeFin: new Date().getFullYear()
  }
}
// Supprimer un week-end
const handleDeleteWeekend = async (index) => {
  newChantier.value.weekends.splice(index, 1)
}
// Ajouter une réalisation
const handleAddRealisation = async () => {
  if (!newRealisation.value.date_start || !newRealisation.value.date_end) return
  isRealisationAdd.value = false
  newChantier.value.realisation.push({
    date_start: newRealisation.value.date_start,
    date_end: newRealisation.value.date_end
  })
}
// Supprimer une réalisation
const handleDeleteRealisation = async (index) => {
  newChantier.value.realisation.splice(index, 1)
}
// Ajouter une préparation
const handleAddPreparation = async () => {
  if (!newPreparation.value.date_start || !newPreparation.value.date_end) return
  isPreparationAdd.value = false
  newChantier.value.preparation.push({
    date_start: newPreparation.value.date_start,
    date_end: newPreparation.value.date_end
  })
}
// Supprimer une préparation
const handleDeletePreparation = async (index) => {
  newChantier.value.preparation.splice(index, 1)
}

// Options utilisateurs pour les selects (travaux)

const userOptions = (users) => {
  if (users?.length > 0) {
    return users.map((u) => ({
      id: u.id,
      label: u.prenom && u.nom ? `${u.prenom} ${u.nom}` : u.email
    }))
  }
  return []
}

// Fonction pour initialiser les valeurs par défaut
const initializeDefaultUsers = () => {
  if (getUsersPreopSes.value?.length > 0 && newChantier.value.preop_ses === null) {
    newChantier.value.preop_ses = getUsersPreopSes.value[0].id
  }
  if (getUsersPreopVoie.value?.length > 0 && newChantier.value.preop_voie === null) {
    newChantier.value.preop_voie = getUsersPreopVoie.value[0].id
  }
  if (getUsersLogistique.value?.length > 0 && newChantier.value.logistique === null) {
    newChantier.value.logistique = getUsersLogistique.value[0].id
  }
}

// Charger les chantiers au montage
onMounted(async () => {
  setLoader(true)
  try {
    await getChantiers()
    await getAllUsers()
    await getAllContactsTravaux()
    initializeDefaultUsers()
  } finally {
    setLoader(false)
  }
})

const getContactName = (chantierId, contactType, isSecondary = false) => {
  if (!allContactsTravaux.value || !Array.isArray(allContactsTravaux.value)) return null

  const contact = allContactsTravaux.value.find((c) => c.chantier_id === chantierId)
  if (!contact) return null

  const contactData = contact[contactType]

  // Si c'est un tableau (secondaire/superviseur)
  if (isSecondary && Array.isArray(contactData)) {
    if (contactData.length === 0) return null
    // Retourner le premier élément du tableau
    return contactData[0]
  }

  // Si c'est une valeur simple (principal)
  return contactData || null
}

// Fonction pour obtenir les initiales et le nom complet
const getUserInfo = (userId) => {
  if (!userId || !users.value) return null

  const user = users.value.find((u) => u.id === userId)
  if (!user) return null

  return {
    nom: user.nom || '',
    prenom: user.prenom || '',
    fullName: user.prenom && user.nom ? `${user.prenom} ${user.nom}` : user.email || '-'
  }
}

// Fonction combinée pour obtenir les infos d'un contact
const getContactInfo = (chantierId, contactType, isSecondary = false) => {
  const contactId = getContactName(chantierId, contactType, isSecondary)
  if (!contactId) return null

  return getUserInfo(contactId)
}

// Fonction pour obtenir tous les contacts secondaires (array)
const getAllSecondaryContacts = (chantierId, contactType) => {
  if (!allContactsTravaux.value || !Array.isArray(allContactsTravaux.value)) return []

  const contact = allContactsTravaux.value.find((c) => c.chantier_id === chantierId)
  if (!contact) return []

  const contactData = contact[contactType]

  if (!Array.isArray(contactData) || contactData.length === 0) return []

  // Récupérer les infos de tous les utilisateurs
  return contactData.map((userId) => getUserInfo(userId)).filter((info) => info !== null)
}
</script>

<template>
  <div class="flex h-full w-full flex-col gap-4 overflow-hidden p-4 lg:px-4 lg:py-0 lg:pt-4">
    <!-- Header avec titre et navigation -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <AppTitleMain title="Plan de charge générale" description="Calendrier des chantiers pour l'année en cours" />
    </div>

    <div class="flex flex-col items-center justify-between gap-4 lg:flex-row">
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
        <div class="rounded-md border border-orange-600 bg-orange-500/60 px-2 py-1 text-xs font-bold text-white">
          Week-end
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
              rowspan="2"
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
              rowspan="2"
              v-for="week in weeks"
              :key="week.number"
              class="min-w-[24px] border-b border-gray-200 px-0 text-center text-sm font-medium text-gray-500 transition-colors dark:border-gray-700 dark:text-gray-400"
              :class="{
                'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-semibold':
                  week.number === getWeekNumber(new Date()) && selectedYear === new Date().getFullYear(),
                'bg-gray-200 dark:bg-gray-700/30': hoveredWeek === week.number
              }"
              @mouseenter="hoveredWeek = week.number"
              @mouseleave="hoveredWeek = null">
              {{ week.label }}
            </th>
            <th
              colspan="2"
              class="min-w-[24px] border-r border-l border-gray-200 px-0 text-center text-xs font-medium text-gray-500 transition-colors dark:border-gray-700 dark:text-gray-400">
              RLT VOIE
            </th>
            <th
              colspan="2"
              class="min-w-[24px] border-r border-l border-gray-200 px-0 text-center text-xs font-medium text-gray-500 transition-colors dark:border-gray-700 dark:text-gray-400">
              RLT SES
            </th>
            <th
              colspan="2"
              class="min-w-[24px] border-r border-l border-gray-200 px-0 text-center text-xs font-medium text-gray-500 transition-colors dark:border-gray-700 dark:text-gray-400">
              RLT CAT
            </th>
            <th
              colspan="3"
              class="min-w-[24px] border-r border-l border-gray-200 px-0 text-center text-xs font-medium text-gray-500 uppercase transition-colors dark:border-gray-700 dark:text-gray-400">
              Pré-op
            </th>
          </tr>
          <tr class="bg-gray-50 dark:bg-gray-900/50">
            <th
              class="min-w-[56px] border-r border-l border-gray-200 text-center text-xs font-medium text-gray-500 transition-colors dark:border-gray-700 dark:text-gray-400">
              1er
            </th>
            <th
              class="min-w-[56px] border-r border-l border-gray-200 text-center text-xs font-medium text-gray-500 transition-colors dark:border-gray-700 dark:text-gray-400">
              2nd
            </th>
            <th
              class="min-w-[56px] border-r border-l border-gray-200 text-center text-xs font-medium text-gray-500 transition-colors dark:border-gray-700 dark:text-gray-400">
              1er
            </th>
            <th
              class="min-w-[56px] border-r border-l border-gray-200 text-center text-xs font-medium text-gray-500 transition-colors dark:border-gray-700 dark:text-gray-400">
              2nd
            </th>
            <th
              class="min-w-[56px] border-r border-l border-gray-200 text-center text-xs font-medium text-gray-500 transition-colors dark:border-gray-700 dark:text-gray-400">
              1er
            </th>
            <th
              class="min-w-[56px] border-r border-l border-gray-200 text-center text-xs font-medium text-gray-500 transition-colors dark:border-gray-700 dark:text-gray-400">
              2nd
            </th>
            <th
              class="min-w-[56px] border-r border-l border-gray-200 text-center text-xs font-medium text-gray-500 transition-colors dark:border-gray-700 dark:text-gray-400">
              Voie
            </th>
            <th
              class="min-w-[56px] border-r border-l border-gray-200 text-center text-xs font-medium text-gray-500 transition-colors dark:border-gray-700 dark:text-gray-400">
              Ses
            </th>
            <th
              class="min-w-[56px] border-r border-l border-gray-200 text-center text-xs font-medium text-gray-500 transition-colors dark:border-gray-700 dark:text-gray-400">
              Log
            </th>
          </tr>
        </thead>

        <!-- Corps du tableau -->
        <tbody class="divide-y divide-gray-100 dark:divide-gray-700/50">
          <tr
            v-for="chantier in filteredChantiers"
            :key="chantier.id"
            class="group transition-colors hover:bg-gray-200 dark:hover:bg-gray-700/30">
            <!-- Info chantier -->

            <td
              class="sticky left-0 z-10 border-r border-gray-200 bg-white px-2 py-1 transition-colors group-hover:bg-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:group-hover:bg-gray-700/30">
              <NuxtLink
                :to="`/chantiers/${chantier.id}`"
                class="truncate text-sm font-medium text-gray-700 transition-colors dark:text-white"
                :title="chantier.name">
                <div class="flex items-center gap-1.5">
                  <span class="h-3 w-1 shrink-0 rounded-full" :class="getEtatColor(chantier.etat)"></span>
                  <span
                    class="shrink-0 rounded bg-gray-100 px-1 py-0.5 font-mono text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-400">
                    {{ chantier.compte || '-' }}
                  </span>

                  {{ chantier.name || 'Sans intitulé' }}
                </div>
              </NuxtLink>
            </td>

            <td
              v-for="week in weeks"
              :key="week.number"
              class="relative cursor-pointer px-px"
              :class="{
                'bg-gray-200 dark:bg-gray-700/30': hoveredWeek === week.number,
                'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-semibold':
                  week.number === getWeekNumber(new Date()) && selectedYear === new Date().getFullYear()
              }"
              @mouseenter="hoveredWeek = week.number"
              @mouseleave="hoveredWeek = null">
              <div
                class="h-2.5 rounded-xs border border-gray-200"
                :class="getChantierColor(week.number, selectedYear, chantier)"></div>
            </td>

            <!-- RLT VOIE Principal -->
            <td class="border-r border-l border-gray-200 dark:border-gray-700">
              <template v-if="getContactInfo(chantier.id, 'rlt_voie_principale')">
                <AppTooltip :text="getContactInfo(chantier.id, 'rlt_voie_principale').fullName" class="h-full w-full">
                  <div class="flex h-full w-full items-center justify-center">
                    <AppAvatar
                      :nom="getContactInfo(chantier.id, 'rlt_voie_principale').nom"
                      :prenom="getContactInfo(chantier.id, 'rlt_voie_principale').prenom"
                      size="xs"
                      color="bg-purple-200 text-purple-600" />
                  </div>
                </AppTooltip>
              </template>
              <div v-else class="flex h-full w-full items-center justify-center text-gray-400">-</div>
            </td>

            <!-- RLT VOIE Secondaire -->
            <td class="border-r border-l border-gray-200 dark:border-gray-700">
              <template v-if="getAllSecondaryContacts(chantier.id, 'rlt_voie_secondaire').length > 0">
                <div class="flex h-full w-full items-center justify-center">
                  <div class="flex -space-x-2">
                    <AppTooltip
                      v-for="(contact, idx) in getAllSecondaryContacts(chantier.id, 'rlt_voie_secondaire')"
                      :key="idx"
                      :text="contact.fullName"
                      class="hover:z-10">
                      <AppAvatar
                        :nom="contact.nom"
                        :prenom="contact.prenom"
                        size="xs"
                        class="ring-2 ring-white dark:ring-gray-800"
                        color="bg-purple-200 text-purple-600" />
                    </AppTooltip>
                  </div>
                </div>
              </template>
              <div v-else class="flex h-full w-full items-center justify-center text-gray-400">-</div>
            </td>

            <!-- RLT SES Principal -->
            <td class="border-r border-l border-gray-200 dark:border-gray-700">
              <template v-if="getContactInfo(chantier.id, 'rlt_ses_principale')">
                <AppTooltip :text="getContactInfo(chantier.id, 'rlt_ses_principale').fullName" class="h-full w-full">
                  <div class="flex h-full w-full items-center justify-center">
                    <AppAvatar
                      :nom="getContactInfo(chantier.id, 'rlt_ses_principale').nom"
                      :prenom="getContactInfo(chantier.id, 'rlt_ses_principale').prenom"
                      size="xs"
                      color="bg-primary-200 text-primary-600" />
                  </div>
                </AppTooltip>
              </template>
              <div v-else class="flex h-full w-full items-center justify-center text-gray-400">-</div>
            </td>

            <!-- RLT SES Secondaire -->
            <td class="border-r border-l border-gray-200 dark:border-gray-700">
              <template v-if="getAllSecondaryContacts(chantier.id, 'rlt_ses_secondaire').length > 0">
                <div class="flex h-full w-full items-center justify-center">
                  <div class="flex -space-x-2">
                    <AppTooltip
                      v-for="(contact, idx) in getAllSecondaryContacts(chantier.id, 'rlt_ses_secondaire')"
                      :key="idx"
                      :text="contact.fullName"
                      class="hover:z-10">
                      <AppAvatar
                        :nom="contact.nom"
                        :prenom="contact.prenom"
                        size="xs"
                        class="ring-2 ring-white dark:ring-gray-800"
                        color="bg-primary-200 text-primary-600" />
                    </AppTooltip>
                  </div>
                </div>
              </template>
              <div v-else class="flex h-full w-full items-center justify-center text-gray-400">-</div>
            </td>

            <!-- RLT CAT Principal -->
            <td class="border-r border-l border-gray-200 dark:border-gray-700">
              <template v-if="getContactInfo(chantier.id, 'rlt_cat_principale')">
                <AppTooltip :text="getContactInfo(chantier.id, 'rlt_cat_principale').fullName" class="h-full w-full">
                  <div class="flex h-full w-full items-center justify-center">
                    <AppAvatar
                      :nom="getContactInfo(chantier.id, 'rlt_cat_principale').nom"
                      :prenom="getContactInfo(chantier.id, 'rlt_cat_principale').prenom"
                      size="xs"
                      color="bg-blue-200 text-blue-600" />
                  </div>
                </AppTooltip>
              </template>
              <div v-else class="flex h-full w-full items-center justify-center text-gray-400">-</div>
            </td>

            <!-- RLT CAT Secondaire -->
            <td class="border-r border-l border-gray-200 dark:border-gray-700">
              <template v-if="getAllSecondaryContacts(chantier.id, 'rlt_cat_secondaire').length > 0">
                <div class="flex h-full w-full items-center justify-center">
                  <div class="flex -space-x-2">
                    <AppTooltip
                      v-for="(contact, idx) in getAllSecondaryContacts(chantier.id, 'rlt_cat_secondaire')"
                      :key="idx"
                      :text="contact.fullName"
                      position="left"
                      class="hover:z-10">
                      <AppAvatar
                        :nom="contact.nom"
                        :prenom="contact.prenom"
                        size="xs"
                        class="ring-2 ring-white dark:ring-gray-800"
                        color="bg-blue-200 text-blue-600" />
                    </AppTooltip>
                  </div>
                </div>
              </template>
              <div v-else class="flex h-full w-full items-center justify-center text-gray-400">-</div>
            </td>

            <!-- Préop Voie -->
            <td class="border-r border-l border-gray-200 dark:border-gray-700">
              <template v-if="getContactInfo(chantier.id, 'preop_voie')">
                <AppTooltip :text="getContactInfo(chantier.id, 'preop_voie').fullName" class="h-full w-full">
                  <div class="flex h-full w-full items-center justify-center">
                    <AppAvatar
                      :nom="getContactInfo(chantier.id, 'preop_voie').nom"
                      :prenom="getContactInfo(chantier.id, 'preop_voie').prenom"
                      size="xs"
                      color="bg-emerald-200 text-emerald-600" />
                  </div>
                </AppTooltip>
              </template>
              <div v-else class="flex h-full w-full items-center justify-center text-gray-400">-</div>
            </td>

            <!-- Préop SES -->
            <td class="border-r border-l border-gray-200 dark:border-gray-700">
              <template v-if="getContactInfo(chantier.id, 'preop_ses')">
                <AppTooltip
                  :text="getContactInfo(chantier.id, 'preop_ses').fullName"
                  position="left"
                  class="h-full w-full">
                  <div class="flex h-full w-full items-center justify-center">
                    <AppAvatar
                      :nom="getContactInfo(chantier.id, 'preop_ses').nom"
                      :prenom="getContactInfo(chantier.id, 'preop_ses').prenom"
                      size="xs"
                      color="bg-emerald-200 text-emerald-600" />
                  </div>
                </AppTooltip>
              </template>
              <div v-else class="flex h-full w-full items-center justify-center text-gray-400">-</div>
            </td>

            <!-- Logistique -->
            <td class="border-r border-l border-gray-200 dark:border-gray-700">
              <template v-if="getContactInfo(chantier.id, 'logistique')">
                <AppTooltip
                  :text="getContactInfo(chantier.id, 'logistique').fullName"
                  position="left"
                  class="h-full w-full">
                  <div class="flex h-full w-full items-center justify-center">
                    <AppAvatar
                      :nom="getContactInfo(chantier.id, 'logistique').nom"
                      :prenom="getContactInfo(chantier.id, 'logistique').prenom"
                      size="xs"
                      color="bg-emerald-200 text-emerald-600" />
                  </div>
                </AppTooltip>
              </template>
              <div v-else class="flex h-full w-full items-center justify-center text-gray-400">-</div>
            </td>
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

    <AppDrawer :drawer-open="drawerOpen" :close-drawer="toggleDrawer" height-class="h-[90vh] md:h-[70vh] ">
      <template #default>
        <AppDrawerContent
          v-if="drawerOpen"
          :drawer-open="drawerOpen"
          :close-drawer="toggleDrawer"
          height-class="h-[90vh] md:h-[70vh]">
          <div class="flex h-full flex-col space-y-4">
            <AppTitleMain title="Ajouter un chantier" description="Ajoutez un nouveau chantier au plan de charge" />

            <div class="flex h-full flex-1 lg:px-8">
              <AppStepBar
                ref="stepBarRef"
                :steps="steps"
                :show-buttons="true"
                :validate-step="validateCurrentStep"
                @complete="handleComplete"
                @step-change="handleStepChange">
                <!-- Étape 1: Généralités -->
                <template #step-0>
                  <div class="grid w-full grid-cols-1 gap-4 lg:grid-cols-3">
                    <div class="space-y-4">
                      <div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700">
                        <Icon name="lucide:tag" size="16" class="text-primary-500" />
                        <h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300">
                          Entité
                        </h3>
                      </div>

                      <!-- Boutons radio stylisés pour le type -->
                      <div class="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          @click="newChantier.entite = 'uo_travaux'"
                          class="relative rounded-xl border-2 p-2 transition-all duration-200"
                          :class="
                            newChantier.entite === 'uo_travaux'
                              ? 'border-primary-500 dark:bg-primary-900/20 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                          ">
                          <div class="f flex items-center gap-2">
                            <div
                              class="flex h-8 w-8 items-center justify-center rounded-full"
                              :class="
                                newChantier.entite === 'uo_travaux'
                                  ? 'bg-primary-500 text-white'
                                  : 'bg-gray-200 text-gray-500 dark:bg-gray-700'
                              ">
                              <Icon name="lucide:home" size="20" />
                            </div>
                            <span
                              class="text-sm font-medium"
                              :class="
                                newChantier.entite === 'uo_travaux'
                                  ? 'text-primary-700 dark:text-primary-400'
                                  : 'text-gray-600 dark:text-gray-400'
                              ">
                              UO Travaux
                            </span>
                          </div>
                          <div
                            v-if="newChantier.entite === 'uo_travaux'"
                            class="bg-primary-500 absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full">
                            <Icon name="lucide:check" size="12" class="text-white" />
                          </div>
                        </button>

                        <button
                          type="button"
                          @click="newChantier.entite = 'autre'"
                          class="relative rounded-xl border-2 p-2 transition-all duration-200"
                          :class="
                            newChantier.entite === 'autre'
                              ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                              : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                          ">
                          <div class="flex items-center gap-2">
                            <div
                              class="flex h-8 w-8 items-center justify-center rounded-full"
                              :class="
                                newChantier.entite === 'autre'
                                  ? 'bg-red-500 text-white'
                                  : 'bg-gray-200 text-gray-500 dark:bg-gray-700'
                              ">
                              <Icon name="lucide:external-link" size="20" />
                            </div>
                            <span
                              class="text-sm font-medium"
                              :class="
                                newChantier.entite === 'autre'
                                  ? 'text-red-700 dark:text-red-400'
                                  : 'text-gray-600 dark:text-gray-400'
                              ">
                              Autre
                            </span>
                          </div>
                          <div
                            v-if="newChantier.entite === 'autre'"
                            class="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500">
                            <Icon name="lucide:check" size="12" class="text-white" />
                          </div>
                        </button>
                      </div>
                      <div
                        v-if="newChantier.entite === 'autre'"
                        class="flex items-center gap-2 text-sm text-red-500 italic">
                        <Icon name="lucide:triangle-alert" size="16" class="text-red-600" />
                        Attention, aucune tache H00 ne sera ajoutée pour ce chantier.
                      </div>
                    </div>

                    <div class="space-y-4">
                      <div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700">
                        <Icon name="lucide:building-2" size="16" class="text-primary-500" />
                        <h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300">
                          Identification
                        </h3>
                      </div>

                      <AppInput
                        v-model="newChantier.compte"
                        name="compte"
                        title="Compte"
                        required
                        placeholder="Numéro de compte" />

                      <AppInput
                        v-model="newChantier.name"
                        name="name"
                        title="Intitulé du chantier"
                        required
                        placeholder="Nom du chantier" />
                    </div>

                    <!-- Autre -->
                    <div class="w-full space-y-4">
                      <div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700">
                        <Icon name="lucide:file-text" size="16" class="text-primary-500" />
                        <h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300">
                          Autre
                        </h3>
                      </div>

                      <div class="w-full">
                        <label for="autre" class="mb-0.5 block text-sm">Informations complémentaires</label>
                        <textarea
                          v-model="newChantier.autre"
                          id="autre"
                          name="autre"
                          rows="4"
                          class="focus:border-primary-500 focus:ring-primary-500 w-full resize-none appearance-none rounded-md border border-gray-300 px-3 py-2 text-sm leading-tight text-gray-700 focus:ring-1 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                          placeholder="Notes, remarques, informations diverses..."></textarea>
                      </div>
                    </div>
                  </div>
                </template>

                <!-- Étape 2: Périodes -->
                <template #step-1>
                  <!-- Week-ends -->

                  <div class="flex flex-col space-y-6 divide-gray-200 lg:flex-row">
                    <div class="w-full px-4">
                      <div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700">
                        <Icon name="lucide:calendar-days" size="16" class="text-primary-500" />
                        <h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300">
                          Préparation
                        </h3>
                        <div
                          class="bg-primary-200 hover:bg-primary-400 text-primary-500 ml-auto flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition-colors duration-300 hover:text-white"
                          @click="showAddDate('preparation')">
                          <Icon name="lucide:plus" size="16" class="" />
                        </div>
                      </div>
                      <div v-if="newChantier.preparation.length > 0" class="space-y-2 pt-2">
                        <div
                          v-for="(preparation, index) in newChantier.preparation"
                          :key="index"
                          class="flex items-center justify-between">
                          <div class="flex items-center gap-2">
                            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {{ preparation.date_start }} → {{ preparation.date_end }}
                            </span>
                          </div>

                          <button
                            type="button"
                            @click="handleDeletePreparation(index)"
                            class="rounded p-1 text-red-500 transition-colors hover:bg-red-100 dark:hover:bg-red-900/30">
                            <Icon name="lucide:trash-2" size="16" />
                          </button>
                        </div>
                      </div>
                      <p v-else class="text-sm text-gray-400 italic">Aucune préparation programmée</p>
                    </div>
                    <div class="w-full px-4">
                      <div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700">
                        <Icon name="lucide:calendar-days" size="16" class="text-primary-500" />
                        <h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300">
                          Réalisation
                        </h3>
                        <div
                          class="bg-primary-200 hover:bg-primary-400 text-primary-500 ml-auto flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition-colors duration-300 hover:text-white"
                          @click="showAddDate('realisation')">
                          <Icon name="lucide:plus" size="16" class="" />
                        </div>
                      </div>
                      <div v-if="newChantier.realisation.length > 0" class="space-y-2 pt-2">
                        <div
                          v-for="(realisation, index) in newChantier.realisation"
                          :key="index"
                          class="flex items-center justify-between">
                          <div class="flex items-center gap-2">
                            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {{ realisation.date_start }} → {{ realisation.date_end }}
                            </span>
                          </div>
                          <button
                            type="button"
                            @click="handleDeleteRealisation(index)"
                            class="rounded p-1 text-red-500 transition-colors hover:bg-red-100 dark:hover:bg-red-900/30">
                            <Icon name="lucide:trash-2" size="16" />
                          </button>
                        </div>
                      </div>
                      <p v-else class="text-sm text-gray-400 italic">Aucune réalisation programmée</p>
                    </div>
                    <div class="w-full px-4">
                      <div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700">
                        <Icon name="lucide:calendar-days" size="16" class="text-primary-500" />
                        <h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300">
                          Week-ends
                        </h3>
                        <div
                          class="bg-primary-200 hover:bg-primary-400 text-primary-500 ml-auto flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition-colors duration-300 hover:text-white"
                          @click="showAddDate('weekend')">
                          <Icon name="lucide:plus" size="16" class="" />
                        </div>
                      </div>
                      <div v-if="newChantier.weekends.length > 0" class="space-y-2 pt-2">
                        <div
                          v-for="(weekend, index) in newChantier.weekends"
                          :key="index"
                          class="flex items-center justify-between">
                          <div class="flex items-center gap-2">
                            <span class="text-sm text-gray-700 dark:text-gray-300">
                              S{{ weekend.debutSemaine }}/{{ weekend.debutAnnee }} → S{{ weekend.finSemaine }}/{{
                                weekend.finAnnee
                              }}
                            </span>
                          </div>
                          <button
                            type="button"
                            @click="handleDeleteWeekend(index)"
                            class="rounded p-1 text-red-500 transition-colors hover:bg-red-100 dark:hover:bg-red-900/30">
                            <Icon name="lucide:trash-2" size="16" />
                          </button>
                        </div>
                      </div>
                      <p v-else class="text-sm text-gray-400 italic">Aucun week-end programmé</p>
                    </div>
                  </div>

                  <div class="pt-6">
                    <div
                      v-if="isWeekendAdd"
                      class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                      <p class="mb-3 text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-400">
                        Ajouter un week-end
                      </p>

                      <div class="mb-3 grid grid-cols-2 gap-3">
                        <div>
                          <label class="mb-1 block text-xs text-gray-500">Semaine début</label>
                          <AppSelect
                            v-model="newWeekend.semaineDebut"
                            :options="semaineOptions"
                            placeholder="S..."
                            nullable />
                        </div>
                        <div>
                          <label class="mb-1 block text-xs text-gray-500">Année</label>
                          <AppSelect v-model="newWeekend.anneeDebut" :options="anneeOptions" placeholder="Année" />
                        </div>
                      </div>

                      <div class="mb-3 grid grid-cols-2 gap-3">
                        <div>
                          <label class="mb-1 block text-xs text-gray-500">Semaine fin</label>
                          <AppSelect
                            v-model="newWeekend.semaineFin"
                            :options="semaineOptions"
                            placeholder="S..."
                            nullable />
                        </div>
                        <div>
                          <label class="mb-1 block text-xs text-gray-500">Année</label>
                          <AppSelect v-model="newWeekend.anneeFin" :options="anneeOptions" placeholder="Année" />
                        </div>
                      </div>

                      <AppButtonValidated
                        type="button"
                        theme="secondary"
                        :validated="!!newWeekend.semaineDebut && !!newWeekend.semaineFin"
                        @click="handleAddWeekend">
                        <template #default>
                          <span class="flex items-center gap-2">
                            <Icon name="lucide:plus" size="16" />
                            Ajouter
                          </span>
                        </template>
                      </AppButtonValidated>
                    </div>
                    <div
                      v-if="isRealisationAdd"
                      class="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                      <p class="mb-3 text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-400">
                        Période de réalisation
                      </p>

                      <div class="grid grid-cols-2 gap-4">
                        <AppDatePicker
                          v-model="newRealisation.date_start"
                          title="Date de début"
                          placeholder="Sélectionner..."
                          clearable />

                        <AppDatePicker
                          v-model="newRealisation.date_end"
                          title="Date de fin"
                          placeholder="Sélectionner..."
                          clearable />
                      </div>

                      <AppButtonValidated
                        type="button"
                        theme="secondary"
                        :validated="!!newRealisation.date_start && !!newRealisation.date_end"
                        @click="handleAddRealisation">
                        <template #default>
                          <span class="flex items-center gap-2">
                            <Icon name="lucide:plus" size="16" />
                            Ajouter
                          </span>
                        </template>
                      </AppButtonValidated>
                    </div>
                    <div
                      v-if="isPreparationAdd"
                      class="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                      <p class="mb-3 text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-400">
                        Période de préparation
                      </p>

                      <div class="grid grid-cols-2 gap-4">
                        <AppDatePicker
                          v-model="newPreparation.date_start"
                          title="Date de début"
                          placeholder="Sélectionner..."
                          clearable />

                        <AppDatePicker
                          v-model="newPreparation.date_end"
                          title="Date de fin"
                          placeholder="Sélectionner..."
                          clearable />
                      </div>
                      <AppButtonValidated
                        type="button"
                        theme="secondary"
                        :validated="!!newPreparation.date_start && !!newPreparation.date_end"
                        @click="handleAddPreparation">
                        <template #default>
                          <span class="flex items-center gap-2">
                            <Icon name="lucide:plus" size="16" />
                            Ajouter
                          </span>
                        </template>
                      </AppButtonValidated>
                    </div>
                  </div>
                </template>

                <!-- Étape 3: Contacts -->
                <template #step-2>
                  <div class="grid grid-cols-1 gap-4 space-y-4 md:grid-cols-2 lg:grid-cols-3">
                    <!-- RLT Voie -->
                    <div class="w-full space-y-4">
                      <div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700">
                        <Icon name="lucide:train-track" size="16" class="text-blue-500" />
                        <h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300">
                          RLT Voie
                        </h3>
                      </div>
                      <AppSelect
                        v-model="newChantier.rlt_voie_principale"
                        :options="userOptions(getUsersRltVoie)"
                        title="Principal"
                        placeholder="Sélectionner..."
                        nullable />

                      <AppSelectMultiple
                        v-model="newChantier.rlt_voie_secondaire"
                        :options="userOptions(getUsersRltVoie)"
                        title="Secondaire(s)"
                        placeholder="Sélectionner un profil Voie" />
                    </div>
                    <!-- RLT SES -->
                    <div class="w-full space-y-4">
                      <div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700">
                        <Icon name="lucide:zap" size="16" class="text-yellow-500" />
                        <h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300">
                          RLT SES
                        </h3>
                      </div>
                      <AppSelect
                        v-model="newChantier.rlt_ses_principale"
                        :options="userOptions(getUsersRltSes)"
                        title="Principal"
                        placeholder="Sélectionner..."
                        nullable />

                      <AppSelectMultiple
                        v-model="newChantier.rlt_ses_secondaire"
                        :options="userOptions(getUsersRltSes)"
                        title="Secondaire(s)"
                        placeholder="Sélectionner un profil SES" />
                    </div>

                    <!-- RLT CAT -->
                    <div class="w-full space-y-4">
                      <div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700">
                        <Icon name="lucide:cable" size="16" class="text-rose-500" />
                        <h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300">
                          RLT CAT
                        </h3>
                      </div>
                      <AppSelect
                        v-model="newChantier.rlt_cat_principale"
                        :options="userOptions(getUsersRltCat)"
                        title="Principal"
                        placeholder="Sélectionner..."
                        nullable />

                      <AppSelectMultiple
                        v-model="newChantier.rlt_cat_secondaire"
                        :options="userOptions(getUsersRltCat)"
                        title="Secondaire(s)"
                        placeholder="Sélectionner un profil caténaire" />
                    </div>

                    <!-- Pré-op -->
                    <div class="w-full space-y-4">
                      <div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700">
                        <Icon name="lucide:clipboard-check" size="16" class="text-indigo-500" />
                        <h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300">
                          Pré-op
                        </h3>
                      </div>

                      <AppSelect
                        v-model="newChantier.preop_voie"
                        :options="userOptions(getUsersPreopVoie)"
                        title="Voie"
                        placeholder="Sélectionner..."
                        nullable />
                      <AppSelect
                        v-model="newChantier.preop_ses"
                        :options="userOptions(getUsersPreopSes)"
                        title="SES"
                        placeholder="Sélectionner..."
                        nullable />
                    </div>

                    <!-- Logistique -->
                    <div class="w-full space-y-4">
                      <div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700">
                        <Icon name="lucide:truck" size="16" class="text-teal-500" />
                        <h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300">
                          Logistique
                        </h3>
                      </div>
                      <AppSelect
                        v-model="newChantier.logistique"
                        :options="userOptions(getUsersLogistique)"
                        title="Responsable logistique"
                        placeholder="Sélectionner..."
                        nullable />
                    </div>

                    <!-- Superviseurs -->
                    <div class="w-full space-y-4">
                      <div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700">
                        <Icon name="lucide:eye" size="16" class="text-purple-500" />
                        <h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300">
                          Superviseurs
                        </h3>
                      </div>
                      <div>
                        <AppSelectMultiple
                          v-model="newChantier.supervisor"
                          :options="userOptions(getUsersRefRdu)"
                          title="Secondaire(s)"
                          placeholder="Sélectionner un profil Superviseur" />
                      </div>
                    </div>
                  </div>
                </template>

                <!-- Étape 4: Récapitulatif -->
                <template #step-3>
                  <div class="space-y-4">
                    <div class=" ">
                      <p class="mb-1 text-sm font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-400">
                        Généralités
                      </p>
                      <div
                        class="flex items-center gap-2 rounded-md bg-gray-100 p-4 text-sm text-gray-600 dark:text-gray-400">
                        <p class="text-sm font-bold text-gray-600 dark:text-gray-400">{{ newChantier.compte }}</p>

                        <p class="text-sm text-gray-600 dark:text-gray-400">{{ newChantier.name }}</p>

                        <div v-if="newChantier.entite === 'autre'">
                          <p class="rounded-md bg-red-100 px-2 py-1 text-xs text-red-700 dark:text-red-400">externe</p>
                        </div>
                      </div>
                    </div>

                    <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
                      <div class="w-full">
                        <p class="mb-1 text-sm font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-400">
                          Préparations
                        </p>
                        <div
                          v-if="newChantier.preparation.length > 0"
                          class="flex flex-col gap-1 rounded-md bg-gray-100 p-4 text-sm text-gray-600 dark:text-gray-400">
                          <p v-for="(preparation, index) in newChantier.preparation" :key="index">
                            Du {{ preparation.date_start }} au {{ preparation.date_end }}
                          </p>
                        </div>
                        <div v-else class="rounded-md bg-gray-100 p-4 text-sm text-gray-600 italic dark:text-gray-400">
                          Aucune préparation programmée
                        </div>
                      </div>
                      <div class="w-full">
                        <p class="mb-1 text-sm font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-400">
                          Réalisations
                        </p>
                        <div
                          v-if="newChantier.realisation.length > 0"
                          class="flex flex-col gap-1 rounded-md bg-gray-100 p-4 text-sm text-gray-600 dark:text-gray-400">
                          <p v-for="(realisation, index) in newChantier.realisation" :key="index">
                            Du {{ realisation.date_start }} au {{ realisation.date_end }}
                          </p>
                        </div>
                        <div v-else class="rounded-md bg-gray-100 p-4 text-sm text-gray-600 italic dark:text-gray-400">
                          Aucune réalisation programmée
                        </div>
                      </div>
                      <div class="w-full">
                        <p class="mb-1 text-sm font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-400">
                          Week-ends
                        </p>
                        <div
                          v-if="newChantier.weekends.length > 0"
                          class="flex flex-col gap-1 rounded-md bg-gray-100 p-4 text-sm text-gray-600 dark:text-gray-400">
                          <p v-for="(weekend, index) in newChantier.weekends" :key="index">
                            S{{ weekend.debutSemaine }}/{{ weekend.debutAnnee }} → S{{ weekend.finSemaine }}/{{
                              weekend.finAnnee
                            }}
                          </p>
                        </div>
                        <div v-else class="rounded-md bg-gray-100 p-4 text-sm text-gray-600 italic dark:text-gray-400">
                          Aucun week-end programmé
                        </div>
                      </div>
                    </div>
                    <div class=" ">
                      <p class="mb-1 text-sm font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-400">
                        Contacts
                      </p>
                      <div
                        class="grid grid-cols-1 gap-4 rounded-md bg-gray-100 p-4 text-sm text-gray-600 md:grid-cols-2 lg:grid-cols-3 dark:text-gray-400">
                        <div>
                          <p class="dark:text-gray-40 text-sm font-medium text-gray-600">RLT Voie principal</p>

                          <p v-if="newChantier.rlt_voie_principale">
                            {{ newChantier.rlt_voie_principale }}
                          </p>
                          <p v-else class="text-sm text-gray-600 dark:text-gray-400">-</p>
                        </div>
                        <div>
                          <p class="dark:text-gray-40 text-sm font-medium text-gray-600">RLT SES principal</p>
                          <p v-if="newChantier.rlt_ses_principale">
                            {{ newChantier.rlt_ses_principale }}
                          </p>
                          <p v-else class="text-sm text-gray-600 dark:text-gray-400">-</p>
                        </div>
                        <div>
                          <p class="dark:text-gray-40 text-sm font-medium text-gray-600">RLT CAT principal</p>
                          <p v-if="newChantier.rlt_cat_principale">
                            {{ newChantier.rlt_cat_principale }}
                          </p>
                          <p v-else class="text-sm text-gray-600 dark:text-gray-400">-</p>
                        </div>
                      </div>
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
