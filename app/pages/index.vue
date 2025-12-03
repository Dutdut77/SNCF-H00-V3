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
const { getH00ByChantierArray, updateH00Entry, deleteH00Entry } = useH00()
const { isAuthorizedForTache, isUserIntervenant } = useLevelUser()

// États pour les chantiers et tâches
const userChantiers = ref([])
const allTaches = ref([])
const selectedChantier = ref(null)
const globalFilterChantier = ref('')
const globalFilterTache = ref('')
const selectedTache = ref({})
const commentaire = ref('')
const important = ref(false)
const alerte = ref(false)
const dateCloture = ref(null)
const open = ref(false)
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

const itemsLeftNavBar = computed(() => {
  if (selectedMonth.value === 'current') {
    const grouped = listTachesCurrentMonth.value.reduce((acc, item) => {
      const id = item.chantier_id
      if (!acc[id]) {
        acc[id] = {
          chantier: item.chantiers,
          taches: []
        }
      }
      acc[id].taches.push(item)
      return acc
    }, {})

    const items = [
      {
        value: null,
        label: 'Tous les chantiers',
        icon: 'lucide-folder',
        badge: allTaches.length
      },
      ...Object.values(grouped).map((group) => ({
        value: group.chantier.id,
        label: `${group.chantier.compte} ${group.chantier.name}`,
        icon: 'lucide-folder',
        badge: group.taches.length
      }))
    ]
    return items
  }
  if (selectedMonth.value === 'next') {
    const grouped = listTachesNextMonth.value.reduce((acc, item) => {
      const id = item.chantier_id
      if (!acc[id]) {
        acc[id] = {
          chantier: item.chantiers,
          taches: []
        }
      }
      acc[id].taches.push(item)
      return acc
    }, {})
    const items = [
      {
        value: null,
        label: 'Tous les chantiers',
        icon: 'lucide-folder',
        badge: allTaches.length
      },
      ...Object.values(grouped).map((group) => ({
        value: group.chantier.id,
        label: `${group.chantier.compte} ${group.chantier.name}`,
        icon: 'lucide-folder',
        badge: group.taches.length
      }))
    ]
    return items
  }
  return []
})
// Fonction pour formater une date en "Oct 2025" (mois court)
const formatDateMonthYear = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  const monthYear = date.toLocaleDateString('fr-FR', {
    month: 'short',
    year: 'numeric'
  })
  // Mettre la première lettre en majuscule
  return monthYear.charAt(0).toUpperCase() + monthYear.slice(1)
}

