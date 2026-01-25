<script setup>
const props = defineProps({
  chantier: {
    type: Object,
    required: true
  }
})

const { getTimelineByChantier, addTimelineItem, updateTimelineItem, deleteTimelineItem, timelineTypes, getTypeInfo } =
  useTimeline()
const { setLoader } = useLoader()

// État du SlideOver
const showSlideOver = ref(false)

// Mode édition ou ajout
const editMode = ref(false)
const editingItem = ref(null)

// Modal de confirmation de suppression
const showDeleteModal = ref(false)
const itemToDelete = ref(null)

// Liste des éléments de timeline
const timelineItems = ref([])

// Formulaire
const form = ref({
  type: 'semaine',
  semaineDebut: null,
  anneeDebut: new Date().getFullYear(),
  semaineFin: null,
  anneeFin: new Date().getFullYear(),
  contenu: ''
})

// Options pour les semaines (1-53)
const semaineOptions = computed(() => {
  return Array.from({ length: 53 }, (_, i) => ({
    id: i + 1,
    label: `S${i + 1}`
  }))
})

// Options pour les années
const anneeOptions = computed(() => {
  const currentYear = new Date().getFullYear()
  return Array.from({ length: 5 }, (_, i) => ({
    id: currentYear - 2 + i,
    label: String(currentYear - 2 + i)
  }))
})

// Options pour les types (simplifiées)
const typeOptions = computed(() => {
  return [
    { id: 'semaine', label: 'Semaine entière' },
    { id: 'weekend', label: 'Week-end' }
  ]
})

// Vérifier si le type nécessite une semaine de fin
const needsSemaineFin = computed(() => {
  return form.value.type === 'weekend'
})

// Tous les événements triés chronologiquement
const sortedItems = computed(() => {
  return [...timelineItems.value].sort((a, b) => {
    if (a.annee_debut !== b.annee_debut) return a.annee_debut - b.annee_debut
    return a.semaine_debut - b.semaine_debut
  })
})

// Charger les éléments de timeline
const loadTimeline = async () => {
  if (props.chantier?.id) {
    timelineItems.value = await getTimelineByChantier(props.chantier.id)
  }
}

// Obtenir la couleur d'un type
const getTypeColor = (type) => {
  const colors = {
    weekend:
      'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800',
    semaine: 'bg-primary-100 dark:bg-gray-800 text-primary-700 border-primary-200 '
  }
  return colors[type] || colors.semaine
}

// Obtenir la couleur du point sur la timeline
const getTypeDotColor = (type) => {
  const colors = {
    weekend: 'bg-orange-500 shadow-orange-500/50',
    semaine: 'bg-primary-500 shadow-primary-500/50'
  }
  return colors[type] || colors.semaine
}

// Obtenir la couleur de la ligne connectrice
const getTypeLineColor = (type) => {
  const colors = {
    weekend: 'bg-orange-300 dark:bg-orange-700',
    semaine: 'bg-primary-300 dark:bg-primary-700'
  }
  return colors[type] || colors.semaine
}

// Obtenir le label du type
const getTypeLabel = (type) => {
  const labels = {
    weekend: 'Week-end',
    semaine: 'Semaine'
  }
  return labels[type] || 'Semaine'
}

// Obtenir l'icône du type
const getTypeIcon = (type) => {
  const icons = {
    weekend: 'lucide:sun',
    semaine: 'lucide:calendar-days'
  }
  return icons[type] || 'lucide:calendar-days'
}

// Obtenir le numéro de semaine ISO d'une date
const getWeekNumber = (date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7)
}

// Ouvrir le slideOver pour ajouter
const openAddSlideOver = () => {
  editMode.value = false
  editingItem.value = null
  form.value = {
    type: 'semaine',
    semaineDebut: getWeekNumber(new Date()),
    anneeDebut: new Date().getFullYear(),
    semaineFin: null,
    anneeFin: new Date().getFullYear(),
    contenu: ''
  }
  showSlideOver.value = true
}

