export const useContacts = () => {
  const client = useSupabaseClient()
  const { addToast } = useToast()

  const allContactsTravaux = useState('allContactsTravaux', () => [])

  // ============================================
  // GÉNÉRALITÉS (chantier_contacts_generalites)
  // ============================================

  const getContactsGeneralites = async (chantierId) => {
    try {
      const { data, error } = await client
        .from('chantier_contacts_generalites')
        .select('*')
        .eq('chantier_id', chantierId)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return data
    } catch (err) {
      addToast({
        title: 'Erreur',
        message: 'Impossible de charger les contacts généralités',
        type: 'Error'
      })
      return null
    }
  }

  const upsertContactsGeneralites = async (chantierId, contactData) => {
    try {
      const { data, error } = await client
        .from('chantier_contacts_generalites')
        .upsert(
          {
            chantier_id: chantierId,
            chef_projet_nom: contactData.chef_projet_nom || null,
            chef_projet_email: contactData.chef_projet_email || null,
            coordinateur_securite_nom: contactData.coordinateur_securite_nom || null,
            coordinateur_securite_email: contactData.coordinateur_securite_email || null,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'chantier_id' }
        )
        .select()
        .single()

      if (error) throw error

      addToast({
        title: 'Succès',
        message: 'Contacts généralités mis à jour',
        type: 'Success'
      })

      return data
    } catch (err) {
      addToast({
        title: 'Erreur',
        message: err.message,
        type: 'Error'
      })
      return null
    }
  }

  // ============================================
  // TRAVAUX (chantier_contacts_travaux)
  // ============================================

  const getAllContactsTravaux = async (chantierId) => {
    try {
      const { data, error } = await client.from('chantier_contacts_travaux').select('*')
      if (error && error.code !== 'PGRST116') throw error
      allContactsTravaux.value = data
      return data
    } catch (err) {
      addToast({
        title: 'Erreur',
        message: 'Impossible de charger les contacts travaux',
        type: 'Error'
      })
      return null
    }
  }

  const getContactsTravaux = async (chantierId) => {
    try {
      const { data, error } = await client
        .from('chantier_contacts_travaux')
        .select('*')
        .eq('chantier_id', chantierId)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return data
    } catch (err) {
      addToast({
        title: 'Erreur',
        message: 'Impossible de charger les contacts travaux',
        type: 'Error'
      })
      return null
    }
  }

  const getContactsTravauxChantiersArray = async (chantierIds) => {
    try {
      const { data, error } = await client.from('chantier_contacts_travaux').select('*').in('chantier_id', chantierIds)
      console.log('data', data)
      if (error) throw error

      return data || null
    } catch (err) {
      console.error('Erreur lors de la récupération des contacts Travaux:', err)
      return null
    }
  }

  const upsertContactsTravaux = async (chantierId, contactData) => {
    try {
      const { data, error } = await client
        .from('chantier_contacts_travaux')
        .upsert(
          {
            chantier_id: chantierId,
            rlt_voie_principale: contactData.rlt_voie_principale || null,
            rlt_voie_secondaire: contactData.rlt_voie_secondaire || [],
            rlt_ses_principale: contactData.rlt_ses_principale || null,
            rlt_ses_secondaire: contactData.rlt_ses_secondaire || [],
            rlt_cat_principale: contactData.rlt_cat_principale || null,
            rlt_cat_secondaire: contactData.rlt_cat_secondaire || [],
            kv_voie: contactData.kv_voie || [],
            kv_ses: contactData.kv_ses || [],
            kv_cat: contactData.kv_cat || [],
            preop_voie: contactData.preop_voie || null,
            preop_ses: contactData.preop_ses || null,
            logistique: contactData.logistique || null,
            supervisor: contactData.supervisor || [],
            updated_at: new Date().toISOString()
          },
          { onConflict: 'chantier_id' }
        )
        .select()
        .single()

      if (error) throw error

      addToast({
        title: 'Succès',
        message: 'Contacts travaux mis à jour',
        type: 'Success'
      })

      return data
    } catch (err) {
      addToast({
        title: 'Erreur',
        message: err.message,
        type: 'Error'
      })
      return null
    }
  }
  const deleteContactTravaux = async (chantierId, typeContact, userEmail) => {
    try {
      // Validation côté client
      const validTypes = [
        'rlt_voie_principale',
        'rlt_voie_secondaire',
        'rlt_ses_principale',
        'rlt_ses_secondaire',
        'rlt_cat_principale',
        'rlt_cat_secondaire',
        'kv_voie',
        'kv_ses',
        'kv_cat'
      ]

      if (!validTypes.includes(typeContact)) {
        throw new Error(`Type de contact invalide: ${typeContact}`)
      }

      if (!chantierId || !userEmail) {
        throw new Error('chantierId et userEmail sont requis')
      }

      // Définir les champs de type array
      const arrayFields = [
        'rlt_voie_secondaire',
        'rlt_ses_secondaire',
        'rlt_cat_secondaire',
        'kv_voie',
        'kv_ses',
        'kv_cat'
      ]

      const isArrayField = arrayFields.includes(typeContact)

      if (isArrayField) {
        // Pour les champs array : récupérer d'abord la valeur actuelle
        const { data: currentData, error: fetchError } = await client
          .from('chantier_contacts_travaux')
          .select(typeContact)
          .eq('chantier_id', chantierId)
          .single()

        if (fetchError) {
          throw fetchError
        }

        // Retirer l'email de l'array
        const currentArray = currentData[typeContact] || []
        const updatedArray = currentArray.filter((email) => email !== userEmail)

        // Mettre à jour avec le nouveau tableau
        const { error: updateError } = await client
          .from('chantier_contacts_travaux')
          .update({
            [typeContact]: updatedArray,
            updated_at: new Date().toISOString()
          })
          .eq('chantier_id', chantierId)

        if (updateError) {
          throw updateError
        }
        error

        addToast({
          title: 'Succès',
          message: 'Chantier retiré avec succès',
          type: 'Success'
        })

        return {
          success: true,
          message: "Chantier retiré avec succès de l'array"
        }
      } else {
        // Pour les champs simples : mettre à NULL si l'email correspond
        const { data: currentData, error: fetchError } = await client
          .from('chantier_contacts_travaux')
          .select(typeContact)
          .eq('chantier_id', chantierId)
          .single()

        if (fetchError) {
          throw fetchError
        }

        // Vérifier que l'email correspond avant de supprimer
        if (currentData[typeContact] === userEmail) {
          const { error: updateError } = await client
            .from('chantier_contacts_travaux')
            .update({
              [typeContact]: null,
              updated_at: new Date().toISOString()
            })
            .eq('chantier_id', chantierId)

          if (updateError) {
            throw updateError
          }

          addToast({
            title: 'Succès',
            message: 'Chantier retiré avec succès',
            type: 'Success'
          })

          return true
        } else {
          addToast({
            title: 'Erreur',
            message: 'Erreur lors du retrait du chantier',
            type: 'Error'
          })

          return false
        }
      }
    } catch (err) {
      console.error('Erreur deleteContactTravaux:', err)
      return {
        success: false,
        error: err.message || 'Erreur inconnue'
      }
    }
  }

  // ============================================
  // ENTREPRISES (chantier_contacts_entreprises)
  // ============================================

  const getContactsEntreprises = async (chantierId) => {
    try {
      const { data, error } = await client
        .from('chantier_contacts_entreprises')
        .select('*')
        .eq('chantier_id', chantierId)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data || []
    } catch (err) {
      addToast({
        title: 'Erreur',
        message: 'Impossible de charger les contacts entreprises',
        type: 'Error'
      })
      return []
    }
  }

  const addContactEntreprise = async (chantierId, contactData) => {
    try {
      const { data, error } = await client
        .from('chantier_contacts_entreprises')
        .insert({
          chantier_id: chantierId,
          metier: contactData.metier || null,
          entreprise: contactData.entreprise || null,
          responsable_nom: contactData.responsable_nom || null,
          responsable_email: contactData.responsable_email || null
        })
        .select()
        .single()

      if (error) throw error

      addToast({
        title: 'Succès',
        message: 'Contact entreprise ajouté',
        type: 'Success'
      })

      return data
    } catch (err) {
      addToast({
        title: 'Erreur',
        message: err.message,
        type: 'Error'
      })
      return null
    }
  }

  const updateContactEntreprise = async (id, contactData) => {
    try {
      const { data, error } = await client
        .from('chantier_contacts_entreprises')
        .update({
          metier: contactData.metier || null,
          entreprise: contactData.entreprise || null,
          responsable_nom: contactData.responsable_nom || null,
          responsable_email: contactData.responsable_email || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      addToast({
        title: 'Succès',
        message: 'Contact entreprise mis à jour',
        type: 'Success'
      })

      return data
    } catch (err) {
      addToast({
        title: 'Erreur',
        message: err.message,
        type: 'Error'
      })
      return null
    }
  }

  const deleteContactEntreprise = async (id) => {
    try {
      const { error } = await client.from('chantier_contacts_entreprises').delete().eq('id', id)

      if (error) throw error

      addToast({
        title: 'Succès',
        message: 'Contact entreprise supprimé',
        type: 'Success'
      })

      return true
    } catch (err) {
      addToast({
        title: 'Erreur',
        message: err.message,
        type: 'Error'
      })
      return false
    }
  }

  // ============================================
  // ÉTUDES (chantier_contacts_etudes)
  // ============================================

  const getContactsEtudes = async (chantierId) => {
    try {
      const { data, error } = await client
        .from('chantier_contacts_etudes')
        .select('*')
        .eq('chantier_id', chantierId)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return data
    } catch (err) {
      addToast({
        title: 'Erreur',
        message: 'Impossible de charger les contacts études',
        type: 'Error'
      })
      return null
    }
  }

  const upsertContactsEtudes = async (chantierId, contactData) => {
    try {
      const { data, error } = await client
        .from('chantier_contacts_etudes')
        .upsert(
          {
            chantier_id: chantierId,
            plan_technique_nom: contactData.plan_technique_nom || null,
            plan_technique_email: contactData.plan_technique_email || null,
            documents_execution_nom: contactData.documents_execution_nom || null,
            documents_execution_email: contactData.documents_execution_email || null,
            cdpe_nom: contactData.cdpe_nom || null,
            cdpe_email: contactData.cdpe_email || null,
            eg_nom: contactData.eg_nom || null,
            eg_email: contactData.eg_email || null,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'chantier_id' }
        )
        .select()
        .single()

      if (error) throw error

      addToast({
        title: 'Succès',
        message: 'Contacts études mis à jour',
        type: 'Success'
      })

      return data
    } catch (err) {
      addToast({
        title: 'Erreur',
        message: err.message,
        type: 'Error'
      })
      return null
    }
  }

  // ============================================
  // AUTRES (chantier_contacts_autres)
  // ============================================

  const getContactsAutres = async (chantierId) => {
    try {
      const { data, error } = await client
        .from('chantier_contacts_autres')
        .select('*')
        .eq('chantier_id', chantierId)
        .order('created_at', { ascending: true })

      if (error) throw error
      return data || []
    } catch (err) {
      addToast({
        title: 'Erreur',
        message: 'Impossible de charger les autres contacts',
        type: 'Error'
      })
      return []
    }
  }

  const addContactAutre = async (chantierId, contactData) => {
    try {
      const { data, error } = await client
        .from('chantier_contacts_autres')
        .insert({
          chantier_id: chantierId,
          metier: contactData.metier || null,
          entreprise: contactData.entreprise || null,
          responsable_nom: contactData.responsable_nom || null,
          responsable_email: contactData.responsable_email || null
        })
        .select()
        .single()

      if (error) throw error

      addToast({
        title: 'Succès',
        message: 'Contact ajouté',
        type: 'Success'
      })

      return data
    } catch (err) {
      addToast({
        title: 'Erreur',
        message: err.message,
        type: 'Error'
      })
      return null
    }
  }

  const updateContactAutre = async (id, contactData) => {
    try {
      const { data, error } = await client
        .from('chantier_contacts_autres')
        .update({
          metier: contactData.metier || null,
          entreprise: contactData.entreprise || null,
          responsable_nom: contactData.responsable_nom || null,
          responsable_email: contactData.responsable_email || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      addToast({
        title: 'Succès',
        message: 'Contact mis à jour',
        type: 'Success'
      })

      return data
    } catch (err) {
      addToast({
        title: 'Erreur',
        message: err.message,
        type: 'Error'
      })
      return null
    }
  }

  const deleteContactAutre = async (id) => {
    try {
      const { error } = await client.from('chantier_contacts_autres').delete().eq('id', id)

      if (error) throw error

      addToast({
        title: 'Succès',
        message: 'Contact supprimé',
        type: 'Success'
      })

      return true
    } catch (err) {
      addToast({
        title: 'Erreur',
        message: err.message,
        type: 'Error'
      })
      return false
    }
  }

  // ============================================
  // CHARGER TOUS LES CONTACTS D'UN CHANTIER
  // ============================================

  const getAllContacts = async (chantierId) => {
    const [generalites, travaux, entreprises, etudes, autres] = await Promise.all([
      getContactsGeneralites(chantierId),
      getContactsTravaux(chantierId),
      getContactsEntreprises(chantierId),
      getContactsEtudes(chantierId),
      getContactsAutres(chantierId)
    ])

    return {
      generalites,
      travaux,
      entreprises,
      etudes,
      autres
    }
  }

  return {
    // Généralités
    getContactsGeneralites,
    upsertContactsGeneralites,

    // Travaux
    allContactsTravaux,
    getAllContactsTravaux,
    getContactsTravaux,
    upsertContactsTravaux,
    getContactsTravauxChantiersArray,
    deleteContactTravaux,

    // Entreprises
    getContactsEntreprises,
    addContactEntreprise,
    updateContactEntreprise,
    deleteContactEntreprise,

    // Études
    getContactsEtudes,
    upsertContactsEtudes,

    // Autres
    getContactsAutres,
    addContactAutre,
    updateContactAutre,
    deleteContactAutre,

    // Utilitaire
    getAllContacts
  }
}
