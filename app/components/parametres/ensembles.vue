<script setup>
const {
  getEnsembles,
  createEnsemble,
  updateEnsemble,
  deleteEnsemble,
  getLignesEnsemble,
  addLigneEnsemble,
  updateLigneEnsemble,
  deleteLigneEnsemble,
  getSousEnsembles,
  addSousEnsemble,
  updateSousEnsemble,
  deleteSousEnsemble,
} = useEnsemblesMatieres()

// ─── État global ─────────────────────────────────────────────────────────────
const ensembles = ref([])
const loadingEnsembles = ref(false)
const selectedEnsemble = ref(null)
const lignes = ref([])         // articles directs
const sousEnsembles = ref([])  // sous-ensembles
const loadingLignes = ref(false)

// ─── Modales ──────────────────────────────────────────────────────────────────
const showFormEnsemble = ref(false)
const editingEnsemble = ref(null)
const showDeleteEnsemble = ref(false)
const ensembleToDelete = ref(null)
const showDeleteLigne = ref(false)
const ligneToDelete = ref(null)
const showDeleteSousEnsemble = ref(false)
const sousEnsembleToDelete = ref(null)

// ─── Sidebar catalogue ────────────────────────────────────────────────────────
const showCatalogue = ref(false)
const showImport    = ref(false)

const handleImported = async ({ ensemble }) => {
  ensembles.value.unshift({ ...ensemble, nb_articles: 0 })
  showImport.value = false
  await selectEnsemble(ensemble)
}

// ─── Sous-ensembles dépliés ───────────────────────────────────────────────────
const openSousEnsembles = ref(new Set())
const toggleSousEnsemble = (id) => {
  const s = new Set(openSousEnsembles.value)
  s.has(id) ? s.delete(id) : s.add(id)
  openSousEnsembles.value = s
}

// ─── Items affichés : sous-ensembles en tête, articles triés par symbole ─────
const itemsAffiches = computed(() => {
  const se = sousEnsembles.value.map((s) => ({ type: 'sous-ensemble', data: s }))
  const arts = [...lignes.value]
    .sort((a, b) => a.numero_symbole.localeCompare(b.numero_symbole))
    .map((l) => ({ type: 'article', data: l }))
  return [...se, ...arts]
})

// ─── Formulaire ensemble ──────────────────────────────────────────────────────
const formNom = ref('')
const formDescription = ref('')
const savingEnsemble = ref(false)

const openCreateEnsemble = () => {
  editingEnsemble.value = null
  formNom.value = ''
  formDescription.value = ''
  showFormEnsemble.value = true
}

const openEditEnsemble = (ensemble) => {
  editingEnsemble.value = ensemble
  formNom.value = ensemble.nom
  formDescription.value = ensemble.description || ''
  showFormEnsemble.value = true
}

const submitEnsemble = async () => {
  if (!formNom.value.trim()) return
  savingEnsemble.value = true
  const payload = { nom: formNom.value.trim(), description: formDescription.value.trim() }

  if (editingEnsemble.value) {
    const updated = await updateEnsemble(editingEnsemble.value.id, payload)
    if (updated) {
      const idx = ensembles.value.findIndex((e) => e.id === updated.id)
      if (idx !== -1) ensembles.value[idx] = { ...updated, nb_articles: lignes.value.length }
      if (selectedEnsemble.value?.id === updated.id) selectedEnsemble.value = ensembles.value[idx]
    }
  } else {
    const created = await createEnsemble(payload)
    if (created) {
      ensembles.value.unshift(created)
      await selectEnsemble(created)
    }
  }
  savingEnsemble.value = false
  showFormEnsemble.value = false
}

// ─── Sélection ensemble ───────────────────────────────────────────────────────
const selectEnsemble = async (ensemble) => {
  selectedEnsemble.value = ensemble
  showCatalogue.value = false
  openSousEnsembles.value = new Set()
  loadingLignes.value = true
  ;[lignes.value, sousEnsembles.value] = await Promise.all([
    getLignesEnsemble(ensemble.id),
    getSousEnsembles(ensemble.id),
  ])
  loadingLignes.value = false
}

