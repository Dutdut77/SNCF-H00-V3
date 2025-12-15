<script setup>
definePageMeta({
  requiresAuth: true,
  requiredRole: ''
})

useHead({
  title: 'H00 - Plan de Charge RLT',
  description: 'Vue par RLT des chantiers'
})

const { getChantiers } = useChantiers()
const { getAllUsers, users, getUsersRltVoie, getUsersRltSes, getUsersKvVoie, getUsersKvSes } = useUsers()
const { getAllContactsTravaux, allContactsTravaux } = useContacts()
const { setLoader } = useLoader()
const { getAllWeekends } = useTimeline()

// Accès direct au state partagé des chantiers
const allChantiers = useState('allChantiers')

// État réactif pour l'année sélectionnée
const selectedYear = ref(new Date().getFullYear())
const hoveredWeek = ref(null)

// Onglet actif (voie ou ses)
const activeTab = ref('voie')

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

// Navigation par année
const previousYear = () => {
  selectedYear.value--
}

const nextYear = () => {
  selectedYear.value++
}

// Fonction pour obtenir les infos d'un utilisateur
const getUserInfo = (userId) => {
  if (!userId || !users.value) return null

  const user = users.value.find((u) => u.id === userId)
  if (!user) return null

  return {
    id: user.id,
    nom: user.nom || '',
    prenom: user.prenom || '',
    fullName: user.prenom && user.nom ? `${user.prenom} ${user.nom}` : user.email || '-'
  }
}

// Fonction pour vérifier si un chantier a une date_rea visible sur l'année sélectionnée
const isChantierVisibleForYear = (chantier) => {
  if (!chantier.date_rea || !Array.isArray(chantier.date_rea) || chantier.date_rea.length === 0) {
    return false
  }

  return chantier.date_rea.some((periode) => {
    if (!periode.date_start_travaux) return false

    const startDate = new Date(periode.date_start_travaux)
    const endDate = periode.date_end_travaux ? new Date(periode.date_end_travaux) : null

    const startYear = startDate.getFullYear()
    const endYear = endDate ? endDate.getFullYear() : startYear

    return startYear <= selectedYear.value && endYear >= selectedYear.value
  })
}

// Fonction pour obtenir les chantiers d'un RLT/KV
const getChantiersForUser = (userId, contactTypes) => {
  if (!allContactsTravaux.value || !allChantiers.value) return []

  // Trouver tous les chantier_ids où cet utilisateur est associé
  const chantierIds = allContactsTravaux.value
    .filter((contact) => {
      return contactTypes.some((type) => {
        const value = contact[type]
        if (Array.isArray(value)) {
          return value.includes(userId)
        }
        return value === userId
      })
    })
    .map((c) => c.chantier_id)

  // Récupérer les chantiers correspondants et filtrer par année
  return allChantiers.value
    .filter((chantier) => chantierIds.includes(chantier.id) && isChantierVisibleForYear(chantier))
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
    .map((user) => {
      const userInfo = getUserInfo(user.id)
      const chantiers = getChantiersForUser(user.id, ['rlt_voie_principale', 'rlt_voie_secondaire'])
      return {
        ...userInfo,
        type: 'RLT',
        chantiers
      }
    })
    .filter((u) => u.chantiers.length > 0)
})

// Computed pour les KV Voie avec leurs chantiers
const kvVoieWithChantiers = computed(() => {
  if (!getUsersKvVoie.value) return []

  return getUsersKvVoie.value
    .map((user) => {
      const userInfo = getUserInfo(user.id)
      const chantiers = getChantiersForUser(user.id, ['kv_voie'])
      return {
        ...userInfo,
        type: 'KV',
        chantiers
      }
    })
    .filter((u) => u.chantiers.length > 0)
})

// Computed pour les RLT SES avec leurs chantiers
const rltSesWithChantiers = computed(() => {
  if (!getUsersRltSes.value) return []

  return getUsersRltSes.value
    .map((user) => {
      const userInfo = getUserInfo(user.id)
      const chantiers = getChantiersForUser(user.id, ['rlt_ses_principale', 'rlt_ses_secondaire'])
      return {
        ...userInfo,
        type: 'RLT',
        chantiers
      }
    })
    .filter((u) => u.chantiers.length > 0)
})

