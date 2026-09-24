<script setup>
// Interrupteur en ligne (design V4) : toute la ligne bascule, libellé et explication à côté.
const model = defineModel({ type: Boolean, default: false })

const props = defineProps({
  label: { type: String, required: true },
  description: { type: String, default: '' },
  // Icône facultative devant le libellé, et sa couleur quand l'interrupteur est actif
  icon: { type: String, default: '' },
  iconClass: { type: String, default: '' }
})
</script>

<template>
  <button
    type="button"
    role="switch"
    :aria-checked="!!model"
    class="flex w-full cursor-pointer items-center gap-3 rounded-lg bg-slate-50 px-3.5 py-3 text-left transition-colors hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/8"
    @click="model = !model">
    <span
      class="relative h-6 w-11 shrink-0 rounded-full transition-colors"
      :class="model ? 'bg-magenta-700 dark:bg-secondary-500' : 'bg-slate-300 dark:bg-white/20'">
      <span
        class="absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform"
        :class="{ 'translate-x-5': model }" />
    </span>
    <span class="min-w-0 flex-1">
      <span class="text-ink flex items-center gap-1.5 text-sm font-medium">
        <Icon
          v-if="props.icon"
          :name="props.icon"
          size="16"
          class="shrink-0"
          :class="model ? props.iconClass : 'text-slate-400 dark:text-slate-500'" />
        {{ props.label }}
      </span>
      <span v-if="props.description" class="text-ink-soft block text-xs">{{ props.description }}</span>
    </span>
  </button>
</template>
