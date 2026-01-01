<script setup>
definePageMeta({
  requiresAuth: true,
  requiredRole: ''
})

useHead({
  title: 'H00 - Chantiers',
  description: 'Liste des chantiers H00'
})

const { getChantiers, createChantier, updateChantier } = useChantiers()
const {
  getAllUsers,
  users,
  getUsersRltVoie,
  getUsersRltSes,
  getUsersRltCat,
  getUsersLogistique,
  getUsersKvVoie,
  getUsersKvSes,
  getUsersKvCat,
  getUsersPreopVoie,
  getUsersPreopSes,
  getUsersRefRdu
} = useUsers()
const { getAllContactsTravaux, upsertContactsTravaux, getContactsTravaux } = useContacts()
const { setLoader } = useLoader()
const { taches, getTaches } = useTaches()
const { createH00Entries, recalculateH00Previsions } = useH00()
const { addToast } = useToast()
const { addWeekend, getAllWeekends, getWeekendsByChantier, replaceWeekendsForChantier } = useTimeline()
const { isAdmin, isSuperAdmin } = useLevelUser()

// Computed pour savoir si l'utilisateur peut modifier (admin ou superadmin)
const canEdit = computed(() => isAdmin.value || isSuperAdmin.value)

// Accès direct au state partagé des chantiers
const allChantiers = useState('allChantiers')

// Barre de recherche et filtres
const searchQuery = ref('')
const selectedEtat = ref('all')
const sortBy = ref('date_desc')

// Options de filtrage par état
const etatOptions = [
  { id: 'all', label: 'Tous les chantiers', icon: 'lucide:layers', color: 'bg-gray-100 text-gray-700 border-gray-300' },
  { id: 'rlt', label: 'RLT', icon: 'lucide:zap', color: 'bg-sky-100 text-sky-700 border-sky-300' },
  { id: 'preop', label: 'Pré-op', icon: 'lucide:clipboard-check', color: 'bg-lime-100 text-lime-700 border-lime-300' },
  {
    id: 'externe',
    label: 'Externe',
    icon: 'lucide:external-link',
    color: 'bg-purple-100 text-purple-700 border-purple-300'
  },
  {
    id: 'termine',
    label: 'Terminé',
    icon: 'lucide:check-circle',
    color: 'bg-slate-100 text-slate-700 border-slate-300'
  }
]

// Options de tri
const sortOptions = [
  { id: 'date_desc', label: 'Date (récent → ancien)' },
  { id: 'date_asc', label: 'Date (ancien → récent)' },
  { id: 'name_asc', label: 'Nom (A → Z)' },
  { id: 'name_desc', label: 'Nom (Z → A)' },
  { id: 'compte_asc', label: 'Compte (A → Z)' },
  { id: 'compte_desc', label: 'Compte (Z → A)' }
]

// Mode édition du drawer
const isEditMode = ref(false)
const editingChantierId = ref(null)
const originalDateRea = ref([])
const originalEtat = ref(null)

const newChantier = ref({
  entite: 'uo_travaux',
  compte: '',
  name: '',
  weekends: [],
  preparation: [],
  realisation: [],
  autre: '',
  rlt_voie_principale: null,
  rlt_voie_secondaire: [],
  rlt_ses_principale: null,
  rlt_ses_secondaire: [],
  rlt_cat_principale: null,
  rlt_cat_secondaire: [],
  preop_ses: null,
  preop_voie: null,
  logistique: null,
  supervisor: [],
  kv_voie: [],
  kv_ses: [],
  kv_cat: []
})

// Fonction pour convertir un timestamp en format ISO (YYYY-MM-DD)
const timestampToISODate = (timestamp) => {
  if (!timestamp) return null
  const date = new Date(timestamp)
  return date.toISOString().split('T')[0]
}

// Fonction pour obtenir la première date chronologique d'un array de périodes
const getEarliestDate = (periods) => {
  if (!periods || periods.length === 0) return null

  const dates = periods
    .map((p) => p.date_start)
    .filter((d) => d)
    .map((d) => new Date(d))
    .sort((a, b) => a - b)

  return dates.length > 0 ? dates[0] : null
}

