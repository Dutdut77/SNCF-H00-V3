<script setup>
const showLegalModal = ref(false)
const { showUpdateModal } = useUpdate()
</script>
<template>
  <div class="h-full w-full">
    <div class="text-primary-600 z-40 flex h-full w-full items-center justify-between px-6 text-sm print:hidden">
      <p class="hidden lg:block">Copyright © 2026 — UO Travaux</p>

      <div class="mx-auto flex items-center gap-4 lg:mx-0">
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
