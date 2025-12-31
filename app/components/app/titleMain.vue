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
    <p class="text-primary-800 font-[Pacifico] text-3xl font-semibold">{{ props.title }}</p>
    <p class="text-muted text-primary-700 mt-1 pl-1 text-sm italic">{{ props.description }}</p>
  </div>
</template>
