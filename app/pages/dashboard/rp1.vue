<script setup>
definePageMeta({
  requiresAuth: true,
  requiredRole: 'admin'
})

useHead({
  title: 'H00 - RP1 / RP3',
  description: 'Liste des taches RP1 et RP3 de tous les chantiers'
})

const { setLoader } = useLoader()
const { getChantiers, getChantiersNonTermines } = useChantiers()
const { allTachesRp1, getTachesRp1 } = useTaches()
const { getH00Rp1ByChantierArray, updateH00Entry, updateH00ClotureProfil } = useH00()
const { getAllProfilTache, profilTaches } = useProfilTache()
const user = useAuthUser()
// Profil de l'utilisateur connecté
const userProfil = computed(() => Number(user.value?.profils))
const profilLabel = (pid) => profilTaches.value.find((p) => p.id === pid)?.label || `Profil ${pid}`
// États pour les chantiers et tâches
const listChantiersAlertes = ref([])
const allTaches = ref([])
const selectedChantier = ref(null)
const globalFilterChantier = ref('')
const selectedTache = ref({})
const commentaire = ref('')
const important = ref(false)
const alerte = ref(false)
const dateCloture = ref(null)
const open = ref(false)
const listChantiersToPrint = ref([])

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

const regrouperTachesParChantier = (data) => {
  const map = {}

  data.forEach((item) => {
    const chantier = item.chantiers
    const chantierId = chantier.id

    if (!map[chantierId]) {
      map[chantierId] = {
        id: chantier.id,
        label: chantier.name,
        compte: chantier.compte,
        etat: chantier.etat,
        taches: []
      }
    }

    map[chantierId].taches.push({
      id: item.id,
      tache_id: item.tache_id,
      libelle: item.taches.tache,
      categorie: item.categories.name,
      prevision: item.prevision,
      realisation: item.realisation,
      status: item.status,
      important: item.important,
      alerte: item.alerte,
      commentaire: item.commentaire,
      cloture_profil: item.cloture_profil,
      tache_profil: item.taches?.tache_profil || []
    })
  })

  return Object.values(map)
}

const loadData = async () => {
  setLoader(true)
  try {
    await getChantiers()
    await getTachesRp1()

    // Récupérer les IDs des chantiers non terminés
    let listTaches = allTachesRp1.value.map((tache) => tache.id)
    let listChantiers = getChantiersNonTermines.value.map((chantier) => chantier.id)
    const { data, error } = await getH00Rp1ByChantierArray(listChantiers, listTaches)

    if (error) throw error
    listChantiersAlertes.value = regrouperTachesParChantier(data)
  } catch (error) {
    console.error('Erreur lors du chargement des données:', error)
  } finally {
    setLoader(false)
  }
}

const filteredItemsLeftNavBar = computed(() => {
  const search = globalFilterChantier.value?.toLowerCase() ?? ''

  let result = listChantiersAlertes.value

  // Filtre texte
  if (search) {
    result = result.filter((t) => t.compte?.toLowerCase().includes(search) || t.label?.toLowerCase().includes(search))
  }

  return result
})
// Ouvrir la sidebar avec les détails de la tâche
// L'utilisateur connecté est-il concerné par la tâche sélectionnée ?
const isConcerned = computed(() =>
  (selectedTache.value?.tache_profil || []).includes(userProfil.value)
)