// Fonction pour calculer la date de prévision d'une tâche
const calculatePrevisionDate = (referenceDate, delais, optDelais, endDate = null) => {
  if (!referenceDate) return null

  let baseDate
  if (optDelais === 1 && endDate) {
    baseDate = new Date(endDate)
  } else {
    baseDate = new Date(referenceDate)
  }

  baseDate.setDate(baseDate.getDate() - delais)
  return baseDate.toISOString().split('T')[0]
}

// État de soumission
const isSubmitting = ref(false)

// Handler unifié pour le formulaire (création et édition)
const handleFormSubmit = async (formData) => {
  newChantier.value = { ...formData }

  if (isEditMode.value) {
    await handleSaveEdit()
  } else {
    await handleComplete()
  }
}

// Complétion de toutes les étapes
const handleComplete = async () => {
  if (isSubmitting.value) return
  isSubmitting.value = true
  setLoader(true)

  try {
    const etat = newChantier.value.entite === 'uo_travaux' ? 2 : 1

    const dateRea = newChantier.value.realisation.map((r) => ({
      date_start_travaux: timestampToISODate(r.date_start),
      date_end_travaux: timestampToISODate(r.date_end)
    }))

    const datePrepa = newChantier.value.preparation.map((p) => ({
      date_start_prepa: timestampToISODate(p.date_start),
      date_end_prepa: timestampToISODate(p.date_end)
    }))

    const chantierData = {
      compte: newChantier.value.compte,
      name: newChantier.value.name,
      etat: etat,
      date_rea: dateRea,
      date_prepa: datePrepa,
      autre: newChantier.value.autre || null
    }

    const createdChantier = await createChantier(chantierData)

    if (!createdChantier) {
      throw new Error('Erreur lors de la création du chantier')
    }

    const contactsData = {
      rlt_voie_principale: newChantier.value.rlt_voie_principale,
      rlt_voie_secondaire: newChantier.value.rlt_voie_secondaire || [],
      rlt_ses_principale: newChantier.value.rlt_ses_principale,
      rlt_ses_secondaire: newChantier.value.rlt_ses_secondaire || [],
      rlt_cat_principale: newChantier.value.rlt_cat_principale,
      rlt_cat_secondaire: newChantier.value.rlt_cat_secondaire || [],
      kv_voie: newChantier.value.kv_voie || [],
      kv_ses: newChantier.value.kv_ses || [],
      kv_cat: newChantier.value.kv_cat || [],
      preop_voie: newChantier.value.preop_voie,
      preop_ses: newChantier.value.preop_ses,
      logistique: newChantier.value.logistique,
      supervisor: newChantier.value.supervisor || []
    }

    await upsertContactsTravaux(createdChantier.id, contactsData)

    if (etat === 2 && taches.value.length > 0) {
      const earliestReaDate = getEarliestDate(newChantier.value.realisation)
      const latestEndDate =
        newChantier.value.realisation.length > 0
          ? new Date(
              Math.max(
                ...newChantier.value.realisation.map((r) =>
                  r.date_end ? new Date(r.date_end) : new Date(r.date_start)
                )
              )
            )
          : null

      if (earliestReaDate) {
        const h00Entries = taches.value.map((tache) => {
          const previsionDate = calculatePrevisionDate(
            earliestReaDate,
            tache.delais || 0,
            tache.opt_delais || 0,
            latestEndDate
          )

          return {
            chantier_id: createdChantier.id,
            tache_id: tache.id,
            categorie_id: tache.id_categories,
            prevision: previsionDate,
            realisation: null,
            commentaire: null
          }
        })

        await createH00Entries(h00Entries)
      }
    }

    if (newChantier.value.weekends.length > 0) {
      for (const weekend of newChantier.value.weekends) {
        await addWeekend(
          createdChantier.id,
          weekend.debutSemaine,
          weekend.debutAnnee,
          weekend.finSemaine,
          weekend.finAnnee
        )
      }
    }

    await Promise.all([getAllContactsTravaux(), getAllWeekends()])

    addToast({
      title: 'Chantier créé',
      message: `Le chantier "${newChantier.value.name}" a été créé avec succès.`,
      type: 'Success'
    })

    drawerOpen.value = false
    resetNewChantier()
  } catch (err) {
    console.error('Erreur lors de la création du chantier:', err)
    addToast({
      title: 'Erreur',
      message: err.message || 'Une erreur est survenue lors de la création du chantier',
      type: 'Error'
    })
  } finally {
    isSubmitting.value = false
    setLoader(false)
  }
}

