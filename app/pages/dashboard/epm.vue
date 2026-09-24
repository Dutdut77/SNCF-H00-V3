<script setup>
definePageMeta({
  requiresAuth: true,
  requiredRole: 'admin'
})

useHead({
  title: 'H00 - EPM',
  description: 'Suivi des entrées en périmètre maintenance'
})

const { getChantiers } = useChantiers()
const allChantiers = useState('allChantiers', () => [])
const { getAllUsers, users } = useUsers()
const { getAllContactsTravaux, allContactsTravaux } = useContacts()
const { epmByChantier, getEpmForChantiers, upsertEpm } = useEpm()
const { metierLabel } = useMetier()
const { setLoader } = useLoader()
const { addToast } = useToast()

// Les deux métiers affichés côte à côte (pas de switch : tout est visible d'un coup)
const METIERS_EPM = ['VOIE', 'SES']

const search = ref('')
const selectedEtat = ref('all')
const selectedYear = ref(new Date().getFullYear())

onMounted(async () => {
  setLoader(true)
  try {
    await Promise.all([getChantiers(), getAllUsers(), getAllContactsTravaux()])
    if (allChantiers.value?.length) {
      await getEpmForChantiers(allChantiers.value.map((c) => c.id))
    }
  } finally {
    setLoader(false)
  }
})

// Options de filtrage par état — les chantiers Externes sont exclus du suivi EPM
const etatOptions = [
  {
    id: 'all',
    label: 'Tous les chantiers',
    icon: 'lucide:layers',
    color: 'bg-linear-to-br from-secondary-400 to-secondary-600 text-white border-secondary-400'
  },
  {
    id: 'encours',
    label: 'En cours',
    icon: 'lucide:activity',
    color: 'bg-secondary-100 text-secondary-700 border-secondary-300'
  },
  { id: 'rlt', label: 'RLT', icon: 'lucide:zap', color: 'bg-sky-100 text-sky-700 border-sky-300' },
  { id: 'preop', label: 'Pré-op', icon: 'lucide:clipboard-check', color: 'bg-lime-100 text-lime-700 border-lime-300' },
  {
    id: 'termine',
    label: 'Terminé',
    icon: 'lucide:check-circle',
    color: 'bg-slate-100 text-slate-700 border-slate-300'
  }
]

// Une période chevauche-t-elle l'année donnée ? (même logique que le plan de charge général)
const isPeriodInYear = (startDateStr, endDateStr, year) => {
  if (!startDateStr) return false
  const startYear = new Date(startDateStr).getFullYear()
  const endYear = endDateStr ? new Date(endDateStr).getFullYear() : startYear
  return startYear <= year && endYear >= year
}

const isChantierInYear = (chantier, year) => {
  const hasRea = chantier.date_rea?.some((p) => isPeriodInYear(p.date_start_travaux, p.date_end_travaux, year))
  if (hasRea) return true
  const hasPrepa = chantier.date_prepa?.some((p) => isPeriodInYear(p.date_start_prepa, p.date_end_prepa, year))
  if (hasPrepa) return true
  // Chantier sans aucune date : toujours visible pour ne pas passer sous les radars
  return !chantier.date_rea?.length && !chantier.date_prepa?.length
}

// Base du dashboard : chantiers de l'année sélectionnée, hors Externes
const chantiersOfYear = computed(() =>
  (allChantiers.value || []).filter((c) => c.etat !== 1 && isChantierInYear(c, selectedYear.value))
)

// Compteurs par état (sur l'année sélectionnée)
const countByEtat = computed(() => {
  const base = chantiersOfYear.value
  return {
    all: base.length,
    encours: base.filter((c) => c.etat > -1).length,
    rlt: base.filter((c) => c.etat === 0).length,
    preop: base.filter((c) => c.etat === 2).length,
    termine: base.filter((c) => c.etat === -1).length
  }
})

// Première date de réalisation (début du chantier)
const getFirstReaDate = (chantier) => {
  if (!chantier.date_rea || chantier.date_rea.length === 0) return null
  const dates = chantier.date_rea
    .map((r) => r.date_start_travaux)
    .filter((d) => d)
    .sort((a, b) => new Date(a) - new Date(b))
  return dates.length > 0 ? dates[0] : null
}

