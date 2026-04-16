<script setup>
const props = defineProps({
  chantier: { type: Object, required: true }
})

const { getCommandes, createCommande, updateCommande, deleteCommande, duplicateCommande, getLignes, addLigne, updateLigne, deleteLigne } =
  useCommandesMatieres()

const { getEnsemblesCommande, addEnsembleToCommande, updateEnsembleCommande, removeEnsembleFromCommande } =
  useEnsemblesMatieres()

const { getFusions, createFusion, updateFusion, deleteFusion, validerFusion,
  addListeToFusion, getFusionLignes, addFusionLigne, updateFusionLigne,
  deleteFusionLigne, bulkInsertFusionLignes } = useCommandesFusions()

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
const openFusionDropdownId = ref(null)

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

// ─── Liste affichée : données normalisées pour le composant tableBody ────────
const searchArticle = ref('')

// Normalise ensemblesCommande → shape attendue par EnsemblesMatieresTableBody
// Un ensemble est conservé si son nom, ses articles ou les articles de ses sous-ensembles matchent
const ensemblesNormalized = computed(() => {
  const q = searchArticle.value.trim().toLowerCase()
  return ensemblesCommande.value
    .filter((e) => {
      if (!q) return true
      if ((e.ensembles_matieres?.nom ?? '').toLowerCase().includes(q)) return true
      const matchLigne = (l) =>
        (l.numero_symbole ?? '').toLowerCase().includes(q) ||
        (l.catalogue_matieres?.description ?? '').toLowerCase().includes(q)
      if ((e.ensembles_matieres?.ensembles_matieres_lignes ?? []).some(matchLigne)) return true
      return (e.ensembles_matieres?.ensembles_matieres_sous_ensembles ?? []).some((se) =>
        (se.sous_ensemble?.ensembles_matieres_lignes ?? []).some(matchLigne)
      )
    })
    .map((e) => ({ id: e.id, quantite: e.quantite, sous_ensemble: e.ensembles_matieres }))
})

// Articles directs filtrés par recherche (tri délégué au composant)
const lignesFiltered = computed(() => {
  const q = searchArticle.value.trim().toLowerCase()
  if (!q) return lignes.value
  return lignes.value.filter((l) => {
    const symbole = (l.numero_symbole ?? '').toLowerCase()
    const desc = (l.catalogue_matieres?.description ?? '').toLowerCase()
    return symbole.includes(q) || desc.includes(q)
  })
})

const hasItems = computed(() => lignes.value.length > 0 || ensemblesCommande.value.length > 0)

// Nombre total d'articles de la liste (directs + dans les ensembles et sous-ensembles)
const totalArticles = computed(() => {
  const direct = lignes.value.length
  const fromEnsembles = ensemblesCommande.value.reduce((acc, e) => {
    const directSe = e.ensembles_matieres?.ensembles_matieres_lignes?.length ?? 0
    const fromSubs = (e.ensembles_matieres?.ensembles_matieres_sous_ensembles ?? []).reduce(
      (a, se) => a + (se.sous_ensemble?.ensembles_matieres_lignes?.length ?? 0), 0
    )
    return acc + directSe + fromSubs
  }, 0)
  return direct + fromEnsembles
})