// Fonction pour réinitialiser le formulaire
const resetNewChantier = () => {
  newChantier.value = {
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
    supervisor: [],
    kv_voie: [],
    kv_ses: [],
    kv_cat: []
  }
  initializeDefaultUsers()
}

const drawerOpen = ref(false)
const toggleDrawer = () => {
  drawerOpen.value = !drawerOpen.value
  if (!drawerOpen.value) {
    isEditMode.value = false
    editingChantierId.value = null
  }
}

// Ouvrir le drawer en mode création
const openCreateDrawer = () => {
  isEditMode.value = false
  editingChantierId.value = null
  resetNewChantier()
  drawerOpen.value = true
}

// Ouvrir le drawer en mode édition
const openEditDrawer = async (chantier) => {
  setLoader(true)
  try {
    isEditMode.value = true
    editingChantierId.value = chantier.id

    const contactsData = await getContactsTravaux(chantier.id)
    const weekendsData = await getWeekendsByChantier(chantier.id)

    const realisations = (chantier.date_rea || []).map((r) => ({
      date_start: r.date_start_travaux ? new Date(r.date_start_travaux).getTime() : null,
      date_end: r.date_end_travaux ? new Date(r.date_end_travaux).getTime() : null
    }))

    const preparations = (chantier.date_prepa || []).map((p) => ({
      date_start: p.date_start_prepa ? new Date(p.date_start_prepa).getTime() : null,
      date_end: p.date_end_prepa ? new Date(p.date_end_prepa).getTime() : null
    }))

    const weekends = (weekendsData || []).map((w) => ({
      debutSemaine: w.semaine_debut,
      debutAnnee: w.annee_debut,
      finSemaine: w.semaine_fin,
      finAnnee: w.annee_fin
    }))

    originalDateRea.value = JSON.stringify(chantier.date_rea || [])
    originalEtat.value = chantier.etat

    newChantier.value = {
      entite: chantier.etat !== 1 ? 'uo_travaux' : 'autre',
      compte: chantier.compte || '',
      name: chantier.name || '',
      weekends: weekends,
      preparation: preparations,
      realisation: realisations,
      autre: chantier.autre || '',
      rlt_voie_principale: contactsData?.rlt_voie_principale || null,
      rlt_voie_secondaire: contactsData?.rlt_voie_secondaire || [],
      rlt_ses_principale: contactsData?.rlt_ses_principale || null,
      rlt_ses_secondaire: contactsData?.rlt_ses_secondaire || [],
      rlt_cat_principale: contactsData?.rlt_cat_principale || null,
      rlt_cat_secondaire: contactsData?.rlt_cat_secondaire || [],
      preop_ses: contactsData?.preop_ses || null,
      preop_voie: contactsData?.preop_voie || null,
      logistique: contactsData?.logistique || null,
      supervisor: contactsData?.supervisor || [],
      kv_voie: contactsData?.kv_voie || [],
      kv_ses: contactsData?.kv_ses || [],
      kv_cat: contactsData?.kv_cat || []
    }

    drawerOpen.value = true
  } catch (err) {
    console.error('Erreur lors du chargement du chantier:', err)
    addToast({
      title: 'Erreur',
      message: 'Impossible de charger les données du chantier',
      type: 'Error'
    })
  } finally {
    setLoader(false)
  }
}

