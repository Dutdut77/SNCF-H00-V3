<script setup>
definePageMeta({
  requiresAuth: true,
  requiredRole: ''
})

useHead({
  title: 'H00 - Mes taches',
  description: 'Liste de mes taches H00'
})

const { setLoader } = useLoader()

const { getChantiersUserNonTermines, allChantiersUserNonTermines } = useChantiers()
const { taches, getTaches } = useTaches()

const { updateH00Entry, deleteH00Entry } = useH00()
const { isAuthorizedForTacheBis } = useLevelUser()

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

const selectedRows = ref([])
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
  // Utiliser le mois ACTUEL (aujourd'hui), pas le mois sélectionné
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonthNum = now.getMonth()
  const endOfCurrentMonth = new Date(currentYear, currentMonthNum + 1, 0, 23, 59, 59)

  return allTaches.value.filter((tache) => {
    if (!tache.prevision) return false
    const previsionDate = new Date(tache.prevision)
    return previsionDate <= endOfCurrentMonth
  })
})

const listTachesNextMonth = computed(() => {
  // Le mois suivant reste inchangé
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
        compte: group.chantier.compte,
        label: group.chantier.name,
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
// Computed : vrai si tout est coché
const isAllSelected = computed(() => {
  return (
    selectedRows.value.length === filteredlistTachesSelected.value.length && filteredlistTachesSelected.value.length > 0
  )
})
// Master checkbox
const toggleSelectAll = (checked) => {
  if (checked) {
    selectedRows.value = filteredlistTachesSelected.value.map((r) => r)
  } else {
    selectedRows.value = []
  }
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
    result = result.filter((t) => t.compte?.toLowerCase().includes(search) || t.label?.toLowerCase().includes(search))
  }

  return result
})

const transformFlattenedTaches = (authorizedChantiers) => {
  if (!Array.isArray(authorizedChantiers)) return []

  // Map pour lookup rapide des infos de taches
  const tachesMap = new Map(taches.value.map((t) => [t.id, t]))

  return (
    authorizedChantiers
      .flatMap((chantier) => {
        return (chantier.h00 ?? []).map((h) => {
          return {
            ...h,
            taches: tachesMap.get(h.tache_id) ?? null,
            chantiers: {
              id: chantier.id,
              name: chantier.name,
              compte: chantier.compte,
              etat: chantier.etat
            }
          }
        })
      })
      // Tri par prevision
      .sort((a, b) => new Date(a.prevision) - new Date(b.prevision))
  )
}

const loadAllData = async () => {
  setLoader(true)
  try {
    await getTaches()
    await getChantiersUserNonTermines()

    const authorizedChantiers = isAuthorizedForTacheBis(allChantiersUserNonTermines.value, taches.value)
    authorizedChantiers.forEach((chantier) => {
      if (Array.isArray(chantier.h00)) {
        chantier.h00 = chantier.h00.filter((h) => h.status !== 2)
      }
    })
    const flattenedTaches = transformFlattenedTaches(authorizedChantiers)

    allTaches.value = flattenedTaches
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

    // Suppression locale directe au lieu de recharger
    const index = allTaches.value.findIndex((t) => t.id === selectedTache.value.id)
    if (index !== -1) {
      allTaches.value.splice(index, 1)
    }

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

    // Mise à jour locale directe au lieu de recharger
    const index = allTaches.value.findIndex((t) => t.id === selectedTache.value.id)
    if (index !== -1) {
      allTaches.value[index] = {
        ...allTaches.value[index],
        status: newStatus,
        commentaire: commentaire.value,
        important: important.value,
        alerte: alerte.value
      }
    }

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

    // Suppression locale directe au lieu de recharger
    const index = allTaches.value.findIndex((t) => t.id === selectedTache.value.id)
    if (index !== -1) {
      allTaches.value.splice(index, 1)
    }

    open.value = false
  } catch (err) {
    console.error('Erreur lors de la suppression:', err)
  } finally {
    setLoader(false)
  }
}

// Navigation vers le chantier sélectionné
const goToChantier = () => {
  if (selectedChantier.value) {
    navigateTo(`/chantiers/${selectedChantier.value}`)
  }
}

// Fonction pour imprimer les tâches sélectionnées
const printTaches = () => {
  if (selectedRows.value.length === 0) return
  // Stocker les tâches dans sessionStorage pour la page d'impression
  sessionStorage.setItem('printTaches', JSON.stringify(selectedRows.value))
  // Ouvrir la page d'impression dans un nouvel onglet
  window.open('/print/taches', '_blank')
}

