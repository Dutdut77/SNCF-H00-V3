<script setup>
// Panneau latéral droit (design V4) : fiche d'édition posée sur la page, floutée derrière.
// Le panneau n'est qu'un cadre : en-tête, corps défilant et pied appartiennent au slot.
// Fermeture (voile, Échap) : le panneau émet `close`, le contenu décide (ex. confirmation si saisie en cours).
const props = defineProps({
  open: { type: Boolean, default: false },
  // Nom accessible de la fenêtre
  label: { type: String, default: '' }
})

const emit = defineEmits(['close'])

// Échap : les listes déroulantes ouvertes l'interceptent avant (AppDropdownMenu)
const onKeydown = (e) => {
  if (e.key === 'Escape' && props.open) emit('close')
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-from-class="opacity-0"
      enter-active-class="transition-opacity duration-300"
      leave-active-class="transition-opacity duration-200"
      leave-to-class="opacity-0">
      <!-- Page floutée, voile neutre (pas de teinte pétrole) : seule la fiche retient l'attention -->
      <div
        v-if="props.open"
        class="fixed inset-0 z-60 bg-black/50 backdrop-blur-md dark:bg-black/65"
        @click="emit('close')" />
    </Transition>
    <Transition
      enter-from-class="translate-x-full"
      enter-active-class="transition-transform duration-300 ease-out"
      leave-active-class="transition-transform duration-200 ease-in"
      leave-to-class="translate-x-full">
      <aside
        v-if="props.open"
        role="dialog"
        aria-modal="true"
        :aria-label="props.label"
        class="bg-card fixed inset-y-0 right-0 z-60 flex w-full flex-col shadow-[-24px_0_48px_-24px_rgb(3_20_26/0.55)] sm:w-[720px]">
        <slot />
      </aside>
    </Transition>
  </Teleport>
</template>
