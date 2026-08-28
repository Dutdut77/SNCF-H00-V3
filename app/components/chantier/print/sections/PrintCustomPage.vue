<script setup>
import { getTemplateComponent } from '~/components/chantier/customPages/index'

defineProps({
  pageData: {
    type: Object,
    required: true
  },
  chantier: {
    type: Object,
    required: true
  }
})
</script>

<template>
  <div class="flex flex-col gap-4 mt-8">
    <div class="flex items-center gap-3 print:hidden">
      <div class="bg-secondary-500/80 text-secondary-50 flex h-10 w-10 items-center justify-center rounded-xl">
        <Icon name="lucide:paperclip" size="20" />
      </div>
      <div>
        <h2 class="text-primary-800 text-lg font-bold">{{ pageData.navBarTitle }} </h2>


      </div>
    </div>

    <component :is="getTemplateComponent(pageData.template_key)" v-if="getTemplateComponent(pageData.template_key)"
      :content="pageData || {}" :chantier="chantier" />
    <div v-else class="mb-8 w-full rounded-lg bg-amber-50 p-4 text-center">
      <p class="text-sm text-amber-600">Template non trouvé pour cette annexe</p>
    </div>

  </div>

</template>
