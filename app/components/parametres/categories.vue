<script setup>
const { categories, getCategories, createCategory, updateCategory, deleteCategory } = useCategories()
const { taches, getTaches } = useTaches()
const { setLoader } = useLoader()

const globalFilter = ref('')
const open = ref(false)
const isNewCategory = ref(false)
const category = ref({})
const nomInitial = ref('')
const saving = ref(false)

// État du modal de confirmation de suppression
const showDeleteModal = ref(false)
const categoryToDelete = ref(null)
const isDeleting = ref(false)

// Filtrer les catégories en fonction de la recherche
const filteredCategories = computed(() => {
  if (!globalFilter.value) return categories.value
  const search = globalFilter.value.toLowerCase()
  return categories.value.filter((c) => c.name?.toLowerCase().includes(search))
})

// Nombre de tâches de chaque catégorie
const nbTaches = computed(() => {
  const compte = {}
  for (const t of taches.value || []) if (t.id_categories) compte[t.id_categories] = (compte[t.id_categories] ?? 0) + 1
  return compte
})

// Validation du formulaire
const validatedFields = computed(() => !!category.value.name && category.value.name.trim().length > 0)
const dirty = computed(() => open.value && (category.value.name ?? '') !== nomInitial.value)

// Ouvrir la fiche pour éditer une catégorie
const openSlide = (row) => {
  if (row) {
    category.value = { ...row }
    nomInitial.value = row.name ?? ''
    isNewCategory.value = false
    open.value = true
  }
}

// Ouvrir la fiche pour créer une nouvelle catégorie
const openSlideNew = () => {
  category.value = { name: '' }
  nomInitial.value = ''
  isNewCategory.value = true
  open.value = true
}

// Fermer la fiche
const closeSlide = () => {
  open.value = false
  category.value = {}
  isNewCategory.value = false
}

// Enregistrer (créer ou modifier)
const enregistrer = async () => {
  if (!validatedFields.value) return

  saving.value = true
  setLoader(true)
  try {
    if (isNewCategory.value) {
      await createCategory(category.value.name.trim())
    } else {
      await updateCategory(category.value.id, category.value.name.trim())
    }
    closeSlide()
  } finally {
    saving.value = false
    setLoader(false)
  }
}

// Ouvrir le modal de confirmation de suppression
const openDeleteModal = (cat) => {
  if (!cat?.id) return
  categoryToDelete.value = cat
  showDeleteModal.value = true
}

// Confirmer la suppression
const confirmDelete = async () => {
  if (!categoryToDelete.value?.id) return

  isDeleting.value = true
  try {
    await deleteCategory(categoryToDelete.value.id)
    showDeleteModal.value = false
    categoryToDelete.value = null
  } finally {
    isDeleting.value = false
  }
}

// Charger les catégories (et les tâches, pour les compter) au montage
setLoader(true)
try {
  await Promise.all([getCategories(), taches.value?.length ? null : getTaches()])
} finally {
  setLoader(false)
}
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col gap-4 p-4 lg:px-8 lg:pt-4 lg:pb-4">
    <!-- Barre d'outils -->
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
      <AppInputSearch
        v-model="globalFilter"
        boxed
        dense
        class="w-full sm:max-w-sm"
        placeholder="Rechercher une catégorie…" />
      <AppButtonValidated theme="brand" type="button" class="sm:ml-auto" @click="openSlideNew">
        <template #default>
          <span class="flex items-center gap-2">
            <Icon name="lucide:plus" size="16" />
            Nouvelle catégorie
          </span>
        </template>
      </AppButtonValidated>
    </div>

    <!-- Tableau des catégories -->
    <div :class="TABLEAU_CARTE">
      <table class="w-full text-sm">
        <thead :class="TABLEAU_TETE">
          <tr>
            <th class="px-4 py-2.5 text-left">Catégorie</th>
            <th class="px-4 py-2.5 text-center">Tâches</th>
            <th class="w-24 px-4 py-2.5"><span class="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody :class="TABLEAU_CORPS">
          <tr v-for="c in filteredCategories" :key="c.id" :class="TABLEAU_LIGNE" @click="openSlide(c)">
            <td class="px-4 py-3">
              <span class="text-ink flex items-center gap-2.5 font-medium">
                <Icon name="lucide:folder" size="16" class="text-magenta-600 dark:text-magenta-300 shrink-0" />
                {{ c.name || '—' }}
              </span>
            </td>
            <td class="text-ink-soft px-4 py-3 text-center tabular-nums">{{ nbTaches[c.id] ?? 0 }}</td>
            <td class="px-4 py-2">
              <div class="flex items-center justify-end gap-1">
                <button type="button" :class="BOUTON_ICONE" title="Renommer" @click.stop="openSlide(c)">
                  <Icon name="lucide:pencil" size="16" />
                </button>
                <button type="button" :class="BOUTON_ICONE_DANGER" title="Supprimer" @click.stop="openDeleteModal(c)">
                  <Icon name="lucide:trash-2" size="16" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="filteredCategories.length === 0" class="text-ink-soft flex flex-col items-center gap-2 p-10 text-sm">
        <Icon name="lucide:folder-x" size="28" class="opacity-40" />
        Aucune catégorie trouvée
      </div>
    </div>

    <!-- Fiche : création / modification -->
    <AppSidePanelForm
      :open="open"
      surtitre="Catégorie de tâches"
      :titre="category.name?.trim() || (isNewCategory ? 'Nouvelle catégorie' : '—')"
      :sous-titre="
        !isNewCategory ? `${nbTaches[category.id] ?? 0} tâche${(nbTaches[category.id] ?? 0) > 1 ? 's' : ''}` : ''
      "
      :valid="validatedFields"
      :dirty="dirty"
      :locked="saving"
      :submit-label="isNewCategory ? 'Créer la catégorie' : 'Enregistrer'"
      @close="closeSlide"
      @submit="enregistrer">
      <section class="surface-card rounded-xl p-5">
        <label for="categorie-nom" :class="CHAMP_LIBELLE">Nom de la catégorie</label>
        <input
          id="categorie-nom"
          v-model="category.name"
          type="text"
          autocomplete="off"
          class="form-control h-10"
          placeholder="Ex. : Technique, Ressources, Matières…" />
        <p class="text-ink-soft mt-1.5 text-xs">Sert à organiser et filtrer les tâches.</p>
      </section>
    </AppSidePanelForm>

    <!-- Confirmation de suppression -->
    <AppConfirmModal
      v-model="showDeleteModal"
      title="Supprimer la catégorie"
      :loading="isDeleting"
      @confirm="confirmDelete"
      @cancel="categoryToDelete = null">
      La catégorie
      <strong class="text-ink">« {{ categoryToDelete?.name || '' }} »</strong>
      sera supprimée définitivement.
      <span v-if="nbTaches[categoryToDelete?.id]" class="text-ink mt-2 flex items-start gap-2">
        <Icon name="lucide:triangle-alert" size="16" class="text-ochre-700 dark:text-ochre-300 mt-0.5 shrink-0" />
        {{ nbTaches[categoryToDelete?.id] }} tâche{{
          nbTaches[categoryToDelete?.id] > 1 ? 's y sont' : ' y est'
        }}
        rattachée{{ nbTaches[categoryToDelete?.id] > 1 ? 's' : '' }}.
      </span>
    </AppConfirmModal>
  </div>
</template>
