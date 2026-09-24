<script setup>
const showLegalModal = ref(false)
const { showUpdateModal } = useUpdate()
const { nomEntite } = useApplication()

// Page avec barre latérale V4 (AppPageLayout v4) : le pied de page la prolonge jusqu'en bas
const panneauxV4 = useState('panneaux-v4', () => 0)
const aPanneauV4 = computed(() => panneauxV4.value > 0)
</script>
<template>
  <div class="flex h-full w-full print:hidden">
    <!-- Bas de la barre latérale V4 : même fond et même filet -->
    <div
      v-if="aPanneauV4"
      class="bg-card border-rule hidden h-full w-80 shrink-0 border-r lg:block"
      aria-hidden="true"></div>
    <div class="text-primary-600 z-40 flex h-full min-w-0 flex-1 items-center px-6 text-sm">
      <div class="mx-auto flex items-center gap-4 lg:mr-0 lg:ml-auto">
        <p class="hidden lg:block">Copyright © 2026 — {{ nomEntite || 'H00 Travaux' }}</p>
        <span class="text-primary-300 hidden lg:inline">|</span>
        <p
          class="hover:text-secondary-700 dark:hover:text-secondary-300 cursor-pointer transition-colors duration-200"
          @click="showLegalModal = true">
          Mentions légales
        </p>
        <span class="text-primary-300">|</span>
        <p
          class="hover:text-secondary-700 dark:hover:text-secondary-300 cursor-pointer transition-colors duration-200"
          @click="showUpdateModal">
          Quoi de neuf ?
        </p>
      </div>
    </div>

    <AppModal v-model="showLegalModal" size="5xl">
      <template #header>
        <p class="text-sm font-semibold text-slate-700">Mentions légales</p>
      </template>
      <template #default>
        <LegalMentions />
      </template>
    </AppModal>
  </div>
</template>