// Ouvrir le slideOver pour modifier
const openEditSlideOver = (item) => {
  editMode.value = true
  editingItem.value = item
  form.value = {
    type: item.type,
    semaineDebut: item.semaine_debut,
    anneeDebut: item.annee_debut,
    semaineFin: item.semaine_fin,
    anneeFin: item.annee_fin,
    contenu: item.contenu
  }
  showSlideOver.value = true
}

// Fermer le slideOver
const closeSlideOver = () => {
  showSlideOver.value = false
  editMode.value = false
  editingItem.value = null
}

// Réinitialiser semaine_fin quand le type change
watch(
  () => form.value.type,
  (newType) => {
    if (newType === 'semaine') {
      form.value.semaineFin = null
      form.value.anneeFin = null
    }
  }
)

// Sauvegarder
const handleSave = async () => {
  if (!form.value.semaineDebut || !form.value.contenu) return

  setLoader(true)
  try {
    if (editMode.value && editingItem.value) {
      // Modification
      const result = await updateTimelineItem(editingItem.value.id, {
        type: form.value.type,
        semaine_debut: form.value.semaineDebut,
        annee_debut: form.value.anneeDebut,
        semaine_fin: needsSemaineFin.value ? form.value.semaineFin : null,
        annee_fin: needsSemaineFin.value ? form.value.anneeFin : null,
        contenu: form.value.contenu
      })
      if (result) {
        await loadTimeline()
        closeSlideOver()
      }
    } else {
      // Ajout
      const result = await addTimelineItem(
        props.chantier.id,
        form.value.type,
        form.value.semaineDebut,
        form.value.anneeDebut,
        needsSemaineFin.value ? form.value.semaineFin : null,
        needsSemaineFin.value ? form.value.anneeFin : null,
        form.value.contenu
      )
      if (result) {
        await loadTimeline()
        closeSlideOver()
      }
    }
  } finally {
    setLoader(false)
  }
}

// Ouvrir le modal de suppression
const openDeleteModal = (item) => {
  itemToDelete.value = item
  showDeleteModal.value = true
}

// Fermer le modal de suppression
const closeDeleteModal = () => {
  showDeleteModal.value = false
  itemToDelete.value = null
}

// Confirmer la suppression
const confirmDelete = async () => {
  if (!itemToDelete.value) return

  setLoader(true)
  try {
    const success = await deleteTimelineItem(itemToDelete.value.id)
    if (success) {
      await loadTimeline()
      closeDeleteModal()
    }
  } finally {
    setLoader(false)
  }
}

// Charger au montage
onMounted(loadTimeline)
watch(() => props.chantier?.id, loadTimeline)
</script>

