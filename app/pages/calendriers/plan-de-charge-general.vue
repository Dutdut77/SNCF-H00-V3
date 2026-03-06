<script setup>
definePageMeta({
  requiresAuth: true,
  requiredRole: ''
})

useHead({
  title: 'H00 - Plan de Charge Général',
  description: 'Calendrier annuel des chantiers'
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

// État réactif pour l'année sélectionnée
const selectedYear = ref(new Date().getFullYear())
const hoveredWeek = ref(null)

// Mode édition du drawer
const isEditMode = ref(false)
const editingChantierId = ref(null)
const originalDateRea = ref([]) // Pour détecter les changements de dates
const originalEtat = ref(null) // Pour garder l'état original en édition

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
    // Par rapport à la fin des travaux
    baseDate = new Date(endDate)
  } else {
    // Par rapport au début des travaux
    baseDate = new Date(referenceDate)
  }

  baseDate.setDate(baseDate.getDate() - delais)
  return baseDate.toISOString().split('T')[0]
}

// État de soumission
const isSubmitting = ref(false)

// Handler unifié pour le formulaire (création et édition)
const handleFormSubmit = async (formData) => {
  // Mettre à jour les données locales avec celles du formulaire
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
    // Déterminer l'état selon l'entité
    const etat = newChantier.value.entite === 'uo_travaux' ? 2 : 1

    // Préparer les données de réalisation au format attendu par la BDD
    const dateRea = newChantier.value.realisation.map((r) => ({
      date_start_travaux: timestampToISODate(r.date_start),
      date_end_travaux: timestampToISODate(r.date_end)
    }))

    // Préparer les données de préparation au format attendu par la BDD
    const datePrepa = newChantier.value.preparation.map((p) => ({
      date_start_prepa: timestampToISODate(p.date_start),
      date_end_prepa: timestampToISODate(p.date_end)
    }))

    // 1. Créer le chantier
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

    // 2. Créer les contacts travaux
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

    $fetch('/api/email/send', { method: 'POST', body: { type: 'creation', chantierId: createdChantier.id } }).catch(console.error)

    // 3. Si etat = 2 (UO Travaux), créer les tâches H00
    if (etat === 2 && taches.value.length > 0) {
      // Récupérer la première date de réalisation
      const earliestReaDate = getEarliestDate(newChantier.value.realisation)

      // Récupérer la dernière date de fin de réalisation
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
        // Créer les entrées H00 pour chaque tâche
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

    // 4. Créer les weekends dans la table timeline
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

    // Recharger les données
    await Promise.all([getAllContactsTravaux(), getAllWeekends()])

    addToast({
      title: 'Chantier créé',
      message: `Le chantier "${newChantier.value.name}" a été créé avec succès.`,
      type: 'Success'
    })

    // Fermer le drawer et réinitialiser le formulaire
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

// Barre de recherche
const searchQuery = ref('')
const drawerOpen = ref(false)
const toggleDrawer = () => {
  drawerOpen.value = !drawerOpen.value
  if (!drawerOpen.value) {
    // Reset mode édition quand on ferme
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

    // Charger les contacts travaux
    const contactsData = await getContactsTravaux(chantier.id)

    // Charger les weekends
    const weekendsData = await getWeekendsByChantier(chantier.id)

    // Convertir date_rea en format avec timestamps pour le formulaire
    const realisations = (chantier.date_rea || []).map((r) => ({
      date_start: r.date_start_travaux ? new Date(r.date_start_travaux).getTime() : null,
      date_end: r.date_end_travaux ? new Date(r.date_end_travaux).getTime() : null
    }))

    // Convertir date_prepa en format avec timestamps
    const preparations = (chantier.date_prepa || []).map((p) => ({
      date_start: p.date_start_prepa ? new Date(p.date_start_prepa).getTime() : null,
      date_end: p.date_end_prepa ? new Date(p.date_end_prepa).getTime() : null
    }))

    // Convertir weekends timeline en format formulaire
    const weekends = (weekendsData || []).map((w) => ({
      debutSemaine: w.semaine_debut,
      debutAnnee: w.annee_debut,
      finSemaine: w.semaine_fin,
      finAnnee: w.annee_fin
    }))

    // Stocker les dates originales et l'état pour comparaison
    originalDateRea.value = JSON.parse(JSON.stringify(chantier.date_rea || []))
    originalEtat.value = chantier.etat

    // Remplir le formulaire
    // Seul etat === 1 est externe, tous les autres (0, 2, -1) sont UO Travaux
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
const toYMD = (value) => {
  if (typeof value === 'number') {
    return new Date(value).toISOString().slice(0, 10)
  }
  return value // déjà YYYY-MM-DD
}

const haveRealisationDatesChanged = () => {
  const current = newChantier.value.realisation
  const initial = originalDateRea.value

  if (current.length !== initial.length) return true

  return current.some((period, index) => {
    return (
      toYMD(period.date_start) !== initial[index].date_start_travaux ||
      toYMD(period.date_end) !== initial[index].date_end_travaux
    )
  })
}

// Sauvegarder les modifications du chantier
const handleSaveEdit = async () => {
  if (isSubmitting.value) return
  isSubmitting.value = true
  setLoader(true)

  try {
    // Déterminer l'état :
    // - Si l'entité a changé, on définit le nouvel état (2 pour UO Travaux, 1 pour externe)
    // - Sinon on garde l'état original (pour ne pas rétrograder un chantier RLT en pré-op par exemple)
    const wasExternal = originalEtat.value === 1
    const isNowExternal = newChantier.value.entite === 'autre'

    let etat
    if (wasExternal !== isNowExternal) {
      // L'entité a changé
      etat = isNowExternal ? 1 : 2
    } else {
      // L'entité n'a pas changé, on garde l'état original
      etat = originalEtat.value
    }

    // Préparer les données de réalisation
    const dateRea = newChantier.value.realisation.map((r) => ({
      date_start_travaux: timestampToISODate(r.date_start),
      date_end_travaux: timestampToISODate(r.date_end)
    }))

    // Préparer les données de préparation
    const datePrepa = newChantier.value.preparation.map((p) => ({
      date_start_prepa: timestampToISODate(p.date_start),
      date_end_prepa: timestampToISODate(p.date_end)
    }))

    // 1. Mettre à jour le chantier
    await updateChantier(editingChantierId.value, {
      compte: newChantier.value.compte,
      name: newChantier.value.name,
      etat: etat,
      date_rea: dateRea,
      date_prepa: datePrepa,
      autre: newChantier.value.autre || null
    })

    // 2. Mettre à jour les contacts
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

    // 3. Mettre à jour les weekends
    await replaceWeekendsForChantier(editingChantierId.value, newChantier.value.weekends)

    // 4. Si les dates de réalisation ont changé et c'est un UO Travaux (etat !== 1), recalculer les H00
    const realisationChanged = haveRealisationDatesChanged()
    if (etat !== 1 && realisationChanged && taches.value.length > 0) {
      const { updated } = await recalculateH00Previsions(editingChantierId.value, dateRea, taches.value)
      if (updated > 0) {
        addToast({
          title: 'Tâches H00 recalculées',
          message: `${updated} dates de prévision ont été mises à jour.`,
          type: 'Info'
        })
      }
    }

    // Recharger les données
    await Promise.all([getChantiers(), getAllContactsTravaux(), getAllWeekends()])

    // addToast({
    //   title: 'Chantier mis à jour',
    //   message: `Le chantier "${newChantier.value.name}" a été modifié avec succès.`,
    //   type: 'Success'
    // })

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

// Générer les semaines S1 à S53
const weeks = computed(() => {
  return Array.from({ length: 53 }, (_, i) => ({
    number: i + 1,
    label: `${i + 1}`
  }))
})

// Noms des mois en français
const monthNames = ['Janv.', 'Fév.', 'Mars', 'Avril', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.']

// Fonction pour obtenir la date du jeudi de la semaine ISO (utilisée pour déterminer le mois dominant)
const getThursdayOfWeek = (weekNumber, year) => {
  // Trouver le 4 janvier de l'année (toujours en semaine 1)
  const jan4 = new Date(year, 0, 4)
  // Trouver le lundi de la semaine 1
  const dayOfWeek = jan4.getDay() || 7 // Dimanche = 7
  const monday = new Date(jan4)
  monday.setDate(jan4.getDate() - dayOfWeek + 1)

  // Ajouter le nombre de semaines
  const targetMonday = new Date(monday)
  targetMonday.setDate(monday.getDate() + (weekNumber - 1) * 7)

  // Retourner le jeudi (+ 3 jours depuis lundi)
  const thursday = new Date(targetMonday)
  thursday.setDate(targetMonday.getDate() + 3)
  return thursday
}

// Calculer les mois avec leurs semaines correspondantes pour l'année sélectionnée
const monthsWithColspan = computed(() => {
  const year = selectedYear.value
  const weeksByMonth = Array(12).fill(0)

  // Pour chaque semaine de 1 à 53, déterminer à quel mois elle appartient
  // On utilise le jeudi de la semaine pour déterminer le mois dominant
  for (let week = 1; week <= 53; week++) {
    const thursday = getThursdayOfWeek(week, year)
    const thursdayYear = thursday.getFullYear()
    const month = thursday.getMonth()

    // Attribuer la semaine au mois en tenant compte des cas limites
    if (thursdayYear === year) {
      weeksByMonth[month]++
    } else if (thursdayYear < year) {
      // Semaine 1 avec jeudi en décembre de l'année précédente -> attribuer à janvier
      weeksByMonth[0]++
    } else {
      // Semaine 52/53 avec jeudi en janvier de l'année suivante -> attribuer à décembre
      weeksByMonth[11]++
    }
  }

  // Construire le tableau des mois avec leurs colspan (filtrer les mois avec 0 semaines)
  return monthNames
    .map((name, index) => ({
      name,
      colspan: weeksByMonth[index]
    }))
    .filter((m) => m.colspan > 0)
})

// Fonction pour obtenir le numéro de semaine ISO d'une date
const getWeekNumber = (date) => {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 4 - (d.getDay() || 7))
  const yearStart = new Date(d.getFullYear(), 0, 1)
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7)
}

// Fonction pour vérifier si une période chevauche l'année sélectionnée
const isPeriodInYear = (startDateStr, endDateStr, year) => {
  if (!startDateStr) return false
  const startDate = new Date(startDateStr)
  const endDate = endDateStr ? new Date(endDateStr) : startDate
  const startYear = startDate.getFullYear()
  const endYear = endDate.getFullYear()
  return startYear <= year && endYear >= year
}

// Fonction pour vérifier si un chantier a des données visibles sur l'année
const isChantierVisibleForYear = (chantier, year) => {
  // Vérifier les périodes de réalisation
  const hasReaInYear = chantier.date_rea?.some((p) => isPeriodInYear(p.date_start_travaux, p.date_end_travaux, year))
  if (hasReaInYear) return true

  // Vérifier les périodes de préparation
  const hasPrepaInYear = chantier.date_prepa?.some((p) => isPeriodInYear(p.date_start_prepa, p.date_end_prepa, year))
  if (hasPrepaInYear) return true

  // Vérifier les week-ends (via isWeekendForChantier ou directement)
  // Note: les week-ends sont stockés par semaine/année, on vérifie si l'année correspond
  const weekendsForChantier = allWeekends.value?.filter((w) => w.chantier_id === chantier.id) || []
  const hasWeekendInYear = weekendsForChantier.some((w) => w.annee_debut === year || w.annee_fin === year)
  if (hasWeekendInYear) return true

  return false
}

// Accès aux week-ends
const allWeekends = useState('allWeekends')

// Fonction mise à jour pour filtrer les chantiers (prépa, réa et week-ends)
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

      // Vérifier si le chantier a des données (prépa, réa ou week-end) pour l'année
      return isChantierVisibleForYear(chantier, selectedYear.value)
    })
    .sort((a, b) => {
      // Trier par la date de début de la première période de réalisation (ou prépa si pas de réa)
      const getFirstDate = (chantier) => {
        if (chantier.date_rea?.[0]?.date_start_travaux) {
          return new Date(chantier.date_rea[0].date_start_travaux)
        }
        if (chantier.date_prepa?.[0]?.date_start_prepa) {
          return new Date(chantier.date_prepa[0].date_start_prepa)
        }
        return new Date()
      }
      return getFirstDate(a) - getFirstDate(b)
    })
})

// Navigation par année
const previousYear = () => {
  selectedYear.value--
}

const nextYear = () => {
  selectedYear.value++
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
// Ouvrir la page d'impression dans un nouvel onglet
const openPrintPage = () => {
  const printUrl = `/calendriers/print/plan-de-charge-generale?year=${selectedYear.value}`
  window.open(printUrl, '_blank')
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
    <!-- Header avec titre et navigation -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <AppTitleMain title="Plan de charge général" description="Calendrier des chantiers pour l'année en cours" />
    </div>

    <div class="flex flex-col-reverse items-center justify-center gap-4 lg:flex-row lg:justify-between">
      <div class="flex w-full flex-1 justify-center lg:justify-start">
        <AppInputSearch v-model="searchQuery" class="h-fit w-full lg:max-w-sm"
          placeholder="Rechercher un chantier ..." />
      </div>
      <div
        class="border-primary-300 flex cursor-default flex-col flex-wrap items-center gap-2 rounded-lg border p-4 shadow-lg">
        <div class="mr-auto text-start text-sm font-medium italic underline">Légende :</div>
        <div class="flex flex-wrap items-center gap-2">
          <div class="rounded-md border border-slate-700 bg-slate-500 px-2 py-1 text-xs font-bold text-white">
            Terminé
          </div>
          <div class="rounded-md border border-sky-700 bg-sky-500 px-2 py-1 text-xs font-bold text-white">RLT</div>
          <div class="rounded-md border border-lime-700 bg-lime-500 px-2 py-1 text-xs font-bold text-white">Pré-op</div>
          <div class="rounded-md border border-purple-700 bg-purple-500 px-2 py-1 text-xs font-bold text-white">
            Externe
          </div>
          <div class="rounded-md border border-orange-700 bg-orange-500 px-2 py-1 text-xs font-bold text-white">
            Week-end
          </div>
        </div>
      </div>
      <div v-if="canEdit" class="flex flex-1 justify-end">
        <AppButtonValidated theme="primary" type="button" @click="openCreateDrawer" class="">
          <template #default>
            <span class="flex items-center gap-2 text-sm">
              <Icon name="lucide:diamond-plus" size="18" />
              Nouveau chantier
            </span>
          </template>
        </AppButtonValidated>
      </div>
      <div class="hidden lg:flex lg:items-center lg:justify-center">
        <button @click="openPrintPage"
          class="group flex w-fit items-center justify-center gap-3 rounded-lg bg-linear-to-r from-slate-700 to-gray-800 px-4 py-2 text-sm font-medium text-white shadow-lg transition-all duration-300 hover:from-slate-600 hover:to-gray-700 hover:shadow-xl dark:from-slate-600 dark:to-gray-700 dark:hover:from-slate-500 dark:hover:to-gray-600">
          <Icon name="lucide:printer" size="18" class="transition-transform duration-300 group-hover:scale-110" />
          <span>Imprimer</span>
        </button>
      </div>
    </div>

    <!-- Tableau calendrier -->
    <div class="border-primary-200 bg-primary-50 w-full overflow-x-auto rounded-lg border shadow-sm">
      <table class="w-full min-w-[1400px]">
        <!-- Header avec les semaines -->
        <thead class="bg-primary-50 sticky top-0 z-30">
          <!-- Ligne des mois -->
          <tr class="bg-primary-50">
            <!-- Colonne chantier -->
            <th rowspan="2"
              class="border-primary-200 bg-primary-50 text-primary-600 left-0 z-40 mx-auto min-w-[240px] border-r border-b px-3 py-2 text-left text-[10px] font-semibold tracking-wider uppercase lg:sticky">
              <!-- Navigation par année -->
              <div class="flex items-center justify-center">
                <button @click="previousYear"
                  class="text-primary-600 hover:bg-primary-200 flex cursor-pointer items-center rounded-l-lg px-2 transition-colors"
                  title="Année précédente">
                  <Icon name="lucide:chevron-left" size="18" />
                </button>

                <span class="text-primary-700 px-2 text-base font-semibold dark:text-white">
                  {{ selectedYear }}
                </span>

                <button @click="nextYear"
                  class="text-primary-600 hover:bg-primary-200 flex cursor-pointer items-center rounded-r-lg px-2 transition-colors"
                  title="Année suivante">
                  <Icon name="lucide:chevron-right" size="18" />
                </button>
              </div>
            </th>
            <!-- Colonnes mois -->
            <th v-for="(month, index) in monthsWithColspan" :key="'month-' + index" :colspan="month.colspan"
              class="border-primary-200 bg-primary-100 text-primary-700 border-x border-b px-1 py-1 text-center text-xs font-semibold">
              {{ month.name }}
            </th>
            <!-- Headers RLT et Pré-op -->
            <th colspan="3"
              class="border-primary-200 text-primary-700 min-w-[24px] border-x px-0 text-center text-xs font-medium transition-colors">
              RLT VOIE
            </th>
            <th colspan="3"
              class="border-primary-200 text-primary-700 min-w-[24px] border-x px-0 text-center text-xs font-medium transition-colors">
              RLT SES
            </th>
            <th colspan="3"
              class="border-primary-200 text-primary-700 min-w-[24px] border-x px-0 text-center text-xs font-medium transition-colors">
              RLT CAT
            </th>
            <th colspan="3"
              class="border-primary-200 text-primary-700 min-w-[24px] border-x px-0 text-center text-xs font-medium uppercase transition-colors">
              Pré-op
            </th>
          </tr>
          <!-- Ligne des semaines et sous-headers -->
          <tr class="bg-primary-50 border-primary-200 border-b">
            <!-- Colonnes semaines -->
            <th v-for="week in weeks" :key="week.number"
              class="border-primary-200 text-primary-700 min-w-[24px] border-b px-0 text-center text-sm font-medium transition-colors"
              :class="{
                'bg-primary-300 text-primary-800 font-semibold':
                  week.number === getWeekNumber(new Date()) && selectedYear === new Date().getFullYear(),
                'bg-primary-100 text-primary-800': hoveredWeek === week.number
              }" @mouseenter="hoveredWeek = week.number" @mouseleave="hoveredWeek = null">
              {{ week.label }}
            </th>
            <!-- Sous-headers RLT VOIE -->
            <th
              class="border-primary-200 text-primary-700 min-w-[56px] border-x text-center text-xs font-medium transition-colors">
              1er
            </th>
            <th
              class="border-primary-200 text-primary-700 min-w-[56px] border-x text-center text-xs font-medium transition-colors">
              2nd
            </th>
            <th
              class="border-primary-200 text-primary-700 min-w-[56px] border-x text-center text-xs font-medium transition-colors">
              Kv
            </th>
            <!-- Sous-headers RLT SES -->
            <th
              class="border-primary-200 text-primary-700 min-w-[56px] border-x text-center text-xs font-medium transition-colors">
              1er
            </th>
            <th
              class="border-primary-200 text-primary-700 min-w-[56px] border-x text-center text-xs font-medium transition-colors">
              2nd
            </th>
            <th
              class="border-primary-200 text-primary-700 min-w-[56px] border-x text-center text-xs font-medium transition-colors">
              Kv
            </th>
            <!-- Sous-headers RLT CAT -->
            <th
              class="border-primary-200 text-primary-700 min-w-[56px] border-x text-center text-xs font-medium transition-colors">
              1er
            </th>
            <th
              class="border-primary-200 text-primary-700 min-w-[56px] border-x text-center text-xs font-medium transition-colors">
              2nd
            </th>
            <th
              class="border-primary-200 text-primary-700 min-w-[56px] border-x text-center text-xs font-medium transition-colors">
              Kv
            </th>
            <!-- Sous-headers Pré-op -->
            <th
              class="border-primary-200 text-primary-700 min-w-[56px] border-x text-center text-xs font-medium transition-colors">
              Voie
            </th>
            <th
              class="border-primary-200 text-primary-700 min-w-[56px] border-x text-center text-xs font-medium transition-colors">
              Ses
            </th>
            <th
              class="border-primary-200 text-primary-700 min-w-[56px] border-x text-center text-xs font-medium transition-colors">
              Log
            </th>
          </tr>
        </thead>

        <!-- Corps du tableau -->
        <tbody class="divide-primary-100 divide-y">
          <ChantierTimelineRow v-for="chantier in filteredChantiers" :key="chantier.id" :chantier="chantier"
            :weeks="weeks" :selected-year="selectedYear" :hovered-week="hoveredWeek" :show-contacts="true"
            :clickable="canEdit" @week-click="openEditDrawer" @week-hover="hoveredWeek = $event"
            @week-leave="hoveredWeek = null" />

          <!-- Message si aucun chantier -->
          <tr v-if="filteredChantiers.length === 0">
            <td colspan="54" class="px-6 py-12 text-center">
              <div class="flex flex-col items-center gap-3">
                <Icon name="lucide:calendar-x" size="32" class="text-primary-300" />
                <p class="text-primary-700">Aucun chantier pour l'année {{ selectedYear }}</p>
                <div class="mt-2 flex gap-2">
                  <button @click="selectedYear = new Date().getFullYear()"
                    class="text-primary-700 hover:text-primary-700 cursor-pointer text-sm font-medium">
                    Revenir à {{ new Date().getFullYear() }}
                  </button>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <AppDrawer :drawer-open="drawerOpen" :close-drawer="toggleDrawer" :height-percent="80">
      <AppDrawerContent :drawer-open="drawerOpen" :close-drawer="toggleDrawer">
        <ChantierForm :model-value="newChantier" :is-edit-mode="isEditMode" :users-rlt-voie="getUsersRltVoie"
          :users-rlt-ses="getUsersRltSes" :users-rlt-cat="getUsersRltCat" :users-logistique="getUsersLogistique"
          :users-kv-voie="getUsersKvVoie" :users-kv-ses="getUsersKvSes" :users-kv-cat="getUsersKvCat"
          :users-preop-voie="getUsersPreopVoie" :users-preop-ses="getUsersPreopSes" :users-ref-rdu="getUsersRefRdu"
          :users="users" :taches="taches" :is-submitting="isSubmitting" @submit="handleFormSubmit"
          @cancel="toggleDrawer" />
      </AppDrawerContent>
    </AppDrawer>
  </div>
</template>

<style scoped>
/* Scroll smooth */
.overflow-auto {
  scroll-behavior: smooth;
}
</style>
