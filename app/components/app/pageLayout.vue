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
  <div class="relative w-full h-full overflow-hidden flex flex-col lg:flex-row ">
    <!-- Partie gauche - Sidebar fixed -->
    <aside  >
      <div class="p-4 lg:w-80 w-full h-full ">
        <slot name="sidebar" />

      </div>
    </aside>

    <!-- Partie centrale - Contenu principal -->
    <main class="w-full overflow-auto">
      <div class="p-4 ">
        <slot />
      </div>
    </main>
  </div>
</template>

<style scoped>
/* Styles additionnels si nécessaire */
</style>

