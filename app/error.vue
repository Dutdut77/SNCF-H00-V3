<script setup>
const props = defineProps({
  error: Object
});

useHead({
  title: `H00 - Erreur ${props.error?.statusCode || ''}`,
  description: "Une erreur est survenue",
});

// Messages personnalisés selon le code d'erreur
const errorInfo = computed(() => {
  const code = props.error?.statusCode || 500;
  
  switch (code) {
    case 404:
      return {
        title: 'Page introuvable',
        description: 'Oups ! La page que vous recherchez n\'existe pas ou a été déplacée.',
        icon: 'lucide:file-question'
      };
    case 403:
      return {
        title: 'Accès refusé',
        description: 'Vous n\'avez pas les permissions nécessaires pour accéder à cette ressource.',
        icon: 'lucide:shield-x'
      };
    case 401:
      return {
        title: 'Non authentifié',
        description: 'Vous devez vous connecter pour accéder à cette page.',
        icon: 'lucide:lock'
      };
    case 500:
      return {
        title: 'Erreur serveur',
        description: 'Une erreur interne est survenue. Nos équipes ont été notifiées.',
        icon: 'lucide:server-crash'
      };
    default:
      return {
        title: 'Une erreur est survenue',
        description: props.error?.message || 'Quelque chose s\'est mal passé. Veuillez réessayer.',
        icon: 'lucide:alert-triangle'
      };
  }
});

// Retour à l'accueil
const goHome = () => clearError({ redirect: '/' });

// Retour à la page précédente
const goBack = () => {
  if (window.history.length > 1) {
    window.history.back();
  } else {
    goHome();
  }
};
</script>

<template>
  <div class="flex flex-col items-center justify-center w-full h-dvh">
    <div class="relative bg-radial-[at_50%_90%] from-primary-50 via-primary-100 to-primary-200 to-90% h-full w-full flex flex-col pt-8 lg:pt-0 lg:justify-center items-center">
      
      <div class="flex gap-6 flex-col items-center md:justify-center pt-8 lg:pt-0 lg:pb-16 h-auto w-2/3 max-w-xl">
        
        <!-- Logo -->
        <div class="text-4xl md:text-5xl text-center flex flex-col gap-2 items-center text-slate-700 justify-start pb-6">
          <p class="font-[Pacifico]">H00 Travaux</p>
        </div>

        <!-- Code d'erreur -->
        <div class="flex items-start gap-4">
          <Icon :name="errorInfo.icon" class="text-primary-500" size="50" />
          <span class="font-bold text-primary-500/80 pb-6" style="font-size: 3rem; line-height: 1;">
            {{ error?.statusCode || '?' }}
          </span>
        </div>

        <!-- Message d'erreur -->
        <div class="text-center space-y-2">
          <h1 class="text-2xl md:text-3xl font-semibold text-slate-700">
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
        <div class="flex gap-3 " style="padding-top: 2rem;">
          <AppButtonValidated theme="cancel" @click="goBack" >
            <template #default>
              <span class="flex items-center gap-2">
                <Icon name="lucide:arrow-left" class="w-4 h-4" />
                Retour
              </span>
            </template>
          </AppButtonValidated>
          
          <AppButtonValidated @click="goHome" class="">
            <template #default>
              <span class="flex items-center gap-2">
                <Icon name="lucide:home" class="w-4 h-4" />
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

