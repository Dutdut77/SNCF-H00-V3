<script setup>
const props = defineProps({
  open: { type: Boolean, required: true },
})

const emit = defineEmits(['close', 'imported'])

const { createEnsemble } = useEnsemblesMatieres()
const client = useSupabaseClient()
const { addToast } = useToast()

// ─── État ─────────────────────────────────────────────────────────────────────
const step       = ref(1)
const dragging   = ref(false)
const fileName   = ref('')
const rowCount   = ref(0)
const analysing  = ref(false)
const importing  = ref(false)
const ensembleNom = ref('')
const activeTab  = ref('reconnus')

const reconnus  = ref([])   // [{ symbole, quantite, catalogue: {...} }]
const inconnus  = ref([])   // [{ symbole, quantite, libelle }]
const parsedRows = ref([])

// ─── Reset ────────────────────────────────────────────────────────────────────
const reset = () => {
  step.value        = 1
  dragging.value    = false
  fileName.value    = ''
  rowCount.value    = 0
  analysing.value   = false
  importing.value   = false
  ensembleNom.value = ''
  activeTab.value   = 'reconnus'
  reconnus.value    = []
  inconnus.value    = []
  parsedRows.value  = []
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
    if (headerRowIdx === -1) { parsedRows.value = []; rowCount.value = 0; return }

    const headers = raw[headerRowIdx].map((h) => String(h).trim())
    const dataRows = raw.slice(headerRowIdx + 1)
    const data = dataRows.map((row) => {
      const obj = {}
      headers.forEach((h, i) => { obj[h] = row[i] ?? '' })
      return obj
    })
    parsedRows.value = data.filter((r) => String(r['NUMERO'] ?? '').trim().length > 0)
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
    const symbole  = String(row['NUMERO']).trim()
    const rawQte   = String(row['QUANTITE ENTIERE'] ?? '0').replace(',', '.')
    const quantite = parseFloat(rawQte) || 0
    const libelle  = String(row['LIBELLE'] ?? '').trim()
    const cat = catalogueMap.get(symbole)
    if (cat) reconnus.value.push({ symbole, quantite, catalogue: cat })
    else     inconnus.value.push({ symbole, quantite, libelle })
  }

  ensembleNom.value = fileName.value.replace(/\.(xlsx|xls)$/i, '')
  activeTab.value = 'reconnus'
  step.value = 2
  analysing.value = false
}

// ─── Import ───────────────────────────────────────────────────────────────────
const doImport = async () => {
  if (!ensembleNom.value.trim() || !reconnus.value.length) return
  importing.value = true

  const ensemble = await createEnsemble({ nom: ensembleNom.value.trim() })
  if (!ensemble) { importing.value = false; return }

  // Bulk insert des lignes
  const { error } = await client
    .from('ensembles_matieres_lignes')
    .insert(
      reconnus.value.map((r, i) => ({
        ensemble_id: ensemble.id,
        numero_symbole: r.symbole,
        quantite: r.quantite,
        ordre: i,
      }))
    )

  if (error) {
    addToast({ title: 'Erreur', message: error.message, type: 'Error' })
    importing.value = false
    return
  }

  importing.value = false
  emit('imported', { ensemble })
}

// ─── Formatage ────────────────────────────────────────────────────────────────
const fmtPrix = (v) => {
  if (v == null) return '—'
  return Number(v).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}
</script>