const showSlide = (row) => {
  if (row) {
    selectedTache.value = row
    important.value = row.important || false
    alerte.value = row.alerte || false
    // Préremplir depuis MA part (profil connecté)
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

// Réinjecte la ligne mise à jour dans l'état local
const applyLocal = (data) => {
  const index = selectedChantier.value.taches.findIndex((t) => t.id === selectedTache.value.id)
  if (index !== -1) {
    selectedChantier.value.taches[index] = {
      ...selectedChantier.value.taches[index],
      important: important.value,
      alerte: alerte.value,
      ...(data
        ? { cloture_profil: data.cloture_profil, status: data.status, realisation: data.realisation }
        : {})
    }
  }
}

// Enregistrer : MA part si concerné (sinon seulement les drapeaux partagés)
const enregistrer = async () => {
  setLoader(true)
  try {
    if (isConcerned.value) {
      const newStatus = commentaire.value.trim() !== '' ? 1 : 0
      const { data, error } = await updateH00ClotureProfil(
        selectedTache.value,
        userProfil.value,
        { status: newStatus, commentaire: commentaire.value },
        selectedTache.value.tache_profil || [],
        { shared: { important: important.value, alerte: alerte.value } }
      )
      if (error) throw error
      applyLocal(data)
    } else {
      const { error } = await updateH00Entry(selectedTache.value.id, {
        important: important.value,
        alerte: alerte.value
      })
      if (error) throw error
      applyLocal(null)
    }
    open.value = false
  } catch (err) {
    console.error("Erreur lors de l'enregistrement:", err)
  } finally {
    setLoader(false)
  }
}

// Clôturer MA part (si concerné)
const cloturerTache = async () => {
  if (!isConcerned.value) return
  setLoader(true)
  try {
    const { data, error } = await updateH00ClotureProfil(
      selectedTache.value,
      userProfil.value,
      { status: 2, realisation: formatDateForInput(dateCloture.value), commentaire: commentaire.value, non_concerne: false },
      selectedTache.value.tache_profil || [],
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
const toggleChantier = (item) => {
  const index = listChantiersToPrint.value.indexOf(item)

  if (index === -1) {
    listChantiersToPrint.value.push(item)
  } else {
    listChantiersToPrint.value.splice(index, 1)
  }
}

const isSelected = (item) => {
  return listChantiersToPrint.value.includes(item)
}

// Navigation vers le chantier sélectionné
const goToChantier = () => {
  if (selectedChantier.value) {
    navigateTo(`/chantiers/${selectedChantier.value.id}`)
  }
}

// Ouvrir la page d'impression dans un nouvel onglet
const openPrintPage = () => {
  window.print()
}

onMounted(() => {
  setLoader(true)
  if (!profilTaches.value || profilTaches.value.length === 0) getAllProfilTache()
  loadData()
  setLoader(false)
})
</script>

<template>
  <AppPageLayout class="print:hidden">
    <!-- Slot sidebar - Partie gauche sticky -->
    <template #sidebar>
      <div class="space-y-4">
        <div class="flex flex-col">
          <div class="text-primary-800 trak text-center font-[Bangers] text-3xl font-bold tracking-wider">
            RP1 / RP3
          </div>
          <span class="text-primary-600 text-center text-sm">Liste des taches RP1 et RP3 de tous les chantiers</span>
        </div>

        <AppInputSearch
          v-model="globalFilterChantier"
          class="w-full max-w-md"
          placeholder="Rechercher un chantier ..." />

        <!-- Liste des chantiers en cartes compactes -->
        <div class="flex flex-col gap-1.5 overflow-y-auto pr-1 pb-8">
          <div
            v-for="(item, index) in filteredItemsLeftNavBar"
            :key="index"
            @click="selectedChantier = item"
            class="group relative cursor-pointer overflow-hidden rounded-lg border p-3 transition-all duration-200"
            :class="
              selectedChantier === item
                ? 'border-primary-700/30 bg-linear-to-br from-slate-700 to-slate-900 shadow-lg'
                : 'hover:border-primary-700/30 border-primary-200 bg-white hover:shadow-lg dark:bg-slate-900'
            ">
            <!-- Indicateur latéral animé -->
            <div
              class="from-secondary-400 to-secondary-500 absolute top-0 left-0 h-full w-1 bg-linear-to-t transition-all duration-200"
              :class="selectedChantier === item ? '' : 'scale-y-0 group-hover:scale-y-100'"></div>

            <div class="flex items-center gap-3">
              <!-- Icône avec fond -->
              <div
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors duration-200"
                :class="
                  selectedChantier === item
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
                    :class="selectedChantier === item ? 'text-white' : 'text-primary-600'">
                    {{ item.compte }}
                  </div>
                  <div
                    class="truncate text-sm font-medium transition-colors duration-200"
                    :class="selectedChantier === item ? 'text-white' : 'text-primary-600'">
                    {{ item.label }}
                  </div>
                </div>
              </div>

              <!-- Badge avec le nombre de tâches -->
              <div
                v-if="item.taches.length > 0"
                @click.stop="toggleChantier(item)"
                class="flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-xs font-bold transition-all duration-200"
                :class="isSelected(item) ? 'text-secondary-500' : 'text-primary-500'">
                <!-- {{ item.taches.length }} -->
                <Icon name="lucide:printer" size="20" />
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
    <!-- Footer de la sidebar avec bouton Imprimer -->
    <template #sidebar-footer>
      <div
        class="hidden border-gray-200 pt-4 lg:flex lg:items-center lg:justify-center lg:border-t dark:border-gray-700">
        <AppButtonValidated
          theme="secondary"
          type="button"
          @click="openPrintPage"
          :validated="listChantiersToPrint.length > 0">
          <template #default>
            <span class="flex items-center gap-2">
              <Icon name="lucide:printer" size="18" />
              Imprimer les alertes
            </span>
          </template>
        </AppButtonValidated>
      </div>
    </template>

    <!-- Contenu principal avec bouton de test -->
    <template #default>
      <div class="h-full overflow-auto p-4">
      <div v-if="selectedChantier" class="space-y-4">
        <div class="flex items-center justify-between">
          <div
            class="flex cursor-pointer flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
            @click="goToChantier">
            <AppTitleMain :title="selectedChantier.label" :description="selectedChantier.compte" />
          </div>
          <AppButtonValidated v-if="selectedChantier" theme="" type="button" @click="goToChantier" :validated="true">
            <template #default>
              <span class="flex flex-none items-center gap-2">
                <Icon name="lucide:external-link" size="18" />
                Voir le chantier
              </span>
            </template>
          </AppButtonValidated>
        </div>
        <div
          v-for="tache in selectedChantier.taches"
          :key="tache.id"
          @click="showSlide(tache)"
          class="border-primary-200 cursor-pointer rounded-lg border bg-white transition-all duration-300 hover:border-indigo-500 hover:shadow-xl dark:bg-slate-900">
          <div class="p-6">
            <div class="flex items-start gap-4">
              <!-- Indicateur de catégorie -->

              <div class="flex-1">
                <div class="mb-3 flex items-start justify-between">
                  <div class="flex-1">
                    <div class="mb-2 flex flex-wrap items-center gap-3">
                      <span
                        class="inline-block rounded-md bg-linear-to-br from-indigo-500 to-indigo-700 px-3 py-1 text-center text-xs font-semibold text-white shadow-md">
                        {{ tache.categorie }}
                      </span>
                      <span class="rounded-md px-2 py-1 text-xs font-medium" :class="statusInfo(tache.status).cls">
                        {{ statusInfo(tache.status).label }}
                      </span>
                    </div>
                    <h3 class="text-primary-800 mb-2 text-base font-semibold">
                      {{ tache.libelle }}
                    </h3>
                  </div>
                  <div class="flex items-center gap-2">
                    <Icon
                      v-if="tache.important"
                      name="lucide:triangle-alert"
                      size="20"
                      class="mt-0.5 text-yellow-500" />
                    <Icon v-if="tache.alerte" name="lucide:siren" size="20" class="text-red-500" />
                  </div>
                </div>

                <!-- Statut PAR PROFIL (compact) — le détail/commentaires est dans la modale -->
                <div class="mt-3 flex flex-wrap items-center gap-1.5">
                  <span
                    v-for="pid in concernedProfils(tache.tache_profil, tache)"
                    :key="pid"
                    class="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                    :class="statusInfo(getSlot(tache, pid).status).cls"
                    :title="profilLabel(pid)">
                    <span class="h-1.5 w-1.5 rounded-full" :class="statusInfo(getSlot(tache, pid).status).dot" />
                    {{ profilLabel(pid) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else>
        <div class="flex cursor-pointer flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <AppTitleMain title="RP1 / RP3" description="Liste des taches RP1 et RP3 de tous les chantiers" />
        </div>

        <div
          class="text-primary-500 border-primary-200 mt-6 flex w-full flex-col items-center justify-center gap-4 rounded-lg border p-4 py-8 text-center">
          <div class="flex items-center justify-center rounded-lg bg-linear-to-br from-indigo-500 to-indigo-700 p-1">
            <Icon name="lucide:search-x" size="32" class="text-white" />
          </div>

          <p class="text-sm">Veuillez sélectionner un chantier</p>
        </div>
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
                  {{ selectedTache.libelle }}
                </h2>
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
                  Suivi par profil
                </div>

                <!-- Une card par profil : édition pour le vôtre, lecture seule pour les autres -->
                <div class="flex flex-col gap-3">
                  <div
                    v-for="pid in concernedProfils(selectedTache.tache_profil, selectedTache)"
                    :key="pid"
                    class="rounded-lg border p-4"
                    :class="pid === userProfil
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
                          {{ formatDateForInput(getSlot(selectedTache, pid).realisation) }}
                        </span>
                        <span class="rounded-md px-2 py-1 text-xs font-medium" :class="statusInfo(getSlot(selectedTache, pid).status).cls">
                          {{ statusInfo(getSlot(selectedTache, pid).status).label }}
                        </span>
                      </div>
                    </div>

                    <!-- Corps : édition (mon profil) OU lecture seule (autres) -->
                    <div class="mt-3">
                      <template v-if="pid === userProfil && isConcerned">
                        <label class="text-primary-700 mb-1 block text-xs font-medium dark:text-gray-300">Mon commentaire</label>
                        <textarea
                          v-model="commentaire"
                          class="border-primary-300 text-primary-700 focus:border-primary-500 focus:ring-primary-500 mb-3 h-24 w-full resize-y rounded-lg border bg-white p-3 text-sm focus:ring-1 focus:outline-none dark:bg-slate-900"
                          placeholder="Commentaire pour votre profil..."></textarea>
                        <AppDatePicker v-model="dateCloture" title="Date de clôture" placeholder="Sélectionnez une date" clearable />
                      </template>
                      <template v-else>
                        <p class="text-primary-600 text-sm whitespace-pre-line dark:text-gray-300">
                          {{ getSlot(selectedTache, pid).commentaire || 'Aucun commentaire' }}
                        </p>
                      </template>
                    </div>
                  </div>
                </div>

                <div v-if="!isConcerned" class="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  <Icon name="lucide:lock" size="16" />
                  Votre profil n'est pas concerné par cette tâche — vous pouvez seulement modifier les drapeaux partagés.
                </div>
              </div>
            </template>

            <template #footer>
              <div class="flex flex-col items-center justify-end gap-2 lg:flex-row">
                <AppButtonValidated type="button" theme="cancel" @click="showSlide(null)" class="w-full lg:w-auto">
                  <template #default>
                    <span class="flex items-center gap-2">
                      <Icon name="lucide:x" size="16" />
                      Annuler
                    </span>
                  </template>
                </AppButtonValidated>
                <AppButtonValidated
                  v-if="isConcerned"
                  type="button"
                  theme="primary"
                  :validated="!!dateCloture"
                  @click="cloturerTache()"
                  class="w-full lg:w-auto">
                  <template #default>
                    <span class="flex items-center gap-2">
                      <Icon name="lucide:infinity" size="16" />
                      Clôturer ma part
                    </span>
                  </template>
                </AppButtonValidated>
                <AppButtonValidated type="button" theme="primary" @click="enregistrer()" class="w-full lg:w-auto">
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
  <div class="hidden print:block">
    <DashboardPrintRp1 :taches="listChantiersToPrint" />
  </div>
</template>
