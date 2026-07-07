<script setup>
const props = defineProps({
  open:       { type: Boolean, required: true },
  chantierId: { type: [String, Number], required: true },
  // Listes existantes utilisées pour calculer le delta (articles déjà commandés)
  commandes:  { type: Array, default: () => [] },
  metier:     { type: String, default: 'SES' }, // métier de la liste importée
})

const emit = defineEmits(['close', 'imported'])

const { createCommande, addLigne, updateLigne, getLignes } = useCommandesMatieres()
const { metierLabel } = useMetier()
const user = useAuthUser()
const client = useSupabaseClient()

// ─── État ─────────────────────────────────────────────────────────────────────
const step        = ref(1)   // 1 = upload, 2 = prévisualisation
const dragging    = ref(false)
const fileName    = ref('')
const rowCount    = ref(0)
const analysing   = ref(false)
const importing   = ref(false)
const listNom     = ref('')
const activeTab   = ref('reconnus')

// Destination : nouvelle liste ou ajout à une liste existante
const mode        = ref('new')          // 'new' | 'existing'
const formMetier  = ref(props.metier)   // métier de la nouvelle liste
const targetId    = ref(null)           // id de la liste existante cible

// Listes existantes modifiables : brouillon + créées par l'utilisateur
// (created_by null = liste historique, modifiable par tous ; admin = tout)
const targetItems = computed(() => props.commandes.filter((c) =>
  c.statut !== 'commandee' &&
  (!c.created_by || c.created_by === user.value?.id || (user.value?.role ?? 0) >= 1),
))

const reconnus  = ref([])   // [{ symbole, quantite, catalogue: {...} }]
const inconnus  = ref([])   // [{ symbole, quantite, libelle }]
const parsedRows = ref([])  // [{ NUMERO, 'QUANTITE ENTIERE', ... }]

// ─── Delta : sélection des listes de référence ────────────────────────────────
const selectedRefIds  = ref(new Set())   // Set<commandeId>
const refLignesMap    = ref(new Map())   // Map<commandeId, lignes[]>
const udMap           = ref(new Map())   // Map<udCode, { quantite_par_unite }>
const showRefSection  = ref(false)       // panneau repliable

// Charger la table des unités de distribution une fois
const loadUdMap = async () => {
  if (udMap.value.size > 0) return
  const { data } = await client
    .from('catalogue_unites_distribution')
    .select('code, quantite_par_unite')
  if (data) udMap.value = new Map(data.map((r) => [r.code, r]))
}

onMounted(loadUdMap)

// Items de référence : listes existantes
const refItems = computed(() => props.commandes)

const toggleRef = async (itemId) => {
  const next = new Set(selectedRefIds.value)
  if (next.has(itemId)) {
    next.delete(itemId)
  } else {
    next.add(itemId)
    if (!refLignesMap.value.has(itemId)) {
      const lignes = await getLignes(itemId)
      refLignesMap.value.set(itemId, lignes)
    }
  }
  selectedRefIds.value = next
}

// Pièces réellement commandées par symbole (conditionnement arrondi vers le haut)
const alreadyOrdered = computed(() => {
  const map = new Map()
  for (const id of selectedRefIds.value) {
    for (const l of refLignesMap.value.get(id) || []) {
      const qpu = udMap.value.get(l.catalogue_matieres?.unite_distribution)?.quantite_par_unite
      const ordered = (qpu && qpu > 1)
        ? Math.ceil(l.quantite / qpu) * qpu
        : (l.quantite || 0)
      map.set(l.numero_symbole, (map.get(l.numero_symbole) || 0) + ordered)
    }
  }
  return map
})

// Reconnus enrichis avec déjà-commandé et delta
const reconnusAvecDelta = computed(() =>
  reconnus.value.map((r) => {
    const dejaCommande = alreadyOrdered.value.get(r.symbole) || 0
    const delta = Math.max(0, r.quantite - dejaCommande)
    return { ...r, dejaCommande, delta }
  })
)

// Articles effectivement importés (quantité ajustée si mode delta actif)
const itemsAImporter = computed(() =>
  selectedRefIds.value.size > 0
    ? reconnusAvecDelta.value.filter((r) => r.delta > 0).map((r) => ({ ...r, quantite: r.delta }))
    : reconnus.value
)

