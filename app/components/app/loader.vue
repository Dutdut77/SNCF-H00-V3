<script setup>
const { loading } = useLoader()
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <section v-if="loading" class="fixed inset-0 z-100 flex items-center justify-center print:hidden">
        <!-- Fond avec effet -->
        <div
          class="from-primary-800/20 via-primary-800/10 absolute inset-0 bg-radial-[at_50%_50%] to-white backdrop-blur-xl" />

        <!-- Contenu du loader -->
        <div class="relative flex flex-col items-center gap-6">
          <!-- Cercle animé -->
          <div class="relative">
            <!-- Cercle externe qui tourne -->
            <div
              class="border-secondary-900/20 border-t-secondary-900/80 h-48 w-48 animate-spin rounded-full border-4" />

            <!-- Cercle interne avec pulsation -->
            <div class="absolute inset-2 flex items-center justify-center rounded-full bg-white/80 shadow-lg">
              <img src="/images/logo_uo.png" alt="Logo" class="w-40" />
            </div>
          </div>

          <!-- Texte -->
          <div class="flex flex-col items-center gap-1">
            <p class="font-[Pacifico] text-3xl text-slate-800">H00 Travaux</p>
            <p class="animate-pulse pl-3 text-sm text-slate-600">Chargement en cours...</p>
          </div>

          <!-- Points de chargement -->
          <div class="flex gap-1.5">
            <span class="h-2 w-2 animate-bounce rounded-full bg-emerald-900" style="animation-delay: 0ms" />
            <span class="h-2 w-2 animate-bounce rounded-full bg-emerald-800" style="animation-delay: 150ms" />
            <span class="h-2 w-2 animate-bounce rounded-full bg-emerald-700" style="animation-delay: 300ms" />
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
