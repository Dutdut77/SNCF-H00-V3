<script setup>
const props = defineProps({
  chantier: {
    type: Object,
    required: true
  }
})

const { getH00ByChantier, updateH00Entry, deleteH00Entry } = useH00()
const { setLoader } = useLoader()
const { isAuthorizedForTache, isUserIntervenant } = useLevelUser()

const taches = ref([])
const globalFilter = ref('')

const open = ref(false)
const selectedTache = ref({})
const commentaire = ref('')
const important = ref(false)
const alerte = ref(false)
const dateCloture = ref(null)
const showOnlyAuthorized = ref(false)
const authorizedMap = ref({})

// Si on veut autoriser les admins et superadmins à modifier les taches
const canEdit = ref(false)
// Mettre à jour canEdit de manière asynchrone
watch(
  [() => selectedTache.value, () => props.chantier],
  async () => {
    if (!selectedTache.value?.taches) {
      canEdit.value = false
      return
    }
    try {
      canEdit.value = await isAuthorizedForTache(props.chantier, selectedTache.value.taches.tache_profil)
    } catch (error) {
      console.error('Erreur lors de la vérification des autorisations:', error)
      canEdit.value = false
    }
  },
  { immediate: true }
)

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

// Fonction pour clôturer la tâche
const cloturerTache = async () => {
  if (!canEdit.value) return

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
    await loadTaches()
    open.value = false
  } catch (err) {
    console.error('Erreur lors de la clôture:', err)
  } finally {
    setLoader(false)
  }
}

// Fonction pour enregistrer
const enregistrer = async () => {
  if (!canEdit.value) return

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
    await loadTaches()
    open.value = false
  } catch (err) {
    console.error("Erreur lors de l'enregistrement:", err)
  } finally {
    setLoader(false)
  }
}
// Fonction pour marquer comme non concerné (supprimer)
const nonConcerne = async () => {
  if (!canEdit.value) return

  setLoader(true)
  try {
    const { error } = await deleteH00Entry(selectedTache.value.id)
    if (error) throw error
    await loadTaches()
    open.value = false
  } catch (err) {
    console.error('Erreur lors de la suppression:', err)
  } finally {
    setLoader(false)
  }
}

// Charger les tâches du chantier
const loadTaches = async () => {
  if (!props.chantier?.id) return

  setLoader(true)

  try {
    const { data, error } = await getH00ByChantier(props.chantier.id)
    if (error) throw error
    taches.value = data || []
  } catch (err) {
    console.error('Erreur lors du chargement des tâches:', err)
  } finally {
    setLoader(false)
  }
}

const filteredTaches = computed(() => {
  const search = globalFilter.value?.toLowerCase() ?? ''

  let result = taches.value

  // Filtre texte
  if (search) {
    result = result.filter(
      (t) => t.taches?.tache?.toLowerCase().includes(search) || t.categories?.name?.toLowerCase().includes(search)
    )
  }

  // Filtre d’autorisation si activé
  if (showOnlyAuthorized.value) {
    result = result.filter((t) => authorizedMap.value[t.id])
  }

  return result
})

onMounted(() => {
  loadTaches()
})
watchEffect(async () => {
  const map = {}

  for (const t of taches.value) {
    map[t.id] = await isAuthorizedForTache(props.chantier, t.taches.tache_profil)
  }

  authorizedMap.value = map
})

