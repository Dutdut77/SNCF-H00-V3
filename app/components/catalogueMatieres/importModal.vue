<script setup>
const props = defineProps({
  open: { type: Boolean, required: true },
})

const emit = defineEmits(['close', 'imported'])

const {
  ORIGINES,
  origineLabel,
  fetchSymbolesByOrigine,
  fetchExistingBySymboles,
  fetchReferencedSymboles,
  insertMissingUnites,
  upsertArticles,
  deleteAbsents,
} = useCatalogue()
const { addToast } = useToast()

// ─── Mapping des colonnes du fichier ─────────────────────────────────────────
// En-têtes comparés en ignorant accents/casse/caractères non-alphanum (slugHeader),
// pour tolérer les variations des exports SNCF (Excel, CSV Windows-1252…).
const FIELD_ALIASES = {
  numero_symbole: ['Symbole', 'NUMERO', 'Numéro', 'N° Symbole', 'Numéro de symbole', 'Code article', 'Article', 'numero_symbole'],
  description: ['Designation Abrégée', 'Désignation Abrégée', 'Designation', 'Désignation', 'LIBELLE', 'Libellé', 'Description'],
  prix_ud: ['PRIX', 'Prix UD', 'Prix unitaire', 'PU', 'prix_ud'],
  unite_distribution: ['UD', 'Unité Stock', 'Unite Stock', 'Unité de distribution', 'Unité de vente', 'unite_distribution'],
  info_unite: ['Info unité', 'INFO UNITE', 'info_unite'],
  famille_elan: ['Famille ELAN', 'famille_elan'],
  famille_rff: ['Famille RFF', 'famille_rff'],
  specialite: ['Spécialité', 'Specialite', 'specialite'],
  groupe_famille: ['Groupe famille', 'groupe_famille'],
  famille: ['Famille', 'famille'],
  sous_famille: ['Sous famille', 'Sous-famille', 'sous_famille'],
}

const FIELD_LABELS = {
  numero_symbole: 'N° symbole',
  description: 'Description',
  prix_ud: 'Prix UD',
  unite_distribution: 'Unité de distribution',
  info_unite: 'Info unité',
  famille_elan: 'Famille ELAN',
  famille_rff: 'Famille RFF',
  specialite: 'Spécialité',
  groupe_famille: 'Groupe famille',
  famille: 'Famille',
  sous_famille: 'Sous-famille',
}

// Colonnes TEXT NOT NULL DEFAULT '' en base : l'état vide est '', pas null
const ARTICLE_DEFAULTS = {
  description: '',
  prix_ud: null,
  unite_distribution: '',
  info_unite: '',
  famille_elan: '',
  famille_rff: '',
  specialite: '',
  groupe_famille: '',
  famille: '',
  sous_famille: '',
}

const slugHeader = (s) =>
  String(s)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')

// Un numéro de symbole fait 8 chiffres (constaté sur les 25 000+ articles en
// base) : restaure les 0 de tête mangés par Excel
const normalizeSymbole = (s) => {
  const t = String(s ?? '').trim()
  return /^\d{1,8}$/.test(t) ? t.padStart(8, '0') : t
}

const PREVIEW_MAX = 200

// ─── État réactif ─────────────────────────────────────────────────────────────
const step = ref(1)
const origineChoisie = ref('supply_chain')
const dragging = ref(false)
const fileName = ref('')
const rowCount = ref(0)
const parseError = ref('')
const detectedFields = ref([]) // labels des colonnes reconnues dans le fichier
const analysing = ref(false)
const importing = ref(false)
const activeTab = ref('nouveaux')
const deleteChecked = ref(false)
const counts = ref({ nouveaux: 0, misAJour: 0, chgOrigine: 0, supprimables: 0, conserves: 0 })
const previewNouveaux = ref([])
const previewMisAJour = ref([])
const previewAbsents = ref([])
const progress = ref({ phase: '', done: 0, total: 0 })
const recap = ref(null)

// Données volumineuses hors réactivité (fichiers de dizaines de milliers de lignes)
let parsed = new Map() // numero_symbole → champs parsés du fichier
let providedFields = new Set() // champs réellement présents dans le fichier
let existingMap = new Map() // numero_symbole → row catalogue existante
let supprimablesList = []
let conservesList = []

