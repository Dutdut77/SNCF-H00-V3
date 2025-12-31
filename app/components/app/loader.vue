<script setup>
const { loading } = useLoader()
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <section v-if="loading" class="fixed inset-0 z-100 flex items-center justify-center print:hidden">
        <!-- Fond avec effet -->
        <div class="absolute inset-0 bg-white/10 backdrop-blur-lg dark:bg-black" />

        <!-- Contenu du loader -->
        <div class="relative flex flex-col items-center gap-6">
          <!-- Cercle animé -->
          <div class="relative">
            <!-- Cercle externe qui tourne -->
            <div class="border-primary-900/20 border-t-primary-900/80 h-48 w-48 animate-spin rounded-full border-4" />

            <!-- Cercle interne avec pulsation -->
            <div class="absolute inset-2 flex items-center justify-center rounded-full bg-white/80 shadow-lg">
              <img src="/images/logo_uo.png" alt="Logo" class="w-40" />
            </div>
          </div>

          <!-- Texte -->
          <div class="flex flex-col items-center gap-1">
            <p class="text-primary-800 font-[Pacifico] text-3xl">H00 Travaux</p>
            <p class="text-primary-600 animate-pulse pl-3 text-sm">Chargement en cours...</p>
          </div>

          <!-- Points de chargement -->
          <div class="flex gap-1.5">
            <span class="bg-primary-900 h-2 w-2 animate-bounce rounded-full" style="animation-delay: 0ms" />
            <span class="bg-primary-800 h-2 w-2 animate-bounce rounded-full" style="animation-delay: 150ms" />
            <span class="bg-primary-700 h-2 w-2 animate-bounce rounded-full" style="animation-delay: 300ms" />
          </div>
        </div>
      </section>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
