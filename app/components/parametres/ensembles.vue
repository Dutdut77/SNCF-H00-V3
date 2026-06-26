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
  countArticlesRecursive,
  prixTotalRecursive,
} = useEnsemblesMatieres()
const { METIERS } = useMetier()

const client = useSupabaseClient()

// ─── Métier actif (le SuperAdmin gère les 3 métiers via des onglets) ──────────
const activeMetier = ref(METIERS[0].code)

// ─── État global ─────────────────────────────────────────────────────────────
const ensembles = ref([])
const loadingEnsembles = ref(false)
const selectedEnsemble = ref(null)
const lignes = ref([])         // articles directs (racine)
const sousEnsembles = ref([])  // sous-ensembles (arbre complet)
const loadingLignes = ref(false)

// ─── Recherche + tri alphabétique de la liste ───────────────────────────────
const search = ref('')
const ensemblesAffiches = computed(() => {
  const q = search.value.trim().toLowerCase()
  const list = q
    ? ensembles.value.filter((e) =>
        (e.nom || '').toLowerCase().includes(q) ||
        (e.description || '').toLowerCase().includes(q))
    : ensembles.value
  return [...list].sort((a, b) => (a.nom || '').localeCompare(b.nom || '', 'fr', { sensitivity: 'base' }))
})

// Référentiel UD (pour prix unitaire par unité individuelle)
const udMap = ref(new Map())
const loadUdMap = async () => {
  if (udMap.value.size > 0) return
  const { data } = await client.from('catalogue_unites_distribution').select('code, designation, quantite_par_unite')
  if (data) udMap.value = new Map(data.map((r) => [r.code, r]))
}

// Nœud cible pour l'ajout : par défaut la racine, mais peut être un sous-ensemble à n'importe quelle profondeur.
const addTargetId = ref(null)
const setAddTarget = (id) => {
  addTargetId.value = id
  showCatalogue.value = true
}

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
  if (!editingEnsemble.value) payload.metier = activeMetier.value

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
  addTargetId.value = ensemble.id
  showCatalogue.value = false
  loadingLignes.value = true
  ;[lignes.value, sousEnsembles.value] = await Promise.all([
    getLignesEnsemble(ensemble.id),
    getSousEnsembles(ensemble.id),
  ])
  loadingLignes.value = false
}

// Recharge uniquement les lignes et sous-ensembles du ensemble sélectionné (pas la sidebar).
const reloadDetails = async () => {
  if (!selectedEnsemble.value) return
  ;[lignes.value, sousEnsembles.value] = await Promise.all([
    getLignesEnsemble(selectedEnsemble.value.id),
    getSousEnsembles(selectedEnsemble.value.id),
  ])
  syncNbArticles()
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

// ─── Sync nb_articles dans la sidebar ────────────────────────────────────────
const syncNbArticles = () => {
  const idx = ensembles.value.findIndex((e) => e.id === selectedEnsemble.value?.id)
  if (idx === -1) return
  const rootTree = {
    id: selectedEnsemble.value.id,
    ensembles_matieres_lignes: lignes.value,
    ensembles_matieres_sous_ensembles: sousEnsembles.value,
  }
  ensembles.value[idx] = { ...ensembles.value[idx], nb_articles: countArticlesRecursive(rootTree) }
}

// ─── Recherche d'un nœud par ensemble_id dans l'arbre ────────────────────────
// Utilisé pour connaître le scope (articles/SE déjà présents) du nœud ciblé par un ajout.
const findNodeByEnsembleId = (id) => {
  if (!selectedEnsemble.value || !id) return null
  if (id === selectedEnsemble.value.id) {
    return {
      id: selectedEnsemble.value.id,
      ensembles_matieres_lignes: lignes.value,
      ensembles_matieres_sous_ensembles: sousEnsembles.value,
    }
  }
  const walk = (nodes, visited = new Set()) => {
    for (const n of nodes) {
      const se = n.sous_ensemble
      if (!se || visited.has(se.id)) continue
      if (se.id === id) return se
      const next = new Set(visited); next.add(se.id)
      const found = walk(se.ensembles_matieres_sous_ensembles ?? [], next)
      if (found) return found
    }
    return null
  }
  return walk(sousEnsembles.value)
}

// ─── Articles directs et sous-ensembles du nœud cible pour l'ajout ──────────
const activeNode = computed(() => findNodeByEnsembleId(addTargetId.value))
const existingSymboles = computed(() =>
  (activeNode.value?.ensembles_matieres_lignes ?? []).map((l) => l.numero_symbole),
)
const existingEnsembleIds = computed(() => {
  const direct = (activeNode.value?.ensembles_matieres_sous_ensembles ?? [])
    .map((s) => s.sous_ensemble_id ?? s.sous_ensemble?.id)
    .filter(Boolean)
  return [addTargetId.value, ...direct].filter(Boolean)
})

// Mutation ciblée d'un article dans l'arbre (mise à jour locale, évite un reload)
const patchLigneInTree = (ligneId, patch) => {
  const topIdx = lignes.value.findIndex((l) => l.id === ligneId)
  if (topIdx !== -1) {
    lignes.value[topIdx] = { ...lignes.value[topIdx], ...patch }
    return true
  }
  const walk = (node) => {
    if (!node) return false
    const lns = node.ensembles_matieres_lignes ?? []
    const idx = lns.findIndex((l) => l.id === ligneId)
    if (idx !== -1) {
      lns[idx] = { ...lns[idx], ...patch }
      return true
    }
    for (const s of node.ensembles_matieres_sous_ensembles ?? []) {
      if (walk(s.sous_ensemble)) return true
    }
    return false
  }
  for (const s of sousEnsembles.value) {
    if (walk(s.sous_ensemble)) return true
  }
  return false
}

// Mutation ciblée d'un sous-ensemble (quantité) dans l'arbre
const patchSousEnsembleInTree = (seRowId, patch) => {
  const topIdx = sousEnsembles.value.findIndex((s) => s.id === seRowId)
  if (topIdx !== -1) {
    sousEnsembles.value[topIdx] = { ...sousEnsembles.value[topIdx], ...patch }
    return true
  }
  const walk = (node) => {
    if (!node) return false
    const list = node.ensembles_matieres_sous_ensembles ?? []
    const idx = list.findIndex((s) => s.id === seRowId)
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...patch }
      return true
    }
    for (const s of list) {
      if (walk(s.sous_ensemble)) return true
    }
    return false
  }
  for (const s of sousEnsembles.value) {
    if (walk(s.sous_ensemble)) return true
  }
  return false
}

