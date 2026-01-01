<script setup>
const model = defineModel({ default: () => [] }) // v-model = array
const isOpen = ref(false)
const search = ref('')

const props = defineProps({
  title: { type: String, default: '' },
  name: { type: String, default: '' },
  options: { type: Array, default: () => [] },
  placeholder: { type: String, default: 'Sélectionner...' },
  searchable: { type: Boolean, default: true },
  showSelectAll: { type: Boolean, default: false }
})

// utilitaires
const isSelected = (id) => model.value.includes(id)
const toggleOption = (id) => {
  // toggler proprement l'array (création d'une nouvelle reference pour reactivité)
  if (isSelected(id)) {
    model.value = model.value.filter((v) => v !== id)
  } else {
    model.value = [...model.value, id]
  }
}

// badges pour l'input
const selectedOptions = computed(() => props.options.filter((o) => model.value.includes(o.id)))

// filtre de recherche (case-insensitive)
const filteredOptions = computed(() => {
  const q = search.value?.toString().trim().toLowerCase()
  if (!q) return props.options
  return props.options.filter((o) => (o.label || '').toString().toLowerCase().includes(q))
})

// select all / clear (optionnel)
const selectAllVisible = () => {
  const visibles = filteredOptions.value.map((o) => o.id)
  const next = Array.from(new Set([...model.value, ...visibles]))
  model.value = next
}
const clearAllVisible = () => {
  const visibles = new Set(filteredOptions.value.map((o) => o.id))
  model.value = model.value.filter((id) => !visibles.has(id))
}
</script>

<template>
  <div class="w-full break-inside-avoid">
    <label v-if="props.title" :for="props.name" class="mb-0.5 block text-sm">
      {{ props.title }}
    </label>

    <AppDropdownMenu v-model:open="isOpen" full-width match-trigger-width>
      <template #trigger>
        <div
          :id="props.name"
          class="border-primary-300 hover:border-primary-400 bg-primary-50 flex min-h-[38px] w-full cursor-pointer flex-wrap items-center gap-2 rounded-md border py-1.5 pr-2.5 pl-3 text-sm transition-colors"
          :class="isOpen ? 'border-primary-700 ring-primary-700 ring-1' : ''">
          <!-- placeholder -->
          <span v-if="selectedOptions.length === 0" class="text-primary-600">
            {{ props.placeholder }}
          </span>

          <!-- badges -->
          <div
            v-for="opt in selectedOptions"
            :key="opt.id"
            class="bg-primary-500/20 text-primary-700 mr-1 mb-1 flex items-center gap-1 rounded-md px-2 py-0.5 text-xs">
            <span class="leading-none">{{ opt.label }}</span>
            <button type="button" class="leading-none" @click.stop="toggleOption(opt.id)" aria-label="Retirer">
              <Icon name="lucide:x" class="h-3 w-3" />
            </button>
          </div>

          <Icon
            name="lucide:chevron-down"
            class="text-primary-500 ml-auto h-4 w-4 transition-transform duration-200"
            :class="isOpen ? 'rotate-180' : ''" />
        </div>
      </template>

      <template #default>
        <div class="w-full py-2">
          <!-- Recherche -->
          <div v-if="props.searchable" class="px-3 pb-2">
            <div class="flex items-center gap-2">
              <input
                type="text"
                v-model="search"
                placeholder="Rechercher..."
                class="border-primary-200 placeholder-primary-800 bg-primary-50 w-full rounded-md border px-3 py-1.5 text-sm focus:ring-0" />
              <button
                v-if="search"
                type="button"
                class="hover:bg-primary-100 rounded-md px-2 py-1 text-sm"
                @click="search = ''">
                Effacer
              </button>
            </div>
          </div>

          <!-- Select all / clear (optionnel) -->
          <div v-if="props.showSelectAll" class="px-3 pb-2">
            <div class="flex gap-2">
              <button type="button" class="rounded border px-2 py-1 text-xs" @click.prevent="selectAllVisible">
                Tout sélectionner
              </button>
              <button type="button" class="rounded border px-2 py-1 text-xs" @click.prevent="clearAllVisible">
                Tout retirer
              </button>
            </div>
          </div>

          <!-- Liste -->
          <div class="max-h-60 w-full overflow-y-auto">
            <div
              v-for="option in filteredOptions"
              :key="option.id"
              class="hover:bg-primary-100 flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm"
              :class="isSelected(option.id) ? 'bg-primary-50 text-primary-700 font-medium' : 'text-primary-700'"
              @click.stop="toggleOption(option.id)">
              <!-- checkbox: on clique directement dessus, on toggle aussi -->
              <input
                type="checkbox"
                :checked="isSelected(option.id)"
                @click.stop="toggleOption(option.id)"
                aria-label="Sélectionner"
                class="accent-primary-500 h-4 w-4" />
              <span class="flex-1">{{ option.label }}</span>

              <!-- icone check à droite -->
              <Icon v-if="isSelected(option.id)" name="lucide:check" class="text-primary-500 h-4 w-4" />
            </div>

            <!-- si pas de résultat -->
            <div v-if="filteredOptions.length === 0" class="text-primary-500 px-3 py-2 text-sm">Aucun résultat</div>
          </div>
        </div>
      </template>
    </AppDropdownMenu>
  </div>
</template>

<style scoped>
/* si besoin d'ajustements CSS supplémentaires, ajoute ici */
</style>
