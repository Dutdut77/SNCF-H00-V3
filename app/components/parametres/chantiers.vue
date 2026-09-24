<script setup>
const { getChantiers, getAllChantiers, passerChantier, terminerChantier, supprimerChantier } = useChantiers()
const { getEtatInfo } = useEtatChantier()
const { setLoader } = useLoader()

const tableWrapper = ref(null)

// Retourne la date de début la plus tôt entre réa et prépa (tableaux de périodes)
const getEarliestStartDate = (chantier) => {
  const dates = []
  if (Array.isArray(chantier.date_rea)) {
    chantier.date_rea.forEach((p) => {
      if (p.date_start_travaux) dates.push(p.date_start_travaux)
    })
  }
  if (Array.isArray(chantier.date_prepa)) {
    chantier.date_prepa.forEach((p) => {
      if (p.date_start_prepa) dates.push(p.date_start_prepa)
    })
  }
  if (dates.length === 0) return ''
  return dates.sort()[0]
}

// Formater une date ISO en date lisible
const formatDate = (dateStr) => {
  if (!dateStr) return null
  const d = new Date(dateStr)
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const searchQuery = ref('')
const filtreEtat = ref(null) // null = tous

// Filtre par état : pastilles dans l'ordre de vie d'un chantier
const ETATS_FILTRE = [2, 0, 1, -1]
const filtresEtat = computed(() => {
  const compte = {}
  for (const c of getAllChantiers.value) compte[c.etat] = (compte[c.etat] ?? 0) + 1
  return [
    { id: null, label: 'Tous', count: getAllChantiers.value.length },
    ...ETATS_FILTRE.map((e) => ({
      id: e,
      label: getEtatInfo(e).label,
      dot: getEtatInfo(e).color,
      count: compte[e] ?? 0
    }))
  ]
})

// Tous les chantiers triés et filtrés
const sortedChantiers = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  let list = getAllChantiers.value.filter((c) => filtreEtat.value === null || c.etat === filtreEtat.value)

  if (query) {
    list = list.filter((c) => {
      const compte = (c.compte || '').toLowerCase()
      const name = (c.name || '').toLowerCase()
      const etatLabel = getEtatInfo(c.etat).label.toLowerCase()
      return compte.includes(query) || name.includes(query) || etatLabel.includes(query)
    })
  }

  return [...list].sort((a, b) => {
    const dateA = getEarliestStartDate(a)
    const dateB = getEarliestStartDate(b)
    if (!dateA && !dateB) return 0
    if (!dateA) return 1
    if (!dateB) return -1
    return dateA.localeCompare(dateB)
  })
})

// ============================================
// ACTIONS (confirmées)
// ============================================
const showConfirmModal = ref(false)
const confirmAction = ref(null) // { type: 'rlt' | 'terminer' | 'supprimer', chantier }

const ACTIONS = {
  rlt: {
    title: 'Passer le chantier au RLT',
    label: 'Passer au RLT',
    icon: 'lucide:circle-arrow-right',
    message: 'Le chantier passera au statut RLT.',
    danger: false
  },
  terminer: {
    title: 'Terminer le chantier',
    label: 'Terminer',
    icon: 'lucide:circle-check',
    message: 'Le chantier passera au statut Terminé.',
    danger: false
  },
  supprimer: {
    title: 'Supprimer le chantier',
    label: 'Supprimer',
    icon: 'lucide:trash-2',
    message: 'Le chantier et toutes ses données seront supprimés définitivement.',
    danger: true
  }
}

const askConfirmation = (close, type, chantier) => {
  close?.()
  confirmAction.value = { type, chantier }
  showConfirmModal.value = true
}

const executeAction = async () => {
  if (!confirmAction.value) return
  const { type, chantier } = confirmAction.value
  showConfirmModal.value = false
  setLoader(true)
  try {
    if (type === 'rlt') await passerChantier(chantier.id)
    else if (type === 'terminer') await terminerChantier(chantier.id)
    else if (type === 'supprimer') await supprimerChantier(chantier.id)
  } finally {
    setLoader(false)
    confirmAction.value = null
  }
}

