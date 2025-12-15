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
const { getAllContactsTravaux, allContactsTravaux, upsertContactsTravaux, getContactsTravaux } = useContacts()
const { setLoader } = useLoader()
const { taches, getTaches } = useTaches()
const { createH00Entries, recalculateH00Previsions } = useH00()
const { addToast } = useToast()
const { addWeekend, getAllWeekends, isWeekendForChantier, getWeekendsByChantier, replaceWeekendsForChantier } =
  useTimeline()

// Accès direct au state partagé des chantiers
const allChantiers = useState('allChantiers')

// État réactif pour l'année sélectionnée
const selectedYear = ref(new Date().getFullYear())
const hoveredWeek = ref(null)
const isRealisationAdd = ref(false)
const isPreparationAdd = ref(false)
const isWeekendAdd = ref(false)

// Mode édition du drawer
const isEditMode = ref(false)
const editingChantierId = ref(null)
const activeEditTab = ref('generalites') // 'generalites', 'periodes', 'contacts'
const originalDateRea = ref([]) // Pour détecter les changements de dates
const originalEtat = ref(null) // Pour garder l'état original en édition

const showAddDate = (type) => {
  switch (type) {
    case 'weekend':
      isWeekendAdd.value = !isWeekendAdd.value
      isRealisationAdd.value = false
      isPreparationAdd.value = false
      break
    case 'realisation':
      isRealisationAdd.value = !isRealisationAdd.value
      isWeekendAdd.value = false
      isPreparationAdd.value = false
      break
    case 'preparation':
      isPreparationAdd.value = !isPreparationAdd.value
      isWeekendAdd.value = false
      isRealisationAdd.value = false
      break
  }
}
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

const steps = [
  {
    label: 'Généralités',
    description: 'Les informations générales'
  },
  {
    label: 'Périodes',
    description: 'Dates programmées du chantier'
  },
  {
    label: 'Contacts',
    description: 'Les contacts travaux du chantier'
  },
  {
    label: 'Récapitulatif',
    description: 'Récapitulatif des données du chantier'
  }
]
// Validation de l'étape 1
const isStep1Valid = computed(() => {
  return (
    newChantier.value.name.trim() !== '' &&
    newChantier.value.compte.trim() !== '' &&
    newChantier.value.entite.trim() !== ''
  )
})

// Validation de l'étape 2
const isStep2Valid = computed(() => {
  return newChantier.value.realisation.length > 0
})

// Validation de l'étape 3
const isStep3Valid = computed(() => {
  return true
})

// Fonction de validation pour le StepBar
const validateCurrentStep = (stepIndex) => {
  switch (stepIndex) {
    case 0:
      return isStep1Valid.value
    case 1:
      return isStep2Valid.value
    case 2:
      return isStep3Valid.value
    default:
      return true
  }
}

// Gestion du changement d'étape
const handleStepChange = (from, to) => {
  // console.log(`Passage de l'étape ${from + 1} à l'étape ${to + 1}`)
}

// Fonction pour formater un timestamp en date lisible
const formatTimestampToDisplay = (timestamp) => {
  if (!timestamp) return '-'
  const date = new Date(timestamp)
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
}

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

// Formulaire pour nouveau week-end (simplifié: on demande juste la semaine de début)
const newWeekend = ref({
  semaineDebut: null,
  anneeDebut: new Date().getFullYear()
})

const newPreparation = ref({
  date_start: null,
  date_end: null
})

const newRealisation = ref({
  date_start: null,
  date_end: null
})

// Options pour les semaines (1-53)
const semaineOptions = computed(() => {
  return Array.from({ length: 53 }, (_, i) => ({
    id: i + 1,
    label: `S${i + 1}`
  }))
})

// Options pour les années
const anneeOptions = computed(() => {
  const currentYear = new Date().getFullYear()
  return Array.from({ length: 5 }, (_, i) => ({
    id: currentYear - 2 + i,
    label: String(currentYear - 2 + i)
  }))
})

// Barre de recherche
const searchQuery = ref('')
const drawerOpen = ref(false)
const toggleDrawer = () => {
  drawerOpen.value = !drawerOpen.value
  if (!drawerOpen.value) {
    // Reset mode édition quand on ferme
    isEditMode.value = false
    editingChantierId.value = null
    activeEditTab.value = 'generalites'
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
    activeEditTab.value = 'generalites'

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
    originalDateRea.value = JSON.stringify(chantier.date_rea || [])
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

    // Recharger les données
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

// Fonction mise à jour pour filtrer les chantiers avec date_rea
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

      // Vérifier si date_rea existe et contient au moins une période
      if (!chantier.date_rea || !Array.isArray(chantier.date_rea) || chantier.date_rea.length === 0) {
        return false
      }

      // Vérifier si au moins une période chevauche l'année sélectionnée
      return chantier.date_rea.some((periode) => {
        if (!periode.date_start_travaux) return false

        const startDate = new Date(periode.date_start_travaux)
        const endDate = periode.date_end_travaux ? new Date(periode.date_end_travaux) : null

        const startYear = startDate.getFullYear()
        const endYear = endDate ? endDate.getFullYear() : startYear

        // La période est visible si elle chevauche l'année sélectionnée
        return startYear <= selectedYear.value && endYear >= selectedYear.value
      })
    })
    .sort((a, b) => {
      // Trier par la date de début de la première période
      const dateA = a.date_rea?.[0]?.date_start_travaux ? new Date(a.date_rea[0].date_start_travaux) : new Date()
      const dateB = b.date_rea?.[0]?.date_start_travaux ? new Date(b.date_rea[0].date_start_travaux) : new Date()
      return dateA - dateB
    })
})

// Navigation par année
const previousYear = () => {
  selectedYear.value--
}

const nextYear = () => {
  selectedYear.value++
}
// Ajouter un week-end
// Calcule la semaine suivante (gère le passage d'année)
const getNextWeek = (semaine, annee) => {
  if (semaine >= 52) {
    // Vérifier si l'année a 53 semaines
    const dec31 = new Date(annee, 11, 31)
    const jan4 = new Date(annee, 0, 4)
    const jan4Day = jan4.getDay() || 7
    const mondayWeek1 = new Date(jan4)
    mondayWeek1.setDate(jan4.getDate() - (jan4Day - 1))
    const weeksInYear = Math.ceil((dec31 - mondayWeek1) / (7 * 24 * 60 * 60 * 1000))

    if (semaine >= weeksInYear) {
      return { semaine: 1, annee: annee + 1 }
    }
  }
  return { semaine: semaine + 1, annee: annee }
}

const handleAddWeekend = async () => {
  if (!newWeekend.value.semaineDebut) return

  // Calculer automatiquement la semaine de fin (semaine suivante)
  const { semaine: semaineFin, annee: anneeFin } = getNextWeek(
    newWeekend.value.semaineDebut,
    newWeekend.value.anneeDebut
  )

  newChantier.value.weekends.push({
    debutSemaine: newWeekend.value.semaineDebut,
    debutAnnee: newWeekend.value.anneeDebut,
    finSemaine: semaineFin,
    finAnnee: anneeFin
  })
  isWeekendAdd.value = false
  newWeekend.value = {
    semaineDebut: null,
    anneeDebut: new Date().getFullYear()
  }
}
// Supprimer un week-end
const handleDeleteWeekend = async (index) => {
  newChantier.value.weekends.splice(index, 1)
}
// Ajouter une réalisation
const handleAddRealisation = async () => {
  if (!newRealisation.value.date_start || !newRealisation.value.date_end) return
  isRealisationAdd.value = false
  newChantier.value.realisation.push({
    date_start: newRealisation.value.date_start,
    date_end: newRealisation.value.date_end
  })
}
// Supprimer une réalisation
const handleDeleteRealisation = async (index) => {
  newChantier.value.realisation.splice(index, 1)
}
// Ajouter une préparation
const handleAddPreparation = async () => {
  if (!newPreparation.value.date_start || !newPreparation.value.date_end) return
  isPreparationAdd.value = false
  newChantier.value.preparation.push({
    date_start: newPreparation.value.date_start,
    date_end: newPreparation.value.date_end
  })
}
// Supprimer une préparation
const handleDeletePreparation = async (index) => {
  newChantier.value.preparation.splice(index, 1)
}

