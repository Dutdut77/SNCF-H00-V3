<script setup>
// Carte d'appel à la création d'un chantier, en pied de la barre latérale V4 :
// liste des chantiers et plan de charge général.
const emit = defineEmits(['create'])
</script>

<template>
  <!-- Dégradé des bandeaux et des cartes de connexion : seule touche de couleur de la barre latérale -->
  <div
    class="bg-bandeau mx-4 mb-4 overflow-hidden rounded-xl shadow-[0_10px_24px_-12px_rgb(43_4_35/0.45)] lg:mx-0 lg:mb-0">
    <div class="p-4">
      <div class="mb-2 flex items-center gap-2">
        <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 text-white">
          <Icon name="lucide:traffic-cone" size="20" />
        </span>
        <p class="text-sm font-semibold text-white">Nouveau chantier</p>
      </div>
      <p class="text-xs leading-relaxed text-white/80">Créez et suivez l'avancement de vos chantiers en temps réel.</p>
    </div>
    <!-- Bandeau bord à bord : AppButtonValidated n'est pas utilisé ici, son `rounded-lg`
         s'accommode mal d'un bouton pleine largeur collé aux bords. -->
    <button
      type="button"
      class="flex w-full cursor-pointer items-center justify-center gap-2 border-t border-white/15 bg-black/12 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-black/22"
      @click="emit('create')">
      <Icon name="lucide:plus" size="18" />
      Créer un chantier
    </button>
  </div>
</template>
