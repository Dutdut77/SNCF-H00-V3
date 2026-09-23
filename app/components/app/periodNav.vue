<script setup>
// Navigateur de période en carte translucide sur le panneau pétrole (design V4) : mois de la page
// Tâches, année du plan de charge. Le slot par défaut porte le résumé affiché sous le libellé.
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

// Flèches : boutons ronds sur le panneau pétrole
const FLECHE =
  'flex size-8.5 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/18 text-white transition-colors enabled:hover:border-white/35 enabled:hover:bg-white/8 disabled:cursor-default disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-400'
</script>

<template>
  <!-- Un outil, distinct de la marque au-dessus : carte translucide -->
  <div class="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/6 px-2.5 py-3">
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
