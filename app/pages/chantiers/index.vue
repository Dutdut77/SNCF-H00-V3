<script setup>
definePageMeta({
  requiresAuth: true,
  requiredRole: ''
})

useHead({
  title: 'H00 - Chantiers',
  description: 'Liste des chantiers H00'
})
const user = useAuthUser()
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
  allContactsTravaux,
  getAllContactsTravaux,
  upsertContactsTravaux,
  getContactsTravaux,
  allContactsGeneralites,
  getAllContactsGeneralites,
  getContactsGeneralites,
  upsertContactsGeneralites
} = useContacts()
const { setLoader } = useLoader()
const { taches, getTaches } = useTaches()
const { createH00Entries, recalculateH00Previsions } = useH00()
const { addToast } = useToast()
const { addWeekend, getAllWeekends, getWeekendsByChantier, replaceWeekendsForChantier } = useTimeline()
const { isAdmin, isSuperAdmin } = useLevelUser()
const { getAttributions, attributionOptions, defaultAttributionCode, getAttribution } = useAttributions()
const { getEtatInfo, countByEtat: computeCountByEtat, filterByEtat } = useEtatChantier()
const { formatDate, getFirstReaDate, getLastReaDate } = useChantierDates()

// Computed pour savoir si l'utilisateur peut modifier (admin ou superadmin)
const canEdit = computed(() => isAdmin.value || isSuperAdmin.value)

// Accès direct au state partagé des chantiers
const allChantiers = useState('allChantiers')

// Barre de recherche et filtres
const searchQuery = ref('')
const selectedEtat = ref('all')

// Portée de la liste : 'tous' | 'mes' (chantiers où l'utilisateur figure dans les contacts travaux)
const portee = ref('tous')
const showOnlyMyChantier = computed(() => portee.value === 'mes')

// Vue active : 'tableau' | 'cartes' | 'planning'
const viewMode = ref('tableau')
// Année affichée par la vue Planning
const anneePlanning = ref(new Date().getFullYear())

// Tri : clé + sens, piloté par les en-têtes du tableau ou le select en vue cartes
const sortKey = ref('date') // 'date' | 'name' | 'compte'
const sortDir = ref('asc') // 'asc' | 'desc' — chronologique par défaut : du plus ancien au plus récent

const sortOptions = [
  { id: 'date_asc', label: 'Date (ancien → récent)' },
  { id: 'date_desc', label: 'Date (récent → ancien)' },
  { id: 'name_asc', label: 'Nom (A → Z)' },
  { id: 'name_desc', label: 'Nom (Z → A)' },
  { id: 'compte_asc', label: 'Compte (A → Z)' },
  { id: 'compte_desc', label: 'Compte (Z → A)' }
]

// Le select de tri (vue cartes) réutilise sortKey/sortDir sous forme d'un id unique
const sortBy = computed({
  get: () => `${sortKey.value}_${sortDir.value}`,
  set: (value) => {
    const [key, dir] = value.split('_')
    sortKey.value = key
    sortDir.value = dir
  }
})

// Clic sur un en-tête : même colonne → inverse le sens, sinon bascule dessus
const toggleSort = (key) => {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDir.value = 'asc'
  }
}

// Colonnes masquables du tableau
const colonnes = ref({ site: true, ligne: true, chefProjet: true })
const colonnesOptions = [
  { key: 'site', label: 'Site' },
  { key: 'ligne', label: 'Ligne' },
  { key: 'chefProjet', label: 'Chef de projet' }
]

// Pagination (côté client : tous les chantiers sont déjà en mémoire)
const page = ref(1)
const pageSizeOptions = [20, 50, 100]
const pageSize = ref(20)

