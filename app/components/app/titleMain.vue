<script setup>
const props = defineProps({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  }
})
</script>

<template>
  <div>
    <p class="font-[Pacifico] text-3xl font-semibold text-gray-800">{{ props.title }}</p>
    <p class="text-muted mt-1 pl-1 text-sm text-gray-700 italic">{{ props.description }}</p>
  </div>
</template>
