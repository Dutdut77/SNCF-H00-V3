<!-- <Tooltip :text="prenom + ' ' + nom">
    <Avatar
      :nom="nom"
      :prenom="prenom"
      color="bg-indigo-600"
      size="md"
    />
  </Tooltip> -->

<script setup>
import { ref } from 'vue'

const props = defineProps({
  text: { type: String, required: true },
  position: { type: String, default: 'top' } // top | bottom | left | right
})

const show = ref(false)

// positions Tailwind
const POSITIONS = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2'
}
</script>

<template>
  <div class="relative inline-flex" @mouseenter="show = true" @mouseleave="show = false">
    <!-- slot pour l’avatar -->
    <slot />

    <!-- Tooltip -->
    <transition name="fade">
      <div
        v-if="show"
        :class="[
          'absolute z-50 rounded bg-gray-900 px-2 py-1 text-xs whitespace-nowrap text-white shadow-lg',
          POSITIONS[position]
        ]">
        {{ text }}
      </div>
    </transition>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
