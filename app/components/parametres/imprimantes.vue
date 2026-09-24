<script setup>
const { imprimantes, getImprimantes, createImprimante, updateImprimante, deleteImprimante } = useImprimantes()
const { setLoader } = useLoader()

const types = IMPRIMANTE_TYPES // auto-importé depuis app/utils/logistique.js

// Pastille du type : location en bleu ciel, achat en émeraude
const TYPE_PASTILLE = {
  achat: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/16 dark:text-emerald-300',
  location: 'bg-sky-100 text-sky-700 dark:bg-sky-400/16 dark:text-sky-300'
}

const globalFilter = ref('')
const filtreType = ref(null) // null = tous

const filtresType = computed(() => [
  { id: null, label: 'Toutes', count: imprimantes.value.length },
  ...types.map((t) => ({ ...t, count: imprimantes.value.filter((i) => i.type === t.id).length }))
])

const filtered = computed(() => {
  const q = globalFilter.value.trim().toLowerCase()
  return imprimantes.value.filter(
    (i) =>
      (filtreType.value === null || i.type === filtreType.value) &&
      (!q || [i.marque, i.model, i.serie, i.identification].some((v) => v?.toLowerCase().includes(q)))
  )
})

const typeLabel = (t) => types.find((x) => x.id === t)?.label || '—'

// ============================================
// FICHE : création / modification
// ============================================
const open = ref(false)
const isNew = ref(false)
const item = ref({})
const itemInitial = ref('')
const saving = ref(false)

const validated = computed(() => !!(item.value.marque?.trim() || item.value.model?.trim()))
const dirty = computed(() => open.value && JSON.stringify(item.value) !== itemInitial.value)
const titreFiche = computed(() => [item.value.marque, item.value.model].filter((v) => v?.trim()).join(' '))

const ouvrir = (row) => {
  item.value = row ? { ...row } : { marque: '', model: '', serie: '', identification: '', type: null }
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
    await deleteImprimante(toDelete.value.id)
    showDeleteModal.value = false
    toDelete.value = null
  } finally {
    isDeleting.value = false
  }
}

