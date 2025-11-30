<script setup>

const user = useAuthUser()
const { isAdmin, isSuperAdmin } = useLevelUser()

// Computed pour vérifier si l'utilisateur est au moins admin
const isAtLeastAdmin = computed(() => isAdmin.value || isSuperAdmin.value)

const allItems = [
  {
    label: "Taches",
    icon: "i-lucide:clock-4",
    to: "/",
  },
  {
    label: "Chantiers",
    icon: "i-lucide:traffic-cone",
    children: [
      {
        label: "Mes chantiers",
        icon: "i-lucide:folder-open",
        description: "Mes chantiers assignés",
        to: "/chantiers",
      },
      {
        label: "Plan de charge général",
        icon: "i-lucide:calendar-days",
        description: "Visualisation de tous les chantiers par année",
        to: "/chantiers/plan-de-charge-general",
      },
      {
        label: "Planning RLT",
        icon: "i-lucide:user-round",
        description: "Plan de charge annuel des RLT",
        to: "",
      },
    ],
  },
  {
    label: "Dashboard",
    icon: "i-lucide:layout-dashboard",
    requiresAdmin: true, // Nécessite admin ou superadmin
    children: [
      {
        label: "Alertes",
        icon: "i-lucide:siren",
        description: "Visualisation des alertes de tous les chantiers. ",
        to: "",
      },
      {
        label: "RP1 / RP3",
        icon: "i-lucide:file-text",
        description: "Listing des taches RP1 et RP3 de tous les chantiers",
        to: "",
      },
      {
        label: "Cellulues Pré-op",
        icon: "i-lucide:clipboard-list",
        description: "Listes des taches de la cellule pré-op.",
        to: "",
      },
    ],
  },
  {
    label: "Paramètres",
    icon: "lucide:settings",
    to: "/parametres",
    requiresAdmin: true, // Nécessite admin ou superadmin
  },
];

// Filtrer les items selon les droits de l'utilisateur
const filteredItems = computed(() => {
  return allItems.filter(item => {
    if (item.requiresAdmin) {
      return isAtLeastAdmin.value;
    }
    return true;
  });
});

const viewMenu = ref(false);
const expandedChildren = reactive({});
const isDesktop = ref(false);

const handleResize = () => {
  if (typeof window === "undefined") {
    return;
  }
  isDesktop.value = window.innerWidth >= 1024;
};

onMounted(() => {
  handleResize();
  window.addEventListener("resize", handleResize);
});

onBeforeUnmount(() => {
  if (typeof window !== "undefined") {
    window.removeEventListener("resize", handleResize);
  }
});

const closeMenu = () => {
  viewMenu.value = false;
};

const toggleChildMenu = (label) => {
  expandedChildren[label] = !expandedChildren[label];
};

watch(viewMenu, (isOpen) => {
  if (!isOpen) {
    Object.keys(expandedChildren).forEach((key) => {
      expandedChildren[key] = false;
    });
  }
});

watch(isDesktop, (desktop) => {
  if (desktop) {
    closeMenu();
  }
});

const logout = async () => {
  try {
    await $fetch('/api/auth/logout', { credentials: 'include' })
    user.value = null
    navigateTo('/login')
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error)
    navigateTo('/login')
  }
};

