<script setup>
definePageMeta({
  requiresAuth: true,
  requiredRole: 'admin', // Admin ou superadmin

});
useHead({
  title: "H00 - Paramètres",
  description: "Paramètres de l'application",
});

const { isSuperAdmin } = useLevelUser(); 
const { getAllUsers, users } = useUsers();

// Charger les utilisateurs au montage pour avoir le nombre total
onMounted(async () => {
  await getAllUsers();
});

// Computed pour le nombre total d'utilisateurs
const totalUsers = computed(() => {
  return users.value?.length || 0;
});

const selectedNav = ref(1);

// Filtrer les items selon les droits
const items = computed(() => {
  const allItems = [
    { 
      label: "Tâches", 
      icon: "i-lucide-clipboard-list", 
      value: 1,
      requiresSuperAdmin: true
    },
    { 
      label: "Catégories", 
      icon: "i-lucide-folder-tree", 
      value: 2,
      requiresSuperAdmin: true
    },
    { 
      label: "Chantiers", 
      icon: "i-lucide-building-2", 
      value: 3,
      requiresSuperAdmin: false
    },
    { 
      label: "Utilisateurs", 
      icon: "i-lucide-users", 
      value: 4,
      badge: totalUsers.value > 0 ? totalUsers.value.toString() : undefined,
      requiresSuperAdmin: false
    },
  ];
  
  // Filtrer selon les droits
  return allItems.filter(item => {
    if (item.requiresSuperAdmin) {
      return isSuperAdmin.value;
    }
    return true; // Admin ou superadmin peuvent y accéder
  });
});

// Réinitialiser selectedNav si l'item sélectionné n'est plus disponible
watch(items, (newItems) => {
  const availableValues = newItems.map(item => item.value);
  if (!availableValues.includes(selectedNav.value)) {
    selectedNav.value = availableValues[0] || 1;
  }
}, { immediate: true });
</script>
<template>
  <AppPageLayout>
    <!-- Slot sidebar - Partie gauche sticky -->
    <template #sidebar>

      <AppLeftNavBar v-model="selectedNav" :items="items" title="Sommaire" />
    </template>

<div>Content</div>




  </AppPageLayout>
</template>