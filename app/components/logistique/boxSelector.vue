<script setup>
// Rattachement d'UNE box réseau de l'inventaire à un chantier (1 seule installée).
// v-model = objet wifi { besoin, ids:[<box.id>], pose, depose }
const model = defineModel({ type: Object, required: true })

const { boxes, getBoxes } = useBoxes()

onMounted(() => {
  if (!boxes.value.length) getBoxes()
})

const byId = computed(() => Object.fromEntries(boxes.value.map((b) => [b.id, b])))
const ids = computed(() => model.value?.ids || [])
const assigned = computed(() => ids.value.map((id) => byId.value[id]).filter(Boolean))

const besoin = computed({
  get: () => model.value?.besoin === true,
  set: (v) => {
    model.value = { ...model.value, besoin: v }
  }
})
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

const boxName = (b) => b.nom || b.serie || `Box #${b.id}`
</script>

<template>
  <div class="space-y-4">
    <!-- Switch d'activation -->
    <div class="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <div class="flex items-center gap-3">
        <div class="bg-primary-100 text-primary-600 dark:bg-slate-700 dark:text-slate-200 flex h-9 w-9 items-center justify-center rounded-lg">
          <Icon name="lucide:router" size="18" />
        </div>
        <div>
          <p class="text-primary-800 font-medium dark:text-gray-100">Box réseau sur ce chantier</p>
          <p class="text-primary-500 text-xs">Activez pour rattacher une box de l'inventaire</p>
        </div>
      </div>
      <AppSwitch v-model="besoin" />
    </div>

    <!-- Box rattachée -->
    <div v-if="besoin" class="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div class="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-700">
        <span class="text-primary-800 font-medium dark:text-gray-100">Box rattachée</span>
        <AppButtonValidated type="button" theme="primary" @click="openPicker">
          <template #default>
            <span class="flex items-center gap-2">
              <Icon name="lucide:router" size="16" />
              {{ assigned.length ? 'Changer' : 'Choisir' }}
            </span>
          </template>
        </AppButtonValidated>
      </div>

      <div v-if="assigned.length" class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-primary-500 border-b border-gray-100 text-left text-xs uppercase dark:border-gray-700">
              <th class="px-4 py-2.5 font-medium">Nom</th>
              <th class="px-4 py-2.5 font-medium">N° d'identification</th>
              <th class="px-4 py-2.5 font-medium">N° de série</th>
              <th class="px-4 py-2.5 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="b in assigned" :key="b.id">
              <td class="text-primary-800 px-4 py-2.5 font-medium dark:text-gray-100">{{ b.nom || '—' }}</td>
              <td class="px-4 py-2.5">
                <span
                  v-if="b.identification"
                  class="rounded-md bg-teal-600 px-2.5 py-1 font-mono text-sm font-semibold text-white shadow-sm">
                  {{ b.identification }}
                </span>
                <span v-else class="text-primary-300">—</span>
              </td>
              <td class="text-primary-600 px-4 py-2.5 dark:text-gray-300">{{ b.serie || '—' }}</td>
              <td class="px-4 py-2.5">
                <div class="flex justify-end">
                  <button
                    type="button"
                    class="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-red-100 hover:text-red-600"
                    title="Retirer du chantier"
                    @click="remove(b.id)">
                    <Icon name="lucide:x" size="16" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="text-primary-400 flex flex-col items-center gap-2 p-8 text-center text-sm">
        <Icon name="lucide:router" size="28" class="opacity-50" />
        Aucune box. Cliquez sur « Choisir ».
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

    <!-- Modal de sélection (choix unique) -->
    <AppModal v-model="showPicker" size="lg">
      <template #header>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Choisir une box</h3>
      </template>
      <template #default>
        <div v-if="boxes.length" class="flex flex-col gap-2">
          <label
            v-for="b in boxes"
            :key="b.id"
            class="flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors"
            :class="
              picked === b.id
                ? 'border-primary-500 bg-primary-50 dark:bg-slate-800'
                : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/40'
            ">
            <input v-model="picked" type="radio" :value="b.id" class="accent-primary-600 h-4 w-4 shrink-0" />
            <div class="min-w-0 flex-1">
              <div class="text-primary-800 font-medium dark:text-gray-100">{{ boxName(b) }}</div>
              <div class="text-primary-500 text-xs"><span v-if="b.serie">S/N {{ b.serie }}</span></div>
            </div>
            <span
              v-if="b.identification"
              class="ml-auto shrink-0 rounded-md bg-teal-600 px-2.5 py-1 font-mono text-sm font-semibold text-white shadow-sm">
              {{ b.identification }}
            </span>
            <span
              v-else
              class="ml-auto shrink-0 rounded-md bg-gray-100 px-2 py-1 font-mono text-sm text-gray-400 dark:bg-gray-700">
              —
            </span>
          </label>
        </div>
        <div v-else class="py-6 text-center text-sm text-gray-500">
          Aucune box dans l'inventaire.
          <br />
          Ajoutez-en dans <span class="font-medium">Paramètres → Logistique → Réseau</span>.
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
