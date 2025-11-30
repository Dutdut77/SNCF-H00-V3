export const useCommentaires = () => {
  const client = useSupabaseClient();
  const { addToast } = useToast();

  // Récupérer un commentaire par type pour un chantier
  const getCommentaire = async (chantierId, type) => {
    try {
      const { data, error } = await client
        .from('commentaires')
        .select('*')
        .eq('chantier_id', chantierId)
        .eq('type', type)
        .single();
      
      if (error) {
        // Si l'erreur est "PGRST116", cela signifie qu'aucune ligne n'a été trouvée
        // C'est normal si le commentaire n'existe pas encore
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }
      return data;
    } catch (err) {
      console.error('Erreur lors de la récupération du commentaire:', err);
      // Ne pas afficher d'erreur si c'est juste qu'il n'existe pas encore
      if (err.code !== 'PGRST116') {
        addToast({
          title: "Erreur",
          message: err.message || "Impossible de récupérer le commentaire",
          type: "Error"
        });

      }
      return null;
    }
  };

  // Sauvegarder ou mettre à jour un commentaire
  const saveCommentaire = async (chantierId, type, content) => {
    try {
      // Vérifier si le commentaire existe déjà
      const existing = await getCommentaire(chantierId, type);
      
      let result;
      
      if (existing) {
        // Mettre à jour le commentaire existant
        result = await client
          .from('commentaires')
          .update({
            content: content,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
          .select()
          .single();
      } else {
        // Créer un nouveau commentaire
        result = await client
          .from('commentaires')
          .insert({
            chantier_id: chantierId,
            type: type,
            content: content
          })
          .select()
          .single();
      }
      
      if (result.error) throw result.error;
      
      return result.data;
    } catch (err) {
      console.error('Erreur lors de la sauvegarde du commentaire:', err);
      addToast({
        title: "Erreur",
        message: err.message || "Impossible de sauvegarder le commentaire",
        type: "Error"
      });

      throw err;
    }
  };

  return {
    getCommentaire,
    saveCommentaire
  };
};

