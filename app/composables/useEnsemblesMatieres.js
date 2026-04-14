export const useEnsemblesMatieres = () => {
  const client = useSupabaseClient()
  const { addToast } = useToast()

  // ─── Ensembles ────────────────────────────────────────────────────────────

  const getEnsembles = async () => {
    try {
      const { data, error } = await client
        .from('ensembles_matieres')
        .select('*, ensembles_matieres_lignes(id)')
        .order('nom')

      if (error) throw error
      return (data || []).map((e) => ({
        ...e,
        nb_articles: e.ensembles_matieres_lignes?.length ?? 0,
      }))
    } catch (err) {
      console.error('Erreur récupération ensembles:', err)
      addToast({ title: 'Erreur', message: err.message, type: 'Error' })
      return []
    }
  }

  const createEnsemble = async (payload) => {
    try {
      const { data, error } = await client
        .from('ensembles_matieres')
        .insert(payload)
        .select('*, ensembles_matieres_lignes(id)')
        .single()

      if (error) throw error
      addToast({ title: 'Succès', message: 'Ensemble créé', type: 'Success' })
      return { ...data, nb_articles: 0 }
    } catch (err) {
      console.error('Erreur création ensemble:', err)
      addToast({ title: 'Erreur', message: err.message, type: 'Error' })
      return null
    }
  }

  const updateEnsemble = async (id, payload) => {
    try {
      const { data, error } = await client
        .from('ensembles_matieres')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select('*, ensembles_matieres_lignes(id)')
        .single()

      if (error) throw error
      addToast({ title: 'Succès', message: 'Ensemble mis à jour', type: 'Success' })
      return { ...data, nb_articles: data.ensembles_matieres_lignes?.length ?? 0 }
    } catch (err) {
      console.error('Erreur mise à jour ensemble:', err)
      addToast({ title: 'Erreur', message: err.message, type: 'Error' })
      return null
    }
  }

  const deleteEnsemble = async (id) => {
    try {
      const { error } = await client
        .from('ensembles_matieres')
        .delete()
        .eq('id', id)

      if (error) throw error
      addToast({ title: 'Succès', message: 'Ensemble supprimé', type: 'Success' })
      return true
    } catch (err) {
      console.error('Erreur suppression ensemble:', err)
      addToast({ title: 'Erreur', message: err.message, type: 'Error' })
      return false
    }
  }

  // ─── Lignes d'un ensemble ──────────────────────────────────────────────────

  const getLignesEnsemble = async (ensembleId) => {
    try {
      const { data, error } = await client
        .from('ensembles_matieres_lignes')
        .select('*, catalogue_matieres(*)')
        .eq('ensemble_id', ensembleId)
        .order('ordre')

      if (error) throw error
      return data || []
    } catch (err) {
      console.error('Erreur récupération lignes ensemble:', err)
      addToast({ title: 'Erreur', message: err.message, type: 'Error' })
      return []
    }
  }

  const addLigneEnsemble = async (ensembleId, numeroSymbole, quantite = 1, ordre = 0) => {
    try {
      const { data, error } = await client
        .from('ensembles_matieres_lignes')
        .insert({ ensemble_id: ensembleId, numero_symbole: numeroSymbole, quantite, ordre })
        .select('*, catalogue_matieres(*)')
        .single()

      if (error) throw error
      return data
    } catch (err) {
      console.error('Erreur ajout article ensemble:', err)
      addToast({ title: 'Erreur', message: err.message, type: 'Error' })
      return null
    }
  }

  const updateLigneEnsemble = async (id, payload) => {
    try {
      const { data, error } = await client
        .from('ensembles_matieres_lignes')
        .update(payload)
        .eq('id', id)
        .select('*, catalogue_matieres(*)')
        .single()

      if (error) throw error
      return data
    } catch (err) {
      console.error('Erreur mise à jour ligne ensemble:', err)
      addToast({ title: 'Erreur', message: err.message, type: 'Error' })
      return null
    }
  }

  const deleteLigneEnsemble = async (id) => {
    try {
      const { error } = await client
        .from('ensembles_matieres_lignes')
        .delete()
        .eq('id', id)

      if (error) throw error
      return true
    } catch (err) {
      console.error('Erreur suppression ligne ensemble:', err)
      addToast({ title: 'Erreur', message: err.message, type: 'Error' })
      return false
    }
  }

  // ─── Sous-ensembles d'un ensemble ─────────────────────────────────────────

  const getSousEnsembles = async (ensembleId) => {
    try {
      const { data, error } = await client
        .from('ensembles_matieres_sous_ensembles')
        .select(`
          *,
          sous_ensemble:ensembles_matieres!sous_ensemble_id(
            id, nom, description,
            ensembles_matieres_lignes(*, catalogue_matieres(*))
          )
        `)
        .eq('ensemble_id', ensembleId)

      if (error) throw error
      return data || []
    } catch (err) {
      console.error('Erreur récupération sous-ensembles:', err)
      addToast({ title: 'Erreur', message: err.message, type: 'Error' })
      return []
    }
  }

  const addSousEnsemble = async (ensembleId, sousEnsembleId, quantite = 1) => {
    try {
      const { data, error } = await client
        .from('ensembles_matieres_sous_ensembles')
        .insert({ ensemble_id: ensembleId, sous_ensemble_id: sousEnsembleId, quantite })
        .select(`
          *,
          sous_ensemble:ensembles_matieres!sous_ensemble_id(
            id, nom, description,
            ensembles_matieres_lignes(*, catalogue_matieres(*))
          )
        `)
        .single()

      if (error) throw error
      return data
    } catch (err) {
      console.error('Erreur ajout sous-ensemble:', err)
      addToast({ title: 'Erreur', message: err.message, type: 'Error' })
      return null
    }
  }

  const updateSousEnsemble = async (id, payload) => {
    try {
      const { data, error } = await client
        .from('ensembles_matieres_sous_ensembles')
        .update(payload)
        .eq('id', id)
        .select(`
          *,
          sous_ensemble:ensembles_matieres!sous_ensemble_id(
            id, nom, description,
            ensembles_matieres_lignes(*, catalogue_matieres(*))
          )
        `)
        .single()

      if (error) throw error
      return data
    } catch (err) {
      console.error('Erreur mise à jour sous-ensemble:', err)
      addToast({ title: 'Erreur', message: err.message, type: 'Error' })
      return null
    }
  }

  const deleteSousEnsemble = async (id) => {
    try {
      const { error } = await client
        .from('ensembles_matieres_sous_ensembles')
        .delete()
        .eq('id', id)

      if (error) throw error
      return true
    } catch (err) {
      console.error('Erreur suppression sous-ensemble:', err)
      addToast({ title: 'Erreur', message: err.message, type: 'Error' })
      return false
    }
  }

  // ─── Ensembles dans une commande ──────────────────────────────────────────

  // Fragment de sélection partagé pour les ensembles avec sous-ensembles
  const ENSEMBLE_SELECT = `
    id, nom, description,
    ensembles_matieres_lignes(*, catalogue_matieres(*)),
    ensembles_matieres_sous_ensembles!ensemble_id(
      id, quantite,
      sous_ensemble:ensembles_matieres!sous_ensemble_id(
        id, nom, description,
        ensembles_matieres_lignes(*, catalogue_matieres(*))
      )
    )
  `

  const getEnsemblesCommande = async (commandeId) => {
    try {
      const { data, error } = await client
        .from('commandes_matieres_ensembles')
        .select(`*, ensembles_matieres(${ENSEMBLE_SELECT})`)
        .eq('commande_id', commandeId)

      if (error) throw error
      return data || []
    } catch (err) {
      console.error('Erreur récupération ensembles commande:', err)
      addToast({ title: 'Erreur', message: err.message, type: 'Error' })
      return []
    }
  }

  const addEnsembleToCommande = async (commandeId, ensembleId) => {
    try {
      const { data, error } = await client
        .from('commandes_matieres_ensembles')
        .insert({ commande_id: commandeId, ensemble_id: ensembleId })
        .select(`*, ensembles_matieres(${ENSEMBLE_SELECT})`)
        .single()

      if (error) throw error
      return data
    } catch (err) {
      console.error('Erreur ajout ensemble à la commande:', err)
      addToast({ title: 'Erreur', message: err.message, type: 'Error' })
      return null
    }
  }

  const updateEnsembleCommande = async (id, payload) => {
    try {
      const { data, error } = await client
        .from('commandes_matieres_ensembles')
        .update(payload)
        .eq('id', id)
        .select(`*, ensembles_matieres(${ENSEMBLE_SELECT})`)
        .single()

      if (error) throw error
      return data
    } catch (err) {
      console.error('Erreur mise à jour ensemble commande:', err)
      addToast({ title: 'Erreur', message: err.message, type: 'Error' })
      return null
    }
  }

  const removeEnsembleFromCommande = async (id) => {
    try {
      const { error } = await client
        .from('commandes_matieres_ensembles')
        .delete()
        .eq('id', id)

      if (error) throw error
      return true
    } catch (err) {
      console.error('Erreur retrait ensemble de la commande:', err)
      addToast({ title: 'Erreur', message: err.message, type: 'Error' })
      return false
    }
  }

  return {
    getEnsembles,
    createEnsemble,
    updateEnsemble,
    deleteEnsemble,
    getLignesEnsemble,
    addLigneEnsemble,
    updateLigneEnsemble,
    deleteLigneEnsemble,
    getSousEnsembles,
    addSousEnsemble,
    updateSousEnsemble,
    deleteSousEnsemble,
    getEnsemblesCommande,
    addEnsembleToCommande,
    updateEnsembleCommande,
    removeEnsembleFromCommande,
  }
}
