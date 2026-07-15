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

const selectedMetier = ref('VOIE')
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

// RLT principal du métier sélectionné
const rltField = computed(() => (selectedMetier.value === 'VOIE' ? 'rlt_voie_principale' : 'rlt_ses_principale'))

const rltForChantier = (chantierId) => {
  const contacts = allContactsTravaux.value?.find((c) => c.chantier_id === chantierId)
  const email = contacts?.[rltField.value]
  if (!email) return null
  const u = users.value.find((usr) => usr.email?.toLowerCase() === email.toLowerCase())
  return {
    email,
    nom: u?.nom || '',
    prenom: u?.prenom || '',
    fullName: u?.prenom && u?.nom ? `${u.prenom} ${u.nom}` : email
  }
}

// Lignes du tableau : chantiers filtrés + données EPM du métier sélectionné
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
      const epm = epmByChantier.value[chantier.id]?.[selectedMetier.value] || {}
      return {
        chantier,
        debut: getFirstReaDate(chantier),
        fin: getLastReaDate(chantier),
        rlt: rltForChantier(chantier.id),
        epmDate: epm.epm_date || null,
        epmLien: epm.epm_lien || null,
        total: epm.reserves_total ?? null,
        realisees: epm.reserves_realisees ?? null,
        documents: epm.reserves_documents || ''
      }
    })
    .sort((a, b) => {
      if (!a.debut && !b.debut) return 0
      if (!a.debut) return 1
      if (!b.debut) return -1
      return new Date(a.debut) - new Date(b.debut)
    })
})

const reservesRestantes = (r) => Math.max(0, (r.total || 0) - (r.realisees || 0))

