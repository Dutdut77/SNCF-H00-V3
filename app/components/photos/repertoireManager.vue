<script setup>
const props = defineProps({
  chantierId: {
    type: [String, Number],
    required: true
  },
  hasTourneePhotos: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['changed'])

// Utiliser defineModel pour simplifier le v-model
const selectedRepertoireId = defineModel({
  type: [String, Number],
  default: null
})

const { repertoires, getRepertoires, createRepertoire, updateRepertoire, deleteRepertoire } = usePhotos()

const isSidebarOpen = ref(false)

// Formulaires pour chaque répertoire (en mode édition)
const editingRepertoires = ref({})

// Formulaire pour nouveau répertoire
const newRepertoireForm = ref({
  nom: ''
})

// Modal de confirmation de suppression
const isDeleteModalOpen = ref(false)
const repertoireToDelete = ref(null)

// Charger les répertoires
const loadRepertoires = async () => {
  await getRepertoires(props.chantierId)
}

// Ouvrir la sidebar d'édition
const openSidebar = () => {
  isSidebarOpen.value = true
  // Réinitialiser les formulaires d'édition
  editingRepertoires.value = {}
  newRepertoireForm.value = { nom: '' }
}

// Fermer la sidebar d'édition
const closeSidebar = () => {
  isSidebarOpen.value = false
}
// Activer le mode édition pour un répertoire
const startEdit = (repertoire) => {
  editingRepertoires.value[repertoire.id] = {
    nom: repertoire.nom
  }
}

// Annuler l'édition d'un répertoire
const cancelEdit = (repertoireId) => {
  delete editingRepertoires.value[repertoireId]
}

// Sauvegarder la modification d'un répertoire
const handleSaveRepertoire = async (repertoireId) => {
  const form = editingRepertoires.value[repertoireId]
  if (!form?.nom.trim()) {
    return
  }

  try {
    const result = await updateRepertoire(repertoireId, {
      nom: form.nom.trim()
    })

    if (!result.error) {
      cancelEdit(repertoireId)
      emit('changed')
    }
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error)
  }
}

// Ajouter un nouveau répertoire
const handleAddRepertoire = async () => {
  if (!newRepertoireForm.value.nom.trim()) {
    return
  }

  try {
    const result = await createRepertoire(props.chantierId, newRepertoireForm.value.nom.trim())

    if (!result.error) {
      newRepertoireForm.value = { nom: '' }
      emit('changed')
    }
  } catch (error) {
    console.error('Erreur lors de la création:', error)
  }
}

// Ouvrir le modal de confirmation de suppression
const openDeleteModal = (repertoire) => {
  repertoireToDelete.value = repertoire
  isDeleteModalOpen.value = true
}

// Confirmer et supprimer le répertoire
const confirmDeleteRepertoire = async () => {
  if (!repertoireToDelete.value) return

  const repertoireId = repertoireToDelete.value.id

  try {
    const result = await deleteRepertoire(repertoireId)
    if (!result.error) {
      // Si le répertoire supprimé était sélectionné, désélectionner
      if (selectedRepertoireId.value === repertoireId) {
        selectedRepertoireId.value = null
      }
      isDeleteModalOpen.value = false
      repertoireToDelete.value = null
      emit('changed')
    }
  } catch (error) {
    console.error('Erreur lors de la suppression:', error)
  }
}

// Annuler la suppression
const cancelDelete = () => {
  isDeleteModalOpen.value = false
  repertoireToDelete.value = null
}

// Charger les répertoires au montage
onMounted(() => {
  loadRepertoires()
})
</script>

