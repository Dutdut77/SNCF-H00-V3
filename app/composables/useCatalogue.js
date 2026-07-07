// Gestion du catalogue d'articles (catalogue_matieres) : consultation paginée,
// édition ponctuelle et primitives d'import en masse (utilisées par
// CatalogueMatieresImportModal). Le catalogue est commun à tous les métiers.

// Origines possibles d'un article (colonne `origine`, CHECK en base)
const ORIGINES = [
  { id: 'supply_chain', label: 'Symbolisé' },
  { id: 'contrat_cadre', label: 'Contrat cadre' },
]
const origineLabel = (id) => ORIGINES.find((o) => o.id === id)?.label ?? id

// Tables référentes de catalogue_matieres (FK numero_symbole ON DELETE RESTRICT) :
// un article présent dans l'une d'elles ne doit jamais être supprimé.
const REF_TABLES = [
  'commandes_matieres_lignes',
  'ensembles_matieres_lignes',
  'assistants_reponses_articles',
]

const CHUNK_IN = 400 // les filtres .in() passent dans l'URL — rester bien sous la limite
const CHUNK_UPSERT = 500
const PAGE_DB = 1000 // plafond de lignes par requête Supabase
const PARALLEL_WAVES = 4 // requêtes .in() simultanées lors des lectures chunkées

