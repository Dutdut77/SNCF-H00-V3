/**
 * Composable pour la gestion des annexes des chantiers
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
import { getTemplateSchema } from '~/components/chantier/customPages/index'

export const useChantierPages = () => {
  const supabase = useSupabaseClient()
  const { addToast } = useToast()
  
  const BUCKET_NAME = 'photos'
  
  // Repli si le schéma du template est introuvable (template retiré du registry) :
  // on ne saurait plus quelles clés portent des images, et les fichiers fuiteraient
  // silencieusement. On retombe sur les clés historiques.
  const LEGACY_IMAGE_KEYS = ['image_url', 'colonne1_image', 'colonne2_image']
  const LEGACY_IMAGE_ARRAY_KEYS = ['images']
  
  /**
   * Détermine les clés de contenu porteuses d'images à partir du schéma du template
   * @param {string} templateKey - Clé du template de l'annexe
   * @returns {{ single: Array<string>, arrays: Array<string> }}
   */
  const getImageKeys = (templateKey) => {
    const schema = templateKey ? getTemplateSchema(templateKey) : null
    
    if (!schema) {
      console.warn(`[useChantierPages] Schéma introuvable pour "${templateKey}", repli sur les clés historiques`)
      return { single: LEGACY_IMAGE_KEYS, arrays: LEGACY_IMAGE_ARRAY_KEYS }
    }
    
    return {
      single: schema.fields.filter((f) => f.type === 'image').map((f) => f.key),
      arrays: schema.fields.filter((f) => f.type === 'images').map((f) => f.key)
    }
  }
  
  // État réactif des pages du chantier courant
  const chantierPages = useState('chantier_pages', () => [])
  const isLoading = useState('chantier_pages_loading', () => false)
  // Chantier actuellement chargé, pour purger l'état au changement de chantier
  const loadedChantierId = useState('chantier_pages_loaded_id', () => null)
  
  /**
   * Extrait tous les chemins d'images du contenu d'une page
   * @param {string} templateKey - Clé du template, qui décrit les champs images
   * @param {Object} content - Le contenu de la page
   * @returns {Array<string>} - Liste des chemins d'images
   */
  const extractImagePaths = (templateKey, content) => {
    if (!content) return []
    
    const { single, arrays } = getImageKeys(templateKey)
    const paths = []
    
    // Images simples
    for (const key of single) {
      if (content[key]) {
        const path = extractStoragePath(content[key])
        if (path) {
          paths.push(path)
        }
      }
    }
    
    // Arrays d'images
    for (const key of arrays) {
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
    if (!paths || paths.length === 0) return
    
    try {
      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove(paths)
      
      if (error) {
        // On continue même si la suppression échoue : la page est déjà à jour
        console.error('[useChantierPages] Erreur lors de la suppression des images:', error)
      }
    } catch (err) {
      console.error('[useChantierPages] Exception lors de la suppression des images:', err)
    }
  }
  
  /**
   * Récupère les annexes d'un chantier
   * @param {string} chantierId - ID du chantier
   * @returns {Promise<Array>} - Liste des pages
   */
  const getPages = async (chantierId) => {
    if (!chantierId) return []
    
    // Purge immédiate au changement de chantier : évite d'afficher brièvement
    // les annexes du chantier précédent pendant le chargement
    if (loadedChantierId.value !== chantierId) {
      chantierPages.value = []
      loadedChantierId.value = chantierId
    }
    
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
        message: err.message || 'Impossible de récupérer les annexes',
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
      loadedChantierId.value = chantierId
      return true
    } catch (err) {
      console.error('Erreur lors de la sauvegarde des pages:', err)
      addToast({
        title: 'Erreur',
        message: err.message || 'Impossible de sauvegarder les annexes',
        type: 'Error'
      })
      return false
    }
  }
  
  /**
   * Ajoute une nouvelle annexe
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
        title: 'Annexe créée',
        message: `L'annexe "${pageData.navBarTitle}" a été ajoutée avec succès.`,
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
    // Le template n'est pas modifiable après création : la clé de l'ancienne page
    // décrit donc aussi bien l'ancien que le nouveau contenu.
    const templateKey = updates.template_key || oldPage?.template_key
    const oldImagePaths = oldPage ? extractImagePaths(templateKey, oldPage.content) : []
    const newImagePaths = updates.content ? extractImagePaths(templateKey, updates.content) : []
    
    // Identifier les images supprimées (présentes dans old mais pas dans new)
    const deletedImagePaths = oldImagePaths.filter(oldPath => !newImagePaths.includes(oldPath))
    
    const updatedPages = chantierPages.value.map(page => {
      if (page.id === pageId) {
        return { ...page, ...updates }
      }
      return page
    })
    
    const success = await savePages(chantierId, updatedPages)
    
    if (success) {
      // Supprimer les anciennes images qui ont été remplacées
      await deleteImagesFromStorage(deletedImagePaths)
      
      addToast({
        title: 'Annexe mise à jour',
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
    const templateKey = oldPage?.template_key
    const oldImagePaths = oldPage ? extractImagePaths(templateKey, oldPage.content) : []
    const newImagePaths = content ? extractImagePaths(templateKey, content) : []
    
    // Identifier les images supprimées
    const deletedImagePaths = oldImagePaths.filter(oldPath => !newImagePaths.includes(oldPath))
    
    const updatedPages = chantierPages.value.map(page => {
      if (page.id === pageId) {
        return { ...page, content }
      }
      return page
    })
    
    const success = await savePages(chantierId, updatedPages)
    
    if (success) {
      // Supprimer les anciennes images qui ont été remplacées
      await deleteImagesFromStorage(deletedImagePaths)
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
    const imagePaths = pageToDelete ? extractImagePaths(pageToDelete.template_key, pageToDelete.content) : []
    
    const updatedPages = chantierPages.value
      .filter(page => page.id !== pageId)
      .map((page, index) => ({ ...page, order: index })) // Réordonne
    
    const success = await savePages(chantierId, updatedPages)
    
    if (success) {
      // Supprimer les images du storage après la suppression de la page
      await deleteImagesFromStorage(imagePaths)
      
      addToast({
        title: 'Annexe supprimée',
        message: `L'annexe "${pageToDelete?.navBarTitle}" a été supprimée.`,
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
    return [...chantierPages.value]
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

