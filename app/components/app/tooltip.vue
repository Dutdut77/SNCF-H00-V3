<!-- <AppTooltip :text="prenom + ' ' + nom">
    <Avatar :nom="nom" :prenom="prenom" />
  </AppTooltip>
  La bulle est téléportée dans <body> et recadrée dans la fenêtre : elle ne
  déborde jamais de l'écran et n'est pas affectée par un éventuel zoom/scale
  d'un conteneur parent (ex : canvas du flowchart). -->

<script setup>
import { ref, nextTick, watch, onBeforeUnmount } from 'vue'

const props = defineProps({
  text: { type: String, required: true },
  position: { type: String, default: 'top' }, // top | bottom | left | right (préférence)
  offset: { type: Number, default: 8 },
})

const PAD = 8 // marge mini avec le bord de la fenêtre

const show = ref(false)
const triggerRef = ref(null)
const tipRef = ref(null)
const style = ref({ top: '0px', left: '0px' })

const updatePosition = () => {
  const t = triggerRef.value
  const tip = tipRef.value
  if (!t || !tip) return
  const r = t.getBoundingClientRect()
  const tw = tip.offsetWidth
  const th = tip.offsetHeight
  const vw = window.innerWidth
  const vh = window.innerHeight

  let top
  let left
  if (props.position === 'left') {
    left = r.left - props.offset - tw
    top = r.top + r.height / 2 - th / 2
  } else if (props.position === 'right') {
    left = r.right + props.offset
    top = r.top + r.height / 2 - th / 2
  } else if (props.position === 'bottom') {
    top = r.bottom + props.offset
    left = r.left + r.width / 2 - tw / 2
  } else {
    top = r.top - props.offset - th
    left = r.left + r.width / 2 - tw / 2
  }

  // Recadrage dans la fenêtre (jamais hors écran)
  left = Math.max(PAD, Math.min(left, vw - tw - PAD))
  top = Math.max(PAD, Math.min(top, vh - th - PAD))
  style.value = { top: `${top}px`, left: `${left}px` }
}

const open = async () => {
  show.value = true
  await nextTick()
  updatePosition()
}
const close = () => { show.value = false }

const addListeners = () => {
  window.addEventListener('scroll', updatePosition, true)
  window.addEventListener('resize', updatePosition)
}
const removeListeners = () => {
  window.removeEventListener('scroll', updatePosition, true)
  window.removeEventListener('resize', updatePosition)
}
watch(show, (v) => (v ? addListeners() : removeListeners()))
onBeforeUnmount(() => { removeListeners(); show.value = false })
</script>

<template>
  <div ref="triggerRef" class="relative inline-flex" @mouseenter="open" @mouseleave="close">
    <slot />

    <Teleport to="body">
      <transition name="fade">
        <div
          v-if="show"
          ref="tipRef"
          :style="style"
          class="pointer-events-none fixed z-9998 rounded bg-gray-900 px-2 py-1 text-xs whitespace-nowrap text-white shadow-lg">
          {{ text }}
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.12s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