// Computed pour les KV SES avec leurs chantiers
const kvSesWithChantiers = computed(() => {
  if (!getUsersKvSes.value) return []

  return getUsersKvSes.value
    .map((user) => {
      const userInfo = getUserInfo(user.id)
      const chantiers = getChantiersForUser(user.id, ['kv_ses'])
      return {
        ...userInfo,
        type: 'KV',
        chantiers
      }
    })
    .filter((u) => u.chantiers.length > 0)
})

// Données combinées pour l'affichage
const voieData = computed(() => {
  return [...rltVoieWithChantiers.value, ...kvVoieWithChantiers.value]
})

const sesData = computed(() => {
  return [...rltSesWithChantiers.value, ...kvSesWithChantiers.value]
})

// Total des chantiers par onglet
const totalChantiersVoie = computed(() => {
  const uniqueIds = new Set()
  voieData.value.forEach((user) => {
    user.chantiers.forEach((c) => uniqueIds.add(c.id))
  })
  return uniqueIds.size
})

const totalChantiersSes = computed(() => {
  const uniqueIds = new Set()
  sesData.value.forEach((user) => {
    user.chantiers.forEach((c) => uniqueIds.add(c.id))
  })
  return uniqueIds.size
})

// Charger les données au montage
onMounted(async () => {
  setLoader(true)
  try {
    await Promise.all([getChantiers(), getAllUsers(), getAllContactsTravaux(), getAllWeekends()])
  } finally {
    setLoader(false)
  }
})
</script>

