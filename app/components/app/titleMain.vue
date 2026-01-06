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
    <p class="text-primary-800 font-[Bangers] text-3xl font-semibold">{{ props.title }}</p>
    <p class="text-primary-700 -mt-1 text-base italic">{{ props.description }}</p>
  </div>
</template>
