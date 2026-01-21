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

// État local du formulaire
const formData = reactive({
  template_key: props.page?.template_key || '',
  navBarTitle: props.page?.navBarTitle || '',
  content: { ...(props.page?.content || {}) }
})

// Images en attente d'upload (stockées localement avec preview)
// Structure: { [fieldKey]: { file: File, preview: string } }
const pendingImages = ref({})

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
    formData.content = { ...props.page.content }

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

    // Upload des images pending (redimensionnement + conversion WebP)
    const pendingKeys = Object.keys(pendingImages.value)

    for (const fieldKey of pendingKeys) {
      const { file } = pendingImages.value[fieldKey]

      // Redimensionner et convertir en WebP
      const processedFile = await resizeImage(file)

      // Upload vers Supabase
      const publicUrl = await uploadImage(processedFile)
      finalContent[fieldKey] = publicUrl
    }

    // Nettoyer les previews
    cleanupPreviews()
    pendingImages.value = {}

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

// Annuler (nettoyer les previews, pas d'upload orphelin)
const handleCancel = () => {
  cleanupPreviews()
  pendingImages.value = {}
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
        <button
          v-for="template in availableTemplates"
          :key="template.key"
          type="button"
          class="flex items-start gap-3 rounded-xl border-2 p-4 text-left transition"
          :class="
            formData.template_key === template.key
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
              : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
          "
          @click="formData.template_key = template.key">
          <Icon
            :name="template.icon"
            size="24"
            class="mt-0.5 shrink-0"
            :class="
              formData.template_key === template.key ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'
            " />
          <div>
            <p
              class="font-medium"
              :class="
                formData.template_key === template.key
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
      <input
        id="navBarTitle"
        v-model="formData.navBarTitle"
        type="text"
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
        <input
          v-if="field.type === 'text'"
          :id="`field-${field.key}`"
          v-model="formData.content[field.key]"
          type="text"
          :placeholder="field.placeholder"
          :maxlength="field.maxLength"
          class="focus:border-primary-500 focus:ring-primary-500/20 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:ring-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400" />

        <!-- Champ textarea -->
        <textarea
          v-else-if="field.type === 'textarea'"
          :id="`field-${field.key}`"
          v-model="formData.content[field.key]"
          :placeholder="field.placeholder"
          rows="4"
          class="focus:border-primary-500 focus:ring-primary-500/20 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:ring-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400" />

        <!-- Éditeur de texte riche (Quill) -->
        <div v-else-if="field.type === 'richtext'" class="rounded-lg border border-gray-300 dark:border-gray-600">
          <QuillEditor v-model="formData.content[field.key]" :placeholder="field.placeholder" />
        </div>

        <!-- Champ nombre -->
        <input
          v-else-if="field.type === 'number'"
          :id="`field-${field.key}`"
          v-model.number="formData.content[field.key]"
          type="number"
          :placeholder="field.placeholder"
          class="focus:border-primary-500 focus:ring-primary-500/20 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:ring-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400" />

        <!-- Champ select -->
        <select
          v-else-if="field.type === 'select'"
          :id="`field-${field.key}`"
          v-model="formData.content[field.key]"
          class="focus:border-primary-500 focus:ring-primary-500/20 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:ring-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
          <option v-for="option in field.options" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>

        <!-- Champ checkbox -->
        <label v-else-if="field.type === 'checkbox'" class="flex cursor-pointer items-center gap-3">
          <input
            :id="`field-${field.key}`"
            v-model="formData.content[field.key]"
            type="checkbox"
            class="text-primary-600 focus:ring-primary-500 h-5 w-5 rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700" />
          <span class="text-sm text-gray-600 dark:text-gray-400">
            {{ field.label }}
          </span>
        </label>

        <!-- Champ image -->
        <div v-else-if="field.type === 'image'" class="space-y-3">
          <!-- Aperçu de l'image (pending ou existante) -->
          <div v-if="hasImage(field.key)" class="relative inline-block">
            <img
              :src="getImageDisplay(field.key)"
              :alt="field.label"
              class="h-32 w-auto rounded-lg object-cover shadow-sm" />
            <button
              type="button"
              class="absolute -top-2 -right-2 rounded-full bg-red-500 p-1.5 text-white shadow-md hover:bg-red-600"
              @click="removeImage(field.key)">
              <Icon name="lucide:x" size="14" />
            </button>
            <!-- Badge si image en attente d'upload -->
            <span
              v-if="pendingImages[field.key]"
              class="absolute -bottom-2 -left-2 rounded-full bg-amber-500 px-2 py-0.5 text-xs font-medium text-white shadow-md">
              En attente
            </span>
          </div>

          <!-- Input file -->
          <div class="relative">
            <input
              :id="`field-${field.key}`"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              class="absolute inset-0 cursor-pointer opacity-0"
              @change="handleImageSelect(field.key, $event)" />
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

        <!-- Texte d'aide -->
        <p v-if="field.helpText" class="text-xs text-gray-500 dark:text-gray-400">
          {{ field.helpText }}
        </p>
      </div>
    </div>

    <!-- Placeholder si aucun template sélectionné -->
    <div
      v-if="isNew && !formData.template_key"
      class="flex flex-col items-center justify-center rounded-xl bg-gray-50 py-12 text-center dark:bg-gray-800">
      <Icon name="lucide:layout-template" size="48" class="mb-3 text-gray-300 dark:text-gray-600" />
      <p class="text-gray-500 dark:text-gray-400">Sélectionnez un type de page pour continuer</p>
    </div>

    <!-- Actions -->
    <div class="flex items-center justify-end gap-3 border-t border-gray-200 pt-6 dark:border-gray-700">
      <button
        type="button"
        :disabled="isSaving"
        class="rounded-lg px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-700"
        @click="handleCancel">
        Annuler
      </button>
      <button
        type="button"
        :disabled="!isValid || isSaving"
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
