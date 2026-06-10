<script setup>
const props = defineProps({
  chantier: { type: Object, required: true }
})

const {
  getCommandes, createCommande, updateCommande, deleteCommande, duplicateCommande,
  validerCommande, rouvrirCommande, markExported,
  getLignes, addLigne, updateLigne, deleteLigne,
} = useCommandesMatieres()

const { getEnsemblesCommande, addEnsembleToCommande, updateEnsembleCommande, removeEnsembleFromCommande,
  countArticlesRecursive, prixTotalRecursive } = useEnsemblesMatieres()

const client = useSupabaseClient()
const user = useAuthUser()

// ─── État global ─────────────────────────────────────────────────────────────
const commandes = ref([])
const loadingCommandes = ref(false)
const selectedCommande = ref(null)
const lignes = ref([])
const ensemblesCommande = ref([])
const loadingLignes = ref(false)

// Sidebar / filtres
const search = ref('')
const filtreStatut = ref('tous')   // 'tous' | 'brouillon' | 'commandee'

// Modales
const showFormCommande = ref(false)
const editingCommande = ref(null)
const formNom = ref('')
const formDescription = ref('')
const savingCommande = ref(false)

const showDeleteCommande = ref(false)
const commandeToDelete = ref(null)

const showDeleteLigne = ref(false)
const ligneToDelete = ref(null)

const showDeleteEnsemble = ref(false)
const ensembleCommandeToDelete = ref(null)

const showConfirmValider = ref(false)
const showConfirmRouvrir = ref(false)

const showCatalogue = ref(false)
const showImport = ref(false)
const showFusionner = ref(false)
const showAssistant = ref(false)

const openDropdownId = ref(null)

// Recherche article dans la liste sélectionnée
const searchArticle = ref('')

// Référentiel UD
const udMap = ref(new Map())
const loadUdMap = async () => {
  if (udMap.value.size > 0) return
  const { data } = await client
    .from('catalogue_unites_distribution')
    .select('code, designation, quantite_par_unite')
  if (data) udMap.value = new Map(data.map((r) => [r.code, r]))
}

// ─── Computed ────────────────────────────────────────────────────────────────
const isCommandee = computed(() => selectedCommande.value?.statut === 'commandee')

// Seul le créateur (ou un admin) peut modifier une liste ; created_by null =
// liste historique sans créateur connu, modifiable par tous.
const isOwnerOf = (commande) =>
  !commande?.created_by ||
  commande.created_by === user.value?.id ||
  (user.value?.role ?? 0) >= 1

const isOwner = computed(() => isOwnerOf(selectedCommande.value))
const isReadonly = computed(() => isCommandee.value || !isOwner.value)

const creatorName = (commande) => {
  const c = commande?.createur
  if (!c) return ''
  return [c.prenom, c.nom].filter(Boolean).join(' ') || c.name || ''
}

const stats = computed(() => ({
  total: commandes.value.length,
  brouillon: commandes.value.filter((c) => c.statut !== 'commandee').length,
  commandee: commandes.value.filter((c) => c.statut === 'commandee').length,
}))

const commandesFiltrees = computed(() => {
  let list = commandes.value
  if (filtreStatut.value === 'brouillon') {
    list = list.filter((c) => c.statut !== 'commandee')
  } else if (filtreStatut.value === 'commandee') {
    list = list.filter((c) => c.statut === 'commandee')
  }
  const q = search.value.trim().toLowerCase()
  if (q) {
    list = list.filter((c) =>
      (c.nom ?? '').toLowerCase().includes(q) ||
      (c.description ?? '').toLowerCase().includes(q),
    )
  }
  return [...list].sort((a, b) =>
    new Date(b.updated_at ?? 0) - new Date(a.updated_at ?? 0),
  )
})

const existingSymboles = computed(() => lignes.value.map((l) => l.numero_symbole))
const existingEnsembleIds = computed(() => ensemblesCommande.value.map((e) => e.ensemble_id))

// Articles directs filtrés par recherche
const lignesFiltered = computed(() => {
  const q = searchArticle.value.trim().toLowerCase()
  if (!q) return lignes.value
  return lignes.value.filter((l) => {
    const symbole = (l.numero_symbole ?? '').toLowerCase()
    const desc = (l.catalogue_matieres?.description ?? '').toLowerCase()
    return symbole.includes(q) || desc.includes(q)
  })
})

// Ensembles normalisés pour EnsemblesMatieresTableBody
const matchNodeRecursively = (node, q, visited = new Set()) => {
  if (!node || visited.has(node.id)) return false
  if ((node.nom ?? '').toLowerCase().includes(q)) return true
  const matchLigne = (l) =>
    (l.numero_symbole ?? '').toLowerCase().includes(q) ||
    (l.catalogue_matieres?.description ?? '').toLowerCase().includes(q)
  if ((node.ensembles_matieres_lignes ?? []).some(matchLigne)) return true
  const next = new Set(visited); next.add(node.id)
  return (node.ensembles_matieres_sous_ensembles ?? []).some((s) =>
    matchNodeRecursively(s.sous_ensemble, q, next),
  )
}
const ensemblesNormalized = computed(() => {
  const q = searchArticle.value.trim().toLowerCase()
  return ensemblesCommande.value
    .filter((e) => !q || matchNodeRecursively(e.ensembles_matieres, q))
    .map((e) => ({ id: e.id, quantite: e.quantite, sous_ensemble: e.ensembles_matieres }))
})

