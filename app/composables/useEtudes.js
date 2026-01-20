export const useEtudes = () => {
  const supabase = useSupabaseClient()
  const { addToast } = useToast()

  // ============================================
  // DOCUMENTS D'EXÉCUTION (DEX)
  // ============================================

  // Récupérer tous les DEX d'un chantier
  const getDexByChantier = async (chantierId) => {
    try {
      const { data, error } = await supabase
        .from('chantier_dex')
        .select('*')
        .eq('id_chantier', chantierId)
        .order('indice', { ascending: true })

      if (error) throw error
      return data || []
    } catch (err) {
      console.error('Erreur lors du chargement des DEX:', err)
      addToast({
        title: 'Erreur',
        message: err.message || "Impossible de charger les documents d'exécution",
        type: 'Error'
      })
      return []
    }
  }

  // Ajouter un DEX
  const addDex = async (chantierId, dexData) => {
    try {
      const { data, error } = await supabase
        .from('chantier_dex')
        .insert({
          id_chantier: chantierId,
          indice: dexData.indice,
          titre: dexData.titre || null,
          date_prevu: dexData.date_prevu || [],
          date_mes: dexData.date_mes || null,
          // date_demande: dexData.date_demande || null,
          date_recu: dexData.date_recu || null,
          observation: dexData.observation || null
        })
        .select()
        .single()

      if (error) throw error

      addToast({
        title: 'Document ajouté',
        message: "Document d'exécution ajouté avec succès",
        type: 'Success'
      })

      return data
    } catch (err) {
      console.error("Erreur lors de l'ajout du DEX:", err)
      addToast({
        title: 'Erreur',
        message: err.message || "Impossible d'ajouter le document",
        type: 'Error'
      })
      return null
    }
  }

  // Mettre à jour un DEX
  const updateDex = async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('chantier_dex')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      addToast({
        title: 'Document modifié',
        message: 'Modifications enregistrées avec succès',
        type: 'Success'
      })

      return data
    } catch (err) {
      console.error('Erreur lors de la modification du DEX:', err)
      addToast({
        title: 'Erreur',
        message: err.message || 'Impossible de modifier le document',
        type: 'Error'
      })
      return null
    }
  }

  // Supprimer un DEX
  const deleteDex = async (id) => {
    try {
      const { error } = await supabase.from('chantier_dex').delete().eq('id', id)

      if (error) throw error

      addToast({
        title: 'Document supprimé',
        message: 'Le document a été supprimé avec succès',
        type: 'Success'
      })

      return true
    } catch (err) {
      console.error('Erreur lors de la suppression du DEX:', err)
      addToast({
        title: 'Erreur',
        message: err.message || 'Impossible de supprimer le document',
        type: 'Error'
      })
      return false
    }
  }

  // ============================================
  // PLANS TECHNIQUES (PT)
  // ============================================

  // Récupérer tous les PT d'un chantier
  const getPtByChantier = async (chantierId) => {
    try {
      const { data, error } = await supabase
        .from('chantier_pt')
        .select('*')
        .eq('id_chantier', chantierId)
        .order('indice', { ascending: true })

      if (error) throw error
      return data || []
    } catch (err) {
      console.error('Erreur lors du chargement des PT:', err)
      addToast({
        title: 'Erreur',
        message: err.message || 'Impossible de charger les plans techniques',
        type: 'Error'
      })
      return []
    }
  }

  // Ajouter un PT
  const addPt = async (chantierId, ptData) => {
    try {
      const { data, error } = await supabase
        .from('chantier_pt')
        .insert({
          id_chantier: chantierId,
          indice: ptData.indice,
          titre: ptData.titre || null,
          date_prevu: ptData.date_prevu || [],
          date_mes: ptData.date_mes || null,
          date_recu: ptData.date_recu || null,
          observation: ptData.observation || null
        })
        .select()
        .single()

      if (error) throw error

      addToast({
        title: 'Plan ajouté',
        message: 'Plan technique ajouté avec succès',
        type: 'Success'
      })

      return data
    } catch (err) {
      console.error("Erreur lors de l'ajout du PT:", err)
      addToast({
        title: 'Erreur',
        message: err.message || "Impossible d'ajouter le plan",
        type: 'Error'
      })
      return null
    }
  }

  // Mettre à jour un PT
  const updatePt = async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('chantier_pt')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      addToast({
        title: 'Plan modifié',
        message: 'Modifications enregistrées avec succès',
        type: 'Success'
      })

      return data
    } catch (err) {
      console.error('Erreur lors de la modification du PT:', err)
      addToast({
        title: 'Erreur',
        message: err.message || 'Impossible de modifier le plan',
        type: 'Error'
      })
      return null
    }
  }

  // Supprimer un PT
  const deletePt = async (id) => {
    try {
      const { error } = await supabase.from('chantier_pt').delete().eq('id', id)

      if (error) throw error

      addToast({
        title: 'Plan supprimé',
        message: 'Le plan a été supprimé avec succès',
        type: 'Success'
      })

      return true
    } catch (err) {
      console.error('Erreur lors de la suppression du PT:', err)
      addToast({
        title: 'Erreur',
        message: err.message || 'Impossible de supprimer le plan',
        type: 'Error'
      })
      return false
    }
  }

  // ============================================
  // UTILITAIRES DE STATUT
  // ============================================

  // Calculer le statut d'un document DEX basé sur les dates
  // Logique :
  // - En attente : aujourd'hui < dernière date prévue ET aujourd'hui < date RC
  // - Attention : aujourd'hui > dernière date prévue MAIS aujourd'hui < date RC
  // - En retard : aujourd'hui >= date RC
  // - Reçu : date_recu renseignée (avec indication du stade au moment de la réception)
  const getDocumentStatus = (doc, isDex = false) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Calculer la date RC (2 mois avant MES) si disponible
    let dateRc = null
    if (doc.date_mes) {
      dateRc = new Date(doc.date_mes)
      dateRc.setMonth(dateRc.getMonth() - 2)
      dateRc.setHours(0, 0, 0, 0)
    }

    // Trouver la dernière date prévue
    let lastDatePrevu = null
    if (doc.date_prevu && doc.date_prevu.length > 0) {
      const sortedDates = [...doc.date_prevu].sort((a, b) => new Date(b) - new Date(a))
      lastDatePrevu = new Date(sortedDates[0])
      lastDatePrevu.setHours(0, 0, 0, 0)
    }

    // Fonction interne pour calculer le statut sans tenir compte de date_recu
    const calculateRawStatus = (referenceDate) => {
      const refDate = new Date(referenceDate)
      refDate.setHours(0, 0, 0, 0)

      // Si on a dépassé la date RC -> En retard
      if (isDex && dateRc && refDate >= dateRc) {
        return {
          status: 'overdue',
          label: 'En retard',
          color: 'red',
          icon: 'lucide:alert-circle',
          priority: 3
        }
      }

      // Si on a dépassé la dernière date prévue mais pas encore RC -> Attention
      if (lastDatePrevu && refDate > lastDatePrevu) {
        return {
          status: 'attention',
          label: 'Attention',
          color: 'amber',
          icon: 'lucide:alert-triangle',
          priority: 2
        }
      }

      // Sinon -> En attente
      return {
        status: 'pending',
        label: 'En attente',
        color: 'gray',
        icon: 'lucide:clock',
        priority: 1
      }
    }

    // Si le document est reçu
    if (doc.date_recu) {
      // Calculer dans quel état on était au moment de la réception
      const statusAtReception = calculateRawStatus(doc.date_recu)

      return {
        status: 'received',
        label: 'Reçu',
        color: 'emerald',
        icon: 'lucide:check-circle-2',
        priority: 0,
        previousStatus: statusAtReception
      }
    }

    // Calculer le statut actuel
    return calculateRawStatus(today)
  }

  // Calculer le statut d'un PT (plus simple, sans RC)
  const getPtStatus = (doc) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Trouver la dernière date prévue
    let lastDatePrevu = null
    if (doc.date_prevu && doc.date_prevu.length > 0) {
      const sortedDates = [...doc.date_prevu].sort((a, b) => new Date(b) - new Date(a))
      lastDatePrevu = new Date(sortedDates[0])
      lastDatePrevu.setHours(0, 0, 0, 0)
    }

    // Si le document est reçu
    if (doc.date_recu) {
      const receptionDate = new Date(doc.date_recu)
      receptionDate.setHours(0, 0, 0, 0)

      // Calculer si on était en retard au moment de la réception
      let previousStatus = {
        status: 'pending',
        label: 'En attente',
        color: 'gray',
        icon: 'lucide:clock'
      }

      if (lastDatePrevu && receptionDate > lastDatePrevu) {
        previousStatus = {
          status: 'overdue',
          label: 'En retard',
          color: 'red',
          icon: 'lucide:alert-circle'
        }
      }

      return {
        status: 'received',
        label: 'Reçu',
        color: 'emerald',
        icon: 'lucide:check-circle-2',
        priority: 0,
        previousStatus
      }
    }

    // Vérifier la date MES ou dernière date prévue
    if (doc.date_mes) {
      const dateMes = new Date(doc.date_mes)
      dateMes.setHours(0, 0, 0, 0)

      if (today > dateMes) {
        return {
          status: 'overdue',
          label: 'En retard',
          color: 'red',
          icon: 'lucide:alert-circle',
          priority: 3
        }
      }
    }

    if (lastDatePrevu && today > lastDatePrevu) {
      return {
        status: 'attention',
        label: 'Attention',
        color: 'amber',
        icon: 'lucide:alert-triangle',
        priority: 2
      }
    }

    // Par défaut : en attente
    return {
      status: 'pending',
      label: 'En attente',
      color: 'gray',
      icon: 'lucide:clock',
      priority: 1
    }
  }

  // Calculer la date RC (2 mois avant MES)
  const getDateRc = (dateMes) => {
    if (!dateMes) return null
    const date = new Date(dateMes)
    date.setMonth(date.getMonth() - 2)
    return date
  }

  // Formater une date
  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    })
  }

  // Formater une date complète
  const formatDateFull = (dateStr) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  // Calculer les jours restants
  const getDaysRemaining = (dateStr) => {
    if (!dateStr) return null
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const targetDate = new Date(dateStr)
    targetDate.setHours(0, 0, 0, 0)
    return Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24))
  }

  return {
    // DEX
    getDexByChantier,
    addDex,
    updateDex,
    deleteDex,
    // PT
    getPtByChantier,
    addPt,
    updatePt,
    deletePt,
    // Utilitaires
    getDocumentStatus,
    getPtStatus,
    getDateRc,
    formatDate,
    formatDateFull,
    getDaysRemaining
  }
}