// ─── Suppression ensemble ─────────────────────────────────────────────────────
const askDeleteEnsemble = (ensemble) => {
  ensembleToDelete.value = ensemble
  showDeleteEnsemble.value = true
}

const confirmDeleteEnsemble = async () => {
  if (!ensembleToDelete.value) return
  const ok = await deleteEnsemble(ensembleToDelete.value.id)
  if (ok) {
    ensembles.value = ensembles.value.filter((e) => e.id !== ensembleToDelete.value.id)
    if (selectedEnsemble.value?.id === ensembleToDelete.value.id) {
      selectedEnsemble.value = null
      lignes.value = []
      sousEnsembles.value = []
    }
  }
  showDeleteEnsemble.value = false
  ensembleToDelete.value = null
}

// ─── Articles directs ─────────────────────────────────────────────────────────
const existingSymboles = computed(() => lignes.value.map((l) => l.numero_symbole))
const existingEnsembleIds = computed(() => [
  ...(selectedEnsemble.value ? [selectedEnsemble.value.id] : []), // évite l'auto-référence
  ...sousEnsembles.value.map((s) => s.sous_ensemble_id),
])

const handleAddArticle = async ({ article, quantite }) => {
  if (!selectedEnsemble.value) return
  const ligne = await addLigneEnsemble(selectedEnsemble.value.id, article.numero_symbole, quantite)
  if (ligne) lignes.value.push(ligne)
}

const handleUpdateQuantite = async (ligne, value) => {
  const qty = value === '' || value == null ? 0 : Number(value)
  const idx = lignes.value.findIndex((l) => l.id === ligne.id)
  if (idx !== -1) lignes.value[idx] = { ...lignes.value[idx], quantite: qty }
  await updateLigneEnsemble(ligne.id, { quantite: qty })
}

const askDeleteLigne = (ligne) => {
  ligneToDelete.value = ligne
  showDeleteLigne.value = true
}

const confirmDeleteLigne = async () => {
  if (!ligneToDelete.value) return
  const ok = await deleteLigneEnsemble(ligneToDelete.value.id)
  if (ok) lignes.value = lignes.value.filter((l) => l.id !== ligneToDelete.value.id)
  showDeleteLigne.value = false
  ligneToDelete.value = null
}

// ─── Sous-ensembles ──────────────────────────────────────────────────────────
const handleAddSousEnsemble = async ({ ensemble }) => {
  if (!selectedEnsemble.value) return
  const item = await addSousEnsemble(selectedEnsemble.value.id, ensemble.id)
  if (item) sousEnsembles.value.push(item)
}

const handleUpdateSousEnsembleQty = async (item, value) => {
  const qty = value === '' || value == null ? 1 : Number(value)
  const idx = sousEnsembles.value.findIndex((s) => s.id === item.id)
  if (idx !== -1) sousEnsembles.value[idx] = { ...sousEnsembles.value[idx], quantite: qty }
  await updateSousEnsemble(item.id, { quantite: qty })
}

const askDeleteSousEnsemble = (item) => {
  sousEnsembleToDelete.value = item
  showDeleteSousEnsemble.value = true
}

const confirmDeleteSousEnsemble = async () => {
  if (!sousEnsembleToDelete.value) return
  const ok = await deleteSousEnsemble(sousEnsembleToDelete.value.id)
  if (ok) sousEnsembles.value = sousEnsembles.value.filter((s) => s.id !== sousEnsembleToDelete.value.id)
  showDeleteSousEnsemble.value = false
  sousEnsembleToDelete.value = null
}

// ─── Formatage ────────────────────────────────────────────────────────────────
const fmtPrix = (v) => {
  if (v == null) return '—'
  return Number(v).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}

const totalSousEnsemble = (item) => {
  const sous = (item.sous_ensemble?.ensembles_matieres_lignes ?? []).reduce(
    (acc, l) => acc + (l.catalogue_matieres?.prix_ud ?? 0) * (l.quantite || 0), 0
  )
  return sous * (item.quantite || 1)
}

