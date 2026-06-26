<script setup>
const { getLogiques, getLogique, createLogique, updateLogique, deleteLogique } = useAssistants()

// ─── État global ─────────────────────────────────────────────────────────────
const logiques = ref([])
const loadingLogiques = ref(false)
const selectedLogique = ref(null)
const loadingLogique = ref(false)

// ─── Modales ──────────────────────────────────────────────────────────────────
const showFormLogique = ref(false)
const editingLogique = ref(null)
const showDeleteLogique = ref(false)
const logiqueToDelete = ref(null)

const formNom = ref('')
const formDescription = ref('')
const formIcone = ref('lucide:workflow')
const savingLogique = ref(false)

const openDropdownId = ref(null)

// Recherche
const search = ref('')
const logiquesFiltrees = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return logiques.value
  return logiques.value.filter((l) =>
    (l.nom ?? '').toLowerCase().includes(q) ||
    (l.description ?? '').toLowerCase().includes(q),
  )
})

// ─── CRUD logique ─────────────────────────────────────────────────────────────
const openCreateLogique = () => {
  editingLogique.value = null
  formNom.value = ''
  formDescription.value = ''
  formIcone.value = 'lucide:workflow'
  showFormLogique.value = true
}

const openEditLogique = (logique) => {
  openDropdownId.value = null
  editingLogique.value = logique
  formNom.value = logique.nom
  formDescription.value = logique.description || ''
  formIcone.value = logique.icone || 'lucide:workflow'
  showFormLogique.value = true
}

const submitLogique = async () => {
  if (!formNom.value.trim()) return
  savingLogique.value = true
  const payload = {
    nom: formNom.value.trim(),
    description: formDescription.value.trim(),
    icone: formIcone.value,
  }
  if (editingLogique.value) {
    const updated = await updateLogique(editingLogique.value.id, payload)
    if (updated) {
      const idx = logiques.value.findIndex((l) => l.id === updated.id)
      if (idx !== -1) logiques.value[idx] = { ...logiques.value[idx], ...updated }
      if (selectedLogique.value?.id === updated.id) {
        selectedLogique.value = { ...selectedLogique.value, ...updated }
      }
    }
  } else {
    const created = await createLogique(payload)
    if (created) {
      logiques.value.unshift(created)
      await selectLogique(created)
    }
  }
  savingLogique.value = false
  showFormLogique.value = false
}

const askDeleteLogique = (logique) => {
  openDropdownId.value = null
  logiqueToDelete.value = logique
  showDeleteLogique.value = true
}

const confirmDeleteLogique = async () => {
  if (!logiqueToDelete.value) return
  const ok = await deleteLogique(logiqueToDelete.value.id)
  if (ok) {
    logiques.value = logiques.value.filter((l) => l.id !== logiqueToDelete.value.id)
    if (selectedLogique.value?.id === logiqueToDelete.value.id) {
      selectedLogique.value = null
    }
  }
  showDeleteLogique.value = false
  logiqueToDelete.value = null
}

// ─── Sélection ────────────────────────────────────────────────────────────────
const selectLogique = async (logique) => {
  loadingLogique.value = true
  const full = await getLogique(logique.id)
  selectedLogique.value = full
  loadingLogique.value = false
}

// Callback de l'éditeur quand la logique a été modifiée (création/suppression de questions, etc.)
const handleLogiqueChange = async () => {
  if (!selectedLogique.value) return
  const updated = await getLogique(selectedLogique.value.id)
  selectedLogique.value = updated
  // Mettre à jour le compteur dans la sidebar
  const idx = logiques.value.findIndex((l) => l.id === updated.id)
  if (idx !== -1) {
    logiques.value[idx] = { ...logiques.value[idx], nb_questions: updated.questions.length }
  }
}

// ─── Chargement initial ───────────────────────────────────────────────────────
onMounted(async () => {
  loadingLogiques.value = true
  logiques.value = await getLogiques()
  loadingLogiques.value = false
})
</script>

