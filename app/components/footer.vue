<script setup>
const showLegalModal = ref(false)
</script>
<template>
  <div class="h-full w-full">
    <div class="text-primary-600 z-40 flex h-full w-full items-center justify-between px-6 text-sm print:hidden">
      <p class="hidden lg:block">Copyright © 2026 - Tous droits réservés</p>

      <p class="mx-auto cursor-pointer lg:mx-0" @click="showLegalModal = true">Mentions légales</p>
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
