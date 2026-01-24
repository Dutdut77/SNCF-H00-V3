<!--
  Template : Paysage Vertical
  Format A4 paysage optimisé pour l'impression
  - Titre en haut
  - Zone de textes riches (flex horizontal)
  - Zone d'images (flex-1)
-->
<script setup>
const props = defineProps({
  content: {
    type: Object,
    required: true,
    default: () => ({
      titre: '',
      textes: [],
      images: []
    })
  }
})

const { getSignedPhotoUrl } = usePhotos()

// URLs signées pour l'affichage des images
const imageUrls = ref([])
const isLoadingImages = ref(false)

// Vérifie si une URL est déjà signée (contient un token ou /sign/)
const isSignedUrl = (url) => {
  if (!url || !url.startsWith('http')) return false
  return url.includes('/sign/') || url.includes('token=')
}

// Extraire le chemin de storage d'une URL Supabase publique
const extractStoragePath = (url) => {
  const match = url.match(/\/storage\/v1\/object\/public\/photos\/(.+)$/)
  return match ? match[1] : null
}

// Charger les URLs signées des images
const loadImageUrls = async () => {
  const images = props.content.images || []
  if (!images.length) {
    imageUrls.value = []
    return
  }

  isLoadingImages.value = true
  const urls = []

  try {
    for (const storagePath of images) {
      if (!storagePath) continue

      // Si c'est déjà une URL signée, l'utiliser directement
      if (isSignedUrl(storagePath)) {
        urls.push(storagePath)
        continue
      }

      let pathToSign = storagePath

      // Si c'est une URL publique Supabase, extraire le chemin
      if (storagePath.startsWith('http')) {
        const extractedPath = extractStoragePath(storagePath)
        if (extractedPath) {
          pathToSign = extractedPath
        } else {
          // URL externe non-Supabase, l'utiliser directement
          urls.push(storagePath)
          continue
        }
      }

      // Obtenir une URL signée
      const url = await getSignedPhotoUrl(pathToSign, 3600)
      if (url) urls.push(url)
    }

    imageUrls.value = urls
  } catch (error) {
    console.error('[PaysageVerticalReverse] Error loading image URLs:', error)
    imageUrls.value = []
  } finally {
    isLoadingImages.value = false
  }
}

// Charger les URLs au montage et quand le contenu change
onMounted(() => {
  loadImageUrls()
})

watch(
  () => props.content.images,
  () => loadImageUrls(),
  { immediate: false, deep: true }
)

// Computed pour les textes filtrés (non vides)
const filteredTextes = computed(() => {
  return (props.content.textes || []).filter(t => t && t.trim())
})

// Computed pour vérifier la présence de contenu
const hasTextes = computed(() => filteredTextes.value.length > 0)
const hasImages = computed(() => imageUrls.value.length > 0)
</script>

<template>
  <div class="w-full print:break-after-page">
    <!-- Container avec dimensions A4 paysage -->
    <div 
      class="flex flex-col bg-white dark:bg-gray-900 w-full min-h-[210mm]  box-border print:w-[297mm] print:h-[210mm] print:min-h-[210mm] print:max-h-[210mm]  print:break-inside-avoid print:overflow-hidden"
    >
      <!-- Titre principal -->
      <header v-if="content.titre" class="mb-6 shrink-0">
        <h1 
          class="text-2xl font-bold text-gray-900 dark:text-white tracking-tight font-[Inter,system-ui,sans-serif] print:text-xl print:text-gray-900"
        >
          {{ content.titre }}
        </h1>
        <div 
          class="mt-2 h-1 w-24 rounded-full bg-linear-to-r from-primary-500 to-primary-300 print:bg-blue-500 print:h-[3px]"
        />
      </header>
            <!-- Zone d'images (flex-1) -->
            <section class="flex flex-1 flex-col min-h-0">
        <!-- Loader pendant le chargement -->
        <div 
          v-if="isLoadingImages" 
          class="flex flex-1 flex-col items-center justify-center gap-2"
        >
          <Icon name="lucide:loader-2" size="32" class="animate-spin text-gray-400" />
          <span class="text-sm text-gray-500">Chargement des images...</span>
        </div>

        <!-- Grille d'images -->
        <div 
          v-else-if="hasImages" 
          class="grid h-full gap-4 print:gap-3"
          :class="{
            'grid-cols-1': imageUrls.length === 1,
            'grid-cols-2': imageUrls.length === 2,
            'grid-cols-3': imageUrls.length >= 3
          }"
        >
          <figure 
            v-for="(url, index) in imageUrls" 
            :key="index"
            class="relative overflow-hidden rounded-lg shadow-md min-h-0 print:shadow-none print:border print:border-gray-300"
          >
            <img 
              :src="url"
              :alt="`Image ${index + 1}`"
              class="h-full w-full object-cover"
              loading="lazy"
            />
          </figure>
        </div>

        <!-- Placeholder si pas d'images -->
        <div 
          v-else
          class="flex flex-1 flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700"
        >
          <Icon name="lucide:image" size="48" class="text-gray-300 dark:text-gray-600" />
          <p class="text-sm text-gray-400 dark:text-gray-500">Aucune image</p>
        </div>
      </section>

      <!-- Zone de textes (flex horizontal) -->
      <section v-if="hasTextes" class="mb-6 shrink-0">
        <div class="flex gap-6">
          <article 
            v-for="(texte, index) in filteredTextes" 
            :key="index"
            class="flex-1 min-w-0 rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50 print:bg-white print:p-3 print:border print:border-gray-200"
          >
            <div 
              class="prose prose-slate dark:prose-invert prose-sm max-w-none 
                     [&_ul]:list-disc [&_ul]:pl-5 
                     [&_ol]:list-decimal [&_ol]:pl-5 
                     [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1.5 
                     [&_p]:mb-2 
                     [&_a]:text-primary-600 [&_a]:underline 
                     [&_blockquote]:border-l-[3px] [&_blockquote]:border-primary-500 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-gray-500
                     print:text-sm print:text-gray-700"
              v-html="texte"
            />
          </article>
        </div>
      </section>

      <!-- Zone d'images (flex-1) -->
      <section class="flex flex-1 flex-col min-h-0">
        <!-- Loader pendant le chargement -->
        <div 
          v-if="isLoadingImages" 
          class="flex flex-1 flex-col items-center justify-center gap-2"
        >
          <Icon name="lucide:loader-2" size="32" class="animate-spin text-gray-400" />
          <span class="text-sm text-gray-500">Chargement des images...</span>
        </div>

        <!-- Grille d'images -->
        <div 
          v-else-if="hasImages" 
          class="grid h-full gap-4 print:gap-3"
          :class="{
            'grid-cols-1': imageUrls.length === 1,
            'grid-cols-2': imageUrls.length === 2,
            'grid-cols-3': imageUrls.length >= 3
          }"
        >
          <figure 
            v-for="(url, index) in imageUrls" 
            :key="index"
            class="relative overflow-hidden rounded-lg shadow-md min-h-0 print:shadow-none print:border print:border-gray-300"
          >
            <img 
              :src="url"
              :alt="`Image ${index + 1}`"
              class="h-full w-full object-cover"
              loading="lazy"
            />
          </figure>
        </div>

        <!-- Placeholder si pas d'images -->
        <div 
          v-else
          class="flex flex-1 flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700"
        >
          <Icon name="lucide:image" size="48" class="text-gray-300 dark:text-gray-600" />
          <p class="text-sm text-gray-400 dark:text-gray-500">Aucune image</p>
        </div>
      </section>
    </div>
  </div>
</template>
