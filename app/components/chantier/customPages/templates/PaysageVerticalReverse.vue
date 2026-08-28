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
  },

})

// URLs signées des images (rechargées quand le contenu change)
const { imageUrls, isLoadingImages } = useCustomPageImages(() => props.content?.content?.images)

// Computed pour les textes filtrés (non vides)
const filteredTextes = computed(() => {
  return (props.content.content.textes || []).filter(t => t && t.trim())
})

// Computed pour vérifier la présence de contenu
const hasTextes = computed(() => filteredTextes.value.length > 0)
const hasImages = computed(() => imageUrls.value.length > 0)
</script>

<template>

  <div class="print-page flex flex-col gap-4 w-full h-full overflow-hidden ">

    <div class="hidden print:flex items-center gap-3">
      <div class="bg-secondary-500/80 text-secondary-50 flex h-10 w-10 items-center justify-center rounded-xl">
        <Icon name="lucide:file-text" size="20" />
      </div>
      <div>
        <h2 class="text-primary-800 text-lg font-bold">{{ props.content.navBarTitle }} </h2>


      </div>

    </div>



    <!-- IMAGES -->
    <section class="flex flex-col h-full items-center justify-center overflow-hidden ">

      <div v-if="isLoadingImages" class="flex flex-1 flex-col items-center justify-center gap-2">
        <Icon name="lucide:loader-2" size="32" class="animate-spin text-gray-400" />
        <span class="text-sm text-gray-500">Chargement des images...</span>
      </div>


      <div v-else-if="hasImages" class="flex h-full w-full gap-3 print:gap-2  overflow-hidden  " :class="{

      }">
        <div v-for="(url, index) in imageUrls" :key="index"
          class="flex items-center justify-center overflow-hidden rounded-lg w-full  h-full   print:bg-white ">
          <img :src="url" :alt="`Image ${index + 1}`" class="" loading="lazy" />
        </div>
      </div>


      <div v-else
        class="flex flex-1 flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700">
        <Icon name="lucide:image" size="48" class="text-gray-300 dark:text-gray-600" />
        <p class="text-sm text-gray-400 dark:text-gray-500">Aucune image</p>
      </div>
    </section>

    <!-- TEXTES -->
    <div class="flex gap-4">
      <article v-for="(texte, index) in filteredTextes" :key="index"
        class="flex-1 min-w-0 rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50 print:bg-white print:p-2 print:border print:border-gray-200">
        <div class="prose prose-slate dark:prose-invert prose-sm max-w-none 
                     [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:my-1
                     [&_ol]:list-decimal [&_ol]:pl-4 [&_ol]:my-1
                     [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1 
                     [&_p]:mb-1 [&_p]:leading-snug
                     [&_a]:text-primary-600 [&_a]:underline 
                     [&_blockquote]:border-l-2 [&_blockquote]:border-primary-500 [&_blockquote]:pl-2 [&_blockquote]:italic [&_blockquote]:text-gray-500
                     print:text-sm print:text-gray-700" v-html="texte" />
      </article>
    </div>

  </div>


</template>

<style scoped>
@media print {
  .print-page {
    height: 100vh;
    /* 1 page exactement */
    break-inside: avoid;
  }
}
</style>