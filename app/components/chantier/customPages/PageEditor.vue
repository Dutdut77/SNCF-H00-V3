<!--
  PageEditor - Éditeur de page personnalisée
  
  Ce component :
  - Génère automatiquement un formulaire depuis le schema du template
  - Gère l'upload des images vers Supabase Storage (avec redimensionnement + WebP)
  - Upload uniquement à la sauvegarde (pas à la sélection)
  - Émet les modifications au parent
-->
<script setup>
import { getTemplateSchema, getAvailableTemplates, getDefaultContent } from './index'

const props = defineProps({
  // Page en cours d'édition (null = création)
  page: {
    type: Object,
    default: null
  },
  // ID du chantier
  chantierId: {
    type: String,
    required: true
  },
  // Mode création
  isNew: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['save', 'cancel'])

const supabase = useSupabaseClient()
const { addToast } = useToast()
const { getSignedPhotoUrl } = usePhotos()
const BUCKET_NAME = 'photos' // Utiliser le bucket photos existant (RLS OK)

// Cache des URLs signées pour l'affichage des images existantes
const signedUrls = ref({})

// Copie profonde pour éviter de modifier l'objet original
const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(item => deepClone(item))
  const cloned = {}
  for (const key in obj) {
    cloned[key] = deepClone(obj[key])
  }
  return cloned
}

// État local du formulaire (copie profonde pour ne pas modifier l'original)
const formData = reactive({
  template_key: props.page?.template_key || '',
  navBarTitle: props.page?.navBarTitle || '',
  content: deepClone(props.page?.content) || {}
})

// Images en attente d'upload (stockées localement avec preview)
// Structure: { [fieldKey]: { file: File, preview: string } }
// Pour les champs 'images' (array): { [fieldKey]: { [index]: { file: File, preview: string } } }
const pendingImages = ref({})
const pendingImagesArray = ref({})

// État de sauvegarde
const isSaving = ref(false)

// Templates disponibles
const availableTemplates = getAvailableTemplates()

// Schema du template sélectionné
const currentSchema = computed(() => {
  if (!formData.template_key) return null
  return getTemplateSchema(formData.template_key)
})

// Quand le template change, réinitialiser le contenu et les images pending
watch(
  () => formData.template_key,
  (newKey, oldKey) => {
    if (newKey && newKey !== oldKey && props.isNew) {
      formData.content = getDefaultContent(newKey)
      cleanupPreviews()
      pendingImages.value = {}
    }
  }
)

// Initialisation si édition
onMounted(async () => {
  if (props.page && !props.isNew) {
    formData.template_key = props.page.template_key
    formData.navBarTitle = props.page.navBarTitle
    // Copie profonde pour ne pas modifier l'original dans chantierPages
    formData.content = deepClone(props.page.content) || {}

    // Charger les URLs signées pour les images existantes
    await loadSignedUrls()
  }
})

// Nettoyage des previews à la destruction du composant
onBeforeUnmount(() => {
  cleanupPreviews()
})

// Nettoyer les URLs de preview pour éviter les fuites mémoire
const cleanupPreviews = () => {
  Object.values(pendingImages.value).forEach((item) => {
    if (item.preview) {
      URL.revokeObjectURL(item.preview)
    }
  })
}

// Extraire le chemin de storage d'une URL Supabase
const extractStoragePath = (url) => {
  const match = url.match(/\/storage\/v1\/object\/public\/photos\/(.+)$/)
  return match ? match[1] : null
}

