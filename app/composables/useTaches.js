export const useTaches = () => {
  const supabase = useSupabaseClient()
  const { addToast } = useToast()
  const { getChantiers, getAllChantiers } = useChantiers()
  const { createH00Entries } = useH00()
  const allTaches = useState('taches_list', () => [])
  const allTachesRp1 = useState('taches_list_rp1', () => [])

  // Fonction principale pour récupérer toutes les tâches avec leurs catégories
  const getTaches = async () => {
    try {
      const { data, error } = await supabase
        .from('taches')
        .select('idtaches, id_categories, tache, delais, tache_profil, opt_delais, rp1, categories(idcategories, name)')
        .order('delais', { ascending: false })

      if (error) {
        console.error('Erreur Supabase:', error)
        throw error
      }

      if (data && Array.isArray(data)) {
        allTaches.value = data.map((t) => ({
          id: t.idtaches,
          id_categories: t.id_categories,
          tache: t.tache,
          delais: t.delais,
          tache_profil: t.tache_profil || [],
          opt_delais: t.opt_delais,
          rp1: t.rp1,
          categorie: t.categories?.name || null
        }))
      } else {
        allTaches.value = []
      }
    } catch (err) {
      console.error('Erreur lors du chargement des tâches:', err)
      allTaches.value = []
      addToast({
        title: 'Problème lors du chargement des tâches',
        message: err.message || "La table taches n'existe peut-être pas encore.",
        type: 'Error'
      })
    }
  }

  // Fonction principale pour récupérer toutes les tâches avec leurs catégories
  const getTachesRp1 = async () => {
    try {
      const { data, error } = await supabase
        .from('taches')
        .select('idtaches, id_categories, tache, delais, tache_profil, opt_delais, rp1, categories(idcategories, name)')
        .eq('rp1', 1)
        .order('delais', { ascending: false })

      if (error) {
        console.error('Erreur Supabase:', error)
        throw error
      }

      if (data && Array.isArray(data)) {
        allTachesRp1.value = data.map((t) => ({
          id: t.idtaches,
          id_categories: t.id_categories,
          tache: t.tache,
          delais: t.delais,
          tache_profil: t.tache_profil || [],
          opt_delais: t.opt_delais,
          rp1: t.rp1,
          categorie: t.categories?.name || null
        }))
      } else {
        allTachesRp1.value = []
      }
    } catch (err) {
      console.error('Erreur lors du chargement des tâches RP1:', err)
      allTachesRp1.value = []
      addToast({
        title: 'Problème lors du chargement des tâches RP1',
        message: err.message || "La table taches RP1 n'existe peut-être pas encore.",
        type: 'Error'
      })
    }
  }

  // Fonction pour calculer la date de prévision d'une tâche
  const calculatePrevisionDate = (referenceDate, delais, optDelais, endDate = null) => {
    if (!referenceDate) return null

    let baseDate
    if (optDelais === 1 && endDate) {
      baseDate = new Date(endDate)
    } else {
      baseDate = new Date(referenceDate)
    }

    baseDate.setDate(baseDate.getDate() - delais)
    return baseDate.toISOString().split('T')[0]
  }

  // Fonction pour créer une tâche
  const createTache = async (tacheData) => {
    try {
      const { data, error } = await supabase
        .from('taches')
        .insert({
          id_categories: tacheData.id_categories,
          tache: tacheData.tache,
          delais: tacheData.delais,
          tache_profil: tacheData.tache_profil || [],
          opt_delais: tacheData.opt_delais || 0,
          rp1: tacheData.rp1 || 0
        })
        .select()
        .single()

      if (error) throw error

      // console.log('Tâche créée:', data)
      await getChantiers()
      const chantiersFiltres = getAllChantiers.value.filter((chantier) => chantier.etat === 0 || chantier.etat === 2)

      const h00Entries = chantiersFiltres.map((chantier) => {
        const starts = (chantier.date_rea || [])
          .map((r) => r.date_start_travaux)
          .filter(Boolean)
          .map((d) => new Date(d))

        const ends = (chantier.date_rea || [])
          .map((r) => r.date_end_travaux)
          .filter(Boolean)
          .map((d) => new Date(d))

        const earliestReaDate = starts.length ? new Date(Math.min(...starts)) : null

        const latestEndDate = ends.length ? new Date(Math.max(...ends)) : null

        const previsionDate = calculatePrevisionDate(
          earliestReaDate,
          data.delais || 0,
          data.opt_delais || 0,
          latestEndDate
        )

        return {
          chantier_id: chantier.id,
          tache_id: data.idtaches,
          categorie_id: data.id_categories,
          prevision: previsionDate,
          realisation: null,
          commentaire: null
        }
      })

      await createH00Entries(h00Entries)

      await getTaches()

      addToast({
        title: 'Tâche créée',
        message: `La tâche a été créée avec succès.`,
        type: 'Success'
      })

      return data
    } catch (err) {
      addToast({
        title: 'Erreur',
        message: err.message || 'Impossible de créer la tâche',
        type: 'Error'
      })
      return null
    }
  }

  // Fonction pour modifier une tâche
  // Si delais ou opt_delais a changé, met également à jour les prévisions dans h00
  const updateTache = async (tacheId, tacheData, oldTache = null) => {
    try {
      const { error } = await supabase
        .from('taches')
        .update({
          id_categories: tacheData.id_categories,
          tache: tacheData.tache,
          delais: tacheData.delais,
          tache_profil: tacheData.tache_profil || [],
          opt_delais: tacheData.opt_delais,
          rp1: tacheData.rp1
        })
        .eq('idtaches', tacheId)

      if (error) throw error

      // Vérifier si delais ou opt_delais a changé
      const delaisChanged =
        oldTache && (oldTache.delais !== tacheData.delais || oldTache.opt_delais !== tacheData.opt_delais)

      if (delaisChanged) {
        // Mettre à jour les prévisions dans h00 pour cette tâche
        await updateH00Previsions(tacheId, tacheData.delais, tacheData.opt_delais)
      }

      await getTaches()

      addToast({
        title: 'Tâche modifiée',
        message: delaisChanged
          ? 'La tâche et les prévisions associées ont été mises à jour.'
          : 'La tâche a été modifiée avec succès.',
        type: 'Success'
      })

      return true
    } catch (err) {
      addToast({
        title: 'Erreur',
        message: err.message || 'Impossible de modifier la tâche',
        type: 'Error'
      })
      return false
    }
  }

  // Fonction pour mettre à jour les prévisions dans h00
  const updateH00Previsions = async (tacheId, delais, optDelais) => {
    try {
      // Récupérer toutes les lignes h00 qui ont cette tâche avec les infos du chantier
      const { data: h00Rows, error: fetchError } = await supabase
        .from('h00')
        .select('id, chantier_id, categorie_id, tache_id, chantiers(id,date_rea)')
        .eq('tache_id', tacheId)

      if (fetchError) throw fetchError

      if (!h00Rows || h00Rows.length === 0) return

      // // Préparer les mises à jour
      const updates = h00Rows
        .map((row) => {
          const dateRea = row.chantiers?.date_rea || []

          const starts = dateRea
            .map((r) => r.date_start_travaux)
            .filter(Boolean)
            .map((d) => new Date(d))

          const ends = dateRea
            .map((r) => r.date_end_travaux)
            .filter(Boolean)
            .map((d) => new Date(d))

          if (!starts.length) return null

          const earliestReaDate = new Date(Math.min(...starts))
          const latestEndDate = ends.length ? new Date(Math.max(...ends)) : null

          const previsionDate = calculatePrevisionDate(earliestReaDate, delais || 0, optDelais || 0, latestEndDate)

          if (!previsionDate) return null

          return {
            id: row.id,
            chantier_id: row.chantiers?.id,
            tache_id: row.tache_id,
            categorie_id: row.categorie_id,
            prevision: previsionDate
          }
        })
        .filter(Boolean)

      if (updates.length > 0) {
        const { error: updateError } = await supabase.from('h00').upsert(updates, { onConflict: 'id' })

        if (updateError) throw updateError
      }

      console.log(`${updates.length} prévisions mises à jour dans h00`)
    } catch (err) {
      console.error('Erreur lors de la mise à jour des prévisions h00:', err)
      throw err
    }
  }

  // Fonction pour supprimer une tâche
  const deleteTache = async (tacheId) => {
    try {
      const { error } = await supabase.from('taches').delete().eq('idtaches', tacheId)

      if (error) throw error

      await getTaches()

      addToast({
        title: 'Tâche supprimée',
        message: 'La tâche a été supprimée avec succès.',
        type: 'Success'
      })

      return true
    } catch (err) {
      addToast({
        title: 'Erreur',
        message: err.message || 'Impossible de supprimer la tâche',
        type: 'Error'
      })
      return false
    }
  }

  // Computed pour obtenir les tâches triées
  const tachesSorted = computed(() => {
    return [...allTaches.value].sort((a, b) => a.tache.localeCompare(b.tache))
  })

  // Computed pour obtenir les tâches par catégorie
  const tachesByCategorie = computed(() => {
    const grouped = {}
    allTaches.value.forEach((t) => {
      const cat = t.categorie || 'Sans catégorie'
      if (!grouped[cat]) grouped[cat] = []
      grouped[cat].push(t)
    })
    return grouped
  })

  return {
    taches: allTaches,
    allTachesRp1,
    tachesSorted,
    tachesByCategorie,
    getTaches,
    getTachesRp1,
    createTache,
    updateTache,
    deleteTache,
    updateH00Previsions
  }
}
