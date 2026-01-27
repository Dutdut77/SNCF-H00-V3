<script setup>
definePageMeta({
  requiresAuth: true,
  requiredRole: ''
})

useHead({
  title: 'H00 - Plan de Charge RLT',
  description: 'Vue par RLT des chantiers'
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
  getUsersKvCat
} = useUsers()
const { getAllContactsTravaux, allContactsTravaux, getContactsTravaux, upsertContactsTravaux, deleteContactTravaux } =
  useContacts()
const { setLoader } = useLoader()
const { getAllWeekends } = useTimeline()
const { isAdmin, isSuperAdmin } = useLevelUser()
const { getAllAbsences, addAbsence, absenceTypes } = useAbsences()

// Computed pour savoir si l'utilisateur peut modifier (admin ou superadmin)
const canEdit = computed(() => isAdmin.value || isSuperAdmin.value)

// Accès direct au state partagé des chantiers
const allChantiers = useState('allChantiers')
const searchQuery = ref('')
// État réactif pour l'année sélectionnée
const selectedYear = ref(new Date().getFullYear())
const hoveredWeek = ref(null)

// Onglet actif (voie ou ses)
const activeTab = ref('voie')

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
    // Récupérer les contacts travaux actuels du chantier
    const currentContacts = await getContactsTravaux(selectedChantierId.value)

    // Préparer les données à mettre à jour
    const contactData = currentContacts || {}
    const userId = selectedUser.value.email
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

// Navigation par année
const previousYear = () => {
  selectedYear.value--
}

const nextYear = () => {
  selectedYear.value++
}

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
    .sort((a, b) => {
      const dateA = a.date_rea?.[0]?.date_start_travaux ? new Date(a.date_rea[0].date_start_travaux) : new Date()

      const dateB = b.date_rea?.[0]?.date_start_travaux ? new Date(b.date_rea[0].date_start_travaux) : new Date()

      return dateA - dateB
    })
}

