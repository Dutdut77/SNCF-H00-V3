<script setup>
const { imprimantes, getImprimantes, createImprimante, updateImprimante, deleteImprimante } = useImprimantes()
const { setLoader } = useLoader()

const types = IMPRIMANTE_TYPES // auto-importé depuis app/utils/logistique.js

const globalFilter = ref('')
const open = ref(false)
const isNew = ref(false)
const item = ref({})

const showDeleteModal = ref(false)
const toDelete = ref(null)
const isDeleting = ref(false)

const filtered = computed(() => {
  const q = globalFilter.value.trim().toLowerCase()
  if (!q) return imprimantes.value
  return imprimantes.value.filter((i) =>
    [i.marque, i.model, i.serie, i.identification].some((v) => v?.toLowerCase().includes(q))
  )
})

const validated = computed(() => !!(item.value.marque?.trim() || item.value.model?.trim()))

const openNew = () => {
  item.value = { marque: '', model: '', serie: '', identification: '', type: null }
  isNew.value = true
  open.value = true
}
const openEdit = (row) => {
  item.value = { ...row }
  isNew.value = false
  open.value = true
}
const close = () => {
  open.value = false
  item.value = {}
}

const enregistrer = async () => {
  if (!validated.value) return
  setLoader(true)
  try {
    const payload = {
      marque: item.value.marque?.trim() || null,
      model: item.value.model?.trim() || null,
      serie: item.value.serie?.trim() || null,
      identification: item.value.identification?.trim() || null,
      type: item.value.type || null
    }
    if (isNew.value) await createImprimante(payload)
    else await updateImprimante(item.value.id, payload)
    close()
  } finally {
    setLoader(false)
  }
}

const openDelete = (row) => {
  toDelete.value = row
  showDeleteModal.value = true
}
const confirmDelete = async () => {
  if (!toDelete.value?.id) return
  isDeleting.value = true
  try {
    await deleteImprimante(toDelete.value.id)
    showDeleteModal.value = false
    toDelete.value = null
  } finally {
    isDeleting.value = false
  }
}

const typeLabel = (t) => types.find((x) => x.id === t)?.label || '—'

setLoader(true)
try {
  await getImprimantes()
} finally {
  setLoader(false)
}
</script>

