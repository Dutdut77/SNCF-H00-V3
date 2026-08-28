/**
 * Helpers partagés pour les images des annexes de chantier
 *
 * Les annexes stockent des chemins de storage (ex: custom-pages/{chantierId}/xxx.webp)
 * mais les anciennes pages peuvent contenir des URLs publiques complètes : ces helpers
 * ramènent les deux formes à un chemin signable.
 */

const PUBLIC_PHOTO_URL_RE = /\/storage\/v1\/object\/public\/photos\/(.+)$/

/**
 * Ramène une valeur stockée à un chemin de storage
 * @param {string} pathOrUrl - Chemin de storage ou URL publique Supabase
 * @returns {string|null} - Le chemin, ou null si URL externe / valeur vide
 */
export const extractStoragePath = (pathOrUrl) => {
  if (!pathOrUrl) return null
  if (!pathOrUrl.startsWith('http')) return pathOrUrl

  const match = pathOrUrl.match(PUBLIC_PHOTO_URL_RE)
  return match ? match[1] : null
}

/**
 * Vérifie si une URL est déjà signée (contient un token ou /sign/)
 * @param {string} url
 * @returns {boolean}
 */
export const isSignedUrl = (url) => {
  if (!url || !url.startsWith('http')) return false
  return url.includes('/sign/') || url.includes('token=')
}

/**
 * Charge les URLs signées d'une liste d'images d'annexe et les garde à jour
 *
 * @param {Function|Ref} source - Getter (ou ref) retournant le tableau de chemins
 * @returns {{ imageUrls: Ref<string[]>, isLoadingImages: Ref<boolean>, reloadImages: Function }}
 */
export const useCustomPageImages = (source) => {
  const { getSignedPhotoUrl } = usePhotos()

  const imageUrls = ref([])
  const isLoadingImages = ref(false)

  const reloadImages = async () => {
    const images = toValue(source) || []

    if (!images.length) {
      imageUrls.value = []
      return
    }

    isLoadingImages.value = true
    const urls = []

    try {
      for (const stored of images) {
        if (!stored) continue

        // Déjà signée : on l'utilise telle quelle
        if (isSignedUrl(stored)) {
          urls.push(stored)
          continue
        }

        const pathToSign = extractStoragePath(stored)

        // URL externe non-Supabase : on l'utilise telle quelle
        if (!pathToSign) {
          urls.push(stored)
          continue
        }

        const url = await getSignedPhotoUrl(pathToSign, 3600)
        if (url) urls.push(url)
      }

      imageUrls.value = urls
    } catch (error) {
      console.error('[useCustomPageImages] Erreur de chargement des URLs signées:', error)
      imageUrls.value = []
    } finally {
      isLoadingImages.value = false
    }
  }

  onMounted(reloadImages)
  watch(source, reloadImages, { deep: true })

  return { imageUrls, isLoadingImages, reloadImages }
}
