<script setup>
const props = defineProps({
  photos: {
    type: Array,
    default: () => []
  },
  repertoireId: {
    type: [String, Number],
    default: null
  }
})

const emit = defineEmits(['photo-deleted', 'photo-moved'])

const { getSignedPhotoUrl, deletePhoto, movePhotoToRepertoire, repertoires, getRepertoires } = usePhotos()

// Cache des URLs signées
const photoUrls = ref({})

// Modal de confirmation de suppression
const isDeleteModalOpen = ref(false)
const photoToDelete = ref(null)

// Modal plein écran pour afficher les photos
const isViewerModalOpen = ref(false)
const currentPhotoIndex = ref(0)

// Charger les URLs signées pour toutes les photos
const loadPhotoUrls = async () => {
  const photosToLoad = props.photos.filter((photo) => photo.chemin_storage && !photoUrls.value[photo.id])

  await Promise.all(
    photosToLoad.map(async (photo) => {
      try {
        const url = await getSignedPhotoUrl(photo.chemin_storage, 3600)
        if (url) {
          photoUrls.value[photo.id] = url
        }
      } catch (error) {
        console.error("Erreur lors du chargement de l'URL:", error)
      }
    })
  )
}

// Charger les répertoires du chantier
const loadRepertoires = async () => {
  if (props.photos.length > 0) {
    const chantierId = props.photos[0]?.chantier_id
    if (chantierId) {
      await getRepertoires(chantierId)
    }
  }
}

// Recharger les URLs quand les photos changent
watch(
  () => props.photos,
  () => {
    loadPhotoUrls()
    loadRepertoires()
  },
  { immediate: true }
)

// Charger les répertoires au montage
onMounted(() => {
  loadRepertoires()
})

// Ouvrir le modal de confirmation de suppression
const openDeleteModal = (photo, event) => {
  if (event) event.stopPropagation()
  photoToDelete.value = photo
  isDeleteModalOpen.value = true
}

// Déplacer une photo vers un répertoire
const movePhoto = async (photo, targetRepertoireId) => {
  try {
    const result = await movePhotoToRepertoire(photo.id, targetRepertoireId)
    if (!result.error) {
      emit('photo-moved', {
        photoId: photo.id,
        repertoireId: targetRepertoireId
      })
    }
  } catch (error) {
    console.error('Erreur lors du déplacement de la photo:', error)
  }
}

// Répertoires disponibles (filtrer le répertoire actuel si nécessaire)
const availableRepertoires = computed(() => {
  return repertoires.value.filter((r) => r.id !== props.repertoireId)
})

// Générer les items du dropdown menu pour une photo
const getDropdownItems = (photo) => {
  const items = []

  // Construire la liste des options de déplacement
  const moveOptions = []

  // Si on est dans un répertoire spécifique, ajouter l'option "Toutes les photos"
  if (props.repertoireId !== null) {
    moveOptions.push({
      label: 'Toutes les photos',
      icon: 'lucide:images',
      onSelect: () => movePhoto(photo, null)
    })
  }

  // Ajouter tous les autres répertoires disponibles
  availableRepertoires.value.forEach((repertoire) => {
    moveOptions.push({
      label: repertoire.nom,
      icon: 'lucide:folder',
      onSelect: () => movePhoto(photo, repertoire.id)
    })
  })

  // Ajouter l'option de déplacement si des options sont disponibles
  if (moveOptions.length > 0) {
    items.push([
      {
        label: 'Déplacer vers…',
        icon: 'lucide:folder',
        children: [moveOptions]
      }
    ])
  }

  // Ajouter l'option de suppression en bas, séparée
  items.push([
    {
      label: 'Supprimer',
      icon: 'lucide:trash-2',
      color: 'error',
      onSelect: () => openDeleteModal(photo, null)
    }
  ])

  return items
}

