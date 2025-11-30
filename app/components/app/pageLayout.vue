<script setup>
// Props pour personnaliser la largeur de la sidebar
const props = defineProps({
  sidebarWidth: {
    type: String,
    default: 'w-64' // 256px par défaut
  }
})

// Calcul de la largeur en pixels pour le padding du main
const sidebarWidthMap = {
  'w-48': '12rem',   // 192px
  'w-56': '14rem',   // 224px
  'w-64': '16rem',   // 256px
  'w-72': '18rem',   // 288px
  'w-80': '20rem',   // 320px
  'w-96': '24rem'    // 384px
}

const mainPaddingLeft = sidebarWidthMap[props.sidebarWidth] || '16rem'
</script>

<template>
  <div class="relative w-full h-full overflow-hidden flex flex-col lg:flex-row">
    <!-- Partie gauche - Sidebar -->
    <aside class="lg:h-full lg:flex-shrink-0 lg:flex lg:flex-col lg:w-80 w-full">
      <!-- Header fixe de la sidebar -->
      <div class="p-4 pb-0 flex-shrink-0">
        <slot name="sidebar-header" />
      </div>
      
      <!-- Navigation scrollable -->
      <div class="flex-1 overflow-y-auto p-4 pt-0">
        <slot name="sidebar" />
      </div>
    </aside>

    <!-- Partie centrale - Contenu principal -->
    <main class="flex-1 overflow-auto">
      <div class="p-4">
        <slot />
      </div>
    </main>
  </div>
</template>

<style scoped>
/* Styles additionnels si nécessaire */
</style>

