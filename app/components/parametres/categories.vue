<script setup>
const { categories, getCategories, createCategory, updateCategory, deleteCategory } = useCategories();
const { setLoader } = useLoader();

const globalFilter = ref("");
const open = ref(false);
const isNewCategory = ref(false);
const category = ref({});

// État du modal de confirmation de suppression
const showDeleteModal = ref(false);
const categoryToDelete = ref(null);
const isDeleting = ref(false);

// Filtrer les catégories en fonction de la recherche
const filteredCategories = computed(() => {
  if (!globalFilter.value) return categories.value;
  const search = globalFilter.value.toLowerCase();
  return categories.value.filter(c => 
    c.name?.toLowerCase().includes(search)
  );
});

// Validation du formulaire
const validatedFields = computed(() => {
  return category.value.name && category.value.name.trim().length > 0;
});

// Ouvrir le slide pour éditer une catégorie
const openSlide = (row) => {
  if (row) {
    category.value = { ...row };
    isNewCategory.value = false;
    open.value = true;
  }
};

// Ouvrir le slide pour créer une nouvelle catégorie
const openSlideNew = () => {
  category.value = { name: '' };
  isNewCategory.value = true;
  open.value = true;
};

// Fermer le slide
const closeSlide = () => {
  open.value = false;
  category.value = {};
  isNewCategory.value = false;
};

// Enregistrer (créer ou modifier)
const enregistrer = async () => {
  if (!validatedFields.value) return;
  
  setLoader(true);
  try {
    if (isNewCategory.value) {
      await createCategory(category.value.name.trim());
    } else {
      await updateCategory(category.value.id, category.value.name.trim());
    }
    closeSlide();
  } finally {
    setLoader(false);
  }
};

// Ouvrir le modal de confirmation de suppression
const openDeleteModal = (cat) => {
  if (!cat?.id) return;
  categoryToDelete.value = cat;
  showDeleteModal.value = true;
};

// Confirmer la suppression
const confirmDelete = async () => {
  if (!categoryToDelete.value?.id) return;
  
  isDeleting.value = true;
  try {
    await deleteCategory(categoryToDelete.value.id);
    showDeleteModal.value = false;
    categoryToDelete.value = null;
  } finally {
    isDeleting.value = false;
  }
};

// Annuler la suppression
const cancelDelete = () => {
  categoryToDelete.value = null;
};

// Charger les catégories au montage
setLoader(true);
try {
  await getCategories();
} finally {
  setLoader(false);
}
</script>

