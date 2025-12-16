<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'

const props = defineProps({
  trigger: { type: String, default: 'click' }, // 'click' | 'hover'
  offset: { type: Number, default: 4 }, // space between trigger and menu
  hoverOpenDelay: { type: Number, default: 50 }, // ms
  hoverCloseDelay: { type: Number, default: 0 }, // ms (0 = immediate close)
  fullWidth: { type: Boolean, default: false }, // w-full mode
  matchTriggerWidth: { type: Boolean, default: false }, // menu takes trigger width
})

const isOpen = defineModel('open', { default: false })
const triggerRef = ref<HTMLElement | null>(null)
const menuRef = ref<HTMLElement | null>(null)
const positionStyle = ref<Record<string, string>>({ top: '0px', left: '0px' })

let openTimeout: number | null = null
let closeTimeout: number | null = null
let closeTimer: number | null = null
let positionRaf: number | null = null

function cancelScheduledPosition() {
  if (positionRaf) {
    window.cancelAnimationFrame(positionRaf)
    positionRaf = null
  }
}

function schedulePositionUpdate() {
  cancelScheduledPosition()
  positionRaf = window.requestAnimationFrame(() => {
    updatePosition()
    positionRaf = null
  })
}

function openHover() {
  if (closeTimer) {
    clearTimeout(closeTimer)
    closeTimer = null
  }
  open()
}

function scheduleCloseHover() {
  // Toujours utiliser setTimeout pour permettre au mouseenter du menu de s'exécuter
  // et d'annuler la fermeture via cancelCloseHover()
  closeTimer = window.setTimeout(() => {
    close()
  }, props.hoverCloseDelay)
}

function cancelCloseHover() {
  if (closeTimer) {
    clearTimeout(closeTimer)
    closeTimer = null
  }
}
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function updatePosition() {
  if (!triggerRef.value || !menuRef.value) return

  const triggerRect = triggerRef.value.getBoundingClientRect()
  const menuRect = menuRef.value.getBoundingClientRect()
  const vw = window.innerWidth
  const vh = window.innerHeight

  // Prefer below unless not enough space
  const canPlaceBelow = triggerRect.bottom + props.offset + menuRect.height <= vh
  const canPlaceAbove = triggerRect.top - props.offset - menuRect.height >= 0
  const placeAbove = !canPlaceBelow && canPlaceAbove

  let left: number
  const viewportPadding = 12

  if (props.matchTriggerWidth || props.fullWidth) {
    // Align left with trigger
    left = triggerRect.left
  } else {
    // Center align by default, auto-adjust if overflow
    left = triggerRect.left + triggerRect.width / 2 - menuRect.width / 2
    const maxLeft = Math.max(viewportPadding, vw - menuRect.width - viewportPadding)

    // If centered dropdown overflows right → shift left
    if (left + menuRect.width > vw - viewportPadding) {
      left = maxLeft
    }

    // If centered dropdown overflows left → shift right
    if (left < viewportPadding) {
      left = viewportPadding
    }

    // Apply clamp to be 100% safe
    left = clamp(left, viewportPadding, maxLeft)
  }

  const top = placeAbove
    ? triggerRect.top - props.offset - menuRect.height
    : triggerRect.bottom + props.offset

  positionStyle.value = {
    top: `${top + window.scrollY}px`,
    left: `${left + window.scrollX}px`,
    ...(props.matchTriggerWidth && { width: `${triggerRect.width}px` }),
  }
}

function open() {
  isOpen.value = true
}

function close() {
  isOpen.value = false
}

function toggle() {
  isOpen.value = !isOpen.value
}

function handleDocumentClick(e: MouseEvent) {
  if (!menuRef.value || !triggerRef.value) return
  const target = e.target as Node
  if (!menuRef.value.contains(target) && !triggerRef.value.contains(target)) {
    close()
  }
}

function handleEscape(e: KeyboardEvent) {
  if (e.key === 'Escape') close()
}

function addWindowListeners() {
  window.addEventListener('resize', updatePosition)
  window.addEventListener('scroll', updatePosition, true) // true to catch scroll on ancestors
  // Use mousedown + capture to detect clicks before @click.stop can block them
  document.addEventListener('mousedown', handleDocumentClick, true)
  document.addEventListener('keydown', handleEscape)
}

function removeWindowListeners() {
  window.removeEventListener('resize', updatePosition)
  window.removeEventListener('scroll', updatePosition, true)
  document.removeEventListener('mousedown', handleDocumentClick, true)
  document.removeEventListener('keydown', handleEscape)
}

onMounted(() => {
  // nothing to do initially
})

onBeforeUnmount(() => {
  removeWindowListeners()
  if (openTimeout) window.clearTimeout(openTimeout)
  if (closeTimeout) window.clearTimeout(closeTimeout)
  cancelScheduledPosition()
})

// Hover helpers
function startOpenHover() {
  if (closeTimeout) { window.clearTimeout(closeTimeout); closeTimeout = null }
  openTimeout = window.setTimeout(() => open(), props.hoverOpenDelay)
}
function startCloseHover() {
  if (openTimeout) { window.clearTimeout(openTimeout); openTimeout = null }
  closeTimeout = window.setTimeout(() => close(), props.hoverCloseDelay)
}

// Watch isOpen to manage listeners and position
watch(isOpen, (v) => {
  if (v) {
    nextTick(schedulePositionUpdate)
    addWindowListeners()
  } else {
    cancelScheduledPosition()
    removeWindowListeners()
  }
})
</script>

<template>
  <div :class="props.fullWidth ? 'block w-full' : 'inline-block'">
    <div
      ref="triggerRef"
      :class="props.fullWidth ? 'block w-full' : 'inline-block'"
      @click="props.trigger === 'click' ? toggle() : null"
      @mouseenter="props.trigger === 'hover' ? openHover() : null"
      @mouseleave="props.trigger === 'hover' ? scheduleCloseHover() : null"
      @focus="props.trigger === 'hover' ? open() : null"
      @blur="props.trigger === 'hover' ? close() : null"
      tabindex="0"
    >
      <slot name="trigger" />
    </div>

    <!-- Teleport to body to avoid overflow/clip issues -->
    <Teleport to="body">
      <transition name="fade">
        <div
          v-if="isOpen"
          ref="menuRef"
          class="absolute z-[100] -mt-1 pt-2"
          :style="positionStyle"
          @mouseenter="props.trigger === 'hover' ? cancelCloseHover() : null"
          @mouseleave="props.trigger === 'hover' ? scheduleCloseHover() : null"
        >
          <div class="bg-white dark:bg-neutral-900 rounded-lg shadow-xl p-2 border border-neutral-200 dark:border-neutral-700">
            <slot />
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.12s ease, transform 0.12s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
