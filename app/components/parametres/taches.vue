<script setup>
const { taches, getTaches, createTache, updateTache, deleteTache } = useTaches()
const { categories, getCategories } = useCategories()
const { profilTaches, getAllProfilTache } = useProfilTache()
const { setLoader } = useLoader()

const globalFilter = ref('')
const filtreCategorie = ref('toutes') // 'toutes' ou l'id d'une catégorie
const printComponentRef = ref(null)

// ============================================
// LISTE
// ============================================
const filteredTaches = computed(() => {
  const search = globalFilter.value.trim().toLowerCase()
  return taches.value.filter(
    (t) =>
      (filtreCategorie.value === 'toutes' || t.id_categories === filtreCategorie.value) &&
      (!search || t.tache?.toLowerCase().includes(search) || t.categorie?.toLowerCase().includes(search))
  )
})

// Liste du filtre : toutes, puis chaque catégorie qui a des tâches (ordre alphabétique), avec leur nombre
const filtresCategorie = computed(() => {
  const compte = {}
  for (const t of taches.value) compte[t.id_categories] = (compte[t.id_categories] ?? 0) + 1
  return [
    { id: 'toutes', label: 'Toutes les catégories', count: taches.value.length },
    ...categories.value
      .filter((c) => compte[c.id])
      .map((c) => ({ id: c.id, label: c.name, count: compte[c.id] }))
      .sort((a, b) => a.label.localeCompare(b.label, 'fr', { sensitivity: 'base' }))
  ]
})

// Délai : positif = avant la date de référence (J-X), négatif = après (J+X)
const formatDelais = (delais) => {
  if (delais === null || delais === undefined) return '—'
  if (delais === 0) return 'J0'
  return `${delais < 0 ? 'J+' : 'J-'}${Math.abs(delais)}`
}
const REFERENCES = [
  { id: 0, label: 'Début des travaux', court: 'début' },
  { id: 1, label: 'Fin des travaux', court: 'fin' }
]
const referenceCourte = (opt) => REFERENCES.find((r) => r.id === opt)?.court ?? 'début'

const profilLabel = (id) => profilTaches.value.find((p) => p.id === id)?.label ?? `#${id}`

// ============================================
// FICHE : création / modification
// ============================================
const open = ref(false)
const isNewTache = ref(false)
const tacheId = ref(null)
const oldTache = ref(null)
const form = ref({})
const formInitial = ref('')
const saving = ref(false)

// Le délai signé de la base est saisi en trois temps : nombre de jours, avant / après, début / fin
const formDepuis = (row) => ({
  tache: row?.tache ?? '',
  id_categories: row?.id_categories ?? null,
  jours: row ? Math.abs(row.delais ?? 0) : 0,
  sens: row?.delais < 0 ? 'apres' : 'avant',
  opt_delais: row?.opt_delais ?? 0,
  rp1: row?.rp1 === 1,
  tache_profil: [...(row?.tache_profil ?? [])]
})

const joursValides = computed(() => {
  const j = form.value.jours
  return j !== '' && j !== null && Number.isInteger(Number(j)) && Number(j) >= 0
})
const delaisSaisi = computed(() => {
  const j = Number(form.value.jours) || 0
  return form.value.sens === 'apres' ? -j : j
})
const validatedFields = computed(() => !!form.value.tache?.trim() && !!form.value.id_categories && joursValides.value)
const dirty = computed(() => open.value && JSON.stringify(form.value) !== formInitial.value)

// Échéance en toutes lettres, sous les champs
const echeance = computed(() => {
  const j = Number(form.value.jours) || 0
  const reference = form.value.opt_delais === 1 ? 'la fin des travaux' : 'le début des travaux'
  if (j === 0) return `Le jour ${form.value.opt_delais === 1 ? 'de la fin' : 'du début'} des travaux`
  return `${j} jour${j > 1 ? 's' : ''} ${form.value.sens === 'apres' ? 'après' : 'avant'} ${reference}`
})
// Les prévisions des chantiers existants suivent un changement d'échéance
const echeanceModifiee = computed(
  () =>
    !isNewTache.value &&
    oldTache.value &&
    (delaisSaisi.value !== oldTache.value.delais || form.value.opt_delais !== oldTache.value.opt_delais)
)

const categoriesOptions = computed(() => categories.value.map((c) => ({ id: c.id, label: c.name })))

