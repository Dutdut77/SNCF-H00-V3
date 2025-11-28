<script setup>
// Exemple :
// <AppInputSearch v-model="globalFilter" placeholder="Rechercher un utilisateur..." />

const props = defineProps({
  placeholder: {
    type: String,
    default: "Rechercher",
  },
});

const model = defineModel({ default: "" });

const clearInput = () => {
  model.value = "";
};
</script>

<template>
  <div class="w-full break-inside-avoid">
    <div class="relative text-gray-600 focus-within:text-gray-400">
      <!-- Icône loupe à gauche -->
      <span class="absolute inset-y-0 left-0 text-gray-400 flex items-center pl-3">
        <Icon name="i-lucide-search" size="20" />
      </span>

      <!-- Input -->
      <input
        type="text"
        name="search"
        v-model="model"
        :placeholder="props.placeholder"
        autocomplete="off"
        class="h-12 pl-11 pr-10 bg-transparent border-b border-gray-300 text-sm py-2 w-full text-gray-700 focus:outline-none focus:border-primary-500 focus:ring-0 placeholder:text-gray-400"
      />

      <!-- Bouton croix pour effacer -->
      <Transition name="fade">
        <button
          v-if="model"
          type="button"
          @click="clearInput"
          class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-red-500 transition-colors duration-200 cursor-pointer"
          title="Effacer la recherche"
        >
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
