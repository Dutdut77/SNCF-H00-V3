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

    <!-- Imprimante rattachée -->
    <div v-if="model.besoin === true" class="rounded-xl border border-slate-200 dark:border-white/10">
      <div class="border-rule flex items-center justify-between border-b px-4 py-3">
        <span class="text-ink font-medium">Imprimante rattachée</span>
        <AppButtonValidated type="button" theme="outline" @click="openPicker">
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
            <tr class="table-head-text border-rule border-b text-left text-[0.72rem]">
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
                <span v-else class="text-slate-300 dark:text-white/25">—</span>
              </td>
              <td class="text-ink px-4 py-2.5 font-medium">{{ p.marque || '—' }}</td>
              <td class="text-ink-soft px-4 py-2.5">{{ p.model || '—' }}</td>
              <td class="text-ink-soft px-4 py-2.5">{{ p.serie || '—' }}</td>
              <td class="px-4 py-2.5">
                <span
                  v-if="p.type"
                  class="rounded-full px-2 py-0.5 text-xs font-medium"
                  :class="p.type === 'location' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'">
                  {{ typeLabel(p.type) }}
                </span>
                <span v-else class="text-slate-300 dark:text-white/25">—</span>
              </td>
              <td class="px-4 py-2.5">
                <div class="flex justify-end">
                  <button
                    type="button"
                    class="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-500/15"
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

      <div v-else class="text-ink-soft flex flex-col items-center gap-2 p-8 text-center text-sm">
        <Icon name="lucide:printer" size="28" class="opacity-50" />
        Aucune imprimante. Cliquez sur « Choisir ».
      </div>

      <!-- État d'installation -->
      <div v-if="assigned.length" class="border-rule grid gap-3 border-t p-4 sm:grid-cols-2">
        <div class="space-y-3 rounded-lg border border-slate-200 p-4 dark:border-white/10">
          <div class="flex items-center justify-between">
            <span class="text-ink font-medium">Installée</span>
            <AppSwitch v-model="installee" />
          </div>
          <AppDatePicker
            v4
            v-model="model.pose.date"
            title="Date d'installation"
            placeholder="Choisir une date"
            clearable />
        </div>
        <div class="space-y-3 rounded-lg border border-slate-200 p-4 dark:border-white/10">
          <div class="flex items-center justify-between">
            <span class="text-ink font-medium">Retirée</span>
            <AppSwitch v-model="retiree" />
          </div>
          <AppDatePicker
            v4
            v-model="model.depose.date"
            title="Date de retrait"
            placeholder="Choisir une date"
            clearable />
        </div>
      </div>
    </div>

    <div
      v-else-if="model.besoin === false"
      class="text-ink-soft rounded-lg border border-dashed border-slate-300 p-4 text-center text-sm dark:border-white/15">
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
        <h3 class="text-ink text-lg font-semibold">Choisir une imprimante</h3>
      </template>
      <template #default>
        <div v-if="imprimantes.length" class="flex flex-col gap-2">
          <label
            v-for="p in imprimantes"
            :key="p.id"
            class="flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors"
            :class="
              picked === p.id
                ? 'border-magenta-500 bg-magenta-50/60 ring-magenta-500 dark:bg-magenta-500/10 ring-1'
                : 'border-slate-200 hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/5'
            ">
            <input v-model="picked" type="radio" :value="p.id" class="accent-magenta-600 h-4 w-4 shrink-0" />
            <div class="min-w-0 flex-1">
              <div class="text-ink font-medium">{{ printerName(p) }}</div>
              <div class="text-ink-soft text-xs">
                <span v-if="p.serie">S/N {{ p.serie }}</span>
                <span v-if="p.type">· {{ typeLabel(p.type) }}</span>
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
              class="ml-auto shrink-0 rounded-md bg-slate-100 px-2 py-1 font-mono text-sm text-slate-400 dark:bg-white/10">
              —
            </span>
          </label>
        </div>
        <div v-else class="text-ink-soft py-6 text-center text-sm">
          Aucune imprimante dans l'inventaire.
          <br />
          Ajoutez-en dans
          <span class="font-medium">Paramètres → Logistique → Imprimante</span>
          .
        </div>
      </template>
      <template #footer>
        <div class="flex items-center justify-end gap-2">
          <AppButtonValidated type="button" theme="outline" @click="showPicker = false">
            <template #default><span>Annuler</span></template>
          </AppButtonValidated>
          <AppButtonValidated type="button" theme="brand" :validated="picked != null" @click="validatePick">
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
