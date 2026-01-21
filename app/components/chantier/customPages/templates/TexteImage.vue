<!--
  Template : Texte & Image
  Affiche une zone de texte avec une image sur le côté
-->
<script setup>
const props = defineProps({
  content: {
    type: Object,
    required: true,
    default: () => ({
      titre: '',
      texte: '',
      image_url: '',
      image_legende: '',
      image_position: 'right'
    })
  }
})

const { getSignedPhotoUrl } = usePhotos()

// URL signée pour l'affichage
const imageUrl = ref('')
const isLoadingImage = ref(false)

// Extraire le chemin de storage d'une URL Supabase
const extractStoragePath = (url) => {
  // Pattern pour extraire le chemin après /storage/v1/object/public/photos/
  const match = url.match(/\/storage\/v1\/object\/public\/photos\/(.+)$/)
  return match ? match[1] : null
}

// Charger l'URL signée de l'image
const loadImageUrl = async () => {
  const storagePath = props.content.image_url
  if (!storagePath) {
    imageUrl.value = ''
    return
  }

  isLoadingImage.value = true
  
  try {
    let pathToSign = storagePath
    
    // Si c'est une ancienne URL complète, extraire le chemin
    if (storagePath.startsWith('http')) {
      const extractedPath = extractStoragePath(storagePath)
      if (extractedPath) {
        pathToSign = extractedPath
      } else {
        // URL externe non-Supabase, l'utiliser directement
        imageUrl.value = storagePath
        return
      }
    }
    
    // Obtenir une URL signée
    const url = await getSignedPhotoUrl(pathToSign, 3600)
    imageUrl.value = url || ''
  } catch (error) {
    console.error('[TexteImage] Error loading image URL:', error)
    imageUrl.value = ''
  } finally {
    isLoadingImage.value = false
  }
}

// Charger l'URL au montage et quand le contenu change
onMounted(() => {
  loadImageUrl()
})

watch(
  () => props.content.image_url,
  () => loadImageUrl(),
  { immediate: false }
)

// Computed pour vérifier si l'image est présente
const hasImage = computed(() => !!props.content.image_url)
const isImageLeft = computed(() => props.content.image_position === 'left')
</script>

<template>
  <div class="custom-page-texte-image">
    <!-- Titre principal -->
    <h2 
      v-if="content.titre"
      class="mb-6 text-2xl font-bold text-gray-800 dark:text-white"
    >
      {{ content.titre }}
    </h2>

    <!-- Conteneur flex avec gestion de la position de l'image -->
    <div 
      class="flex flex-col gap-8 lg:flex-row"
      :class="{ 'lg:flex-row-reverse': isImageLeft }"
    >
      <!-- Zone de texte -->
      <div 
        class="flex-1"
        :class="{ 'lg:w-1/2': hasImage }"
      >
        <div 
          v-if="content.texte"
          class="prose prose-slate dark:prose-invert max-w-none"
          v-html="content.texte"
        />
        <p 
          v-else
          class="italic text-gray-400 dark:text-gray-500"
        >
          Aucun contenu texte renseigné.
        </p>
      </div>

      <!-- Zone image -->
      <div 
        v-if="hasImage"
        class="flex flex-col items-center lg:w-1/2"
      >
        <div class="relative w-full overflow-hidden rounded-xl shadow-lg">
          <!-- Loader pendant le chargement de l'URL -->
          <div 
            v-if="isLoadingImage" 
            class="flex aspect-video w-full items-center justify-center bg-gray-100 dark:bg-gray-700"
          >
            <Icon name="lucide:loader-2" size="32" class="animate-spin text-gray-400" />
          </div>
          
          <!-- Image avec URL signée -->
          <img 
            v-else-if="imageUrl"
            :src="imageUrl"
            :alt="content.image_legende || content.titre || 'Image'"
            class="h-auto w-full object-cover transition-transform duration-300 hover:scale-105"
            loading="lazy"
          />
          
          <!-- Placeholder si pas d'URL -->
          <div 
            v-else
            class="flex aspect-video w-full items-center justify-center bg-gray-100 dark:bg-gray-700"
          >
            <Icon name="lucide:image-off" size="32" class="text-gray-400" />
          </div>
          
          <!-- Overlay gradient pour la légende -->
          <div 
            v-if="content.image_legende"
            class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-12"
          >
            <p class="text-sm text-white">
              {{ content.image_legende }}
            </p>
          </div>
        </div>
        
        <!-- Légende alternative (si pas d'overlay) -->
        <p 
          v-if="content.image_legende && false"
          class="mt-2 text-center text-sm text-gray-500 dark:text-gray-400"
        >
          {{ content.image_legende }}
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Styles additionnels pour le rendu du HTML riche */
.prose :deep(ul) {
  list-style-type: disc;
  padding-left: 1.5rem;
}

.prose :deep(ol) {
  list-style-type: decimal;
  padding-left: 1.5rem;
}

.prose :deep(h3) {
  font-size: 1.125rem;
  font-weight: 600;
  color: #374151;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}

:deep(.dark) .prose :deep(h3) {
  color: #e5e7eb;
}

.prose :deep(a) {
  color: var(--color-primary-600);
  text-decoration: underline;
}

.prose :deep(a:hover) {
  color: var(--color-primary-700);
}

.prose :deep(blockquote) {
  border-left: 4px solid var(--color-primary-500);
  padding-left: 1rem;
  font-style: italic;
  color: #4b5563;
}

:deep(.dark) .prose :deep(blockquote) {
  color: #d1d5db;
}
</style>

