// Niveau « Commande » (bordereau) au-dessus des listes de matières.
// Une commande reprend une ou plusieurs listes (commandes_matieres), aplatit leur
// contenu (ensembles éclatés) et fusionne par numéro de symbole. Elle porte un
// suivi Base Arrière et un statut en_cours → validee.
export const useCommandes = () => {
  const client = useSupabaseClient()
  const { addToast } = useToast()
  const authUser = useAuthUser()

  // Réutilisation des chargeurs de listes de matières (sources)
  const { getLignes: getLignesListe } = useCommandesMatieres()
  const { getEnsemblesCommande, flattenArticles } = useEnsemblesMatieres()

  const COMMANDE_SELECT = '*, chantiers(id, name), createur:created_by(id, nom, prenom, name)'

  // ─── Commandes ────────────────────────────────────────────────────────────

  const getCommandes = async (chantierId = null) => {
    try {
      let query = client
        .from('bordereaux_commande')
        .select(COMMANDE_SELECT)
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

  const updateCommande = async (id, payload) => {
    try {
      const { data, error } = await client
        .from('bordereaux_commande')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select(COMMANDE_SELECT)
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
      const { error } = await client.from('bordereaux_commande').delete().eq('id', id)
      if (error) throw error
      addToast({ title: 'Succès', message: 'Commande supprimée', type: 'Success' })
      return true
    } catch (err) {
      console.error('Erreur suppression commande:', err)
      addToast({ title: 'Erreur', message: err.message, type: 'Error' })
      return false
    }
  }

  const validerCommande = async (id) => {
    try {
      const now = new Date().toISOString()
      const { data, error } = await client
        .from('bordereaux_commande')
        .update({ statut: 'validee', valide_at: now, updated_at: now })
        .eq('id', id)
        .select(COMMANDE_SELECT)
        .single()

      if (error) throw error
      addToast({ title: 'Commande validée', message: 'La commande est verrouillée', type: 'Success' })
      return data
    } catch (err) {
      console.error('Erreur validation commande:', err)
      addToast({ title: 'Erreur', message: err.message, type: 'Error' })
      return null
    }
  }

  const rouvrirCommande = async (id) => {
    try {
      const now = new Date().toISOString()
      const { data, error } = await client
        .from('bordereaux_commande')
        .update({ statut: 'en_cours', valide_at: null, exported_at: null, updated_at: now })
        .eq('id', id)
        .select(COMMANDE_SELECT)
        .single()

      if (error) throw error
      addToast({ title: 'Commande rouverte', message: 'Édition à nouveau possible', type: 'Success' })
      return data
    } catch (err) {
      console.error('Erreur réouverture commande:', err)
      addToast({ title: 'Erreur', message: err.message, type: 'Error' })
      return null
    }
  }

  const markExported = async (id) => {
    try {
      const now = new Date().toISOString()
      const { data, error } = await client
        .from('bordereaux_commande')
        .update({ exported_at: now })
        .eq('id', id)
        .select('id, exported_at')
        .single()

      if (error) throw error
      return data
    } catch (err) {
      console.error('Erreur marquage export:', err)
      return null
    }
  }

  // ─── Création depuis une ou plusieurs listes de matières ────────────────────
  // Aplatit chaque liste source (articles directs + ensembles éclatés) et fusionne
  // toutes les quantités par numéro de symbole → une commande à plat « en cours ».
  const createCommandeFromListes = async (chantierId, listeIds, { nom, description = '', metier = null } = {}) => {
    try {
      if (!listeIds || listeIds.length === 0) throw new Error('Aucune liste sélectionnée')

      // 1. Agrégation par symbole (directs + ensembles éclatés) sur toutes les sources
      const aggregated = new Map()
      const add = (symbole, qty) => {
        aggregated.set(symbole, (aggregated.get(symbole) || 0) + (qty || 0))
      }

      for (const listeId of listeIds) {
        const [lignes, ensembles] = await Promise.all([
          getLignesListe(listeId),
          getEnsemblesCommande(listeId),
        ])
        for (const l of lignes) add(l.numero_symbole, l.quantite)
        for (const e of ensembles) {
          for (const art of flattenArticles(e.ensembles_matieres, e.quantite || 1)) {
            add(art.numero_symbole, art.quantite)
          }
        }
      }

      // 2. Création de la commande (statut en_cours)
      const { data: commande, error: e1 } = await client
        .from('bordereaux_commande')
        .insert({
          chantier_id: chantierId,
          nom: nom?.trim(),
          description: description?.trim() ?? '',
          metier,
          created_by: authUser.value?.id ?? null,
        })
        .select(COMMANDE_SELECT)
        .single()

      if (e1) throw e1

      // 3. Insertion des lignes fusionnées
      const entries = [...aggregated.entries()].sort(([a], [b]) => String(a).localeCompare(String(b)))
      if (entries.length > 0) {
        const { error: e2 } = await client
          .from('bordereaux_commande_lignes')
          .insert(entries.map(([symbole, quantite], i) => ({
            commande_id: commande.id,
            numero_symbole: symbole,
            quantite_demandee: quantite,
            ordre: i,
          })))
        if (e2) throw e2
      }

      // 4. Traçabilité des listes sources
      const { error: e3 } = await client
        .from('bordereaux_commande_sources')
        .insert(listeIds.map((liste_id) => ({ commande_id: commande.id, liste_id })))
      if (e3) throw e3

      addToast({ title: 'Succès', message: 'Commande créée', type: 'Success' })
      return commande
    } catch (err) {
      console.error('Erreur création commande depuis listes:', err)
      addToast({ title: 'Erreur', message: err.message, type: 'Error' })
      return null
    }
  }

  // ─── Lignes d'une commande ──────────────────────────────────────────────────

  const getLignes = async (commandeId) => {
    try {
      const { data, error } = await client
        .from('bordereaux_commande_lignes')
        .select('*, catalogue_matieres(*)')
        .eq('commande_id', commandeId)
        .order('ordre')

      if (error) throw error
      return data || []
    } catch (err) {
      console.error('Erreur récupération lignes commande:', err)
      addToast({ title: 'Erreur', message: err.message, type: 'Error' })
      return []
    }
  }

  const addLigne = async (commandeId, numeroSymbole, quantiteDemandee = 0, ordre = 0) => {
    try {
      const { data, error } = await client
        .from('bordereaux_commande_lignes')
        .insert({ commande_id: commandeId, numero_symbole: numeroSymbole, quantite_demandee: quantiteDemandee, ordre })
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

  const updateLigne = async (id, payload) => {
    try {
      const { data, error } = await client
        .from('bordereaux_commande_lignes')
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

  // Édition réservée Base Arrière (quantité BA + emplacement BA).
  const updateLigneBa = async (id, { quantite_ba, emplacement_ba }) =>
    updateLigne(id, { quantite_ba, emplacement_ba })

  const deleteLigne = async (id) => {
    try {
      const { error } = await client.from('bordereaux_commande_lignes').delete().eq('id', id)
      if (error) throw error
      return true
    } catch (err) {
      console.error('Erreur suppression ligne commande:', err)
      addToast({ title: 'Erreur', message: err.message, type: 'Error' })
      return false
    }
  }

  return {
    getCommandes,
    createCommandeFromListes,
    updateCommande,
    deleteCommande,
    validerCommande,
    rouvrirCommande,
    markExported,
    getLignes,
    addLigne,
    updateLigne,
    updateLigneBa,
    deleteLigne,
  }
}
