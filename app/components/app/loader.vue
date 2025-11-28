<script setup>
const { loading } = useLoader();
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <section 
        v-if="loading" 
        class="fixed inset-0 z-100 flex items-center justify-center print:hidden"
      >
        <!-- Fond avec effet -->
        <div class="absolute inset-0 bg-radial-[at_50%_50%] from-white via-primary-50 to-primary-100 backdrop-blur-sm" />
        
        <!-- Contenu du loader -->
        <div class="relative flex flex-col items-center gap-6">
          
          <!-- Cercle animé -->
          <div class="relative">
            <!-- Cercle externe qui tourne -->
            <div class="w-24 h-24 rounded-full border-4 border-primary-200 border-t-primary-500 animate-spin" />
            
            <!-- Cercle interne avec pulsation -->
            <div class="absolute inset-2 rounded-full bg-white/80 shadow-lg animate-pulse flex items-center justify-center">
              <Icon name="lucide:train-front" class=" text-primary-500" size="40"/>
            </div>
          </div>
          
          <!-- Texte -->
          <div class="flex flex-col items-center gap-1">
            <p class="font-[Pacifico] text-3xl text-slate-700">H00 Travaux</p>
            <p class="text-sm text-slate-500 animate-pulse">Chargement en cours...</p>
          </div>
          
          <!-- Points de chargement -->
          <div class="flex gap-1.5">
            <span class="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style="animation-delay: 0ms;" />
            <span class="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style="animation-delay: 150ms;" />
            <span class="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style="animation-delay: 300ms;" />
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
