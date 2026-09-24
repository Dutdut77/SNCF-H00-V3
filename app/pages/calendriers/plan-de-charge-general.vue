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
  getUsersRefRdu,
  getUsersCdp,
  getUsersMoetx
} = useUsers()
const {
  getAllContactsTravaux,
  getAllContactsGeneralites,
  allContactsTravaux,
  allContactsGeneralites,
  upsertContactsTravaux,
  getContactsTravaux,
  getContactsGeneralites,
  upsertContactsGeneralites
} = useContacts()
const { setLoader } = useLoader()
const { taches, getTaches } = useTaches()
const { createH00Entries, recalculateH00Previsions } = useH00()
const { addToast } = useToast()
const { addWeekend, getAllWeekends, getWeekendsByChantier, replaceWeekendsForChantier } = useTimeline()
const { userSite, canEditSite, canEditChantier } = useLevelUser()
const { allAttributions, getAttributions, attributionOptions, defaultAttributionCode } = useAttributions()

// Accès direct au state partagé des chantiers
const allChantiers = useState('allChantiers')

// ============================================
// FILTRE PAR SITE (attribution)
// ============================================
const selectedSite = ref('all') // 'all' ou un code d'attribution

// Site cible pour la création (site sélectionné, sinon le site de l'utilisateur)
const createTargetSite = computed(() => {
  if (selectedSite.value && selectedSite.value !== 'all') return selectedSite.value
  return userSite.value && userSite.value !== 'Pôle IT' ? userSite.value : defaultAttributionCode.value
})

// Options du filtre secteur : « Tous les secteurs » + chaque secteur (consultation ouverte à tous).
const siteFilterOptions = computed(() => [{ id: 'all', label: 'Tous les secteurs' }, ...attributionOptions.value])

// Attributions sélectionnables dans le drawer : limitées aux sites éditables par l'utilisateur.
const editableAttributionOptions = computed(() => attributionOptions.value.filter((o) => canEditSite(o.id)))

// Peut créer un chantier pour le site cible courant
const canCreate = computed(() => canEditSite(createTargetSite.value))

// La colonne « Attribution » n'a de sens qu'en vue multi-sites (« Tous ») ;
// dès qu'un site précis est affiché, on la masque (redondante).
const showAttributionColumn = computed(() => selectedSite.value === 'all')

// Grille : colonne État (toujours) + colonne Attribution (uniquement en vue « Tous »).
// Largeur de la colonne chantier dans --col-chantier, posée par classes sur la grille : étroite sur
// mobile (compte seul), 320 px au moins à partir de md
const gridTemplateColumns = computed(() => {
  const siteCols = showAttributionColumn.value ? 2 : 1
  return `var(--col-chantier) repeat(53, minmax(24px, 1fr)) repeat(13, minmax(56px, auto)) repeat(${siteCols}, minmax(90px, auto))`
})

// État réactif pour l'année sélectionnée
const selectedYear = ref(new Date().getFullYear())
// Légende du panneau, repliée par défaut sur mobile
const legendeOuverte = ref(false)
// Référence du conteneur grid pour le hover de colonne par DOM direct
const gridRef = ref(null)
let lastHighlightedEls = []

// Colonne survolée : classes importantes, elles passent devant le fond de la semaine en cours.
// Translucide : la même classe colore les cases blanches et la case d'en-tête.
const WEEK_HOVER = ['bg-magenta-500/10!', 'dark:bg-white/6!']

const highlightWeek = (weekNumber) => {
  // Retirer les anciennes mises en surbrillance
  for (const el of lastHighlightedEls) el.classList.remove(...WEEK_HOVER)
  lastHighlightedEls = []

  if (weekNumber && gridRef.value) {
    lastHighlightedEls = Array.from(gridRef.value.querySelectorAll(`[data-week="${weekNumber}"]`))
    for (const el of lastHighlightedEls) el.classList.add(...WEEK_HOVER)
  }
}

const onGridMouseOver = (e) => {
  const weekCell = e.target.closest('[data-week]')
  highlightWeek(weekCell?.dataset.week || null)
}

