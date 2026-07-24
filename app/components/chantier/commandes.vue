<script setup>
const props = defineProps({
  chantier: { type: Object, required: true },
})

const {
  getCommandes, deleteCommande, updateCommande,
  validerCommande, rouvrirCommande, markExported,
  getLignes, addLigne, updateLigne, updateLigneBa, deleteLigne,
} = useCommandes()

// Chargement des listes de matières sources (pour la modale de création)
const { getCommandes: getListes } = useCommandesMatieres()

const { METIERS, metierLabel } = useMetier()
const { canEditBaseArriere } = useLevelUser()

const client = useSupabaseClient()
const user = useAuthUser()

// ─── État global ─────────────────────────────────────────────────────────────
const commandes = ref([])
const listes = ref([]) // listes de matières du chantier (sources)
const loadingCommandes = ref(false)
const selectedCommande = ref(null)
const lignes = ref([])
const loadingLignes = ref(false)

const search = ref('')
const searchArticle = ref('')

// Modales
const showCreer = ref(false)
const showDeleteCommande = ref(false)
const commandeToDelete = ref(null)
const showDeleteLigne = ref(false)
const ligneToDelete = ref(null)
const showConfirmValider = ref(false)
const showConfirmRouvrir = ref(false)
const showCatalogue = ref(false)
const openDropdownId = ref(null)
const exportingExcel = ref(false)

// Emplacements Base Arrière
const EMPLACEMENTS = [
  { id: 'parc_ltv', label: 'Parc LTV' },
  { id: 'd2', label: 'D2' },
  { id: 'uo_travaux', label: 'UO Travaux' },
]
const emplacementLabel = (code) => EMPLACEMENTS.find((e) => e.id === code)?.label ?? ''

// Référentiel UD (unités de distribution)
const udMap = ref(new Map())
const loadUdMap = async () => {
  if (udMap.value.size > 0) return
  const { data } = await client
    .from('catalogue_unites_distribution')
    .select('code, designation, quantite_par_unite')
  if (data) udMap.value = new Map(data.map((r) => [r.code, r]))
}

// ─── Droits ──────────────────────────────────────────────────────────────────
const isValidee = computed(() => selectedCommande.value?.statut === 'validee')

// Propriété : créateur, admin (role >= 1), ou commande historique sans créateur.
const isOwnerOf = (commande) =>
  !commande?.created_by ||
  commande.created_by === user.value?.id ||
  (user.value?.role ?? 0) >= 1
const isOwner = computed(() => isOwnerOf(selectedCommande.value))

// Édition générale (demandée / notes / lignes) : propriétaire, tant que « en cours ».
const canEditGeneral = computed(() => isOwner.value && !isValidee.value)
// Édition des colonnes Base Arrière : profil BA/superadmin, tant que « en cours ».
const canEditBa = computed(() => canEditBaseArriere.value && !isValidee.value)

const creatorName = (commande) => {
  const c = commande?.createur
  if (!c) return ''
  return [c.prenom, c.nom].filter(Boolean).join(' ') || c.name || ''
}

// ─── Regroupement par métier ─────────────────────────────────────────────────
const commandesFiltrees = computed(() => {
  let list = commandes.value
  const q = search.value.trim().toLowerCase()
  if (q) {
    list = list.filter((c) =>
      (c.nom ?? '').toLowerCase().includes(q) ||
      (c.description ?? '').toLowerCase().includes(q),
    )
  }
  return [...list].sort((a, b) => new Date(b.updated_at ?? 0) - new Date(a.updated_at ?? 0))
})

const expandedMetiers = ref(new Set())
const toggleMetier = (code) => {
  const next = new Set(expandedMetiers.value)
  if (next.has(code)) next.delete(code)
  else next.add(code)
  expandedMetiers.value = next
}
const expandMetier = (code) => {
  if (!code || expandedMetiers.value.has(code)) return
  const next = new Set(expandedMetiers.value)
  next.add(code)
  expandedMetiers.value = next
}

const commandesParMetier = computed(() => {
  const groups = new Map()
  for (const c of commandesFiltrees.value) {
    const key = c.metier || 'SES'
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(c)
  }
  const ordered = []
  for (const m of METIERS) {
    if (groups.has(m.code)) ordered.push({ code: m.code, label: m.label, items: groups.get(m.code) })
  }
  for (const [code, items] of groups) {
    if (!METIERS.some((m) => m.code === code)) ordered.push({ code, label: metierLabel(code), items })
  }
  return ordered
})

// ─── Lignes / quantités ──────────────────────────────────────────────────────
const existingSymboles = computed(() => lignes.value.map((l) => l.numero_symbole))

const lignesFiltered = computed(() => {
  const q = searchArticle.value.trim().toLowerCase()
  if (!q) return lignes.value
  return lignes.value.filter((l) => {
    const symbole = (l.numero_symbole ?? '').toLowerCase()
    const desc = (l.catalogue_matieres?.description ?? '').toLowerCase()
    return symbole.includes(q) || desc.includes(q)
  })
})

