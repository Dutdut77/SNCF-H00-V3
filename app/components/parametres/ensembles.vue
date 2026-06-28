<script setup>
const {
  getEnsembles,
  createEnsemble,
  updateEnsemble,
  deleteEnsemble,
  getCategories,
  createCategorie,
  updateCategorie,
  deleteCategorie,
  setEnsembleCategorie,
  categoriePalette,
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
const { addToast } = useToast()

const props = defineProps({
  metier: { type: String, required: true },
})

const client = useSupabaseClient()

// ─── Métier actif (déterminé par l'entrée de menu sélectionnée) ───────────────
const activeMetier = computed(() => props.metier)

// ─── État global ─────────────────────────────────────────────────────────────
const ensembles = ref([])
const categories = ref([])
const loadingEnsembles = ref(false)
const selectedEnsemble = ref(null)
const lignes = ref([])         // articles directs (racine)
const sousEnsembles = ref([])  // sous-ensembles (arbre complet)
const loadingLignes = ref(false)

// ─── Regroupement des ensembles par catégorie ────────────────────────────────
const UNCAT = '__none__'
const ensemblesByCategorie = computed(() => {
  const map = new Map()
  for (const e of ensembles.value) {
    const key = e.categorie_id || UNCAT
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(e)
  }
  return map
})
const groupOf = (key) => ensemblesByCategorie.value.get(key) ?? []
const uncategorized = computed(() => groupOf(UNCAT))
const paletteFor = (index) => categoriePalette(index)
const categorieOptions = computed(() => categories.value.map((c) => ({ id: c.id, label: c.nom })))
const categorieNom = (id) => categories.value.find((c) => c.id === id)?.nom ?? null

// ─── Recherche globale de la galerie ─────────────────────────────────────────
// Les ensembles sont listés directement dans les cartes ; la recherche filtre
// le contenu de chaque carte (et masque les cartes sans résultat).
const search = ref('')
const filterList = (list) => {
  const q = search.value.trim().toLowerCase()
  const filtered = q
    ? list.filter((e) =>
        (e.nom || '').toLowerCase().includes(q) ||
        (e.description || '').toLowerCase().includes(q))
    : list
  return [...filtered].sort((a, b) => (a.nom || '').localeCompare(b.nom || '', 'fr', { sensitivity: 'base' }))
}
// Liste filtrée + triée d'une catégorie (clé = id ou UNCAT).
const visibleEnsembles = (key) => filterList(groupOf(key))
const hasSearch = computed(() => search.value.trim().length > 0)

// ─── Fil d'Ariane (vue éditeur) ──────────────────────────────────────────────
const selectedCategorieNom = computed(() =>
  selectedEnsemble.value ? (categorieNom(selectedEnsemble.value.categorie_id) ?? 'Sans catégorie') : null,
)
const backToGallery = () => {
  selectedEnsemble.value = null
  lignes.value = []
  sousEnsembles.value = []
  showCatalogue.value = false
}

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

// Catégories
const showFormCategorie = ref(false)
const editingCategorie = ref(null)
const formCategorieNom = ref('')
const savingCategorie = ref(false)
const showDeleteCategorie = ref(false)
const categorieToDelete = ref(null)
const deleteCategorieCount = computed(() =>
  categorieToDelete.value ? groupOf(categorieToDelete.value.id).length : 0,
)

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
const formCategorie = ref(null)
const savingEnsemble = ref(false)

const openCreateEnsemble = (categorieId = null) => {
  editingEnsemble.value = null
  formNom.value = ''
  formDescription.value = ''
  formCategorie.value = categorieId || null
  showFormEnsemble.value = true
}

const openEditEnsemble = (ensemble) => {
  editingEnsemble.value = ensemble
  formNom.value = ensemble.nom
  formDescription.value = ensemble.description || ''
  formCategorie.value = ensemble.categorie_id || null
  showFormEnsemble.value = true
}

const submitEnsemble = async () => {
  if (!formNom.value.trim()) return
  savingEnsemble.value = true
  const payload = {
    nom: formNom.value.trim(),
    description: formDescription.value.trim(),
    categorie_id: formCategorie.value || null,
  }
  if (!editingEnsemble.value) payload.metier = activeMetier.value

  if (editingEnsemble.value) {
    const updated = await updateEnsemble(editingEnsemble.value.id, payload)
    if (updated) {
      const idx = ensembles.value.findIndex((e) => e.id === updated.id)
      if (idx !== -1) ensembles.value[idx] = { ...ensembles.value[idx], ...updated }
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

// ─── Déplacement rapide d'un ensemble vers une autre catégorie ────────────────
const quickMove = async (ensemble, categorieId) => {
  if ((ensemble.categorie_id || null) === (categorieId || null)) return
  const ok = await setEnsembleCategorie(ensemble.id, categorieId || null)
  if (!ok) return
  const idx = ensembles.value.findIndex((e) => e.id === ensemble.id)
  if (idx !== -1) ensembles.value[idx] = { ...ensembles.value[idx], categorie_id: categorieId || null }
  if (selectedEnsemble.value?.id === ensemble.id) selectedEnsemble.value = ensembles.value[idx]
  addToast({
    title: 'Ensemble déplacé',
    message: categorieId ? `Vers « ${categorieNom(categorieId)} »` : 'Sans catégorie',
    type: 'Success',
  })
}

// ─── Catégories : créer / renommer / supprimer ───────────────────────────────
const openCreateCategorie = () => {
  editingCategorie.value = null
  formCategorieNom.value = ''
  showFormCategorie.value = true
}

const openEditCategorie = (categorie) => {
  editingCategorie.value = categorie
  formCategorieNom.value = categorie.nom
  showFormCategorie.value = true
}

const submitCategorie = async () => {
  if (!formCategorieNom.value.trim()) return
  savingCategorie.value = true
  if (editingCategorie.value) {
    const updated = await updateCategorie(editingCategorie.value.id, { nom: formCategorieNom.value.trim() })
    if (updated) {
      const idx = categories.value.findIndex((c) => c.id === updated.id)
      if (idx !== -1) categories.value[idx] = updated
    }
  } else {
    const ordre = categories.value.reduce((m, c) => Math.max(m, c.ordre ?? 0), -1) + 1
    const created = await createCategorie({ nom: formCategorieNom.value.trim(), metier: activeMetier.value, ordre })
    if (created) categories.value.push(created)
  }
  savingCategorie.value = false
  showFormCategorie.value = false
}

const askDeleteCategorie = (categorie) => {
  categorieToDelete.value = categorie
  showDeleteCategorie.value = true
}

const confirmDeleteCategorie = async () => {
  const c = categorieToDelete.value
  if (!c) return
  const ok = await deleteCategorie(c.id)
  if (ok) {
    categories.value = categories.value.filter((x) => x.id !== c.id)
    // Les ensembles repassent « Sans catégorie » (ON DELETE SET NULL côté DB).
    ensembles.value = ensembles.value.map((e) => (e.categorie_id === c.id ? { ...e, categorie_id: null } : e))
  }
  showDeleteCategorie.value = false
  categorieToDelete.value = null
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

// Recharge uniquement les lignes et sous-ensembles du ensemble sélectionné (pas la galerie).
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

// ─── Sync nb_articles dans la galerie ────────────────────────────────────────
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

// ─── Chargement (ensembles + catégories) pour le métier actif ────────────────
const loadAll = async () => {
  loadingEnsembles.value = true
  const [ens, cats] = await Promise.all([
    getEnsembles(activeMetier.value),
    getCategories(activeMetier.value),
  ])
  ensembles.value = ens
  categories.value = cats
  loadingEnsembles.value = false
}

// Changement de métier : on recharge tout et on réinitialise la navigation.
watch(activeMetier, async () => {
  selectedEnsemble.value = null
  lignes.value = []
  sousEnsembles.value = []
  showCatalogue.value = false
  search.value = ''
  await loadAll()
})

// ─── Chargement initial ───────────────────────────────────────────────────────
onMounted(async () => {
  await loadUdMap()
  await loadAll()
})
</script>

<template>
  <div class="flex h-full flex-col overflow-hidden">
    <!-- Titre + onglets métier -->
    <div class="flex flex-none items-center justify-between gap-4 border-b border-slate-200 px-4 py-3 dark:border-slate-700">
      <AppTitleMain title="Ensembles matières" description="Gabarits d'articles réutilisables sur tous les chantiers" />
    </div>

    <!-- ══════════════════ VUE GALERIE ══════════════════ -->
    <div v-if="!selectedEnsemble" class="min-h-0 flex-1 overflow-auto bg-slate-50/50 dark:bg-slate-900/30">
      <!-- Barre d'actions -->
      <div class="flex flex-wrap items-center justify-between gap-3 px-6 pt-6">
        <div class="relative w-full max-w-xs">
          <Icon name="lucide:search" size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            v-model="search"
            type="text"
            placeholder="Rechercher un ensemble…"
            class="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-8 text-sm text-slate-700 outline-none transition focus:border-secondary-300 focus:ring-1 focus:ring-secondary-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          />
          <button
            v-if="hasSearch"
            type="button"
            class="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            title="Effacer"
            @click="search = ''"
          >
            <Icon name="lucide:x" size="14" />
          </button>
        </div>
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-500 transition hover:border-secondary-300 hover:text-secondary-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
            @click="showImport = true"
          >
            <Icon name="lucide:file-up" size="14" /> Importer
          </button>
          <button
            type="button"
            class="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-500 transition hover:border-secondary-300 hover:text-secondary-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
            @click="openCreateEnsemble(null)"
          >
            <Icon name="lucide:plus" size="14" /> Nouvel ensemble
          </button>
          <button
            type="button"
            class="flex h-9 items-center gap-1.5 rounded-lg border border-secondary-500 bg-transparent px-3 text-sm font-medium text-secondary-600 transition hover:bg-secondary-50 active:scale-95 dark:border-secondary-500 dark:text-secondary-400 dark:hover:bg-secondary-900/20"
            @click="openCreateCategorie"
          >
            <Icon name="lucide:folder-plus" size="14" /> Nouvelle catégorie
          </button>
        </div>
      </div>

      <!-- Loader -->
      <div v-if="loadingEnsembles" class="flex items-center justify-center py-20">
        <div class="h-7 w-7 animate-spin rounded-full border-2 border-secondary-500 border-t-transparent"></div>
      </div>

      <!-- Grille de catégories : chaque carte liste ses ensembles -->
      <div v-else class="grid grid-cols-1 items-start gap-4 p-6 md:grid-cols-2 xl:grid-cols-3">
        <EnsemblesMatieresCategoryCard
          v-for="(cat, i) in categories"
          v-show="!hasSearch || visibleEnsembles(cat.id).length"
          :key="cat.id"
          :categorie="cat"
          :palette="paletteFor(i)"
          :ensembles="visibleEnsembles(cat.id)"
          :categories="categories"
          @edit="openEditCategorie(cat)"
          @delete="askDeleteCategorie(cat)"
          @open-ensemble="selectEnsemble"
          @add-ensemble="openCreateEnsemble(cat.id)"
          @edit-ensemble="openEditEnsemble"
          @delete-ensemble="askDeleteEnsemble"
          @move-ensemble="quickMove($event.ensemble, $event.categorieId)"
        />

        <!-- Sans catégorie -->
        <EnsemblesMatieresCategoryCard
          v-if="uncategorized.length && (!hasSearch || visibleEnsembles(UNCAT).length)"
          uncategorized
          :ensembles="visibleEnsembles(UNCAT)"
          :categories="categories"
          @open-ensemble="selectEnsemble"
          @add-ensemble="openCreateEnsemble(null)"
          @edit-ensemble="openEditEnsemble"
          @delete-ensemble="askDeleteEnsemble"
          @move-ensemble="quickMove($event.ensemble, $event.categorieId)"
        />

        <!-- Carte « + Nouvelle catégorie » -->
        <button
          v-show="!hasSearch"
          type="button"
          class="flex min-h-32 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 transition hover:border-secondary-300 hover:bg-secondary-50/40 hover:text-secondary-500 dark:border-slate-700 dark:hover:border-secondary-700 dark:hover:bg-secondary-900/10"
          @click="openCreateCategorie"
        >
          <Icon name="lucide:folder-plus" size="22" />
          <span class="text-sm font-medium">Nouvelle catégorie</span>
        </button>

        <!-- Aucun résultat de recherche -->
        <div
          v-if="hasSearch && !visibleEnsembles(UNCAT).length && categories.every((c) => !visibleEnsembles(c.id).length)"
          class="col-span-full flex flex-col items-center gap-2 py-16 text-center text-slate-400"
        >
          <Icon name="lucide:search-x" size="28" class="opacity-40" />
          <p class="text-sm">Aucun ensemble ne correspond à « {{ search }} »</p>
        </div>
      </div>
    </div>

    <!-- ══════════════════ VUE ÉDITEUR ══════════════════ -->
    <div v-else class="flex min-h-0 flex-1 flex-col overflow-hidden">
      <!-- Fil d'Ariane -->
      <div class="flex flex-none items-center gap-1.5 border-b border-slate-200 px-5 py-2.5 text-sm dark:border-slate-700">
        <button type="button" class="flex items-center gap-1 text-slate-400 transition hover:text-secondary-600 dark:hover:text-secondary-400" @click="backToGallery">
          <Icon name="lucide:layout-grid" size="14" /> Catégories
        </button>
        <Icon name="lucide:chevron-right" size="14" class="text-slate-300 dark:text-slate-600" />
        <button type="button" class="text-slate-400 transition hover:text-secondary-600 dark:hover:text-secondary-400" @click="backToGallery">
          {{ selectedCategorieNom }}
        </button>
        <Icon name="lucide:chevron-right" size="14" class="text-slate-300 dark:text-slate-600" />
        <span class="truncate font-medium text-slate-700 dark:text-slate-200">{{ selectedEnsemble.nom }}</span>
      </div>

      <!-- Header de l'ensemble -->
      <div class="flex flex-none items-center justify-between border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-700 dark:bg-slate-900">
        <div class="flex min-w-0 items-center gap-3">
          <button
            type="button"
            class="flex h-9 w-9 flex-none items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
            title="Retour aux catégories"
            @click="backToGallery"
          >
            <Icon name="lucide:arrow-left" size="16" />
          </button>
          <div class="min-w-0">
            <h2 class="truncate text-lg font-semibold text-slate-800 dark:text-white">{{ selectedEnsemble.nom }}</h2>
            <p v-if="selectedEnsemble.description" class="truncate text-sm text-slate-400">{{ selectedEnsemble.description }}</p>
          </div>
        </div>
        <div class="flex flex-none items-center gap-2">
          <div class="hidden rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800 sm:block">
            <span class="text-slate-500 dark:text-slate-400">Total estimé : </span>
            <span class="font-semibold text-slate-800 dark:text-white">{{ fmtPrix(totalEstime) }}</span>
          </div>
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
          <label class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Catégorie</label>
          <AppSelect
            v-model="formCategorie"
            :options="categorieOptions"
            placeholder="Sans catégorie"
            nullable
            :searchable="categorieOptions.length > 8"
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

    <!-- ── Modal : créer / renommer une catégorie ────────────────────────────── -->
    <AppModal v-model="showFormCategorie" size="sm">
      <template #header>
        <h3 class="text-base font-semibold text-slate-800 dark:text-white">
          {{ editingCategorie ? 'Renommer la catégorie' : 'Nouvelle catégorie' }}
        </h3>
      </template>
      <form @submit.prevent="submitCategorie">
        <label class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Nom *</label>
        <input
          v-model="formCategorieNom"
          type="text"
          placeholder="Ex : Caténaire, Voie courante…"
          required
          class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-secondary-400 focus:ring-2 focus:ring-secondary-100 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
        />
      </form>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button
            type="button"
            class="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
            @click="showFormCategorie = false"
          >Annuler</button>
          <button
            type="button"
            :disabled="!formCategorieNom.trim() || savingCategorie"
            class="flex items-center gap-2 rounded-lg bg-secondary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-secondary-700 disabled:opacity-50"
            @click="submitCategorie"
          >
            <div v-if="savingCategorie" class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            {{ editingCategorie ? 'Enregistrer' : 'Créer la catégorie' }}
          </button>
        </div>
      </template>
    </AppModal>

    <!-- ── Modal : confirmer suppression catégorie ───────────────────────────── -->
    <AppModal v-model="showDeleteCategorie" size="sm">
      <template #header>
        <h3 class="text-base font-semibold text-slate-800 dark:text-white">Supprimer la catégorie</h3>
      </template>
      <p class="text-sm text-slate-600 dark:text-slate-300">
        Supprimer <strong>« {{ categorieToDelete?.nom }} »</strong> ?
        <template v-if="deleteCategorieCount > 0">
          Ses <strong>{{ deleteCategorieCount }}</strong> ensemble{{ deleteCategorieCount > 1 ? 's' : '' }}
          ne {{ deleteCategorieCount > 1 ? 'seront' : 'sera' }} pas supprimé{{ deleteCategorieCount > 1 ? 's' : '' }} :
          {{ deleteCategorieCount > 1 ? 'ils repasseront' : 'il repassera' }} en <em>Sans catégorie</em>.
        </template>
      </p>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button
            type="button"
            class="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
            @click="showDeleteCategorie = false"
          >Annuler</button>
          <button
            type="button"
            class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            @click="confirmDeleteCategorie"
          >Supprimer</button>
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
