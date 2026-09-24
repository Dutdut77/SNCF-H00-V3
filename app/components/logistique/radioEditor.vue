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
    <div
      class="dark:bg-night-900 grid max-w-md grid-cols-3 gap-1 rounded-lg border border-slate-300 bg-white p-1 dark:border-white/15">
      <button
        v-for="opt in besoinOptions"
        :key="String(opt.value)"
        type="button"
        @click="model.besoin = opt.value"
        class="cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
        :class="
          model.besoin === opt.value
            ? 'bg-magenta-700 dark:bg-secondary-600 text-white'
            : 'text-ink-soft hover:bg-magenta-50 hover:text-ink dark:hover:bg-white/6'
        ">
        {{ opt.label }}
      </button>
    </div>

    <template v-if="model.besoin === true">
      <!-- PK de couverture + fournisseur -->
      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label class="text-ink mb-1.5 flex items-center gap-1.5 text-[13px] font-medium">
            <Icon name="lucide:milestone" size="14" class="text-slate-400" />
            PK de couverture radio
          </label>
          <input v-model="model.pk" type="text" placeholder="ex. PK 12+500 → PK 18+200" class="form-control h-10" />
        </div>
        <div>
          <label class="text-ink mb-1.5 flex items-center gap-1.5 text-[13px] font-medium">
            <Icon name="lucide:truck" size="14" class="text-slate-400" />
            Fourniture des radios
          </label>
          <AppSelect v4 v-model="model.fournisseur" :options="RADIO_FOURNISSEURS" placeholder="À définir" nullable />
        </div>
      </div>

      <!-- Nombre de radios + station fixe -->
      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label class="text-ink mb-1.5 flex items-center gap-1.5 text-[13px] font-medium">
            <Icon name="lucide:radio" size="14" class="text-slate-400" />
            Nombre de radios
          </label>
          <input v-model.number="model.nombre" type="number" min="0" class="form-control h-10" />
        </div>
        <div>
          <label class="text-ink mb-1.5 flex items-center gap-1.5 text-[13px] font-medium">
            <Icon name="lucide:radio-tower" size="14" class="text-slate-400" />
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
        <div class="space-y-3 rounded-lg border border-slate-200 p-4 dark:border-white/10">
          <div class="flex items-center justify-between">
            <span class="text-ink font-medium">Pose</span>
            <AppSwitch v-model="posee" label="Posée" />
          </div>
          <AppDatePicker v4 v-model="model.pose.date" title="Date de pose" placeholder="Choisir une date" clearable />
          <div>
            <label class="text-ink mb-1.5 block text-[13px] font-medium">Commentaire</label>
            <textarea
              v-model="model.pose.commentaire"
              class="form-control h-20 resize-y py-2.5"
              placeholder="Remarque..."></textarea>
          </div>
        </div>

        <!-- DÉPOSE -->
        <div class="space-y-3 rounded-lg border border-slate-200 p-4 dark:border-white/10">
          <div class="flex items-center justify-between">
            <span class="text-ink font-medium">Dépose</span>
            <AppSwitch v-model="deposee" label="Déposée" />
          </div>
          <AppDatePicker
            v4
            v-model="model.depose.date"
            title="Date de dépose"
            placeholder="Choisir une date"
            clearable />
          <div>
            <label class="text-ink mb-1.5 block text-[13px] font-medium">Commentaire</label>
            <textarea
              v-model="model.depose.commentaire"
              class="form-control h-20 resize-y py-2.5"
              placeholder="Remarque..."></textarea>
          </div>
        </div>
      </div>
    </template>

    <div
      v-else-if="model.besoin === false"
      class="text-ink-soft rounded-lg border border-dashed border-slate-300 p-4 text-center text-sm dark:border-white/15">
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
