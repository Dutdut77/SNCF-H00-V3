<script setup>
// Modal générique réutilisable
// Utilisation basique :
// <AppModal v-model="showModal">
//   <template #header>Mon titre</template>
//   <template #default>Mon contenu</template>
//   <template #footer>Mes actions</template>
// </AppModal>

const model = defineModel({ type: Boolean, default: false });

const props = defineProps({
  // Fermer en cliquant sur le backdrop
  closeOnBackdrop: {
    type: Boolean,
    default: true,
  },
  // Fermer avec la touche Escape
  closeOnEscape: {
    type: Boolean,
    default: true,
  },
  // Afficher le bouton de fermeture (X)
  showCloseButton: {
    type: Boolean,
    default: true,
  },
  // Empêcher la fermeture (utile pendant un chargement)
  persistent: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["close"]);

// Classes de taille

// Fermer le modal
const close = () => {
  if (!props.persistent) {
    model.value = false;
    emit("close");
  }
};

// Clic sur le backdrop
const onBackdropClick = () => {
  if (props.closeOnBackdrop) {
    close();
  }
};

// Gestion de la touche Escape
const handleKeydown = (e) => {
  if (e.key === "Escape" && model.value && props.closeOnEscape) {
    close();
  }
};

onMounted(() => {
  window.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeydown);
});

// Exposer la méthode close pour un usage externe
defineExpose({ close });
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="model"
        class="fixed inset-0 z-50 flex items-center justify-center"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          @click="onBackdropClick"
        ></div>

        <!-- Modal Container -->
        <Transition
          enter-active-class="duration-200 ease-out"
          enter-from-class="opacity-0 scale-95 translate-y-4"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="duration-150 ease-in"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 translate-y-4"
        >
          <div
            v-if="model"
            class="relative w-full bg-black dark:bg-gray-800 overflow-hidden flex flex-col justify-center items-center h-dvh"
            @click.stop
          >
            <!-- Bouton fermeture -->
            <button
              v-if="showCloseButton && !persistent"
              type="button"
              class="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              @click="close"
            >
              <Icon name="lucide:x" size="18" />
            </button>

            <!-- Content -->
            <div class="overflow-hidden">
              <slot></slot>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
