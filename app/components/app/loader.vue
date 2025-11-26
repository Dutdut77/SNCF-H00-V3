<script setup>
const { loading } = useLoader();
</script>

<template>
  <Teleport to="body">
    <section v-if="loading" class="h-dvh w-dvw absolute z-70 top-0 left-0 backdrop-blur-lg bg-white/10 print:hidden">
      <div class="flex justify-center items-center h-full pb-16">
        <div class="relative h-40 w-40 rounded-full flex justify-center">
          <div class="absolute w-44 h-44 -mt-2 border-t-4 border-l-4 border-sncf-pomme/80 rounded-full animate-spin"></div>
          <div class="pt-6 font-traverse text-gray-600 first-letter:text-sncf-primary text-4xl tracking-widest">H00</div>
          <div class="absolute inset-0 -z-10 rounded-full overflow-hidden">
            <!-- <img class="w-80 pt-8" src="@/assets/img/fond.png" alt="motrice SNCF" /> -->
          </div>
        </div>

      </div>
    </section>
  </Teleport>
</template>

<style></style>
