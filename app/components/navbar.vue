<script setup>
import { APP_VERSION } from '~/utils/changelog'
const user = useAuthUser()
const { isAdmin, isSuperAdmin } = useLevelUser()
const { isDark } = useDarkMode()
const { nomEntite, logoUrl } = useApplication()

// Computed pour vérifier si l'utilisateur est au moins admin
const isAtLeastAdmin = computed(() => isAdmin.value || isSuperAdmin.value)

const allItems = [
  {
    label: 'Tâches',
    icon: 'i-lucide:clock-4',
    to: '/'
  },
  {
    label: 'Chantiers',
    icon: 'i-lucide:traffic-cone',
    description: 'Tous les chantiers',
    to: '/chantiers'
  },
  {
    label: 'Calendriers',
    icon: 'i-lucide:calendar-days',
    children: [
      {
        label: 'Plan de charge général',
        icon: 'i-lucide:calendar-clock',
        description: 'Visualisation de tous les chantiers par année',
        to: '/calendriers/plan-de-charge-general'
      },
      {
        label: 'Planning agent',
        icon: 'i-lucide:users-round',
        description: 'Plan de charge annuel des agents (RLT, KV, Pôle IT)',
        to: '/calendriers/plan-de-charge-rlt'
      },
      {
        label: 'Tâches',
        icon: 'lucide:clipboard-list',
        description: 'Planning annuel des tâches',
        to: '/calendriers/taches'
      }
    ]
  },
  {
    label: 'Dashboard',
    icon: 'i-lucide:layout-dashboard',
    children: [
      {
        label: 'Alertes',
        icon: 'i-lucide:siren',
        description: 'Visualisation des alertes de tous les chantiers. ',
        to: '/dashboard/alertes',
        requiresAdmin: true
      },
      {
        label: 'RP1 / RP3',
        icon: 'i-lucide:file-text',
        description: 'Listing des taches RP1 et RP3 de tous les chantiers',
        to: '/dashboard/rp1',
        requiresAdmin: true
      },
      {
        label: 'Statistiques',
        icon: 'i-lucide:bar-chart-3',
        description: 'Statistiques et graphiques des chantiers',
        to: '/dashboard/statistiques',
        requiresAdmin: true
      },
      {
        label: 'Logistique',
        icon: 'i-lucide:package',
        description: 'Suivi de la logistique des chantiers (base vie, imprimantes, WiFi, radios)',
        to: '/dashboard/logistique',
        requiresLogistique: true // Admin/SuperAdmin ou profil Logistique (num_profil === 1)
      },
      {
        label: 'EPM',
        icon: 'i-lucide:door-open',
        description: 'Suivi des entrées en périmètre maintenance (réserves, comptes rendus)',
        to: '/dashboard/epm',
        requiresAdmin: true
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

// Droits d'accès d'un item/enfant de menu
const canSee = (node) => {
  if (node.requiresAdmin) return isAtLeastAdmin.value
  if (node.requiresLogistique) return isAtLeastAdmin.value || Number(user.value?.profils) === 1
  return true
}

// Enfants visibles d'un item (selon le profil de l'utilisateur)
const visibleChildren = (item) => (item.children || []).filter(canSee)

// État actif : aplat pétrole (menu mobile, sous-menus)
const ACTIVE = 'bg-petrol-700 text-white dark:bg-secondary-600'
// Onglet de la barre desktop : souligné sarcelle au lieu de l'aplat, comme le chantier actif du panneau
const ACTIVE_TAB = `${ACTIVE} lg:bg-transparent lg:text-petrol-900 lg:dark:bg-transparent lg:dark:text-white lg:after:absolute lg:after:inset-x-3.5 lg:after:bottom-0 lg:after:h-0.75 lg:after:rounded-t-[3px] lg:after:bg-secondary-400`

// Onglet actif : sa page, ou l'une de ses sous-pages pour Calendriers / Dashboard
const route = useRoute()
const isActive = (item) => item.to === route.path || visibleChildren(item).some((child) => child.to === route.path)

// Filtrer les items : un parent à enfants est visible s'il a au moins un enfant visible
const filteredItems = computed(() => {
  return allItems.filter((item) => (item.children ? visibleChildren(item).length > 0 : canSee(item)))
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
    class="nav-header fixed top-0 z-50 flex w-full text-sm print:hidden"
    :class="[viewMenu ? 'h-full lg:h-16' : 'h-16', { 'theme-dark': isDark }]">
    <div class="relative flex h-full w-full flex-col lg:flex-row">
      <!-- Marque : bloc pétrole de la largeur du panneau latéral, qu'il prolonge (design V4) -->
      <div
        class="bg-petrol-900 dark:bg-petrol-950 flex h-16 w-full flex-none items-center gap-3 px-5 lg:w-80 lg:justify-center">
        <!-- Pastille blanche : le logo reste lisible sur le pétrole quelle que soit sa couleur -->
        <span v-if="logoUrl" class="flex rounded-md bg-white p-0.5">
          <AppLogo class="h-9 w-auto" />
        </span>
        <div class="flex flex-col gap-1" :class="{ 'lg:items-center': !logoUrl }">
          <div class="flex items-center gap-2.5">
            <span class="font-traverse text-[1.35rem] leading-none tracking-wide whitespace-nowrap text-white">
              H00 Travaux
            </span>
            <span class="rounded bg-white/10 px-1.5 py-0.5 text-[0.7rem] leading-none text-white/70">
              v{{ APP_VERSION }}
            </span>
          </div>
          <span v-if="nomEntite" class="text-[0.72rem] leading-none tracking-[0.01em] text-white/60">
            {{ nomEntite }}
          </span>
        </div>

        <button
          type="button"
          class="ml-auto flex h-16 cursor-pointer flex-col items-center justify-center gap-1 lg:hidden"
          :aria-expanded="viewMenu"
          aria-label="Menu"
          @click="showMenu()">
          <span
            class="h-0.5 w-5 bg-white transition-transform duration-300"
            :class="viewMenu ? 'translate-y-1.5 rotate-45' : ''"></span>
          <span
            class="ml-auto h-0.5 w-3 bg-white transition-opacity duration-300"
            :class="viewMenu ? 'opacity-0' : ''"></span>
          <span
            class="h-0.5 w-5 bg-white transition-transform duration-300"
            :class="viewMenu ? '-translate-y-1.5 -rotate-45' : ''"></span>
        </button>
      </div>

      <div
        class="text-primary-800 dark:bg-night-900 flex h-full w-full flex-col items-center overflow-y-auto bg-white lg:flex-row lg:justify-start lg:overflow-visible lg:border-b lg:border-slate-900/10 lg:px-8 dark:border-white/10">
        <div class="flex h-full list-none flex-col items-center gap-1 pt-8 pb-20 lg:flex-row lg:pt-0 lg:pb-0">
          <template v-for="item in filteredItems" :key="item.label">
            <!-- Item sans children : lien simple -->
            <NuxtLink v-if="!item.children" :to="item.to" class="" @click="closeMenu">
              <div
                class="flex w-80 cursor-pointer items-center gap-4 rounded-lg px-4 py-2 duration-300 lg:relative lg:h-16 lg:w-auto lg:gap-2 lg:rounded-none lg:px-3.5 lg:py-0"
                :class="
                  isActive(item)
                    ? ACTIVE_TAB
                    : 'text-primary-700 hover:bg-secondary-600/10 hover:text-secondary-700 lg:hover:text-petrol-900 dark:hover:text-secondary-300 lg:hover:bg-transparent lg:dark:hover:text-white'
                ">
                <Icon v-if="item.icon" :name="item.icon" size="18" />
                <span class="text-sm font-medium">{{ item.label }}</span>
              </div>
            </NuxtLink>

            <!-- Item avec children : dropdown -->
            <div v-else class="w-full">
              <!-- Version mobile -->
              <div
                class="flex w-80 max-w-full cursor-pointer items-center gap-4 rounded-lg px-4 py-2 text-center duration-300 lg:hidden lg:w-24 lg:px-2"
                :class="
                  expandedChildren[item.label]
                    ? 'bg-secondary-600/10 text-secondary-700 dark:text-secondary-300'
                    : 'text-primary-700 hover:bg-secondary-600/10 hover:text-secondary-700 dark:hover:text-secondary-300'
                "
                @click.stop="toggleChildMenu(item.label)">
                <div class="flex items-center gap-4">
                  <Icon v-if="item.icon" :name="item.icon" size="20" />
                  <span class="text-sm">{{ item.label }}</span>
                </div>
                <Icon
                  name="i-lucide:chevron-right"
                  size="18"
                  class="ml-auto transition-transform duration-300"
                  :class="
                    expandedChildren[item.label]
                      ? 'text-secondary-700 dark:text-secondary-300 rotate-90'
                      : 'text-primary-500'
                  " />
              </div>

              <Transition name="accordion">
                <div
                  v-show="expandedChildren[item.label]"
                  class="mt-2 flex w-80 max-w-full flex-col pb-3 pl-6 lg:hidden">
                  <NuxtLink
                    v-for="child in visibleChildren(item)"
                    :key="child.label"
                    :to="child.to"
                    class="border-secondary-600/25 block w-full border-l pl-2"
                    @click="closeMenu">
                    <div
                      class="text-primary-700 hover:bg-secondary-600/10 hover:text-secondary-700 dark:hover:text-secondary-300 cursor-pointer rounded-md px-3 py-2 text-sm duration-300"
                      :class="child.to === $route.path ? ACTIVE : ''">
                      <span class="text-left wrap-break-word">{{ child.label }}</span>
                    </div>
                  </NuxtLink>
                </div>
              </Transition>

              <!-- Version desktop -->
              <AppDropdownMenu v-if="isDesktop" trigger="hover" class="hidden lg:block">
                <template #trigger>
                  <div
                    class="flex w-48 cursor-pointer items-center gap-4 rounded-lg px-4 py-2 duration-300 lg:relative lg:h-16 lg:w-auto lg:gap-2 lg:rounded-none lg:px-3.5 lg:py-0"
                    :class="
                      isActive(item)
                        ? ACTIVE_TAB
                        : 'text-primary-700 hover:bg-secondary-600/10 hover:text-secondary-700 lg:hover:text-petrol-900 dark:hover:text-secondary-300 lg:hover:bg-transparent lg:dark:hover:text-white'
                    ">
                    <Icon v-if="item.icon" :name="item.icon" size="18" />
                    <span class="text-sm font-medium">{{ item.label }}</span>
                    <Icon name="lucide:chevron-down" size="14" class="opacity-60" />
                  </div>
                </template>

                <div class="w-[calc(100vw-3rem)] max-w-2xl">
                  <div
                    class="before:bg-primary-200 relative grid grid-cols-1 gap-x-6 gap-y-2 before:absolute before:top-4 before:bottom-4 before:left-1/2 before:hidden before:w-px before:-translate-x-1/2 lg:grid-cols-2 lg:before:block">
                    <NuxtLink
                      v-for="child in visibleChildren(item)"
                      :key="child.label"
                      :to="child.to"
                      class="block"
                      @click="closeMenu">
                      <div
                        class="group hover:bg-secondary-600/10 hover:text-secondary-700 dark:hover:text-secondary-300 h-full cursor-pointer rounded-md px-3 py-2 text-sm"
                        :class="child.to === $route.path ? ACTIVE : 'text-primary-700 duration-300'">
                        <div v-if="child.icon || child.description" class="flex items-start gap-2">
                          <div class="mt-0.5 flex-none">
                            <Icon v-if="child.icon" :name="child.icon" size="20" />
                          </div>

                          <div class="flex min-w-0 flex-1 flex-col">
                            <span class="font-medium wrap-break-word">{{ child.label }}</span>
                            <span v-if="child.description" class="text-xs wrap-break-word opacity-80 duration-300">
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
            class="border-secondary-600/20 bg-secondary-600/5 absolute right-0 bottom-4 left-0 mx-auto flex w-[calc(100%-2rem)] items-center justify-between rounded-xl border px-4 py-3 backdrop-blur-md lg:hidden dark:border-white/10 dark:bg-white/5">
            <div class="flex items-center gap-3">
              <div
                class="from-secondary-600 to-secondary-800 shadow-secondary-700/40 flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br text-sm font-semibold text-white shadow-sm">
                {{ user?.prenom?.charAt(0) || '' }}{{ user?.nom?.charAt(0) || '' }}
              </div>
              <div class="flex flex-col">
                <span class="text-primary-800 text-sm font-medium">{{ user?.prenom }} {{ user?.nom }}</span>
                <span class="text-primary-600 text-xs">{{ user?.email }}</span>
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
        <div
          v-if="user"
          class="ml-auto hidden h-fit items-center gap-3 border-l border-slate-900/10 pl-6 lg:flex dark:border-white/10">
          <div class="flex items-center gap-2">
            <div
              class="bg-secondary-700 flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white">
              {{ user?.prenom?.charAt(0) || '' }}{{ user?.nom?.charAt(0) || '' }}
            </div>
            <div class="flex max-w-32 flex-col truncate">
              <span class="text-primary-700 truncate text-xs">{{ user?.prenom }}</span>
              <span class="text-primary-800 truncate text-sm font-medium">{{ user?.nom }}</span>
            </div>
          </div>
          <div class="px-2">
            <AppDarkModeSwitch />
          </div>
          <button
            class="text-primary-900 flex cursor-pointer items-center justify-center rounded-lg p-2 transition-colors duration-300 hover:bg-red-100 hover:text-red-600"
            title="Se déconnecter"
            @click="logout">
            <Icon name="i-lucide:log-out" size="18" class="h-fit" />
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
