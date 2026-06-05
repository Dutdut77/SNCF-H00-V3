<script setup>
const { boxes, getBoxes, createBox, updateBox, deleteBox } = useBoxes()
const { setLoader } = useLoader()

const globalFilter = ref('')
const open = ref(false)
const isNew = ref(false)
const item = ref({})

const showDeleteModal = ref(false)
const toDelete = ref(null)
const isDeleting = ref(false)

const filtered = computed(() => {
  const q = globalFilter.value.trim().toLowerCase()
  if (!q) return boxes.value
  return boxes.value.filter((b) => [b.nom, b.serie, b.identification].some((v) => v?.toLowerCase().includes(q)))
})

const validated = computed(() => !!(item.value.nom?.trim() || item.value.identification?.trim() || item.value.serie?.trim()))

const openNew = () => {
  item.value = { nom: '', serie: '', identification: '' }
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
      nom: item.value.nom?.trim() || null,
      serie: item.value.serie?.trim() || null,
      identification: item.value.identification?.trim() || null
    }
    if (isNew.value) await createBox(payload)
    else await updateBox(item.value.id, payload)
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
    await deleteBox(toDelete.value.id)
    showDeleteModal.value = false
    toDelete.value = null
  } finally {
    isDeleting.value = false
  }
}

setLoader(true)
try {
  await getBoxes()
} finally {
  setLoader(false)
}
</script>

<template>
  <div class="flex h-full w-full flex-col gap-4 overflow-auto p-4">
    <AppTitleMain title="Box réseau" description="Inventaire des box (réseau / WiFi)" />

    <div class="flex w-full flex-col items-center justify-between gap-4 sm:flex-row">
      <AppInputSearch v-model="globalFilter" class="w-full max-w-md" placeholder="Rechercher (n° de série, n°...)" />
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
              <th class="px-4 py-3 font-semibold">Nom</th>
              <th class="px-4 py-3 font-semibold">N° d'identification</th>
              <th class="px-4 py-3 font-semibold">N° de série</th>
              <th class="w-24 px-4 py-3 text-center font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            <tr
              v-for="b in filtered"
              :key="b.id"
              class="cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
              @click="openEdit(b)">
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <div class="bg-primary-100 dark:bg-primary-900/30 flex h-8 w-8 items-center justify-center rounded-lg">
                    <Icon name="lucide:router" size="16" class="text-primary-500" />
                  </div>
                  <span class="font-medium text-slate-900 dark:text-white">{{ b.nom || '—' }}</span>
                </div>
              </td>
              <td class="px-4 py-3">
                <span
                  v-if="b.identification"
                  class="rounded-md bg-teal-600 px-2 py-0.5 font-mono text-xs font-semibold text-white">
                  {{ b.identification }}
                </span>
                <span v-else class="text-slate-400">—</span>
              </td>
              <td class="px-4 py-3 text-slate-600 dark:text-slate-300">{{ b.serie || '—' }}</td>
              <td class="px-4 py-3 text-center">
                <div class="flex items-center justify-center gap-1">
                  <button
                    class="rounded-lg p-2 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700"
                    title="Modifier"
                    @click.stop="openEdit(b)">
                    <Icon name="lucide:pencil" class="hover:text-primary-500 h-4 w-4 text-slate-500" />
                  </button>
                  <button
                    class="rounded-lg p-2 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                    title="Supprimer"
                    @click.stop="openDelete(b)">
                    <Icon name="lucide:trash-2" class="h-4 w-4 text-slate-500 hover:text-red-500" />
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="filtered.length === 0">
              <td colspan="4" class="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                <Icon name="lucide:router" class="mx-auto mb-2 h-8 w-8 opacity-50" />
                <p>Aucune box</p>
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
                <Icon name="lucide:router" size="28" class="text-primary-500" />
              </div>
              <h2 class="text-xl font-semibold text-slate-900 dark:text-white">
                {{ isNew ? 'Nouvelle box' : 'Modifier la box' }}
              </h2>
            </div>
          </template>

          <template #default>
            <form @submit.prevent="enregistrer" class="flex w-full flex-col gap-4">
              <AppInput v-model="item.nom" name="nom" title="Nom" placeholder="Nom de la box" />
              <AppInput v-model="item.identification" name="identification" title="N° d'identification" placeholder="Identifiant interne" />
              <AppInput v-model="item.serie" name="serie" title="N° de série" placeholder="Numéro de série" />
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
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Supprimer la box</h3>
        </div>
      </template>
      <template #default>
        <p class="text-center text-sm text-slate-600 dark:text-slate-300">
          Confirmer la suppression de la box
          <span class="font-semibold text-slate-900 dark:text-white">{{ toDelete?.identification || toDelete?.serie }}</span> ?
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
