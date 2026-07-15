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

// Options de filtrage par état (mêmes codes que la liste des chantiers)
const etatOptions = [
  {
    id: 'all',
    label: 'Chantiers en cours',
    icon: 'lucide:layers',
    color: 'bg-linear-to-br from-secondary-400 to-secondary-600 text-white border-secondary-400'
  },
  { id: 'rlt', label: 'RLT', icon: 'lucide:zap', color: 'bg-sky-100 text-sky-700 border-sky-300' },
  { id: 'preop', label: 'Pré-op', icon: 'lucide:clipboard-check', color: 'bg-lime-100 text-lime-700 border-lime-300' },
  {
    id: 'externe',
    label: 'Externe',
    icon: 'lucide:external-link',
    color: 'bg-purple-100 text-purple-700 border-purple-300'
  },
  {
    id: 'termine',
    label: 'Terminé',
    icon: 'lucide:check-circle',
    color: 'bg-slate-100 text-slate-700 border-slate-300'
  }
]

// Compteurs par état
const countByEtat = computed(() => {
  if (!allChantiers.value || !Array.isArray(allChantiers.value)) {
    return { all: 0, rlt: 0, preop: 0, externe: 0, termine: 0 }
  }
  return {
    all: allChantiers.value.filter((c) => c.etat > -1).length,
    rlt: allChantiers.value.filter((c) => c.etat === 0).length,
    preop: allChantiers.value.filter((c) => c.etat === 2).length,
    externe: allChantiers.value.filter((c) => c.etat === 1).length,
    termine: allChantiers.value.filter((c) => c.etat === -1).length
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

// Lignes du tableau : une par chantier filtré, avec les données des deux métiers
const rows = computed(() => {
  const searchLower = search.value.toLowerCase().trim()

  const list = (allChantiers.value || []).filter((chantier) => {
    if (searchLower) {
      const matchCompte = chantier.compte?.toLowerCase().includes(searchLower)
      const matchName = chantier.name?.toLowerCase().includes(searchLower)
      if (!matchCompte && !matchName) return false
    }

    switch (selectedEtat.value) {
      case 'rlt':
        if (chantier.etat !== 0) return false
        break
      case 'preop':
        if (chantier.etat !== 2) return false
        break
      case 'externe':
        if (chantier.etat !== 1) return false
        break
      case 'termine':
        if (chantier.etat !== -1) return false
        break
      case 'all':
        if (chantier.etat <= -1) return false
        break
    }

    return true
  })

  return list
    .map((chantier) => {
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
    })
    .sort((a, b) => {
      if (!a.debut && !b.debut) return 0
      if (!a.debut) return 1
      if (!b.debut) return -1
      return new Date(a.debut) - new Date(b.debut)
    })
})

// m = sous-objet métier d'une ligne (r.VOIE ou r.SES)
const reservesRestantes = (m) => Math.max(0, (m.total || 0) - (m.realisees || 0))

// Cartes de stats : cumuls globaux + détail par métier
const stats = computed(() => {
  const perMetier = {}
  for (const m of METIERS_EPM) {
    const items = rows.value.map((r) => r[m])
    const total = items.reduce((sum, it) => sum + (it.total || 0), 0)
    const realisees = items.reduce((sum, it) => sum + (it.realisees || 0), 0)
    perMetier[m] = {
      epmRealisees: items.filter((it) => it.epmDate).length,
      total,
      realisees,
      avancement: total > 0 ? `${Math.round((realisees / total) * 100)} %` : '—'
    }
  }

  const total = perMetier.VOIE.total + perMetier.SES.total
  const realisees = perMetier.VOIE.realisees + perMetier.SES.realisees
  return {
    chantiers: rows.value.length,
    epmRealisees: perMetier.VOIE.epmRealisees + perMetier.SES.epmRealisees,
    totalReserves: total,
    reservesRealisees: realisees,
    avancement: total > 0 ? `${Math.round((realisees / total) * 100)} %` : '—',
    VOIE: perMetier.VOIE,
    SES: perMetier.SES
  }
})

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

// Habillage des bandeaux / puces par métier
const METIER_STYLES = {
  VOIE: {
    band: 'bg-sky-50 text-sky-700 dark:bg-sky-900/20 dark:text-sky-300',
    dot: 'bg-sky-500'
  },
  SES: {
    band: 'bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300',
    dot: 'bg-violet-500'
  }
}
</script>

<template>
  <div class="flex h-full w-full flex-col overflow-y-auto">
    <div class="w-full space-y-6 p-6">
      <!-- En-tête -->
      <AppTitleMain title="Suivi EPM" description="Entrées en périmètre maintenance — réserves et comptes rendus" />

      <!-- Cartes de stats -->
      <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div class="rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p class="text-xs font-medium tracking-wide text-gray-500 uppercase">EPM réalisées</p>
          <p class="text-secondary-600 dark:text-secondary-400 mt-1 text-2xl font-bold">
            {{ stats.epmRealisees }}<span class="text-sm font-medium text-gray-400"> / {{ stats.chantiers * 2 }}</span>
          </p>
          <p class="mt-1 text-xs text-gray-400">Voie {{ stats.VOIE.epmRealisees }} · SE/SM {{ stats.SES.epmRealisees }}</p>
        </div>
        <div class="rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p class="text-xs font-medium tracking-wide text-gray-500 uppercase">Total réserves</p>
          <p class="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">{{ stats.totalReserves }}</p>
          <p class="mt-1 text-xs text-gray-400">Voie {{ stats.VOIE.total }} · SE/SM {{ stats.SES.total }}</p>
        </div>
        <div class="rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p class="text-xs font-medium tracking-wide text-gray-500 uppercase">Réserves réalisées</p>
          <p class="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{{ stats.reservesRealisees }}</p>
          <p class="mt-1 text-xs text-gray-400">Voie {{ stats.VOIE.realisees }} · SE/SM {{ stats.SES.realisees }}</p>
        </div>
        <div
          class="from-secondary-400 to-secondary-600 border-secondary-400 rounded-xl border bg-linear-to-br p-4 shadow-md">
          <p class="text-xs font-medium tracking-wide text-white/80 uppercase">Avancement</p>
          <p class="mt-1 text-2xl font-bold text-white">{{ stats.avancement }}</p>
          <p class="mt-1 text-xs text-white/70">Voie {{ stats.VOIE.avancement }} · SE/SM {{ stats.SES.avancement }}</p>
        </div>
      </div>

      <!-- Filtres par état -->
      <div class="flex flex-wrap items-center gap-2">
        <button
          v-for="option in etatOptions"
          :key="option.id"
          @click="selectedEtat = option.id"
          class="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all duration-200"
          :class="
            selectedEtat === option.id
              ? option.color + ' border-2 shadow-sm'
              : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400'
          ">
          <Icon :name="option.icon" size="16" />
          {{ option.label }}
          <span
            class="ml-1 rounded-full px-1.5 text-xs font-bold"
            :class="selectedEtat === option.id ? 'bg-white/30' : 'bg-gray-100 dark:bg-gray-700'">
            {{ countByEtat[option.id] }}
          </span>
        </button>
      </div>

      <!-- Recherche -->
      <AppInputSearch v-model="search" class="w-full max-w-sm" placeholder="Rechercher un chantier ..." />

      <!-- Tableau des chantiers -->
      <div class="border-primary-200 overflow-hidden rounded-xl border bg-white dark:bg-slate-900">
        <div class="max-h-[70vh] overflow-auto">
          <table class="w-full text-sm">
            <thead class="sticky top-0 z-10 bg-white shadow-[0_1px_0_0_rgba(100,116,139,0.25)] dark:bg-slate-900">
              <tr class="text-primary-500 border-primary-200 border-b text-xs uppercase dark:border-slate-700">
                <th rowspan="2" class="px-4 py-3 text-left align-middle font-medium">Chantier</th>
                <th rowspan="2" class="px-4 py-3 text-center align-middle font-medium whitespace-nowrap">Début</th>
                <th rowspan="2" class="px-4 py-3 text-center align-middle font-medium whitespace-nowrap">Fin</th>
                <th
                  v-for="m in METIERS_EPM"
                  :key="`band-${m}`"
                  colspan="4"
                  class="border-primary-200 border-b border-l px-4 py-2 text-center font-semibold dark:border-slate-700"
                  :class="METIER_STYLES[m].band">
                  {{ metierLabel(m) }}
                </th>
                <th
                  rowspan="2"
                  class="border-primary-200 border-l px-4 py-3 text-center align-middle font-medium dark:border-slate-700">
                  Réserves documents
                </th>
                <th rowspan="2" class="px-4 py-3 align-middle"></th>
              </tr>
              <tr class="text-primary-500 border-primary-200 border-b text-xs uppercase dark:border-slate-700">
                <template v-for="m in METIERS_EPM" :key="`sub-${m}`">
                  <th class="border-primary-200 border-l px-3 py-2 text-center font-medium dark:border-slate-700">RLT</th>
                  <th class="px-3 py-2 text-center font-medium whitespace-nowrap">EPM</th>
                  <th class="px-3 py-2 text-center font-medium">CR</th>
                  <th class="px-3 py-2 text-center font-medium">Rés.</th>
                </template>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="r in rows"
                :key="r.chantier.id"
                @click="openEditor(r)"
                class="border-primary-100 hover:bg-primary-50 cursor-pointer border-b transition-colors dark:border-slate-800 dark:hover:bg-slate-800">
                <td class="px-4 py-3">
                  <div
                    @click.stop="navigateTo(`/chantiers/${r.chantier.id}`)"
                    class="group flex w-fit cursor-pointer items-center gap-2.5"
                    title="Voir le chantier">
                    <span
                      class="text-primary-800 group-hover:text-secondary-600 dark:group-hover:text-secondary-400 text-base font-bold whitespace-nowrap dark:text-gray-100">
                      {{ r.chantier.compte }}
                    </span>
                    <span class="text-primary-600 group-hover:text-secondary-600 dark:group-hover:text-secondary-400 dark:text-gray-300">
                      {{ r.chantier.name }}
                    </span>
                  </div>
                </td>
                <td class="text-primary-500 px-4 py-3 text-center whitespace-nowrap">{{ shortDate(r.debut) || '—' }}</td>
                <td class="text-primary-500 px-4 py-3 text-center whitespace-nowrap">{{ shortDate(r.fin) || '—' }}</td>

                <template v-for="m in METIERS_EPM" :key="`cells-${m}`">
                  <td class="border-primary-100 border-l px-3 py-3 dark:border-slate-800">
                    <div class="flex justify-center">
                      <AppTooltip v-if="r[m].rlt" :text="r[m].rlt.fullName">
                        <AppAvatar :nom="r[m].rlt.nom || r[m].rlt.email" :prenom="r[m].rlt.prenom" size="xs"
                          color="bg-purple-200 text-purple-600" />
                      </AppTooltip>
                      <span v-else class="text-primary-300">—</span>
                    </div>
                  </td>
                  <td class="text-primary-600 px-3 py-3 text-center whitespace-nowrap dark:text-gray-300">
                    {{ shortDate(r[m].epmDate) || '—' }}
                  </td>
                  <td class="px-3 py-3 text-center whitespace-nowrap">
                    <a
                      v-if="r[m].epmLien"
                      :href="r[m].epmLien"
                      target="_blank"
                      rel="noopener noreferrer"
                      @click.stop
                      class="text-secondary-600 hover:text-secondary-700 dark:text-secondary-400 inline-flex items-center"
                      title="Ouvrir le compte rendu">
                      <Icon name="lucide:external-link" size="16" />
                    </a>
                    <span v-else class="text-primary-300">—</span>
                  </td>
                  <td class="px-3 py-3 text-center whitespace-nowrap">
                    <span
                      v-if="r[m].total !== null"
                      class="rounded-full px-2 py-0.5 text-xs font-medium"
                      :class="
                        reservesRestantes(r[m]) === 0
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                      ">
                      {{ r[m].realisees ?? 0 }} / {{ r[m].total }}
                    </span>
                    <span v-else class="text-primary-300">—</span>
                  </td>
                </template>

                <td class="border-primary-100 border-l px-4 py-3 dark:border-slate-800">
                  <span class="text-primary-600 block max-w-56 truncate dark:text-gray-300" :title="r.documents">
                    {{ r.documents || '—' }}
                  </span>
                </td>
                <td class="px-4 py-3 text-right" @click.stop>
                  <AppDropdownMenu>
                    <template #trigger>
                      <span
                        class="hover:bg-primary-100 text-primary-400 hover:text-primary-600 block rounded p-1.5 dark:hover:bg-slate-700 dark:hover:text-gray-200"
                        title="Actions">
                        <Icon name="lucide:ellipsis-vertical" size="16" />
                      </span>
                    </template>
                    <template #default>
                      <div class="w-60 py-1">
                        <button
                          v-for="m in METIERS_EPM"
                          :key="`relance-${m}`"
                          type="button"
                          :disabled="!r[m].rlt"
                          @click="relancerRlt(r, m)"
                          class="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-40 dark:text-slate-200 dark:hover:bg-slate-700">
                          <span class="h-2.5 w-2.5 shrink-0 rounded-full" :class="METIER_STYLES[m].dot"></span>
                          <span>
                            Relancer le RLT {{ metierLabel(m) }}
                            <span v-if="reservesRestantes(r[m]) > 0" class="text-primary-400 block text-xs">
                              {{ reservesRestantes(r[m]) }} réserve(s) restante(s)
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
        </div>
        <div v-if="!rows.length" class="text-primary-400 p-8 text-center text-sm">Aucun chantier</div>
      </div>

      <!-- Slide-over d'édition -->
      <AppSlideOver :sideModal="open" :closeSideModal="closeEditor">
        <template #default>
          <AppSlideOverContent v-if="open && selected" :closeSideModal="closeEditor">
            <template #header>
              <div class="text-center">
                <div
                  class="bg-secondary-500/20 dark:bg-secondary-900/30 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                  <Icon name="lucide:door-open" size="28" class="text-secondary-700 dark:text-secondary-400" />
                </div>
                <h2 class="text-xl font-semibold text-gray-900 dark:text-white">{{ selected.chantier.name }}</h2>
                <p class="text-primary-500 text-sm">{{ selected.chantier.compte }} · EPM</p>
              </div>
            </template>

            <template #default>
              <div class="flex flex-col gap-6">
                <div v-for="m in METIERS_EPM" :key="`edit-${m}`" class="space-y-4">
                  <div class="border-primary-200 flex items-center gap-2 border-b pb-2">
                    <span class="h-2.5 w-2.5 rounded-full" :class="METIER_STYLES[m].dot"></span>
                    <h3 class="text-primary-700 text-sm font-semibold tracking-wider uppercase">{{ metierLabel(m) }}</h3>
                  </div>

                  <AppDatePicker v-model="editForm[m].epm_date" title="Date de l'EPM" clearable />

                  <AppInput v-model="editForm[m].epm_lien" :name="`epm_lien_${m}`"
                    title="Lien SharePoint (compte rendu)" type="url" placeholder="https://..." />

                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label :for="`reserves_total_${m}`" class="mb-0.5 block text-sm">Réserves (total)</label>
                      <input
                        v-model.number="editForm[m].reserves_total"
                        :id="`reserves_total_${m}`"
                        type="number"
                        min="0"
                        placeholder="0"
                        class="focus:border-primary-500 focus:ring-primary-500 border-primary-300 text-primary-700 w-full appearance-none rounded-lg border px-3 py-2 text-sm leading-tight focus:ring-1 focus:outline-none" />
                    </div>
                    <div>
                      <label :for="`reserves_realisees_${m}`" class="mb-0.5 block text-sm">Réserves réalisées</label>
                      <input
                        v-model.number="editForm[m].reserves_realisees"
                        :id="`reserves_realisees_${m}`"
                        type="number"
                        min="0"
                        placeholder="0"
                        class="focus:border-primary-500 focus:ring-primary-500 border-primary-300 text-primary-700 w-full appearance-none rounded-lg border px-3 py-2 text-sm leading-tight focus:ring-1 focus:outline-none" />
                    </div>
                  </div>
                </div>

                <!-- Champ commun aux deux métiers -->
                <div class="space-y-4">
                  <div class="border-primary-200 flex items-center gap-2 border-b pb-2">
                    <Icon name="lucide:file-text" size="16" class="text-primary-500" />
                    <h3 class="text-primary-700 text-sm font-semibold tracking-wider uppercase">Réserves documents</h3>
                  </div>
                  <textarea
                    v-model="editForm.reserves_documents"
                    id="reserves_documents"
                    name="reserves_documents"
                    rows="4"
                    class="focus:border-primary-500 focus:ring-primary-500 border-primary-300 text-primary-700 w-full resize-none appearance-none rounded-lg border px-3 py-2 text-sm leading-tight focus:ring-1 focus:outline-none"
                    placeholder="Réserves liées aux documents (commun Voie / SE-SM)..."></textarea>
                </div>
              </div>
            </template>

            <template #footer>
              <div class="border-primary-200 flex justify-end gap-3 border-t pt-4">
                <AppButtonValidated theme="cancel" type="button" @click="closeEditor">
                  <template #default>Annuler</template>
                </AppButtonValidated>
                <AppButtonValidated theme="primary" type="button" @click="enregistrer">
                  <template #default>Enregistrer</template>
                </AppButtonValidated>
              </div>
            </template>
          </AppSlideOverContent>
        </template>
      </AppSlideOver>
    </div>
  </div>
</template>
