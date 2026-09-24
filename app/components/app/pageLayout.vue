<script setup>
// Props pour personnaliser la largeur de la sidebar
const props = defineProps({
  sidebarWidth: {
    type: String,
    default: 'w-64' // 256px par défaut
  },
  // Classes ajoutées à la barre latérale
  sidebarClass: {
    type: [String, Array, Object],
    default: ''
  },
  // Barre latérale V4 : blanche, séparée du contenu par un filet ; la navbar et le pied de page la prolongent
  v4: {
    type: Boolean,
    default: false
  }
})

// Signale au pied de page qu'une barre latérale V4 est affichée (compteur : pendant une navigation,
// la nouvelle page est montée avant que l'ancienne soit démontée)
if (props.v4) {
  const panneauxV4 = useState('panneaux-v4', () => 0)
  // À l'hydratation, le compteur arrive déjà incrémenté par le rendu serveur
  if (import.meta.server || !useNuxtApp().isHydrating) panneauxV4.value++
  onUnmounted(() => {
    panneauxV4.value--
  })
}

// Calcul de la largeur en pixels pour le padding du main
const sidebarWidthMap = {
  'w-48': '12rem', // 192px
  'w-56': '14rem', // 224px
  'w-64': '16rem', // 256px
  'w-72': '18rem', // 288px
  'w-80': '20rem', // 320px
  'w-96': '24rem' // 384px
}

const mainPaddingLeft = sidebarWidthMap[props.sidebarWidth] || '16rem'
</script>

<template>
  <div class="relative flex w-full flex-col lg:h-full lg:flex-row lg:overflow-hidden">
    <!-- Partie gauche - Sidebar -->
    <aside
      class="w-full lg:flex lg:h-full lg:w-80 lg:shrink-0 lg:flex-col"
      :class="[props.sidebarClass, { 'bg-card border-rule border-b lg:border-r lg:border-b-0': props.v4 }]">
      <!-- Header fixe de la sidebar -->
      <div class="shrink-0 p-4 pb-0">
        <slot name="sidebar-header" />
      </div>

      <!-- Navigation scrollable -->
      <div class="flex-1 overflow-y-auto p-4 pt-0">
        <slot name="sidebar" />
      </div>

      <!-- Footer fixe de la sidebar -->
      <div class="shrink-0 pt-0 lg:p-4">
        <slot name="sidebar-footer" />
      </div>
    </aside>

    <!-- Partie centrale - Contenu principal -->
    <main class="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden lg:h-full">
      <slot />
    </main>
  </div>
</template>

<style scoped>
/* Styles additionnels si nécessaire */
</style>
