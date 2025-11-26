<script setup>


const props = defineProps({
  closeModal: {
    type: Function,
  },
});
</script>

<template>
  <section>
    <Teleport to="body">
      <div class="absolute top-0 right-0 z-50 backdrop-blur-sm bg-slate-800/80 w-full h-full overflow-hidden" @click="props.closeModal()">
        <div class="w-full h-full flex justify-center items-center p-4">
          <div class="relative w-full p-4 md:w-1/2 max-h-full bg-white rounded-lg border border-gray-300 shadow-md animate__animated animate__fadeIn flex flex-col overflow-hidden" @click.stop>
            <p class="absolute top-2 left-3 font-medium font-traverse text-3xl text-gray-700 animate__animated animate__jackInTheBox first-letter:text-sncf-primary">H00</p>

            <p class="absolute top-4 right-5 hover:text-sncf-primary cursor-pointer text-gray-600" @click="props.closeModal()"><Icon name="uil:github" style="color: black" /></p>
            <div class="w-full h-full flex flex-col justify-center items-center pt-10 gap-8 overflow-auto">
              <slot name="title"></slot>

              <slot name="default"></slot>

              <slot name="footer"></slot>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </section>
</template>

<style></style>