const totalEstime = computed(() => {
  const arts = lignes.value.reduce((acc, l) => acc + (l.catalogue_matieres?.prix_ud ?? 0) * (l.quantite || 0), 0)
  const se = sousEnsembles.value.reduce((acc, s) => acc + totalSousEnsemble(s), 0)
  return arts + se
})

// ─── Chargement initial ───────────────────────────────────────────────────────
onMounted(async () => {
  loadingEnsembles.value = true
  ensembles.value = await getEnsembles()
  loadingEnsembles.value = false
})
</script>

<template>
  <div class="flex h-full flex-col overflow-hidden">
    <!-- Titre -->
    <div class="flex-none border-b border-gray-200 px-4 py-3 dark:border-gray-700">
      <AppTitleMain title="Ensembles matières" description="Gabarits d'articles réutilisables sur tous les chantiers" />
    </div>

    <div class="flex min-h-0 flex-1 overflow-hidden">

      <!-- ── Colonne gauche : liste des ensembles ───────────────────────────── -->
      <aside class="flex w-68 flex-none flex-col border-r border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/50">
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-gray-200 px-3 py-3 dark:border-gray-700">
          <span class="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
            Ensembles
            <span class="ml-1.5 inline-flex items-center justify-center rounded-full bg-gray-200 px-1.5 py-0.5 text-xs font-bold text-gray-500 dark:bg-gray-700 dark:text-gray-400">
              {{ ensembles.length }}
            </span>
          </span>
          <div class="flex items-center gap-1">
            <button
              type="button"
              class="flex h-7 cursor-pointer items-center gap-1 rounded-md border border-gray-200 bg-white px-2 text-xs font-medium text-gray-500 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-blue-700 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
              title="Importer un fichier xlsx"
              @click="showImport = true"
            >
              <Icon name="lucide:file-up" size="13" />
              Importer
            </button>
            <button
              type="button"
              class="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600 text-white transition hover:bg-blue-700 active:scale-95"
              title="Nouvel ensemble"
              @click="openCreateEnsemble"
            >
              <Icon name="lucide:plus" size="14" />
            </button>
          </div>
        </div>

        <!-- Loader -->
        <div v-if="loadingEnsembles" class="flex items-center justify-center py-10">
          <div class="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
        </div>

        <!-- Empty -->
        <div
          v-else-if="ensembles.length === 0"
          class="flex flex-col items-center gap-3 px-4 py-12 text-center"
        >
          <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
            <Icon name="lucide:layers" size="22" class="text-gray-400" />
          </div>
          <div class="space-y-1">
            <p class="text-sm font-medium text-gray-600 dark:text-gray-300">Aucun ensemble</p>
            <p class="text-xs text-gray-400">Créez votre premier gabarit</p>
          </div>
          <button
            type="button"
            class="mt-1 flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
            @click="openCreateEnsemble"
          >
            <Icon name="lucide:plus" size="12" />
            Nouvel ensemble
          </button>
        </div>

        <!-- Liste -->
        <ul v-else class="flex-1 overflow-y-auto space-y-0.5 p-2">
          <li
            v-for="ensemble in ensembles"
            :key="ensemble.id"
            class="group relative cursor-pointer rounded-lg px-3 py-2.5 transition-all"
            :class="
              selectedEnsemble?.id === ensemble.id
                ? 'bg-white shadow-sm ring-1 ring-blue-200 dark:bg-gray-800 dark:ring-blue-700/50'
                : 'hover:bg-white/80 dark:hover:bg-gray-800/60'
            "
            @click="selectEnsemble(ensemble)"
          >
            <span
              v-if="selectedEnsemble?.id === ensemble.id"
              class="absolute inset-y-0 left-0 w-0.5 rounded-l-lg bg-blue-500"
            />
            <div class="flex items-center justify-between gap-2">
              <div class="min-w-0 flex-1">
                <p
                  class="truncate text-sm font-medium leading-snug"
                  :class="
                    selectedEnsemble?.id === ensemble.id
                      ? 'text-blue-700 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-200'
                  "
                >
                  {{ ensemble.nom }}
                </p>
                <p v-if="ensemble.description" class="mt-0.5 truncate text-xs text-gray-400 dark:text-gray-500">
                  {{ ensemble.description }}
                </p>
                <p class="mt-0.5 text-xs text-gray-400">
                  {{ ensemble.nb_articles }} article{{ ensemble.nb_articles > 1 ? 's' : '' }}
                </p>
              </div>
              <div
                class="flex flex-none items-center gap-0.5 transition-opacity"
                :class="selectedEnsemble?.id === ensemble.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'"
                @click.stop
              >
                <button
                  type="button"
                  class="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                  title="Modifier"
                  @click="openEditEnsemble(ensemble)"
                >
                  <Icon name="lucide:pencil" size="12" />
                </button>
                <button
                  type="button"
                  class="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                  title="Supprimer"
                  @click="askDeleteEnsemble(ensemble)"
                >
                  <Icon name="lucide:trash-2" size="12" />
                </button>
              </div>
            </div>
          </li>
        </ul>
      </aside>

      <!-- ── Zone principale : détail de l'ensemble ─────────────────────────── -->
      <main class="flex min-w-0 flex-1 flex-col overflow-hidden">

        <!-- Aucun ensemble sélectionné -->
        <div
          v-if="!selectedEnsemble"
          class="flex h-full flex-col items-center justify-center gap-3 text-gray-400"
        >
          <Icon name="lucide:layers" size="48" class="opacity-30" />
          <p class="text-sm">Sélectionnez un ensemble ou créez-en un nouveau</p>
          <button
            type="button"
            class="mt-2 flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            @click="openCreateEnsemble"
          >
            <Icon name="lucide:plus" size="16" />
            Nouvel ensemble
          </button>
        </div>

        <template v-else>
          <!-- Header de l'ensemble -->
          <div class="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-900">
            <div>
              <h2 class="text-lg font-semibold text-gray-800 dark:text-white">{{ selectedEnsemble.nom }}</h2>
              <p v-if="selectedEnsemble.description" class="text-sm text-gray-400">{{ selectedEnsemble.description }}</p>
            </div>
            <div class="flex items-center gap-2">
              <!-- Total estimé -->
              <div class="hidden rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800 sm:block">
                <span class="text-gray-500 dark:text-gray-400">Total estimé : </span>
                <span class="font-semibold text-gray-800 dark:text-white">{{ fmtPrix(totalEstime) }}</span>
              </div>
              <!-- Actions -->
              <button
                type="button"
                class="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
                title="Modifier l'ensemble"
                @click="openEditEnsemble(selectedEnsemble)"
              >
                <Icon name="lucide:pencil" size="15" />
              </button>
              <button
                type="button"
                class="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                title="Supprimer l'ensemble"
                @click="askDeleteEnsemble(selectedEnsemble)"
              >
                <Icon name="lucide:trash-2" size="15" />
              </button>
              <!-- Bouton toggle catalogue -->
              <button
                type="button"
                :title="showCatalogue ? 'Fermer le catalogue' : 'Ajouter un article'"
                class="flex h-9 w-9 items-center justify-center rounded-lg border transition"
                :class="showCatalogue
                  ? 'border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:border-blue-700/50 dark:bg-blue-900/20 dark:text-blue-400'
                  : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'"
                @click="showCatalogue = !showCatalogue"
              >
                <Icon :name="showCatalogue ? 'lucide:panel-right-close' : 'lucide:plus'" size="16" />
              </button>
            </div>
          </div>

          <!-- Loader lignes -->
          <div v-if="loadingLignes" class="flex items-center justify-center py-16">
            <div class="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          </div>

          <!-- Contenu -->
          <div v-else class="flex min-h-0 flex-1 overflow-hidden">
            <div class="flex-1 overflow-auto">
              <!-- Empty -->
              <div
                v-if="itemsAffiches.length === 0"
                class="flex flex-col items-center gap-3 px-6 py-16 text-center text-gray-400"
              >
                <Icon name="lucide:package-open" size="48" class="opacity-30" />
                <p class="text-sm">Aucun contenu dans cet ensemble</p>
                <button
                  type="button"
                  class="mt-1 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                  @click="showCatalogue = true"
                >
                  <Icon name="lucide:package-search" size="16" />
                  Parcourir le catalogue
                </button>
              </div>

              <!-- Tableau -->
              <div v-else>
                <table class="w-full text-sm">
                  <thead class="sticky top-0 z-10">
                    <tr class="border-y border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/90">
                      <th class="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">N° Symbole</th>
                      <th class="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Désignation</th>
                      <th class="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">UD</th>
                      <th class="w-32 px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Quantité</th>
                      <th class="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Prix unit.</th>
                      <th class="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Total</th>
                      <th class="w-10 px-2 py-2.5"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <template v-for="(item, i) in itemsAffiches" :key="item.data.id">

                      <!-- Ligne article -->
                      <tr
                        v-if="item.type === 'article'"
                        class="group border-t border-gray-100 transition dark:border-gray-700/50"
                        :class="i % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/20'"
                      >
                        <td class="px-4 py-2.5">
                          <span class="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 font-mono text-xs font-semibold text-blue-700 ring-1 ring-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:ring-blue-800/40">
                            {{ item.data.numero_symbole }}
                          </span>
                        </td>
                        <td class="px-4 py-2.5">
                          <p class="text-xs font-medium text-gray-700 dark:text-gray-200">{{ item.data.catalogue_matieres?.description || '—' }}</p>
                          <p v-if="item.data.catalogue_matieres?.famille" class="mt-0.5 text-xs text-gray-400">{{ item.data.catalogue_matieres.famille }}</p>
                        </td>
                        <td class="px-4 py-2.5 text-center">
                          <span class="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                            {{ item.data.catalogue_matieres?.unite_distribution || '—' }}
                          </span>
                        </td>
                        <td class="px-4 py-2.5 text-center">
                          <input
                            type="number" min="0" step="any" :value="item.data.quantite"
                            class="w-24 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-center text-sm font-medium text-gray-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                            @change="handleUpdateQuantite(item.data, $event.target.value)"
                          />
                        </td>
                        <td class="whitespace-nowrap px-4 py-2.5 text-right text-xs text-gray-500 dark:text-gray-400">{{ fmtPrix(item.data.catalogue_matieres?.prix_ud) }}</td>
                        <td class="whitespace-nowrap px-4 py-2.5 text-right">
                          <span class="text-sm font-semibold text-gray-800 dark:text-gray-100">
                            {{ fmtPrix((item.data.catalogue_matieres?.prix_ud ?? 0) * (item.data.quantite || 0)) }}
                          </span>
                        </td>
                        <td class="px-2 py-2.5 text-center">
                          <button type="button"
                            class="rounded-md p-1.5 text-gray-300 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:text-gray-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                            title="Retirer l'article" @click="askDeleteLigne(item.data)">
                            <Icon name="lucide:trash-2" size="13" />
                          </button>
                        </td>
                      </tr>

                      <!-- Ligne sous-ensemble -->
                      <template v-else>
                        <tr
                          class="group border-t border-gray-200 bg-indigo-50/60 dark:border-gray-600 dark:bg-indigo-900/10"
                        >
                          <td colspan="3" class="px-4 py-2.5">
                            <div class="flex items-center gap-2">
                              <button
                                type="button"
                                class="flex h-5 w-5 flex-none items-center justify-center rounded text-indigo-400 transition hover:bg-indigo-100 dark:hover:bg-indigo-800/40"
                                @click="toggleSousEnsemble(item.data.id)"
                              >
                                <Icon
                                  :name="openSousEnsembles.has(item.data.id) ? 'lucide:chevron-down' : 'lucide:chevron-right'"
                                  size="13"
                                />
                              </button>
                              <Icon name="lucide:layers" size="14" class="flex-none text-indigo-500 dark:text-indigo-400" />
                              <span class="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                                {{ item.data.sous_ensemble?.nom }}
                              </span>
                              <span class="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                                {{ item.data.sous_ensemble?.ensembles_matieres_lignes?.length ?? 0 }} art.
                              </span>
                              <p v-if="item.data.sous_ensemble?.description" class="truncate text-xs text-indigo-400">
                                {{ item.data.sous_ensemble.description }}
                              </p>
                            </div>
                          </td>
                          <td class="px-4 py-2.5 text-center">
                            <input
                              type="number" min="1" step="1" :value="item.data.quantite ?? 1"
                              class="w-24 rounded-lg border border-indigo-200 bg-white px-2 py-1.5 text-center text-sm font-medium text-indigo-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-indigo-700/50 dark:bg-gray-800 dark:text-indigo-300"
                              @change="handleUpdateSousEnsembleQty(item.data, $event.target.value)"
                            />
                          </td>
                          <td class="px-4 py-2.5"></td>
                          <td class="whitespace-nowrap px-4 py-2.5 text-right">
                            <span class="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                              {{ fmtPrix(totalSousEnsemble(item.data)) }}
                            </span>
                          </td>
                          <td class="px-2 py-2.5 text-center">
                            <button type="button"
                              class="rounded-md p-1.5 text-gray-300 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:text-gray-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                              title="Retirer le sous-ensemble" @click="askDeleteSousEnsemble(item.data)">
                              <Icon name="lucide:trash-2" size="13" />
                            </button>
                          </td>
                        </tr>

                        <!-- Articles du sous-ensemble (dépliables) -->
                        <tr
                          v-for="sousligne in openSousEnsembles.has(item.data.id) ? (item.data.sous_ensemble?.ensembles_matieres_lignes ?? []) : []"
                          :key="'se-art-' + sousligne.id"
                          class="border-t border-indigo-50 bg-indigo-50/20 dark:border-indigo-900/20 dark:bg-indigo-900/5"
                        >
                          <td class="py-2 pl-10 pr-4">
                            <span class="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 font-mono text-xs font-semibold text-indigo-600 ring-1 ring-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-300 dark:ring-indigo-800/40">
                              {{ sousligne.numero_symbole }}
                            </span>
                          </td>
                          <td class="px-4 py-2">
                            <p class="text-xs font-medium text-gray-700 dark:text-gray-200">{{ sousligne.catalogue_matieres?.description || '—' }}</p>
                            <p v-if="sousligne.catalogue_matieres?.famille" class="mt-0.5 text-xs text-gray-400">{{ sousligne.catalogue_matieres.famille }}</p>
                          </td>
                          <td class="px-4 py-2 text-center">
                            <span class="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                              {{ sousligne.catalogue_matieres?.unite_distribution || '—' }}
                            </span>
                          </td>
                          <td class="px-4 py-2 text-center text-xs text-gray-500 dark:text-gray-400">{{ sousligne.quantite }}</td>
                          <td class="whitespace-nowrap px-4 py-2 text-right text-xs text-gray-500 dark:text-gray-400">{{ fmtPrix(sousligne.catalogue_matieres?.prix_ud) }}</td>
                          <td class="whitespace-nowrap px-4 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300">
                            {{ fmtPrix((sousligne.catalogue_matieres?.prix_ud ?? 0) * (sousligne.quantite || 0)) }}
                          </td>
                          <td></td>
                        </tr>
                      </template>

                    </template>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Catalogue sidebar -->
            <Transition name="catalogue-panel">
              <CommandesMatieresCatalogueSidebar
                v-if="showCatalogue"
                :existing-symboles="existingSymboles"
                :existing-ensemble-ids="existingEnsembleIds"
                :exclude-id="selectedEnsemble?.id"
                @add="handleAddArticle"
                @add-ensemble="handleAddSousEnsemble"
              />
            </Transition>
          </div>
        </template>
      </main>
    </div>

    <!-- ── Modal : créer / modifier un ensemble ──────────────────────────────── -->
    <AppModal v-model="showFormEnsemble" size="md">
      <template #header>
        <h3 class="text-base font-semibold text-gray-800 dark:text-white">
          {{ editingEnsemble ? 'Modifier l\'ensemble' : 'Nouvel ensemble' }}
        </h3>
      </template>
      <form class="space-y-4" @submit.prevent="submitEnsemble">
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Nom *</label>
          <input
            v-model="formNom"
            type="text"
            placeholder="Ex : Kit RVB Voie Courante"
            required
            class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
          <textarea
            v-model="formDescription"
            rows="3"
            placeholder="Description optionnelle…"
            class="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          ></textarea>
        </div>
      </form>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button
            type="button"
            class="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            @click="showFormEnsemble = false"
          >Annuler</button>
          <button
            type="button"
            :disabled="!formNom.trim() || savingEnsemble"
            class="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
            @click="submitEnsemble"
          >
            <div v-if="savingEnsemble" class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            {{ editingEnsemble ? 'Enregistrer' : 'Créer l\'ensemble' }}
          </button>
        </div>
      </template>
    </AppModal>

    <!-- ── Modal : confirmer suppression ensemble ────────────────────────────── -->
    <AppModal v-model="showDeleteEnsemble" size="sm">
      <template #header>
        <h3 class="text-base font-semibold text-gray-800 dark:text-white">Supprimer l'ensemble</h3>
      </template>
      <p class="text-sm text-gray-600 dark:text-gray-300">
        Êtes-vous sûr de vouloir supprimer <strong>« {{ ensembleToDelete?.nom }} »</strong> et tous ses articles ? Cette action est irréversible.
      </p>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button
            type="button"
            class="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            @click="showDeleteEnsemble = false"
          >Annuler</button>
          <button
            type="button"
            class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            @click="confirmDeleteEnsemble"
          >Supprimer</button>
        </div>
      </template>
    </AppModal>

    <!-- ── Modal : confirmer suppression article ─────────────────────────────── -->
    <AppModal v-model="showDeleteLigne" size="sm">
      <template #header>
        <h3 class="text-base font-semibold text-gray-800 dark:text-white">Retirer l'article</h3>
      </template>
      <p class="text-sm text-gray-600 dark:text-gray-300">
        Retirer l'article <strong class="font-mono">{{ ligneToDelete?.numero_symbole }}</strong> de cet ensemble ?
      </p>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button
            type="button"
            class="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            @click="showDeleteLigne = false"
          >Annuler</button>
          <button
            type="button"
            class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            @click="confirmDeleteLigne"
          >Retirer</button>
        </div>
      </template>
    </AppModal>

    <!-- ── Modal : import xlsx ──────────────────────────────────────────────── -->
    <EnsemblesMatieresImportModal
      :open="showImport"
      @close="showImport = false"
      @imported="handleImported" />

    <!-- ── Modal : confirmer suppression sous-ensemble ───────────────────────── -->
    <AppModal v-model="showDeleteSousEnsemble" size="sm">
      <template #header>
        <h3 class="text-base font-semibold text-gray-800 dark:text-white">Retirer le sous-ensemble</h3>
      </template>
      <p class="text-sm text-gray-600 dark:text-gray-300">
        Retirer <strong>« {{ sousEnsembleToDelete?.sous_ensemble?.nom }} »</strong> de cet ensemble ?
      </p>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button
            type="button"
            class="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            @click="showDeleteSousEnsemble = false"
          >Annuler</button>
          <button
            type="button"
            class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            @click="confirmDeleteSousEnsemble"
          >Retirer</button>
        </div>
      </template>
    </AppModal>
  </div>
</template>

<style scoped>
.catalogue-panel-enter-active,
.catalogue-panel-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}
.catalogue-panel-enter-from,
.catalogue-panel-leave-to {
  width: 0;
  opacity: 0;
}
.catalogue-panel-enter-to,
.catalogue-panel-leave-from {
  width: 20rem;
  opacity: 1;
}
</style>