// Mode édition du drawer
const isEditMode = ref(false)
const editingChantierId = ref(null)
const originalDateRea = ref([])
const originalDatePrepa = ref([])
const originalEtat = ref(null)
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
    const isExterne = newChantier.value.externe
    const etat = isExterne ? 1 : 2

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

    $fetch('/api/email/send', { method: 'POST', body: { type: 'creation', chantierId: createdChantier.id } }).catch(console.error)

    if (etat === 2 && taches.value.length > 0) {
      // Combiner réalisation et préparation pour trouver les dates extrêmes
      const allPeriods = [...(newChantier.value.realisation || []), ...(newChantier.value.preparation || [])]
      const earliestReaDate = getEarliestDate(allPeriods)
      const allEndDates = allPeriods
        .map((p) => (p.date_end ? new Date(p.date_end) : null))
        .filter(Boolean)
      const latestEndDate = allEndDates.length > 0 ? new Date(Math.max(...allEndDates)) : null

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
    attribution: defaultAttributionCode.value,
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

    const contactsData = await getContactsTravaux(chantier.id)
    const generalitesData = await getContactsGeneralites(chantier.id)
    const weekendsData = await getWeekendsByChantier(chantier.id)
    originalGeneralites.value = generalitesData || null

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

    originalDateRea.value = JSON.parse(JSON.stringify(chantier.date_rea || []))
    originalDatePrepa.value = JSON.parse(JSON.stringify(chantier.date_prepa || []))

    originalEtat.value = chantier.etat

    newChantier.value = {
      attribution: chantier.attribution || defaultAttributionCode.value,
      etat_pit: chantier.etat_pit || null,
      externe: chantier.externe ?? (chantier.etat === 1),
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
  setLoader(false)

  try {
    const wasExternal = originalEtat.value === 1
    const isNowExternal = newChantier.value.externe

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

    // Vérifier si les dates ont changé AVANT la mise à jour
    const realisationChanged = haveRealisationDatesChanged()
    const preparationChanged = havePreparationDatesChanged()
    const datesChanged = realisationChanged || preparationChanged

    await updateChantier(editingChantierId.value, {
      compte: newChantier.value.compte,
      name: newChantier.value.name,
      etat: etat,
      attribution: newChantier.value.attribution || defaultAttributionCode.value,
      etat_pit: newChantier.value.etat_pit || null,
      externe: newChantier.value.externe,
      date_rea: dateRea,
      date_prepa: datePrepa,
      autre: newChantier.value.autre || null
    }, { datesChanged, oldDateRea: originalDateRea.value, oldDatePrepa: originalDatePrepa.value })

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

    await replaceWeekendsForChantier(editingChantierId.value, newChantier.value.weekends)

    // Si les dates ont changé et c'est un UO Travaux (etat !== 1), recalculer les H00
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

const userIdPresentInContactsTravaux = (userEmail, contactsTravaux) => {
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

      return fields.includes(userEmail)
    })
    .map((item) => item.chantier_id) // 👉 EXTRACTION UNIQUEMENT DES IDs
}

const listChantiers = computed(() => {
  if (showOnlyMyChantier.value) {
    // Vérifier si l'utilisateur est présent dans les contacts des chantiers non terminés
    const matchingChantierContactIds = userIdPresentInContactsTravaux(user.value.email, allContactsTravaux.value)

    // Filtrer les chantiers pour ne garder que ceux qui ont des contacts travaux avec l'utilisateur
    const userChantiers = allChantiers.value.filter((chantier) => matchingChantierContactIds.includes(chantier.id))

    // Récupérer les contacts de tous les chantiers.

    return userChantiers
  }
  return allChantiers.value
})

// Filtrage des chantiers
const filteredChantiers = computed(() => {
  if (!listChantiers.value || !Array.isArray(listChantiers.value)) return []

  const search = searchQuery.value.toLowerCase().trim()

  // Filtre par recherche puis par état
  const searched = search
    ? listChantiers.value.filter(
        (chantier) =>
          chantier.compte?.toLowerCase().includes(search) ||
          chantier.name?.toLowerCase().includes(search) ||
          chantier.ligne?.toLowerCase().includes(search)
      )
    : listChantiers.value

  const result = [...filterByEtat(searched, selectedEtat.value)]

  // Tri des résultats
  const sens = sortDir.value === 'asc' ? 1 : -1
  result.sort((a, b) => {
    switch (sortKey.value) {
      case 'date':
        return sens * (new Date(getFirstReaDate(a) || 0) - new Date(getFirstReaDate(b) || 0))
      case 'name':
        return sens * (a.name || '').localeCompare(b.name || '')
      case 'compte':
        return sens * (a.compte || '').localeCompare(b.compte || '')
      default:
        return 0
    }
  })

  return result
})

// Chantiers de la page courante
const paginatedChantiers = computed(() =>
  filteredChantiers.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value)
)

// Toute modification du périmètre ramène à la première page
watch([searchQuery, selectedEtat, portee, sortKey, sortDir, pageSize], () => {
  page.value = 1
})

