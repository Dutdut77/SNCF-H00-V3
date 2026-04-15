<script setup>
// Modal générique réutilisable
// Utilisation basique :
// <AppModal v-model="showModal">
//   <template #header>Mon titre</template>
//   <template #default>Mon contenu</template>
//   <template #footer>Mes actions</template>
// </AppModal>

const model = defineModel({ type: Boolean, default: false })

const props = defineProps({
  // Taille du modal : 'sm', 'md', 'lg', 'xl', 'full'
  size: {
    type: String,
    default: 'md'
  },
  // Fermer en cliquant sur le backdrop
  closeOnBackdrop: {
    type: Boolean,
    default: true
  },
  // Fermer avec la touche Escape
  closeOnEscape: {
    type: Boolean,
    default: true
  },
  // Afficher le bouton de fermeture (X)
  showCloseButton: {
    type: Boolean,
    default: true
  },
  // Empêcher la fermeture (utile pendant un chargement)
  persistent: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

// Classes de taille
const sizeClasses = computed(() => {
  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    half: 'max-w-[50vw]',
    full: 'max-w-dwh '
  }
  return sizes[props.size] || sizes.md
})

// Fermer le modal
const close = () => {
  if (!props.persistent) {
    model.value = false
    emit('close')
  }
}

// Clic sur le backdrop
const onBackdropClick = () => {
  if (props.closeOnBackdrop) {
    close()
  }
}

// Gestion de la touche Escape
const handleKeydown = (e) => {
  if (e.key === 'Escape' && model.value && props.closeOnEscape) {
    close()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

// Exposer la méthode close pour un usage externe
defineExpose({ close })
</script>

<template>
  <Teleport to="body">
    <Transition enter-active-class="duration-200 ease-out" enter-from-class="opacity-0" enter-to-class="opacity-100"
      leave-active-class="duration-150 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
      <div v-if="model" class="fixed inset-0 z-100 flex items-center justify-center p-4">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" @click="onBackdropClick"></div>

        <!-- Modal Container -->
        <Transition enter-active-class="duration-200 ease-out" enter-from-class="opacity-0 scale-95 translate-y-4"
          enter-to-class="opacity-100 scale-100 translate-y-0" leave-active-class="duration-150 ease-in"
          leave-from-class="opacity-100 scale-100 translate-y-0" leave-to-class="opacity-0 scale-95 translate-y-4">
          <div v-if="model"
            class="relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-lg bg-white shadow-2xl dark:bg-gray-800"
            :class="sizeClasses" @click.stop>
            <!-- Bouton fermeture -->
            <button v-if="showCloseButton && !persistent" type="button"
              class="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200"
              @click="close">
              <Icon name="lucide:x" size="18" />
            </button>

            <!-- Header -->
            <div v-if="$slots.header" class="px-6 pt-6 pr-12 pb-4">
              <slot name="header"></slot>
            </div>

            <!-- Content -->
            <div class="flex-1 overflow-auto px-6 pb-6" :class="{ 'pt-6': !$slots.header }">
              <slot></slot>
            </div>

            <!-- Footer -->
            <div v-if="$slots.footer" class="border-t border-gray-100 px-6 pt-2 pb-6 dark:border-gray-700">
              <slot name="footer"></slot>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
