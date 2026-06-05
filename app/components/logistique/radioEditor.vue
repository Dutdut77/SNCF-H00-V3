<script setup>
// Édition du poste "Radio" d'un chantier (pas d'inventaire dédié).
// v-model = { besoin, pk, fournisseur, pose:<slot>, depose:<slot> }
const model = defineModel({ type: Object, required: true })

const besoinOptions = [
  { value: null, label: 'À définir' },
  { value: true, label: 'Besoin' },
  { value: false, label: 'Aucun besoin' }
]

// Switch "posée" <-> statut de pose (0 / 2)
const posee = computed({
  get: () => model.value?.pose?.status === 2,
  set: (v) => {
    if (model.value?.pose) model.value.pose.status = v ? 2 : 0
  }
})
// Switch "déposée" <-> statut de dépose (0 / 2)
const deposee = computed({
  get: () => model.value?.depose?.status === 2,
  set: (v) => {
    if (model.value?.depose) model.value.depose.status = v ? 2 : 0
  }
})
</script>

<template>
  <div class="space-y-4">
    <!-- Besoin de radios (tri-état) -->
    <div class="grid max-w-md grid-cols-3 gap-2">
      <button
        v-for="opt in besoinOptions"
        :key="String(opt.value)"
        type="button"
        @click="model.besoin = opt.value"
        class="rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
        :class="
          model.besoin === opt.value
            ? 'border-primary-500 bg-primary-600 text-white'
            : 'border-primary-200 text-primary-600 hover:bg-primary-100 dark:border-slate-700 dark:hover:bg-slate-800'
        ">
        {{ opt.label }}
      </button>
    </div>

    <template v-if="model.besoin === true">
      <!-- PK de couverture + fournisseur -->
      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label class="text-primary-700 mb-1 flex items-center gap-1.5 text-xs font-medium dark:text-gray-300">
            <Icon name="lucide:milestone" size="14" class="text-primary-500" />
            PK de couverture radio
          </label>
          <input
            v-model="model.pk"
            type="text"
            placeholder="ex. PK 12+500 → PK 18+200"
            class="border-primary-300 text-primary-700 focus:border-primary-500 focus:ring-primary-500 w-full rounded-md border bg-white px-3 py-1.5 text-sm focus:ring-1 focus:outline-none dark:bg-slate-900" />
        </div>
        <div>
          <label class="text-primary-700 mb-1 flex items-center gap-1.5 text-xs font-medium dark:text-gray-300">
            <Icon name="lucide:truck" size="14" class="text-primary-500" />
            Fourniture des radios
          </label>
          <AppSelect v-model="model.fournisseur" :options="RADIO_FOURNISSEURS" placeholder="À définir" nullable />
        </div>
      </div>

      <!-- Nombre de radios + station fixe -->
      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label class="text-primary-700 mb-1 flex items-center gap-1.5 text-xs font-medium dark:text-gray-300">
            <Icon name="lucide:radio" size="14" class="text-primary-500" />
            Nombre de radios
          </label>
          <input
            v-model.number="model.nombre"
            type="number"
            min="0"
            class="border-primary-300 text-primary-700 focus:border-primary-500 focus:ring-primary-500 w-full rounded-md border bg-white px-3 py-1.5 text-sm focus:ring-1 focus:outline-none dark:bg-slate-900" />
        </div>
        <div>
          <label class="text-primary-700 mb-1 flex items-center gap-1.5 text-xs font-medium dark:text-gray-300">
            <Icon name="lucide:radio-tower" size="14" class="text-primary-500" />
            Station fixe
          </label>
          <div class="flex h-[34px] items-center">
            <AppSwitch v-model="model.station_fixe" />
          </div>
        </div>
      </div>

      <!-- Pose / Dépose -->
      <div class="grid gap-4 lg:grid-cols-2">
        <!-- POSE -->
        <div class="border-primary-200 space-y-3 rounded-lg border p-4 dark:border-slate-700">
          <div class="flex items-center justify-between">
            <span class="text-primary-800 font-medium dark:text-gray-100">Pose</span>
            <AppSwitch v-model="posee" label="Posée" />
          </div>
          <AppDatePicker v-model="model.pose.date" title="Date de pose" placeholder="Sélectionnez une date" clearable />
          <div>
            <label class="text-primary-700 mb-1 block text-xs font-medium dark:text-gray-300">Commentaire</label>
            <textarea
              v-model="model.pose.commentaire"
              class="border-primary-300 text-primary-700 focus:border-primary-500 focus:ring-primary-500 h-20 w-full resize-y rounded-lg border bg-white p-3 text-sm focus:ring-1 focus:outline-none dark:bg-slate-900"
              placeholder="Remarque..."></textarea>
          </div>
        </div>

        <!-- DÉPOSE -->
        <div class="border-primary-200 space-y-3 rounded-lg border p-4 dark:border-slate-700">
          <div class="flex items-center justify-between">
            <span class="text-primary-800 font-medium dark:text-gray-100">Dépose</span>
            <AppSwitch v-model="deposee" label="Déposée" />
          </div>
          <AppDatePicker v-model="model.depose.date" title="Date de dépose" placeholder="Sélectionnez une date" clearable />
          <div>
            <label class="text-primary-700 mb-1 block text-xs font-medium dark:text-gray-300">Commentaire</label>
            <textarea
              v-model="model.depose.commentaire"
              class="border-primary-300 text-primary-700 focus:border-primary-500 focus:ring-primary-500 h-20 w-full resize-y rounded-lg border bg-white p-3 text-sm focus:ring-1 focus:outline-none dark:bg-slate-900"
              placeholder="Remarque..."></textarea>
          </div>
        </div>
      </div>
    </template>

    <div
      v-else-if="model.besoin === false"
      class="rounded-lg border border-dashed border-gray-300 p-4 text-center text-sm text-gray-500 dark:border-gray-600">
      Pas de radio sur ce chantier.
    </div>
    <div
      v-else
      class="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300">
      <Icon name="lucide:info" size="16" />
      Indiquez si des radios sont nécessaires sur ce chantier.
    </div>
  </div>
</template>