<template>
  <div class="flex h-full flex-col overflow-hidden">
    <!-- Titre -->
    <div class="flex-none border-b border-slate-200 px-4 py-3 dark:border-slate-700">
      <AppTitleMain title="Logiques métier" description="Wizards configurables" />
    </div>

    <div class="flex min-h-0 flex-1 overflow-hidden">

      <!-- ── Sidebar gauche : liste des logiques ──────────────────────────── -->
      <aside class="flex w-72 flex-none flex-col border-r border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50">

        <div class="flex-none space-y-2 p-2.5 pt-3">
          <button
            type="button"
            class="group inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-linear-to-b from-secondary-500 to-secondary-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm ring-1 ring-secondary-600/40 transition-all hover:from-secondary-600 hover:to-secondary-700 hover:shadow-md active:scale-[0.985]"
            @click="openCreateLogique">
            <Icon name="lucide:plus" size="15" class="transition-transform group-hover:rotate-90" />
            Nouvelle logique
          </button>

          <div class="relative">
            <Icon name="lucide:search" size="13" class="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              v-model="search"
              type="text"
              placeholder="Rechercher…"
              class="w-full rounded-md border border-slate-200 bg-white py-1.5 pl-8 pr-2 text-sm text-slate-700 outline-none transition focus:border-secondary-300 focus:ring-1 focus:ring-secondary-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:placeholder-slate-500" />
          </div>
        </div>

        <!-- Loader -->
        <div v-if="loadingLogiques" class="flex items-center justify-center py-10">
          <div class="h-5 w-5 animate-spin rounded-full border-2 border-secondary-500 border-t-transparent"></div>
        </div>

        <!-- Empty -->
        <div v-else-if="logiques.length === 0" class="flex flex-col items-center gap-3 px-4 py-12 text-center">
          <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
            <Icon name="lucide:workflow" size="22" class="text-slate-400" />
          </div>
          <div class="space-y-1">
            <p class="text-sm font-medium text-slate-600 dark:text-slate-300">Aucune logique</p>
            <p class="text-sm text-slate-400">Crée ta première logique métier</p>
          </div>
        </div>

        <!-- Empty filtré -->
        <div v-else-if="logiquesFiltrees.length === 0" class="flex flex-col items-center gap-2 px-4 py-12 text-center">
          <Icon name="lucide:search-x" size="22" class="text-slate-300" />
          <p class="text-sm text-slate-400">Aucun résultat</p>
        </div>

        <!-- Liste -->
        <ul v-else class="flex-1 space-y-0.5 overflow-y-auto p-2">
          <li
            v-for="logique in logiquesFiltrees"
            :key="logique.id"
            class="group relative cursor-pointer overflow-hidden rounded-lg px-3 py-2.5 transition-all"
            :class="
              selectedLogique?.id === logique.id
                ? 'bg-white shadow-sm ring-1 ring-secondary-200 dark:bg-slate-800 dark:ring-secondary-700/50'
                : 'hover:bg-white/80 dark:hover:bg-slate-800/60'
            "
            @click="selectLogique(logique)">
            <span
              v-if="selectedLogique?.id === logique.id"
              class="absolute inset-y-0 left-0 w-0.5 rounded-l-lg bg-secondary-500" />
            <div class="flex items-center justify-between gap-2">
              <div class="flex min-w-0 flex-1 items-center gap-2">
                <Icon
                  :name="logique.icone || 'lucide:workflow'"
                  size="16"
                  class="flex-none text-slate-400" />
                <div class="min-w-0 flex-1">
                  <p
                    class="truncate text-sm leading-snug font-medium"
                    :class="
                      selectedLogique?.id === logique.id
                        ? 'text-secondary-700 dark:text-secondary-300'
                        : 'text-slate-700 dark:text-slate-200'
                    ">
                    {{ logique.nom }}
                  </p>
                  <p
                    class="mt-0.5 truncate text-xs text-slate-400"
                    :class="{ 'italic text-slate-300 dark:text-slate-600': !logique.description }"
                    :title="logique.description || ''">
                    {{ logique.description || 'Sans description' }}
                  </p>
                </div>
              </div>
              <div
                class="flex flex-none items-center transition-opacity"
                :class="selectedLogique?.id === logique.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'"
                @click.stop>
                <AppDropdownMenu
                  :open="openDropdownId === logique.id"
                  @update:open="(v) => openDropdownId = v ? logique.id : null">
                  <template #trigger>
                    <button
                      type="button"
                      class="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200">
                      <Icon name="lucide:more-vertical" size="14" />
                    </button>
                  </template>
                  <div class="flex min-w-32 flex-col gap-0.5">
                    <button
                      type="button"
                      class="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
                      @click="openEditLogique(logique)">
                      <Icon name="lucide:pencil" size="13" />
                      Modifier
                    </button>
                    <button
                      type="button"
                      class="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                      @click="askDeleteLogique(logique)">
                      <Icon name="lucide:trash-2" size="13" />
                      Supprimer
                    </button>
                  </div>
                </AppDropdownMenu>
              </div>
            </div>
          </li>
        </ul>
      </aside>

      <!-- ── Zone principale : éditeur d'une logique ──────────────────────── -->
      <main class="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div v-if="!selectedLogique" class="flex h-full flex-col items-center justify-center gap-3 text-slate-400">
          <Icon name="lucide:workflow" size="48" class="opacity-30" />
          <p class="text-base">Sélectionne une logique ou crée-en une nouvelle</p>
          <button
            type="button"
            class="mt-2 flex items-center gap-2 rounded-lg bg-secondary-600 px-4 py-2 text-base font-medium text-white hover:bg-secondary-700"
            @click="openCreateLogique">
            <Icon name="lucide:plus" size="18" />
            Nouvelle logique
          </button>
        </div>
        <div v-else-if="loadingLogique" class="flex items-center justify-center py-16">
          <div class="h-8 w-8 animate-spin rounded-full border-4 border-secondary-500 border-t-transparent"></div>
        </div>
        <AssistantsLogiqueEditor
          v-else
          :logique="selectedLogique"
          @changed="handleLogiqueChange" />
      </main>
    </div>

    <!-- ── Modales ──────────────────────────────────────────────────────── -->

    <!-- Créer / modifier une logique -->
    <AppModal v-model="showFormLogique" size="md">
      <template #header>
        <h3 class="text-base font-semibold text-slate-800 dark:text-white">
          {{ editingLogique ? 'Modifier la logique' : 'Nouvelle logique' }}
        </h3>
      </template>
      <form class="space-y-4" @submit.prevent="submitLogique">
        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Nom *</label>
          <input
            v-model="formNom"
            type="text"
            placeholder="Ex : Appareil de voie"
            required
            class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 transition outline-none focus:border-secondary-400 focus:ring-2 focus:ring-secondary-100 dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
          <textarea
            v-model="formDescription"
            rows="3"
            placeholder="Description optionnelle…"
            class="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 transition outline-none focus:border-secondary-400 focus:ring-2 focus:ring-secondary-100 dark:border-slate-600 dark:bg-slate-700 dark:text-white"></textarea>
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Icône (Lucide)</label>
          <div class="flex items-center gap-2">
            <Icon :name="formIcone" size="18" class="text-slate-500" />
            <input
              v-model="formIcone"
              type="text"
              placeholder="lucide:workflow"
              class="flex-1 rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm text-slate-800 transition outline-none focus:border-secondary-400 focus:ring-2 focus:ring-secondary-100 dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
          </div>
          <p class="mt-1 text-xs text-slate-400">Nom d'icône Lucide (ex : lucide:train-track, lucide:zap, lucide:plug)</p>
        </div>
      </form>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button
            type="button"
            class="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
            @click="showFormLogique = false">
            Annuler
          </button>
          <button
            type="button"
            :disabled="!formNom.trim() || savingLogique"
            class="flex items-center gap-2 rounded-lg bg-secondary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-secondary-700 disabled:opacity-50"
            @click="submitLogique">
            <div v-if="savingLogique" class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            {{ editingLogique ? 'Enregistrer' : 'Créer' }}
          </button>
        </div>
      </template>
    </AppModal>

    <!-- Suppression -->
    <AppModal v-model="showDeleteLogique" size="sm">
      <template #header>
        <h3 class="text-base font-semibold text-slate-800 dark:text-white">Supprimer la logique</h3>
      </template>
      <p class="text-sm text-slate-600 dark:text-slate-300">
        Supprimer la logique <strong>« {{ logiqueToDelete?.nom }} »</strong> et toutes ses questions ?
        Cette action est irréversible.
      </p>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button
            type="button"
            class="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
            @click="showDeleteLogique = false">
            Annuler
          </button>
          <button
            type="button"
            class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            @click="confirmDeleteLogique">
            Supprimer
          </button>
        </div>
      </template>
    </AppModal>
  </div>
</template>
