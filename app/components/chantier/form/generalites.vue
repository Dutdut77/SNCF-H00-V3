<script setup>
const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  },
  identification: {
    type: Boolean,
    required: true
  },
  periodes: {
    type: Boolean,
    required: true
  },
  weekends: {
    type: Boolean,
    required: true
  },
  matieres: {
    type: Boolean,
    required: true
  },
  comptes: {
    type: Boolean,
    required: true
  },
  autre: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['update:modelValue'])

const form = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
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
</script>

<template>
  <div v-if="identification" class="min-w-xs flex-1 space-y-4">
    <div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700">
      <Icon name="lucide:building-2" size="16" class="text-primary-500" />
      <h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300">Identification</h3>
    </div>

    <AppInput v-model="form.compte" name="compte" title="Compte" placeholder="Numéro de compte" />

    <AppInput v-model="form.name" name="name" title="Intitulé du chantier" placeholder="Nom du chantier" />

    <AppSelect
      v-model="form.type_essais"
      name="type_essais"
      title="Type d'essais"
      :options="typeEssaisOptions"
      placeholder="Sélectionner..."
      nullable />

    <AppSelect
      v-model="form.decret"
      name="decret"
      title="Décret"
      :options="decretOptions"
      placeholder="Sélectionner..."
      nullable />
  </div>

  <!-- Dates -->
  <div v-if="periodes" class="min-w-xs flex-1 space-y-4">
    <div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700">
      <Icon name="lucide:calendar-range" size="16" class="text-green-500" />
      <h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300">
        Période des travaux
      </h3>
    </div>

    <div class="space-y-4">
      <AppDatePicker v-model="form.date_start_travaux" title="Date de début" placeholder="Sélectionner..." clearable />

      <AppDatePicker v-model="form.date_end_travaux" title="Date de fin" placeholder="Sélectionner..." clearable />
    </div>
  </div>

  <!-- Week-ends -->
  <div v-if="weekends" class="min-w-xs flex-1 space-y-4">
    <div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700">
      <Icon name="lucide:calendar-days" size="16" class="text-orange-500" />
      <h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300">Week-ends</h3>
    </div>

    <!-- Liste des week-ends existants -->
    <div v-if="form.weekends.length > 0" class="space-y-2">
      <div
        v-for="weekend in form.weekends"
        :key="weekend.id"
        class="flex items-center justify-between rounded-lg border border-orange-200 bg-orange-50 p-3 dark:border-orange-800 dark:bg-orange-900/20">
        <div class="flex items-center gap-2">
          <Icon name="lucide:calendar-days" size="16" class="text-orange-500" />
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
            S{{ weekend.semaine_debut }}/{{ weekend.annee_debut }} → S{{ weekend.semaine_fin }}/{{ weekend.annee_fin }}
          </span>
        </div>
        <button
          type="button"
          @click="handleDeleteWeekend(weekend.id)"
          class="rounded p-1 text-red-500 transition-colors hover:bg-red-100 dark:hover:bg-red-900/30">
          <Icon name="lucide:trash-2" size="16" />
        </button>
      </div>
    </div>
    <p v-else class="text-sm text-gray-400 italic">Aucun week-end programmé</p>

    <!-- Formulaire d'ajout -->
    <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
      <p class="mb-3 text-xs font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-400">
        Ajouter un week-end
      </p>

      <div class="mb-3 grid grid-cols-2 gap-3">
        <div>
          <label class="mb-1 block text-xs text-gray-500">Semaine début</label>
          <AppSelect v-model="form.weekends.semaineDebut" :options="semaineOptions" placeholder="S..." nullable />
        </div>
        <div>
          <label class="mb-1 block text-xs text-gray-500">Année</label>
          <AppSelect v-model="form.weekends.anneeDebut" :options="anneeOptions" placeholder="Année" />
        </div>
      </div>

      <div class="mb-3 grid grid-cols-2 gap-3">
        <div>
          <label class="mb-1 block text-xs text-gray-500">Semaine fin</label>
          <AppSelect v-model="form.weekends.semaineFin" :options="semaineOptions" placeholder="S..." nullable />
        </div>
        <div>
          <label class="mb-1 block text-xs text-gray-500">Année</label>
          <AppSelect v-model="form.weekends.anneeFin" :options="anneeOptions" placeholder="Année" />
        </div>
      </div>

      <AppButtonValidated
        type="button"
        theme="secondary"
        :validated="!!form.weekends.semaineDebut && !!form.weekends.semaineFin"
        @click="handleAddWeekend">
        <template #default>
          <span class="flex items-center gap-2">
            <Icon name="lucide:plus" size="16" />
            Ajouter
          </span>
        </template>
      </AppButtonValidated>
    </div>
  </div>

  <!-- Lien matières -->
  <div v-if="matieres" class="min-w-xs flex-1 space-y-4">
    <div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700">
      <Icon name="lucide:link" size="16" class="text-rose-500" />
      <h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300">
        Matières commandées
      </h3>
    </div>

    <AppInput v-model="form.matiere" name="matiere" title="Lien web" type="url" placeholder="https://..." />
  </div>

  <!-- Comptes -->
  <div v-if="comptes" class="min-w-xs flex-1 space-y-4">
    <div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700">
      <Icon name="lucide:wallet" size="16" class="text-yellow-500" />
      <h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300">Comptes</h3>
    </div>

    <AppInput v-model="form.compte_moe" name="compte_moe" title="Compte MOE" placeholder="Numéro de compte MOE" />

    <AppInput v-model="form.compte_slg" name="compte_slg" title="Compte SLG" placeholder="Numéro de compte SLG" />

    <AppInput
      v-model="form.compte_matieres"
      name="compte_matieres"
      title="Compte Matière"
      placeholder="Numéro de compte Matière" />
  </div>

  <!-- Autre -->
  <div v-if="autre" class="min-w-xs flex-1 space-y-4">
    <div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700">
      <Icon name="lucide:file-text" size="16" class="text-blue-500" />
      <h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300">Autre</h3>
    </div>

    <div class="w-full">
      <label for="autre" class="mb-0.5 block text-sm">Informations complémentaires</label>
      <textarea
        v-model="form.autre"
        id="autre"
        name="autre"
        rows="4"
        class="focus:border-primary-500 focus:ring-primary-500 w-full resize-none appearance-none rounded-md border border-gray-300 px-3 py-2 text-sm leading-tight text-gray-700 focus:ring-1 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
        placeholder="Notes, remarques, informations diverses..."></textarea>
    </div>
  </div>
</template>
