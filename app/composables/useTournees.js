export const useTournees = () => {
  const client = useSupabaseClient()
  const { addToast } = useToast()
  const BUCKET_NAME = 'photos'

  // Liste des tournées d'un chantier avec counts
  const getTournees = async (chantierId) => {
    try {
      const { data, error } = await client
        .from('tournees')
        .select(`
          *,
          tournee_notes(count),
          photos(count)
        `)
        .eq('chantier_id', chantierId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return { data: data || [], error: null }
    } catch (err) {
      console.error('Erreur lors de la récupération des tournées:', err)
      addToast({ title: 'Erreur', message: err.message || 'Impossible de récupérer les tournées', type: 'Error' })
      return { data: [], error: err }
    }
  }

  // Créer une nouvelle tournée
  const createTournee = async (chantierId, createdBy, titre = null) => {
    try {
      const { data, error } = await client
        .from('tournees')
        .insert({ chantier_id: chantierId, created_by: createdBy, titre })
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (err) {
      console.error('Erreur lors de la création de la tournée:', err)
      addToast({ title: 'Erreur', message: err.message || 'Impossible de créer la tournée', type: 'Error' })
      return { data: null, error: err }
    }
  }

  // Terminer une tournée
  const terminerTournee = async (tourneeId) => {
    try {
      const { data, error } = await client
        .from('tournees')
        .update({ terminee: true, updated_at: new Date().toISOString() })
        .eq('id', tourneeId)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (err) {
      console.error('Erreur lors de la clôture de la tournée:', err)
      addToast({ title: 'Erreur', message: err.message || 'Impossible de terminer la tournée', type: 'Error' })
      return { data: null, error: err }
    }
  }

  // Mettre à jour le titre d'une tournée
  const updateTourneeTitre = async (tourneeId, titre) => {
    try {
      const { data, error } = await client
        .from('tournees')
        .update({ titre, updated_at: new Date().toISOString() })
        .eq('id', tourneeId)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (err) {
      console.error('Erreur lors de la mise à jour du titre:', err)
      return { data: null, error: err }
    }
  }

  // Récupérer le détail complet d'une tournée
  const getTournee = async (tourneeId) => {
    try {
      const { data, error } = await client
        .from('tournees')
        .select('*')
        .eq('id', tourneeId)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (err) {
      console.error('Erreur lors de la récupération de la tournée:', err)
      addToast({ title: 'Erreur', message: err.message || 'Impossible de récupérer la tournée', type: 'Error' })
      return { data: null, error: err }
    }
  }

  // Récupérer les notes d'une tournée
  const getTourneeNotes = async (tourneeId) => {
    try {
      const { data, error } = await client
        .from('tournee_notes')
        .select('*')
        .eq('tournee_id', tourneeId)
        .order('created_at', { ascending: true })

      if (error) throw error
      return { data: data || [], error: null }
    } catch (err) {
      console.error('Erreur lors de la récupération des notes:', err)
      addToast({ title: 'Erreur', message: err.message || 'Impossible de récupérer les notes', type: 'Error' })
      return { data: [], error: err }
    }
  }

  // Ajouter une note
  const addNote = async (tourneeId, content, type) => {
    try {
      const { data, error } = await client
        .from('tournee_notes')
        .insert({ tournee_id: tourneeId, content, type })
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (err) {
      console.error('Erreur lors de l\'ajout de la note:', err)
      addToast({ title: 'Erreur', message: err.message || 'Impossible d\'ajouter la note', type: 'Error' })
      return { data: null, error: err }
    }
  }

  // Modifier le contenu d'une note
  const updateNote = async (noteId, content) => {
    try {
      const { data, error } = await client
        .from('tournee_notes')
        .update({ content })
        .eq('id', noteId)
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (err) {
      console.error('Erreur lors de la modification de la note:', err)
      addToast({ title: 'Erreur', message: err.message || 'Impossible de modifier la note', type: 'Error' })
      return { data: null, error: err }
    }
  }

  // Supprimer une note
  const deleteNote = async (noteId) => {
    try {
      const { error } = await client
        .from('tournee_notes')
        .delete()
        .eq('id', noteId)

      if (error) throw error
      return { error: null }
    } catch (err) {
      console.error('Erreur lors de la suppression de la note:', err)
      addToast({ title: 'Erreur', message: err.message || 'Impossible de supprimer la note', type: 'Error' })
      return { error: err }
    }
  }

  // Supprimer une tournée complète (photos storage + DB + notes en cascade)
  const deleteTournee = async (tourneeId) => {
    try {
      // 1. Récupérer toutes les photos liées à la tournée
      const { data: photosList } = await client
        .from('photos')
        .select('id, chemin_storage')
        .eq('tournee_id', tourneeId)

      if (photosList?.length) {
        // 2. Supprimer les fichiers du bucket storage
        const paths = photosList.map((p) => p.chemin_storage).filter(Boolean)
        if (paths.length) {
          const { error: storageError } = await client.storage.from(BUCKET_NAME).remove(paths)
          if (storageError) console.warn('Erreur suppression storage:', storageError)
        }

        // 3. Supprimer les enregistrements photos en DB
        const ids = photosList.map((p) => p.id)
        const { error: photosDbError } = await client.from('photos').delete().in('id', ids)
        if (photosDbError) console.warn('Erreur suppression photos DB:', photosDbError)
      }

      // 4. Supprimer la tournée — les tournee_notes sont supprimées par CASCADE
      const { error } = await client
        .from('tournees')
        .delete()
        .eq('id', tourneeId)

      if (error) throw error
      return { error: null }
    } catch (err) {
      console.error('Erreur lors de la suppression de la tournée:', err)
      addToast({ title: 'Erreur', message: err.message || 'Impossible de supprimer la tournée', type: 'Error' })
      return { error: err }
    }
  }

  // Upload d'une photo de tournée (utilise le bucket photos existant)
  const uploadTourneePhoto = async (file, chantierId, tourneeId) => {
    try {
      const timestamp = Date.now()
      const randomString = Math.random().toString(36).substring(2, 15)
      const fileExt = file.name.split('.').pop()
      const filePath = `${chantierId}/${timestamp}_${randomString}.${fileExt}`

      const { error: uploadError } = await client.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, { cacheControl: '3600', upsert: false })

      if (uploadError) throw uploadError

      const { data: photoData, error: dbError } = await client
        .from('photos')
        .insert({
          chantier_id: chantierId,
          tournee_id: tourneeId,
          nom_fichier: file.name,
          chemin_storage: filePath,
          taille: file.size,
          mime_type: file.type
        })
        .select()
        .single()

      if (dbError) {
        await client.storage.from(BUCKET_NAME).remove([filePath])
        throw dbError
      }

      return { data: photoData, error: null }
    } catch (err) {
      console.error('Erreur lors de l\'upload de la photo:', err)
      addToast({ title: 'Erreur', message: err.message || 'Impossible d\'uploader la photo', type: 'Error' })
      return { data: null, error: err }
    }
  }

  // Récupérer les photos d'une tournée
  const getTourneePhotos = async (tourneeId) => {
    try {
      const { data, error } = await client
        .from('photos')
        .select('*')
        .eq('tournee_id', tourneeId)
        .order('created_at', { ascending: true })

      if (error) throw error
      return { data: data || [], error: null }
    } catch (err) {
      console.error('Erreur lors de la récupération des photos:', err)
      addToast({ title: 'Erreur', message: err.message || 'Impossible de récupérer les photos', type: 'Error' })
      return { data: [], error: err }
    }
  }

  // Obtenir l'URL signée d'une photo (bucket privé)
  const getSignedPhotoUrl = async (cheminStorage, expiresIn = 3600) => {
    if (!cheminStorage) return null
    try {
      const { data, error } = await client.storage
        .from(BUCKET_NAME)
        .createSignedUrl(cheminStorage, expiresIn)
      if (error) throw error
      return data?.signedUrl || null
    } catch (err) {
      console.error('Erreur URL signée:', err)
      return null
    }
  }

  return {
    getTournees,
    createTournee,
    terminerTournee,
    updateTourneeTitre,
    getTournee,
    getTourneeNotes,
    addNote,
    updateNote,
    deleteNote,
    deleteTournee,
    uploadTourneePhoto,
    getTourneePhotos,
    getSignedPhotoUrl
  }
}