<template>
  <div class="flex flex-col w-full h-full gap-4 overflow-hidden">
    <AppTitleMain title="Paramètres Catégories" description="Gestion des catégories de tâches" />
    
    <!-- Barre de recherche et bouton ajouter -->
    <div class="flex flex-col sm:flex-row gap-4 items-center justify-between w-full">
      <AppInputSearch v-model="globalFilter" class="w-full max-w-md" placeholder="Rechercher une catégorie ..." />
      <AppButtonValidated theme="primary" type="button" @click="openSlideNew">
        <template #default>
          <span class="flex items-center gap-2">
            <Icon name="lucide:plus" size="18" />
            Ajouter
          </span>
        </template>
      </AppButtonValidated>
    </div>
    
    <!-- Table des catégories -->
    <div class="flex flex-col w-full flex-1 min-h-0 overflow-hidden rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      <div class="overflow-auto flex-1">
        <table class="w-full text-sm">
          <!-- Header -->
          <thead class="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
            <tr>
              <th class="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">Nom de la catégorie</th>
              <th class="px-4 py-3 text-center font-semibold text-gray-700 dark:text-gray-200 w-24">Actions</th>
            </tr>
          </thead>
          
          <!-- Body -->
          <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
            <tr 
              v-for="c in filteredCategories" 
              :key="c.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
              @click="openSlide(c)"
            >
              <!-- Colonne Nom -->
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                    <Icon name="lucide:folder" class="w-4 h-4 text-primary-500" />
                  </div>
                  <span class="font-medium text-gray-900 dark:text-white">
                    {{ c.name || '—' }}
                  </span>
                </div>
              </td>
              
              <!-- Colonne Actions -->
              <td class="px-4 py-3 text-center">
                <div class="flex items-center justify-center gap-1">
                  <button 
                    class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    @click.stop="openSlide(c)"
                    title="Modifier"
                  >
                    <Icon name="lucide:pencil" class="w-4 h-4 text-gray-500 hover:text-primary-500" />
                  </button>
                  <button 
                    class="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    @click.stop="openDeleteModal(c)"
                    title="Supprimer"
                  >
                    <Icon name="lucide:trash-2" class="w-4 h-4 text-gray-500 hover:text-red-500" />
                  </button>
                </div>
              </td>
            </tr>
            
            <!-- Message si aucun résultat -->
            <tr v-if="filteredCategories.length === 0">
              <td colspan="2" class="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                <Icon name="lucide:folder-x" class="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Aucune catégorie trouvée</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- SlideOver pour édition/création -->
    <AppSlideOver :sideModal="open" :closeSideModal="closeSlide">
      <template #default>
        <AppSlideOverContent v-if="open" :closeSideModal="closeSlide">
          
          <template #header>
            <div class="text-center">
              <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                <Icon :name="isNewCategory ? 'lucide:folder-plus' : 'lucide:folder-edit'" class="w-8 h-8 text-primary-500" />
              </div>
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
                {{ isNewCategory ? 'Nouvelle catégorie' : 'Modifier la catégorie' }}
              </h2>
              <p v-if="!isNewCategory" class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                ID: {{ category.id }}
              </p>
            </div>
          </template>

          <template #default>
            <form @submit.prevent="enregistrer" class="flex flex-col gap-5 w-full">
              
              <!-- Nom de la catégorie -->
              <AppInput 
                name="name" 
                title="Nom de la catégorie" 
                placeholder="Ex: Technique, Ressources, Matières..." 
                v-model="category.name" 
              />

              <!-- Indication -->
              <p class="text-xs text-gray-500 dark:text-gray-400">
                Le nom de la catégorie sera utilisé pour organiser et filtrer les tâches.
              </p>
              
            </form>
          </template>

          <template #footer>
            <div class="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
              <AppButtonValidated theme="cancel" type="button" @click="closeSlide">
                <template #default>Annuler</template>
              </AppButtonValidated>
              <AppButtonValidated :validated="validatedFields" @click="enregistrer">
                <template #default>{{ isNewCategory ? 'Créer' : 'Enregistrer' }}</template>
              </AppButtonValidated>
            </div>
          </template>

        </AppSlideOverContent>
      </template>
    </AppSlideOver>

    <!-- Modal de confirmation de suppression -->
    <AppModal v-model="showDeleteModal" size="md" :persistent="isDeleting" @close="cancelDelete">
      <template #header>
        <div class="text-center">
          <div class="w-14 h-14 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <Icon name="lucide:triangle-alert" size="28" class=" text-red-600 dark:text-red-400" />
          </div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Supprimer une catégorie</h3>
        </div>
      </template>

      <template #default>
        <p class="text-center text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
          Êtes-vous sûr de vouloir supprimer la catégorie 
          <span class="font-semibold text-gray-900 dark:text-white">« {{ categoryToDelete?.name || '' }} »</span> ? 
          Cette action est irréversible.
        </p>
      </template>

      <template #footer>
        <div class="flex gap-3 justify-end">
          <AppButtonValidated theme="cancel" type="button" :validated="!isDeleting" @click="showDeleteModal = false">
            <template #default>Annuler</template>
          </AppButtonValidated>
          <AppButtonValidated theme="delete" type="button" :loading="isDeleting" @click="confirmDelete">
            <template #default>Supprimer</template>
          </AppButtonValidated>
        </div>
      </template>
    </AppModal>

  </div>
</template>

