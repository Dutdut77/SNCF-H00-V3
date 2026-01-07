<template>
  <div
    ref="drawerRef"
    class="bg-primary-50 flex h-full w-full flex-col overflow-hidden rounded-t-2xl shadow-2xl"
    :style="{ transform: `translateY(${dragOffset}px)` }">
    <!-- Handle bar (zone de drag) -->
    <div
      ref="handleRef"
      class="flex shrink-0 cursor-grab justify-center pt-3 pb-2 active:cursor-grabbing"
      @mousedown="handleMouseDown">
      <div class="h-1.5 w-12 rounded-full bg-gray-300" />
    </div>

    <!-- Contenu du slot -->
    <div class="flex-1 overflow-x-hidden overflow-y-auto px-4 pb-4">
      <slot name="default"></slot>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  drawerOpen: {
    type: Boolean,
    required: true
  },
  closeDrawer: {
    type: Function,
    required: true
  },
  swipeThreshold: {
    type: Number,
    default: 100
  }
})

const drawerRef = ref(null)
const handleRef = ref(null)
const dragOffset = ref(0)
const startY = ref(0)
const isDragging = ref(false)

// Gestion du touch (mobile)
const handleTouchStart = (e) => {
  isDragging.value = true
  startY.value = e.touches[0].clientY
}

const handleTouchMove = (e) => {
  if (!isDragging.value) return

  const currentY = e.touches[0].clientY
  const diff = currentY - startY.value

  // Permet seulement le glissement vers le bas
  if (diff > 0) {
    e.preventDefault()
    dragOffset.value = diff
  }
}

const handleTouchEnd = () => {
  if (!isDragging.value) return

  isDragging.value = false

  // Si le drag dépasse le seuil, fermer le drawer
  if (dragOffset.value > props.swipeThreshold) {
    props.closeDrawer()
    dragOffset.value = 0
  } else {
    // Sinon, revenir à la position initiale
    dragOffset.value = 0
  }
}

// Gestion de la souris (desktop)
const handleMouseDown = (e) => {
  isDragging.value = true
  startY.value = e.clientY

  const handleMouseMove = (e) => {
    if (!isDragging.value) return

    const currentY = e.clientY
    const diff = currentY - startY.value

    if (diff > 0) {
      dragOffset.value = diff
    }
  }

  const handleMouseUp = () => {
    if (!isDragging.value) return

    isDragging.value = false

    if (dragOffset.value > props.swipeThreshold) {
      props.closeDrawer()
      dragOffset.value = 0
    } else {
      dragOffset.value = 0
    }

    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('mouseup', handleMouseUp)
  }

  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('mouseup', handleMouseUp)
}

// Gestion du touch avec event listeners natifs
onMounted(() => {
  const handle = handleRef.value
  if (!handle) return

  handle.addEventListener('touchstart', handleTouchStart, { passive: true })
  handle.addEventListener('touchmove', handleTouchMove, { passive: false })
  handle.addEventListener('touchend', handleTouchEnd, { passive: true })

  onUnmounted(() => {
    if (handle) {
      handle.removeEventListener('touchstart', handleTouchStart)
      handle.removeEventListener('touchmove', handleTouchMove)
      handle.removeEventListener('touchend', handleTouchEnd)
    }
  })
})

// Reset drag offset when drawer opens
watch(
  () => props.drawerOpen,
  (newVal) => {
    if (newVal) {
      dragOffset.value = 0
    }
  }
)
</script>

<style scoped>
/* Smooth transition for drag release */
div[ref='drawerRef'] {
  transition: transform 0.2s ease-out;
}
</style>
