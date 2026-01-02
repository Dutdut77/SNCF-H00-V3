<script setup>
const props = defineProps(['closeSideModal'])
</script>

<template>
  <div
    class="relative flex h-dvh min-h-dvh w-full justify-start bg-white text-gray-700 shadow-2xl dark:bg-gray-900 dark:text-gray-300">
    <div
      class="bg-primary-800 absolute top-8 -left-6 z-20 flex h-12 w-12 cursor-pointer items-center justify-center rounded-xl duration-300 hover:scale-105 hover:shadow-lg"
      @click="props.closeSideModal()">
      <Icon name="lucide:x" size="20" class="text-primary-50" />
    </div>
    <div class="relative flex h-full w-full flex-col items-center justify-start gap-4 overflow-auto p-6">
      <div class="flex w-full flex-col items-center gap-2"><slot name="header"></slot></div>
      <div class="flex w-full grow flex-col px-2"><slot name="default"></slot></div>
      <div class="mt-auto w-full"><slot name="footer"></slot></div>
    </div>
  </div>
</template>

<style></style>