// Calculer les pourcentages de progression
const progressStats = computed(() => {
  if (!taches.value || taches.value.length === 0) {
    return {
      cloturees: 0,
      enCours: 0,
      total: 0,
      clotureesCount: 0,
      enCoursCount: 0
    }
  }

  const total = taches.value.length
  const cloturees = taches.value.filter((t) => t.status === 2).length
  const enCours = taches.value.filter((t) => t.status === 1).length

  // Calculer les pourcentages
  const pctCloturees = (cloturees / total) * 100
  const pctEnCours = (enCours / total) * 100

  return {
    cloturees: Math.round(pctCloturees),
    enCours: Math.round(pctEnCours),
    total,
    clotureesCount: cloturees,
    enCoursCount: enCours
  }
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <AppTitleMain title="Liste des tâches" description="Toutes les tâches associées à ce chantier" />

      <div v-if="taches.length > 0" class="flex items-center gap-4 lg:min-w-[300px]">
        <div class="flex-1 lg:min-w-[400px]">
          <div class="mb-1 flex items-center justify-between">
            <div class="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              <div class="flex items-center gap-1">
                <div class="h-2 w-2 rounded bg-green-200"></div>
                <span>{{ progressStats.cloturees }}% clôturées</span>
              </div>
              <div class="flex items-center gap-1">
                <div class="h-2 w-2 rounded bg-yellow-200"></div>
                <span>{{ progressStats.enCours }}% en cours</span>
              </div>
            </div>
            <div class="pr-1 text-xs text-gray-500 dark:text-gray-400">
              {{ progressStats.clotureesCount + progressStats.enCoursCount }} / {{ progressStats.total }} tâches
            </div>
          </div>
          <!-- Barre de progression personnalisée avec segments empilés -->
          <div class="relative h-4 w-full overflow-hidden rounded-full bg-gray-200">
            <!-- Segment des tâches clôturées -->
            <div
              v-if="progressStats.cloturees > 0"
              class="absolute top-0 left-0 h-full bg-green-200 transition-all duration-300"
              :style="{ width: `${progressStats.cloturees}%` }" />
            <!-- Segment des tâches en cours (positionné après les clôturées) -->
            <div
              v-if="progressStats.enCours > 0"
              class="absolute top-0 h-full bg-yellow-200 transition-all duration-300"
              :style="{
                left: `${progressStats.cloturees}%`,
                width: `${progressStats.enCours}%`
              }" />
          </div>
        </div>
      </div>
    </div>

    <div class="flex w-full flex-col items-center gap-4 lg:flex-row">
      <AppInputSearch v-model="globalFilter" class="w-full max-w-md" placeholder="Rechercher une tâche ..." />
      <AppSwitch v-model="showOnlyAuthorized" label="Mes taches" class="ml-auto flex-none" />
    </div>

    <div
      class="flex min-h-0 w-full flex-1 flex-col rounded-md border border-gray-200 bg-white lg:overflow-auto dark:border-gray-700 dark:bg-gray-900">
      <div class="min-h-0 flex-1 overflow-auto">
        <table class="w-full text-sm">
          <thead class="sticky top-0 z-10 border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
            <tr>
              <th
                class="hidden items-center justify-center py-3 font-semibold text-gray-700 lg:flex dark:text-gray-200">
                Catégorie
              </th>
              <th class="py-3 pl-2 text-left font-semibold text-gray-700 lg:pl-0 dark:text-gray-200">Tâche</th>
              <th class="px-8 py-3 text-center font-semibold text-gray-700 dark:text-gray-200">Prévision</th>
              <th>Status</th>
              <th>#</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
            <tr
              v-for="t in filteredTaches"
              :key="t.id"
              class="cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
              @click="showSlide(t)">
              <td class="hidden py-4 lg:flex">
                <div v-if="t.categories?.name" class="w-full px-4">
                  <div
                    class="bg-primary-50 dark:bg-primary-900/30 border-primary-200 dark:border-primary-700 mx-auto w-full rounded-md border px-2 text-center text-xs text-gray-600 italic">
                    {{ t.categories.name }}
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
                {{ props.chantier?.name }}
              </h2>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {{ selectedTache.taches?.tache }}
              </p>
            </div>
          </template>

          <template #default>
            <div class="flex flex-col gap-6">
              <div class="flex items-center border-b py-2 text-left text-base font-medium uppercase">Informations</div>
              <div class="flex items-center justify-between gap-2">
                <AppSwitch v-model="important" label="Important" class="full" :disabled="!canEdit" />

                <AppSwitch v-model="alerte" label="Alerte" class="full" :disabled="!canEdit" />
              </div>

              <div class="flex items-center border-b py-2 text-left text-base font-medium uppercase">Commentaires</div>

              <!-- Nom de la tâche -->
              <div class="flex flex-col gap-1.5">
                <textarea
                  v-model="commentaire"
                  rows="4"
                  class="focus:ring-primary-500 w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-transparent focus:ring-2 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  placeholder="Ajoutez un commentaire..."
                  :disabled="!canEdit"></textarea>
              </div>

              <AppDatePicker
                v-if="canEdit"
                v-model="dateCloture"
                title="Date de clôture"
                placeholder="Sélectionnez une date"
                clearable />
            </div>
          </template>

          <template #footer>
            <div v-if="canEdit" class="flex items-center justify-end gap-2">
              <AppButtonValidated type="button" theme="primary" :validated="!!dateCloture" @click="cloturerTache()">
                <template #default>
                  <span class="flex items-center gap-2">
                    <Icon name="lucide:plus" size="16" />
                    Clôturer
                  </span>
                </template>
              </AppButtonValidated>
              <AppButtonValidated type="button" theme="delete" @click="nonConcerne()">
                <template #default>
                  <span class="flex items-center gap-2">
                    <Icon name="lucide:plus" size="16" />
                    Non concerné
                  </span>
                </template>
              </AppButtonValidated>
              <AppButtonValidated type="button" theme="cancel" @click="enregistrer()">
                <template #default>
                  <span class="flex items-center gap-2">
                    <Icon name="lucide:plus" size="16" />
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
