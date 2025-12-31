<script setup>
const user = useAuthUser()
const { isAdmin, isSuperAdmin } = useLevelUser()

// Computed pour vérifier si l'utilisateur est au moins admin
const isAtLeastAdmin = computed(() => isAdmin.value || isSuperAdmin.value)

const allItems = [
  {
    label: 'Taches',
    icon: 'i-lucide:clock-4',
    to: '/'
  },
  {
    label: 'Chantiers',
    icon: 'i-lucide:traffic-cone',
    children: [
      {
        label: 'Chantiers',
        icon: 'i-lucide:folder-open',
        description: 'Tous les chantiers',
        to: '/chantiers'
      },
      {
        label: 'Plan de charge général',
        icon: 'i-lucide:calendar-days',
        description: 'Visualisation de tous les chantiers par année',
        to: '/chantiers/plan-de-charge-general'
      },
      {
        label: 'Planning RLT',
        icon: 'i-lucide:user-round',
        description: 'Plan de charge annuel des RLT',
        to: '/chantiers/plan-de-charge-rlt'
      }
    ]
  },
  {
    label: 'Dashboard',
    icon: 'i-lucide:layout-dashboard',
    requiresAdmin: true, // Nécessite admin ou superadmin
    children: [
      {
        label: 'Alertes',
        icon: 'i-lucide:siren',
        description: 'Visualisation des alertes de tous les chantiers. ',
        to: '/dashboard/alertes'
      },
      {
        label: 'RP1 / RP3',
        icon: 'i-lucide:file-text',
        description: 'Listing des taches RP1 et RP3 de tous les chantiers',
        to: ''
      },
      {
        label: 'Cellulues Pré-op',
        icon: 'i-lucide:clipboard-list',
        description: 'Listes des taches de la cellule pré-op.',
        to: ''
      }
    ]
  },
  {
    label: 'Paramètres',
    icon: 'lucide:settings',
    to: '/parametres',
    requiresAdmin: true // Nécessite admin ou superadmin
  }
]

// Filtrer les items selon les droits de l'utilisateur
const filteredItems = computed(() => {
  return allItems.filter((item) => {
    if (item.requiresAdmin) {
      return isAtLeastAdmin.value
    }
    return true
  })
})

const viewMenu = ref(false)
const expandedChildren = reactive({})
const isDesktop = ref(false)

const handleResize = () => {
  if (typeof window === 'undefined') {
    return
  }
  isDesktop.value = window.innerWidth >= 1024
}

onMounted(() => {
  handleResize()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', handleResize)
  }
})

const closeMenu = () => {
  viewMenu.value = false
}

const toggleChildMenu = (label) => {
  expandedChildren[label] = !expandedChildren[label]
}

watch(viewMenu, (isOpen) => {
  if (!isOpen) {
    Object.keys(expandedChildren).forEach((key) => {
      expandedChildren[key] = false
    })
  }
})

watch(isDesktop, (desktop) => {
  if (desktop) {
    closeMenu()
  }
})

const logout = async () => {
  try {
    await $fetch('/api/auth/logout', { credentials: 'include' })
    user.value = null
    navigateTo('/login')
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error)
    navigateTo('/login')
  }
}

