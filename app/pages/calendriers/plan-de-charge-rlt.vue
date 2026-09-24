<script setup>
definePageMeta({
  requiresAuth: true,
  requiredRole: ''
})

useHead({
  title: 'H00 - Planning agent',
  description: 'Plan de charge annuel des agents (RLT, KV, Pôle IT)'
})

const { getChantiers } = useChantiers()
const {
  getAllUsers,
  users,
  getUsersRltVoie,
  getUsersRltSes,
  getUsersKvVoie,
  getUsersKvSes,
  getUsersRltCat,
  getUsersKvCat,
  getUsersMoetx,
  getUsersCdp
} = useUsers()
const {
  getAllContactsTravaux,
  allContactsTravaux,
  getContactsTravaux,
  upsertContactsTravaux,
  deleteContactTravaux,
  getAllContactsGeneralites,
  allContactsGeneralites,
  upsertContactsGeneralites
} = useContacts()
const { setLoader } = useLoader()
const { getAllWeekends } = useTimeline()
const { isAdmin, isSuperAdmin, userSite } = useLevelUser()
const { getAttributions, attributionOptions } = useAttributions()
const { getAllAbsences, addAbsence, absenceTypes } = useAbsences()

// Computed pour savoir si l'utilisateur peut modifier (admin ou superadmin) — règle inchangée
const canEdit = computed(() => isAdmin.value || isSuperAdmin.value)

// ============================================
// FILTRE PAR SITE (barre latérale « Secteurs »)
// ============================================
// 'Pôle IT' = vue Moetx Amont + Chef de projet ; sinon un code d'attribution (vue RLT/KV).
const selectedSite = ref('Pôle IT')
const isPoleITView = computed(() => selectedSite.value === 'Pôle IT')
// Entrées de la barre latérale : « Pôle IT » (remplace « Tous ») + les sites réels.
const siteFilterOptions = computed(() => [{ id: 'Pôle IT', label: 'Pôle IT' }, ...attributionOptions.value])

// Accès direct au state partagé des chantiers
const allChantiers = useState('allChantiers')
const searchQuery = ref('')
// État réactif pour l'année sélectionnée
const selectedYear = ref(new Date().getFullYear())
// Hover de colonne par DOM direct (pas de réactivité Vue)
const gridRef = ref(null)
let lastHighlightedEls = []

// Colonne survolée : classes importantes, elles passent devant le fond de la semaine en cours.
// Translucide : la même classe colore les cases blanches et la case d'en-tête (comme le plan de charge général).
const WEEK_HOVER = ['bg-magenta-500/10!', 'dark:bg-white/6!']