// Cartes de stats
const stats = computed(() => {
  const totalReserves = rows.value.reduce((sum, r) => sum + (r.total || 0), 0)
  const reservesRealisees = rows.value.reduce((sum, r) => sum + (r.realisees || 0), 0)
  return {
    epmRealisees: rows.value.filter((r) => r.epmDate).length,
    chantiers: rows.value.length,
    totalReserves,
    reservesRealisees,
    avancement: totalReserves > 0 ? `${Math.round((reservesRealisees / totalReserves) * 100)} %` : '—'
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

// Slide-over d'édition
const open = ref(false)
const selected = ref(null)
const editForm = ref({
  epm_date: null,
  epm_lien: '',
  reserves_total: null,
  reserves_realisees: null,
  reserves_documents: ''
})

const openEditor = (r) => {
  selected.value = r
  editForm.value = {
    epm_date: toTimestamp(r.epmDate),
    epm_lien: r.epmLien || '',
    reserves_total: r.total ?? null,
    reserves_realisees: r.realisees ?? null,
    reserves_documents: r.documents || ''
  }
  open.value = true
}

const closeEditor = () => {
  open.value = false
  selected.value = null
}

const enregistrer = async () => {
  if (!selected.value) return
  const data = await upsertEpm(selected.value.chantier.id, selectedMetier.value, {
    epm_date: timestampToISODate(editForm.value.epm_date),
    epm_lien: editForm.value.epm_lien || null,
    reserves_total: toInt(editForm.value.reserves_total),
    reserves_realisees: toInt(editForm.value.reserves_realisees),
    reserves_documents: editForm.value.reserves_documents || null
  })
  if (data) closeEditor()
}

// Relance du RLT par email (fire-and-forget)
const relancerRlt = (r) => {
  const rlt = r.rlt
  if (!rlt) {
    addToast({
      title: 'Aucun RLT',
      message: `Aucun RLT ${metierLabel(selectedMetier.value)} principal sur ce chantier.`,
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
      metierLabel: metierLabel(selectedMetier.value),
      reservesTotal: r.total ?? 0,
      reservesRealisees: r.realisees ?? 0,
      epmDate: r.epmDate,
      epmLien: r.epmLien
    }
  }).catch(console.error)

  addToast({
    title: 'Relance envoyée',
    message: `Email envoyé à ${rlt.email}`,
    type: 'Success'
  })
}
</script>

<template>
  <div class="flex h-full w-full flex-col overflow-y-auto">
    <div class="w-full space-y-6 p-6">
      <!-- En-tête -->
      <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <AppTitleMain title="Suivi EPM" description="Entrées en périmètre maintenance — réserves et comptes rendus" />
        <AppMetierTabs v-model="selectedMetier" :metiers="['VOIE', 'SES']" class="w-full sm:w-52 sm:shrink-0" />
      </div>

      <!-- Cartes de stats -->
      <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div class="rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p class="text-xs font-medium tracking-wide text-gray-500 uppercase">EPM réalisées</p>
          <p class="text-secondary-600 dark:text-secondary-400 mt-1 text-2xl font-bold">
            {{ stats.epmRealisees }}<span class="text-sm font-medium text-gray-400"> / {{ stats.chantiers }}</span>
          </p>
        </div>
        <div class="rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p class="text-xs font-medium tracking-wide text-gray-500 uppercase">Total réserves</p>
          <p class="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">{{ stats.totalReserves }}</p>
        </div>
        <div class="rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <p class="text-xs font-medium tracking-wide text-gray-500 uppercase">Réserves réalisées</p>
          <p class="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{{ stats.reservesRealisees }}</p>
        </div>
        <div
          class="from-secondary-400 to-secondary-600 border-secondary-400 rounded-xl border bg-linear-to-br p-4 shadow-md">
          <p class="text-xs font-medium tracking-wide text-white/80 uppercase">Avancement</p>
          <p class="mt-1 text-2xl font-bold text-white">{{ stats.avancement }}</p>
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
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-primary-500 border-primary-200 border-b text-left text-xs uppercase dark:border-slate-700">
                <th class="px-4 py-3 font-medium">Chantier</th>
                <th class="px-4 py-3 font-medium whitespace-nowrap">Début</th>
                <th class="px-4 py-3 font-medium whitespace-nowrap">Fin</th>
                <th class="px-4 py-3 font-medium">RLT</th>
                <th class="px-4 py-3 font-medium whitespace-nowrap">Date EPM</th>
                <th class="px-4 py-3 font-medium whitespace-nowrap">Compte rendu</th>
                <th class="px-4 py-3 font-medium whitespace-nowrap">Réserves</th>
                <th class="px-4 py-3 font-medium whitespace-nowrap">Réalisées</th>
                <th class="px-4 py-3 font-medium">Réserves documents</th>
                <th class="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="r in rows"
                :key="r.chantier.id"
                @click="openEditor(r)"
                class="border-primary-100 hover:bg-primary-50 cursor-pointer border-b transition-colors dark:border-slate-800 dark:hover:bg-slate-800">
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2.5">
                    <span class="text-primary-400 text-xs">{{ r.chantier.compte }}</span>
                    <span class="text-primary-800 font-medium dark:text-gray-100">{{ r.chantier.name }}</span>
                  </div>
                </td>
                <td class="text-primary-500 px-4 py-3 whitespace-nowrap">{{ shortDate(r.debut) || '—' }}</td>
                <td class="text-primary-500 px-4 py-3 whitespace-nowrap">{{ shortDate(r.fin) || '—' }}</td>
                <td class="px-4 py-3">
                  <AppTooltip v-if="r.rlt" :text="r.rlt.fullName">
                    <AppAvatar :nom="r.rlt.nom || r.rlt.email" :prenom="r.rlt.prenom" size="xs"
                      color="bg-purple-200 text-purple-600" />
                  </AppTooltip>
                  <span v-else class="text-primary-300">—</span>
                </td>
                <td class="text-primary-600 px-4 py-3 whitespace-nowrap dark:text-gray-300">
                  {{ shortDate(r.epmDate) || '—' }}
                </td>
                <td class="px-4 py-3 whitespace-nowrap">
                  <a
                    v-if="r.epmLien"
                    :href="r.epmLien"
                    target="_blank"
                    rel="noopener noreferrer"
                    @click.stop
                    class="text-secondary-600 hover:text-secondary-700 dark:text-secondary-400 inline-flex items-center gap-1.5 text-sm font-medium hover:underline">
                    <Icon name="lucide:external-link" size="15" />
                    Ouvrir
                  </a>
                  <span v-else class="text-primary-300">—</span>
                </td>
                <td class="text-primary-600 px-4 py-3 whitespace-nowrap dark:text-gray-300">
                  <span v-if="r.total !== null">{{ r.total }}</span>
                  <span v-else class="text-primary-300">—</span>
                </td>
                <td class="px-4 py-3 whitespace-nowrap">
                  <span
                    v-if="r.total !== null"
                    class="rounded-full px-2 py-0.5 text-xs font-medium"
                    :class="
                      reservesRestantes(r) === 0
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                    ">
                    {{ r.realisees ?? 0 }} / {{ r.total }}
                  </span>
                  <span v-else class="text-primary-300">—</span>
                </td>
                <td class="px-4 py-3">
                  <span class="text-primary-600 block max-w-[16rem] truncate dark:text-gray-300" :title="r.documents">
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
                      <div class="w-56 py-1">
                        <button
                          type="button"
                          :disabled="!r.rlt"
                          @click="relancerRlt(r)"
                          class="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-40 dark:text-slate-200 dark:hover:bg-slate-700">
                          <Icon name="lucide:send" size="15" class="text-secondary-500" />
                          <span>
                            Relancer le RLT
                            <span v-if="reservesRestantes(r) > 0" class="text-primary-400 block text-xs">
                              {{ reservesRestantes(r) }} réserve(s) restante(s)
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
                <p class="text-primary-500 text-sm">
                  {{ selected.chantier.compte }} · EPM {{ metierLabel(selectedMetier) }}
                </p>
              </div>
            </template>

            <template #default>
              <div class="flex flex-col gap-6">
                <AppDatePicker v-model="editForm.epm_date" title="Date de l'EPM" clearable />

                <AppInput v-model="editForm.epm_lien" name="epm_lien" title="Lien SharePoint (compte rendu)"
                  type="url" placeholder="https://..." />

                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label for="reserves_total" class="mb-0.5 block text-sm">Réserves (total)</label>
                    <input
                      v-model.number="editForm.reserves_total"
                      id="reserves_total"
                      type="number"
                      min="0"
                      placeholder="0"
                      class="focus:border-primary-500 focus:ring-primary-500 border-primary-300 text-primary-700 w-full appearance-none rounded-lg border px-3 py-2 text-sm leading-tight focus:ring-1 focus:outline-none" />
                  </div>
                  <div>
                    <label for="reserves_realisees" class="mb-0.5 block text-sm">Réserves réalisées</label>
                    <input
                      v-model.number="editForm.reserves_realisees"
                      id="reserves_realisees"
                      type="number"
                      min="0"
                      placeholder="0"
                      class="focus:border-primary-500 focus:ring-primary-500 border-primary-300 text-primary-700 w-full appearance-none rounded-lg border px-3 py-2 text-sm leading-tight focus:ring-1 focus:outline-none" />
                  </div>
                </div>

                <div class="w-full">
                  <label for="reserves_documents" class="mb-0.5 block text-sm">Réserves documents</label>
                  <textarea
                    v-model="editForm.reserves_documents"
                    id="reserves_documents"
                    name="reserves_documents"
                    rows="4"
                    class="focus:border-primary-500 focus:ring-primary-500 border-primary-300 text-primary-700 w-full resize-none appearance-none rounded-lg border px-3 py-2 text-sm leading-tight focus:ring-1 focus:outline-none"
                    placeholder="Réserves liées aux documents..."></textarea>
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