<template>
  <AppModal :model-value="open" size="half" @update:model-value="emit('close')">

    <template #header>
      <h3 class="text-base font-semibold text-gray-800 dark:text-white">
        Importer un fichier xlsx
      </h3>
    </template>

    <!-- ── Étape 1 : Upload ────────────────────────────────────────────────── -->
    <div v-if="step === 1" class="space-y-5">
      <label
        class="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 transition"
        :class="dragging
          ? 'border-blue-400 bg-blue-50 dark:border-blue-600 dark:bg-blue-900/20'
          : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'"
        @dragover.prevent="dragging = true"
        @dragleave.prevent="dragging = false"
        @drop.prevent="onDrop"
      >
        <input type="file" accept=".xlsx,.xls" class="sr-only" @change="onFileInput" />
        <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
          <Icon name="lucide:file-spreadsheet" size="24" class="text-blue-600 dark:text-blue-400" />
        </div>
        <div class="text-center">
          <p class="text-sm font-medium text-gray-700 dark:text-gray-200">Déposer le fichier xlsx ici</p>
          <p class="mt-0.5 text-xs text-gray-400">ou cliquer pour parcourir</p>
        </div>
      </label>

      <div v-if="fileName" class="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 dark:border-green-800/40 dark:bg-green-900/20">
        <Icon name="lucide:file-check" size="18" class="flex-none text-green-600 dark:text-green-400" />
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-medium text-green-700 dark:text-green-300">{{ fileName }}</p>
          <p class="text-xs text-green-600 dark:text-green-400">{{ rowCount }} article{{ rowCount > 1 ? 's' : '' }} détecté{{ rowCount > 1 ? 's' : '' }}</p>
        </div>
      </div>

      <div class="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 text-xs text-gray-500 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-400">
        <p class="font-medium text-gray-600 dark:text-gray-300">Colonnes attendues dans le fichier</p>
        <p class="mt-1">
          <span class="font-mono font-semibold">NUMERO</span> (numéro de symbole) ·
          <span class="font-mono font-semibold">QUANTITE ENTIERE</span> (quantité)
        </p>
        <p class="mt-0.5 text-gray-400">Les autres colonnes (LIBELLE, PRIX, PRIX TOTAL) sont ignorées.</p>
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

      <!-- Onglets -->
      <div class="border-b border-gray-200 dark:border-gray-700">
        <div class="flex gap-1">
          <button
            type="button"
            class="rounded-t-md px-4 py-2 text-sm font-medium transition"
            :class="activeTab === 'reconnus'
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'"
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
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'"
            @click="activeTab = 'inconnus'"
          >
            Inconnus ({{ inconnus.length }})
          </button>
        </div>
      </div>

      <!-- Tableau reconnus -->
      <div v-if="activeTab === 'reconnus'" class="max-h-64 overflow-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table class="w-full text-sm">
          <thead class="sticky top-0 bg-gray-50 dark:bg-gray-800">
            <tr class="border-b border-gray-200 dark:border-gray-700">
              <th class="px-3 py-2 text-left text-xs font-semibold text-gray-400">N° Symbole</th>
              <th class="px-3 py-2 text-left text-xs font-semibold text-gray-400">Désignation</th>
              <th class="px-3 py-2 text-center text-xs font-semibold text-gray-400">UD</th>
              <th class="px-3 py-2 text-right text-xs font-semibold text-gray-400">Qté</th>
              <th class="px-3 py-2 text-right text-xs font-semibold text-gray-400">Prix unit.</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-700/50">
            <tr v-for="item in reconnus" :key="item.symbole" class="bg-white dark:bg-gray-900">
              <td class="px-3 py-2">
                <span class="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">{{ item.symbole }}</span>
              </td>
              <td class="px-3 py-2 text-xs text-gray-600 dark:text-gray-300">{{ item.catalogue.description || '—' }}</td>
              <td class="px-3 py-2 text-center">
                <span class="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                  {{ item.catalogue.unite_distribution || '—' }}
                </span>
              </td>
              <td class="px-3 py-2 text-right text-xs font-semibold text-gray-800 dark:text-gray-100">{{ item.quantite }}</td>
              <td class="px-3 py-2 text-right text-xs text-gray-500 dark:text-gray-400">{{ fmtPrix(item.catalogue.prix_ud) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Tableau inconnus -->
      <div v-if="activeTab === 'inconnus'" class="max-h-64 overflow-auto rounded-lg border border-amber-200 dark:border-amber-800/40">
        <table class="w-full text-sm">
          <thead class="sticky top-0 bg-amber-50 dark:bg-amber-900/20">
            <tr class="border-b border-amber-200 dark:border-amber-800/40">
              <th class="px-3 py-2 text-left text-xs font-semibold text-amber-500">N° Symbole</th>
              <th class="px-3 py-2 text-left text-xs font-semibold text-amber-500">Libellé (xlsx)</th>
              <th class="px-3 py-2 text-right text-xs font-semibold text-amber-500">Qté</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-amber-100 dark:divide-amber-900/20">
            <tr v-for="item in inconnus" :key="item.symbole" class="bg-white dark:bg-gray-900">
              <td class="px-3 py-2 font-mono text-xs font-semibold text-amber-600 dark:text-amber-400">{{ item.symbole }}</td>
              <td class="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">{{ item.libelle || '—' }}</td>
              <td class="px-3 py-2 text-right text-xs text-gray-500 dark:text-gray-400">{{ item.quantite }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Nom de l'ensemble -->
      <div>
        <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Nom du nouvel ensemble</label>
        <input
          v-model="ensembleNom"
          type="text"
          class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
      </div>
    </div>

    <!-- ── Footer ──────────────────────────────────────────────────────────── -->
    <template #footer>
      <div class="flex items-center justify-between gap-3">
        <button
          v-if="step === 2"
          type="button"
          class="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          @click="step = 1"
        >
          <Icon name="lucide:arrow-left" size="14" />
          Retour
        </button>
        <div v-else />

        <div class="flex gap-3">
          <button
            type="button"
            class="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            @click="emit('close')"
          >
            Annuler
          </button>

          <button
            v-if="step === 1"
            type="button"
            :disabled="!rowCount || analysing"
            class="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
            @click="analyser"
          >
            <div v-if="analysing" class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Analyser →
          </button>

          <button
            v-else
            type="button"
            :disabled="!reconnus.length || !ensembleNom.trim() || importing"
            class="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
            @click="doImport"
          >
            <div v-if="importing" class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            <Icon v-else name="lucide:download" size="16" />
            Créer l'ensemble ({{ reconnus.length }} article{{ reconnus.length > 1 ? 's' : '' }})
          </button>
        </div>
      </div>
    </template>

  </AppModal>
</template>
