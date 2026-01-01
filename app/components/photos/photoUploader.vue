<script setup>
const props = defineProps({
  chantierId: {
    type: [String, Number],
    required: true
  },
  repertoireId: {
    type: [String, Number],
    default: null
  }
})

const emit = defineEmits(['uploaded', 'error'])

const { uploadMultiplePhotos } = usePhotos()
const { addToast } = useToast()

const isUploading = ref(false)
const uploadProgress = ref(0)
const fileInputRef = ref(null)
const selectedFiles = ref([]) // Fichiers sélectionnés en attente d'upload
const uploadingFiles = ref([])
const uploadedCount = ref(0) // Nombre de photos uploadées
const totalPhotos = ref(0) // Nombre total de photos

// Format de fichiers acceptés
const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const maxFileSize = 50 * 1024 * 1024 // 50MB

// Fonction helper pour charger une image
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

// Redimensionner une image
const resizeImage = async (file) => {
  try {
    // Charger l'image en mémoire
    const img = await loadImage(file)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    // Définir les dimensions maximales
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

    // Appliquer les nouvelles dimensions au canvas
    canvas.width = Math.round(width)
    canvas.height = Math.round(height)

    // Dessiner l'image redimensionnée
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const newFileName = file.name.replace(/\.[^/.]+$/, '') + '.webp'
            const newFile = new File([blob], newFileName, {
              type: 'image/webp'
            })
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
    // En cas d'erreur, retourner le fichier original
    return file
  }
}

const handleFileDrop = async (event) => {
  event.preventDefault()
  const files = Array.from(event.dataTransfer?.files || [])
  if (files.length === 0) return
  await processFiles(files)
}

const handleFileSelect = async (event) => {
  const files = Array.from(event.target.files || [])
  if (files.length === 0) return
  await processFiles(files)
}