const toggleProfil = (id) => {
  const liste = form.value.tache_profil
  form.value.tache_profil = liste.includes(id) ? liste.filter((p) => p !== id) : [...liste, id]
}
const tousProfils = computed(
  () => profilTaches.value.length > 0 && profilTaches.value.every((p) => form.value.tache_profil?.includes(p.id))
)
const basculerTousProfils = () => {
  form.value.tache_profil = tousProfils.value ? [] : profilTaches.value.map((p) => p.id)
}

const ouvrir = (row) => {
  form.value = formDepuis(row)
  formInitial.value = JSON.stringify(form.value)
  isNewTache.value = !row
  tacheId.value = row?.id ?? null
  oldTache.value = row ? { ...row } : null
  open.value = true
}
const openSlide = (row) => row && ouvrir(row)
const openSlideNew = () => ouvrir(null)

const closeSlide = () => {
  open.value = false
  oldTache.value = null
  isNewTache.value = false
}

const enregistrer = async () => {
  if (!validatedFields.value) return
  const payload = {
    tache: form.value.tache.trim(),
    id_categories: form.value.id_categories,
    delais: delaisSaisi.value,
    tache_profil: form.value.tache_profil,
    opt_delais: form.value.opt_delais,
    rp1: form.value.rp1 ? 1 : 0
  }

  saving.value = true
  setLoader(true)
  try {
    if (isNewTache.value) await createTache(payload)
    else await updateTache(tacheId.value, payload, oldTache.value)
    closeSlide()
  } finally {
    saving.value = false
    setLoader(false)
  }
}

// ============================================
// SUPPRESSION
// ============================================
const showDeleteModal = ref(false)
const tacheToDelete = ref(null)
const isDeleting = ref(false)

const openDeleteModal = (t) => {
  if (!t?.id) return
  tacheToDelete.value = t
  showDeleteModal.value = true
}

const confirmDelete = async () => {
  if (!tacheToDelete.value?.id) return

  isDeleting.value = true
  try {
    await deleteTache(tacheToDelete.value.id)
    showDeleteModal.value = false
    tacheToDelete.value = null
  } finally {
    isDeleting.value = false
  }
}

// Appeler le composant d'impression
const printTaches = () => {
  printComponentRef.value?.printTaches()
}

