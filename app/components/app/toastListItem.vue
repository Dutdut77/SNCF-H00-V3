<script setup>
const props = defineProps({
  message: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    default: "Info",
  },
  duration: {
    type: Number,
    default: 3000,
  },
});

const emit = defineEmits(["remove"]);

const color = computed(() => {
  if (props.type === "Success") {
    return "bg-green-100 text-green-500";
  }
  if (props.type === "Info") {
    return "bg-gray-100 text-gray-500";
  }
  if (props.type === "Error") {
    return "bg-red-100 text-red-500";
  }
  if (props.type === "Warning") {
    return "bg-yellow-100 text-yellow-500";
  }
  return "bg-gray-100 text-gray-500";
});

const iconName = computed(() => {
  if (props.type === "Success") {
    return "lucide:check";
  }
  if (props.type === "Info") {
    return "lucide:info";
  }
  if (props.type === "Error") {
    return "lucide:x";
  }
  if (props.type === "Warning") {
    return "lucide:alert-triangle";
  }
  return "lucide:info";
});

const progressColor = computed(() => {
  if (props.type === "Success") {
    return "bg-green-500";
  }
  if (props.type === "Info") {
    return "bg-gray-500";
  }
  if (props.type === "Error") {
    return "bg-red-500";
  }
  if (props.type === "Warning") {
    return "bg-yellow-500";
  }
  return "bg-purple-500";
});

const progressWidth = ref(100);
const progressDuration = ref(props.duration);
const progressStyle = computed(() => ({
  width: `${progressWidth.value}%`,
  transitionDuration: `${progressDuration.value}ms`,
}));

let timeoutId;
let startTime = 0;
const remaining = ref(props.duration);
const isPaused = ref(false);

const clearTimer = () => {
  if (timeoutId) {
    clearTimeout(timeoutId);
    timeoutId = undefined;
  }
};

const removeToast = () => {
  clearTimer();
  emit("remove");
};

const startTimer = () => {
  startTime = performance.now();
  timeoutId = setTimeout(removeToast, remaining.value);
};

const startProgress = () => {
  progressDuration.value = remaining.value;
  requestAnimationFrame(() => {
    progressWidth.value = 0;
  });
};

const pauseToast = () => {
  if (isPaused.value || remaining.value <= 0) {
    return;
  }
  isPaused.value = true;
  clearTimer();
  const elapsed = performance.now() - startTime;
  remaining.value = Math.max(0, remaining.value - elapsed);
  progressDuration.value = 0;
  progressWidth.value = (remaining.value / props.duration) * 100;
};

const resumeToast = () => {
  if (!isPaused.value || remaining.value <= 0) {
    return;
  }
  isPaused.value = false;
  startTimer();
  requestAnimationFrame(() => {
    progressDuration.value = remaining.value;
    requestAnimationFrame(() => {
      progressWidth.value = 0;
    });
  });
};

onMounted(() => {
  remaining.value = props.duration;
  startProgress();
  startTimer();
});

onBeforeUnmount(() => {
  clearTimer();
});
</script>

<template>
  <div
    class="relative overflow-hidden z-50 font-avenir flex items-center w-full max-w-xs p-3 text-gray-500 bg-white rounded-lg border border-gray-200 shadow-xl dark:text-gray-400 dark:bg-gray-800"
    @mouseenter="pauseToast"
    @mouseleave="resumeToast"
  >
    <div class="inline-flex items-center justify-center shrink-0 w-8 h-8 rounded-lg" :class="color">
      <Icon v-if="iconName" :name="iconName" size="20" />
      <span class="sr-only"> icon</span>
    </div>
    <div class="ml-3 text-sm font-normal">
      <p class="font-medium">{{ props.title }}</p>
      <p>{{ props.message }}</p>
    </div>

    <button
      @click="removeToast"
      type="button"
      class="ml-auto -mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-900 rounded-lg p-1.5 hover:bg-gray-100 inline-flex h-8 w-8 dark:text-gray-500 dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700"
      data-dismiss-target="#toast-default"
      aria-label="Close"
    >
      <span class="sr-only">Close</span>
      <svg aria-hidden="true" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
    </button>

    <div class="absolute inset-x-0 bottom-0 h-1 bg-gray-100/70 dark:bg-gray-700/80">
      <span class="block h-full transition-[width] ease-linear" :class="progressColor" :style="progressStyle"></span>
    </div>
  </div>
</template>

<style></style>
