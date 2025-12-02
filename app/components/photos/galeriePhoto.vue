<script setup>
const props = defineProps({
  photos: {
    type: Array,
    default: () => [],
  },
  repertoireId: {
    type: [String, Number],
    default: null,
  },
});

const emit = defineEmits(["photo-deleted", "photo-moved"]);

const {
  getSignedPhotoUrl,
  deletePhoto,
  movePhotoToRepertoire,
  repertoires,
  getRepertoires,
} = usePhotos();

// Cache des URLs signées
const photoUrls = ref({});

// Modal de confirmation de suppression
const isDeleteModalOpen = ref(false);
const photoToDelete = ref(null);

// Modal plein écran pour afficher les photos
const isViewerModalOpen = ref(false);
const currentPhotoIndex = ref(0);

// Charger les URLs signées pour toutes les photos
const loadPhotoUrls = async () => {
  const photosToLoad = props.photos.filter(
    (photo) => photo.chemin_storage && !photoUrls.value[photo.id]
  );

  await Promise.all(
    photosToLoad.map(async (photo) => {
      try {
        const url = await getSignedPhotoUrl(photo.chemin_storage, 3600);
        if (url) {
          photoUrls.value[photo.id] = url;
        }
      } catch (error) {
        console.error("Erreur lors du chargement de l'URL:", error);
      }
    })
  );
};

// Charger les répertoires du chantier
const loadRepertoires = async () => {
  if (props.photos.length > 0) {
    const chantierId = props.photos[0]?.chantier_id;
    if (chantierId) {
      await getRepertoires(chantierId);
    }
  }
};

// Recharger les URLs quand les photos changent
watch(
  () => props.photos,
  () => {
    loadPhotoUrls();
    loadRepertoires();
  },
  { immediate: true }
);

// Charger les répertoires au montage
onMounted(() => {
  loadRepertoires();
});

// Ouvrir le modal de confirmation de suppression
const openDeleteModal = (photo, event) => {
  if (event) event.stopPropagation();
  photoToDelete.value = photo;
  isDeleteModalOpen.value = true;
};

// Déplacer une photo vers un répertoire
const movePhoto = async (photo, targetRepertoireId) => {
  try {
    const result = await movePhotoToRepertoire(photo.id, targetRepertoireId);
    if (!result.error) {
      emit("photo-moved", {
        photoId: photo.id,
        repertoireId: targetRepertoireId,
      });
    }
  } catch (error) {
    console.error("Erreur lors du déplacement de la photo:", error);
  }
};

// Répertoires disponibles (filtrer le répertoire actuel si nécessaire)
const availableRepertoires = computed(() => {
  return repertoires.value.filter((r) => r.id !== props.repertoireId);
});

// Générer les items du dropdown menu pour une photo
const getDropdownItems = (photo) => {
  const items = [];

  // Construire la liste des options de déplacement
  const moveOptions = [];

  // Si on est dans un répertoire spécifique, ajouter l'option "Toutes les photos"
  if (props.repertoireId !== null) {
    moveOptions.push({
      label: "Toutes les photos",
      icon: "lucide:images",
      onSelect: () => movePhoto(photo, null),
    });
  }

  // Ajouter tous les autres répertoires disponibles
  availableRepertoires.value.forEach((repertoire) => {
    moveOptions.push({
      label: repertoire.nom,
      icon: "lucide:folder",
      onSelect: () => movePhoto(photo, repertoire.id),
    });
  });

  // Ajouter l'option de déplacement si des options sont disponibles
  if (moveOptions.length > 0) {
    items.push([
      {
        label: "Déplacer vers…",
        icon: "lucide:folder",
        children: [moveOptions],
      },
    ]);
  }

  // Ajouter l'option de suppression en bas, séparée
  items.push([
    {
      label: "Supprimer",
      icon: "lucide:trash-2",
      color: "error",
      onSelect: () => openDeleteModal(photo, null),
    },
  ]);

  return items;
};

// Confirmer et supprimer la photo
const confirmDeletePhoto = async () => {
  if (!photoToDelete.value) return;

  const photoId = photoToDelete.value.id;

  try {
    const result = await deletePhoto(photoId);
    if (!result.error) {
      // Supprimer l'URL du cache
      if (photoUrls.value[photoId]) {
        delete photoUrls.value[photoId];
      }
      isDeleteModalOpen.value = false;
      photoToDelete.value = null;
      emit("photo-deleted", photoId);
    }
  } catch (error) {
    console.error("Erreur lors de la suppression:", error);
  }
};