// ─── Formatage ────────────────────────────────────────────────────────────────
const fmtPrix = (v) => {
  if (v == null) return '—'
  return Number(v).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
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

// ─── Commandes (fusions — snapshots statiques) ───────────────────────────────
const fusions = ref([])
const selectedFusion = ref(null)
const loadingFusions = ref(false)

// Lignes statiques de la commande sélectionnée
const fusionLignes = ref([])
const loadingFusionLignes = ref(false)

// Sidebar catalogue pour commandes
const showCatalogueCommande = ref(false)

// Modales fusion
const showFormFusion = ref(false)
const editingFusion = ref(null)
const formFusionNom = ref('')
const formFusionDescription = ref('')
const formFusionSourceIds = ref([])   // listes sources sélectionnées à la création
const savingFusion = ref(false)
const showDeleteFusion = ref(false)
const fusionToDelete = ref(null)

// Modale suppression ligne commande
const showDeleteFusionLigne = ref(false)
const fusionLigneToDelete = ref(null)

// Modale validation commande
const showConfirmValider = ref(false)

// Import commande (mode='commande')
const showImportCommande = ref(false)

// Référentiel UD — Map<code, { designation, quantite_par_unite }>
const udMap = ref(new Map())
const client = useSupabaseClient()

const loadUdMap = async () => {
  if (udMap.value.size > 0) return
  const { data } = await client.from('catalogue_unites_distribution').select('code, designation, quantite_par_unite')
  if (data) udMap.value = new Map(data.map((r) => [r.code, r]))
}

watch(activeTab, (tab) => {
  if (tab === 'commandes') loadUdMap()
})

// ─── CRUD fusions ─────────────────────────────────────────────────────────────
const openCreateFusion = () => {
  editingFusion.value = null
  formFusionNom.value = ''
  formFusionDescription.value = ''
  formFusionSourceIds.value = []
  showFormFusion.value = true
}

const openEditFusion = (fusion) => {
  editingFusion.value = fusion
  formFusionNom.value = fusion.nom
  formFusionDescription.value = fusion.description || ''
  showFormFusion.value = true
}

const submitFusion = async () => {
  if (!formFusionNom.value.trim()) return
  savingFusion.value = true

  if (editingFusion.value) {
    // Renommer / modifier
    const updated = await updateFusion(editingFusion.value.id, { nom: formFusionNom.value.trim(), description: formFusionDescription.value.trim() || null })
    if (updated) {
      const idx = fusions.value.findIndex((f) => f.id === updated.id)
      if (idx !== -1) fusions.value[idx] = { ...fusions.value[idx], nom: updated.nom, description: updated.description }
      if (selectedFusion.value?.id === updated.id)
        selectedFusion.value = { ...selectedFusion.value, nom: updated.nom, description: updated.description }
    }
  } else {
    // Créer la commande
    const created = await createFusion(props.chantier.id, formFusionNom.value.trim(), formFusionDescription.value.trim() || null)
    if (created) {
      // Stocker les listes sources comme métadonnée d'audit
      for (const commandeId of formFusionSourceIds.value) {
        await addListeToFusion(created.id, commandeId)
      }
      // Construire le snapshot : fusionner les lignes des listes sources (directs + ensembles)
      if (formFusionSourceIds.value.length > 0) {
        await loadUdMap()
        const [allLignes, allEnsembles] = await Promise.all([
          Promise.all(formFusionSourceIds.value.map((id) => getLignes(id))),
          Promise.all(formFusionSourceIds.value.map((id) => getEnsemblesCommande(id))),
        ])
        const map = new Map()
        const addQty = (symbole, qty) => {
          const prev = map.get(symbole)
          map.set(symbole, { symbole, quantite: (prev?.quantite ?? 0) + (qty || 0) })
        }
        // Articles directs
        for (const ls of allLignes) {
          for (const l of ls) addQty(l.numero_symbole, l.quantite)
        }
        // Articles issus des ensembles et sous-ensembles
        for (const es of allEnsembles) {
          for (const item of es) {
            const qEnsemble = item.quantite || 1
            for (const l of (item.ensembles_matieres?.ensembles_matieres_lignes ?? [])) {
              addQty(l.numero_symbole, qEnsemble * (l.quantite || 0))
            }
            for (const se of (item.ensembles_matieres?.ensembles_matieres_sous_ensembles ?? [])) {
              const qSe = se.quantite || 1
              for (const l of (se.sous_ensemble?.ensembles_matieres_lignes ?? [])) {
                addQty(l.numero_symbole, qEnsemble * qSe * (l.quantite || 0))
              }
            }
          }
        }
        await bulkInsertFusionLignes(created.id, [...map.values()])
      }
      fusions.value.unshift(created)
      await selectFusion(created)
    }
  }
  savingFusion.value = false
  showFormFusion.value = false
  formFusionSourceIds.value = []
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
    if (selectedFusion.value?.id === fusionToDelete.value.id) {
      selectedFusion.value = null
      fusionLignes.value = []
    }
  }
  showDeleteFusion.value = false
  fusionToDelete.value = null
}

// ─── Sélection d'une commande → charge son snapshot ──────────────────────────
const searchFusion = ref('')

const selectFusion = async (fusion) => {
  selectedFusion.value = fusion
  showCatalogueCommande.value = false
  searchFusion.value = ''
  loadingFusionLignes.value = true
  fusionLignes.value = await getFusionLignes(fusion.id)
  loadingFusionLignes.value = false
}

// ─── Handlers articles d'une commande ────────────────────────────────────────
const fusionExistingSymboles = computed(() => fusionLignes.value.map((l) => l.numero_symbole))

const handleAddFusionArticle = async ({ article, quantite }) => {
  if (!selectedFusion.value) return
  const ligne = await addFusionLigne(selectedFusion.value.id, article.numero_symbole, quantite, fusionLignes.value.length)
  if (ligne) fusionLignes.value.push(ligne)
}