// Sauvegarder les modifications du chantier
const handleSaveEdit = async () => {
  if (isSubmitting.value) return
  isSubmitting.value = true
  setLoader(true)

  try {
    const wasExternal = originalEtat.value === 1
    const isNowExternal = newChantier.value.entite === 'autre'

    let etat
    if (wasExternal !== isNowExternal) {
      etat = isNowExternal ? 1 : 2
    } else {
      etat = originalEtat.value
    }

    const dateRea = newChantier.value.realisation.map((r) => ({
      date_start_travaux: timestampToISODate(r.date_start),
      date_end_travaux: timestampToISODate(r.date_end)
    }))

    const datePrepa = newChantier.value.preparation.map((p) => ({
      date_start_prepa: timestampToISODate(p.date_start),
      date_end_prepa: timestampToISODate(p.date_end)
    }))

    await updateChantier(editingChantierId.value, {
      compte: newChantier.value.compte,
      name: newChantier.value.name,
      etat: etat,
      date_rea: dateRea,
      date_prepa: datePrepa,
      autre: newChantier.value.autre || null
    })

    const contactsData = {
      rlt_voie_principale: newChantier.value.rlt_voie_principale,
      rlt_voie_secondaire: newChantier.value.rlt_voie_secondaire || [],
      rlt_ses_principale: newChantier.value.rlt_ses_principale,
      rlt_ses_secondaire: newChantier.value.rlt_ses_secondaire || [],
      rlt_cat_principale: newChantier.value.rlt_cat_principale,
      rlt_cat_secondaire: newChantier.value.rlt_cat_secondaire || [],
      kv_voie: newChantier.value.kv_voie || [],
      kv_ses: newChantier.value.kv_ses || [],
      kv_cat: newChantier.value.kv_cat || [],
      preop_voie: newChantier.value.preop_voie,
      preop_ses: newChantier.value.preop_ses,
      logistique: newChantier.value.logistique,
      supervisor: newChantier.value.supervisor || []
    }
    await upsertContactsTravaux(editingChantierId.value, contactsData)

    await replaceWeekendsForChantier(editingChantierId.value, newChantier.value.weekends)

    const newDateReaStr = JSON.stringify(dateRea)
    if (etat !== 1 && originalDateRea.value !== newDateReaStr && taches.value.length > 0) {
      const { updated } = await recalculateH00Previsions(editingChantierId.value, dateRea, taches.value)
      if (updated > 0) {
        addToast({
          title: 'Tâches H00 recalculées',
          message: `${updated} dates de prévision ont été mises à jour.`,
          type: 'Info'
        })
      }
    }

    await Promise.all([getChantiers(), getAllContactsTravaux(), getAllWeekends()])

    addToast({
      title: 'Chantier mis à jour',
      message: `Le chantier "${newChantier.value.name}" a été modifié avec succès.`,
      type: 'Success'
    })

    drawerOpen.value = false
    isEditMode.value = false
    editingChantierId.value = null
  } catch (err) {
    console.error('Erreur lors de la mise à jour:', err)
    addToast({
      title: 'Erreur',
      message: err.message || 'Une erreur est survenue',
      type: 'Error'
    })
  } finally {
    isSubmitting.value = false
    setLoader(false)
  }
}

// Fonction pour obtenir le label et la couleur de l'état
const getEtatInfo = (etat) => {
  switch (etat) {
    case 0:
      return {
        label: 'RLT',
        color: 'bg-sky-500',
        textColor: 'text-sky-700',
        bgLight: 'bg-sky-100',
        border: 'border-sky-500'
      }
    case 1:
      return {
        label: 'Externe',
        color: 'bg-purple-500',
        textColor: 'text-purple-700',
        bgLight: 'bg-purple-100',
        border: 'border-purple-500'
      }
    case 2:
      return {
        label: 'Pré-op',
        color: 'bg-lime-500',
        textColor: 'text-lime-700',
        bgLight: 'bg-lime-100',
        border: 'border-lime-500'
      }
    case -1:
      return {
        label: 'Terminé',
        color: 'bg-slate-500',
        textColor: 'text-slate-700',
        bgLight: 'bg-slate-100',
        border: 'border-slate-500'
      }
    default:
      return {
        label: 'Inconnu',
        color: 'bg-gray-500',
        textColor: 'text-gray-700',
        bgLight: 'bg-gray-100',
        border: 'border-gray-500'
      }
  }
}

