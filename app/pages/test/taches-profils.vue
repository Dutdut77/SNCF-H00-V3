<script setup>
/*
 * ─────────────────────────────────────────────────────────────────────────────
 *  PAGE DE TEST / DÉMO — Clôture des tâches PAR PROFIL
 * ─────────────────────────────────────────────────────────────────────────────
 *  Page 100% autonome (layout: false, pas d'auth) avec des DONNÉES FICTIVES en
 *  mémoire. Aucune écriture Supabase, aucun fichier existant modifié.
 *
 *  But : montrer comment serait géré, dans les 3 endroits de l'app, le fait
 *  qu'une même tâche (ex. FDRAV) concerne plusieurs profils (RLT Voie + SES)
 *  et que CHAQUE profil clôture sa propre part, indépendamment.
 *
 *  Modèle simulé (cible réelle = colonne jsonb `cloture_profil` sur h00, ou
 *  table de jointure h00_cloture) :
 *     h00.cloture_profil = { [profilId]: { status, realisation, commentaire } }
 *     - status      : 0 = À faire, 1 = En cours, 2 = Clôturé
 *     - important / alerte restent PARTAGÉS au niveau de la tâche (h00)
 * ─────────────────────────────────────────────────────────────────────────────
 */

definePageMeta({
  requiresAuth: false,
  layout: false
})

useHead({ title: 'H00 — Démo clôture par profil' })

/* ───────────────────────────── DONNÉES FICTIVES ─────────────────────────── */

// Profils (cf. table `profil` → { id: num_profil, label, short })
const profils = [
  { id: 1, label: 'RLT Voie', short: 'Voie' },
  { id: 2, label: 'RLT SES', short: 'SES' },
  { id: 3, label: 'Caténaire', short: 'CAT' }
]

const categories = ['Préparation', 'Études', 'Travaux']

// Définitions de tâches (cf. `taches`, dont le tableau `tache_profil`)
const tachesDef = reactive([
  { id: 101, tache: 'FDRAV', categorie: 'Préparation', delais: -30, tache_profil: [1, 2] },
  { id: 102, tache: 'DICT', categorie: 'Préparation', delais: -20, tache_profil: [1, 2, 3] },
  { id: 103, tache: 'Repérage voie', categorie: 'Études', delais: -10, tache_profil: [1] },
  { id: 104, tache: 'Consignation caténaire', categorie: 'Travaux', delais: 0, tache_profil: [3] }
])

// Chantiers fictifs
const chantiers = [
  { id: 1, name: 'Chantier Gare Nord', date_start: '2026-07-20' },
  { id: 2, name: 'Chantier Pont Sud', date_start: '2026-08-15' }
]

/* ───────────────────────────── HELPERS DATE ─────────────────────────────── */