const highlightWeek = (weekNumber) => {
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

// Domaine affiché (voie ou ses), choisi par les deux gros boutons taupe en tête de la barre latérale
const activeTab = ref('voie')
const DOMAINES = [
  { id: 'voie', label: 'Voie', icon: 'lucide:train-track' },
  { id: 'ses', label: 'SES', icon: 'lucide:zap' }
]
const domaineBouton = (actif) =>
  actif
    ? 'bg-taupe-600 text-white shadow-[0_10px_22px_-12px_rgb(46_36_30/0.6)] dark:bg-taupe-500'
    : 'bg-taupe-100 text-taupe-700 enabled:hover:bg-taupe-200 enabled:hover:text-taupe-900 dark:bg-taupe-800/50 dark:text-taupe-200 dark:enabled:hover:bg-taupe-700/60 dark:enabled:hover:text-white'

// Légende de la barre latérale, repliée par défaut sur mobile
const legendeOuverte = ref(false)
const LEGENDE_ETATS = [
  { label: 'RLT', bar: 'bg-sky-500 border-sky-700' },
  { label: 'Pré-op', bar: 'bg-lime-500 border-lime-700' },
  { label: 'Externe', bar: 'bg-purple-500 border-purple-700' },
  { label: 'Terminé', bar: 'bg-slate-500 border-slate-700' }
]

// ============================================
// GESTION DU SLIDEOVER D'ATTRIBUTION
// ============================================
const showSlideOver = ref(false)
const selectedUser = ref(null)
const selectedChantierId = ref(null)
const selectedRoleType = ref('principale') // 'principale' ou 'secondaire' pour les RLT

// ============================================
// GESTION DU SLIDEOVER DES ABSENCES
// ============================================
const showAbsenceSlideOver = ref(false)
const absenceUser = ref(null)
const absenceType = ref('conges')
const absenceSemaineDebut = ref(1)
const absenceSemaineFin = ref(1)
const absenceCommentaire = ref('')

const getDomainFromProfil = (profil) => {
  if (!profil) return null

  const profilNum = parseInt(profil)

  if (profilNum >= 10 && profilNum <= 19) return 'voie'
  if (profilNum >= 20 && profilNum <= 29) return 'ses'
  if (profilNum >= 30 && profilNum <= 39) return 'cat'

  return null
}

// Ouvrir le SlideOver pour un utilisateur
const openAssignChantier = (user) => {
  const domain = getDomainFromProfil(user.profil)

  selectedUser.value = { ...user, domain } // domain = 'voie' ou 'ses' ou 'cat'
  selectedChantierId.value = null
  selectedRoleType.value = 'principale'
  showSlideOver.value = true
}

// Fermer le SlideOver
const closeSlideOver = () => {
  showSlideOver.value = false
  selectedUser.value = null
  selectedChantierId.value = null
  selectedRoleType.value = 'principale'
}

// Ouvrir le SlideOver pour ajouter une absence
const openAbsenceSlideOver = (user) => {
  absenceUser.value = user
  absenceType.value = 'conges'
  absenceSemaineDebut.value = getWeekNumber(new Date())
  absenceSemaineFin.value = getWeekNumber(new Date())
  absenceCommentaire.value = ''
  showAbsenceSlideOver.value = true
}

// Fermer le SlideOver des absences
const closeAbsenceSlideOver = () => {
  showAbsenceSlideOver.value = false
  absenceUser.value = null
  absenceType.value = 'conges'
  absenceSemaineDebut.value = 1
  absenceSemaineFin.value = 1
  absenceCommentaire.value = ''
}

// Sauvegarder l'absence
const saveAbsence = async () => {
  if (!absenceUser.value?.email) return

  setLoader(true)
  try {
    await addAbsence(
      absenceUser.value.email,
      absenceType.value,
      absenceSemaineDebut.value,
      selectedYear.value,
      absenceSemaineFin.value,
      selectedYear.value,
      absenceCommentaire.value || null
    )
    closeAbsenceSlideOver()
  } finally {
    setLoader(false)
  }
}

// Options pour les semaines
const weekOptions = computed(() => {
  return Array.from({ length: 53 }, (_, i) => ({
    id: i + 1,
    label: `Semaine ${i + 1}`
  }))
})

// Fonction pour extraire la première date de réalisation d'un chantier
const getFirstDateRea = (chantier) => {
  if (!chantier.date_rea || !Array.isArray(chantier.date_rea) || chantier.date_rea.length === 0) {
    return null
  }
  const firstPeriode = chantier.date_rea[0]
  return firstPeriode?.date_start_travaux ? new Date(firstPeriode.date_start_travaux) : null
}

// Computed pour les options de chantiers disponibles (non déjà attribués à cet utilisateur)
const availableChantierOptions = computed(() => {
  if (!allChantiers.value || !selectedUser.value) return []

  // Récupérer les IDs des chantiers déjà attribués à cet utilisateur
  const existingChantierIds = selectedUser.value.chantiers?.map((c) => c.id) || []

  return (
    allChantiers.value
      .filter((c) => !existingChantierIds.includes(c.id))
      .map((c) => {
        const dateRea = getFirstDateRea(c)
        return {
          id: c.id,
          label: `${c.compte || ''} - ${c.name || 'Sans nom'}`.trim(),
          dateRea
        }
      })
      // Tri par date décroissante (du plus loin dans le futur au passé)
      .sort((a, b) => {
        // Les chantiers sans date vont à la fin
        if (!a.dateRea && !b.dateRea) return 0
        if (!a.dateRea) return 1
        if (!b.dateRea) return -1
        return b.dateRea - a.dateRea // Décroissant
      })
  )
})

// Attribuer le chantier à l'utilisateur
const assignChantierToUser = async () => {
  if (!selectedChantierId.value || !selectedUser.value) return

  setLoader(true)
  try {
    const userId = selectedUser.value.email

    // Agents Pôle IT (Moetx Amont / Chef de projet) → contacts généralités
    if (selectedUser.value.type === 'MOETX' || selectedUser.value.type === 'CDP') {
      const field = selectedUser.value.type === 'MOETX' ? 'moetx_amont' : 'chef_projet'
      await upsertContactsGeneralites(selectedChantierId.value, {
        [`${field}_email`]: userId,
        [`${field}_nom`]: selectedUser.value.fullName
      })
      await getAllContactsGeneralites()
      closeSlideOver()
      return
    }

    // Récupérer les contacts travaux actuels du chantier
    const currentContacts = await getContactsTravaux(selectedChantierId.value)

    // Préparer les données à mettre à jour
    const contactData = currentContacts || {}
    const isRlt = selectedUser.value.type === 'RLT'
    const domain = selectedUser.value.domain // 'voie' ou 'ses'

    if (isRlt) {
      // Pour les RLT
      if (domain === 'voie') {
        if (selectedRoleType.value === 'principale') {
          contactData.rlt_voie_principale = userId
        } else {
          // Ajouter au tableau secondaire sans doublon
          const currentSecondaires = contactData.rlt_voie_secondaire || []
          if (!currentSecondaires.includes(userId)) {
            contactData.rlt_voie_secondaire = [...currentSecondaires, userId]
          }
        }
      } else if (domain === 'ses') {
        // SES
        if (selectedRoleType.value === 'principale') {
          contactData.rlt_ses_principale = userId
        } else {
          const currentSecondaires = contactData.rlt_ses_secondaire || []
          if (!currentSecondaires.includes(userId)) {
            contactData.rlt_ses_secondaire = [...currentSecondaires, userId]
          }
        }
      } else if (domain === 'cat') {
        if (selectedRoleType.value === 'principale') {
          contactData.rlt_cat_principale = userId
        } else {
          const currentSecondaires = contactData.rlt_cat_secondaire || []
          if (!currentSecondaires.includes(userId)) {
            contactData.rlt_cat_secondaire = [...currentSecondaires, userId]
          }
        }
      }
    } else {
      // Pour les KV - toujours dans le tableau
      if (domain === 'voie') {
        const currentKv = contactData.kv_voie || []
        if (!currentKv.includes(userId)) {
          contactData.kv_voie = [...currentKv, userId]
        }
      } else if (domain === 'ses') {
        const currentKv = contactData.kv_ses || []
        if (!currentKv.includes(userId)) {
          contactData.kv_ses = [...currentKv, userId]
        }
      } else if (domain === 'cat') {
        const currentKv = contactData.kv_cat || []
        if (!currentKv.includes(userId)) {
          contactData.kv_cat = [...currentKv, userId]
        }
      }
    }

    // Mettre à jour dans la base de données
    await upsertContactsTravaux(selectedChantierId.value, contactData)

    const roleLabel = `${selectedUser.value.type} ${selectedUser.value.domain} ${selectedRoleType.value}`
    $fetch('/api/email/send', {
      method: 'POST',
      body: {
        type: 'attribution_rlt',
        chantierId: selectedChantierId.value,
        recipientEmail: selectedUser.value.email,
        recipientName: `${selectedUser.value.prenom} ${selectedUser.value.nom}`,
        roleLabel
      }
    }).catch(console.error)

    // Rafraîchir les données
    await getAllContactsTravaux()

    // Fermer le SlideOver
    closeSlideOver()
  } finally {
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

// Semaine en cours : repère dans l'en-tête, et la carte s'ouvre un mois avant elle
const today = new Date()
const currentWeek = getWeekNumber(today)
const isCurrentWeek = (weekNumber) => weekNumber === currentWeek && selectedYear.value === today.getFullYear()
// Teinte de la colonne de la semaine en cours (même valeur que dans les lignes de calendrier V4)
const SEMAINE_EN_COURS = 'bg-secondary-50 dark:bg-secondary-400/10'

const scrollRef = ref(null)
const cornerRef = ref(null)
const scrollToCurrentWeek = () => {
  const el = scrollRef.value
  if (!el || !gridRef.value || !cornerRef.value) return
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
watch(selectedYear, scrollToCurrentWeek, { flush: 'post' })

// Fonction pour obtenir les infos d'un utilisateur
const getUserInfoByEmail = (email) => {
  if (!email || !Array.isArray(users.value)) return null

  const user = users.value.find((u) => u.email?.toLowerCase() === email.toLowerCase())
  if (!user) return null

  return {
    nom: user.nom || '',
    prenom: user.prenom || '',
    email: user.email || '',
    profil: user.profils || '',
    en_formation: user.en_formation ?? false,
    fullName: user.prenom && user.nom ? `${user.prenom} ${user.nom}` : user.email || '-'
  }
}

// Accès aux week-ends
const allWeekends = useState('allWeekends')

// Fonction pour vérifier si une période chevauche l'année sélectionnée
const isPeriodInYear = (startDateStr, endDateStr, year) => {
  if (!startDateStr) return false
  const startDate = new Date(startDateStr)
  const endDate = endDateStr ? new Date(endDateStr) : startDate
  const startYear = startDate.getFullYear()
  const endYear = endDate.getFullYear()
  return startYear <= year && endYear >= year
}

// Fonction pour vérifier si un chantier a des données visibles sur l'année (prépa, réa ou week-end)
const isChantierVisibleForYear = (chantier) => {
  const year = selectedYear.value

  // Vérifier les périodes de réalisation
  const hasReaInYear = chantier.date_rea?.some((p) => isPeriodInYear(p.date_start_travaux, p.date_end_travaux, year))
  if (hasReaInYear) return true

  // Vérifier les périodes de préparation
  const hasPrepaInYear = chantier.date_prepa?.some((p) => isPeriodInYear(p.date_start_prepa, p.date_end_prepa, year))
  if (hasPrepaInYear) return true

  // Vérifier les week-ends
  const weekendsForChantier = allWeekends.value?.filter((w) => w.chantier_id === chantier.id) || []
  const hasWeekendInYear = weekendsForChantier.some((w) => w.annee_debut === year || w.annee_fin === year)
  if (hasWeekendInYear) return true

  return false
}

// Fonction pour obtenir les chantiers d'un RLT/KV
// Tri par première date de réalisation (commun aux vues RLT/KV et Pôle IT)
const sortByFirstRea = (a, b) => {
  const dateA = a.date_rea?.[0]?.date_start_travaux ? new Date(a.date_rea[0].date_start_travaux) : new Date()
  const dateB = b.date_rea?.[0]?.date_start_travaux ? new Date(b.date_rea[0].date_start_travaux) : new Date()
  return dateA - dateB
}

// La page raisonne par utilisateur/site : on filtre les AGENTS par leur site (users.site),
// et on affiche TOUS leurs chantiers attribués (peu importe le site du chantier).
const isUserOfSelectedSite = (user) => user.site === selectedSite.value

const getChantiersForUser = (userEmail, contactTypes) => {
  if (!allContactsTravaux.value || !allChantiers.value) return []

  // Map chantier_id => type trouvé (rlt_voie_principale / rlt_voie_secondaire)
  const chantierFoundInMap = {}

  allContactsTravaux.value.forEach((contact) => {
    contactTypes.forEach((type) => {
      const value = contact[type]

      const isMatch = Array.isArray(value) ? value.includes(userEmail) : value === userEmail

      if (isMatch) {
        // On mémorise le type trouvé
        // (si plusieurs matches possibles, on peut stocker un tableau)
        chantierFoundInMap[contact.chantier_id] = type
      }
    })
  })

  return allChantiers.value
    .filter((chantier) => chantierFoundInMap[chantier.id] && isChantierVisibleForYear(chantier))
    .map((chantier) => ({
      ...chantier,
      foundIn: chantierFoundInMap[chantier.id] // 👈 info clé
    }))
    .sort(sortByFirstRea)
}

// Chantiers liés à un agent Pôle IT via les contacts généralités (Moetx Amont / Chef de projet).
const getChantiersForUserGeneralites = (userEmail, field) => {
  if (!allContactsGeneralites.value || !allChantiers.value) return []

  const chantierIds = new Set(
    allContactsGeneralites.value.filter((c) => c[field] && c[field] === userEmail).map((c) => c.chantier_id)
  )

  return allChantiers.value
    .filter((chantier) => chantierIds.has(chantier.id) && isChantierVisibleForYear(chantier))
    .map((chantier) => ({ ...chantier, foundIn: field }))
    .sort(sortByFirstRea)
}

// Computed pour les RLT Voie avec leurs chantiers
const rltVoieWithChantiers = computed(() => {
  if (!getUsersRltVoie.value) return []

  return getUsersRltVoie.value
    .filter((user) => !user.pre_op && !user.ref_du_rdu && isUserOfSelectedSite(user)) // site + exclure pré-op/RDU
    .map((user) => {
      const userInfo = getUserInfoByEmail(user.email)
      const chantiers = getChantiersForUser(user.email, ['rlt_voie_principale', 'rlt_voie_secondaire'])
      return {
        ...userInfo,
        type: 'RLT',
        chantiers
      }
    })
    .sort((a, b) => (a.nom || '').localeCompare(b.nom || '')) // Tri par nom de famille
})

// Computed pour les KV Voie avec leurs chantiers
const kvVoieWithChantiers = computed(() => {
  if (!getUsersKvVoie.value) return []

  return getUsersKvVoie.value
    .filter((user) => !user.pre_op && !user.ref_du_rdu && isUserOfSelectedSite(user)) // site + exclure pré-op/RDU
    .map((user) => {
      const userInfo = getUserInfoByEmail(user.email)
      const chantiers = getChantiersForUser(user.email, ['kv_voie'])
      return {
        ...userInfo,
        type: 'KV',
        chantiers
      }
    })
    .sort((a, b) => (a.nom || '').localeCompare(b.nom || '')) // Tri par nom de famille
})

// Computed pour les RLT SES avec leurs chantiers
const rltSesWithChantiers = computed(() => {
  if (!getUsersRltSes.value) return []

  return getUsersRltSes.value
    .filter((user) => !user.pre_op && !user.ref_du_rdu && isUserOfSelectedSite(user)) // site + exclure pré-op/RDU
    .map((user) => {
      const userInfo = getUserInfoByEmail(user.email)
      const chantiers = getChantiersForUser(user.email, [
        'rlt_ses_principale',
        'rlt_ses_secondaire',
        'rlt_cat_principale',
        'rlt_cat_secondaire'
      ])
      return {
        ...userInfo,
        type: 'RLT',
        chantiers
      }
    })
    .sort((a, b) => (a.nom || '').localeCompare(b.nom || '')) // Tri par nom de famille
})

// Computed pour les RLT CAT avec leurs chantiers
const rltCatWithChantiers = computed(() => {
  if (!getUsersRltCat.value) return []

  return getUsersRltCat.value
    .filter((user) => !user.pre_op && !user.ref_du_rdu && isUserOfSelectedSite(user)) // site + exclure pré-op/RDU
    .map((user) => {
      const userInfo = getUserInfoByEmail(user.email)
      const chantiers = getChantiersForUser(user.email, ['rlt_cat_principale', 'rlt_cat_secondaire'])
      return {
        ...userInfo,
        type: 'RLT',
        chantiers
      }
    })
    .sort((a, b) => (a.nom || '').localeCompare(b.nom || '')) // Tri par nom de famille
})

// Computed pour les KV SES avec leurs chantiers
const kvSesWithChantiers = computed(() => {
  if (!getUsersKvSes.value) return []

  return getUsersKvSes.value
    .filter((user) => !user.pre_op && !user.ref_du_rdu && isUserOfSelectedSite(user)) // site + exclure pré-op/RDU
    .map((user) => {
      const userInfo = getUserInfoByEmail(user.email)
      const chantiers = getChantiersForUser(user.email, ['kv_ses'])
      return {
        ...userInfo,
        type: 'KV',
        chantiers
      }
    })
    .sort((a, b) => (a.nom || '').localeCompare(b.nom || '')) // Tri par nom de famille
})

// Computed pour les KV CAT avec leurs chantiers

const kvCatWithChantiers = computed(() => {
  if (!getUsersKvCat.value) return []

  return getUsersKvCat.value
    .filter((user) => !user.pre_op && !user.ref_du_rdu && isUserOfSelectedSite(user)) // site + exclure pré-op/RDU
    .map((user) => {
      const userInfo = getUserInfoByEmail(user.email)
      const chantiers = getChantiersForUser(user.email, ['kv_cat'])
      return {
        ...userInfo,
        type: 'KV',
        chantiers
      }
    })
    .sort((a, b) => (a.nom || '').localeCompare(b.nom || '')) // Tri par nom de famille
})

// Données combinées pour l'affichage
const voieData = computed(() => {
  return [...rltVoieWithChantiers.value, ...kvVoieWithChantiers.value]
})

const sesData = computed(() => {
  return [
    ...rltSesWithChantiers.value,
    ...rltCatWithChantiers.value,
    ...kvSesWithChantiers.value,
    ...kvCatWithChantiers.value
  ]
})

// Fonction de filtrage
const filterUsersBySearch = (users) => {
  if (!searchQuery.value.trim()) return users

  const query = searchQuery.value.toLowerCase().trim()

  return users.filter((user) => {
    // Recherche dans le nom de l'utilisateur
    const nameMatch =
      user.nom?.toLowerCase().includes(query) ||
      user.prenom?.toLowerCase().includes(query) ||
      user.fullName?.toLowerCase().includes(query)

    // Recherche dans les noms de chantiers
    const chantierMatch = user.chantiers?.some(
      (chantier) => chantier.name?.toLowerCase().includes(query) || chantier.compte?.toLowerCase().includes(query)
    )

    return nameMatch || chantierMatch
  })
}

const filteredVoieData = computed(() => filterUsersBySearch(voieData.value))
const filteredSesData = computed(() => filterUsersBySearch(sesData.value))

// Grouper les utilisateurs par type et catégorie pour un affichage structuré
const groupUsersByTypeAndCategory = (users) => {
  // Créer un objet pour regrouper par type
  const groupedByType = users.reduce((acc, user) => {
    const type = user.type

    if (!acc[type]) {
      acc[type] = {
        type: type,
        users: []
      }
    }

    acc[type].users.push(user)

    return acc
  }, {})

  return Object.values(groupedByType)
}

const groupedVoieData = computed(() => groupUsersByTypeAndCategory(filteredVoieData.value))
const groupedSesData = computed(() => groupUsersByTypeAndCategory(filteredSesData.value))

// ============================================
// VUE PÔLE IT : Moetx Amont + Chef de projet
// ============================================
const moetxWithChantiers = computed(() => {
  if (!getUsersMoetx.value) return []
  return getUsersMoetx.value
    .filter((user) => !user.pre_op && !user.ref_du_rdu && isUserOfSelectedSite(user))
    .map((user) => ({
      ...getUserInfoByEmail(user.email),
      type: 'MOETX',
      chantiers: getChantiersForUserGeneralites(user.email, 'moetx_amont_email')
    }))
    .sort((a, b) => (a.nom || '').localeCompare(b.nom || ''))
})

const cdpWithChantiers = computed(() => {
  if (!getUsersCdp.value) return []
  return getUsersCdp.value
    .filter((user) => !user.pre_op && !user.ref_du_rdu && isUserOfSelectedSite(user))
    .map((user) => ({
      ...getUserInfoByEmail(user.email),
      type: 'CDP',
      chantiers: getChantiersForUserGeneralites(user.email, 'chef_projet_email')
    }))
    .sort((a, b) => (a.nom || '').localeCompare(b.nom || ''))
})

// Deux groupes affichés directement (pas d'onglet Voie/SES en vue Pôle IT).
const poleITGroups = computed(() => [
  { type: 'MOETX', label: 'Moetx Amont', users: filterUsersBySearch(moetxWithChantiers.value) },
  { type: 'CDP', label: 'Chef de projet', users: filterUsersBySearch(cdpWithChantiers.value) }
])

// Groupes de la vue affichée (Pôle IT, ou domaine Voie / SES) et résumé à côté de l'année (coin du calendrier)
const groupesAffiches = computed(() => {
  if (isPoleITView.value) return poleITGroups.value
  return activeTab.value === 'voie' ? groupedVoieData.value : groupedSesData.value
})
const resumeVue = computed(() => {
  const agents = groupesAffiches.value.flatMap((g) => g.users)
  const nbChantiers = new Set(agents.flatMap((a) => a.chantiers.map((c) => c.id))).size
  return {
    agents: `${agents.length} agent${agents.length > 1 ? 's' : ''}`,
    chantiers: `${nbChantiers} chantier${nbChantiers > 1 ? 's' : ''} attribué${nbChantiers > 1 ? 's' : ''}`
  }
})

// Nombre d'agents par secteur (compteurs de la barre latérale) : agents Pôle IT pour « Pôle IT »,
// RLT et KV (voie, SES, CAT) pour les autres, hors pré-op et RDU comme dans les vues
const nbAgentsParSite = computed(() => {
  const agents = (liste) => (liste.value || []).filter((u) => !u.pre_op && !u.ref_du_rdu)
  const rltKv = [getUsersRltVoie, getUsersKvVoie, getUsersRltSes, getUsersRltCat, getUsersKvSes, getUsersKvCat].flatMap(
    agents
  )
  const poleIT = [getUsersMoetx, getUsersCdp].flatMap(agents)
  const compte = {}
  for (const f of siteFilterOptions.value) {
    const liste = f.id === 'Pôle IT' ? poleIT : rltKv
    compte[f.id] = new Set(liste.filter((u) => u.site === f.id).map((u) => u.email)).size
  }
  return compte
})
const nbAgentsParDomaine = computed(() => ({ voie: filteredVoieData.value.length, ses: filteredSesData.value.length }))

// Libellé du rôle de l'utilisateur sélectionné (fiche d'attribution).
const selectedUserTypeLabel = computed(() => {
  const u = selectedUser.value
  if (!u) return ''
  if (u.type === 'MOETX') return 'Moetx Amont'
  if (u.type === 'CDP') return 'Chef de projet'
  const domainLabel = u.domain === 'voie' ? 'Voie' : u.domain === 'cat' ? 'CAT' : 'SES'
  return `${u.type} ${domainLabel}`
})

// Ouvrir la page d'impression dans un nouvel onglet
const openPrintPage = () => {
  const printUrl = `/calendriers/print/plan-de-charge-rlt?year=${selectedYear.value}&tab=${activeTab.value}`
  window.open(printUrl, '_blank')
}

const deleteChantierFromUser = async (id, foundIn, userEmail) => {
  setLoader(true)
  try {
    // Agents Pôle IT : retrait via les contacts généralités (on vide le champ correspondant)
    if (foundIn === 'moetx_amont_email' || foundIn === 'chef_projet_email') {
      const nomField = foundIn.replace('_email', '_nom')
      const result = await upsertContactsGeneralites(id, { [foundIn]: null, [nomField]: null })
      if (result) await getAllContactsGeneralites()
      return
    }

    const result = await deleteContactTravaux(id, foundIn, userEmail)
    if (result) {
      await getAllContactsTravaux()
    }
  } finally {
    setLoader(false)
  }
}

// Charger les données au montage
onMounted(async () => {
  setLoader(true)
  try {
    await Promise.all([
      getChantiers(),
      getAllUsers(),
      getAllContactsTravaux(),
      getAllContactsGeneralites(),
      getAllWeekends(),
      getAllAbsences(),
      getAttributions()
    ])

    // Site par défaut : le site de l'utilisateur, sinon la vue Pôle IT.
    selectedSite.value = userSite.value && userSite.value !== 'Pôle IT' ? userSite.value : 'Pôle IT'
  } finally {
    setLoader(false)
  }
  await nextTick()
  scrollToCurrentWeek()
})
</script>

<template>
  <AppPageLayout v4>
    <!-- Bandeau : en tête de page sur mobile, avant le panneau -->
    <template #entete>
      <AppPageHero
        title="Planning agent"
        description="Plan de charge annuel des agents : RLT, KV et Pôle IT"
        illustration="planning" />
    </template>

    <!-- ============ Barre latérale : domaine, secteurs, légende (l'année est dans le coin du calendrier) ============ -->
    <template #sidebar>
      <div class="flex flex-col gap-5 pb-6 lg:pt-2">
        <!-- Domaine (RLT et KV) : deux gros boutons taupe. Sans objet pour la vue Pôle IT : ils restent en place,
             grisés, pour que la liste des secteurs ne remonte pas sous le curseur -->
        <div class="grid grid-cols-2 gap-2.5" role="group" aria-label="Domaine">
          <button
            v-for="d in DOMAINES"
            :key="d.id"
            type="button"
            class="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl px-3 py-4 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-taupe-600 disabled:cursor-default disabled:opacity-40"
            :class="domaineBouton(!isPoleITView && activeTab === d.id)"
            :disabled="isPoleITView"
            :aria-pressed="!isPoleITView && activeTab === d.id"
            :title="isPoleITView ? 'Sans objet pour la vue Pôle IT' : undefined"
            @click="activeTab = d.id">
            <Icon :name="d.icon" size="24" />
            <span class="font-traverse text-xl leading-none tracking-[0.03em]">{{ d.label }}</span>
            <span class="text-xs opacity-80">
              {{ nbAgentsParDomaine[d.id] }} agent{{ nbAgentsParDomaine[d.id] > 1 ? 's' : '' }}
            </span>
          </button>
        </div>

        <!-- Secteur affiché : Pôle IT (Moetx Amont, chefs de projet) ou un site (RLT et KV) -->
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
                :name="f.id === 'Pôle IT' ? 'lucide:monitor-cog' : 'lucide:map-pin'"
                size="18"
                class="shrink-0"
                :class="panneauIcone(selectedSite === f.id)" />
              <span class="min-w-0 flex-1 truncate text-sm font-medium">{{ f.label }}</span>
              <span
                class="inline-flex h-5.5 min-w-6.5 shrink-0 items-center justify-center rounded-full px-1.5 text-xs font-bold"
                :class="panneauBadge(selectedSite === f.id)"
                :title="`${nbAgentsParSite[f.id] ?? 0} agent(s)`">
                {{ nbAgentsParSite[f.id] ?? 0 }}
              </span>
            </button>
          </div>
        </nav>

        <!-- Légende : états des chantiers, périodes, week-ends et absences.
             Repliée sur mobile (le panneau passe au-dessus du calendrier), toujours ouverte sur grand écran -->
        <section class="border-rule border-t px-3 pt-4" aria-label="Légende">
          <button
            type="button"
            class="flex w-full cursor-pointer items-center justify-between lg:hidden"
            :aria-expanded="legendeOuverte"
            aria-controls="rlt-legende"
            @click="legendeOuverte = !legendeOuverte">
            <span :class="PANNEAU_TITRE">Légende</span>
            <Icon
              name="lucide:chevron-down"
              size="16"
              class="text-slate-400 transition-transform"
              :class="{ 'rotate-180': legendeOuverte }" />
          </button>
          <p class="hidden pb-2.5 lg:block" :class="PANNEAU_TITRE">Légende</p>
          <div id="rlt-legende" class="max-lg:mt-3" :class="[PANNEAU_RETRAIT, { 'max-lg:hidden': !legendeOuverte }]">
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
            <ul class="text-ink-soft mt-3.5 grid grid-cols-2 gap-x-3 gap-y-2 text-[13px]">
              <li class="flex items-center gap-2">
                <span class="h-2.5 w-5 shrink-0 rounded-xs border border-red-600 bg-red-400" />
                Congés
              </li>
              <li class="flex items-center gap-2">
                <span class="h-2.5 w-5 shrink-0 rounded-xs border border-amber-700 bg-amber-500" />
                Formation
              </li>
            </ul>
          </div>
        </section>
      </div>
    </template>

    <!-- ============ Contenu principal ============ -->
    <template #default>
      <div class="flex min-h-0 flex-1 flex-col gap-4 p-4 lg:px-8 lg:pt-4 lg:pb-4">
        <div class="flex flex-col gap-3 lg:flex-row lg:items-center">
          <AppInputSearch
            v-model="searchQuery"
            boxed
            dense
            class="w-full lg:max-w-sm"
            placeholder="Rechercher un agent ou un chantier…" />
          <AppButtonValidated
            v-if="!isPoleITView"
            type="button"
            theme="outline"
            class="max-lg:hidden lg:ml-auto"
            @click="openPrintPage">
            <template #default>
              <span class="flex items-center gap-2">
                <Icon name="lucide:printer" size="16" />
                Imprimer
              </span>
            </template>
          </AppButtonValidated>
        </div>

        <!-- Calendrier : la carte défile dans les deux sens, en-tête et colonne agent restent figés -->
        <div
          ref="scrollRef"
          class="surface-card min-h-0 flex-1 overflow-auto scroll-smooth rounded-xl max-lg:max-h-[75vh]">
          <div
            ref="gridRef"
            class="grid min-w-[1400px] grid-cols-[var(--col-agent)_repeat(53,minmax(24px,1fr))] [--col-agent:9rem] md:[--col-agent:minmax(340px,auto)]"
            @mouseover="onGridMouseOver"
            @mouseleave="onGridMouseLeave">
            <!-- ===== En-tête figé (2 lignes) ===== -->
            <div class="bg-table-head sticky top-0 z-30 col-span-full row-span-2 grid grid-cols-subgrid">
              <!-- Coin figé : choix de l'année (à la place du titre « Agent »), résumé à droite sur grand écran -->
              <div
                ref="cornerRef"
                class="bg-table-head border-rule sticky left-0 z-40 row-span-2 flex items-center justify-between gap-3 border-r border-b px-2.5 md:px-4">
                <AppYearNav v-model="selectedYear" />
                <div class="text-ink-soft hidden text-right text-[11px] leading-snug md:block">
                  <p>{{ resumeVue.agents }}</p>
                  <p>{{ resumeVue.chantiers }}</p>
                </div>
              </div>

              <!-- Ligne 1 : mois -->
              <div
                v-for="(month, index) in monthsWithColspan"
                :key="'month-' + index"
                :style="{ gridColumn: `span ${month.colspan}` }"
                class="bg-table-head table-head-text border-rule border-b px-1 py-1.5 text-center text-xs"
                :class="{ 'border-l': index > 0 }">
                {{ month.name }}
              </div>

              <!-- Ligne 2 : numéros de semaine (la colonne 1 est prise par le row-span-2) -->
              <div
                v-for="week in weeks"
                :key="'weekh-' + week.number"
                :data-week="week.number"
                class="border-rule flex items-center justify-center border-b py-1 text-[11px] font-semibold tabular-nums"
                :class="isCurrentWeek(week.number) && SEMAINE_EN_COURS">
                <span
                  v-if="isCurrentWeek(week.number)"
                  class="bg-secondary-600 rounded-full px-1.5 py-px text-white"
                  title="Semaine en cours">
                  {{ week.label }}
                </span>
                <span v-else class="text-ink-soft">{{ week.label }}</span>
              </div>
            </div>

            <!-- ===== Groupes d'agents de la vue affichée =====
                 Chaque ligne a ses 53 cases de semaine (vides au besoin) : le surlignage de la colonne survolée
                 ne présente pas de trou. -->
            <template v-for="(group, gIdx) in groupesAffiches" :key="`groupe-${gIdx}`">
              <!-- En-tête de groupe : RLT, KV, Moetx Amont, Chef de projet -->
              <div class="border-rule col-span-full grid grid-cols-subgrid border-t bg-slate-50 dark:bg-white/4">
                <div
                  class="sticky left-0 z-20 flex items-center gap-2 bg-slate-50 px-2.5 py-2 md:px-4 dark:bg-transparent">
                  <span class="table-head-text text-xs">{{ group.label || group.type }}</span>
                  <span
                    class="rounded-full bg-slate-200 px-1.5 text-[11px] font-bold text-slate-600 dark:bg-white/10 dark:text-white/80">
                    {{ group.users.length }}
                  </span>
                </div>
                <div
                  v-for="week in weeks"
                  :key="week.number"
                  :data-week="week.number"
                  class="self-stretch"
                  :class="isCurrentWeek(week.number) && SEMAINE_EN_COURS" />
              </div>

              <template v-for="(user, uIdx) in group.users" :key="`${gIdx}-${user.email || uIdx}`">
                <!-- Ligne de l'agent -->
                <div class="border-rule col-span-full grid grid-cols-subgrid items-center border-t">
                  <div
                    class="bg-card border-rule sticky left-0 z-20 flex items-center gap-2 border-r px-2.5 py-2 md:px-4">
                    <span class="text-ink truncate text-sm font-semibold" :title="`${user.nom} ${user.prenom}`">
                      {{ user.nom }} {{ user.prenom }}
                    </span>
                    <span
                      v-if="user.en_formation"
                      class="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-400/15 dark:text-amber-300"
                      title="En formation">
                      <Icon name="lucide:graduation-cap" size="12" />
                      <span class="max-md:hidden">En formation</span>
                    </span>
                    <!-- Nombre de chantiers et attribution, à droite du nom -->
                    <span class="ml-auto flex shrink-0 items-center gap-2">
                      <span class="text-ink-soft text-xs max-md:hidden">
                        {{ user.chantiers.length }} chantier{{ user.chantiers.length > 1 ? 's' : '' }}
                      </span>
                      <button
                        v-if="canEdit"
                        type="button"
                        class="text-ink-soft hover:text-secondary-700 hover:bg-magenta-50 dark:hover:text-secondary-300 flex size-6 cursor-pointer items-center justify-center rounded-md transition-colors dark:hover:bg-white/8"
                        title="Attribuer un chantier"
                        :aria-label="`Attribuer un chantier à ${user.prenom} ${user.nom}`"
                        @click="openAssignChantier(user)">
                        <Icon name="lucide:plus" size="15" />
                      </button>
                    </span>
                  </div>
                  <div
                    v-for="week in weeks"
                    :key="week.number"
                    :data-week="week.number"
                    class="self-stretch"
                    :class="isCurrentWeek(week.number) && SEMAINE_EN_COURS" />
                </div>

                <!-- Lignes des chantiers -->
                <ChantierTimelineGridRow
                  v-for="chantier in user.chantiers"
                  :key="`${user.email}-${chantier.id}`"
                  v4
                  :chantier="chantier"
                  :weeks="weeks"
                  :user="user"
                  :can-delete="true"
                  :selected-year="selectedYear"
                  :show-contacts="false"
                  @delete-chantier="deleteChantierFromUser" />

                <!-- Aucun chantier attribué -->
                <div v-if="user.chantiers.length === 0" class="col-span-full grid grid-cols-subgrid items-center">
                  <div class="bg-card border-rule sticky left-0 z-20 border-r px-2.5 py-1 md:px-4">
                    <span class="text-ink-soft text-xs italic">Aucun chantier attribué</span>
                  </div>
                  <div
                    v-for="week in weeks"
                    :key="week.number"
                    :data-week="week.number"
                    class="self-stretch"
                    :class="isCurrentWeek(week.number) && SEMAINE_EN_COURS" />
                </div>

                <!-- Absences -->
                <ChantierAbsencesTimelineGridRow
                  v4
                  :user="user"
                  :weeks="weeks"
                  :selected-year="selectedYear"
                  :can-edit="canEdit"
                  @add-absence="openAbsenceSlideOver" />
              </template>

              <!-- Aucun agent dans ce groupe -->
              <div v-if="group.users.length === 0" class="col-span-full grid grid-cols-subgrid items-center">
                <div class="bg-card border-rule sticky left-0 z-20 border-r px-2.5 py-2 md:px-4">
                  <span class="text-ink-soft text-xs italic">Aucun agent</span>
                </div>
                <div
                  v-for="week in weeks"
                  :key="week.number"
                  :data-week="week.number"
                  class="self-stretch"
                  :class="isCurrentWeek(week.number) && SEMAINE_EN_COURS" />
              </div>
            </template>

            <!-- Aucun agent dans la vue -->
            <div
              v-if="groupesAffiches.length === 0"
              class="text-ink-soft col-span-full flex flex-col items-center gap-3 px-6 py-12 text-center">
              <Icon name="lucide:user-x" size="32" class="text-slate-300 dark:text-white/30" />
              <p>Aucun agent {{ activeTab === 'voie' ? 'Voie' : 'SES' }} sur ce secteur</p>
            </div>
          </div>
        </div>
      </div>

      <!-- ============ Fiche : attribuer un chantier ============ -->
      <AppSidePanel
        v-slot="{ fermer }"
        :open="showSlideOver"
        size="md"
        :label="`Attribuer un chantier à ${selectedUser?.fullName ?? ''}`"
        @close="closeSlideOver">
        <header class="panel-brand shrink-0 px-5 py-5 sm:px-7">
          <div class="flex items-center justify-between gap-3">
            <p class="text-xs font-medium text-white/60">Attribuer un chantier</p>
            <button
              type="button"
              class="flex size-8.5 cursor-pointer items-center justify-center rounded-full border border-white/18 text-white transition-colors hover:border-white/35 hover:bg-white/8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              aria-label="Fermer"
              @click="fermer">
              <Icon name="lucide:x" size="18" />
            </button>
          </div>
          <h2 class="mt-2 text-2xl leading-tight font-semibold text-white">{{ selectedUser?.fullName }}</h2>
          <div class="mt-3 flex flex-wrap gap-2 text-xs font-medium text-white/85">
            <span class="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1">
              <Icon name="lucide:user-round" size="13" />
              {{ selectedUserTypeLabel }}
            </span>
          </div>
        </header>

        <div class="dark:bg-night-900 flex min-h-0 flex-1 flex-col bg-slate-100 pt-5 sm:pt-6">
          <div class="flex-1 space-y-5 overflow-y-auto px-4 pb-5 sm:px-7 sm:pb-6">
            <section class="surface-card rounded-xl p-5" aria-labelledby="attribution-chantier">
              <h3 id="attribution-chantier" class="text-ink font-semibold">Chantier</h3>
              <p class="text-ink-soft mt-0.5 mb-4 text-xs">
                Les chantiers déjà attribués à cet agent ne sont pas proposés.
              </p>
              <AppSelect
                v-model="selectedChantierId"
                v4
                :options="availableChantierOptions"
                placeholder="Sélectionner un chantier…"
                search-placeholder="Rechercher un chantier…"
                searchable
                nullable />
            </section>

            <!-- Responsabilité : seulement pour les RLT -->
            <section
              v-if="selectedUser?.type === 'RLT'"
              class="surface-card rounded-xl p-5"
              aria-labelledby="attribution-role">
              <h3 id="attribution-role" class="text-ink font-semibold">Responsabilité</h3>
              <p class="text-ink-soft mt-0.5 mb-4 text-xs">
                Un chantier a un seul RLT principal, et autant de secondaires que nécessaire.
              </p>
              <div class="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-labelledby="attribution-role">
                <button
                  v-for="r in [
                    { id: 'principale', label: 'Principal', aide: 'Responsable du chantier' },
                    { id: 'secondaire', label: 'Secondaire', aide: 'En appui, ou en remplacement' }
                  ]"
                  :key="r.id"
                  type="button"
                  role="radio"
                  :aria-checked="selectedRoleType === r.id"
                  class="flex cursor-pointer items-start gap-3 rounded-lg border px-3.5 py-3 text-left transition-colors"
                  :class="
                    selectedRoleType === r.id
                      ? 'border-magenta-500 ring-magenta-500 bg-white ring-1 dark:bg-white/5'
                      : 'border-slate-300 bg-white hover:border-slate-400 dark:border-white/15 dark:bg-transparent'
                  "
                  @click="selectedRoleType = r.id">
                  <span
                    class="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border"
                    :class="selectedRoleType === r.id ? 'border-magenta-600' : 'border-slate-400'">
                    <span v-if="selectedRoleType === r.id" class="bg-magenta-600 size-2 rounded-full" />
                  </span>
                  <span>
                    <span class="text-ink block text-sm font-medium">{{ r.label }}</span>
                    <span class="text-ink-soft block text-xs">{{ r.aide }}</span>
                  </span>
                </button>
              </div>
            </section>

            <!-- Contrôleurs : pas de choix, le rôle découle du profil -->
            <p
              v-if="selectedUser?.type === 'KV'"
              class="surface-card text-ink-soft flex items-start gap-2.5 rounded-xl p-4 text-sm">
              <Icon name="lucide:info" size="18" class="text-secondary-600 mt-0.5 shrink-0" />
              Le chantier sera attribué en tant que contrôleur KV
              {{ selectedUser?.domain === 'voie' ? 'Voie' : selectedUser?.domain === 'cat' ? 'CAT' : 'SES' }}.
            </p>
          </div>
        </div>

        <footer class="border-rule bg-card flex shrink-0 items-center justify-end gap-2 border-t px-5 py-4 sm:px-7">
          <AppButtonValidated type="button" theme="outline" @click="fermer">
            <template #default>Annuler</template>
          </AppButtonValidated>
          <AppButtonValidated
            type="button"
            theme="brand"
            :validated="!!selectedChantierId"
            @click="assignChantierToUser">
            <template #default>
              <span class="flex items-center gap-2">
                <Icon name="lucide:check" size="16" />
                Attribuer
              </span>
            </template>
          </AppButtonValidated>
        </footer>
      </AppSidePanel>

      <!-- ============ Fiche : ajouter une absence ============ -->
      <AppSidePanel
        v-slot="{ fermer }"
        :open="showAbsenceSlideOver"
        size="md"
        :label="`Ajouter une absence pour ${absenceUser?.fullName ?? ''}`"
        @close="closeAbsenceSlideOver">
        <header class="panel-brand shrink-0 px-5 py-5 sm:px-7">
          <div class="flex items-center justify-between gap-3">
            <p class="text-xs font-medium text-white/60">Ajouter une absence</p>
            <button
              type="button"
              class="flex size-8.5 cursor-pointer items-center justify-center rounded-full border border-white/18 text-white transition-colors hover:border-white/35 hover:bg-white/8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              aria-label="Fermer"
              @click="fermer">
              <Icon name="lucide:x" size="18" />
            </button>
          </div>
          <h2 class="mt-2 text-2xl leading-tight font-semibold text-white">{{ absenceUser?.fullName }}</h2>
          <p class="mt-1 truncate text-sm text-white/70">{{ absenceUser?.email }}</p>
          <div class="mt-3 flex flex-wrap gap-2 text-xs font-medium text-white/85">
            <span class="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1">
              <Icon name="lucide:calendar" size="13" />
              Année {{ selectedYear }}
            </span>
          </div>
        </header>

        <div class="dark:bg-night-900 flex min-h-0 flex-1 flex-col bg-slate-100 pt-5 sm:pt-6">
          <div class="flex-1 space-y-5 overflow-y-auto px-4 pb-5 sm:px-7 sm:pb-6">
            <section class="surface-card rounded-xl p-5" aria-labelledby="absence-type">
              <h3 id="absence-type" class="text-ink mb-4 font-semibold">Type d'absence</h3>
              <div class="grid grid-cols-2 gap-2" role="radiogroup" aria-labelledby="absence-type">
                <button
                  v-for="type in absenceTypes"
                  :key="type.id"
                  type="button"
                  role="radio"
                  :aria-checked="absenceType === type.id"
                  class="flex cursor-pointer items-center gap-2.5 rounded-lg border px-3.5 py-3 text-left transition-colors"
                  :class="
                    absenceType === type.id
                      ? type.id === 'conges'
                        ? 'border-red-500 bg-red-50 ring-1 ring-red-500 dark:bg-red-500/10'
                        : 'border-amber-500 bg-amber-50 ring-1 ring-amber-500 dark:bg-amber-500/10'
                      : 'border-slate-300 bg-white hover:border-slate-400 dark:border-white/15 dark:bg-transparent'
                  "
                  @click="absenceType = type.id">
                  <Icon
                    :name="type.icon"
                    size="18"
                    :class="
                      absenceType === type.id
                        ? type.id === 'conges'
                          ? 'text-red-600'
                          : 'text-amber-600'
                        : 'text-slate-400'
                    " />
                  <span class="text-ink text-sm font-medium">{{ type.label }}</span>
                </button>
              </div>
            </section>

            <section class="surface-card rounded-xl p-5" aria-labelledby="absence-periode">
              <h3 id="absence-periode" class="text-ink font-semibold">Période</h3>
              <p class="text-ink-soft mt-0.5 mb-4 text-xs">Semaines de l'année {{ selectedYear }}.</p>
              <div class="grid gap-3 sm:grid-cols-2">
                <div>
                  <p class="text-ink mb-1.5 text-[13px] font-medium">Première semaine</p>
                  <AppSelect
                    v-model="absenceSemaineDebut"
                    v4
                    :options="weekOptions"
                    placeholder="Semaine…"
                    searchable />
                </div>
                <div>
                  <p class="text-ink mb-1.5 text-[13px] font-medium">Dernière semaine</p>
                  <AppSelect v-model="absenceSemaineFin" v4 :options="weekOptions" placeholder="Semaine…" searchable />
                </div>
              </div>
              <p
                v-if="absenceSemaineDebut && absenceSemaineFin"
                class="mt-3 flex items-center gap-2 text-sm"
                :class="absenceSemaineFin < absenceSemaineDebut ? 'text-red-600 dark:text-red-400' : 'text-ink-soft'">
                <Icon
                  :name="absenceSemaineFin < absenceSemaineDebut ? 'lucide:circle-alert' : 'lucide:calendar-range'"
                  size="16"
                  class="shrink-0" />
                <template v-if="absenceSemaineFin < absenceSemaineDebut">
                  La semaine de fin précède la semaine de début.
                </template>
                <template v-else>
                  S{{ absenceSemaineDebut }} à S{{ absenceSemaineFin }} :
                  {{ absenceSemaineFin - absenceSemaineDebut + 1 }}
                  semaine{{ absenceSemaineFin - absenceSemaineDebut + 1 > 1 ? 's' : '' }}
                </template>
              </p>
            </section>

            <section class="surface-card rounded-xl p-5" aria-labelledby="absence-commentaire">
              <label
                id="absence-commentaire"
                for="absence-commentaire-champ"
                class="text-ink mb-1.5 block font-semibold">
                Commentaire
              </label>
              <input
                id="absence-commentaire-champ"
                v-model="absenceCommentaire"
                type="text"
                class="form-control h-10"
                placeholder="Facultatif : vacances d'été, formation sécurité…" />
            </section>
          </div>
        </div>

        <footer class="border-rule bg-card flex shrink-0 items-center justify-end gap-2 border-t px-5 py-4 sm:px-7">
          <AppButtonValidated type="button" theme="outline" @click="fermer">
            <template #default>Annuler</template>
          </AppButtonValidated>
          <AppButtonValidated
            type="button"
            theme="brand"
            :validated="!!absenceSemaineDebut && !!absenceSemaineFin && absenceSemaineFin >= absenceSemaineDebut"
            @click="saveAbsence">
            <template #default>
              <span class="flex items-center gap-2">
                <Icon name="lucide:check" size="16" />
                Enregistrer
              </span>
            </template>
          </AppButtonValidated>
        </footer>
      </AppSidePanel>
    </template>
  </AppPageLayout>
</template>
