<script setup>
definePageMeta({
  requiresAuth: true,
  requiredRole: 'admin' // Admin ou superadmin
})
useHead({
  title: 'H00 - Paramètres',
  description: "Paramètres de l'application"
})

const { isSuperAdmin } = useLevelUser()
const { getAllUsers, users } = useUsers()

// Charger les utilisateurs au montage pour avoir le nombre total
onMounted(async () => {
  await getAllUsers()
})

// Computed pour le nombre total d'utilisateurs
const totalUsers = computed(() => {
  return users.value?.length || 0
})

const selectedNav = ref(1)

// Filtrer les items selon les droits
const items = computed(() => {
  const allItems = [
    {
      label: 'Tâches',
      icon: 'i-lucide-clipboard-list',
      value: 1,
      requiresSuperAdmin: true
    },
    {
      label: 'Catégories',
      icon: 'i-lucide-folder-tree',
      value: 2,
      requiresSuperAdmin: true
    },
    {
      label: 'Chantiers',
      icon: 'i-lucide-building-2',
      value: 3,
      requiresSuperAdmin: false
    },
    {
      label: 'Utilisateurs',
      icon: 'i-lucide-users',
      value: 4,
      badge: totalUsers.value > 0 ? totalUsers.value.toString() : undefined,
      requiresSuperAdmin: false
    },
    {
      label: 'Matières',
      icon: 'i-lucide-package',
      value: 'matieres',
      requiresSuperAdmin: true,
      children: [
        { label: 'Ensembles', value: 5 },
        { label: 'Logiques métier', value: 6 }
      ]
    },
    {
      label: 'Logistique',
      icon: 'i-lucide-truck',
      value: 'logistique',
      requiresSuperAdmin: false,
      children: [
        { label: 'Imprimantes', value: 'imprimantes' },
        { label: 'Réseau', value: 'boxes' }
      ]
    }
  ]

  // Filtrer selon les droits
  return allItems.filter((item) => {
    if (item.requiresSuperAdmin) {
      return isSuperAdmin.value
    }
    return true // Admin ou superadmin peuvent y accéder
  })
})

// Réinitialiser selectedNav si l'item sélectionné n'est plus disponible
// (inclut les children pour les groupes comme "Matières")
watch(
  items,
  (newItems) => {
    const availableValues = newItems.flatMap((item) =>
      item.children ? item.children.map((c) => c.value) : [item.value]
    )
    if (!availableValues.includes(selectedNav.value)) {
      selectedNav.value = availableValues[0] || 1
    }
  },
  { immediate: true }
)
</script>
<template>
  <AppPageLayout>
    <!-- Slot sidebar - Partie gauche sticky -->
    <template #sidebar>
      <AppLeftNavBar v-model="selectedNav" :items="items" title="Sommaire" />
    </template>

    <ParametresTaches v-if="selectedNav === 1 && isSuperAdmin" />
    <ParametresCategories v-if="selectedNav === 2 && isSuperAdmin" />
    <ParametresChantiers v-if="selectedNav === 3" />
    <ParametresUtilisateurs v-if="selectedNav === 4" />
    <ParametresEnsembles v-if="selectedNav === 5 && isSuperAdmin" />
    <ParametresAssistants v-if="selectedNav === 6 && isSuperAdmin" />
    <ParametresImprimantes v-if="selectedNav === 'imprimantes'" />
    <ParametresBox v-if="selectedNav === 'boxes'" />
    <div
      v-if="(selectedNav === 1 || selectedNav === 2 || selectedNav === 5 || selectedNav === 6) && !isSuperAdmin"
      class="flex min-h-[400px] items-center justify-center">
      <div class="space-y-4 text-center">
        <div class="text-4xl">🔒</div>
        <h2 class="text-xl font-semibold">Accès restreint</h2>
        <p class="text-muted">Vous devez être super administrateur pour accéder à cette section.</p>
      </div>
    </div>
  </AppPageLayout>
</template>