// Fonction pour formater une date
const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

// Fonction pour obtenir la première date de réalisation
const getFirstReaDate = (chantier) => {
  if (!chantier.date_rea || chantier.date_rea.length === 0) return null
  const dates = chantier.date_rea
    .map((r) => r.date_start_travaux)
    .filter((d) => d)
    .sort((a, b) => new Date(a) - new Date(b))
  return dates.length > 0 ? dates[0] : null
}

// Fonction pour obtenir la dernière date de réalisation
const getLastReaDate = (chantier) => {
  if (!chantier.date_rea || chantier.date_rea.length === 0) return null
  const dates = chantier.date_rea
    .map((r) => r.date_end_travaux || r.date_start_travaux)
    .filter((d) => d)
    .sort((a, b) => new Date(b) - new Date(a))
  return dates.length > 0 ? dates[0] : null
}

// Filtrage des chantiers
const filteredChantiers = computed(() => {
  if (!allChantiers.value || !Array.isArray(allChantiers.value)) return []

  const search = searchQuery.value.toLowerCase().trim()

  let result = allChantiers.value.filter((chantier) => {
    // Filtre par recherche
    if (search) {
      const matchCompte = chantier.compte?.toLowerCase().includes(search)
      const matchName = chantier.name?.toLowerCase().includes(search)
      const matchLigne = chantier.ligne?.toLowerCase().includes(search)
      if (!matchCompte && !matchName && !matchLigne) return false
    }

    // Filtre par état
    if (selectedEtat.value !== 'all') {
      switch (selectedEtat.value) {
        case 'rlt':
          if (chantier.etat !== 0) return false
          break
        case 'preop':
          if (chantier.etat !== 2) return false
          break
        case 'externe':
          if (chantier.etat !== 1) return false
          break
        case 'termine':
          if (chantier.etat !== -1) return false
          break
      }
    }

    return true
  })

  // Tri des résultats
  result.sort((a, b) => {
    switch (sortBy.value) {
      case 'date_desc':
        return new Date(getFirstReaDate(b) || 0) - new Date(getFirstReaDate(a) || 0)
      case 'date_asc':
        return new Date(getFirstReaDate(a) || 0) - new Date(getFirstReaDate(b) || 0)
      case 'name_asc':
        return (a.name || '').localeCompare(b.name || '')
      case 'name_desc':
        return (b.name || '').localeCompare(a.name || '')
      case 'compte_asc':
        return (a.compte || '').localeCompare(b.compte || '')
      case 'compte_desc':
        return (b.compte || '').localeCompare(a.compte || '')
      default:
        return 0
    }
  })

  return result
})

// Compteurs par état
const countByEtat = computed(() => {
  if (!allChantiers.value || !Array.isArray(allChantiers.value)) {
    return { all: 0, rlt: 0, preop: 0, externe: 0, termine: 0 }
  }
  return {
    all: allChantiers.value.length,
    rlt: allChantiers.value.filter((c) => c.etat === 0).length,
    preop: allChantiers.value.filter((c) => c.etat === 2).length,
    externe: allChantiers.value.filter((c) => c.etat === 1).length,
    termine: allChantiers.value.filter((c) => c.etat === -1).length
  }
})

// Navigation vers le détail d'un chantier
const goToChantier = (chantierId) => {
  navigateTo(`/chantiers/${chantierId}`)
}

// Fonction pour initialiser les valeurs par défaut
const initializeDefaultUsers = () => {
  if (getUsersPreopSes.value?.length > 0 && newChantier.value.preop_ses === null) {
    newChantier.value.preop_ses = getUsersPreopSes.value[0].email
  }
  if (getUsersPreopVoie.value?.length > 0 && newChantier.value.preop_voie === null) {
    newChantier.value.preop_voie = getUsersPreopVoie.value[0].email
  }
  if (getUsersLogistique.value?.length > 0 && newChantier.value.logistique === null) {
    newChantier.value.logistique = getUsersLogistique.value[0].email
  }
}

