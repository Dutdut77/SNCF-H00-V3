<script setup lang="ts">
const { isDark } = useDarkMode()
</script>

<template>
  <button
    @click="isDark = !isDark"
    class="border-primary-200 flex h-fit w-full cursor-pointer items-center justify-center rounded-full p-2 transition-all duration-200 hover:shadow-lg"
    :aria-label="isDark ? 'Activer le mode jour' : 'Activer le mode nuit'">
    <Icon v-if="!isDark" name="ph:moon-stars-fill" size="20" class="text-primary-700" />

    <Icon v-else name="ph:sun-fill" size="20" class="text-amber-400" />
  </button>
</template>
