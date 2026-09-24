<script setup>
const model = defineModel({ default: false })

const props = defineProps({
  label: {
    type: String,
    default: ''
  },
  name: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  },
  labelPosition: {
    type: String,
    default: 'right' // 'left' | 'right'
  }
})

const inputId = computed(() => props.name || `switch-${Math.random().toString(36).substr(2, 9)}`)

const toggle = () => {
  if (!props.disabled) {
    model.value = !model.value
  }
}
</script>

<template>
  <label
    :for="inputId"
    class="inline-flex cursor-pointer items-center gap-3 select-none"
    :class="[
      props.disabled ? 'cursor-not-allowed opacity-50' : '',
      props.labelPosition === 'left' ? 'flex-row-reverse' : ''
    ]">
    <input
      type="checkbox"
      :id="inputId"
      :name="props.name"
      v-model="model"
      :disabled="props.disabled"
      class="peer sr-only" />

    <!-- Switch track -->
    <div
      class="relative h-6 w-11 rounded-full transition-colors duration-200"
      :class="[
        model ? 'bg-magenta-700 dark:bg-secondary-500' : 'bg-slate-300 dark:bg-white/20',
        !props.disabled && 'peer-focus:ring-secondary-500/30 peer-focus:ring-2'
      ]"
      @click.prevent="toggle">
      <!-- Switch thumb -->
      <div
        class="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200"
        :class="model ? 'translate-x-5.5' : 'translate-x-0.5'" />
    </div>

    <!-- Label -->
    <span v-if="props.label" class="text-sm text-gray-700 dark:text-gray-300">
      {{ props.label }}
    </span>
  </label>
</template>

<style></style>