const showMenu = () => {
  viewMenu.value = !viewMenu.value;
};
</script>
<template>
 
  <header class="print:hidden w-full flex justify-center duration-500 text-sm bg-white/80 backdrop-blur fixed top-0 z-50 border-b border-indigo-100 overflow-hidden lg:overflow-visible" :class="viewMenu ? 'h-full lg:h-16' : 'h-16'">
    <div class="relative h-full w-full max-w-[1400px] px-6 lg:px-2  flex flex-col lg:flex-row items-center">

      <div class="flex w-full lg:w-auto">
        <div class="py-2.5 h-16 flex flex-col flex-none animate__animated animate__jackInTheBox">
          <div class="flex gap-2">
            <p class="font-[Pacifico] text-3xl text-gray-700 ">H00 travaux</p>
            <div class="  text-xs  italic h-fit  border border-primary-500 px-1 border-dashed rounded bg-primary-100 text-primary-800"><p>v3.00</p>

            </div>
          </div>
          <!-- <p class="-mt-2 text-xs  pl-0.5 font-medium text-gray-700">Travaux</p> -->
        </div>

        <div class="lg:hidden cursor-pointer ml-auto h-16 flex flex-col justify-center" @click="showMenu()">
          <div class="h-[2px] w-5 mb-1 bg-gray-700" :class="viewMenu ? 'rotate-45 translate-y-[6px]  duration-300 ' : ''"></div>
          <div class="h-[2px] w-3 bg-gray-700 ml-auto mb-1" :class="viewMenu ? 'opacity-0' : ''"></div>
          <div class="h-[2px] w-5 bg-gray-700" :class="viewMenu ? '-rotate-45 -translate-y-[6px]  duration-300 ' : ''"></div>
        </div>
      </div>

