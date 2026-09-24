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
// Bouton « Ajouter » de l'en-tête : le catalogue ajoute à la racine de l'ensemble
const basculerCatalogue = () => {
  addTargetId.value = selectedEnsemble.value.id
  showCatalogue.value = !showCatalogue.value
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
// Saisie de la fiche au moment de l'ouverture : la fermeture demande confirmation si elle a changé
const formEnsembleInitial = ref('')
const formEnsembleSnapshot = () => JSON.stringify([formNom.value, formDescription.value, formCategorie.value])
const formEnsembleDirty = computed(() => showFormEnsemble.value && formEnsembleSnapshot() !== formEnsembleInitial.value)

const openCreateEnsemble = (categorieId = null) => {
  editingEnsemble.value = null
  formNom.value = ''
  formDescription.value = ''
  formCategorie.value = categorieId || null
  formEnsembleInitial.value = formEnsembleSnapshot()
  showFormEnsemble.value = true
}

const openEditEnsemble = (ensemble) => {
  editingEnsemble.value = ensemble
  formNom.value = ensemble.nom
  formDescription.value = ensemble.description || ''
  formCategorie.value = ensemble.categorie_id || null
  formEnsembleInitial.value = formEnsembleSnapshot()
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
const formCategorieDirty = computed(
  () => showFormCategorie.value && formCategorieNom.value !== (editingCategorie.value?.nom ?? '')
)

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
  <div class="flex min-h-0 flex-1 flex-col">
    <!-- ══════════════════ VUE GALERIE ══════════════════ -->
    <div v-if="!selectedEnsemble" class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 lg:px-8 lg:pt-4 lg:pb-6">
      <!-- Barre d'outils -->
      <div class="flex flex-col gap-3 lg:flex-row lg:items-center">
        <AppInputSearch v-model="search" boxed dense class="w-full lg:max-w-sm" placeholder="Rechercher un ensemble…" />
        <div class="flex flex-wrap items-center gap-2 lg:ml-auto">
          <AppButtonValidated theme="outline" type="button" @click="showImport = true">
            <template #default>
              <span class="flex items-center gap-2">
                <Icon name="lucide:file-up" size="16" />
                Importer
              </span>
            </template>
          </AppButtonValidated>
          <AppButtonValidated theme="outline" type="button" @click="openCreateCategorie">
            <template #default>
              <span class="flex items-center gap-2">
                <Icon name="lucide:folder-plus" size="16" />
                Nouvelle catégorie
              </span>
            </template>
          </AppButtonValidated>
          <AppButtonValidated theme="brand" type="button" @click="openCreateEnsemble(null)">
            <template #default>
              <span class="flex items-center gap-2">
                <Icon name="lucide:plus" size="16" />
                Nouvel ensemble
              </span>
            </template>
          </AppButtonValidated>
        </div>
      </div>

      <!-- Chargement -->
      <div v-if="loadingEnsembles" class="flex items-center justify-center py-20">
        <Icon name="lucide:loader-circle" size="26" class="text-magenta-600 animate-spin" />
      </div>

      <!-- Grille de catégories : chaque carte liste ses ensembles. Rangées de hauteur fixe : toutes les cartes
           ont la même hauteur, leur liste défile au-delà -->
      <div v-else class="grid auto-rows-[26rem] grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
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
          @move-ensemble="quickMove($event.ensemble, $event.categorieId)" />

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
          @move-ensemble="quickMove($event.ensemble, $event.categorieId)" />

        <!-- Carte « + Nouvelle catégorie » -->
        <button
          v-show="!hasSearch"
          type="button"
          class="text-ink-soft hover:border-magenta-300 hover:text-magenta-700 dark:hover:border-magenta-400/50 dark:hover:text-magenta-300 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 transition-colors dark:border-white/15"
          @click="openCreateCategorie">
          <Icon name="lucide:folder-plus" size="22" />
          <span class="text-sm font-semibold">Nouvelle catégorie</span>
        </button>

        <!-- Aucun résultat de recherche -->
        <div
          v-if="hasSearch && !visibleEnsembles(UNCAT).length && categories.every((c) => !visibleEnsembles(c.id).length)"
          class="text-ink-soft col-span-full flex flex-col items-center gap-2 py-16 text-center">
          <Icon name="lucide:search-x" size="28" class="opacity-40" />
          <p class="text-sm">Aucun ensemble ne correspond à « {{ search }} »</p>
        </div>
      </div>
    </div>

    <!-- ══════════════════ VUE ÉDITEUR ══════════════════ -->
    <div v-else class="flex min-h-0 flex-1 flex-col gap-4 p-4 lg:px-8 lg:pt-4 lg:pb-4">
      <!-- Fil d'Ariane -->
      <nav class="flex min-w-0 items-center gap-1.5 text-sm" aria-label="Fil d'Ariane">
        <button
          type="button"
          class="text-ink-soft hover:text-magenta-700 dark:hover:text-magenta-300 flex cursor-pointer items-center gap-1.5 font-medium transition-colors"
          @click="backToGallery">
          <Icon name="lucide:arrow-left" size="15" />
          Catégories
        </button>
        <Icon name="lucide:chevron-right" size="14" class="shrink-0 text-slate-300 dark:text-white/25" />
        <button
          type="button"
          class="text-ink-soft hover:text-magenta-700 dark:hover:text-magenta-300 cursor-pointer truncate transition-colors"
          @click="backToGallery">
          {{ selectedCategorieNom }}
        </button>
        <Icon name="lucide:chevron-right" size="14" class="shrink-0 text-slate-300 dark:text-white/25" />
        <span class="text-ink truncate font-medium" aria-current="page">{{ selectedEnsemble.nom }}</span>
      </nav>

      <!-- En-tête de l'ensemble -->
      <div class="surface-card flex flex-wrap items-center gap-x-5 gap-y-3 rounded-xl px-5 py-4">
        <div class="min-w-0 flex-1">
          <h2 class="text-ink truncate text-lg font-semibold">{{ selectedEnsemble.nom }}</h2>
          <p v-if="selectedEnsemble.description" class="text-ink-soft truncate text-sm">
            {{ selectedEnsemble.description }}
          </p>
        </div>
        <div class="flex flex-none items-center gap-4">
          <div class="text-right">
            <p class="text-ink-soft text-xs font-semibold">Total estimé</p>
            <p class="font-traverse text-ink text-xl leading-tight tracking-[0.02em] tabular-nums">
              {{ fmtPrix(totalEstime) }}
            </p>
          </div>
          <div class="flex items-center gap-1">
            <button
              type="button"
              :class="BOUTON_ICONE"
              title="Modifier l'ensemble"
              @click="openEditEnsemble(selectedEnsemble)">
              <Icon name="lucide:pencil" size="16" />
            </button>
            <button
              type="button"
              :class="BOUTON_ICONE_DANGER"
              title="Supprimer l'ensemble"
              @click="askDeleteEnsemble(selectedEnsemble)">
              <Icon name="lucide:trash-2" size="16" />
            </button>
          </div>
          <AppButtonValidated
            :theme="showCatalogue ? 'outline' : 'brand'"
            type="button"
            @click="basculerCatalogue">
            <template #default>
              <span class="flex items-center gap-2">
                <Icon :name="showCatalogue ? 'lucide:panel-right-close' : 'lucide:plus'" size="16" />
                {{ showCatalogue ? 'Fermer le catalogue' : 'Ajouter' }}
              </span>
            </template>
          </AppButtonValidated>
        </div>
      </div>

      <!-- Contenu : tableau de l'ensemble et, à droite, le catalogue pour ajouter -->
      <div class="surface-card flex min-h-0 flex-1 overflow-hidden rounded-xl max-lg:max-h-[75vh]">
        <div v-if="loadingLignes" class="flex flex-1 items-center justify-center py-16">
          <Icon name="lucide:loader-circle" size="26" class="text-magenta-600 animate-spin" />
        </div>

        <div v-else class="min-w-0 flex-1 overflow-auto">
          <!-- Ensemble vide -->
          <div
            v-if="lignes.length === 0 && sousEnsembles.length === 0"
            class="text-ink-soft flex flex-col items-center gap-3 px-6 py-16 text-center">
            <Icon name="lucide:package-open" size="40" class="opacity-40" />
            <p class="text-sm">Aucun contenu dans cet ensemble</p>
            <AppButtonValidated theme="outline" type="button" @click="showCatalogue = true">
              <template #default>
                <span class="flex items-center gap-2">
                  <Icon name="lucide:package-search" size="16" />
                  Parcourir le catalogue
                </span>
              </template>
            </AppButtonValidated>
          </div>

          <!-- Tableau -->
          <table v-else class="w-full min-w-max text-sm">
            <thead :class="TABLEAU_TETE">
              <tr>
                <th class="px-4 py-2.5 text-left">N° symbole</th>
                <th class="px-4 py-2.5 text-left">Désignation</th>
                <th class="px-4 py-2.5 text-center">UD</th>
                <th class="w-32 px-4 py-2.5 text-center">Quantité</th>
                <th class="px-4 py-2.5 text-right">Prix unit.</th>
                <th class="px-4 py-2.5 text-right">Total</th>
                <th class="w-10 px-2 py-2.5"><span class="sr-only">Actions</span></th>
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
                @delete-se="askDeleteSousEnsemble" />
            </tbody>
          </table>
        </div>

        <!-- Catalogue -->
        <Transition name="catalogue-panel">
          <CommandesMatieresCatalogueSidebar
            v-if="showCatalogue"
            :existing-symboles="existingSymboles"
            :existing-ensemble-ids="existingEnsembleIds"
            :exclude-id="addTargetId"
            :metier="activeMetier"
            :target-label="addTargetId && addTargetId !== selectedEnsemble.id ? activeNode?.nom : null"
            @add="handleAddArticle"
            @add-ensemble="handleAddSousEnsemble" />
        </Transition>
      </div>
    </div>

    <!-- ── Fiche : créer / modifier un ensemble ─────────────────────────────── -->
    <AppSidePanelForm
      :open="showFormEnsemble"
      surtitre="Ensemble"
      :titre="formNom.trim() || (editingEnsemble ? '—' : 'Nouvel ensemble')"
      :sous-titre="formCategorie ? categorieNom(formCategorie) : 'Sans catégorie'"
      :valid="!!formNom.trim()"
      :dirty="formEnsembleDirty"
      :locked="savingEnsemble"
      :submit-label="editingEnsemble ? 'Enregistrer' : 'Créer l\'ensemble'"
      @close="showFormEnsemble = false"
      @submit="submitEnsemble">
      <section class="surface-card space-y-4 rounded-xl p-5" aria-labelledby="ensemble-fiche">
        <h3 id="ensemble-fiche" class="text-ink font-semibold">Ensemble</h3>
        <div>
          <label for="ensemble-nom" :class="CHAMP_LIBELLE">Nom</label>
          <input
            id="ensemble-nom"
            v-model="formNom"
            type="text"
            autocomplete="off"
            class="form-control h-10"
            placeholder="Ex. : Kit RVB Voie Courante" />
        </div>
        <div>
          <p :class="CHAMP_LIBELLE">Catégorie</p>
          <AppSelect
            v-model="formCategorie"
            v4
            :options="categorieOptions"
            placeholder="Sans catégorie"
            nullable
            :searchable="categorieOptions.length > 8" />
        </div>
        <div>
          <label for="ensemble-description" :class="CHAMP_LIBELLE">Description</label>
          <textarea
            id="ensemble-description"
            v-model="formDescription"
            rows="3"
            class="form-control resize-y py-2.5"
            placeholder="Description facultative…" />
        </div>
      </section>
    </AppSidePanelForm>

    <!-- ── Fiche : créer / renommer une catégorie ───────────────────────────── -->
    <AppSidePanelForm
      :open="showFormCategorie"
      surtitre="Catégorie d'ensembles"
      :titre="formCategorieNom.trim() || (editingCategorie ? '—' : 'Nouvelle catégorie')"
      :valid="!!formCategorieNom.trim()"
      :dirty="formCategorieDirty"
      :locked="savingCategorie"
      :submit-label="editingCategorie ? 'Enregistrer' : 'Créer la catégorie'"
      @close="showFormCategorie = false"
      @submit="submitCategorie">
      <section class="surface-card rounded-xl p-5">
        <label for="categorie-ensembles-nom" :class="CHAMP_LIBELLE">Nom de la catégorie</label>
        <input
          id="categorie-ensembles-nom"
          v-model="formCategorieNom"
          type="text"
          autocomplete="off"
          class="form-control h-10"
          placeholder="Ex. : Caténaire, Voie courante…" />
      </section>
    </AppSidePanelForm>

    <!-- ── Confirmations ─────────────────────────────────────────────────────── -->
    <AppConfirmModal v-model="showDeleteCategorie" title="Supprimer la catégorie" @confirm="confirmDeleteCategorie">
      La catégorie <strong class="text-ink">« {{ categorieToDelete?.nom }} »</strong> sera supprimée.
      <template v-if="deleteCategorieCount > 0">
        Ses {{ deleteCategorieCount }} ensemble{{ deleteCategorieCount > 1 ? 's' : '' }} ne
        {{ deleteCategorieCount > 1 ? 'seront' : 'sera' }} pas supprimé{{ deleteCategorieCount > 1 ? 's' : '' }} :
        {{ deleteCategorieCount > 1 ? 'ils repasseront' : 'il repassera' }} en « Sans catégorie ».
      </template>
    </AppConfirmModal>

    <AppConfirmModal v-model="showDeleteEnsemble" title="Supprimer l'ensemble" @confirm="confirmDeleteEnsemble">
      L'ensemble <strong class="text-ink">« {{ ensembleToDelete?.nom }} »</strong> et tous ses articles seront
      supprimés définitivement.
    </AppConfirmModal>

    <AppConfirmModal
      v-model="showDeleteLigne"
      title="Retirer l'article"
      confirm-label="Retirer"
      icon="lucide:package-minus"
      @confirm="confirmDeleteLigne">
      L'article <strong class="text-ink tabular-nums">{{ ligneToDelete?.numero_symbole }}</strong> sera retiré de cet
      ensemble.
    </AppConfirmModal>

    <AppConfirmModal
      v-model="showDeleteSousEnsemble"
      title="Retirer le sous-ensemble"
      confirm-label="Retirer"
      icon="lucide:package-minus"
      @confirm="confirmDeleteSousEnsemble">
      Le sous-ensemble <strong class="text-ink">« {{ sousEnsembleToDelete?.sous_ensemble?.nom }} »</strong> sera retiré
      de cet ensemble. Il reste disponible dans sa catégorie.
    </AppConfirmModal>

    <!-- ── Import xlsx ─────────────────────────────────────────────────────── -->
    <EnsemblesMatieresImportModal
      :open="showImport"
      :metier="activeMetier"
      @close="showImport = false"
      @imported="handleImported" />
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