// ─── Reset ────────────────────────────────────────────────────────────────────
const reset = () => {
  step.value = 1
  origineChoisie.value = 'supply_chain'
  dragging.value = false
  fileName.value = ''
  rowCount.value = 0
  parseError.value = ''
  detectedFields.value = []
  analysing.value = false
  importing.value = false
  activeTab.value = 'nouveaux'
  deleteChecked.value = false
  counts.value = { nouveaux: 0, misAJour: 0, chgOrigine: 0, supprimables: 0, conserves: 0 }
  previewNouveaux.value = []
  previewMisAJour.value = []
  previewAbsents.value = []
  progress.value = { phase: '', done: 0, total: 0 }
  recap.value = null
  parsed = new Map()
  providedFields = new Set()
  existingMap = new Map()
  supprimablesList = []
  conservesList = []
}

watch(() => props.open, (v) => { if (!v) reset() })

// ─── Étape 1 : parsing du fichier ─────────────────────────────────────────────
const parseFile = (file) => {
  fileName.value = file.name
  parseError.value = ''
  const reader = new FileReader()
  reader.onload = async (ev) => {
    try {
      const XLSX = await import('xlsx')
      const buf = ev.target.result
      let wb
      if (/\.csv$/i.test(file.name)) {
        // Exports SNCF souvent en Windows-1252 : détection mojibake (cf. script CLI)
        const utf8 = new TextDecoder('utf-8').decode(buf)
        const looksMojibake = /�/.test(utf8) || /[A-Za-z]È[a-z]/.test(utf8)
        const text = looksMojibake ? new TextDecoder('windows-1252').decode(buf) : utf8
        wb = XLSX.read(text, { type: 'string' })
      } else {
        wb = XLSX.read(buf, { type: 'array' })
      }
      const ws = wb.Sheets[wb.SheetNames[0]]
      const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: false })

      // Ligne d'en-tête = première ligne contenant une colonne symbole reconnue
      const symboleSlugs = new Set(FIELD_ALIASES.numero_symbole.map(slugHeader))
      const headerRowIdx = raw.findIndex((row) => row.some((cell) => symboleSlugs.has(slugHeader(cell))))
      if (headerRowIdx === -1) {
        parsed = new Map()
        rowCount.value = 0
        detectedFields.value = []
        parseError.value = 'Aucune colonne de n° de symbole reconnue (Symbole, NUMERO…)'
        return
      }

      const headers = raw[headerRowIdx].map((h) => String(h).trim())
      const headerSlugToIdx = new Map()
      headers.forEach((h, i) => {
        const s = slugHeader(h)
        if (s && !headerSlugToIdx.has(s)) headerSlugToIdx.set(s, i)
      })

      const fieldIdx = {}
      for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
        for (const a of aliases) {
          const idx = headerSlugToIdx.get(slugHeader(a))
          if (idx !== undefined) {
            fieldIdx[field] = idx
            break
          }
        }
      }
      providedFields = new Set(Object.keys(fieldIdx).filter((f) => f !== 'numero_symbole'))
      detectedFields.value = Object.keys(fieldIdx).map((f) => FIELD_LABELS[f])

      parsed = new Map()
      for (const row of raw.slice(headerRowIdx + 1)) {
        const symbole = normalizeSymbole(row[fieldIdx.numero_symbole])
        if (!symbole) continue
        const entry = {}
        for (const f of providedFields) {
          const v = String(row[fieldIdx[f]] ?? '').trim()
          if (f === 'prix_ud') {
            const p = v === '' ? null : parseFloat(v.replace(/\s/g, '').replace(',', '.'))
            entry[f] = Number.isFinite(p) ? p : null
          } else {
            entry[f] = v
          }
        }
        parsed.set(symbole, entry) // dernière occurrence gagne en cas de doublon
      }
      rowCount.value = parsed.size
    } catch (err) {
      console.error('Erreur parsing fichier catalogue:', err)
      parseError.value = err.message
      parsed = new Map()
      rowCount.value = 0
    }
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

