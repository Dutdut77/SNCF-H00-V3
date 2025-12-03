<template>
  <div class="w-full">
    <!-- Step Navigation Bar -->
    <nav aria-label="Progress">
      <ol class="flex items-center justify-between">
        <li
          v-for="(step, index) in steps"
          :key="index"
          :class="['relative flex-1', index !== steps.length - 1 ? 'pr-8 sm:pr-20' : '']">
          <!-- Connector Line -->
          <div
            v-if="index !== steps.length"
            class="absolute top-5 right-0 left-0 -mr-8 w-full sm:-mr-20"
            aria-hidden="true">
            <div class="h-0.5 w-full bg-gray-200 dark:bg-gray-700">
              <div
                :class="[
                  'h-0.5 transition-all duration-500 ease-out',
                  index < currentStep ? 'bg-primary-600 dark:bg-primary-500' : 'bg-gray-200 dark:bg-gray-700'
                ]"
                :style="{ width: index < currentStep ? '100%' : '0%' }"></div>
            </div>
          </div>

          <!-- Step Button -->
          <button
            @click="goToStep(index)"
            :disabled="!isStepAccessible(index)"
            class="w-full"
            :class="[
              'group relative flex flex-col items-center transition-all duration-300',
              isStepAccessible(index) ? 'cursor-pointer' : 'cursor-not-allowed'
            ]">
            <!-- Step Circle -->
            <div
              :class="[
                'flex h-10 w-10 transform items-center justify-center rounded-full border-2 transition-all duration-300',
                getStepClasses(index),
                currentStep === index && 'scale-110 shadow-lg',
                isStepAccessible(index) && 'group-hover:scale-105'
              ]">
              <!-- Completed Icon -->
              <svg
                v-if="index < currentStep"
                class="h-5 w-5 text-white transition-transform duration-300"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor">
                <path
                  fill-rule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clip-rule="evenodd" />
              </svg>

              <!-- Current/Future Step Number -->
              <span v-else :class="['text-sm font-semibold transition-colors duration-300', getStepTextClasses(index)]">
                {{ index + 1 }}
              </span>
            </div>

            <!-- Step Label -->
            <span
              :class="[
                'mt-2 text-center text-xs font-medium transition-colors duration-300 sm:text-sm',
                currentStep === index
                  ? 'text-primary-600 dark:text-primary-500'
                  : index < currentStep
                    ? 'text-gray-900 dark:text-gray-100'
                    : 'text-gray-500 dark:text-gray-400'
              ]">
              {{ step.label }}
            </span>

            <!-- Optional Step Description -->
            <span
              v-if="step.description"
              class="mt-1 hidden text-center text-xs text-gray-500 sm:block dark:text-gray-400">
              {{ step.description }}
            </span>
          </button>
        </li>
      </ol>
    </nav>

    <!-- Step Content -->
    <div class="mt-8 sm:mt-12">
      <Transition :name="transitionName" mode="out-in">
        <div :key="currentStep" class="min-h-[200px]">
          <slot :name="`step-${currentStep}`" :step="steps[currentStep]" :stepIndex="currentStep">
            <!-- Default content -->
            <div class="text-center text-gray-500 dark:text-gray-400">
              Contenu de l'étape {{ steps[currentStep]?.label }}
            </div>
          </slot>
        </div>
      </Transition>
    </div>

    <!-- Navigation Buttons -->
    <div class="mt-8 flex items-center justify-between">
      <button
        @click="previousStep"
        :disabled="currentStep === 0"
        :class="[
          'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-300',
          currentStep === 0
            ? 'cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600'
            : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:shadow-md dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
        ]">
        <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path
            fill-rule="evenodd"
            d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
            clip-rule="evenodd" />
        </svg>
        Précédent
      </button>

      <div class="text-sm text-gray-600 dark:text-gray-400">Étape {{ currentStep + 1 }} sur {{ steps.length }}</div>

      <button
        v-if="currentStep < steps.length - 1"
        @click="nextStep"
        class="inline-flex transform items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-all duration-300 hover:scale-105 hover:bg-blue-700 hover:shadow-lg dark:bg-blue-500 dark:hover:bg-blue-600">
        Suivant
        <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path
            fill-rule="evenodd"
            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
            clip-rule="evenodd" />
        </svg>
      </button>

      <button
        v-else
        @click="completeSteps"
        class="inline-flex transform items-center gap-2 rounded-lg bg-green-600 px-6 py-2 text-sm font-medium text-white transition-all duration-300 hover:scale-105 hover:bg-green-700 hover:shadow-lg dark:bg-green-500 dark:hover:bg-green-600">
        <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path
            fill-rule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clip-rule="evenodd" />
        </svg>
        Terminer
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Step {
  label: string
  description?: string
}

interface Props {
  steps: Step[]
  allowSkip?: boolean
  initialStep?: number
}

const props = withDefaults(defineProps<Props>(), {
  allowSkip: false,
  initialStep: 0
})

const emit = defineEmits<{
  'update:currentStep': [step: number]
  complete: []
  'step-change': [from: number, to: number]
}>()

const currentStep = ref(props.initialStep)
const previousStepIndex = ref(props.initialStep)

const transitionName = computed(() => {
  return currentStep.value > previousStepIndex.value ? 'slide-left' : 'slide-right'
})

const isStepAccessible = (index: number): boolean => {
  if (props.allowSkip) return true
  return index <= currentStep.value
}

const getStepClasses = (index: number): string => {
  if (index < currentStep.value) {
    return 'border-primary-600 bg-blue-600 dark:border-primary-500 dark:bg-primary-500'
  } else if (index === currentStep.value) {
    return 'border-primary-600 bg-white dark:border-primary-500 dark:bg-gray-800'
  } else {
    return 'border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800'
  }
}

const getStepTextClasses = (index: number): string => {
  if (index === currentStep.value) {
    return 'text-primary-600 dark:text-primary-500'
  } else {
    return 'text-gray-500 dark:text-gray-400'
  }
}

const goToStep = (index: number) => {
  if (!isStepAccessible(index)) return

  previousStepIndex.value = currentStep.value
  emit('step-change', currentStep.value, index)
  currentStep.value = index
  emit('update:currentStep', index)
}

const nextStep = () => {
  if (currentStep.value < props.steps.length - 1) {
    goToStep(currentStep.value + 1)
  }
}

const previousStep = () => {
  if (currentStep.value > 0) {
    goToStep(currentStep.value - 1)
  }
}

const completeSteps = () => {
  emit('complete')
}

// Expose methods for parent component
defineExpose({
  currentStep,
  nextStep,
  previousStep,
  goToStep
})
</script>

<style scoped>
/* Slide left transition */
.slide-left-enter-active,
.slide-left-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-left-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

/* Slide right transition */
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-right-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.slide-right-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
