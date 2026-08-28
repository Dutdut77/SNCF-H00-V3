<!--
  PageRenderer - Renderer global des annexes de chantier
  
  Ce component :
  - Reçoit une page (avec template_key et content)
  - Charge dynamiquement le template Vue correspondant
  - Passe le contenu au template
-->
<script setup>
import { getTemplateComponent } from './index'

const props = defineProps({
  // La page à afficher
  page: {
    type: Object,
    required: true
  },
  // Le chantier (pour contexte)
  chantier: {
    type: Object,
    default: null
  },
  // Mode édition (pour afficher les contrôles)
  editable: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['edit', 'delete'])

// Récupère le component Vue du template
const templateComponent = computed(() => {
  if (!props.page?.template_key) return null
  return getTemplateComponent(props.page.template_key)
})



// Vérifie si le template existe
const templateExists = computed(() => !!templateComponent.value)
</script>

<template>
  <div class="flex flex-col gap-4 h-full overflow-hidden p-4 w-full">
    <!-- Header avec actions en mode éditable -->
    <div v-if="editable" class="mb-6 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="bg-secondary-500/80 text-secondary-50 flex h-10 w-10 items-center justify-center rounded-xl">
          <Icon name="lucide:file-text" size="20" />
        </div>
        <div>
          <h2 class="text-primary-800 text-lg font-bold">{{ page.navBarTitle }} </h2>


        </div>
      </div>

      <div class="flex items-center gap-2">
        <button type="button"
          class="bg-primary-50 text-primary-700 hover:bg-primary-100 dark:bg-primary-900/30 dark:text-primary-400 dark:hover:bg-primary-900/50 flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition"
          @click="emit('edit', page)">
          <Icon name="lucide:pencil" size="16" />
          Modifier
        </button>

        <button type="button"
          class="flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
          @click="emit('delete', page)">
          <Icon name="lucide:trash-2" size="16" />
          Supprimer
        </button>
      </div>
    </div>

    <!-- Rendu du template -->
    <div v-if="templateExists"
      class="flex rounded-xl bg-white p-4 shadow-sm ring-1 overflow-hidden ring-gray-100 dark:bg-gray-800 dark:ring-gray-700 h-full ">
      <component :is="templateComponent" :content="page || {}" />
    </div>

    <!-- Message d'erreur si template non trouvé -->
    <div v-else
      class="flex flex-col items-center justify-center rounded-xl bg-amber-50 p-8 text-center dark:bg-amber-900/20">
      <Icon name="lucide:alert-triangle" size="48" class="mb-4 text-amber-500" />
      <h3 class="text-lg font-semibold text-amber-700 dark:text-amber-400">Template non trouvé</h3>
      <p class="mt-1 text-sm text-amber-600 dark:text-amber-300">
        Le template "{{ page.template_key }}" n'existe pas ou a été supprimé.
      </p>
    </div>
  </div>
</template>

<style scoped></style>
