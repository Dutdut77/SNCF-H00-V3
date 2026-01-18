<script setup>
const emit = defineEmits(['submit', 'cancel', 'update:modelValue'])

const props = defineProps({
  // Données du chantier
  modelValue: {
    type: Object,
    required: true
  },
  // Mode édition ou création
  isEditMode: {
    type: Boolean,
    default: false
  },
  // Données pour les selects
  usersRltVoie: { type: Array, default: () => [] },
  usersRltSes: { type: Array, default: () => [] },
  usersRltCat: { type: Array, default: () => [] },
  usersLogistique: { type: Array, default: () => [] },
  usersKvVoie: { type: Array, default: () => [] },
  usersKvSes: { type: Array, default: () => [] },
  usersKvCat: { type: Array, default: () => [] },
  usersPreopVoie: { type: Array, default: () => [] },
  usersPreopSes: { type: Array, default: () => [] },
  usersRefRdu: { type: Array, default: () => [] },
  users: { type: Array, default: () => [] },
  taches: { type: Array, default: () => [] },
  // État de soumission
  isSubmitting: { type: Boolean, default: false }
})

// Données du formulaire (copie locale)
const formData = ref({ ...props.modelValue })

watch(
  formData,
  (newVal) => {
    emit('update:modelValue', newVal)
  },
  { deep: true }
)

// État des pickers
const isRealisationAdd = ref(false)
const isPreparationAdd = ref(false)
const isWeekendAdd = ref(false)

// Index de l'élément en cours d'édition (-1 = ajout, >=0 = édition)
const editingPreparationIndex = ref(-1)
const editingRealisationIndex = ref(-1)

// Dates initiales pour le DatePickerRange
const initialPreparationDates = ref({ start: null, end: null })
const initialRealisationDates = ref({ start: null, end: null })

// Formulaire pour nouveau week-end
const newWeekend = ref({
  semaineDebut: null,
  anneeDebut: new Date().getFullYear()
})

// Configuration des étapes
const steps = [
  { label: 'Généralités', description: 'Les informations générales' },
  { label: 'Périodes', description: 'Dates programmées du chantier' },
  { label: 'Contacts', description: 'Les contacts travaux du chantier' },
  { label: 'Récapitulatif', description: 'Récapitulatif des données du chantier' }
]

// Validation des étapes
const isStep1Valid = computed(() => {
  return (
    formData.value.name?.trim() !== '' && formData.value.compte?.trim() !== '' && formData.value.entite?.trim() !== ''
  )
})

const isStep2Valid = computed(() => {
  return formData.value.realisation?.length > 0
})

const isStep3Valid = computed(() => true)

// En mode édition, toutes les étapes sont valides par défaut
const validateCurrentStep = (stepIndex) => {
  if (props.isEditMode) return true
  switch (stepIndex) {
    case 0:
      return isStep1Valid.value
    case 1:
      return isStep2Valid.value
    case 2:
      return isStep3Valid.value
    default:
      return true
  }
}

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

// Calcule la semaine suivante (gère le passage d'année)
const getNextWeek = (semaine, annee) => {
  if (semaine >= 52) {
    const dec31 = new Date(annee, 11, 31)
    const jan4 = new Date(annee, 0, 4)
    const jan4Day = jan4.getDay() || 7
    const mondayWeek1 = new Date(jan4)
    mondayWeek1.setDate(jan4.getDate() - (jan4Day - 1))
    const weeksInYear = Math.ceil((dec31 - mondayWeek1) / (7 * 24 * 60 * 60 * 1000))
    if (semaine >= weeksInYear) {
      return { semaine: 1, annee: annee + 1 }
    }
  }
  return { semaine: semaine + 1, annee: annee }
}

// Fonction pour formater un timestamp en date lisible
const formatTimestampToDisplay = (timestamp) => {
  if (!timestamp) return '-'
  const date = new Date(timestamp)
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
}

// Options utilisateurs pour les selects
const userOptions = (users) => {
  if (users?.length > 0) {
    return users.map((u) => ({
      id: u.email,
      label: u.prenom && u.nom ? `${u.prenom} ${u.nom}` : u.email
    }))
  }
  return []
}

// Fonction pour obtenir les infos d'un utilisateur par ID
const getUserInfoById = (userEmail) => {
  if (!userEmail || !props.users) return null
  const user = props.users.find((u) => u.email === userEmail)
  if (!user) return null
  return {
    nom: user.nom || '',
    prenom: user.prenom || '',
    fullName: user.prenom && user.nom ? `${user.prenom} ${user.nom}` : user.email || '-'
  }
}

