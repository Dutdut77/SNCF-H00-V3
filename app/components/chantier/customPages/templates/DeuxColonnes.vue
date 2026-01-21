<!--
  Template : Deux Colonnes
  Affiche deux colonnes de contenu côte à côte
-->
<script setup>
const props = defineProps({
  content: {
    type: Object,
    required: true,
    default: () => ({
      titre: '',
      colonne1_titre: '',
      colonne1_texte: '',
      colonne1_image: '',
      colonne2_titre: '',
      colonne2_texte: '',
      colonne2_image: '',
      afficher_separateur: true
    })
  }
})

const { getSignedPhotoUrl } = usePhotos()

// URLs signées pour l'affichage des images
const imageUrls = ref({
  colonne1: '',
  colonne2: ''
})
const isLoadingImages = ref({
  colonne1: false,
  colonne2: false
})

// Extraire le chemin de storage d'une URL Supabase
const extractStoragePath = (url) => {
  const match = url.match(/\/storage\/v1\/object\/public\/photos\/(.+)$/)
  return match ? match[1] : null
}

// Charger l'URL signée d'une image
const loadImageUrl = async (storagePath, key) => {
  if (!storagePath) {
    imageUrls.value[key] = ''
    return
  }

  isLoadingImages.value[key] = true
  
  try {
    let pathToSign = storagePath
    
    // Si c'est une ancienne URL complète, extraire le chemin
    if (storagePath.startsWith('http')) {
      const extractedPath = extractStoragePath(storagePath)
      if (extractedPath) {
        pathToSign = extractedPath
      } else {
        // URL externe non-Supabase, l'utiliser directement
        imageUrls.value[key] = storagePath
        return
      }
    }
    
    // Obtenir une URL signée
    const url = await getSignedPhotoUrl(pathToSign, 3600)
    imageUrls.value[key] = url || ''
  } catch (error) {
    console.error(`[DeuxColonnes] Error loading image URL for ${key}:`, error)
    imageUrls.value[key] = ''
  } finally {
    isLoadingImages.value[key] = false
  }
}

// Charger les URLs au montage
onMounted(() => {
  loadImageUrl(props.content.colonne1_image, 'colonne1')
  loadImageUrl(props.content.colonne2_image, 'colonne2')
})

// Recharger quand le contenu change
watch(
  () => props.content.colonne1_image,
  (newVal) => loadImageUrl(newVal, 'colonne1')
)

watch(
  () => props.content.colonne2_image,
  (newVal) => loadImageUrl(newVal, 'colonne2')
)

// Computed pour vérifier si les colonnes ont du contenu
const colonne1HasContent = computed(
  () => props.content.colonne1_titre || props.content.colonne1_texte || props.content.colonne1_image
)

const colonne2HasContent = computed(
  () => props.content.colonne2_titre || props.content.colonne2_texte || props.content.colonne2_image
)
</script>

<template>
  <div class="custom-page-deux-colonnes">
    <!-- Titre principal -->
    <h2 v-if="content.titre" class="mb-8 text-2xl font-bold text-gray-800 dark:text-white">
      {{ content.titre }}
    </h2>

    <!-- Conteneur des deux colonnes -->
    <div class="flex flex-col gap-8 lg:flex-row lg:gap-12">
      <!-- Colonne gauche -->
      <div
        class="flex-1"
        :class="{
          'lg:border-r lg:border-gray-200 lg:pr-12 dark:lg:border-gray-700':
            content.afficher_separateur && colonne2HasContent
        }">
        <!-- Titre colonne -->
        <h3
          v-if="content.colonne1_titre"
          class="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-700 dark:text-gray-200">
          <span class="bg-primary-500 h-1 w-8 rounded-full"></span>
          {{ content.colonne1_titre }}
        </h3>

        <!-- Image colonne -->
        <div v-if="content.colonne1_image" class="mb-4 overflow-hidden rounded-lg shadow-md">
          <!-- Loader -->
          <div v-if="isLoadingImages.colonne1" class="flex aspect-video w-full items-center justify-center bg-gray-100 dark:bg-gray-700">
            <Icon name="lucide:loader-2" size="32" class="animate-spin text-gray-400" />
          </div>
          <!-- Image -->
          <img
            v-else-if="imageUrls.colonne1"
            :src="imageUrls.colonne1"
            :alt="content.colonne1_titre || 'Image colonne gauche'"
            class="h-auto w-full object-cover"
            loading="lazy" />
          <!-- Placeholder -->
          <div v-else class="flex aspect-video w-full items-center justify-center bg-gray-100 dark:bg-gray-700">
            <Icon name="lucide:image-off" size="32" class="text-gray-400" />
          </div>
        </div>

        <!-- Texte colonne -->
        <div
          v-if="content.colonne1_texte"
          class="prose prose-slate dark:prose-invert max-w-none"
          v-html="content.colonne1_texte" />

        <!-- Message si vide -->
        <p v-if="!colonne1HasContent" class="text-gray-400 italic dark:text-gray-500">Colonne gauche vide.</p>
      </div>

      <!-- Colonne droite -->
      <div class="flex-1">
        <!-- Titre colonne -->
        <h3
          v-if="content.colonne2_titre"
          class="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-700 dark:text-gray-200">
          <span class="bg-secondary-500 h-1 w-8 rounded-full"></span>
          {{ content.colonne2_titre }}
        </h3>

        <!-- Image colonne -->
        <div v-if="content.colonne2_image" class="mb-4 overflow-hidden rounded-lg shadow-md">
          <!-- Loader -->
          <div v-if="isLoadingImages.colonne2" class="flex aspect-video w-full items-center justify-center bg-gray-100 dark:bg-gray-700">
            <Icon name="lucide:loader-2" size="32" class="animate-spin text-gray-400" />
          </div>
          <!-- Image -->
          <img
            v-else-if="imageUrls.colonne2"
            :src="imageUrls.colonne2"
            :alt="content.colonne2_titre || 'Image colonne droite'"
            class="h-auto w-full object-cover"
            loading="lazy" />
          <!-- Placeholder -->
          <div v-else class="flex aspect-video w-full items-center justify-center bg-gray-100 dark:bg-gray-700">
            <Icon name="lucide:image-off" size="32" class="text-gray-400" />
          </div>
        </div>

        <!-- Texte colonne -->
        <div
          v-if="content.colonne2_texte"
          class="prose prose-slate dark:prose-invert max-w-none"
          v-html="content.colonne2_texte" />

        <!-- Message si vide -->
        <p v-if="!colonne2HasContent" class="text-gray-400 italic dark:text-gray-500">Colonne droite vide.</p>
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