<template>
  <div class="flex h-full w-full flex-col gap-4 overflow-auto p-4">
    <AppTitleMain title="Imprimantes" description="Inventaire des imprimantes (achat / location)" />

    <div class="flex w-full flex-col items-center justify-between gap-4 sm:flex-row">
      <AppInputSearch v-model="globalFilter" class="w-full max-w-md" placeholder="Rechercher (marque, modèle, n°...)" />
      <AppButtonValidated theme="primary" type="button" @click="openNew">
        <template #default>
          <span class="flex items-center gap-2">
            <Icon name="lucide:plus" size="18" />
            Ajouter
          </span>
        </template>
      </AppButtonValidated>
    </div>

    <div
      class="flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-md border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <div class="flex-1 overflow-auto">
        <table class="w-full text-sm">
          <thead class="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
            <tr class="text-left text-slate-700 dark:text-slate-200">
              <th class="px-4 py-3 font-semibold">Marque</th>
              <th class="px-4 py-3 font-semibold">Modèle</th>
              <th class="px-4 py-3 font-semibold">N° de série</th>
              <th class="px-4 py-3 font-semibold">N° d'identification</th>
              <th class="px-4 py-3 font-semibold">Type</th>
              <th class="w-24 px-4 py-3 text-center font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            <tr
              v-for="i in filtered"
              :key="i.id"
              class="cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
              @click="openEdit(i)">
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <div class="bg-primary-100 dark:bg-primary-900/30 flex h-8 w-8 items-center justify-center rounded-lg">
                    <Icon name="lucide:printer" size="16" class="text-primary-500" />
                  </div>
                  <span class="font-medium text-slate-900 dark:text-white">{{ i.marque || '—' }}</span>
                </div>
              </td>
              <td class="px-4 py-3 text-slate-600 dark:text-slate-300">{{ i.model || '—' }}</td>
              <td class="px-4 py-3 text-slate-600 dark:text-slate-300">{{ i.serie || '—' }}</td>
              <td class="px-4 py-3 text-slate-600 dark:text-slate-300">{{ i.identification || '—' }}</td>
              <td class="px-4 py-3">
                <span
                  v-if="i.type"
                  class="rounded-full px-2 py-0.5 text-xs font-medium"
                  :class="i.type === 'location' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'">
                  {{ typeLabel(i.type) }}
                </span>
                <span v-else class="text-slate-400">—</span>
              </td>
              <td class="px-4 py-3 text-center">
                <div class="flex items-center justify-center gap-1">
                  <button
                    class="rounded-lg p-2 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700"
                    title="Modifier"
                    @click.stop="openEdit(i)">
                    <Icon name="lucide:pencil" class="hover:text-primary-500 h-4 w-4 text-slate-500" />
                  </button>
                  <button
                    class="rounded-lg p-2 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                    title="Supprimer"
                    @click.stop="openDelete(i)">
                    <Icon name="lucide:trash-2" class="h-4 w-4 text-slate-500 hover:text-red-500" />
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="filtered.length === 0">
              <td colspan="6" class="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                <Icon name="lucide:printer" class="mx-auto mb-2 h-8 w-8 opacity-50" />
                <p>Aucune imprimante</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- SlideOver création / édition -->
    <AppSlideOver :sideModal="open" :closeSideModal="close">
      <template #default>
        <AppSlideOverContent v-if="open" :closeSideModal="close">
          <template #header>
            <div class="text-center">
              <div class="bg-primary-100 dark:bg-primary-900/30 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                <Icon name="lucide:printer" size="28" class="text-primary-500" />
              </div>
              <h2 class="text-xl font-semibold text-slate-900 dark:text-white">
                {{ isNew ? 'Nouvelle imprimante' : 'Modifier l’imprimante' }}
              </h2>
            </div>
          </template>

          <template #default>
            <form @submit.prevent="enregistrer" class="flex w-full flex-col gap-4">
              <AppInput v-model="item.marque" name="marque" title="Marque" placeholder="Ex. HP, Canon..." />
              <AppInput v-model="item.model" name="model" title="Modèle" placeholder="Ex. LaserJet 400" />
              <AppInput v-model="item.serie" name="serie" title="N° de série" placeholder="Numéro de série" />
              <AppInput
                v-model="item.identification"
                name="identification"
                title="N° d'identification"
                placeholder="Identifiant interne" />
              <div>
                <label class="text-primary-700 mb-1 block text-sm">Type</label>
                <div class="grid grid-cols-2 gap-2">
                  <button
                    v-for="t in types"
                    :key="t.id"
                    type="button"
                    @click="item.type = t.id"
                    class="rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
                    :class="
                      item.type === t.id
                        ? 'border-primary-500 bg-primary-600 text-white'
                        : 'border-primary-200 text-primary-600 hover:bg-primary-100 dark:border-slate-700 dark:hover:bg-slate-700'
                    ">
                    {{ t.label }}
                  </button>
                </div>
              </div>
            </form>
          </template>

          <template #footer>
            <div class="flex justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-700">
              <AppButtonValidated theme="cancel" type="button" @click="close">
                <template #default>Annuler</template>
              </AppButtonValidated>
              <AppButtonValidated :validated="validated" @click="enregistrer">
                <template #default>{{ isNew ? 'Créer' : 'Enregistrer' }}</template>
              </AppButtonValidated>
            </div>
          </template>
        </AppSlideOverContent>
      </template>
    </AppSlideOver>

    <!-- Modal suppression -->
    <AppModal v-model="showDeleteModal" size="md" :persistent="isDeleting">
      <template #header>
        <div class="text-center">
          <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <Icon name="lucide:triangle-alert" size="28" class="text-red-600 dark:text-red-400" />
          </div>
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Supprimer l’imprimante</h3>
        </div>
      </template>
      <template #default>
        <p class="text-center text-sm text-slate-600 dark:text-slate-300">
          Confirmer la suppression de
          <span class="font-semibold text-slate-900 dark:text-white">{{ toDelete?.marque }} {{ toDelete?.model }}</span> ?
          Cette action est irréversible.
        </p>
      </template>
      <template #footer>
        <div class="flex justify-end gap-3">
          <AppButtonValidated theme="cancel" type="button" :validated="!isDeleting" @click="showDeleteModal = false">
            <template #default>Annuler</template>
          </AppButtonValidated>
          <AppButtonValidated theme="delete" type="button" :loading="isDeleting" @click="confirmDelete">
            <template #default>Supprimer</template>
          </AppButtonValidated>
        </div>
      </template>
    </AppModal>
  </div>
</template>
