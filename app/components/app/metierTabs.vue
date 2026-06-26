<script setup>
// Sélecteur de métier (VOIE / SES / CAT) en segmented control avec pastille
// colorée glissante. v-model = le code métier actif.
//   <AppMetierTabs v-model="activeMetier" />            (barre large, taille md)
//   <AppMetierTabs v-model="activeMetier" size="sm" class="w-full" /> (sidebar)
const model = defineModel({ type: String })

const props = defineProps({
  size: { type: String, default: 'md' }, // 'sm' (sidebar) | 'md' (barre)
})

const { METIERS } = useMetier()
const activeIndex = computed(() => Math.max(0, METIERS.findIndex((m) => m.code === model.value)))
const btnSize = computed(() => (props.size === 'sm' ? 'px-2 py-1.5 text-xs' : 'px-5 py-2 text-sm'))
</script>

<template>
  <div
    class="relative grid rounded-lg bg-slate-100 p-1 dark:bg-slate-800"
    :style="{ gridTemplateColumns: `repeat(${METIERS.length}, minmax(0, 1fr))` }"
  >
    <!-- Pastille colorée glissante -->
    <span
      class="pointer-events-none absolute inset-y-1 left-1 rounded-md bg-linear-to-r from-secondary-400 to-secondary-600 shadow-sm ring-1 ring-secondary-300/40 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
      :style="{ width: `calc((100% - 0.5rem) / ${METIERS.length})`, transform: `translateX(${activeIndex * 100}%)` }"
    />
    <button
      v-for="m in METIERS"
      :key="m.code"
      type="button"
      class="relative z-10 truncate rounded-md text-center font-semibold transition-colors duration-200"
      :class="[btnSize, model === m.code
        ? 'text-white'
        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200']"
      @click="model = m.code"
    >
      {{ m.label }}
    </button>
  </div>
</template>