const showMenu = () => {
  viewMenu.value = !viewMenu.value
}
</script>
<template>
  <header
    class="border-primary-800/10 fixed top-0 z-50 flex w-full justify-center border-b bg-white text-sm backdrop-blur-xl duration-500 dark:bg-black print:hidden"
    :class="viewMenu ? 'h-screen lg:h-16' : 'h-16'">
    <div class="relative flex h-full w-full max-w-[1400px] flex-col items-center px-6 lg:flex-row lg:px-2">
      <div class="flex w-full items-center lg:w-auto">
        <div class="animate__animated animate__jackInTheBox flex h-16 flex-none flex-col justify-center py-2.5">
          <div class="flex items-center gap-2">
            <img src="/images/logo_uo.png" alt="Logo" class="h-14 w-auto" />
            <div class="text-primary-800 flex flex-col font-[Traverse] text-2xl">
              <div class="relative">
                <div class="tracking-widest">H00</div>
              </div>
              <div class="-mt-2 text-sm">travaux</div>
            </div>
            <div
              class="border-primary-700 bg-primary-700/20 text-primary-800 mt-1 mb-auto -ml-3 flex items-center justify-center rounded border border-dashed px-1 text-xs italic">
              <div>v3.00</div>
            </div>
          </div>
        </div>

        <div
          class="ml-auto flex h-16 cursor-pointer flex-col items-center justify-center gap-1 lg:hidden"
          @click="showMenu()">
          <div
            class="bg-primary-700 h-0.5 w-5 transition-transform duration-300"
            :class="viewMenu ? 'translate-y-1.5 rotate-45' : ''"></div>
          <div
            class="bg-primary-700 ml-auto h-0.5 w-3 transition-opacity duration-300"
            :class="viewMenu ? 'opacity-0' : ''"></div>
          <div
            class="bg-primary-700 h-0.5 w-5 transition-transform duration-300"
            :class="viewMenu ? '-translate-y-1.5 -rotate-45' : ''"></div>
        </div>
      </div>

      <div
        class="text-primary-800 flex h-full w-full flex-col items-center overflow-y-auto lg:flex-row lg:justify-end lg:overflow-visible">
        <div class="flex h-full list-none flex-col items-center gap-1 pt-8 pb-20 lg:flex-row lg:pt-0 lg:pb-0">
          <template v-for="item in filteredItems" :key="item.label">
            <!-- Item sans children : lien simple -->
            <NuxtLink v-if="!item.children" :to="item.to" class="" @click="closeMenu">
              <div
                class="flex w-80 cursor-pointer items-center gap-4 rounded-lg px-4 py-2 text-center lg:w-24 lg:flex-col lg:justify-center lg:gap-0 lg:px-2"
                :class="
                  item.to === $route.path
                    ? 'bg-primary-700 text-primary-50'
                    : 'hover:text-primary-900 hover:bg-primary-700/20 duration-500'
                ">
                <Icon v-if="item.icon" :name="item.icon" size="20" />
                <span class="text-sm">{{ item.label }}</span>
              </div>
            </NuxtLink>

            <!-- Item avec children : dropdown -->
            <div v-else class="w-full">
              <!-- Version mobile -->
              <div
                class="flex w-80 max-w-full cursor-pointer items-center gap-4 rounded-lg px-4 py-2 text-center lg:hidden lg:w-24 lg:px-2"
                :class="
                  expandedChildren[item.label]
                    ? 'bg-primary-700/20 text-primary-800'
                    : 'hover:text-primary-900 hover:bg-primary-700/20 duration-500'
                "
                @click.stop="toggleChildMenu(item.label)">
                <div class="flex items-center gap-4">
                  <Icon v-if="item.icon" :name="item.icon" size="20" />
                  <span class="text-sm">{{ item.label }}</span>
                </div>
                <Icon
                  name="i-lucide:chevron-right"
                  size="18"
                  class="text-primary-500 ml-auto transition-transform duration-300"
                  :class="expandedChildren[item.label] ? 'text-primary-800 rotate-90' : ''" />
              </div>

              <Transition name="accordion">
                <div
                  v-show="expandedChildren[item.label]"
                  class="mt-2 flex w-80 max-w-full flex-col pb-3 pl-6 lg:hidden">
                  <NuxtLink
                    v-for="child in item.children"
                    :key="child.label"
                    :to="child.to"
                    class="border-primary-700/30 block w-full border-l pl-2"
                    @click="closeMenu">
                    <div
                      class="text-primary-700 hover:bg-primary-200 cursor-pointer rounded-md px-3 py-2 text-sm duration-500"
                      :class="child.to === $route.path ? 'bg-primary-200 text-primary-700' : ''">
                      <span class="text-left wrap-break-word">{{ child.label }}</span>
                    </div>
                  </NuxtLink>
                </div>
              </Transition>

              <!-- Version desktop -->
              <AppDropdownMenu v-if="isDesktop" trigger="hover" class="hidden lg:block">
                <template #trigger>
                  <div
                    class="flex w-48 cursor-pointer items-center gap-4 rounded-lg px-4 py-2 text-center lg:w-24 lg:flex-col lg:justify-center lg:gap-0 lg:px-2"
                    :class="
                      item.to === $route.path
                        ? 'bg-primary-700 text-primary-50'
                        : 'hover:text-primary-900 hover:bg-primary-700/20 duration-500'
                    ">
                    <Icon v-if="item.icon" :name="item.icon" size="20" />
                    <span class="text-sm">{{ item.label }}</span>
                  </div>
                </template>

                <div class="w-[calc(100vw-3rem)] max-w-2xl">
                  <div
                    class="before:bg-primary-200 bg-primary-50 relative grid grid-cols-1 gap-x-6 gap-y-2 p-2 before:absolute before:top-4 before:bottom-4 before:left-1/2 before:hidden before:w-px before:-translate-x-1/2 lg:grid-cols-2 lg:before:block">
                    <NuxtLink
                      v-for="child in item.children"
                      :key="child.label"
                      :to="child.to"
                      class="block"
                      @click="closeMenu">
                      <div
                        class="group hover:bg-primary-700/20 text-primary-700 hover:text-primary-800 cursor-pointer rounded-md px-3 py-2 text-sm"
                        :class="
                          child.to === $route.path
                            ? 'bg-primary-700 text-primary-50 group-hover:text-primary-50 duration-300'
                            : 'group-hover:text-primary-800 duration-300'
                        ">
                        <div v-if="child.icon || child.description" class="flex items-start gap-2">
                          <div class="mt-0.5 flex-none">
                            <Icon v-if="child.icon" :name="child.icon" size="20" />
                          </div>

                          <div class="flex min-w-0 flex-1 flex-col">
                            <span class="font-medium wrap-break-word">{{ child.label }}</span>
                            <span v-if="child.description" class="text-xs wrap-break-word duration-300">
                              {{ child.description }}
                            </span>
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
        <Transition name="user-card">
          <div
            v-if="viewMenu && user"
            class="bg-primary-700/20 border-primary-700/30 absolute right-0 bottom-4 left-0 mx-auto flex w-[calc(100%-2rem)] items-center justify-between rounded-xl border px-4 py-3 lg:hidden">
            <div class="flex items-center gap-3">
              <div
                class="from-primary-600 to-primary-700 text-primary-50 flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br text-sm font-semibold shadow-sm">
                {{ user?.prenom?.charAt(0) || '' }}{{ user?.nom?.charAt(0) || '' }}
              </div>
              <div class="flex flex-col">
                <span class="text-primary-800 text-sm font-medium">{{ user?.prenom }} {{ user?.nom }}</span>
                <span class="text-primary-700 text-xs">{{ user?.email }}</span>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <AppDarkModeSwitch />

              <button
                class="text-primary-700 flex cursor-pointer items-center justify-center rounded-lg p-2 transition-colors duration-300 hover:bg-red-100 hover:text-red-600"
                title="Se déconnecter"
                @click="logout">
                <Icon name="i-lucide:log-out" size="18" class="h-fit" />
              </button>
            </div>
          </div>
        </Transition>

        <!-- Infos utilisateur Desktop -->
        <div v-if="user" class="border-primary-200 ml-6 hidden h-full items-center gap-3 border-l pl-6 lg:flex">
          <div class="flex items-center gap-2">
            <div
              class="from-primary-600 to-primary-700 text-primary-50 flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br text-xs font-medium shadow-sm">
              {{ user?.prenom?.charAt(0) || '' }}{{ user?.nom?.charAt(0) || '' }}
            </div>
            <div class="flex max-w-32 flex-col truncate">
              <span class="text-primary-700 truncate text-xs">{{ user?.prenom }}</span>
              <span class="text-primary-800 truncate text-sm font-medium">{{ user?.nom }}</span>
            </div>
          </div>
          <button
            class="text-primary-900 flex cursor-pointer items-center justify-center rounded-lg p-2 transition-colors duration-300 hover:bg-red-100 hover:text-red-600"
            title="Se déconnecter"
            @click="logout">
            <Icon name="i-lucide:log-out" size="18" class="h-fit" />
          </button>
          <div class="pr-4">
            <AppDarkModeSwitch />
          </div>
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

/* Animation pour la card utilisateur */
.user-card-enter-active {
  transition: all 0.4s ease;
  transition-delay: 0.2s;
}

.user-card-leave-active {
  transition: all 0.3s ease;
}

.user-card-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.user-card-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
