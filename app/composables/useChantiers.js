export const useChantiers = () => {
  const supabase = useSupabaseClient()
  const { addToast } = useToast()
  const allChantiers = useState('allChantiers', () => [])

  // Fonction principale pour récupérer tous les chantiers
  const getChantiers = async () => {
    try {
      const { data, error } = await supabase
        .from('chantiers')
        .select(
          'id, compte, name, ligne_id, date_start_travaux, date_end_travaux, etat, lignes(id, name), date_rea, date_prepa, autre'
        )
      // .order('date_start_travaux', { ascending: false })

      if (error) {
        console.error('Erreur Supabase:', error)
        throw error
      }

      if (data && Array.isArray(data)) {
        allChantiers.value = data.map((chantier) => ({
          ...chantier,
          ligne: chantier.lignes?.name || null
        }))
      } else {
        allChantiers.value = []
      }
    } catch (err) {
      console.error('Erreur lors du chargement des chantiers:', err)
      allChantiers.value = []
      addToast({
        title: 'Problème lors du chargement des chantiers',
        message: err.message || "La table chantiers n'existe peut-être pas encore.",
        type: 'Error'
      })
    }
  }

  const getAllChantiers = computed(() => {
    return allChantiers.value
  })

  // Computed pour obtenir les chantiers par état
  const getChantiersEtat2 = computed(() => {
    return allChantiers.value.filter((chantier) => chantier.etat === 2)
  })

  const getChantiersEtat1 = computed(() => {
    return allChantiers.value.filter((chantier) => chantier.etat === 1)
  })

  const getChantiersEtat0 = computed(() => {
    return allChantiers.value.filter((chantier) => chantier.etat === 0)
  })

  const getChantiersTermines = computed(() => {
    return allChantiers.value.filter((chantier) => chantier.etat === -1)
  })

  const getChantiersNonTermines = computed(() => {
    return allChantiers.value.filter((chantier) => chantier.etat !== -1)
  })

  // Fonction pour passer un chantier (état 2 → 0)
  const passerChantier = async (chantierId) => {
    try {
      const { error } = await supabase.from('chantiers').update({ etat: 0 }).eq('id', chantierId)

      if (error) throw error

      await getChantiers()

      addToast({
        title: 'Chantier passé',
        message: 'Le chantier a été passé au RLT avec succès.',
        type: 'Success'
      })

      return true
    } catch (err) {
      addToast({
        title: 'Erreur',
        message: err.message || 'Impossible de passer le chantier',
        type: 'Error'
      })
      return false
    }
  }

  // Fonction pour terminer un chantier (état 0 ou 1 → -1)
  const terminerChantier = async (chantierId) => {
    try {
      const { error } = await supabase.from('chantiers').update({ etat: -1 }).eq('id', chantierId)

      if (error) throw error

      await getChantiers()

      addToast({
        title: 'Chantier terminé',
        message: 'Le chantier a été terminé avec succès.',
        type: 'Success'
      })

      return true
    } catch (err) {
      addToast({
        title: 'Erreur',
        message: err.message || 'Impossible de terminer le chantier',
        type: 'Error'
      })
      return false
    }
  }

  // Fonction pour supprimer un chantier
  const supprimerChantier = async (chantierId) => {
    try {
      const { error } = await supabase.from('chantiers').delete().eq('id', chantierId)

      if (error) throw error

      await getChantiers()

      addToast({
        title: 'Chantier supprimé',
        message: 'Le chantier a été supprimé avec succès.',
        type: 'Success'
      })

      return true
    } catch (err) {
      addToast({
        title: 'Erreur',
        message: err.message || 'Impossible de supprimer le chantier',
        type: 'Error'
      })
      return false
    }
  }

  // Fonction pour créer un nouveau chantier
  const createChantier = async (chantierData) => {
    try {
      const { data, error } = await supabase
        .from('chantiers')
        .insert({
          compte: chantierData.compte,
          name: chantierData.name,
          etat: chantierData.etat,
          date_rea: chantierData.date_rea || [],
          date_prepa: chantierData.date_prepa || [],
          autre: chantierData.autre || null
        })
        .select()
        .single()

      if (error) throw error

      await getChantiers()

      addToast({
        title: 'Chantier créé',
        message: 'Le chantier a été créé avec succès.',
        type: 'Success'
      })

      return data
    } catch (err) {
      addToast({
        title: 'Erreur',
        message: err.message || 'Impossible de créer le chantier',
        type: 'Error'
      })
      return null
    }
  }

  // Fonction pour récupérer un chantier par son ID
  const getChantierById = async (id) => {
    try {
      const { data, error } = await supabase
        .from('chantiers')
        .select(
          'id, compte, name, ligne_id, date_rea, date_prepa, etat, type_essais, decret, matiere, compte_moe, compte_slg, compte_matieres, autre, lignes(id, name)'
        )
        .eq('id', id)
        .single()

      if (error) {
        console.error('Erreur Supabase:', error)
        throw error
      }

      if (data) {
        return {
          ...data,
          ligne: data.lignes?.name || null
        }
      }
      return null
    } catch (err) {
      console.error('Erreur lors du chargement du chantier:', err)
      addToast({
        title: 'Problème lors du chargement du chantier',
        message: err.message || "Le chantier n'a pas pu être chargé.",
        type: 'Error'
      })
      return null
    }
  }

  // Fonction pour mettre à jour un chantier
  const updateChantier = async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('chantiers')
        .update(updates)
        .eq('id', id)
        .select(
          'id, compte, name, ligne_id, date_rea, date_prepa, etat, type_essais, decret, matiere, compte_moe, compte_slg, compte_matieres, autre, lignes(id, name)'
        )
        .maybeSingle()

      if (error) throw error

      addToast({
        title: 'Chantier mis à jour',
        message: 'Les informations ont été enregistrées avec succès.',
        type: 'Success'
      })

      if (data) {
        return {
          ...data,
          ligne: data.lignes?.name || null
        }
      }
      return null
    } catch (err) {
      console.error('Erreur lors de la mise à jour du chantier:', err)
      addToast({
        title: 'Erreur',
        message: err.message || 'Impossible de mettre à jour le chantier',
        type: 'Error'
      })
      return null
    }
  }

  return {
    getChantiers,
    getChantierById,
    updateChantier,
    createChantier,
    getAllChantiers,
    getChantiersEtat2,
    getChantiersEtat1,
    getChantiersEtat0,
    getChantiersTermines,
    getChantiersNonTermines,
    passerChantier,
    terminerChantier,
    supprimerChantier
  }
}