const chunk = (arr, size) => {
  const out = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

export const useCatalogue = () => {
  const client = useSupabaseClient()
  const { addToast } = useToast()

  // ─── Consultation ──────────────────────────────────────────────────────────

  const getStats = async () => {
    try {
      const [sc, cc, last] = await Promise.all([
        client.from('catalogue_matieres').select('*', { count: 'exact', head: true }).eq('origine', 'supply_chain'),
        client.from('catalogue_matieres').select('*', { count: 'exact', head: true }).eq('origine', 'contrat_cadre'),
        client.from('catalogue_matieres').select('updated_at').order('updated_at', { ascending: false }).limit(1),
      ])
      if (sc.error) throw sc.error
      if (cc.error) throw cc.error
      if (last.error) throw last.error
      return {
        supplyChain: sc.count ?? 0,
        contratCadre: cc.count ?? 0,
        lastUpdate: last.data?.[0]?.updated_at ?? null,
      }
    } catch (err) {
      console.error('Erreur stats catalogue:', err)
      addToast({ title: 'Erreur', message: err.message, type: 'Error' })
      return { supplyChain: 0, contratCadre: 0, lastUpdate: null }
    }
  }

  const getPage = async ({ page = 1, pageSize = 50, search = '', origine = null } = {}) => {
    try {
      let query = client
        .from('catalogue_matieres')
        .select('numero_symbole, description, prix_ud, unite_distribution, origine, famille, updated_at', { count: 'exact' })
      // Les virgules/parenthèses sont des séparateurs de syntaxe pour .or()
      const s = String(search ?? '').trim().replace(/[,()]/g, ' ').trim()
      if (s.length >= 2) query = query.or(`numero_symbole.ilike.%${s}%,description.ilike.%${s}%`)
      if (origine) query = query.eq('origine', origine)
      const from = (page - 1) * pageSize
      const { data, count, error } = await query.order('numero_symbole').range(from, from + pageSize - 1)
      if (error) throw error
      return { rows: data ?? [], count: count ?? 0 }
    } catch (err) {
      console.error('Erreur page catalogue:', err)
      addToast({ title: 'Erreur', message: err.message, type: 'Error' })
      return { rows: [], count: 0 }
    }
  }

  const updateArticle = async (numeroSymbole, payload) => {
    try {
      const { data, error } = await client
        .from('catalogue_matieres')
        .update(payload)
        .eq('numero_symbole', numeroSymbole)
        .select()
        .single()

      if (error) throw error
      addToast({ title: 'Succès', message: 'Article mis à jour', type: 'Success' })
      return data
    } catch (err) {
      console.error('Erreur mise à jour article:', err)
      addToast({ title: 'Erreur', message: err.message, type: 'Error' })
      return null
    }
  }

  const getUnites = async () => {
    try {
      const { data, error } = await client
        .from('catalogue_unites_distribution')
        .select('code, designation, quantite_par_unite')
        .order('code')
      if (error) throw error
      return data ?? []
    } catch (err) {
      console.error('Erreur unités de distribution:', err)
      addToast({ title: 'Erreur', message: err.message, type: 'Error' })
      return []
    }
  }

  // ─── Import : lectures chunkées (throw — l'appelant gère l'erreur) ─────────

  // Tous les numéros de symbole d'une origine (pour le calcul des absents).
  const fetchSymbolesByOrigine = async (origine) => {
    const result = new Set()
    for (let from = 0; ; from += PAGE_DB) {
      const { data, error } = await client
        .from('catalogue_matieres')
        .select('numero_symbole')
        .eq('origine', origine)
        .order('numero_symbole')
        .range(from, from + PAGE_DB - 1)
      if (error) throw error
      for (const r of data ?? []) result.add(r.numero_symbole)
      if (!data || data.length < PAGE_DB) break
    }
    return result
  }

  // Lignes existantes matchant une liste de symboles → Map(numero_symbole → row).
  const fetchExistingBySymboles = async (symboles) => {
    const map = new Map()
    const chunks = chunk([...symboles], CHUNK_IN)
    for (let i = 0; i < chunks.length; i += PARALLEL_WAVES) {
      const wave = chunks.slice(i, i + PARALLEL_WAVES)
      const results = await Promise.all(
        wave.map((c) => client.from('catalogue_matieres').select('*').in('numero_symbole', c)),
      )
      for (const { data, error } of results) {
        if (error) throw error
        for (const row of data ?? []) map.set(row.numero_symbole, row)
      }
    }
    return map
  }

  // Symboles référencés (parmi une liste) par au moins une des REF_TABLES.
  // Chaque chunk est repaginé : un symbole peut être référencé par >1000 lignes.
  const fetchReferencedSymboles = async (symboles) => {
    const referenced = new Set()
    const chunks = chunk([...symboles], CHUNK_IN)
    const fetchChunk = async (table, c) => {
      const found = new Set()
      for (let from = 0; ; from += PAGE_DB) {
        const { data, error } = await client
          .from(table)
          .select('numero_symbole')
          .in('numero_symbole', c)
          .range(from, from + PAGE_DB - 1)
        if (error) throw error
        for (const r of data ?? []) found.add(r.numero_symbole)
        if (!data || data.length < PAGE_DB) break
      }
      return found
    }
    for (const table of REF_TABLES) {
      for (let i = 0; i < chunks.length; i += PARALLEL_WAVES) {
        const wave = chunks.slice(i, i + PARALLEL_WAVES)
        const results = await Promise.all(wave.map((c) => fetchChunk(table, c)))
        for (const found of results) for (const s of found) referenced.add(s)
      }
    }
    return referenced
  }

  // ─── Import : écritures ─────────────────────────────────────────────────────

  // Crée les codes UD absents du référentiel (designation = code, quantité inconnue).
  const insertMissingUnites = async (codes) => {
    const clean = [...new Set(codes.filter(Boolean))]
    if (!clean.length) return 0
    const { data, error } = await client.from('catalogue_unites_distribution').select('code')
    if (error) throw error
    const existing = new Set((data ?? []).map((r) => r.code))
    const missing = clean
      .filter((c) => !existing.has(c))
      .map((code) => ({ code, designation: code, quantite_par_unite: null }))
    if (!missing.length) return 0
    const { error: insErr } = await client.from('catalogue_unites_distribution').insert(missing)
    if (insErr) throw insErr
    return missing.length
  }

  const upsertArticles = async (articles, onProgress = null) => {
    let done = 0
    for (const slice of chunk(articles, CHUNK_UPSERT)) {
      const { error } = await client
        .from('catalogue_matieres')
        .upsert(slice, { onConflict: 'numero_symbole' })
      if (error) throw error
      done += slice.length
      onProgress?.(done, articles.length)
    }
    return done
  }

  // Supprime des articles par symbole, restreints à une origine (garde-fou).
  // Les FK ON DELETE RESTRICT font échouer le chunk si un article vient d'être
  // référencé entre l'analyse et la suppression : on s'arrête au compte partiel.
  const deleteAbsents = async (symboles, origine, onProgress = null) => {
    const list = [...symboles]
    let done = 0
    for (const slice of chunk(list, CHUNK_IN)) {
      const { error } = await client
        .from('catalogue_matieres')
        .delete()
        .in('numero_symbole', slice)
        .eq('origine', origine)
      if (error) {
        console.error('Erreur suppression articles absents:', error)
        addToast({
          title: 'Erreur',
          message: `Suppression interrompue (${done}/${list.length}) : ${error.message}`,
          type: 'Error',
        })
        return done
      }
      done += slice.length
      onProgress?.(done, list.length)
    }
    return done
  }

  return {
    ORIGINES,
    origineLabel,
    getStats,
    getPage,
    updateArticle,
    getUnites,
    fetchSymbolesByOrigine,
    fetchExistingBySymboles,
    fetchReferencedSymboles,
    insertMissingUnites,
    upsertArticles,
    deleteAbsents,
  }
}
