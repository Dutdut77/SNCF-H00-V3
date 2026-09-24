<script setup>
// Fiche d'édition V4 (AppSidePanel) des pages Paramètres : en-tête magenta (surtitre, titre, sous-titre),
// corps gris où se posent les cartes du formulaire (slot par défaut), pied avec Annuler et Enregistrer.
// Entrée dans un champ = enregistrer (formulaire natif). Une saisie non enregistrée (`dirty`) est signalée
// dans le pied, et la fermeture demande confirmation (AppSidePanel).
const props = defineProps({
  open: { type: Boolean, default: false },
  // Nom accessible de la fenêtre (par défaut, le titre)
  label: { type: String, default: '' },
  size: { type: String, default: 'md' },
  surtitre: { type: String, default: '' },
  titre: { type: String, default: '' },
  sousTitre: { type: String, default: '' },
  // Formulaire complet : le bouton Enregistrer est actif
  valid: { type: Boolean, default: true },
  dirty: { type: Boolean, default: false },
  // Enregistrement en cours : la fiche reste ouverte
  locked: { type: Boolean, default: false },
  submitLabel: { type: String, default: 'Enregistrer' },
  submitIcon: { type: String, default: 'lucide:save' }
})

const emit = defineEmits(['close', 'submit'])

const formId = useId()
const soumettre = () => {
  if (props.valid && !props.locked) emit('submit')
}
</script>

<template>
  <AppSidePanel
    v-slot="{ fermer }"
    :open="props.open"
    :size="props.size"
    :label="props.label || props.titre"
    :dirty="props.dirty"
    :locked="props.locked"
    @close="emit('close')">
    <header class="panel-brand shrink-0 px-5 py-5 sm:px-7">
      <div class="flex items-center justify-between gap-3">
        <p class="text-xs font-medium text-white/60">{{ props.surtitre }}</p>
        <button
          type="button"
          class="flex size-8.5 cursor-pointer items-center justify-center rounded-full border border-white/18 text-white transition-colors hover:border-white/35 hover:bg-white/8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          aria-label="Fermer"
          @click="fermer">
          <Icon name="lucide:x" size="18" />
        </button>
      </div>
      <div class="mt-2 flex items-center gap-3.5">
        <slot name="visuel" />
        <div class="min-w-0">
          <h2 class="truncate text-2xl leading-tight font-semibold text-white">{{ props.titre }}</h2>
          <p v-if="props.sousTitre" class="mt-1 truncate text-sm text-white/70">{{ props.sousTitre }}</p>
        </div>
      </div>
      <div v-if="$slots.pastilles" class="mt-3 flex flex-wrap gap-2 text-xs font-medium text-white/85">
        <slot name="pastilles" />
      </div>
    </header>

    <div class="dark:bg-night-900 flex min-h-0 flex-1 flex-col bg-slate-100">
      <form
        :id="formId"
        class="flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-7 sm:py-6"
        novalidate
        @submit.prevent="soumettre">
        <slot />
      </form>
    </div>

    <footer class="border-rule bg-card flex shrink-0 items-center gap-2 border-t px-5 py-4 sm:px-7">
      <slot name="pied">
        <p v-if="props.dirty" class="text-ink-soft flex items-center gap-1.5 text-xs">
          <span class="bg-ochre-400 size-1.5 rounded-full" />
          Modifications non enregistrées
        </p>
      </slot>
      <div class="ml-auto flex items-center gap-2">
        <AppButtonValidated type="button" theme="outline" :validated="!props.locked" @click="fermer">
          <template #default>Annuler</template>
        </AppButtonValidated>
        <AppButtonValidated type="submit" :form="formId" theme="brand" :validated="props.valid && !props.locked">
          <template #default>
            <span class="flex items-center gap-2">
              <Icon
                :name="props.locked ? 'lucide:loader-circle' : props.submitIcon"
                size="16"
                :class="{ 'animate-spin': props.locked }" />
              {{ props.submitLabel }}
            </span>
          </template>
        </AppButtonValidated>
      </div>
    </footer>
  </AppSidePanel>
</template>
