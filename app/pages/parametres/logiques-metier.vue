<script setup>
definePageMeta({
  requiresAuth: true,
  layout: false,
})

useHead({
  title: 'H00 - Logiques métier',
})

const { isSuperAdmin } = useLevelUser()
const backLink = '/parametres'
</script>

<template>
  <div class="relative flex h-dvh w-full flex-col overflow-hidden bg-white dark:bg-gray-900">
    <!-- ── Contenu plein écran ─────────────────────────────────────────── -->
    <div v-if="!isSuperAdmin" class="flex h-full flex-col items-center justify-center gap-3 text-gray-400">
      <Icon name="lucide:lock" size="32" />
      <p class="text-sm">Accès restreint — super administrateur uniquement</p>
      <NuxtLink :to="backLink" class="text-sm text-blue-600 hover:underline">Retour aux paramètres</NuxtLink>
    </div>
    <ParametresAssistants v-else :back-link="backLink" />
  </div>
</template>