// Computed pour les RLT Voie avec leurs chantiers
const rltVoieWithChantiers = computed(() => {
  if (!getUsersRltVoie.value) return []

  return getUsersRltVoie.value
    .filter((user) => !user.pre_op && !user.ref_du_rdu) // Exclure pré-op et RDU
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
    .filter((user) => !user.pre_op && !user.ref_du_rdu) // Exclure pré-op et RDU
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
    .filter((user) => !user.pre_op && !user.ref_du_rdu) // Exclure pré-op et RDU
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
    .filter((user) => !user.pre_op && !user.ref_du_rdu) // Exclure pré-op et RDU
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
    .filter((user) => !user.pre_op && !user.ref_du_rdu) // Exclure pré-op et RDU
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
    .filter((user) => !user.pre_op && !user.ref_du_rdu) // Exclure pré-op et RDU
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

// Ouvrir la page d'impression dans un nouvel onglet
const openPrintPage = () => {
  const printUrl = `/calendriers/print/plan-de-charge-rlt?year=${selectedYear.value}&tab=${activeTab.value}`
  window.open(printUrl, '_blank')
}

const deleteChantierFromUser = async (id, foundIn, userEmail) => {
  setLoader(true)
  try {
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
    await Promise.all([getChantiers(), getAllUsers(), getAllContactsTravaux(), getAllWeekends(), getAllAbsences()])
  } finally {
    setLoader(false)
  }
})
</script>

<template>
  <div class="flex w-full flex-col gap-4 overflow-hidden p-4 lg:h-full lg:px-4 lg:py-0 lg:pt-4">
    <!-- Header avec titre et navigation -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <AppTitleMain title="Planning RLT / Contrôleurs"
        description="Vue des chantiers par responsable RLT et contrôleurs" />
    </div>

    <!-- Onglets + Légende -->
    <div class="flex flex-col items-center justify-between gap-4 lg:flex-row">
      <!-- Onglets Voie / SES -->
      <div class="flex gap-4 rounded-lg">
        <button type="button" @click="activeTab = 'voie'"
          class="flex w-34 items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-all"
          :class="activeTab === 'voie'
            ? 'border-purple-800 bg-purple-500 text-white shadow-sm'
            : 'border-gray-300 bg-gray-100 text-gray-600 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:text-white'
            ">
          <Icon name="lucide:train-track" size="18" />
          Voie
        </button>
        <button type="button" @click="activeTab = 'ses'"
          class="flex w-34 items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-all"
          :class="activeTab === 'ses'
            ? 'border-blue-800 bg-blue-500 text-white shadow-sm'
            : 'border-gray-300 bg-gray-100 text-gray-600 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:text-white'
            ">
          <Icon name="lucide:zap" size="18" />
          SES
        </button>
      </div>

      <!-- Légende -->
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
          <div class="rounded-md border border-red-600 bg-red-400 px-2 py-1 text-xs font-bold text-white">Congés</div>
          <div class="rounded-md border border-amber-700 bg-amber-500 px-2 py-1 text-xs font-bold text-white">
            Formation
          </div>
        </div>
      </div>

      <!-- Placeholder pour alignement -->
      <div class="w-44"></div>
    </div>
    <div class="flex justify-between">
      <div class="flex h-fit w-full justify-center lg:justify-start">
        <AppInputSearch v-model="searchQuery" class="h-fit w-full lg:max-w-sm" placeholder="Recherche ..." />
      </div>
      <div class="hidden border-gray-200 lg:flex lg:items-center lg:justify-center">
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
              class="bg-primary-50 border-primary-200 left-0 z-40 mx-auto min-w-[280px] border-r border-b px-3 py-2 text-left text-[10px] font-semibold tracking-wider text-gray-600 uppercase lg:sticky">
              <!-- Navigation par année -->
              <div class="flex items-center justify-center">
                <button @click="previousYear"
                  class="flex cursor-pointer items-center rounded-l-lg px-2 text-gray-600 transition-colors hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700"
                  title="Année précédente">
                  <Icon name="lucide:chevron-left" size="18" />
                </button>

                <span class="px-2 text-base font-semibold text-gray-700 dark:text-white">
                  {{ selectedYear }}
                </span>

                <button @click="nextYear"
                  class="flex cursor-pointer items-center rounded-r-lg px-2 text-gray-600 transition-colors hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700"
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
          </tr>
          <!-- Ligne des semaines -->
          <tr class="bg-primary-50 border-primary-200 border-b">
            <!-- Colonnes semaines -->
            <th v-for="week in weeks" :key="week.number"
              class="min-w-[24px] border-b border-gray-200 px-0 text-center text-sm font-medium text-gray-500 transition-colors dark:border-gray-700 dark:text-gray-400"
              :class="{
                'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-semibold':
                  week.number === getWeekNumber(new Date()) && selectedYear === new Date().getFullYear(),
                'bg-gray-200 dark:bg-gray-700/30': hoveredWeek === week.number
              }" @mouseenter="hoveredWeek = week.number" @mouseleave="hoveredWeek = null">
              {{ week.label }}
            </th>
          </tr>
        </thead>

        <!-- Corps du tableau - Vue VOIE -->
        <tbody v-if="activeTab === 'voie'" class="divide-y divide-gray-100 dark:divide-gray-700/50">
          <template v-for="(group, index) in groupedVoieData" :key="`voie-${index}`">
            <!-- En-tête de section -->
            <tr class="border-t-2" :class="group.type === 'RLT'
              ? 'border-t-purple-400 bg-purple-100 dark:border-t-purple-600 dark:bg-purple-500'
              : 'border-t-fuchsia-400 bg-fuchsia-100 dark:border-t-fuchsia-600 dark:bg-fuchsia-500'
              ">
              <td class="border-primary-200 left-0 z-20 px-3 py-2 lg:sticky" :class="group.type === 'RLT' ? 'bg-purple-100 dark:bg-purple-500' : 'bg-fuchsia-100 dark:bg-fuchsia-500'
                ">
                <span class="text-sm font-bold tracking-wide uppercase" :class="group.type === 'RLT'
                  ? 'text-purple-700 dark:text-purple-100'
                  : 'text-fuchsia-700 dark:text-fuchsia-100'
                  ">
                  {{ group.type }}
                </span>
              </td>
              <td :colspan="53"></td>
            </tr>

            <!-- Utilisateurs du groupe -->
            <template v-for="(user, index) in group.users" :key="`voie-user-${index}`">
              <!-- Ligne du responsable -->
              <tr>
                <td class="bg-primary-50 border-primary-200 left-0 z-20 border-r px-3 py-2 lg:sticky">
                  <div class="flex items-center gap-3">
                    <span class="text-sm font-semibold text-gray-800 dark:text-white">
                      {{ user.nom }} {{ user.prenom }}
                    </span>
                    <button v-if="canEdit" type="button" @click="openAssignChantier(user)"
                      class="text-primary-800 ml-auto cursor-pointer duration-300"
                      :class="group.type === 'RLT' ? 'hover:text-purple-600' : 'hover:text-fuchsia-600'"
                      title="Attribuer un chantier">
                      <Icon name="lucide:plus" size="14" />
                    </button>
                  </div>
                </td>
                <td :colspan="53" class="text-end">
                  <span class="text-primary-600 mr-2 text-xs italic">
                    {{ user.chantiers.length }} chantier{{ user.chantiers.length > 1 ? 's' : '' }}
                  </span>
                </td>
              </tr>

              <!-- Lignes des chantiers -->
              <ChantierTimelineRow v-for="chantier in user.chantiers" :key="`${user.email}-${chantier.id}`"
                :chantier="chantier" :weeks="weeks" :user="user" :can-delete="true" :selected-year="selectedYear"
                :hovered-week="hoveredWeek" :show-contacts="false" @delete-chantier="deleteChantierFromUser"
                @week-hover="hoveredWeek = $event" @week-leave="hoveredWeek = null" />

              <!-- Ligne si aucun chantier attribué -->
              <tr v-if="user.chantiers.length === 0" class="bg-primary50">
                <td class="border-primary-200 bg-primary-50 left-0 z-20 border-r px-3 pl-6 lg:sticky">
                  <span class="text-xs text-gray-400 italic dark:text-gray-500">Aucun chantier attribué</span>
                </td>
                <td :colspan="53"></td>
              </tr>

              <!-- Ligne des absences -->
              <ChantierAbsencesTimelineRow :user="user" :weeks="weeks" :selected-year="selectedYear"
                :hovered-week="hoveredWeek" :can-edit="canEdit" @add-absence="openAbsenceSlideOver"
                @week-hover="hoveredWeek = $event" @week-leave="hoveredWeek = null" />
            </template>
          </template>

          <!-- Message si aucun responsable -->
          <tr v-if="groupedVoieData.length === 0">
            <td colspan="54" class="px-6 py-12 text-center">
              <div class="flex flex-col items-center gap-3">
                <Icon name="lucide:user-x" size="32" class="text-primary-300" />
                <p class="text-gray-500 dark:text-gray-400">Aucun RLT/KV Voie disponible</p>
              </div>
            </td>
          </tr>
        </tbody>

        <!-- Corps du tableau - Vue SES -->
        <tbody v-if="activeTab === 'ses'" class="divide-y divide-gray-100 dark:divide-gray-700/50">
          <template v-for="(group, index) in groupedSesData" :key="`ses-group-${index}`">
            <!-- En-tête de section -->
            <tr class="border-t-2" :class="group.type === 'RLT'
              ? 'border-t-blue-400 bg-blue-100 dark:border-t-blue-600 dark:bg-blue-500'
              : 'border-t-indigo-400 bg-indigo-100 dark:border-t-indigo-600 dark:bg-indigo-500'
              ">
              <td class="left-0 z-20 px-3 py-2 lg:sticky"
                :class="group.type === 'RLT' ? 'bg-blue-100 dark:bg-blue-500' : 'bg-indigo-100 dark:bg-indigo-500'">
                <span class="text-sm font-bold tracking-wide uppercase" :class="group.type === 'RLT' ? 'text-blue-700 dark:text-blue-100' : 'text-indigo-700 dark:text-indigo-100'
                  ">
                  {{ group.type }}
                </span>
              </td>
              <td :colspan="53"></td>
            </tr>

            <!-- Utilisateurs du groupe -->
            <template v-for="(user, index) in group.users" :key="`ses-user-${index}`">
              <!-- Ligne du responsable -->
              <tr :class="group.type === 'RLT' ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'bg-indigo-50/50 dark:bg-indigo-900/10'
                ">
                <td class="bg-primary-50 border-primary-200 left-0 z-20 border-r px-3 py-2 lg:sticky">
                  <div class="flex items-center gap-3">
                    <span class="text-primary-800 text-sm font-semibold">{{ user.nom }} {{ user.prenom }}</span>
                    <button v-if="canEdit" type="button" @click="openAssignChantier(user)"
                      class="text-primary-800 ml-auto cursor-pointer duration-300"
                      :class="group.type === 'RLT' ? 'hover:text-blue-600' : 'hover:text-indigo-600'"
                      title="Attribuer un chantier">
                      <Icon name="lucide:plus" size="14" />
                    </button>
                  </div>
                </td>
                <td :colspan="53" class="bg-primary-50 text-end">
                  <span class="text-primary-600 mr-2 text-xs italic">
                    {{ user.chantiers.length }} chantier{{ user.chantiers.length > 1 ? 's' : '' }}
                  </span>
                </td>
              </tr>

              <!-- Lignes des chantiers -->
              <ChantierTimelineRow v-for="chantier in user.chantiers" :key="`${user.email}-${chantier.id}`"
                :chantier="chantier" :weeks="weeks" :selected-year="selectedYear" :hovered-week="hoveredWeek"
                :user="user" :can-delete="true" :show-contacts="false" @delete-chantier="deleteChantierFromUser"
                @week-hover="hoveredWeek = $event" @week-leave="hoveredWeek = null" />

              <!-- Ligne si aucun chantier attribué -->
              <tr v-if="user.chantiers.length === 0" class="bg-gray-50/50 dark:bg-gray-800/30">
                <td
                  class="left-0 z-20 border-r border-gray-200 bg-gray-50/50 px-3 pl-6 lg:sticky dark:border-gray-700 dark:bg-gray-800/30">
                  <span class="text-xs text-gray-400 italic dark:text-gray-500">Aucun chantier attribué</span>
                </td>
                <td :colspan="53"></td>
              </tr>

              <!-- Ligne des absences -->
              <ChantierAbsencesTimelineRow :user="user" :weeks="weeks" :selected-year="selectedYear"
                :hovered-week="hoveredWeek" :can-edit="canEdit" @add-absence="openAbsenceSlideOver"
                @week-hover="hoveredWeek = $event" @week-leave="hoveredWeek = null" />
            </template>
          </template>

          <!-- Message si aucun responsable -->
          <tr v-if="groupedSesData.length === 0">
            <td colspan="54" class="px-6 py-12 text-center">
              <div class="flex flex-col items-center gap-3">
                <Icon name="lucide:user-x" size="32" class="text-gray-300 dark:text-gray-600" />
                <p class="text-gray-500 dark:text-gray-400">Aucun RLT/KV SES disponible</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- SlideOver d'attribution de chantier -->
    <AppSlideOver :side-modal="showSlideOver" :close-side-modal="closeSlideOver">
      <AppSlideOverContent v-if="showSlideOver" :close-side-modal="closeSlideOver">
        <template #header>
          <h2 class="text-xl font-bold text-gray-800 dark:text-white">Attribuer un chantier</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Attribuer un chantier à
            <span class="font-semibold">{{ selectedUser?.fullName }}</span>
          </p>
        </template>

        <template #default>
          <div class="flex flex-col gap-6">
            <!-- Info utilisateur -->
            <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
              <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold" :class="selectedUser?.type === 'RLT'
                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300'
                  : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300'
                  ">
                  {{ selectedUser?.prenom?.[0] || '' }}{{ selectedUser?.nom?.[0] || '' }}
                </div>
                <div>
                  <p class="font-semibold text-gray-800 dark:text-white">{{ selectedUser?.fullName }}</p>
                  <div class="flex gap-1">
                    <span class="text-sm font-medium">
                      {{ selectedUser?.type }}
                    </span>
                    <span class="text-sm font-medium">
                      {{ selectedUser?.domain === 'voie' ? 'Voie' : 'SES' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Sélection du chantier -->
            <AppSelect v-model="selectedChantierId" :options="availableChantierOptions" title="Chantier à attribuer"
              placeholder="Sélectionner un chantier..." search-placeholder="Rechercher un chantier..." searchable
              nullable />

            <!-- Choix du type de rôle (seulement pour RLT) -->
            <div v-if="selectedUser?.type === 'RLT'" class="flex flex-col gap-3">
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Type de responsabilité</label>
              <div class="flex gap-4">
                <label class="flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-3 transition-all" :class="selectedRoleType === 'principale'
                  ? 'border-purple-500 bg-purple-50 dark:border-purple-400 dark:bg-purple-900/30'
                  : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                  ">
                  <input v-model="selectedRoleType" type="radio" name="roleType" value="principale"
                    class="text-purple-500 focus:ring-purple-500" />
                  <div>
                    <span class="font-medium text-gray-800 dark:text-white">Principale</span>
                    <p class="text-xs text-gray-500 dark:text-gray-400">Responsable principal du chantier</p>
                  </div>
                </label>
                <label class="flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-3 transition-all" :class="selectedRoleType === 'secondaire'
                  ? 'border-purple-500 bg-purple-50 dark:border-purple-400 dark:bg-purple-900/30'
                  : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                  ">
                  <input v-model="selectedRoleType" type="radio" name="roleType" value="secondaire"
                    class="text-purple-500 focus:ring-purple-500" />
                  <div>
                    <span class="font-medium text-gray-800 dark:text-white">Secondaire</span>
                    <p class="text-xs text-gray-500 dark:text-gray-400">Responsable secondaire / backup</p>
                  </div>
                </label>
              </div>
            </div>

            <!-- Info pour KV -->
            <div v-if="selectedUser?.type === 'KV'"
              class="rounded-lg border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-800 dark:bg-indigo-900/30">
              <div class="flex items-start gap-3">
                <Icon name="lucide:info" size="20" class="mt-0.5 text-indigo-500" />
                <p class="text-sm text-indigo-700 dark:text-indigo-300">
                  Le chantier sera attribué en tant que contrôleur KV
                  {{ selectedUser?.domain === 'voie' ? 'Voie' : 'SES' }}.
                </p>
              </div>
            </div>
          </div>
        </template>

        <template #footer>
          <div class="flex justify-end gap-3">
            <button type="button" @click="closeSlideOver"
              class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">
              Annuler
            </button>
            <button type="button" @click="assignChantierToUser" :disabled="!selectedChantierId"
              class="rounded-lg bg-purple-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-600 disabled:cursor-not-allowed disabled:opacity-50">
              <Icon name="lucide:check" size="16" class="mr-1 inline" />
              Attribuer
            </button>
          </div>
        </template>
      </AppSlideOverContent>
    </AppSlideOver>

    <!-- SlideOver d'ajout d'absence -->
    <AppSlideOver :side-modal="showAbsenceSlideOver" :close-side-modal="closeAbsenceSlideOver">
      <AppSlideOverContent v-if="showAbsenceSlideOver" :close-side-modal="closeAbsenceSlideOver">
        <template #header>
          <h2 class="text-xl font-bold text-gray-800 dark:text-white">Ajouter une absence</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Congés ou formation pour
            <span class="font-semibold">{{ absenceUser?.fullName }}</span>
          </p>
        </template>

        <template #default>
          <div class="flex flex-col gap-6">
            <!-- Info utilisateur -->
            <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
              <div class="flex items-center gap-3">
                <div
                  class="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                  {{ absenceUser?.prenom?.[0] || '' }}{{ absenceUser?.nom?.[0] || '' }}
                </div>
                <div>
                  <p class="font-semibold text-gray-800 dark:text-white">{{ absenceUser?.fullName }}</p>
                  <p class="text-sm text-gray-500 dark:text-gray-400">{{ absenceUser?.email }}</p>
                </div>
              </div>
            </div>

            <!-- Type d'absence -->
            <div class="flex flex-col gap-3">
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Type d'absence</label>
              <div class="flex gap-4">
                <label v-for="type in absenceTypes" :key="type.id"
                  class="flex flex-1 cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-all"
                  :class="absenceType === type.id
                    ? type.id === 'conges'
                      ? 'border-red-500 bg-red-50 dark:border-red-400 dark:bg-red-900/30'
                      : 'border-amber-500 bg-amber-50 dark:border-amber-400 dark:bg-amber-900/30'
                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                    ">
                  <input v-model="absenceType" type="radio" name="absenceType" :value="type.id" class="hidden" />
                  <Icon :name="type.icon" size="20" :class="absenceType === type.id
                    ? type.id === 'conges'
                      ? 'text-red-600'
                      : 'text-amber-600'
                    : 'text-gray-400'
                    " />
                  <span class="font-medium" :class="absenceType === type.id ? 'text-gray-800 dark:text-white' : 'text-gray-600 dark:text-gray-400'
                    ">
                    {{ type.label }}
                  </span>
                </label>
              </div>
            </div>

            <!-- Année de référence -->
            <div class="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/30">
              <div class="flex items-center gap-2">
                <Icon name="lucide:calendar" size="18" class="text-blue-600" />
                <span class="text-sm font-medium text-blue-700 dark:text-blue-300">Année : {{ selectedYear }}</span>
              </div>
            </div>

            <!-- Semaine de début -->
            <AppSelect v-model="absenceSemaineDebut" :options="weekOptions" title="Semaine de début"
              placeholder="Sélectionner une semaine..." searchable />

            <!-- Semaine de fin -->
            <AppSelect v-model="absenceSemaineFin" :options="weekOptions" title="Semaine de fin"
              placeholder="Sélectionner une semaine..." searchable />

            <!-- Aperçu de la période -->
            <div v-if="absenceSemaineDebut && absenceSemaineFin" class="rounded-lg border p-4" :class="absenceType === 'conges'
              ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/30'
              : 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/30'
              ">
              <div class="flex items-center gap-2">
                <Icon :name="absenceType === 'conges' ? 'lucide:palm-tree' : 'lucide:graduation-cap'" size="18"
                  :class="absenceType === 'conges' ? 'text-red-600' : 'text-amber-600'" />
                <span class="text-sm font-medium" :class="absenceType === 'conges' ? 'text-red-700 dark:text-red-300' : 'text-amber-700 dark:text-amber-300'
                  ">
                  S{{ absenceSemaineDebut }} à S{{ absenceSemaineFin }} / {{ selectedYear }}
                  <span class="font-normal">
                    ({{ Math.abs(absenceSemaineFin - absenceSemaineDebut) + 1 }} semaine{{
                      Math.abs(absenceSemaineFin - absenceSemaineDebut) + 1 > 1 ? 's' : ''
                    }})
                  </span>
                </span>
              </div>
            </div>

            <!-- Commentaire optionnel -->
            <AppInput v-model="absenceCommentaire" title="Commentaire (optionnel)"
              placeholder="Ex: Vacances été, Formation sécurité..." />
          </div>
        </template>

        <template #footer>
          <div class="flex justify-end gap-3">
            <button type="button" @click="closeAbsenceSlideOver"
              class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">
              Annuler
            </button>
            <button type="button" @click="saveAbsence"
              :disabled="!absenceSemaineDebut || !absenceSemaineFin || absenceSemaineFin < absenceSemaineDebut"
              class="rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              :class="absenceType === 'conges' ? 'bg-red-500 hover:bg-red-600' : 'bg-amber-500 hover:bg-amber-600'">
              <Icon name="lucide:check" size="16" class="mr-1 inline" />
              Enregistrer
            </button>
          </div>
        </template>
      </AppSlideOverContent>
    </AppSlideOver>
  </div>
</template>

<style scoped>
.overflow-auto {
  scroll-behavior: smooth;
}
</style>
