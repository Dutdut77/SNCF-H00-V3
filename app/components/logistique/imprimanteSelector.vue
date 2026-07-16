<script setup>
// Rattachement d'UNE imprimante de l'inventaire à un chantier (1 seule installée).
// v-model = objet imprimante { besoin: null/true/false, ids: [<imprimante.id>] }  (0 ou 1 id)
const model = defineModel({ type: Object, required: true })

const { imprimantes, getImprimantes } = useImprimantes()
const types = IMPRIMANTE_TYPES

onMounted(() => {
  if (!imprimantes.value.length) getImprimantes()
})

const byId = computed(() => Object.fromEntries(imprimantes.value.map((p) => [p.id, p])))
const ids = computed(() => model.value?.ids || [])
const assigned = computed(() => ids.value.map((id) => byId.value[id]).filter(Boolean))

// Besoin tri-état (comme la base vie / radio) : null = à définir, true = besoin, false = aucun besoin
const besoinOptions = [
  { value: null, label: 'À définir' },
  { value: true, label: 'Besoin' },
  { value: false, label: 'Aucun besoin' }
]

// Switchs d'état d'installation (0 / 2)
const installee = computed({
  get: () => model.value?.pose?.status === 2,
  set: (v) => {
    if (model.value?.pose) model.value.pose.status = v ? 2 : 0
  }
})
const retiree = computed({
  get: () => model.value?.depose?.status === 2,
  set: (v) => {
    if (model.value?.depose) model.value.depose.status = v ? 2 : 0
  }
})

const remove = (id) => {
  model.value = { ...model.value, ids: ids.value.filter((x) => x !== id) }
}

// Picker (choix unique)
const showPicker = ref(false)
const picked = ref(null)
const openPicker = () => {
  picked.value = ids.value[0] ?? null
  showPicker.value = true
}
const validatePick = () => {
  model.value = { ...model.value, ids: picked.value != null ? [picked.value] : [] }
  showPicker.value = false
}

const typeLabel = (t) => types.find((x) => x.id === t)?.label || '—'
const printerName = (p) => [p.marque, p.model].filter(Boolean).join(' ') || `Imprimante #${p.id}`
</script>

