<script setup>
const {
  getChantiers,
  getAllChantiers,
  passerChantier,
  terminerChantier,
  supprimerChantier
} = useChantiers()

const { setLoader } = useLoader()

const tableWrapper = ref(null)

// Retourne la date de début la plus tôt entre réa et prépa (tableaux de périodes)
const getEarliestStartDate = (chantier) => {
  const dates = []
  if (Array.isArray(chantier.date_rea)) {
    chantier.date_rea.forEach((p) => { if (p.date_start_travaux) dates.push(p.date_start_travaux) })
  }
  if (Array.isArray(chantier.date_prepa)) {
    chantier.date_prepa.forEach((p) => { if (p.date_start_prepa) dates.push(p.date_start_prepa) })
  }
  if (dates.length === 0) return ''
  return dates.sort()[0]
}

// Formater une date ISO en date lisible
const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const searchQuery = ref('')

// Tous les chantiers triés et filtrés
const sortedChantiers = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  let list = [...getAllChantiers.value]

  if (query) {
    list = list.filter((c) => {
      const compte = (c.compte || '').toLowerCase()
      const name = (c.name || '').toLowerCase()
      const etatLabel = getEtatInfo(c.etat).label.toLowerCase()
      return compte.includes(query) || name.includes(query) || etatLabel.includes(query)
    })
  }

  return list.sort((a, b) => {
    const dateA = getEarliestStartDate(a)
    const dateB = getEarliestStartDate(b)
    if (!dateA && !dateB) return 0
    if (!dateA) return 1
    if (!dateB) return -1
    return dateA.localeCompare(dateB)
  })
})

// Info état (label + couleurs)
const getEtatInfo = (etat) => {
  switch (etat) {
    case 2:
      return { label: 'Pré-op', bg: 'bg-lime-100', text: 'text-lime-700' }
    case 0:
      return { label: 'RLT', bg: 'bg-sky-100', text: 'text-sky-700' }
    case 1:
      return { label: 'Externe', bg: 'bg-purple-100', text: 'text-purple-700' }
    case -1:
      return { label: 'Terminé', bg: 'bg-slate-100', text: 'text-slate-700' }
    default:
      return { label: 'Inconnu', bg: 'bg-gray-100', text: 'text-gray-700' }
  }
}

// Modal de confirmation
const showConfirmModal = ref(false)
const confirmAction = ref(null) // { type: 'rlt' | 'terminer' | 'supprimer', chantier }

const confirmMessages = {
  rlt: { title: 'Passer au RLT', message: 'Êtes-vous sûr de vouloir passer ce chantier au statut RLT ?', theme: 'sky' },
  terminer: { title: 'Terminer le chantier', message: 'Êtes-vous sûr de vouloir terminer ce chantier ?', theme: 'slate' },
  supprimer: { title: 'Supprimer le chantier', message: 'Êtes-vous sûr de vouloir supprimer définitivement ce chantier ? Cette action est irréversible.', theme: 'red' }
}