// Fonction pour déterminer le statut de réalisation
const getRealisationStatus = (tache) => {
  const status = tache.status
  const prevision = tache.prevision

  // Si status = 2, la tâche est clôturée
  if (status === 2) {
    return { type: 'fait', label: 'Fait' }
  }

  // Si status = 1, la tâche est en cours
  if (status === 1) {
    return { type: 'en_cours', label: 'En cours' }
  }

  // Si status = 0, vérifier si la tâche est prévue dans le mois en cours ou avant
  if (status === 0 && prevision) {
    const now = new Date()
    const previsionDate = new Date(prevision)
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const previsionMonth = new Date(previsionDate.getFullYear(), previsionDate.getMonth(), 1)

    // Si la prévision est dans le mois en cours ou avant
    if (previsionMonth <= currentMonth) {
      return { type: 'a_faire', label: 'À faire' }
    }
  }

  // Aucun cas ne correspond
  return null
}
// Fonction pour convertir une date au format YYYY-MM-DD pour l'input date
const formatDateForInput = (dateString) => {
  if (!dateString) return null
  const date = new Date(dateString)
  // Vérifier que la date est valide
  if (isNaN(date.getTime())) return null
  // Retourner au format YYYY-MM-DD
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Ouvrir la sidebar avec les détails de la tâche
const showSlide = (row) => {
  if (row) {
    selectedTache.value = row
    commentaire.value = row.commentaire || ''
    important.value = row.important || false
    alerte.value = row.alerte || false
    // Préremplir la date de clôture si la tâche est clôturée (status === 2)
    if (row.status === 2 && row.realisation) {
      dateCloture.value = formatDateForInput(row.realisation)
    } else {
      dateCloture.value = null
    }
    open.value = true
  } else {
    open.value = !open.value
  }
}

const listTachesSelected = computed(() => {
  // 1. Déterminer la liste totale selon le mois sélectionné
  const list = selectedMonth.value === 'current' ? listTachesCurrentMonth.value : listTachesNextMonth.value

  // 2. Si aucun chantier sélectionné → retourner toute la liste
  if (!selectedChantier.value) {
    return list
  }

  // 3. Sinon filtrer par chantier_id
  return list.filter((t) => t.chantier_id === selectedChantier.value)
})

const filteredlistTachesSelected = computed(() => {
  const search = globalFilterTache.value?.toLowerCase() ?? ''

  let result = listTachesSelected.value

  // Filtre texte
  if (search) {
    result = result.filter(
      (t) =>
        t.categories?.name?.toLowerCase().includes(search) ||
        t.taches?.tache?.toLowerCase().includes(search) ||
        t.chantiers?.compte?.toLowerCase().includes(search) ||
        t.chantiers?.name?.toLowerCase().includes(search)
    )
  }

  return result
})

const filteredItemsLeftNavBar = computed(() => {
  const search = globalFilterChantier.value?.toLowerCase() ?? ''

  let result = itemsLeftNavBar.value

  // Filtre texte
  if (search) {
    result = result.filter((t) => t.label?.toLowerCase().includes(search))
  }

  return result
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

const sortByPrevision = (entries) => {
  if (!Array.isArray(entries)) return []

  return [...entries].sort((a, b) => {
    const dateA = new Date(a.prevision)
    const dateB = new Date(b.prevision)

    // 1️⃣ Tri par date
    const diffDate = dateA - dateB
    if (diffDate !== 0) return diffDate

    // 2️⃣ Si la date est identique → tri par id
    return a.id - b.id
  })
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
      // Filtrer les entrées h00 pour ne garder que celles qui sont autorisées par l'utilisateur et non cloturées
      const filteredH00EntriesNotNull = filtered.filter((item) => item !== null)
      const filteredH00EntriesNotCloturer = filteredH00EntriesNotNull.filter((item) => item.status !== 2)

      // Trier les entrées h00 par date de prévision
      const sortedEntries = sortByPrevision(filteredH00EntriesNotCloturer)

      allTaches.value = sortedEntries
    }
  } finally {
    setLoader(false)
  }
}
// Fonction pour clôturer la tâche
const cloturerTache = async () => {
  setLoader(true)
  try {
    const { error } = await updateH00Entry(selectedTache.value.id, {
      status: 2,
      realisation: formatDateForInput(dateCloture.value),
      commentaire: commentaire.value,
      important: important.value,
      alerte: alerte.value
    })
    if (error) throw error
    await loadAllData()
    open.value = false
  } catch (err) {
    console.error('Erreur lors de la clôture:', err)
  } finally {
    setLoader(false)
  }
}

// Fonction pour enregistrer
const enregistrer = async () => {
  setLoader(true)
  try {
    const newStatus = commentaire.value.trim() !== '' ? 1 : 0
    const { error } = await updateH00Entry(selectedTache.value.id, {
      status: newStatus,
      commentaire: commentaire.value,
      important: important.value,
      alerte: alerte.value
    })
    if (error) throw error
    await loadAllData()
    open.value = false
  } catch (err) {
    console.error("Erreur lors de l'enregistrement:", err)
  } finally {
    setLoader(false)
  }
}
// Fonction pour marquer comme non concerné (supprimer)
const nonConcerne = async () => {
  setLoader(true)
  try {
    const { error } = await deleteH00Entry(selectedTache.value.id)
    if (error) throw error
    await loadAllData()
    open.value = false
  } catch (err) {
    console.error('Erreur lors de la suppression:', err)
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
                : 'border-primary-300 hover:bg-primary-50 bg-white'
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
                  : 'border-primary-300 bg-gray-100 text-gray-800'
              ">
              {{ item.nbTotalTaches }}
            </div>
          </div>
        </div>
        <AppInputSearch
          v-model="globalFilterChantier"
          class="w-full max-w-md"
          placeholder="Rechercher un chantier ..." />

        <AppLeftNavBar v-model="selectedChantier" :items="filteredItemsLeftNavBar" title="" />
      </div>
    </template>

    <!-- Contenu principal avec bouton de test -->
    <template #default>
      <div class="space-y-4">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <AppTitleMain title="Liste des tâches" description="Toutes les tâches en cours pour le mois sélectionné" />
        </div>
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <AppInputSearch v-model="globalFilterTache" class="w-full max-w-md" placeholder="Rechercher une tâche ..." />
        </div>

        <div
          class="flex min-h-0 w-full flex-1 flex-col rounded-md border border-gray-200 bg-white lg:overflow-auto dark:border-gray-700 dark:bg-gray-900">
          <div class="min-h-0 flex-1 overflow-auto">
            <table class="w-full text-sm">
              <thead
                class="sticky top-0 z-10 border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                <tr>
                  <th
                    class="hidden items-center justify-center py-3 font-semibold text-gray-700 lg:flex dark:text-gray-200">
                    Compte
                  </th>
                  <th class="py-3 pl-2 text-left font-semibold text-gray-700 lg:pl-0 dark:text-gray-200">Tâche</th>
                  <th class="px-8 py-3 text-center font-semibold text-gray-700 dark:text-gray-200">Prévision</th>
                  <th>Status</th>
                  <th>#</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                <tr
                  v-for="t in filteredlistTachesSelected"
                  :key="t.id"
                  class="cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  @click="showSlide(t)">
                  <td class="hidden py-4 lg:flex">
                    <div v-if="t.categories?.name" class="w-full px-4">
                      <div
                        class="bg-primary-50 dark:bg-primary-900/30 border-primary-200 dark:border-primary-700 mx-auto w-full rounded-md border px-2 text-center text-xs text-gray-600 italic">
                        {{ t.chantiers.compte }}
                      </div>
                    </div>
                  </td>
                  <td class="pl-2 lg:pl-0">
                    {{ t.taches?.tache }}
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex w-full items-center justify-center whitespace-nowrap">
                      {{ formatDateMonthYear(t.prevision) }}
                    </div>
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex w-full items-center justify-center gap-2">
                      <Icon v-if="t.important" name="lucide:triangle-alert" size="16" class="text-yellow-500" />
                      <Icon v-else name="lucide:triangle-alert" size="16" class="text-gray-300" />
                      <Icon v-if="t.alerte" name="lucide:siren" size="18" class="mb-0.5 text-red-500" />
                      <Icon v-else name="lucide:siren" size="18" class="mb-0.5 text-gray-300" />
                    </div>
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex w-full items-center justify-center">
                      <template v-if="getRealisationStatus(t)">
                        <div
                          class="flex w-20 items-center justify-center rounded-md px-2 py-1 text-xs whitespace-nowrap"
                          :class="
                            getRealisationStatus(t).type === 'fait'
                              ? 'bg-green-100 text-green-700'
                              : getRealisationStatus(t).type === 'en_cours'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                          ">
                          {{ getRealisationStatus(t).label }}
                        </div>
                      </template>
                      <span v-else class="text-muted">-</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- SlideOver pour édition/création -->
        <AppSlideOver :sideModal="open" :closeSideModal="showSlide">
          <template #default>
            <AppSlideOverContent v-if="open" :closeSideModal="showSlide">
              <template #header>
                <div class="text-center">
                  <div
                    class="bg-primary-100 dark:bg-primary-900/30 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                    <Icon name="lucide:clipboard-edit" size="28" class="text-primary-500" />
                  </div>
                  <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
                    {{ selectedTache.chantiers?.name }}
                  </h2>
                  <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {{ selectedTache.taches?.tache }}
                  </p>
                </div>
              </template>

              <template #default>
                <div class="flex flex-col gap-6">
                  <div class="flex items-center border-b py-2 text-left text-base font-medium uppercase">
                    Informations
                  </div>
                  <div class="flex items-center justify-between gap-2">
                    <AppSwitch v-model="important" label="Important" class="full" />

                    <AppSwitch v-model="alerte" label="Alerte" class="full" />
                  </div>

                  <div class="flex items-center border-b py-2 text-left text-base font-medium uppercase">
                    Commentaires
                  </div>

                  <!-- Nom de la tâche -->
                  <div class="flex flex-col gap-1.5">
                    <textarea
                      v-model="commentaire"
                      rows="4"
                      class="focus:ring-primary-500 w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-transparent focus:ring-2 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      placeholder="Ajoutez un commentaire..."></textarea>
                  </div>

                  <AppDatePicker
                    v-model="dateCloture"
                    title="Date de clôture"
                    placeholder="Sélectionnez une date"
                    clearable />
                </div>
              </template>

              <template #footer>
                <div class="flex flex-col items-center justify-end gap-2 lg:flex-row">
                  <AppButtonValidated
                    type="button"
                    theme="primary"
                    :validated="!!dateCloture"
                    @click="cloturerTache()"
                    class="w-full lg:w-auto">
                    <template #default>
                      <span class="flex items-center gap-2">
                        <Icon name="lucide:infinity" size="16" />
                        Clôturer
                      </span>
                    </template>
                  </AppButtonValidated>
                  <AppButtonValidated type="button" theme="delete" @click="nonConcerne()" class="w-full lg:w-auto">
                    <template #default>
                      <span class="flex items-center gap-2">
                        <Icon name="lucide:x" size="16" />
                        Non concerné
                      </span>
                    </template>
                  </AppButtonValidated>
                  <AppButtonValidated type="button" theme="cancel" @click="enregistrer()" class="w-full lg:w-auto">
                    <template #default>
                      <span class="flex items-center gap-2">
                        <Icon name="lucide:save" size="16" />
                        Enregistrer
                      </span>
                    </template>
                  </AppButtonValidated>
                </div>
              </template>
            </AppSlideOverContent>
          </template>
        </AppSlideOver>
      </div>
    </template>
  </AppPageLayout>

  <!-- Modal de confirmation (utilisation générique avec slots) -->
</template>