// Options utilisateurs pour les selects (travaux)

const userOptions = (users) => {
  if (users?.length > 0) {
    return users.map((u) => ({
      id: u.id,
      label: u.prenom && u.nom ? `${u.prenom} ${u.nom}` : u.email
    }))
  }
  return []
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

// Fonction pour obtenir les initiales et le nom complet (utilisé dans le récapitulatif du drawer)
const getUserInfoById = (userId) => {
  if (!userId || !users.value) return null

  const user = users.value.find((u) => u.id === userId)
  if (!user) return null

  return {
    nom: user.nom || '',
    prenom: user.prenom || '',
    fullName: user.prenom && user.nom ? `${user.prenom} ${user.nom}` : user.email || '-'
  }
}
</script>

<template>
  <div class="flex h-full w-full flex-col gap-4 overflow-hidden p-4 lg:px-4 lg:py-0 lg:pt-4">
    <!-- Header avec titre et navigation -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <AppTitleMain title="Plan de charge générale" description="Calendrier des chantiers pour l'année en cours" />
    </div>

    <div class="flex flex-col items-center justify-between gap-4 lg:flex-row">
      <div class="flex-1">
        <AppInputSearch v-model="searchQuery" class="h-fit w-full max-w-sm" placeholder="Rechercher un chantier ..." />
      </div>
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
      </div>
      <div class="flex flex-1 justify-end">
        <AppButtonValidated theme="primary" type="button" @click="openCreateDrawer" class="h-fit w-44">
          <template #default>
            <span class="flex items-center gap-2 text-sm">
              <Icon name="lucide:diamond-plus" size="18" />
              Nouveau chantier
            </span>
          </template>
        </AppButtonValidated>
      </div>
    </div>

    <!-- Tableau calendrier -->
    <div
      class="h-fit overflow-auto rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <table class="w-full min-w-[1400px]">
        <!-- Header avec les semaines -->
        <thead class="sticky top-0 z-30">
          <tr class="bg-gray-50 dark:bg-gray-900/50">
            <!-- Colonne chantier -->
            <th
              rowspan="2"
              class="sticky left-0 z-40 mx-auto min-w-[240px] border-r border-b border-gray-200 bg-gray-50 px-3 py-2 text-left text-[10px] font-semibold tracking-wider text-gray-600 uppercase dark:border-gray-700 dark:bg-gray-900/50 dark:text-gray-400">
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
              rowspan="2"
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
            <th
              colspan="3"
              class="min-w-[24px] border-r border-l border-gray-200 px-0 text-center text-xs font-medium text-gray-500 transition-colors dark:border-gray-700 dark:text-gray-400">
              RLT VOIE
            </th>
            <th
              colspan="3"
              class="min-w-[24px] border-r border-l border-gray-200 px-0 text-center text-xs font-medium text-gray-500 transition-colors dark:border-gray-700 dark:text-gray-400">
              RLT SES
            </th>
            <th
              colspan="3"
              class="min-w-[24px] border-r border-l border-gray-200 px-0 text-center text-xs font-medium text-gray-500 transition-colors dark:border-gray-700 dark:text-gray-400">
              RLT CAT
            </th>
            <th
              colspan="3"
              class="min-w-[24px] border-r border-l border-gray-200 px-0 text-center text-xs font-medium text-gray-500 uppercase transition-colors dark:border-gray-700 dark:text-gray-400">
              Pré-op
            </th>
          </tr>
          <tr class="bg-gray-50 dark:bg-gray-900/50">
            <th
              class="min-w-[56px] border-r border-l border-gray-200 text-center text-xs font-medium text-gray-500 transition-colors dark:border-gray-700 dark:text-gray-400">
              1er
            </th>
            <th
              class="min-w-[56px] border-r border-l border-gray-200 text-center text-xs font-medium text-gray-500 transition-colors dark:border-gray-700 dark:text-gray-400">
              2nd
            </th>
            <th
              class="min-w-[56px] border-r border-l border-gray-200 text-center text-xs font-medium text-gray-500 transition-colors dark:border-gray-700 dark:text-gray-400">
              Kv
            </th>
            <th
              class="min-w-[56px] border-r border-l border-gray-200 text-center text-xs font-medium text-gray-500 transition-colors dark:border-gray-700 dark:text-gray-400">
              1er
            </th>
            <th
              class="min-w-[56px] border-r border-l border-gray-200 text-center text-xs font-medium text-gray-500 transition-colors dark:border-gray-700 dark:text-gray-400">
              2nd
            </th>
            <th
              class="min-w-[56px] border-r border-l border-gray-200 text-center text-xs font-medium text-gray-500 transition-colors dark:border-gray-700 dark:text-gray-400">
              Kv
            </th>
            <th
              class="min-w-[56px] border-r border-l border-gray-200 text-center text-xs font-medium text-gray-500 transition-colors dark:border-gray-700 dark:text-gray-400">
              1er
            </th>
            <th
              class="min-w-[56px] border-r border-l border-gray-200 text-center text-xs font-medium text-gray-500 transition-colors dark:border-gray-700 dark:text-gray-400">
              2nd
            </th>
            <th
              class="min-w-[56px] border-r border-l border-gray-200 text-center text-xs font-medium text-gray-500 transition-colors dark:border-gray-700 dark:text-gray-400">
              Kv
            </th>
            <th
              class="min-w-[56px] border-r border-l border-gray-200 text-center text-xs font-medium text-gray-500 transition-colors dark:border-gray-700 dark:text-gray-400">
              Voie
            </th>
            <th
              class="min-w-[56px] border-r border-l border-gray-200 text-center text-xs font-medium text-gray-500 transition-colors dark:border-gray-700 dark:text-gray-400">
              Ses
            </th>
            <th
              class="min-w-[56px] border-r border-l border-gray-200 text-center text-xs font-medium text-gray-500 transition-colors dark:border-gray-700 dark:text-gray-400">
              Log
            </th>
          </tr>
        </thead>

        <!-- Corps du tableau -->
        <tbody class="divide-y divide-gray-100 dark:divide-gray-700/50">
          <ChantierTimelineRow
            v-for="chantier in filteredChantiers"
            :key="chantier.id"
            :chantier="chantier"
            :weeks="weeks"
            :selected-year="selectedYear"
            :hovered-week="hoveredWeek"
            :show-contacts="true"
            :clickable="true"
            @week-click="openEditDrawer"
            @week-hover="hoveredWeek = $event"
            @week-leave="hoveredWeek = null" />

          <!-- Message si aucun chantier -->
          <tr v-if="filteredChantiers.length === 0">
            <td colspan="54" class="px-6 py-12 text-center">
              <div class="flex flex-col items-center gap-3">
                <Icon name="lucide:calendar-x" size="32" class="text-gray-300 dark:text-gray-600" />
                <p class="text-gray-500 dark:text-gray-400">Aucun chantier pour l'année {{ selectedYear }}</p>
                <div class="mt-2 flex gap-2">
                  <button
                    @click="selectedYear = new Date().getFullYear()"
                    class="text-primary-600 hover:text-primary-700 dark:text-primary-400 cursor-pointer text-sm font-medium">
                    Revenir à {{ new Date().getFullYear() }}
                  </button>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <AppDrawer :drawer-open="drawerOpen" :close-drawer="toggleDrawer" height-class="h-[90vh] md:h-[70vh] ">
      <template #default>
        <AppDrawerContent
          v-if="drawerOpen"
          :drawer-open="drawerOpen"
          :close-drawer="toggleDrawer"
          height-class="h-[90vh] md:h-[70vh]">
          <!-- MODE ÉDITION -->
          <div v-if="isEditMode" class="flex h-full flex-col">
            <!-- Header avec titre et badge -->
            <div class="mb-4 flex items-center justify-between">
              <div>
                <h2 class="text-xl font-bold text-gray-800 dark:text-white">
                  {{ newChantier.name || 'Chantier' }}
                </h2>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ newChantier.compte }} · Modifier les informations du chantier
                </p>
              </div>
              <span
                :class="
                  newChantier.entite === 'uo_travaux'
                    ? 'bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                "
                class="rounded-full px-3 py-1 text-xs font-medium">
                {{ newChantier.entite === 'uo_travaux' ? 'UO Travaux' : 'Externe' }}
              </span>
            </div>

            <!-- Onglets -->
            <div class="mb-4 flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
              <button
                v-for="tab in [
                  { id: 'generalites', label: 'Généralités', icon: 'lucide:building-2' },
                  { id: 'periodes', label: 'Périodes', icon: 'lucide:calendar-days' },
                  { id: 'contacts', label: 'Contacts', icon: 'lucide:users' }
                ]"
                :key="tab.id"
                type="button"
                @click="activeEditTab = tab.id"
                class="flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all"
                :class="
                  activeEditTab === tab.id
                    ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                ">
                <Icon :name="tab.icon" size="16" />
                {{ tab.label }}
              </button>
            </div>

            <!-- Contenu des onglets -->
            <div class="flex-1 overflow-y-auto">
              <!-- Onglet Généralités -->
              <div v-if="activeEditTab === 'generalites'" class="space-y-6 px-1">
                <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <!-- Identification -->
                  <div class="space-y-4">
                    <div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700">
                      <Icon name="lucide:building-2" size="16" class="text-primary-500" />
                      <h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300">
                        Identification
                      </h3>
                    </div>
                    <AppInput
                      v-model="newChantier.compte"
                      name="compte"
                      title="Compte"
                      placeholder="Numéro de compte" />
                    <AppInput
                      v-model="newChantier.name"
                      name="name"
                      title="Intitulé du chantier"
                      placeholder="Nom du chantier" />
                  </div>

                  <!-- Entité -->
                  <div class="space-y-4">
                    <div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700">
                      <Icon name="lucide:tag" size="16" class="text-primary-500" />
                      <h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300">
                        Entité
                      </h3>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        @click="newChantier.entite = 'uo_travaux'"
                        class="relative rounded-xl border-2 p-3 transition-all duration-200"
                        :class="
                          newChantier.entite === 'uo_travaux'
                            ? 'border-primary-500 dark:bg-primary-900/20 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                        ">
                        <div class="flex items-center gap-2">
                          <Icon name="lucide:home" size="20" class="text-primary-500" />
                          <span class="text-sm font-medium">UO Travaux</span>
                        </div>
                      </button>
                      <button
                        type="button"
                        @click="newChantier.entite = 'autre'"
                        class="relative rounded-xl border-2 p-3 transition-all duration-200"
                        :class="
                          newChantier.entite === 'autre'
                            ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                            : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                        ">
                        <div class="flex items-center gap-2">
                          <Icon name="lucide:external-link" size="20" class="text-red-500" />
                          <span class="text-sm font-medium">Externe</span>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Autre / Notes -->
                <div class="space-y-4">
                  <div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700">
                    <Icon name="lucide:file-text" size="16" class="text-primary-500" />
                    <h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300">
                      Notes
                    </h3>
                  </div>
                  <textarea
                    v-model="newChantier.autre"
                    rows="3"
                    class="focus:border-primary-500 focus:ring-primary-500 w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                    placeholder="Informations complémentaires..."></textarea>
                </div>
              </div>

              <!-- Onglet Périodes -->
              <div v-else-if="activeEditTab === 'periodes'" class="space-y-6 px-1">
                <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
                  <!-- Préparation -->
                  <div class="space-y-3">
                    <div class="flex items-center justify-between border-b border-gray-200 pb-2 dark:border-gray-700">
                      <div class="flex items-center gap-2">
                        <Icon name="lucide:calendar-clock" size="16" class="text-amber-500" />
                        <h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300">
                          Préparation
                        </h3>
                      </div>
                      <button
                        type="button"
                        @click="showAddDate('preparation')"
                        class="bg-primary-100 hover:bg-primary-200 text-primary-600 rounded-lg p-1.5 transition-colors">
                        <Icon name="lucide:plus" size="16" />
                      </button>
                    </div>
                    <div v-if="newChantier.preparation.length > 0" class="space-y-2">
                      <div
                        v-for="(prep, idx) in newChantier.preparation"
                        :key="idx"
                        class="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2 dark:bg-amber-900/20">
                        <span class="text-sm text-gray-700 dark:text-gray-300">
                          {{ formatTimestampToDisplay(prep.date_start) }} →
                          {{ formatTimestampToDisplay(prep.date_end) }}
                        </span>
                        <button type="button" @click="handleDeletePreparation(idx)" class="text-red-500">
                          <Icon name="lucide:trash-2" size="14" />
                        </button>
                      </div>
                    </div>
                    <p v-else class="text-sm text-gray-400 italic">Aucune préparation</p>
                  </div>

                  <!-- Réalisation -->
                  <div class="space-y-3">
                    <div class="flex items-center justify-between border-b border-gray-200 pb-2 dark:border-gray-700">
                      <div class="flex items-center gap-2">
                        <Icon name="lucide:calendar-check" size="16" class="text-emerald-500" />
                        <h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300">
                          Réalisation
                        </h3>
                      </div>
                      <button
                        type="button"
                        @click="showAddDate('realisation')"
                        class="bg-primary-100 hover:bg-primary-200 text-primary-600 rounded-lg p-1.5 transition-colors">
                        <Icon name="lucide:plus" size="16" />
                      </button>
                    </div>
                    <div v-if="newChantier.realisation.length > 0" class="space-y-2">
                      <div
                        v-for="(rea, idx) in newChantier.realisation"
                        :key="idx"
                        class="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 dark:bg-emerald-900/20">
                        <span class="text-sm text-gray-700 dark:text-gray-300">
                          {{ formatTimestampToDisplay(rea.date_start) }} → {{ formatTimestampToDisplay(rea.date_end) }}
                        </span>
                        <button type="button" @click="handleDeleteRealisation(idx)" class="text-red-500">
                          <Icon name="lucide:trash-2" size="14" />
                        </button>
                      </div>
                    </div>
                    <p v-else class="text-sm text-gray-400 italic">Aucune réalisation</p>
                  </div>

                  <!-- Week-ends -->
                  <div class="space-y-3">
                    <div class="flex items-center justify-between border-b border-gray-200 pb-2 dark:border-gray-700">
                      <div class="flex items-center gap-2">
                        <Icon name="lucide:calendar-days" size="16" class="text-orange-500" />
                        <h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300">
                          Week-ends
                        </h3>
                      </div>
                      <button
                        type="button"
                        @click="showAddDate('weekend')"
                        class="bg-primary-100 hover:bg-primary-200 text-primary-600 rounded-lg p-1.5 transition-colors">
                        <Icon name="lucide:plus" size="16" />
                      </button>
                    </div>
                    <div v-if="newChantier.weekends.length > 0" class="space-y-2">
                      <div
                        v-for="(weekend, idx) in newChantier.weekends"
                        :key="idx"
                        class="flex items-center justify-between rounded-lg bg-orange-50 px-3 py-2 dark:bg-orange-900/20">
                        <div class="flex items-center gap-2">
                          <div class="h-4 w-1 rounded-full bg-orange-500"></div>
                          <span class="text-sm text-gray-700 dark:text-gray-300">
                            S{{ weekend.debutSemaine }}/{{ weekend.debutAnnee }} → S{{ weekend.finSemaine }}/{{
                              weekend.finAnnee
                            }}
                          </span>
                        </div>
                        <button type="button" @click="handleDeleteWeekend(idx)" class="text-red-500">
                          <Icon name="lucide:trash-2" size="14" />
                        </button>
                      </div>
                    </div>
                    <p v-else class="text-sm text-gray-400 italic">Aucun week-end</p>
                  </div>
                </div>

                <!-- Formulaires d'ajout -->
                <div class="pt-4">
                  <!-- Ajout préparation -->
                  <div
                    v-if="isPreparationAdd"
                    class="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-900/20">
                    <p class="mb-3 text-xs font-semibold tracking-wider text-amber-600 uppercase">
                      Ajouter une préparation
                    </p>
                    <div class="mb-3 grid grid-cols-2 gap-4">
                      <AppDatePicker v-model="newPreparation.date_start" title="Début" placeholder="Sélectionner..." />
                      <AppDatePicker v-model="newPreparation.date_end" title="Fin" placeholder="Sélectionner..." />
                    </div>
                    <AppButtonValidated
                      type="button"
                      theme="secondary"
                      :validated="!!newPreparation.date_start && !!newPreparation.date_end"
                      @click="handleAddPreparation">
                      <template #default>
                        <span class="flex items-center gap-2">
                          <Icon name="lucide:plus" size="16" />
                          Ajouter
                        </span>
                      </template>
                    </AppButtonValidated>
                  </div>

                  <!-- Ajout réalisation -->
                  <div
                    v-if="isRealisationAdd"
                    class="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-700 dark:bg-emerald-900/20">
                    <p class="mb-3 text-xs font-semibold tracking-wider text-emerald-600 uppercase">
                      Ajouter une réalisation
                    </p>
                    <div class="mb-3 grid grid-cols-2 gap-4">
                      <AppDatePicker v-model="newRealisation.date_start" title="Début" placeholder="Sélectionner..." />
                      <AppDatePicker v-model="newRealisation.date_end" title="Fin" placeholder="Sélectionner..." />
                    </div>
                    <AppButtonValidated
                      type="button"
                      theme="secondary"
                      :validated="!!newRealisation.date_start && !!newRealisation.date_end"
                      @click="handleAddRealisation">
                      <template #default>
                        <span class="flex items-center gap-2">
                          <Icon name="lucide:plus" size="16" />
                          Ajouter
                        </span>
                      </template>
                    </AppButtonValidated>
                  </div>

                  <!-- Ajout weekend -->
                  <div
                    v-if="isWeekendAdd"
                    class="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-700 dark:bg-orange-900/20">
                    <p class="mb-3 text-xs font-semibold tracking-wider text-orange-600 uppercase">
                      Ajouter un week-end
                    </p>
                    <div class="mb-3 grid grid-cols-2 gap-3">
                      <AppSelect
                        v-model="newWeekend.semaineDebut"
                        :options="semaineOptions"
                        title="Semaine"
                        placeholder="S..."
                        nullable />
                      <AppSelect
                        v-model="newWeekend.anneeDebut"
                        :options="anneeOptions"
                        title="Année"
                        placeholder="Année" />
                    </div>
                    <div
                      v-if="newWeekend.semaineDebut"
                      class="mb-3 flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm dark:bg-gray-800">
                      <Icon name="lucide:calendar-range" size="14" class="text-orange-500" />
                      <span>S{{ newWeekend.semaineDebut }}/{{ newWeekend.anneeDebut }}</span>
                      <Icon name="lucide:arrow-right" size="12" class="text-gray-400" />
                      <span>
                        S{{ getNextWeek(newWeekend.semaineDebut, newWeekend.anneeDebut).semaine }}/{{
                          getNextWeek(newWeekend.semaineDebut, newWeekend.anneeDebut).annee
                        }}
                      </span>
                    </div>
                    <AppButtonValidated
                      type="button"
                      theme="secondary"
                      :validated="!!newWeekend.semaineDebut"
                      @click="handleAddWeekend">
                      <template #default>
                        <span class="flex items-center gap-2">
                          <Icon name="lucide:plus" size="16" />
                          Ajouter
                        </span>
                      </template>
                    </AppButtonValidated>
                  </div>
                </div>
              </div>

              <!-- Onglet Contacts -->
              <div v-else-if="activeEditTab === 'contacts'" class="px-1">
                <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <!-- RLT Voie -->
                  <div class="space-y-3">
                    <div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700">
                      <Icon name="lucide:train-track" size="16" class="text-purple-500" />
                      <h3 class="text-sm font-semibold text-gray-700 uppercase dark:text-gray-300">RLT Voie</h3>
                    </div>
                    <AppSelect
                      v-model="newChantier.rlt_voie_principale"
                      :options="userOptions(getUsersRltVoie)"
                      title="Principal"
                      placeholder="Sélectionner..."
                      nullable />
                    <AppSelectMultiple
                      v-model="newChantier.rlt_voie_secondaire"
                      :options="userOptions(getUsersRltVoie)"
                      title="Secondaire(s)"
                      placeholder="Sélectionner..." />
                    <AppSelectMultiple
                      v-model="newChantier.kv_voie"
                      :options="userOptions(getUsersKvVoie)"
                      title="Contrôleur(s)"
                      placeholder="Sélectionner..." />
                  </div>

                  <!-- RLT SES -->
                  <div class="space-y-3">
                    <div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700">
                      <Icon name="lucide:zap" size="16" class="text-yellow-500" />
                      <h3 class="text-sm font-semibold text-gray-700 uppercase dark:text-gray-300">RLT SES</h3>
                    </div>
                    <AppSelect
                      v-model="newChantier.rlt_ses_principale"
                      :options="userOptions(getUsersRltSes)"
                      title="Principal"
                      placeholder="Sélectionner..."
                      nullable />
                    <AppSelectMultiple
                      v-model="newChantier.rlt_ses_secondaire"
                      :options="userOptions(getUsersRltSes)"
                      title="Secondaire(s)"
                      placeholder="Sélectionner..." />
                    <AppSelectMultiple
                      v-model="newChantier.kv_ses"
                      :options="userOptions(getUsersKvSes)"
                      title="Contrôleur(s)"
                      placeholder="Sélectionner..." />
                  </div>

                  <!-- RLT CAT -->
                  <div class="space-y-3">
                    <div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700">
                      <Icon name="lucide:cable" size="16" class="text-rose-500" />
                      <h3 class="text-sm font-semibold text-gray-700 uppercase dark:text-gray-300">RLT CAT</h3>
                    </div>
                    <AppSelect
                      v-model="newChantier.rlt_cat_principale"
                      :options="userOptions(getUsersRltCat)"
                      title="Principal"
                      placeholder="Sélectionner..."
                      nullable />
                    <AppSelectMultiple
                      v-model="newChantier.rlt_cat_secondaire"
                      :options="userOptions(getUsersRltCat)"
                      title="Secondaire(s)"
                      placeholder="Sélectionner..." />
                    <AppSelectMultiple
                      v-model="newChantier.kv_cat"
                      :options="userOptions(getUsersKvCat)"
                      title="Contrôleur(s)"
                      placeholder="Sélectionner..." />
                  </div>

                  <!-- Pré-op -->
                  <div class="space-y-3">
                    <div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700">
                      <Icon name="lucide:clipboard-check" size="16" class="text-indigo-500" />
                      <h3 class="text-sm font-semibold text-gray-700 uppercase dark:text-gray-300">Pré-op</h3>
                    </div>
                    <AppSelect
                      v-model="newChantier.preop_voie"
                      :options="userOptions(getUsersPreopVoie)"
                      title="Voie"
                      placeholder="Sélectionner..."
                      nullable />
                    <AppSelect
                      v-model="newChantier.preop_ses"
                      :options="userOptions(getUsersPreopSes)"
                      title="SES"
                      placeholder="Sélectionner..."
                      nullable />
                  </div>

                  <!-- Logistique -->
                  <div class="space-y-3">
                    <div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700">
                      <Icon name="lucide:truck" size="16" class="text-teal-500" />
                      <h3 class="text-sm font-semibold text-gray-700 uppercase dark:text-gray-300">Logistique</h3>
                    </div>
                    <AppSelect
                      v-model="newChantier.logistique"
                      :options="userOptions(getUsersLogistique)"
                      title="Responsable"
                      placeholder="Sélectionner..."
                      nullable />
                  </div>

                  <!-- Superviseurs -->
                  <div class="space-y-3">
                    <div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700">
                      <Icon name="lucide:eye" size="16" class="text-purple-500" />
                      <h3 class="text-sm font-semibold text-gray-700 uppercase dark:text-gray-300">Superviseurs</h3>
                    </div>
                    <AppSelectMultiple
                      v-model="newChantier.supervisor"
                      :options="userOptions(getUsersRefRdu)"
                      title="Superviseur(s)"
                      placeholder="Sélectionner..." />
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer avec boutons -->
            <div class="mt-4 flex items-center justify-between border-t border-gray-200 pt-4 dark:border-gray-700">
              <button
                type="button"
                @click="toggleDrawer"
                class="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800">
                Annuler
              </button>
              <AppButtonValidated
                theme="primary"
                type="button"
                :validated="newChantier.name && newChantier.compte"
                :disabled="isSubmitting"
                @click="handleSaveEdit">
                <template #default>
                  <span class="flex items-center gap-2">
                    <Icon v-if="isSubmitting" name="lucide:loader-2" size="16" class="animate-spin" />
                    <Icon v-else name="lucide:save" size="16" />
                    Enregistrer
                  </span>
                </template>
              </AppButtonValidated>
            </div>
          </div>

          <!-- MODE CRÉATION -->
          <div v-else class="flex h-full flex-col space-y-4">
            <AppTitleMain title="Ajouter un chantier" description="Ajoutez un nouveau chantier au plan de charge" />

            <div class="flex h-full flex-1 lg:px-8">
              <AppStepBar
                ref="stepBarRef"
                :steps="steps"
                :show-buttons="true"
                :validate-step="validateCurrentStep"
                @complete="handleComplete"
                @step-change="handleStepChange">
                <!-- Étape 1: Généralités -->
                <template #step-0>
                  <div class="grid w-full grid-cols-1 gap-4 lg:grid-cols-3">
                    <div class="space-y-4">
                      <div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700">
                        <Icon name="lucide:tag" size="16" class="text-primary-500" />
                        <h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300">
                          Entité
                        </h3>
                      </div>

                      <!-- Boutons radio stylisés pour le type -->
                      <div class="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          @click="newChantier.entite = 'uo_travaux'"
                          class="relative rounded-xl border-2 p-2 transition-all duration-200"
                          :class="
                            newChantier.entite === 'uo_travaux'
                              ? 'border-primary-500 dark:bg-primary-900/20 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                          ">
                          <div class="f flex items-center gap-2">
                            <div
                              class="flex h-8 w-8 items-center justify-center rounded-full"
                              :class="
                                newChantier.entite === 'uo_travaux'
                                  ? 'bg-primary-500 text-white'
                                  : 'bg-gray-200 text-gray-500 dark:bg-gray-700'
                              ">
                              <Icon name="lucide:home" size="20" />
                            </div>
                            <span
                              class="text-sm font-medium"
                              :class="
                                newChantier.entite === 'uo_travaux'
                                  ? 'text-primary-700 dark:text-primary-400'
                                  : 'text-gray-600 dark:text-gray-400'
                              ">
                              UO Travaux
                            </span>
                          </div>
                          <div
                            v-if="newChantier.entite === 'uo_travaux'"
                            class="bg-primary-500 absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full">
                            <Icon name="lucide:check" size="12" class="text-white" />
                          </div>
                        </button>

                        <button
                          type="button"
                          @click="newChantier.entite = 'autre'"
                          class="relative rounded-xl border-2 p-2 transition-all duration-200"
                          :class="
                            newChantier.entite === 'autre'
                              ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                              : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                          ">
                          <div class="flex items-center gap-2">
                            <div
                              class="flex h-8 w-8 items-center justify-center rounded-full"
                              :class="
                                newChantier.entite === 'autre'
                                  ? 'bg-red-500 text-white'
                                  : 'bg-gray-200 text-gray-500 dark:bg-gray-700'
                              ">
                              <Icon name="lucide:external-link" size="20" />
                            </div>
                            <span
                              class="text-sm font-medium"
                              :class="
                                newChantier.entite === 'autre'
                                  ? 'text-red-700 dark:text-red-400'
                                  : 'text-gray-600 dark:text-gray-400'
                              ">
                              Autre
                            </span>
                          </div>
                          <div
                            v-if="newChantier.entite === 'autre'"
                            class="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500">
                            <Icon name="lucide:check" size="12" class="text-white" />
                          </div>
                        </button>
                      </div>
                      <div
                        v-if="newChantier.entite === 'autre'"
                        class="flex items-center gap-2 text-sm text-red-500 italic">
                        <Icon name="lucide:triangle-alert" size="16" class="text-red-600" />
                        Attention, aucune tache H00 ne sera ajoutée pour ce chantier.
                      </div>
                    </div>

                    <div class="space-y-4">
                      <div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700">
                        <Icon name="lucide:building-2" size="16" class="text-primary-500" />
                        <h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300">
                          Identification
                        </h3>
                      </div>

                      <AppInput
                        v-model="newChantier.compte"
                        name="compte"
                        title="Compte"
                        required
                        placeholder="Numéro de compte" />

                      <AppInput
                        v-model="newChantier.name"
                        name="name"
                        title="Intitulé du chantier"
                        required
                        placeholder="Nom du chantier" />
                    </div>

                    <!-- Autre -->
                    <div class="w-full space-y-4">
                      <div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700">
                        <Icon name="lucide:file-text" size="16" class="text-primary-500" />
                        <h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300">
                          Autre
                        </h3>
                      </div>

                      <div class="w-full">
                        <label for="autre" class="mb-0.5 block text-sm">Informations complémentaires</label>
                        <textarea
                          v-model="newChantier.autre"
                          id="autre"
                          name="autre"
                          rows="4"
                          class="focus:border-primary-500 focus:ring-primary-500 w-full resize-none appearance-none rounded-md border border-gray-300 px-3 py-2 text-sm leading-tight text-gray-700 focus:ring-1 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                          placeholder="Notes, remarques, informations diverses..."></textarea>
                      </div>
                    </div>
                  </div>
                </template>

                <!-- Étape 2: Périodes -->
                <template #step-1>
                  <!-- Week-ends -->

                  <div class="flex flex-col space-y-6 divide-gray-200 lg:flex-row">
                    <div class="w-full px-4">
                      <div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700">
                        <Icon name="lucide:calendar-days" size="16" class="text-primary-500" />
                        <h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300">
                          Préparation
                        </h3>
                        <div
                          class="bg-primary-200 hover:bg-primary-400 text-primary-500 ml-auto flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition-colors duration-300 hover:text-white"
                          @click="showAddDate('preparation')">
                          <Icon name="lucide:plus" size="16" class="" />
                        </div>
                      </div>
                      <div v-if="newChantier.preparation.length > 0" class="space-y-2 pt-2">
                        <div
                          v-for="(preparation, index) in newChantier.preparation"
                          :key="index"
                          class="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-700/50">
                          <div class="flex items-center gap-2">
                            <Icon name="lucide:calendar-range" size="14" class="text-gray-400" />
                            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {{ formatTimestampToDisplay(preparation.date_start) }}
                            </span>
                            <Icon name="lucide:arrow-right" size="14" class="text-gray-400" />
                            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {{ formatTimestampToDisplay(preparation.date_end) }}
                            </span>
                          </div>

                          <button
                            type="button"
                            @click="handleDeletePreparation(index)"
                            class="rounded p-1 text-red-500 transition-colors hover:bg-red-100 dark:hover:bg-red-900/30">
                            <Icon name="lucide:trash-2" size="16" />
                          </button>
                        </div>
                      </div>
                      <p v-else class="text-sm text-gray-400 italic">Aucune préparation programmée</p>
                    </div>
                    <div class="w-full px-4">
                      <div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700">
                        <Icon name="lucide:calendar-days" size="16" class="text-primary-500" />
                        <h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300">
                          Réalisation
                        </h3>
                        <div
                          class="bg-primary-200 hover:bg-primary-400 text-primary-500 ml-auto flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition-colors duration-300 hover:text-white"
                          @click="showAddDate('realisation')">
                          <Icon name="lucide:plus" size="16" class="" />
                        </div>
                      </div>
                      <div v-if="newChantier.realisation.length > 0" class="space-y-2 pt-2">
                        <div
                          v-for="(realisation, index) in newChantier.realisation"
                          :key="index"
                          class="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-700/50">
                          <div class="flex items-center gap-2">
                            <Icon name="lucide:calendar-range" size="14" class="text-gray-400" />
                            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {{ formatTimestampToDisplay(realisation.date_start) }}
                            </span>
                            <Icon name="lucide:arrow-right" size="14" class="text-gray-400" />
                            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {{ formatTimestampToDisplay(realisation.date_end) }}
                            </span>
                          </div>
                          <button
                            type="button"
                            @click="handleDeleteRealisation(index)"
                            class="rounded p-1 text-red-500 transition-colors hover:bg-red-100 dark:hover:bg-red-900/30">
                            <Icon name="lucide:trash-2" size="16" />
                          </button>
                        </div>
                      </div>
                      <p v-else class="text-sm text-gray-400 italic">Aucune réalisation programmée</p>
                    </div>
                    <div class="w-full px-4">
                      <div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700">
                        <Icon name="lucide:calendar-days" size="16" class="text-primary-500" />
                        <h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300">
                          Week-ends
                        </h3>
                        <div
                          class="bg-primary-200 hover:bg-primary-400 text-primary-500 ml-auto flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition-colors duration-300 hover:text-white"
                          @click="showAddDate('weekend')">
                          <Icon name="lucide:plus" size="16" class="" />
                        </div>
                      </div>
                      <div v-if="newChantier.weekends.length > 0" class="space-y-2 pt-2">
                        <div
                          v-for="(weekend, index) in newChantier.weekends"
                          :key="index"
                          class="flex items-center justify-between rounded-lg bg-orange-50 px-3 py-2 dark:bg-orange-900/20">
                          <div class="flex items-center gap-2">
                            <div class="h-4 w-1 rounded-full bg-orange-500"></div>
                            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                              S{{ weekend.debutSemaine }}/{{ weekend.debutAnnee }}
                            </span>
                            <Icon name="lucide:arrow-right" size="14" class="text-gray-400" />
                            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                              S{{ weekend.finSemaine }}/{{ weekend.finAnnee }}
                            </span>
                          </div>
                          <button
                            type="button"
                            @click="handleDeleteWeekend(index)"
                            class="rounded p-1 text-red-500 transition-colors hover:bg-red-100 dark:hover:bg-red-900/30">
                            <Icon name="lucide:trash-2" size="16" />
                          </button>
                        </div>
                      </div>
                      <p v-else class="text-sm text-gray-400 italic">Aucun week-end programmé</p>
                    </div>
                  </div>

                  <div class="pt-6">
                    <div
                      v-if="isWeekendAdd"
                      class="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-700 dark:bg-orange-900/20">
                      <p
                        class="mb-3 text-xs font-semibold tracking-wider text-orange-600 uppercase dark:text-orange-400">
                        Ajouter un week-end
                      </p>

                      <div class="mb-3 grid grid-cols-2 gap-3">
                        <div>
                          <label class="mb-1 block text-xs text-gray-500">Semaine de début</label>
                          <AppSelect
                            v-model="newWeekend.semaineDebut"
                            :options="semaineOptions"
                            placeholder="Choisir une semaine..."
                            nullable />
                        </div>
                        <div>
                          <label class="mb-1 block text-xs text-gray-500">Année</label>
                          <AppSelect v-model="newWeekend.anneeDebut" :options="anneeOptions" placeholder="Année" />
                        </div>
                      </div>

                      <!-- Aperçu de la période -->
                      <div
                        v-if="newWeekend.semaineDebut"
                        class="mb-3 flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm dark:bg-gray-800">
                        <Icon name="lucide:calendar-range" size="14" class="text-orange-500" />
                        <span class="text-gray-600 dark:text-gray-400">
                          S{{ newWeekend.semaineDebut }}/{{ newWeekend.anneeDebut }}
                        </span>
                        <Icon name="lucide:arrow-right" size="12" class="text-gray-400" />
                        <span class="text-gray-600 dark:text-gray-400">
                          S{{ getNextWeek(newWeekend.semaineDebut, newWeekend.anneeDebut).semaine }}/{{
                            getNextWeek(newWeekend.semaineDebut, newWeekend.anneeDebut).annee
                          }}
                        </span>
                      </div>

                      <AppButtonValidated
                        type="button"
                        theme="secondary"
                        :validated="!!newWeekend.semaineDebut"
                        @click="handleAddWeekend">
                        <template #default>
                          <span class="flex items-center gap-2">
                            <Icon name="lucide:plus" size="16" />
                            Ajouter
                          </span>
                        </template>
                      </AppButtonValidated>
                    </div>
                    <div
                      v-if="isRealisationAdd"
                      class="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                      <p class="mb-3 text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-400">
                        Période de réalisation
                      </p>

                      <div class="grid grid-cols-2 gap-4">
                        <AppDatePicker
                          v-model="newRealisation.date_start"
                          title="Date de début"
                          placeholder="Sélectionner..."
                          clearable />

                        <AppDatePicker
                          v-model="newRealisation.date_end"
                          title="Date de fin"
                          placeholder="Sélectionner..."
                          clearable />
                      </div>

                      <AppButtonValidated
                        type="button"
                        theme="secondary"
                        :validated="!!newRealisation.date_start && !!newRealisation.date_end"
                        @click="handleAddRealisation">
                        <template #default>
                          <span class="flex items-center gap-2">
                            <Icon name="lucide:plus" size="16" />
                            Ajouter
                          </span>
                        </template>
                      </AppButtonValidated>
                    </div>
                    <div
                      v-if="isPreparationAdd"
                      class="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                      <p class="mb-3 text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-400">
                        Période de préparation
                      </p>

                      <div class="grid grid-cols-2 gap-4">
                        <AppDatePicker
                          v-model="newPreparation.date_start"
                          title="Date de début"
                          placeholder="Sélectionner..."
                          clearable />

                        <AppDatePicker
                          v-model="newPreparation.date_end"
                          title="Date de fin"
                          placeholder="Sélectionner..."
                          clearable />
                      </div>
                      <AppButtonValidated
                        type="button"
                        theme="secondary"
                        :validated="!!newPreparation.date_start && !!newPreparation.date_end"
                        @click="handleAddPreparation">
                        <template #default>
                          <span class="flex items-center gap-2">
                            <Icon name="lucide:plus" size="16" />
                            Ajouter
                          </span>
                        </template>
                      </AppButtonValidated>
                    </div>
                  </div>
                </template>

                <!-- Étape 3: Contacts -->
                <template #step-2>
                  <div class="grid grid-cols-1 gap-4 space-y-4 md:grid-cols-2 lg:grid-cols-3">
                    <!-- RLT Voie -->
                    <div class="w-full space-y-4">
                      <div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700">
                        <Icon name="lucide:train-track" size="16" class="text-blue-500" />
                        <h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300">
                          RLT Voie
                        </h3>
                      </div>
                      <AppSelect
                        v-model="newChantier.rlt_voie_principale"
                        :options="userOptions(getUsersRltVoie)"
                        title="Principal"
                        placeholder="Sélectionner..."
                        nullable />

                      <AppSelectMultiple
                        v-model="newChantier.rlt_voie_secondaire"
                        :options="userOptions(getUsersRltVoie)"
                        title="Secondaire(s)"
                        placeholder="Sélectionner un profil Voie" />

                      <AppSelectMultiple
                        v-model="newChantier.kv_voie"
                        :options="userOptions(getUsersKvVoie)"
                        title="Contrôleur(s)"
                        placeholder="Sélectionner un profil Voie" />
                    </div>
                    <!-- RLT SES -->
                    <div class="w-full space-y-4">
                      <div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700">
                        <Icon name="lucide:zap" size="16" class="text-yellow-500" />
                        <h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300">
                          RLT SES
                        </h3>
                      </div>
                      <AppSelect
                        v-model="newChantier.rlt_ses_principale"
                        :options="userOptions(getUsersRltSes)"
                        title="Principal"
                        placeholder="Sélectionner..."
                        nullable />

                      <AppSelectMultiple
                        v-model="newChantier.rlt_ses_secondaire"
                        :options="userOptions(getUsersRltSes)"
                        title="Secondaire(s)"
                        placeholder="Sélectionner un profil SES" />

                      <AppSelectMultiple
                        v-model="newChantier.kv_ses"
                        :options="userOptions(getUsersKvSes)"
                        title="Contrôleur(s)"
                        placeholder="Sélectionner un profil SES" />
                    </div>

                    <!-- RLT CAT -->
                    <div class="w-full space-y-4">
                      <div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700">
                        <Icon name="lucide:cable" size="16" class="text-rose-500" />
                        <h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300">
                          RLT CAT
                        </h3>
                      </div>
                      <AppSelect
                        v-model="newChantier.rlt_cat_principale"
                        :options="userOptions(getUsersRltCat)"
                        title="Principal"
                        placeholder="Sélectionner..."
                        nullable />

                      <AppSelectMultiple
                        v-model="newChantier.rlt_cat_secondaire"
                        :options="userOptions(getUsersRltCat)"
                        title="Secondaire(s)"
                        placeholder="Sélectionner un profil caténaire" />

                      <AppSelectMultiple
                        v-model="newChantier.kv_cat"
                        :options="userOptions(getUsersKvCat)"
                        title="Contrôleur(s)"
                        placeholder="Sélectionner un profil CAT" />
                    </div>

                    <!-- Pré-op -->
                    <div class="w-full space-y-4">
                      <div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700">
                        <Icon name="lucide:clipboard-check" size="16" class="text-indigo-500" />
                        <h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300">
                          Pré-op
                        </h3>
                      </div>

                      <AppSelect
                        v-model="newChantier.preop_voie"
                        :options="userOptions(getUsersPreopVoie)"
                        title="Voie"
                        placeholder="Sélectionner..."
                        nullable />
                      <AppSelect
                        v-model="newChantier.preop_ses"
                        :options="userOptions(getUsersPreopSes)"
                        title="SES"
                        placeholder="Sélectionner..."
                        nullable />
                    </div>

                    <!-- Logistique -->
                    <div class="w-full space-y-4">
                      <div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700">
                        <Icon name="lucide:truck" size="16" class="text-teal-500" />
                        <h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300">
                          Logistique
                        </h3>
                      </div>
                      <AppSelect
                        v-model="newChantier.logistique"
                        :options="userOptions(getUsersLogistique)"
                        title="Responsable logistique"
                        placeholder="Sélectionner..."
                        nullable />
                    </div>

                    <!-- Superviseurs -->
                    <div class="w-full space-y-4">
                      <div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700">
                        <Icon name="lucide:eye" size="16" class="text-purple-500" />
                        <h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300">
                          Superviseurs
                        </h3>
                      </div>
                      <div>
                        <AppSelectMultiple
                          v-model="newChantier.supervisor"
                          :options="userOptions(getUsersRefRdu)"
                          title="Secondaire(s)"
                          placeholder="Sélectionner un profil Superviseur" />
                      </div>
                    </div>
                  </div>
                </template>

                <!-- Étape 4: Récapitulatif -->
                <template #step-3>
                  <div class="space-y-6">
                    <!-- Généralités -->
                    <div>
                      <div class="mb-2 flex items-center gap-2">
                        <Icon name="lucide:building-2" size="16" class="text-primary-500" />
                        <p class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300">
                          Généralités
                        </p>
                      </div>
                      <div
                        class="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                        <span
                          class="rounded-md bg-gray-200 px-2 py-1 font-mono text-sm font-bold text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                          {{ newChantier.compte || '-' }}
                        </span>
                        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {{ newChantier.name || 'Sans intitulé' }}
                        </span>
                        <span
                          v-if="newChantier.entite === 'uo_travaux'"
                          class="ml-auto rounded-full bg-lime-100 px-2.5 py-0.5 text-xs font-medium text-lime-700 dark:bg-lime-900/30 dark:text-lime-400">
                          UO Travaux
                        </span>
                        <span
                          v-else
                          class="ml-auto rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
                          Externe
                        </span>
                      </div>
                    </div>

                    <!-- Périodes -->
                    <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
                      <!-- Préparations -->
                      <div class="w-full">
                        <div class="mb-2 flex items-center gap-2">
                          <Icon name="lucide:calendar-clock" size="16" class="text-amber-500" />
                          <p class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300">
                            Préparations
                          </p>
                          <span
                            class="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                            {{ newChantier.preparation.length }}
                          </span>
                        </div>
                        <div
                          v-if="newChantier.preparation.length > 0"
                          class="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
                          <div
                            v-for="(preparation, index) in newChantier.preparation"
                            :key="index"
                            class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Icon name="lucide:calendar-range" size="14" class="shrink-0 text-amber-500" />
                            <span>{{ formatTimestampToDisplay(preparation.date_start) }}</span>
                            <Icon name="lucide:arrow-right" size="12" class="text-gray-400" />
                            <span>{{ formatTimestampToDisplay(preparation.date_end) }}</span>
                          </div>
                        </div>
                        <div
                          v-else
                          class="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-center text-sm text-gray-400 italic dark:border-gray-600 dark:bg-gray-800">
                          Aucune préparation
                        </div>
                      </div>

                      <!-- Réalisations -->
                      <div class="w-full">
                        <div class="mb-2 flex items-center gap-2">
                          <Icon name="lucide:calendar-check" size="16" class="text-emerald-500" />
                          <p class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300">
                            Réalisations
                          </p>
                          <span
                            class="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                            {{ newChantier.realisation.length }}
                          </span>
                        </div>
                        <div
                          v-if="newChantier.realisation.length > 0"
                          class="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
                          <div
                            v-for="(realisation, index) in newChantier.realisation"
                            :key="index"
                            class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Icon name="lucide:calendar-range" size="14" class="shrink-0 text-emerald-500" />
                            <span>{{ formatTimestampToDisplay(realisation.date_start) }}</span>
                            <Icon name="lucide:arrow-right" size="12" class="text-gray-400" />
                            <span>{{ formatTimestampToDisplay(realisation.date_end) }}</span>
                          </div>
                        </div>
                        <div
                          v-else
                          class="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-center text-sm text-gray-400 italic dark:border-gray-600 dark:bg-gray-800">
                          Aucune réalisation
                        </div>
                      </div>

                      <!-- Week-ends -->
                      <div class="w-full">
                        <div class="mb-2 flex items-center gap-2">
                          <Icon name="lucide:calendar-days" size="16" class="text-orange-500" />
                          <p class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300">
                            Week-ends
                          </p>
                          <span
                            class="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                            {{ newChantier.weekends.length }}
                          </span>
                        </div>
                        <div
                          v-if="newChantier.weekends.length > 0"
                          class="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
                          <div
                            v-for="(weekend, index) in newChantier.weekends"
                            :key="index"
                            class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Icon name="lucide:calendar" size="14" class="shrink-0 text-orange-500" />
                            <span>S{{ weekend.debutSemaine }}/{{ weekend.debutAnnee }}</span>
                            <Icon name="lucide:arrow-right" size="12" class="text-gray-400" />
                            <span>S{{ weekend.finSemaine }}/{{ weekend.finAnnee }}</span>
                          </div>
                        </div>
                        <div
                          v-else
                          class="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-center text-sm text-gray-400 italic dark:border-gray-600 dark:bg-gray-800">
                          Aucun week-end
                        </div>
                      </div>
                    </div>

                    <!-- Contacts -->
                    <div>
                      <div class="mb-2 flex items-center gap-2">
                        <Icon name="lucide:users" size="16" class="text-primary-500" />
                        <p class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300">
                          Contacts travaux
                        </p>
                      </div>
                      <div
                        class="grid grid-cols-2 gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 lg:grid-cols-4 dark:border-gray-700 dark:bg-gray-800">
                        <!-- RLT Voie -->
                        <div class="space-y-1">
                          <p class="text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                            RLT Voie
                          </p>
                          <div v-if="newChantier.rlt_voie_principale" class="flex items-center gap-2">
                            <AppAvatar
                              :nom="getUserInfoById(newChantier.rlt_voie_principale)?.nom"
                              :prenom="getUserInfoById(newChantier.rlt_voie_principale)?.prenom"
                              size="xs"
                              color="bg-purple-200 text-purple-600" />
                            <span class="text-sm text-gray-700 dark:text-gray-300">
                              {{ getUserInfoById(newChantier.rlt_voie_principale)?.fullName || '-' }}
                            </span>
                          </div>
                          <span v-else class="text-sm text-gray-400">Non assigné</span>
                        </div>

                        <!-- RLT SES -->
                        <div class="space-y-1">
                          <p class="text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                            RLT SES
                          </p>
                          <div v-if="newChantier.rlt_ses_principale" class="flex items-center gap-2">
                            <AppAvatar
                              :nom="getUserInfoById(newChantier.rlt_ses_principale)?.nom"
                              :prenom="getUserInfoById(newChantier.rlt_ses_principale)?.prenom"
                              size="xs"
                              color="bg-primary-200 text-primary-600" />
                            <span class="text-sm text-gray-700 dark:text-gray-300">
                              {{ getUserInfoById(newChantier.rlt_ses_principale)?.fullName || '-' }}
                            </span>
                          </div>
                          <span v-else class="text-sm text-gray-400">Non assigné</span>
                        </div>

                        <!-- RLT CAT -->
                        <div class="space-y-1">
                          <p class="text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                            RLT CAT
                          </p>
                          <div v-if="newChantier.rlt_cat_principale" class="flex items-center gap-2">
                            <AppAvatar
                              :nom="getUserInfoById(newChantier.rlt_cat_principale)?.nom"
                              :prenom="getUserInfoById(newChantier.rlt_cat_principale)?.prenom"
                              size="xs"
                              color="bg-blue-200 text-blue-600" />
                            <span class="text-sm text-gray-700 dark:text-gray-300">
                              {{ getUserInfoById(newChantier.rlt_cat_principale)?.fullName || '-' }}
                            </span>
                          </div>
                          <span v-else class="text-sm text-gray-400">Non assigné</span>
                        </div>

                        <!-- Pré-op -->
                        <div class="space-y-1">
                          <p class="text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">
                            Pré-op
                          </p>
                          <div class="flex flex-col gap-1">
                            <div v-if="newChantier.preop_voie" class="flex items-center gap-2">
                              <AppAvatar
                                :nom="getUserInfoById(newChantier.preop_voie)?.nom"
                                :prenom="getUserInfoById(newChantier.preop_voie)?.prenom"
                                size="xs"
                                color="bg-emerald-200 text-emerald-600" />
                              <span class="text-xs text-gray-600 dark:text-gray-400">Voie</span>
                            </div>
                            <div v-if="newChantier.preop_ses" class="flex items-center gap-2">
                              <AppAvatar
                                :nom="getUserInfoById(newChantier.preop_ses)?.nom"
                                :prenom="getUserInfoById(newChantier.preop_ses)?.prenom"
                                size="xs"
                                color="bg-emerald-200 text-emerald-600" />
                              <span class="text-xs text-gray-600 dark:text-gray-400">SES</span>
                            </div>
                            <span
                              v-if="!newChantier.preop_voie && !newChantier.preop_ses"
                              class="text-sm text-gray-400">
                              Non assigné
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Message d'info pour UO Travaux -->
                    <div
                      v-if="newChantier.entite === 'uo_travaux'"
                      class="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-900/20">
                      <Icon name="lucide:info" size="20" class="mt-0.5 shrink-0 text-blue-500" />
                      <div>
                        <p class="text-sm font-medium text-blue-700 dark:text-blue-400">Tâches H00 automatiques</p>
                        <p class="mt-1 text-sm text-blue-600 dark:text-blue-300">
                          {{ taches.length }} tâches seront créées automatiquement avec des dates de prévision calculées
                          à partir de la première date de réalisation.
                        </p>
                      </div>
                    </div>

                    <!-- Avertissement pour externe -->
                    <div
                      v-else
                      class="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-900/20">
                      <Icon name="lucide:triangle-alert" size="20" class="mt-0.5 shrink-0 text-amber-500" />
                      <div>
                        <p class="text-sm font-medium text-amber-700 dark:text-amber-400">Chantier externe</p>
                        <p class="mt-1 text-sm text-amber-600 dark:text-amber-300">
                          Aucune tâche H00 ne sera créée pour ce chantier externe.
                        </p>
                      </div>
                    </div>
                  </div>
                </template>
              </AppStepBar>
            </div>
          </div>
        </AppDrawerContent>
      </template>
    </AppDrawer>
  </div>
</template>

<style scoped>
/* Scroll smooth */
.overflow-auto {
  scroll-behavior: smooth;
}
</style>