// Charger les chantiers au montage
onMounted(async () => {
  setLoader(true)
  try {
    await Promise.all([getChantiers(), getAllUsers(), getAllContactsTravaux(), getTaches(), getAllWeekends()])
    initializeDefaultUsers()
  } finally {
    setLoader(false)
  }
})
</script>

<template>
  <div class="flex w-full flex-col gap-4 p-4 lg:h-full lg:overflow-hidden lg:px-4 lg:py-0 lg:pt-4">
    <!-- Header avec titre -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <AppTitleMain title="Liste des chantiers" description="Gestion et suivi de tous les chantiers" />
    </div>

    <!-- Barre de filtres et actions -->
    <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <!-- Recherche -->
      <div class="flex-1">
        <AppInputSearch v-model="searchQuery" class="h-fit w-full max-w-sm" placeholder="Rechercher un chantier ..." />
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-2">
        <!-- Bouton nouveau chantier -->
        <AppButtonValidated
          v-if="canEdit"
          theme="primary"
          type="button"
          @click="openCreateDrawer"
          class="h-fit flex-none">
          <template #default>
            <span class="flex flex-none items-center gap-2 text-sm">
              <Icon name="lucide:plus" size="18" />
              Nouveau chantier
            </span>
          </template>
        </AppButtonValidated>
      </div>
    </div>
    <!-- Filtres par état -->
    <div class="flex flex-wrap items-center gap-2">
      <button
        v-for="option in etatOptions"
        :key="option.id"
        @click="selectedEtat = option.id"
        class="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all duration-200"
        :class="
          selectedEtat === option.id
            ? option.color + ' border-2 shadow-sm'
            : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400'
        ">
        <Icon :name="option.icon" size="16" />
        {{ option.label }}
        <span
          class="ml-1 rounded-full px-1.5 text-xs font-bold"
          :class="selectedEtat === option.id ? 'bg-white/30' : 'bg-gray-100 dark:bg-gray-700'">
          {{ countByEtat[option.id] }}
        </span>
      </button>
      <!-- Tri -->
      <div class="w-48 flex-none"><AppSelect v-model="sortBy" :options="sortOptions" /></div>
    </div>

    <!-- Liste des chantiers -->
    <div class="flex-1 overflow-auto rounded-lg">
      <div
        v-if="filteredChantiers.length > 0"
        class="grid grid-cols-1 gap-4 py-4 md:grid-cols-2 lg:grid-cols-3 lg:px-4 xl:grid-cols-5">
        <div
          v-for="chantier in filteredChantiers"
          :key="chantier.id"
          class="group hover:border-primary-200 hover:shadow-primary-200/40 relative cursor-pointer overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:shadow-lg lg:hover:scale-105 dark:border-gray-700 dark:bg-gray-800"
          @click="goToChantier(chantier.id)">
          <!-- Bande de couleur supérieure -->
          <!-- <div class="h-1.5 w-full" :class="getEtatInfo(chantier.etat).color"></div> -->

          <div class="flex h-full flex-col p-4">
            <!-- En-tête avec compte et état -->
            <div class="mb-3 flex items-start justify-between">
              <div class="flex items-center gap-2">
                <span
                  class="rounded-md bg-gray-100 px-2 py-1 font-mono text-sm font-bold text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                  {{ chantier.compte }}
                </span>
              </div>
              <span
                class="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                :class="getEtatInfo(chantier.etat).bgLight + ' ' + getEtatInfo(chantier.etat).textColor">
                {{ getEtatInfo(chantier.etat).label }}
              </span>
            </div>

            <!-- Nom du chantier -->
            <h3 class="mb-3 line-clamp-2 text-lg font-semibold text-gray-900 dark:text-white">
              {{ chantier.name }}
            </h3>

            <!-- Dates de réalisation -->
            <div
              v-if="getFirstReaDate(chantier)"
              class="mb-3 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Icon name="lucide:calendar" size="16" class="text-gray-400" />
              <span>{{ formatDate(getFirstReaDate(chantier)) }}</span>
              <template v-if="getLastReaDate(chantier) && getLastReaDate(chantier) !== getFirstReaDate(chantier)">
                <Icon name="lucide:arrow-right" size="14" class="text-gray-400" />
                <span>{{ formatDate(getLastReaDate(chantier)) }}</span>
              </template>
            </div>
            <div v-else class="mb-3 flex items-center gap-2 text-sm text-gray-400 italic">
              <Icon name="lucide:calendar-x" size="16" />
              <span>Aucune date de réalisation</span>
            </div>

            <!-- Périodes -->
            <div class="mb-3 flex flex-wrap gap-2">
              <div
                v-if="chantier.date_prepa?.length > 0"
                class="flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                <Icon name="lucide:clock" size="12" />
                {{ chantier.date_prepa.length }} prépa.
              </div>
              <div
                v-if="chantier.date_rea?.length > 0"
                class="flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                <Icon name="lucide:hard-hat" size="12" />
                {{ chantier.date_rea.length }} réa.
              </div>
            </div>

            <!-- Actions -->
            <div class="mt-auto flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-700">
              <button
                @click.stop="goToChantier(chantier.id)"
                class="flex cursor-pointer items-center gap-1 text-sm font-medium text-slate-600 transition-colors hover:text-slate-700">
                <Icon name="lucide:eye" size="16" />
                Voir détails
              </button>
              <button
                v-if="canEdit"
                @click.stop="openEditDrawer(chantier)"
                class="flex items-center gap-1 text-sm font-medium text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <Icon name="lucide:pencil" size="16" />
                Modifier
              </button>
            </div>
          </div>

          <!-- Overlay au hover -->
          <!-- <div
            class="from-primary-200/30 pointer-events-none absolute inset-0 bg-linear-to-t to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div> -->
        </div>
      </div>

      <!-- Message si aucun chantier -->
      <div
        v-else
        class="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 py-16 dark:border-gray-700 dark:bg-gray-800/50">
        <Icon name="lucide:folder-open" size="48" class="mb-4 text-gray-300 dark:text-gray-600" />
        <p class="mb-2 text-lg font-medium text-gray-500 dark:text-gray-400">Aucun chantier trouvé</p>
        <p class="mb-4 text-sm text-gray-400 dark:text-gray-500">
          {{ searchQuery ? 'Essayez de modifier votre recherche' : 'Commencez par créer un nouveau chantier' }}
        </p>
        <AppButtonValidated v-if="canEdit && !searchQuery" theme="primary" type="button" @click="openCreateDrawer">
          <template #default>
            <span class="flex items-center gap-2 text-sm">
              <Icon name="lucide:plus" size="18" />
              Créer un chantier
            </span>
          </template>
        </AppButtonValidated>
      </div>
    </div>

    <!-- Drawer pour création/édition -->
    <AppDrawer :drawer-open="drawerOpen" :close-drawer="toggleDrawer" height-class="h-[90vh] md:h-[70vh]">
      <template #default>
        <AppDrawerContent
          v-if="drawerOpen"
          :drawer-open="drawerOpen"
          :close-drawer="toggleDrawer"
          height-class="h-[90vh] md:h-[70vh]">
          <ChantierForm
            v-model="newChantier"
            :is-edit-mode="isEditMode"
            :users-rlt-voie="getUsersRltVoie"
            :users-rlt-ses="getUsersRltSes"
            :users-rlt-cat="getUsersRltCat"
            :users-logistique="getUsersLogistique"
            :users-kv-voie="getUsersKvVoie"
            :users-kv-ses="getUsersKvSes"
            :users-kv-cat="getUsersKvCat"
            :users-preop-voie="getUsersPreopVoie"
            :users-preop-ses="getUsersPreopSes"
            :users-ref-rdu="getUsersRefRdu"
            :users="users"
            :taches="taches"
            :is-submitting="isSubmitting"
            @submit="handleFormSubmit"
            @cancel="toggleDrawer" />
        </AppDrawerContent>
      </template>
    </AppDrawer>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
