<script setup>
const props = defineProps({
  chantier: {
    type: Object,
    required: true
  }
})

const { photos, getPhotos, repertoires, getRepertoires } = usePhotos()

const selectedRepertoireId = ref(null)
const showUploader = ref(false)
const hasTourneePhotos = ref(false)

// Obtenir le nom du répertoire sélectionné
const selectedRepertoireName = computed(() => {
  if (!selectedRepertoireId.value) return 'Toutes les photos'
  if (selectedRepertoireId.value === 'tournees') return 'Tournées'
  const repertoire = repertoires.value.find((r) => r.id === selectedRepertoireId.value)
  return repertoire?.nom || 'Répertoire sélectionné'
})

// Initialiser le bucket et charger les photos au montage
onMounted(async () => {
  await getRepertoires(props.chantier.id)
  await loadPhotos()
  // Vérifier si des photos de tournée existent (chargement initial = toutes les photos)
  hasTourneePhotos.value = photos.value.some((p) => p.tournee_id !== null)
})

// Charger les photos selon le répertoire sélectionné
// getPhotos filtre déjà côté base de données, donc photos.value est déjà à jour
const loadPhotos = async () => {
  await getPhotos(props.chantier.id, selectedRepertoireId.value)
}

// Écouter les changements de répertoire
watch(selectedRepertoireId, () => {
  loadPhotos()
})

// Gérer l'upload
const handleUploaded = () => {
  loadPhotos()
  showUploader.value = false
}

// Recharger les photos après création/suppression de répertoire
// Le watch sur selectedRepertoireId se chargera déjà de recharger si le répertoire sélectionné change
// Mais on recharge aussi pour mettre à jour la liste des répertoires
const handleRepertoireChanged = () => {
  loadPhotos()
}

// Gérer la suppression d'une photo
const handlePhotoDeleted = () => {
  loadPhotos()
}

const handlePhotoMoved = () => {
  loadPhotos()
}
</script>

<template>
  <div class="flex flex-col gap-4 h-full overflow-auto p-4 w-full">
    <AppTitleMain title="Photos" description="Galerie de photos du chantier" />

    <PhotosRepertoireManager v-model="selectedRepertoireId" :chantier-id="chantier.id"
      :has-tournee-photos="hasTourneePhotos" @changed="handleRepertoireChanged" />

    <div class="text-primary-700 space-y-6">
      <!-- Bouton upload -->
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-semibold">
            {{
              selectedRepertoireId === null ? 'Toutes les photos' : 'Photos du répertoire : ' + selectedRepertoireName
            }}
          </h3>
          <p class="text-muted mt-1 text-sm">{{ photos.length }} photo(s)</p>
        </div>

        <AppButtonValidated v-if="selectedRepertoireId !== 'tournees'" theme="primary" @click="showUploader = true">
          <template #default>
            <span class="flex items-center gap-2">
              <Icon name="lucide:upload" size="16" />
              Ajouter des photos
            </span>
          </template>
        </AppButtonValidated>
      </div>
    </div>

    <AppSlideOver :sideModal="showUploader" :closeSideModal="() => (showUploader = false)">
      <template #default>
        <AppSlideOverContent v-if="showUploader" :closeSideModal="() => (showUploader = false)">
          <template #header>
            <Icon name="lucide:camera" size="44" class="text-primary-500" />
            <h3 class="text-lg font-semibold">Ajouter des photos</h3>
            <div class="text-primary-700 bg-primary-200 rounded-lg px-4 text-xl font-bold dark:text-gray-400">
              {{ selectedRepertoireName }}
            </div>
          </template>
          <template #default>
            <PhotosPhotoUploader :chantierId="chantier.id" :repertoireId="selectedRepertoireId"
              @uploaded="handleUploaded" @error="handleUploaded" />
          </template>
        </AppSlideOverContent>
      </template>
    </AppSlideOver>

    <PhotosGaleriePhoto :photos="photos" :repertoire-id="selectedRepertoireId" @photo-deleted="handlePhotoDeleted"
      @photo-moved="handlePhotoMoved" />
  </div>
</template>
