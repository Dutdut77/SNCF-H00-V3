<template>
  <section>
    <Teleport to="body">
      <div
        v-if="props.drawerOpen"
        class="fixed inset-0 z-60 bg-slate-800/80 backdrop-blur-sm"
        @click="props.closeDrawer()"></div>
      <ClientOnly>
        <transition
          enter-from-class="translate-y-full opacity-0"
          enter-active-class="duration-500 transition-all"
          leave-active-class="duration-500 transition-all"
          leave-to-class="translate-y-full opacity-0">
          <div
            v-if="props.drawerOpen"
            class="fixed bottom-0 left-0 z-60 w-full"
            :style="{ height: props.fixedHeight || `${props.heightPercent}%` }"
            @click.stop>
            <slot name="default"></slot>
          </div>
        </transition>
      </ClientOnly>
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
  },
  heightPercent: {
    type: Number,
    default: 70
  },
  fixedHeight: {
    type: String,
    default: null
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
