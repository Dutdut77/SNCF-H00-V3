<script setup>
const props = defineProps({
  open:       { type: Boolean, required: true },
  commandeId: { type: String, required: true },
  metier:     { type: String, default: null }, // restreint les logiques au métier de la commande
})

const emit = defineEmits(['close', 'imported'])

const { getLogiques, getLogique } = useAssistants()

const logiques = ref([])
const loading = ref(false)
const search = ref('')

const showWizard = ref(false)
const selectedLogique = ref(null)
const loadingLogique = ref(false)

watch(() => props.open, async (v) => {
  if (!v) {
    showWizard.value = false
    selectedLogique.value = null
    return
  }
  loading.value = true
  logiques.value = await getLogiques(props.metier)
  loading.value = false
})

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return logiques.value
  return logiques.value.filter((l) =>
    (l.nom ?? '').toLowerCase().includes(q) ||
    (l.description ?? '').toLowerCase().includes(q),
  )
})

const launch = async (logique) => {
  loadingLogique.value = true
  const full = await getLogique(logique.id)
  loadingLogique.value = false
  if (!full) return
  selectedLogique.value = full
  showWizard.value = true
}

const onWizardImported = (payload) => {
  showWizard.value = false
  emit('imported', payload)
}

const onWizardClose = () => {
  showWizard.value = false
  selectedLogique.value = null
}

const onClose = () => emit('close')
</script>

<template>
  <!-- Étape 1 : choix de la logique -->
  <AppModal :model-value="open && !showWizard" size="lg" @update:model-value="onClose">
    <template #header>
      <h3 class="text-base font-semibold text-slate-800 dark:text-white">
        Choisir un assistant
      </h3>
    </template>

    <div class="space-y-4">
      <!-- Recherche -->
      <div class="relative">
        <Icon name="lucide:search" size="14" class="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          v-model="search"
          type="text"
          placeholder="Rechercher une logique…"
          class="w-full rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-3 text-sm text-slate-700 outline-none focus:border-secondary-300 focus:ring-1 focus:ring-secondary-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200" />
      </div>

      <!-- Loader -->
      <div v-if="loading || loadingLogique" class="flex items-center justify-center py-10">
        <div class="h-6 w-6 animate-spin rounded-full border-2 border-secondary-500 border-t-transparent"></div>
      </div>

      <!-- Empty -->
      <div v-else-if="logiques.length === 0" class="rounded-lg border border-dashed border-slate-200 px-4 py-10 text-center dark:border-slate-700">
        <Icon name="lucide:workflow" size="32" class="mx-auto text-slate-300" />
        <p class="mt-2 text-sm font-medium text-slate-600 dark:text-slate-300">Aucune logique disponible</p>
        <p class="mt-1 text-xs text-slate-400">Crée d'abord une logique dans Paramètres → Logiques métier</p>
      </div>

      <!-- Filtré vide -->
      <div v-else-if="filtered.length === 0" class="py-8 text-center text-sm text-slate-400">
        <Icon name="lucide:search-x" size="22" class="mx-auto opacity-50" />
        <p class="mt-2">Aucun résultat</p>
      </div>

      <!-- Liste -->
      <ul v-else class="space-y-2 max-h-96 overflow-y-auto">
        <li
          v-for="logique in filtered"
          :key="logique.id">
          <button
            type="button"
            :disabled="logique.nb_questions === 0"
            class="group flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-secondary-300 hover:bg-secondary-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-slate-200 disabled:hover:bg-white dark:border-slate-700 dark:bg-slate-800 dark:hover:border-secondary-600 dark:hover:bg-secondary-900/20"
            @click="launch(logique)">
            <div class="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-secondary-100 text-secondary-600 dark:bg-secondary-900/30 dark:text-secondary-400">
              <Icon :name="logique.icone || 'lucide:workflow'" size="18" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{{ logique.nom }}</p>
              <p v-if="logique.description" class="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{{ logique.description }}</p>
              <p class="mt-0.5 text-xs text-slate-400">
                {{ logique.nb_questions }} question{{ logique.nb_questions !== 1 ? 's' : '' }}
                <span v-if="logique.nb_questions === 0" class="italic">— configure-la avant de la lancer</span>
              </p>
            </div>
            <Icon name="lucide:chevron-right" size="16" class="flex-none text-slate-300 transition group-hover:text-secondary-500" />
          </button>
        </li>
      </ul>
    </div>

    <template #footer>
      <div class="flex justify-end">
        <button
          type="button"
          class="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
          @click="onClose">
          Fermer
        </button>
      </div>
    </template>
  </AppModal>

  <!-- Étape 2 : wizard runtime -->
  <AssistantsWizardModal
    v-if="selectedLogique"
    :open="showWizard"
    :logique="selectedLogique"
    :commande-id="commandeId"
    @close="onWizardClose"
    @imported="onWizardImported" />
</template>
