<script setup>
definePageMeta({
  requiresAuth: true,
  requiredRole: '',
  layout: 'false'
})

useHead({
  title: 'H00 - Plan de Charge RLT',
  description: 'Vue par RLT des chantiers'
})

const { getChantiers } = useChantiers()
const {
  getAllUsers,
  users,
  getUsersRltVoie,
  getUsersRltSes,
  getUsersKvVoie,
  getUsersKvSes,
  getUsersRltCat,
  getUsersKvCat
} = useUsers()
const { getAllContactsTravaux, allContactsTravaux, getContactsTravaux, upsertContactsTravaux } = useContacts()
const { setLoader } = useLoader()
const { getAllWeekends } = useTimeline()
const { isAdmin, isSuperAdmin } = useLevelUser()
const { getAllAbsences } = useAbsences()

// Computed pour savoir si l'utilisateur peut modifier (admin ou superadmin)
const canEdit = computed(() => isAdmin.value || isSuperAdmin.value)

// Accès direct au state partagé des chantiers
const allChantiers = useState('allChantiers')
const searchQuery = ref('')
// État réactif pour l'année sélectionnée
const route = useRoute()
const selectedYear = computed(() => Number(route.query.year))
const activeTab = computed(() => route.query.tab || 'voie')

const hoveredWeek = ref(null)

// Onglet actif (voie ou ses)

// ============================================
// GESTION DU SLIDEOVER D'ATTRIBUTION
// ============================================
const showSlideOver = ref(false)
const selectedUser = ref(null)
const selectedChantierId = ref(null)
const selectedRoleType = ref('principale') // 'principale' ou 'secondaire' pour les RLT

const getDomainFromProfil = (profil) => {
  if (!profil) return null

  const profilNum = parseInt(profil)

  if (profilNum >= 10 && profilNum <= 19) return 'voie'
  if (profilNum >= 20 && profilNum <= 29) return 'ses'
  if (profilNum >= 30 && profilNum <= 39) return 'cat'

  return null
}

