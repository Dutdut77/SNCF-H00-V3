<script setup>
const props = defineProps({
  error: Object
})

useHead({
  title: `H00 - Erreur ${props.error?.statusCode || ''}`,
  description: 'Une erreur est survenue'
})

// Messages personnalisés selon le code d'erreur
const errorInfo = computed(() => {
  const code = props.error?.statusCode || 500

  switch (code) {
    case 404:
      return {
        title: 'Page introuvable',
        description: "Oups ! La page que vous recherchez n'existe pas ou a été déplacée.",
        icon: 'lucide:file-question'
      }
    case 403:
      return {
        title: 'Accès refusé',
        description: "Vous n'avez pas les permissions nécessaires pour accéder à cette ressource.",
        icon: 'lucide:shield-x'
      }
    case 401:
      return {
        title: 'Non authentifié',
        description: 'Vous devez vous connecter pour accéder à cette page.',
        icon: 'lucide:lock'
      }
    case 500:
      return {
        title: 'Erreur serveur',
        description: 'Une erreur interne est survenue. Nos équipes ont été notifiées.',
        icon: 'lucide:server-crash'
      }
    default:
      return {
        title: 'Une erreur est survenue',
        description: props.error?.message || "Quelque chose s'est mal passé. Veuillez réessayer.",
        icon: 'lucide:alert-triangle'
      }
  }
})

// Retour à l'accueil
const goHome = () => clearError({ redirect: '/' })

// Retour à la page précédente
const goBack = () => {
  if (window.history.length > 1) {
    window.history.back()
  } else {
    goHome()
  }
}
</script>

<template>
  <div class="flex h-dvh w-full flex-col items-center justify-center">
    <div
      class="from-primary-800/30 via-primary-800/20 relative flex h-full w-full flex-col items-center bg-radial-[at_50%_50%] to-white pt-8 lg:justify-center lg:pt-0">
      <div class="flex h-auto w-2/3 max-w-xl flex-col items-center gap-6 pt-8 md:justify-center lg:pt-0 lg:pb-16">
        <!-- Logo -->
        <div
          class="flex flex-col items-center justify-start gap-2 pb-6 text-center text-4xl text-slate-700 md:text-5xl">
          <p class="font-[Pacifico]">H00 Travaux</p>
        </div>

        <!-- Code d'erreur -->
        <div class="flex items-start gap-4">
          <Icon :name="errorInfo.icon" class="text-primary-500" size="50" />
          <span class="text-primary-500/80 pb-6 font-bold" style="font-size: 3rem; line-height: 1">
            {{ error?.statusCode || '?' }}
          </span>
        </div>

        <!-- Message d'erreur -->
        <div class="space-y-2 text-center">
          <h1 class="text-2xl font-semibold text-slate-700 md:text-3xl">
            {{ errorInfo.title }}
          </h1>
          <p class="text-slate-600 md:px-8">
            {{ errorInfo.description }}
          </p>
        </div>

        <!-- Message technique (en dev) -->
        <!-- <p v-if="error?.message && error.message !== errorInfo.description" class="text-sm text-slate-500 bg-white/50 px-4 py-2 rounded-lg max-w-full overflow-hidden text-ellipsis">
          {{ error.message }}
        </p> -->

        <!-- Boutons d'action -->
        <div class="flex gap-3" style="padding-top: 2rem">
          <AppButtonValidated theme="cancel" @click="goBack">
            <template #default>
              <span class="flex items-center gap-2">
                <Icon name="lucide:arrow-left" class="h-4 w-4" />
                Retour
              </span>
            </template>
          </AppButtonValidated>

          <AppButtonValidated @click="goHome" class="">
            <template #default>
              <span class="flex items-center gap-2">
                <Icon name="lucide:home" class="h-4 w-4" />
                Accueil
              </span>
            </template>
          </AppButtonValidated>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
