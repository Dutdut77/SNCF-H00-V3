<script setup>
// Exemple :
// <AppInput name="email" type="email" title="Email : " placeholder="Entrez votre email professionel" v-model="formValue.email" />

import { computed } from 'vue'

const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  name: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'text'
  },
  placeholder: {
    type: String,
    default: 'Entrez votre texte'
  },
  modelValue: {
    default: null
  },
  required: {
    type: Boolean,
    default: false
  }
})

const emits = defineEmits(['update:model-value'])

const inputValue = computed({
  get() {
    return props.modelValue
  },
  set(value) {
    emits('update:model-value', value)
  }
})
</script>
<template>
  <div class="w-full break-inside-avoid">
    <label :for="props.name" class="block text-sm">
      {{ props.title }}
      <span v-if="props.required" class="text-red-500">*</span>
    </label>
    <div class="mt-0.5">
      <input
        class="focus:border-primary-500 focus:ring-primary-500 border-primary-300 text-primary-700 w-full appearance-none rounded-md border px-2 py-1.5 text-sm leading-tight focus:ring-1 focus:outline-none"
        autocomplete="off"
        :placeholder="props.placeholder"
        :id="props.name"
        :name="props.name"
        :type="props.type"
        :value="props.modelValue"
        v-model="inputValue" />
    </div>
  </div>
</template>

<style></style>