const getCompteEtNomById = (id) => {
  const chantier = allChantiersUserNonTermines.value.find((c) => Number(c.id) === Number(id))

  return chantier
    ? { compte: chantier.compte, name: chantier.name }
    : { compte: 'Toutes les tâches en cours pour le mois sélectionné', name: 'Liste des tâches' }
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
            class="group flex flex-1 cursor-pointer flex-col items-center justify-between rounded-xl border p-3 transition-all duration-300 hover:shadow-lg"
            :class="
              selectedMonth === item.value
                ? 'border-secondary-400 from-secondary-400 to-secondary-500 shadow-secondary-600/80 bg-linear-to-br text-white shadow-lg'
                : 'hover:border-primary-700/30 border-primary-200 bg-primary-100 text-primary-600 hover:shadow-lg'
            ">
            <!-- Label -->
            <div class="flex w-full flex-col items-center justify-center">
              <div class="text-center text-xl font-bold">{{ item.label.month }}</div>
              <div class="-mt-2 text-lg font-bold tracking-widest">{{ item.label.year }}</div>
            </div>
            <div
              class="mt-1 w-full rounded-lg border text-center font-[Bangers] text-lg font-medium tracking-wide transition-all duration-300"
              :class="
                selectedMonth === item.value
                  ? 'border-slate-700 bg-linear-to-br from-slate-700 to-slate-900 text-white'
                  : 'border-primary-700/30 from-primary-100 to-primary-200 bg-linear-to-br text-slate-700 duration-300 group-hover:shadow-md'
              ">
              {{ item.nbTotalTaches }}
            </div>
          </div>
        </div>

        <AppInputSearch
          v-model="globalFilterChantier"
          class="w-full max-w-md"
          placeholder="Rechercher un chantier ..." />

        <!-- Liste des chantiers en cartes compactes -->
        <div class="flex flex-col gap-1.5 overflow-y-auto pr-1 pb-8">
          <div
            v-for="item in filteredItemsLeftNavBar"
            :key="item.value"
            @click="selectedChantier = item.value"
            class="group relative cursor-pointer overflow-hidden rounded-lg border p-3 transition-all duration-200"
            :class="
              selectedChantier === item.value
                ? 'border-primary-700/30 bg-linear-to-br from-slate-700 to-slate-900 shadow-lg'
                : 'hover:border-primary-700/30 border-primary-200 bg-primary-50 hover:shadow-lg'
            ">
            <!-- Indicateur latéral animé -->
            <div
              class="from-secondary-400 to-secondary-500 absolute top-0 left-0 h-full w-1 bg-linear-to-t transition-all duration-200"
              :class="selectedChantier === item.value ? '' : 'scale-y-0 group-hover:scale-y-100'"></div>

            <div class="flex items-center gap-3">
              <!-- Icône avec fond -->
              <div
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors duration-200"
                :class="
                  selectedChantier === item.value
                    ? 'bg-primary-500/20 text-secondary-400'
                    : 'bg-primary-700/20 group-hover:bg-primary-700/30 text-white'
                ">
                <Icon :name="item.icon || 'lucide:folder'" size="18" />
              </div>

              <!-- Label -->
              <div class="min-w-0 flex-1">
                <div class="flex flex-col">
                  <div
                    class="text-sm font-medium transition-colors duration-200"
                    :class="selectedChantier === item.value ? 'text-white' : 'text-primary-600'">
                    {{ item.compte }}
                  </div>
                  <div
                    class="truncate text-sm font-medium transition-colors duration-200"
                    :class="selectedChantier === item.value ? 'text-white' : 'text-primary-600'">
                    {{ item.label }}
                  </div>
                </div>
              </div>

              <!-- Badge avec le nombre de tâches -->
              <div
                v-if="item.badge !== undefined"
                class="flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-xs font-bold transition-all duration-200"
                :class="
                  selectedChantier === item.value
                    ? 'from-secondary-400 to-secondary-500 text-secondary-50 bg-linear-to-t'
                    : 'bg-primary-700/20 text-primary-800 group-hover:bg-primary-700/30'
                ">
                {{ item.badge }}
              </div>
            </div>
          </div>

          <!-- Message si aucun résultat -->
          <div
            v-if="filteredItemsLeftNavBar.length === 0"
            class="text-primary-500 flex flex-col items-center justify-center py-8">
            <Icon name="lucide:search-x" size="32" class="mb-2" />
            <p class="text-sm">Aucun chantier trouvé</p>
          </div>
        </div>
      </div>
    </template>

    <!-- Contenu principal avec bouton de test -->
    <template #default>
      <div class="space-y-4">
        <div
          class="flex cursor-pointer flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
          @click="goToChantier">
          <AppTitleMain
            :title="getCompteEtNomById(selectedChantier).name"
            :description="getCompteEtNomById(selectedChantier).compte" />
        </div>

        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <AppInputSearch v-model="globalFilterTache" class="w-full max-w-md" placeholder="Rechercher une tâche ..." />
          <div class="ml-auto flex flex-none items-center gap-2">
            <!-- Bouton vers le chantier -->
            <AppButtonValidated v-if="selectedChantier" theme="" type="button" @click="goToChantier" :validated="true">
              <template #default>
                <span class="flex flex-none items-center gap-2">
                  <Icon name="lucide:external-link" size="18" />
                  Voir le chantier
                </span>
              </template>
            </AppButtonValidated>

            <!-- Bouton imprimer -->
            <div class="hidden lg:flex">
              <AppButtonValidated
                theme="secondary"
                type="button"
                @click="printTaches"
                :validated="selectedRows.length > 0">
                <template #default>
                  <span class="flex items-center gap-2">
                    <Icon name="lucide:printer" size="18" />
                    Imprimer
                  </span>
                  <div
                    v-if="selectedRows.length > 0"
                    class="absolute top-0 right-0 flex h-6 w-6 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-gray-700 text-xs text-white shadow-md">
                    {{ selectedRows.length }}
                  </div>
                </template>
              </AppButtonValidated>
            </div>
          </div>
        </div>

        <div class="border-primary-200 bg-primary-50 flex w-full flex-1 flex-col overflow-x-auto rounded-md border">
          <table class="w-full text-sm">
            <thead class="border-primary-200 bg-primary-50 sticky top-0 z-10 border-b">
              <tr class="text-primary-800">
                <th class="hidden pl-2 lg:table-cell">
                  <AppCheckbox :model-value="isAllSelected" @update:model-value="toggleSelectAll" />
                </th>
                <th class="hidden items-center justify-center py-3 font-semibold lg:flex">Compte</th>
                <th class="py-3 pl-2 text-left font-semibold lg:pl-0">Chantier</th>
                <th class="px-8 py-3 text-center font-semibold">Tâche</th>
                <th class="px-8 py-3 text-center font-semibold">Prévision</th>
                <th>Status</th>
                <th>#</th>
              </tr>
            </thead>

            <tbody class="divide-primary-100 divide-y">
              <tr
                v-for="t in filteredlistTachesSelected"
                :key="t.id"
                class="hover:bg-primary-200 text-primary-800 cursor-pointer transition-colors"
                @click="showSlide(t)">
                <td class="hidden pl-2 lg:table-cell" @click.stop>
                  <AppCheckbox v-model="selectedRows" :value="t" />
                </td>
                <td class="hidden py-4 lg:flex">
                  <div v-if="t.chantiers?.compte" class="w-full px-4">
                    <div
                      class="border-primary-400/40 bg-secondary-400/50 text-secondary-950 dark:text-secondary-50 mx-auto w-full rounded-md border px-2 text-center text-xs font-bold italic">
                      {{ t.chantiers.compte }}
                    </div>
                  </div>
                </td>
                <td class="pl-2 lg:pl-0">
                  <div v-if="t.chantiers?.name" class="w-full">
                    <div class="text-primary-800 w-full text-left text-sm font-medium">
                      {{ t.chantiers.name }}
                    </div>
                  </div>
                </td>
                <td class="px-4 py-3">
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

        <!-- SlideOver pour édition/création -->
        <AppSlideOver :sideModal="open" :closeSideModal="showSlide">
          <template #default>
            <AppSlideOverContent v-if="open" :closeSideModal="showSlide">
              <template #header>
                <div class="text-center">
                  <div
                    class="bg-primary-500/20 dark:bg-primary-900/30 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                    <Icon name="lucide:clipboard-edit" size="28" class="text-primary-700" />
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
                <div class="flex h-full flex-col gap-6">
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
                  <div class="flex h-full flex-col gap-1.5">
                    <textarea
                      v-model="commentaire"
                      class="h-full w-full resize-y appearance-none rounded-lg border border-gray-400 p-4 text-gray-600 focus:border-gray-600 focus:ring-0 focus:outline-none"
                      name="commentaire"
                      id=""
                      cols="50"
                      rows="5"
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
