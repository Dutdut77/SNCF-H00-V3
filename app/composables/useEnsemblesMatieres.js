// Palette des cartes catégorie : indexée par `ordre` (cohérent avec la convention
// index → palette des composants matières/logiques). Ne sert qu'aux cartes catégorie.
const CATEGORIE_PALETTE = [
  { key: 'indigo',  ring: 'ring-indigo-200',  bg: 'bg-indigo-50',  hdrBg: 'bg-indigo-100',  text: 'text-indigo-700',  dot: 'bg-indigo-500',  border: 'border-indigo-200' },
  { key: 'violet',  ring: 'ring-violet-200',  bg: 'bg-violet-50',  hdrBg: 'bg-violet-100',  text: 'text-violet-700',  dot: 'bg-violet-500',  border: 'border-violet-200' },
  { key: 'fuchsia', ring: 'ring-fuchsia-200', bg: 'bg-fuchsia-50', hdrBg: 'bg-fuchsia-100', text: 'text-fuchsia-700', dot: 'bg-fuchsia-500', border: 'border-fuchsia-200' },
  { key: 'amber',   ring: 'ring-amber-200',   bg: 'bg-amber-50',   hdrBg: 'bg-amber-100',   text: 'text-amber-700',   dot: 'bg-amber-500',   border: 'border-amber-200' },
  { key: 'emerald', ring: 'ring-emerald-200', bg: 'bg-emerald-50', hdrBg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500', border: 'border-emerald-200' },
  { key: 'sky',     ring: 'ring-sky-200',     bg: 'bg-sky-50',     hdrBg: 'bg-sky-100',     text: 'text-sky-700',     dot: 'bg-sky-500',     border: 'border-sky-200' },
  { key: 'rose',    ring: 'ring-rose-200',    bg: 'bg-rose-50',    hdrBg: 'bg-rose-100',    text: 'text-rose-700',    dot: 'bg-rose-500',    border: 'border-rose-200' },
]
const categoriePalette = (index) => CATEGORIE_PALETTE[((index % CATEGORIE_PALETTE.length) + CATEGORIE_PALETTE.length) % CATEGORIE_PALETTE.length]

export const useEnsemblesMatieres = () => {
  const client = useSupabaseClient()
  const { addToast } = useToast()

  // ─── Helpers arbre (profondeur illimitée) ─────────────────────────────────

  const groupBy = (arr, keyFn) => {
    const m = new Map()
    for (const item of arr) {
      const k = keyFn(item)
      if (!m.has(k)) m.set(k, [])
      m.get(k).push(item)
    }
    return m
  }

  // Charge tout le graphe ensembles / relations / lignes en 3 requêtes à plat.
  const fetchGraph = async () => {
    const [{ data: ens, error: e1 }, { data: rels, error: e2 }, { data: lns, error: e3 }] =
      await Promise.all([
        client.from('ensembles_matieres').select('id, nom, description, metier, categorie_id'),
        client.from('ensembles_matieres_sous_ensembles').select('id, ensemble_id, sous_ensemble_id, quantite'),
        client.from('ensembles_matieres_lignes').select('*, catalogue_matieres(*)'),
      ])
    if (e1) throw e1
    if (e2) throw e2
    if (e3) throw e3
    return {
      ensemblesById: new Map((ens ?? []).map((e) => [e.id, e])),
      relationsByParent: groupBy(rels ?? [], (r) => r.ensemble_id),
      lignesByEnsemble: groupBy(lns ?? [], (l) => l.ensemble_id),
    }
  }

  // Reconstruit récursivement l'arbre sous la forme attendue par les consommateurs :
  //   { id, nom, description, ensembles_matieres_lignes, ensembles_matieres_sous_ensembles: [{id, quantite, sous_ensemble}] }
  // `visited` coupe toute boucle éventuelle (le trigger DB les empêche à l'écriture, ceci est un garde-fou lecture).
  const hydrateEnsemble = (id, graph, visited = new Set()) => {
    if (!id || visited.has(id)) return null
    const base = graph.ensemblesById.get(id)
    if (!base) return null
    const nextVisited = new Set(visited)
    nextVisited.add(id)
    const relations = graph.relationsByParent.get(id) ?? []
    return {
      ...base,
      ensembles_matieres_lignes: graph.lignesByEnsemble.get(id) ?? [],
      ensembles_matieres_sous_ensembles: relations
        .map((r) => ({
          id: r.id,
          quantite: r.quantite,
          sous_ensemble: hydrateEnsemble(r.sous_ensemble_id, graph, nextVisited),
        }))
        .filter((x) => x.sous_ensemble != null),
    }
  }

  // Compte tous les articles (directs + descendants) d'un nœud.
  const countArticlesRecursive = (node, visited = new Set()) => {
    if (!node || visited.has(node.id)) return 0
    const nextVisited = new Set(visited)
    nextVisited.add(node.id)
    const direct = node.ensembles_matieres_lignes?.length ?? 0
    const nested = (node.ensembles_matieres_sous_ensembles ?? []).reduce(
      (acc, s) => acc + countArticlesRecursive(s.sous_ensemble, nextVisited),
      0,
    )
    return direct + nested
  }

  // Total prix d'un nœud, en pondérant chaque descendant par sa quantité.
  // udMap : Map<code, { quantite_par_unite }> pour le prix unitaire individuel.
  const prixTotalRecursive = (node, udMap, visited = new Set()) => {
    if (!node || visited.has(node.id)) return 0
    const nextVisited = new Set(visited)
    nextVisited.add(node.id)
    const prixUnit = (cat) => {
      if (!cat) return 0
      const qpu = udMap?.get?.(cat.unite_distribution)?.quantite_par_unite ?? 1
      return (cat.prix_ud ?? 0) / (qpu > 0 ? qpu : 1)
    }
    const direct = (node.ensembles_matieres_lignes ?? []).reduce(
      (acc, l) => acc + prixUnit(l.catalogue_matieres) * (l.quantite || 0),
      0,
    )
    const nested = (node.ensembles_matieres_sous_ensembles ?? []).reduce(
      (acc, s) =>
        acc + prixTotalRecursive(s.sous_ensemble, udMap, nextVisited) * (s.quantite || 1),
      0,
    )
    return direct + nested
  }

  // Aplatit tous les articles d'un nœud en cumulant les quantités pondérées.
  // Utilisé pour la fusion de commandes. Renvoie [{ numero_symbole, quantite }].
  const flattenArticles = (node, cumulQty = 1, visited = new Set()) => {
    if (!node || visited.has(node.id)) return []
    const nextVisited = new Set(visited)
    nextVisited.add(node.id)
    const direct = (node.ensembles_matieres_lignes ?? []).map((l) => ({
      numero_symbole: l.numero_symbole,
      quantite: cumulQty * (l.quantite || 0),
    }))
    const nested = (node.ensembles_matieres_sous_ensembles ?? []).flatMap((s) =>
      flattenArticles(s.sous_ensemble, cumulQty * (s.quantite || 1), nextVisited),
    )
    return [...direct, ...nested]
  }

  // ─── Ensembles ────────────────────────────────────────────────────────────

  // metier (optionnel) restreint la liste à un métier ('VOIE' | 'SES' | 'CAT').
  const getEnsembles = async (metier = null) => {
    try {
      const graph = await fetchGraph()
      const list = [...graph.ensemblesById.values()]
        .filter((e) => !metier || e.metier === metier)
        .sort((a, b) => (a.nom ?? '').localeCompare(b.nom ?? ''))
      return list.map((e) => {
        const tree = hydrateEnsemble(e.id, graph)
        return { ...e, nb_articles: countArticlesRecursive(tree) }
      })
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
        .select('id, nom, description, metier, categorie_id')
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
        .select('id, nom, description, metier, categorie_id')
        .single()

      if (error) throw error
      addToast({ title: 'Succès', message: 'Ensemble mis à jour', type: 'Success' })
      return data
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

  // ─── Catégories d'ensembles ────────────────────────────────────────────────

  const getCategories = async (metier = null) => {
    try {
      let query = client
        .from('ensembles_matieres_categories')
        .select('id, nom, metier, ordre')
        .order('ordre')
      if (metier) query = query.eq('metier', metier)
      const { data, error } = await query
      if (error) throw error
      return data || []
    } catch (err) {
      console.error('Erreur récupération catégories:', err)
      addToast({ title: 'Erreur', message: err.message, type: 'Error' })
      return []
    }
  }

  const createCategorie = async (payload) => {
    try {
      const { data, error } = await client
        .from('ensembles_matieres_categories')
        .insert(payload)
        .select('id, nom, metier, ordre')
        .single()

      if (error) throw error
      addToast({ title: 'Succès', message: 'Catégorie créée', type: 'Success' })
      return data
    } catch (err) {
      console.error('Erreur création catégorie:', err)
      addToast({ title: 'Erreur', message: err.message, type: 'Error' })
      return null
    }
  }

  const updateCategorie = async (id, payload) => {
    try {
      const { data, error } = await client
        .from('ensembles_matieres_categories')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select('id, nom, metier, ordre')
        .single()

      if (error) throw error
      addToast({ title: 'Succès', message: 'Catégorie mise à jour', type: 'Success' })
      return data
    } catch (err) {
      console.error('Erreur mise à jour catégorie:', err)
      addToast({ title: 'Erreur', message: err.message, type: 'Error' })
      return null
    }
  }

  const deleteCategorie = async (id) => {
    try {
      const { error } = await client
        .from('ensembles_matieres_categories')
        .delete()
        .eq('id', id)

      if (error) throw error
      addToast({ title: 'Succès', message: 'Catégorie supprimée', type: 'Success' })
      return true
    } catch (err) {
      console.error('Erreur suppression catégorie:', err)
      addToast({ title: 'Erreur', message: err.message, type: 'Error' })
      return false
    }
  }

  // Rattache (ou déclasse si categorieId = null) un ensemble à une catégorie.
  const setEnsembleCategorie = async (ensembleId, categorieId) => {
    try {
      const { error } = await client
        .from('ensembles_matieres')
        .update({ categorie_id: categorieId, updated_at: new Date().toISOString() })
        .eq('id', ensembleId)

      if (error) throw error
      return true
    } catch (err) {
      console.error('Erreur rattachement catégorie:', err)
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

  // ─── Sous-ensembles d'un ensemble (arbre complet) ─────────────────────────

  // Renvoie les sous-ensembles de `ensembleId` avec leur sous-arbre complet.
  const getSousEnsembles = async (ensembleId) => {
    try {
      const graph = await fetchGraph()
      const relations = graph.relationsByParent.get(ensembleId) ?? []
      return relations
        .map((r) => ({
          id: r.id,
          ensemble_id: r.ensemble_id,
          sous_ensemble_id: r.sous_ensemble_id,
          quantite: r.quantite,
          sous_ensemble: hydrateEnsemble(r.sous_ensemble_id, graph, new Set([ensembleId])),
        }))
        .filter((x) => x.sous_ensemble != null)
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
        .select('id, ensemble_id, sous_ensemble_id, quantite')
        .single()

      if (error) throw error
      const graph = await fetchGraph()
      return {
        ...data,
        sous_ensemble: hydrateEnsemble(sousEnsembleId, graph, new Set([ensembleId])),
      }
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
        .select('id, ensemble_id, sous_ensemble_id, quantite')
        .single()

      if (error) throw error
      const graph = await fetchGraph()
      return {
        ...data,
        sous_ensemble: hydrateEnsemble(data.sous_ensemble_id, graph, new Set([data.ensemble_id])),
      }
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

  const getEnsemblesCommande = async (commandeId) => {
    try {
      const { data, error } = await client
        .from('commandes_matieres_ensembles')
        .select('id, commande_id, ensemble_id, quantite')
        .eq('commande_id', commandeId)

      if (error) throw error
      if (!data || data.length === 0) return []

      const graph = await fetchGraph()
      return data.map((row) => ({
        ...row,
        ensembles_matieres: hydrateEnsemble(row.ensemble_id, graph),
      }))
    } catch (err) {
      console.error('Erreur récupération ensembles commande:', err)
      addToast({ title: 'Erreur', message: err.message, type: 'Error' })
      return []
    }
  }

  const addEnsembleToCommande = async (commandeId, ensembleId, quantite = 1) => {
    try {
      const { data, error } = await client
        .from('commandes_matieres_ensembles')
        .insert({ commande_id: commandeId, ensemble_id: ensembleId, quantite })
        .select('id, commande_id, ensemble_id, quantite')
        .single()

      if (error) throw error
      const graph = await fetchGraph()
      return { ...data, ensembles_matieres: hydrateEnsemble(ensembleId, graph) }
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
        .select('id, commande_id, ensemble_id, quantite')
        .single()

      if (error) throw error
      const graph = await fetchGraph()
      return { ...data, ensembles_matieres: hydrateEnsemble(data.ensemble_id, graph) }
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
    getCategories,
    createCategorie,
    updateCategorie,
    deleteCategorie,
    setEnsembleCategorie,
    categoriePalette,
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
    // Helpers arbre réutilisables par les consommateurs
    countArticlesRecursive,
    prixTotalRecursive,
    flattenArticles,
  }
}