// Annuler la suppression
const cancelDelete = () => {
  isDeleteModalOpen.value = false;
  photoToDelete.value = null;
};

// Ouvrir le modal de visualisation plein écran
const openViewer = (photo) => {
  const index = props.photos.findIndex((p) => p.id === photo.id);
  if (index !== -1) {
    currentPhotoIndex.value = index;
    isViewerModalOpen.value = true;
  }
};

// Fermer le modal de visualisation
const closeViewer = () => {
  isViewerModalOpen.value = false;
};

// Navigation vers la photo précédente
const previousPhoto = () => {
  if (currentPhotoIndex.value > 0) {
    currentPhotoIndex.value--;
  } else {
    currentPhotoIndex.value = props.photos.length - 1;
  }
};

// Navigation vers la photo suivante
const nextPhoto = () => {
  if (currentPhotoIndex.value < props.photos.length - 1) {
    currentPhotoIndex.value++;
  } else {
    currentPhotoIndex.value = 0;
  }
};

// Photo actuellement affichée dans le modal
const currentPhoto = computed(() => {
  return props.photos[currentPhotoIndex.value] || null;
});

// Gestion de la navigation au clavier
const handleKeydown = (event) => {
  if (!isViewerModalOpen.value) return;

  switch (event.key) {
    case "ArrowLeft":
      event.preventDefault();
      previousPhoto();
      break;
    case "ArrowRight":
      event.preventDefault();
      nextPhoto();
      break;
    case "Escape":
      event.preventDefault();
      closeViewer();
      break;
  }
};

// Ajouter les écouteurs d'événements clavier
onMounted(() => {
  window.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeydown);
});
</script>

