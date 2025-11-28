<script setup>
definePageMeta({
  requiresAuth: false,
  layout: false,
});
useHead({
  title: "H00 - Login",
  description: "Page de connexion",
});

const redirectToAuth = () => {
  const currentUrl = new URL(window.location.href);
  const redirectUrl = currentUrl.searchParams.get("redirect") || "/";
  window.location.href = `/api/auth/login?redirect=${encodeURIComponent(redirectUrl)}`;
};
</script>

<template>
  <div class="flex flex-col items-center justify-center w-full h-dvh">
    <div class="relative bg-radial-[at_50%_90%] from-primary-50 via-primary-100 to-primary-200 to-90% h-full w-full flex flex-col pt-8 lg:pt-0 lg:justify-center items-center">
      <div class="absolute top-8 right-8">
        <button variant="subtle" />
      </div>
      <div class="flex gap-8 flex-col items-center md:justify-center pt-8 lg:pt-0 lg:pb-16 h-auto w-2/3">
        <div class="text-4xl md:text-5xl  text-center flex flex-col gap-2 items-center text-slate-700 justify-start">
       
          <p class="font-[Pacifico]">H00 Travaux</p>
        </div>
        <p class="text-slate-600 text-center md:px-8 ">Connectez-vous pour accéder à votre espace personnel et gérer efficacement vos taches quotidiennes. Accédez à vos chantiers assignées, suivez l'avancement de vos travaux et communiquez facilement avec vos collègues.</p>
            <div>
              <AppButtonValidated class="w-32" theme="" @click="redirectToAuth()"> <template #default> Se connecter </template> </AppButtonValidated>
      </div>
      
      </div>
    

    </div>


  </div>
</template>

<style scoped></style>
