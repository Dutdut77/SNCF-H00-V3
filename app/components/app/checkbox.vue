<script setup lang="js">
const props = defineProps({
  value: { default: null }, // pour multiselect
  label: { default: '' },
  disabled: { default: false }
})

const model = defineModel({ default: false }) // boolean ou array

const isChecked = computed(() => {
  if (Array.isArray(model.value)) {
    return model.value.includes(props.value)
  }
  return model.value
})

const toggle = () => {
  if (props.disabled) return
  if (Array.isArray(model.value)) {
    const newValue = [...model.value]
    const index = newValue.indexOf(props.value)
    if (index > -1) newValue.splice(index, 1)
    else newValue.push(props.value)
    model.value = newValue
  } else {
    model.value = !model.value
  }
}
</script>

<template>
  <label class="flex cursor-pointer items-center gap-2 select-none">
    <input type="checkbox" class="peer sr-only" :checked="isChecked" @change="toggle" />

    <div
      class="flex h-4 w-4 items-center justify-center rounded border"
      :class="isChecked ? 'bg-primary-500 border-primary-500' : 'border-gray-300 bg-white'">
      <Icon v-if="isChecked" name="lucide:check" size="14" class="text-white" />
    </div>
    <span v-if="props.label" class="text-sm text-gray-700 dark:text-gray-300">
      {{ props.label }}
    </span>
  </label>
</template>