<template>
  <div class="flex h-full w-full flex-col gap-4 overflow-hidden p-4 lg:px-4 lg:py-0 lg:pt-4">
    <!-- Header avec titre et navigation -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <AppTitleMain title="Plan de charge RLT" description="Vue des chantiers par responsable RLT et contrôleur" />
    </div>

    <!-- Onglets + Légende -->
    <div class="flex flex-col items-center justify-between gap-4 lg:flex-row">
      <!-- Onglets Voie / SES -->
      <div class="flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
        <button
          type="button"
          @click="activeTab = 'voie'"
          class="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all"
          :class="
            activeTab === 'voie'
              ? 'bg-purple-500 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
          ">
          <Icon name="lucide:train-track" size="18" />
          Voie
          <span
            class="rounded-full px-2 py-0.5 text-xs"
            :class="activeTab === 'voie' ? 'bg-purple-600' : 'bg-gray-200 dark:bg-gray-700'">
            {{ totalChantiersVoie }}
          </span>
        </button>
        <button
          type="button"
          @click="activeTab = 'ses'"
          class="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all"
          :class="
            activeTab === 'ses'
              ? 'bg-primary-500 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
          ">
          <Icon name="lucide:zap" size="18" />
          SES
          <span
            class="rounded-full px-2 py-0.5 text-xs"
            :class="activeTab === 'ses' ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'">
            {{ totalChantiersSes }}
          </span>
        </button>
      </div>

      <!-- Légende -->
      <div class="flex cursor-default items-center gap-2">
        <div class="rounded-md border border-slate-600 bg-slate-500/60 px-2 py-1 text-xs font-bold text-white">
          Terminé
        </div>
        <div class="rounded-md border border-sky-600 bg-sky-500/60 px-2 py-1 text-xs font-bold text-white">RLT</div>
        <div class="rounded-md border border-lime-600 bg-lime-500/60 px-2 py-1 text-xs font-bold text-white">Pré-op</div>
        <div class="rounded-md border border-purple-600 bg-purple-500/60 px-2 py-1 text-xs font-bold text-white">
          Externe
        </div>
        <div class="rounded-md border border-orange-600 bg-orange-500/60 px-2 py-1 text-xs font-bold text-white">
          Week-end
        </div>
      </div>

      <!-- Placeholder pour alignement -->
      <div class="w-44"></div>
    </div>

    <!-- Tableau calendrier -->
    <div
      class="h-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <table class="w-full min-w-[1400px]">
        <!-- Header avec les semaines -->
        <thead class="sticky top-0 z-30">
          <tr class="bg-gray-50 dark:bg-gray-900/50">
            <!-- Colonne chantier -->
            <th
              class="sticky left-0 z-40 mx-auto min-w-[280px] border-r border-b border-gray-200 bg-gray-50 px-3 py-2 text-left text-[10px] font-semibold tracking-wider text-gray-600 uppercase dark:border-gray-700 dark:bg-gray-900/50 dark:text-gray-400">
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
          </tr>
        </thead>

        <!-- Corps du tableau - Vue VOIE -->
        <tbody v-if="activeTab === 'voie'" class="divide-y divide-gray-100 dark:divide-gray-700/50">
          <template v-for="user in voieData" :key="user.id">
            <!-- Ligne du responsable -->
            <tr class="bg-purple-50/50 dark:bg-purple-900/10">
              <td
                :colspan="54"
                class="sticky left-0 z-10 border-r border-gray-200 bg-purple-50/50 px-3 py-2 dark:border-gray-700 dark:bg-purple-900/10">
                <div class="flex items-center gap-3">
                  <AppAvatar :nom="user.nom" :prenom="user.prenom" size="sm" color="bg-purple-200 text-purple-600" />
                  <div>
                    <span class="font-semibold text-gray-800 dark:text-white">{{ user.fullName }}</span>
                    <span
                      class="ml-2 rounded-full px-2 py-0.5 text-xs font-medium"
                      :class="
                        user.type === 'RLT'
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300'
                          : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300'
                      ">
                      {{ user.type }}
                    </span>
                  </div>
                  <span class="ml-auto text-xs text-gray-500 dark:text-gray-400">
                    {{ user.chantiers.length }} chantier{{ user.chantiers.length > 1 ? 's' : '' }}
                  </span>
                </div>
              </td>
            </tr>

            <!-- Lignes des chantiers -->
            <ChantierTimelineRowSimple
              v-for="chantier in user.chantiers"
              :key="`${user.id}-${chantier.id}`"
              :chantier="chantier"
              :weeks="weeks"
              :selected-year="selectedYear"
              :hovered-week="hoveredWeek"
              @week-hover="hoveredWeek = $event"
              @week-leave="hoveredWeek = null" />
          </template>

          <!-- Message si aucun responsable -->
          <tr v-if="voieData.length === 0">
            <td colspan="54" class="px-6 py-12 text-center">
              <div class="flex flex-col items-center gap-3">
                <Icon name="lucide:users-x" size="32" class="text-gray-300 dark:text-gray-600" />
                <p class="text-gray-500 dark:text-gray-400">Aucun RLT/KV Voie avec des chantiers pour {{ selectedYear }}</p>
              </div>
            </td>
          </tr>
        </tbody>

        <!-- Corps du tableau - Vue SES -->
        <tbody v-else-if="activeTab === 'ses'" class="divide-y divide-gray-100 dark:divide-gray-700/50">
          <template v-for="user in sesData" :key="user.id">
            <!-- Ligne du responsable -->
            <tr class="bg-primary-50/50 dark:bg-primary-900/10">
              <td
                :colspan="54"
                class="sticky left-0 z-10 border-r border-gray-200 bg-primary-50/50 px-3 py-2 dark:border-gray-700 dark:bg-primary-900/10">
                <div class="flex items-center gap-3">
                  <AppAvatar :nom="user.nom" :prenom="user.prenom" size="sm" color="bg-primary-200 text-primary-600" />
                  <div>
                    <span class="font-semibold text-gray-800 dark:text-white">{{ user.fullName }}</span>
                    <span
                      class="ml-2 rounded-full px-2 py-0.5 text-xs font-medium"
                      :class="
                        user.type === 'RLT'
                          ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300'
                          : 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300'
                      ">
                      {{ user.type }}
                    </span>
                  </div>
                  <span class="ml-auto text-xs text-gray-500 dark:text-gray-400">
                    {{ user.chantiers.length }} chantier{{ user.chantiers.length > 1 ? 's' : '' }}
                  </span>
                </div>
              </td>
            </tr>

            <!-- Lignes des chantiers -->
            <ChantierTimelineRowSimple
              v-for="chantier in user.chantiers"
              :key="`${user.id}-${chantier.id}`"
              :chantier="chantier"
              :weeks="weeks"
              :selected-year="selectedYear"
              :hovered-week="hoveredWeek"
              @week-hover="hoveredWeek = $event"
              @week-leave="hoveredWeek = null" />
          </template>

          <!-- Message si aucun responsable -->
          <tr v-if="sesData.length === 0">
            <td colspan="54" class="px-6 py-12 text-center">
              <div class="flex flex-col items-center gap-3">
                <Icon name="lucide:users-x" size="32" class="text-gray-300 dark:text-gray-600" />
                <p class="text-gray-500 dark:text-gray-400">Aucun RLT/KV SES avec des chantiers pour {{ selectedYear }}</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.overflow-auto {
  scroll-behavior: smooth;
}
</style>