// Confirmer et supprimer la photo
const confirmDeletePhoto = async () => {
  if (!photoToDelete.value) return

  const photoId = photoToDelete.value.id

  try {
    const result = await deletePhoto(photoId)
    if (!result.error) {
      // Supprimer l'URL du cache
      if (photoUrls.value[photoId]) {
        delete photoUrls.value[photoId]
      }
      isDeleteModalOpen.value = false
      photoToDelete.value = null
      emit('photo-deleted', photoId)
    }
  } catch (error) {
    console.error('Erreur lors de la suppression:', error)
  }
}

// Annuler la suppression
const cancelDelete = () => {
  isDeleteModalOpen.value = false
  photoToDelete.value = null
}

// Ouvrir le modal de visualisation plein écran
const openViewer = (photo) => {
  const index = props.photos.findIndex((p) => p.id === photo.id)
  if (index !== -1) {
    currentPhotoIndex.value = index
    isViewerModalOpen.value = true
  }
}

// Fermer le modal de visualisation
const closeViewer = () => {
  isViewerModalOpen.value = false
}

// Navigation vers la photo précédente
const previousPhoto = () => {
  if (currentPhotoIndex.value > 0) {
    currentPhotoIndex.value--
  } else {
    currentPhotoIndex.value = props.photos.length - 1
  }
}

// Navigation vers la photo suivante
const nextPhoto = () => {
  if (currentPhotoIndex.value < props.photos.length - 1) {
    currentPhotoIndex.value++
  } else {
    currentPhotoIndex.value = 0
  }
}

// Photo actuellement affichée dans le modal
const currentPhoto = computed(() => {
  return props.photos[currentPhotoIndex.value] || null
})

// Gestion de la navigation au clavier
const handleKeydown = (event) => {
  if (!isViewerModalOpen.value) return

  switch (event.key) {
    case 'ArrowLeft':
      event.preventDefault()
      previousPhoto()
      break
    case 'ArrowRight':
      event.preventDefault()
      nextPhoto()
      break
    case 'Escape':
      event.preventDefault()
      closeViewer()
      break
  }
}

