<script setup>
const props = defineProps({
  chantier: { type: Object, required: true }
})

const { getCommandes, createCommande, updateCommande, deleteCommande, duplicateCommande, getLignes, addLigne, updateLigne, deleteLigne } =
  useCommandesMatieres()

const { getEnsemblesCommande, addEnsembleToCommande, updateEnsembleCommande, removeEnsembleFromCommande } =
  useEnsemblesMatieres()

const { getFusions, createFusion, updateFusion, deleteFusion, addListeToFusion, removeListeFromFusion } =
  useCommandesFusions()

// ─── Onglets ──────────────────────────────────────────────────────────────────
const activeTab = ref('listes')

// ─── État global ─────────────────────────────────────────────────────────────
const commandes = ref([])
const loadingCommandes = ref(false)
const selectedCommande = ref(null)
const lignes = ref([])
const ensemblesCommande = ref([])
const loadingLignes = ref(false)

// ─── Modales ──────────────────────────────────────────────────────────────────
const showFormCommande = ref(false)
const editingCommande = ref(null)
const showDeleteCommande = ref(false)
const commandeToDelete = ref(null)
const showDeleteLigne = ref(false)
const ligneToDelete = ref(null)
const showDeleteEnsemble = ref(false)
const ensembleCommandeToDelete = ref(null)

// ─── Sidebar catalogue ────────────────────────────────────────────────────────
const showCatalogue     = ref(false)
const showImport        = ref(false)
const showFusionner     = ref(false)
const commandeToMerge   = ref(null)

const handleImported = async ({ commande }) => {
  commandes.value.unshift(commande)
  showImport.value = false
  await selectCommande(commande)
}

const openFusionnerCommande = (commande) => {
  openDropdownId.value = null
  commandeToMerge.value = commande
  showFusionner.value = true
}

const handleMerged = async ({ commande }) => {
  commandes.value.unshift(commande)
  showFusionner.value = false
  commandeToMerge.value = null
  await selectCommande(commande)
}

// ─── Ensembles dépliés ────────────────────────────────────────────────────────
const openEnsembles = ref(new Set())
const toggleEnsemble = (id) => {
  const s = new Set(openEnsembles.value)
  s.has(id) ? s.delete(id) : s.add(id)
  openEnsembles.value = s
}

// ─── Sous-ensembles dépliés (au sein d'un ensemble) ──────────────────────────
const openSubEnsembles = ref(new Set())
const toggleSubEnsemble = (id) => {
  const s = new Set(openSubEnsembles.value)
  s.has(id) ? s.delete(id) : s.add(id)
  openSubEnsembles.value = s
}

// ─── Formulaire commande ──────────────────────────────────────────────────────
const formNom = ref('')
const formDescription = ref('')
const savingCommande = ref(false)

const openCreateCommande = () => {
  editingCommande.value = null
  formNom.value = ''
  formDescription.value = ''
  showFormCommande.value = true
}

