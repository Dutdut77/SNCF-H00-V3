<script setup>
const { boxes, getBoxes, createBox, updateBox, deleteBox } = useBoxes()
const { setLoader } = useLoader()

const globalFilter = ref('')

const filtered = computed(() => {
  const q = globalFilter.value.trim().toLowerCase()
  if (!q) return boxes.value
  return boxes.value.filter((b) => [b.nom, b.serie, b.identification].some((v) => v?.toLowerCase().includes(q)))
})

// ============================================
// FICHE : création / modification
// ============================================
const open = ref(false)
const isNew = ref(false)
const item = ref({})
const itemInitial = ref('')
const saving = ref(false)

const validated = computed(
  () => !!(item.value.nom?.trim() || item.value.identification?.trim() || item.value.serie?.trim())
)
const dirty = computed(() => open.value && JSON.stringify(item.value) !== itemInitial.value)

const ouvrir = (row) => {
  item.value = row ? { ...row } : { nom: '', serie: '', identification: '' }
  itemInitial.value = JSON.stringify(item.value)
  isNew.value = !row
  open.value = true
}
const openNew = () => ouvrir(null)
const openEdit = (row) => ouvrir(row)
const close = () => {
  open.value = false
  item.value = {}
}

const enregistrer = async () => {
  if (!validated.value) return
  saving.value = true
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
    saving.value = false
    setLoader(false)
  }
}

// ============================================
// SUPPRESSION
// ============================================
const showDeleteModal = ref(false)
const toDelete = ref(null)
const isDeleting = ref(false)

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
  <div class="flex min-h-0 flex-1 flex-col gap-4 p-4 lg:px-8 lg:pt-4 lg:pb-4">
    <!-- Barre d'outils -->
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
      <AppInputSearch
        v-model="globalFilter"
        boxed
        dense
        class="w-full sm:max-w-sm"
        placeholder="Rechercher un nom, un n°…" />
      <AppButtonValidated theme="brand" type="button" class="sm:ml-auto" @click="openNew">
        <template #default>
          <span class="flex items-center gap-2">
            <Icon name="lucide:plus" size="16" />
            Nouvelle box
          </span>
        </template>
      </AppButtonValidated>
    </div>

    <!-- Tableau des box -->
    <div :class="TABLEAU_CARTE">
      <table class="w-full min-w-max text-sm">
        <thead :class="TABLEAU_TETE">
          <tr>
            <th class="px-4 py-2.5 text-left">Box</th>
            <th class="px-4 py-2.5 text-left">N° d'identification</th>
            <th class="px-4 py-2.5 text-left">N° de série</th>
            <th class="w-24 px-4 py-2.5"><span class="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody :class="TABLEAU_CORPS">
          <tr v-for="b in filtered" :key="b.id" :class="TABLEAU_LIGNE" @click="openEdit(b)">
            <td class="px-4 py-3">
              <span class="text-ink flex items-center gap-2.5 font-medium">
                <Icon name="lucide:router" size="16" class="text-magenta-600 dark:text-magenta-300 shrink-0" />
                {{ b.nom || '—' }}
              </span>
            </td>
            <td class="px-4 py-3">
              <span v-if="b.identification" :class="ETIQUETTE_TAUPE">{{ b.identification }}</span>
              <span v-else class="text-slate-300 dark:text-white/25">—</span>
            </td>
            <td class="text-ink-soft px-4 py-3 tabular-nums">{{ b.serie || '—' }}</td>
            <td class="px-4 py-2">
              <div class="flex items-center justify-end gap-1">
                <button type="button" :class="BOUTON_ICONE" title="Modifier" @click.stop="openEdit(b)">
                  <Icon name="lucide:pencil" size="16" />
                </button>
                <button type="button" :class="BOUTON_ICONE_DANGER" title="Supprimer" @click.stop="openDelete(b)">
                  <Icon name="lucide:trash-2" size="16" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="filtered.length === 0" class="text-ink-soft flex flex-col items-center gap-2 p-10 text-sm">
        <Icon name="lucide:router" size="28" class="opacity-40" />
        Aucune box
      </div>
    </div>

    <!-- Fiche : création / modification -->
    <AppSidePanelForm
      :open="open"
      surtitre="Box réseau"
      :titre="item.nom?.trim() || item.identification?.trim() || (isNew ? 'Nouvelle box' : '—')"
      :sous-titre="item.nom?.trim() && item.identification ? `N° ${item.identification}` : ''"
      :valid="validated"
      :dirty="dirty"
      :locked="saving"
      :submit-label="isNew ? 'Créer la box' : 'Enregistrer'"
      @close="close"
      @submit="enregistrer">
      <section class="surface-card space-y-4 rounded-xl p-5" aria-labelledby="box-identification">
        <div>
          <h3 id="box-identification" class="text-ink font-semibold">Identification</h3>
          <p class="text-ink-soft mt-0.5 text-xs">Un des trois champs suffit à enregistrer la box.</p>
        </div>
        <div>
          <label for="box-nom" :class="CHAMP_LIBELLE">Nom</label>
          <input
            id="box-nom"
            v-model="item.nom"
            type="text"
            autocomplete="off"
            class="form-control h-10"
            placeholder="Nom de la box" />
        </div>
        <div>
          <label for="box-identification-champ" :class="CHAMP_LIBELLE">N° d'identification</label>
          <input
            id="box-identification-champ"
            v-model="item.identification"
            type="text"
            autocomplete="off"
            class="form-control h-10"
            placeholder="Identifiant interne" />
        </div>
        <div>
          <label for="box-serie" :class="CHAMP_LIBELLE">N° de série</label>
          <input
            id="box-serie"
            v-model="item.serie"
            type="text"
            autocomplete="off"
            class="form-control h-10"
            placeholder="Numéro de série" />
        </div>
      </section>
    </AppSidePanelForm>

    <!-- Confirmation de suppression -->
    <AppConfirmModal
      v-model="showDeleteModal"
      title="Supprimer la box"
      :loading="isDeleting"
      @confirm="confirmDelete"
      @cancel="toDelete = null">
      La box
      <strong class="text-ink">{{ toDelete?.nom || toDelete?.identification || toDelete?.serie || '—' }}</strong>
      sera supprimée définitivement.
    </AppConfirmModal>
  </div>
</template>
