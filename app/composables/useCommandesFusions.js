export const useCommandesFusions = () => {
  const client = useSupabaseClient()
  const { addToast } = useToast()

  // ─── Fusions (commandes) ──────────────────────────────────────────────────

  const getFusions = async (chantierId) => {
    try {
      const { data, error } = await client
        .from('commandes_matieres_fusions')
        .select('*, commandes_matieres_fusions_listes(id, commande_id)')
        .eq('chantier_id', chantierId)
        .order('created_at')

      if (error) throw error
      return data || []
    } catch (err) {
      console.error('Erreur récupération fusions:', err)
      addToast({ title: 'Erreur', message: err.message, type: 'Error' })
      return []
    }
  }

  const createFusion = async (chantierId, nom) => {
    try {
      const { data, error } = await client
        .from('commandes_matieres_fusions')
        .insert({ chantier_id: chantierId, nom })
        .select('*, commandes_matieres_fusions_listes(id, commande_id)')
        .single()

      if (error) throw error
      addToast({ title: 'Succès', message: 'Commande créée', type: 'Success' })
      return data
    } catch (err) {
      console.error('Erreur création fusion:', err)
      addToast({ title: 'Erreur', message: err.message, type: 'Error' })
      return null
    }
  }

  const updateFusion = async (id, payload) => {
    try {
      const { data, error } = await client
        .from('commandes_matieres_fusions')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select('*, commandes_matieres_fusions_listes(id, commande_id)')
        .single()

      if (error) throw error
      addToast({ title: 'Succès', message: 'Commande mise à jour', type: 'Success' })
      return data
    } catch (err) {
      console.error('Erreur mise à jour fusion:', err)
      addToast({ title: 'Erreur', message: err.message, type: 'Error' })
      return null
    }
  }

  const deleteFusion = async (id) => {
    try {
      const { error } = await client
        .from('commandes_matieres_fusions')
        .delete()
        .eq('id', id)

      if (error) throw error
      addToast({ title: 'Succès', message: 'Commande supprimée', type: 'Success' })
      return true
    } catch (err) {
      console.error('Erreur suppression fusion:', err)
      addToast({ title: 'Erreur', message: err.message, type: 'Error' })
      return false
    }
  }

  const validerFusion = async (id) => {
    try {
      const { data, error } = await client
        .from('commandes_matieres_fusions')
        .update({ validee: true, valide_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', id)
        .select('id, validee, valide_at')
        .single()

      if (error) throw error
      addToast({ title: 'Commande validée', message: 'La commande est verrouillée', type: 'Success' })
      return data
    } catch (err) {
      console.error('Erreur validation fusion:', err)
      addToast({ title: 'Erreur', message: err.message, type: 'Error' })
      return null
    }
  }

  // ─── Listes sources (metadata d'audit) ───────────────────────────────────

  const addListeToFusion = async (fusionId, commandeId) => {
    try {
      const { data, error } = await client
        .from('commandes_matieres_fusions_listes')
        .insert({ fusion_id: fusionId, commande_id: commandeId })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (err) {
      console.error('Erreur ajout liste à la fusion:', err)
      addToast({ title: 'Erreur', message: err.message, type: 'Error' })
      return null
    }
  }

  const removeListeFromFusion = async (id) => {
    try {
      const { error } = await client
        .from('commandes_matieres_fusions_listes')
        .delete()
        .eq('id', id)

      if (error) throw error
      return true
    } catch (err) {
      console.error('Erreur retrait liste de la fusion:', err)
      addToast({ title: 'Erreur', message: err.message, type: 'Error' })
      return false
    }
  }

  // ─── Lignes statiques d'une commande ─────────────────────────────────────

  const getFusionLignes = async (fusionId) => {
    try {
      const { data, error } = await client
        .from('commandes_matieres_fusions_lignes')
        .select('*, catalogue_matieres(*)')
        .eq('fusion_id', fusionId)
        .order('ordre')

      if (error) throw error
      return data || []
    } catch (err) {
      console.error('Erreur récupération lignes commande:', err)
      addToast({ title: 'Erreur', message: err.message, type: 'Error' })
      return []
    }
  }

  const addFusionLigne = async (fusionId, numeroSymbole, quantite = 1, ordre = 0) => {
    try {
      const { data, error } = await client
        .from('commandes_matieres_fusions_lignes')
        .insert({ fusion_id: fusionId, numero_symbole: numeroSymbole, quantite, ordre })
        .select('*, catalogue_matieres(*)')
        .single()

      if (error) throw error
      return data
    } catch (err) {
      console.error('Erreur ajout article commande:', err)
      addToast({ title: 'Erreur', message: err.message, type: 'Error' })
      return null
    }
  }

  const updateFusionLigne = async (id, payload) => {
    try {
      const { data, error } = await client
        .from('commandes_matieres_fusions_lignes')
        .update(payload)
        .eq('id', id)
        .select('*, catalogue_matieres(*)')
        .single()

      if (error) throw error
      return data
    } catch (err) {
      console.error('Erreur mise à jour ligne commande:', err)
      addToast({ title: 'Erreur', message: err.message, type: 'Error' })
      return null
    }
  }

  const deleteFusionLigne = async (id) => {
    try {
      const { error } = await client
        .from('commandes_matieres_fusions_lignes')
        .delete()
        .eq('id', id)

      if (error) throw error
      return true
    } catch (err) {
      console.error('Erreur suppression ligne commande:', err)
      addToast({ title: 'Erreur', message: err.message, type: 'Error' })
      return false
    }
  }

  const bulkInsertFusionLignes = async (fusionId, items) => {
    if (!items.length) return true
    try {
      const rows = items.map((item, i) => ({
        fusion_id: fusionId,
        numero_symbole: item.symbole,
        quantite: item.quantite,
        ordre: i,
      }))
      const { error } = await client
        .from('commandes_matieres_fusions_lignes')
        .insert(rows)

      if (error) throw error
      return true
    } catch (err) {
      console.error('Erreur insertion lignes commande:', err)
      addToast({ title: 'Erreur', message: err.message, type: 'Error' })
      return false
    }
  }

  return {
    getFusions,
    createFusion,
    updateFusion,
    deleteFusion,
    validerFusion,
    addListeToFusion,
    removeListeFromFusion,
    getFusionLignes,
    addFusionLigne,
    updateFusionLigne,
    deleteFusionLigne,
    bulkInsertFusionLignes,
  }
}
