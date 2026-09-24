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
    accroche: "Les plannings de l'année : chantiers, agents et tâches",
    children: [
      {
        label: 'Plan de charge général',
        icon: 'i-lucide:calendar-clock',
        description: 'Tous les chantiers, semaine par semaine',
        to: '/calendriers/plan-de-charge-general'
      },
      {
        label: 'Planning agent',
        icon: 'i-lucide:users-round',
        description: 'La charge des RLT, des KV et du Pôle IT',
        to: '/calendriers/plan-de-charge-rlt'
      },
      {
        label: 'Tâches',
        icon: 'lucide:clipboard-list',
        description: 'Les tâches que vous suivez, mois par mois',
        to: '/calendriers/taches'
      }
    ]
  },
  {
    label: 'Dashboard',
    icon: 'i-lucide:layout-dashboard',
    accroche: 'Le suivi de tous les chantiers en cours',
    children: [
      {
        label: 'Alertes',
        icon: 'i-lucide:siren',
        description: 'Les tâches signalées en alerte',
        to: '/dashboard/alertes',
        requiresAdmin: true
      },
      {
        label: 'RP1 / RP3',
        icon: 'i-lucide:file-text',
        description: 'Les tâches RP1 et RP3 à suivre',
        to: '/dashboard/rp1',
        requiresAdmin: true
      },
      {
        label: 'Statistiques',
        icon: 'i-lucide:bar-chart-3',
        description: "L'activité des chantiers, année par année",
        to: '/dashboard/statistiques',
        requiresAdmin: true
      },
      {
        label: 'Logistique',
        icon: 'i-lucide:package',
        description: 'Base vie, imprimantes, réseau et radios',
        to: '/dashboard/logistique',
        requiresLogistique: true // Admin/SuperAdmin ou profil Logistique (num_profil === 1)
      },
      {
        label: 'EPM',
        icon: 'i-lucide:door-open',
        description: 'Entrées en périmètre maintenance et réserves',
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

// État actif : aplat pourpre (menu mobile, sous-menus)
const ACTIVE = 'bg-magenta-700 text-white dark:bg-secondary-600'

// Onglet de la barre desktop : icône au-dessus du libellé, souligné magenta au lieu de l'aplat, comme le
// chantier actif du panneau. Le trait couvre tout l'onglet (2 px de retrait) : centré sous le libellé, il
// englobe aussi la flèche des menus déroulants, logée dans la marge droite
const ACTIVE_TAB = `${ACTIVE} lg:bg-transparent lg:text-magenta-900 lg:dark:bg-transparent lg:dark:text-white lg:after:absolute lg:after:inset-x-0.5 lg:after:bottom-0 lg:after:h-0.75 lg:after:rounded-t-[3px] lg:after:bg-secondary-400`
const LIEN =
  'text-primary-700 hover:bg-secondary-600/10 hover:text-secondary-700 lg:hover:text-magenta-900 dark:hover:text-secondary-300 lg:hover:bg-transparent lg:dark:hover:text-white'

const route = useRoute()

// Onglet actif : sa page, ou l'une de ses sous-pages pour Calendriers / Dashboard
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

// Menu déroulant : un clic sur une page le referme (il resterait ouvert sous la souris)
const fermerMenu = (close) => {
  close()
  closeMenu()
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
      <!-- Marque : bloc blanc de la largeur de la barre latérale, qu'il prolonge (design V4). Aligné à gauche
           sur le bord des cartes du panneau ; « H00 Travaux » en texte dégradé, comme la page de connexion -->
      <div
        class="bg-card border-rule flex h-16 w-full flex-none items-center gap-3 border-b px-4 lg:w-80 lg:border-r lg:border-b-0">
        <!-- Pastille blanche : le logo reste lisible quel que soit le fond -->
        <span v-if="logoUrl" class="flex rounded-md bg-white p-0.5 ring-1 ring-slate-200 dark:ring-0">
          <AppLogo class="h-9 w-auto" />
        </span>
        <div class="flex flex-col gap-1">
          <div class="flex items-center gap-2.5">
            <span
              class="font-traverse from-magenta-500 via-prune-500 to-prune-700 dark:from-magenta-400 dark:via-prune-300 dark:to-prune-100 bg-linear-90 bg-clip-text text-[1.35rem] leading-none tracking-wide whitespace-nowrap text-transparent">
              H00 Travaux
            </span>
            <!-- Version : pastille fine, liseré magenta -->
            <span
              class="text-magenta-700 ring-magenta-300/70 dark:text-magenta-300 dark:ring-magenta-400/40 rounded-full px-1.5 py-0.5 text-[0.65rem] leading-none font-semibold tracking-wide tabular-nums ring-1 ring-inset">
              v{{ APP_VERSION }}
            </span>
          </div>
          <span v-if="nomEntite" class="text-ink-soft text-[0.72rem] leading-none tracking-[0.01em]">
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
            class="bg-ink h-0.5 w-5 transition-transform duration-300"
            :class="viewMenu ? 'translate-y-1.5 rotate-45' : ''"></span>
          <span
            class="bg-ink ml-auto h-0.5 w-3 transition-opacity duration-300"
            :class="viewMenu ? 'opacity-0' : ''"></span>
          <span
            class="bg-ink h-0.5 w-5 transition-transform duration-300"
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
                class="flex w-80 cursor-pointer items-center gap-4 rounded-lg px-4 py-2 duration-300 lg:relative lg:h-16 lg:w-auto lg:flex-col lg:justify-center lg:gap-1 lg:rounded-none lg:px-4 lg:py-0"
                :class="isActive(item) ? ACTIVE_TAB : LIEN">
                <Icon v-if="item.icon" :name="item.icon" size="18" />
                <span class="text-sm font-medium lg:text-[13px]">{{ item.label }}</span>
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
              <!-- Menu déroulant (design V4) : bandeau de la rubrique à gauche, ses pages à droite -->
              <AppDropdownMenu
                v-if="isDesktop"
                trigger="hover"
                align="start"
                :offset="0"
                panel-class="bg-card border-rule mt-1 overflow-hidden rounded-xl border shadow-[0_24px_48px_-20px_rgb(43_4_35/0.35)] dark:shadow-[0_24px_48px_-20px_rgb(0_0_0/0.7)]"
                class="hidden lg:block">
                <template #trigger>
                  <div
                    class="flex w-48 cursor-pointer items-center gap-4 rounded-lg px-4 py-2 duration-300 lg:relative lg:h-16 lg:w-auto lg:flex-col lg:justify-center lg:gap-1 lg:rounded-none lg:px-4 lg:py-0"
                    :class="isActive(item) ? ACTIVE_TAB : LIEN">
                    <Icon v-if="item.icon" :name="item.icon" size="18" />
                    <!-- Libellé centré sous l'icône ; la flèche se loge dans la marge droite de l'onglet -->
                    <span class="relative text-sm font-medium lg:text-[13px]">
                      {{ item.label }}
                      <Icon
                        name="lucide:chevron-down"
                        size="12"
                        class="absolute top-1/2 left-full ml-0.5 -translate-y-1/2 opacity-60" />
                    </span>
                  </div>
                </template>

                <template #default="{ close }">
                  <div class="flex">
                    <!-- Bandeau de la rubrique, comme le haut des cartes de connexion -->
                    <div
                      class="bg-bandeau relative flex w-52 shrink-0 flex-col justify-between overflow-hidden p-5 text-white">
                      <svg
                        class="pointer-events-none absolute inset-0 size-full"
                        viewBox="0 0 200 240"
                        preserveAspectRatio="none"
                        aria-hidden="true">
                        <polygon class="fill-white/10" points="0,0 120,0 0,150" />
                        <polygon class="fill-black/15" points="200,110 200,240 60,240" />
                      </svg>
                      <span class="relative flex size-10 items-center justify-center rounded-lg bg-white/15">
                        <Icon :name="item.icon" size="22" />
                      </span>
                      <div class="relative mt-8">
                        <p class="font-traverse text-xl leading-none tracking-[0.03em]">{{ item.label }}</p>
                        <p v-if="item.accroche" class="mt-2 text-xs leading-relaxed text-white/80">
                          {{ item.accroche }}
                        </p>
                      </div>
                    </div>

                    <!-- Pages de la rubrique : tuile d'icône, libellé, description -->
                    <nav
                      class="grid content-start gap-1 p-2.5"
                      :class="visibleChildren(item).length > 3 ? 'w-[34rem] grid-cols-2' : 'w-80 grid-cols-1'"
                      :aria-label="item.label">
                      <NuxtLink
                        v-for="child in visibleChildren(item)"
                        :key="child.label"
                        :to="child.to"
                        class="group/lien focus-visible:outline-secondary-500 flex items-start gap-3 rounded-lg p-2.5 transition-colors focus-visible:outline-2"
                        :class="
                          child.to === $route.path
                            ? 'bg-magenta-50/70 dark:bg-magenta-500/10'
                            : 'hover:bg-taupe-100 dark:hover:bg-white/5'
                        "
                        :aria-current="child.to === $route.path ? 'page' : undefined"
                        @click="fermerMenu(close)">
                        <span
                          class="flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors"
                          :class="
                            child.to === $route.path
                              ? 'bg-magenta-600 text-white'
                              : 'bg-magenta-50 text-magenta-600 group-hover/lien:bg-magenta-600 dark:text-magenta-300 group-hover/lien:text-white dark:bg-white/8'
                          ">
                          <Icon :name="child.icon" size="18" />
                        </span>
                        <span class="min-w-0 flex-1">
                          <span
                            class="flex items-center gap-1.5 text-sm font-semibold"
                            :class="child.to === $route.path ? 'text-magenta-700 dark:text-magenta-300' : 'text-ink'">
                            {{ child.label }}
                            <Icon
                              name="lucide:arrow-right"
                              size="14"
                              class="text-magenta-600 dark:text-magenta-300 -translate-x-1 opacity-0 transition group-hover/lien:translate-x-0 group-hover/lien:opacity-100 motion-reduce:transition-none" />
                          </span>
                          <span v-if="child.description" class="text-ink-soft mt-0.5 block text-xs leading-snug">
                            {{ child.description }}
                          </span>
                        </span>
                      </NuxtLink>
                    </nav>
                  </div>
                </template>
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
