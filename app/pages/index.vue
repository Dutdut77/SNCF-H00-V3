<script setup>

definePageMeta({
  requiresAuth: true,
  requiredRole: '',
});

useHead({
  title: "H00 - Mes taches",
  description: "Liste de mes taches H00",
});

const { addToast } = useToast()

// État du modal de confirmation
const showModal = ref(false)
const isDeleting = ref(false)

const showToast = () => {
  addToast({
    title: 'Super Toast réussit !',
    message: 'Toast affiché avec succès !',
    type: 'Warning'
  })
}

// Ouvrir le modal
const openModal = () => {
  showModal.value = true
}

// Action de confirmation
const handleConfirm = async () => {
  isDeleting.value = true
  // Simuler une action async (ex: suppression API)
  await new Promise(resolve => setTimeout(resolve, 1000))
  isDeleting.value = false
  showModal.value = false
  addToast({
    title: 'Action confirmée',
    message: 'L\'élément a été supprimé avec succès !',
    type: 'Success'
  })
}

// Action d'annulation
const handleCancel = () => {
  addToast({
    title: 'Action annulée',
    message: 'Suppression annulée.',
    type: 'Info'
  })
}
</script>

<template>
  <AppPageLayout>
    <!-- Slot sidebar - Partie gauche sticky -->
    <template #sidebar>
      <div class="space-y-4">
        <h2 class="text-lg font-semibold text-gray-800">Navigation</h2>
        <nav class="space-y-2">
          <a href="#" class="block px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700">Menu 1</a>
          <a href="#" class="block px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700">Menu 2</a>
          <a href="#" class="block px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700">Menu 3</a>
        </nav>
      </div>
    </template>

    <!-- Contenu principal avec bouton de test -->
    <template #default>
      <div class="p-6 space-y-6">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Test Modal de Confirmation</h1>
        
        <div class="flex flex-wrap gap-4">
          <AppButtonValidated theme="delete" type="button" @click="openModal">
            <template #default>
              <span class="flex items-center gap-2">
                <Icon name="lucide:trash-2" size="18" />
                Supprimer un élément
              </span>
            </template>
          </AppButtonValidated>

          <AppButtonValidated theme="primary" type="button" @click="showToast">
            <template #default>
              <span class="flex items-center gap-2">
                <Icon name="lucide:bell" size="18" />
                Afficher Toast
              </span>
            </template>
          </AppButtonValidated>
        </div>
      </div>
    </template>



  </AppPageLayout>

  <!-- Modal de confirmation (utilisation générique avec slots) -->
  <AppModal v-model="showModal" size="sm" :persistent="isDeleting" @close="handleCancel">
    <template #header>
      <div class="text-center">
        <div class="w-14 h-14 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <Icon name="lucide:triangle-alert" size="28" class=" text-red-600 dark:text-red-400" />
        </div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Confirmer la suppression</h3>
      </div>
    </template>

    <template #default>
      <p class="text-center text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
        Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible.
      </p>
    </template>

    <template #footer>
      <div class="flex gap-3 justify-end">
        <AppButtonValidated theme="cancel" type="button" :validated="!isDeleting" @click="showModal = false">
          <template #default>Annuler</template>
        </AppButtonValidated>
        <AppButtonValidated theme="delete" type="button" :loading="isDeleting" @click="handleConfirm">
          <template #default>Supprimer</template>
        </AppButtonValidated>
      </div>
    </template>
  </AppModal>
</template> 