// Handlers pour les périodes de préparation
const openEditPreparation = (index) => {
  const periode = formData.value.preparation[index]
  editingPreparationIndex.value = index
  initialPreparationDates.value = {
    start: periode.date_start,
    end: periode.date_end
  }
  isPreparationAdd.value = true
}

const openAddPreparation = () => {
  editingPreparationIndex.value = -1
  initialPreparationDates.value = { start: null, end: null }
  isPreparationAdd.value = true
}

const closePreparationPicker = () => {
  isPreparationAdd.value = false
  editingPreparationIndex.value = -1
}

const handleAddPreparationFromPicker = (range) => {
  if (editingPreparationIndex.value >= 0) {
    formData.value.preparation[editingPreparationIndex.value] = {
      date_start: range.date_start,
      date_end: range.date_end
    }
  } else {
    formData.value.preparation.push({
      date_start: range.date_start,
      date_end: range.date_end
    })
  }
  isPreparationAdd.value = false
  editingPreparationIndex.value = -1
}

const handleDeletePreparation = (index) => {
  formData.value.preparation.splice(index, 1)
}

// Handlers pour les périodes de réalisation
const openEditRealisation = (index) => {
  const periode = formData.value.realisation[index]
  editingRealisationIndex.value = index
  initialRealisationDates.value = {
    start: periode.date_start,
    end: periode.date_end
  }
  isRealisationAdd.value = true
}

const openAddRealisation = () => {
  editingRealisationIndex.value = -1
  initialRealisationDates.value = { start: null, end: null }
  isRealisationAdd.value = true
}

const closeRealisationPicker = () => {
  isRealisationAdd.value = false
  editingRealisationIndex.value = -1
}

const handleAddRealisationFromPicker = (range) => {
  if (editingRealisationIndex.value >= 0) {
    formData.value.realisation[editingRealisationIndex.value] = {
      date_start: range.date_start,
      date_end: range.date_end
    }
  } else {
    formData.value.realisation.push({
      date_start: range.date_start,
      date_end: range.date_end
    })
  }
  isRealisationAdd.value = false
  editingRealisationIndex.value = -1
}

const handleDeleteRealisation = (index) => {
  formData.value.realisation.splice(index, 1)
}

const handleAddWeekend = () => {
  if (!newWeekend.value.semaineDebut) return
  const { semaine: semaineFin, annee: anneeFin } = getNextWeek(
    newWeekend.value.semaineDebut,
    newWeekend.value.anneeDebut
  )
  formData.value.weekends.push({
    debutSemaine: newWeekend.value.semaineDebut,
    debutAnnee: newWeekend.value.anneeDebut,
    finSemaine: semaineFin,
    finAnnee: anneeFin
  })
  isWeekendAdd.value = false
  newWeekend.value = { semaineDebut: null, anneeDebut: new Date().getFullYear() }
}

const handleDeleteWeekend = (index) => {
  formData.value.weekends.splice(index, 1)
}

// Soumission du formulaire
const handleComplete = () => {
  emit('submit', formData.value)
}

// Annulation
const handleCancel = () => {
  emit('cancel')
}
</script>