// Fonction pour extraire la première date de réalisation d'un chantier
const getFirstDateRea = (chantier) => {
  if (!chantier.date_rea || !Array.isArray(chantier.date_rea) || chantier.date_rea.length === 0) {
    return null
  }
  const firstPeriode = chantier.date_rea[0]
  return firstPeriode?.date_start_travaux ? new Date(firstPeriode.date_start_travaux) : null
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

// Noms des mois en français
const monthNames = ['Janv.', 'Fév.', 'Mars', 'Avril', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.']

// Fonction pour obtenir la date du jeudi de la semaine ISO
const getThursdayOfWeek = (weekNumber, year) => {
  const jan4 = new Date(year, 0, 4)
  const dayOfWeek = jan4.getDay() || 7
  const monday = new Date(jan4)
  monday.setDate(jan4.getDate() - dayOfWeek + 1)
  const targetMonday = new Date(monday)
  targetMonday.setDate(monday.getDate() + (weekNumber - 1) * 7)
  const thursday = new Date(targetMonday)
  thursday.setDate(targetMonday.getDate() + 3)
  return thursday
}

// Calculer les mois avec leurs semaines correspondantes
const monthsWithColspan = computed(() => {
  const year = selectedYear.value
  const weeksByMonth = Array(12).fill(0)

  for (let week = 1; week <= 53; week++) {
    const thursday = getThursdayOfWeek(week, year)
    const thursdayYear = thursday.getFullYear()
    const month = thursday.getMonth()

    if (thursdayYear === year) {
      weeksByMonth[month]++
    } else if (thursdayYear < year) {
      weeksByMonth[0]++
    } else {
      weeksByMonth[11]++
    }
  }

  return monthNames
    .map((name, index) => ({
      name,
      colspan: weeksByMonth[index]
    }))
    .filter((m) => m.colspan > 0)
})

// Fonction pour obtenir les infos d'un utilisateur
const getUserInfoByEmail = (email) => {
  if (!email || !Array.isArray(users.value)) return null

  const user = users.value.find((u) => u.email?.toLowerCase() === email.toLowerCase())
  if (!user) return null

  return {
    nom: user.nom || '',
    prenom: user.prenom || '',
    email: user.email || '',
    profil: user.profils || '',
    en_formation: user.en_formation ?? false,
    fullName: user.prenom && user.nom ? `${user.prenom} ${user.nom}` : user.email || '-'
  }
}

// Accès aux week-ends
const allWeekends = useState('allWeekends')

// Fonction pour vérifier si une période chevauche l'année sélectionnée
const isPeriodInYear = (startDateStr, endDateStr, year) => {
  if (!startDateStr) return false
  const startDate = new Date(startDateStr)
  const endDate = endDateStr ? new Date(endDateStr) : startDate
  const startYear = startDate.getFullYear()
  const endYear = endDate.getFullYear()
  return startYear <= year && endYear >= year
}

// Fonction pour vérifier si un chantier a des données visibles sur l'année (prépa, réa ou week-end)
const isChantierVisibleForYear = (chantier) => {
  const year = selectedYear.value

  // Vérifier les périodes de réalisation
  const hasReaInYear = chantier.date_rea?.some((p) => isPeriodInYear(p.date_start_travaux, p.date_end_travaux, year))
  if (hasReaInYear) return true

  // Vérifier les périodes de préparation
  const hasPrepaInYear = chantier.date_prepa?.some((p) => isPeriodInYear(p.date_start_prepa, p.date_end_prepa, year))
  if (hasPrepaInYear) return true

  // Vérifier les week-ends
  const weekendsForChantier = allWeekends.value?.filter((w) => w.chantier_id === chantier.id) || []
  const hasWeekendInYear = weekendsForChantier.some((w) => w.annee_debut === year || w.annee_fin === year)
  if (hasWeekendInYear) return true

  return false
}

// Fonction pour obtenir les chantiers d'un RLT/KV

// Fonction pour obtenir les chantiers d'un RLT/KV
const getChantiersForUser = (userEmail, contactTypes) => {
  if (!allContactsTravaux.value || !allChantiers.value) return []

  // Map chantier_id => type trouvé (rlt_voie_principale / rlt_voie_secondaire)
  const chantierFoundInMap = {}

  allContactsTravaux.value.forEach((contact) => {
    contactTypes.forEach((type) => {
      const value = contact[type]

      const isMatch = Array.isArray(value) ? value.includes(userEmail) : value === userEmail

      if (isMatch) {
        // On mémorise le type trouvé
        // (si plusieurs matches possibles, on peut stocker un tableau)
        chantierFoundInMap[contact.chantier_id] = type
      }
    })
  })

  return allChantiers.value
    .filter((chantier) => chantierFoundInMap[chantier.id] && isChantierVisibleForYear(chantier))
    .map((chantier) => ({
      ...chantier,
      foundIn: chantierFoundInMap[chantier.id] // 👈 info clé
    }))
    .sort((a, b) => {
      const dateA = a.date_rea?.[0]?.date_start_travaux ? new Date(a.date_rea[0].date_start_travaux) : new Date()

      const dateB = b.date_rea?.[0]?.date_start_travaux ? new Date(b.date_rea[0].date_start_travaux) : new Date()

      return dateA - dateB
    })
}

// Computed pour les RLT Voie avec leurs chantiers
const rltVoieWithChantiers = computed(() => {
  if (!getUsersRltVoie.value) return []

  return getUsersRltVoie.value
    .filter((user) => !user.pre_op && !user.ref_du_rdu) // Exclure pré-op et RDU
    .map((user) => {
      const userInfo = getUserInfoByEmail(user.email)
      const chantiers = getChantiersForUser(user.email, ['rlt_voie_principale', 'rlt_voie_secondaire'])
      return {
        ...userInfo,
        type: 'RLT',
        chantiers
      }
    })
    .sort((a, b) => (a.nom || '').localeCompare(b.nom || '')) // Tri par nom de famille
})

// Computed pour les KV Voie avec leurs chantiers
const kvVoieWithChantiers = computed(() => {
  if (!getUsersKvVoie.value) return []

  return getUsersKvVoie.value
    .filter((user) => !user.pre_op && !user.ref_du_rdu) // Exclure pré-op et RDU
    .map((user) => {
      const userInfo = getUserInfoByEmail(user.email)
      const chantiers = getChantiersForUser(user.email, ['kv_voie'])
      return {
        ...userInfo,
        type: 'KV',
        chantiers
      }
    })
    .sort((a, b) => (a.nom || '').localeCompare(b.nom || '')) // Tri par nom de famille
})

// Computed pour les RLT SES avec leurs chantiers
const rltSesWithChantiers = computed(() => {
  if (!getUsersRltSes.value) return []

  return getUsersRltSes.value
    .filter((user) => !user.pre_op && !user.ref_du_rdu) // Exclure pré-op et RDU
    .map((user) => {
      const userInfo = getUserInfoByEmail(user.email)
      const chantiers = getChantiersForUser(user.email, [
        'rlt_ses_principale',
        'rlt_ses_secondaire',
        'rlt_cat_principale',
        'rlt_cat_secondaire'
      ])
      return {
        ...userInfo,
        type: 'RLT',
        chantiers
      }
    })
    .sort((a, b) => (a.nom || '').localeCompare(b.nom || '')) // Tri par nom de famille
})

// Computed pour les RLT CAT avec leurs chantiers
const rltCatWithChantiers = computed(() => {
  if (!getUsersRltCat.value) return []

  return getUsersRltCat.value
    .filter((user) => !user.pre_op && !user.ref_du_rdu) // Exclure pré-op et RDU
    .map((user) => {
      const userInfo = getUserInfoByEmail(user.email)
      const chantiers = getChantiersForUser(user.email, ['rlt_cat_principale', 'rlt_cat_secondaire'])
      return {
        ...userInfo,
        type: 'RLT',
        chantiers
      }
    })
    .sort((a, b) => (a.nom || '').localeCompare(b.nom || '')) // Tri par nom de famille
})

// Computed pour les KV SES avec leurs chantiers
const kvSesWithChantiers = computed(() => {
  if (!getUsersKvSes.value) return []

  return getUsersKvSes.value
    .filter((user) => !user.pre_op && !user.ref_du_rdu) // Exclure pré-op et RDU
    .map((user) => {
      const userInfo = getUserInfoByEmail(user.email)
      const chantiers = getChantiersForUser(user.email, ['kv_ses'])
      return {
        ...userInfo,
        type: 'KV',
        chantiers
      }
    })
    .sort((a, b) => (a.nom || '').localeCompare(b.nom || '')) // Tri par nom de famille
})

// Computed pour les KV CAT avec leurs chantiers

const kvCatWithChantiers = computed(() => {
  if (!getUsersKvCat.value) return []

  return getUsersKvCat.value
    .filter((user) => !user.pre_op && !user.ref_du_rdu) // Exclure pré-op et RDU
    .map((user) => {
      const userInfo = getUserInfoByEmail(user.email)
      const chantiers = getChantiersForUser(user.email, ['kv_cat'])
      return {
        ...userInfo,
        type: 'KV',
        chantiers
      }
    })
    .sort((a, b) => (a.nom || '').localeCompare(b.nom || '')) // Tri par nom de famille
})

// Données combinées pour l'affichage
const voieData = computed(() => {
  return [...rltVoieWithChantiers.value, ...kvVoieWithChantiers.value]
})

const sesData = computed(() => {
  return [
    ...rltSesWithChantiers.value,
    ...rltCatWithChantiers.value,
    ...kvSesWithChantiers.value,
    ...kvCatWithChantiers.value
  ]
})

// Fonction de filtrage
const filterUsersBySearch = (users) => {
  if (!searchQuery.value.trim()) return users

  const query = searchQuery.value.toLowerCase().trim()

  return users.filter((user) => {
    // Recherche dans le nom de l'utilisateur
    const nameMatch =
      user.nom?.toLowerCase().includes(query) ||
      user.prenom?.toLowerCase().includes(query) ||
      user.fullName?.toLowerCase().includes(query)

    // Recherche dans les noms de chantiers
    const chantierMatch = user.chantiers?.some(
      (chantier) => chantier.name?.toLowerCase().includes(query) || chantier.compte?.toLowerCase().includes(query)
    )

    return nameMatch || chantierMatch
  })
}

const filteredVoieData = computed(() => filterUsersBySearch(voieData.value))
const filteredSesData = computed(() => filterUsersBySearch(sesData.value))

// Grouper les utilisateurs par type et catégorie pour un affichage structuré
const groupUsersByTypeAndCategory = (users) => {
  const groups = {}

  users.forEach((user) => {
    const key = `${user.type}_${user.category}`
    if (!groups[key]) {
      groups[key] = {
        type: user.type,
        category: user.category,
        users: []
      }
    }
    groups[key].users.push(user)
  })

  return Object.values(groups)
}

const groupedVoieData = computed(() => groupUsersByTypeAndCategory(filteredVoieData.value))
const groupedSesData = computed(() => groupUsersByTypeAndCategory(filteredSesData.value))

// Charger les données au montage
onMounted(async () => {
  setLoader(true)
  try {
    await Promise.all([getChantiers(), getAllUsers(), getAllContactsTravaux(), getAllWeekends(), getAllAbsences()])
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
  <div class="flex w-full flex-col gap-4 overflow-hidden p-4 lg:h-full lg:px-4 lg:py-0 lg:pt-4">
    <!-- Header avec titre et navigation -->
    <div class="flex w-full justify-between">
      <!-- Header avec titre et navigation -->

      <div class="flex items-center gap-4">
        <img src="/images/logo_uo.png" alt="Logo" class="w-12" />
        <div class="flex flex-col items-start justify-center">
          <span
            v-if="activeTab === 'voie'"
            class="text-primary-800 flex items-center gap-2 font-[Bangers] text-3xl font-semibold tracking-wider">
            Plan de charge
            <p class="text-secondary-500">voie</p>
            {{ selectedYear }}
          </span>
          <span
            v-if="activeTab === 'ses'"
            class="text-primary-800 flex items-center gap-2 font-[Bangers] text-3xl font-semibold tracking-wider">
            Plan de charge
            <p class="text-secondary-500">SES</p>
            {{ selectedYear }}
          </span>
          <pspan class="text-primary-700 -mt-1 text-base italic">
            Calendrier des RLT / contrôleurs pour l'année {{ selectedYear }}
          </pspan>
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
            <div class="rounded-md border border-red-600 bg-red-400/60 px-2 py-1 text-xs font-bold text-white">
              Congés
            </div>
            <div class="rounded-md border border-amber-600 bg-amber-500/60 px-2 py-1 text-xs font-bold text-white">
              Formation
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tableau calendrier -->
    <div class="border-primary-400 w-full rounded border bg-white">
      <table class="w-full min-w-[1400px]">
        <!-- Header avec les semaines -->
        <thead class="sticky top-0 z-30 bg-white">
          <!-- Ligne des mois -->
          <tr class="bg-white">
            <!-- Colonne chantier -->
            <th
              rowspan="2"
              class="border-primary-200 left-0 z-40 mx-auto min-w-[280px] border-r border-b bg-white px-3 py-2 text-left text-[10px] font-semibold tracking-wider text-gray-600 uppercase lg:sticky">
              <div class="flex items-center justify-center">
                <span class="px-2 text-base font-semibold text-gray-700 dark:text-white">
                  {{ selectedYear }}
                </span>
              </div>
            </th>
            <!-- Colonnes mois -->
            <th
              v-for="(month, index) in monthsWithColspan"
              :key="'month-' + index"
              :colspan="month.colspan"
              class="border-primary-200 bg-primary-100 text-primary-700 border-x border-b px-1 py-1 text-center text-xs font-semibold">
              {{ month.name }}
            </th>
          </tr>
          <!-- Ligne des semaines -->
          <tr class="border-primary-200 border-b bg-white">
            <!-- Colonnes semaines -->
            <th
              v-for="week in weeks"
              :key="week.number"
              class="min-w-[24px] border-b border-gray-200 px-0 text-center text-sm font-medium text-gray-500 transition-colors dark:border-gray-700 dark:text-gray-400">
              {{ week.label }}
            </th>
          </tr>
        </thead>

        <!-- Corps du tableau - Vue VOIE -->
        <tbody v-if="activeTab === 'voie'" class="divide-y divide-gray-100 dark:divide-gray-700/50">
          <template v-for="group in groupedVoieData" :key="`${group.type}-${group.category}`">
            <!-- En-tête de section -->
            <tr
              class="border-t-2"
              :class="
                group.type === 'RLT'
                  ? 'border-t-purple-400 bg-purple-100 dark:border-t-purple-600 dark:bg-purple-500'
                  : 'border-t-fuchsia-400 bg-fuchsia-100 dark:border-t-fuchsia-600 dark:bg-fuchsia-500'
              ">
              <td
                class="border-primary-200 left-0 z-20 px-3 py-2 lg:sticky"
                :class="
                  group.type === 'RLT' ? 'bg-purple-100 dark:bg-purple-500' : 'bg-fuchsia-100 dark:bg-fuchsia-500'
                ">
                <span
                  class="text-sm font-bold tracking-wide uppercase"
                  :class="
                    group.type === 'RLT'
                      ? 'text-purple-700 dark:text-purple-100'
                      : 'text-fuchsia-700 dark:text-fuchsia-100'
                  ">
                  {{ group.type }} {{ group.category }}
                </span>
              </td>
              <td :colspan="53"></td>
            </tr>

            <!-- Utilisateurs du groupe -->
            <template v-for="user in group.users" :key="user.email" class="break-inside-avoid">
              <!-- Ligne du responsable -->
              <tr>
                <td class="border-primary-200 left-0 z-20 border-r bg-white px-3 py-2 lg:sticky">
                  <div class="flex items-center gap-3">
                    <span class="text-sm font-semibold text-gray-800 dark:text-white">
                      {{ user.nom }} {{ user.prenom }}
                    </span>
                    <span v-if="user.en_formation"
                      class="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                      <Icon name="lucide:graduation-cap" size="12" />
                      En formation
                    </span>
                  </div>
                </td>
                <td :colspan="53" class="text-end">
                  <span class="text-primary-600 mr-2 text-xs italic">
                    {{ user.chantiers.length }} chantier{{ user.chantiers.length > 1 ? 's' : '' }}
                  </span>
                </td>
              </tr>

              <!-- Lignes des chantiers -->
              <ChantierTimelineRow
                v-for="chantier in user.chantiers"
                :key="`${user.email}-${chantier.id}`"
                :chantier="chantier"
                :weeks="weeks"
                :selected-year="selectedYear"
                :hovered-week="hoveredWeek"
                :show-contacts="false"
                @week-hover="hoveredWeek = $event"
                @week-leave="hoveredWeek = null" />

              <!-- Ligne si aucun chantier attribué -->
              <tr v-if="user.chantiers.length === 0" class="bg-white">
                <td class="border-primary-200 left-0 z-20 border-r bg-white px-3 pl-6 lg:sticky">
                  <span class="text-xs text-gray-400 italic dark:text-gray-500">Aucun chantier attribué</span>
                </td>
                <td :colspan="53"></td>
              </tr>

              <!-- Ligne des absences -->
              <ChantierAbsencesTimelineRow
                :user="user"
                :weeks="weeks"
                :selected-year="selectedYear"
                :hovered-week="hoveredWeek"
                :can-edit="false"
                @week-hover="hoveredWeek = $event"
                @week-leave="hoveredWeek = null" />
            </template>
          </template>

          <!-- Message si aucun responsable -->
          <tr v-if="groupedVoieData.length === 0">
            <td colspan="54" class="px-6 py-12 text-center">
              <div class="flex flex-col items-center gap-3">
                <Icon name="lucide:x" size="32" class="text-primary-300" />
                <p class="text-gray-500 dark:text-gray-400">Aucun RLT/KV Voie disponible</p>
              </div>
            </td>
          </tr>
        </tbody>

        <!-- Corps du tableau - Vue SES -->
        <tbody v-if="activeTab === 'ses'" class="divide-y divide-gray-100 dark:divide-gray-700/50">
          <template v-for="group in groupedSesData" :key="`${group.type}-${group.category}`">
            <!-- En-tête de section -->
            <tr
              class="border-t-2"
              :class="
                group.type === 'RLT'
                  ? 'border-t-blue-400 bg-blue-100 dark:border-t-blue-600 dark:bg-blue-500'
                  : 'border-t-indigo-400 bg-indigo-100 dark:border-t-indigo-600 dark:bg-indigo-500'
              ">
              <td
                class="left-0 z-20 px-3 py-2 lg:sticky"
                :class="group.type === 'RLT' ? 'bg-blue-100 dark:bg-blue-500' : 'bg-indigo-100 dark:bg-indigo-500'">
                <span
                  class="text-sm font-bold tracking-wide uppercase"
                  :class="
                    group.type === 'RLT' ? 'text-blue-700 dark:text-blue-100' : 'text-indigo-700 dark:text-indigo-100'
                  ">
                  {{ group.type }} {{ group.category }}
                </span>
              </td>
              <td :colspan="53"></td>
            </tr>

            <!-- Utilisateurs du groupe -->
            <template v-for="user in group.users" :key="user.email" class="break-inside-avoid">
              <!-- Ligne du responsable -->
              <tr
                :class="
                  group.type === 'RLT' ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'bg-indigo-50/50 dark:bg-indigo-900/10'
                ">
                <td class="border-primary-200 left-0 z-20 border-r bg-white px-3 py-2 lg:sticky">
                  <div class="flex items-center gap-3">
                    <span class="text-primary-800 text-sm font-semibold">{{ user.nom }} {{ user.prenom }}</span>
                    <span v-if="user.en_formation"
                      class="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                      <Icon name="lucide:graduation-cap" size="12" />
                      En formation
                    </span>
                  </div>
                </td>
                <td :colspan="53" class="bg-white text-end">
                  <span class="text-primary-600 mr-2 text-xs italic">
                    {{ user.chantiers.length }} chantier{{ user.chantiers.length > 1 ? 's' : '' }}
                  </span>
                </td>
              </tr>

              <!-- Lignes des chantiers -->
              <ChantierTimelineRow
                v-for="chantier in user.chantiers"
                :key="`${user.email}-${chantier.id}`"
                :chantier="chantier"
                :weeks="weeks"
                :show-contacts="false"
                :selected-year="selectedYear"
                :hovered-week="hoveredWeek"
                @week-hover="hoveredWeek = $event"
                @week-leave="hoveredWeek = null" />

              <!-- Ligne si aucun chantier attribué -->
              <tr v-if="user.chantiers.length === 0" class="bg-gray-50/50 dark:bg-gray-800/30">
                <td
                  class="left-0 z-20 border-r border-gray-200 bg-gray-50/50 px-3 pl-6 lg:sticky dark:border-gray-700 dark:bg-gray-800/30">
                  <span class="text-xs text-gray-400 italic dark:text-gray-500">Aucun chantier attribué</span>
                </td>
                <td :colspan="53"></td>
              </tr>

              <!-- Ligne des absences -->
              <ChantierAbsencesTimelineRow
                :user="user"
                :weeks="weeks"
                :selected-year="selectedYear"
                :hovered-week="hoveredWeek"
                :can-edit="false"
                @week-hover="hoveredWeek = $event"
                @week-leave="hoveredWeek = null" />
            </template>
          </template>

          <!-- Message si aucun responsable -->
          <tr v-if="groupedSesData.length === 0">
            <td colspan="54" class="px-6 py-12 text-center">
              <div class="flex flex-col items-center gap-3">
                <Icon name="lucide:x" size="32" class="text-gray-300 dark:text-gray-600" />
                <p class="text-gray-500 dark:text-gray-400">Aucun RLT/KV SES disponible</p>
              </div>
            </td>
          </tr>
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
    margin-top: 5mm; /* Espace pour le header fixe */
    margin-bottom: 5mm;
    margin-left: 5mm;
    margin-right: 5mm;
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
