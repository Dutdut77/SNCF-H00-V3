<!--
  Template : Paysage Deux Colonnes
  Format A4 paysage optimisé pour l'impression
  - Partie gauche : Titre + Texte
  - Partie droite : Images
-->
<script setup>
const props = defineProps({
  content: {
    type: Object,
    required: true,
    default: () => ({
      titre: '',
      texte: '',
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
    console.error('[PaysageColonnes] Error loading image URLs:', error)
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

// Computed pour vérifier la présence de contenu
const hasTexte = computed(() => !!props.content.texte?.trim())
const hasImages = computed(() => imageUrls.value.length > 0)

// Nombre d'images pour adapter la grille
const imageCount = computed(() => imageUrls.value.length)
</script>

<template>
  <div class="w-full print:break-after-page">
    <!-- Container avec dimensions A4 paysage -->
    <div 
      class="flex flex-col bg-white dark:bg-gray-900 w-full min-h-[210mm]  box-border print:w-[297mm] print:h-[210mm] print:min-h-[210mm] print:max-h-[210mm]  print:break-inside-avoid print:overflow-hidden"
    >
      <!-- Layout deux colonnes -->
      <div class="flex h-full flex-1 gap-8 print:gap-6">
        <!-- Colonne gauche : Titre + Texte -->
        <aside class="flex flex-col w-[40%] min-w-0 print:w-[38%]">
          <!-- Titre principal -->
          <header v-if="content.titre" class="mb-6 shrink-0">
            <h1 
              class="text-2xl font-bold text-gray-900 dark:text-white tracking-tight leading-tight font-[Inter,system-ui,sans-serif] print:text-xl print:text-gray-900"
            >
              {{ content.titre }}
            </h1>
            <div 
              class="mt-3 h-1 w-16 rounded-full bg-linear-to-r from-primary-500 to-primary-300 print:bg-blue-500 print:h-[3px]"
            />
          </header>

          <!-- Contenu texte -->
          <div class="flex-1 overflow-hidden">
            <div 
              v-if="hasTexte"
              class="prose prose-slate dark:prose-invert prose-sm max-w-none 
                     [&_ul]:list-disc [&_ul]:pl-5 
                     [&_ol]:list-decimal [&_ol]:pl-5 
                     [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1.5 
                     [&_p]:mb-2 
                     [&_a]:text-primary-600 [&_a]:underline 
                     [&_blockquote]:border-l-[3px] [&_blockquote]:border-primary-500 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-gray-500
                     print:text-sm print:text-gray-700"
              v-html="content.texte"
            />
            <p 
              v-else
              class="text-sm italic text-gray-400 dark:text-gray-500"
            >
              Aucun contenu texte renseigné.
            </p>
          </div>
        </aside>

        <!-- Séparateur vertical -->
        <div 
          class="shrink-0 w-px bg-linear-to-b from-transparent via-gray-200 to-transparent dark:via-gray-700 print:via-gray-300"
        />

        <!-- Colonne droite : Images -->
        <main class="flex flex-1 flex-col min-w-0">
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
            class="flex h-full gap-4 print:gap-3"
            :class="{
              'flex-col justify-center': imageCount === 1,
              'flex-row': imageCount === 2,
              'flex-row flex-wrap content-start': imageCount >= 3
            }"
          >
            <figure 
              v-for="(url, index) in imageUrls" 
              :key="index"
              class="relative overflow-hidden rounded-xl shadow-lg print:rounded-lg print:shadow-none print:border print:border-gray-300"
              :class="{
                'w-full max-h-full': imageCount === 1,
                'flex-1 min-h-0': imageCount === 2,
                'w-[calc(50%-0.5rem)] aspect-[4/3] print:w-[calc(50%-0.375rem)]': imageCount >= 3
              }"
            >
              <img 
                :src="url"
                :alt="`Image ${index + 1}`"
                class="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.02] print:hover:scale-100"
                loading="lazy"
              />
            </figure>
          </div>

          <!-- Placeholder si pas d'images -->
          <div 
            v-else
            class="flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700"
          >
            <Icon name="lucide:image" size="64" class="text-gray-300 dark:text-gray-600" />
            <p class="text-gray-400 dark:text-gray-500">Aucune image</p>
          </div>
        </main>
      </div>
    </div>
  </div>
</template>