const askConfirmation = (type, chantier) => {
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

const cancelAction = () => {
  showConfirmModal.value = false
  confirmAction.value = null
}

// Scroll vers le premier Pré-op
const scrollToFirstPreop = () => {
  const index = sortedChantiers.value.findIndex((c) => c.etat === 2)
  if (index === -1 || !tableWrapper.value) return
  const rows = tableWrapper.value.querySelectorAll('tbody tr')
  if (rows?.[index]) {
    rows[index].scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

// Charger les chantiers puis scroll vers le premier Pré-op
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
  <div class="flex h-full w-full flex-col gap-4 overflow-hidden p-4">
    <div class="flex shrink-0 items-end justify-between gap-4">
      <AppTitleMain title="Paramètres Chantiers" description="Gestion des chantiers" />
      <div class="relative w-64">
        <Icon name="lucide:search" class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Rechercher..."
          class="w-full rounded-lg border border-gray-200 bg-white py-2 pr-3 pl-9 text-sm text-gray-700 outline-none transition-colors placeholder:text-gray-400 focus:border-primary-400 focus:ring-1 focus:ring-primary-400 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200" />
      </div>
    </div>

    <div ref="tableWrapper" class="min-h-0 flex-1 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <table class="w-full text-left text-sm">
        <thead class="sticky top-0 z-10 border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
          <tr>
            <th class="px-4 py-3">Compte</th>
            <th class="px-4 py-3">Nom</th>
            <th class="hidden px-4 py-3 md:table-cell">Ligne</th>
            <th class="hidden px-4 py-3 sm:table-cell">Date début</th>
            <th class="px-4 py-3">État</th>
            <th class="px-4 py-3 text-center">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
          <tr
            v-for="chantier in sortedChantiers"
            :key="chantier.id"
            class="transition-colors hover:bg-gray-50 dark:hover:bg-gray-750">
            <td class="whitespace-nowrap px-4 py-3 font-mono text-xs font-bold text-gray-700 dark:text-gray-300">
              {{ chantier.compte || '-' }}
            </td>
            <td class="max-w-48 truncate px-4 py-3 text-gray-800 dark:text-gray-200">
              {{ chantier.name || '-' }}
            </td>
            <td class="hidden px-4 py-3 text-gray-500 dark:text-gray-400 md:table-cell">
              {{ chantier.ligne || '-' }}
            </td>
            <td class="hidden whitespace-nowrap px-4 py-3 text-gray-500 dark:text-gray-400 sm:table-cell">
              {{ formatDate(getEarliestStartDate(chantier)) }}
            </td>
            <td class="px-4 py-3">
              <span
                class="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold"
                :class="[getEtatInfo(chantier.etat).bg, getEtatInfo(chantier.etat).text]">
                {{ getEtatInfo(chantier.etat).label }}
              </span>
            </td>
            <td class="px-4 py-3 text-center">
              <AppDropdownMenu>
                <template #trigger>
                  <button class="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600">
                    <Icon name="lucide:more-horizontal" class="h-4 w-4" />
                  </button>
                </template>
                <template #default>
                  <div class="flex min-w-40 flex-col">
                    <!-- Passer au RLT -->
                    <button
                      v-if="chantier.etat !== 0"
                      class="flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-sky-700 transition-colors hover:bg-sky-50"
                      @click="askConfirmation('rlt', chantier)">
                      <Icon name="lucide:arrow-right-circle" class="h-4 w-4" />
                      Passer au RLT
                    </button>
                    <span v-else class="flex cursor-default items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-sky-400">
                      <Icon name="lucide:check" class="h-4 w-4" />
                      RLT (actuel)
                    </span>

                    <!-- Terminer -->
                    <button
                      v-if="chantier.etat !== -1"
                      class="flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50"
                      @click="askConfirmation('terminer', chantier)">
                      <Icon name="lucide:check-circle" class="h-4 w-4" />
                      Terminer
                    </button>
                    <span v-else class="flex cursor-default items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-slate-400">
                      <Icon name="lucide:check" class="h-4 w-4" />
                      Terminé (actuel)
                    </span>

                    <!-- Séparateur -->
                    <div class="my-1 border-t border-gray-200 dark:border-gray-600"></div>

                    <!-- Supprimer -->
                    <button
                      class="flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
                      @click="askConfirmation('supprimer', chantier)">
                      <Icon name="lucide:trash-2" class="h-4 w-4" />
                      Supprimer
                    </button>
                  </div>
                </template>
              </AppDropdownMenu>
            </td>
          </tr>

          <tr v-if="sortedChantiers.length === 0">
            <td colspan="6" class="px-4 py-8 text-center text-sm text-gray-400">Aucun chantier disponible.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal de confirmation -->
    <AppModal v-model="showConfirmModal" size="sm" @close="cancelAction">
      <template v-if="confirmAction" #header>
        <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200">
          {{ confirmMessages[confirmAction.type].title }}
        </h3>
      </template>
      <template v-if="confirmAction" #default>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          {{ confirmMessages[confirmAction.type].message }}
        </p>
        <div class="mt-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
          <p class="text-sm font-medium text-gray-700 dark:text-gray-300">
            {{ confirmAction.chantier.compte }} - {{ confirmAction.chantier.name }}
          </p>
        </div>
      </template>
      <template v-if="confirmAction" #footer>
        <div class="flex justify-end gap-3">
          <button
            class="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            @click="cancelAction">
            Annuler
          </button>
          <button
            class="rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
            :class="{
              'bg-sky-500 hover:bg-sky-600': confirmAction.type === 'rlt',
              'bg-slate-500 hover:bg-slate-600': confirmAction.type === 'terminer',
              'bg-red-500 hover:bg-red-600': confirmAction.type === 'supprimer'
            }"
            @click="executeAction">
            Confirmer
          </button>
        </div>
      </template>
    </AppModal>
  </div>
</template>