// Charger les URLs signées pour les images existantes
const loadSignedUrls = async () => {
  if (!currentSchema.value) return

  for (const field of currentSchema.value.fields) {
    // Champ image simple
    if (field.type === 'image' && formData.content[field.key]) {
      let storagePath = formData.content[field.key]

      // Si c'est une ancienne URL complète, extraire le chemin
      if (storagePath.startsWith('http')) {
        const extractedPath = extractStoragePath(storagePath)
        if (extractedPath) {
          storagePath = extractedPath
          // Mettre à jour le contenu avec le chemin (sera sauvegardé si l'utilisateur enregistre)
          formData.content[field.key] = extractedPath
        } else {
          // URL externe, l'utiliser directement
          signedUrls.value[field.key] = storagePath
          continue
        }
      }

      try {
        const url = await getSignedPhotoUrl(storagePath, 3600)
        if (url) {
          signedUrls.value[field.key] = url
        }
      } catch (error) {
        console.error('[PageEditor] Error loading signed URL:', error)
      }
    }

    // Champ images multiples (array)
    if (field.type === 'images' && Array.isArray(formData.content[field.key])) {
      signedUrls.value[field.key] = []

      for (let i = 0; i < formData.content[field.key].length; i++) {
        let storagePath = formData.content[field.key][i]
        if (!storagePath) {
          signedUrls.value[field.key][i] = ''
          continue
        }

        // Si c'est une ancienne URL complète, extraire le chemin
        if (storagePath.startsWith('http')) {
          const extractedPath = extractStoragePath(storagePath)
          if (extractedPath) {
            storagePath = extractedPath
            formData.content[field.key][i] = extractedPath
          } else {
            signedUrls.value[field.key][i] = storagePath
            continue
          }
        }

        try {
          const url = await getSignedPhotoUrl(storagePath, 3600)
          signedUrls.value[field.key][i] = url || ''
        } catch (error) {
          console.error('[PageEditor] Error loading signed URL for array:', error)
          signedUrls.value[field.key][i] = ''
        }
      }
    }
  }
}

// Obtenir l'URL d'affichage pour un champ image (preview locale ou URL signée)
const getImageDisplay = (fieldKey) => {
  // Priorité à la preview locale (nouvelle image sélectionnée)
  if (pendingImages.value[fieldKey]?.preview) {
    return pendingImages.value[fieldKey].preview
  }
  // Sinon, URL signée chargée
  return signedUrls.value[fieldKey] || ''
}

// Vérifier si une image est présente (pending ou existante)
const hasImage = (fieldKey) => {
  return !!pendingImages.value[fieldKey] || !!formData.content[fieldKey]
}

// Charger une image en mémoire
const loadImage = (file) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("Impossible de charger l'image"))
    }
    img.src = url
  })
}

// Redimensionner et convertir en WebP (comme photoUploader.vue)
const resizeImage = async (file) => {
  try {
    const img = await loadImage(file)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    // Dimensions maximales
    const MAX_WIDTH = 1920
    const MAX_HEIGHT = 1080
    let width = img.width
    let height = img.height

    // Calcul du ratio pour conserver les proportions
    if (width > height) {
      if (width > MAX_WIDTH) {
        height *= MAX_WIDTH / width
        width = MAX_WIDTH
      }
    } else {
      if (height > MAX_HEIGHT) {
        width *= MAX_HEIGHT / height
        height = MAX_HEIGHT
      }
    }

    canvas.width = Math.round(width)
    canvas.height = Math.round(height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const newFileName = file.name.replace(/\.[^/.]+$/, '') + '.webp'
            const newFile = new File([blob], newFileName, { type: 'image/webp' })
            resolve(newFile)
          } else {
            reject(new Error('Impossible de créer le blob'))
          }
        },
        'image/webp',
        0.75 // Qualité de compression
      )
    })
  } catch (error) {
    console.error('Erreur lors du redimensionnement:', error)
    return file // En cas d'erreur, retourner le fichier original
  }
}

// Sélection d'une image (stockage local avec preview, pas d'upload)
const handleImageSelect = (fieldKey, event) => {
  const file = event.target.files?.[0]
  if (!file) return

  // Vérification du type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowedTypes.includes(file.type)) {
    addToast({
      title: 'Format non supporté',
      message: 'Utilisez JPG, PNG, WebP ou GIF.',
      type: 'Error'
    })
    return
  }

  // Vérification de la taille (50 Mo max comme photoUploader)
  if (file.size > 50 * 1024 * 1024) {
    addToast({
      title: 'Fichier trop volumineux',
      message: "L'image est trop volumineuse (max 50 Mo).",
      type: 'Error'
    })
    return
  }

  // Nettoyer l'ancienne preview si elle existe
  if (pendingImages.value[fieldKey]?.preview) {
    URL.revokeObjectURL(pendingImages.value[fieldKey].preview)
  }

  // Stocker le fichier avec sa preview locale
  pendingImages.value[fieldKey] = {
    file,
    preview: URL.createObjectURL(file)
  }

  // Réinitialiser l'input pour permettre de resélectionner le même fichier
  event.target.value = ''
}