const handleUpdateFusionQuantite = async (ligne, value) => {
  const qty = value === '' || value == null ? 0 : Number(value)
  const idx = fusionLignes.value.findIndex((l) => l.id === ligne.id)
  if (idx !== -1) fusionLignes.value[idx] = { ...fusionLignes.value[idx], quantite: qty }
  await updateFusionLigne(ligne.id, { quantite: qty })
}

const handleUpdateFusionNotes = async (ligne, value) => {
  const idx = fusionLignes.value.findIndex((l) => l.id === ligne.id)
  if (idx !== -1) fusionLignes.value[idx] = { ...fusionLignes.value[idx], notes: value }
  await updateFusionLigne(ligne.id, { notes: value })
}

const askDeleteFusionLigne = (ligne) => {
  fusionLigneToDelete.value = ligne
  showDeleteFusionLigne.value = true
}

const confirmDeleteFusionLigne = async () => {
  if (!fusionLigneToDelete.value) return
  const ok = await deleteFusionLigne(fusionLigneToDelete.value.id)
  if (ok) fusionLignes.value = fusionLignes.value.filter((l) => l.id !== fusionLigneToDelete.value.id)
  showDeleteFusionLigne.value = false
  fusionLigneToDelete.value = null
}

// ─── Validation commande ──────────────────────────────────────────────────────
const confirmValider = async () => {
  if (!selectedFusion.value) return
  const updated = await validerFusion(selectedFusion.value.id)
  if (updated) {
    const idx = fusions.value.findIndex((f) => f.id === updated.id)
    if (idx !== -1) fusions.value[idx] = { ...fusions.value[idx], validee: true, valide_at: updated.valide_at }
    selectedFusion.value = { ...selectedFusion.value, validee: true, valide_at: updated.valide_at }
  }
  showConfirmValider.value = false
}

// ─── Import commande XLSX ─────────────────────────────────────────────────────
const handleImportedCommande = async ({ commande }) => {
  fusions.value.unshift(commande)
  showImportCommande.value = false
  await selectFusion(commande)
}

// ─── Filtres + calculs ────────────────────────────────────────────────────────
const fusionLignesFiltered = computed(() => {
  const q = searchFusion.value.trim().toLowerCase()
  if (!q) return fusionLignes.value
  return fusionLignes.value.filter((l) => {
    const symbole = (l.numero_symbole ?? '').toLowerCase()
    const desc = (l.catalogue_matieres?.description ?? '').toLowerCase()
    return symbole.includes(q) || desc.includes(q)
  })
})

const fusionTotalEstime = computed(() =>
  fusionLignes.value.reduce((acc, l) => acc + (l.catalogue_matieres?.prix_ud ?? 0) * (l.quantite || 0), 0)
)

const qteACommander = (ligne) => {
  const udCode = ligne.catalogue_matieres?.unite_distribution
  const qpu = udMap.value.get(udCode)?.quantite_par_unite
  if (!qpu || qpu <= 1) return ligne.quantite
  return Math.ceil(ligne.quantite / qpu)
}

// ─── Export TXT ERP ───────────────────────────────────────────────────────────
const slugify = (s) => s.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')

