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
const uploadedCount = ref(0)
const totalPhotos = ref(0)

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
    const img = await loadImage(file)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    const MAX_WIDTH = 1920
    const MAX_HEIGHT = 1080
    let width = img.width
    let height = img.height

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
          if (blob && blob.size < 1024 * 1024) {
            const newFileName = file.name.replace(/\.[^/.]+$/, '') + '.webp'
            resolve(new File([blob], newFileName, { type: 'image/webp' }))
          } else {
            canvas.toBlob(
              (jpegBlob) => {
                if (jpegBlob) {
                  const newFileName = file.name.replace(/\.[^/.]+$/, '') + '.jpg'
                  resolve(new File([jpegBlob], newFileName, { type: 'image/jpeg' }))
                } else {
                  reject(new Error('Impossible de créer le blob'))
                }
              },
              'image/jpeg',
              0.82
            )
          }
        },
        'image/webp',
        0.75
      )
    })
  } catch (error) {
    console.error('Erreur lors du redimensionnement:', error)
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
  const imageFiles = files.filter((file) => file.type.startsWith('image/'))

  const validFiles = []
  const invalidFiles = []

  imageFiles.forEach((file) => {
    if (!acceptedTypes.includes(file.type)) {
      invalidFiles.push({ name: file.name, reason: 'Format non supporté' })
    } else if (file.size > maxFileSize) {
      invalidFiles.push({ name: file.name, reason: 'Fichier trop volumineux (max 50MB)' })
    } else {
      validFiles.push(file)
    }
  })

  if (invalidFiles.length > 0) {
    invalidFiles.forEach(({ name, reason }) => {
      addToast({ title: 'Fichier invalide', message: `${name}: ${reason}`, type: 'Error' })
    })
  }

  if (validFiles.length === 0) return

  selectedFiles.value.push(
    ...validFiles.map((file) => ({
      file,
      name: file.name,
      size: file.size,
      preview: URL.createObjectURL(file)
    }))
  )

  if (fileInputRef.value) fileInputRef.value.value = ''
}

const removeFile = (index) => {
  const file = selectedFiles.value[index]
  if (file.preview) URL.revokeObjectURL(file.preview)
  selectedFiles.value.splice(index, 1)
}

// Calcul de la progression globale en tenant compte des deux phases
// Phase compression : 30% du poids total, phase upload : 70%
const computeGlobalProgress = () => {
  const total = uploadingFiles.value.length
  if (total === 0) return 0

  let sum = 0
  for (const f of uploadingFiles.value) {
    if (f.status === 'done') {
      sum += 100
    } else if (f.status === 'error') {
      sum += 100
    } else if (f.status === 'uploading') {
      // 30% (compression) + 70% * progression upload
      sum += 30 + (f.progress / 100) * 70
    } else if (f.status === 'pending') {
      // compression terminée
      sum += 30
    } else if (f.status === 'resizing') {
      sum += 15 // en cours de compression
    }
    // 'waiting' → 0
  }
  return Math.round(sum / total)
}

const phaseLabel = computed(() => {
  if (!isUploading.value) return ''
  const statuses = uploadingFiles.value.map((f) => f.status)
  if (statuses.every((s) => s === 'waiting')) return 'Préparation...'
  if (statuses.some((s) => s === 'resizing')) return 'Compression des photos...'
  if (statuses.some((s) => s === 'uploading')) return 'Envoi en cours...'
  if (statuses.every((s) => s === 'done' || s === 'error')) return 'Terminé'
  return 'Envoi en cours...'
})

// Envoyer tous les fichiers sélectionnés
const uploadFiles = async () => {
  if (selectedFiles.value.length === 0) return

  isUploading.value = true
  uploadProgress.value = 0
  uploadedCount.value = 0
  totalPhotos.value = selectedFiles.value.length

  // Initialiser l'état de chaque fichier
  uploadingFiles.value = selectedFiles.value.map((item) => ({
    name: item.name,
    size: item.size,
    preview: item.preview,
    compressedSize: null,
    progress: 0,
    status: 'waiting' // waiting | resizing | pending | uploading | done | error
  }))

  try {
    // Phase 1 : compression séquentielle (pour montrer l'avancement au fur et à mesure)
    const resizedFiles = []
    for (let i = 0; i < selectedFiles.value.length; i++) {
      uploadingFiles.value[i].status = 'resizing'
      uploadProgress.value = computeGlobalProgress()
      try {
        const resized = await resizeImage(selectedFiles.value[i].file)
        uploadingFiles.value[i].compressedSize = resized.size
        uploadingFiles.value[i].status = 'pending'
        resizedFiles.push(resized)
      } catch (err) {
        console.error(`Erreur redimensionnement ${selectedFiles.value[i].name}:`, err)
        uploadingFiles.value[i].status = 'pending'
        resizedFiles.push(selectedFiles.value[i].file)
      }
      uploadProgress.value = computeGlobalProgress()
    }

    // Callback de progression individuelle
    const onProgress = (index, progress, total) => {
      if (uploadingFiles.value[index]) {
        if (uploadingFiles.value[index].status !== 'done') {
          uploadingFiles.value[index].status = 'uploading'
          uploadingFiles.value[index].progress = Math.round(progress)
        }
        if (progress >= 100 && uploadingFiles.value[index].status !== 'error') {
          uploadingFiles.value[index].status = 'done'
          uploadedCount.value = uploadingFiles.value.filter((f) => f.status === 'done').length
        }
      }
      uploadProgress.value = computeGlobalProgress()
    }

    const results = await uploadMultiplePhotos(resizedFiles, props.chantierId, props.repertoireId, onProgress)

    // Mettre à jour les statuts finaux en cas d'erreur
    results.forEach((result, index) => {
      if (result.error && uploadingFiles.value[index]) {
        uploadingFiles.value[index].status = 'error'
      }
    })
    uploadProgress.value = computeGlobalProgress()

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
      emit('uploaded', successes.map((r) => r.data))

      selectedFiles.value.forEach((item) => {
        if (item.preview) URL.revokeObjectURL(item.preview)
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
    }, 1200)
  }
}