setLoader(true)
try {
  await getImprimantes()
} finally {
  setLoader(false)
}
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col gap-4 p-4 lg:px-8 lg:pt-4 lg:pb-4">
    <!-- Barre d'outils -->
    <div class="flex flex-col gap-3 lg:flex-row lg:items-center">
      <AppInputSearch
        v-model="globalFilter"
        boxed
        dense
        class="w-full lg:max-w-sm"
        placeholder="Rechercher une marque, un modèle, un n°…" />
      <AppFilterPills v-model="filtreType" :options="filtresType" label="Filtrer par type" />
      <AppButtonValidated theme="brand" type="button" class="lg:ml-auto" @click="openNew">
        <template #default>
          <span class="flex items-center gap-2">
            <Icon name="lucide:plus" size="16" />
            Nouvelle imprimante
          </span>
        </template>
      </AppButtonValidated>
    </div>

    <!-- Tableau des imprimantes -->
    <div :class="TABLEAU_CARTE">
      <table class="w-full min-w-max text-sm">
        <thead :class="TABLEAU_TETE">
          <tr>
            <th class="px-4 py-2.5 text-left">Imprimante</th>
            <th class="px-4 py-2.5 text-left">N° d'identification</th>
            <th class="px-4 py-2.5 text-left">N° de série</th>
            <th class="px-4 py-2.5 text-center">Type</th>
            <th class="w-24 px-4 py-2.5"><span class="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody :class="TABLEAU_CORPS">
          <tr v-for="i in filtered" :key="i.id" :class="TABLEAU_LIGNE" @click="openEdit(i)">
            <td class="px-4 py-3">
              <div class="flex items-center gap-3">
                <Icon name="lucide:printer" size="16" class="text-magenta-600 dark:text-magenta-300 shrink-0" />
                <div class="min-w-0">
                  <p class="text-ink font-medium">{{ i.marque || '—' }}</p>
                  <p class="text-ink-soft text-xs">{{ i.model || 'Modèle non renseigné' }}</p>
                </div>
              </div>
            </td>
            <td class="px-4 py-3">
              <span v-if="i.identification" :class="ETIQUETTE_TAUPE">{{ i.identification }}</span>
              <span v-else class="text-slate-300 dark:text-white/25">—</span>
            </td>
            <td class="text-ink-soft px-4 py-3 tabular-nums">{{ i.serie || '—' }}</td>
            <td class="px-4 py-3 text-center">
              <span
                v-if="i.type"
                class="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                :class="TYPE_PASTILLE[i.type]">
                {{ typeLabel(i.type) }}
              </span>
              <span v-else class="text-slate-300 dark:text-white/25">—</span>
            </td>
            <td class="px-4 py-2">
              <div class="flex items-center justify-end gap-1">
                <button type="button" :class="BOUTON_ICONE" title="Modifier" @click.stop="openEdit(i)">
                  <Icon name="lucide:pencil" size="16" />
                </button>
                <button type="button" :class="BOUTON_ICONE_DANGER" title="Supprimer" @click.stop="openDelete(i)">
                  <Icon name="lucide:trash-2" size="16" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="filtered.length === 0" class="text-ink-soft flex flex-col items-center gap-2 p-10 text-sm">
        <Icon name="lucide:printer" size="28" class="opacity-40" />
        Aucune imprimante
      </div>
    </div>

    <!-- Fiche : création / modification -->
    <AppSidePanelForm
      :open="open"
      surtitre="Imprimante"
      :titre="titreFiche || (isNew ? 'Nouvelle imprimante' : '—')"
      :sous-titre="item.identification ? `N° ${item.identification}` : ''"
      :valid="validated"
      :dirty="dirty"
      :locked="saving"
      :submit-label="isNew ? 'Créer l\'imprimante' : 'Enregistrer'"
      @close="close"
      @submit="enregistrer">
      <section class="surface-card space-y-4 rounded-xl p-5" aria-labelledby="imprimante-modele">
        <div>
          <h3 id="imprimante-modele" class="text-ink font-semibold">Modèle</h3>
          <p class="text-ink-soft mt-0.5 text-xs">La marque ou le modèle suffit à enregistrer l'imprimante.</p>
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label for="imprimante-marque" :class="CHAMP_LIBELLE">Marque</label>
            <input
              id="imprimante-marque"
              v-model="item.marque"
              type="text"
              autocomplete="off"
              class="form-control h-10"
              placeholder="Ex. : HP, Canon…" />
          </div>
          <div>
            <label for="imprimante-model" :class="CHAMP_LIBELLE">Modèle</label>
            <input
              id="imprimante-model"
              v-model="item.model"
              type="text"
              autocomplete="off"
              class="form-control h-10"
              placeholder="Ex. : LaserJet 400" />
          </div>
        </div>
        <div>
          <p :class="CHAMP_LIBELLE">Type</p>
          <div class="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Type">
            <button
              v-for="t in types"
              :key="t.id"
              type="button"
              role="radio"
              :aria-checked="item.type === t.id"
              class="h-10 cursor-pointer rounded-lg border text-sm font-medium transition-colors"
              :class="segmentOption(item.type === t.id)"
              @click="item.type = item.type === t.id ? null : t.id">
              {{ t.label }}
            </button>
          </div>
        </div>
      </section>

      <section class="surface-card space-y-4 rounded-xl p-5" aria-labelledby="imprimante-numeros">
        <h3 id="imprimante-numeros" class="text-ink font-semibold">Numéros</h3>
        <div>
          <label for="imprimante-identification" :class="CHAMP_LIBELLE">N° d'identification</label>
          <input
            id="imprimante-identification"
            v-model="item.identification"
            type="text"
            autocomplete="off"
            class="form-control h-10"
            placeholder="Identifiant interne" />
        </div>
        <div>
          <label for="imprimante-serie" :class="CHAMP_LIBELLE">N° de série</label>
          <input
            id="imprimante-serie"
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
      title="Supprimer l'imprimante"
      :loading="isDeleting"
      @confirm="confirmDelete"
      @cancel="toDelete = null">
      L'imprimante
      <strong class="text-ink">{{ [toDelete?.marque, toDelete?.model].filter(Boolean).join(' ') || '—' }}</strong>
      sera supprimée définitivement.
    </AppConfirmModal>
  </div>
</template>
