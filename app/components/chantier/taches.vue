<script setup>
const props = defineProps({
  chantier: {
    type: Object,
    required: true
  },
  taches: {
    type: Array,
    required: true
  }
})

const { updateH00ClotureProfil } = useH00()
const { setLoader } = useLoader()
const { getAllProfilTache, profilTaches } = useProfilTache()
const user = useAuthUser()

const taches = ref(props.taches)
const globalFilter = ref('')

const open = ref(false)
const selectedTache = ref({})
const commentaire = ref('')
const important = ref(false)
const alerte = ref(false)
const dateCloture = ref(null)
const showOnlyAuthorized = ref(false)

// Profil de l'utilisateur connecté
const userProfil = computed(() => Number(user.value?.profils))

onMounted(() => {
  if (!profilTaches.value || profilTaches.value.length === 0) getAllProfilTache()
})

// Libellé d'un profil
const profilLabel = (pid) => profilTaches.value.find((p) => p.id === pid)?.label || `Profil ${pid}`

// Fonction synchrone pour vérifier si l'utilisateur peut éditer une tâche
const canEditTache = (tache) => {
  if (!props.chantier?.isConcerned) return false

  const profil = user.value?.profils
  if (!profil || !tache?.taches?.tache_profil) return false

  const profilIncluded = tache.taches.tache_profil.includes(profil)

  // Si profil 1, peut toujours éditer
  if (profil === 1) return profilIncluded

  // Si état 2 (préop), seuls les utilisateurs pre_op peuvent éditer
  if (props.chantier.etat === 2) {
    return user.value.pre_op && profilIncluded
  }

  // Si état < 2, tous les utilisateurs concernés avec le bon profil peuvent éditer
  return props.chantier.etat < 2 && profilIncluded
}

// canEdit pour la tâche sélectionnée (computed synchrone)
const canEdit = computed(() => canEditTache(selectedTache.value))

// Profils concernés par la tâche sélectionnée
const detailProfils = computed(() => concernedProfils(selectedTache.value?.taches?.tache_profil, selectedTache.value))

// Compteur partiel « X/Y profils clôturés »
const detailCloture = computed(() => {
  const ids = detailProfils.value
  const done = ids.filter((pid) => getSlot(selectedTache.value, pid).status === 2).length
  return { done, total: ids.length }
})

// Statut de MA part pour la tâche sélectionnée
const myStatus = computed(() => getSlot(selectedTache.value, userProfil.value).status)

// Fonction pour formater une date en "Oct 2025" (mois court)
const formatDateMonthYear = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  const monthYear = date.toLocaleDateString('fr-FR', {
    month: 'short',
    year: 'numeric'
  })
  return monthYear.charAt(0).toUpperCase() + monthYear.slice(1)
}