const toDateStr = (ts) => {
  if (!ts) return null
  const d = new Date(ts)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const toTimestamp = (dateStr) => {
  if (!dateStr) return null
  const d = new Date(dateStr)
  d.setHours(12, 0, 0, 0)
  return d.getTime()
}

const addDays = (dateStr, days) => {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return toDateStr(d.getTime())
}

const formatFr = (dateStr) => {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  const s = d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/* ───────────────── INSTANCES h00 (générées + quelques états) ────────────── */

const buildH00 = () => {
  const rows = []
  let id = 1
  for (const ch of chantiers) {
    for (const def of tachesDef) {
      const cloture = {}
      for (const p of def.tache_profil) {
        cloture[p] = { status: 0, realisation: null, commentaire: '' }
      }
      rows.push({
        id: id++,
        chantier_id: ch.id,
        tache_id: def.id,
        prevision: addDays(ch.date_start, def.delais),
        important: false,
        alerte: false,
        cloture_profil: cloture
      })
    }
  }
  return rows
}

const h00 = reactive(buildH00())

// Pré-remplir quelques états variés pour la démo (sur le chantier 1)
const seed = (chantierId, tacheId, data) => {
  const row = h00.find((r) => r.chantier_id === chantierId && r.tache_id === tacheId)
  if (row) Object.assign(row.cloture_profil, data)
}
seed(1, 101, {
  1: { status: 2, realisation: '2026-06-12', commentaire: 'Voie : repérage et contrôle des rails OK.' },
  2: { status: 1, realisation: null, commentaire: 'SES : étude signalisation en cours.' }
})
seed(1, 102, {
  1: { status: 2, realisation: '2026-06-25', commentaire: 'Voie : déclaration envoyée.' },
  2: { status: 0, realisation: null, commentaire: '' },
  3: { status: 1, realisation: null, commentaire: 'Caténaire : en attente plan.' }
})
const r101 = h00.find((r) => r.chantier_id === 1 && r.tache_id === 101)
if (r101) r101.important = true

/* ─────────────────────────── ÉTAT « UTILISATEUR » ───────────────────────── */

// Simule l'utilisateur connecté (users.profils)
const currentProfil = ref(1)
const profilOptions = computed(() => profils.map((p) => ({ id: p.id, label: p.label })))
const chantierOptions = computed(() => chantiers.map((c) => ({ id: c.id, label: c.name })))
const categorieOptions = categories.map((c) => ({ id: c, label: c }))

/* ─────────────────────────────── HELPERS MÉTIER ─────────────────────────── */

const getDef = (tacheId) => tachesDef.find((t) => t.id === tacheId)
const getChantier = (id) => chantiers.find((c) => c.id === id)
const profilLabel = (id) => profils.find((p) => p.id === id)?.label || `Profil ${id}`
const profilShort = (id) => profils.find((p) => p.id === id)?.short || `P${id}`
const concernedProfilIds = (tacheId) => getDef(tacheId)?.tache_profil || []

const EMPTY_SLOT = { status: 0, realisation: null, commentaire: '' }
// Lecture seule, sans mutation (sûr en rendu)
const getSlot = (row, profilId) => row.cloture_profil[profilId] || EMPTY_SLOT
// Mutation : à n'appeler que dans les handlers
const ensureSlot = (row, profilId) => {
  if (!row.cloture_profil[profilId]) {
    row.cloture_profil[profilId] = { status: 0, realisation: null, commentaire: '' }
  }
  return row.cloture_profil[profilId]
}

const statusInfo = (status) => {
  if (status === 2) return { label: 'Clôturé', cls: 'bg-green-100 text-green-700', dot: 'bg-green-500' }
  if (status === 1) return { label: 'En cours', cls: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' }
  return { label: 'À faire', cls: 'bg-red-100 text-red-700', dot: 'bg-red-400' }
}

// Compteur partiel « X/Y profils clôturés » pour une instance
const clotureCount = (row) => {
  const ids = concernedProfilIds(row.tache_id)
  const done = ids.filter((id) => getSlot(row, id).status === 2).length
  return { done, total: ids.length }
}

/* ─────────────────────────────── ONGLETS ────────────────────────────────── */

const tabs = [
  { id: 'parametres', label: 'Paramètres', icon: 'lucide:settings' },
  { id: 'taches', label: 'Page Tâches', icon: 'lucide:list-checks' },
  { id: 'chantier', label: 'Détail chantier', icon: 'lucide:folder-open' }
]
const activeTab = ref('taches')

/* ───────────── ONGLET 2 — PAGE TÂCHES (je clôture MA part) ───────────────── */

const mesTaches = computed(() =>
  h00
    .filter((row) => concernedProfilIds(row.tache_id).includes(currentProfil.value))
    .map((row) => ({ row, def: getDef(row.tache_id), chantier: getChantier(row.chantier_id) }))
)

// Modale de clôture (page tâches) — agit UNIQUEMENT sur le profil courant
const closeOpen = ref(false)
const closeRow = ref(null)
const closeComment = ref('')
const closeDate = ref(null)

const openClose = (row) => {
  closeRow.value = row
  const slot = getSlot(row, currentProfil.value)
  closeComment.value = slot.commentaire || ''
  closeDate.value = slot.realisation ? toTimestamp(slot.realisation) : null
  closeOpen.value = true
}

const closeCloturer = () => {
  const slot = ensureSlot(closeRow.value, currentProfil.value)
  slot.status = 2
  slot.realisation = toDateStr(closeDate.value)
  slot.commentaire = closeComment.value
  closeOpen.value = false
}

const closeEnregistrer = () => {
  const slot = ensureSlot(closeRow.value, currentProfil.value)
  slot.status = closeComment.value.trim() ? 1 : 0
  slot.commentaire = closeComment.value
  closeOpen.value = false
}

/* ───────────── ONGLET 3 — DÉTAIL CHANTIER/[id] (vue par profil) ──────────── */

const selectedChantierId = ref(1)
const chantierTaches = computed(() =>
  h00
    .filter((row) => row.chantier_id === selectedChantierId.value)
    .map((row) => ({ row, def: getDef(row.tache_id) }))
)

const detailOpen = ref(false)
const detailRow = ref(null)
const detailComment = ref('')
const detailDate = ref(null)

const detailMine = computed(
  () => detailRow.value && concernedProfilIds(detailRow.value.tache_id).includes(currentProfil.value)
)
const detailMineStatus = computed(() =>
  detailRow.value ? getSlot(detailRow.value, currentProfil.value).status : 0
)

const openDetail = (row) => {
  detailRow.value = row
  const slot = getSlot(row, currentProfil.value)
  detailComment.value = slot.commentaire || ''
  detailDate.value = slot.realisation ? toTimestamp(slot.realisation) : null
  detailOpen.value = true
}

const detailCloturer = () => {
  const slot = ensureSlot(detailRow.value, currentProfil.value)
  slot.status = 2
  slot.realisation = toDateStr(detailDate.value)
  slot.commentaire = detailComment.value
}

const detailEnregistrer = () => {
  const slot = ensureSlot(detailRow.value, currentProfil.value)
  slot.status = detailComment.value.trim() ? 1 : 0
  slot.commentaire = detailComment.value
}

const detailRouvrir = () => {
  const slot = ensureSlot(detailRow.value, currentProfil.value)
  slot.status = detailComment.value.trim() ? 1 : 0
  slot.realisation = null
  detailDate.value = null
}

// Si on change de « profil connecté », on referme les modales pour éviter
// d'afficher la part d'un autre profil par erreur.
watch(currentProfil, () => {
  closeOpen.value = false
  detailOpen.value = false
})
</script>

<template>
  <div class="text-primary-700 min-h-screen bg-gray-50 dark:bg-slate-900 dark:text-gray-200">
    <!-- ─────────────────────────── EN-TÊTE ─────────────────────────── -->
    <header class="border-primary-200 border-b bg-white dark:border-slate-700 dark:bg-slate-800">
      <div class="mx-auto max-w-6xl px-4 py-5 sm:px-6">
        <div class="flex items-center gap-3">
          <div class="bg-primary-50 flex h-10 w-10 items-center justify-center rounded-lg">
            <Icon name="lucide:flask-conical" size="22" class="text-primary-700" />
          </div>
          <div>
            <h1 class="text-lg font-semibold text-primary-900 dark:text-white">
              Démo — Clôture des tâches par profil
            </h1>
            <p class="text-primary-500 text-sm">
              Page de test isolée · données fictives en mémoire · aucun impact sur l'existant
            </p>
          </div>
        </div>

        <!-- Onglets -->
        <nav class="mt-5 flex flex-wrap gap-2">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            type="button"
            class="flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors"
            :class="
              activeTab === tab.id
                ? 'bg-primary-700 text-white'
                : 'border-primary-200 text-primary-700 hover:bg-primary-100 border bg-white dark:bg-slate-800'
            "
            @click="activeTab = tab.id">
            <Icon :name="tab.icon" size="16" />
            {{ tab.label }}
          </button>
        </nav>
      </div>
    </header>

    <main class="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <!-- Barre « utilisateur connecté » (onglets Tâches & Détail chantier) -->
      <div
        v-if="activeTab !== 'parametres'"
        class="border-primary-200 mb-5 flex flex-col gap-3 rounded-lg border bg-white p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700 dark:bg-slate-800">
        <div class="flex items-center gap-2 text-sm">
          <Icon name="lucide:user-round" size="18" class="text-primary-500" />
          <span>Vous êtes connecté en tant que&nbsp;:</span>
          <span class="bg-primary-100 text-primary-800 rounded-full px-2.5 py-0.5 text-xs font-semibold">
            {{ profilLabel(currentProfil) }}
          </span>
        </div>
        <div class="sm:w-64">
          <AppSelect v-model="currentProfil" :options="profilOptions" />
        </div>
      </div>

      <!-- ════════════════════════ ONGLET 1 — PARAMÈTRES ═══════════════════ -->
      <section v-show="activeTab === 'parametres'">
        <div class="mb-4">
          <h2 class="text-base font-semibold text-primary-900 dark:text-white">Paramétrage des tâches</h2>
          <p class="text-primary-500 text-sm">
            Le paramétrage ne change pas : une tâche déclare simplement les profils qu'elle concerne.
          </p>
        </div>

        <div class="mb-5 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
          <Icon name="lucide:info" size="18" class="mt-0.5 flex-none" />
          <p>
            Les profils cochés ci-dessous créent automatiquement un <strong>suivi de clôture indépendant
            par profil</strong> sur chaque chantier. Plus besoin de dupliquer une tâche pour séparer Voie et SES.
          </p>
        </div>

        <div class="grid gap-4 lg:grid-cols-2">
          <div
            v-for="t in tachesDef"
            :key="t.id"
            class="border-primary-200 rounded-lg border bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <div class="grid gap-3 sm:grid-cols-2">
              <AppInput v-model="t.tache" title="Nom de la tâche" :name="`tache-${t.id}`" />
              <AppSelect v-model="t.categorie" :options="categorieOptions" title="Catégorie" />
              <AppInput v-model="t.delais" type="number" title="Délai (jours)" :name="`delais-${t.id}`" />
            </div>

            <div class="mt-4">
              <p class="text-sm font-medium text-primary-700 dark:text-gray-300">Profils concernés</p>
              <div class="mt-2 grid grid-cols-2 gap-2">
                <AppCheckbox
                  v-for="p in profils"
                  :key="p.id"
                  v-model="t.tache_profil"
                  :value="p.id"
                  :label="p.label" />
              </div>
            </div>

            <div class="border-primary-100 mt-4 border-t pt-3 text-xs text-primary-500">
              <span v-if="t.tache_profil.length">
                Suivi créé pour :
                <span class="font-medium text-primary-700 dark:text-gray-300">
                  {{ t.tache_profil.map(profilLabel).join(', ') }}
                </span>
              </span>
              <span v-else class="text-red-500">Aucun profil — cette tâche ne sera visible par personne.</span>
            </div>
          </div>
        </div>
      </section>

      <!-- ═══════════════════════ ONGLET 2 — PAGE TÂCHES ═══════════════════ -->
      <section v-show="activeTab === 'taches'">
        <div class="mb-4">
          <h2 class="text-base font-semibold text-primary-900 dark:text-white">Mes tâches à amortir</h2>
          <p class="text-primary-500 text-sm">
            Seules les tâches concernant votre profil apparaissent. Clôturer ici n'affecte
            <strong>que votre profil</strong> — les autres profils restent inchangés.
          </p>
        </div>

        <div class="border-primary-200 overflow-hidden rounded-lg border bg-white dark:border-slate-700 dark:bg-slate-800">
          <table class="w-full text-sm">
            <thead class="border-primary-200 border-b bg-primary-50 dark:bg-slate-900/40">
              <tr class="text-primary-700">
                <th class="px-4 py-3 text-left font-semibold">Chantier</th>
                <th class="px-4 py-3 text-left font-semibold">Tâche</th>
                <th class="px-4 py-3 text-center font-semibold">Prévision</th>
                <th class="px-4 py-3 text-center font-semibold">Mon statut</th>
                <th class="px-4 py-3 text-center font-semibold">Action</th>
              </tr>
            </thead>
            <tbody class="divide-primary-100 divide-y">
              <tr
                v-for="item in mesTaches"
                :key="item.row.id"
                class="hover:bg-primary-50 cursor-pointer transition-colors dark:hover:bg-slate-700/40"
                @click="openClose(item.row)">
                <td class="px-4 py-3">{{ item.chantier?.name }}</td>
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2 font-medium">
                    {{ item.def?.tache }}
                    <Icon v-if="item.row.important" name="lucide:triangle-alert" size="14" class="text-yellow-500" />
                    <Icon v-if="item.row.alerte" name="lucide:siren" size="14" class="text-red-500" />
                  </div>
                  <div class="text-primary-400 text-xs">{{ item.def?.categorie }}</div>
                </td>
                <td class="px-4 py-3 text-center whitespace-nowrap">{{ formatFr(item.row.prevision) }}</td>
                <td class="px-4 py-3">
                  <div class="flex justify-center">
                    <span
                      class="rounded-md px-2 py-1 text-xs font-medium"
                      :class="statusInfo(getSlot(item.row, currentProfil).status).cls">
                      {{ statusInfo(getSlot(item.row, currentProfil).status).label }}
                    </span>
                  </div>
                </td>
                <td class="px-4 py-3">
                  <div class="flex justify-center">
                    <Icon name="lucide:chevron-right" size="18" class="text-primary-400" />
                  </div>
                </td>
              </tr>
              <tr v-if="!mesTaches.length">
                <td colspan="5" class="text-primary-400 px-4 py-8 text-center">
                  Aucune tâche pour ce profil.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- ══════════════════════ ONGLET 3 — DÉTAIL CHANTIER ════════════════ -->
      <section v-show="activeTab === 'chantier'">
        <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 class="text-base font-semibold text-primary-900 dark:text-white">Détail du chantier</h2>
            <p class="text-primary-500 text-sm">
              Vue d'ensemble : pour chaque tâche, l'avancement de chaque profil concerné.
            </p>
          </div>
          <div class="sm:w-64">
            <AppSelect v-model="selectedChantierId" :options="chantierOptions" title="Chantier" />
          </div>
        </div>

        <div class="border-primary-200 overflow-hidden rounded-lg border bg-white dark:border-slate-700 dark:bg-slate-800">
          <table class="w-full text-sm">
            <thead class="border-primary-200 border-b bg-primary-50 dark:bg-slate-900/40">
              <tr class="text-primary-700">
                <th class="hidden px-4 py-3 text-left font-semibold lg:table-cell">Catégorie</th>
                <th class="px-4 py-3 text-left font-semibold">Tâche</th>
                <th class="px-4 py-3 text-center font-semibold">Prévision</th>
                <th class="px-4 py-3 text-center font-semibold">Avancement profils</th>
                <th class="px-4 py-3 text-center font-semibold">#</th>
              </tr>
            </thead>
            <tbody class="divide-primary-100 divide-y">
              <tr
                v-for="item in chantierTaches"
                :key="item.row.id"
                class="hover:bg-primary-50 cursor-pointer transition-colors dark:hover:bg-slate-700/40"
                @click="openDetail(item.row)">
                <td class="hidden px-4 py-3 lg:table-cell">
                  <span class="bg-primary-50 border-primary-200 text-primary-600 rounded-md border px-2 py-0.5 text-xs italic">
                    {{ item.def?.categorie }}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2 font-medium">
                    {{ item.def?.tache }}
                    <Icon v-if="item.row.important" name="lucide:triangle-alert" size="14" class="text-yellow-500" />
                    <Icon v-if="item.row.alerte" name="lucide:siren" size="14" class="text-red-500" />
                  </div>
                </td>
                <td class="px-4 py-3 text-center whitespace-nowrap">{{ formatFr(item.row.prevision) }}</td>
                <td class="px-4 py-3">
                  <div class="flex flex-wrap items-center justify-center gap-1.5">
                    <span
                      v-for="pid in concernedProfilIds(item.row.tache_id)"
                      :key="pid"
                      class="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                      :class="statusInfo(getSlot(item.row, pid).status).cls">
                      <span class="h-1.5 w-1.5 rounded-full" :class="statusInfo(getSlot(item.row, pid).status).dot" />
                      {{ profilShort(pid) }}
                    </span>
                  </div>
                </td>
                <td class="px-4 py-3">
                  <div class="flex justify-center">
                    <Icon name="lucide:chevron-right" size="18" class="text-primary-400" />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>

    <!-- ═══════════ MODALE — Clôture « ma part » (onglet Page Tâches) ═══════ -->
    <AppModal v-model="closeOpen" size="lg">
      <template #header>
        <div>
          <p class="text-primary-400 text-xs uppercase">{{ getChantier(closeRow?.chantier_id)?.name }}</p>
          <h3 class="text-lg font-semibold text-primary-900 dark:text-white">{{ getDef(closeRow?.tache_id)?.tache }}</h3>
          <p class="text-primary-500 mt-0.5 text-sm">
            Clôture pour le profil
            <span class="text-primary-800 font-medium">{{ profilLabel(currentProfil) }}</span>
          </p>
        </div>
      </template>

      <template #default>
        <div v-if="closeRow" class="flex flex-col gap-4">
          <div>
            <label class="text-primary-700 mb-1 block text-sm dark:text-gray-300">Mon commentaire ({{ profilShort(currentProfil) }})</label>
            <textarea
              v-model="closeComment"
              class="border-primary-300 text-primary-700 focus:border-primary-500 focus:ring-primary-500 h-28 w-full resize-y rounded-lg border p-3 text-sm focus:ring-1 focus:outline-none"
              placeholder="Ajoutez un commentaire pour votre profil..."></textarea>
          </div>

          <AppDatePicker v-model="closeDate" title="Date de clôture" placeholder="Sélectionnez une date" clearable />
        </div>
      </template>

      <template #footer>
        <div class="flex flex-col items-center justify-end gap-2 sm:flex-row">
          <AppButtonValidated type="button" theme="primary" :validated="!!closeDate" @click="closeCloturer">
            <template #default>
              <span class="flex items-center gap-2"><Icon name="lucide:infinity" size="16" /> Clôturer ma part</span>
            </template>
          </AppButtonValidated>
          <AppButtonValidated type="button" theme="cancel" @click="closeEnregistrer">
            <template #default>
              <span class="flex items-center gap-2"><Icon name="lucide:save" size="16" /> Enregistrer</span>
            </template>
          </AppButtonValidated>
        </div>
      </template>
    </AppModal>

    <!-- ═══════════ MODALE — Détail par profil (onglet Détail chantier) ════ -->
    <AppModal v-model="detailOpen" size="2xl">
      <template #header>
        <div v-if="detailRow">
          <p class="text-primary-400 text-xs uppercase">{{ getChantier(detailRow.chantier_id)?.name }}</p>
          <h3 class="text-lg font-semibold text-primary-900 dark:text-white">{{ getDef(detailRow.tache_id)?.tache }}</h3>
          <p class="text-primary-500 mt-0.5 text-sm">
            {{ clotureCount(detailRow).done }}/{{ clotureCount(detailRow).total }} profils clôturés
            · affichage partiel (pas de statut global « fait »)
          </p>
        </div>
      </template>

      <template #default>
        <div v-if="detailRow" class="flex flex-col gap-5">
          <!-- Drapeaux partagés -->
          <div>
            <p class="text-primary-500 mb-2 text-xs font-medium uppercase">Drapeaux partagés (toute la tâche)</p>
            <div class="flex items-center gap-6">
              <AppSwitch v-model="detailRow.important" label="Important" />
              <AppSwitch v-model="detailRow.alerte" label="Alerte" />
            </div>
          </div>

          <!-- Une card par profil : édition pour le vôtre, lecture seule pour les autres -->
          <div>
            <p class="text-primary-500 mb-2 text-xs font-medium uppercase">Suivi par profil</p>
            <div class="flex flex-col gap-3">
              <div
                v-for="pid in concernedProfilIds(detailRow.tache_id)"
                :key="pid"
                class="rounded-lg border p-4"
                :class="
                  pid === currentProfil
                    ? 'border-primary-400 bg-primary-50 dark:border-primary-500 dark:bg-slate-900/40'
                    : 'border-primary-200 bg-white dark:border-slate-700 dark:bg-slate-800'
                ">
                <!-- En-tête de la card -->
                <div class="flex items-center justify-between gap-2">
                  <div class="flex items-center gap-2">
                    <Icon name="lucide:user-round" size="16" class="text-primary-500" />
                    <span class="font-medium">{{ profilLabel(pid) }}</span>
                    <span
                      v-if="pid === currentProfil"
                      class="bg-primary-100 text-primary-800 rounded-full px-1.5 py-0.5 text-[10px] font-semibold">
                      vous
                    </span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span v-if="getSlot(detailRow, pid).status === 2" class="text-primary-400 text-xs whitespace-nowrap">
                      {{ formatFr(getSlot(detailRow, pid).realisation) }}
                    </span>
                    <span class="rounded-md px-2 py-1 text-xs font-medium" :class="statusInfo(getSlot(detailRow, pid).status).cls">
                      {{ statusInfo(getSlot(detailRow, pid).status).label }}
                    </span>
                  </div>
                </div>

                <!-- Corps : édition (profil courant) OU lecture seule (autres) -->
                <div class="mt-3">
                  <template v-if="pid === currentProfil">
                    <label class="text-primary-700 mb-1 block text-xs font-medium dark:text-gray-300">Mon commentaire</label>
                    <textarea
                      v-model="detailComment"
                      class="border-primary-300 text-primary-700 focus:border-primary-500 focus:ring-primary-500 mb-3 h-24 w-full resize-y rounded-lg border bg-white p-3 text-sm focus:ring-1 focus:outline-none dark:bg-slate-800"
                      placeholder="Commentaire pour votre profil..."></textarea>
                    <AppDatePicker v-model="detailDate" title="Date de clôture" placeholder="Sélectionnez une date" clearable />
                  </template>
                  <template v-else>
                    <p class="text-primary-600 text-sm whitespace-pre-line dark:text-gray-300">
                      {{ getSlot(detailRow, pid).commentaire || 'Aucun commentaire' }}
                    </p>
                  </template>
                </div>
              </div>
            </div>
          </div>

          <!-- Notice si le profil courant n'est pas concerné par la tâche -->
          <div
            v-if="!detailMine"
            class="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
            <Icon name="lucide:lock" size="16" />
            Cette tâche ne concerne pas votre profil ({{ profilLabel(currentProfil) }}) — lecture seule.
          </div>
        </div>
      </template>

      <template #footer>
        <div v-if="detailMine" class="flex flex-col items-center justify-end gap-2 sm:flex-row">
          <AppButtonValidated
            v-if="detailMineStatus === 2"
            type="button"
            theme="delete"
            @click="detailRouvrir">
            <template #default>
              <span class="flex items-center gap-2"><Icon name="lucide:rotate-ccw" size="16" /> Rouvrir ma part</span>
            </template>
          </AppButtonValidated>
          <AppButtonValidated type="button" theme="primary" :validated="!!detailDate" @click="detailCloturer">
            <template #default>
              <span class="flex items-center gap-2"><Icon name="lucide:infinity" size="16" /> Clôturer ma part</span>
            </template>
          </AppButtonValidated>
          <AppButtonValidated type="button" theme="cancel" @click="detailEnregistrer">
            <template #default>
              <span class="flex items-center gap-2"><Icon name="lucide:save" size="16" /> Enregistrer</span>
            </template>
          </AppButtonValidated>
        </div>
      </template>
    </AppModal>
  </div>
</template>