<template>
  <div class="space-y-4">
    <!-- Grille de photos avec UPageColumns -->
    <div
      v-if="photos.length > 0"
      class="columns-2 sm:columns-4 md:columns-5 gap-4"
    >
      <div
        v-for="photo in photos"
        :key="photo.id"
        class="group relative rounded-lg overflow-hidden cursor-pointer bg-muted hover:shadow-xl transition-shadow duration-300 mb-4 break-inside-avoid"
        @click="openViewer(photo)"
      >
        <!-- Image avec lazy loading -->
        <img
          v-if="photoUrls[photo.id]"
          :src="photoUrls[photo.id]"
          :alt="photo.nom_fichier"
          class="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          @error="(e) => (e.target.style.display = 'none')"
        />

        <!-- Placeholder pendant le chargement -->
        <div
          v-else
          class="w-full aspect-square flex items-center justify-center bg-muted"
        >
          <Icon
            name="lucide:loader-2"
            size="28"
            class="animate-spin text-gray-400"
          />
        </div>

        <div
          class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2 pointer-events-none"
        >
          <div class="flex justify-end gap-2 z-50 pointer-events-auto">
            <AppDropdownMenu trigger="hover" @click.stop>
              <template #trigger>
                <div
                  class="w-8 h-8 rounded-lg cursor-pointer bg-primary-500 dark:bg-primary-900/30 flex items-center justify-center hover:shadow-lg hover:scale-110 transition-all duration-300"
                >
                  <Icon
                    name="lucide:more-horizontal"
                    size="16"
                    class="text-primary-50"
                  />
                </div>
              </template>
              <template #default>
                <div class="space-y-2">
                  <div>
                    <div
                      class="text-sm font-medium text-center cursor-default w-full text-primary-700"
                    >
                      Déplacer vers :
                    </div>
                    <div
                      v-for="item in getDropdownItems(photo)[0][0].children"
                      :key="item.label"
                    >
                      <div v-for="child in item" :key="child.label" class="">
                        <div
                          class="flex items-center gap-2 group cursor-pointer hover:bg-primary-100 transition-all duration-300 rounded-lg pr-2 mt-2"
                          @click="child.onSelect"
                        >
                          <div
                            class="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center"
                          >
                            <Icon
                              :name="child.icon"
                              size="16"
                              class="text-primary-500"
                            />
                          </div>

                          <div class="text-gray-700 text-sm">
                            {{ child.label }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="h-0.5 bg-gray-200 w-full"></div>

                  <div
                    class="flex items-center gap-2 group cursor-pointer hover:bg-red-100 transition-all duration-300 rounded-lg pr-2"
                    @click="getDropdownItems(photo)[1][0].onSelect"
                  >
                    <div
                      class="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center"
                    >
                      <Icon
                        :name="getDropdownItems(photo)[1][0].icon"
                        size="16"
                        class="text-red-700"
                      />
                    </div>

                    <div class="text-red-700 text-sm">
                      {{ getDropdownItems(photo)[1][0].label }}
                    </div>
                  </div>
                </div>
              </template>
            </AppDropdownMenu>
          </div>

          <div class="text-white text-xs">
            <p class="font-medium truncate">{{ photo.nom_fichier }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Message si aucune photo -->
    <div
      v-else
      class="text-center py-12 text-primary-700 dark:text-primary-300"
    >
      <Icon
        name="lucide:image-off"
        size="24"
        class="w-16 h-16 mx-auto mb-4 opacity-50"
      />
      <p class="text-lg font-medium text-primary-700">Aucune photo</p>
      <p class="text-sm mt-1 text-primary-700 dark:text-primary-300">
        Ajoutez des photos pour commencer
      </p>
    </div>

    <!-- Modal de confirmation de suppression -->
    <AppModal
      v-model="isDeleteModalOpen"
      size="md"
      @close="isDeleteModalOpen = false"
    >
      <template #header>
        <div class="text-center">
          <div
            class="w-14 h-14 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center"
          >
            <Icon
              name="lucide:triangle-alert"
              size="28"
              class="text-red-600 dark:text-red-400"
            />
          </div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Attention
          </h3>
        </div>
      </template>

      <template #default>
        <p
          class="text-center text-gray-600 dark:text-gray-300 text-sm leading-relaxed"
        >
          Vous êtes sur le point de supprimer la photo
          <span class="font-semibold text-gray-900 dark:text-white"
            >« {{ photoToDelete?.nom_fichier || "" }} »</span
          >
          ? Cette action est irréversible.
        </p>
      </template>

      <template #footer>
        <div class="flex gap-3 justify-end">
          <AppButtonValidated
            theme="cancel"
            type="button"
            @click="cancelDelete"
          >
            <template #default>Annuler</template>
          </AppButtonValidated>
          <AppButtonValidated
            theme="delete"
            type="button"
            @click="confirmDeletePhoto"
          >
            <template #default>Supprimer</template>
          </AppButtonValidated>
        </div>
      </template>
    </AppModal>

    <!-- Modal plein écran pour visualiser les photos -->
    <AppModalFullScreen
      v-model="isViewerModalOpen"
      :showCloseButton="false"
      @close="closeViewer"
    >
      <template #default>
        <div class="w-full h-full flex items-center justify-center">
          <img
            :src="photoUrls[currentPhoto.id]"
            :alt="currentPhoto.nom_fichier"
            class="max-w-full max-h-full object-contain"
          />
        </div>

        <div
          class="absolute left-4 top-1/2 -translate-y-1/2 z-10 opacity-80 hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-br from-amber-100 to-orange-200 dark:from-amber-900/50 dark:to-orange-800/50"
          @click="previousPhoto"
        >
          <Icon
            name="lucide:chevron-left"
            size="20"
            class="text-amber-600 dark:text-amber-400"
          />
        </div>

        <div
          class="absolute right-4 top-1/2 -translate-y-1/2 z-10 opacity-80 hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-br from-amber-100 to-orange-200 dark:from-amber-900/50 dark:to-orange-800/50"
          @click="nextPhoto"
        >
          <Icon
            name="lucide:chevron-right"
            size="20"
            class="text-amber-600 dark:text-amber-400"
          />
        </div>

        <div
          class="absolute right-4 top-0 translate-y-1/2 z-10 opacity-80 hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-br from-amber-100 to-orange-200 dark:from-amber-900/50 dark:to-orange-800/50"
          @click="closeViewer"
        >
          <Icon
            name="lucide:x"
            size="20"
            class="text-amber-600 dark:text-amber-400"
          />
        </div>
      </template>
    </AppModalFullScreen>
  </div>
</template>