// Charger les données au montage
setLoader(true)
try {
  await Promise.all([getTaches(), getCategories(), getAllProfilTache()])
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
        placeholder="Rechercher une tâche…" />
      <!-- Filtre par catégorie : une liste plutôt qu'une pastille par catégorie -->
      <AppSelect
        v-model="filtreCategorie"
        v4
        icon="lucide:folder"
        name="filtre-categorie"
        class="sm:w-72"
        :options="filtresCategorie"
        :searchable="filtresCategorie.length > 8"
        search-placeholder="Rechercher une catégorie…"
        aria-label="Filtrer par catégorie" />
      <div class="flex items-center gap-2 sm:ml-auto">
        <AppButtonValidated theme="outline" type="button" class="max-lg:hidden" @click="printTaches">
          <template #default>
            <span class="flex items-center gap-2">
              <Icon name="lucide:printer" size="16" />
              Imprimer
            </span>
          </template>
        </AppButtonValidated>
        <AppButtonValidated theme="brand" type="button" @click="openSlideNew">
          <template #default>
            <span class="flex items-center gap-2">
              <Icon name="lucide:plus" size="16" />
              Nouvelle tâche
            </span>
          </template>
        </AppButtonValidated>
      </div>
    </div>

    <!-- Tableau des tâches -->
    <div :class="TABLEAU_CARTE">
      <table class="w-full text-sm">
        <thead :class="TABLEAU_TETE">
          <tr>
            <th class="px-4 py-2.5 text-left">Tâche</th>
            <th class="hidden px-4 py-2.5 text-left md:table-cell">Catégorie</th>
            <th class="px-4 py-2.5 text-center">Échéance</th>
            <th class="hidden px-4 py-2.5 text-left xl:table-cell">Profils</th>
            <th class="hidden px-4 py-2.5 text-center lg:table-cell">RP1</th>
            <th class="w-24 px-4 py-2.5"><span class="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody :class="TABLEAU_CORPS">
          <tr v-for="t in filteredTaches" :key="t.id" :class="TABLEAU_LIGNE" @click="openSlide(t)">
            <td class="px-4 py-3">
              <p class="text-ink line-clamp-2 font-medium">{{ t.tache || '—' }}</p>
              <p class="text-ink-soft mt-0.5 text-xs md:hidden">{{ t.categorie || 'Sans catégorie' }}</p>
            </td>
            <td class="hidden px-4 py-3 md:table-cell">
              <span
                class="text-ink inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium whitespace-nowrap dark:bg-white/8">
                {{ t.categorie || 'Sans catégorie' }}
              </span>
            </td>
            <td class="px-4 py-3 text-center whitespace-nowrap">
              <span class="text-ink font-semibold tabular-nums">{{ formatDelais(t.delais) }}</span>
              <span class="text-ink-soft ml-1.5 text-xs">{{ referenceCourte(t.opt_delais) }}</span>
            </td>
            <td class="hidden px-4 py-3 xl:table-cell">
              <div
                v-if="t.tache_profil?.length"
                class="flex flex-wrap gap-1"
                :title="t.tache_profil.map(profilLabel).join(', ')">
                <span
                  v-for="p in t.tache_profil.slice(0, 3)"
                  :key="p"
                  class="text-ink-soft rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap dark:bg-white/8">
                  {{ profilLabel(p) }}
                </span>
                <span v-if="t.tache_profil.length > 3" class="text-ink-soft px-1 py-0.5 text-[11px] font-semibold">
                  +{{ t.tache_profil.length - 3 }}
                </span>
              </div>
              <span v-else class="text-slate-300 dark:text-white/25">—</span>
            </td>
            <td class="hidden px-4 py-3 text-center lg:table-cell">
              <span
                v-if="t.rp1 === 1"
                class="bg-ochre-100 text-ochre-700 dark:bg-ochre-400/14 dark:text-ochre-300 rounded-full px-2 py-0.5 text-xs font-semibold">
                RP1
              </span>
              <span v-else class="text-slate-300 dark:text-white/25">—</span>
            </td>
            <td class="px-4 py-2">
              <div class="flex items-center justify-end gap-1">
                <button type="button" :class="BOUTON_ICONE" title="Modifier" @click.stop="openSlide(t)">
                  <Icon name="lucide:pencil" size="16" />
                </button>
                <button type="button" :class="BOUTON_ICONE_DANGER" title="Supprimer" @click.stop="openDeleteModal(t)">
                  <Icon name="lucide:trash-2" size="16" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="filteredTaches.length === 0" class="text-ink-soft flex flex-col items-center gap-2 p-10 text-sm">
        <Icon name="lucide:clipboard-x" size="28" class="opacity-40" />
        Aucune tâche trouvée
      </div>
    </div>

    <!-- Fiche : création / modification -->
    <AppSidePanelForm
      :open="open"
      surtitre="Tâche"
      :titre="form.tache?.trim() || (isNewTache ? 'Nouvelle tâche' : '—')"
      :valid="validatedFields"
      :dirty="dirty"
      :locked="saving"
      :submit-label="isNewTache ? 'Créer la tâche' : 'Enregistrer'"
      @close="closeSlide"
      @submit="enregistrer">
      <template #pastilles>
        <span class="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1">
          <Icon name="lucide:calendar-clock" size="13" />
          {{ formatDelais(delaisSaisi) }} · {{ referenceCourte(form.opt_delais) }} des travaux
        </span>
        <span v-if="form.rp1" class="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1">RP1</span>
      </template>

      <section class="surface-card space-y-4 rounded-xl p-5" aria-labelledby="tache-identite">
        <h3 id="tache-identite" class="text-ink font-semibold">Tâche</h3>
        <div>
          <label for="tache-nom" :class="CHAMP_LIBELLE">Intitulé</label>
          <textarea
            id="tache-nom"
            v-model="form.tache"
            rows="3"
            class="form-control resize-y py-2.5"
            placeholder="Description de la tâche…" />
        </div>
        <div>
          <p :class="CHAMP_LIBELLE">Catégorie</p>
          <AppSelect
            v-model="form.id_categories"
            v4
            :options="categoriesOptions"
            placeholder="Sélectionner une catégorie…" />
        </div>
      </section>

      <!-- Échéance : le délai signé, décomposé -->
      <section class="surface-card space-y-4 rounded-xl p-5" aria-labelledby="tache-echeance">
        <div>
          <h3 id="tache-echeance" class="text-ink font-semibold">Échéance</h3>
          <p class="text-ink-soft mt-0.5 text-xs">Date prévue de la tâche sur chaque chantier.</p>
        </div>
        <div class="grid gap-3 sm:grid-cols-[7rem_minmax(0,1fr)]">
          <div>
            <label for="tache-jours" :class="CHAMP_LIBELLE">Jours</label>
            <input
              id="tache-jours"
              v-model.number="form.jours"
              type="number"
              min="0"
              step="1"
              class="form-control h-10 tabular-nums"
              :class="{ 'border-red-400!': !joursValides }" />
          </div>
          <div>
            <p :class="CHAMP_LIBELLE">Sens</p>
            <div class="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Sens">
              <button
                v-for="s in [
                  { id: 'avant', label: 'Avant' },
                  { id: 'apres', label: 'Après' }
                ]"
                :key="s.id"
                type="button"
                role="radio"
                :aria-checked="form.sens === s.id"
                class="h-10 cursor-pointer rounded-lg border text-sm font-medium transition-colors"
                :class="segmentOption(form.sens === s.id)"
                @click="form.sens = s.id">
                {{ s.label }}
              </button>
            </div>
          </div>
        </div>
        <div>
          <p :class="CHAMP_LIBELLE">Date de référence</p>
          <div class="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Date de référence">
            <button
              v-for="r in REFERENCES"
              :key="r.id"
              type="button"
              role="radio"
              :aria-checked="form.opt_delais === r.id"
              class="h-10 cursor-pointer rounded-lg border text-sm font-medium transition-colors"
              :class="segmentOption(form.opt_delais === r.id)"
              @click="form.opt_delais = r.id">
              {{ r.label }}
            </button>
          </div>
        </div>
        <p class="text-ink flex items-center gap-2 rounded-lg bg-slate-50 px-3.5 py-2.5 text-sm dark:bg-white/5">
          <Icon name="lucide:calendar-clock" size="16" class="text-magenta-600 dark:text-magenta-300 shrink-0" />
          <span>
            {{ echeance }}
            <span class="text-ink-soft tabular-nums">({{ formatDelais(delaisSaisi) }})</span>
          </span>
        </p>
        <p v-if="echeanceModifiee" class="text-ochre-700 dark:text-ochre-300 flex items-start gap-2 text-xs">
          <Icon name="lucide:triangle-alert" size="14" class="mt-px shrink-0" />
          Les prévisions de cette tâche sur les chantiers existants seront recalculées.
        </p>
      </section>

      <section class="surface-card rounded-xl p-5" aria-labelledby="tache-suivi">
        <h3 id="tache-suivi" class="text-ink mb-3 font-semibold">Suivi</h3>
        <AppSwitchRow
          v-model="form.rp1"
          label="Tâche RP1"
          description="Suivie dans le tableau de bord RP1"
          icon="lucide:flag"
          icon-class="text-ochre-400" />
      </section>

      <section class="surface-card rounded-xl p-5" aria-labelledby="tache-profils">
        <div class="mb-3 flex items-center justify-between gap-3">
          <div>
            <h3 id="tache-profils" class="text-ink font-semibold">Profils concernés</h3>
            <p class="text-ink-soft mt-0.5 text-xs">
              {{ form.tache_profil?.length || 'Aucun' }} profil{{
                form.tache_profil?.length > 1 ? 's' : ''
              }}
              sélectionné{{ form.tache_profil?.length > 1 ? 's' : '' }}
            </p>
          </div>
          <button
            type="button"
            class="text-magenta-700 hover:text-magenta-900 dark:text-magenta-300 cursor-pointer text-xs font-semibold dark:hover:text-white"
            @click="basculerTousProfils">
            {{ tousProfils ? 'Tout retirer' : 'Tout sélectionner' }}
          </button>
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="p in profilTaches"
            :key="p.id"
            type="button"
            role="checkbox"
            :aria-checked="form.tache_profil?.includes(p.id)"
            class="flex h-9 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition-colors"
            :class="segmentOption(form.tache_profil?.includes(p.id))"
            @click="toggleProfil(p.id)">
            <Icon v-if="form.tache_profil?.includes(p.id)" name="lucide:check" size="14" />
            {{ p.label }}
          </button>
        </div>
      </section>
    </AppSidePanelForm>

    <!-- Confirmation de suppression -->
    <AppConfirmModal
      v-model="showDeleteModal"
      title="Supprimer la tâche"
      :loading="isDeleting"
      @confirm="confirmDelete"
      @cancel="tacheToDelete = null">
      La tâche
      <strong class="text-ink">
        « {{ tacheToDelete?.tache?.substring(0, 80) || '' }}{{ tacheToDelete?.tache?.length > 80 ? '…' : '' }} »
      </strong>
      sera supprimée définitivement.
    </AppConfirmModal>

    <!-- Composant d'impression (invisible) -->
    <ParametresTachesPrint ref="printComponentRef" :taches="taches" :profils="profilTaches" />
  </div>
</template>