// Compteurs par état
const countByEtat = computed(() => computeCountByEtat(listChantiers.value))

// Chantiers créés depuis le 1er du mois courant (sous-titre de la tuile « En cours »)
const nouveauxCeMois = computed(() => {
  const now = new Date()
  const debutDuMois = new Date(now.getFullYear(), now.getMonth(), 1)
  return (listChantiers.value || []).filter(
    (c) => c.etat > -1 && c.created_at && new Date(c.created_at) >= debutDuMois
  ).length
})

// Index des généralités par chantier (chef de projet)
const generalitesByChantier = computed(() => {
  const map = new Map()
  for (const contact of allContactsGeneralites.value || []) {
    map.set(contact.chantier_id, contact)
  }
  return map
})

// Chef de projet : chantier_contacts_generalites.chef_projet_email.
// À ne pas confondre avec chantiers.chef_projet_responsable_email, qui sert
// au matching des droits PIT et n'est pas le CdP affiché.
const chefDeProjetDe = (chantier) => {
  const generalites = generalitesByChantier.value.get(chantier.id)
  if (!generalites) return null

  const email = generalites.chef_projet_email
  // L'utilisateur en base fait foi pour prénom/nom (initiales de l'avatar)
  const u = email ? users.value.find((x) => x.email === email) : null
  if (u) return { nom: u.nom || '', prenom: u.prenom || '', email }

  // Repli sur le nom figé dans les généralités, stocké sous la forme « Prénom Nom »
  const nomFige = generalites.chef_projet_nom?.trim()
  if (nomFige) {
    const [prenom, ...reste] = nomFige.split(' ')
    return reste.length > 0 ? { prenom, nom: reste.join(' '), email } : { prenom: '', nom: nomFige, email }
  }

  return email ? { prenom: '', nom: email, email } : null
}

// Libellé du site (table attributions)
const siteLabel = (chantier) => {
  if (!chantier.attribution) return null
  return getAttribution(chantier.attribution)?.label || chantier.attribution
}