const handleExport = async () => {
  if (!selectedFusion.value || !fusionLignes.value.length) return

  await loadUdMap()
  const CHUNK_SIZE = 50
  const items  = fusionLignes.value
  const compte = props.chantier?.compte ?? ''
  const nom    = slugify(`${compte} - ${selectedFusion.value.nom}`) || 'export'
  const chunks = []

  for (let i = 0; i < items.length; i += CHUNK_SIZE) {
    const slice   = items.slice(i, i + CHUNK_SIZE)
    const content = slice
      .map((item) => {
        const symbole = item.numero_symbole ?? ''
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
  a.download = `${nom}.zip`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Chargement initial ───────────────────────────────────────────────────────
onMounted(async () => {
  loadingCommandes.value = true
  ;[commandes.value, fusions.value] = await Promise.all([
    getCommandes(props.chantier.id),
    getFusions(props.chantier.id),
  ])
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
          class="-mb-px border-b-2 px-4 py-2.5 text-base font-medium transition"
          :class="
            activeTab === 'listes'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          "
          @click="activeTab = 'listes'">
          <Icon name="lucide:list" size="16" class="mr-1.5 inline" />
          Listes
          <span
            v-if="commandes.length > 0"
            class="ml-1.5 inline-flex items-center justify-center rounded-full bg-gray-200 px-1.5 py-0.5 text-sm font-bold text-gray-500 dark:bg-gray-700 dark:text-gray-400">
            {{ commandes.length }}
          </span>
        </button>
        <button
          type="button"
          class="-mb-px border-b-2 px-4 py-2.5 text-base font-medium transition"
          :class="
            activeTab === 'commandes'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          "
          @click="activeTab = 'commandes'">
          <Icon name="lucide:package-check" size="16" class="mr-1.5 inline" />
          Commandes
          <span
            v-if="fusions.length > 0"
            class="ml-1.5 inline-flex items-center justify-center rounded-full bg-gray-200 px-1.5 py-0.5 text-sm font-bold text-gray-500 dark:bg-gray-700 dark:text-gray-400">
            {{ fusions.length }}
          </span>
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
          <div class="flex gap-1.5 border-b border-gray-200 p-2 dark:border-gray-700">
            <button
              type="button"
              class="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-gray-200 bg-white py-1.5 text-sm font-medium leading-none text-gray-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400"
              @click="showImport = true">
              <Icon name="lucide:file-up" size="14" />
              Importer
            </button>
            <button
              type="button"
              class="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-blue-600 bg-blue-600 py-1.5 text-sm font-medium leading-none text-white transition hover:border-blue-700 hover:bg-blue-700 active:scale-95"
              @click="openCreateCommande">
              <Icon name="lucide:plus" size="14" />
              Créer
            </button>
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
            <button
              type="button"
              class="mt-1 flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
              @click="openCreateCommande">
              <Icon name="lucide:plus" size="14" />
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
                  <p v-if="commande.description" class="mt-0.5 truncate text-sm text-gray-400 dark:text-gray-500">
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
            <!-- Header de la commande -->
            <div
              class="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-900">
              <div class="flex min-w-0 flex-1 items-center gap-3">
                <div class="shrink-0">
                  <h2 class="text-lg font-semibold text-gray-800 dark:text-white">{{ selectedCommande.nom }}</h2>
                  <p class="text-sm text-gray-400 dark:text-gray-500">{{ totalArticles }} article{{ totalArticles !== 1 ? 's' : '' }}</p>
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
                <div
                  class="hidden rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-base sm:block dark:border-gray-700 dark:bg-gray-800">
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
                <p class="text-base">Aucun article dans cette liste</p>
                <button
                  type="button"
                  class="mt-1 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-base font-medium text-blue-600 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                  @click="showCatalogue = true">
                  <Icon name="lucide:package-search" size="18" />
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
                        class="px-4 py-2.5 text-left text-sm font-semibold tracking-wider text-gray-400 uppercase dark:text-gray-500">
                        N° Symbole
                      </th>
                      <th
                        class="px-4 py-2.5 text-left text-sm font-semibold tracking-wider text-gray-400 uppercase dark:text-gray-500">
                        Désignation
                      </th>
                      <th
                        class="px-4 py-2.5 text-center text-sm font-semibold tracking-wider text-gray-400 uppercase dark:text-gray-500">
                        UD
                      </th>
                      <th
                        class="w-32 px-4 py-2.5 text-center text-sm font-semibold tracking-wider text-gray-400 uppercase dark:text-gray-500">
                        Quantité
                      </th>
                      <th
                        class="px-4 py-2.5 text-right text-sm font-semibold tracking-wider text-gray-400 uppercase dark:text-gray-500">
                        Prix unit.
                      </th>
                      <th
                        class="px-4 py-2.5 text-right text-sm font-semibold tracking-wider text-gray-400 uppercase dark:text-gray-500">
                        Total
                      </th>
                      <th
                        class="w-48 px-4 py-2.5 text-left text-sm font-semibold tracking-wider text-gray-400 uppercase dark:text-gray-500">
                        Notes
                      </th>
                      <th class="w-10 px-2 py-2.5"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <EnsemblesMatieresTableBody
                      :key="selectedCommande?.id"
                      :lignes="lignesFiltered"
                      :sous-ensembles="ensemblesNormalized"
                      :show-notes="true"
                      @update-quantite-ligne="handleUpdateQuantite"
                      @update-notes-ligne="handleUpdateNotes"
                      @delete-ligne="askDeleteLigne"
                      @update-quantite-se="(item, val) => handleUpdateEnsembleQuantite(ensemblesCommande.find(e => e.id === item.id), val)"
                      @delete-se="(item) => askDeleteEnsembleCommande(ensemblesCommande.find(e => e.id === item.id))"
                    />
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
          <div class="flex gap-1.5 border-b border-gray-200 p-2 dark:border-gray-700">
            <button
              type="button"
              class="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-gray-200 bg-white py-1.5 text-sm font-medium leading-none text-gray-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400"
              @click="showImportCommande = true">
              <Icon name="lucide:file-up" size="14" />
              Importer
            </button>
            <button
              type="button"
              class="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-blue-600 bg-blue-600 py-1.5 text-sm font-medium leading-none text-white transition hover:border-blue-700 hover:bg-blue-700 active:scale-95"
              @click="openCreateFusion">
              <Icon name="lucide:plus" size="14" />
              Créer
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
              <p class="text-sm text-gray-400">Créez votre première commande</p>
            </div>
            <button
              type="button"
              class="mt-1 flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
              @click="openCreateFusion">
              <Icon name="lucide:plus" size="14" />
              Nouvelle commande
            </button>
          </div>

          <!-- Liste des fusions -->
          <ul v-else class="flex-1 space-y-0.5 overflow-y-auto p-2">
            <li
              v-for="fusion in fusions"
              :key="fusion.id"
              class="group relative cursor-pointer overflow-hidden rounded-lg px-3 py-2.5 transition-all"
              :class="
                selectedFusion?.id === fusion.id
                  ? 'bg-white shadow-sm ring-1 ring-blue-200 dark:bg-gray-800 dark:ring-blue-700/50'
                  : 'hover:bg-white/80 dark:hover:bg-gray-800/60'
              "
              @click="selectFusion(fusion)">
              <span
                v-if="selectedFusion?.id === fusion.id"
                class="absolute inset-y-0 left-0 w-0.5 rounded-l-lg bg-blue-500" />
              <div class="flex items-center justify-between gap-2">
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-1.5">
                    <p
                      class="truncate text-sm leading-snug font-medium"
                      :class="
                        selectedFusion?.id === fusion.id
                          ? 'text-blue-700 dark:text-blue-300'
                          : 'text-gray-700 dark:text-gray-200'
                      ">
                      {{ fusion.nom }}
                    </p>
                    <span
                      v-if="fusion.validee"
                      class="inline-flex flex-none items-center gap-0.5 rounded bg-green-100 px-1 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      <Icon name="lucide:lock" size="10" />
                      Validée
                    </span>
                  </div>
                  <p v-if="fusion.description" class="mt-0.5 truncate text-sm text-gray-400 dark:text-gray-500">
                    {{ fusion.description }}
                  </p>
                  <p v-else class="mt-0.5 text-sm text-gray-400">
                    {{ new Date(fusion.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) }}
                  </p>
                </div>
                <div
                  class="flex flex-none items-center transition-opacity"
                  :class="selectedFusion?.id === fusion.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'"
                  @click.stop>
                  <AppDropdownMenu
                    :open="openFusionDropdownId === fusion.id"
                    @update:open="(v) => openFusionDropdownId = v ? fusion.id : null">
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
                        @click="openFusionDropdownId = null; openEditFusion(fusion)">
                        <Icon name="lucide:pencil" size="13" class="text-gray-400" />
                        Renommer
                      </button>
                      <button
                        type="button"
                        class="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                        @click="openFusionDropdownId = null; askDeleteFusion(fusion)">
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

        <!-- ── Zone principale : détail de la fusion ──────────────────────────── -->
        <main class="flex min-w-0 flex-1 flex-col overflow-hidden">
          <!-- Aucune fusion sélectionnée -->
          <div v-if="!selectedFusion" class="flex h-full flex-col items-center justify-center gap-3 text-gray-400">
            <Icon name="lucide:package-check" size="48" class="opacity-30" />
            <p class="text-base">Sélectionnez une commande ou créez-en une nouvelle</p>
            <button
              type="button"
              class="mt-2 flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-base font-medium text-white hover:bg-blue-700"
              @click="openCreateFusion">
              <Icon name="lucide:plus" size="18" />
              Nouvelle commande
            </button>
          </div>

          <template v-else>
            <!-- Header fusion -->
            <div
              class="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-900">
              <div class="flex min-w-0 flex-1 items-center gap-3">
                <div class="shrink-0">
                  <div class="flex items-center gap-2">
                    <h2 class="text-lg font-semibold text-gray-800 dark:text-white">{{ selectedFusion.nom }}</h2>
                    <span
                      v-if="selectedFusion.validee"
                      class="inline-flex items-center gap-1 rounded-md bg-green-100 px-2 py-0.5 text-sm font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      <Icon name="lucide:lock" size="13" />
                      Validée
                    </span>
                  </div>
                  <p class="mt-0.5 text-sm text-gray-400">
                    {{ fusionLignes.length }} article{{ fusionLignes.length !== 1 ? 's' : '' }} ·
                    Créée le {{ new Date(selectedFusion.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) }}
                  </p>
                </div>
                <div class="relative min-w-0 flex-1 max-w-xs">
                  <Icon name="lucide:search" size="16" class="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    v-model="searchFusion"
                    type="text"
                    placeholder="Rechercher un article…"
                    class="w-full rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-9 pr-3 text-base text-gray-700 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-1 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:placeholder-gray-500 dark:focus:border-blue-500 dark:focus:bg-gray-700"
                  />
                </div>
              </div>
              <div class="flex items-center gap-2">
                <!-- Total estimé -->
                <div
                  class="hidden rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-base sm:block dark:border-gray-700 dark:bg-gray-800">
                  <span class="text-gray-500 dark:text-gray-400">Total estimé : </span>
                  <span class="font-semibold text-gray-800 dark:text-white">{{ fmtPrix(fusionTotalEstime) }}</span>
                </div>
                <!-- Valider (si pas encore validée) -->
                <button
                  v-if="!selectedFusion.validee"
                  type="button"
                  :disabled="fusionLignes.length === 0"
                  class="flex cursor-pointer items-center gap-1.5 rounded-lg border border-green-300 bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700 transition hover:border-green-400 hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-green-700/50 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30"
                  @click="showConfirmValider = true">
                  <Icon name="lucide:check-circle" size="15" />
                  Valider
                </button>
                <!-- Export (si validée) -->
                <button
                  v-if="selectedFusion.validee"
                  type="button"
                  :disabled="fusionLignes.length === 0"
                  class="flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400"
                  @click="handleExport">
                  <Icon name="lucide:file-down" size="15" />
                  Exporter
                </button>
                <!-- Bouton ajouter article (si pas validée) -->
                <button
                  v-if="!selectedFusion.validee"
                  type="button"
                  :title="showCatalogueCommande ? 'Fermer le catalogue' : 'Ajouter un article'"
                  class="flex h-9 w-9 items-center justify-center rounded-lg border transition"
                  :class="
                    showCatalogueCommande
                      ? 'border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:border-blue-700/50 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30'
                      : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                  "
                  @click="showCatalogueCommande = !showCatalogueCommande">
                  <Icon :name="showCatalogueCommande ? 'lucide:panel-right-close' : 'lucide:plus'" size="16" />
                </button>
              </div>
            </div>

            <!-- Loader lignes -->
            <div v-if="loadingFusionLignes" class="flex items-center justify-center py-16">
              <div class="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
            </div>

            <!-- Table des articles -->
            <div v-else class="flex-1 overflow-auto">
              <!-- Empty -->
              <div v-if="fusionLignes.length === 0" class="flex flex-col items-center gap-3 px-6 py-16 text-center text-gray-400">
                <Icon name="lucide:package-open" size="48" class="opacity-30" />
                <p class="text-base">Aucun article dans cette commande</p>
                <button
                  v-if="!selectedFusion.validee"
                  type="button"
                  class="mt-1 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                  @click="showCatalogueCommande = true">
                  <Icon name="lucide:package-search" size="18" />
                  Parcourir le catalogue
                </button>
              </div>

              <!-- Tableau articles plat -->
              <table v-else class="w-full text-sm">
                <thead class="sticky top-0 z-10">
                  <tr class="border-y border-gray-200 bg-gray-50 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/90">
                    <th class="px-4 py-2.5 text-left text-sm font-semibold tracking-wider text-gray-400 uppercase dark:text-gray-500">
                      N° Symbole
                    </th>
                    <th class="px-4 py-2.5 text-left text-sm font-semibold tracking-wider text-gray-400 uppercase dark:text-gray-500">
                      Désignation
                    </th>
                    <th class="px-4 py-2.5 text-left text-sm font-semibold tracking-wider text-gray-400 uppercase dark:text-gray-500">
                      UD
                    </th>
                    <th class="w-28 px-4 py-2.5 text-center text-sm font-semibold tracking-wider text-gray-400 uppercase dark:text-gray-500">
                      Qté demandée
                    </th>
                    <th class="w-28 px-4 py-2.5 text-center text-sm font-semibold tracking-wider text-gray-400 uppercase dark:text-gray-500">
                      Qté à commander
                    </th>
                    <th class="px-4 py-2.5 text-right text-sm font-semibold tracking-wider text-gray-400 uppercase dark:text-gray-500">
                      Prix unit.
                    </th>
                    <th class="px-4 py-2.5 text-right text-sm font-semibold tracking-wider text-gray-400 uppercase dark:text-gray-500">
                      Total
                    </th>
                    <th class="w-44 px-4 py-2.5 text-left text-sm font-semibold tracking-wider text-gray-400 uppercase dark:text-gray-500">
                      Notes
                    </th>
                    <th v-if="!selectedFusion.validee" class="w-10 px-2 py-2.5"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(ligne, i) in fusionLignesFiltered"
                    :key="ligne.id"
                    class="border-t border-gray-100 dark:border-gray-700/50"
                    :class="i % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/20'">
                    <!-- N° Symbole -->
                    <td class="px-4 py-2.5">
                      <span class="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 font-mono text-xs font-semibold text-blue-700 ring-1 ring-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:ring-blue-800/40">
                        {{ ligne.numero_symbole }}
                      </span>
                    </td>
                    <!-- Désignation -->
                    <td class="px-4 py-2.5">
                      <p class="text-sm font-medium text-gray-700 dark:text-gray-200">
                        {{ ligne.catalogue_matieres?.description || '—' }}
                      </p>
                      <p v-if="ligne.catalogue_matieres?.famille" class="mt-0.5 text-xs text-gray-400">
                        {{ ligne.catalogue_matieres.famille }}
                      </p>
                    </td>
                    <!-- UD -->
                    <td class="px-4 py-2.5">
                      <span class="inline-flex items-center gap-1.5">
                        <span class="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                          {{ ligne.catalogue_matieres?.unite_distribution || '—' }}
                        </span>
                        <span v-if="udMap.get(ligne.catalogue_matieres?.unite_distribution)?.designation" class="text-xs text-gray-400 dark:text-gray-500">
                          {{ udMap.get(ligne.catalogue_matieres?.unite_distribution).designation }}
                        </span>
                      </span>
                    </td>
                    <!-- Qté demandée (éditable si pas validée) -->
                    <td class="px-4 py-2.5 text-center">
                      <input
                        v-if="!selectedFusion.validee"
                        type="number"
                        min="0"
                        step="any"
                        :value="ligne.quantite"
                        class="w-20 rounded border border-gray-200 bg-white px-2 py-1 text-center text-sm font-semibold text-gray-800 outline-none transition focus:border-blue-300 focus:ring-1 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                        @change="handleUpdateFusionQuantite(ligne, $event.target.value)"
                      />
                      <span v-else class="text-sm font-semibold text-gray-800 dark:text-gray-100">
                        {{ ligne.quantite }}
                      </span>
                    </td>
                    <!-- Qté à commander -->
                    <td class="px-4 py-2.5 text-center">
                      <span
                        class="text-sm font-semibold"
                        :class="
                          qteACommander(ligne) !== ligne.quantite
                            ? 'text-orange-600 dark:text-orange-400'
                            : 'text-gray-400 dark:text-gray-500'
                        ">
                        {{ qteACommander(ligne) }}
                      </span>
                    </td>
                    <!-- Prix unit. -->
                    <td class="px-4 py-2.5 text-right text-xs whitespace-nowrap text-gray-500 dark:text-gray-400">
                      {{ fmtPrix(ligne.catalogue_matieres?.prix_ud) }}
                    </td>
                    <!-- Total -->
                    <td class="px-4 py-2.5 text-right whitespace-nowrap">
                      <span class="text-sm font-semibold text-gray-800 dark:text-gray-100">
                        {{ fmtPrix((ligne.catalogue_matieres?.prix_ud ?? 0) * (ligne.quantite || 0)) }}
                      </span>
                    </td>
                    <!-- Notes (éditable si pas validée) -->
                    <td class="px-4 py-2.5">
                      <input
                        v-if="!selectedFusion.validee"
                        type="text"
                        :value="ligne.notes ?? ''"
                        placeholder="Note…"
                        class="w-full rounded border border-gray-200 bg-white px-2 py-1 text-sm text-gray-600 outline-none transition focus:border-blue-300 focus:ring-1 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                        @change="handleUpdateFusionNotes(ligne, $event.target.value)"
                      />
                      <span v-else class="text-sm text-gray-500 dark:text-gray-400">{{ ligne.notes || '—' }}</span>
                    </td>
                    <!-- Supprimer (si pas validée) -->
                    <td v-if="!selectedFusion.validee" class="px-2 py-2.5 text-center">
                      <button
                        type="button"
                        class="rounded p-1 text-gray-300 hover:bg-red-50 hover:text-red-500 dark:text-gray-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                        @click="askDeleteFusionLigne(ligne)">
                        <Icon name="lucide:x" size="14" />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>
        </main>

        <!-- ── Panneau catalogue commande ────────────────────────────────────────── -->
        <Transition name="catalogue-panel">
          <CommandesMatieresCatalogueSidebar
            v-if="showCatalogueCommande && selectedFusion && !selectedFusion.validee"
            :existing-symboles="fusionExistingSymboles"
            :existing-ensemble-ids="[]"
            @add="handleAddFusionArticle" />
        </Transition>
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
      <AppModal v-model="showFormFusion" size="md">
        <template #header>
          <h3 class="text-base font-semibold text-gray-800 dark:text-white">
            {{ editingFusion ? 'Renommer la commande' : 'Nouvelle commande' }}
          </h3>
        </template>
        <form class="space-y-4" @submit.prevent="submitFusion">
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Nom *</label>
            <input
              v-model="formFusionNom"
              type="text"
              placeholder="Ex : Commande principale"
              required
              autofocus
              class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 transition outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
            <textarea
              v-model="formFusionDescription"
              rows="3"
              placeholder="Description optionnelle…"
              class="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 transition outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white"></textarea>
          </div>
          <!-- Listes sources (création uniquement) -->
          <div v-if="!editingFusion">
            <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Listes sources <span class="font-normal text-gray-400">(optionnel)</span>
            </label>
            <p class="mb-2 text-xs text-gray-400">Les articles de ces listes seront copiés comme point de départ.</p>
            <div v-if="commandes.length === 0" class="text-sm text-gray-400">Aucune liste disponible</div>
            <div v-else class="flex flex-wrap gap-2">
              <label
                v-for="commande in commandes"
                :key="commande.id"
                class="flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition"
                :class="
                  formFusionSourceIds.includes(commande.id)
                    ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700/50 dark:bg-blue-900/20 dark:text-blue-300'
                    : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400'
                ">
                <input
                  type="checkbox"
                  class="sr-only"
                  :value="commande.id"
                  v-model="formFusionSourceIds" />
                <Icon :name="formFusionSourceIds.includes(commande.id) ? 'lucide:check-square' : 'lucide:square'" size="13" />
                {{ commande.nom }}
              </label>
            </div>
          </div>
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
              {{ editingFusion ? 'Renommer' : 'Créer la commande' }}
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
          et tous ses articles ? Cette action est irréversible.
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

      <!-- ── Modal fusion : confirmer validation ──────────────────────────────── -->
      <AppModal v-model="showConfirmValider" size="sm">
        <template #header>
          <h3 class="text-base font-semibold text-gray-800 dark:text-white">Valider la commande</h3>
        </template>
        <p class="text-sm text-gray-600 dark:text-gray-300">
          Valider la commande <strong>« {{ selectedFusion?.nom }} »</strong> ? Elle sera verrouillée en lecture seule et ne pourra plus être modifiée.
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
              Valider et verrouiller
            </button>
          </div>
        </template>
      </AppModal>

      <!-- ── Modal fusion : retirer un article ────────────────────────────────── -->
      <AppModal v-model="showDeleteFusionLigne" size="sm">
        <template #header>
          <h3 class="text-base font-semibold text-gray-800 dark:text-white">Retirer l'article</h3>
        </template>
        <p class="text-sm text-gray-600 dark:text-gray-300">
          Retirer l'article
          <strong class="font-mono">{{ fusionLigneToDelete?.numero_symbole }}</strong>
          de cette commande ?
        </p>
        <template #footer>
          <div class="flex justify-end gap-3">
            <button
              type="button"
              class="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              @click="showDeleteFusionLigne = false">
              Annuler
            </button>
            <button
              type="button"
              class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              @click="confirmDeleteFusionLigne">
              Retirer
            </button>
          </div>
        </template>
      </AppModal>

      <!-- ── Modale import xlsx listes ──────────────────────────────────────────── -->
      <CommandesMatieresImportModal
        :open="showImport"
        :chantier-id="chantier.id"
        :commandes="commandes"
        @close="showImport = false"
        @imported="handleImported" />

      <!-- ── Modale import xlsx commandes ─────────────────────────────────────── -->
      <CommandesMatieresImportModal
        mode="commande"
        :open="showImportCommande"
        :chantier-id="chantier.id"
        :fusions="fusions"
        @close="showImportCommande = false"
        @imported="handleImportedCommande" />

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
