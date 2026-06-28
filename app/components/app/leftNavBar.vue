<script setup>
const props = defineProps({
  items: {
    type: Array,
    required: true
  },
  title: {
    type: String,
    default: 'Menu'
  }
})

const selected = defineModel()
const expandedItems = ref(null)
const drawerOpen = ref(false)

onMounted(() => {
  // Trouve l'item parent du child sélectionné
  if (selected.value) {
    const parentWithSelectedChild = props.items.find((item) =>
      item.children?.some((child) => child.value === selected.value)
    )
    if (parentWithSelectedChild) {
      expandedItems.value = parentWithSelectedChild.value
    }
  }
})

const handleItemClick = (item) => {
  if (!item.children) {
    selected.value = item.value
    expandedItems.value = null
    drawerOpen.value = false
  } else {
    expandedItems.value = expandedItems.value === item.value ? null : item.value
  }
}

// Calcule la hauteur dynamique des sous-éléments
const calcHauteur = (children) => {
  const result = children.length * 36
  return { height: `${result}px` }
}

// Label et icône de la section courante (pour le pill mobile)
const selectedItem = computed(() => {
  for (const item of props.items) {
    if (item.value === selected.value) return item
    if (item.children) {
      const child = item.children.find((c) => c.value === selected.value)
      if (child) return { label: child.label, icon: item.icon }
    }
  }
  return null
})
</script>

