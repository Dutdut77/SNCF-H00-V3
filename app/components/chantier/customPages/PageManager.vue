<!--
  PageManager - Modal de gestion des annexes de chantier
  
  Ce component permet :
  - D'ajouter une nouvelle annexe
  - De modifier une annexe existante
  - De supprimer une annexe (directement si start-in-delete-confirm)
-->
<script setup>
import { getAvailableTemplates } from './index'

const props = defineProps({
  // Modal ouverte
  isOpen: {
    type: Boolean,
    default: false
  },
  // ID du chantier
  chantierId: {
    type: String,
    required: true
  },
  // Page en cours d'édition (null = création)
  editingPage: {
    type: Object,
    default: null
  },
  // Ouvrir directement sur la confirmation de suppression
  startInDeleteConfirm: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'saved', 'deleted'])

const { addPage, updatePage, deletePage } = useChantierPages()

// État local
const isSaving = ref(false)
const showDeleteConfirm = ref(false)

// Mode création ou édition
const isNewPage = computed(() => !props.editingPage)

// Titre de la modal
const modalTitle = computed(() => {
  if (showDeleteConfirm.value) return "Supprimer l'annexe"
  return isNewPage.value ? 'Nouvelle annexe' : "Modifier l'annexe"
})

// Icône de l'en-tête
const modalIcon = computed(() => {
  if (showDeleteConfirm.value) return 'lucide:trash-2'
  return isNewPage.value ? 'lucide:file-plus' : 'lucide:file-edit'
})

// Positionner l'état de la modal à chaque ouverture
watch(
  () => props.isOpen,
  (open) => {
    showDeleteConfirm.value = open ? props.startInDeleteConfirm : false
  }
)

// Sauvegarder la page
const handleSave = async (pageData) => {
  isSaving.value = true

  try {
    if (isNewPage.value) {
      // Création
      const newPage = await addPage(props.chantierId, pageData)
      if (newPage) {
        emit('saved', newPage)
        emit('close')
      }
    } else {
      // Mise à jour
      const success = await updatePage(props.chantierId, props.editingPage.id, pageData)
      if (success) {
        emit('saved', { ...props.editingPage, ...pageData })
        emit('close')
      }
    }
  } finally {
    isSaving.value = false
  }
}

// Supprimer la page
const handleDelete = async () => {
  if (!props.editingPage) return

  isSaving.value = true

  try {
    const success = await deletePage(props.chantierId, props.editingPage.id)
    if (success) {
      emit('deleted', props.editingPage.id)
      emit('close')
    }
  } finally {
    isSaving.value = false
    showDeleteConfirm.value = false
  }
}

// Fermer la modal
const handleClose = () => {
  if (!isSaving.value) {
    showDeleteConfirm.value = false
    emit('close')
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-100 flex items-start justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm"
        @click.self="handleClose">
        <div class="relative my-8 w-full max-w-4xl rounded-2xl bg-white shadow-2xl dark:bg-gray-800" @click.stop>
          <!-- Header -->
          <div class="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
            <div class="flex items-center gap-3">
              <div class="bg-primary-100 dark:bg-primary-900/30 flex h-10 w-10 items-center justify-center rounded-xl">
                <Icon
                  :name="modalIcon"
                  size="20"
                  class="text-primary-600 dark:text-primary-400" />
              </div>
              <h2 class="text-xl font-semibold text-gray-800 dark:text-white">
                {{ modalTitle }}
              </h2>
            </div>

            <button
              type="button"
              class="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              :disabled="isSaving"
              @click="handleClose">
              <Icon name="lucide:x" size="20" />
            </button>
          </div>

          <!-- Corps -->
          <div class="max-h-[calc(100vh-16rem)] overflow-y-auto px-6 py-5">
            <!-- Confirmation de suppression -->
            <div v-if="showDeleteConfirm && editingPage" class="rounded-xl bg-red-50 p-6 dark:bg-red-900/20">
              <div class="flex items-start gap-4">
                <div
                  class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
                  <Icon name="lucide:alert-triangle" size="24" class="text-red-600 dark:text-red-400" />
                </div>
                <div class="flex-1">
                  <h3 class="text-lg font-semibold text-red-800 dark:text-red-300">Supprimer cette annexe ?</h3>
                  <p class="mt-1 text-sm text-red-600 dark:text-red-400">
                    L'annexe "{{ editingPage.navBarTitle }}" et ses images seront définitivement supprimées. Cette
                    action est irréversible.
                  </p>
                  <div class="mt-4 flex items-center gap-3">
                    <button
                      type="button"
                      class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
                      :disabled="isSaving"
                      @click="handleDelete">
                      <span v-if="isSaving" class="flex items-center gap-2">
                        <Icon name="lucide:loader-2" size="16" class="animate-spin" />
                        Suppression...
                      </span>
                      <span v-else>Oui, supprimer</span>
                    </button>
                    <button
                      type="button"
                      class="rounded-lg px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 dark:text-red-300 dark:hover:bg-red-900/40"
                      :disabled="isSaving"
                      @click="startInDeleteConfirm ? handleClose() : (showDeleteConfirm = false)">
                      Annuler
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Éditeur de page -->
            <ChantierCustomPagesPageEditor
              v-else
              :page="editingPage"
              :chantier-id="chantierId"
              :is-new="isNewPage"
              @save="handleSave"
              @cancel="handleClose" />
          </div>

          <!-- Footer avec bouton supprimer (en mode édition) -->
          <div v-if="editingPage && !showDeleteConfirm" class="border-t border-gray-200 px-6 py-4 dark:border-gray-700">
            <button
              type="button"
              class="flex items-center gap-2 text-sm font-medium text-red-600 transition hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              @click="showDeleteConfirm = true">
              <Icon name="lucide:trash-2" size="16" />
              Supprimer cette annexe
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Animations de la modal */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .relative,
.modal-leave-to .relative {
  transform: scale(0.95) translateY(-20px);
}

/* Animation loader */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