// Export CSV des chantiers filtrés, colonnes visibles uniquement
const exportCsv = () => {
  const entetes = ['Compte', 'Chantier', 'Statut', 'Début', 'Fin']
  if (colonnes.value.site) entetes.push('Site')
  if (colonnes.value.ligne) entetes.push('Ligne')
  if (colonnes.value.chefProjet) entetes.push('Chef de projet')

  const echappe = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`

  const lignes = filteredChantiers.value.map((c) => {
    const chefProjet = chefDeProjetDe(c)
    const cellules = [
      c.compte,
      c.name,
      getEtatInfo(c.etat).label,
      getFirstReaDate(c) ? formatDate(getFirstReaDate(c)) : '',
      getLastReaDate(c) ? formatDate(getLastReaDate(c)) : ''
    ]
    if (colonnes.value.site) cellules.push(siteLabel(c) || '')
    if (colonnes.value.ligne) cellules.push(c.ligne || '')
    if (colonnes.value.chefProjet) {
      cellules.push(chefProjet ? `${chefProjet.prenom} ${chefProjet.nom}`.trim() : '')
    }
    return cellules.map(echappe).join(';')
  })

  // BOM UTF-8 pour qu'Excel lise correctement les accents
  const contenu = '\uFEFF' + [entetes.map(echappe).join(';'), ...lignes].join('\r\n')
  const url = URL.createObjectURL(new Blob([contenu], { type: 'text/csv;charset=utf-8;' }))
  const lien = document.createElement('a')
  lien.href = url
  lien.download = `chantiers-${new Date().toISOString().slice(0, 10)}.csv`
  lien.click()
  URL.revokeObjectURL(url)
}

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
    await Promise.all([getChantiers(), getAllUsers(), getAllContactsTravaux(), getAllContactsGeneralites(), getTaches(), getAllWeekends(), getAttributions()])

    initializeDefaultUsers()
  } finally {
    setLoader(false)
  }
})
</script>

<template>
  <AppPageLayout>
    <!-- ============ Barre latérale ============ -->
    <template #sidebar>
      <ChantierListeSidebar
        v-model:portee="portee"
        v-model:vue="viewMode"
        v-model:etat="selectedEtat"
        :counts="countByEtat" />
    </template>

    <!-- Carte d'appel à l'action, en pied de barre latérale -->
    <template #sidebar-footer>
      <div
        v-if="canEdit"
        class="border-primary-200 mx-4 mb-4 overflow-hidden rounded-xl border bg-white lg:mx-0 lg:mb-0 dark:bg-slate-900">
        <div class="p-4">
          <div class="mb-2 flex items-center gap-2">
            <span
              class="from-secondary-400 to-secondary-600 flex h-9 w-9 items-center justify-center rounded-lg bg-linear-to-br text-white">
              <Icon name="lucide:traffic-cone" size="20" />
            </span>
            <p class="text-primary-800 text-sm font-semibold">Nouveau chantier</p>
          </div>
          <p class="text-primary-500 text-xs leading-relaxed">
            Créez et suivez l'avancement de vos chantiers en temps réel.
          </p>
        </div>
        <!-- Bandeau bord à bord : AppButtonValidated n'est pas utilisé ici, son `rounded-lg`
             et son `hover:scale-105` s'accommodent mal d'un bouton pleine largeur collé aux bords.
             Le dégradé reprend celui de son thème `secondary`. -->
        <button
          type="button"
          class="from-secondary-400 to-secondary-500 hover:from-secondary-500 hover:to-secondary-600 flex w-full cursor-pointer items-center justify-center gap-2 bg-linear-to-br px-4 py-2.5 text-sm font-medium text-white transition-colors"
          @click="openCreateDrawer">
          <Icon name="lucide:plus" size="18" />
          Créer un chantier
        </button>
      </div>
    </template>

    <!-- ============ Contenu principal ============ -->
    <template #default>
      <!-- pl-2 sur lg : le halo (ring-offset) de la tuile sélectionnée déborde de sa carte
           et serait rogné par l'overflow-hidden du <main> si le contenu collait au bord. -->
      <!-- flex-1 plutôt que h-full : <main> est déjà `flex flex-col`, on remplit sa hauteur
           sans dépendre d'une chaîne de hauteurs en % (slot → AppPageLayout → main).
           C'est ce qui garde la pagination collée en bas.
           Bas de page : pb-1 (4px) + le py-3 (12px) interne d'AppPagination = les 16px du lg:p-4
           qui entoure la carte de la barre latérale, donc la pagination s'aligne sur le bas du
           bouton « Créer un chantier ». En vue planning il n'y a pas de pagination : pb-4 rétablit
           directement ces 16px. Paddings écrits côté par côté pour ne pas dépendre de l'ordre de
           génération des utilitaires Tailwind. -->
      <div
        class="flex min-h-0 flex-1 flex-col gap-4 pt-4 pr-4 pl-4 lg:pl-2"
        :class="viewMode === 'planning' ? 'pb-4' : 'pb-1'">
        <!-- En-tête : titre + recherche -->
        <div class="flex flex-none flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <AppTitleMain title="Liste des chantiers" description="Gestion et suivi de tous les chantiers" />
          <AppInputSearch
            v-model="searchQuery"
            class="h-fit w-full lg:w-[28rem]"
            placeholder="Rechercher un chantier, un compte, une ligne ..." />
        </div>

        <!-- Tuiles de synthèse -->
        <div class="flex-none">
          <ChantierListeStatCards
            v-model="selectedEtat"
            :counts="countByEtat"
            :nouveaux-ce-mois="nouveauxCeMois" />
        </div>

        <!-- Barre d'outils : vue + tri + colonnes + export -->
        <div class="flex flex-none flex-wrap items-center justify-between gap-3">
          <!-- Sélecteur de vue (toujours visible, y compris sous lg) -->
          <div class="border-primary-200 bg-primary-100 flex items-center gap-1 rounded-lg border p-1">
            <button
              v-for="v in [
                { id: 'tableau', label: 'Tableau', icon: 'lucide:table-2' },
                { id: 'cartes', label: 'Cartes', icon: 'lucide:layout-grid' },
                { id: 'planning', label: 'Planning', icon: 'lucide:calendar-range' }
              ]"
              :key="v.id"
              type="button"
              class="flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200"
              :class="viewMode === v.id ? 'bg-primary-50 text-primary-800 shadow-sm' : 'text-primary-500 hover:text-primary-700'"
              @click="viewMode = v.id">
              <Icon :name="v.icon" size="16" />
              {{ v.label }}
            </button>
          </div>

          <div class="flex items-center gap-2">
            <!-- Tri : en vue tableau il passe par les en-têtes de colonnes -->
            <div v-if="viewMode === 'cartes'" class="w-52">
              <AppSelect v-model="sortBy" :options="sortOptions" name="sortBy" />
            </div>

            <!-- Colonnes visibles -->
            <AppDropdownMenu v-if="viewMode === 'tableau'">
              <template #trigger>
                <button
                  type="button"
                  class="border-primary-200 bg-primary-50 text-primary-600 hover:border-primary-300 hover:text-primary-800 flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors">
                  <Icon name="lucide:columns-3" size="16" />
                  Colonnes
                </button>
              </template>
              <div class="flex w-44 flex-col gap-2 p-1">
                <AppCheckbox
                  v-for="col in colonnesOptions"
                  :key="col.key"
                  v-model="colonnes[col.key]"
                  :label="col.label" />
              </div>
            </AppDropdownMenu>

            <!-- Export CSV -->
            <AppTooltip text="Exporter en CSV">
              <button
                type="button"
                :disabled="filteredChantiers.length === 0"
                class="border-primary-200 bg-primary-50 text-primary-600 hover:border-primary-300 hover:text-primary-800 flex h-9 w-9 items-center justify-center rounded-lg border transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                :class="filteredChantiers.length > 0 ? 'cursor-pointer' : ''"
                aria-label="Exporter en CSV"
                @click="exportCsv">
                <Icon name="lucide:download" size="16" />
              </button>
            </AppTooltip>
          </div>
        </div>

        <!-- Liste. En vue tableau, le défilement appartient au tableau lui-même :
             c'est ce qui permet à son en-tête de rester collé. -->
        <div class="min-h-0 flex-1" :class="viewMode === 'cartes' ? 'overflow-auto' : 'overflow-hidden'">
          <template v-if="filteredChantiers.length > 0">
            <ChantierListeTableau
              v-if="viewMode === 'tableau'"
              :chantiers="paginatedChantiers"
              :chef-de-projet-de="chefDeProjetDe"
              :site-label="siteLabel"
              :colonnes="colonnes"
              :sort-key="sortKey"
              :sort-dir="sortDir"
              :can-edit="canEdit"
              @sort="toggleSort"
              @open="goToChantier"
              @edit="openEditDrawer" />

            <ChantierListePlanning
              v-else-if="viewMode === 'planning'"
              v-model:annee="anneePlanning"
              :chantiers="filteredChantiers"
              :can-edit="canEdit"
              @edit="openEditDrawer" />

            <ChantierListeCartes
              v-else
              :chantiers="paginatedChantiers"
              :site-label="siteLabel"
              :can-edit="canEdit"
              @open="goToChantier"
              @edit="openEditDrawer" />
          </template>

          <!-- Aucun résultat -->
          <div
            v-else
            class="border-primary-200 bg-primary-100/50 flex flex-col items-center justify-center rounded-xl border border-dashed py-16">
            <Icon name="lucide:folder-open" size="48" class="text-primary-300 mb-4" />
            <p class="text-primary-500 mb-2 text-lg font-medium">Aucun chantier trouvé</p>
            <p class="text-primary-400 mb-4 text-sm">
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

        <!-- Pagination -->
        <AppPagination
          v-if="filteredChantiers.length > 0 && viewMode !== 'planning'"
          v-model:page="page"
          v-model:page-size="pageSize"
          :page-size-options="pageSizeOptions"
          :total="filteredChantiers.length"
          label="chantiers"
          class="flex-none" />
      </div>

      <!-- Drawer pour création/édition -->
      <AppDrawer :drawer-open="drawerOpen" :close-drawer="toggleDrawer">
        <template #default>
          <AppDrawerContent v-if="drawerOpen" :drawer-open="drawerOpen" :close-drawer="toggleDrawer">
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
              :users-cdp="getUsersCdp"
              :users-moetx="getUsersMoetx"
              :users="users"
              :taches="taches"
              :chantiers="allChantiers"
              :attribution-options="attributionOptions"
              :is-submitting="isSubmitting"
              @submit="handleFormSubmit"
              @cancel="toggleDrawer" />
          </AppDrawerContent>
        </template>
      </AppDrawer>
    </template>

  </AppPageLayout>
</template>
