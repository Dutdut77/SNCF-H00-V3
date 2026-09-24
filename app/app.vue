<template>
  <NuxtLoadingIndicator />
  <NuxtLayout>
    <AppToastList />
    <AppLoader />
    <NuxtPage />
  </NuxtLayout>
  <!-- Polices des impressions affichées en permanence, de façon invisible : certains navigateurs (Safari)
       n'utilisent à l'impression qu'une police déjà dessinée à l'écran, pas seulement téléchargée -->
  <div
    aria-hidden="true"
    class="pointer-events-none fixed top-0 left-0 size-px overflow-hidden opacity-0 select-none print:hidden">
    <span class="font-traverse">H00 Travaux 0123456789</span>
    <span class="font-[Pacifico]">H00 Travaux</span>
    <span class="font-[Bangers]">H00 Travaux</span>
  </div>
</template>