// ─── Étape 2 : analyse (diff avec l'existant) ─────────────────────────────────
const analyser = async () => {
  if (!parsed.size) return
  analysing.value = true
  try {
    const fileSymboles = [...parsed.keys()]
    const [origineSet, existing] = await Promise.all([
      fetchSymbolesByOrigine(origineChoisie.value),
      fetchExistingBySymboles(fileSymboles),
    ])
    existingMap = existing

    const nouveaux = []
    const misAJour = []
    let chgOrigine = 0
    for (const [symbole, row] of parsed) {
      const ex = existing.get(symbole)
      if (!ex) {
        nouveaux.push(symbole)
      } else {
        if (ex.origine !== origineChoisie.value) chgOrigine++
        misAJour.push(symbole)
      }
    }

    const fileSet = new Set(fileSymboles)
    const absents = [...origineSet].filter((s) => !fileSet.has(s))
    const referenced = absents.length ? await fetchReferencedSymboles(absents) : new Set()
    supprimablesList = absents.filter((s) => !referenced.has(s))
    conservesList = absents.filter((s) => referenced.has(s))

    // Descriptions des absents affichés en préviz (au-delà du plafond : symbole seul)
    const absentsPreviewSymboles = [
      ...supprimablesList.slice(0, PREVIEW_MAX),
      ...conservesList.slice(0, PREVIEW_MAX),
    ]
    const absentsDetails = absentsPreviewSymboles.length
      ? await fetchExistingBySymboles(absentsPreviewSymboles)
      : new Map()

    counts.value = {
      nouveaux: nouveaux.length,
      misAJour: misAJour.length,
      chgOrigine,
      supprimables: supprimablesList.length,
      conserves: conservesList.length,
    }

    previewNouveaux.value = nouveaux.slice(0, PREVIEW_MAX).map((s) => ({ symbole: s, ...parsed.get(s) }))
    previewMisAJour.value = misAJour.slice(0, PREVIEW_MAX).map((s) => {
      const ex = existing.get(s)
      const row = parsed.get(s)
      return {
        symbole: s,
        description: row.description || ex.description,
        unite_distribution: row.unite_distribution || ex.unite_distribution,
        prix_ud: row.prix_ud ?? ex.prix_ud,
        chgOrigine: ex.origine !== origineChoisie.value,
        ancienneOrigine: ex.origine,
      }
    })
    previewAbsents.value = [
      ...supprimablesList.slice(0, PREVIEW_MAX).map((s) => ({ symbole: s, referenced: false })),
      ...conservesList.slice(0, PREVIEW_MAX).map((s) => ({ symbole: s, referenced: true })),
    ].map((a) => ({ ...a, description: absentsDetails.get(a.symbole)?.description ?? '' }))

    deleteChecked.value = false
    activeTab.value = nouveaux.length ? 'nouveaux' : misAJour.length ? 'misAJour' : 'absents'
    step.value = 2
  } catch (err) {
    console.error('Erreur analyse import catalogue:', err)
    addToast({ title: 'Erreur', message: err.message, type: 'Error' })
  } finally {
    analysing.value = false
  }
}

// ─── Étape 3 : écriture ───────────────────────────────────────────────────────
const doImport = async () => {
  importing.value = true
  progress.value = { phase: 'articles', done: 0, total: parsed.size }
  try {
    // 1. Codes UD inconnus du référentiel
    let unitesAjoutees = 0
    if (providedFields.has('unite_distribution')) {
      const codes = [...parsed.values()].map((r) => r.unite_distribution).filter(Boolean)
      unitesAjoutees = await insertMissingUnites(codes)
    }

    // 2. Payloads avec merge partiel : un champ absent du fichier (ou cellule vide)
    //    conserve la valeur en base, jamais écrasé par du vide. Projection sur les
    //    clés d'ARTICLE_DEFAULTS : PostgREST exige des clés homogènes dans un lot.
    const payloads = []
    for (const [symbole, row] of parsed) {
      const existing = existingMap.get(symbole)
      const base = existing
        ? Object.fromEntries(Object.keys(ARTICLE_DEFAULTS).map((k) => [k, existing[k]]))
        : { ...ARTICLE_DEFAULTS }
      const merged = { ...base }
      for (const f of providedFields) {
        const v = row[f]
        if (f === 'prix_ud') {
          if (v != null) merged[f] = v
        } else if (v !== '') {
          merged[f] = v
        }
      }
      merged.numero_symbole = symbole
      merged.origine = origineChoisie.value
      if (!merged.description) merged.description = `[${origineLabel(origineChoisie.value)} ${symbole}]`
      payloads.push(merged)
    }

    const upserted = await upsertArticles(payloads, (done, total) => {
      progress.value = { phase: 'articles', done, total }
    })

    // 3. Suppression optionnelle des absents non référencés
    let deleted = 0
    if (deleteChecked.value && supprimablesList.length) {
      progress.value = { phase: 'suppression', done: 0, total: supprimablesList.length }
      deleted = await deleteAbsents(supprimablesList, origineChoisie.value, (done, total) => {
        progress.value = { phase: 'suppression', done, total }
      })
    }

    recap.value = {
      upserted,
      nouveaux: counts.value.nouveaux,
      misAJour: counts.value.misAJour,
      deleted,
      unitesAjoutees,
      conserves: conservesList.length,
    }
    addToast({ title: 'Succès', message: `${upserted} article(s) importé(s) dans le catalogue`, type: 'Success' })
    step.value = 3
  } catch (err) {
    console.error('Erreur import catalogue:', err)
    addToast({ title: 'Erreur', message: err.message, type: 'Error' })
  } finally {
    importing.value = false
  }
}

