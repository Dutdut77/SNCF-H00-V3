<script setup>
const showLegalModal = ref(false)
</script>
<template>
  <div class="text-primary-600 z-40 flex h-full w-full items-center justify-between px-6 text-sm print:hidden">
    <p class="hidden lg:block">Copyright © 2024 - Tous droits réservés</p>

    <p class="mx-auto lg:mx-0 cursor-pointer" @click="showLegalModal = true">Mentions légales</p>



  </div>

  <AppModal v-model="showLegalModal" size="5xl">
    <template #header>
      <p class="text-sm font-semibold text-slate-700">Mentions légales
      </p>
    </template>
    <template #default>
      <LegalMentions />
    </template>
  </AppModal>



</template>
