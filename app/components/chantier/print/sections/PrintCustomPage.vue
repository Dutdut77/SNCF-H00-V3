<script setup>
import { getTemplateComponent } from '~/components/chantier/customPages/index'

const props = defineProps({
  pageData: {
    type: Object,
    required: true
  },
  chantier: {
    type: Object,
    required: true
  }
})

// Titre de la page (gère les deux propriétés possibles)
const pageTitle = computed(() => props.pageData?.navBarTitle || props.pageData?.name || 'Page personnalisée')
</script>

<template>
  <section class="mb-8 break-inside-avoid">
    <div class="mb-4 flex items-center gap-3 border-b border-gray-100 pb-2">
      <div class="bg-primary-600/20 text-primary-700 flex h-8 w-8 items-center justify-center rounded-lg">
        <Icon name="lucide:file-text" size="18" />
      </div>
      <h3 class="text-lg font-bold text-gray-700 uppercase">{{ pageTitle }}</h3>
    </div>

    <!-- Rendu du template de la page personnalisée -->
    <div class="page-content">
      <component
        :is="getTemplateComponent(pageData.template_key)"
        v-if="getTemplateComponent(pageData.template_key)"
        :content="pageData.content || {}"
        :chantier="chantier" />
      <div v-else class="rounded-lg bg-amber-50 p-4 text-center">
        <p class="text-sm text-amber-600">Template non trouvé pour cette page</p>
      </div>
    </div>
  </section>
</template>

