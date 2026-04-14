export const usePhotos = () => {
  const supabase = useSupabaseClient();
  const { addToast } = useToast();
  const BUCKET_NAME = 'photos'; // Nom du bucket Supabase Storage
  
  // États réactifs
  const repertoires = useState('photo_repertoires', () => []);
  const photos = useState('photos_list', () => []);
  

  
  // Récupérer tous les répertoires d'un chantier
  const getRepertoires = async (chantierId) => {
    try {
      const { data, error } = await supabase
        .from('photo_repertoires')
        .select('*')
        .eq('chantier_id', chantierId)
        .order('nom', { ascending: true });
      
      if (error) throw error;
      
      repertoires.value = data || [];
      return { data, error: null };
    } catch (err) {
      console.error('Erreur lors de la récupération des répertoires:', err);
      addToast({
        title: "Erreur",
        message: err.message || "Impossible de récupérer les répertoires",
        type: "Error"
      });

      return { data: null, error: err };
    }
  };
  
  // Créer un nouveau répertoire
  const createRepertoire = async (chantierId, nom) => {
    try {
      const { data, error } = await supabase
        .from('photo_repertoires')
        .insert({
          chantier_id: chantierId,
          nom: nom.trim()
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Rafraîchir la liste des répertoires
      await getRepertoires(chantierId);
      addToast({
        title: "Répertoire créé",
        message: `Le répertoire "${nom}" a été créé avec succès.`,
        type: "Success"
      });
      
      return { data, error: null };
    } catch (err) {
      console.error('Erreur lors de la création du répertoire:', err);
      addToast({
        title: "Erreur",
        message: err.message || "Impossible de créer le répertoire",
        type: "Error"
      });
      return { data: null, error: err };
    }
  };
  
  // Mettre à jour un répertoire
  const updateRepertoire = async (repertoireId, updates) => {
    try {
      const { data, error } = await supabase
        .from('photo_repertoires')
        .update(updates)
        .eq('id', repertoireId)
        .select()
        .single();
      
      if (error) throw error;
      
      // Rafraîchir la liste des répertoires
      const chantierId = repertoires.value.find(r => r.id === repertoireId)?.chantier_id;
      if (chantierId) await getRepertoires(chantierId);
      
      addToast({
              title: "Répertoire mis à jour",
        message: "Le répertoire a été mis à jour avec succès.",
        type: "Success"
      });
      
      return { data, error: null };
    } catch (err) {
      console.error('Erreur lors de la mise à jour du répertoire:', err);
      addToast({
            title: "Erreur",
        message: err.message || "Impossible de mettre à jour le répertoire",
        type: "Error"
      });
      return { data: null, error: err };
    }
  };
  
  // Supprimer un répertoire
  const deleteRepertoire = async (repertoireId) => {
    try {
      const repertoire = repertoires.value.find(r => r.id === repertoireId);
      if (!repertoire) throw new Error('Répertoire non trouvé');
      
      // Supprimer toutes les photos du répertoire (elles seront déplacées sans répertoire)
      const { error: updateError } = await supabase
        .from('photos')
        .update({ repertoire_id: null })
        .eq('repertoire_id', repertoireId);
      
      if (updateError) throw updateError;
      
      // Supprimer le répertoire
      const { error: deleteError } = await supabase
        .from('photo_repertoires')
        .delete()
        .eq('id', repertoireId);
      
      if (deleteError) throw deleteError;
      
      // Rafraîchir la liste des répertoires
      await getRepertoires(repertoire.chantier_id);
      
      addToast({
                      title: "Répertoire supprimé",
        message: "Le répertoire a été supprimé avec succès.",
        type: "Success"
      });
      
      return { error: null };
    } catch (err) {
      console.error('Erreur lors de la suppression du répertoire:', err);
      addToast({
                  title: "Erreur",
        message: err.message || "Impossible de supprimer le répertoire",
        type: "Error"
      });
      return { error: err };
    }
  };
  
  // Récupérer toutes les photos d'un chantier
  const getPhotos = async (chantierId, repertoireId = null) => {
    try {
      let query = supabase
        .from('photos')
        .select('*')
        .eq('chantier_id', chantierId)
        .order('created_at', { ascending: false });
      
      if (repertoireId === 'tournees') {
        query = query.not('tournee_id', 'is', null);
      } else if (repertoireId !== null) {
        query = query.eq('repertoire_id', repertoireId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      photos.value = data || [];
      return { data, error: null };
    } catch (err) {
      console.error('Erreur lors de la récupération des photos:', err);
      addToast({
                      title: "Erreur",
        message: err.message || "Impossible de récupérer les photos",
        type: "Error"
      });
      return { data: null, error: err };
    }
  };
  
  // Upload d'une photo avec progression réelle via XHR
  const uploadPhoto = async (file, chantierId, repertoireId = null, onProgress = null) => {
    try {
      // Générer un nom de fichier unique
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExt = file.name.split('.').pop();
      const filePath = `${chantierId}/${timestamp}_${randomString}.${fileExt}`;

      // Obtenir le token d'authentification
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || supabase.supabaseKey;

      // Upload via XHR pour avoir une vraie progression
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable && onProgress) {
            onProgress(Math.round((e.loaded / e.total) * 100));
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            if (onProgress) onProgress(100);
            resolve();
          } else {
            let msg = `Erreur HTTP ${xhr.status}`;
            try {
              const body = JSON.parse(xhr.responseText);
              if (body.message) msg = body.message;
            } catch (_) {}
            reject(new Error(msg));
          }
        };

        xhr.onerror = () => reject(new Error('Erreur réseau lors de l\'upload'));

        xhr.open('POST', `${supabase.supabaseUrl}/storage/v1/object/${BUCKET_NAME}/${filePath}`);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.setRequestHeader('apikey', supabase.supabaseKey);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.setRequestHeader('x-upsert', 'false');
        xhr.send(file);
      });
      
      // Créer l'entrée en base de données
      const { data: photoData, error: dbError } = await supabase
        .from('photos')
        .insert({
          chantier_id: chantierId,
          repertoire_id: repertoireId,
          nom_fichier: file.name,
          chemin_storage: filePath,
          taille: file.size,
          mime_type: file.type
        })
        .select()
        .single();
      
      if (dbError) {
        // Supprimer le fichier uploadé si l'insertion en DB échoue
        await supabase.storage.from(BUCKET_NAME).remove([filePath]);
        throw dbError;
      }
      
      // Rafraîchir la liste des photos
      await getPhotos(chantierId, repertoireId);
      
      return { data: photoData, error: null };
    } catch (err) {
      console.error('Erreur lors de l\'upload de la photo:', err);
      if (onProgress) onProgress(0);
      addToast({
        title: "Erreur",
        message: err.message || "Impossible d'uploader la photo",
        type: "Error"
      });
      return { data: null, error: err };
    }
  };
  
  // Upload multiple de photos
  const uploadMultiplePhotos = async (files, chantierId, repertoireId = null, onProgress = null) => {
    const results = [];
    const total = files.length;
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // Callback pour mettre à jour la progression individuelle de chaque photo
      const fileProgress = (progress) => {
        if (onProgress) {
          // Passer l'index, la progression de cette photo, et le total
          onProgress(i, progress, total);
        }
      };
      
      const result = await uploadPhoto(file, chantierId, repertoireId, fileProgress);
      results.push(result);
    }
    
    return results;
  };
  
  // Obtenir l'URL publique d'une photo
  const getPhotoUrl = (cheminStorage) => {
    if (!cheminStorage) return null;
    
    const { data } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(cheminStorage);
    
    return data?.publicUrl || null;
  };
  
  // Obtenir l'URL signée d'une photo (pour les buckets privés)
  const getSignedPhotoUrl = async (cheminStorage, expiresIn = 3600) => {
    if (!cheminStorage) return null;
    
    try {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(cheminStorage, expiresIn);
      
      if (error) throw error;
      
      return data?.signedUrl || null;
    } catch (err) {
      console.error('Erreur lors de la génération de l\'URL signée:', err);
      return null;
    }
  };
  
  // Déplacer une photo vers un autre répertoire
  const movePhotoToRepertoire = async (photoId, repertoireId) => {
    try {
      const { data, error } = await supabase
        .from('photos')
        .update({ repertoire_id: repertoireId })
        .eq('id', photoId)
        .select()
        .single();
      
      if (error) throw error;
      
      // Rafraîchir la liste des photos
      const chantierId = photos.value.find(p => p.id === photoId)?.chantier_id;
      if (chantierId) await getPhotos(chantierId);
      
      addToast({
                title: "Photo déplacée",
        message: "La photo a été déplacée avec succès.",
        type: "Success"
      });
      
      return { data, error: null };
    } catch (err) {
      console.error('Erreur lors du déplacement de la photo:', err);
      addToast({
                        title: "Erreur",
        message: err.message || "Impossible de déplacer la photo",
        type: "Error"
      });
      return { data: null, error: err };
    }
  };
  
  // Supprimer une photo
  const deletePhoto = async (photoId) => {
    try {
      const photo = photos.value.find(p => p.id === photoId);
      if (!photo) throw new Error('Photo non trouvée');
      
      // Supprimer le fichier du storage
      const { error: storageError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([photo.chemin_storage]);
      
      if (storageError) {
        console.warn('Erreur lors de la suppression du fichier:', storageError);
        // On continue quand même pour supprimer l'entrée en DB
      }
      
      // Supprimer l'entrée en base de données
      const { error: dbError } = await supabase
        .from('photos')
        .delete()
        .eq('id', photoId);
      
      if (dbError) throw dbError;
      
      // Rafraîchir la liste des photos
      await getPhotos(photo.chantier_id, photo.repertoire_id);
      
      addToast({
                      title: "Photo supprimée",
        message: "La photo a été supprimée avec succès.",
        type: "Success"
      });
      
      return { error: null };
    } catch (err) {
      console.error('Erreur lors de la suppression de la photo:', err);
      addToast({
          title: "Erreur",
        message: err.message || "Impossible de supprimer la photo",
        type: "Error"
      });
      return { error: err };
    }
  };
  
  // Mettre à jour une photo
  const updatePhoto = async (photoId, updates) => {
    try {
      const { data, error } = await supabase
        .from('photos')
        .update(updates)
        .eq('id', photoId)
        .select()
        .single();
      
      if (error) throw error;
      
      // Rafraîchir la liste des photos
      const chantierId = photos.value.find(p => p.id === photoId)?.chantier_id;
      if (chantierId) await getPhotos(chantierId);
      
      addToast({
                title: "Photo mise à jour",
        message: "La photo a été mise à jour avec succès.",
        type: "Success"
      });
      
      return { data, error: null };
    } catch (err) {
      console.error('Erreur lors de la mise à jour de la photo:', err);
          addToast({
        title: "Erreur",
        message: err.message || "Impossible de mettre à jour la photo",
        type: "Error"
      });
      return { data: null, error: err };
    }
  };
  
  return {
    // États
    repertoires,
    photos,
    
    // Répertoires

    getRepertoires,
    createRepertoire,
    updateRepertoire,
    deleteRepertoire,
    
    // Photos
    getPhotos,
    uploadPhoto,
    uploadMultiplePhotos,
    getPhotoUrl,
    getSignedPhotoUrl,
    movePhotoToRepertoire,
    deletePhoto,
    updatePhoto
  };
};