<template>
  <div class="flex flex-col gap-4 h-full overflow-auto p-4 w-full">
    <!-- Header -->
    <div class="flex flex-col items-center justify-between gap-4 lg:flex-row">
      <AppTitleMain title="Timeline" description="Semaines et week-ends du chantier" />
      <AppButtonValidated type="button" theme="primary" @click="openAddSlideOver">
        <template #default>
          <span class="flex items-center gap-2">
            <Icon name="lucide:plus" size="16" />
            Ajouter
          </span>
        </template>
      </AppButtonValidated>
    </div>

    <!-- Timeline verticale -->
    <div class="border-primary-100 rounded-lg border bg-white py-6 shadow-lg dark:bg-gray-900">
      <div class="h-full p-6">
        <div class="mb-6 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="bg-primary-200 flex h-10 w-10 items-center justify-center rounded-xl">
              <Icon name="lucide:git-branch" size="20" class="text-primary-800" />
            </div>
            <div>
              <h2 class="text-primary-800 text-lg font-bold">Vue chronologique</h2>
              <p class="text-primary-700 text-xs">
                {{ sortedItems.length }} événement{{ sortedItems.length > 1 ? 's' : '' }}
              </p>
            </div>
          </div>

          <!-- Légende -->
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2">
              <div class="bg-primary-500 h-3 w-3 rounded-full"></div>
              <span class="text-primary-600 text-sm">Semaine</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="h-3 w-3 rounded-full bg-orange-500"></div>
              <span class="text-primary-600 text-sm">Week-end</span>
            </div>
          </div>
        </div>

        <!-- Timeline verticale avec événements alternés -->
        <div v-if="sortedItems.length > 0" class="relative h-full py-6">
          <!-- Ligne verticale : à gauche sur mobile, au centre sur desktop -->
          <div class="bg-primary-200 absolute top-0 bottom-0 left-4 w-0.5 md:left-1/2 md:-translate-x-1/2"></div>

          <!-- Événements avec espacement réduit pour chevaucher -->
          <div class="space-y-3 md:space-y-4">
            <div v-for="(item, index) in sortedItems" :key="item.id" class="relative flex items-center" :class="[
              // Mobile : toujours à droite, Desktop : alternance
              'justify-end md:justify-start',
              { 'md:justify-end!': index % 2 === 1 }
            ]">
              <!-- Carte événement côté gauche (Desktop uniquement, index pair) -->
              <div v-if="index % 2 === 0" class="hidden w-6/12 pr-8 text-right md:block">
                <div
                  class="group relative transform cursor-pointer rounded-xl border-2 p-3 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                  :class="getTypeColor(item.type)" @click="openEditSlideOver(item)">
                  <!-- Ligne connectrice vers le point central -->
                  <div class="absolute top-1/2 right-0 h-0.5 w-6 translate-x-full -translate-y-1/2 transform"
                    :class="getTypeLineColor(item.type)"></div>

                  <!-- Badge type -->
                  <div class="mb-1.5 flex items-center justify-end gap-2">
                    <span class="text-sm font-medium opacity-75">
                      S{{ item.semaine_debut }}/{{ item.annee_debut }}
                      <template v-if="item.semaine_fin">→ S{{ item.semaine_fin }}/{{ item.annee_fin }}</template>
                    </span>
                    <div class="flex items-center gap-1.5 rounded-full bg-white px-2 py-0.5 dark:bg-black/20">
                      <Icon :name="getTypeIcon(item.type)" size="16" />
                      <span class="text-sm font-semibold">{{ getTypeLabel(item.type) }}</span>
                    </div>
                  </div>

                  <!-- Contenu avec retours à la ligne -->
                  <!-- <p class="text-sm leading-snug font-medium whitespace-pre-line">{{ item.contenu }}</p> -->
                  <div v-html="item.contenu" class="text-sm leading-snug font-medium whitespace-pre-line"></div>

                  <!-- Actions au survol -->
                  <div class="absolute top-2 left-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button @click.stop="openDeleteModal(item)"
                      class="flex h-7 w-7 items-center justify-center rounded-lg bg-red-100 text-red-500 transition-colors hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50">
                      <Icon name="lucide:trash-2" size="16" />
                    </button>
                  </div>
                </div>
              </div>

              <!-- Point sur la timeline : à gauche sur mobile, au centre sur desktop -->
              <div class="absolute left-4 z-10 -translate-x-1/2 transform md:left-1/2">
                <div
                  class="dark:ring-primary-800 h-4 w-4 rounded-full shadow-lg ring-2 ring-white transition-transform hover:scale-125 md:h-5 md:w-5 md:ring-4"
                  :class="getTypeDotColor(item.type)"></div>
              </div>

              <!-- Espace vide côté gauche pour les événements de droite (Desktop) -->
              <!-- <div v-if="index % 2 === 1" class="hidden w-5/12 md:block"></div> -->

              <!-- Carte événement côté droit (Toujours visible sur mobile, Desktop index impair) -->
              <div class="w-[calc(100%-2rem)] md:w-6/12 md:pl-0" :class="index % 2 === 0 ? 'md:hidden' : 'md:pl-8'">
                <div
                  class="group relative transform cursor-pointer rounded-xl border-2 p-3 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                  :class="getTypeColor(item.type)" @click="openEditSlideOver(item)">
                  <!-- Ligne connectrice vers le point -->
                  <div class="absolute top-1/2 left-0 h-0.5 w-4 -translate-x-full -translate-y-1/2 transform md:w-6"
                    :class="getTypeLineColor(item.type)"></div>

                  <!-- Badge type -->
                  <div class="mb-1.5 flex flex-wrap items-center gap-2">
                    <div class="flex items-center gap-1.5 rounded-full bg-white px-2 py-0.5 dark:bg-black/20">
                      <Icon :name="getTypeIcon(item.type)" size="16" />
                      <span class="text-sm font-semibold">{{ getTypeLabel(item.type) }}</span>
                    </div>
                    <span class="text-sm font-medium opacity-75">
                      S{{ item.semaine_debut }}/{{ item.annee_debut }}
                      <template v-if="item.semaine_fin">→ S{{ item.semaine_fin }}/{{ item.annee_fin }}</template>
                    </span>
                  </div>

                  <!-- Contenu avec retours à la ligne -->
                  <div v-html="item.contenu" class="text-sm leading-snug font-medium whitespace-pre-line"></div>

                  <!-- Actions au survol -->
                  <div class="absolute top-2 right-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button @click.stop="openDeleteModal(item)"
                      class="flex h-7 w-7 items-center justify-center rounded-lg bg-red-100 text-red-500 transition-colors hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50">
                      <Icon name="lucide:trash-2" size="16" />
                    </button>
                  </div>
                </div>
              </div>

              <!-- Espace vide côté droit pour les événements de gauche (Desktop) -->
              <!-- <div v-if="index % 2 === 0" class="hidden w-5/12 md:block"></div> -->
            </div>
          </div>
        </div>

        <!-- État vide -->
        <div v-else class="py-16 text-center">
          <div class="relative inline-block">
            <div
              class="from-primary-200 dark:from-primary-900/30 absolute inset-0 rounded-full bg-linear-to-br to-purple-200 opacity-50 blur-2xl dark:to-purple-900/30">
            </div>
            <Icon name="lucide:calendar-plus" size="64" class="text-primary-300 dark:text-primary-600 relative" />
          </div>
          <p class="text-primary-500 dark:text-primary-400 mt-4 text-lg font-medium">Aucun événement planifié</p>
          <p class="text-primary-400 dark:text-primary-500 mt-1 text-sm">
            Ajoutez des semaines ou week-ends à la timeline
          </p>
          <button @click="openAddSlideOver"
            class="bg-primary-500 hover:bg-primary-600 mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-white transition-colors">
            <Icon name="lucide:plus" size="16" />
            Ajouter un événement
          </button>
        </div>
      </div>
    </div>

    <!-- SlideOver -->
    <AppSlideOver :sideModal="showSlideOver" :closeSideModal="closeSlideOver">
      <AppSlideOverContent v-if="showSlideOver" :closeSideModal="closeSlideOver">
        <template #header>
          <h2 class="text-primary-800 font-[Pacifico] text-3xl dark:text-white">
            {{ editMode ? 'Modifier' : 'Ajouter' }} un événement
          </h2>
          <p class="text-primary-500 dark:text-primary-400 text-sm">
            {{ editMode ? 'Modifiez les informations' : 'Ajoutez une semaine ou un week-end' }}
          </p>
        </template>

        <template #default>
          <form @submit.prevent="handleSave" class="space-y-6">
            <!-- Type -->
            <div class="space-y-4">
              <div class="border-primary-200 dark:border-primary-700 flex items-center gap-2 border-b pb-2">
                <Icon name="lucide:tag" size="16" class="text-primary-500 dark:text-gray-100" />
                <h3 class="text-primary-700 text-sm font-semibold tracking-wider uppercase dark:text-gray-100">Type</h3>
              </div>

              <!-- Boutons radio stylisés pour le type -->
              <div class="grid grid-cols-2 gap-3">
                <button type="button" @click="form.type = 'semaine'"
                  class="relative rounded-xl border-2 p-4 transition-all duration-200" :class="form.type === 'semaine'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-primary-200 hover:border-primary-300 dark:border-primary-700 dark:hover:border-primary-600'
                    ">
                  <div class="flex flex-col items-center gap-2">
                    <div class="flex h-10 w-10 items-center justify-center rounded-full" :class="form.type === 'semaine'
                        ? 'bg-blue-500 text-white'
                        : 'bg-primary-200 text-primary-500 dark:bg-primary-700'
                      ">
                      <Icon name="lucide:calendar-days" size="20" />
                    </div>
                    <span class="text-sm font-medium" :class="form.type === 'semaine'
                        ? 'text-blue-700 dark:text-blue-400'
                        : 'text-primary-600 dark:text-gray-100'
                      ">
                      Semaine entière
                    </span>
                  </div>
                  <div v-if="form.type === 'semaine'"
                    class="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500">
                    <Icon name="lucide:check" size="12" class="text-white" />
                  </div>
                </button>

                <button type="button" @click="form.type = 'weekend'"
                  class="relative rounded-xl border-2 p-4 transition-all duration-200" :class="form.type === 'weekend'
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                      : 'border-primary-200 hover:border-primary-300 dark:border-primary-700 dark:hover:border-primary-600'
                    ">
                  <div class="flex flex-col items-center gap-2">
                    <div class="flex h-10 w-10 items-center justify-center rounded-full" :class="form.type === 'weekend'
                        ? 'bg-orange-500 text-white'
                        : 'bg-primary-200 text-primary-500 dark:bg-primary-700'
                      ">
                      <Icon name="lucide:sun" size="20" />
                    </div>
                    <span class="text-sm font-medium" :class="form.type === 'weekend'
                        ? 'text-orange-700 dark:text-orange-400'
                        : 'text-primary-600 dark:text-gray-100'
                      ">
                      Week-end
                    </span>
                  </div>
                  <div v-if="form.type === 'weekend'"
                    class="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500">
                    <Icon name="lucide:check" size="12" class="text-white" />
                  </div>
                </button>
              </div>
            </div>

            <!-- Période -->
            <div class="space-y-4">
              <div class="border-primary-200 dark:border-primary-700 flex items-center gap-2 border-b pb-2">
                <Icon name="lucide:calendar" size="16" class="text-primary-500 dark:text-gray-100" />
                <h3 class="text-primary-700 text-sm font-semibold tracking-wider uppercase dark:text-gray-100">
                  {{ form.type === 'weekend' ? 'Période du week-end' : 'Semaine' }}
                </h3>
              </div>

              <!-- Semaine de début (toujours visible) -->
              <div>
                <label class="text-primary-500 mb-1 block text-xs">
                  {{ form.type === 'weekend' ? 'Semaine de début *' : 'Semaine *' }}
                </label>
                <div class="grid grid-cols-2 gap-3">
                  <AppSelect v-model="form.semaineDebut" :options="semaineOptions" placeholder="S..." nullable />
                  <AppSelect v-model="form.anneeDebut" :options="anneeOptions" placeholder="Année" />
                </div>
              </div>

              <!-- Semaine de fin (uniquement pour week-end) -->
              <div v-if="needsSemaineFin">
                <label class="text-primary-500 mb-1 block text-xs">Semaine de fin *</label>
                <div class="grid grid-cols-2 gap-3">
                  <AppSelect v-model="form.semaineFin" :options="semaineOptions" placeholder="S..." nullable />
                  <AppSelect v-model="form.anneeFin" :options="anneeOptions" placeholder="Année" />
                </div>
              </div>
            </div>

            <!-- Contenu -->
            <div class="space-y-4">
              <div class="border-primary-200 dark:border-primary-700 flex items-center gap-2 border-b pb-2">
                <Icon name="lucide:text" size="16" class="text-primary-500 dark:text-gray-100" />
                <h3 class="text-primary-700 text-sm font-semibold tracking-wider uppercase dark:text-gray-100">
                  Description
                </h3>
              </div>

              <div class="w-full">
                <label class="mb-0.5 block text-sm">Contenu *</label>
                <!-- <textarea
                  v-model="form.contenu"
                  rows="4"
                  class="focus:border-primary-500 focus:ring-primary-500 border-primary-300 text-primary-700 dark:border-primary-600 dark:bg-primary-800 dark:text-primary-200 w-full resize-none appearance-none rounded-md border px-3 py-2 text-sm leading-tight focus:ring-1 focus:outline-none"
                  :placeholder="
                    form.type === 'weekend' ? 'Description du week-end...' : 'Description de la semaine...'
                  "></textarea> -->
                <QuillEditor v-model="form.contenu" class="h-full border-0" />
              </div>
            </div>
          </form>
        </template>

        <template #footer>
          <div class="border-primary-200 dark:border-primary-700 flex justify-end gap-3 border-t pt-4">
            <AppButtonValidated theme="cancel" type="button" @click="closeSlideOver">
              <template #default>Annuler</template>
            </AppButtonValidated>
            <AppButtonValidated theme="primary" type="button"
              :validated="!!form.semaineDebut && !!form.contenu && (form.type === 'semaine' || !!form.semaineFin)"
              @click="handleSave">
              <template #default>{{ editMode ? 'Enregistrer' : 'Ajouter' }}</template>
            </AppButtonValidated>
          </div>
        </template>
      </AppSlideOverContent>
    </AppSlideOver>

    <!-- Modal de confirmation de suppression -->
    <AppModal v-model="showDeleteModal" size="lg" :showCloseButton="false">
      <div class="p-6 text-center">
        <!-- Icône -->
        <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <Icon name="lucide:alert-triangle" size="32" class="text-red-500" />
        </div>

        <!-- Titre -->
        <h3 class="text-primary-800 mb-2 text-xl font-bold dark:text-white">Supprimer cet événement ?</h3>

        <!-- Description -->
        <p class="text-primary-500 dark:text-primary-400 mb-2">Cette action est irréversible.</p>

        <!-- Détails de l'élément -->
        <div v-if="itemToDelete" class="bg-primary-100 dark:bg-primary-700/50 mb-6 rounded-lg p-3">
          <div class="mb-1 flex items-center justify-center gap-2">
            <div class="h-3 w-3 rounded-full"
              :class="itemToDelete.type === 'weekend' ? 'bg-orange-500' : 'bg-blue-500'">
            </div>
            <span class="text-primary-700 dark:text-primary-300 font-medium">
              {{ getTypeLabel(itemToDelete.type) }}
            </span>
            <span class="text-primary-500 dark:text-primary-400 text-sm">
              S{{ itemToDelete.semaine_debut }}/{{ itemToDelete.annee_debut }}
              <template v-if="itemToDelete.semaine_fin">
                → S{{ itemToDelete.semaine_fin }}/{{ itemToDelete.annee_fin }}
              </template>
            </span>
          </div>
          <p class="text-primary-600 dark:text-primary-400 truncate text-sm">
            {{ itemToDelete.contenu }}
          </p>
        </div>

        <!-- Boutons -->
        <div class="flex justify-center gap-3">
          <AppButtonValidated theme="cancel" type="button" @click="closeDeleteModal">
            <template #default>Annuler</template>
          </AppButtonValidated>
          <AppButtonValidated theme="danger" type="button" :validated="true" @click="confirmDelete">
            <template #default>
              <span class="flex items-center gap-2">
                <Icon name="lucide:trash-2" size="16" />
                Supprimer
              </span>
            </template>
          </AppButtonValidated>
        </div>
      </div>
    </AppModal>
  </div>
</template>