const hasItems = computed(() => lignes.value.length > 0)

// Quantité à commander = (demandée − base arrière) arrondie à l'unité de distribution.
const qteACommanderFor = (qty, udCode) => {
  const qpu = udMap.value.get(udCode)?.quantite_par_unite
  if (!qpu || qpu <= 1) return qty
  return Math.ceil(qty / qpu)
}
const resteACommander = (l) => Math.max(0, (l.quantite_demandee || 0) - (l.quantite_ba || 0))
const qteACommander = (l) => qteACommanderFor(resteACommander(l), l.catalogue_matieres?.unite_distribution)

// Prix « à l'unité » = prix par UD (conditionnement). Total = prix_ud × quantité à
// commander, de sorte que Prix unit. × Qté à commander = Total.
const prixUD = (cat) => cat?.prix_ud ?? 0
const totalLigneCommande = (l) => prixUD(l.catalogue_matieres) * qteACommander(l)
const totalCommande = computed(() =>
  lignes.value.reduce((acc, l) => acc + totalLigneCommande(l), 0),
)

// ─── Formatage ───────────────────────────────────────────────────────────────
const fmtPrix = (v) => v == null ? '—'
  : Number(v).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
const fmtNum = (v) => Number(v ?? 0).toLocaleString('fr-FR', { maximumFractionDigits: 3 })
const fmtDate = (iso) => iso
  ? new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : ''
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
const slugify = (s) => s.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')

// ─── Sélection ───────────────────────────────────────────────────────────────
const selectCommande = async (commande) => {
  selectedCommande.value = commande
  expandMetier(commande.metier || 'SES')
  showCatalogue.value = false
  searchArticle.value = ''
  loadingLignes.value = true
  ;[lignes.value] = await Promise.all([getLignes(commande.id), loadUdMap()])
  loadingLignes.value = false
}

const updateCommandeInList = (updated) => {
  const idx = commandes.value.findIndex((c) => c.id === updated.id)
  if (idx !== -1) commandes.value[idx] = { ...commandes.value[idx], ...updated }
  if (selectedCommande.value?.id === updated.id) {
    selectedCommande.value = { ...selectedCommande.value, ...updated }
  }
}

// ─── Création ────────────────────────────────────────────────────────────────
const openCreer = async () => {
  // Recharge les listes sources à l'ouverture (au cas où elles ont changé)
  listes.value = await getListes(props.chantier.id)
  showCreer.value = true
}
const handleCreated = async ({ commande }) => {
  commandes.value.unshift(commande)
  showCreer.value = false
  await selectCommande(commande)
}

// ─── Suppression commande ────────────────────────────────────────────────────
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
    }
  }
  showDeleteCommande.value = false
  commandeToDelete.value = null
}

// ─── Édition des lignes ──────────────────────────────────────────────────────
const patchLigne = (id, patch) => {
  const idx = lignes.value.findIndex((l) => l.id === id)
  if (idx !== -1) lignes.value[idx] = { ...lignes.value[idx], ...patch }
}

const handleUpdateDemandee = async (l, value) => {
  const qty = value === '' || value == null ? 0 : Number(value)
  patchLigne(l.id, { quantite_demandee: qty })
  await updateLigne(l.id, { quantite_demandee: qty })
}
const handleUpdateBa = async (l, value) => {
  const qty = value === '' || value == null ? 0 : Number(value)
  patchLigne(l.id, { quantite_ba: qty })
  await updateLigneBa(l.id, { quantite_ba: qty, emplacement_ba: l.emplacement_ba ?? null })
}
const handleUpdateEmplacement = async (l, value) => {
  patchLigne(l.id, { emplacement_ba: value })
  await updateLigneBa(l.id, { quantite_ba: l.quantite_ba ?? 0, emplacement_ba: value ?? null })
}
const handleUpdateNotes = async (l, value) => {
  patchLigne(l.id, { notes: value })
  await updateLigne(l.id, { notes: value })
}

const askDeleteLigne = (l) => {
  ligneToDelete.value = l
  showDeleteLigne.value = true
}
const confirmDeleteLigne = async () => {
  if (!ligneToDelete.value) return
  const ok = await deleteLigne(ligneToDelete.value.id)
  if (ok) lignes.value = lignes.value.filter((l) => l.id !== ligneToDelete.value.id)
  showDeleteLigne.value = false
  ligneToDelete.value = null
}

