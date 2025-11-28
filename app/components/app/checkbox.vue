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
});

const inputId = computed(() => props.name || `checkbox-${Math.random().toString(36).substr(2, 9)}`);
</script>

<template>
  <label 
    :for="inputId" 
    class="flex items-center gap-3 cursor-pointer select-none"
    :class="props.disabled ? 'opacity-50 cursor-not-allowed' : ''"
  >
    <input 
      type="checkbox" 
      :id="inputId" 
      :name="props.name"
      v-model="model" 
      :disabled="props.disabled"
      class="sr-only peer" 
    />
    
    <!-- Custom checkbox -->
    <div 
      class="relative w-5 h-5 border-2 rounded transition-all duration-200 flex items-center justify-center"
      :class="[
        model 
          ? 'bg-primary-500 border-primary-500' 
          : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600',
        !props.disabled && 'peer-focus:ring-2 peer-focus:ring-primary-500/30'
      ]"
    >
      <Icon 
        v-if="model" 
        name="lucide:check" 
        class="w-3.5 h-3.5 text-white" 
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