// ─── Formatage ────────────────────────────────────────────────────────────────
const fmtPrix = (v) => {
  if (v == null) return '—'
  return Number(v).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}

const fmtNombre = (v) => Number(v ?? 0).toLocaleString('fr-FR')
</script>

<template>
  <AppModal
    :model-value="open"
    size="half"
    :persistent="importing"
    :show-close-button="!importing"
    @update:model-value="emit('close')"
  >
    <template #header>
      <h3 class="text-base font-semibold text-slate-800 dark:text-white">
        Mettre à jour le catalogue d'articles
      </h3>
    </template>

    <!-- ── Import en cours ─────────────────────────────────────────────────── -->
    <div v-if="importing" class="space-y-4 py-8">
      <p class="text-center text-sm font-medium text-slate-700 dark:text-slate-200">
        {{ progress.phase === 'suppression' ? 'Suppression des articles absents…' : 'Import des articles…' }}
      </p>
      <div class="mx-auto w-full max-w-md">
        <div class="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
          <div
            class="h-full rounded-full bg-secondary-500 transition-all"
            :style="{ width: `${progress.total ? Math.round((progress.done / progress.total) * 100) : 0}%` }"
          />
        </div>
        <p class="mt-2 text-center text-xs text-slate-400">{{ fmtNombre(progress.done) }} / {{ fmtNombre(progress.total) }}</p>
      </div>
      <p class="text-center text-xs text-slate-400">Ne pas fermer cette fenêtre pendant l'import.</p>
    </div>

    <!-- ── Étape 1 : Origine + Upload ──────────────────────────────────────── -->
    <div v-else-if="step === 1" class="space-y-5">
      <!-- Choix de l'origine -->
      <div>
        <p class="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Type d'articles du fichier</p>
        <div class="grid grid-cols-2 gap-3">
          <button
            v-for="o in ORIGINES"
            :key="o.id"
            type="button"
            class="flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition"
            :class="origineChoisie === o.id
              ? 'border-secondary-400 bg-secondary-50 dark:border-secondary-600 dark:bg-secondary-900/20'
              : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'"
            @click="origineChoisie = o.id"
          >
            <div
              class="flex h-9 w-9 flex-none items-center justify-center rounded-lg"
              :class="o.id === 'contrat_cadre'
                ? 'bg-amber-100 dark:bg-amber-900/30'
                : 'bg-secondary-100 dark:bg-secondary-900/30'"
            >
              <Icon
                :name="o.id === 'contrat_cadre' ? 'lucide:file-badge' : 'lucide:package'"
                size="18"
                :class="o.id === 'contrat_cadre'
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-secondary-600 dark:text-secondary-400'"
              />
            </div>
            <div>
              <p class="text-sm font-medium text-slate-700 dark:text-slate-200">
                {{ o.id === 'contrat_cadre' ? 'Contrats cadres' : 'Articles symbolisés' }}
              </p>
              <p class="text-xs text-slate-400">
                {{ o.id === 'contrat_cadre' ? 'Marchés cadres fournisseurs' : 'Catalogue Supply Chain' }}
              </p>
            </div>
          </button>
        </div>
      </div>

      <!-- Drop zone -->
      <label
        class="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 transition"
        :class="dragging
          ? 'border-secondary-400 bg-secondary-50 dark:border-secondary-600 dark:bg-secondary-900/20'
          : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'"
        @dragover.prevent="dragging = true"
        @dragleave.prevent="dragging = false"
        @drop.prevent="onDrop"
      >
        <input type="file" accept=".xlsx,.xls,.csv" class="sr-only" @change="onFileInput" />
        <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary-100 dark:bg-secondary-900/30">
          <Icon name="lucide:file-spreadsheet" size="24" class="text-secondary-600 dark:text-secondary-400" />
        </div>
        <div class="text-center">
          <p class="text-sm font-medium text-slate-700 dark:text-slate-200">Déposer le fichier Excel ou CSV ici</p>
          <p class="mt-0.5 text-xs text-slate-400">ou cliquer pour parcourir (.xlsx, .xls, .csv)</p>
        </div>
      </label>

      <!-- Fichier chargé -->
      <div v-if="fileName && rowCount" class="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 dark:border-green-800/40 dark:bg-green-900/20">
        <Icon name="lucide:file-check" size="18" class="flex-none text-green-600 dark:text-green-400" />
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-medium text-green-700 dark:text-green-300">{{ fileName }}</p>
          <p class="text-xs text-green-600 dark:text-green-400">
            {{ fmtNombre(rowCount) }} article{{ rowCount > 1 ? 's' : '' }} détecté{{ rowCount > 1 ? 's' : '' }}
            · colonnes reconnues : {{ detectedFields.join(', ') }}
          </p>
        </div>
      </div>
      <div v-else-if="fileName && parseError" class="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800/40 dark:bg-red-900/20">
        <Icon name="lucide:file-x" size="18" class="flex-none text-red-600 dark:text-red-400" />
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-medium text-red-700 dark:text-red-300">{{ fileName }}</p>
          <p class="text-xs text-red-600 dark:text-red-400">{{ parseError }}</p>
        </div>
      </div>

      <!-- Aide colonnes -->
      <div class="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
        <p class="font-medium text-slate-600 dark:text-slate-300">Colonnes détectées automatiquement (accents et casse ignorés)</p>
        <p class="mt-1">
          <span class="font-mono font-semibold">Symbole / NUMERO</span> (obligatoire) ·
          <span class="font-mono">Désignation / LIBELLE</span> ·
          <span class="font-mono">PRIX</span> ·
          <span class="font-mono">UD / Unité Stock</span> ·
          familles…
        </p>
        <p class="mt-0.5 text-slate-400">
          Les colonnes absentes du fichier ne modifient pas les valeurs déjà en base.
          L'import ajoute et met à jour, il ne supprime jamais sans votre confirmation.
        </p>
      </div>
    </div>

    <!-- ── Étape 2 : Prévisualisation ──────────────────────────────────────── -->
    <div v-else-if="step === 2" class="space-y-4">
      <!-- Bilan -->
      <div class="flex flex-wrap gap-3">
        <div class="flex flex-1 items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2.5 dark:border-green-800/40 dark:bg-green-900/20">
          <Icon name="lucide:plus-circle" size="16" class="flex-none text-green-600 dark:text-green-400" />
          <span class="text-sm font-medium text-green-700 dark:text-green-300">
            {{ fmtNombre(counts.nouveaux) }} nouveau{{ counts.nouveaux > 1 ? 'x' : '' }}
          </span>
        </div>
        <div class="flex flex-1 items-center gap-2 rounded-lg border border-secondary-200 bg-secondary-50 px-3 py-2.5 dark:border-secondary-800/40 dark:bg-secondary-900/20">
          <Icon name="lucide:refresh-cw" size="16" class="flex-none text-secondary-600 dark:text-secondary-400" />
          <span class="text-sm font-medium text-secondary-700 dark:text-secondary-300">
            {{ fmtNombre(counts.misAJour) }} mis à jour
            <span v-if="counts.chgOrigine" class="font-normal opacity-75">(dont {{ fmtNombre(counts.chgOrigine) }} changement{{ counts.chgOrigine > 1 ? 's' : '' }} d'origine)</span>
          </span>
        </div>
        <div
          v-if="counts.supprimables + counts.conserves > 0"
          class="flex flex-1 items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 dark:border-amber-800/40 dark:bg-amber-900/20"
        >
          <Icon name="lucide:alert-triangle" size="16" class="flex-none text-amber-600 dark:text-amber-400" />
          <span class="text-sm font-medium text-amber-700 dark:text-amber-300">
            {{ fmtNombre(counts.supprimables + counts.conserves) }} absent{{ counts.supprimables + counts.conserves > 1 ? 's' : '' }} du fichier
          </span>
        </div>
      </div>

      <!-- Onglets -->
      <div class="border-b border-slate-200 dark:border-slate-700">
        <div class="flex gap-1">
          <button
            v-if="counts.nouveaux"
            type="button"
            class="rounded-t-md px-4 py-2 text-sm font-medium transition"
            :class="activeTab === 'nouveaux'
              ? 'border-b-2 border-green-500 text-green-600 dark:text-green-400'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'"
            @click="activeTab = 'nouveaux'"
          >
            Nouveaux ({{ fmtNombre(counts.nouveaux) }})
          </button>
          <button
            v-if="counts.misAJour"
            type="button"
            class="rounded-t-md px-4 py-2 text-sm font-medium transition"
            :class="activeTab === 'misAJour'
              ? 'border-b-2 border-secondary-500 text-secondary-600 dark:text-secondary-400'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'"
            @click="activeTab = 'misAJour'"
          >
            Mis à jour ({{ fmtNombre(counts.misAJour) }})
          </button>
          <button
            v-if="counts.supprimables + counts.conserves"
            type="button"
            class="rounded-t-md px-4 py-2 text-sm font-medium transition"
            :class="activeTab === 'absents'
              ? 'border-b-2 border-amber-500 text-amber-600 dark:text-amber-400'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'"
            @click="activeTab = 'absents'"
          >
            Absents ({{ fmtNombre(counts.supprimables + counts.conserves) }})
          </button>
        </div>
      </div>

      <!-- Tableau nouveaux -->
      <div v-if="activeTab === 'nouveaux'" class="max-h-64 overflow-auto rounded-lg border border-slate-200 dark:border-slate-700">
        <table class="w-full text-sm">
          <thead class="sticky top-0 bg-slate-50 dark:bg-slate-800">
            <tr class="border-b border-slate-200 dark:border-slate-700">
              <th class="px-3 py-2 text-left text-xs font-semibold text-slate-400">N° Symbole</th>
              <th class="px-3 py-2 text-left text-xs font-semibold text-slate-400">Désignation</th>
              <th class="px-3 py-2 text-center text-xs font-semibold text-slate-400">UD</th>
              <th class="px-3 py-2 text-right text-xs font-semibold text-slate-400">Prix UD</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-700/50">
            <tr v-for="item in previewNouveaux" :key="item.symbole" class="bg-white dark:bg-slate-900">
              <td class="px-3 py-2">
                <span class="font-mono text-xs font-semibold text-green-600 dark:text-green-400">{{ item.symbole }}</span>
              </td>
              <td class="px-3 py-2 text-xs text-slate-600 dark:text-slate-300">{{ item.description || '—' }}</td>
              <td class="px-3 py-2 text-center">
                <span class="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                  {{ item.unite_distribution || '—' }}
                </span>
              </td>
              <td class="px-3 py-2 text-right text-xs text-slate-500 dark:text-slate-400">{{ fmtPrix(item.prix_ud) }}</td>
            </tr>
            <tr v-if="counts.nouveaux > previewNouveaux.length" class="bg-white dark:bg-slate-900">
              <td colspan="4" class="px-3 py-2 text-center text-xs italic text-slate-400">
                … et {{ fmtNombre(counts.nouveaux - previewNouveaux.length) }} autre{{ counts.nouveaux - previewNouveaux.length > 1 ? 's' : '' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Tableau mis à jour -->
      <div v-if="activeTab === 'misAJour'" class="max-h-64 overflow-auto rounded-lg border border-slate-200 dark:border-slate-700">
        <table class="w-full text-sm">
          <thead class="sticky top-0 bg-slate-50 dark:bg-slate-800">
            <tr class="border-b border-slate-200 dark:border-slate-700">
              <th class="px-3 py-2 text-left text-xs font-semibold text-slate-400">N° Symbole</th>
              <th class="px-3 py-2 text-left text-xs font-semibold text-slate-400">Désignation</th>
              <th class="px-3 py-2 text-center text-xs font-semibold text-slate-400">UD</th>
              <th class="px-3 py-2 text-right text-xs font-semibold text-slate-400">Prix UD</th>
              <th class="px-3 py-2 text-center text-xs font-semibold text-slate-400">Origine</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-700/50">
            <tr v-for="item in previewMisAJour" :key="item.symbole" class="bg-white dark:bg-slate-900">
              <td class="px-3 py-2">
                <span class="font-mono text-xs font-semibold text-secondary-600 dark:text-secondary-400">{{ item.symbole }}</span>
              </td>
              <td class="px-3 py-2 text-xs text-slate-600 dark:text-slate-300">{{ item.description || '—' }}</td>
              <td class="px-3 py-2 text-center">
                <span class="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                  {{ item.unite_distribution || '—' }}
                </span>
              </td>
              <td class="px-3 py-2 text-right text-xs text-slate-500 dark:text-slate-400">{{ fmtPrix(item.prix_ud) }}</td>
              <td class="px-3 py-2 text-center">
                <span
                  v-if="item.chgOrigine"
                  class="rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-600 dark:bg-violet-900/20 dark:text-violet-300"
                  :title="`Était : ${origineLabel(item.ancienneOrigine)}`"
                >
                  {{ origineLabel(item.ancienneOrigine) }} → {{ origineLabel(origineChoisie) }}
                </span>
                <span v-else class="text-xs text-slate-400">—</span>
              </td>
            </tr>
            <tr v-if="counts.misAJour > previewMisAJour.length" class="bg-white dark:bg-slate-900">
              <td colspan="5" class="px-3 py-2 text-center text-xs italic text-slate-400">
                … et {{ fmtNombre(counts.misAJour - previewMisAJour.length) }} autre{{ counts.misAJour - previewMisAJour.length > 1 ? 's' : '' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Tableau absents -->
      <div v-if="activeTab === 'absents'" class="max-h-64 overflow-auto rounded-lg border border-amber-200 dark:border-amber-800/40">
        <table class="w-full text-sm">
          <thead class="sticky top-0 bg-amber-50 dark:bg-amber-900/20">
            <tr class="border-b border-amber-200 dark:border-amber-800/40">
              <th class="px-3 py-2 text-left text-xs font-semibold text-amber-500">N° Symbole</th>
              <th class="px-3 py-2 text-left text-xs font-semibold text-amber-500">Désignation</th>
              <th class="px-3 py-2 text-center text-xs font-semibold text-amber-500">Statut</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-amber-100 dark:divide-amber-900/20">
            <tr v-for="item in previewAbsents" :key="item.symbole" class="bg-white dark:bg-slate-900">
              <td class="px-3 py-2 font-mono text-xs font-semibold text-amber-600 dark:text-amber-400">{{ item.symbole }}</td>
              <td class="px-3 py-2 text-xs text-slate-500 dark:text-slate-400">{{ item.description || '—' }}</td>
              <td class="px-3 py-2 text-center">
                <span
                  v-if="item.referenced"
                  class="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                  title="Utilisé dans une commande, un ensemble ou une logique métier : conservé"
                >
                  Référencé — conservé
                </span>
                <span v-else class="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-500 dark:bg-red-900/20 dark:text-red-400">
                  Supprimable
                </span>
              </td>
            </tr>
            <tr v-if="counts.supprimables + counts.conserves > previewAbsents.length" class="bg-white dark:bg-slate-900">
              <td colspan="3" class="px-3 py-2 text-center text-xs italic text-slate-400">
                … et {{ fmtNombre(counts.supprimables + counts.conserves - previewAbsents.length) }} autre{{ counts.supprimables + counts.conserves - previewAbsents.length > 1 ? 's' : '' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Option suppression -->
      <div
        v-if="counts.supprimables + counts.conserves > 0"
        class="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/50"
      >
        <AppCheckbox
          v-model="deleteChecked"
          :disabled="!counts.supprimables"
          :label="`Supprimer les ${fmtNombre(counts.supprimables)} article(s) absent(s) non référencé(s) (${origineLabel(origineChoisie)})`"
        />
        <p class="mt-1.5 pl-6 text-xs text-slate-400">
          <template v-if="counts.conserves">
            {{ fmtNombre(counts.conserves) }} article(s) absent(s) mais utilisé(s) dans des commandes, ensembles ou logiques métier seront conservés.
          </template>
          <template v-else-if="!counts.supprimables">Aucun article supprimable.</template>
          <template v-else>Ces articles n'apparaissent dans aucune commande, ensemble ou logique métier.</template>
        </p>
      </div>
    </div>

    <!-- ── Étape 3 : Récapitulatif ─────────────────────────────────────────── -->
    <div v-else class="space-y-4 py-2">
      <div class="flex flex-col items-center gap-2 py-2">
        <div class="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <Icon name="lucide:check" size="26" class="text-green-600 dark:text-green-400" />
        </div>
        <p class="text-sm font-semibold text-slate-800 dark:text-slate-100">Catalogue mis à jour</p>
      </div>
      <div v-if="recap" class="mx-auto grid w-full max-w-md grid-cols-2 gap-3">
        <div class="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-center dark:border-green-800/40 dark:bg-green-900/20">
          <p class="text-lg font-semibold text-green-700 dark:text-green-300">{{ fmtNombre(recap.nouveaux) }}</p>
          <p class="text-xs text-green-600 dark:text-green-400">nouveau{{ recap.nouveaux > 1 ? 'x' : '' }}</p>
        </div>
        <div class="rounded-lg border border-secondary-200 bg-secondary-50 px-4 py-3 text-center dark:border-secondary-800/40 dark:bg-secondary-900/20">
          <p class="text-lg font-semibold text-secondary-700 dark:text-secondary-300">{{ fmtNombre(recap.misAJour) }}</p>
          <p class="text-xs text-secondary-600 dark:text-secondary-400">mis à jour</p>
        </div>
        <div class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-center dark:border-red-800/40 dark:bg-red-900/20">
          <p class="text-lg font-semibold text-red-600 dark:text-red-400">{{ fmtNombre(recap.deleted) }}</p>
          <p class="text-xs text-red-500 dark:text-red-400">supprimé{{ recap.deleted > 1 ? 's' : '' }}</p>
        </div>
        <div class="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-center dark:border-slate-700 dark:bg-slate-800/50">
          <p class="text-lg font-semibold text-slate-700 dark:text-slate-200">{{ fmtNombre(recap.conserves) }}</p>
          <p class="text-xs text-slate-500 dark:text-slate-400">conservé{{ recap.conserves > 1 ? 's' : '' }} (référencés)</p>
        </div>
      </div>
      <p v-if="recap?.unitesAjoutees" class="text-center text-xs text-slate-400">
        {{ fmtNombre(recap.unitesAjoutees) }} unité(s) de distribution ajoutée(s) au référentiel.
      </p>
    </div>

    <!-- ── Footer ──────────────────────────────────────────────────────────── -->
    <template #footer>
      <div class="flex items-center justify-between gap-3">
        <button
          v-if="step === 2 && !importing"
          type="button"
          class="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          @click="step = 1"
        >
          <Icon name="lucide:arrow-left" size="14" />
          Retour
        </button>
        <div v-else />

        <div class="flex gap-3">
          <button
            v-if="step !== 3 && !importing"
            type="button"
            class="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
            @click="emit('close')"
          >
            Annuler
          </button>

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

          <button
            v-else-if="step === 2 && !importing"
            type="button"
            :disabled="!counts.nouveaux && !counts.misAJour && !(deleteChecked && counts.supprimables)"
            class="flex items-center gap-2 rounded-lg bg-secondary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-secondary-700 disabled:opacity-50"
            @click="doImport"
          >
            <Icon name="lucide:download" size="16" />
            Importer ({{ fmtNombre(counts.nouveaux + counts.misAJour) }} article{{ counts.nouveaux + counts.misAJour > 1 ? 's' : '' }})
          </button>

          <button
            v-else-if="step === 3"
            type="button"
            class="rounded-lg bg-secondary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-secondary-700"
            @click="emit('imported')"
          >
            Fermer
          </button>
        </div>
      </div>
    </template>
  </AppModal>
</template>
