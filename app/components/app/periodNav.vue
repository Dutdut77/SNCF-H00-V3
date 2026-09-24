<script setup>
// Navigateur de période en carte magenta (dégradé des bandeaux) en tête de la barre latérale V4 : mois de la page
// Tâches, année du plan de charge. Le slot par défaut porte le résumé affiché sous le libellé (texte blanc).
const props = defineProps({
  label: { type: String, required: true },
  // Libellés accessibles des flèches, et infobulles facultatives (période voisine)
  prevLabel: { type: String, default: 'Période précédente' },
  nextLabel: { type: String, default: 'Période suivante' },
  prevTitle: { type: String, default: undefined },
  nextTitle: { type: String, default: undefined },
  prevDisabled: { type: Boolean, default: false },
  nextDisabled: { type: Boolean, default: false }
})

const emit = defineEmits(['prev', 'next'])

// Flèches : boutons ronds translucides
const FLECHE =
  'flex size-8.5 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/25 text-white transition-colors enabled:hover:border-white/45 enabled:hover:bg-white/15 disabled:cursor-default disabled:opacity-35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white'
</script>

<template>
  <!-- Repère de la barre latérale : même dégradé que la carte « Nouveau chantier » -->
  <div class="bg-bandeau flex items-center gap-2.5 rounded-xl px-2.5 py-3 shadow-[0_10px_24px_-12px_rgb(43_4_35/0.45)]">
    <button
      type="button"
      :class="FLECHE"
      :disabled="props.prevDisabled"
      :aria-label="props.prevLabel"
      :title="props.prevTitle"
      @click="emit('prev')">
      <Icon name="lucide:chevron-left" size="18" />
    </button>
    <div class="min-w-0 flex-1 text-center" aria-live="polite">
      <p class="font-traverse text-[1.3rem] leading-tight tracking-[0.03em] text-white">{{ props.label }}</p>
      <slot />
    </div>
    <button
      type="button"
      :class="FLECHE"
      :disabled="props.nextDisabled"
      :aria-label="props.nextLabel"
      :title="props.nextTitle"
      @click="emit('next')">
      <Icon name="lucide:chevron-right" size="18" />
    </button>
  </div>
</template>
