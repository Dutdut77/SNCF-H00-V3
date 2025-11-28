<script setup>
const model = defineModel({ default: false });

const props = defineProps({
  label: {
    type: String,
    default: "",
  },
  name: {
    type: String,
    default: "",
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  labelPosition: {
    type: String,
    default: "right", // 'left' | 'right'
  },
});

const inputId = computed(() => props.name || `switch-${Math.random().toString(36).substr(2, 9)}`);

const toggle = () => {
  if (!props.disabled) {
    model.value = !model.value;
  }
};
</script>

<template>
  <label 
    :for="inputId" 
    class="inline-flex items-center gap-3 cursor-pointer select-none"
    :class="[
      props.disabled ? 'opacity-50 cursor-not-allowed' : '',
      props.labelPosition === 'left' ? 'flex-row-reverse' : ''
    ]"
  >
    <input 
      type="checkbox" 
      :id="inputId" 
      :name="props.name"
      v-model="model" 
      :disabled="props.disabled"
      class="sr-only peer" 
    />
    
    <!-- Switch track -->
    <div 
      class="relative w-11 h-6 rounded-full transition-colors duration-200"
      :class="[
        model 
          ? 'bg-primary-500' 
          : 'bg-gray-300 dark:bg-gray-600',
        !props.disabled && 'peer-focus:ring-2 peer-focus:ring-primary-500/30'
      ]"
      @click.prevent="toggle"
    >
      <!-- Switch thumb -->
      <div 
        class="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200"
        :class="model ? 'translate-x-5.5' : 'translate-x-0.5'"
      />
    </div>
    
    <!-- Label -->
    <span 
      v-if="props.label" 
      class="text-sm text-gray-700 dark:text-gray-300"
    >
      {{ props.label }}
    </span>
  </label>
</template>

<style></style>

