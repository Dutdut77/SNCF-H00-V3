<script setup>
const props = defineProps({
  items: {
    type: Array,
    required: true,
  },
  title: {
    type: String,
    default: "Menu",
  },
});

const selected = defineModel();
const expandedItems = ref(null);
const isOpen = ref(false); // 👉 état du menu mobile

onMounted(() => {
  // Trouve l'item parent du child sélectionné
  if (selected.value) {
    const parentWithSelectedChild = props.items.find((item) => 
      item.children?.some((child) => child.value === selected.value)
    );

    // Si trouvé, on ouvre automatiquement ce parent
    if (parentWithSelectedChild) {
      expandedItems.value = parentWithSelectedChild.value;
    }
  }
});

const handleItemClick = (item) => {
  if (!item.children) {
    selected.value = item.value;
    expandedItems.value = null;
  } else {
    expandedItems.value = expandedItems.value === item.value ? null : item.value;
  }
};

// Calcule la hauteur dynamique des sous-éléments
const calcHauteur = (children) => {
  const result = children.length * 36;
  return { height: `${result}px` };
};
</script>

<template>
  <section class="w-full h-full px-4">
    <!-- En-tête avec le bouton "Menu" -->
    <div v-if="props.title" class="font-semibold text-xl lg:pb-4 rounded lg:from-transparent  lg:to-transparent bg-linear-to-br from-primary-400 to-indigo-500 flex items-center justify-center lg:justify-start gap-2 mb-4 lg:mb-0 py-1 lg:py-0 border border-primary-500 lg:border-0 cursor-pointer lg:cursor-default text-white lg:text-gray-700" @click="isOpen = !isOpen">
      <p class="text-base lg:text-lg ">{{ props.title }}</p>
      <span class="lg:hidden transition-transform duration-300" :class="{ 'rotate-90': isOpen }">
        <Icon name="lucide:chevron-right" size="20" />
      </span>
    </div>
    <div v-else class="lg:hidden font-semibold text-xl lg:pb-4 rounded lg:from-transparent  lg:to-transparent bg-linear-to-br from-primary-400 to-indigo-500 flex items-center justify-center lg:justify-start gap-2 mb-4 lg:mb-0 py-1 lg:py-0 border border-primary-500 lg:border-0 cursor-pointer lg:cursor-default text-white lg:text-gray-700" @click="isOpen = !isOpen">
      <p class="text-base lg:text-lg ">Sommaire</p>
      <span class="lg:hidden transition-transform duration-300" :class="{ 'rotate-90': isOpen }">
        <Icon name="lucide:chevron-right" size="20" />
      </span>
    </div>

    <!-- Liste des items -->
    <div
      class="overflow-hidden transition-all duration-300 lg:overflow-visible"
      :style="{
        height: isOpen ? 'auto' : '0',
      }"
      :class="{ 'lg:h-auto': true }"
    >
      <div v-for="item in props.items" :key="item.value" class="border-l-muted cursor-pointer pt-1">
        <div 
          class="h-9 flex items-center gap-1 px-3 py-1.5 hover:bg-primary-100 rounded-md group " 
          :class="item.value === selected ? 'bg-linear-to-br from-primary-400 to-indigo-500 hover:bg-primary-400 hover:text-white' : ''" 
          @click="handleItemClick(item)"
          :aria-expanded="item.children ? expandedItems === item.value : undefined"
          :aria-controls="item.children ? `submenu-${item.value}` : undefined"
        >
          <Icon :name="item.icon" size="20" class="transition-colors duration-200  " :class="item.value === selected ? 'text-white' : 'text-gray-700'" />
          <div class="text-sm font-medium transition-colors duration-200 " :class="item.value === selected ? 'text-white' : ''">
            {{ item.label }}
          </div>

          <div v-if="item.badge" class="ml-auto w-8 flex justify-center">
            <div class="w-full rounded border  bg-primary-100 text-xs text-center font-semibold group-hover:border-primary-200 group-hover:text-white group-hover:bg-primary-400" :class="item.value === selected ? 'text-white bg-primary-400 border-primary-200' : 'text-gray-700 border-gray-400'">
              {{ item.badge }}
            </div>
          </div>

          <div v-if="item.children" class="ml-auto w-8 flex justify-center duration-300 transition-transform" :class="item.value === expandedItems ? 'rotate-90' : ''">
            <Icon name="lucide:chevron-right" size="20" class="font-bold rounded-full" />
          </div>
        </div>

        <!-- Sous-items -->
        <div 
          v-if="item.children" 
          :id="`submenu-${item.value}`"
          class="pl-5.5 overflow-hidden transition-all duration-300" 
          :style="item.value === expandedItems ? calcHauteur(item.children) : { height: '0px' }"
        >
          <div v-for="child in item.children" :key="child.value" class=" pl-4 border-l-muted border-l cursor-pointer h-9" @click.stop="selected = child.value">
            <div class="flex items-center gap-1 px-3 h-full hover:bg-primary-100 rounded-md group" :class="child.value === selected ? 'bg-primary-400 text-white hover:bg-primary-400' : ''">
              <div class="text-sm font-medium transition-colors duration-200 ">
                {{ child.label }}
              </div>
              <div v-if="child.badge" class="ml-auto w-8 flex justify-center">
                <div class="w-full rounded   text-xs text-center font-semibold">
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