// ─── Reset ────────────────────────────────────────────────────────────────────
const reset = () => {
  step.value          = 1
  dragging.value      = false
  fileName.value      = ''
  rowCount.value      = 0
  analysing.value     = false
  importing.value     = false
  listNom.value       = ''
  activeTab.value     = 'reconnus'
  mode.value          = 'new'
  formMetier.value    = props.metier
  targetId.value      = null
  reconnus.value      = []
  inconnus.value      = []
  parsedRows.value    = []
  selectedRefIds.value = new Set()
  refLignesMap.value   = new Map()
  showRefSection.value = false
}

watch(() => props.open, (v) => { if (!v) reset() })

// ─── Parsing xlsx ─────────────────────────────────────────────────────────────
const parseFile = (file) => {
  fileName.value = file.name
  const reader = new FileReader()
  reader.onload = async (ev) => {
    const XLSX = await import('xlsx')
    const wb = XLSX.read(ev.target.result, { type: 'array' })
    const ws = wb.Sheets[wb.SheetNames[0]]

    const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

    const headerRowIdx = raw.findIndex((row) =>
      row.some((cell) => String(cell).trim().toUpperCase() === 'NUMERO')
    )

    if (headerRowIdx === -1) {
      parsedRows.value = []
      rowCount.value = 0
      return
    }

    const headers = raw[headerRowIdx].map((h) => String(h).trim())
    const dataRows = raw.slice(headerRowIdx + 1)

    const data = dataRows.map((row) => {
      const obj = {}
      headers.forEach((h, i) => { obj[h] = row[i] ?? '' })
      return obj
    })

    // Garde uniquement les lignes dont NUMERO contient au moins un chiffre
    // (ignore les lignes de totaux, en-têtes secondaires, etc.).
    parsedRows.value = data.filter((r) => {
      const num = String(r['NUMERO'] ?? '').replace(/\s+/g, '').trim()
      if (!num) return false
      if (num.toLowerCase() === 'total') return false
      return /\d/.test(num)
    })
    rowCount.value = parsedRows.value.length
  }
  reader.readAsArrayBuffer(file)
}

const onFileInput = (e) => {
  const file = e.target.files?.[0]
  if (file) parseFile(file)
  e.target.value = ''
}

const onDrop = (e) => {
  dragging.value = false
  const file = e.dataTransfer.files?.[0]
  if (file) parseFile(file)
}

// ─── Analyse (lookup catalogue) ───────────────────────────────────────────────
const analyser = async () => {
  if (!parsedRows.value.length) return
  analysing.value = true

  const allSymboles = [...new Set(parsedRows.value.map((r) => String(r['NUMERO']).trim()))]

  const { data } = await client
    .from('catalogue_matieres')
    .select('numero_symbole, description, unite_distribution, prix_ud')
    .in('numero_symbole', allSymboles)

  const catalogueMap = new Map((data ?? []).map((r) => [r.numero_symbole, r]))

  reconnus.value = []
  inconnus.value = []

  for (const row of parsedRows.value) {
    const symbole = String(row['NUMERO']).trim()
    const rawQte  = String(row['QUANTITE ENTIERE'] ?? '0').replace(',', '.')
    const quantite = parseFloat(rawQte) || 0
    const libelle  = String(row['LIBELLE'] ?? '').trim()
    const cat = catalogueMap.get(symbole)
    if (cat) {
      reconnus.value.push({ symbole, quantite, catalogue: cat })
    } else {
      inconnus.value.push({ symbole, quantite, libelle })
    }
  }

  listNom.value = fileName.value.replace(/\.(xlsx|xls)$/i, '')
  activeTab.value = 'reconnus'
  step.value = 2
  analysing.value = false
}

