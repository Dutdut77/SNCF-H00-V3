<script setup>
// Exemple :
// <AppInputSearch v-model="globalFilter" placeholder="Rechercher un utilisateur..." />

const props = defineProps({
  placeholder: {
    type: String,
    default: 'Rechercher'
  },
  // Champ encadré sur fond blanc au lieu du simple soulignement transparent.
  // Par défaut à false : les 17 usages existants gardent leur apparence.
  boxed: {
    type: Boolean,
    default: false
  }
})

const model = defineModel({ default: '' })

const champClass = computed(() =>
  props.boxed
    ? 'rounded-lg border bg-white focus:border-secondary-400 dark:bg-slate-900'
    : 'border-b bg-transparent focus:border-primary-500'
)

const clearInput = () => {
  model.value = ''
}
</script>

<template>
  <div class="w-full break-inside-avoid">
    <div class="text-primary-600 focus-within:text-primary-400 relative">
      <!-- Icône loupe à gauche -->
      <span class="text-primary-700 absolute inset-y-0 left-0 flex items-center pl-3">
        <Icon name="i-lucide-search" size="20" />
      </span>

      <!-- Input -->
      <input
        type="text"
        name="search"
        v-model="model"
        :placeholder="props.placeholder"
        autocomplete="off"
        class="border-primary-300 text-primary-700 placeholder:text-primary-600 h-12 w-full py-2 pr-10 pl-11 text-sm focus:ring-0 focus:outline-none"
        :class="champClass" />

      <!-- Bouton croix pour effacer -->
      <Transition name="fade">
        <button
          v-if="model"
          type="button"
          @click="clearInput"
          class="text-primary-400 absolute inset-y-0 right-0 flex cursor-pointer items-center pr-3 transition-colors duration-200 hover:text-red-500"
          title="Effacer la recherche">
          <Icon name="i-lucide-x" size="18" />
        </button>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