<template>
  <div class="flex h-full flex-col space-y-4">
    <!-- <AppTitleMain
      :title="isEditMode ? `${formData.compte} - ${formData.name}` : 'Ajouter un chantier'"
      :description="
        isEditMode ? 'Modifier les informations du chantier' : 'Ajoutez un nouveau chantier au plan de charge'
      " /> -->
    <div>
      <p v-if="isEditMode" class="text-primary-800 font-[Bangers] text-2xl font-semibold tracking-wider">
        {{ formData.compte }} - {{ formData.name }}
      </p>
      <p v-else class="text-primary-800 font-[Bangers] text-2xl font-semibold tracking-wider">Ajouter un chantier</p>
      <p v-if="isEditMode" class="text-muted text-primary-700 text-sm italic">Modifier les informations du chantier</p>
      <p v-else class="text-muted text-primary-700 text-sm italic">Ajoutez un nouveau chantier au plan de charge</p>
    </div>

    <div class="flex h-full flex-1 lg:px-8">
      <AppStepBar
        :steps="steps"
        :show-buttons="true"
        :validate-step="validateCurrentStep"
        :initial-step="0"
        @complete="handleComplete">
        <!-- Étape 1: Généralités -->
        <template #step-0>
          <div class="grid w-full grid-cols-1 gap-4 lg:grid-cols-3">
            <!-- Entité -->
            <div class="flex flex-col">
              <div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700">
                <Icon name="lucide:tag" size="16" class="text-primary-500" />
                <h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300">Entité</h3>
              </div>

              <div class="flex flex-1 flex-col justify-center space-y-4 pt-4">
                <div class="grid h-full grid-cols-2 gap-3">
                  <button
                    type="button"
                    @click="formData.entite = 'uo_travaux'"
                    class="relative rounded-xl border-2 p-2 transition-all duration-200"
                    :class="
                      formData.entite === 'uo_travaux'
                        ? 'border-primary-500 bg-primary-800'
                        : 'border-gray-200 hover:border-gray-300'
                    ">
                    <div class="flex items-center gap-2">
                      <div
                        class="flex h-8 w-8 items-center justify-center rounded-full"
                        :class="
                          formData.entite === 'uo_travaux'
                            ? 'bg-primary-500 text-white'
                            : 'bg-gray-200 text-gray-500 dark:bg-gray-700'
                        ">
                        <Icon name="lucide:home" size="20" />
                      </div>
                      <span
                        class="text-sm font-medium"
                        :class="
                          formData.entite === 'uo_travaux' ? 'text-primary-200' : 'text-gray-600 dark:text-gray-400'
                        ">
                        UO Travaux
                      </span>
                    </div>
                    <div
                      v-if="formData.entite === 'uo_travaux'"
                      class="bg-primary-500 absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full">
                      <Icon name="lucide:check" size="12" class="text-white" />
                    </div>
                  </button>

                  <button
                    type="button"
                    @click="formData.entite = 'autre'"
                    class="relative h-full rounded-xl border-2 p-2 transition-all duration-200"
                    :class="
                      formData.entite === 'autre'
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                        : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                    ">
                    <div class="flex items-center gap-2">
                      <div
                        class="flex h-8 w-8 items-center justify-center rounded-full"
                        :class="
                          formData.entite === 'autre'
                            ? 'bg-red-500 text-white'
                            : 'bg-gray-200 text-gray-500 dark:bg-gray-700'
                        ">
                        <Icon name="lucide:external-link" size="20" />
                      </div>
                      <span
                        class="text-sm font-medium"
                        :class="
                          formData.entite === 'autre'
                            ? 'text-red-700 dark:text-red-400'
                            : 'text-gray-600 dark:text-gray-400'
                        ">
                        Autre
                      </span>
                    </div>
                    <div
                      v-if="formData.entite === 'autre'"
                      class="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500">
                      <Icon name="lucide:check" size="12" class="text-white" />
                    </div>
                  </button>
                </div>
                <div v-if="formData.entite === 'autre'" class="flex items-center gap-2 text-sm text-red-500 italic">
                  <Icon name="lucide:triangle-alert" size="16" class="text-red-600" />
                  Attention, aucune tache H00 ne sera ajoutée pour ce chantier.
                </div>
                <div v-else class="flex items-center gap-2 text-sm text-gray-500 italic">
                  <Icon name="lucide:info" size="16" class="text-gray-600" />
                  Toutes les taches H00 seront ajoutées pour ce chantier.
                </div>
              </div>
            </div>

            <!-- Identification -->
            <div class="flex flex-col">
              <div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700">
                <Icon name="lucide:building-2" size="16" class="text-primary-500" />
                <h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300">
                  Identification
                </h3>
              </div>

              <div class="flex flex-1 flex-col justify-center space-y-4 pt-4">
                <AppInput
                  v-model="formData.compte"
                  name="compte"
                  title="Compte"
                  required
                  placeholder="Numéro de compte" />
                <AppInput
                  v-model="formData.name"
                  name="name"
                  title="Intitulé du chantier"
                  required
                  placeholder="Nom du chantier" />
              </div>
            </div>

            <!-- Autre -->
            <div class="flex flex-col">
              <div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700">
                <Icon name="lucide:file-text" size="16" class="text-primary-500" />
                <h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300">Autre</h3>
              </div>

              <div class="flex flex-1 flex-col pt-4">
                <label for="autre" class="mb-0.5 block text-sm">Informations complémentaires</label>
                <textarea
                  v-model="formData.autre"
                  id="autre"
                  name="autre"
                  class="focus:border-primary-500 focus:ring-primary-500 min-h-[100px] w-full flex-1 resize-none appearance-none rounded-md border border-gray-300 px-3 py-2 text-sm leading-tight text-gray-700 focus:ring-1 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                  placeholder="Notes, remarques, informations diverses..."></textarea>
              </div>
            </div>
          </div>
        </template>

        <!-- Étape 2: Périodes -->
        <template #step-1>
          <div class="flex flex-col space-y-6 divide-gray-200 lg:flex-row">
            <!-- Préparation -->
            <div class="w-full px-4">
              <div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700">
                <Icon name="lucide:calendar-clock" size="16" class="text-amber-500" />
                <h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300">
                  Préparation
                </h3>
                <div
                  class="ml-auto flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-amber-200 text-amber-600 transition-colors duration-300 hover:bg-amber-400 hover:text-white"
                  @click="openAddPreparation">
                  <Icon name="lucide:plus" size="16" />
                </div>
              </div>
              <div v-if="formData.preparation?.length > 0" class="space-y-2 pt-2">
                <div
                  v-for="(preparation, index) in formData.preparation"
                  :key="index"
                  class="group flex cursor-pointer items-center justify-between rounded-lg bg-amber-50 px-3 py-2 transition-all duration-200 hover:bg-amber-100 hover:shadow-md dark:bg-amber-900/20 dark:hover:bg-amber-900/40"
                  @click="openEditPreparation(index)">
                  <div class="flex items-center gap-2">
                    <div class="h-4 w-1 rounded-full bg-amber-500"></div>
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {{ formatTimestampToDisplay(preparation.date_start) }}
                    </span>
                    <Icon name="lucide:arrow-right" size="14" class="text-gray-400" />
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {{ formatTimestampToDisplay(preparation.date_end) }}
                    </span>
                    <Icon
                      name="lucide:pencil"
                      size="14"
                      class="ml-1 text-amber-400 opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  <button
                    type="button"
                    @click.stop="handleDeletePreparation(index)"
                    class="cursor-pointer p-1 text-gray-500 transition-colors hover:text-red-600">
                    <Icon name="lucide:x" size="16" />
                  </button>
                </div>
              </div>
              <p v-else class="pt-2 text-sm text-gray-400 italic">Aucune préparation programmée</p>
            </div>

            <!-- Réalisation -->
            <div class="w-full px-4">
              <div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700">
                <Icon name="lucide:calendar-check" size="16" class="text-emerald-500" />
                <h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300">
                  Réalisation
                </h3>
                <div
                  class="ml-auto flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-emerald-200 text-emerald-600 transition-colors duration-300 hover:bg-emerald-400 hover:text-white"
                  @click="openAddRealisation">
                  <Icon name="lucide:plus" size="16" />
                </div>
              </div>
              <div v-if="formData.realisation?.length > 0" class="space-y-2 pt-2">
                <div
                  v-for="(realisation, index) in formData.realisation"
                  :key="index"
                  class="group flex cursor-pointer items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 transition-all duration-200 hover:bg-emerald-100 hover:shadow-md dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40"
                  @click="openEditRealisation(index)">
                  <div class="flex items-center gap-2">
                    <div class="h-4 w-1 rounded-full bg-emerald-500"></div>
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {{ formatTimestampToDisplay(realisation.date_start) }}
                    </span>
                    <Icon name="lucide:arrow-right" size="14" class="text-gray-400" />
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {{ formatTimestampToDisplay(realisation.date_end) }}
                    </span>
                    <Icon
                      name="lucide:pencil"
                      size="14"
                      class="ml-1 text-emerald-400 opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  <button
                    type="button"
                    @click.stop="handleDeleteRealisation(index)"
                    class="cursor-pointer p-1 text-gray-500 transition-colors hover:text-red-600">
                    <Icon name="lucide:x" size="16" />
                  </button>
                </div>
              </div>
              <p v-else class="pt-2 text-sm text-gray-400 italic">Aucune réalisation programmée</p>
            </div>

            <!-- Week-ends -->
            <div class="w-full px-4">
              <div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700">
                <Icon name="lucide:calendar-days" size="16" class="text-orange-500" />
                <h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300">
                  Week-ends
                </h3>
                <div
                  class="ml-auto flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-orange-200 text-orange-600 transition-colors duration-300 hover:bg-orange-400 hover:text-white"
                  @click="isWeekendAdd = true">
                  <Icon name="lucide:plus" size="16" />
                </div>
              </div>
              <div v-if="formData.weekends?.length > 0" class="space-y-2 pt-2">
                <div
                  v-for="(weekend, index) in formData.weekends"
                  :key="index"
                  class="flex items-center justify-between rounded-lg bg-orange-50 px-3 py-2 dark:bg-orange-900/20">
                  <div class="flex items-center gap-2">
                    <div class="h-4 w-1 rounded-full bg-orange-500"></div>
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                      S{{ weekend.debutSemaine }}/{{ weekend.debutAnnee }}
                    </span>
                    <Icon name="lucide:arrow-right" size="14" class="text-gray-400" />
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                      S{{ weekend.finSemaine }}/{{ weekend.finAnnee }}
                    </span>
                  </div>
                  <button
                    type="button"
                    @click="handleDeleteWeekend(index)"
                    class="cursor-pointer p-1 text-gray-500 transition-colors hover:text-gray-800">
                    <Icon name="lucide:x" size="16" />
                  </button>
                </div>
              </div>
              <p v-else class="pt-2 text-sm text-gray-400 italic">Aucun week-end programmé</p>
            </div>
          </div>

          <!-- Date Picker Range pour Préparation -->
          <AppDatePickerRange
            :is-open="isPreparationAdd"
            :title="editingPreparationIndex >= 0 ? 'Modifier la période de préparation' : 'Période de préparation'"
            :initial-start-date="initialPreparationDates.start"
            :initial-end-date="initialPreparationDates.end"
            @select="handleAddPreparationFromPicker"
            @close="closePreparationPicker" />

          <!-- Date Picker Range pour Réalisation -->
          <AppDatePickerRange
            :is-open="isRealisationAdd"
            :title="editingRealisationIndex >= 0 ? 'Modifier la période de réalisation' : 'Période de réalisation'"
            :initial-start-date="initialRealisationDates.start"
            :initial-end-date="initialRealisationDates.end"
            @select="handleAddRealisationFromPicker"
            @close="closeRealisationPicker" />

          <!-- Modal Week-end -->
          <AppModal v-model="isWeekendAdd" size="sm" :show-close-button="false">
            <template #header>
              <div class="flex items-center gap-3">
                <div
                  class="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
                  <Icon name="lucide:calendar-days" size="20" class="text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p class="text-xs font-medium tracking-wider text-orange-600 uppercase dark:text-orange-400">
                    Week-end
                  </p>
                  <p class="text-lg font-semibold text-gray-900 dark:text-white">Sélectionner une semaine</p>
                </div>
              </div>
            </template>

            <div class="space-y-4">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="mb-1 block text-xs text-gray-500">Semaine</label>
                  <AppSelect v-model="newWeekend.semaineDebut" :options="semaineOptions" placeholder="S..." nullable />
                </div>
                <div>
                  <label class="mb-1 block text-xs text-gray-500">Année</label>
                  <AppSelect v-model="newWeekend.anneeDebut" :options="anneeOptions" placeholder="Année" />
                </div>
              </div>

              <div
                v-if="newWeekend.semaineDebut"
                class="flex items-center justify-center gap-2 rounded-lg bg-orange-50 px-3 py-3 text-sm dark:bg-orange-900/20">
                <Icon name="lucide:calendar-range" size="16" class="text-orange-500" />
                <span class="font-medium text-gray-700 dark:text-gray-300">
                  S{{ newWeekend.semaineDebut }}/{{ newWeekend.anneeDebut }}
                </span>
                <Icon name="lucide:arrow-right" size="14" class="text-gray-400" />
                <span class="font-medium text-gray-700 dark:text-gray-300">
                  S{{ getNextWeek(newWeekend.semaineDebut, newWeekend.anneeDebut).semaine }}/{{
                    getNextWeek(newWeekend.semaineDebut, newWeekend.anneeDebut).annee
                  }}
                </span>
              </div>
            </div>

            <template #footer>
              <div class="flex items-center justify-end gap-3">
                <button
                  @click="isWeekendAdd = false"
                  type="button"
                  class="px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200">
                  Annuler
                </button>
                <button
                  @click="handleAddWeekend"
                  type="button"
                  :disabled="!newWeekend.semaineDebut"
                  class="rounded-lg bg-orange-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-orange-300 dark:disabled:bg-orange-800">
                  Valider
                </button>
              </div>
            </template>
          </AppModal>
        </template>

        <!-- Étape 3: Contacts -->
        <template #step-2>
          <div class="grid grid-cols-1 gap-4 space-y-4 md:grid-cols-2 lg:grid-cols-3">
            <!-- RLT Voie -->
            <div class="w-full space-y-4">
              <div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700">
                <Icon name="lucide:train-track" size="16" class="text-blue-500" />
                <h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300">
                  RLT Voie
                </h3>
              </div>
              <AppSelect
                v-model="formData.rlt_voie_principale"
                :options="userOptions(usersRltVoie)"
                title="Principal"
                placeholder="Sélectionner..."
                nullable />
              <AppSelectMultiple
                v-model="formData.rlt_voie_secondaire"
                :options="userOptions(usersRltVoie)"
                title="Secondaire(s)"
                placeholder="Sélectionner un profil Voie" />
              <AppSelectMultiple
                v-model="formData.kv_voie"
                :options="userOptions(usersKvVoie)"
                title="Contrôleur(s)"
                placeholder="Sélectionner un profil Voie" />
            </div>

            <!-- RLT SES -->
            <div class="w-full space-y-4">
              <div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700">
                <Icon name="lucide:zap" size="16" class="text-yellow-500" />
                <h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300">RLT SES</h3>
              </div>
              <AppSelect
                v-model="formData.rlt_ses_principale"
                :options="userOptions(usersRltSes)"
                title="Principal"
                placeholder="Sélectionner..."
                nullable />
              <AppSelectMultiple
                v-model="formData.rlt_ses_secondaire"
                :options="userOptions(usersRltSes)"
                title="Secondaire(s)"
                placeholder="Sélectionner un profil SES" />
              <AppSelectMultiple
                v-model="formData.kv_ses"
                :options="userOptions(usersKvSes)"
                title="Contrôleur(s)"
                placeholder="Sélectionner un profil SES" />
            </div>

            <!-- RLT CAT -->
            <div class="w-full space-y-4">
              <div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700">
                <Icon name="lucide:cable" size="16" class="text-rose-500" />
                <h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300">RLT CAT</h3>
              </div>
              <AppSelect
                v-model="formData.rlt_cat_principale"
                :options="userOptions(usersRltCat)"
                title="Principal"
                placeholder="Sélectionner..."
                nullable />
              <AppSelectMultiple
                v-model="formData.rlt_cat_secondaire"
                :options="userOptions(usersRltCat)"
                title="Secondaire(s)"
                placeholder="Sélectionner un profil caténaire" />
              <AppSelectMultiple
                v-model="formData.kv_cat"
                :options="userOptions(usersKvCat)"
                title="Contrôleur(s)"
                placeholder="Sélectionner un profil CAT" />
            </div>

            <!-- Pré-op -->
            <div class="w-full space-y-4">
              <div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700">
                <Icon name="lucide:clipboard-check" size="16" class="text-indigo-500" />
                <h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300">Pré-op</h3>
              </div>
              <AppSelect
                v-model="formData.preop_voie"
                :options="userOptions(usersPreopVoie)"
                title="Voie"
                placeholder="Sélectionner..."
                nullable />
              <AppSelect
                v-model="formData.preop_ses"
                :options="userOptions(usersPreopSes)"
                title="SES"
                placeholder="Sélectionner..."
                nullable />
            </div>

            <!-- Logistique -->
            <div class="w-full space-y-4">
              <div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700">
                <Icon name="lucide:truck" size="16" class="text-teal-500" />
                <h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300">
                  Logistique
                </h3>
              </div>
              <AppSelect
                v-model="formData.logistique"
                :options="userOptions(usersLogistique)"
                title="Responsable logistique"
                placeholder="Sélectionner..."
                nullable />
            </div>

            <!-- Superviseurs -->
            <div class="w-full space-y-4">
              <div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700">
                <Icon name="lucide:eye" size="16" class="text-purple-500" />
                <h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300">
                  Superviseurs
                </h3>
              </div>
              <AppSelectMultiple
                v-model="formData.supervisor"
                :options="userOptions(usersRefRdu)"
                title="Superviseur(s)"
                placeholder="Sélectionner un profil Superviseur" />
            </div>
          </div>
        </template>

        <!-- Étape 4: Récapitulatif -->
        <template #step-3>
          <div class="space-y-6">
            <!-- Généralités -->
            <div>
              <div class="mb-2 flex items-center gap-2">
                <Icon name="lucide:building-2" size="16" class="text-primary-500" />
                <p class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300">
                  Généralités
                </p>
              </div>
              <div
                class="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                <span
                  class="rounded-md bg-gray-200 px-2 py-1 font-mono text-sm font-bold text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                  {{ formData.compte || '-' }}
                </span>
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {{ formData.name || 'Sans intitulé' }}
                </span>
                <span
                  v-if="formData.entite === 'uo_travaux'"
                  class="ml-auto rounded-full bg-lime-100 px-2.5 py-0.5 text-xs font-medium text-lime-700 dark:bg-lime-900/30 dark:text-lime-400">
                  UO Travaux
                </span>
                <span
                  v-else
                  class="ml-auto rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
                  Externe
                </span>
              </div>
            </div>

            <!-- Périodes -->
            <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <!-- Préparations -->
              <div class="w-full">
                <div class="mb-2 flex items-center gap-2">
                  <Icon name="lucide:calendar-clock" size="16" class="text-amber-500" />
                  <p class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300">
                    Préparations
                  </p>
                  <span
                    class="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    {{ formData.preparation?.length || 0 }}
                  </span>
                </div>
                <div
                  v-if="formData.preparation?.length > 0"
                  class="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
                  <div
                    v-for="(preparation, index) in formData.preparation"
                    :key="index"
                    class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Icon name="lucide:calendar-range" size="14" class="shrink-0 text-amber-500" />
                    <span>{{ formatTimestampToDisplay(preparation.date_start) }}</span>
                    <Icon name="lucide:arrow-right" size="12" class="text-gray-400" />
                    <span>{{ formatTimestampToDisplay(preparation.date_end) }}</span>
                  </div>
                </div>
                <div
                  v-else
                  class="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-center text-sm text-gray-400 italic dark:border-gray-600 dark:bg-gray-800">
                  Aucune préparation
                </div>
              </div>

              <!-- Réalisations -->
              <div class="w-full">
                <div class="mb-2 flex items-center gap-2">
                  <Icon name="lucide:calendar-check" size="16" class="text-emerald-500" />
                  <p class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300">
                    Réalisations
                  </p>
                  <span
                    class="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    {{ formData.realisation?.length || 0 }}
                  </span>
                </div>
                <div
                  v-if="formData.realisation?.length > 0"
                  class="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
                  <div
                    v-for="(realisation, index) in formData.realisation"
                    :key="index"
                    class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Icon name="lucide:calendar-range" size="14" class="shrink-0 text-emerald-500" />
                    <span>{{ formatTimestampToDisplay(realisation.date_start) }}</span>
                    <Icon name="lucide:arrow-right" size="12" class="text-gray-400" />
                    <span>{{ formatTimestampToDisplay(realisation.date_end) }}</span>
                  </div>
                </div>
                <div
                  v-else
                  class="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-center text-sm text-gray-400 italic dark:border-gray-600 dark:bg-gray-800">
                  Aucune réalisation
                </div>
              </div>

              <!-- Week-ends -->
              <div class="w-full">
                <div class="mb-2 flex items-center gap-2">
                  <Icon name="lucide:calendar-days" size="16" class="text-orange-500" />
                  <p class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300">
                    Week-ends
                  </p>
                  <span
                    class="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                    {{ formData.weekends?.length || 0 }}
                  </span>
                </div>
                <div
                  v-if="formData.weekends?.length > 0"
                  class="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
                  <div
                    v-for="(weekend, index) in formData.weekends"
                    :key="index"
                    class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Icon name="lucide:calendar" size="14" class="shrink-0 text-orange-500" />
                    <span>S{{ weekend.debutSemaine }}/{{ weekend.debutAnnee }}</span>
                    <Icon name="lucide:arrow-right" size="12" class="text-gray-400" />
                    <span>S{{ weekend.finSemaine }}/{{ weekend.finAnnee }}</span>
                  </div>
                </div>
                <div
                  v-else
                  class="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-center text-sm text-gray-400 italic dark:border-gray-600 dark:bg-gray-800">
                  Aucun week-end
                </div>
              </div>
            </div>

            <!-- Contacts -->
            <div>
              <div class="mb-2 flex items-center gap-2">
                <Icon name="lucide:users" size="16" class="text-primary-500" />
                <p class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300">
                  Contacts travaux
                </p>
              </div>
              <div
                class="grid grid-cols-2 gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 lg:grid-cols-4 dark:border-gray-700 dark:bg-gray-800">
                <!-- RLT Voie -->
                <div class="space-y-1">
                  <p class="text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">RLT Voie</p>
                  <div v-if="formData.rlt_voie_principale" class="flex items-center gap-2">
                    <AppAvatar
                      :nom="getUserInfoById(formData.rlt_voie_principale)?.nom"
                      :prenom="getUserInfoById(formData.rlt_voie_principale)?.prenom"
                      size="xs"
                      color="bg-purple-200 text-purple-600" />
                    <span class="text-sm text-gray-700 dark:text-gray-300">
                      {{ getUserInfoById(formData.rlt_voie_principale)?.fullName || '-' }}
                    </span>
                  </div>
                  <span v-else class="text-sm text-gray-400">Non assigné</span>
                </div>

                <!-- RLT SES -->
                <div class="space-y-1">
                  <p class="text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">RLT SES</p>
                  <div v-if="formData.rlt_ses_principale" class="flex items-center gap-2">
                    <AppAvatar
                      :nom="getUserInfoById(formData.rlt_ses_principale)?.nom"
                      :prenom="getUserInfoById(formData.rlt_ses_principale)?.prenom"
                      size="xs"
                      color="bg-primary-200 text-primary-600" />
                    <span class="text-sm text-gray-700 dark:text-gray-300">
                      {{ getUserInfoById(formData.rlt_ses_principale)?.fullName || '-' }}
                    </span>
                  </div>
                  <span v-else class="text-sm text-gray-400">Non assigné</span>
                </div>

                <!-- RLT CAT -->
                <div class="space-y-1">
                  <p class="text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">RLT CAT</p>
                  <div v-if="formData.rlt_cat_principale" class="flex items-center gap-2">
                    <AppAvatar
                      :nom="getUserInfoById(formData.rlt_cat_principale)?.nom"
                      :prenom="getUserInfoById(formData.rlt_cat_principale)?.prenom"
                      size="xs"
                      color="bg-blue-200 text-blue-600" />
                    <span class="text-sm text-gray-700 dark:text-gray-300">
                      {{ getUserInfoById(formData.rlt_cat_principale)?.fullName || '-' }}
                    </span>
                  </div>
                  <span v-else class="text-sm text-gray-400">Non assigné</span>
                </div>

                <!-- Pré-op -->
                <div class="space-y-1">
                  <p class="text-xs font-medium tracking-wider text-gray-500 uppercase dark:text-gray-400">Pré-op</p>
                  <div class="flex flex-col gap-1">
                    <div v-if="formData.preop_voie" class="flex items-center gap-2">
                      <AppAvatar
                        :nom="getUserInfoById(formData.preop_voie)?.nom"
                        :prenom="getUserInfoById(formData.preop_voie)?.prenom"
                        size="xs"
                        color="bg-emerald-200 text-emerald-600" />
                      <span class="text-xs text-gray-600 dark:text-gray-400">Voie</span>
                    </div>
                    <div v-if="formData.preop_ses" class="flex items-center gap-2">
                      <AppAvatar
                        :nom="getUserInfoById(formData.preop_ses)?.nom"
                        :prenom="getUserInfoById(formData.preop_ses)?.prenom"
                        size="xs"
                        color="bg-emerald-200 text-emerald-600" />
                      <span class="text-xs text-gray-600 dark:text-gray-400">SES</span>
                    </div>
                    <span v-if="!formData.preop_voie && !formData.preop_ses" class="text-sm text-gray-400">
                      Non assigné
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Message d'info pour UO Travaux -->
            <div
              v-if="formData.entite === 'uo_travaux' && !isEditMode"
              class="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-900/20">
              <Icon name="lucide:info" size="20" class="mt-0.5 shrink-0 text-blue-500" />
              <div>
                <p class="text-sm font-medium text-blue-700 dark:text-blue-400">Tâches H00 automatiques</p>
                <p class="mt-1 text-sm text-blue-600 dark:text-blue-300">
                  {{ taches.length }} tâches seront créées automatiquement avec des dates de prévision calculées à
                  partir de la première date de réalisation.
                </p>
              </div>
            </div>

            <!-- Avertissement pour externe -->
            <div
              v-else-if="formData.entite !== 'uo_travaux'"
              class="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-900/20">
              <Icon name="lucide:triangle-alert" size="20" class="mt-0.5 shrink-0 text-amber-500" />
              <div>
                <p class="text-sm font-medium text-amber-700 dark:text-amber-400">Chantier externe</p>
                <p class="mt-1 text-sm text-amber-600 dark:text-amber-300">
                  Aucune tâche H00 ne sera créée pour ce chantier externe.
                </p>
              </div>
            </div>

            <!-- Info mode édition -->
            <div
              v-if="isEditMode"
              class="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
              <Icon name="lucide:save" size="20" class="mt-0.5 shrink-0 text-gray-500" />
              <div>
                <p class="text-sm font-medium text-gray-700 dark:text-gray-300">Mode modification</p>
                <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Les modifications seront enregistrées. Si les dates de réalisation ont changé, les prévisions des
                  tâches H00 seront recalculées.
                </p>
              </div>
            </div>
          </div>
        </template>
      </AppStepBar>
    </div>
  </div>
</template>
