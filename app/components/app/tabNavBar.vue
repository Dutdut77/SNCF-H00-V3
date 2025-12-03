<template>
  <div class="w-full">
    <!-- Tab Navigation Bar -->
    <div class="border-b border-gray-200 dark:border-gray-700">
      <nav class="-mb-px flex space-x-8" aria-label="Tabs">
        <button
          v-for="(tab, index) in tabs"
          :key="index"
          @click="activeTab = index"
          :class="[
            'relative border-b-2 px-1 py-4 text-sm font-medium whitespace-nowrap transition-all duration-300 ease-in-out',
            activeTab === index
              ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-500'
              : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          ]">
          {{ tab.label }}

          <!-- Active indicator with smooth animation -->
          <span
            v-if="activeTab === index"
            class="animate-scale-in absolute right-0 bottom-0 left-0 h-0.5 bg-blue-600 dark:bg-blue-500"></span>
        </button>
      </nav>
    </div>

    <!-- Tab Content with smooth transition -->
    <div class="relative mt-6">
      <Transition :name="transitionName" mode="out-in">
        <div :key="activeTab" class="transition-all duration-300">
          <slot :name="`tab-${activeTab}`" :tab="tabs[activeTab]">
            <!-- Default content if no slot provided -->
            <div class="text-gray-500 dark:text-gray-400">Contenu du tab {{ tabs[activeTab]?.label }}</div>
          </slot>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Tab {
  label: string
  icon?: string
}

interface Props {
  tabs: Tab[]
  defaultTab?: number
}

const props = withDefaults(defineProps<Props>(), {
  defaultTab: 0
})

const activeTab = ref(props.defaultTab)
const previousTab = ref(props.defaultTab)

const transitionName = computed(() => {
  return activeTab.value > previousTab.value ? 'slide-left' : 'slide-right'
})

// Watch for tab changes to update previousTab
watch(activeTab, (newVal, oldVal) => {
  previousTab.value = oldVal
})

// Expose activeTab for parent component access
defineExpose({
  activeTab
})
</script>

<style scoped>
/* Fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Slide left transition */
.slide-left-enter-active,
.slide-left-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-left-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

/* Slide right transition */
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-right-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.slide-right-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

/* Scale in animation for active indicator */
@keyframes scale-in {
  from {
    transform: scaleX(0);
  }
  to {
    transform: scaleX(1);
  }
}

.animate-scale-in {
  animation: scale-in 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
