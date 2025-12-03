<template>
  <div class="flex w-full flex-col items-center justify-center">
    <!-- TabBar -->
    <div
      class="from-primary-400 to-primary-600 flex w-fit  divide-gray-400 overflow-hidden rounded-lg bg-linear-to-br text-sm">
      <div
        v-for="(tab, index) in tabs"
        :key="tab.key"
        @click="selectTab(index)"
        class="relative flex cursor-pointer items-center gap-2 px-6 py-3 font-semibold transition-all duration-300 h-full "
        :class="index === activeIndex ? 'scale-110 font-bold  shadow-lg' : ' ', 
        index <= activeIndex ? ' bg-transparent text-white ' : 'bg-gray-200 text-gray-800'">
        <!-- Icon -->
        <Icon :name="tab.icon" class="h-5 w-5"></Icon>
        <span>{{ tab.label }}</span>

        <!-- Pointe -->
        <div
          v-if="index < tabs.length - 1"
          class="absolute top-0 right-0 h-0 w-0 border-t-8 border-b-8 border-t-transparent border-b-transparent transition-all duration-300"
          :class="tab.arrowColor"></div>
      </div>
    </div>

    <!-- Content -->
    <transition name="fade" mode="out-in">
      <div :key="currentTab.key" class="animate-fadeIn mt-8 w-full rounded-xl border bg-white p-6 shadow">
        <h2 class="mb-4 flex items-center gap-2 text-2xl font-bold">
          <Icon :name="currentTab.icon" class="h-6 w-6" />
          {{ currentTab.label }}
        </h2>
        <p class="mb-6 text-gray-700">Contenu d'exemple pour l'onglet "{{ currentTab.label }}".</p>

        <button
          v-if="activeIndex < tabs.length - 1"
          @click="nextTab"
          class="rounded-lg bg-blue-600 px-4 py-2 text-white transition-all duration-200 hover:bg-blue-700">
          Suivant
        </button>

        <button
          v-else
          class="rounded-lg bg-green-600 px-4 py-2 text-white transition-all duration-200 hover:bg-green-700">
          Terminer
        </button>
      </div>
    </transition>
  </div>
</template>

<script setup>
const tabs = [
  {
    key: 'generality',
    label: 'Généralités',
    icon: 'lucide:home'
  },
  {
    key: 'weekend',
    label: 'Week-end',
    icon: 'lucide:calendar-days'
  },
  {
    key: 'contacts',
    label: 'Contacts',
    icon: 'lucide:users'
  },
  {
    key: 'recap',
    label: 'Récapitulatif',
    icon: 'lucide:check-circle'
  }
]

const activeIndex = ref(0)

const selectTab = (index) => {
  activeIndex.value = index
}

const nextTab = () => {
  if (activeIndex.value < tabs.length - 1) activeIndex.value++
}

const currentTab = computed(() => tabs[activeIndex.value])
</script>

<style scoped>
/* Pointe des tabs */
.border-l-red-500 {
  border-left-color: rgb(239 68 68);
}
.border-l-blue-500 {
  border-left-color: rgb(59 130 246);
}
.border-l-yellow-500 {
  border-left-color: rgb(234 179 8);
}
.border-l-green-500 {
  border-left-color: rgb(34 197 94);
}

/* Fade animation */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Content animation */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-fadeIn {
  animation: fadeIn 0.3s ease;
}
</style>
