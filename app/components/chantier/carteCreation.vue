<script setup>
// Carte d'appel à la création d'un chantier, en pied du panneau pétrole (design V4) :
// liste des chantiers et plan de charge général.
const emit = defineEmits(['create'])
</script>

<template>
  <!-- Carte claire sur le panneau pétrole : vert d'eau des bandeaux et des cartes de connexion -->
  <div class="bg-aqua mx-4 mb-4 overflow-hidden rounded-xl shadow-[0_10px_24px_-12px_rgb(0_0_0/0.45)] lg:mx-0 lg:mb-0">
    <div class="p-4">
      <div class="mb-2 flex items-center gap-2">
        <span
          class="text-petrol-700 flex h-9 w-9 items-center justify-center rounded-lg bg-white/70 dark:bg-white/15 dark:text-white">
          <Icon name="lucide:traffic-cone" size="20" />
        </span>
        <p class="text-petrol-900 text-sm font-semibold dark:text-white">Nouveau chantier</p>
      </div>
      <p class="text-petrol-900/72 text-xs leading-relaxed dark:text-white/75">
        Créez et suivez l'avancement de vos chantiers en temps réel.
      </p>
    </div>
    <!-- Bandeau bord à bord : AppButtonValidated n'est pas utilisé ici, son `rounded-lg`
         s'accommode mal d'un bouton pleine largeur collé aux bords. -->
    <button
      type="button"
      class="bg-petrol-700 hover:bg-secondary-600 dark:bg-petrol-900 dark:hover:bg-secondary-600 flex w-full cursor-pointer items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white transition-colors"
      @click="emit('create')">
      <Icon name="lucide:plus" size="18" />
      Créer un chantier
    </button>
  </div>
</template>
