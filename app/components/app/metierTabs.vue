<script setup>
// Sélecteur de métier (VOIE / SES / CAT) en segmented control avec pastille
// colorée glissante. v-model = le code métier actif.
//   <AppMetierTabs v-model="activeMetier" />            (barre large, taille md)
//   <AppMetierTabs v-model="activeMetier" size="sm" class="w-full" /> (sidebar)
//   <AppMetierTabs v-model="activeMetier" v4 />          (design V4 : cadre blanc liseré, pastille en dégradé)
const model = defineModel({ type: String })

const props = defineProps({
  size: { type: String, default: 'md' }, // 'sm' (sidebar) | 'md' (barre)
  metiers: { type: Array, default: null }, // codes autorisés (ex: ['VOIE','SES']), null = tous
  // Habillage design V4 : cadre blanc liseré et ombré, lisible sur les facettes grises du bandeau ;
  // pastille en dégradé magenta → prune, comme les boutons d'action principale
  v4: { type: Boolean, default: false }
})

const { METIERS } = useMetier()
const items = computed(() => (props.metiers ? METIERS.filter((m) => props.metiers.includes(m.code)) : METIERS))
const activeIndex = computed(() => Math.max(0, items.value.findIndex((m) => m.code === model.value)))
const btnSize = computed(() => (props.size === 'sm' ? 'px-2 py-1.5 text-xs' : 'px-5 py-2 text-sm'))

// Classes du cadre, de la pastille et des options : ancien habillage ou V4
const ui = computed(() =>
  props.v4
    ? {
        cadre:
          'dark:bg-night-900 bg-white ring-1 ring-slate-300 shadow-[0_1px_2px_rgb(43_4_35/0.08),0_10px_22px_-14px_rgb(43_4_35/0.45)] dark:ring-white/20',
        pastille:
          'from-magenta-500 via-prune-500 to-prune-700 bg-linear-90 shadow-[0_4px_10px_-4px_rgb(43_4_35/0.6)]',
        option: 'cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-secondary-500',
        inactif: 'text-ink-soft hover:text-ink hover:bg-slate-100 dark:hover:bg-white/8'
      }
    : {
        cadre: 'bg-slate-100 dark:bg-slate-800',
        pastille: 'bg-linear-to-r from-secondary-400 to-secondary-600 shadow-sm ring-1 ring-secondary-300/40',
        option: '',
        inactif: 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
      }
)
</script>

<template>
  <div
    class="relative grid rounded-lg p-1"
    :class="ui.cadre"
    :style="{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }"
  >
    <!-- Pastille colorée glissante -->
    <span
      class="pointer-events-none absolute inset-y-1 left-1 rounded-md transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
      :class="ui.pastille"
      :style="{ width: `calc((100% - 0.5rem) / ${items.length})`, transform: `translateX(${activeIndex * 100}%)` }"
    />
    <button
      v-for="m in items"
      :key="m.code"
      type="button"
      class="relative z-10 truncate rounded-md text-center font-semibold transition-colors duration-200"
      :class="[btnSize, ui.option, model === m.code ? 'text-white' : ui.inactif]"
      :aria-pressed="model === m.code"
      @click="model = m.code"
    >
      {{ m.label }}
    </button>
  </div>
</template>