// Ajout manuel d'un article (catalogue)
const handleAddArticle = async ({ article, quantite }) => {
  if (!selectedCommande.value || !canEditGeneral.value) return
  if (existingSymboles.value.includes(article.numero_symbole)) return
  const ligne = await addLigne(selectedCommande.value.id, article.numero_symbole, quantite, lignes.value.length)
  if (ligne) lignes.value.push(ligne)
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

// ─── Export Excel (en cours ou validée) ──────────────────────────────────────
const handleExportExcel = async () => {
  if (!selectedCommande.value || !hasItems.value || exportingExcel.value) return
  exportingExcel.value = true
  try {
    await loadUdMap()
    const rows = lignes.value
      .slice()
      .sort((a, b) => String(a.numero_symbole).localeCompare(String(b.numero_symbole)))
      .map((l) => {
        const cat = l.catalogue_matieres
        const puni = prixUD(cat)
        return {
          'N° Symbole': l.numero_symbole,
          'Désignation': cat?.description ?? '',
          'UD': cat?.unite_distribution ?? '',
          'Qté demandée': l.quantite_demandee ?? 0,
          'Qté base arrière': l.quantite_ba ?? 0,
          'Emplacement BA': emplacementLabel(l.emplacement_ba),
          'Qté à commander': qteACommander(l),
          'Prix unit. (€)': Number(puni.toFixed(4)),
          'Total à commander (€)': Number((prixUD(cat) * qteACommander(l)).toFixed(2)),
          'Origine': cat?.origine === 'contrat_cadre' ? 'Contrat cadre' : 'Supply chain',
          'Notes': l.notes ?? '',
        }
      })

    const totalGlobal = rows.reduce((acc, r) => acc + (r['Total à commander (€)'] || 0), 0)
    rows.push({
      'N° Symbole': '', 'Désignation': 'TOTAL', 'UD': '', 'Qté demandée': '', 'Qté base arrière': '',
      'Emplacement BA': '', 'Qté à commander': '', 'Prix unit. (€)': '',
      'Total à commander (€)': Number(totalGlobal.toFixed(2)), 'Origine': '', 'Notes': '',
    })

    // xlsx-js-style : le build community « xlsx » n'écrit pas les couleurs de cellule.
    const mod = await import('xlsx-js-style')
    const XLSX = mod.utils ? mod : (mod.default ?? mod)

    // Titre en A1, en-tête + données à partir de A2
    const ws = XLSX.utils.json_to_sheet(rows, { origin: 'A2' })
    XLSX.utils.sheet_add_aoa(ws, [[`Commande : ${selectedCommande.value.nom}`]], { origin: 'A1' })
    ws['!cols'] = [
      { wch: 12 }, { wch: 42 }, { wch: 6 }, { wch: 13 }, { wch: 15 }, { wch: 14 },
      { wch: 15 }, { wch: 13 }, { wch: 20 }, { wch: 15 }, { wch: 30 },
    ]

    const range = XLSX.utils.decode_range(ws['!ref'])
    const HEADER_R = 1              // en-tête (0-indexé) sous le titre
    const TOTAL_R = range.e.r       // dernière ligne = TOTAL
    const lastCol = range.e.c
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: lastCol } }]

    // Palette (RRGGBB) alignée sur le thème : ambre = Base Arrière, teal = à commander
    const edge = { style: 'thin', color: { rgb: 'E5E7EB' } }
    const box = { top: edge, bottom: edge, left: edge, right: edge }
    const BA_COLS = new Set([4, 5]) // Qté base arrière, Emplacement BA
    const CMD_COL = 6               // Qté à commander

    // Titre
    if (ws['A1']) ws['A1'].s = {
      font: { bold: true, sz: 13, color: { rgb: 'FFFFFF' } },
      fill: { patternType: 'solid', fgColor: { rgb: '2F6F62' } },
      alignment: { horizontal: 'left', vertical: 'center' },
    }

    // En-tête (BA en ambre, à commander en teal, reste en ardoise)
    for (let c = 0; c <= lastCol; c++) {
      const cell = ws[XLSX.utils.encode_cell({ r: HEADER_R, c })]
      if (!cell) continue
      const fill = BA_COLS.has(c) ? 'D97706' : c === CMD_COL ? '2F6F62' : '334155'
      cell.s = {
        font: { bold: true, sz: 10, color: { rgb: 'FFFFFF' } },
        fill: { patternType: 'solid', fgColor: { rgb: fill } },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        border: box,
      }
    }

    // Corps + ligne TOTAL
    for (let r = HEADER_R + 1; r <= TOTAL_R; r++) {
      const isTotal = r === TOTAL_R
      for (let c = 0; c <= lastCol; c++) {
        const addr = XLSX.utils.encode_cell({ r, c })
        let cell = ws[addr]
        if (!cell) {
          if (!isTotal) continue
          cell = ws[addr] = { t: 's', v: '' } // remplit la bande TOTAL
        }
        const left = c === 0 || c === 1 || c === 9 || c === 10
        const s = {
          font: { sz: 10 },
          alignment: { horizontal: left ? 'left' : 'center', vertical: 'center' },
          border: box,
        }
        if (c === 7 || c === 8) cell.z = '#,##0.00' // colonnes prix
        if (!isTotal && BA_COLS.has(c)) {
          s.fill = { patternType: 'solid', fgColor: { rgb: 'FEF3C7' } }
          s.font = { sz: 10, color: { rgb: '92400E' } }
        } else if (!isTotal && c === CMD_COL) {
          s.fill = { patternType: 'solid', fgColor: { rgb: 'CCFBF1' } }
          s.font = { sz: 10, bold: true, color: { rgb: '115E4A' } }
        }
        if (isTotal) {
          s.fill = { patternType: 'solid', fgColor: { rgb: 'E2E8F0' } }
          s.font = { ...s.font, bold: true }
        }
        cell.s = s
      }
    }

    ws['!rows'] = [{ hpt: 22 }, { hpt: 22 }]
    ws['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: HEADER_R, c: 0 }, e: { r: HEADER_R, c: lastCol } }) }

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Commande')
    const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })

    const compte = props.chantier?.compte ?? ''
    const nom = slugify(`${compte} - ${selectedCommande.value.nom}`) || 'commande'
    downloadBlob(blob, `${nom}.xlsx`)
  } finally {
    exportingExcel.value = false
  }
}

