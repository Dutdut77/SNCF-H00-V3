<script setup>
const showLegalModal = ref(false)
const { showUpdateModal } = useUpdate()
const { nomEntite } = useApplication()

// Page avec panneau pétrole (AppPageLayout petrol) : le pied de page le prolonge jusqu'en bas
const petrolPanels = useState('petrol-panels', () => 0)
const hasPetrolPanel = computed(() => petrolPanels.value > 0)
</script>
<template>
  <div class="flex h-full w-full print:hidden">
    <div v-if="hasPetrolPanel" class="footer-petrol hidden h-full w-80 shrink-0 lg:block" aria-hidden="true"></div>
    <div class="text-primary-600 z-40 flex h-full min-w-0 flex-1 items-center px-6 text-sm">
      <div class="mx-auto flex items-center gap-4 lg:mr-0 lg:ml-auto">
        <p class="hidden lg:block">Copyright © 2026 — {{ nomEntite || 'H00 Travaux' }}</p>
        <span class="text-primary-300 hidden lg:inline">|</span>
        <p class="cursor-pointer transition-colors duration-200 hover:text-teal-700 dark:hover:text-teal-300" @click="showLegalModal = true">
          Mentions légales
        </p>
        <span class="text-primary-300">|</span>
        <p class="cursor-pointer transition-colors duration-200 hover:text-teal-700 dark:hover:text-teal-300" @click="showUpdateModal">
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

<style scoped>
/* Bas du panneau pétrole : même halo sarcelle que .panel-petrol, qui part du coin bas gauche */
.footer-petrol {
  background:
    linear-gradient(90deg, rgb(63 141 125 / 0.3), transparent 84%),
    var(--color-petrol-800);
}
.dark .footer-petrol {
  background:
    linear-gradient(90deg, rgb(63 141 125 / 0.22), transparent 84%),
    #082b31;
}
</style>