const openEditCommande = (commande) => {
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
    chantier_id: props.chantier.id
  }

  if (editingCommande.value) {
    const updated = await updateCommande(editingCommande.value.id, payload)
    if (updated) {
      const idx = commandes.value.findIndex((c) => c.id === updated.id)
      if (idx !== -1) commandes.value[idx] = updated
      if (selectedCommande.value?.id === updated.id) selectedCommande.value = updated
    }
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

// ─── Sélection commande ───────────────────────────────────────────────────────
const selectCommande = async (commande) => {
  selectedCommande.value = commande
  showCatalogue.value = false
  searchArticle.value = ''
  openEnsembles.value = new Set()
  openSubEnsembles.value = new Set()
  loadingLignes.value = true
  ;[lignes.value, ensemblesCommande.value] = await Promise.all([
    getLignes(commande.id),
    getEnsemblesCommande(commande.id)
  ])
  loadingLignes.value = false
}

// ─── Suppression commande ─────────────────────────────────────────────────────
const askDeleteCommande = (commande) => {
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

// ─── Duplication commande ─────────────────────────────────────────────────────
const openDropdownId = ref(null)

const handleDuplicateCommande = async (commande) => {
  openDropdownId.value = null
  const copy = await duplicateCommande(commande)
  if (copy) commandes.value.unshift(copy)
}

// ─── Articles directs ─────────────────────────────────────────────────────────
const existingSymboles = computed(() => lignes.value.map((l) => l.numero_symbole))
const existingEnsembleIds = computed(() => ensemblesCommande.value.map((e) => e.ensemble_id))

const handleAddArticle = async ({ article, quantite }) => {
  if (!selectedCommande.value) return
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

// ─── Ensembles ────────────────────────────────────────────────────────────────
const handleAddEnsemble = async ({ ensemble }) => {
  if (!selectedCommande.value) return
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

// ─── Liste affichée : ensembles en tête, puis articles triés par n° symbole ───
const searchArticle = ref('')

const itemsAffiches = computed(() => {
  const q = searchArticle.value.trim().toLowerCase()

  const ensembles = ensemblesCommande.value
    .filter((e) => {
      if (!q) return true
      const nom = (e.ensembles_matieres?.nom ?? '').toLowerCase()
      return nom.includes(q)
    })
    .map((e) => ({ type: 'ensemble', data: e }))

  const articles = [...lignes.value]
    .filter((l) => {
      if (!q) return true
      const symbole = (l.numero_symbole ?? '').toLowerCase()
      const desc = (l.catalogue_matieres?.description ?? '').toLowerCase()
      return symbole.includes(q) || desc.includes(q)
    })
    .sort((a, b) => a.numero_symbole.localeCompare(b.numero_symbole))
    .map((l) => ({ type: 'article', data: l }))

  return [...ensembles, ...articles]
})

const hasItems = computed(() => lignes.value.length > 0 || ensemblesCommande.value.length > 0)

// ─── Formatage ────────────────────────────────────────────────────────────────
const fmtPrix = (v) => {
  if (v == null) return '—'
  return Number(v).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}

const countArticlesEnsemble = (ens) => {
  const direct = ens?.ensembles_matieres_lignes?.length ?? 0
  const fromSub = (ens?.ensembles_matieres_sous_ensembles ?? []).reduce(
    (acc, se) => acc + (se.sous_ensemble?.ensembles_matieres_lignes?.length ?? 0),
    0
  )
  return direct + fromSub
}

const totalEnsemble = (item) => {
  const articlesTotal = (item.ensembles_matieres?.ensembles_matieres_lignes ?? []).reduce((acc, l) => {
    return acc + (l.catalogue_matieres?.prix_ud ?? 0) * (l.quantite || 0)
  }, 0)
  const sousEnsemblesTotal = (item.ensembles_matieres?.ensembles_matieres_sous_ensembles ?? []).reduce((acc, se) => {
    const seTotal = (se.sous_ensemble?.ensembles_matieres_lignes ?? []).reduce((a, l) => {
      return a + (l.catalogue_matieres?.prix_ud ?? 0) * (l.quantite || 0)
    }, 0)
    return acc + seTotal * (se.quantite || 1)
  }, 0)
  return (articlesTotal + sousEnsemblesTotal) * (item.quantite || 1)
}

const totalEstime = computed(() => {
  const articlesTotal = lignes.value.reduce((acc, l) => {
    return acc + (l.catalogue_matieres?.prix_ud ?? 0) * (l.quantite || 0)
  }, 0)
  const ensemblesTotal = ensemblesCommande.value.reduce((acc, e) => acc + totalEnsemble(e), 0)
  return articlesTotal + ensemblesTotal
})

// ─── Commandes-fusions ───────────────────────────────────────────────────────
const fusions = ref([])
const selectedFusion = ref(null)
const loadingFusions = ref(false)

// Modales fusion
const showFormFusion = ref(false)
const editingFusion = ref(null)
const formFusionNom = ref('')
const savingFusion = ref(false)
const showDeleteFusion = ref(false)
const fusionToDelete = ref(null)

// Cache des données de toutes les listes (lignes + ensembles)
// Map<commandeId, { lignes: [], ensembles: [] }>
const commandesData = ref(new Map())
const loadingFusionData = ref(false)

// Référentiel UD — Map<code, { designation, quantite_par_unite }>
const udMap = ref(new Map())
const client = useSupabaseClient()

const loadUdMap = async () => {
  if (udMap.value.size > 0) return
  const { data } = await client.from('catalogue_unites_distribution').select('code, designation, quantite_par_unite')
  if (data) udMap.value = new Map(data.map((r) => [r.code, r]))
}

const loadFusions = async () => {
  loadingFusions.value = true
  fusions.value = await getFusions(props.chantier.id)
  loadingFusions.value = false
}

const loadAllCommandesData = async () => {
  loadingFusionData.value = true
  const results = await Promise.all(
    commandes.value.map(async (c) => {
      const [ls, ens] = await Promise.all([getLignes(c.id), getEnsemblesCommande(c.id)])
      return { id: c.id, lignes: ls, ensembles: ens }
    })
  )
  const m = new Map()
  results.forEach((r) => m.set(r.id, { lignes: r.lignes, ensembles: r.ensembles }))
  commandesData.value = m
  loadingFusionData.value = false
}

watch(activeTab, (tab) => {
  if (tab === 'commandes') {
    loadFusions()
    loadAllCommandesData()
    loadUdMap()
  }
})

// ─── CRUD fusions ─────────────────────────────────────────────────────────────
const openCreateFusion = () => {
  editingFusion.value = null
  formFusionNom.value = ''
  showFormFusion.value = true
}

const openEditFusion = (fusion) => {
  editingFusion.value = fusion
  formFusionNom.value = fusion.nom
  showFormFusion.value = true
}

const submitFusion = async () => {
  if (!formFusionNom.value.trim()) return
  savingFusion.value = true
  if (editingFusion.value) {
    const updated = await updateFusion(editingFusion.value.id, { nom: formFusionNom.value.trim() })
    if (updated) {
      const idx = fusions.value.findIndex((f) => f.id === updated.id)
      if (idx !== -1) {
        fusions.value[idx] = { ...fusions.value[idx], nom: updated.nom }
      }
      if (selectedFusion.value?.id === updated.id) {
        selectedFusion.value = { ...selectedFusion.value, nom: updated.nom }
      }
    }
  } else {
    const created = await createFusion(props.chantier.id, formFusionNom.value.trim())
    if (created) {
      fusions.value.push(created)
      selectedFusion.value = created
    }
  }
  savingFusion.value = false
  showFormFusion.value = false
}

const askDeleteFusion = (fusion) => {
  fusionToDelete.value = fusion
  showDeleteFusion.value = true
}

const confirmDeleteFusion = async () => {
  if (!fusionToDelete.value) return
  const ok = await deleteFusion(fusionToDelete.value.id)
  if (ok) {
    fusions.value = fusions.value.filter((f) => f.id !== fusionToDelete.value.id)
    if (selectedFusion.value?.id === fusionToDelete.value.id) selectedFusion.value = null
  }
  showDeleteFusion.value = false
  fusionToDelete.value = null
}

// ─── Sélection des listes dans une fusion ─────────────────────────────────────
const isListeInFusion = (commandeId) =>
  selectedFusion.value?.commandes_matieres_fusions_listes?.some((l) => l.commande_id === commandeId) ?? false

const toggleListeInFusion = async (commande) => {
  if (!selectedFusion.value) return
  const existing = selectedFusion.value.commandes_matieres_fusions_listes?.find((l) => l.commande_id === commande.id)
  if (existing) {
    await removeListeFromFusion(existing.id)
    selectedFusion.value = {
      ...selectedFusion.value,
      commandes_matieres_fusions_listes: selectedFusion.value.commandes_matieres_fusions_listes.filter(
        (l) => l.id !== existing.id
      )
    }
  } else {
    const row = await addListeToFusion(selectedFusion.value.id, commande.id)
    if (row) {
      selectedFusion.value = {
        ...selectedFusion.value,
        commandes_matieres_fusions_listes: [...(selectedFusion.value.commandes_matieres_fusions_listes ?? []), row]
      }
    }
  }
}

// ─── Calcul de la fusion ──────────────────────────────────────────────────────
const fusionItems = computed(() => {
  if (!selectedFusion.value) return []
  const includedIds = new Set(selectedFusion.value.commandes_matieres_fusions_listes?.map((l) => l.commande_id) ?? [])
  const map = new Map()

  const add = (symbole, catalogue, qte) => {
    if (!map.has(symbole)) {
      const udCode = catalogue?.unite_distribution || ''
      map.set(symbole, { catalogue, quantite: 0, ud: udMap.value.get(udCode) ?? null })
    }
    map.get(symbole).quantite += qte
  }

  for (const [commandeId, data] of commandesData.value) {
    if (!includedIds.has(commandeId)) continue
    for (const l of data.lignes) add(l.numero_symbole, l.catalogue_matieres, l.quantite || 0)
    for (const ec of data.ensembles) {
      const qtyEns = ec.quantite || 1
      const ens = ec.ensembles_matieres
      for (const l of ens?.ensembles_matieres_lignes ?? [])
        add(l.numero_symbole, l.catalogue_matieres, (l.quantite || 0) * qtyEns)
      for (const se of ens?.ensembles_matieres_sous_ensembles ?? []) {
        const qtySe = se.quantite || 1
        for (const l of se.sous_ensemble?.ensembles_matieres_lignes ?? [])
          add(l.numero_symbole, l.catalogue_matieres, (l.quantite || 0) * qtySe * qtyEns)
      }
    }
  }

  return [...map.values()].sort((a, b) =>
    (a.catalogue?.numero_symbole ?? '').localeCompare(b.catalogue?.numero_symbole ?? '')
  )
})

const searchFusion = ref('')

const fusionItemsFiltres = computed(() => {
  const q = searchFusion.value.trim().toLowerCase()
  if (!q) return fusionItems.value
  return fusionItems.value.filter((item) => {
    const symbole = (item.catalogue?.numero_symbole ?? '').toLowerCase()
    const desc    = (item.catalogue?.description ?? '').toLowerCase()
    return symbole.includes(q) || desc.includes(q)
  })
})

const fusionTotal = computed(() =>
  fusionItems.value.reduce((acc, i) => acc + (i.catalogue?.prix_ud ?? 0) * i.quantite, 0)
)

const qteACommander = (item) => {
  const qpu = item.ud?.quantite_par_unite
  if (!qpu || qpu <= 1) return item.quantite
  return Math.ceil(item.quantite / qpu)
}

// ─── Export TXT ERP ───────────────────────────────────────────────────────────
const slugify = (s) => s.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')

const handleExport = async () => {
  if (!selectedFusion.value || !fusionItemsFiltres.value.length) return

  const CHUNK_SIZE = 50
  const items  = fusionItems.value
  const compte = props.chantier?.compte ?? ''
  const nom    = slugify(`${compte} - ${selectedFusion.value.nom}`) || 'export'
  const chunks = []

  for (let i = 0; i < items.length; i += CHUNK_SIZE) {
    const slice   = items.slice(i, i + CHUNK_SIZE)
    const content = slice
      .map((item) => {
        const symbole = item.catalogue?.numero_symbole ?? ''
        const qte     = Number(qteACommander(item)).toFixed(1)
        return `${symbole}\t${qte}\t`
      })
      .join('\n') + '\n'
    chunks.push({ content, index: chunks.length + 1 })
  }

  const JSZip = (await import('jszip')).default
  const zip   = new JSZip()

  chunks.forEach(({ content, index }) => {
    const filename = chunks.length === 1 ? `${nom}.txt` : `${nom}_${index}.txt`
    zip.file(filename, content)
  })

  const blob = await zip.generateAsync({ type: 'blob' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = chunks.length === 1 ? `${nom}.zip` : `${nom}.zip`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Chargement initial ───────────────────────────────────────────────────────
onMounted(async () => {
  loadingCommandes.value = true
  commandes.value = await getCommandes(props.chantier.id)
  loadingCommandes.value = false
})
</script>

<template>
  <div class="flex h-full flex-col overflow-hidden px-4">
    <!-- Titre -->
    <div class="flex-none border-b border-gray-200 py-3 dark:border-gray-700">
      <AppTitleMain title="Commandes matières" description="Gestion des listes de commandes par chantier" />
    </div>

    <!-- ── Onglets ────────────────────────────────────────────────────────────── -->
    <div class="flex-none border-b border-gray-200 dark:border-gray-700">
      <div class="flex gap-1">
        <button
          type="button"
          class="-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition"
          :class="
            activeTab === 'listes'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          "
          @click="activeTab = 'listes'">
          <Icon name="lucide:list" size="14" class="mr-1.5 inline" />
          Listes
        </button>
        <button
          type="button"
          class="-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition"
          :class="
            activeTab === 'commandes'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          "
          @click="activeTab = 'commandes'">
          <Icon name="lucide:package-check" size="14" class="mr-1.5 inline" />
          Commandes
        </button>
      </div>
    </div>

    <div class="flex min-h-0 flex-1 overflow-hidden">
      <!-- ══ Onglet Listes ═══════════════════════════════════════════════════════ -->
      <template v-if="activeTab === 'listes'">
        <!-- ── Colonne gauche : liste des commandes ─────────────────────────────── -->
        <aside
          class="flex w-68 flex-none flex-col border-r border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/50">
          <!-- Header -->
          <div class="flex items-center justify-between border-b border-gray-200 px-3 py-3 dark:border-gray-700">
            <span class="text-xs font-semibold tracking-widest text-gray-400 uppercase dark:text-gray-500">
              Listes
              <span
                class="ml-1.5 inline-flex items-center justify-center rounded-full bg-gray-200 px-1.5 py-0.5 text-xs font-bold text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                {{ commandes.length }}
              </span>
            </span>
            <div class="flex items-center gap-1.5">
              <button
                type="button"
                class="flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 text-xs font-medium text-gray-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400"
                @click="showImport = true">
                <Icon name="lucide:file-up" size="13" />
                Importer
              </button>
              <button
                type="button"
                class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-blue-600 bg-blue-600 text-white transition hover:border-blue-700 hover:bg-blue-700 active:scale-95"
                title="Nouvelle liste"
                @click="openCreateCommande">
                <Icon name="lucide:plus" size="16" />
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
              <p class="text-xs text-gray-400">Créez votre première liste</p>
            </div>
            <button
              type="button"
              class="mt-1 flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
              @click="openCreateCommande">
              <Icon name="lucide:plus" size="12" />
              Nouvelle liste
            </button>
          </div>

          <!-- Liste -->
          <ul v-else class="flex-1 space-y-0.5 overflow-y-auto p-2">
            <li
              v-for="commande in commandes"
              :key="commande.id"
              class="group relative cursor-pointer overflow-hidden rounded-lg px-3 py-2.5 transition-all"
              :class="
                selectedCommande?.id === commande.id
                  ? 'bg-white shadow-sm ring-1 ring-blue-200 dark:bg-gray-800 dark:ring-blue-700/50'
                  : 'hover:bg-white/80 dark:hover:bg-gray-800/60'
              "
              @click="selectCommande(commande)">
              <!-- Barre de sélection gauche -->
              <span
                v-if="selectedCommande?.id === commande.id"
                class="absolute inset-y-0 left-0 w-0.5 rounded-l-lg bg-blue-500" />
              <div class="flex items-center justify-between gap-2">
                <div class="min-w-0 flex-1">
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
                </div>
                <!-- Actions -->
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
                        type="button"
                        class="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                        @click="openDropdownId = null; openEditCommande(commande)">
                        <Icon name="lucide:pencil" size="13" />
                        Modifier
                      </button>
                      <button
                        type="button"
                        class="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                        @click="handleDuplicateCommande(commande)">
                        <Icon name="lucide:copy" size="13" />
                        Dupliquer
                      </button>
                      <button
                        type="button"
                        class="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                        @click="openFusionnerCommande(commande)">
                        <Icon name="lucide:git-merge" size="13" />
                        Fusionner
                      </button>
                      <button
                        type="button"
                        class="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                        @click="openDropdownId = null; askDeleteCommande(commande)">
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

        <!-- ── Zone principale : détail de la commande ──────────────────────────── -->
        <main class="flex min-w-0 flex-1 flex-col overflow-hidden">
          <!-- Aucune commande sélectionnée -->
          <div v-if="!selectedCommande" class="flex h-full flex-col items-center justify-center gap-3 text-gray-400">
            <Icon name="lucide:mouse-pointer-click" size="48" class="opacity-30" />
            <p class="text-sm">Sélectionnez une liste ou créez-en une nouvelle</p>
            <button
              type="button"
              class="mt-2 flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              @click="openCreateCommande">
              <Icon name="lucide:plus" size="16" />
              Nouvelle liste
            </button>
          </div>

          <template v-else>
            <!-- Header de la commande -->
            <div
              class="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-900">
              <div class="flex min-w-0 flex-1 items-center gap-3">
                <h2 class="shrink-0 text-lg font-semibold text-gray-800 dark:text-white">{{ selectedCommande.nom }}</h2>
                <div class="relative min-w-0 flex-1 max-w-xs">
                  <Icon name="lucide:search" size="14" class="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    v-model="searchArticle"
                    type="text"
                    placeholder="Rechercher un article…"
                    class="w-full rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-8 pr-3 text-sm text-gray-700 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-1 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:placeholder-gray-500 dark:focus:border-blue-500 dark:focus:bg-gray-700"
                  />
                </div>
              </div>
              <div class="flex items-center gap-2">
                <!-- Total estimé -->
                <div
                  class="hidden rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm sm:block dark:border-gray-700 dark:bg-gray-800">
                  <span class="text-gray-500 dark:text-gray-400">Total estimé : </span>
                  <span class="font-semibold text-gray-800 dark:text-white">{{ fmtPrix(totalEstime) }}</span>
                </div>
                <!-- Bouton toggle catalogue -->
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
              </div>
            </div>

            <!-- Loader lignes -->
            <div v-if="loadingLignes" class="flex items-center justify-center py-16">
              <div class="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
            </div>

            <!-- Table des articles -->
            <div v-else class="flex-1 overflow-auto">
              <!-- Empty -->
              <div v-if="!hasItems" class="flex flex-col items-center gap-3 px-6 py-16 text-center text-gray-400">
                <Icon name="lucide:package-open" size="48" class="opacity-30" />
                <p class="text-sm">Aucun article dans cette liste</p>
                <button
                  type="button"
                  class="mt-1 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                  @click="showCatalogue = true">
                  <Icon name="lucide:package-search" size="16" />
                  Parcourir le catalogue
                </button>
              </div>

              <!-- Tableau mixte articles + ensembles -->
              <div v-else>
                <table class="w-full text-sm">
                  <thead class="sticky top-0 z-10">
                    <tr
                      class="border-y border-gray-200 bg-gray-50 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/90">
                      <th
                        class="px-4 py-2.5 text-left text-xs font-semibold tracking-wider text-gray-400 uppercase dark:text-gray-500">
                        N° Symbole
                      </th>
                      <th
                        class="px-4 py-2.5 text-left text-xs font-semibold tracking-wider text-gray-400 uppercase dark:text-gray-500">
                        Désignation
                      </th>
                      <th
                        class="px-4 py-2.5 text-center text-xs font-semibold tracking-wider text-gray-400 uppercase dark:text-gray-500">
                        UD
                      </th>
                      <th
                        class="w-32 px-4 py-2.5 text-center text-xs font-semibold tracking-wider text-gray-400 uppercase dark:text-gray-500">
                        Quantité
                      </th>
                      <th
                        class="px-4 py-2.5 text-right text-xs font-semibold tracking-wider text-gray-400 uppercase dark:text-gray-500">
                        Prix unit.
                      </th>
                      <th
                        class="px-4 py-2.5 text-right text-xs font-semibold tracking-wider text-gray-400 uppercase dark:text-gray-500">
                        Total
                      </th>
                      <th
                        class="w-48 px-4 py-2.5 text-left text-xs font-semibold tracking-wider text-gray-400 uppercase dark:text-gray-500">
                        Notes
                      </th>
                      <th class="w-10 px-2 py-2.5"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <template v-for="(item, i) in itemsAffiches" :key="item.data.id">
                      <!-- ── Ligne article direct ─────────────────────────────── -->
                      <tr
                        v-if="item.type === 'article'"
                        class="group border-t border-gray-100 transition dark:border-gray-700/50"
                        :class="i % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/20'">
                        <td class="px-4 py-2.5">
                          <span
                            class="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 font-mono text-xs font-semibold text-blue-700 ring-1 ring-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:ring-blue-800/40">
                            {{ item.data.numero_symbole }}
                          </span>
                        </td>
                        <td class="px-4 py-2.5">
                          <p class="text-xs font-medium text-gray-700 dark:text-gray-200">
                            {{ item.data.catalogue_matieres?.description || '—' }}
                          </p>
                          <p v-if="item.data.catalogue_matieres?.famille" class="mt-0.5 text-xs text-gray-400">
                            {{ item.data.catalogue_matieres.famille }}
                          </p>
                        </td>
                        <td class="px-4 py-2.5 text-center">
                          <span
                            class="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                            {{ item.data.catalogue_matieres?.unite_distribution || '—' }}
                          </span>
                        </td>
                        <td class="px-4 py-2.5 text-center">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            :value="item.data.quantite"
                            class="w-24 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-center text-sm font-medium text-gray-800 transition outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                            @change="handleUpdateQuantite(item.data, $event.target.value)" />
                        </td>
                        <td class="px-4 py-2.5 text-right text-xs whitespace-nowrap text-gray-500 dark:text-gray-400">
                          {{ fmtPrix(item.data.catalogue_matieres?.prix_ud) }}
                        </td>
                        <td class="px-4 py-2.5 text-right whitespace-nowrap">
                          <span class="text-sm font-semibold text-gray-800 dark:text-gray-100">
                            {{ fmtPrix((item.data.catalogue_matieres?.prix_ud ?? 0) * (item.data.quantite || 0)) }}
                          </span>
                        </td>
                        <td class="px-4 py-2.5">
                          <input
                            type="text"
                            :value="item.data.notes"
                            placeholder="Ajouter une note…"
                            class="w-full rounded-lg border border-transparent bg-transparent px-2 py-1 text-xs text-gray-600 transition outline-none placeholder:text-gray-300 hover:border-gray-200 hover:bg-white focus:border-blue-300 focus:bg-white focus:ring-1 focus:ring-blue-100 dark:text-gray-300 dark:placeholder-gray-600 dark:hover:border-gray-600 dark:hover:bg-gray-800 dark:focus:border-blue-600 dark:focus:bg-gray-800"
                            @change="handleUpdateNotes(item.data, $event.target.value)" />
                        </td>
                        <td class="px-2 py-2.5 text-center">
                          <button
                            type="button"
                            class="rounded-md p-1.5 text-gray-300 opacity-0 transition group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 dark:text-gray-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                            title="Supprimer l'article"
                            @click="askDeleteLigne(item.data)">
                            <Icon name="lucide:trash-2" size="13" />
                          </button>
                        </td>
                      </tr>

                      <!-- ── Ligne header ensemble ────────────────────────────── -->
                      <template v-else>
                        <tr
                          class="group border-t border-gray-200 bg-indigo-50/60 dark:border-gray-600 dark:bg-indigo-900/10">
                          <!-- Info ensemble (N° Symbole + Désignation + UD) -->
                          <td colspan="3" class="px-4 py-2.5">
                            <div class="flex items-center gap-2">
                              <button
                                type="button"
                                class="flex h-5 w-5 flex-none items-center justify-center rounded text-indigo-500 transition hover:bg-indigo-100 dark:hover:bg-indigo-900/30"
                                @click="toggleEnsemble(item.data.id)">
                                <Icon
                                  :name="
                                    openEnsembles.has(item.data.id) ? 'lucide:chevron-down' : 'lucide:chevron-right'
                                  "
                                  size="14" />
                              </button>
                              <Icon
                                name="lucide:layers"
                                size="14"
                                class="flex-none text-indigo-500 dark:text-indigo-400" />
                              <span class="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                                {{ item.data.ensembles_matieres?.nom }}
                              </span>
                              <span
                                class="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                                {{ countArticlesEnsemble(item.data.ensembles_matieres) }} article{{
                                  countArticlesEnsemble(item.data.ensembles_matieres) > 1 ? 's' : ''
                                }}
                              </span>
                              <p
                                v-if="item.data.ensembles_matieres?.description"
                                class="ml-1 truncate text-xs text-indigo-400">
                                {{ item.data.ensembles_matieres.description }}
                              </p>
                            </div>
                          </td>
                          <!-- Quantité (nb d'ensembles commandés) -->
                          <td class="px-4 py-2.5 text-center">
                            <input
                              type="number"
                              min="1"
                              step="1"
                              :value="item.data.quantite ?? 1"
                              class="w-24 rounded-lg border border-indigo-200 bg-white px-2 py-1.5 text-center text-sm font-medium text-indigo-700 transition outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-indigo-700/50 dark:bg-gray-800 dark:text-indigo-300"
                              @change="handleUpdateEnsembleQuantite(item.data, $event.target.value)" />
                          </td>
                          <!-- Prix unit vide -->
                          <td class="px-4 py-2.5"></td>
                          <!-- Total ensemble -->
                          <td class="px-4 py-2.5 text-right whitespace-nowrap">
                            <span class="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                              {{ fmtPrix(totalEnsemble(item.data)) }}
                            </span>
                          </td>
                          <td class="px-4 py-2.5"></td>
                          <td class="px-2 py-2.5 text-center">
                            <button
                              type="button"
                              class="rounded-md p-1.5 text-gray-300 opacity-0 transition group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 dark:text-gray-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                              title="Retirer l'ensemble"
                              @click="askDeleteEnsembleCommande(item.data)">
                              <Icon name="lucide:trash-2" size="13" />
                            </button>
                          </td>
                        </tr>

                        <!-- Contenu de l'ensemble (dépliable) -->
                        <template v-if="openEnsembles.has(item.data.id)">
                          <!-- Sous-ensembles (déroulables) -->
                          <template
                            v-for="se in item.data.ensembles_matieres?.ensembles_matieres_sous_ensembles ?? []"
                            :key="'se-' + se.id">
                            <!-- En-tête sous-ensemble -->
                            <tr
                              class="border-t border-indigo-100 bg-indigo-50/70 dark:border-indigo-800/30 dark:bg-indigo-900/15">
                              <td colspan="3" class="py-2 pr-4 pl-10">
                                <div class="flex items-center gap-2">
                                  <button
                                    type="button"
                                    class="flex h-5 w-5 flex-none items-center justify-center rounded text-indigo-400 transition hover:bg-indigo-100 dark:hover:bg-indigo-800/40"
                                    @click="toggleSubEnsemble(se.id)">
                                    <Icon
                                      :name="
                                        openSubEnsembles.has(se.id) ? 'lucide:chevron-down' : 'lucide:chevron-right'
                                      "
                                      size="13" />
                                  </button>
                                  <Icon
                                    name="lucide:layers"
                                    size="13"
                                    class="flex-none text-indigo-400 dark:text-indigo-500" />
                                  <span class="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                                    {{ se.sous_ensemble?.nom }}
                                  </span>
                                  <span
                                    class="rounded-full bg-indigo-100 px-1.5 py-0.5 text-xs text-indigo-500 dark:bg-indigo-900/30 dark:text-indigo-400">
                                    × {{ se.quantite ?? 1 }} ·
                                    {{ se.sous_ensemble?.ensembles_matieres_lignes?.length ?? 0 }} art.
                                  </span>
                                </div>
                              </td>
                              <td class="px-4 py-2 text-center text-xs text-indigo-400 dark:text-indigo-500">
                                × {{ se.quantite ?? 1 }}
                              </td>
                              <td class="px-4 py-2"></td>
                              <td class="px-4 py-2 text-right whitespace-nowrap">
                                <span class="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                                  {{
                                    fmtPrix(
                                      (se.sous_ensemble?.ensembles_matieres_lignes ?? []).reduce(
                                        (a, l) => a + (l.catalogue_matieres?.prix_ud ?? 0) * (l.quantite || 0),
                                        0
                                      ) * (se.quantite || 1)
                                    )
                                  }}
                                </span>
                              </td>
                              <td></td>
                            </tr>
                            <!-- Articles du sous-ensemble (dépliables) -->
                            <tr
                              v-for="sousligne in openSubEnsembles.has(se.id)
                                ? (se.sous_ensemble?.ensembles_matieres_lignes ?? [])
                                : []"
                              :key="'se-art-' + sousligne.id"
                              class="border-t border-indigo-50/80 bg-indigo-50/20 dark:border-indigo-900/20 dark:bg-indigo-900/5">
                              <td class="py-2 pr-4 pl-16">
                                <span
                                  class="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 font-mono text-xs font-semibold text-indigo-600 ring-1 ring-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-300 dark:ring-indigo-800/40">
                                  {{ sousligne.numero_symbole }}
                                </span>
                              </td>
                              <td class="px-4 py-2">
                                <p class="text-xs font-medium text-gray-700 dark:text-gray-200">
                                  {{ sousligne.catalogue_matieres?.description || '—' }}
                                </p>
                                <p v-if="sousligne.catalogue_matieres?.famille" class="mt-0.5 text-xs text-gray-400">
                                  {{ sousligne.catalogue_matieres.famille }}
                                </p>
                              </td>
                              <td class="px-4 py-2 text-center">
                                <span
                                  class="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                                  {{ sousligne.catalogue_matieres?.unite_distribution || '—' }}
                                </span>
                              </td>
                              <td class="px-4 py-2 text-center text-xs text-gray-500 dark:text-gray-400">
                                {{ sousligne.quantite }}
                              </td>
                              <td
                                class="px-4 py-2 text-right text-xs whitespace-nowrap text-gray-500 dark:text-gray-400">
                                {{ fmtPrix(sousligne.catalogue_matieres?.prix_ud) }}
                              </td>
                              <td
                                class="px-4 py-2 text-right text-xs font-medium whitespace-nowrap text-gray-700 dark:text-gray-300">
                                {{ fmtPrix((sousligne.catalogue_matieres?.prix_ud ?? 0) * (sousligne.quantite || 0)) }}
                              </td>
                              <td></td>
                            </tr>
                          </template>

                          <!-- Articles directs de l'ensemble -->
                          <tr
                            v-for="(sousligne, j) in item.data.ensembles_matieres?.ensembles_matieres_lignes ?? []"
                            :key="sousligne.id"
                            class="border-t border-indigo-100/60 dark:border-indigo-800/20"
                            :class="j % 2 === 0 ? 'bg-indigo-50/30 dark:bg-indigo-900/5' : 'bg-white dark:bg-gray-900'">
                            <td class="py-2 pr-4 pl-10">
                              <span
                                class="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 font-mono text-xs font-semibold text-indigo-600 ring-1 ring-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-300 dark:ring-indigo-800/40">
                                {{ sousligne.numero_symbole }}
                              </span>
                            </td>
                            <td class="px-4 py-2">
                              <p class="text-xs font-medium text-gray-700 dark:text-gray-200">
                                {{ sousligne.catalogue_matieres?.description || '—' }}
                              </p>
                              <p v-if="sousligne.catalogue_matieres?.famille" class="mt-0.5 text-xs text-gray-400">
                                {{ sousligne.catalogue_matieres.famille }}
                              </p>
                            </td>
                            <td class="px-4 py-2 text-center">
                              <span
                                class="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                                {{ sousligne.catalogue_matieres?.unite_distribution || '—' }}
                              </span>
                            </td>
                            <td class="px-4 py-2 text-center text-xs text-gray-500 dark:text-gray-400">
                              {{ sousligne.quantite }}
                            </td>
                            <td class="px-4 py-2 text-right text-xs whitespace-nowrap text-gray-500 dark:text-gray-400">
                              {{ fmtPrix(sousligne.catalogue_matieres?.prix_ud) }}
                            </td>
                            <td
                              class="px-4 py-2 text-right text-xs font-medium whitespace-nowrap text-gray-700 dark:text-gray-300">
                              {{ fmtPrix((sousligne.catalogue_matieres?.prix_ud ?? 0) * (sousligne.quantite || 0)) }}
                            </td>
                            <td></td>
                          </tr>
                        </template>
                      </template>
                    </template>
                  </tbody>
                </table>
              </div>
            </div>
          </template>
        </main>

        <!-- ── Panneau catalogue inline ──────────────────────────────────────────── -->
        <Transition name="catalogue-panel">
          <CommandesMatieresCatalogueSidebar
            v-if="showCatalogue && selectedCommande"
            :existing-symboles="existingSymboles"
            :existing-ensemble-ids="existingEnsembleIds"
            @add="handleAddArticle"
            @add-ensemble="handleAddEnsemble" />
        </Transition>
      </template>
      <!-- ══ Fin onglet Listes ═══════════════════════════════════════════════════ -->

      <!-- ══ Onglet Commandes ════════════════════════════════════════════════════ -->
      <template v-else>
        <!-- ── Colonne gauche : liste des commandes-fusions ───────────────────── -->
        <aside
          class="flex w-68 flex-none flex-col border-r border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/50">
          <!-- Header -->
          <div class="flex items-center justify-between border-b border-gray-200 px-3 py-3 dark:border-gray-700">
            <span class="text-xs font-semibold tracking-widest text-gray-400 uppercase dark:text-gray-500">
              Commandes
              <span
                class="ml-1.5 inline-flex items-center justify-center rounded-full bg-gray-200 px-1.5 py-0.5 text-xs font-bold text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                {{ fusions.length }}
              </span>
            </span>
            <button
              type="button"
              class="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600 text-white transition hover:bg-blue-700 active:scale-95"
              title="Nouvelle commande"
              @click="openCreateFusion">
              <Icon name="lucide:plus" size="14" />
            </button>
          </div>

          <!-- Loader -->
          <div v-if="loadingFusions" class="flex items-center justify-center py-10">
            <div class="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
          </div>

          <!-- Empty -->
          <div v-else-if="fusions.length === 0" class="flex flex-col items-center gap-3 px-4 py-12 text-center">
            <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
              <Icon name="lucide:package-check" size="22" class="text-gray-400" />
            </div>
            <div class="space-y-1">
              <p class="text-sm font-medium text-gray-600 dark:text-gray-300">Aucune commande</p>
              <p class="text-xs text-gray-400">Créez une commande pour fusionner des listes</p>
            </div>
            <button
              type="button"
              class="mt-1 flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
              @click="openCreateFusion">
              <Icon name="lucide:plus" size="12" />
              Nouvelle commande
            </button>
          </div>

          <!-- Liste des fusions -->
          <ul v-else class="flex-1 space-y-0.5 overflow-y-auto p-2">
            <li
              v-for="fusion in fusions"
              :key="fusion.id"
              class="group relative cursor-pointer rounded-lg px-3 py-2.5 transition-all"
              :class="
                selectedFusion?.id === fusion.id
                  ? 'bg-white shadow-sm ring-1 ring-blue-200 dark:bg-gray-800 dark:ring-blue-700/50'
                  : 'hover:bg-white/80 dark:hover:bg-gray-800/60'
              "
              @click="selectedFusion = fusion; searchFusion = ''">
              <span
                v-if="selectedFusion?.id === fusion.id"
                class="absolute inset-y-0 left-0 w-0.5 rounded-l-lg bg-blue-500" />
              <div class="flex items-center justify-between gap-2">
                <div class="min-w-0 flex-1">
                  <p
                    class="truncate text-sm leading-snug font-medium"
                    :class="
                      selectedFusion?.id === fusion.id
                        ? 'text-blue-700 dark:text-blue-300'
                        : 'text-gray-700 dark:text-gray-200'
                    ">
                    {{ fusion.nom }}
                  </p>
                  <p class="mt-0.5 text-xs text-gray-400">
                    {{ new Date(fusion.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) }}
                  </p>
                </div>
                <div
                  class="flex flex-none items-center gap-0.5 transition-opacity"
                  :class="selectedFusion?.id === fusion.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'"
                  @click.stop>
                  <button
                    type="button"
                    class="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                    title="Renommer"
                    @click="openEditFusion(fusion)">
                    <Icon name="lucide:pencil" size="12" />
                  </button>
                  <button
                    type="button"
                    class="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                    title="Supprimer"
                    @click="askDeleteFusion(fusion)">
                    <Icon name="lucide:trash-2" size="12" />
                  </button>
                </div>
              </div>
            </li>
          </ul>
        </aside>

        <!-- ── Zone principale : détail de la fusion ──────────────────────────── -->
        <main class="flex min-w-0 flex-1 flex-col overflow-hidden">
          <!-- Aucune fusion sélectionnée -->
          <div v-if="!selectedFusion" class="flex h-full flex-col items-center justify-center gap-3 text-gray-400">
            <Icon name="lucide:package-check" size="48" class="opacity-30" />
            <p class="text-sm">Sélectionnez une commande ou créez-en une nouvelle</p>
            <button
              type="button"
              class="mt-2 flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              @click="openCreateFusion">
              <Icon name="lucide:plus" size="16" />
              Nouvelle commande
            </button>
          </div>

          <template v-else>
            <!-- Header fusion -->
            <div
              class="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-900">
              <div class="flex min-w-0 flex-1 items-center gap-3">
                <div class="shrink-0">
                  <h2 class="text-lg font-semibold text-gray-800 dark:text-white">{{ selectedFusion.nom }}</h2>
                  <p class="mt-0.5 text-xs text-gray-400">
                    {{ fusionItems.length }} référence{{ fusionItems.length > 1 ? 's' : '' }} ·
                    Créée le {{ new Date(selectedFusion.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) }}
                  </p>
                </div>
                <div class="relative min-w-0 flex-1 max-w-xs">
                  <Icon name="lucide:search" size="14" class="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    v-model="searchFusion"
                    type="text"
                    placeholder="Rechercher un article…"
                    class="w-full rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-8 pr-3 text-sm text-gray-700 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-1 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:placeholder-gray-500 dark:focus:border-blue-500 dark:focus:bg-gray-700"
                  />
                </div>
              </div>
              <div class="flex items-center gap-2">
                <!-- Total estimé -->
                <div
                  class="hidden rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm sm:block dark:border-gray-700 dark:bg-gray-800">
                  <span class="text-gray-500 dark:text-gray-400">Total estimé : </span>
                  <span class="font-semibold text-gray-800 dark:text-white">{{ fmtPrix(fusionTotal) }}</span>
                </div>
                <!-- Export -->
                <button
                  type="button"
                  :disabled="!fusionItems.length"
                  class="flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400"
                  @click="handleExport"
                >
                  <Icon name="lucide:file-down" size="15" />
                  Exporter
                </button>
              </div>
            </div>

            <!-- Loader données listes -->
            <div v-if="loadingFusionData" class="flex items-center justify-center py-16">
              <div class="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
            </div>

            <div v-else class="flex min-h-0 flex-1 overflow-hidden">
              <div class="flex min-h-0 flex-1 flex-col overflow-hidden">
                <!-- Sélection des listes -->
                <div
                  class="flex-none border-b border-gray-200 bg-gray-50/50 px-6 py-3 dark:border-gray-700 dark:bg-gray-800/30">
                  <p class="mb-2 text-xs font-semibold tracking-wider text-gray-400 uppercase dark:text-gray-500">
                    Listes incluses
                  </p>
                  <div class="flex flex-wrap gap-2">
                    <label
                      v-for="commande in commandes"
                      :key="commande.id"
                      class="flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition"
                      :class="
                        isListeInFusion(commande.id)
                          ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700/50 dark:bg-blue-900/20 dark:text-blue-300'
                          : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      ">
                      <input
                        type="checkbox"
                        class="sr-only"
                        :checked="isListeInFusion(commande.id)"
                        @change="toggleListeInFusion(commande)" />
                      <Icon :name="isListeInFusion(commande.id) ? 'lucide:check-square' : 'lucide:square'" size="13" />
                      {{ commande.nom }}
                    </label>
                    <span v-if="commandes.length === 0" class="text-xs text-gray-400">Aucune liste disponible</span>
                  </div>
                </div>

                <!-- Tableau fusion -->
                <div class="flex-1 overflow-auto">
                  <!-- Empty -->
                  <div
                    v-if="fusionItemsFiltres.length === 0"
                    class="flex flex-col items-center gap-3 py-16 text-center text-gray-400">
                    <Icon name="lucide:package-open" size="48" class="opacity-30" />
                    <p class="text-sm">
                      <template v-if="(selectedFusion.commandes_matieres_fusions_listes?.length ?? 0) === 0">
                        Cochez des listes ci-dessus pour voir les articles
                      </template>
                      <template v-else>Aucun article dans les listes sélectionnées</template>
                    </p>
                  </div>

                  <table v-else class="w-full text-sm">
                    <thead class="sticky top-0 z-10">
                      <tr class="border-y border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/90">
                        <th class="px-4 py-2.5 text-left text-xs font-semibold tracking-wider text-gray-400 uppercase">
                          N° Symbole
                        </th>
                        <th class="px-4 py-2.5 text-left text-xs font-semibold tracking-wider text-gray-400 uppercase">
                          Désignation
                        </th>
                        <th class="px-4 py-2.5 text-left text-xs font-semibold tracking-wider text-gray-400 uppercase">
                          Unité de distribution
                        </th>
                        <th
                          class="w-28 px-4 py-2.5 text-center text-xs font-semibold tracking-wider text-gray-400 uppercase">
                          Qté demandée
                        </th>
                        <th
                          class="w-28 px-4 py-2.5 text-center text-xs font-semibold tracking-wider text-gray-400 uppercase">
                          Qté à commander
                        </th>
                        <th class="px-4 py-2.5 text-right text-xs font-semibold tracking-wider text-gray-400 uppercase">
                          Prix unit.
                        </th>
                        <th class="px-4 py-2.5 text-right text-xs font-semibold tracking-wider text-gray-400 uppercase">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="(item, i) in fusionItemsFiltres"
                        :key="item.catalogue?.numero_symbole ?? i"
                        class="border-t border-gray-100 dark:border-gray-700/50"
                        :class="i % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/20'">
                        <td class="px-4 py-2.5">
                          <span
                            class="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 font-mono text-xs font-semibold text-blue-700 ring-1 ring-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:ring-blue-800/40">
                            {{ item.catalogue?.numero_symbole ?? '—' }}
                          </span>
                        </td>
                        <td class="px-4 py-2.5">
                          <p class="text-xs font-medium text-gray-700 dark:text-gray-200">
                            {{ item.catalogue?.description || '—' }}
                          </p>
                          <p v-if="item.catalogue?.famille" class="mt-0.5 text-xs text-gray-400">
                            {{ item.catalogue.famille }}
                          </p>
                        </td>
                        <td class="px-4 py-2.5">
                          <span class="inline-flex items-center gap-1.5">
                            <span
                              class="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                              {{ item.catalogue?.unite_distribution || '—' }}
                            </span>
                            <span v-if="item.ud?.designation" class="text-xs text-gray-400 dark:text-gray-500">
                              {{ item.ud.designation }}
                            </span>
                          </span>
                        </td>
                        <td class="px-4 py-2.5 text-center text-sm font-semibold text-gray-800 dark:text-gray-100">
                          {{ item.quantite }}
                        </td>
                        <td class="px-4 py-2.5 text-center">
                          <span
                            class="text-sm font-semibold"
                            :class="
                              qteACommander(item) !== item.quantite
                                ? 'text-orange-600 dark:text-orange-400'
                                : 'text-gray-400 dark:text-gray-500'
                            ">
                            {{ qteACommander(item) }}
                          </span>
                        </td>
                        <td class="px-4 py-2.5 text-right text-xs whitespace-nowrap text-gray-500 dark:text-gray-400">
                          {{ fmtPrix(item.catalogue?.prix_ud) }}
                        </td>
                        <td class="px-4 py-2.5 text-right whitespace-nowrap">
                          <span class="text-sm font-semibold text-gray-800 dark:text-gray-100">
                            {{ fmtPrix((item.catalogue?.prix_ud ?? 0) * item.quantite) }}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </template>
        </main>
      </template>
      <!-- ══ Fin onglet Commandes ════════════════════════════════════════════════ -->

      <!-- ── Modal : créer / modifier une commande ─────────────────────────────── -->
      <AppModal v-model="showFormCommande" size="md">
        <template #header>
          <h3 class="text-base font-semibold text-gray-800 dark:text-white">
            {{ editingCommande ? 'Modifier la liste' : 'Nouvelle liste' }}
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
              <div
                v-if="savingCommande"
                class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              {{ editingCommande ? 'Enregistrer' : 'Créer la liste' }}
            </button>
          </div>
        </template>
      </AppModal>

      <!-- ── Modal : confirmer suppression commande ────────────────────────────── -->
      <AppModal v-model="showDeleteCommande" size="sm">
        <template #header>
          <h3 class="text-base font-semibold text-gray-800 dark:text-white">Supprimer la liste</h3>
        </template>
        <p class="text-sm text-gray-600 dark:text-gray-300">
          Êtes-vous sûr de vouloir supprimer la liste
          <strong>« {{ commandeToDelete?.nom }} »</strong>
          et tous ses articles ? Cette action est irréversible.
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

      <!-- ── Modal : confirmer suppression article ─────────────────────────────── -->
      <AppModal v-model="showDeleteLigne" size="sm">
        <template #header>
          <h3 class="text-base font-semibold text-gray-800 dark:text-white">Retirer l'article</h3>
        </template>
        <p class="text-sm text-gray-600 dark:text-gray-300">
          Retirer l'article
          <strong class="font-mono">{{ ligneToDelete?.numero_symbole }}</strong>
          de cette liste ?
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

      <!-- ── Modal : confirmer retrait ensemble ────────────────────────────────── -->
      <AppModal v-model="showDeleteEnsemble" size="sm">
        <template #header>
          <h3 class="text-base font-semibold text-gray-800 dark:text-white">Retirer l'ensemble</h3>
        </template>
        <p class="text-sm text-gray-600 dark:text-gray-300">
          Retirer l'ensemble
          <strong>« {{ ensembleCommandeToDelete?.ensembles_matieres?.nom }} »</strong>
          de cette liste ?
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
      <!-- ── Modal fusion : créer / renommer ──────────────────────────────────── -->
      <AppModal v-model="showFormFusion" size="sm">
        <template #header>
          <h3 class="text-base font-semibold text-gray-800 dark:text-white">
            {{ editingFusion ? 'Renommer la commande' : 'Nouvelle commande' }}
          </h3>
        </template>
        <form @submit.prevent="submitFusion">
          <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Nom *</label>
          <input
            v-model="formFusionNom"
            type="text"
            placeholder="Ex : Commande principale"
            required
            autofocus
            class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 transition outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
        </form>
        <template #footer>
          <div class="flex justify-end gap-3">
            <button
              type="button"
              class="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              @click="showFormFusion = false">
              Annuler
            </button>
            <button
              type="button"
              :disabled="!formFusionNom.trim() || savingFusion"
              class="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
              @click="submitFusion">
              <div
                v-if="savingFusion"
                class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              {{ editingFusion ? 'Renommer' : 'Créer' }}
            </button>
          </div>
        </template>
      </AppModal>

      <!-- ── Modal fusion : confirmer suppression ───────────────────────────────── -->
      <AppModal v-model="showDeleteFusion" size="sm">
        <template #header>
          <h3 class="text-base font-semibold text-gray-800 dark:text-white">Supprimer la commande</h3>
        </template>
        <p class="text-sm text-gray-600 dark:text-gray-300">
          Supprimer la commande
          <strong>« {{ fusionToDelete?.nom }} »</strong>
          ? Les listes associées ne seront pas supprimées.
        </p>
        <template #footer>
          <div class="flex justify-end gap-3">
            <button
              type="button"
              class="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              @click="showDeleteFusion = false">
              Annuler
            </button>
            <button
              type="button"
              class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              @click="confirmDeleteFusion">
              Supprimer
            </button>
          </div>
        </template>
      </AppModal>

      <!-- ── Modale import xlsx ──────────────────────────────────────────────── -->
      <CommandesMatieresImportModal
        :open="showImport"
        :chantier-id="chantier.id"
        :commandes="commandes"
        @close="showImport = false"
        @imported="handleImported" />

      <!-- ── Modale fusionner listes ────────────────────────────────────────── -->
      <CommandesMatieresFusionnerModal
        :open="showFusionner"
        :commande-source="commandeToMerge"
        :commandes="commandes"
        @close="showFusionner = false; commandeToMerge = null"
        @merged="handleMerged" />

    </div>
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