// Dernière date de réalisation (fin du chantier)
const getLastReaDate = (chantier) => {
  if (!chantier.date_rea || chantier.date_rea.length === 0) return null
  const dates = chantier.date_rea
    .map((r) => r.date_end_travaux || r.date_start_travaux)
    .filter((d) => d)
    .sort((a, b) => new Date(b) - new Date(a))
  return dates.length > 0 ? dates[0] : null
}

// Format court (01/10/25)
const shortDate = (dateStr) => {
  if (!dateStr) return null
  const date = new Date(dateStr)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = String(date.getFullYear()).slice(-2)
  return `${day}/${month}/${year}`
}

// RLT principal d'un métier donné
const RLT_FIELDS = { VOIE: 'rlt_voie_principale', SES: 'rlt_ses_principale' }

const rltForChantier = (chantierId, metier) => {
  const contacts = allContactsTravaux.value?.find((c) => c.chantier_id === chantierId)
  const email = contacts?.[RLT_FIELDS[metier]]
  if (!email) return null
  const u = users.value.find((usr) => usr.email?.toLowerCase() === email.toLowerCase())
  return {
    email,
    nom: u?.nom || '',
    prenom: u?.prenom || '',
    fullName: u?.prenom && u?.nom ? `${u.prenom} ${u.nom}` : email
  }
}

// Données EPM d'un chantier pour un métier
const metierData = (chantier, metier) => {
  const epm = epmByChantier.value[chantier.id]?.[metier] || {}
  return {
    rlt: rltForChantier(chantier.id, metier),
    epmDate: epm.epm_date || null,
    epmLien: epm.epm_lien || null,
    total: epm.reserves_total ?? null,
    realisees: epm.reserves_realisees ?? null,
    documents: epm.reserves_documents || ''
  }
}

const buildRow = (chantier) => {
  const voie = metierData(chantier, 'VOIE')
  const ses = metierData(chantier, 'SES')
  return {
    chantier,
    debut: getFirstReaDate(chantier),
    fin: getLastReaDate(chantier),
    VOIE: voie,
    SES: ses,
    // Champ commun aux deux métiers : le slideover écrit la même valeur
    // dans les deux lignes chantier_epm, on lit la première non vide.
    documents: voie.documents || ses.documents || ''
  }
}

// Toutes les lignes de l'année sélectionnée (base du reporting imprimé)
const rowsForYear = computed(() =>
  chantiersOfYear.value.map(buildRow).sort((a, b) => {
    if (!a.debut && !b.debut) return 0
    if (!a.debut) return 1
    if (!b.debut) return -1
    return new Date(a.debut) - new Date(b.debut)
  })
)

// Lignes affichées : recherche + filtre état
const rows = computed(() => {
  const searchLower = search.value.toLowerCase().trim()

  return rowsForYear.value.filter(({ chantier }) => {
    if (searchLower) {
      const matchCompte = chantier.compte?.toLowerCase().includes(searchLower)
      const matchName = chantier.name?.toLowerCase().includes(searchLower)
      if (!matchCompte && !matchName) return false
    }

    switch (selectedEtat.value) {
      case 'encours':
        if (chantier.etat <= -1) return false
        break
      case 'rlt':
        if (chantier.etat !== 0) return false
        break
      case 'preop':
        if (chantier.etat !== 2) return false
        break
      case 'termine':
        if (chantier.etat !== -1) return false
        break
    }

    return true
  })
})

// m = sous-objet métier d'une ligne (r.VOIE ou r.SES)
const reservesRestantes = (m) => Math.max(0, (m.total || 0) - (m.realisees || 0))

