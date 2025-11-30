<script setup>
const props = defineProps({
  chantier: {
    type: Object,
    required: true
  }
});
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-[Pacifico] text-gray-700 dark:text-white">
      Commentaires - SES
    </h1>
    
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div class="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-500">
        <Icon name="lucide:zap" size="48" class="mb-4 opacity-50" />
        <p class="text-lg font-medium">Commentaires SES à venir</p>
        <p class="text-sm">Cette section sera bientôt disponible</p>
      </div>
    </div>
  </div>
</template>

