/**
 * Composable pour la gestion des pages personnalisées des chantiers
 * 
 * Structure du content JSONB :
 * [{
 *   id: string,
 *   template_key: string,
 *   navBarTitle: string,
 *   order: number,
 *   content: { ... } // Spécifique au template
 * }]
 */
export const useChantierPages = () => {
  const supabase = useSupabaseClient()
  const { addToast } = useToast()
  
  const BUCKET_NAME = 'photos'
  
  // Clés de contenu qui contiennent des chemins d'images (simples)
  const IMAGE_CONTENT_KEYS = ['image_url', 'colonne1_image', 'colonne2_image']
  
  // Clés de contenu qui contiennent des arrays d'images
  const IMAGE_ARRAY_CONTENT_KEYS = ['images']
  
  // État réactif des pages du chantier courant
  const chantierPages = useState('chantier_pages', () => [])
  const isLoading = useState('chantier_pages_loading', () => false)
  
  /**
   * Extrait le chemin de storage d'une URL Supabase ou retourne le chemin direct
   * @param {string} pathOrUrl - Chemin ou URL
   * @returns {string|null} - Le chemin de storage
   */
  const extractStoragePath = (pathOrUrl) => {
    if (!pathOrUrl) return null
    
    // Si c'est une URL complète, extraire le chemin
    if (pathOrUrl.startsWith('http')) {
      const match = pathOrUrl.match(/\/storage\/v1\/object\/public\/photos\/(.+)$/)
      return match ? match[1] : null
    }
    
    // Sinon, c'est déjà un chemin
    return pathOrUrl
  }
  
  /**
   * Extrait tous les chemins d'images du contenu d'une page
   * @param {Object} content - Le contenu de la page
   * @returns {Array<string>} - Liste des chemins d'images
   */
  const extractImagePaths = (content) => {
    if (!content) return []
    
    const paths = []
    
    // Images simples
    for (const key of IMAGE_CONTENT_KEYS) {
      if (content[key]) {
        const path = extractStoragePath(content[key])
        if (path) {
          paths.push(path)
        }
      }
    }
    
    // Arrays d'images
    for (const key of IMAGE_ARRAY_CONTENT_KEYS) {
      if (Array.isArray(content[key])) {
        for (const imagePath of content[key]) {
          if (imagePath) {
            const path = extractStoragePath(imagePath)
            if (path) {
              paths.push(path)
            }
          }
        }
      }
    }
    
    return paths
  }
  
  /**
   * Supprime les images du storage
   * @param {Array<string>} paths - Liste des chemins à supprimer
   */
  const deleteImagesFromStorage = async (paths) => {
    if (!paths || paths.length === 0) {
      console.log('[useChantierPages] deleteImagesFromStorage: pas de chemins à supprimer')
      return
    }
    
    console.log('[useChantierPages] deleteImagesFromStorage: suppression de', paths)
    
    try {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove(paths)
      
      if (error) {
        console.error('[useChantierPages] Erreur lors de la suppression des images:', error)
        // On continue même si la suppression échoue
      } else {
        console.log('[useChantierPages] Suppression réussie, résultat:', data)
      }
    } catch (err) {
      console.error('[useChantierPages] Exception lors de la suppression des images:', err)
    }
  }
  
  /**
   * Récupère les pages personnalisées d'un chantier
   * @param {string} chantierId - ID du chantier
   * @returns {Promise<Array>} - Liste des pages
   */
  const getPages = async (chantierId) => {
    if (!chantierId) return []
    
    isLoading.value = true
    try {
      const { data, error } = await supabase
        .from('chantier_pages')
        .select('*')
        .eq('chantier_id', chantierId)
        .maybeSingle()
      
      if (error) throw error
      
      // Si aucun enregistrement existe, retourner un tableau vide
      chantierPages.value = data?.content || []
      return chantierPages.value
    } catch (err) {
      console.error('Erreur lors de la récupération des pages:', err)
      addToast({
        title: 'Erreur',
        message: err.message || 'Impossible de récupérer les pages personnalisées',
        type: 'Error'
      })
      return []
    } finally {
      isLoading.value = false
    }
  }
  
  /**
   * Sauvegarde toutes les pages d'un chantier (upsert)
   * @param {string} chantierId - ID du chantier
   * @param {Array} pages - Liste des pages à sauvegarder
   * @returns {Promise<boolean>} - Succès ou échec
   */
  const savePages = async (chantierId, pages) => {
    if (!chantierId) return false
    
    try {
      const { error } = await supabase
        .from('chantier_pages')
        .upsert({
          chantier_id: chantierId,
          content: pages
        }, {
          onConflict: 'chantier_id'
        })
      
      if (error) throw error
      
      chantierPages.value = pages
      return true
    } catch (err) {
      console.error('Erreur lors de la sauvegarde des pages:', err)
      addToast({
        title: 'Erreur',
        message: err.message || 'Impossible de sauvegarder les pages',
        type: 'Error'
      })
      return false
    }
  }
  
  /**
   * Ajoute une nouvelle page personnalisée
   * @param {string} chantierId - ID du chantier
   * @param {Object} pageData - Données de la page
   * @returns {Promise<Object|null>} - La page créée ou null
   */
  const addPage = async (chantierId, pageData) => {
    if (!chantierId || !pageData.template_key || !pageData.navBarTitle) {
      addToast({
        title: 'Erreur',
        message: 'Le template et le titre sont requis',
        type: 'Error'
      })
      return null
    }
    
    // Créer la nouvelle page avec un ID unique
    const newPage = {
      id: crypto.randomUUID(),
      template_key: pageData.template_key,
      navBarTitle: pageData.navBarTitle,
      order: chantierPages.value.length,
      content: pageData.content || {}
    }
    
    const updatedPages = [...chantierPages.value, newPage]
    
    const success = await savePages(chantierId, updatedPages)
    
    if (success) {
      addToast({
        title: 'Page créée',
        message: `La page "${pageData.navBarTitle}" a été ajoutée avec succès.`,
        type: 'Success'
      })
      return newPage
    }
    
    return null
  }
  
  /**
   * Met à jour une page existante
   * @param {string} chantierId - ID du chantier
   * @param {string} pageId - ID de la page à modifier
   * @param {Object} updates - Modifications à appliquer
   * @returns {Promise<boolean>} - Succès ou échec
   */
  const updatePage = async (chantierId, pageId, updates) => {
    if (!chantierId || !pageId) return false
    
    // Trouver l'ancienne page pour comparer les images
    const oldPage = chantierPages.value.find(p => p.id === pageId)
    const oldImagePaths = oldPage ? extractImagePaths(oldPage.content) : []
    const newImagePaths = updates.content ? extractImagePaths(updates.content) : []
    
    // DEBUG: Afficher les comparaisons
    console.log('[useChantierPages] DEBUG updatePage:')
    console.log('  - Old content:', JSON.stringify(oldPage?.content, null, 2))
    console.log('  - New content:', JSON.stringify(updates.content, null, 2))
    console.log('  - Old image paths:', oldImagePaths)
    console.log('  - New image paths:', newImagePaths)
    
    // Identifier les images supprimées (présentes dans old mais pas dans new)
    const deletedImagePaths = oldImagePaths.filter(oldPath => !newImagePaths.includes(oldPath))
    console.log('  - Deleted image paths:', deletedImagePaths)
    
    const updatedPages = chantierPages.value.map(page => {
      if (page.id === pageId) {
        return { ...page, ...updates }
      }
      return page
    })
    
    const success = await savePages(chantierId, updatedPages)
    
    if (success) {
      // Supprimer les anciennes images qui ont été remplacées
      if (deletedImagePaths.length > 0) {
        console.log('[useChantierPages] Appel deleteImagesFromStorage avec:', deletedImagePaths)
        await deleteImagesFromStorage(deletedImagePaths)
        console.log('[useChantierPages] Anciennes images supprimées:', deletedImagePaths)
      } else {
        console.log('[useChantierPages] Aucune image à supprimer')
      }
      
      addToast({
        title: 'Page mise à jour',
        message: 'Les modifications ont été enregistrées.',
        type: 'Success'
      })
    }
    
    return success
  }
  
  /**
   * Met à jour uniquement le contenu d'une page (sans notification)
   * @param {string} chantierId - ID du chantier
   * @param {string} pageId - ID de la page
   * @param {Object} content - Nouveau contenu
   * @returns {Promise<boolean>} - Succès ou échec
   */
  const updatePageContent = async (chantierId, pageId, content) => {
    if (!chantierId || !pageId) return false
    
    // Trouver l'ancienne page pour comparer les images
    const oldPage = chantierPages.value.find(p => p.id === pageId)
    const oldImagePaths = oldPage ? extractImagePaths(oldPage.content) : []
    const newImagePaths = content ? extractImagePaths(content) : []
    
    // Identifier les images supprimées
    const deletedImagePaths = oldImagePaths.filter(oldPath => !newImagePaths.includes(oldPath))
    
    const updatedPages = chantierPages.value.map(page => {
      if (page.id === pageId) {
        return { ...page, content }
      }
      return page
    })
    
    const success = await savePages(chantierId, updatedPages)
    
    if (success && deletedImagePaths.length > 0) {
      // Supprimer les anciennes images qui ont été remplacées
      await deleteImagesFromStorage(deletedImagePaths)
      console.log('[useChantierPages] Anciennes images supprimées:', deletedImagePaths)
    }
    
    return success
  }
  
  /**
   * Supprime une page et ses images associées
   * @param {string} chantierId - ID du chantier
   * @param {string} pageId - ID de la page à supprimer
   * @returns {Promise<boolean>} - Succès ou échec
   */
  const deletePage = async (chantierId, pageId) => {
    if (!chantierId || !pageId) return false
    
    const pageToDelete = chantierPages.value.find(p => p.id === pageId)
    
    // Extraire les chemins des images à supprimer
    const imagePaths = pageToDelete ? extractImagePaths(pageToDelete.content) : []
    
    const updatedPages = chantierPages.value
      .filter(page => page.id !== pageId)
      .map((page, index) => ({ ...page, order: index })) // Réordonne
    
    const success = await savePages(chantierId, updatedPages)
    
    if (success) {
      // Supprimer les images du storage après la suppression de la page
      if (imagePaths.length > 0) {
        await deleteImagesFromStorage(imagePaths)
        console.log('[useChantierPages] Images supprimées:', imagePaths)
      }
      
      addToast({
        title: 'Page supprimée',
        message: `La page "${pageToDelete?.navBarTitle}" a été supprimée.`,
        type: 'Success'
      })
    }
    
    return success
  }
  
  /**
   * Réordonne les pages
   * @param {string} chantierId - ID du chantier
   * @param {Array} newOrder - Tableau des IDs dans le nouvel ordre
   * @returns {Promise<boolean>} - Succès ou échec
   */
  const reorderPages = async (chantierId, newOrder) => {
    if (!chantierId || !newOrder?.length) return false
    
    const reorderedPages = newOrder.map((pageId, index) => {
      const page = chantierPages.value.find(p => p.id === pageId)
      return page ? { ...page, order: index } : null
    }).filter(Boolean)
    
    return await savePages(chantierId, reorderedPages)
  }
  
  /**
   * Récupère une page par son ID
   * @param {string} pageId - ID de la page
   * @returns {Object|undefined} - La page trouvée
   */
  const getPageById = (pageId) => {
    return chantierPages.value.find(page => page.id === pageId)
  }
  
  /**
   * Transforme les pages en items de menu pour LeftNavBar
   * @returns {Array} - Items formatés pour le menu
   */
  const getPagesAsMenuItems = computed(() => {
    return chantierPages.value
      .sort((a, b) => a.order - b.order)
      .map(page => ({
        value: `custom-page-${page.id}`,
        label: page.navBarTitle,
        icon: 'lucide:file-text',
        pageId: page.id,
        isCustomPage: true
      }))
  })
  
  return {
    // États
    chantierPages,
    isLoading,
    
    // Méthodes CRUD
    getPages,
    savePages,
    addPage,
    updatePage,
    updatePageContent,
    deletePage,
    reorderPages,
    getPageById,
    
    // Computed
    getPagesAsMenuItems
  }
}