// Défilement jusqu'au premier Pré-op
const scrollToFirstPreop = () => {
  const index = sortedChantiers.value.findIndex((c) => c.etat === 2)
  if (index === -1 || !tableWrapper.value) return
  const rows = tableWrapper.value.querySelectorAll('tbody tr')
  if (rows?.[index]) {
    rows[index].scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

// Charger les chantiers puis défiler jusqu'au premier Pré-op
onMounted(async () => {
  setLoader(true)
  try {
    await getChantiers()
  } finally {
    setLoader(false)
  }
  await nextTick()
  setTimeout(scrollToFirstPreop, 200)
})
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col gap-4 p-4 lg:px-8 lg:pt-4 lg:pb-4">
    <!-- Barre d'outils : recherche, puis filtre par état -->
    <div class="flex flex-col gap-3 xl:flex-row xl:items-center">
      <AppInputSearch
        v-model="searchQuery"
        boxed
        dense
        class="w-full xl:max-w-sm"
        placeholder="Rechercher un compte, un chantier…" />
      <AppFilterPills v-model="filtreEtat" :options="filtresEtat" label="Filtrer par état" class="xl:ml-auto" />
    </div>

    <!-- Tableau des chantiers -->
    <div ref="tableWrapper" :class="TABLEAU_CARTE">
      <table class="w-full text-sm">
        <thead :class="TABLEAU_TETE">
          <tr>
            <th class="px-4 py-2.5 text-left">Compte</th>
            <th class="px-4 py-2.5 text-left">Chantier</th>
            <th class="hidden px-4 py-2.5 text-left md:table-cell">Ligne</th>
            <th class="hidden px-4 py-2.5 text-left sm:table-cell">Début</th>
            <th class="px-4 py-2.5 text-center">État</th>
            <th class="w-14 px-4 py-2.5"><span class="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody :class="TABLEAU_CORPS">
          <tr
            v-for="chantier in sortedChantiers"
            :key="chantier.id"
            class="transition-colors hover:bg-taupe-100 dark:hover:bg-taupe-400/8">
            <td class="px-4 py-3">
              <span :class="ETIQUETTE_TAUPE">{{ chantier.compte || '—' }}</span>
            </td>
            <td class="text-ink max-w-64 truncate px-4 py-3 font-medium" :title="chantier.name">
              {{ chantier.name || '—' }}
            </td>
            <td class="text-ink-soft hidden px-4 py-3 md:table-cell">{{ chantier.ligne || '—' }}</td>
            <td class="text-ink-soft hidden px-4 py-3 whitespace-nowrap tabular-nums sm:table-cell">
              {{ formatDate(getEarliestStartDate(chantier)) || '—' }}
            </td>
            <td class="px-4 py-3 text-center whitespace-nowrap">
              <span
                class="inline-flex w-[84px] justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
                :class="[getEtatInfo(chantier.etat).bgLight, getEtatInfo(chantier.etat).textColor]">
                {{ getEtatInfo(chantier.etat).label }}
              </span>
            </td>
            <td class="px-4 py-2 text-right">
              <AppDropdownMenu :panel-class="MENU_PANNEAU">
                <template #trigger>
                  <span :class="BOUTON_ICONE" title="Actions">
                    <Icon name="lucide:ellipsis-vertical" size="16" />
                  </span>
                </template>
                <template #default="{ close }">
                  <div class="flex w-52 flex-col">
                    <button
                      type="button"
                      :class="MENU_ENTREE"
                      :disabled="chantier.etat === 0"
                      @click="askConfirmation(close, 'rlt', chantier)">
                      <Icon name="lucide:circle-arrow-right" size="16" class="text-sky-600 dark:text-sky-300" />
                      {{ chantier.etat === 0 ? 'Déjà au RLT' : 'Passer au RLT' }}
                    </button>
                    <button
                      type="button"
                      :class="MENU_ENTREE"
                      :disabled="chantier.etat === -1"
                      @click="askConfirmation(close, 'terminer', chantier)">
                      <Icon name="lucide:circle-check" size="16" class="text-slate-500 dark:text-white/60" />
                      {{ chantier.etat === -1 ? 'Déjà terminé' : 'Terminer' }}
                    </button>
                    <div class="border-rule my-1 border-t" />
                    <button
                      type="button"
                      :class="MENU_ENTREE_DANGER"
                      @click="askConfirmation(close, 'supprimer', chantier)">
                      <Icon name="lucide:trash-2" size="16" />
                      Supprimer
                    </button>
                  </div>
                </template>
              </AppDropdownMenu>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="sortedChantiers.length === 0" class="text-ink-soft flex flex-col items-center gap-2 p-10 text-sm">
        <Icon name="lucide:building-2" size="28" class="opacity-40" />
        Aucun chantier
      </div>
    </div>

    <!-- Confirmation de l'action -->
    <AppConfirmModal
      v-model="showConfirmModal"
      :title="confirmAction ? ACTIONS[confirmAction.type].title : ''"
      :confirm-label="confirmAction ? ACTIONS[confirmAction.type].label : ''"
      :icon="confirmAction ? ACTIONS[confirmAction.type].icon : ''"
      :danger="confirmAction ? ACTIONS[confirmAction.type].danger : true"
      @confirm="executeAction"
      @cancel="confirmAction = null">
      <template v-if="confirmAction">
        <p>{{ ACTIONS[confirmAction.type].message }}</p>
        <p class="mt-3 flex items-center gap-2.5 rounded-lg bg-slate-50 px-3 py-2.5 dark:bg-white/5">
          <span :class="ETIQUETTE_TAUPE">{{ confirmAction.chantier.compte }}</span>
          <span class="text-ink truncate font-medium">{{ confirmAction.chantier.name }}</span>
        </p>
      </template>
    </AppConfirmModal>
  </div>
</template>
