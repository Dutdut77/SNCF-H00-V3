<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  steps: {
    type: Array,
    required: true
  },
  initialStep: {
    type: Number,
    default: 0
  },
  showButtons: {
    type: Boolean,
    default: true
  },
  validateStep: {
    type: Function,
    default: null
  }
})

const emit = defineEmits(['update:currentStep', 'complete', 'step-change'])

const currentStep = ref(props.initialStep)
const previousStepIndex = ref(props.initialStep)
const visitedSteps = ref(new Set([props.initialStep])) // Track all visited steps

const canGoToNextStep = computed(() => {
  if (!props.validateStep) return true
  return props.validateStep(currentStep.value)
})

const transitionName = computed(() => {
  return currentStep.value > previousStepIndex.value ? 'slide-left' : 'slide-right'
})

const getStepClasses = (index) => {
  if (index < currentStep.value) {
    return 'border-primary-600 bg-primary-600 dark:border-primary-500 dark:bg-primary-500'
  } else if (index === currentStep.value) {
    return 'border-primary-600 bg-white dark:border-primary-500 dark:bg-gray-800'
  } else {
    return 'border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800'
  }
}

const getStepTextClasses = (index) => {
  if (index === currentStep.value) {
    return 'text-primary-600 dark:text-primary-500'
  } else {
    return 'text-gray-500 dark:text-gray-400'
  }
}

// Nouvelle fonction pour vérifier si un step est cliquable
const isStepClickable = (index) => {
  // L'étape courante est toujours cliquable (mais ne fait rien)
  if (index === currentStep.value) {
    return true
  }

  // On peut naviguer vers toutes les étapes déjà visitées
  if (visitedSteps.value.has(index)) {
    return true
  }

  // On peut aller à l'étape suivante si l'étape courante est valide
  if (index === currentStep.value + 1) {
    return canGoToNextStep.value
  }

  // On ne peut pas sauter des étapes non visitées
  return false
}

const goToStep = (index) => {
  if (!isStepClickable(index)) {
    return
  }

  previousStepIndex.value = currentStep.value

  // Mark this step as visited
  visitedSteps.value.add(index)

  emit('step-change', currentStep.value, index)
  currentStep.value = index
  emit('update:currentStep', index)
}

const nextStep = (index) => {
  // Si un index est passé en paramètre (clic sur un step)
  if (typeof index === 'number') {
    goToStep(index)
    return
  }

  // Sinon, comportement normal du bouton "Suivant"
  if (currentStep.value < props.steps.length - 1) {
    const isValid = props.validateStep ? props.validateStep(currentStep.value) : true
    if (isValid) {
      goToStep(currentStep.value + 1)
    }
  }
}

const previousStep = () => {
  if (currentStep.value > 0) {
    goToStep(currentStep.value - 1)
  }
}

const completeSteps = () => {
  const isValid = props.validateStep ? props.validateStep(currentStep.value) : true
  if (isValid) {
    emit('complete')
  }
}

// Expose methods for parent component
defineExpose({
  currentStep,
  nextStep,
  previousStep,
  goToStep
})
</script>

<template>
  <div class="flex w-full flex-col">
    <!-- Step Navigation Bar -->
    <nav aria-label="Progress">
      <ol class="mx-auto flex items-center justify-between">
        <li
          v-for="(step, index) in props.steps"
          :key="index"
          :class="['relative flex-1', index !== props.steps.length - 1 ? 'pr-8 sm:pr-20' : '']">
          <!-- Connector Line -->
          <div
            v-if="index !== props.steps.length"
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
            type="button"
            @click="nextStep(index)"
            :disabled="!isStepClickable(index)"
            class="w-full"
            :class="[
              'group relative flex flex-col items-center transition-all duration-300',
              isStepClickable(index) ? 'cursor-pointer' : 'cursor-not-allowed'
            ]"
            data-step-button="true">
            <!-- Step Circle -->
            <div
              :class="[
                'flex h-10 w-10 transform items-center justify-center rounded-full border-2 transition-all duration-300',
                getStepClasses(index),
                currentStep === index && 'scale-110 shadow-lg',
                isStepClickable(index) && 'group-hover:scale-105'
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
    <div class="pt-12">
      <Transition :name="transitionName" mode="out-in">
        <div :key="currentStep" class="min-h-[200px]">
          <slot :name="`step-${currentStep}`" :step="steps[currentStep]" :stepIndex="currentStep">
            <!-- Default content -->
            <div class="flex text-center text-gray-500 dark:text-gray-400">
              Contenu de l'étape {{ steps[currentStep]?.label }}
            </div>
          </slot>
        </div>
      </Transition>
    </div>

    <!-- Navigation Buttons -->
    <div
      v-if="showButtons"
      class="mt-auto flex items-center justify-between border-t border-gray-200 pt-4 dark:border-gray-700">
      <button
        @click.stop="previousStep"
        :disabled="currentStep === 0"
        :class="[
          'inline-flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-300',
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
        :disabled="!canGoToNextStep"
        :class="[
          'text-shadow-xl relative inline-flex h-auto rounded-lg px-4 py-2 text-center text-sm font-medium duration-300',
          canGoToNextStep
            ? 'hover:shadow-primary-500/30 from-primary-400 to-primary-600 cursor-pointer bg-linear-to-br text-white hover:shadow-lg'
            : 'cursor-not-allowed bg-gray-200 text-gray-600'
        ]">
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
        :disabled="!canGoToNextStep"
        :class="[
          'inline-flex transform items-center gap-2 rounded-lg px-6 py-2 text-sm font-medium text-white transition-all duration-300',
          canGoToNextStep
            ? 'bg-green-600 hover:scale-105 hover:bg-green-700 hover:shadow-lg dark:bg-green-500 dark:hover:bg-green-600'
            : 'cursor-not-allowed bg-gray-300 dark:bg-gray-600'
        ]">
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

<style scoped>
/* Slide left transition */
.slide-left-enter-active,
.slide-left-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-left-enter-from {
  opacity: 1;
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
