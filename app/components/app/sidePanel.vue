<script setup>
// Panneau latéral droit (design V4) : fiche d'édition posée sur la page, floutée derrière.
// Le contenu (en-tête, corps défilant, pied) appartient au slot, qui reçoit `fermer` pour ses boutons
// × et Annuler. Toute demande de fermeture (voile, Échap, boutons) passe par la même porte : si une
// saisie est en cours (`dirty`), on confirme avant d'abandonner.
const props = defineProps({
  open: { type: Boolean, default: false },
  // Nom accessible de la fenêtre
  label: { type: String, default: '' },
  // 'md' (560 px) : fiche courte, comme le détail d'une tâche ; 'lg' (720 px) : formulaire complet
  size: { type: String, default: 'lg' },
  // Saisie non enregistrée : la fermeture demande confirmation
  dirty: { type: Boolean, default: false },
  // Enregistrement en cours : la fiche reste ouverte
  locked: { type: Boolean, default: false },
  confirmTitle: { type: String, default: 'Abandonner les modifications ?' },
  confirmText: { type: String, default: 'Les changements ne seront pas enregistrés.' }
})

const emit = defineEmits(['close'])

const confirmOuvert = ref(false)
watch(
  () => props.open,
  (ouvert) => {
    if (!ouvert) confirmOuvert.value = false
  }
)

const fermer = () => {
  // Échap pendant la confirmation : on reprend la saisie
  if (confirmOuvert.value) {
    confirmOuvert.value = false
    return
  }
  if (props.locked) return
  if (props.dirty) {
    confirmOuvert.value = true
    return
  }
  emit('close')
}
const abandonner = () => {
  confirmOuvert.value = false
  emit('close')
}

// Échap : les listes déroulantes et calendriers ouverts l'interceptent avant
const onKeydown = (e) => {
  if (e.key === 'Escape' && props.open) fermer()
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
      <!-- Voile du loader : page très floutée, dont on garde une trace en sombre ; seule la fiche retient l'attention -->
      <div
        v-if="props.open"
        class="dark:bg-night-900/60 fixed inset-0 z-60 bg-white/10 backdrop-blur-lg"
        @click="fermer" />
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
        class="bg-card fixed inset-y-0 right-0 z-60 flex w-full flex-col shadow-[-24px_0_48px_-24px_rgb(43_4_35/0.55)]"
        :class="props.size === 'md' ? 'sm:w-[560px]' : 'sm:w-[720px]'">
        <slot :fermer="fermer" />
      </aside>
    </Transition>
  </Teleport>

  <AppModal v-model="confirmOuvert" size="sm" :close-on-escape="false" :show-close-button="false">
    <template #header>
      <h3 class="text-ink text-lg font-semibold">{{ props.confirmTitle }}</h3>
    </template>
    <p class="text-ink-soft text-sm">{{ props.confirmText }}</p>
    <template #footer>
      <div class="flex justify-end gap-2 pt-2">
        <AppButtonValidated theme="outline" type="button" @click="confirmOuvert = false">
          <template #default>Continuer la saisie</template>
        </AppButtonValidated>
        <AppButtonValidated theme="outline-danger" type="button" @click="abandonner">
          <template #default>Abandonner</template>
        </AppButtonValidated>
      </div>
    </template>
  </AppModal>
</template>