<template>
  <section class="h-full w-full px-4">

    <!-- Bouton pill mobile (masqué sur desktop) -->
    <button
      type="button"
      class="mb-3 flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-2.5 shadow-sm transition hover:border-gray-300 hover:shadow dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600 lg:hidden"
      @click="drawerOpen = true">
      <Icon
        v-if="selectedItem?.icon"
        :name="selectedItem.icon"
        size="18"
        class="text-primary-700 shrink-0 dark:text-gray-300" />
      <span class="text-primary-700 flex-1 text-left text-sm font-medium dark:text-gray-200">
        {{ selectedItem?.label || props.title || 'Sommaire' }}
      </span>
      <Icon name="lucide:chevrons-up-down" size="16" class="shrink-0 text-gray-400" />
    </button>

    <!-- Drawer mobile -->
    <AppDrawer :drawer-open="drawerOpen" :close-drawer="() => (drawerOpen = false)" :height-percent="75" class="lg:hidden">
      <AppDrawerContent :drawer-open="drawerOpen" :close-drawer="() => (drawerOpen = false)">
        <p class="text-primary-700 mb-3 text-sm font-semibold dark:text-gray-300">{{ props.title || 'Sommaire' }}</p>
        <template v-for="item in props.items" :key="item.value">
        <p
          v-if="item.type === 'header'"
          class="text-primary-700/40 mt-4 border-t border-slate-200/70 px-3 pt-3.5 pb-1 text-[10px] font-medium tracking-[0.12em] uppercase dark:border-slate-700/50 dark:text-gray-500">
          {{ item.label }}
        </p>
        <div v-else class="border-l-muted cursor-pointer pt-1">
          <div
            class="hover:bg-primary-700/20 group flex h-9 items-center gap-1 rounded-md px-3 py-1.5"
            :class="item.value === selected ? 'border-primary-700/30 bg-linear-to-br from-slate-700 to-slate-900 shadow-lg' : 'hover:text-primary-900'"
            :aria-expanded="item.children ? expandedItems === item.value : undefined"
            :aria-controls="item.children ? `drawer-submenu-${item.value}` : undefined"
            @click="handleItemClick(item)">
            <Icon
              :name="item.icon"
              size="20"
              class="transition-colors duration-200"
              :class="item.value === selected ? 'text-secondary-400' : 'text-primary-700'" />
            <div
              class="text-sm font-medium transition-colors duration-200"
              :class="item.value === selected ? 'text-white' : 'text-primary-700'">
              {{ item.label }}
            </div>
            <div v-if="item.badge" class="ml-auto flex w-8 justify-center">
              <div
                class="w-full rounded text-center text-xs font-semibold"
                :class="item.value === selected ? 'from-secondary-400 to-secondary-500 text-secondary-50 bg-linear-to-t' : 'bg-primary-700/20 text-primary-800'">
                {{ item.badge }}
              </div>
            </div>
            <div
              v-if="item.children"
              class="text-primary-700 ml-auto flex w-8 justify-center transition-transform duration-300"
              :class="item.value === expandedItems ? 'rotate-90' : ''">
              <Icon name="lucide:chevron-right" size="20" />
            </div>
          </div>
          <!-- Sous-items -->
          <div
            v-if="item.children"
            :id="`drawer-submenu-${item.value}`"
            class="overflow-hidden pl-5.5 transition-all duration-300"
            :style="item.value === expandedItems ? calcHauteur(item.children) : { height: '0px' }">
            <div
              v-for="child in item.children"
              :key="child.value"
              class="border-l-muted h-9 cursor-pointer border-l pl-4"
              :class="child.value === selected ? 'border-secondary-400 -ml-px border-l-4' : ''"
              @click.stop="selected = child.value; drawerOpen = false">
              <div
                class="hover:bg-primary-700/20 flex h-full items-center gap-1 rounded-md px-3"
                :class="child.value === selected ? 'border-primary-700/30 bg-linear-to-br from-slate-700 to-slate-900 text-white shadow-lg' : 'text-primary-700'">
                <div class="text-sm font-medium transition-colors duration-200">{{ child.label }}</div>
              </div>
            </div>
          </div>
        </div>
        </template>
      </AppDrawerContent>
    </AppDrawer>

    <!-- Liste desktop (masquée sur mobile) -->
    <div class="hidden lg:block">
      <template v-for="item in props.items" :key="item.value">
      <p
        v-if="item.type === 'header'"
        class="text-primary-700/40 mt-4 border-t border-slate-200/70 px-3 pt-3.5 pb-1 text-[10px] font-medium tracking-[0.12em] uppercase dark:border-slate-700/50 dark:text-gray-500">
        {{ item.label }}
      </p>
      <div v-else class="border-l-muted cursor-pointer pt-1">
        <div
          class="hover:bg-primary-700/20 group flex h-9 items-center gap-1 rounded-md px-3 py-1.5"
          :class="item.value === selected ? 'border-primary-700/30 bg-linear-to-br from-slate-700 to-slate-900 shadow-lg' : 'hover:text-primary-900'"
          :aria-expanded="item.children ? expandedItems === item.value : undefined"
          :aria-controls="item.children ? `submenu-${item.value}` : undefined"
          @click="handleItemClick(item)">
          <Icon
            :name="item.icon"
            size="20"
            class="transition-colors duration-200"
            :class="item.value === selected ? 'bg-primary-500/20 text-secondary-400' : 'text-primary-700'" />
          <div
            class="text-sm font-medium transition-colors duration-200"
            :class="item.value === selected ? 'text-white' : 'text-primary-700'">
            {{ item.label }}
          </div>

          <div v-if="item.badge" class="ml-auto flex w-8 justify-center">
            <div
              class="bg-primary-700/20 w-full rounded text-center text-xs font-semibold"
              :class="item.value === selected ? 'from-secondary-400 to-secondary-500 text-secondary-50 bg-linear-to-t' : 'bg-primary-700/20 text-primary-800 group-hover:bg-primary-700/30'">
              {{ item.badge }}
            </div>
          </div>

          <div
            v-if="item.children"
            class="text-primary-700 ml-auto flex w-8 justify-center transition-transform duration-300"
            :class="item.value === expandedItems ? 'rotate-90' : ''">
            <Icon name="lucide:chevron-right" size="20" class="rounded-full font-bold" />
          </div>
        </div>

        <!-- Sous-items -->
        <div
          v-if="item.children"
          :id="`submenu-${item.value}`"
          class="overflow-hidden pl-5.5 transition-all duration-300"
          :style="item.value === expandedItems ? calcHauteur(item.children) : { height: '0px' }">
          <div
            v-for="child in item.children"
            :key="child.value"
            class="border-l-muted h-9 cursor-pointer border-l pl-4"
            :class="child.value === selected ? 'border-secondary-400 -ml-px border-l-4' : ''"
            @click.stop="selected = child.value">
            <div
              class="hover:bg-primary-700/20 group flex h-full items-center gap-1 rounded-md px-3"
              :class="child.value === selected ? 'border-primary-700/30 bg-linear-to-br from-slate-700 to-slate-900 text-white shadow-lg' : 'text-primary-700'">
              <div class="text-sm font-medium transition-colors duration-200">
                {{ child.label }}
              </div>
              <div v-if="child.badge" class="ml-auto flex w-8 justify-center">
                <div class="w-full rounded text-center text-xs font-semibold">
                  {{ child.badge }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </template>
    </div>

  </section>
</template>
