<script setup>
definePageMeta({
  requiresAuth: true,
  requiredRole: ''
})

useHead({
  title: 'H00 - Mes taches',
  description: 'Liste de mes taches H00'
})

const { addToast } = useToast()
const { setLoader } = useLoader()
const user = useAuthUser()

const { getChantiers, getChantiersNonTermines, getAllChantiers } = useChantiers()
const { getContactsTravauxChantiersArray } = useContacts()
const { getH00ByChantierArray } = useH00()
const { isAuthorizedForTache, isUserIntervenant } = useLevelUser()

// États pour les chantiers et tâches
const userChantiers = ref([])
const allTaches = ref([])

// Formatage du mois (month est 1-indexé : 1-12)
function formatMonthYear(year, month) {
  const date = new Date(year, month - 1, 1)

  const monthName = date.toLocaleDateString('fr-FR', { month: 'long' }).toUpperCase() // met tout en majuscule

  return {
    month: monthName,
    year: date.getFullYear()
  }
}

const selectedMonth = ref('current')
const selectedMonthData = computed(() => {
  return selectedMonth.value === 'current' ? currentMonth.value : nextMonth.value
})
const currentDate = new Date()

const currentMonth = computed(() => {
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth() // 0-11
  return { year, month, label: formatMonthYear(year, month + 1) } // +1 pour formatMonthYear qui attend 1-12
})
const nextMonth = computed(() => {
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth() + 1 // 0-11 + 1 = 1-12
  const nextMonthDate = new Date(year, month, 1)
  return {
    year: nextMonthDate.getFullYear(),
    month: nextMonthDate.getMonth(), // 0-11 pour les calculs
    label: formatMonthYear(nextMonthDate.getFullYear(), nextMonthDate.getMonth() + 1)
  }
})
const itemsRadio = computed(() => [
  {
    label: {
      month: currentMonth.value.label.month,
      year: currentMonth.value.label.year
    },
    value: 'current',
    nbTotalTaches: listTachesCurrentMonth.value.length
  },
  {
    label: {
      month: nextMonth.value.label.month,
      year: nextMonth.value.label.year
    },
    value: 'next',
    nbTotalTaches: listTachesNextMonth.value.length
  }
])

const listTachesCurrentMonth = computed(() => {
  // Filtrer par mois
  const selectedYear = selectedMonthData.value.year
  const selectedMonthNum = selectedMonthData.value.month
  const startOfMonth = new Date(selectedYear, selectedMonthNum, 1)
  const endOfMonth = new Date(selectedYear, selectedMonthNum + 1, 0, 23, 59, 59)

  return allTaches.value.filter((tache) => {
    if (!tache.prevision) return false
    const previsionDate = new Date(tache.prevision)
    return previsionDate <= endOfMonth
  })
})

const listTachesNextMonth = computed(() => {
  // Filtrer par mois
  const selectedYear = nextMonth.value.year
  const selectedMonthNum = nextMonth.value.month
  const startOfMonth = new Date(selectedYear, selectedMonthNum, 1)
  const endOfMonth = new Date(selectedYear, selectedMonthNum + 1, 0, 23, 59, 59)

  return allTaches.value.filter((tache) => {
    if (!tache.prevision) return false
    const previsionDate = new Date(tache.prevision)
    return previsionDate >= startOfMonth && previsionDate <= endOfMonth
  })
})

const userIdPresentInContactsTravaux = (userId, contactsTravaux) => {
  return contactsTravaux
    .filter((item) => {
      const fields = [
        item.rlt_voie_principale,
        ...(item.rlt_voie_secondaire || []),
        item.rlt_ses_principale,
        ...(item.rlt_ses_secondaire || []),
        item.rlt_cat_principale,
        ...(item.rlt_cat_secondaire || []),
        item.preop_voie,
        item.preop_ses,
        item.logistique,
        ...(item.supervisor || [])
      ]

      return fields.includes(userId)
    })
    .map((item) => item.chantier_id) // 👉 EXTRACTION UNIQUEMENT DES IDs
}

const loadAllData = async () => {
  setLoader(true)
  try {
    // Récupérer tous les chantiers
    await getChantiers()
    // Si il y a des chantiers non terminés, récupérer les IDs des chantiers non terminés
    if (getChantiersNonTermines.value.length > 0) {
      // Récupérer les IDs des chantiers non terminés
      const chantiersNonTermineIds = getChantiersNonTermines.value.map((chantier) => chantier.id)
      // Récupérer les contacts des chantiers non terminés
      const contactsTravaux = await getContactsTravauxChantiersArray(chantiersNonTermineIds)
      // Vérifier si l'utilisateur est présent dans les contacts des chantiers non terminés
      const matchingChantierContactIds = userIdPresentInContactsTravaux(user.value.id, contactsTravaux)
      // Filtrer les chantiers pour ne garder que ceux qui ont des contacts travaux avec l'utilisateur
      userChantiers.value = getAllChantiers.value.filter((chantier) => matchingChantierContactIds.includes(chantier.id))
      // Récupérer les entrées h00 pour les chantiers non terminés ou le user est intervenant
      const h00Entries = await getH00ByChantierArray(matchingChantierContactIds)
      // Filtrer les entrées h00 pour ne garder que celles qui sont autorisées par l'utilisateur
      const filtered = await Promise.all(
        h00Entries.data.map(async (item) => {
          const authorized = await isAuthorizedForTache(
            item.chantiers, // ou props.chantier selon ton contexte
            item.taches.tache_profil
          )
          return authorized ? item : null
        })
      )
      // Filtrer les entrées h00 pour ne garder que celles qui sont autorisées par l'utilisateur
      const filteredH00Entries = filtered.filter((item) => item !== null)
      allTaches.value = filteredH00Entries
    }
  } finally {
    setLoader(false)
  }
}

onMounted(async () => {
  await loadAllData()
})
</script>

<template>
  <AppPageLayout>
    <!-- Slot sidebar - Partie gauche sticky -->
    <template #sidebar>
      <div class="space-y-4">
        <div class="flex gap-2">
          <div
            v-for="item in itemsRadio"
            :key="item.value"
            @click="selectedMonth = item.value"
            class="hover:border-primary-600/50 flex flex-1 cursor-pointer flex-col items-center justify-between gap-4 rounded-xl border p-3 transition-all duration-300 hover:shadow-lg"
            :class="
              selectedMonth === item.value
                ? 'border-primary-600 from-primary-400 to-primary-600 bg-linear-to-br text-white'
                : 'border-gray-300 bg-white hover:bg-gray-50'
            ">
            <!-- Label -->
            <div class="flex w-full flex-col items-center justify-center">
              <div class="text-center text-xl font-bold">{{ item.label.month }}</div>
              <div class="-mt-1 text-lg font-bold">{{ item.label.year }}</div>
            </div>
            <div
              class="w-full rounded-full border text-center text-lg font-medium tracking-wide"
              :class="
                selectedMonth === item.value
                  ? 'border-primary-600 bg-primary-200 text-primary-800'
                  : 'bg-gray-100 text-gray-800'
              ">
              {{ item.nbTotalTaches }}
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Contenu principal avec bouton de test -->
    <template #default>
      <br />
    </template>
  </AppPageLayout>

  <!-- Modal de confirmation (utilisation générique avec slots) -->
</template>
