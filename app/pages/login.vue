<script setup>
definePageMeta({
  requiresAuth: false,
  layout: false
})
useHead({
  title: 'H00 - Login',
  description: 'Page de connexion'
})

const redirectToAuth = () => {
  const currentUrl = new URL(window.location.href)
  const redirectUrl = currentUrl.searchParams.get('redirect') || '/'
  window.location.href = `/api/auth/login?redirect=${encodeURIComponent(redirectUrl)}`
}
</script>

<template>
  <div class="flex h-dvh w-full flex-col items-center justify-center">
    <div
      class="relative flex h-full w-full flex-col items-center bg-white pt-8 lg:justify-center lg:pt-0 dark:bg-black">
      <div class="absolute top-8 right-8">
        <button variant="subtle" />
      </div>
      <div class="flex h-auto w-2/3 flex-col items-center gap-8 pt-8 md:justify-center lg:pt-0 lg:pb-16">
        <img src="/images/logo_uo.png" alt="Logo" class="w-44 lg:w-58" />
        <div class="text-primary-800 flex flex-col items-center justify-start gap-2 text-center text-4xl md:text-5xl">
          <p class="font-[Bangers] tracking-wider drop-shadow-lg">H00 Travaux</p>
        </div>
        <p class="text-primary-600 text-center md:px-8">
          Connectez-vous pour accéder à votre espace personnel et gérer efficacement vos taches quotidiennes. Accédez à
          vos chantiers assignés, suivez l'avancement de vos travaux et communiquez facilement avec vos collègues.
        </p>
        <div>
          <AppButtonValidated class="" theme="" @click="redirectToAuth()">
            <template #default>Se connecter</template>
          </AppButtonValidated>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
