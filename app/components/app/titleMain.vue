<script setup>
const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
});
</script>

<template>
  <div>
    <p class="font-semibold text-3xl font-[Pacifico]">{{ props.title }}</p>
    <p class="text-muted text-sm italic">{{ props.description }}</p>
  </div>
</template>