// Cumuls globaux + détail par métier sur une liste de lignes
const computeStats = (rowsList) => {
  const perMetier = {}
  for (const m of METIERS_EPM) {
    const items = rowsList.map((r) => r[m])
    const total = items.reduce((sum, it) => sum + (it.total || 0), 0)
    const realisees = items.reduce((sum, it) => sum + (it.realisees || 0), 0)
    perMetier[m] = {
      epmRealisees: items.filter((it) => it.epmDate).length,
      total,
      realisees,
      restantes: Math.max(0, total - realisees),
      avancement: total > 0 ? `${Math.round((realisees / total) * 100)} %` : '—'
    }
  }

  const total = perMetier.VOIE.total + perMetier.SES.total
  const realisees = perMetier.VOIE.realisees + perMetier.SES.realisees
  return {
    chantiers: rowsList.length,
    epmRealisees: perMetier.VOIE.epmRealisees + perMetier.SES.epmRealisees,
    totalReserves: total,
    reservesRealisees: realisees,
    reservesRestantes: Math.max(0, total - realisees),
    avancement: total > 0 ? `${Math.round((realisees / total) * 100)} %` : '—',
    VOIE: perMetier.VOIE,
    SES: perMetier.SES
  }
}

// Cartes de stats à l'écran (sur les lignes affichées)
const stats = computed(() => computeStats(rows.value))

// --- IMPRESSION : reporting de l'année sélectionnée (indépendant des filtres écran) ---
const printStats = computed(() => computeStats(rowsForYear.value))

// Chantiers avec des réserves restant à lever (pour la liste du reporting)
const printReservesRows = computed(() =>
  rowsForYear.value.filter((r) => reservesRestantes(r.VOIE) > 0 || reservesRestantes(r.SES) > 0)
)

const printDate = computed(() =>
  new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
)

const handlePrint = () => lancerImpression()

// Convertir une date (string ISO ou timestamp) en timestamp local à midi
const toTimestamp = (date) => {
  if (!date) return null
  if (typeof date === 'number') return date
  const d = new Date(date)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0).getTime()
}

// Convertir un timestamp en date ISO pour Supabase
const timestampToISODate = (timestamp) => {
  if (!timestamp) return null
  const date = new Date(timestamp)
  return date.toISOString().split('T')[0]
}

const toInt = (value) => {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? Math.max(0, Math.round(n)) : null
}

// Slide-over d'édition : les deux métiers + le champ documents commun
const open = ref(false)
const selected = ref(null)
const initialForm = ref(null)
const editForm = ref({
  VOIE: { epm_date: null, epm_lien: '', reserves_total: null, reserves_realisees: null },
  SES: { epm_date: null, epm_lien: '', reserves_total: null, reserves_realisees: null },
  reserves_documents: ''
})

const openEditor = (r) => {
  selected.value = r
  const form = { reserves_documents: r.documents || '' }
  for (const m of METIERS_EPM) {
    form[m] = {
      epm_date: toTimestamp(r[m].epmDate),
      epm_lien: r[m].epmLien || '',
      reserves_total: r[m].total ?? null,
      reserves_realisees: r[m].realisees ?? null
    }
  }
  editForm.value = form
  initialForm.value = JSON.parse(JSON.stringify(form))
  open.value = true
}

const closeEditor = () => {
  open.value = false
  selected.value = null
}

const enregistrer = async () => {
  if (!selected.value) return

  const docsChanged = editForm.value.reserves_documents !== initialForm.value?.reserves_documents
  let saved = 0
  let failed = false

  for (const m of METIERS_EPM) {
    const form = editForm.value[m]
    const metierChanged = JSON.stringify(form) !== JSON.stringify(initialForm.value?.[m])
    // Le champ documents est commun : s'il change, on écrit les deux lignes
    if (!metierChanged && !docsChanged) continue

    const data = await upsertEpm(
      selected.value.chantier.id,
      m,
      {
        epm_date: timestampToISODate(form.epm_date),
        epm_lien: form.epm_lien || null,
        reserves_total: toInt(form.reserves_total),
        reserves_realisees: toInt(form.reserves_realisees),
        reserves_documents: editForm.value.reserves_documents || null
      },
      { silent: true }
    )
    if (data) saved++
    else failed = true
  }

  if (failed) return

  if (saved > 0) {
    addToast({
      title: 'Succès',
      message: 'Données EPM mises à jour',
      type: 'Success'
    })
  }
  closeEditor()
}

