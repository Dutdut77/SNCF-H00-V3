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
  },
  centered: {
    type: Boolean,
    default: false
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

// Liste d'affichage : insère des en-têtes de groupe non-cliquables quand des options
// portent un champ `group`. Rétro-compatible : sans `group`, la liste reste plate.
const groupedOptions = computed(() => {
  const items = []
  let currentGroup = null
  for (const option of filteredOptions.value) {
    if (option.group) {
      if (option.group !== currentGroup) {
        currentGroup = option.group
        items.push({ type: 'header', key: `__header_${option.group}`, label: option.group })
      }
    } else {
      currentGroup = null
    }
    items.push({ type: 'option', key: option.id, ...option })
  }
  return items
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
          class="border-primary-300 hover:border-primary-400 bg-primary-50 flex w-full cursor-pointer items-center justify-between gap-2 rounded-md border py-1.5 pr-2.5 pl-3 text-sm transition-colors"
          :class="isOpen ? 'border-primary-500 ring-primary-500 ring-1' : ''">
          <span :class="[
            model === null || model === undefined ? 'text-primary-500' : 'text-primary-700',
            props.centered ? 'flex-1 text-center' : ''
          ]">
            {{ selectedLabel }}
          </span>
          <Icon
            name="lucide:chevron-down"
            class="text-primary-500 h-4 w-4 transition-transform duration-200"
            :class="isOpen ? 'rotate-180' : ''" />
        </div>
      </template>

      <template #default>
        <div class="w-full">
          <!-- Champ de recherche -->
          <div v-if="props.searchable" class="bg-primary-50 sticky top-0 border-b p-2">
            <div class="relative">
              <Icon name="lucide:search" class="text-primary-600 absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2" />
              <input
                v-model="searchQuery"
                type="text"
                :placeholder="props.searchPlaceholder"
                class="border-primary-300 placeholder:text-primary-800 focus:border-primary-500 focus:ring-primary-500 bg-primary-50 w-full rounded-md border py-1.5 pr-3 pl-8 text-sm transition-colors outline-none focus:ring-1"
                @click.stop />
            </div>
          </div>

          <div class="max-h-60 overflow-y-auto">
            <!-- Option nullable -->
            <div
              v-if="props.nullable && !searchQuery"
              @click="selectOption(null)"
              class="cursor-pointer rounded-md px-3 py-2 text-sm transition-colors"
              :class="model === null ? 'bg-primary-50 text-primary-700' : 'text-primary-500 hover:bg-primary-100'">
              {{ props.placeholder }}
            </div>

            <!-- Options (avec en-têtes de groupe éventuels) -->
            <template v-for="item in groupedOptions" :key="item.key">
              <!-- En-tête de section (non-cliquable) -->
              <div
                v-if="item.type === 'header'"
                class="text-primary-500 px-3 pt-3 pb-1 text-xs font-semibold tracking-wider uppercase select-none">
                {{ item.label }}
              </div>
              <!-- Option -->
              <div
                v-else
                @click="selectOption(item.id)"
                class="cursor-pointer rounded-md px-3 py-2 text-sm transition-colors"
                :class="
                  model === item.id
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-primary-700 hover:bg-primary-100'
                ">
                <div class="flex items-center justify-between">
                  <span :class="item.group ? 'pl-2' : ''">{{ item.label }}</span>
                  <Icon v-if="model === item.id" name="lucide:check" class="text-primary-700 h-4 w-4" />
                </div>
              </div>
            </template>

            <!-- Message si aucun résultat -->
            <div
              v-if="filteredOptions.length === 0 && searchQuery"
              class="text-primary-500 px-3 py-4 text-center text-sm">
              Aucun résultat pour "{{ searchQuery }}"
            </div>
          </div>
        </div>
      </template>
    </AppDropdownMenu>
  </div>
</template>

<style></style>