// ─── Handlers : articles ─────────────────────────────────────────────────────
const handleAddArticle = async ({ article, quantite }) => {
  if (!addTargetId.value) return
  const ligne = await addLigneEnsemble(addTargetId.value, article.numero_symbole, quantite)
  if (ligne) await reloadDetails()
}

const handleUpdateQuantite = async (ligne, value) => {
  const qty = value === '' || value == null ? 0 : Number(value)
  patchLigneInTree(ligne.id, { quantite: qty })
  await updateLigneEnsemble(ligne.id, { quantite: qty })
}

const handleUpdateNotes = async (ligne, value) => {
  patchLigneInTree(ligne.id, { notes: value })
  await updateLigneEnsemble(ligne.id, { notes: value })
}

const askDeleteLigne = (ligne) => {
  ligneToDelete.value = ligne
  showDeleteLigne.value = true
}

const confirmDeleteLigne = async () => {
  if (!ligneToDelete.value) return
  const ok = await deleteLigneEnsemble(ligneToDelete.value.id)
  if (ok) await reloadDetails()
  showDeleteLigne.value = false
  ligneToDelete.value = null
}

// ─── Handlers : sous-ensembles ───────────────────────────────────────────────
const handleAddSousEnsemble = async ({ ensemble }) => {
  if (!addTargetId.value) return
  const item = await addSousEnsemble(addTargetId.value, ensemble.id)
  if (item) await reloadDetails()
}

const handleUpdateSousEnsembleQty = async (item, value) => {
  const qty = value === '' || value == null ? 1 : Number(value)
  patchSousEnsembleInTree(item.id, { quantite: qty })
  await updateSousEnsemble(item.id, { quantite: qty })
}

const askDeleteSousEnsemble = (item) => {
  sousEnsembleToDelete.value = item
  showDeleteSousEnsemble.value = true
}

const confirmDeleteSousEnsemble = async () => {
  if (!sousEnsembleToDelete.value) return
  const ok = await deleteSousEnsemble(sousEnsembleToDelete.value.id)
  if (ok) await reloadDetails()
  showDeleteSousEnsemble.value = false
  sousEnsembleToDelete.value = null
}

// ─── Formatage ────────────────────────────────────────────────────────────────
const fmtPrix = (v) => {
  if (v == null) return '—'
  return Number(v).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}

const totalEstime = computed(() => {
  const rootTree = {
    id: selectedEnsemble.value?.id,
    ensembles_matieres_lignes: lignes.value,
    ensembles_matieres_sous_ensembles: sousEnsembles.value,
  }
  return prixTotalRecursive(rootTree, udMap.value)
})