// Relance du RLT d'un métier par email (fire-and-forget)
// Depuis le menu d'actions : le menu se referme d'abord
const relancer = (close, r, metier) => {
  close()
  relancerRlt(r, metier)
}
const relancerRlt = (r, metier) => {
  const m = r[metier]
  const rlt = m.rlt
  if (!rlt) {
    addToast({
      title: 'Aucun RLT',
      message: `Aucun RLT ${metierLabel(metier)} principal sur ce chantier.`,
      type: 'Warning'
    })
    return
  }

  $fetch('/api/email/send', {
    method: 'POST',
    body: {
      type: 'relance_rlt',
      chantierId: r.chantier.id,
      recipientEmail: rlt.email,
      recipientName: rlt.prenom && rlt.nom ? `${rlt.prenom} ${rlt.nom}` : '',
      metierLabel: metierLabel(metier),
      reservesTotal: m.total ?? 0,
      reservesRealisees: m.realisees ?? 0,
      epmDate: m.epmDate,
      epmLien: m.epmLien
    }
  }).catch(console.error)

  addToast({
    title: 'Relance envoyée',
    message: `Email envoyé à ${rlt.email}`,
    type: 'Success'
  })
}

// Repère de chaque métier (point de couleur) : bleu pour la Voie, violet pour les SE/SM
const METIER_POINT = { VOIE: 'bg-sky-500', SES: 'bg-violet-500' }

// Filtres de la barre latérale : point de couleur de l'état (comme la liste des chantiers)
const ETAT_POINT = {
  all: null,
  encours: 'bg-magenta-500',
  rlt: 'bg-sky-500',
  preop: 'bg-lime-500',
  termine: 'bg-slate-500'
}

// Avancement des réserves en pourcentage (jauge de la tuile)
const avancementPct = computed(() =>
  stats.value.totalReserves > 0 ? Math.round((stats.value.reservesRealisees / stats.value.totalReserves) * 100) : 0
)

// Fiche : saisie en cours (confirmation avant d'abandonner)
const ficheModifiee = computed(() => open.value && JSON.stringify(editForm.value) !== JSON.stringify(initialForm.value))
</script>

