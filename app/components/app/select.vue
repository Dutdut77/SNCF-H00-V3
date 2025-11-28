<script setup>
const model = defineModel({ default: null });
const isOpen = ref(false);

const props = defineProps({
  title: {
    type: String,
    default: "",
  },
  name: {
    type: String,
    default: "",
  },
  options: {
    type: Array,
    default: () => [], // Format: [{ id: value, label: 'Label' }]
  },
  placeholder: {
    type: String,
    default: "Sélectionner...",
  },
  nullable: {
    type: Boolean,
    default: false,
  },
});

// Label de l'option sélectionnée
const selectedLabel = computed(() => {
  if (model.value === null || model.value === undefined) {
    return props.placeholder;
  }
  const option = props.options.find(o => o.id === model.value);
  return option?.label || props.placeholder;
});

// Sélectionner une option
const selectOption = (value) => {
  model.value = value;
  isOpen.value = false;
};
</script>

<template>
  <div class="w-full break-inside-avoid">
    <label v-if="props.title" :for="props.name" class="block text-sm mb-0.5">{{ props.title }}</label>
    
    <AppDropdownMenu v-model:open="isOpen" full-width match-trigger-width>
      <template #trigger>
        <div 
          :id="props.name"
          class="flex items-center justify-between gap-2 border border-gray-300 dark:border-gray-600 text-sm rounded-md py-1.5 pl-3 pr-2.5 w-full bg-white dark:bg-gray-800 cursor-pointer transition-colors hover:border-gray-400 dark:hover:border-gray-500"
          :class="isOpen ? 'border-primary-500 ring-1 ring-primary-500' : ''"
        >
          <span :class="model === null || model === undefined ? 'text-gray-400' : 'text-gray-700 dark:text-gray-200'">
            {{ selectedLabel }}
          </span>
          <Icon 
            name="lucide:chevron-down" 
            class="w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200" 
            :class="isOpen ? 'rotate-180' : ''"
          />
        </div>
      </template>
      
      <template #default>
        <div class="w-full max-h-60 overflow-y-auto">
          <!-- Option nullable -->
          <div 
            v-if="props.nullable"
            @click="selectOption(null)"
            class="px-3 py-2 text-sm cursor-pointer rounded-md transition-colors"
            :class="model === null ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'"
          >
            {{ props.placeholder }}
          </div>
          
          <!-- Options -->
          <div 
            v-for="option in props.options" 
            :key="option.id"
            @click="selectOption(option.id)"
            class="px-3 py-2 text-sm cursor-pointer rounded-md transition-colors"
            :class="model === option.id ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'"
          >
            <div class="flex items-center justify-between">
              <span>{{ option.label }}</span>
              <Icon v-if="model === option.id" name="lucide:check" class="w-4 h-4 text-primary-500" />
            </div>
          </div>
        </div>
      </template>
    </AppDropdownMenu>
  </div>
</template>

<style></style>