// ─── Chargement de la liste pour le métier actif ──────────────────────────────
const loadEnsembles = async () => {
  loadingEnsembles.value = true
  ensembles.value = await getEnsembles(activeMetier.value)
  loadingEnsembles.value = false
}

// Changement de métier : on recharge la liste et on réinitialise la sélection.
watch(activeMetier, async () => {
  selectedEnsemble.value = null
  lignes.value = []
  sousEnsembles.value = []
  showCatalogue.value = false
  search.value = ''
  await loadEnsembles()
})

// ─── Chargement initial ───────────────────────────────────────────────────────
onMounted(async () => {
  await loadUdMap()
  await loadEnsembles()
})
</script>

<template>
  <div class="flex h-full flex-col overflow-hidden">
    <!-- Titre -->
    <div class="flex-none border-b border-slate-200 px-4 py-3 dark:border-slate-700">
      <AppTitleMain title="Ensembles matières" description="Gabarits d'articles réutilisables sur tous les chantiers" />
    </div>

    <div class="flex min-h-0 flex-1 overflow-hidden">

      <!-- ── Colonne gauche : liste des ensembles ───────────────────────────── -->
      <aside class="flex w-68 flex-none flex-col border-r border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50">
        <!-- Sélecteur de métier -->
        <div class="flex-none border-b border-slate-200 p-2 dark:border-slate-700">
          <div class="flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
            <button
              v-for="m in METIERS"
              :key="m.code"
              type="button"
              class="flex-1 rounded-md px-2 py-1.5 text-xs font-semibold transition"
              :class="activeMetier === m.code
                ? 'bg-white text-secondary-600 shadow-sm dark:bg-slate-700 dark:text-secondary-400'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'"
              @click="activeMetier = m.code"
            >
              {{ m.label }}
            </button>
          </div>
        </div>

        <!-- Header -->
        <div class="flex items-center justify-between border-b border-slate-200 px-3 py-3 dark:border-slate-700">
          <span class="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Ensembles
            <span class="ml-1.5 inline-flex items-center justify-center rounded-full bg-slate-200 px-1.5 py-0.5 text-xs font-bold text-slate-500 dark:bg-slate-700 dark:text-slate-400">
              {{ ensembles.length }}
            </span>
          </span>
          <div class="flex items-center gap-1">
            <button
              type="button"
              class="flex h-7 cursor-pointer items-center gap-1 rounded-md border border-slate-200 bg-white px-2 text-xs font-medium text-slate-500 transition hover:border-secondary-300 hover:bg-secondary-50 hover:text-secondary-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-secondary-700 dark:hover:bg-secondary-900/20 dark:hover:text-secondary-400"
              title="Importer un fichier xlsx"
              @click="showImport = true"
            >
              <Icon name="lucide:file-up" size="13" />
              Importer
            </button>
            <button
              type="button"
              class="flex h-7 w-7 items-center justify-center rounded-md bg-secondary-600 text-white transition hover:bg-secondary-700 active:scale-95"
              title="Nouvel ensemble"
              @click="openCreateEnsemble"
            >
              <Icon name="lucide:plus" size="14" />
            </button>
          </div>
        </div>

        <!-- Recherche -->
        <div v-if="!loadingEnsembles && ensembles.length > 0" class="flex-none border-b border-slate-200 px-2.5 py-2 dark:border-slate-700">
          <div class="relative">
            <Icon name="lucide:search" size="13" class="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              v-model="search"
              type="text"
              placeholder="Rechercher un ensemble…"
              class="w-full rounded-md border border-slate-200 bg-white py-1.5 pl-8 pr-2 text-sm text-slate-700 outline-none transition focus:border-secondary-300 focus:ring-1 focus:ring-secondary-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:placeholder-slate-500"
            />
          </div>
        </div>

        <!-- Loader -->
        <div v-if="loadingEnsembles" class="flex items-center justify-center py-10">
          <div class="h-5 w-5 animate-spin rounded-full border-2 border-secondary-500 border-t-transparent"></div>
        </div>

        <!-- Empty -->
        <div
          v-else-if="ensembles.length === 0"
          class="flex flex-col items-center gap-3 px-4 py-12 text-center"
        >
          <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
            <Icon name="lucide:layers" size="22" class="text-slate-400" />
          </div>
          <div class="space-y-1">
            <p class="text-sm font-medium text-slate-600 dark:text-slate-300">Aucun ensemble</p>
            <p class="text-xs text-slate-400">Créez votre premier gabarit</p>
          </div>
          <button
            type="button"
            class="mt-1 flex items-center gap-1.5 rounded-lg bg-secondary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-secondary-700"
            @click="openCreateEnsemble"
          >
            <Icon name="lucide:plus" size="12" />
            Nouvel ensemble
          </button>
        </div>

        <!-- Empty filtré -->
        <div v-else-if="ensemblesAffiches.length === 0" class="flex flex-col items-center gap-2 px-4 py-12 text-center">
          <Icon name="lucide:search-x" size="22" class="text-slate-300" />
          <p class="text-sm text-slate-400">Aucun résultat</p>
        </div>

        <!-- Liste -->
        <ul v-else class="flex-1 overflow-y-auto space-y-0.5 p-2">
          <li
            v-for="ensemble in ensemblesAffiches"
            :key="ensemble.id"
            class="group relative cursor-pointer rounded-lg px-3 py-2.5 transition-all"
            :class="
              selectedEnsemble?.id === ensemble.id
                ? 'bg-white shadow-sm ring-1 ring-secondary-200 dark:bg-slate-800 dark:ring-secondary-700/50'
                : 'hover:bg-white/80 dark:hover:bg-slate-800/60'
            "
            @click="selectEnsemble(ensemble)"
          >
            <span
              v-if="selectedEnsemble?.id === ensemble.id"
              class="absolute inset-y-0 left-0 w-0.5 rounded-l-lg bg-secondary-500"
            />
            <div class="flex items-center justify-between gap-2">
              <div class="min-w-0 flex-1">
                <p
                  class="truncate text-sm font-medium leading-snug"
                  :class="
                    selectedEnsemble?.id === ensemble.id
                      ? 'text-secondary-700 dark:text-secondary-300'
                      : 'text-slate-700 dark:text-slate-200'
                  "
                >
                  {{ ensemble.nom }}
                </p>
                <p v-if="ensemble.description" class="mt-0.5 truncate text-xs text-slate-400 dark:text-slate-500">
                  {{ ensemble.description }}
                </p>
                <p class="mt-0.5 text-xs text-slate-400">
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
                  class="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                  title="Modifier"
                  @click="openEditEnsemble(ensemble)"
                >
                  <Icon name="lucide:pencil" size="12" />
                </button>
                <button
                  type="button"
                  class="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
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
          class="flex h-full flex-col items-center justify-center gap-3 text-slate-400"
        >
          <Icon name="lucide:layers" size="48" class="opacity-30" />
          <p class="text-sm">Sélectionnez un ensemble ou créez-en un nouveau</p>
          <button
            type="button"
            class="mt-2 flex items-center gap-2 rounded-lg bg-secondary-600 px-4 py-2 text-sm font-medium text-white hover:bg-secondary-700"
            @click="openCreateEnsemble"
          >
            <Icon name="lucide:plus" size="16" />
            Nouvel ensemble
          </button>
        </div>

        <template v-else>
          <!-- Header de l'ensemble -->
          <div class="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-700 dark:bg-slate-900">
            <div>
              <h2 class="text-lg font-semibold text-slate-800 dark:text-white">{{ selectedEnsemble.nom }}</h2>
              <p v-if="selectedEnsemble.description" class="text-sm text-slate-400">{{ selectedEnsemble.description }}</p>
            </div>
            <div class="flex items-center gap-2">
              <!-- Total estimé -->
              <div class="hidden rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800 sm:block">
                <span class="text-slate-500 dark:text-slate-400">Total estimé : </span>
                <span class="font-semibold text-slate-800 dark:text-white">{{ fmtPrix(totalEstime) }}</span>
              </div>
              <!-- Actions -->
              <button
                type="button"
                class="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
                title="Modifier l'ensemble"
                @click="openEditEnsemble(selectedEnsemble)"
              >
                <Icon name="lucide:pencil" size="15" />
              </button>
              <button
                type="button"
                class="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
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
                  ? 'border-secondary-200 bg-secondary-50 text-secondary-600 hover:bg-secondary-100 dark:border-secondary-700/50 dark:bg-secondary-900/20 dark:text-secondary-400'
                  : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'"
                @click="addTargetId = selectedEnsemble.id; showCatalogue = !showCatalogue"
              >
                <Icon :name="showCatalogue ? 'lucide:panel-right-close' : 'lucide:plus'" size="16" />
              </button>
            </div>
          </div>

          <!-- Loader lignes -->
          <div v-if="loadingLignes" class="flex items-center justify-center py-16">
            <div class="h-8 w-8 animate-spin rounded-full border-4 border-secondary-500 border-t-transparent"></div>
          </div>

          <!-- Contenu -->
          <div v-else class="flex min-h-0 flex-1 overflow-hidden">
            <div class="flex-1 overflow-auto">
              <!-- Empty -->
              <div
                v-if="lignes.length === 0 && sousEnsembles.length === 0"
                class="flex flex-col items-center gap-3 px-6 py-16 text-center text-slate-400"
              >
                <Icon name="lucide:package-open" size="48" class="opacity-30" />
                <p class="text-sm">Aucun contenu dans cet ensemble</p>
                <button
                  type="button"
                  class="mt-1 flex items-center gap-2 rounded-lg border border-secondary-200 bg-secondary-50 px-4 py-2 text-sm font-medium text-secondary-600 hover:bg-secondary-100 dark:border-secondary-800 dark:bg-secondary-900/20 dark:text-secondary-400"
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
                    <tr class="border-y border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/90">
                      <th class="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">N° Symbole</th>
                      <th class="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Désignation</th>
                      <th class="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">UD</th>
                      <th class="w-32 px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Quantité</th>
                      <th class="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Prix unit.</th>
                      <th class="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Total</th>
                      <th class="w-10 px-2 py-2.5"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <EnsemblesMatieresTableBody
                      :key="selectedEnsemble.id"
                      :lignes="lignes"
                      :sous-ensembles="sousEnsembles"
                      :ud-map="udMap"
                      :on-add-to="setAddTarget"
                      @update-quantite-ligne="handleUpdateQuantite"
                      @update-notes-ligne="handleUpdateNotes"
                      @delete-ligne="askDeleteLigne"
                      @update-quantite-se="handleUpdateSousEnsembleQty"
                      @delete-se="askDeleteSousEnsemble"
                    />
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
                :exclude-id="addTargetId"
                :metier="activeMetier"
                :target-label="addTargetId && addTargetId !== selectedEnsemble.id ? activeNode?.nom : null"
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
        <h3 class="text-base font-semibold text-slate-800 dark:text-white">
          {{ editingEnsemble ? 'Modifier l\'ensemble' : 'Nouvel ensemble' }}
        </h3>
      </template>
      <form class="space-y-4" @submit.prevent="submitEnsemble">
        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Nom *</label>
          <input
            v-model="formNom"
            type="text"
            placeholder="Ex : Kit RVB Voie Courante"
            required
            class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-secondary-400 focus:ring-2 focus:ring-secondary-100 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
          />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
          <textarea
            v-model="formDescription"
            rows="3"
            placeholder="Description optionnelle…"
            class="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-secondary-400 focus:ring-2 focus:ring-secondary-100 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
          ></textarea>
        </div>
      </form>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button
            type="button"
            class="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
            @click="showFormEnsemble = false"
          >Annuler</button>
          <button
            type="button"
            :disabled="!formNom.trim() || savingEnsemble"
            class="flex items-center gap-2 rounded-lg bg-secondary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-secondary-700 disabled:opacity-50"
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
        <h3 class="text-base font-semibold text-slate-800 dark:text-white">Supprimer l'ensemble</h3>
      </template>
      <p class="text-sm text-slate-600 dark:text-slate-300">
        Êtes-vous sûr de vouloir supprimer <strong>« {{ ensembleToDelete?.nom }} »</strong> et tous ses articles ? Cette action est irréversible.
      </p>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button
            type="button"
            class="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
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
        <h3 class="text-base font-semibold text-slate-800 dark:text-white">Retirer l'article</h3>
      </template>
      <p class="text-sm text-slate-600 dark:text-slate-300">
        Retirer l'article <strong class="font-mono">{{ ligneToDelete?.numero_symbole }}</strong> de cet ensemble ?
      </p>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button
            type="button"
            class="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
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
      :metier="activeMetier"
      @close="showImport = false"
      @imported="handleImported" />

    <!-- ── Modal : confirmer suppression sous-ensemble ───────────────────────── -->
    <AppModal v-model="showDeleteSousEnsemble" size="sm">
      <template #header>
        <h3 class="text-base font-semibold text-slate-800 dark:text-white">Retirer le sous-ensemble</h3>
      </template>
      <p class="text-sm text-slate-600 dark:text-slate-300">
        Retirer <strong>« {{ sousEnsembleToDelete?.sous_ensemble?.nom }} »</strong> de cet ensemble ?
      </p>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button
            type="button"
            class="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
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