// ─── Export ZIP (validée uniquement, vers l'EBM) ─────────────────────────────
const handleExport = async () => {
  if (!selectedCommande.value || !isValidee.value) return
  await loadUdMap()

  const supplyItems = []
  const contratCadreItems = []
  for (const l of lignes.value) {
    const qte = qteACommander(l)
    if (qte <= 0) continue
    const item = { numero_symbole: l.numero_symbole, quantite: qte, notes: l.notes ?? '', catalogue_matieres: l.catalogue_matieres }
    if (l.catalogue_matieres?.origine === 'contrat_cadre') contratCadreItems.push(item)
    else supplyItems.push(item)
  }
  if (supplyItems.length === 0 && contratCadreItems.length === 0) return

  const bySymbole = (a, b) => String(a.numero_symbole).localeCompare(String(b.numero_symbole))
  supplyItems.sort(bySymbole)
  contratCadreItems.sort(bySymbole)

  const JSZip = (await import('jszip')).default
  const zip = new JSZip()
  const CHUNK_SIZE = 50
  const compte = props.chantier?.compte ?? ''
  const nom = slugify(`${compte} - ${selectedCommande.value.nom}`) || 'commande'

  if (supplyItems.length > 0) {
    for (let i = 0, idx = 0; i < supplyItems.length; i += CHUNK_SIZE, idx++) {
      const slice = supplyItems.slice(i, i + CHUNK_SIZE)
      const content = slice
        .map((item) => `${item.numero_symbole ?? ''}\t${Number(item.quantite).toFixed(1)}\t`)
        .join('\n') + '\n'
      const nbChunks = Math.ceil(supplyItems.length / CHUNK_SIZE)
      const filename = nbChunks === 1 ? `${nom}.txt` : `${nom}_${idx + 1}.txt`
      zip.file(filename, content)
    }
  }

  if (contratCadreItems.length > 0) {
    const XLSX = await import('xlsx')
    const rows = contratCadreItems.map((item) => ({
      'N° Symbole': item.numero_symbole,
      'Désignation': item.catalogue_matieres?.description ?? '',
      'UD': item.catalogue_matieres?.unite_distribution ?? '',
      'Qté à commander': item.quantite,
      'Notes': item.notes ?? '',
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    ws['!cols'] = [{ wch: 12 }, { wch: 40 }, { wch: 8 }, { wch: 16 }, { wch: 30 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Contrats cadres')
    zip.file(`${nom}_contrats-cadres.xlsx`, XLSX.write(wb, { type: 'array', bookType: 'xlsx' }))
  }

  const blob = await zip.generateAsync({ type: 'blob' })
  downloadBlob(blob, `${nom}.zip`)

  const marked = await markExported(selectedCommande.value.id)
  if (marked) updateCommandeInList(marked)
}

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Chargement initial ──────────────────────────────────────────────────────
onMounted(async () => {
  loadingCommandes.value = true
  ;[commandes.value] = await Promise.all([getCommandes(props.chantier.id), loadUdMap()])
  loadingCommandes.value = false
})
</script>

<template>
  <div class="flex h-full flex-col overflow-hidden px-4">
    <!-- Titre -->
    <div class="flex-none border-b border-slate-200 py-3 dark:border-slate-700">
      <AppTitleMain title="Commandes" description="Bordereaux de commande par chantier (avec suivi Base Arrière)" />
    </div>

    <div class="flex min-h-0 flex-1 overflow-hidden">
      <!-- ── Sidebar : liste des commandes ──────────────────────────────────── -->
      <aside class="flex w-72 flex-none flex-col border-r border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50">
        <div class="flex-none space-y-2 border-b border-slate-200 p-2.5 dark:border-slate-700">
          <button
            type="button"
            class="group inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-linear-to-b from-secondary-500 to-secondary-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm ring-1 ring-secondary-600/40 transition-all hover:from-secondary-600 hover:to-secondary-700 hover:shadow-md active:scale-[0.985]"
            @click="openCreer">
            <Icon name="lucide:plus" size="15" class="transition-transform group-hover:rotate-90" />
            Nouvelle commande
          </button>

          <div class="relative">
            <Icon name="lucide:search" size="13" class="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              v-model="search"
              type="text"
              placeholder="Rechercher…"
              class="w-full rounded-md border border-slate-200 bg-white py-1.5 pl-8 pr-2 text-sm text-slate-700 outline-none transition focus:border-secondary-300 focus:ring-1 focus:ring-secondary-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:placeholder-slate-500" />
          </div>
        </div>

        <div v-if="loadingCommandes" class="flex items-center justify-center py-10">
          <div class="h-5 w-5 animate-spin rounded-full border-2 border-secondary-500 border-t-transparent"></div>
        </div>

        <div v-else-if="commandes.length === 0" class="flex flex-col items-center gap-3 px-4 py-12 text-center">
          <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
            <Icon name="lucide:clipboard-list" size="22" class="text-slate-400" />
          </div>
          <div class="space-y-1">
            <p class="text-sm font-medium text-slate-600 dark:text-slate-300">Aucune commande</p>
            <p class="text-sm text-slate-400">Créez une commande depuis vos listes</p>
          </div>
        </div>

        <div v-else-if="commandesFiltrees.length === 0" class="flex flex-col items-center gap-2 px-4 py-12 text-center">
          <Icon name="lucide:search-x" size="22" class="text-slate-300" />
          <p class="text-sm text-slate-400">Aucun résultat</p>
        </div>

        <div v-else class="flex-1 space-y-2 overflow-y-auto p-2">
          <div v-for="grp in commandesParMetier" :key="grp.code">
            <button
              type="button"
              class="flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition"
              :class="expandedMetiers.has(grp.code)
                ? 'border-secondary-200 bg-secondary-50/60 dark:border-secondary-700/50 dark:bg-secondary-900/15'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800/40'"
              @click="toggleMetier(grp.code)">
              <Icon
                name="lucide:chevron-right"
                size="15"
                class="flex-none transition-transform duration-200"
                :class="expandedMetiers.has(grp.code) ? 'rotate-90 text-secondary-500' : 'text-slate-400'" />
              <span
                class="text-xs font-semibold uppercase tracking-wide"
                :class="expandedMetiers.has(grp.code) ? 'text-secondary-700 dark:text-secondary-300' : 'text-slate-600 dark:text-slate-300'">
                {{ grp.label }}
              </span>
              <span
                class="ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums"
                :class="expandedMetiers.has(grp.code)
                  ? 'bg-secondary-100 text-secondary-700 dark:bg-secondary-900/40 dark:text-secondary-300'
                  : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'">
                {{ grp.items.length }}
              </span>
            </button>

            <ul v-if="expandedMetiers.has(grp.code)" class="mt-1 ml-3 space-y-px border-l border-slate-200 pl-2 dark:border-slate-700">
              <li
                v-for="commande in grp.items"
                :key="commande.id"
                class="group relative flex cursor-pointer items-center gap-2 overflow-hidden rounded-md px-2 py-1.5 transition-colors"
                :class="selectedCommande?.id === commande.id
                  ? 'bg-white shadow-sm ring-1 ring-secondary-200 dark:bg-slate-800 dark:ring-secondary-700/50'
                  : 'hover:bg-white/80 dark:hover:bg-slate-800/60'"
                @click="selectCommande(commande)">
                <span
                  v-if="selectedCommande?.id === commande.id"
                  class="absolute inset-y-0 left-0 w-0.5 rounded-l-lg bg-secondary-500" />
                <span
                  class="h-1.5 w-1.5 flex-none rounded-full"
                  :class="commande.statut === 'validee' ? 'bg-green-500' : 'bg-amber-400'"
                  :title="commande.statut === 'validee' ? 'Validée' : 'En cours'" />
                <div class="min-w-0 flex-1">
                  <p
                    class="truncate text-sm leading-tight font-medium"
                    :class="selectedCommande?.id === commande.id ? 'text-secondary-700 dark:text-secondary-300' : 'text-slate-700 dark:text-slate-200'">
                    {{ commande.nom }}
                  </p>
                  <p class="truncate text-[11px] leading-tight text-slate-400 dark:text-slate-500">
                    {{ fmtRelDate(commande.updated_at) }}<template v-if="creatorName(commande)"> · {{ creatorName(commande) }}</template>
                  </p>
                </div>
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
                        class="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200">
                        <Icon name="lucide:more-vertical" size="14" />
                      </button>
                    </template>
                    <div class="flex min-w-32 flex-col gap-0.5">
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
              </li>
            </ul>
          </div>
        </div>
      </aside>

      <!-- ── Zone principale ─────────────────────────────────────────────────── -->
      <main class="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div v-if="!selectedCommande" class="flex h-full flex-col items-center justify-center gap-3 text-slate-400">
          <Icon name="lucide:mouse-pointer-click" size="48" class="opacity-30" />
          <p class="text-base">Sélectionnez une commande ou créez-en une nouvelle</p>
          <button
            type="button"
            class="mt-2 flex items-center gap-2 rounded-lg bg-secondary-600 px-4 py-2 text-base font-medium text-white hover:bg-secondary-700"
            @click="openCreer">
            <Icon name="lucide:plus" size="18" />
            Nouvelle commande
          </button>
        </div>

        <template v-else>
          <!-- Header -->
          <div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-700 dark:bg-slate-900">
            <div class="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-2">
              <div class="shrink-0">
                <div class="flex items-center gap-2">
                  <h2 class="text-lg font-semibold text-slate-800 dark:text-white">{{ selectedCommande.nom }}</h2>
                  <span
                    v-if="selectedCommande.metier"
                    class="inline-flex items-center gap-1 rounded-md bg-secondary-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-400">
                    {{ metierLabel(selectedCommande.metier) }}
                  </span>
                  <span
                    class="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold uppercase tracking-wide"
                    :class="isValidee
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'">
                    <Icon :name="isValidee ? 'lucide:lock' : 'lucide:circle-dashed'" size="11" />
                    {{ isValidee ? 'Validée' : 'En cours' }}
                  </span>
                  <span
                    v-if="!isOwner"
                    class="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                    title="Vous n'êtes pas le créateur de cette commande">
                    <Icon name="lucide:eye" size="11" />
                    Lecture seule
                  </span>
                </div>
                <p class="text-sm text-slate-400 dark:text-slate-500">
                  {{ lignes.length }} article{{ lignes.length !== 1 ? 's' : '' }}
                  <template v-if="creatorName(selectedCommande)"> · Créée par {{ creatorName(selectedCommande) }}</template>
                  <template v-if="selectedCommande.valide_at"> · Validée le {{ fmtDate(selectedCommande.valide_at) }}</template>
                </p>
              </div>
              <div class="relative w-full sm:w-auto sm:min-w-48 sm:flex-1 sm:max-w-xs">
                <Icon name="lucide:search" size="16" class="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  v-model="searchArticle"
                  type="text"
                  placeholder="Rechercher un article…"
                  class="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-base text-slate-700 outline-none transition focus:border-secondary-300 focus:bg-white focus:ring-1 focus:ring-secondary-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200" />
              </div>
            </div>

            <div class="flex flex-wrap items-center justify-end gap-2">
              <div class="hidden rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-base sm:block dark:border-slate-700 dark:bg-slate-800">
                <span class="text-slate-500 dark:text-slate-400">Total à commander : </span>
                <span class="font-semibold text-slate-800 dark:text-white">{{ fmtPrix(totalCommande) }}</span>
              </div>

              <!-- Export Excel : disponible dès la création (en cours ou validée) -->
              <button
                v-if="hasItems"
                type="button"
                :disabled="exportingExcel"
                title="Exporter la commande en Excel"
                class="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                @click="handleExportExcel">
                <div v-if="exportingExcel" class="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"></div>
                <Icon v-else name="lucide:file-spreadsheet" size="15" class="text-emerald-600 dark:text-emerald-400" />
                Export Excel
              </button>

              <!-- Actions En cours (propriétaire) -->
              <template v-if="canEditGeneral">
                <button
                  type="button"
                  :title="showCatalogue ? 'Fermer le catalogue' : 'Ajouter un article'"
                  class="flex h-9 w-9 items-center justify-center rounded-lg border transition"
                  :class="showCatalogue
                    ? 'border-secondary-200 bg-secondary-50 text-secondary-600 dark:border-secondary-700/50 dark:bg-secondary-900/20 dark:text-secondary-400'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400'"
                  @click="showCatalogue = !showCatalogue">
                  <Icon :name="showCatalogue ? 'lucide:panel-right-close' : 'lucide:plus'" size="16" />
                </button>
                <button
                  type="button"
                  :disabled="!hasItems"
                  class="flex cursor-pointer items-center gap-1.5 rounded-lg border border-green-300 bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700 transition hover:border-green-400 hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-green-700/50 dark:bg-green-900/20 dark:text-green-400"
                  @click="showConfirmValider = true">
                  <Icon name="lucide:check-circle" size="15" />
                  Valider la commande
                </button>
              </template>

              <!-- Actions Validée -->
              <template v-else-if="isValidee">
                <button
                  type="button"
                  :disabled="!hasItems"
                  class="flex cursor-pointer items-center gap-1.5 rounded-lg border border-secondary-300 bg-secondary-50 px-3 py-1.5 text-sm font-medium text-secondary-700 transition hover:border-secondary-400 hover:bg-secondary-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-secondary-700/50 dark:bg-secondary-900/20 dark:text-secondary-400"
                  @click="handleExport">
                  <Icon name="lucide:file-down" size="15" />
                  Exporter (ZIP)
                </button>
                <button
                  v-if="isOwner"
                  type="button"
                  title="Rouvrir en « en cours » pour éditer"
                  class="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
                  @click="showConfirmRouvrir = true">
                  <Icon name="lucide:undo-2" size="15" />
                  Rouvrir
                </button>
              </template>
            </div>
          </div>

          <!-- Loader -->
          <div v-if="loadingLignes" class="flex items-center justify-center py-16">
            <div class="h-8 w-8 animate-spin rounded-full border-4 border-secondary-500 border-t-transparent"></div>
          </div>

          <!-- Tableau à plat -->
          <div v-else class="flex-1 overflow-auto">
            <div v-if="!hasItems" class="flex flex-col items-center gap-3 px-6 py-16 text-center text-slate-400">
              <Icon name="lucide:package-open" size="48" class="opacity-30" />
              <p class="text-base">Aucun article dans cette commande</p>
            </div>

            <table v-else class="w-full text-sm">
              <thead class="sticky top-0 z-10">
                <tr class="border-y border-slate-200 bg-slate-50 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-800/90">
                  <th class="px-4 py-2.5 text-left text-sm font-semibold tracking-wider text-slate-400 uppercase dark:text-slate-500">N° Symbole</th>
                  <th class="px-4 py-2.5 text-left text-sm font-semibold tracking-wider text-slate-400 uppercase dark:text-slate-500">Désignation</th>
                  <th class="px-4 py-2.5 text-center text-sm font-semibold tracking-wider text-slate-400 uppercase dark:text-slate-500">UD</th>
                  <th class="w-28 px-4 py-2.5 text-center text-sm font-semibold tracking-wider text-slate-400 uppercase dark:text-slate-500">Qté demandée</th>
                  <th class="w-28 px-4 py-2.5 text-center text-sm font-semibold tracking-wider text-amber-500 uppercase dark:text-amber-400">Qté base arrière</th>
                  <th class="w-36 px-4 py-2.5 text-center text-sm font-semibold tracking-wider text-amber-500 uppercase dark:text-amber-400">Emplacement BA</th>
                  <th class="w-28 px-4 py-2.5 text-center text-sm font-semibold tracking-wider text-secondary-500 uppercase dark:text-secondary-400">Qté à commander</th>
                  <th class="w-40 px-4 py-2.5 text-right text-sm font-semibold tracking-wider text-slate-400 uppercase dark:text-slate-500">Prix unit. / Total</th>
                  <th class="w-48 px-4 py-2.5 text-left text-sm font-semibold tracking-wider text-slate-400 uppercase dark:text-slate-500">Notes</th>
                  <th class="w-10 px-2 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="l in lignesFiltered"
                  :key="l.id"
                  class="border-b border-slate-100 hover:bg-slate-50/60 dark:border-slate-800 dark:hover:bg-slate-800/40">
                  <td class="px-4 py-2 font-mono text-slate-700 dark:text-slate-200">{{ l.numero_symbole }}</td>
                  <td class="px-4 py-2 text-slate-600 dark:text-slate-300">{{ l.catalogue_matieres?.description ?? '—' }}</td>
                  <td class="px-4 py-2 text-center text-slate-500 dark:text-slate-400">{{ l.catalogue_matieres?.unite_distribution ?? '—' }}</td>

                  <!-- Qté demandée -->
                  <td class="px-4 py-2 text-center">
                    <input
                      v-if="canEditGeneral"
                      type="number"
                      min="0"
                      step="any"
                      :value="l.quantite_demandee"
                      class="w-20 rounded-md border border-slate-200 bg-white px-2 py-1 text-center text-sm text-slate-700 outline-none focus:border-secondary-400 focus:ring-1 focus:ring-secondary-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                      @change="handleUpdateDemandee(l, $event.target.value)" />
                    <span v-else class="tabular-nums text-slate-700 dark:text-slate-200">{{ fmtNum(l.quantite_demandee) }}</span>
                  </td>

                  <!-- Qté base arrière (édition réservée BA) -->
                  <td class="px-4 py-2 text-center">
                    <input
                      v-if="canEditBa"
                      type="number"
                      min="0"
                      step="any"
                      :value="l.quantite_ba"
                      class="w-20 rounded-md border border-amber-200 bg-amber-50/40 px-2 py-1 text-center text-sm text-amber-900 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-200 dark:border-amber-700/50 dark:bg-amber-900/10 dark:text-amber-200"
                      @change="handleUpdateBa(l, $event.target.value)" />
                    <span v-else class="tabular-nums text-slate-700 dark:text-slate-200">{{ fmtNum(l.quantite_ba) }}</span>
                  </td>

                  <!-- Emplacement BA (édition réservée BA) -->
                  <td class="px-4 py-2 text-center">
                    <AppSelect
                      v-if="canEditBa"
                      :model-value="l.emplacement_ba"
                      :options="EMPLACEMENTS"
                      placeholder="—"
                      nullable
                      centered
                      @update:model-value="handleUpdateEmplacement(l, $event)" />
                    <span v-else class="text-slate-600 dark:text-slate-300">{{ emplacementLabel(l.emplacement_ba) || '—' }}</span>
                  </td>

                  <!-- Qté à commander (calculée) -->
                  <td class="px-4 py-2 text-center font-semibold tabular-nums text-secondary-700 dark:text-secondary-300">
                    {{ fmtNum(qteACommander(l)) }}
                  </td>

                  <!-- Prix unit. (par UD) / Total (en gras), sur une seule ligne -->
                  <td class="whitespace-nowrap px-4 py-2 text-right tabular-nums">
                    <span class="text-slate-400 dark:text-slate-500">{{ fmtPrix(prixUD(l.catalogue_matieres)) }}</span>
                    <span class="mx-1.5 text-slate-300 dark:text-slate-600">/</span>
                    <span class="font-bold text-slate-800 dark:text-slate-100">{{ fmtPrix(totalLigneCommande(l)) }}</span>
                  </td>

                  <!-- Notes -->
                  <td class="px-4 py-2">
                    <input
                      v-if="canEditGeneral"
                      type="text"
                      :value="l.notes"
                      placeholder="…"
                      class="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 outline-none focus:border-secondary-400 focus:ring-1 focus:ring-secondary-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                      @change="handleUpdateNotes(l, $event.target.value)" />
                    <span v-else class="text-slate-500 dark:text-slate-400">{{ l.notes || '—' }}</span>
                  </td>

                  <!-- Suppression ligne -->
                  <td class="px-2 py-2 text-center">
                    <button
                      v-if="canEditGeneral"
                      type="button"
                      class="rounded p-1 text-slate-300 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                      @click="askDeleteLigne(l)">
                      <Icon name="lucide:x" size="14" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
      </main>

      <!-- Catalogue (ajout manuel d'article, en cours uniquement) -->
      <Transition name="catalogue-panel">
        <CommandesMatieresCatalogueSidebar
          v-if="showCatalogue && selectedCommande && canEditGeneral"
          :existing-symboles="existingSymboles"
          :articles-only="true"
          :metier="selectedCommande.metier"
          @add="handleAddArticle" />
      </Transition>
    </div>

    <!-- ── Modales ─────────────────────────────────────────────────────────── -->
    <CommandesCreerModal
      :open="showCreer"
      :chantier-id="chantier.id"
      :listes="listes"
      @close="showCreer = false"
      @created="handleCreated" />

    <AppModal v-model="showDeleteCommande" size="sm">
      <template #header>
        <h3 class="text-base font-semibold text-slate-800 dark:text-white">Supprimer la commande</h3>
      </template>
      <p class="text-sm text-slate-600 dark:text-slate-300">
        Supprimer la commande <strong>« {{ commandeToDelete?.nom }} »</strong> et toutes ses lignes ? Cette action est irréversible.
      </p>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button type="button" class="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300" @click="showDeleteCommande = false">Annuler</button>
          <button type="button" class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700" @click="confirmDeleteCommande">Supprimer</button>
        </div>
      </template>
    </AppModal>

    <AppModal v-model="showDeleteLigne" size="sm">
      <template #header>
        <h3 class="text-base font-semibold text-slate-800 dark:text-white">Retirer l'article</h3>
      </template>
      <p class="text-sm text-slate-600 dark:text-slate-300">
        Retirer l'article <strong class="font-mono">{{ ligneToDelete?.numero_symbole }}</strong> de cette commande ?
      </p>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button type="button" class="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300" @click="showDeleteLigne = false">Annuler</button>
          <button type="button" class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700" @click="confirmDeleteLigne">Retirer</button>
        </div>
      </template>
    </AppModal>

    <AppModal v-model="showConfirmValider" size="sm">
      <template #header>
        <h3 class="text-base font-semibold text-slate-800 dark:text-white">Valider la commande</h3>
      </template>
      <p class="text-sm text-slate-600 dark:text-slate-300">
        Valider la commande <strong>« {{ selectedCommande?.nom }} »</strong> ? Elle passera en lecture seule, pourra être exportée (ZIP) vers l'EBM, et tu pourras toujours la rouvrir si besoin.
      </p>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button type="button" class="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300" @click="showConfirmValider = false">Annuler</button>
          <button type="button" class="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700" @click="confirmValider">Valider la commande</button>
        </div>
      </template>
    </AppModal>

    <AppModal v-model="showConfirmRouvrir" size="sm">
      <template #header>
        <h3 class="text-base font-semibold text-slate-800 dark:text-white">Rouvrir la commande</h3>
      </template>
      <p class="text-sm text-slate-600 dark:text-slate-300">
        Rouvrir la commande <strong>« {{ selectedCommande?.nom }} »</strong> en « en cours » ? Elle redeviendra modifiable et la trace d'export sera effacée.
      </p>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button type="button" class="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300" @click="showConfirmRouvrir = false">Annuler</button>
          <button type="button" class="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700" @click="confirmRouvrir">Rouvrir</button>
        </div>
      </template>
    </AppModal>
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