<template>
  <AppPageLayout v4 class="print:hidden">
    <template #entete>
      <AppPageHero
        title="Suivi EPM"
        description="Entrées en périmètre maintenance : réserves et comptes rendus, Voie et SE/SM"
        illustration="chantiers" />
    </template>

    <!-- ============ Barre latérale : année, filtres par état ============ -->
    <template #sidebar>
      <div class="flex flex-col gap-5 pb-6 lg:pt-2">
        <AppPeriodNav
          :label="String(selectedYear)"
          prev-label="Année précédente"
          next-label="Année suivante"
          :prev-title="String(selectedYear - 1)"
          :next-title="String(selectedYear + 1)"
          @prev="selectedYear--"
          @next="selectedYear++">
          <p class="mt-1.5 text-xs text-white/80">{{ countByEtat.all }} chantier{{ countByEtat.all > 1 ? 's' : '' }}</p>
          <p class="mt-0.5 text-xs text-white/80">
            {{ printStats.epmRealisees }} EPM réalisée{{ printStats.epmRealisees > 1 ? 's' : '' }}
          </p>
        </AppPeriodNav>

        <nav class="flex flex-col gap-1" aria-label="Filtrer par état">
          <p class="px-3 pb-1" :class="PANNEAU_TITRE">Chantiers</p>
          <button
            v-for="option in etatOptions"
            :key="option.id"
            type="button"
            class="focus-visible:outline-secondary-500 relative flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
            :class="panneauItem(selectedEtat === option.id)"
            :aria-pressed="selectedEtat === option.id"
            @click="selectedEtat = option.id">
            <Icon
              v-if="!ETAT_POINT[option.id]"
              name="lucide:layers"
              size="18"
              class="shrink-0"
              :class="panneauIcone(selectedEtat === option.id)" />
            <span v-else class="mx-1.25 size-2 shrink-0 rounded-full" :class="ETAT_POINT[option.id]" />
            <span class="min-w-0 flex-1 truncate text-sm font-medium">{{ option.label }}</span>
            <span
              class="inline-flex h-5.5 min-w-6.5 shrink-0 items-center justify-center rounded-full px-1.5 text-xs font-bold"
              :class="panneauBadge(selectedEtat === option.id)">
              {{ countByEtat[option.id] }}
            </span>
          </button>
        </nav>

        <!-- Légende : repère de chaque métier dans le tableau -->
        <section class="border-rule border-t px-3 pt-4" aria-label="Légende">
          <p class="pb-2.5" :class="PANNEAU_TITRE">Métiers</p>
          <ul class="text-ink-soft space-y-2 text-[13px]">
            <li v-for="m in METIERS_EPM" :key="m" class="flex items-center gap-2">
              <span class="size-2.5 rounded-full" :class="METIER_POINT[m]" />
              {{ metierLabel(m) }}
            </li>
          </ul>
        </section>
      </div>
    </template>

    <!-- ============ Contenu : synthèse et tableau des chantiers ============ -->
    <template #default>
      <div class="flex min-h-0 flex-1 flex-col gap-4 p-4 lg:px-8 lg:pt-4 lg:pb-4">
        <div class="flex flex-col gap-3 lg:flex-row lg:items-center">
          <AppInputSearch
            v-model="search"
            boxed
            dense
            class="w-full lg:max-w-sm"
            placeholder="Rechercher un chantier…" />
          <AppButtonValidated
            type="button"
            theme="outline"
            class="max-lg:hidden lg:ml-auto"
            :title="`Imprimer le reporting EPM ${selectedYear}`"
            @click="handlePrint">
            <template #default>
              <span class="flex items-center gap-2">
                <Icon name="lucide:printer" size="16" />
                Imprimer le reporting
              </span>
            </template>
          </AppButtonValidated>
        </div>

        <!-- Synthèse des chantiers affichés -->
        <div class="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <div class="surface-card rounded-xl p-4">
            <p class="text-ink text-sm font-semibold">EPM réalisées</p>
            <p class="text-ink mt-1 flex items-baseline gap-1.5">
              <span class="font-traverse text-[1.75rem] leading-none tracking-[0.02em]">{{ stats.epmRealisees }}</span>
              <span class="text-ink-soft text-sm">sur {{ stats.chantiers * 2 }}</span>
            </p>
            <p class="text-ink-soft mt-1.5 text-xs">
              Voie {{ stats.VOIE.epmRealisees }} · SE/SM {{ stats.SES.epmRealisees }}
            </p>
          </div>
          <div class="surface-card rounded-xl p-4">
            <p class="text-ink text-sm font-semibold">Réserves</p>
            <p class="font-traverse text-ink mt-1 text-[1.75rem] leading-none tracking-[0.02em]">
              {{ stats.totalReserves }}
            </p>
            <p class="text-ink-soft mt-1.5 text-xs">Voie {{ stats.VOIE.total }} · SE/SM {{ stats.SES.total }}</p>
          </div>
          <div class="surface-card rounded-xl p-4">
            <p class="text-ink text-sm font-semibold">Réserves levées</p>
            <p class="text-ink mt-1 flex items-baseline gap-1.5">
              <span class="font-traverse text-[1.75rem] leading-none tracking-[0.02em]">
                {{ stats.reservesRealisees }}
              </span>
              <span class="text-ink-soft text-sm">
                {{ stats.reservesRestantes }} restante{{ stats.reservesRestantes > 1 ? 's' : '' }}
              </span>
            </p>
            <p class="text-ink-soft mt-1.5 text-xs">
              Voie {{ stats.VOIE.realisees }} · SE/SM {{ stats.SES.realisees }}
            </p>
          </div>
          <!-- Avancement : carte d'accent, avec une jauge -->
          <div class="bg-bandeau rounded-xl p-4 shadow-[0_10px_24px_-12px_rgb(43_4_35/0.45)]">
            <p class="text-sm font-semibold text-white">Avancement</p>
            <p class="font-traverse mt-1 text-[1.75rem] leading-none tracking-[0.02em] text-white">
              {{ stats.avancement }}
            </p>
            <div
              class="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/25"
              role="meter"
              :aria-valuenow="avancementPct"
              aria-valuemin="0"
              aria-valuemax="100"
              aria-label="Réserves levées">
              <div class="h-full rounded-full bg-white" :style="{ width: `${avancementPct}%` }" />
            </div>
            <p class="mt-1.5 text-xs text-white/80">
              Voie {{ stats.VOIE.avancement }} · SE/SM {{ stats.SES.avancement }}
            </p>
          </div>
        </div>

        <!-- Tableau des chantiers : défile dans la carte, en-tête figé -->
        <div class="surface-card min-h-0 flex-1 overflow-auto rounded-xl max-lg:max-h-[75vh]">
          <table class="w-full min-w-max text-sm">
            <thead class="bg-table-head table-head-text sticky top-0 z-10 shadow-[inset_0_-1px_0_var(--color-rule)]">
              <tr class="text-[0.8125rem]">
                <th rowspan="2" class="px-4 py-2.5 text-left align-middle">Chantier</th>
                <th rowspan="2" class="px-3 py-2.5 text-center align-middle">Début</th>
                <th rowspan="2" class="px-3 py-2.5 text-center align-middle">Fin</th>
                <th
                  v-for="m in METIERS_EPM"
                  :key="`band-${m}`"
                  colspan="4"
                  class="border-rule border-b border-l px-3 pt-2.5 pb-1.5 text-center">
                  <span class="inline-flex items-center gap-2">
                    <span class="size-2 rounded-full" :class="METIER_POINT[m]" />
                    {{ metierLabel(m) }}
                  </span>
                </th>
                <th rowspan="2" class="border-rule w-full border-l px-4 py-2.5 text-left align-middle">
                  Réserves documents
                </th>
                <th rowspan="2" class="w-12 px-3 py-2.5"><span class="sr-only">Actions</span></th>
              </tr>
              <tr class="text-[0.72rem]">
                <template v-for="m in METIERS_EPM" :key="`sub-${m}`">
                  <th class="border-rule border-l px-3 pb-2 text-center">RLT</th>
                  <th class="px-3 pb-2 text-center">EPM</th>
                  <th class="px-3 pb-2 text-center">CR</th>
                  <th class="px-3 pb-2 text-center">Réserves</th>
                </template>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-900/[0.07] dark:divide-white/[0.07]">
              <tr
                v-for="r in rows"
                :key="r.chantier.id"
                class="cursor-pointer transition-colors hover:bg-taupe-100 dark:hover:bg-taupe-400/8"
                @click="openEditor(r)">
                <td class="px-4 py-3">
                  <button
                    type="button"
                    class="group flex w-fit cursor-pointer items-center gap-2.5 text-left"
                    title="Voir le chantier"
                    @click.stop="navigateTo(`/chantiers/${r.chantier.id}`)">
                    <span
                      class="rounded bg-taupe-100 px-2 py-0.5 text-xs font-semibold whitespace-nowrap text-taupe-700 tabular-nums ring-1 ring-taupe-200 ring-inset dark:bg-taupe-400/15 dark:text-taupe-200 dark:ring-0">
                      {{ r.chantier.compte }}
                    </span>
                    <span
                      class="text-ink group-hover:text-secondary-700 dark:group-hover:text-secondary-300 font-medium whitespace-nowrap transition-colors">
                      {{ r.chantier.name }}
                    </span>
                  </button>
                </td>
                <td class="text-ink-soft px-3 py-3 text-center whitespace-nowrap tabular-nums">
                  {{ shortDate(r.debut) || '—' }}
                </td>
                <td class="text-ink-soft px-3 py-3 text-center whitespace-nowrap tabular-nums">
                  {{ shortDate(r.fin) || '—' }}
                </td>

                <template v-for="m in METIERS_EPM" :key="`cells-${m}`">
                  <td class="border-rule border-l px-3 py-3">
                    <div class="flex justify-center">
                      <AppTooltip v-if="r[m].rlt" :text="r[m].rlt.fullName">
                        <AppAvatar
                          :nom="r[m].rlt.nom || r[m].rlt.email"
                          :prenom="r[m].rlt.prenom"
                          size="xs"
                          color="bg-slate-200 text-slate-700 dark:bg-white/15 dark:text-white" />
                      </AppTooltip>
                      <span v-else class="text-slate-300 dark:text-white/25">—</span>
                    </div>
                  </td>
                  <td class="text-ink px-3 py-3 text-center whitespace-nowrap tabular-nums">
                    {{ shortDate(r[m].epmDate) || '—' }}
                  </td>
                  <td class="px-3 py-3 text-center whitespace-nowrap">
                    <a
                      v-if="r[m].epmLien"
                      :href="r[m].epmLien"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-secondary-700 hover:text-secondary-600 dark:text-secondary-300 inline-flex items-center"
                      title="Ouvrir le compte rendu"
                      @click.stop>
                      <Icon name="lucide:external-link" size="16" />
                    </a>
                    <span v-else class="text-slate-300 dark:text-white/25">—</span>
                  </td>
                  <td class="px-3 py-3 text-center whitespace-nowrap">
                    <span
                      v-if="r[m].total !== null"
                      class="rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums"
                      :class="
                        reservesRestantes(r[m]) === 0
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/16 dark:text-emerald-300'
                          : 'bg-ochre-100 text-ochre-700 dark:bg-ochre-400/14 dark:text-ochre-300'
                      "
                      :title="`${r[m].realisees ?? 0} levée(s) sur ${r[m].total}`">
                      {{ r[m].realisees ?? 0 }} / {{ r[m].total }}
                    </span>
                    <span v-else class="text-slate-300 dark:text-white/25">—</span>
                  </td>
                </template>

                <td class="border-rule border-l px-4 py-3">
                  <span class="text-ink-soft block max-w-md truncate" :title="r.documents">
                    {{ r.documents || '—' }}
                  </span>
                </td>
                <td class="px-3 py-3 text-right" @click.stop>
                  <AppDropdownMenu>
                    <template #trigger>
                      <span
                        class="text-ink-soft hover:text-ink block rounded-md p-1.5 hover:bg-slate-100 dark:hover:bg-white/8"
                        title="Actions">
                        <Icon name="lucide:ellipsis-vertical" size="16" />
                      </span>
                    </template>
                    <template #default="{ close }">
                      <div class="w-64 py-1">
                        <button
                          v-for="m in METIERS_EPM"
                          :key="`relance-${m}`"
                          type="button"
                          :disabled="!r[m].rlt"
                          class="text-ink flex w-full cursor-pointer items-start gap-2.5 rounded-md px-3 py-2 text-left text-sm hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-white/8"
                          @click="relancer(close, r, m)">
                          <span class="mt-1.5 size-2 shrink-0 rounded-full" :class="METIER_POINT[m]" />
                          <span>
                            Relancer le RLT {{ metierLabel(m) }}
                            <span v-if="reservesRestantes(r[m]) > 0" class="text-ink-soft block text-xs">
                              {{ reservesRestantes(r[m]) }} réserve{{
                                reservesRestantes(r[m]) > 1 ? 's' : ''
                              }}
                              restante{{ reservesRestantes(r[m]) > 1 ? 's' : '' }}
                            </span>
                          </span>
                        </button>
                      </div>
                    </template>
                  </AppDropdownMenu>
                </td>
              </tr>
            </tbody>
          </table>
          <p v-if="!rows.length" class="text-ink-soft p-8 text-center text-sm">Aucun chantier</p>
        </div>
      </div>

      <!-- ============ Fiche : EPM des deux métiers, réserves documents ============ -->
      <AppSidePanel
        v-slot="{ fermer }"
        :open="open && !!selected"
        size="md"
        :label="`EPM ${selected?.chantier.compte ?? ''}`"
        :dirty="ficheModifiee"
        @close="closeEditor">
        <header class="panel-brand shrink-0 px-5 py-5 sm:px-7">
          <div class="flex items-center justify-between gap-3">
            <p class="text-xs font-medium text-white/60">Entrée en périmètre maintenance</p>
            <button
              type="button"
              class="flex size-8.5 cursor-pointer items-center justify-center rounded-full border border-white/18 text-white transition-colors hover:border-white/35 hover:bg-white/8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              aria-label="Fermer"
              @click="fermer">
              <Icon name="lucide:x" size="18" />
            </button>
          </div>
          <p class="font-traverse mt-2 text-[2.1rem] leading-none tracking-[0.03em] text-white tabular-nums">
            {{ selected?.chantier.compte || '—' }}
          </p>
          <h2 class="mt-1.5 text-lg leading-snug font-semibold text-white">{{ selected?.chantier.name }}</h2>
          <div class="mt-3 flex flex-wrap gap-2 text-xs font-medium text-white/85">
            <span class="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1">
              <Icon name="lucide:calendar-range" size="13" />
              {{ shortDate(selected?.debut) || '—' }} → {{ shortDate(selected?.fin) || '—' }}
            </span>
          </div>
        </header>

        <div class="dark:bg-night-900 flex min-h-0 flex-1 flex-col bg-slate-100 pt-5 sm:pt-6">
          <div v-if="selected" class="flex-1 space-y-5 overflow-y-auto px-4 pb-5 sm:px-7 sm:pb-6">
            <section
              v-for="m in METIERS_EPM"
              :key="`edit-${m}`"
              class="surface-card rounded-xl p-5"
              :aria-labelledby="`epm-${m}`">
              <div class="flex items-center justify-between gap-3">
                <h3 :id="`epm-${m}`" class="text-ink flex items-center gap-2 font-semibold">
                  <span class="size-2.5 rounded-full" :class="METIER_POINT[m]" />
                  {{ metierLabel(m) }}
                </h3>
                <span class="text-ink-soft truncate text-xs">RLT : {{ selected[m].rlt?.fullName || 'aucun' }}</span>
              </div>

              <div class="mt-4 space-y-4">
                <div>
                  <p class="text-ink mb-1.5 text-[13px] font-medium">Date de l'EPM</p>
                  <AppDatePicker v-model="editForm[m].epm_date" placeholder="Choisir une date" clearable v4 />
                </div>
                <div>
                  <label :for="`epm_lien_${m}`" class="text-ink mb-1.5 block text-[13px] font-medium">
                    Compte rendu (lien SharePoint)
                  </label>
                  <input
                    :id="`epm_lien_${m}`"
                    v-model="editForm[m].epm_lien"
                    type="url"
                    class="form-control h-10"
                    placeholder="https://…" />
                </div>
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label :for="`reserves_total_${m}`" class="text-ink mb-1.5 block text-[13px] font-medium">
                      Réserves
                    </label>
                    <input
                      :id="`reserves_total_${m}`"
                      v-model.number="editForm[m].reserves_total"
                      type="number"
                      min="0"
                      placeholder="0"
                      class="form-control h-10 tabular-nums" />
                  </div>
                  <div>
                    <label :for="`reserves_realisees_${m}`" class="text-ink mb-1.5 block text-[13px] font-medium">
                      Dont levées
                    </label>
                    <input
                      :id="`reserves_realisees_${m}`"
                      v-model.number="editForm[m].reserves_realisees"
                      type="number"
                      min="0"
                      placeholder="0"
                      class="form-control h-10 tabular-nums" />
                  </div>
                </div>
              </div>
            </section>

            <!-- Champ commun aux deux métiers -->
            <section class="surface-card rounded-xl p-5" aria-labelledby="epm-documents">
              <h3 id="epm-documents" class="text-ink font-semibold">Réserves documents</h3>
              <p class="text-ink-soft mt-0.5 mb-3 text-xs">Communes à la Voie et aux SE/SM.</p>
              <textarea
                v-model="editForm.reserves_documents"
                rows="4"
                class="form-control resize-y py-2.5"
                placeholder="Réserves liées aux documents…" />
            </section>
          </div>
        </div>

        <footer class="border-rule bg-card flex shrink-0 items-center justify-end gap-2 border-t px-5 py-4 sm:px-7">
          <AppButtonValidated type="button" theme="outline" @click="fermer">
            <template #default>Annuler</template>
          </AppButtonValidated>
          <AppButtonValidated type="button" theme="brand" :validated="ficheModifiee" @click="enregistrer">
            <template #default>
              <span class="flex items-center gap-2">
                <Icon name="lucide:save" size="16" />
                Enregistrer
              </span>
            </template>
          </AppButtonValidated>
        </footer>
      </AppSidePanel>
    </template>
  </AppPageLayout>

  <!-- Reporting imprimable (A4 portrait, rendu hors écran) -->
  <DashboardPrintEpm :year="selectedYear" :stats="printStats" :rows="printReservesRows" :print-date="printDate" />
</template>
