<script setup>
const props = defineProps({
  chantier: {
    type: Object,
    required: true
  }
})

const { equip, canEditLogistique, enregistrer } = useLogistiqueEditor(() => props.chantier?.id)

const besoinOptions = [
  { value: null, label: 'À définir' },
  { value: true, label: 'Besoin' },
  { value: false, label: 'Aucun besoin' }
]
const vacOptions = [
  { id: 'bb8', label: 'BB8' },
  { id: 'bb10', label: 'BB10' },
  { id: 'base12d', label: 'Base 12D' }
]
const posee = computed({
  get: () => equip.value?.base_vie?.pose?.status === 2,
  set: (v) => {
    if (equip.value) equip.value.base_vie.pose.status = v ? 2 : 0
  }
})
const deposee = computed({
  get: () => equip.value?.base_vie?.depose?.status === 2,
  set: (v) => {
    if (equip.value) equip.value.base_vie.depose.status = v ? 2 : 0
  }
})
</script>

<template>
  <ChantierLogistiqueShell
    title="Base vie"
    description="Besoin, modules, pose et dépose"
    icon="lucide:caravan"
    :can-edit="canEditLogistique"
    :ready="!!equip"
    @save="enregistrer">
    <section class="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
      <div class="grid max-w-md grid-cols-3 gap-2">
        <button
          v-for="opt in besoinOptions"
          :key="String(opt.value)"
          type="button"
          @click="equip.base_vie.besoin = opt.value"
          class="rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
          :class="
            equip.base_vie.besoin === opt.value
              ? 'border-primary-500 bg-primary-600 text-white'
              : 'border-primary-200 text-primary-600 hover:bg-primary-100 dark:border-slate-700 dark:hover:bg-slate-700'
          ">
          {{ opt.label }}
        </button>
      </div>

      <div v-if="equip.base_vie.besoin === true" class="mt-4 grid gap-4 lg:grid-cols-2">
        <!-- POSE -->
        <div class="space-y-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <span class="text-primary-800 font-medium dark:text-gray-100">Pose</span>
            <AppSwitch v-model="posee" label="Posée" />
          </div>
          <AppDatePicker v-model="equip.base_vie.pose.date" title="Date de pose" placeholder="Sélectionnez une date" clearable />
          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="text-primary-700 mb-1 flex items-center gap-1.5 text-xs font-medium dark:text-gray-300">
                <Icon name="lucide:container" size="14" class="text-primary-500" />
                VAC
              </label>
              <AppSelect v-model="equip.base_vie.modules.vac" :options="vacOptions" placeholder="Aucun" nullable />
            </div>
            <div>
              <label class="text-primary-700 mb-1 flex items-center gap-1.5 text-xs font-medium dark:text-gray-300">
                <Icon name="lucide:boxes" size="14" class="text-primary-500" />
                ALGECO
              </label>
              <input
                v-model.number="equip.base_vie.modules.algeco"
                type="number"
                min="0"
                class="border-primary-300 text-primary-700 focus:border-primary-500 focus:ring-primary-500 w-full rounded-md border bg-white px-3 py-1.5 text-sm focus:ring-1 focus:outline-none dark:bg-slate-900" />
            </div>
            <div>
              <label class="text-primary-700 mb-1 flex items-center gap-1.5 text-xs font-medium dark:text-gray-300">
                <Icon name="lucide:fuel" size="14" class="text-primary-500" />
                Groupe élec.
              </label>
              <div class="flex h-[34px] items-center">
                <AppSwitch v-model="equip.base_vie.modules.groupe_electrogene" />
              </div>
            </div>
          </div>
          <div>
            <label class="text-primary-700 mb-1 block text-xs font-medium dark:text-gray-300">Commentaire</label>
            <textarea
              v-model="equip.base_vie.pose.commentaire"
              class="border-primary-300 text-primary-700 focus:border-primary-500 focus:ring-primary-500 h-20 w-full resize-y rounded-lg border bg-white p-3 text-sm focus:ring-1 focus:outline-none dark:bg-slate-900"
              placeholder="Remarque..."></textarea>
          </div>
        </div>

        <!-- DÉPOSE -->
        <div class="space-y-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <span class="text-primary-800 font-medium dark:text-gray-100">Dépose</span>
            <AppSwitch v-model="deposee" label="Déposée" />
          </div>
          <AppDatePicker v-model="equip.base_vie.depose.date" title="Date de dépose" placeholder="Sélectionnez une date" clearable />
          <div>
            <label class="text-primary-700 mb-1 block text-xs font-medium dark:text-gray-300">Commentaire</label>
            <textarea
              v-model="equip.base_vie.depose.commentaire"
              class="border-primary-300 text-primary-700 focus:border-primary-500 focus:ring-primary-500 h-20 w-full resize-y rounded-lg border bg-white p-3 text-sm focus:ring-1 focus:outline-none dark:bg-slate-900"
              placeholder="Remarque..."></textarea>
          </div>
        </div>
      </div>

      <div
        v-else-if="equip.base_vie.besoin === false"
        class="mt-4 rounded-lg border border-dashed border-gray-300 p-4 text-center text-sm text-gray-500 dark:border-gray-600">
        Pas de base vie sur ce chantier.
      </div>
      <div
        v-else
        class="mt-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300">
        <Icon name="lucide:info" size="16" />
        Indiquez si une base vie est nécessaire sur ce chantier.
      </div>
    </section>
  </ChantierLogistiqueShell>
</template>