const processFiles = async (files) => {
  // Filtrer uniquement les images
  const imageFiles = files.filter((file) => file.type.startsWith('image/'))

  // Vérifier les fichiers
  const validFiles = []
  const invalidFiles = []

  imageFiles.forEach((file) => {
    if (!acceptedTypes.includes(file.type)) {
      invalidFiles.push({ name: file.name, reason: 'Format non supporté' })
    } else if (file.size > maxFileSize) {
      invalidFiles.push({
        name: file.name,
        reason: 'Fichier trop volumineux (max 50MB)'
      })
    } else {
      validFiles.push(file)
    }
  })

  // Afficher les erreurs
  if (invalidFiles.length > 0) {
    invalidFiles.forEach(({ name, reason }) => {
      addToast({
        title: 'Fichier invalide',
        message: `${name}: ${reason}`,
        type: 'Error'
      })
    })
  }

  if (validFiles.length === 0) return

  // Ajouter les fichiers à la liste (pas d'upload immédiat)
  selectedFiles.value.push(
    ...validFiles.map((file) => ({
      file,
      name: file.name,
      size: file.size,
      preview: URL.createObjectURL(file)
    }))
  )

  // Réinitialiser l'input
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

// Supprimer un fichier de la liste
const removeFile = (index) => {
  const file = selectedFiles.value[index]
  if (file.preview) {
    URL.revokeObjectURL(file.preview)
  }
  selectedFiles.value.splice(index, 1)
}

// Envoyer tous les fichiers sélectionnés
const uploadFiles = async () => {
  if (selectedFiles.value.length === 0) return

  isUploading.value = true
  uploadProgress.value = 0
  uploadedCount.value = 0
  totalPhotos.value = selectedFiles.value.length
  uploadingFiles.value = selectedFiles.value.map((item) => ({
    name: item.name,
    size: item.size,
    progress: 0,
    completed: false
  }))

  try {
    // Redimensionner toutes les images
    const resizedFiles = await Promise.all(
      selectedFiles.value.map(async (item) => {
        try {
          return await resizeImage(item.file)
        } catch (error) {
          console.error(`Erreur lors du redimensionnement de ${item.name}:`, error)
          // En cas d'erreur, utiliser le fichier original
          return item.file
        }
      })
    )

    // Callback pour mettre à jour la progression individuelle
    const onProgress = (index, progress, total) => {
      // Mettre à jour la progression de la photo spécifique
      if (uploadingFiles.value[index]) {
        uploadingFiles.value[index].progress = Math.round(progress)

        // Si la photo est terminée (100%), marquer comme complétée
        if (progress >= 100 && !uploadingFiles.value[index].completed) {
          uploadingFiles.value[index].completed = true
        }
      }

      // Calculer la progression globale basée sur les photos complétées
      const completedPhotos = uploadingFiles.value.filter((f) => f.completed).length
      uploadedCount.value = completedPhotos
      const overallProgress = total > 0 ? Math.round((completedPhotos / total) * 100) : 0
      uploadProgress.value = overallProgress
    }

    const results = await uploadMultiplePhotos(resizedFiles, props.chantierId, props.repertoireId, onProgress)

    // Vérifier les erreurs
    const errors = results.filter((r) => r.error)
    const successes = results.filter((r) => !r.error)

    if (errors.length > 0) {
      errors.forEach((result) => {
        addToast({
          title: 'Upload error',
          message: result.error?.message || "Erreur lors de l'upload",
          type: 'Error'
        })
      })
      emit('error', errors)
    }

    if (successes.length > 0) {
      addToast({
        title: 'Upload success',
        message: `${successes.length} photo(s) uploadée(s) avec succès`,
        type: 'Success'
      })
      emit(
        'uploaded',
        successes.map((r) => r.data)
      )

      // Nettoyer les previews et vider la liste
      selectedFiles.value.forEach((item) => {
        if (item.preview) {
          URL.revokeObjectURL(item.preview)
        }
      })
      selectedFiles.value = []
    }

    uploadProgress.value = 100
    uploadedCount.value = totalPhotos.value
  } catch (error) {
    console.error("Erreur lors de l'upload:", error)
    addToast({
      title: 'Erreur upload',
      message: error.message || "Erreur lors de l'upload des photos",
      type: 'Error'
    })
    emit('error', [error])
  } finally {
    setTimeout(() => {
      isUploading.value = false
      uploadingFiles.value = []
      uploadProgress.value = 0
      uploadedCount.value = 0
      totalPhotos.value = 0
    }, 1000)
  }
}

const triggerFileInput = () => {
  fileInputRef.value?.click()
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}
</script>

<template>
  <div class="space-y-4">
    <!-- Zone de drop ou bouton d'upload -->
    <div
      class="border-primary-400 hover:border-primary-700 cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors"
      :class="isUploading ? 'border-primary bg-primary/5' : 'border-muted'"
      @click="!isUploading && triggerFileInput()"
      @dragover.prevent
      @dragenter.prevent
      @drop="handleFileDrop">
      <input ref="fileInputRef" type="file" accept="image/*" multiple class="hidden" @change="handleFileSelect" />

      <div v-if="!isUploading" class="space-y-2">
        <Icon name="lucide:upload-cloud" size="44" class="text-primary-700 mx-auto" />
        <p class="text-primary-700 text-sm font-medium">Glisser-déposer des photos ici</p>
        <p class="text-primary-500 mt-1 text-xs">ou cliquez pour sélectionner</p>
        <p class="text-primary-500 mt-1 text-xs">Formats acceptés: JPG, PNG, WEBP, GIF (max 50MB)</p>
      </div>

      <!-- Barre de progression lors de l'upload -->
      <div v-else class="relative mx-auto h-32 w-32 space-y-4">
        <!-- Cercle de progression -->
        <svg class="h-32 w-32 -rotate-90 transform" viewBox="0 0 120 120">
          <!-- Cercle de fond -->
          <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" stroke-width="8" class="text-muted" />
          <!-- Cercle de progression -->
          <circle
            cx="60"
            cy="60"
            r="50"
            fill="none"
            stroke="currentColor"
            stroke-width="8"
            stroke-linecap="round"
            :stroke-dasharray="2 * Math.PI * 50"
            :stroke-dashoffset="2 * Math.PI * 50 * (1 - uploadProgress / 100)"
            class="text-primary transition-all duration-300" />
        </svg>
        <!-- Compteur de photos au centre -->
        <div class="absolute inset-0 flex flex-col items-center justify-center">
          <div class="text-lg font-semibold">{{ uploadedCount }} / {{ totalPhotos }}</div>
          <div class="text-muted mt-1 text-xs">photos</div>
        </div>
      </div>

      <!-- Liste des fichiers en cours d'upload -->
      <div class="max-h-40 space-y-2 overflow-y-auto">
        <div v-for="(file, index) in uploadingFiles" :key="index" class="bg-muted/50 rounded p-2 text-left text-xs">
          <div class="mb-1 flex items-center justify-between">
            <span class="flex-1 truncate">{{ file.name }}</span>
            <span class="text-muted ml-2">{{ formatFileSize(file.size) }}</span>
          </div>
          <div class="bg-elevated h-1.5 w-full rounded-full">
            <div
              class="bg-primary h-1.5 rounded-full transition-all duration-300"
              :style="{ width: `${file.progress}%` }"></div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Liste des fichiers sélectionnés en attente -->
  <div v-if="!isUploading && selectedFiles.length > 0" class="mt-4 space-y-2">
    <div class="text-sm font-medium">Photos sélectionnées ({{ selectedFiles.length }})</div>
    <div class="grid max-h-60 grid-cols-3 gap-2 overflow-y-auto">
      <div
        v-for="(item, index) in selectedFiles"
        :key="index"
        class="group relative aspect-square overflow-hidden rounded-lg">
        <img :src="item.preview" :alt="item.name" class="h-full w-full object-cover" />
        <div
          class="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            @click="removeFile(index)"
            aria-label="Retirer"
            class="flex h-8 w-8 cursor-pointer items-center justify-center rounded bg-red-300 transition-colors hover:bg-red-600">
            <Icon name="lucide:x" size="16" class="text-white" />
          </button>
        </div>
        <div class="absolute right-0 bottom-0 left-0 truncate bg-black/50 p-1 text-xs text-white">
          {{ item.name }}
        </div>
      </div>
    </div>
  </div>

  <!-- Bouton d'envoi -->
  <div
    v-if="!isUploading && selectedFiles.length > 0"
    class="mt-auto flex justify-center border-t border-gray-300 pt-4">
    <AppButtonValidated theme="primary" block size="lg" @click="uploadFiles" class="" :disabled="isUploading">
      <template #default>
        <Icon name="lucide:upload" size="16" class="mr-2" />
        <span>Envoyer {{ selectedFiles.length }} photo(s)</span>
      </template>
    </AppButtonValidated>
  </div>
</template>
