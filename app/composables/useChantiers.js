export const useChantiers = () => {
  const supabase = useSupabaseClient()
  const { addToast } = useToast()
  const allChantiers = useState('allChantiers', () => [])
  const user = useAuthUser()
  const allChantiersUserNonTermines = useState('allChantiersUserNonTermines', () => [])

  // Fonction principale pour récupérer tous les chantiers
  const getChantiers = async () => {
    try {
      const { data, error } = await supabase
        .from('chantiers')
        .select('id, compte, name, ligne_id, matiere, matiere_da, etat, lignes(id, name), date_rea, date_prepa, autre, attribution, etat_pit, externe, chef_projet_responsable_email')
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

  const userIsInChantier = (contacts, email) => {
    if (!contacts || !email) return false

    return Object.values(contacts).some((value) => {
      if (!value) return false

      // cas tableau d'emails
      if (Array.isArray(value)) {
        return value.includes(email)
      }

      // cas email unique (string)
      if (typeof value === 'string') {
        return value === email
      }

      return false
    })
  }

  const getChantiersUserNonTermines = async () => {
    try {
      const email = user.value?.email
      const isPreop = user.value?.pre_op === true

      let query = supabase
        .from('chantiers')
        .select(
          'id, compte, name, ligne_id, matiere, matiere_da, etat, lignes(id, name), date_rea, date_prepa, autre, chantier_contacts_travaux(rlt_voie_principale, rlt_voie_secondaire, rlt_ses_principale, rlt_ses_secondaire, rlt_cat_principale, rlt_cat_secondaire, preop_voie, preop_ses, logistique, supervisor),h00(id, chantier_id, tache_id, commentaire, status,prevision, important,alerte, cloture_profil)'
        )

      // 🎯 CONDITION MÉTIER ICI
      if (isPreop) {
        query = query.eq('etat', 2)
      } else {
        query = query.gt('etat', -1)
      }

      const { data, error } = await query

      if (error) throw error

      allChantiersUserNonTermines.value = (data ?? [])
        .filter((chantier) => userIsInChantier(chantier.chantier_contacts_travaux, email))
        .map((chantier) => ({
          ...chantier,
          ligne: chantier.lignes?.name || null
        }))
    } catch (err) {
      console.error('Erreur lors du chargement des chantiers:', err)
      allChantiersUserNonTermines.value = []
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

      $fetch('/api/email/send', { method: 'POST', body: { type: 'passation', chantierId } }).catch(console.error)

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
          autre: chantierData.autre || null,
          attribution: chantierData.attribution || 'UO Travaux',
          etat_pit: chantierData.etat_pit || null,
          externe: chantierData.externe ?? false,
          chef_projet_responsable_email: chantierData.chef_projet_responsable_email || null
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
          'id, compte, name, ligne_id, date_rea, date_prepa, etat, type_essais, decret, matiere, matiere_da, compte_moe, compte_slg, compte_matieres, autre, lignes(id, name), chantier_contacts_travaux(rlt_voie_principale, rlt_voie_secondaire, rlt_ses_principale, rlt_ses_secondaire, rlt_cat_principale, rlt_cat_secondaire, preop_voie, preop_ses, logistique, supervisor)'
        )
        .eq('id', id)
        .single()

      if (error) {
        console.error('Erreur Supabase:', error)
        throw error
      }

      if (data) {
        const email = user.value?.email
        const isConcerned = userIsInChantier(data.chantier_contacts_travaux, email)

        return {
          ...data,
          ligne: data.lignes?.name || null,
          isConcerned
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
  const updateChantier = async (id, updates, { datesChanged = false, oldDateRea = null, oldDatePrepa = null } = {}) => {
    try {
      const { data, error } = await supabase
        .from('chantiers')
        .update(updates)
        .eq('id', id)
        .select(
          'id, compte, name, ligne_id, date_rea, date_prepa, etat, type_essais, decret, matiere, matiere_da, compte_moe, compte_slg, compte_matieres, autre, attribution, etat_pit, externe, chef_projet_responsable_email, lignes(id, name)'
        )
        .maybeSingle()

      if (error) throw error

      addToast({
        title: 'Chantier mis à jour',
        message: 'Les informations ont été enregistrées avec succès.',
        type: 'Success'
      })

      if (datesChanged) {
        $fetch('/api/email/send', { method: 'POST', body: { type: 'modification_dates', chantierId: id, oldDateRea, oldDatePrepa } }).catch(console.error)
      }

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
    getChantiersUserNonTermines,
    updateChantier,
    createChantier,
    allChantiersUserNonTermines,
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