// Supprimer une image (pending ou existante)
const removeImage = (fieldKey) => {
  // Nettoyer la preview si c'est une image pending
  if (pendingImages.value[fieldKey]?.preview) {
    URL.revokeObjectURL(pendingImages.value[fieldKey].preview)
    delete pendingImages.value[fieldKey]
  }
  // Supprimer aussi l'URL existante
  formData.content[fieldKey] = ''
}

// === Gestion des champs multiples (images array et richtexts) ===

// Ajouter un élément à un champ array
const addArrayItem = (fieldKey, fieldType) => {
  if (!Array.isArray(formData.content[fieldKey])) {
    formData.content[fieldKey] = []
  }
  formData.content[fieldKey].push('')

  // Pour les images, initialiser aussi le tableau d'URLs signées
  if (fieldType === 'images') {
    if (!Array.isArray(signedUrls.value[fieldKey])) {
      signedUrls.value[fieldKey] = []
    }
    signedUrls.value[fieldKey].push('')
  }
}

// Supprimer un élément d'un champ array
const removeArrayItem = (fieldKey, index, fieldType) => {
  if (!Array.isArray(formData.content[fieldKey])) return

  // Pour les images, nettoyer les previews et URLs signées
  if (fieldType === 'images') {
    // Nettoyer la preview pending si elle existe
    if (pendingImagesArray.value[fieldKey]?.[index]?.preview) {
      URL.revokeObjectURL(pendingImagesArray.value[fieldKey][index].preview)
      delete pendingImagesArray.value[fieldKey][index]
    }

    // Supprimer l'URL signée
    if (Array.isArray(signedUrls.value[fieldKey])) {
      signedUrls.value[fieldKey].splice(index, 1)
    }
  }

  formData.content[fieldKey].splice(index, 1)
}

// Sélection d'une image dans un champ array
const handleImageArraySelect = (fieldKey, index, event) => {
  const file = event.target.files?.[0]
  if (!file) return

  // Vérification du type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowedTypes.includes(file.type)) {
    addToast({
      title: 'Format non supporté',
      message: 'Utilisez JPG, PNG, WebP ou GIF.',
      type: 'Error'
    })
    return
  }

  // Vérification de la taille (50 Mo max)
  if (file.size > 50 * 1024 * 1024) {
    addToast({
      title: 'Fichier trop volumineux',
      message: "L'image est trop volumineuse (max 50 Mo).",
      type: 'Error'
    })
    return
  }

  // Initialiser le tableau si nécessaire
  if (!pendingImagesArray.value[fieldKey]) {
    pendingImagesArray.value[fieldKey] = {}
  }

  // Nettoyer l'ancienne preview si elle existe
  if (pendingImagesArray.value[fieldKey][index]?.preview) {
    URL.revokeObjectURL(pendingImagesArray.value[fieldKey][index].preview)
  }

  // Stocker le fichier avec sa preview locale
  pendingImagesArray.value[fieldKey][index] = {
    file,
    preview: URL.createObjectURL(file)
  }

  // Réinitialiser l'input
  event.target.value = ''
}

// Supprimer une image d'un champ array
const removeImageFromArray = (fieldKey, index) => {
  // Nettoyer la preview pending
  if (pendingImagesArray.value[fieldKey]?.[index]?.preview) {
    URL.revokeObjectURL(pendingImagesArray.value[fieldKey][index].preview)
    delete pendingImagesArray.value[fieldKey][index]
  }

  // Vider l'URL dans le contenu mais garder l'élément
  if (Array.isArray(formData.content[fieldKey])) {
    formData.content[fieldKey][index] = ''
  }

  // Vider l'URL signée
  if (Array.isArray(signedUrls.value[fieldKey])) {
    signedUrls.value[fieldKey][index] = ''
  }
}

