export const useTimelineRowLogic = (props) => {
  const { isWeekendForChantier } = useTimeline()
  const {
    users,
    getUsersRltVoie,
    getUsersRltSes,
    getUsersRltCat,
    getUsersKvVoie,
    getUsersKvSes,
    getUsersKvCat,
    getUsersPreopVoie,
    getUsersPreopSes,
    getUsersLogistique
  } = useUsers()

  const { allContactsTravaux, upsertContactsTravaux } = useContacts()
  const { isAdmin, isSuperAdmin } = useLevelUser()
  const { addToast } = useToast()

  const canEdit = computed(() => isAdmin.value || isSuperAdmin.value)

  // ============================================
  // FONCTIONS UTILITAIRES DATES / SEMAINES
  // ============================================

  const getWeekNumber = (date) => {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() + 4 - (d.getDay() || 7))
    const yearStart = new Date(d.getFullYear(), 0, 1)
    return Math.ceil(((d - yearStart) / 86400000 + 1) / 7)
  }

  const getWeekRange = (week, year) => {
    const jan4 = new Date(year, 0, 4)
    const jan4Day = jan4.getDay() || 7
    const mondayWeek1 = new Date(jan4)
    mondayWeek1.setDate(jan4.getDate() - (jan4Day - 1))

    const monday = new Date(mondayWeek1)
    monday.setDate(mondayWeek1.getDate() + (week - 1) * 7)
    monday.setHours(0, 0, 0, 0)

    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    sunday.setHours(23, 59, 59, 999)

    return { monday, sunday }
  }

  // ============================================
  // FONCTIONS COULEURS
  // ============================================

  const getChantierPrepaColor = (week, selectedYear, chantier) => {
    if (!week || !selectedYear || !chantier) return null
    if (!chantier.date_prepa || !Array.isArray(chantier.date_prepa) || chantier.date_prepa.length === 0) return null

    const { etat } = chantier
    const { monday, sunday } = getWeekRange(week, selectedYear)

    const isInPeriod = chantier.date_prepa.some((periode) => {
      if (!periode.date_start_prepa) return false
      const start = new Date(periode.date_start_prepa)
      start.setHours(0, 0, 0, 0)
      const end = periode.date_end_prepa ? new Date(periode.date_end_prepa) : start
      end.setHours(23, 59, 59, 999)
      return monday <= end && sunday >= start
    })

    if (!isInPeriod) return null

    switch (etat) {
      case 2: return 'bg-lime-500/80 border border-lime-700'
      case 1: return 'bg-purple-500/80 border border-purple-700'
      case 0: return 'bg-sky-500/80 border border-sky-700'
      case -1: return 'bg-slate-500/80 border border-slate-700'
      default: return 'bg-gray-500/80 border border-gray-700'
    }
  }

  const getChantierColor = (week, selectedYear, chantier) => {
    if (!week || !selectedYear || !chantier) return null
    if (!chantier.date_rea || !Array.isArray(chantier.date_rea) || chantier.date_rea.length === 0) return null

    const { etat } = chantier
    const { monday, sunday } = getWeekRange(week, selectedYear)

    const isInPeriod = chantier.date_rea.some((periode) => {
      if (!periode.date_start_travaux) return false
      const start = new Date(periode.date_start_travaux)
      start.setHours(0, 0, 0, 0)
      const end = periode.date_end_travaux ? new Date(periode.date_end_travaux) : start
      end.setHours(23, 59, 59, 999)
      return monday <= end && sunday >= start
    })

    if (!isInPeriod) return null

    switch (etat) {
      case 2: return 'bg-lime-500 border border-lime-700'
      case 1: return 'bg-purple-500 border border-purple-700'
      case 0: return 'bg-sky-500 border border-sky-700'
      case -1: return 'bg-slate-500 border border-slate-700'
      default: return 'bg-gray-500 border border-gray-700'
    }
  }

  const getEtatColor = (etat) => {
    switch (etat) {
      case 2: return 'bg-lime-500'
      case 1: return 'bg-purple-500'
      case 0: return 'bg-sky-500'
      case -1: return 'bg-slate-500'
      default: return 'bg-gray-500'
    }
  }

  // ============================================
  // PRÉ-CALCUL DES COULEURS PAR SEMAINE
  // ============================================

  const weekColorMap = computed(() => {
    const map = new Map()
    const chantier = props.chantier
    const year = props.selectedYear
    if (!chantier || !year) return map

    for (const week of props.weeks) {
      map.set(week.number, {
        prepa: getChantierPrepaColor(week.number, year, chantier),
        rea: getChantierColor(week.number, year, chantier),
        weekend: isWeekendForChantier(week.number, year, chantier.id)
      })
    }
    return map
  })

  // ============================================
  // CONTACTS
  // ============================================

  const getContactName = (chantierId, contactType, isSecondary = false) => {
    if (!Array.isArray(allContactsTravaux.value)) return null
    const contact = allContactsTravaux.value.find((c) => c.chantier_id === chantierId)
    if (!contact) return null
    const contactData = contact[contactType]
    if (isSecondary && Array.isArray(contactData)) {
      return contactData.length ? contactData[0] : null
    }
    return contactData || null
  }

  const getUserInfoByEmail = (email) => {
    if (!email || !Array.isArray(users.value)) return null
    const user = users.value.find((u) => u.email?.toLowerCase() === email.toLowerCase())
    if (!user) return null
    return {
      nom: user.nom || '',
      prenom: user.prenom || '',
      email: user.email || '',
      fullName: user.prenom && user.nom ? `${user.prenom} ${user.nom}` : user.email || '-'
    }
  }

  const getContactInfo = (chantierId, contactType, isSecondary = false) => {
    const contactEmail = getContactName(chantierId, contactType, isSecondary)
    if (!contactEmail) return null
    return getUserInfoByEmail(contactEmail)
  }

  const getAllSecondaryContacts = (chantierId, contactType) => {
    if (!Array.isArray(allContactsTravaux.value)) return []
    const contact = allContactsTravaux.value.find((c) => c.chantier_id === chantierId)
    if (!contact) return []
    const contactData = contact[contactType]
    if (!Array.isArray(contactData) || contactData.length === 0) return []
    return contactData.map((email) => getUserInfoByEmail(email)).filter(Boolean)
  }

  // ============================================
  // ÉDITION RAPIDE DES CONTACTS
  // ============================================

  const showContactEditModal = ref(false)
  const editingContactType = ref(null)
  const editingContactValue = ref(null)

  const contactConfig = {
    rlt_voie_principale: { label: 'RLT Voie - Principal', getUsers: () => getUsersRltVoie.value, type: 'single' },
    rlt_voie_secondaire: { label: 'RLT Voie - Secondaire', getUsers: () => getUsersRltVoie.value, type: 'multi' },
    kv_voie: { label: 'Contrôleur Voie', getUsers: () => getUsersKvVoie.value, type: 'multi' },
    rlt_ses_principale: { label: 'RLT SES - Principal', getUsers: () => getUsersRltSes.value, type: 'single' },
    rlt_ses_secondaire: { label: 'RLT SES - Secondaire', getUsers: () => getUsersRltSes.value, type: 'multi' },
    kv_ses: { label: 'Contrôleur SES', getUsers: () => getUsersKvSes.value, type: 'multi' },
    rlt_cat_principale: { label: 'RLT CAT - Principal', getUsers: () => getUsersRltCat.value, type: 'single' },
    rlt_cat_secondaire: { label: 'RLT CAT - Secondaire', getUsers: () => getUsersRltCat.value, type: 'multi' },
    kv_cat: { label: 'Contrôleur CAT', getUsers: () => getUsersKvCat.value, type: 'multi' },
    preop_voie: { label: 'Pré-op Voie', getUsers: () => getUsersPreopVoie.value, type: 'single' },
    preop_ses: { label: 'Pré-op SES', getUsers: () => getUsersPreopSes.value, type: 'single' },
    logistique: { label: 'Logistique', getUsers: () => getUsersLogistique.value, type: 'single' }
  }

  const editingConfig = computed(() => editingContactType.value ? contactConfig[editingContactType.value] : null)

  const editingUserOptions = computed(() => {
    if (!editingConfig.value) return []
    return editingConfig.value.getUsers().map((u) => ({
      id: u.email,
      label: u.prenom && u.nom ? `${u.prenom} ${u.nom}` : u.email
    }))
  })

  const openContactEdit = (contactType) => {
    if (!canEdit.value) return
    const contact = allContactsTravaux.value.find((c) => c.chantier_id === props.chantier.id)
    const currentValue = contact?.[contactType] ?? null
    editingContactType.value = contactType
    editingContactValue.value = contactConfig[contactType].type === 'multi'
      ? [...(currentValue || [])]
      : currentValue
    showContactEditModal.value = true
  }

  const saveContactEdit = async () => {
    if (!editingContactType.value) return

    const contact = allContactsTravaux.value.find((c) => c.chantier_id === props.chantier.id) || {}
    const config = contactConfig[editingContactType.value]

    const oldValue = contact[editingContactType.value]
    const newValue = editingContactValue.value
    let addedEmails = []

    if (config.type === 'multi') {
      const oldEmails = (oldValue || []).map((e) => e?.toLowerCase())
      addedEmails = (newValue || []).filter((e) => e && !oldEmails.includes(e.toLowerCase()))
    } else {
      if (newValue && newValue !== oldValue) {
        addedEmails = [newValue]
      }
    }

    const updatedData = {
      rlt_voie_principale: contact.rlt_voie_principale || null,
      rlt_voie_secondaire: contact.rlt_voie_secondaire || [],
      rlt_ses_principale: contact.rlt_ses_principale || null,
      rlt_ses_secondaire: contact.rlt_ses_secondaire || [],
      rlt_cat_principale: contact.rlt_cat_principale || null,
      rlt_cat_secondaire: contact.rlt_cat_secondaire || [],
      kv_voie: contact.kv_voie || [],
      kv_ses: contact.kv_ses || [],
      kv_cat: contact.kv_cat || [],
      preop_voie: contact.preop_voie || null,
      preop_ses: contact.preop_ses || null,
      logistique: contact.logistique || null,
      supervisor: contact.supervisor || []
    }

    updatedData[editingContactType.value] = newValue

    const result = await upsertContactsTravaux(props.chantier.id, updatedData)
    if (result) {
      const idx = allContactsTravaux.value.findIndex((c) => c.chantier_id === props.chantier.id)
      if (idx !== -1) {
        allContactsTravaux.value[idx] = result
      } else {
        allContactsTravaux.value.push(result)
      }

      for (const email of addedEmails) {
        $fetch('/api/email/send', {
          method: 'POST',
          body: { type: 'attribution_rlt', chantierId: props.chantier.id, recipientEmail: email }
        }).catch(console.error)
      }
    }

    showContactEditModal.value = false
    editingContactType.value = null
    editingContactValue.value = null
  }

  // ============================================
  // SUPPRESSION
  // ============================================

  const showDeleteModal = ref(false)
  const chantierToDelete = ref(null)

  const deleteModal = (chantier) => {
    if (!chantier) {
      chantierToDelete.value = null
      showDeleteModal.value = false
    } else {
      showDeleteModal.value = !showDeleteModal.value
      chantierToDelete.value = chantier
    }
  }

  return {
    // State
    canEdit,
    showDeleteModal,
    chantierToDelete,
    showContactEditModal,
    editingContactType,
    editingContactValue,
    editingConfig,
    editingUserOptions,

    // Fonctions utilitaires
    getWeekNumber,
    getWeekRange,

    // Couleurs
    getChantierPrepaColor,
    getChantierColor,
    getEtatColor,
    weekColorMap,
    isWeekendForChantier,

    // Contacts
    getContactInfo,
    getAllSecondaryContacts,
    openContactEdit,
    saveContactEdit,

    // Suppression
    deleteModal
  }
}