<template>
  <div class="space-y-4">
    <!-- Besoin d'une imprimante (tri-état) -->
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

    <!-- Imprimante rattachée -->
    <div v-if="model.besoin === true" class="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div class="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-700">
        <span class="text-primary-800 font-medium dark:text-gray-100">Imprimante rattachée</span>
        <AppButtonValidated type="button" theme="primary" @click="openPicker">
          <template #default>
            <span class="flex items-center gap-2">
              <Icon name="lucide:printer" size="16" />
              {{ assigned.length ? 'Changer' : 'Choisir' }}
            </span>
          </template>
        </AppButtonValidated>
      </div>

      <div v-if="assigned.length" class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-primary-500 border-b border-gray-100 text-left text-xs uppercase dark:border-gray-700">
              <th class="px-4 py-2.5 font-medium">N° d'identification</th>
              <th class="px-4 py-2.5 font-medium">Marque</th>
              <th class="px-4 py-2.5 font-medium">Modèle</th>
              <th class="px-4 py-2.5 font-medium">N° de série</th>
              <th class="px-4 py-2.5 font-medium">Type</th>
              <th class="px-4 py-2.5 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in assigned" :key="p.id">
              <td class="px-4 py-2.5">
                <span
                  v-if="p.identification"
                  class="rounded-md bg-teal-600 px-2.5 py-1 font-mono text-sm font-semibold text-white shadow-sm">
                  {{ p.identification }}
                </span>
                <span v-else class="text-primary-300">—</span>
              </td>
              <td class="text-primary-800 px-4 py-2.5 font-medium dark:text-gray-100">{{ p.marque || '—' }}</td>
              <td class="text-primary-600 px-4 py-2.5 dark:text-gray-300">{{ p.model || '—' }}</td>
              <td class="text-primary-600 px-4 py-2.5 dark:text-gray-300">{{ p.serie || '—' }}</td>
              <td class="px-4 py-2.5">
                <span
                  v-if="p.type"
                  class="rounded-full px-2 py-0.5 text-xs font-medium"
                  :class="p.type === 'location' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'">
                  {{ typeLabel(p.type) }}
                </span>
                <span v-else class="text-primary-300">—</span>
              </td>
              <td class="px-4 py-2.5">
                <div class="flex justify-end">
                  <button
                    type="button"
                    class="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-red-100 hover:text-red-600"
                    title="Retirer du chantier"
                    @click="remove(p.id)">
                    <Icon name="lucide:x" size="16" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="text-primary-400 flex flex-col items-center gap-2 p-8 text-center text-sm">
        <Icon name="lucide:printer" size="28" class="opacity-50" />
        Aucune imprimante. Cliquez sur « Choisir ».
      </div>

      <!-- État d'installation -->
      <div v-if="assigned.length" class="grid gap-3 border-t border-gray-100 p-4 sm:grid-cols-2 dark:border-gray-700">
        <div class="space-y-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <span class="text-primary-800 font-medium dark:text-gray-100">Installée</span>
            <AppSwitch v-model="installee" />
          </div>
          <AppDatePicker v-model="model.pose.date" title="Date d'installation" placeholder="Sélectionnez une date" clearable />
        </div>
        <div class="space-y-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <span class="text-primary-800 font-medium dark:text-gray-100">Retirée</span>
            <AppSwitch v-model="retiree" />
          </div>
          <AppDatePicker v-model="model.depose.date" title="Date de retrait" placeholder="Sélectionnez une date" clearable />
        </div>
      </div>
    </div>

    <div
      v-else-if="model.besoin === false"
      class="rounded-lg border border-dashed border-gray-300 p-4 text-center text-sm text-gray-500 dark:border-gray-600">
      Pas d'imprimante sur ce chantier.
    </div>
    <div
      v-else
      class="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300">
      <Icon name="lucide:info" size="16" />
      Indiquez si une imprimante est nécessaire sur ce chantier.
    </div>

    <!-- Modal de sélection (choix unique) -->
    <AppModal v-model="showPicker" size="lg">
      <template #header>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Choisir une imprimante</h3>
      </template>
      <template #default>
        <div v-if="imprimantes.length" class="flex flex-col gap-2">
          <label
            v-for="p in imprimantes"
            :key="p.id"
            class="flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors"
            :class="
              picked === p.id
                ? 'border-primary-500 bg-primary-50 dark:bg-slate-800'
                : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/40'
            ">
            <input v-model="picked" type="radio" :value="p.id" class="accent-primary-600 h-4 w-4 shrink-0" />
            <div class="min-w-0 flex-1">
              <div class="text-primary-800 font-medium dark:text-gray-100">{{ printerName(p) }}</div>
              <div class="text-primary-500 text-xs">
                <span v-if="p.serie">S/N {{ p.serie }}</span>
                <span v-if="p.type"> · {{ typeLabel(p.type) }}</span>
              </div>
            </div>
            <!-- N° d'identification mis en évidence, à droite -->
            <span
              v-if="p.identification"
              class="ml-auto shrink-0 rounded-md bg-teal-600 px-2.5 py-1 font-mono text-sm font-semibold text-white shadow-sm">
              {{ p.identification }}
            </span>
            <span
              v-else
              class="ml-auto shrink-0 rounded-md bg-gray-100 px-2 py-1 font-mono text-sm text-gray-400 dark:bg-gray-700">
              —
            </span>
          </label>
        </div>
        <div v-else class="py-6 text-center text-sm text-gray-500">
          Aucune imprimante dans l'inventaire.
          <br />
          Ajoutez-en dans <span class="font-medium">Paramètres → Logistique → Imprimante</span>.
        </div>
      </template>
      <template #footer>
        <div class="flex items-center justify-end gap-2">
          <AppButtonValidated type="button" theme="cancel" @click="showPicker = false">
            <template #default><span>Annuler</span></template>
          </AppButtonValidated>
          <AppButtonValidated type="button" theme="primary" :validated="picked != null" @click="validatePick">
            <template #default>
              <span class="flex items-center gap-2">
                <Icon name="lucide:check" size="16" />
                Valider
              </span>
            </template>
          </AppButtonValidated>
        </div>
      </template>
    </AppModal>
  </div>
</template>
