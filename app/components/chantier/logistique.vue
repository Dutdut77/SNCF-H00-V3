<script setup>
const props = defineProps({
  chantier: {
    type: Object,
    required: true
  }
})

const { getLogistiqueByChantier, upsertLogistique } = useLogistique()
const { setLoader } = useLoader()
const { canEditLogistique } = useLevelUser()

const equip = ref(null)

// --- Base vie ---
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

const formatDateForInput = (d) => {
  if (!d) return null
  const date = new Date(d)
  if (isNaN(date.getTime())) return null
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const serialize = (e) => ({
  base_vie: {
    besoin: e.base_vie.besoin,
    modules: e.base_vie.modules,
    pose: { ...e.base_vie.pose, date: formatDateForInput(e.base_vie.pose.date) },
    depose: { ...e.base_vie.depose, date: formatDateForInput(e.base_vie.depose.date) }
  },
  imprimante: {
    besoin: e.imprimante.besoin,
    ids: e.imprimante.ids,
    pose: { ...e.imprimante.pose, date: formatDateForInput(e.imprimante.pose.date) },
    depose: { ...e.imprimante.depose, date: formatDateForInput(e.imprimante.depose.date) }
  },
  wifi: {
    besoin: e.wifi.besoin,
    ids: e.wifi.ids,
    pose: { ...e.wifi.pose, date: formatDateForInput(e.wifi.pose.date) },
    depose: { ...e.wifi.depose, date: formatDateForInput(e.wifi.depose.date) }
  },
  radios: {
    besoin: e.radios.besoin,
    pk: e.radios.pk,
    fournisseur: e.radios.fournisseur,
    nombre: e.radios.nombre,
    station_fixe: e.radios.station_fixe,
    pose: { ...e.radios.pose, date: formatDateForInput(e.radios.pose.date) },
    depose: { ...e.radios.depose, date: formatDateForInput(e.radios.depose.date) }
  }
})

const load = async () => {
  setLoader(true)
  try {
    const raw = await getLogistiqueByChantier(props.chantier.id)
    equip.value = normalizeEquipements(raw)
  } finally {
    setLoader(false)
  }
}

const enregistrer = async () => {
  if (!equip.value || !canEditLogistique.value) return
  setLoader(true)
  try {
    await upsertLogistique(props.chantier.id, serialize(equip.value))
  } finally {
    setLoader(false)
  }
}

onMounted(load)
watch(
  () => props.chantier?.id,
  (id, old) => {
    if (id && id !== old) load()
  }
)
</script>

<template>
  <div class="flex h-full flex-col overflow-auto bg-gray-50 dark:bg-gray-950">
    <div class="flex flex-wrap items-center justify-between gap-3 p-4">
      <AppTitleMain title="Logistique" description="Base vie, imprimante, réseau et radio" />
      <span
        v-if="!canEditLogistique"
        class="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300">
        <Icon name="lucide:lock" size="14" />
        Lecture seule
      </span>
    </div>

    <div v-if="equip" class="space-y-4 px-4 pb-8">
      <!-- ══════════ BASE VIE ══════════ -->
      <section class="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
        <div class="mb-4 flex items-center gap-2">
          <div class="bg-primary-100 text-primary-600 dark:bg-slate-700 dark:text-slate-200 flex h-9 w-9 items-center justify-center rounded-lg">
            <Icon name="lucide:caravan" size="18" />
          </div>
          <h3 class="text-primary-800 text-lg font-semibold dark:text-white">Base vie</h3>
          <AppButtonValidated v-if="canEditLogistique" type="button" theme="primary" class="ml-auto" @click="enregistrer">
            <template #default>
              <span class="flex items-center gap-2">
                <Icon name="lucide:save" size="16" />
                Enregistrer
              </span>
            </template>
          </AppButtonValidated>
        </div>

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

      <!-- ══════════ IMPRIMANTE ══════════ -->
      <section class="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
        <div class="mb-4 flex items-center gap-2">
          <div class="bg-primary-100 text-primary-600 dark:bg-slate-700 dark:text-slate-200 flex h-9 w-9 items-center justify-center rounded-lg">
            <Icon name="lucide:printer" size="18" />
          </div>
          <h3 class="text-primary-800 text-lg font-semibold dark:text-white">Imprimante</h3>
          <AppButtonValidated v-if="canEditLogistique" type="button" theme="primary" class="ml-auto" @click="enregistrer">
            <template #default>
              <span class="flex items-center gap-2">
                <Icon name="lucide:save" size="16" />
                Enregistrer
              </span>
            </template>
          </AppButtonValidated>
        </div>
        <LogistiqueImprimanteSelector v-model="equip.imprimante" />
      </section>

      <!-- ══════════ RÉSEAU ══════════ -->
      <section class="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
        <div class="mb-4 flex items-center gap-2">
          <div class="bg-primary-100 text-primary-600 dark:bg-slate-700 dark:text-slate-200 flex h-9 w-9 items-center justify-center rounded-lg">
            <Icon name="lucide:wifi" size="18" />
          </div>
          <h3 class="text-primary-800 text-lg font-semibold dark:text-white">Réseau</h3>
          <AppButtonValidated v-if="canEditLogistique" type="button" theme="primary" class="ml-auto" @click="enregistrer">
            <template #default>
              <span class="flex items-center gap-2">
                <Icon name="lucide:save" size="16" />
                Enregistrer
              </span>
            </template>
          </AppButtonValidated>
        </div>
        <LogistiqueBoxSelector v-model="equip.wifi" />
      </section>

      <!-- ══════════ RADIO ══════════ -->
      <section class="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
        <div class="mb-4 flex items-center gap-2">
          <div class="bg-primary-100 text-primary-600 dark:bg-slate-700 dark:text-slate-200 flex h-9 w-9 items-center justify-center rounded-lg">
            <Icon name="lucide:radio" size="18" />
          </div>
          <h3 class="text-primary-800 text-lg font-semibold dark:text-white">Radio</h3>
          <AppButtonValidated v-if="canEditLogistique" type="button" theme="primary" class="ml-auto" @click="enregistrer">
            <template #default>
              <span class="flex items-center gap-2">
                <Icon name="lucide:save" size="16" />
                Enregistrer
              </span>
            </template>
          </AppButtonValidated>
        </div>
        <LogistiqueRadioEditor v-model="equip.radios" />
      </section>
    </div>
  </div>
</template>