// ─── Import ───────────────────────────────────────────────────────────────────
const doImport = async () => {
  if (!itemsAImporter.value.length || importing.value) return

  // Ajout à une liste existante : les quantités des symboles déjà présents
  // sont additionnées, les autres articles sont ajoutés en fin de liste.
  if (mode.value === 'existing') {
    const target = targetItems.value.find((c) => c.id === targetId.value)
    if (!target) return
    importing.value = true

    const existantes = await getLignes(target.id)
    const bySymbole = new Map(existantes.map((l) => [l.numero_symbole, l]))
    const lignes = []
    let ordre = existantes.length
    for (const { symbole, quantite } of itemsAImporter.value) {
      const exist = bySymbole.get(symbole)
      const ligne = exist
        ? await updateLigne(exist.id, { quantite: (exist.quantite || 0) + quantite })
        : await addLigne(target.id, symbole, quantite, ordre++)
      if (ligne) lignes.push(ligne)
    }

    importing.value = false
    emit('imported', { commande: target, lignes, isNew: false })
    return
  }

  if (!listNom.value.trim()) return
  importing.value = true

  const commande = await createCommande({
    nom: listNom.value.trim(),
    chantier_id: props.chantierId,
    metier: formMetier.value,
  })
  if (!commande) { importing.value = false; return }

  const lignes = []
  for (let i = 0; i < itemsAImporter.value.length; i++) {
    const { symbole, quantite } = itemsAImporter.value[i]
    const ligne = await addLigne(commande.id, symbole, quantite, i)
    if (ligne) lignes.push(ligne)
  }

  importing.value = false
  emit('imported', { commande, lignes, isNew: true })
}

// ─── Formatage prix ───────────────────────────────────────────────────────────
const fmtPrix = (v) => {
  if (v == null) return '—'
  return Number(v).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}

// Date courte pour la liste des commandes de référence
const fmtDate = (iso) => {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}
</script>