// Obtenir l'URL d'affichage pour une image dans un array
const getImageArrayDisplay = (fieldKey, index) => {
  // Priorité à la preview locale
  if (pendingImagesArray.value[fieldKey]?.[index]?.preview) {
    return pendingImagesArray.value[fieldKey][index].preview
  }
  // Sinon, URL signée chargée
  return signedUrls.value[fieldKey]?.[index] || ''
}

// Vérifier si une image est présente dans un array
const hasImageInArray = (fieldKey, index) => {
  return !!pendingImagesArray.value[fieldKey]?.[index] || !!formData.content[fieldKey]?.[index]
}

// Vérifier si une image est en attente d'upload dans un array
const isImagePendingInArray = (fieldKey, index) => {
  return !!pendingImagesArray.value[fieldKey]?.[index]
}

// Upload d'une image vers Supabase Storage
// Retourne le chemin du fichier (pas l'URL) pour utiliser des URLs signées à l'affichage
const uploadImage = async (file) => {
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 15)
  // Le fichier est déjà en WebP après resizeImage, donc on force l'extension
  const filePath = `custom-pages/${props.chantierId}/${timestamp}_${randomString}.webp`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, { cacheControl: '3600', upsert: false })

  if (uploadError) {
    console.error('[PageEditor] Upload error:', uploadError)
    throw uploadError
  }

  // Retourner le chemin, pas l'URL (on utilisera getSignedPhotoUrl à l'affichage)
  return filePath
}

// Validation du formulaire (prend en compte les images pending)
const isValid = computed(() => {
  if (!formData.template_key) return false
  if (!formData.navBarTitle?.trim()) return false

  // Vérifier les champs requis du schema
  if (currentSchema.value) {
    for (const field of currentSchema.value.fields) {
      if (field.required) {
        if (field.type === 'image') {
          // Pour les images, vérifier pending OU existante
          if (!pendingImages.value[field.key] && !formData.content[field.key]) {
            return false
          }
        } else if (!formData.content[field.key]) {
          return false
        }
      }
    }
  }

  return true
})

// Sauvegarder (avec upload des images pending)
const handleSave = async () => {
  if (!isValid.value || isSaving.value) return

  isSaving.value = true

  try {
    // Préparer le contenu final
    const finalContent = { ...formData.content }

    // Upload des images pending simples (redimensionnement + conversion WebP)
    const pendingKeys = Object.keys(pendingImages.value)

    for (const fieldKey of pendingKeys) {
      const { file } = pendingImages.value[fieldKey]

      // Redimensionner et convertir en WebP
      const processedFile = await resizeImage(file)

      // Upload vers Supabase
      const publicUrl = await uploadImage(processedFile)
      finalContent[fieldKey] = publicUrl
    }

    // Upload des images pending dans les arrays
    for (const fieldKey of Object.keys(pendingImagesArray.value)) {
      const pendingItems = pendingImagesArray.value[fieldKey]

      // S'assurer que le contenu est un array
      if (!Array.isArray(finalContent[fieldKey])) {
        finalContent[fieldKey] = []
      }

      for (const indexStr of Object.keys(pendingItems)) {
        const index = parseInt(indexStr)
        const { file } = pendingItems[index]

        if (file) {
          // Redimensionner et convertir en WebP
          const processedFile = await resizeImage(file)

          // Upload vers Supabase
          const publicUrl = await uploadImage(processedFile)
          finalContent[fieldKey][index] = publicUrl
        }
      }
    }

    // Filtrer les éléments vides des arrays (images et richtexts)
    if (currentSchema.value) {
      for (const field of currentSchema.value.fields) {
        if ((field.type === 'images' || field.type === 'richtexts') && Array.isArray(finalContent[field.key])) {
          finalContent[field.key] = finalContent[field.key].filter(item => item && item.trim?.() !== '')
        }
      }
    }

    // Nettoyer les previews
    cleanupPreviews()
    cleanupArrayPreviews()
    pendingImages.value = {}
    pendingImagesArray.value = {}

    // Émettre les données
    emit('save', {
      template_key: formData.template_key,
      navBarTitle: formData.navBarTitle.trim(),
      content: finalContent
    })
  } catch (err) {
    console.error('[PageEditor] Erreur lors de la sauvegarde:', err)
    addToast({
      title: 'Erreur',
      message: err.message || 'Impossible de sauvegarder la page',
      type: 'Error'
    })
  } finally {
    isSaving.value = false
  }
}

