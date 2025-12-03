<template>
  <section>
    <Teleport to="body">
      <div
        v-if="props.drawerOpen"
        class="absolute top-0 left-0 z-60 h-dvh w-full bg-slate-800/80 backdrop-blur-sm"
        @click="props.closeDrawer()"></div>
      <client-only>
        <transition
          enter-from-class="translate-y-full opacity-0"
          enter-active-class="duration-500 transition-all"
          leave-active-class="duration-500 transition-all"
          leave-to-class="translate-y-full opacity-0">
          <div v-if="props.drawerOpen" class="fixed bottom-0 left-0 z-60 max-h-[90vh] w-full" @click.stop>
            <slot name="default"></slot>
          </div>
        </transition>
      </client-only>
    </Teleport>
  </section>
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
  }
})

// Close on ESC key
onMounted(() => {
  const handleEscape = (e) => {
    if (e.key === 'Escape' && props.drawerOpen) {
      props.closeDrawer()
    }
  }
  window.addEventListener('keydown', handleEscape)

  onUnmounted(() => {
    window.removeEventListener('keydown', handleEscape)
  })
})
</script>
