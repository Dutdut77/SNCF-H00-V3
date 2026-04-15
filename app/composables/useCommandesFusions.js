export const useCommandesFusions = () => {
  const client = useSupabaseClient()
  const { addToast } = useToast()

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

  return {
    getFusions,
    createFusion,
    updateFusion,
    deleteFusion,
    addListeToFusion,
    removeListeFromFusion,
  }
}
