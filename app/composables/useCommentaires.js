export const useCommentaires = () => {
  const client = useSupabaseClient()
  const { addToast } = useToast()

  // Récupérer un commentaire par type pour un chantier
  const getCommentaire = async (chantierId, type) => {
    try {
      const { data, error } = await client
        .from('commentaires')
        .select('*')
        .eq('chantier_id', chantierId)
        .eq('type', type)
        .maybeSingle()

      if (error) {
        throw error
      }
      return data
    } catch (err) {
      console.error('Erreur lors de la récupération du commentaire:', err)
      addToast({
        title: 'Erreur',
        message: err.message || 'Impossible de récupérer le commentaire',
        type: 'Error'
      })
      return null
    }
  }

  // Sauvegarder ou mettre à jour un commentaire
  const saveCommentaire = async (chantierId, type, content) => {
    try {
      // Vérifier d'abord si le commentaire existe
      const existing = await getCommentaire(chantierId, type)

      if (existing) {
        // Si existe, on fait un UPDATE explicite avec l'id
        const { data, error } = await client
          .from('commentaires')
          .update({
            content,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
          .select()
          .maybeSingle()

        if (error) {
          console.error('Erreur UPDATE:', error)
          throw error
        }

        return data
      } else {
        // Si n'existe pas, on fait un INSERT sans spécifier l'id
        const { data, error } = await client
          .from('commentaires')
          .insert({
            chantier_id: chantierId,
            type,
            content
            // Ne pas spécifier created_at et updated_at, laisser les valeurs par défaut
          })
          .select()
          .maybeSingle()

        if (error) {
          console.error('Erreur INSERT:', error)
          throw error
        }

        return data
      }
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err)
      throw err
    }
  }

  return {
    getCommentaire,
    saveCommentaire
  }
}
