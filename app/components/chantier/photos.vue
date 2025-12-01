<script setup>
const props = defineProps({
  chantier: {
    type: Object,
    required: true,
  },
});

const { photos, getPhotos, repertoires, getRepertoires } = usePhotos();

const selectedRepertoireId = ref(null);
const showUploader = ref(false);

// Obtenir le nom du répertoire sélectionné
const selectedRepertoireName = computed(() => {
  if (!selectedRepertoireId.value) return "Toutes les photos";
  const repertoire = repertoires.value.find(
    (r) => r.id === selectedRepertoireId.value
  );
  return repertoire?.nom || "Répertoire sélectionné";
});

// Initialiser le bucket et charger les photos au montage
onMounted(async () => {
  // Charger les répertoires pour avoir les noms disponibles
  await getRepertoires(props.chantier.id);
  await loadPhotos();
});

// Charger les photos selon le répertoire sélectionné
// getPhotos filtre déjà côté base de données, donc photos.value est déjà à jour
const loadPhotos = async () => {
  await getPhotos(props.chantier.id, selectedRepertoireId.value);
};

// Écouter les changements de répertoire
watch(selectedRepertoireId, () => {
  loadPhotos();
});

// Gérer l'upload
const handleUploaded = () => {
  loadPhotos();
  showUploader.value = false;
};

// Recharger les photos après création/suppression de répertoire
// Le watch sur selectedRepertoireId se chargera déjà de recharger si le répertoire sélectionné change
// Mais on recharge aussi pour mettre à jour la liste des répertoires
const handleRepertoireChanged = () => {
  loadPhotos();
};

// Gérer la suppression d'une photo
const handlePhotoDeleted = () => {
  loadPhotos();
};
</script>

<template>
  <div class="space-y-6">
    <AppTitleMain title="Photos" description="Galerie de photos du chantier" />

    <PhotosRepertoireManager
      v-model="selectedRepertoireId"
      :chantier-id="chantier.id"
      @changed="handleRepertoireChanged"
    />

    <div class="space-y-6">
      <!-- Bouton upload -->
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-semibold">
            {{
              selectedRepertoireId === null
                ? "Toutes les photos"
                : "Photos du répertoire : " + selectedRepertoireName
            }}
          </h3>
          <p class="text-sm text-muted mt-1">{{ photos.length }} photo(s)</p>
        </div>

        <AppButtonValidated theme="primary" @click="showUploader = true">
          <template #default>
            <span class="flex items-center gap-2">
              <Icon name="lucide:upload" size="16" />
              Ajouter des photos
            </span>
          </template>
        </AppButtonValidated>
      </div>
    </div>

    <AppSlideOver
      :sideModal="showUploader"
      :closeSideModal="() => (showUploader = false)"
    >
      <template #default>
        <AppSlideOverContent
          v-if="showUploader"
          :closeSideModal="() => (showUploader = false)"
        >
          <template #header>
            <Icon name="lucide:camera" size="44" class="text-primary-500" />
            <h3 class="text-lg font-semibold">Ajouter des photos</h3>
            <div
              class="text-xl font-bold text-primary-700 bg-primary-200 px-4 rounded-lg dark:text-gray-400"
            >
              {{ selectedRepertoireName }}
            </div>
          </template>
          <template #default>
            <PhotosPhotoUploader
              :chantierId="chantier.id"
              :repertoireId="selectedRepertoireId"
              @uploaded="handleUploaded"
              @error="handleUploaded"
            />
          </template>
        </AppSlideOverContent>
      </template>
    </AppSlideOver>

    <PhotosGaleriePhoto
      :photos="photos"
      :repertoire-id="selectedRepertoireId"
      @photo-deleted="handlePhotoDeleted"
    />
  </div>
</template>
