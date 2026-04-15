export const useCommandesMatieres = () => {
  const client = useSupabaseClient()
  const { addToast } = useToast()

  // ─── Commandes ────────────────────────────────────────────────────────────

  const getCommandes = async (chantierId = null) => {
    try {
      let query = client
        .from('commandes_matieres')
        .select('*, chantiers(id, name)')
        .order('updated_at', { ascending: false })

      if (chantierId) query = query.eq('chantier_id', chantierId)

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (err) {
      console.error('Erreur récupération commandes:', err)
      addToast({ title: 'Erreur', message: err.message, type: 'Error' })
      return []
    }
  }

  const createCommande = async (payload) => {
    try {
      const { data, error } = await client
        .from('commandes_matieres')
        .insert(payload)
        .select('*, chantiers(id, name)')
        .single()

      if (error) throw error
      addToast({ title: 'Succès', message: 'Commande créée', type: 'Success' })
      return data
    } catch (err) {
      console.error('Erreur création commande:', err)
      addToast({ title: 'Erreur', message: err.message, type: 'Error' })
      return null
    }
  }

  const updateCommande = async (id, payload) => {
    try {
      const { data, error } = await client
        .from('commandes_matieres')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select('*, chantiers(id, name)')
        .single()

      if (error) throw error
      addToast({ title: 'Succès', message: 'Commande mise à jour', type: 'Success' })
      return data
    } catch (err) {
      console.error('Erreur mise à jour commande:', err)
      addToast({ title: 'Erreur', message: err.message, type: 'Error' })
      return null
    }
  }

  const deleteCommande = async (id) => {
    try {
      const { error } = await client
        .from('commandes_matieres')
        .delete()
        .eq('id', id)

      if (error) throw error
      addToast({ title: 'Succès', message: 'Liste supprimée', type: 'Success' })
      return true
    } catch (err) {
      console.error('Erreur suppression commande:', err)
      addToast({ title: 'Erreur', message: err.message, type: 'Error' })
      return false
    }
  }

  const duplicateCommande = async (commande) => {
    try {
      // Créer la nouvelle commande
      const { data: newCommande, error: e1 } = await client
        .from('commandes_matieres')
        .insert({
          chantier_id: commande.chantier_id,
          nom: `${commande.nom} (copie)`,
          description: commande.description ?? null,
        })
        .select('*, chantiers(id, name)')
        .single()

      if (e1) throw e1

      // Copier les lignes directes
      const { data: lignes, error: e2 } = await client
        .from('commandes_matieres_lignes')
        .select('numero_symbole, quantite, ordre')
        .eq('commande_id', commande.id)
        .order('ordre')

      if (e2) throw e2

      if (lignes && lignes.length > 0) {
        const { error: e3 } = await client
          .from('commandes_matieres_lignes')
          .insert(lignes.map((l) => ({ ...l, commande_id: newCommande.id })))

        if (e3) throw e3
      }

      // Copier les liens ensembles/sous-ensembles
      const { data: ensembles, error: e4 } = await client
        .from('commandes_matieres_ensembles')
        .select('ensemble_id, quantite')
        .eq('commande_id', commande.id)

      if (e4) throw e4

      if (ensembles && ensembles.length > 0) {
        const { error: e5 } = await client
          .from('commandes_matieres_ensembles')
          .insert(ensembles.map((e) => ({ ...e, commande_id: newCommande.id })))

        if (e5) throw e5
      }

      addToast({ title: 'Succès', message: 'Liste dupliquée', type: 'Success' })
      return newCommande
    } catch (err) {
      console.error('Erreur duplication commande:', err)
      addToast({ title: 'Erreur', message: err.message, type: 'Error' })
      return null
    }
  }

  // ─── Lignes d'une commande ─────────────────────────────────────────────────

  const getLignes = async (commandeId) => {
    try {
      const { data, error } = await client
        .from('commandes_matieres_lignes')
        .select('*, catalogue_matieres(*)')
        .eq('commande_id', commandeId)
        .order('ordre')

      if (error) throw error
      return data || []
    } catch (err) {
      console.error('Erreur récupération lignes:', err)
      addToast({ title: 'Erreur', message: err.message, type: 'Error' })
      return []
    }
  }

  const addLigne = async (commandeId, numeroSymbole, quantite = 1, ordre = 0) => {
    try {
      const { data, error } = await client
        .from('commandes_matieres_lignes')
        .insert({ commande_id: commandeId, numero_symbole: numeroSymbole, quantite, ordre })
        .select('*, catalogue_matieres(*)')
        .single()

      if (error) throw error
      return data
    } catch (err) {
      console.error('Erreur ajout article:', err)
      addToast({ title: 'Erreur', message: err.message, type: 'Error' })
      return null
    }
  }

  const updateLigne = async (id, payload) => {
    try {
      const { data, error } = await client
        .from('commandes_matieres_lignes')
        .update(payload)
        .eq('id', id)
        .select('*, catalogue_matieres(*)')
        .single()

      if (error) throw error
      return data
    } catch (err) {
      console.error('Erreur mise à jour ligne:', err)
      addToast({ title: 'Erreur', message: err.message, type: 'Error' })
      return null
    }
  }

  const deleteLigne = async (id) => {
    try {
      const { error } = await client
        .from('commandes_matieres_lignes')
        .delete()
        .eq('id', id)

      if (error) throw error
      return true
    } catch (err) {
      console.error('Erreur suppression ligne:', err)
      addToast({ title: 'Erreur', message: err.message, type: 'Error' })
      return false
    }
  }

  // ─── Recherche catalogue ───────────────────────────────────────────────────

  const searchCatalogue = async (query, limit = 50) => {
    if (!query || query.trim().length < 2) return []
    try {
      const q = query.trim()

      // Recherche par numéro de symbole exact ou préfixe d'abord
      const { data: byRef, error: e1 } = await client
        .from('catalogue_matieres')
        .select('numero_symbole, description, prix_ud, unite_distribution, info_unite, famille, sous_famille')
        .ilike('numero_symbole', `%${q}%`)
        .limit(20)

      if (e1) throw e1

      // Recherche par description
      const { data: byDesc, error: e2 } = await client
        .from('catalogue_matieres')
        .select('numero_symbole, description, prix_ud, unite_distribution, info_unite, famille, sous_famille')
        .ilike('description', `%${q}%`)
        .limit(limit)

      if (e2) throw e2

      // Fusionner en évitant les doublons
      const seen = new Set(byRef.map((r) => r.numero_symbole))
      const merged = [...byRef, ...byDesc.filter((r) => !seen.has(r.numero_symbole))]
      return merged.slice(0, limit)
    } catch (err) {
      console.error('Erreur recherche catalogue:', err)
      return []
    }
  }

  return {
    getCommandes,
    createCommande,
    updateCommande,
    deleteCommande,
    duplicateCommande,
    getLignes,
    addLigne,
    updateLigne,
    deleteLigne,
    searchCatalogue,
  }
}