<template>
  <AppModal :model-value="open" size="half" @update:model-value="emit('close')">

    <!-- ── Header ──────────────────────────────────────────────────────────── -->
    <template #header>
      <h3 class="text-base font-semibold text-slate-800 dark:text-white">
        Importer un fichier xlsx
      </h3>
    </template>

    <!-- ── Étape 1 : Upload ────────────────────────────────────────────────── -->
    <div v-if="step === 1" class="space-y-5">
      <!-- Drop zone -->
      <label
        class="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 transition"
        :class="dragging
          ? 'border-secondary-400 bg-secondary-50 dark:border-secondary-600 dark:bg-secondary-900/20'
          : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'"
        @dragover.prevent="dragging = true"
        @dragleave.prevent="dragging = false"
        @drop.prevent="onDrop"
      >
        <input type="file" accept=".xlsx,.xls" class="sr-only" @change="onFileInput" />
        <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary-100 dark:bg-secondary-900/30">
          <Icon name="lucide:file-spreadsheet" size="24" class="text-secondary-600 dark:text-secondary-400" />
        </div>
        <div class="text-center">
          <p class="text-sm font-medium text-slate-700 dark:text-slate-200">
            Déposer le fichier xlsx ici
          </p>
          <p class="mt-0.5 text-xs text-slate-400">ou cliquer pour parcourir</p>
        </div>
      </label>

      <!-- Fichier sélectionné -->
      <div v-if="fileName" class="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 dark:border-green-800/40 dark:bg-green-900/20">
        <Icon name="lucide:file-check" size="18" class="flex-none text-green-600 dark:text-green-400" />
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-medium text-green-700 dark:text-green-300">{{ fileName }}</p>
          <p class="text-xs text-green-600 dark:text-green-400">{{ rowCount }} article{{ rowCount > 1 ? 's' : '' }} détecté{{ rowCount > 1 ? 's' : '' }}</p>
        </div>
      </div>

      <!-- Info colonnes -->
      <div class="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
        <p class="font-medium text-slate-600 dark:text-slate-300">Colonnes attendues dans le fichier</p>
        <p class="mt-1">
          <span class="font-mono font-semibold">NUMERO</span> (numéro de symbole) ·
          <span class="font-mono font-semibold">QUANTITE ENTIERE</span> (quantité à importer)
        </p>
        <p class="mt-0.5 text-slate-400">Les autres colonnes (LIBELLE, PRIX, PRIX TOTAL) sont ignorées.</p>
      </div>
    </div>

    <!-- ── Étape 2 : Prévisualisation ──────────────────────────────────────── -->
    <div v-else class="space-y-4">
      <!-- Bilan -->
      <div class="flex gap-3">
        <div class="flex flex-1 items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 dark:border-green-800/40 dark:bg-green-900/20">
          <Icon name="lucide:check-circle" size="16" class="flex-none text-green-600 dark:text-green-400" />
          <span class="text-sm font-medium text-green-700 dark:text-green-300">
            {{ reconnus.length }} article{{ reconnus.length > 1 ? 's' : '' }} reconnu{{ reconnus.length > 1 ? 's' : '' }}
          </span>
        </div>
        <div
          v-if="inconnus.length > 0"
          class="flex flex-1 items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 dark:border-amber-800/40 dark:bg-amber-900/20"
        >
          <Icon name="lucide:alert-triangle" size="16" class="flex-none text-amber-600 dark:text-amber-400" />
          <span class="text-sm font-medium text-amber-700 dark:text-amber-300">
            {{ inconnus.length }} inconnu{{ inconnus.length > 1 ? 's' : '' }} (ignoré{{ inconnus.length > 1 ? 's' : '' }})
          </span>
        </div>
      </div>

      <!-- ── Section delta (déduire articles déjà commandés) ──────────────── -->
      <div v-if="refItems.length > 0" class="rounded-lg border border-slate-200 dark:border-slate-700">
        <!-- En-tête repliable -->
        <button
          type="button"
          class="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700/50"
          @click="showRefSection = !showRefSection"
        >
          <span class="flex items-center gap-2">
            <Icon name="lucide:git-compare-arrows" size="15" class="text-slate-400" />
            Déduire les articles déjà commandés
            <span v-if="selectedRefIds.size > 0" class="rounded-full bg-secondary-100 px-1.5 py-0.5 text-xs font-semibold text-secondary-700 dark:bg-secondary-900/40 dark:text-secondary-300">
              {{ selectedRefIds.size }} liste{{ selectedRefIds.size > 1 ? 's' : '' }}
            </span>
          </span>
          <Icon :name="showRefSection ? 'lucide:chevron-up' : 'lucide:chevron-down'" size="15" class="text-slate-400" />
        </button>

        <!-- Liste des références -->
        <div v-if="showRefSection" class="border-t border-slate-200 px-3 py-2 dark:border-slate-700">
          <p class="mb-2 text-xs text-slate-400">
            Cocher les listes déjà envoyées en commande ERP :
          </p>
          <div class="max-h-36 space-y-1 overflow-y-auto">
            <label
              v-for="item in refItems"
              :key="item.id"
              class="flex cursor-pointer items-center gap-2.5 rounded px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-700/50"
            >
              <input
                type="checkbox"
                class="h-3.5 w-3.5 rounded border-slate-300 accent-secondary-600"
                :checked="selectedRefIds.has(item.id)"
                @change="toggleRef(item.id)"
              />
              <span class="flex-1 truncate text-sm text-slate-700 dark:text-slate-200">{{ item.nom }}</span>
              <span class="shrink-0 text-xs text-slate-400">{{ fmtDate(item.created_at) }}</span>
            </label>
          </div>
        </div>
      </div>

      <!-- Onglets prévisualisation -->
      <div class="border-b border-slate-200 dark:border-slate-700">
        <div class="flex gap-1">
          <button
            type="button"
            class="rounded-t-md px-4 py-2 text-sm font-medium transition"
            :class="activeTab === 'reconnus'
              ? 'border-b-2 border-secondary-500 text-secondary-600 dark:text-secondary-400'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'"
            @click="activeTab = 'reconnus'"
          >
            Reconnus ({{ reconnus.length }})
          </button>
          <button
            v-if="inconnus.length"
            type="button"
            class="rounded-t-md px-4 py-2 text-sm font-medium transition"
            :class="activeTab === 'inconnus'
              ? 'border-b-2 border-amber-500 text-amber-600 dark:text-amber-400'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'"
            @click="activeTab = 'inconnus'"
          >
            Inconnus ({{ inconnus.length }})
          </button>
        </div>
      </div>

      <!-- Tableau reconnus (mode normal) -->
      <div v-if="activeTab === 'reconnus' && selectedRefIds.size === 0" class="max-h-52 overflow-auto rounded-lg border border-slate-200 dark:border-slate-700">
        <table class="w-full text-sm">
          <thead class="sticky top-0 bg-slate-50 dark:bg-slate-800">
            <tr class="border-b border-slate-200 dark:border-slate-700">
              <th class="px-3 py-2 text-left text-xs font-semibold text-slate-400">N° Symbole</th>
              <th class="px-3 py-2 text-left text-xs font-semibold text-slate-400">Désignation</th>
              <th class="px-3 py-2 text-center text-xs font-semibold text-slate-400">UD</th>
              <th class="px-3 py-2 text-right text-xs font-semibold text-slate-400">Qté</th>
              <th class="px-3 py-2 text-right text-xs font-semibold text-slate-400">Prix unit.</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-700/50">
            <tr v-for="item in reconnus" :key="item.symbole" class="bg-white dark:bg-slate-900">
              <td class="px-3 py-2">
                <span class="font-mono text-xs font-semibold text-secondary-600 dark:text-secondary-400">{{ item.symbole }}</span>
              </td>
              <td class="px-3 py-2 text-xs text-slate-600 dark:text-slate-300">{{ item.catalogue.description || '—' }}</td>
              <td class="px-3 py-2 text-center">
                <span class="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                  {{ item.catalogue.unite_distribution || '—' }}
                </span>
              </td>
              <td class="px-3 py-2 text-right text-xs font-semibold text-slate-800 dark:text-slate-100">{{ item.quantite }}</td>
              <td class="px-3 py-2 text-right text-xs text-slate-500 dark:text-slate-400">{{ fmtPrix(item.catalogue.prix_ud) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Tableau reconnus (mode delta) -->
      <div v-if="activeTab === 'reconnus' && selectedRefIds.size > 0" class="max-h-52 overflow-auto rounded-lg border border-slate-200 dark:border-slate-700">
        <table class="w-full text-sm">
          <thead class="sticky top-0 bg-slate-50 dark:bg-slate-800">
            <tr class="border-b border-slate-200 dark:border-slate-700">
              <th class="px-3 py-2 text-left text-xs font-semibold text-slate-400">N° Symbole</th>
              <th class="px-3 py-2 text-left text-xs font-semibold text-slate-400">Désignation</th>
              <th class="px-3 py-2 text-center text-xs font-semibold text-slate-400">UD</th>
              <th class="px-3 py-2 text-right text-xs font-semibold text-slate-400">Besoin</th>
              <th class="px-3 py-2 text-right text-xs font-semibold text-slate-400">Déjà commandé</th>
              <th class="px-3 py-2 text-right text-xs font-semibold text-slate-400">Delta</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-700/50">
            <tr
              v-for="item in reconnusAvecDelta"
              :key="item.symbole"
              :class="item.delta === 0
                ? 'bg-slate-50 opacity-50 dark:bg-slate-800/50'
                : 'bg-white dark:bg-slate-900'"
            >
              <td class="px-3 py-2">
                <span class="font-mono text-xs font-semibold text-secondary-600 dark:text-secondary-400">{{ item.symbole }}</span>
              </td>
              <td class="px-3 py-2 text-xs text-slate-600 dark:text-slate-300">{{ item.catalogue.description || '—' }}</td>
              <td class="px-3 py-2 text-center">
                <span class="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                  {{ item.catalogue.unite_distribution || '—' }}
                </span>
              </td>
              <td class="px-3 py-2 text-right text-xs text-slate-500 dark:text-slate-400">{{ item.quantite }}</td>
              <td class="px-3 py-2 text-right text-xs text-slate-500 dark:text-slate-400">{{ item.dejaCommande || '—' }}</td>
              <td class="px-3 py-2 text-right text-xs font-semibold">
                <span v-if="item.delta === 0" class="rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  Couvert
                </span>
                <span v-else class="text-orange-600 dark:text-orange-400">{{ item.delta }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Tableau inconnus -->
      <div v-if="activeTab === 'inconnus'" class="max-h-52 overflow-auto rounded-lg border border-amber-200 dark:border-amber-800/40">
        <table class="w-full text-sm">
          <thead class="sticky top-0 bg-amber-50 dark:bg-amber-900/20">
            <tr class="border-b border-amber-200 dark:border-amber-800/40">
              <th class="px-3 py-2 text-left text-xs font-semibold text-amber-500">N° Symbole</th>
              <th class="px-3 py-2 text-left text-xs font-semibold text-amber-500">Libellé (xlsx)</th>
              <th class="px-3 py-2 text-right text-xs font-semibold text-amber-500">Qté</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-amber-100 dark:divide-amber-900/20">
            <tr v-for="item in inconnus" :key="item.symbole" class="bg-white dark:bg-slate-900">
              <td class="px-3 py-2 font-mono text-xs font-semibold text-amber-600 dark:text-amber-400">{{ item.symbole }}</td>
              <td class="px-3 py-2 text-xs text-slate-500 dark:text-slate-400">{{ item.libelle || '—' }}</td>
              <td class="px-3 py-2 text-right text-xs text-slate-500 dark:text-slate-400">{{ item.quantite }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Destination : nouvelle liste ou liste existante -->
      <div class="space-y-3">
        <div class="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            class="flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition"
            :class="mode === 'new'
              ? 'border-secondary-300 bg-secondary-50 text-secondary-700 dark:border-secondary-700/50 dark:bg-secondary-900/20 dark:text-secondary-300'
              : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'"
            @click="mode = 'new'"
          >
            <Icon name="lucide:plus" size="14" />
            Nouvelle liste
          </button>
          <button
            type="button"
            :disabled="targetItems.length === 0"
            class="flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40"
            :class="mode === 'existing'
              ? 'border-secondary-300 bg-secondary-50 text-secondary-700 dark:border-secondary-700/50 dark:bg-secondary-900/20 dark:text-secondary-300'
              : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'"
            :title="targetItems.length === 0 ? 'Aucune liste modifiable (brouillon) disponible' : ''"
            @click="mode = 'existing'"
          >
            <Icon name="lucide:list-plus" size="14" />
            Ajouter à une liste
          </button>
        </div>

        <!-- Nouvelle liste : métier + nom -->
        <template v-if="mode === 'new'">
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Métier
            </label>
            <AppMetierTabs v-model="formMetier" size="sm" class="w-full" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Nom de la nouvelle liste
            </label>
            <input
              v-model="listNom"
              type="text"
              class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-secondary-400 focus:ring-2 focus:ring-secondary-100 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            />
          </div>
        </template>

        <!-- Liste existante : sélection de la cible -->
        <div v-else>
          <label class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Liste de destination
          </label>
          <select
            v-model="targetId"
            class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-secondary-400 focus:ring-2 focus:ring-secondary-100 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
          >
            <option :value="null" disabled>Choisir une liste…</option>
            <option v-for="c in targetItems" :key="c.id" :value="c.id">
              {{ metierLabel(c.metier) }} — {{ c.nom }}
            </option>
          </select>
          <p class="mt-1 text-xs text-slate-400">
            Les quantités des articles déjà présents seront additionnées.
          </p>
        </div>
      </div>
    </div>

    <!-- ── Footer ──────────────────────────────────────────────────────────── -->
    <template #footer>
      <div class="flex items-center justify-between gap-3">
        <!-- Gauche : retour -->
        <button
          v-if="step === 2"
          type="button"
          class="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          @click="step = 1"
        >
          <Icon name="lucide:arrow-left" size="14" />
          Retour
        </button>
        <div v-else />

        <!-- Droite : actions -->
        <div class="flex gap-3">
          <button
            type="button"
            class="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
            @click="emit('close')"
          >
            Annuler
          </button>

          <!-- Étape 1 : Analyser -->
          <button
            v-if="step === 1"
            type="button"
            :disabled="!rowCount || analysing"
            class="flex items-center gap-2 rounded-lg bg-secondary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-secondary-700 disabled:opacity-50"
            @click="analyser"
          >
            <div v-if="analysing" class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Analyser →
          </button>

          <!-- Étape 2 : Importer -->
          <button
            v-else
            type="button"
            :disabled="!itemsAImporter.length || importing || (mode === 'new' ? !listNom.trim() : !targetId)"
            class="flex items-center gap-2 rounded-lg bg-secondary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-secondary-700 disabled:opacity-50"
            @click="doImport"
          >
            <div v-if="importing" class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            <Icon v-else name="lucide:download" size="16" />
            <template v-if="mode === 'existing'">
              Ajouter à la liste ({{ itemsAImporter.length }} article{{ itemsAImporter.length > 1 ? 's' : '' }})
            </template>
            <template v-else-if="selectedRefIds.size > 0">
              Créer la liste delta ({{ itemsAImporter.length }} article{{ itemsAImporter.length > 1 ? 's' : '' }})
            </template>
            <template v-else>
              Créer la liste ({{ reconnus.length }} article{{ reconnus.length > 1 ? 's' : '' }})
            </template>
          </button>
        </div>
      </div>
    </template>

  </AppModal>
</template>