// Fonction pour convertir une date au format YYYY-MM-DD pour l'input date
const formatDateForInput = (dateString) => {
  if (!dateString) return null
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return null
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Ouvrir la sidebar avec les détails de la tâche
const showSlide = (row) => {
  if (row) {
    selectedTache.value = row
    important.value = row.important || false
    alerte.value = row.alerte || false
    const slot = getSlot(row, userProfil.value)
    commentaire.value = slot.commentaire || ''
    if (slot.status === 2 && slot.realisation) {
      dateCloture.value = formatDateForInput(slot.realisation)
    } else {
      dateCloture.value = null
    }
    open.value = true
  } else {
    open.value = !open.value
  }
}

// Réinjecte la ligne mise à jour (renvoyée par l'update) dans l'état local
const applyLocal = (data) => {
  if (!data) return
  const index = taches.value.findIndex((t) => t.id === selectedTache.value.id)
  if (index !== -1) {
    taches.value[index] = {
      ...taches.value[index],
      cloture_profil: data.cloture_profil,
      status: data.status,
      realisation: data.realisation,
      important: data.important,
      alerte: data.alerte
    }
    selectedTache.value = taches.value[index]
  }
}

// Clôturer MA part
const cloturerTache = async () => {
  if (!canEdit.value) return

  setLoader(true)
  try {
    const tacheProfil = selectedTache.value.taches?.tache_profil || []
    const { data, error } = await updateH00ClotureProfil(
      selectedTache.value,
      userProfil.value,
      {
        status: 2,
        realisation: formatDateForInput(dateCloture.value),
        commentaire: commentaire.value,
        non_concerne: false
      },
      tacheProfil,
      { shared: { important: important.value, alerte: alerte.value } }
    )
    if (error) throw error
    applyLocal(data)
    open.value = false
  } catch (err) {
    console.error('Erreur lors de la clôture:', err)
  } finally {
    setLoader(false)
  }
}

// Enregistrer MA part (commentaire / en cours)
const enregistrer = async () => {
  if (!canEdit.value) return

  setLoader(true)
  try {
    const tacheProfil = selectedTache.value.taches?.tache_profil || []
    const newStatus = commentaire.value.trim() !== '' ? 1 : 0
    const { data, error } = await updateH00ClotureProfil(
      selectedTache.value,
      userProfil.value,
      { status: newStatus, commentaire: commentaire.value },
      tacheProfil,
      { shared: { important: important.value, alerte: alerte.value } }
    )
    if (error) throw error
    applyLocal(data)
    open.value = false
  } catch (err) {
    console.error("Erreur lors de l'enregistrement:", err)
  } finally {
    setLoader(false)
  }
}

// Marquer « Non concerné » UNIQUEMENT pour mon profil (la tâche reste pour les autres)
const nonConcerne = async () => {
  if (!canEdit.value) return

  setLoader(true)
  try {
    const tacheProfil = selectedTache.value.taches?.tache_profil || []
    const { data, error } = await updateH00ClotureProfil(
      selectedTache.value,
      userProfil.value,
      { non_concerne: true },
      tacheProfil
    )
    if (error) throw error
    applyLocal(data)
    open.value = false
  } catch (err) {
    console.error('Erreur lors de la mise à jour:', err)
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

  // Filtre d'autorisation si activé (maintenant synchrone)
  if (showOnlyAuthorized.value) {
    result = result.filter((t) => canEditTache(t))
  }

  return result
})

// Calculer les pourcentages de progression (statut GLOBAL agrégé)
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
  <div class="flex h-full flex-col gap-4 overflow-hidden p-4 ">

    <div class="flex flex-none flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <AppTitleMain title="Liste des tâches" description="Toutes les tâches associées à ce chantier" />

      <div v-if="taches.length > 0" class="flex items-center gap-4 lg:min-w-[300px]">
        <div class="flex-1 lg:min-w-[400px]">
          <div class="mb-1 flex items-center justify-between">
            <div class="text-primary-700 flex items-center gap-4 text-xs">
              <div class="flex items-center gap-1">
                <div class="h-2 w-2 rounded bg-green-200"></div>
                <span>{{ progressStats.cloturees }}% clôturées</span>
              </div>
              <div class="flex items-center gap-1">
                <div class="h-2 w-2 rounded bg-yellow-200"></div>
                <span>{{ progressStats.enCours }}% en cours</span>
              </div>
            </div>
            <div class="text-primary-700 pr-1 text-xs">
              {{ progressStats.clotureesCount + progressStats.enCoursCount }} / {{ progressStats.total }} tâches
            </div>
          </div>
          <!-- Barre de progression personnalisée avec segments empilés -->
          <div class="bg-primary-200 relative h-4 w-full overflow-hidden rounded-full">
            <!-- Segment des tâches clôturées -->
            <div v-if="progressStats.cloturees > 0"
              class="absolute top-0 left-0 h-full bg-green-200 transition-all duration-300"
              :style="{ width: `${progressStats.cloturees}%` }" />
            <!-- Segment des tâches en cours (positionné après les clôturées) -->
            <div v-if="progressStats.enCours > 0"
              class="absolute top-0 h-full bg-yellow-200 transition-all duration-300" :style="{
                left: `${progressStats.cloturees}%`,
                width: `${progressStats.enCours}%`
              }" />
          </div>
        </div>
      </div>
    </div>

    <div class="flex w-full flex-none flex-col items-center gap-4 lg:flex-row">
      <AppInputSearch v-model="globalFilter" class="w-full max-w-md" placeholder="Rechercher une tâche ..." />
      <AppSwitch v-model="showOnlyAuthorized" label="Mes taches" class="ml-auto flex-none" />
    </div>

    <div
      class="border-primary-200 text-primary-700 h-full w-full flex-1 overflow-auto rounded-md border bg-white dark:bg-slate-900">

      <table class="w-full text-sm ">
        <thead class="border-primary-200 sticky top-0 z-10 border-b bg-white dark:bg-slate-900">
          <tr>
            <th class="text-primary-700 hidden items-center justify-center py-3 font-semibold lg:flex">Catégorie</th>
            <th class="text-primary-700 py-3 pl-2 text-left font-semibold lg:pl-0">Tâche</th>
            <th class="text-primary-700 px-8 py-3 text-center font-semibold">Prévision</th>
            <th class="text-primary-700 px-8 py-3 text-center font-semibold">#</th>
            <th class="text-primary-700 px-8 py-3 text-center font-semibold">Profils</th>
          </tr>
        </thead>
        <tbody class="divide-primary-100 divide-y">
          <tr v-for="t in filteredTaches" :key="t.id" class="hover:bg-primary-200 cursor-pointer transition-colors"
            @click="showSlide(t)">
            <td class="hidden py-4 lg:flex">
              <div v-if="t.categories?.name" class="w-full px-4">
                <div
                  class="bg-primary-50 border-primary-200 text-primary-600 mx-auto w-full rounded-md border px-2 text-center text-xs italic">
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
                <Icon v-else name="lucide:triangle-alert" size="16" class="text-primary-300" />
                <Icon v-if="t.alerte" name="lucide:siren" size="18" class="mb-0.5 text-red-500" />
                <Icon v-else name="lucide:siren" size="18" class="text-primary-300 mb-0.5" />
              </div>
            </td>
            <td class="px-4 py-3">
              <div class="flex w-full flex-wrap items-center justify-center gap-1">
                <span v-for="pid in concernedProfils(t.taches?.tache_profil, t)" :key="pid"
                  class="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                  :class="statusInfo(getSlot(t, pid).status).cls" :title="profilLabel(pid)">
                  <span class="h-1.5 w-1.5 rounded-full" :class="statusInfo(getSlot(t, pid).status).dot" />
                  {{ profilLabel(pid) }}
                </span>
                <span v-if="concernedProfils(t.taches?.tache_profil, t).length === 0" class="text-primary-300 text-xs">—</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

    </div>
  </div>

  <!-- SlideOver pour édition/création (en dehors du conteneur flex) -->
  <AppSlideOver :sideModal="open" :closeSideModal="showSlide">
    <template #default>
      <AppSlideOverContent v-if="open" :closeSideModal="showSlide">
        <template #header>
          <div class="text-center">
            <div class="bg-primary-50 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
              <Icon name="lucide:clipboard-edit" size="28" class="text-primary-700" />
            </div>
            <h2 class="text-primary-900 text-xl font-semibold">
              {{ props.chantier?.name }}
            </h2>
            <p class="text-primary-600 mt-1 text-sm">
              {{ selectedTache.taches?.tache }}
            </p>
            <p class="text-primary-500 mt-1 text-xs">
              {{ detailCloture.done }}/{{ detailCloture.total }} profils clôturés
            </p>
          </div>
        </template>

        <template #default>
          <div class="flex h-full flex-col gap-6">
            <div class="flex items-center border-b py-2 text-left text-base font-medium uppercase">Informations</div>
            <div class="flex items-center justify-between gap-2">
              <AppSwitch v-model="important" label="Important" class="full" :disabled="!canEdit" />
              <AppSwitch v-model="alerte" label="Alerte" class="full" :disabled="!canEdit" />
            </div>

            <div class="flex items-center border-b py-2 text-left text-base font-medium uppercase">Suivi par profil</div>

            <!-- Une card par profil concerné : éditable pour le vôtre, lecture seule pour les autres -->
            <div class="flex flex-col gap-3">
              <div v-for="pid in detailProfils" :key="pid" class="rounded-lg border p-4" :class="pid === userProfil
                  ? 'border-primary-400 bg-primary-50 dark:border-primary-500 dark:bg-slate-800'
                  : 'border-primary-200 bg-white dark:border-slate-700 dark:bg-slate-800'
                ">
                <!-- En-tête de la card -->
                <div class="flex items-center justify-between gap-2">
                  <div class="flex items-center gap-2">
                    <Icon name="lucide:user-round" size="16" class="text-primary-500" />
                    <span class="font-medium">{{ profilLabel(pid) }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span v-if="getSlot(selectedTache, pid).status === 2" class="text-primary-400 text-xs whitespace-nowrap">
                      {{ formatDateMonthYear(getSlot(selectedTache, pid).realisation) }}
                    </span>
                    <span class="rounded-md px-2 py-1 text-xs font-medium"
                      :class="statusInfo(getSlot(selectedTache, pid).status).cls">
                      {{ statusInfo(getSlot(selectedTache, pid).status).label }}
                    </span>
                  </div>
                </div>

                <!-- Corps : édition (mon profil + droits) OU lecture seule -->
                <div class="mt-3">
                  <template v-if="pid === userProfil && canEdit">
                    <label class="text-primary-700 mb-1 block text-xs font-medium dark:text-gray-300">Mon commentaire</label>
                    <textarea v-model="commentaire"
                      class="border-primary-300 text-primary-700 focus:border-primary-500 focus:ring-primary-500 mb-3 h-24 w-full resize-y rounded-lg border bg-white p-3 text-sm focus:ring-1 focus:outline-none dark:bg-slate-900"
                      placeholder="Commentaire pour votre profil..."></textarea>
                    <AppDatePicker v-model="dateCloture" title="Date de clôture" placeholder="Sélectionnez une date"
                      clearable />
                  </template>
                  <template v-else>
                    <p class="text-primary-600 text-sm whitespace-pre-line dark:text-gray-300">
                      {{ getSlot(selectedTache, pid).commentaire || 'Aucun commentaire' }}
                    </p>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </template>

        <template #footer>
          <div v-if="canEdit" class="flex flex-col items-center justify-end gap-2 lg:flex-row">
            <AppButtonValidated type="button" theme="primary" :validated="!!dateCloture" @click="cloturerTache()"
              class="w-full lg:w-auto">
              <template #default>
                <span class="flex items-center gap-2">
                  <Icon name="lucide:infinity" size="16" />
                  Clôturer ma part
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
</template>
