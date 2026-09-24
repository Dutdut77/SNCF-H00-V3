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
  },
  // Habillage design V4 : champ blanc de 40 px, liseré ardoise, focus magenta (comme form-control),
  // liste en carte blanche comme les menus d'actions
  v4: {
    type: Boolean,
    default: false
  },
  // Icône devant la valeur (V4), par exemple pour un filtre de barre d'outils
  icon: {
    type: String,
    default: ''
  }
})

// Classes du déclencheur, de l'option et de sa coche : ancien habillage ou V4
const ui = computed(() =>
  props.v4
    ? {
        trigger: 'dark:bg-night-900 h-10 rounded-lg bg-white px-3',
        idle: 'border-slate-300 hover:border-slate-400 dark:border-white/15 dark:hover:border-white/30',
        open: 'border-secondary-500 ring-secondary-500/25 ring-3',
        placeholder: 'text-ink-soft/70 truncate',
        value: 'text-ink truncate',
        chevron: 'text-ink-soft',
        option: 'text-ink hover:bg-slate-100 dark:hover:bg-white/6',
        selected: 'bg-slate-100 text-ink font-medium dark:bg-white/8',
        check: 'text-secondary-600 dark:text-secondary-300',
        panneau:
          'bg-card border-rule rounded-xl border p-1.5 shadow-[0_24px_48px_-20px_rgb(43_4_35/0.35)] dark:shadow-[0_24px_48px_-20px_rgb(0_0_0/0.7)]',
        recherche: 'bg-card border-rule sticky top-0 z-10 -mx-1.5 -mt-1.5 mb-1 border-b p-2',
        champ: 'form-control h-9 pl-8',
        loupe: 'text-ink-soft',
        entete: 'text-ink-soft px-3 pt-3 pb-1 text-xs font-semibold select-none',
        vide: 'text-ink-soft'
      }
    : {
        trigger: 'bg-primary-50 rounded-md py-1.5 pr-2.5 pl-3',
        idle: 'border-primary-300 hover:border-primary-400',
        open: 'border-primary-500 ring-primary-500 ring-1',
        placeholder: 'text-primary-500',
        value: 'text-primary-700',
        chevron: 'text-primary-500',
        option: 'text-primary-700 hover:bg-primary-100',
        selected: 'bg-primary-50 text-primary-700 font-medium',
        check: 'text-primary-700',
        panneau: undefined, // habillage par défaut d'AppDropdownMenu
        recherche: 'bg-primary-50 sticky top-0 border-b p-2',
        champ:
          'border-primary-300 placeholder:text-primary-800 focus:border-primary-500 focus:ring-primary-500 bg-primary-50 w-full rounded-md border py-1.5 pr-3 pl-8 text-sm transition-colors outline-none focus:ring-1',
        loupe: 'text-primary-600',
        entete: 'text-primary-500 px-3 pt-3 pb-1 text-xs font-semibold tracking-wider uppercase select-none',
        vide: 'text-primary-500'
      }
)

// Compteur facultatif d'une option (`count`), affiché à droite dans la liste et dans le champ
const compteur = (actif) =>
  actif ? 'bg-magenta-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-white/80'
const optionChoisie = computed(() => props.options.find((o) => o.id === model.value))

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
    <label
      v-if="props.title"
      :for="props.name"
      class="block"
      :class="props.v4 ? 'text-ink mb-1.5 text-[13px] font-medium' : 'mb-0.5 text-sm'">
      {{ props.title }}
    </label>

    <AppDropdownMenu v-model:open="isOpen" full-width match-trigger-width :panel-class="ui.panneau">
      <template #trigger>
        <div
          :id="props.name"
          class="flex w-full cursor-pointer items-center justify-between gap-2 border text-sm transition-colors"
          :class="[ui.trigger, isOpen ? ui.open : ui.idle]">
          <Icon v-if="props.icon" :name="props.icon" class="text-ink-soft h-4 w-4 shrink-0" />
          <span
            class="min-w-0 flex-1"
            :class="[
              model === null || model === undefined ? ui.placeholder : ui.value,
              { 'text-center': props.centered }
            ]">
            {{ selectedLabel }}
          </span>
          <span
            v-if="optionChoisie?.count !== undefined"
            class="inline-flex h-5 min-w-5.5 shrink-0 items-center justify-center rounded-full px-1.5 text-[11px] font-bold tabular-nums"
            :class="compteur(false)">
            {{ optionChoisie.count }}
          </span>
          <Icon
            name="lucide:chevron-down"
            class="h-4 w-4 shrink-0 transition-transform duration-200"
            :class="[ui.chevron, isOpen ? 'rotate-180' : '']" />
        </div>
      </template>

      <template #default>
        <div class="w-full">
          <!-- Champ de recherche -->
          <div v-if="props.searchable" :class="ui.recherche">
            <div class="relative">
              <Icon
                name="lucide:search"
                class="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2"
                :class="ui.loupe" />
              <input
                v-model="searchQuery"
                type="text"
                :placeholder="props.searchPlaceholder"
                :class="ui.champ"
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
                props.v4
                  ? [model === null ? ui.selected : ui.option, 'text-ink-soft']
                  : model === null
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-primary-500 hover:bg-primary-100'
              ">
              {{ props.placeholder }}
            </div>

            <!-- Options (avec en-têtes de groupe éventuels) -->
            <template v-for="item in groupedOptions" :key="item.key">
              <!-- En-tête de section (non-cliquable) -->
              <div v-if="item.type === 'header'" :class="ui.entete">
                {{ item.label }}
              </div>
              <!-- Option -->
              <div
                v-else
                @click="selectOption(item.id)"
                class="cursor-pointer rounded-md px-3 py-2 text-sm transition-colors"
                :class="model === item.id ? ui.selected : ui.option">
                <div class="flex items-center justify-between gap-2">
                  <span class="min-w-0" :class="item.group ? 'pl-2' : ''">{{ item.label }}</span>
                  <span class="flex shrink-0 items-center gap-2">
                    <span
                      v-if="item.count !== undefined"
                      class="inline-flex h-5 min-w-5.5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold tabular-nums"
                      :class="compteur(model === item.id)">
                      {{ item.count }}
                    </span>
                    <Icon v-if="model === item.id" name="lucide:check" class="h-4 w-4" :class="ui.check" />
                  </span>
                </div>
              </div>
            </template>

            <!-- Message si aucun résultat -->
            <div
              v-if="filteredOptions.length === 0 && searchQuery"
              class="px-3 py-4 text-center text-sm"
              :class="ui.vide">
              Aucun résultat pour "{{ searchQuery }}"
            </div>
          </div>
        </div>
      </template>
    </AppDropdownMenu>
  </div>
</template>

<style></style>