<template>
  <div class="border-primary-300 text-primary-700 space-y-4 rounded-lg border bg-white p-4 dark:bg-slate-900">
    <!-- En-tête -->
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold">Dossiers</h3>

      <AppButtonValidated type="button" theme="primary" @click="openSidebar()">
        <template #default>
          <span class="flex items-center gap-2">
            <Icon name="lucide:folder-edit" size="16" />
            Edition
          </span>
        </template>
      </AppButtonValidated>
    </div>

    <!-- Liste des répertoires -->
    <div class="flex flex-wrap gap-2">
      <button
        type="button"
        class="bg-primary-100 text-primary-500 hover:bg-primary-200 hover:text-primary-700 flex cursor-pointer items-center gap-2 rounded-lg p-2 text-sm"
        :class="
          selectedRepertoireId === null
            ? 'bg-primary-200 text-primary-700'
            : 'bg-primary-100 text-primary-500 hover:bg-primary-200 hover:text-primary-700'
        "
        @click="selectedRepertoireId = null">
        <Icon name="lucide:images" size="16" />
        Toutes les photos
      </button>

      <!-- Pseudo-répertoire Tournées -->
      <button
        v-if="hasTourneePhotos"
        type="button"
        class="flex cursor-pointer items-center gap-2 rounded-lg p-2 text-sm"
        :class="
          selectedRepertoireId === 'tournees'
            ? 'bg-primary-200 text-primary-700'
            : 'bg-primary-100 text-primary-500 hover:bg-primary-200 hover:text-primary-700'
        "
        @click="selectedRepertoireId = 'tournees'">
        <Icon name="lucide:map-pin" size="16" />
        Tournées
      </button>

      <button
        v-for="repertoire in repertoires"
        :key="repertoire.id"
        type="button"
        class="bg-primary-100 text-primary-500 hover:bg-primary-200 hover:text-primary-700 flex cursor-pointer items-center gap-2 rounded-lg p-2 text-sm"
        :class="
          selectedRepertoireId === repertoire.id
            ? 'bg-primary-200 text-primary-700'
            : 'bg-primary-100 text-primary-500 hover:bg-primary-200 hover:text-primary-700'
        "
        @click="selectedRepertoireId = repertoire.id">
        <Icon name="lucide:folder" size="16" />
        {{ repertoire.nom }}
      </button>
    </div>

    <!-- Sidebar d'édition des répertoires -->
    <AppSlideOver :sideModal="isSidebarOpen" :closeSideModal="closeSidebar">
      <AppSlideOverContent v-if="isSidebarOpen" :closeSideModal="closeSidebar">
        <template #header>
          <h3 class="text-primary-700 text-lg font-semibold">Gestion des dossiers</h3>
        </template>
        <template #default>
          <div class="flex h-full flex-col">
            <!-- Liste des répertoires existants -->
            <div class="mb-4 flex-1 space-y-2 overflow-y-auto">
              <div v-if="repertoires.length === 0" class="text-muted py-8 text-center text-sm">
                <Icon name="lucide:folder-edit" size="28" class="text-primary-700 mx-auto mb-2 opacity-50" />
                <p>Aucun répertoire</p>
                <p class="mt-1 text-xs">Créez un répertoire ci-dessous</p>
              </div>

              <!-- Liste des répertoires -->
              <div v-for="repertoire in repertoires" :key="repertoire.id">
                <!-- Répertoire en mode lecture -->

                <div v-if="!editingRepertoires[repertoire.id]" class="space-y-1">
                  <div class="flex items-start justify-between gap-2">
                    <div class="flex items-center gap-3">
                      <div
                        class="bg-primary-100 dark:bg-primary-900/30 flex h-8 w-8 items-center justify-center rounded-lg">
                        <Icon name="lucide:folder" size="16" class="text-primary-700" />
                      </div>
                      <span class="text-primary-900 font-medium">
                        {{ repertoire.nom }}
                      </span>
                    </div>
                    <div class="flex items-center justify-center gap-1">
                      <button
                        class="hover:bg-primary-100 dark:hover:bg-primary-700 rounded-lg p-2 transition-colors"
                        @click.stop="startEdit(repertoire)"
                        title="Modifier">
                        <Icon name="lucide:pencil" class="text-primary-500 hover:text-primary-500 h-4 w-4" />
                      </button>
                      <button
                        class="rounded-lg p-2 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                        @click.stop="openDeleteModal(repertoire)"
                        title="Supprimer">
                        <Icon name="lucide:trash-2" class="text-primary-500 h-4 w-4 hover:text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Répertoire en mode édition -->
                <div v-else class="border-primary space-y-4 rounded-lg border p-4">
                  <AppInput
                    v-model="editingRepertoires[repertoire.id].nom"
                    placeholder="Ex: Avant travaux"
                    @keyup.enter="handleSaveRepertoire(repertoire.id)"
                    title="Nom du répertoire"
                    name="repertoire" />
                  <div class="flex justify-end gap-2">
                    <AppButtonValidated type="button" theme="secondary" @click="cancelEdit(repertoire.id)">
                      <template #default>
                        <span class="flex items-center gap-2">
                          <Icon name="lucide:x" size="16" />
                          Annuler
                        </span>
                      </template>
                    </AppButtonValidated>
                    <AppButtonValidated
                      type="button"
                      theme="secondary"
                      @click="handleSaveRepertoire(repertoire.id)"
                      :disabled="!editingRepertoires[repertoire.id].nom.trim()">
                      <template #default>
                        <span class="flex items-center gap-2">
                          <Icon name="lucide:save" size="16" />
                          Enregistrer
                        </span>
                      </template>
                    </AppButtonValidated>
                  </div>
                </div>
              </div>
            </div>

            <!-- Séparateur -->
            <div class="border-primary-300 my-4 border-t"></div>

            <!-- Formulaire pour ajouter un nouveau répertoire -->
            <div class="border-primary-300 space-y-4 rounded-lg border p-4">
              <h4 class="text-base font-semibold">Nouveau dossier</h4>

              <AppInput
                v-model="newRepertoireForm.nom"
                placeholder="Ex: Avant travaux"
                @keyup.enter="handleAddRepertoire"
                title="Nom du répertoire"
                name="repertoire" />

              <AppButtonValidated
                type="button"
                theme="secondary"
                @click="handleAddRepertoire"
                :validated="!!newRepertoireForm.nom.trim()">
                <template #default>
                  <span class="flex items-center gap-2">
                    <Icon name="lucide:plus" size="16" />
                    Ajouter le dossier
                  </span>
                </template>
              </AppButtonValidated>
            </div>
          </div>
        </template>
      </AppSlideOverContent>
    </AppSlideOver>

    <!-- Modal de confirmation de suppression -->
    <AppModal v-model="isDeleteModalOpen" size="lg" :showCloseButton="false">
      <template #header>
        <div class="text-center">
          <div
            class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <Icon name="lucide:triangle-alert" size="28" class="text-red-600 dark:text-red-400" />
          </div>
          <h3 class="text-primary-900 text-lg font-semibold">Supprimer un dossier</h3>
        </div>
      </template>
      <template #default>
        <p class="text-muted text-primary-700 text-sm">
          Les photos qu'il contient seront déplacées sans répertoire. Cette action est irréversible.
        </p>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <AppButtonValidated type="button" theme="cancel" @click="cancelDelete">Annuler</AppButtonValidated>
          <AppButtonValidated type="button" theme="delete" @click="confirmDeleteRepertoire">
            Supprimer
          </AppButtonValidated>
        </div>
      </template>
    </AppModal>
  </div>
</template>