const onGridMouseLeave = () => {
  highlightWeek(null)
}

// Mode édition du drawer
const isEditMode = ref(false)
const editingChantierId = ref(null)
const originalDateRea = ref([]) // Pour détecter les changements de dates
const originalDatePrepa = ref([]) // Pour détecter les changements de dates de préparation
const originalEtat = ref(null) // Pour garder l'état original en édition
// Contacts généralités existants (pour préserver le coordinateur sécurité lors de l'édition)
const originalGeneralites = ref(null)

// Nom complet d'un utilisateur (chef de projet) à partir de son email
const cdpNameFromEmail = (email) => {
  if (!email) return null
  const u = users.value.find((x) => x.email === email)
  if (!u) return null
  return u.prenom && u.nom ? `${u.prenom} ${u.nom}` : u.email
}

const newChantier = ref({
  attribution: null,
  etat_pit: null,
  externe: false,
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
  kv_cat: [],
  chef_projet_email: null,
  moetx_amont_email: null
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
    // Déterminer l'état selon l'interrupteur « externe » : externe (1), sinon interne (2)
    const isExterne = newChantier.value.externe
    const etat = isExterne ? 1 : 2

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
      attribution: newChantier.value.attribution || defaultAttributionCode.value,
      etat_pit: newChantier.value.etat_pit || null,
      externe: newChantier.value.externe,
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

    if (newChantier.value.chef_projet_email || newChantier.value.moetx_amont_email) {
      await upsertContactsGeneralites(createdChantier.id, {
        chef_projet_email: newChantier.value.chef_projet_email || null,
        chef_projet_nom: cdpNameFromEmail(newChantier.value.chef_projet_email),
        moetx_amont_email: newChantier.value.moetx_amont_email || null,
        moetx_amont_nom: cdpNameFromEmail(newChantier.value.moetx_amont_email)
      })
    }

    $fetch('/api/email/send', { method: 'POST', body: { type: 'creation', chantierId: createdChantier.id } }).catch(
      console.error
    )

    // 3. Si etat = 2 (UO Travaux), créer les tâches H00
    if (etat === 2 && taches.value.length > 0) {
      // Combiner réalisation et préparation pour trouver les dates extrêmes
      const allPeriods = [...(newChantier.value.realisation || []), ...(newChantier.value.preparation || [])]
      const earliestReaDate = getEarliestDate(allPeriods)
      const allEndDates = allPeriods.map((p) => (p.date_end ? new Date(p.date_end) : null)).filter(Boolean)
      const latestEndDate = allEndDates.length > 0 ? new Date(Math.max(...allEndDates)) : null

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
    await Promise.all([getAllContactsTravaux(), getAllContactsGeneralites(), getAllWeekends()])

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
    attribution: createTargetSite.value,
    etat_pit: null,
    externe: false,
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
    kv_cat: [],
    chef_projet_email: null,
    moetx_amont_email: null
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
  originalGeneralites.value = null
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
    // Charger les contacts généralités (chef de projet + coordinateur sécurité)
    const generalitesData = await getContactsGeneralites(chantier.id)
    originalGeneralites.value = generalitesData || null

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
    originalDatePrepa.value = JSON.parse(JSON.stringify(chantier.date_prepa || []))
    originalEtat.value = chantier.etat

    // Remplir le formulaire
    newChantier.value = {
      attribution: chantier.attribution || defaultAttributionCode.value,
      etat_pit: chantier.etat_pit || null,
      externe: chantier.externe ?? chantier.etat === 1,
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
      kv_cat: contactsData?.kv_cat || [],
      chef_projet_email: generalitesData?.chef_projet_email || null,
      moetx_amont_email: generalitesData?.moetx_amont_email || null
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

const havePreparationDatesChanged = () => {
  const current = newChantier.value.preparation
  const initial = originalDatePrepa.value

  if (current.length !== initial.length) return true

  return current.some((period, index) => {
    return (
      toYMD(period.date_start) !== initial[index].date_start_prepa ||
      toYMD(period.date_end) !== initial[index].date_end_prepa
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
    // - Si le caractère externe (attribution « Externe ») a changé, on bascule l'état (1/2)
    // - Sinon on garde l'état original (pour ne pas rétrograder un chantier RLT en pré-op par exemple)
    const wasExternal = originalEtat.value === 1
    const isNowExternal = newChantier.value.externe

    let etat
    if (wasExternal !== isNowExternal) {
      etat = isNowExternal ? 1 : 2
    } else {
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

    // Vérifier si les dates ont changé AVANT la mise à jour
    const realisationChanged = haveRealisationDatesChanged()
    const preparationChanged = havePreparationDatesChanged()
    const datesChanged = realisationChanged || preparationChanged

    // 1. Mettre à jour le chantier
    await updateChantier(
      editingChantierId.value,
      {
        compte: newChantier.value.compte,
        name: newChantier.value.name,
        etat: etat,
        attribution: newChantier.value.attribution || defaultAttributionCode.value,
        etat_pit: newChantier.value.etat_pit || null,
        externe: newChantier.value.externe,
        date_rea: dateRea,
        date_prepa: datePrepa,
        autre: newChantier.value.autre || null
      },
      { datesChanged, oldDateRea: originalDateRea.value, oldDatePrepa: originalDatePrepa.value }
    )

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

    // Chef de projet + Moetx Amont (contacts généralités) : upsert « merge », seulement les champs modifiés
    const newCdpEmail = newChantier.value.chef_projet_email || null
    const newMoetxEmail = newChantier.value.moetx_amont_email || null
    const cdpChanged = newCdpEmail !== (originalGeneralites.value?.chef_projet_email || null)
    const moetxChanged = newMoetxEmail !== (originalGeneralites.value?.moetx_amont_email || null)
    if (cdpChanged || moetxChanged) {
      const generalitesPayload = {}
      if (cdpChanged) {
        generalitesPayload.chef_projet_email = newCdpEmail
        generalitesPayload.chef_projet_nom = cdpNameFromEmail(newCdpEmail)
      }
      if (moetxChanged) {
        generalitesPayload.moetx_amont_email = newMoetxEmail
        generalitesPayload.moetx_amont_nom = cdpNameFromEmail(newMoetxEmail)
      }
      await upsertContactsGeneralites(editingChantierId.value, generalitesPayload)
    }

    // 3. Mettre à jour les weekends
    await replaceWeekendsForChantier(editingChantierId.value, newChantier.value.weekends)

    // 4. Si les dates de réalisation ou préparation ont changé et c'est un UO Travaux (etat !== 1), recalculer les H00
    if (etat !== 1 && datesChanged && taches.value.length > 0) {
      const { updated } = await recalculateH00Previsions(editingChantierId.value, dateRea, taches.value, datePrepa)
      if (updated > 0) {
        addToast({
          title: 'Tâches H00 recalculées',
          message: `${updated} dates de prévision ont été mises à jour.`,
          type: 'Info'
        })
      }
    }

    // Recharger les données
    await Promise.all([getChantiers(), getAllContactsTravaux(), getAllContactsGeneralites(), getAllWeekends()])

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

// Grille des semaines / mois : voir composables/useCalendrierSemaines.js
const { weeks, getWeekNumber, getMonthsWithColspan } = useCalendrierSemaines()

const monthsWithColspan = computed(() => getMonthsWithColspan(selectedYear.value))

const today = new Date()
const currentWeek = getWeekNumber(today)
const isCurrentWeek = (weekNumber) => weekNumber === currentWeek && selectedYear.value === today.getFullYear()

// Sur l'année en cours, la carte s'ouvre un mois avant la semaine courante : à côté du panneau
// latéral, les premiers mois occuperaient sinon toute la largeur visible
const scrollRef = ref(null)
const cornerRef = ref(null)
const scrollToCurrentWeek = () => {
  const el = scrollRef.value
  if (!el || !gridRef.value) return
  const target =
    selectedYear.value === today.getFullYear()
      ? gridRef.value.querySelector(`[data-week="${Math.max(1, currentWeek - 4)}"]`)
      : null
  el.scrollLeft = target
    ? el.scrollLeft +
      target.getBoundingClientRect().left -
      el.getBoundingClientRect().left -
      cornerRef.value.offsetWidth
    : 0
}
onMounted(scrollToCurrentWeek)
watch(selectedYear, scrollToCurrentWeek, { flush: 'post' })

// Visibilité d'un chantier sur l'année : voir composables/useChantierDates.js
const { isChantierVisibleForYear } = useChantierDates()

// Accès aux week-ends
const allWeekends = useState('allWeekends')

// Nombre total de week-ends pour les chantiers filtrés et l'année sélectionnée
const totalWeekendsForYear = computed(() => {
  if (!allWeekends.value) return 0
  const chantierIds = new Set(filteredChantiers.value.map((c) => c.id))
  return allWeekends.value.filter(
    (w) =>
      chantierIds.has(w.chantier_id) && (w.annee_debut === selectedYear.value || w.annee_fin === selectedYear.value)
  ).length
})

// Chantiers de l'année (prépa, réa ou week-ends) qui répondent à la recherche, tous secteurs
// confondus : base des compteurs du filtre secteur
const chantiersDeLAnnee = computed(() => {
  if (!allChantiers.value || !Array.isArray(allChantiers.value)) return []

  const search = searchQuery.value.toLowerCase().trim()

  // Pré-construire un index email → nom complet pour la recherche contacts
  const userNameMap = new Map()
  if (search && users.value) {
    for (const u of users.value) {
      if (u.email) {
        const fullName = [u.prenom, u.nom].filter(Boolean).join(' ').toLowerCase()
        userNameMap.set(u.email.toLowerCase(), fullName)
      }
    }
  }

  // Champs contacts travaux à rechercher (emails simples + tableaux d'emails)
  const contactFields = [
    'rlt_voie_principale',
    'rlt_voie_secondaire',
    'rlt_ses_principale',
    'rlt_ses_secondaire',
    'rlt_cat_principale',
    'rlt_cat_secondaire',
    'kv_voie',
    'kv_ses',
    'kv_cat',
    'preop_voie',
    'preop_ses',
    'logistique'
  ]

  return allChantiers.value
    .filter((chantier) => {
      // Filtre par recherche
      if (search) {
        const matchCompte = chantier.compte?.toLowerCase().includes(search)
        const matchName = chantier.name?.toLowerCase().includes(search)
        const matchLigne = chantier.ligne?.toLowerCase().includes(search)

        // Recherche dans les contacts travaux
        let matchContact = false
        if (!matchCompte && !matchName && !matchLigne) {
          const ct = allContactsTravaux.value?.find((c) => c.chantier_id === chantier.id)
          if (ct) {
            matchContact = contactFields.some((field) => {
              const val = ct[field]
              if (!val) return false
              const emails = Array.isArray(val) ? val : [val]
              return emails.some((email) => {
                const name = userNameMap.get(email?.toLowerCase())
                return name?.includes(search)
              })
            })
          }
        }

        // Recherche dans le chef de projet (contacts généralités)
        let matchCdp = false
        if (!matchCompte && !matchName && !matchLigne && !matchContact) {
          const gen = allContactsGeneralites.value?.find((c) => c.chantier_id === chantier.id)
          if (gen?.chef_projet_nom) {
            matchCdp = gen.chef_projet_nom.toLowerCase().includes(search)
          }
        }

        if (!matchCompte && !matchName && !matchLigne && !matchContact && !matchCdp) return false
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

// Chantiers affichés : ceux du secteur sélectionné (« Tous » ou un secteur, consultation ouverte à tous)
const filteredChantiers = computed(() =>
  selectedSite.value === 'all'
    ? chantiersDeLAnnee.value
    : chantiersDeLAnnee.value.filter((c) => c.attribution === selectedSite.value)
)

// Nombre de chantiers par secteur, pour les pastilles du filtre
const countBySite = computed(() => {
  const counts = { all: chantiersDeLAnnee.value.length }
  for (const c of chantiersDeLAnnee.value) counts[c.attribution] = (counts[c.attribution] ?? 0) + 1
  return counts
})

// Résumé à côté de l'année, dans le coin du calendrier (à partir de md)
const resumeAnnee = computed(() => {
  const n = filteredChantiers.value.length
  const w = totalWeekendsForYear.value
  return {
    chantiers: n === 0 ? 'Aucun chantier' : `${n} chantier${n > 1 ? 's' : ''}`,
    weekends: w === 0 ? 'Aucun week-end' : `${w} week-end${w > 1 ? 's' : ''}`
  }
})

// Légende : mêmes classes que les barres (useTimelineRowLogic)
const LEGENDE_ETATS = [
  { label: 'RLT', bar: 'bg-sky-500 border-sky-700' },
  { label: 'Pré-op', bar: 'bg-lime-500 border-lime-700' },
  { label: 'Externe', bar: 'bg-purple-500 border-purple-700' },
  { label: 'Terminé', bar: 'bg-slate-500 border-slate-700' }
]

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
// Ouvrir la page d'impression dans un nouvel onglet
const openPrintPage = () => {
  const printUrl = `/calendriers/print/plan-de-charge-generale?year=${selectedYear.value}&site=${encodeURIComponent(selectedSite.value)}`
  window.open(printUrl, '_blank')
}
// Charger les chantiers au montage
onMounted(async () => {
  setLoader(true)
  try {
    await Promise.all([
      getChantiers(),
      getAllUsers(),
      getAllContactsTravaux(),
      getAllContactsGeneralites(),
      getTaches(),
      getAllWeekends(),
      getAttributions()
    ])
    initializeDefaultUsers()
    // Filtre site pré-positionné sur le site de l'utilisateur ;
    // « Tous » uniquement pour Pôle IT ou les comptes sans site rattaché.
    selectedSite.value = userSite.value && userSite.value !== 'Pôle IT' ? userSite.value : 'all'
  } finally {
    setLoader(false)
  }
})
</script>

<template>
  <AppPageLayout v4>
    <!-- ============ Barre latérale : secteurs, légende (l'année est dans le coin du calendrier) ============ -->
    <template #sidebar>
      <div class="flex flex-col gap-5 pb-6 lg:pt-2">
        <!-- Secteur affiché : fond rose pâle + repère magenta, comme les chantiers de la page Tâches -->
        <nav class="flex flex-col gap-1.5" aria-label="Filtrer par secteur">
          <p class="px-3" :class="PANNEAU_TITRE">Secteurs</p>
          <div :class="PANNEAU_GROUPE">
            <button
              v-for="f in siteFilterOptions"
              :key="f.id"
              type="button"
              class="py-2"
              :class="[PANNEAU_ENTREE, panneauItem(selectedSite === f.id)]"
              :aria-pressed="selectedSite === f.id"
              @click="selectedSite = f.id">
              <Icon
                :name="f.id === 'all' ? 'lucide:layers' : 'lucide:map-pin'"
                size="18"
                class="shrink-0"
                :class="panneauIcone(selectedSite === f.id)" />
              <span class="min-w-0 flex-1 truncate text-sm font-medium">{{ f.label }}</span>
              <span
                class="inline-flex h-5.5 min-w-6.5 shrink-0 items-center justify-center rounded-full px-1.5 text-xs font-bold"
                :class="panneauBadge(selectedSite === f.id)">
                {{ countBySite[f.id] ?? 0 }}
              </span>
            </button>
          </div>
        </nav>

        <!-- Légende : états (couleur des barres), puis préparation, réalisation et week-ends.
             Repliée sur mobile (le panneau passe au-dessus du calendrier), toujours ouverte sur grand écran -->
        <section class="border-rule border-t px-3 pt-4" aria-label="Légende">
          <button
            type="button"
            class="flex w-full cursor-pointer items-center justify-between lg:hidden"
            :aria-expanded="legendeOuverte"
            aria-controls="pdc-legende"
            @click="legendeOuverte = !legendeOuverte">
            <span :class="PANNEAU_TITRE">Légende</span>
            <Icon
              name="lucide:chevron-down"
              size="16"
              class="text-slate-400 transition-transform"
              :class="{ 'rotate-180': legendeOuverte }" />
          </button>
          <p class="hidden pb-2.5 lg:block" :class="PANNEAU_TITRE">Légende</p>
          <div id="pdc-legende" class="max-lg:mt-3" :class="[PANNEAU_RETRAIT, { 'max-lg:hidden': !legendeOuverte }]">
            <ul class="text-ink-soft grid grid-cols-2 gap-x-3 gap-y-2 text-[13px]">
              <li v-for="l in LEGENDE_ETATS" :key="l.label" class="flex items-center gap-2">
                <span class="h-2.5 w-5 shrink-0 rounded-xs border" :class="l.bar" />
                {{ l.label }}
              </li>
            </ul>
            <ul class="text-ink-soft mt-3.5 grid grid-cols-2 gap-x-3 gap-y-2 text-[13px]">
              <li class="flex items-center gap-2">
                <span class="h-2.5 w-5 shrink-0 rounded-xs bg-slate-300 dark:bg-white/30" />
                Préparation
              </li>
              <li class="flex items-center gap-2">
                <span class="h-2.5 w-5 shrink-0 rounded-xs bg-slate-500 dark:bg-white/85" />
                Réalisation
              </li>
              <li class="flex items-center gap-2">
                <span class="flex w-5 shrink-0 justify-center"><span class="h-3.5 w-1 bg-orange-500" /></span>
                Week-end
              </li>
            </ul>
          </div>
        </section>
      </div>
    </template>

    <template #sidebar-footer>
      <ChantierCarteCreation v-if="canCreate" @create="openCreateDrawer" />
    </template>

    <!-- ============ Contenu principal ============ -->
    <!-- Bandeau : en tête de page sur mobile, avant le panneau (secteurs, légende) -->
    <template #entete>
      <AppPageHero
        title="Plan de charge général"
        description="Préparation, travaux et week-ends de chaque chantier, semaine par semaine"
        illustration="planning" />
    </template>

    <template #default>
      <div class="flex min-h-0 flex-1 flex-col gap-4 p-4 lg:px-8 lg:pt-4 lg:pb-4">
        <div class="flex flex-none flex-wrap items-center justify-between gap-3">
          <AppInputSearch
            v-model="searchQuery"
            boxed
            dense
            class="w-full sm:w-80"
            placeholder="Rechercher un chantier ou un contact…" />
          <div class="hidden lg:flex">
            <AppButtonValidated theme="outline" type="button" @click="openPrintPage">
              <template #default>
                <span class="flex items-center gap-2">
                  <Icon name="lucide:printer" size="16" />
                  Imprimer
                </span>
              </template>
            </AppButtonValidated>
          </div>
        </div>

        <!-- Calendrier : la carte défile dans les deux sens, en-tête et colonne chantier restent figés -->
        <div ref="scrollRef" class="surface-card min-h-0 flex-1 overflow-auto rounded-xl max-lg:max-h-[75vh]">
          <div
            ref="gridRef"
            class="grid min-w-[1400px] [--col-chantier:6.5rem] md:[--col-chantier:minmax(320px,auto)]"
            :style="{ gridTemplateColumns }"
            @mouseover="onGridMouseOver"
            @mouseleave="onGridMouseLeave">
            <!-- ===== En-tête figé (2 lignes) ===== -->
            <div class="bg-table-head sticky top-0 z-30 col-span-full row-span-2 grid grid-cols-subgrid">
              <!-- Coin figé : choix de l'année (à la place du titre « Chantier »), résumé à droite sur grand écran -->
              <div
                ref="cornerRef"
                class="bg-table-head border-rule sticky left-0 z-40 row-span-2 flex items-center justify-between gap-3 border-r border-b px-1 md:px-4">
                <AppYearNav v-model="selectedYear" />
                <div class="text-ink-soft hidden text-right text-[11px] leading-snug md:block">
                  <p>{{ resumeAnnee.chantiers }}</p>
                  <p>{{ resumeAnnee.weekends }}</p>
                </div>
              </div>

              <!-- Ligne 1 : mois, puis groupes d'intervenants -->
              <div
                v-for="(month, index) in monthsWithColspan"
                :key="'month-' + index"
                :style="{ gridColumn: `span ${month.colspan}` }"
                class="bg-table-head table-head-text border-rule border-b px-1 py-1.5 text-center text-xs"
                :class="{ 'border-l': index > 0 }">
                {{ month.name }}
              </div>
              <div
                v-for="groupe in ['RLT Voie', 'RLT SES', 'RLT CAT', 'Pré-op']"
                :key="groupe"
                class="bg-table-head table-head-text border-rule col-span-3 flex items-center justify-center border-b border-l px-1 py-1.5 text-xs">
                {{ groupe }}
              </div>
              <div
                v-for="col in showAttributionColumn ? ['CdP', 'État', 'Secteur'] : ['CdP', 'État']"
                :key="col"
                class="bg-table-head table-head-text border-rule row-span-2 flex items-center justify-center border-b border-l px-1 text-xs">
                {{ col }}
              </div>

              <!-- Ligne 2 : numéros de semaine (la colonne 1 est prise par le row-span-2), sous-colonnes -->
              <div
                v-for="week in weeks"
                :key="'weekh-' + week.number"
                :data-week="week.number"
                class="border-rule flex items-center justify-center border-b py-1 text-[11px] font-semibold tabular-nums"
                :class="isCurrentWeek(week.number) && 'bg-secondary-50 dark:bg-secondary-400/10'">
                <span
                  v-if="isCurrentWeek(week.number)"
                  class="bg-secondary-600 rounded-full px-1.5 py-px text-white"
                  title="Semaine en cours">
                  {{ week.label }}
                </span>
                <span v-else class="text-ink-soft">{{ week.label }}</span>
              </div>
              <div
                v-for="(sous, i) in ['1er', '2nd', 'Kv', '1er', '2nd', 'Kv', '1er', '2nd', 'Kv', 'Voie', 'SES', 'Log']"
                :key="'sous-' + i"
                class="border-rule text-ink-soft flex items-center justify-center border-b border-l py-1 text-[11px] font-semibold">
                {{ sous }}
              </div>
            </div>

            <!-- ===== Lignes chantiers ===== -->
            <ChantierTimelineGridRow
              v-for="chantier in filteredChantiers"
              :key="chantier.id"
              v4
              :chantier="chantier"
              :weeks="weeks"
              :selected-year="selectedYear"
              :show-contacts="true"
              :show-site-info="true"
              :show-attribution="showAttributionColumn"
              :attributions="allAttributions"
              :clickable="canEditChantier(chantier)"
              @week-click="openEditDrawer" />
          </div>

          <!-- Aucun chantier : hors de la grille, figé sur la largeur visible de la carte -->
          <div v-if="filteredChantiers.length === 0" class="sticky left-0 flex flex-col items-center gap-3 px-6 py-12">
            <Icon name="lucide:calendar-x" size="32" class="text-magenta-300 dark:text-white/30" />
            <p class="text-ink-soft text-sm">
              {{ searchQuery.trim() ? 'Aucun chantier ne correspond à la recherche' : 'Aucun chantier' }} pour
              {{ selectedYear }}
            </p>
            <AppButtonValidated
              v-if="selectedYear !== today.getFullYear()"
              theme="outline"
              type="button"
              @click="selectedYear = today.getFullYear()">
              <template #default>Revenir à {{ today.getFullYear() }}</template>
            </AppButtonValidated>
          </div>
        </div>
      </div>

      <ChantierForm
        :open="drawerOpen"
        :etat="originalEtat"
        :model-value="newChantier"
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
        :users-cdp="getUsersCdp"
        :users-moetx="getUsersMoetx"
        :users="users"
        :taches="taches"
        :chantiers="allChantiers"
        :attribution-options="editableAttributionOptions"
        :is-submitting="isSubmitting"
        @submit="handleFormSubmit"
        @cancel="toggleDrawer" />
    </template>
  </AppPageLayout>
</template>