// Ajouter les écouteurs d'événements clavier
onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="space-y-4">
    <!-- Grille de photos avec UPageColumns -->
    <div v-if="photos.length > 0" class="columns-2 gap-4 sm:columns-4 md:columns-5">
      <div v-for="photo in photos" :key="photo.id"
        class="group bg-primary-100/50 relative mb-4 cursor-pointer break-inside-avoid overflow-hidden rounded-lg transition-shadow duration-300 hover:shadow-xl"
        @click="openViewer(photo)">
        <!-- Image avec lazy loading -->
        <img v-if="photoUrls[photo.id]" :src="photoUrls[photo.id]" :alt="photo.nom_fichier"
          class="h-auto w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy"
          @error="(e) => (e.target.style.display = 'none')" />

        <!-- Placeholder pendant le chargement -->
        <div v-else class="bg-muted flex aspect-square w-full items-center justify-center">
          <Icon name="lucide:loader-2" size="28" class="text-primary-600 animate-spin" />
        </div>

        <div
          class="pointer-events-none absolute inset-0 flex flex-col justify-between bg-black/60 p-2 opacity-0 transition-opacity group-hover:opacity-100">
          <div class="pointer-events-auto z-50 flex justify-end gap-2">
            <AppDropdownMenu trigger="hover" @click.stop>
              <template #trigger>
                <div
                  class="bg-primary-700 flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition-all duration-300 hover:scale-110 hover:shadow-lg">
                  <Icon name="lucide:more-horizontal" size="16" class="text-primary-50" />
                </div>
              </template>
              <template #default>
                <div class="space-y-2">
                  <div>
                    <div class="text-primary-700 w-full cursor-default text-center text-sm font-medium">
                      Déplacer vers :
                    </div>
                    <div v-for="item in getDropdownItems(photo)[0][0].children" :key="item.label">
                      <div v-for="child in item" :key="child.label" class="">
                        <div
                          class="group hover:bg-primary-100 mt-2 flex cursor-pointer items-center gap-2 rounded-lg pr-2 transition-all duration-300"
                          @click="child.onSelect">
                          <div class="bg-primary-100 flex h-8 w-8 items-center justify-center rounded-lg">
                            <Icon :name="child.icon" size="16" class="text-primary-500" />
                          </div>

                          <div class="text-primary-700 text-sm">
                            {{ child.label }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="bg-primary-200 h-0.5 w-full"></div>

                  <div
                    class="group flex cursor-pointer items-center gap-2 rounded-lg pr-2 transition-all duration-300 hover:bg-red-100"
                    @click="getDropdownItems(photo)[1][0].onSelect">
                    <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100">
                      <Icon :name="getDropdownItems(photo)[1][0].icon" size="16" class="text-red-700" />
                    </div>

                    <div class="text-sm text-red-700">
                      {{ getDropdownItems(photo)[1][0].label }}
                    </div>
                  </div>
                </div>
              </template>
            </AppDropdownMenu>
          </div>

          <div class="text-primary-800 text-xs">
            <p class="truncate font-medium">{{ photo.nom_fichier }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Message si aucune photo -->
    <div v-else class="text-primary-700 py-12 text-center">
      <Icon name="lucide:image-off" size="24" class="text-primary-700 mx-auto mb-4 h-16 w-16" />
      <p class="text-primary-700 text-lg font-medium">Aucune photo</p>
      <p class="text-primary-700 mt-1 text-sm">Ajoutez des photos pour commencer</p>
    </div>

    <!-- Modal de confirmation de suppression -->
    <AppModal v-model="isDeleteModalOpen" size="md" @close="isDeleteModalOpen = false">
      <template #header>
        <div class="text-center">
          <div
            class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <Icon name="lucide:triangle-alert" size="28" class="text-red-600 dark:text-red-400" />
          </div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Attention</h3>
        </div>
      </template>

      <template #default>
        <p class="text-center text-sm leading-relaxed text-gray-600">
          Vous êtes sur le point de supprimer la photo
          <span class="font-semibold text-gray-900">« {{ photoToDelete?.nom_fichier || '' }} »</span>
          ? Cette action est irréversible.
        </p>
      </template>

      <template #footer>
        <div class="flex justify-end gap-3">
          <AppButtonValidated theme="cancel" type="button" @click="cancelDelete">
            <template #default>Annuler</template>
          </AppButtonValidated>
          <AppButtonValidated theme="delete" type="button" @click="confirmDeletePhoto">
            <template #default>Supprimer</template>
          </AppButtonValidated>
        </div>
      </template>
    </AppModal>

    <!-- Modal plein écran pour visualiser les photos -->
    <AppModalFullScreen v-model="isViewerModalOpen" :showCloseButton="false" @close="closeViewer">
      <template #default>
        <div class="flex h-full w-full items-center justify-center">
          <img :src="photoUrls[currentPhoto.id]" :alt="currentPhoto.nom_fichier"
            class="max-h-full max-w-full object-contain" />
        </div>

        <div
          class="bg-primary-100 absolute top-1/2 left-4 z-10 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-xl opacity-80 transition-opacity hover:opacity-100"
          @click="previousPhoto">
          <Icon name="lucide:chevron-left" size="20" class="text-primary-700" />
        </div>

        <div
          class="bg-primary-100 absolute top-1/2 right-4 z-10 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-xl opacity-80 transition-opacity hover:opacity-100"
          @click="nextPhoto">
          <Icon name="lucide:chevron-right" size="20" class="text-primary-700" />
        </div>

        <div
          class="bg-primary-100 absolute top-0 right-4 z-10 flex h-10 w-10 translate-y-1/2 cursor-pointer items-center justify-center rounded-xl opacity-80 transition-opacity hover:opacity-100"
          @click="closeViewer">
          <Icon name="lucide:x" size="20" class="text-primary-700" />
        </div>
      </template>
    </AppModalFullScreen>
  </div>
</template>
