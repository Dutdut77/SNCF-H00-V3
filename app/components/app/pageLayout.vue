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
  <div class="relative flex h-full w-full flex-col overflow-hidden lg:flex-row">
    <!-- Partie gauche - Sidebar -->
    <aside class="w-full lg:flex lg:h-full lg:w-80 lg:shrink-0 lg:flex-col">
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