<div class="h-full w-full flex flex-col lg:flex-row items-center lg:justify-end text-gray-600 font-avenirMedium">
  <div class="h-full flex flex-col lg:flex-row items-center gap-1 pt-12 lg:pt-0 list-none">
    <template v-for="item in filteredItems" :key="item.label">
      <!-- Item sans children : lien simple -->
      <NuxtLink v-if="!item.children" :to="item.to" class="" @click="closeMenu">
       
        <div class=" w-48 lg:w-24 px-4  lg:px-2 py-2 rounded-lg flex gap-4 lg:gap-0 lg:flex-col lg:justify-center items-center text-center cursor-pointer" :class="item.to === $route.path ? 'bg-primary-100 text-primary-800' : ' hover:text-primary-800 hover:bg-primary-50 duration-500'">
          <Icon v-if="item.icon" :name="item.icon" size="20" />
           <span class="text-sm">{{ item.label }}</span>
           
        </div>
      </NuxtLink>
      
      <!-- Item avec children : dropdown -->
      <div v-else class="w-full">
        <!-- Version mobile -->
        <div class="w-48 max-w-full lg:w-24 px-4 lg:px-2 py-2 rounded-lg flex items-center gap-4 text-center cursor-pointer lg:hidden" :class="expandedChildren[item.label] ? 'bg-primary-100 text-primary-800' : ' hover:text-primary-800 hover:bg-primary-50 duration-500'" @click.stop="toggleChildMenu(item.label)">
          <div class="flex items-center gap-4">
            <Icon v-if="item.icon" :name="item.icon" size="20" /> <span class="text-sm">{{ item.label }}</span>
          </div>
          <Icon name="i-lucide:chevron-right" size="18" class="ml-auto transition-transform duration-300 text-gray-500" :class="expandedChildren[item.label] ? 'rotate-90 text-primary-800' : ''" />
        </div>

        <Transition name="accordion">
          <div v-show="expandedChildren[item.label]" class="w-48 max-w-full lg:hidden pl-6 pb-3 flex flex-col mt-2">
            <NuxtLink v-for="child in item.children" :key="child.label" :to="child.to" class="block border-l pl-2 border-primary-200 " @click="closeMenu">
              <div class="px-3 py-2 text-sm text-gray-700 cursor-pointer rounded-md hover:bg-slate-200 duration-500" :class="child.to === $route.path ? 'bg-slate-200 text-gray-700' : ''">

                <span  class="wrap-break-word text-left">{{ child.label }}</span>
              </div>
            </NuxtLink>
          </div>
        </Transition>

        <!-- Version desktop -->
        <AppDropdownMenu v-if="isDesktop" trigger="hover" class="hidden lg:block ">
          <template #trigger>
            <div class="w-48 lg:w-24 px-4  lg:px-2 py-2 rounded-lg flex gap-4 lg:gap-0 lg:flex-col lg:justify-center items-center text-center cursor-pointer" :class="item.to === $route.path ? 'bg-primary-100 text-primary-800' : ' hover:text-primary-800 hover:bg-primary-50 duration-500'">
              <Icon v-if="item.icon" :name="item.icon" size="20" /> <span class="text-sm">{{ item.label }}</span>
            </div>
          </template>

          <div class="w-[calc(100vw-3rem)] max-w-2xl">
             <div class="relative grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-2 p-2 before:hidden lg:before:block before:absolute before:left-1/2 before:top-4 before:bottom-4 before:-translate-x-1/2 before:w-px before:bg-gray-200">
              <NuxtLink v-for="child in item.children" :key="child.label" :to="child.to" class="block" @click="closeMenu">
                <div class="px-3 py-2 text-sm text-gray-700 cursor-pointer rounded-md hover:bg-slate-200 duration-500" :class="child.to === $route.path ? 'bg-slate-200 text-gray-700' : ''">
                  <div v-if="child.icon || child.description" class="flex items-start gap-2 ">
                    <div class="  flex-none mt-0.5">
                       <Icon v-if="child.icon" :name="child.icon" size="20" />
                    </div>
                   
                    <div class="flex flex-col flex-1 min-w-0">
                      <span class="font-medium wrap-break-word">{{ child.label }}</span>
                      <span v-if="child.description" class="text-xs text-gray-500 wrap-break-word">{{ child.description }}</span>
                    </div>
                  </div>
                  <span v-else class="wrap-break-word">{{ child.label }}</span>
                </div>
              </NuxtLink>
            </div>
          </div>
        </AppDropdownMenu>
      </div>

    </template>
  </div>

  <!-- Infos utilisateur Mobile -->
  <div v-if="viewMenu && user" class="absolute bottom-4 left-0 right-0 mx-auto w-[calc(100%-2rem)] lg:hidden flex items-center justify-between rounded-xl border bg-primary-50  border-primary-100 px-4 py-3">
    <div class="flex items-center gap-3">
      <div class="w-9 h-9 rounded-full bg-primary-200 flex items-center justify-center text-primary-700 font-semibold text-sm">
        {{ user?.prenom?.charAt(0) || '' }}{{ user?.nom?.charAt(0) || '' }}
      </div>
      <div class="flex flex-col">
        <span class="text-sm font-medium text-gray-700">{{ user?.prenom }} {{ user?.nom }}</span>
        <span class="text-xs text-gray-500">{{ user?.email }}</span>
      </div>
    </div>
    <button class="p-2 rounded-lg hover:bg-red-100 text-gray-500 hover:text-red-600 transition-colors duration-300" title="Se déconnecter" @click="logout">
      <Icon name="i-lucide:log-out" size="20" />
    </button>
  </div>

  <!-- Infos utilisateur Desktop -->
  <div v-if="user" class="hidden lg:flex items-center gap-3 ml-6 pl-6 border-l border-gray-200">
    <div class="flex items-center gap-2">
      <div class="w-8 h-8 rounded-full bg-linear-to-br from-primary-400 to-indigo-500 flex items-center justify-center text-white font-medium text-xs shadow-sm">
        {{ user?.prenom?.charAt(0) || '' }}{{ user?.nom?.charAt(0) || '' }}
      </div>
      <span class="text-sm font-medium text-gray-700 max-w-32 truncate">{{ user?.prenom }} {{ user?.nom }}</span>
    </div>
    <button class="p-2 rounded-lg hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors duration-300 cursor-pointer" title="Se déconnecter" @click="logout">
      <Icon name="i-lucide:log-out" size="18" />
    </button>
  </div>
</div>


    </div>

  </header>
</template>

<style scoped>
.accordion-enter-active,
.accordion-leave-active {
  transition: all 0.25s ease;
}

.accordion-enter-from,
.accordion-leave-to {
  max-height: 0;
  opacity: 0;
}

.accordion-enter-to,
.accordion-leave-from {
  max-height: 500px;
  opacity: 1;
}
</style>