const triggerFileInput = () => fileInputRef.value?.click()

const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

const statusConfig = {
  waiting:  { label: 'En attente',   icon: 'lucide:clock',       class: 'text-muted' },
  resizing: { label: 'Compression',  icon: 'lucide:loader',      class: 'text-orange-500 animate-spin' },
  pending:  { label: 'Prêt',         icon: 'lucide:check-circle',class: 'text-blue-400' },
  uploading:{ label: 'Envoi...',     icon: 'lucide:upload',      class: 'text-primary' },
  done:     { label: 'Terminé',      icon: 'lucide:check-circle',class: 'text-green-500' },
  error:    { label: 'Erreur',       icon: 'lucide:x-circle',    class: 'text-red-500' }
}
</script>

<template>
  <div class="space-y-4">
    <!-- Zone de drop (visible uniquement si pas en cours d'upload) -->
    <div
      v-if="!isUploading"
      class="border-primary-400 hover:border-primary-700 cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors"
      @click="triggerFileInput"
      @dragover.prevent
      @dragenter.prevent
      @drop="handleFileDrop">
      <input ref="fileInputRef" type="file" accept="image/*" multiple class="hidden" @change="handleFileSelect" />
      <div class="space-y-2">
        <Icon name="lucide:upload-cloud" size="44" class="text-primary-700 mx-auto" />
        <p class="text-primary-700 text-sm font-medium">Glisser-déposer des photos ici</p>
        <p class="text-primary-500 mt-1 text-xs">ou cliquez pour sélectionner</p>
        <p class="text-primary-500 mt-1 text-xs">Formats acceptés : JPG, PNG, WEBP, GIF (max 50 MB)</p>
      </div>
    </div>

    <!-- Bloc de progression (visible pendant l'upload) -->
    <div v-if="isUploading" class="space-y-3">
      <!-- En-tête avec cercle global -->
      <div class="bg-muted/30 flex items-center gap-4 rounded-lg p-4">
        <!-- Cercle SVG -->
        <div class="relative h-16 w-16 shrink-0">
          <svg class="h-16 w-16 -rotate-90 transform" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" stroke-width="10" class="text-muted" />
            <circle
              cx="60" cy="60" r="50"
              fill="none" stroke="currentColor" stroke-width="10" stroke-linecap="round"
              :stroke-dasharray="2 * Math.PI * 50"
              :stroke-dashoffset="2 * Math.PI * 50 * (1 - uploadProgress / 100)"
              class="text-primary transition-all duration-300" />
          </svg>
          <div class="absolute inset-0 flex items-center justify-center">
            <span class="text-xs font-semibold">{{ uploadProgress }}%</span>
          </div>
        </div>
        <!-- Infos textuelles -->
        <div class="min-w-0 flex-1">
          <div class="text-sm font-semibold">{{ uploadedCount }} / {{ totalPhotos }} photos</div>
          <div class="text-muted mt-0.5 text-xs">{{ phaseLabel }}</div>
        </div>
      </div>

      <!-- Liste des fichiers avec statut par phase -->
      <div class="max-h-64 space-y-1.5 overflow-y-auto pr-1">
        <div
          v-for="(file, index) in uploadingFiles"
          :key="index"
          class="bg-muted/40 flex items-center gap-3 rounded-lg p-2">
          <!-- Miniature -->
          <img
            v-if="file.preview"
            :src="file.preview"
            :alt="file.name"
            class="h-10 w-10 shrink-0 rounded object-cover" />
          <div v-else class="bg-muted h-10 w-10 shrink-0 rounded" />

          <!-- Infos fichier -->
          <div class="min-w-0 flex-1 space-y-1">
            <div class="flex items-center justify-between gap-2">
              <span class="truncate text-xs font-medium">{{ file.name }}</span>
              <!-- Statut -->
              <div class="flex shrink-0 items-center gap-1">
                <Icon
                  :name="statusConfig[file.status]?.icon || 'lucide:clock'"
                  size="13"
                  :class="statusConfig[file.status]?.class || 'text-muted'" />
                <span class="text-muted text-xs">{{ statusConfig[file.status]?.label }}</span>
              </div>
            </div>

            <!-- Taille originale → compressée -->
            <div class="text-muted text-xs">
              <span>{{ formatFileSize(file.size) }}</span>
              <template v-if="file.compressedSize">
                <span class="mx-1">→</span>
                <span class="text-green-500">{{ formatFileSize(file.compressedSize) }}</span>
                <span class="ml-1 text-green-500">
                  (−{{ Math.round((1 - file.compressedSize / file.size) * 100) }}%)
                </span>
              </template>
            </div>

            <!-- Barre de progression (uniquement pendant l'upload) -->
            <div v-if="file.status === 'uploading'" class="bg-elevated h-1 w-full overflow-hidden rounded-full">
              <div
                class="bg-primary h-1 rounded-full transition-all duration-150"
                :style="{ width: `${file.progress}%` }" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Liste des fichiers sélectionnés en attente -->
    <div v-if="!isUploading && selectedFiles.length > 0" class="space-y-2">
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
      <AppButtonValidated theme="primary" block size="lg" @click="uploadFiles" :disabled="isUploading">
        <template #default>
          <Icon name="lucide:upload" size="16" class="mr-2" />
          <span>Envoyer {{ selectedFiles.length }} photo(s)</span>
        </template>
      </AppButtonValidated>
    </div>
  </div>
</template>