const hasItems = computed(() => lignes.value.length > 0 || ensemblesCommande.value.length > 0)

const totalArticles = computed(() => {
  const direct = lignes.value.length
  const fromEnsembles = ensemblesCommande.value.reduce(
    (acc, e) => acc + countArticlesRecursive(e.ensembles_matieres), 0,
  )
  return direct + fromEnsembles
})

const prixUnitaireListe = (cat) => {
  if (!cat) return 0
  const qpu = udMap.value.get(cat.unite_distribution)?.quantite_par_unite ?? 1
  return (cat.prix_ud ?? 0) / (qpu > 0 ? qpu : 1)
}

const totalEnsemble = (item) =>
  prixTotalRecursive(item.ensembles_matieres, udMap.value) * (item.quantite || 1)

const totalEstime = computed(() => {
  const articlesTotal = lignes.value.reduce(
    (acc, l) => acc + prixUnitaireListe(l.catalogue_matieres) * (l.quantite || 0), 0)
  const ensemblesTotal = ensemblesCommande.value.reduce((acc, e) => acc + totalEnsemble(e), 0)
  return articlesTotal + ensemblesTotal
})

// ─── Helpers de formatage ───────────────────────────────────────────────────
const fmtPrix = (v) => {
  if (v == null) return '—'
  return Number(v).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : ''

const fmtRelDate = (iso) => {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "à l'instant"
  if (m < 60) return `il y a ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `il y a ${h} h`
  const d = Math.floor(h / 24)
  if (d < 7) return `il y a ${d} j`
  return fmtDate(iso)
}

const slugify = (s) =>
  s.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')

// ─── CRUD commande ───────────────────────────────────────────────────────────
const openCreateCommande = () => {
  editingCommande.value = null
  formNom.value = ''
  formDescription.value = ''
  showFormCommande.value = true
}

const openEditCommande = (commande) => {
  openDropdownId.value = null
  if (!isOwnerOf(commande)) return
  editingCommande.value = commande
  formNom.value = commande.nom
  formDescription.value = commande.description || ''
  showFormCommande.value = true
}

const submitCommande = async () => {
  if (!formNom.value.trim()) return
  savingCommande.value = true
  const payload = {
    nom: formNom.value.trim(),
    description: formDescription.value.trim(),
    chantier_id: props.chantier.id,
  }
  if (editingCommande.value) {
    const updated = await updateCommande(editingCommande.value.id, payload)
    if (updated) updateCommandeInList(updated)
  } else {
    const created = await createCommande(payload)
    if (created) {
      commandes.value.unshift(created)
      await selectCommande(created)
    }
  }
  savingCommande.value = false
  showFormCommande.value = false
}

const askDeleteCommande = (commande) => {
  openDropdownId.value = null
  if (!isOwnerOf(commande)) return
  commandeToDelete.value = commande
  showDeleteCommande.value = true
}

const confirmDeleteCommande = async () => {
  if (!commandeToDelete.value) return
  const ok = await deleteCommande(commandeToDelete.value.id)
  if (ok) {
    commandes.value = commandes.value.filter((c) => c.id !== commandeToDelete.value.id)
    if (selectedCommande.value?.id === commandeToDelete.value.id) {
      selectedCommande.value = null
      lignes.value = []
      ensemblesCommande.value = []
    }
  }
  showDeleteCommande.value = false
  commandeToDelete.value = null
}

const handleDuplicateCommande = async (commande) => {
  openDropdownId.value = null
  const copy = await duplicateCommande(commande)
  if (copy) commandes.value.unshift(copy)
}

// ─── Sélection commande ──────────────────────────────────────────────────────
const selectCommande = async (commande) => {
  selectedCommande.value = commande
  showCatalogue.value = false
  searchArticle.value = ''
  loadingLignes.value = true
  ;[lignes.value, ensemblesCommande.value] = await Promise.all([
    getLignes(commande.id),
    getEnsemblesCommande(commande.id),
    loadUdMap(),
  ])
  loadingLignes.value = false
}

const updateCommandeInList = (updated) => {
  const idx = commandes.value.findIndex((c) => c.id === updated.id)
  if (idx !== -1) commandes.value[idx] = { ...commandes.value[idx], ...updated }
  if (selectedCommande.value?.id === updated.id) {
    selectedCommande.value = { ...selectedCommande.value, ...updated }
  }
}

// ─── Articles directs ────────────────────────────────────────────────────────
const handleAddArticle = async ({ article, quantite }) => {
  if (!selectedCommande.value || isReadonly.value) return
  const ligne = await addLigne(selectedCommande.value.id, article.numero_symbole, quantite)
  if (ligne) lignes.value.push(ligne)
}

const handleUpdateQuantite = async (ligne, value) => {
  const qty = value === '' || value == null ? 0 : Number(value)
  const idx = lignes.value.findIndex((l) => l.id === ligne.id)
  if (idx !== -1) lignes.value[idx] = { ...lignes.value[idx], quantite: qty }
  await updateLigne(ligne.id, { quantite: qty })
}

const handleUpdateNotes = async (ligne, value) => {
  const idx = lignes.value.findIndex((l) => l.id === ligne.id)
  if (idx !== -1) lignes.value[idx] = { ...lignes.value[idx], notes: value }
  await updateLigne(ligne.id, { notes: value })
}

const askDeleteLigne = (ligne) => {
  ligneToDelete.value = ligne
  showDeleteLigne.value = true
}

const confirmDeleteLigne = async () => {
  if (!ligneToDelete.value) return
  const ok = await deleteLigne(ligneToDelete.value.id)
  if (ok) lignes.value = lignes.value.filter((l) => l.id !== ligneToDelete.value.id)
  showDeleteLigne.value = false
  ligneToDelete.value = null
}

// ─── Ensembles ───────────────────────────────────────────────────────────────
const handleAddEnsemble = async ({ ensemble }) => {
  if (!selectedCommande.value || isReadonly.value) return
  const item = await addEnsembleToCommande(selectedCommande.value.id, ensemble.id)
  if (item) ensemblesCommande.value.push(item)
}

const handleUpdateEnsembleQuantite = async (item, value) => {
  const qty = value === '' || value == null ? 1 : Number(value)
  const idx = ensemblesCommande.value.findIndex((e) => e.id === item.id)
  if (idx !== -1) ensemblesCommande.value[idx] = { ...ensemblesCommande.value[idx], quantite: qty }
  await updateEnsembleCommande(item.id, { quantite: qty })
}

const askDeleteEnsembleCommande = (item) => {
  ensembleCommandeToDelete.value = item
  showDeleteEnsemble.value = true
}

const confirmDeleteEnsembleCommande = async () => {
  if (!ensembleCommandeToDelete.value) return
  const ok = await removeEnsembleFromCommande(ensembleCommandeToDelete.value.id)
  if (ok) ensemblesCommande.value = ensemblesCommande.value.filter((e) => e.id !== ensembleCommandeToDelete.value.id)
  showDeleteEnsemble.value = false
  ensembleCommandeToDelete.value = null
}

// ─── Validation / réouverture ────────────────────────────────────────────────
const confirmValider = async () => {
  if (!selectedCommande.value || !isOwner.value) return
  const updated = await validerCommande(selectedCommande.value.id)
  if (updated) updateCommandeInList(updated)
  showConfirmValider.value = false
}

const confirmRouvrir = async () => {
  if (!selectedCommande.value || !isOwner.value) return
  const updated = await rouvrirCommande(selectedCommande.value.id)
  if (updated) updateCommandeInList(updated)
  showConfirmRouvrir.value = false
}

// ─── Export (aplatissement à la volée) ───────────────────────────────────────
const qteACommanderFor = (qty, udCode) => {
  const qpu = udMap.value.get(udCode)?.quantite_par_unite
  if (!qpu || qpu <= 1) return qty
  return Math.ceil(qty / qpu)
}

const handleExport = async () => {
  if (!selectedCommande.value || !isCommandee.value) return
  await loadUdMap()

  // Agrégation tous articles (directs + ensembles récursifs) par symbole.
  const aggregated = new Map()
  const addItem = (symbole, qty, catalogue, notes = '') => {
    const prev = aggregated.get(symbole)
    aggregated.set(symbole, {
      quantite: (prev?.quantite ?? 0) + qty,
      catalogue: catalogue ?? prev?.catalogue,
      notes: (prev?.notes && prev.notes.trim()) ? prev.notes : notes,
    })
  }

  for (const l of lignes.value) {
    addItem(l.numero_symbole, l.quantite || 0, l.catalogue_matieres, l.notes ?? '')
  }

  const walk = (node, cumul) => {
    if (!node) return
    for (const ligne of node.ensembles_matieres_lignes ?? []) {
      addItem(ligne.numero_symbole, cumul * (ligne.quantite || 0), ligne.catalogue_matieres)
    }
    for (const child of node.ensembles_matieres_sous_ensembles ?? []) {
      walk(child.sous_ensemble, cumul * (child.quantite || 1))
    }
  }
  for (const item of ensemblesCommande.value) {
    walk(item.ensembles_matieres, item.quantite || 1)
  }

  if (aggregated.size === 0) return

  // Partition supply chain / contrat cadre
  const supplyItems = []
  const contratCadreItems = []
  for (const [symbole, agg] of aggregated.entries()) {
    const item = {
      numero_symbole: symbole,
      quantite: agg.quantite,
      notes: agg.notes,
      catalogue_matieres: agg.catalogue,
    }
    if (agg.catalogue?.origine === 'contrat_cadre') contratCadreItems.push(item)
    else supplyItems.push(item)
  }

  // Tri par symbole
  const bySymbole = (a, b) => String(a.numero_symbole).localeCompare(String(b.numero_symbole))
  supplyItems.sort(bySymbole)
  contratCadreItems.sort(bySymbole)

  const JSZip = (await import('jszip')).default
  const zip = new JSZip()
  const CHUNK_SIZE = 50
  const compte = props.chantier?.compte ?? ''
  const nom = slugify(`${compte} - ${selectedCommande.value.nom}`) || 'export'

  if (supplyItems.length > 0) {
    const chunks = []
    for (let i = 0; i < supplyItems.length; i += CHUNK_SIZE) {
      const slice = supplyItems.slice(i, i + CHUNK_SIZE)
      const content = slice
        .map((item) => {
          const symbole = item.numero_symbole ?? ''
          const qte = Number(qteACommanderFor(item.quantite, item.catalogue_matieres?.unite_distribution)).toFixed(1)
          return `${symbole}\t${qte}\t`
        })
        .join('\n') + '\n'
      chunks.push(content)
    }
    chunks.forEach((content, idx) => {
      const filename = chunks.length === 1 ? `${nom}.txt` : `${nom}_${idx + 1}.txt`
      zip.file(filename, content)
    })
  }

  if (contratCadreItems.length > 0) {
    const XLSX = await import('xlsx')
    const rows = contratCadreItems.map((item) => ({
      'N° Symbole': item.numero_symbole,
      'Désignation': item.catalogue_matieres?.description ?? '',
      'UD': item.catalogue_matieres?.unite_distribution ?? '',
      'Qté demandée': item.quantite,
      'Qté à commander': qteACommanderFor(item.quantite, item.catalogue_matieres?.unite_distribution),
      'Notes': item.notes ?? '',
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    ws['!cols'] = [{ wch: 12 }, { wch: 40 }, { wch: 8 }, { wch: 14 }, { wch: 16 }, { wch: 30 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Contrats cadres')
    const xlsxBuffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
    zip.file(`${nom}_contrats-cadres.xlsx`, xlsxBuffer)
  }

  const blob = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${nom}.zip`
  a.click()
  URL.revokeObjectURL(url)

  const marked = await markExported(selectedCommande.value.id)
  if (marked) updateCommandeInList(marked)
}

// ─── Fusion (créer depuis…) ──────────────────────────────────────────────────
const openFusionner = () => {
  showFusionner.value = true
}

const handleMerged = async ({ commande }) => {
  commandes.value.unshift(commande)
  showFusionner.value = false
  await selectCommande(commande)
}

// ─── Import ──────────────────────────────────────────────────────────────────
const openImport = () => {
  showImport.value = true
}

const handleImported = async ({ commande }) => {
  commandes.value.unshift(commande)
  showImport.value = false
  await selectCommande(commande)
}

// ─── Assistant ───────────────────────────────────────────────────────────────
const openAssistant = () => {
  showAssistant.value = true
}

const handleAssistantImported = async () => {
  showAssistant.value = false
  if (!selectedCommande.value) return
  // Recharger les lignes + ensembles pour refléter ce que l'assistant a ajouté
  ;[lignes.value, ensemblesCommande.value] = await Promise.all([
    getLignes(selectedCommande.value.id),
    getEnsemblesCommande(selectedCommande.value.id),
  ])
}

// ─── Chargement initial ──────────────────────────────────────────────────────
onMounted(async () => {
  loadingCommandes.value = true
  ;[commandes.value] = await Promise.all([
    getCommandes(props.chantier.id),
    loadUdMap(),
  ])
  loadingCommandes.value = false
})
</script>

<template>
  <div class="flex h-full flex-col overflow-hidden px-4">
    <!-- Titre -->
    <div class="flex-none border-b border-gray-200 py-3 dark:border-gray-700">
      <AppTitleMain title="Commandes matières" description="Listes de matières par chantier" />
    </div>

    <div class="flex min-h-0 flex-1 overflow-hidden">

      <!-- ════════════════════════════════════════════════════════════════════ -->
      <!-- ── Sidebar gauche : liste unifiée ──────────────────────────────── -->
      <!-- ════════════════════════════════════════════════════════════════════ -->
      <aside class="flex w-72 flex-none flex-col border-r border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/50">

        <!-- En-tête actions -->
        <div class="flex-none space-y-2 border-b border-gray-200 p-2.5 dark:border-gray-700">
          <!-- Action principale -->
          <button
            type="button"
            class="group inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-linear-to-b from-blue-500 to-blue-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm ring-1 ring-blue-600/40 transition-all hover:from-blue-600 hover:to-blue-700 hover:shadow-md active:scale-[0.985] dark:from-blue-500 dark:to-blue-600"
            @click="openCreateCommande">
            <Icon name="lucide:plus" size="15" class="transition-transform group-hover:rotate-90" />
            Nouvelle liste
          </button>

          <!-- Actions secondaires -->
          <div class="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              class="group inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs font-medium text-gray-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
              @click="openImport">
              <Icon name="lucide:file-up" size="13" />
              Importer
            </button>
            <button
              type="button"
              :disabled="commandes.length < 1"
              class="group inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs font-medium text-gray-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:bg-white disabled:hover:text-gray-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
              @click="openFusionner">
              <Icon name="lucide:git-merge" size="13" />
              Fusionner
            </button>
          </div>

          <!-- Recherche -->
          <div class="relative">
            <Icon name="lucide:search" size="13" class="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              v-model="search"
              type="text"
              placeholder="Rechercher…"
              class="w-full rounded-md border border-gray-200 bg-white py-1.5 pl-8 pr-2 text-sm text-gray-700 outline-none transition focus:border-blue-300 focus:ring-1 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:placeholder-gray-500 dark:focus:border-blue-500"
            />
          </div>

          <!-- Filtres statut (pills) -->
          <div class="flex gap-1">
            <button
              v-for="opt in [
                { key: 'tous', label: 'Tout', count: stats.total },
                { key: 'brouillon', label: 'Brouillon', count: stats.brouillon },
                { key: 'commandee', label: 'Commandée', count: stats.commandee },
              ]"
              :key="opt.key"
              type="button"
              class="flex flex-1 items-center justify-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition"
              :class="
                filtreStatut === opt.key
                  ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700/50 dark:bg-blue-900/30 dark:text-blue-300'
                  : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400'
              "
              @click="filtreStatut = opt.key">
              {{ opt.label }}
              <span class="rounded bg-gray-100 px-1 text-[10px] font-bold tabular-nums text-gray-500 dark:bg-gray-700 dark:text-gray-400">{{ opt.count }}</span>
            </button>
          </div>
        </div>

        <!-- Loader -->
        <div v-if="loadingCommandes" class="flex items-center justify-center py-10">
          <div class="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
        </div>

        <!-- Empty -->
        <div v-else-if="commandes.length === 0" class="flex flex-col items-center gap-3 px-4 py-12 text-center">
          <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
            <Icon name="lucide:clipboard-list" size="22" class="text-gray-400" />
          </div>
          <div class="space-y-1">
            <p class="text-sm font-medium text-gray-600 dark:text-gray-300">Aucune liste</p>
            <p class="text-sm text-gray-400">Créez votre première liste</p>
          </div>
        </div>

        <!-- Empty filtré -->
        <div v-else-if="commandesFiltrees.length === 0" class="flex flex-col items-center gap-2 px-4 py-12 text-center">
          <Icon name="lucide:search-x" size="22" class="text-gray-300" />
          <p class="text-sm text-gray-400">Aucun résultat</p>
        </div>

        <!-- Liste -->
        <ul v-else class="flex-1 space-y-0.5 overflow-y-auto p-2">
          <li
            v-for="commande in commandesFiltrees"
            :key="commande.id"
            class="group relative cursor-pointer overflow-hidden rounded-lg px-3 py-2.5 transition-all"
            :class="
              selectedCommande?.id === commande.id
                ? 'bg-white shadow-sm ring-1 ring-blue-200 dark:bg-gray-800 dark:ring-blue-700/50'
                : 'hover:bg-white/80 dark:hover:bg-gray-800/60'
            "
            @click="selectCommande(commande)">
            <span
              v-if="selectedCommande?.id === commande.id"
              class="absolute inset-y-0 left-0 w-0.5 rounded-l-lg bg-blue-500" />
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0 flex-1">
                <!-- Badge statut -->
                <span
                  class="mb-1 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                  :class="
                    commande.statut === 'commandee'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                  ">
                  <Icon
                    :name="commande.statut === 'commandee' ? 'lucide:check-circle' : 'lucide:circle-dashed'"
                    size="10" />
                  {{ commande.statut === 'commandee' ? 'Commandée' : 'Brouillon' }}
                </span>
                <p
                  class="truncate text-sm leading-snug font-medium"
                  :class="
                    selectedCommande?.id === commande.id
                      ? 'text-blue-700 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-200'
                  ">
                  {{ commande.nom }}
                </p>
                <p v-if="commande.description" class="mt-0.5 truncate text-xs text-gray-400 dark:text-gray-500">
                  {{ commande.description }}
                </p>
                <p class="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                  {{ fmtRelDate(commande.updated_at) }}
                </p>
                <p v-if="creatorName(commande)" class="mt-0.5 flex items-center gap-1 truncate text-xs text-gray-400 dark:text-gray-500">
                  <Icon name="lucide:user" size="10" class="flex-none" />
                  {{ creatorName(commande) }}
                </p>
                <p v-if="commande.exported_at" class="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
                  <Icon name="lucide:download" size="10" />
                  Exportée le {{ fmtDate(commande.exported_at) }}
                </p>
              </div>
              <!-- Menu kebab -->
              <div
                class="flex flex-none items-center transition-opacity"
                :class="selectedCommande?.id === commande.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'"
                @click.stop>
                <AppDropdownMenu
                  :open="openDropdownId === commande.id"
                  @update:open="(v) => openDropdownId = v ? commande.id : null">
                  <template #trigger>
                    <button
                      type="button"
                      class="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200">
                      <Icon name="lucide:more-vertical" size="14" />
                    </button>
                  </template>
                  <div class="flex min-w-32 flex-col gap-0.5">
                    <button
                      v-if="isOwnerOf(commande)"
                      type="button"
                      class="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                      @click="openEditCommande(commande)">
                      <Icon name="lucide:pencil" size="13" />
                      Renommer
                    </button>
                    <button
                      type="button"
                      class="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                      @click="handleDuplicateCommande(commande)">
                      <Icon name="lucide:copy" size="13" />
                      Dupliquer
                    </button>
                    <button
                      v-if="isOwnerOf(commande)"
                      type="button"
                      class="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                      @click="askDeleteCommande(commande)">
                      <Icon name="lucide:trash-2" size="13" />
                      Supprimer
                    </button>
                  </div>
                </AppDropdownMenu>
              </div>
            </div>
          </li>
        </ul>
      </aside>

      <!-- ════════════════════════════════════════════════════════════════════ -->
      <!-- ── Zone principale : détail liste sélectionnée ──────────────────── -->
      <!-- ════════════════════════════════════════════════════════════════════ -->
      <main class="flex min-w-0 flex-1 flex-col overflow-hidden">
        <!-- Vide -->
        <div v-if="!selectedCommande" class="flex h-full flex-col items-center justify-center gap-3 text-gray-400">
          <Icon name="lucide:mouse-pointer-click" size="48" class="opacity-30" />
          <p class="text-base">Sélectionnez une liste ou créez-en une nouvelle</p>
          <button
            type="button"
            class="mt-2 flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-base font-medium text-white hover:bg-blue-700"
            @click="openCreateCommande">
            <Icon name="lucide:plus" size="18" />
            Nouvelle liste
          </button>
        </div>

        <template v-else>
          <!-- Header de la liste -->
          <div class="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-900">
            <div class="flex min-w-0 flex-1 items-center gap-3">
              <div class="shrink-0">
                <div class="flex items-center gap-2">
                  <h2 class="text-lg font-semibold text-gray-800 dark:text-white">{{ selectedCommande.nom }}</h2>
                  <span
                    class="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold uppercase tracking-wide"
                    :class="
                      isCommandee
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                    ">
                    <Icon
                      :name="isCommandee ? 'lucide:lock' : 'lucide:circle-dashed'"
                      size="11" />
                    {{ isCommandee ? 'Commandée' : 'Brouillon' }}
                  </span>
                  <span
                    v-if="!isOwner"
                    class="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    :title="`Liste créée par ${creatorName(selectedCommande) || 'un autre utilisateur'} — seul son créateur peut la modifier`">
                    <Icon name="lucide:eye" size="11" />
                    Lecture seule
                  </span>
                </div>
                <p class="text-sm text-gray-400 dark:text-gray-500">
                  {{ totalArticles }} article{{ totalArticles !== 1 ? 's' : '' }}
                  <template v-if="creatorName(selectedCommande)">
                    · Créée par {{ creatorName(selectedCommande) }}
                  </template>
                  <template v-if="selectedCommande.valide_at">
                    · Validée le {{ fmtDate(selectedCommande.valide_at) }}
                  </template>
                </p>
              </div>
              <div class="relative min-w-0 flex-1 max-w-xs">
                <Icon name="lucide:search" size="16" class="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  v-model="searchArticle"
                  type="text"
                  placeholder="Rechercher un article…"
                  class="w-full rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-9 pr-3 text-base text-gray-700 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-1 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:placeholder-gray-500 dark:focus:border-blue-500 dark:focus:bg-gray-700"
                />
              </div>
            </div>
            <div class="flex items-center gap-2">
              <!-- Total estimé -->
              <div class="hidden rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-base sm:block dark:border-gray-700 dark:bg-gray-800">
                <span class="text-gray-500 dark:text-gray-400">Total estimé : </span>
                <span class="font-semibold text-gray-800 dark:text-white">{{ fmtPrix(totalEstime) }}</span>
              </div>

              <!-- Non-propriétaire : duplication pour obtenir une copie modifiable -->
              <button
                v-if="!isOwner"
                type="button"
                title="Créer une copie modifiable de cette liste"
                class="flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                @click="handleDuplicateCommande(selectedCommande)">
                <Icon name="lucide:copy" size="15" />
                Dupliquer
              </button>

              <!-- Actions Brouillon (propriétaire) -->
              <template v-if="!isReadonly">
                <button
                  type="button"
                  title="Lancer un assistant métier"
                  class="flex cursor-pointer items-center gap-1.5 rounded-lg border border-purple-300 bg-purple-50 px-3 py-1.5 text-sm font-medium text-purple-700 transition hover:border-purple-400 hover:bg-purple-100 dark:border-purple-700/50 dark:bg-purple-900/20 dark:text-purple-400 dark:hover:bg-purple-900/30"
                  @click="openAssistant">
                  <Icon name="lucide:workflow" size="15" />
                  Assistant
                </button>
                <button
                  type="button"
                  :title="showCatalogue ? 'Fermer le catalogue' : 'Ouvrir le catalogue articles'"
                  class="flex h-9 w-9 items-center justify-center rounded-lg border transition"
                  :class="
                    showCatalogue
                      ? 'border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:border-blue-700/50 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30'
                      : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                  "
                  @click="showCatalogue = !showCatalogue">
                  <Icon :name="showCatalogue ? 'lucide:panel-right-close' : 'lucide:plus'" size="16" />
                </button>
                <button
                  type="button"
                  :disabled="!hasItems"
                  class="flex cursor-pointer items-center gap-1.5 rounded-lg border border-green-300 bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700 transition hover:border-green-400 hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-green-700/50 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30"
                  @click="showConfirmValider = true">
                  <Icon name="lucide:check-circle" size="15" />
                  Valider la commande
                </button>
              </template>

              <!-- Actions Commandée -->
              <template v-else-if="isCommandee">
                <button
                  type="button"
                  :disabled="!hasItems"
                  class="flex cursor-pointer items-center gap-1.5 rounded-lg border border-blue-300 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 transition hover:border-blue-400 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-blue-700/50 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30"
                  @click="handleExport">
                  <Icon name="lucide:file-down" size="15" />
                  Exporter (ZIP)
                </button>
                <button
                  v-if="isOwner"
                  type="button"
                  title="Rouvrir en brouillon pour éditer"
                  class="flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  @click="showConfirmRouvrir = true">
                  <Icon name="lucide:undo-2" size="15" />
                  Rouvrir
                </button>
              </template>
            </div>
          </div>

          <!-- Loader -->
          <div v-if="loadingLignes" class="flex items-center justify-center py-16">
            <div class="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          </div>

          <!-- Tableau -->
          <div v-else class="flex-1 overflow-auto">
            <!-- Empty -->
            <div v-if="!hasItems" class="flex flex-col items-center gap-3 px-6 py-16 text-center text-gray-400">
              <Icon name="lucide:package-open" size="48" class="opacity-30" />
              <p class="text-base">Aucun article dans cette liste</p>
              <button
                v-if="!isReadonly"
                type="button"
                class="mt-1 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-base font-medium text-blue-600 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                @click="showCatalogue = true">
                <Icon name="lucide:package-search" size="18" />
                Parcourir le catalogue
              </button>
            </div>

            <!-- Tableau hiérarchique -->
            <table v-else class="w-full text-sm">
              <thead class="sticky top-0 z-10">
                <tr class="border-y border-gray-200 bg-gray-50 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/90">
                  <th class="px-4 py-2.5 text-left text-sm font-semibold tracking-wider text-gray-400 uppercase dark:text-gray-500">N° Symbole</th>
                  <th class="px-4 py-2.5 text-left text-sm font-semibold tracking-wider text-gray-400 uppercase dark:text-gray-500">Désignation</th>
                  <th class="px-4 py-2.5 text-center text-sm font-semibold tracking-wider text-gray-400 uppercase dark:text-gray-500">UD</th>
                  <th class="w-32 px-4 py-2.5 text-center text-sm font-semibold tracking-wider text-gray-400 uppercase dark:text-gray-500">Quantité</th>
                  <th class="px-4 py-2.5 text-right text-sm font-semibold tracking-wider text-gray-400 uppercase dark:text-gray-500">Prix unit.</th>
                  <th class="px-4 py-2.5 text-right text-sm font-semibold tracking-wider text-gray-400 uppercase dark:text-gray-500">Total</th>
                  <th class="w-48 px-4 py-2.5 text-left text-sm font-semibold tracking-wider text-gray-400 uppercase dark:text-gray-500">Notes</th>
                  <th class="w-10 px-2 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                <EnsemblesMatieresTableBody
                  :key="selectedCommande.id"
                  :lignes="lignesFiltered"
                  :sous-ensembles="ensemblesNormalized"
                  :show-notes="true"
                  :ud-map="udMap"
                  :readonly="isReadonly"
                  @update-quantite-ligne="handleUpdateQuantite"
                  @update-notes-ligne="handleUpdateNotes"
                  @delete-ligne="askDeleteLigne"
                  @update-quantite-se="(item, val) => handleUpdateEnsembleQuantite(ensemblesCommande.find(e => e.id === item.id), val)"
                  @delete-se="(item) => askDeleteEnsembleCommande(ensemblesCommande.find(e => e.id === item.id))"
                />
              </tbody>
            </table>
          </div>
        </template>
      </main>

      <!-- ── Sidebar catalogue (brouillon uniquement) ─────────────────────── -->
      <Transition name="catalogue-panel">
        <CommandesMatieresCatalogueSidebar
          v-if="showCatalogue && selectedCommande && !isReadonly"
          :existing-symboles="existingSymboles"
          :existing-ensemble-ids="existingEnsembleIds"
          @add="handleAddArticle"
          @add-ensemble="handleAddEnsemble" />
      </Transition>
    </div>

    <!-- ════════════════════════════════════════════════════════════════════ -->
    <!-- ── Modales ─────────────────────────────────────────────────────── -->
    <!-- ════════════════════════════════════════════════════════════════════ -->

    <!-- Créer / renommer une liste -->
    <AppModal v-model="showFormCommande" size="md">
      <template #header>
        <h3 class="text-base font-semibold text-gray-800 dark:text-white">
          {{ editingCommande ? 'Renommer la liste' : 'Nouvelle liste' }}
        </h3>
      </template>
      <form class="space-y-4" @submit.prevent="submitCommande">
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Nom *</label>
          <input
            v-model="formNom"
            type="text"
            placeholder="Ex : Phase 1 – Rails"
            required
            class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 transition outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
          <textarea
            v-model="formDescription"
            rows="3"
            placeholder="Description optionnelle…"
            class="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 transition outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white"></textarea>
        </div>
      </form>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button
            type="button"
            class="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            @click="showFormCommande = false">
            Annuler
          </button>
          <button
            type="button"
            :disabled="!formNom.trim() || savingCommande"
            class="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
            @click="submitCommande">
            <div v-if="savingCommande" class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            {{ editingCommande ? 'Enregistrer' : 'Créer la liste' }}
          </button>
        </div>
      </template>
    </AppModal>

    <!-- Suppression liste -->
    <AppModal v-model="showDeleteCommande" size="sm">
      <template #header>
        <h3 class="text-base font-semibold text-gray-800 dark:text-white">Supprimer la liste</h3>
      </template>
      <p class="text-sm text-gray-600 dark:text-gray-300">
        Supprimer la liste <strong>« {{ commandeToDelete?.nom }} »</strong> et tous ses articles ?
        Cette action est irréversible.
      </p>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button
            type="button"
            class="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            @click="showDeleteCommande = false">
            Annuler
          </button>
          <button
            type="button"
            class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            @click="confirmDeleteCommande">
            Supprimer
          </button>
        </div>
      </template>
    </AppModal>

    <!-- Suppression article -->
    <AppModal v-model="showDeleteLigne" size="sm">
      <template #header>
        <h3 class="text-base font-semibold text-gray-800 dark:text-white">Retirer l'article</h3>
      </template>
      <p class="text-sm text-gray-600 dark:text-gray-300">
        Retirer l'article <strong class="font-mono">{{ ligneToDelete?.numero_symbole }}</strong> de cette liste ?
      </p>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button
            type="button"
            class="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            @click="showDeleteLigne = false">
            Annuler
          </button>
          <button
            type="button"
            class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            @click="confirmDeleteLigne">
            Retirer
          </button>
        </div>
      </template>
    </AppModal>

    <!-- Suppression ensemble -->
    <AppModal v-model="showDeleteEnsemble" size="sm">
      <template #header>
        <h3 class="text-base font-semibold text-gray-800 dark:text-white">Retirer l'ensemble</h3>
      </template>
      <p class="text-sm text-gray-600 dark:text-gray-300">
        Retirer l'ensemble <strong>« {{ ensembleCommandeToDelete?.ensembles_matieres?.nom }} »</strong> de cette liste ?
      </p>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button
            type="button"
            class="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            @click="showDeleteEnsemble = false">
            Annuler
          </button>
          <button
            type="button"
            class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            @click="confirmDeleteEnsembleCommande">
            Retirer
          </button>
        </div>
      </template>
    </AppModal>

    <!-- Confirmer validation -->
    <AppModal v-model="showConfirmValider" size="sm">
      <template #header>
        <h3 class="text-base font-semibold text-gray-800 dark:text-white">Valider la commande</h3>
      </template>
      <p class="text-sm text-gray-600 dark:text-gray-300">
        Valider la liste <strong>« {{ selectedCommande?.nom }} »</strong> ?
        Elle passera en lecture seule, pourra être exportée vers l'EBM, et tu pourras toujours la rouvrir si besoin.
      </p>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button
            type="button"
            class="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            @click="showConfirmValider = false">
            Annuler
          </button>
          <button
            type="button"
            class="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            @click="confirmValider">
            Valider la commande
          </button>
        </div>
      </template>
    </AppModal>

    <!-- Confirmer réouverture -->
    <AppModal v-model="showConfirmRouvrir" size="sm">
      <template #header>
        <h3 class="text-base font-semibold text-gray-800 dark:text-white">Rouvrir en brouillon</h3>
      </template>
      <p class="text-sm text-gray-600 dark:text-gray-300">
        Rouvrir la liste <strong>« {{ selectedCommande?.nom }} »</strong> en brouillon ?
        Elle redeviendra modifiable et la trace d'export sera effacée.
      </p>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button
            type="button"
            class="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            @click="showConfirmRouvrir = false">
            Annuler
          </button>
          <button
            type="button"
            class="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
            @click="confirmRouvrir">
            Rouvrir
          </button>
        </div>
      </template>
    </AppModal>

    <!-- Import XLSX -->
    <CommandesMatieresImportModal
      :open="showImport"
      :chantier-id="chantier.id"
      :commandes="commandes"
      @close="showImport = false"
      @imported="handleImported" />

    <!-- Créer depuis d'autres listes (fusion) -->
    <CommandesMatieresFusionnerModal
      :open="showFusionner"
      :chantier-id="chantier.id"
      :commandes="commandes"
      @close="showFusionner = false"
      @merged="handleMerged" />

    <!-- Assistant (wizard métier) -->
    <AssistantsLauncher
      v-if="selectedCommande && !isReadonly"
      :open="showAssistant"
      :commande-id="selectedCommande.id"
      @close="showAssistant = false"
      @imported="handleAssistantImported" />

  </div>
</template>

<style scoped>
.catalogue-panel-enter-active,
.catalogue-panel-leave-active {
  transition: all 0.25s ease;
}
.catalogue-panel-enter-from,
.catalogue-panel-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>