// Nettoyer les previews des arrays
const cleanupArrayPreviews = () => {
  for (const fieldKey of Object.keys(pendingImagesArray.value)) {
    for (const index of Object.keys(pendingImagesArray.value[fieldKey])) {
      if (pendingImagesArray.value[fieldKey][index]?.preview) {
        URL.revokeObjectURL(pendingImagesArray.value[fieldKey][index].preview)
      }
    }
  }
}

// Annuler (nettoyer les previews, pas d'upload orphelin)
const handleCancel = () => {
  cleanupPreviews()
  cleanupArrayPreviews()
  pendingImages.value = {}
  pendingImagesArray.value = {}
  emit('cancel')
}
</script>

<template>
  <div class="page-editor space-y-6">
    <!-- Sélection du template (uniquement en création) -->
    <div v-if="isNew" class="space-y-2">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Type de page
        <span class="text-red-500">*</span>
      </label>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button v-for="template in availableTemplates" :key="template.key" type="button"
          class="flex items-start gap-3 rounded-xl border-2 p-4 text-left transition" :class="formData.template_key === template.key
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
              : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
            " @click="formData.template_key = template.key">
          <Icon :name="template.icon" size="24" class="mt-0.5 shrink-0" :class="formData.template_key === template.key ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'
            " />
          <div>
            <p class="font-medium" :class="formData.template_key === template.key
                ? 'text-primary-700 dark:text-primary-300'
                : 'text-gray-700 dark:text-gray-300'
              ">
              {{ template.name }}
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ template.description }}
            </p>
          </div>
        </button>
      </div>
    </div>

    <!-- Titre de navigation -->
    <div class="space-y-2">
      <label for="navBarTitle" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Titre du menu
        <span class="text-red-500">*</span>
      </label>
      <input id="navBarTitle" v-model="formData.navBarTitle" type="text"
        placeholder="Nom affiché dans le menu latéral..."
        class="focus:border-primary-500 focus:ring-primary-500/20 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:ring-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
        maxlength="50" />
      <p class="text-xs text-gray-500 dark:text-gray-400">{{ formData.navBarTitle?.length || 0 }} / 50 caractères</p>
    </div>

    <!-- Formulaire dynamique basé sur le schema -->
    <div v-if="currentSchema" class="space-y-5 border-t border-gray-200 pt-6 dark:border-gray-700">
      <h3 class="text-lg font-semibold text-gray-800 dark:text-white">Contenu de la page</h3>

      <div v-for="field in currentSchema.fields" :key="field.key" class="space-y-2">
        <label :for="`field-${field.key}`" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {{ field.label }}
          <span v-if="field.required" class="text-red-500">*</span>
        </label>

        <!-- Champ texte simple -->
        <input v-if="field.type === 'text'" :id="`field-${field.key}`" v-model="formData.content[field.key]" type="text"
          :placeholder="field.placeholder" :maxlength="field.maxLength"
          class="focus:border-primary-500 focus:ring-primary-500/20 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:ring-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400" />

        <!-- Champ textarea -->
        <textarea v-else-if="field.type === 'textarea'" :id="`field-${field.key}`" v-model="formData.content[field.key]"
          :placeholder="field.placeholder" rows="4"
          class="focus:border-primary-500 focus:ring-primary-500/20 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:ring-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400" />

        <!-- Éditeur de texte riche (Quill) -->
        <div v-else-if="field.type === 'richtext'" class="rounded-lg border border-gray-300 dark:border-gray-600">
          <QuillEditor v-model="formData.content[field.key]" :placeholder="field.placeholder" />
        </div>

        <!-- Champ nombre -->
        <input v-else-if="field.type === 'number'" :id="`field-${field.key}`"
          v-model.number="formData.content[field.key]" type="number" :placeholder="field.placeholder"
          class="focus:border-primary-500 focus:ring-primary-500/20 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:ring-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400" />

        <!-- Champ select -->
        <select v-else-if="field.type === 'select'" :id="`field-${field.key}`" v-model="formData.content[field.key]"
          class="focus:border-primary-500 focus:ring-primary-500/20 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:ring-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
          <option v-for="option in field.options" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>

        <!-- Champ checkbox -->
        <label v-else-if="field.type === 'checkbox'" class="flex cursor-pointer items-center gap-3">
          <input :id="`field-${field.key}`" v-model="formData.content[field.key]" type="checkbox"
            class="text-primary-600 focus:ring-primary-500 h-5 w-5 rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700" />
          <span class="text-sm text-gray-600 dark:text-gray-400">
            {{ field.label }}
          </span>
        </label>

        <!-- Champ image -->
        <div v-else-if="field.type === 'image'" class="space-y-3">
          <!-- Aperçu de l'image (pending ou existante) -->
          <div v-if="hasImage(field.key)" class="relative inline-block">
            <img :src="getImageDisplay(field.key)" :alt="field.label"
              class="h-32 w-auto rounded-lg object-cover shadow-sm" />
            <button type="button"
              class="absolute -top-2 -right-2 rounded-full bg-red-500 p-1.5 text-white shadow-md hover:bg-red-600"
              @click="removeImage(field.key)">
              <Icon name="lucide:x" size="14" />
            </button>
            <!-- Badge si image en attente d'upload -->
            <span v-if="pendingImages[field.key]"
              class="absolute -bottom-2 -left-2 rounded-full bg-amber-500 px-2 py-0.5 text-xs font-medium text-white shadow-md">
              En attente
            </span>
          </div>

          <!-- Input file -->
          <div class="relative">
            <input :id="`field-${field.key}`" type="file" accept="image/jpeg,image/png,image/webp,image/gif"
              class="absolute inset-0 cursor-pointer opacity-0" @change="handleImageSelect(field.key, $event)" />
            <div
              class="hover:border-primary-400 hover:text-primary-600 dark:hover:border-primary-500 dark:hover:text-primary-400 flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-4 py-6 text-gray-500 transition dark:border-gray-600 dark:text-gray-400">
              <Icon name="lucide:upload" size="20" />
              <span class="text-sm font-medium">
                {{ hasImage(field.key) ? "Changer l'image" : 'Choisir une image' }}
              </span>
            </div>
          </div>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            L'image sera redimensionnée et convertie en WebP à la sauvegarde.
          </p>
        </div>

        <!-- Champ images multiples (array) -->
        <div v-else-if="field.type === 'images'" class="space-y-4">
          <!-- Liste des images -->
          <div class="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div v-for="(imagePath, index) in (formData.content[field.key] || [''])" :key="index" class="relative">
              <!-- Aperçu de l'image -->
              <div v-if="hasImageInArray(field.key, index)"
                class="relative aspect-video overflow-hidden rounded-lg shadow-sm">
                <img :src="getImageArrayDisplay(field.key, index)" :alt="`${field.label} ${index + 1}`"
                  class="h-full w-full object-cover" />
                <button type="button"
                  class="absolute -top-2 -right-2 rounded-full bg-red-500 p-1.5 text-white shadow-md hover:bg-red-600"
                  @click="removeImageFromArray(field.key, index)">
                  <Icon name="lucide:x" size="14" />
                </button>
                <!-- Badge si image en attente -->
                <span v-if="isImagePendingInArray(field.key, index)"
                  class="absolute bottom-2 left-2 rounded-full bg-amber-500 px-2 py-0.5 text-xs font-medium text-white shadow-md">
                  En attente
                </span>
              </div>

              <!-- Zone d'upload -->
              <div v-else class="relative aspect-video">
                <input :id="`field-${field.key}-${index}`" type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  class="absolute inset-0 z-10 cursor-pointer opacity-0"
                  @change="handleImageArraySelect(field.key, index, $event)" />
                <div
                  class="hover:border-primary-400 hover:text-primary-600 dark:hover:border-primary-500 dark:hover:text-primary-400 flex h-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 text-gray-400 transition dark:border-gray-600">
                  <Icon name="lucide:image-plus" size="24" />
                  <span class="text-xs font-medium">Image {{ index + 1 }}</span>
                </div>
              </div>

              <!-- Bouton supprimer l'emplacement (sauf si c'est le dernier) -->
              <button v-if="(formData.content[field.key]?.length || 0) > 1" type="button"
                class="absolute -bottom-2 -right-2 rounded-full bg-gray-500 p-1 text-white shadow-md hover:bg-gray-600"
                @click="removeArrayItem(field.key, index, 'images')">
                <Icon name="lucide:trash-2" size="12" />
              </button>
            </div>
          </div>

          <!-- Bouton ajouter une image -->
          <button v-if="!field.maxItems || (formData.content[field.key]?.length || 0) < field.maxItems" type="button"
            class="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 flex items-center gap-2 text-sm font-medium"
            @click="addArrayItem(field.key, 'images')">
            <Icon name="lucide:plus-circle" size="18" />
            Ajouter une image
          </button>

          <p class="text-xs text-gray-500 dark:text-gray-400">
            Les images seront redimensionnées et converties en WebP à la sauvegarde.
            {{ field.maxItems ? `Maximum ${field.maxItems} images.` : '' }}
          </p>
        </div>

        <!-- Champ textes riches multiples (array) -->
        <div v-else-if="field.type === 'richtexts'" class="space-y-4">
          <!-- Liste des éditeurs -->
          <div class="space-y-4">
            <div v-for="(texte, index) in (formData.content[field.key] || [''])" :key="index"
              class="relative rounded-lg border border-gray-200 dark:border-gray-700">
              <div
                class="border-primary-500 dark:border-primary-400 flex items-center justify-between border-b bg-gray-50 px-3 py-2 dark:bg-gray-800">
                <span class="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Texte {{ index + 1 }}
                </span>
                <button v-if="(formData.content[field.key]?.length || 0) > 1" type="button"
                  class="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-red-500 dark:hover:bg-gray-700"
                  @click="removeArrayItem(field.key, index, 'richtexts')">
                  <Icon name="lucide:trash-2" size="16" />
                </button>
              </div>
              <QuillEditor v-model="formData.content[field.key][index]"
                :placeholder="field.placeholder || 'Rédigez votre contenu...'" />
            </div>
          </div>

          <!-- Bouton ajouter un texte -->
          <button v-if="!field.maxItems || (formData.content[field.key]?.length || 0) < field.maxItems" type="button"
            class="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 flex items-center gap-2 text-sm font-medium"
            @click="addArrayItem(field.key, 'richtexts')">
            <Icon name="lucide:plus-circle" size="18" />
            Ajouter un bloc de texte
          </button>

          <p v-if="field.maxItems" class="text-xs text-gray-500 dark:text-gray-400">
            Maximum {{ field.maxItems }} blocs de texte.
          </p>
        </div>

        <!-- Texte d'aide -->
        <p v-if="field.helpText" class="text-xs text-gray-500 dark:text-gray-400">
          {{ field.helpText }}
        </p>
      </div>
    </div>

    <!-- Placeholder si aucun template sélectionné -->
    <div v-if="isNew && !formData.template_key"
      class="flex flex-col items-center justify-center rounded-xl bg-gray-50 py-12 text-center dark:bg-gray-800">
      <Icon name="lucide:layout-template" size="48" class="mb-3 text-gray-300 dark:text-gray-600" />
      <p class="text-gray-500 dark:text-gray-400">Sélectionnez un type de page pour continuer</p>
    </div>

    <!-- Actions -->
    <div class="flex items-center justify-end gap-3 border-t border-gray-200 pt-6 dark:border-gray-700">
      <button type="button" :disabled="isSaving"
        class="rounded-lg px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-700"
        @click="handleCancel">
        Annuler
      </button>
      <button type="button" :disabled="!isValid || isSaving"
        class="bg-primary-600 hover:bg-primary-700 flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-50"
        @click="handleSave">
        <Icon v-if="isSaving" name="lucide:loader-2" size="16" class="animate-spin" />
        {{ isSaving ? 'Enregistrement...' : isNew ? 'Créer la page' : 'Enregistrer' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Animation loader */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
