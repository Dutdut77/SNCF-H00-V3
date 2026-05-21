export const useAssistants = () => {
  const client = useSupabaseClient()
  const { addToast } = useToast()

  // ─── Logiques ─────────────────────────────────────────────────────────────

  // Liste avec compteur de questions
  // !logique_id : précise la FK à utiliser (il y en a 2 entre logiques et questions :
  // start_question_id côté logiques + logique_id côté questions)
  const getLogiques = async () => {
    try {
      const { data, error } = await client
        .from('assistants_logiques')
        .select('*, assistants_questions!logique_id(count)')
        .order('nom')

      if (error) throw error
      return (data || []).map((l) => ({
        ...l,
        nb_questions: l.assistants_questions?.[0]?.count ?? 0,
      }))
    } catch (err) {
      console.error('Erreur récupération logiques:', err)
      addToast({ title: 'Erreur', message: err.message, type: 'Error' })
      return []
    }
  }

  // Logique complètement hydratée : questions + réponses + articles + ensembles
  const getLogique = async (id) => {
    try {
      const [
        { data: logique, error: e1 },
        { data: questions, error: e2 },
        { data: reponses, error: e3 },
        { data: articles, error: e4 },
        { data: ensembles, error: e5 },
      ] = await Promise.all([
        client.from('assistants_logiques').select('*').eq('id', id).single(),
        client.from('assistants_questions').select('*').eq('logique_id', id).order('ordre'),
        client.from('assistants_reponses').select('*').order('ordre'),
        client.from('assistants_reponses_articles').select('*, catalogue_matieres(*)'),
        client.from('assistants_reponses_ensembles').select('*, ensembles_matieres(id, nom, description)'),
      ])
      if (e1) throw e1
      if (e2) throw e2
      if (e3) throw e3
      if (e4) throw e4
      if (e5) throw e5

      const questionIds = new Set((questions || []).map((q) => q.id))
      const reponsesParQuestion = new Map()
      const articlesParReponse = new Map()
      const ensemblesParReponse = new Map()

      for (const r of reponses || []) {
        if (!questionIds.has(r.question_id)) continue
        if (!reponsesParQuestion.has(r.question_id)) reponsesParQuestion.set(r.question_id, [])
        reponsesParQuestion.get(r.question_id).push(r)
      }
      const reponseIds = new Set((reponses || []).flatMap((r) => questionIds.has(r.question_id) ? [r.id] : []))
      for (const a of articles || []) {
        if (!reponseIds.has(a.reponse_id)) continue
        if (!articlesParReponse.has(a.reponse_id)) articlesParReponse.set(a.reponse_id, [])
        articlesParReponse.get(a.reponse_id).push(a)
      }
      for (const e of ensembles || []) {
        if (!reponseIds.has(e.reponse_id)) continue
        if (!ensemblesParReponse.has(e.reponse_id)) ensemblesParReponse.set(e.reponse_id, [])
        ensemblesParReponse.get(e.reponse_id).push(e)
      }

      const hydratedQuestions = (questions || []).map((q) => ({
        ...q,
        reponses: (reponsesParQuestion.get(q.id) || []).map((r) => ({
          ...r,
          articles: articlesParReponse.get(r.id) || [],
          ensembles: ensemblesParReponse.get(r.id) || [],
        })),
      }))

      return { ...logique, questions: hydratedQuestions }
    } catch (err) {
      console.error('Erreur récupération logique:', err)
      addToast({ title: 'Erreur', message: err.message, type: 'Error' })
      return null
    }
  }

  const createLogique = async (payload) => {
    try {
      const { data, error } = await client
        .from('assistants_logiques')
        .insert(payload)
        .select('*')
        .single()

      if (error) throw error
      addToast({ title: 'Succès', message: 'Logique créée', type: 'Success' })
      return { ...data, nb_questions: 0 }
    } catch (err) {
      console.error('Erreur création logique:', err)
      addToast({ title: 'Erreur', message: err.message, type: 'Error' })
      return null
    }
  }

  const updateLogique = async (id, payload) => {
    try {
      const { data, error } = await client
        .from('assistants_logiques')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select('*')
        .single()

      if (error) throw error
      return data
    } catch (err) {
      console.error('Erreur mise à jour logique:', err)
      addToast({ title: 'Erreur', message: err.message, type: 'Error' })
      return null
    }
  }

  const deleteLogique = async (id) => {
    try {
      const { error } = await client.from('assistants_logiques').delete().eq('id', id)
      if (error) throw error
      addToast({ title: 'Succès', message: 'Logique supprimée', type: 'Success' })
      return true
    } catch (err) {
      console.error('Erreur suppression logique:', err)
      addToast({ title: 'Erreur', message: err.message, type: 'Error' })
      return false
    }
  }

  // ─── Questions ────────────────────────────────────────────────────────────

  const createQuestion = async (logiqueId, payload) => {
    try {
      const { data, error } = await client
        .from('assistants_questions')
        .insert({ ...payload, logique_id: logiqueId })
        .select('*')
        .single()

      if (error) throw error
      return { ...data, reponses: [] }
    } catch (err) {
      console.error('Erreur création question:', err)
      addToast({ title: 'Erreur', message: err.message, type: 'Error' })
      return null
    }
  }

  const updateQuestion = async (id, payload) => {
    try {
      const { data, error } = await client
        .from('assistants_questions')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select('*')
        .single()

      if (error) throw error
      return data
    } catch (err) {
      console.error('Erreur mise à jour question:', err)
      addToast({ title: 'Erreur', message: err.message, type: 'Error' })
      return null
    }
  }

  const deleteQuestion = async (id) => {
    try {
      const { error } = await client.from('assistants_questions').delete().eq('id', id)
      if (error) throw error
      return true
    } catch (err) {
      console.error('Erreur suppression question:', err)
      addToast({ title: 'Erreur', message: err.message, type: 'Error' })
      return false
    }
  }

  // ─── Réponses ─────────────────────────────────────────────────────────────

  const createReponse = async (questionId, payload) => {
    try {
      const { data, error } = await client
        .from('assistants_reponses')
        .insert({ ...payload, question_id: questionId })
        .select('*')
        .single()

      if (error) throw error
      return { ...data, articles: [], ensembles: [] }
    } catch (err) {
      console.error('Erreur création réponse:', err)
      addToast({ title: 'Erreur', message: err.message, type: 'Error' })
      return null
    }
  }

  const updateReponse = async (id, payload) => {
    try {
      const { data, error } = await client
        .from('assistants_reponses')
        .update(payload)
        .eq('id', id)
        .select('*')
        .single()

      if (error) throw error
      return data
    } catch (err) {
      console.error('Erreur mise à jour réponse:', err)
      addToast({ title: 'Erreur', message: err.message, type: 'Error' })
      return null
    }
  }

  const deleteReponse = async (id) => {
    try {
      const { error } = await client.from('assistants_reponses').delete().eq('id', id)
      if (error) throw error
      return true
    } catch (err) {
      console.error('Erreur suppression réponse:', err)
      addToast({ title: 'Erreur', message: err.message, type: 'Error' })
      return false
    }
  }

  // ─── Attachements articles ────────────────────────────────────────────────

  const attachArticleToReponse = async (reponseId, numeroSymbole, quantite = 1) => {
    try {
      const { data, error } = await client
        .from('assistants_reponses_articles')
        .insert({ reponse_id: reponseId, numero_symbole: numeroSymbole, quantite })
        .select('*, catalogue_matieres(*)')
        .single()

      if (error) throw error
      return data
    } catch (err) {
      console.error('Erreur attachement article:', err)
      addToast({ title: 'Erreur', message: err.message, type: 'Error' })
      return null
    }
  }

  const detachArticleFromReponse = async (id) => {
    try {
      const { error } = await client.from('assistants_reponses_articles').delete().eq('id', id)
      if (error) throw error
      return true
    } catch (err) {
      console.error('Erreur détachement article:', err)
      addToast({ title: 'Erreur', message: err.message, type: 'Error' })
      return false
    }
  }

  const updateAttachedArticleQuantite = async (id, quantite) => {
    try {
      const { data, error } = await client
        .from('assistants_reponses_articles')
        .update({ quantite })
        .eq('id', id)
        .select('*, catalogue_matieres(*)')
        .single()

      if (error) throw error
      return data
    } catch (err) {
      console.error('Erreur maj qté article:', err)
      addToast({ title: 'Erreur', message: err.message, type: 'Error' })
      return null
    }
  }

  // ─── Attachements ensembles ───────────────────────────────────────────────

  const attachEnsembleToReponse = async (reponseId, ensembleId, quantite = 1) => {
    try {
      const { data, error } = await client
        .from('assistants_reponses_ensembles')
        .insert({ reponse_id: reponseId, ensemble_id: ensembleId, quantite })
        .select('*, ensembles_matieres(id, nom, description)')
        .single()

      if (error) throw error
      return data
    } catch (err) {
      console.error('Erreur attachement ensemble:', err)
      addToast({ title: 'Erreur', message: err.message, type: 'Error' })
      return null
    }
  }

  const detachEnsembleFromReponse = async (id) => {
    try {
      const { error } = await client.from('assistants_reponses_ensembles').delete().eq('id', id)
      if (error) throw error
      return true
    } catch (err) {
      console.error('Erreur détachement ensemble:', err)
      addToast({ title: 'Erreur', message: err.message, type: 'Error' })
      return false
    }
  }

  const updateAttachedEnsembleQuantite = async (id, quantite) => {
    try {
      const { data, error } = await client
        .from('assistants_reponses_ensembles')
        .update({ quantite })
        .eq('id', id)
        .select('*, ensembles_matieres(id, nom, description)')
        .single()

      if (error) throw error
      return data
    } catch (err) {
      console.error('Erreur maj qté ensemble:', err)
      addToast({ title: 'Erreur', message: err.message, type: 'Error' })
      return null
    }
  }

  return {
    getLogiques, getLogique, createLogique, updateLogique, deleteLogique,
    createQuestion, updateQuestion, deleteQuestion,
    createReponse, updateReponse, deleteReponse,
    attachArticleToReponse, detachArticleFromReponse, updateAttachedArticleQuantite,
    attachEnsembleToReponse, detachEnsembleFromReponse, updateAttachedEnsembleQuantite,
  }
}
