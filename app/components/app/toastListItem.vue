<script setup>
const props = defineProps({
  message: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'Info'
  },
  duration: {
    type: Number,
    default: 3000
  }
})

const emit = defineEmits(['remove'])

const color = computed(() => {
  if (props.type === 'Success') {
    return 'bg-green-100 text-green-500'
  }
  if (props.type === 'Info') {
    return 'bg-gray-100 text-gray-500'
  }
  if (props.type === 'Error') {
    return 'bg-red-100 text-red-500'
  }
  if (props.type === 'Warning') {
    return 'bg-yellow-100 text-yellow-500'
  }
  return 'bg-gray-100 text-gray-500'
})

const iconName = computed(() => {
  if (props.type === 'Success') {
    return 'lucide:check'
  }
  if (props.type === 'Info') {
    return 'lucide:info'
  }
  if (props.type === 'Error') {
    return 'lucide:x'
  }
  if (props.type === 'Warning') {
    return 'lucide:alert-triangle'
  }
  return 'lucide:info'
})

const progressColor = computed(() => {
  if (props.type === 'Success') {
    return 'bg-green-500'
  }
  if (props.type === 'Info') {
    return 'bg-gray-500'
  }
  if (props.type === 'Error') {
    return 'bg-red-500'
  }
  if (props.type === 'Warning') {
    return 'bg-yellow-500'
  }
  return 'bg-purple-500'
})

const progressWidth = ref(100)
const progressDuration = ref(props.duration)
const progressStyle = computed(() => ({
  width: `${progressWidth.value}%`,
  transitionDuration: `${progressDuration.value}ms`
}))

let timeoutId
let startTime = 0
const remaining = ref(props.duration)
const isPaused = ref(false)

const clearTimer = () => {
  if (timeoutId) {
    clearTimeout(timeoutId)
    timeoutId = undefined
  }
}

const removeToast = () => {
  clearTimer()
  emit('remove')
}

const startTimer = () => {
  startTime = performance.now()
  timeoutId = setTimeout(removeToast, remaining.value)
}

const startProgress = () => {
  progressDuration.value = remaining.value
  requestAnimationFrame(() => {
    progressWidth.value = 0
  })
}

const pauseToast = () => {
  if (isPaused.value || remaining.value <= 0) {
    return
  }
  isPaused.value = true
  clearTimer()
  const elapsed = performance.now() - startTime
  remaining.value = Math.max(0, remaining.value - elapsed)
  progressDuration.value = 0
  progressWidth.value = (remaining.value / props.duration) * 100
}

const resumeToast = () => {
  if (!isPaused.value || remaining.value <= 0) {
    return
  }
  isPaused.value = false
  startTimer()
  requestAnimationFrame(() => {
    progressDuration.value = remaining.value
    requestAnimationFrame(() => {
      progressWidth.value = 0
    })
  })
}

onMounted(() => {
  remaining.value = props.duration
  startProgress()
  startTimer()
})

onBeforeUnmount(() => {
  clearTimer()
})
</script>

<template>
  <div
    class="font-avenir text-primary-700 border-primary-200 bg-primary-50 relative z-100 flex w-full max-w-xs cursor-default items-center overflow-hidden rounded-lg border p-3 shadow-xl"
    @mouseenter="pauseToast"
    @mouseleave="resumeToast">
    <div class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" :class="color">
      <Icon v-if="iconName" :name="iconName" size="20" />
      <span class="sr-only">icon</span>
    </div>
    <div class="ml-3 text-sm font-normal">
      <p class="font-medium">{{ props.title }}</p>
      <p>{{ props.message }}</p>
    </div>

    <button
      @click="removeToast"
      type="button"
      class="text-primary-400 hover:text-primary-900 hover:bg-primary-100 d -mx-1.5 -my-1.5 ml-auto inline-flex h-8 w-8 rounded-lg bg-white p-1.5"
      data-dismiss-target="#toast-default"
      aria-label="Close">
      <span class="sr-only">Close</span>
      <svg
        aria-hidden="true"
        class="h-5 w-5"
        fill="currentColor"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg">
        <path
          fill-rule="evenodd"
          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
          clip-rule="evenodd"></path>
      </svg>
    </button>

    <div class="bg-primary-100/70 absolute inset-x-0 bottom-0 h-1">
      <span class="block h-full transition-[width] ease-linear" :class="progressColor" :style="progressStyle"></span>
    </div>
  </div>
</template>

<style></style>
