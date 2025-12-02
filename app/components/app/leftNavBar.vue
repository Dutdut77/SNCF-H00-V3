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
const isOpen = ref(false) // 👉 état du menu mobile

onMounted(() => {
  // Trouve l'item parent du child sélectionné
  if (selected.value) {
    const parentWithSelectedChild = props.items.find((item) =>
      item.children?.some((child) => child.value === selected.value)
    )

    // Si trouvé, on ouvre automatiquement ce parent
    if (parentWithSelectedChild) {
      expandedItems.value = parentWithSelectedChild.value
    }
  }
})

const handleItemClick = (item) => {
  if (!item.children) {
    selected.value = item.value
    expandedItems.value = null
  } else {
    expandedItems.value = expandedItems.value === item.value ? null : item.value
  }
}

// Calcule la hauteur dynamique des sous-éléments
const calcHauteur = (children) => {
  const result = children.length * 36
  return { height: `${result}px` }
}
</script>

<template>
  <section class="h-full w-full px-4">
    <!-- En-tête avec le bouton "Menu" -->
    <div
      v-if="props.title"
      class="from-primary-400 border-primary-500 mb-4 flex cursor-pointer items-center justify-center gap-2 rounded border bg-linear-to-br to-indigo-500 py-1 text-xl font-semibold text-white lg:mb-0 lg:cursor-default lg:justify-start lg:border-0 lg:from-transparent lg:to-transparent lg:py-0 lg:pb-4 lg:text-gray-700"
      @click="isOpen = !isOpen">
      <p class="text-base lg:text-lg">{{ props.title }}</p>
      <span class="transition-transform duration-300 lg:hidden" :class="{ 'rotate-90': isOpen }">
        <Icon name="lucide:chevron-right" size="20" />
      </span>
    </div>
    <div
      v-else
      class="from-primary-400 border-primary-500 mb-4 flex cursor-pointer items-center justify-center gap-2 rounded border bg-linear-to-br to-indigo-500 py-1 text-xl font-semibold text-white lg:mb-0 lg:hidden lg:cursor-default lg:justify-start lg:border-0 lg:from-transparent lg:to-transparent lg:py-0 lg:pb-4 lg:text-gray-700"
      @click="isOpen = !isOpen">
      <p class="text-base lg:text-lg">Sommaire</p>
      <span class="transition-transform duration-300 lg:hidden" :class="{ 'rotate-90': isOpen }">
        <Icon name="lucide:chevron-right" size="20" />
      </span>
    </div>

    <!-- Liste des items -->
    <div
      class="overflow-hidden transition-all duration-300 lg:overflow-visible"
      :style="{
        height: isOpen ? 'auto' : '0'
      }"
      :class="{ 'lg:h-auto': true }">
      <div
        v-for="item in props.items"
        :key="item.value"
        class="border-l-muted cursor-pointer pt-1"
        @click="isOpen = !isOpen">
        <div
          class="hover:bg-primary-100 group flex h-9 items-center gap-1 rounded-md px-3 py-1.5"
          :class="
            item.value === selected
              ? 'from-primary-400 hover:bg-primary-400 bg-linear-to-br to-indigo-500 hover:text-white'
              : ''
          "
          @click="handleItemClick(item)"
          :aria-expanded="item.children ? expandedItems === item.value : undefined"
          :aria-controls="item.children ? `submenu-${item.value}` : undefined">
          <Icon
            :name="item.icon"
            size="20"
            class="transition-colors duration-200"
            :class="item.value === selected ? 'text-white' : 'text-gray-700'" />
          <div
            class="text-sm font-medium transition-colors duration-200"
            :class="item.value === selected ? 'text-white' : ''">
            {{ item.label }}
          </div>

          <div v-if="item.badge" class="ml-auto flex w-8 justify-center">
            <div
              class="bg-primary-100 group-hover:border-primary-200 group-hover:bg-primary-400 w-full rounded border text-center text-xs font-semibold group-hover:text-white"
              :class="
                item.value === selected
                  ? 'bg-primary-400 border-primary-200 text-white'
                  : 'border-gray-400 text-gray-700'
              ">
              {{ item.badge }}
            </div>
          </div>

          <div
            v-if="item.children"
            class="ml-auto flex w-8 justify-center transition-transform duration-300"
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
            @click.stop="selected = child.value">
            <div
              class="hover:bg-primary-100 group flex h-full items-center gap-1 rounded-md px-3"
              :class="child.value === selected ? 'bg-primary-400 hover:bg-primary-400 text-white' : ''">
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
    </div>
  </section>
</template>
