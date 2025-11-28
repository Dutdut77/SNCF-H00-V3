<script setup>
const props = defineProps(["closeSideModal"]);
</script>

<template>
  <div class="relative flex justify-start w-full h-dvh min-h-dvh  text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 shadow-2xl">
    <div 
      class="cursor-pointer h-12 w-12 bg-linear-to-tl from-primary-400 to-primary-500 hover:shadow-lg hover:scale-105 flex duration-300 justify-center items-center absolute top-8 -left-6 rounded-xl" 
      @click="props.closeSideModal()"
    >
      <Icon name="lucide:x" size="20" class="text-white" />
    </div>
    <div class="relative flex flex-col justify-start items-center gap-4 w-full h-full p-6 overflow-auto">
      <div class="w-full flex flex-col items-center gap-2"><slot name="header"></slot></div>
      <div class="w-full flex flex-col grow"><slot name="default"></slot></div>
      <div class="w-full mt-auto "><slot name="footer"></slot></div>
    </div>
  </div>
</template>

<style></style>
