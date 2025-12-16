<!-- <AppSelect
v-model="newChantier.preop_voie"
:options="userOptions"
title="Voie"
placeholder="Sélectionner..."
searchable
nullable /> -->
<script setup>
const model = defineModel({ default: null })
const isOpen = ref(false)
const searchQuery = ref('')

const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  name: {
    type: String,
    default: ''
  },
  options: {
    type: Array,
    default: () => [] // Format: [{ id: value, label: 'Label' }]
  },
  placeholder: {
    type: String,
    default: 'Sélectionner...'
  },
  nullable: {
    type: Boolean,
    default: false
  },
  searchable: {
    type: Boolean,
    default: false
  },
  searchPlaceholder: {
    type: String,
    default: 'Rechercher...'
  }
})

// Label de l'option sélectionnée
const selectedLabel = computed(() => {
  if (model.value === null || model.value === undefined) {
    return props.placeholder
  }
  const option = props.options.find((o) => o.id === model.value)
  return option?.label || props.placeholder
})

// Options filtrées par la recherche
const filteredOptions = computed(() => {
  if (!props.searchable || !searchQuery.value.trim()) {
    return props.options
  }
  const query = searchQuery.value.toLowerCase().trim()
  return props.options.filter((option) => option.label.toLowerCase().includes(query))
})

// Sélectionner une option
const selectOption = (value) => {
  model.value = value
  isOpen.value = false
  searchQuery.value = ''
}

// Réinitialiser la recherche à la fermeture
watch(isOpen, (newValue) => {
  if (!newValue) {
    searchQuery.value = ''
  }
})
</script>

<template>
  <div class="w-full break-inside-avoid">
    <label v-if="props.title" :for="props.name" class="mb-0.5 block text-sm">{{ props.title }}</label>

    <AppDropdownMenu v-model:open="isOpen" full-width match-trigger-width>
      <template #trigger>
        <div
          :id="props.name"
          class="flex w-full cursor-pointer items-center justify-between gap-2 rounded-md border border-gray-300 bg-white py-1.5 pr-2.5 pl-3 text-sm transition-colors hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-gray-500"
          :class="isOpen ? 'border-primary-500 ring-primary-500 ring-1' : ''">
          <span :class="model === null || model === undefined ? 'text-gray-400' : 'text-gray-700 dark:text-gray-200'">
            {{ selectedLabel }}
          </span>
          <Icon
            name="lucide:chevron-down"
            class="h-4 w-4 text-gray-500 transition-transform duration-200 dark:text-gray-400"
            :class="isOpen ? 'rotate-180' : ''" />
        </div>
      </template>

      <template #default>
        <div class="w-full">
          <!-- Champ de recherche -->
          <div v-if="props.searchable" class="sticky top-0 border-b border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-900">
            <div class="relative">
              <Icon
                name="lucide:search"
                class="absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                v-model="searchQuery"
                type="text"
                :placeholder="props.searchPlaceholder"
                class="w-full rounded-md border border-gray-300 bg-white py-1.5 pr-3 pl-8 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:placeholder:text-gray-500"
                @click.stop />
            </div>
          </div>

          <div class="max-h-60 overflow-y-auto">
            <!-- Option nullable -->
            <div
              v-if="props.nullable && !searchQuery"
              @click="selectOption(null)"
              class="cursor-pointer rounded-md px-3 py-2 text-sm transition-colors"
              :class="
                model === null
                  ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
              ">
              {{ props.placeholder }}
            </div>

            <!-- Options -->
            <div
              v-for="option in filteredOptions"
              :key="option.id"
              @click="selectOption(option.id)"
              class="cursor-pointer rounded-md px-3 py-2 text-sm transition-colors"
              :class="
                model === option.id
                  ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800'
              ">
              <div class="flex items-center justify-between">
                <span>{{ option.label }}</span>
                <Icon v-if="model === option.id" name="lucide:check" class="text-primary-500 h-4 w-4" />
              </div>
            </div>

            <!-- Message si aucun résultat -->
            <div
              v-if="filteredOptions.length === 0 && searchQuery"
              class="px-3 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
              Aucun résultat pour "{{ searchQuery }}"
            </div>
          </div>
        </div>
      </template>
    </AppDropdownMenu>
  </div>
</template>

<style></style>
