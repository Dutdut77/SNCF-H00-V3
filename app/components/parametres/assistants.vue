<script setup>
const { getLogiques, getLogique, createLogique, updateLogique, deleteLogique } = useAssistants()

const props = defineProps({
  metier: { type: String, required: true },
})

// ─── Métier actif (déterminé par l'entrée de menu sélectionnée) ───────────────
const activeMetier = computed(() => props.metier)

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

// Icônes proposées dans la fiche (le champ accepte tout nom d'icône Lucide)
const ICONES_SUGGEREES = [
  'lucide:workflow',
  'lucide:train-track',
  'lucide:train-front',
  'lucide:zap',
  'lucide:plug',
  'lucide:cable',
  'lucide:construction',
  'lucide:wrench',
  'lucide:boxes',
  'lucide:git-fork',
  'lucide:route',
  'lucide:signpost'
]

// Saisie de la fiche au moment de l'ouverture : la fermeture demande confirmation si elle a changé
const formInitial = ref('')
const formSnapshot = () => JSON.stringify([formNom.value, formDescription.value, formIcone.value])
const formDirty = computed(() => showFormLogique.value && formSnapshot() !== formInitial.value)

// ─── CRUD logique ─────────────────────────────────────────────────────────────
const openCreateLogique = () => {
  editingLogique.value = null
  formNom.value = ''
  formDescription.value = ''
  formIcone.value = 'lucide:workflow'
  formInitial.value = formSnapshot()
  showFormLogique.value = true
}

const openEditLogique = (logique) => {
  openDropdownId.value = null
  editingLogique.value = logique
  formNom.value = logique.nom
  formDescription.value = logique.description || ''
  formIcone.value = logique.icone || 'lucide:workflow'
  formInitial.value = formSnapshot()
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
  if (!editingLogique.value) payload.metier = activeMetier.value
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

// ─── Chargement de la liste pour le métier actif ──────────────────────────────
const loadLogiques = async () => {
  loadingLogiques.value = true
  logiques.value = await getLogiques(activeMetier.value)
  loadingLogiques.value = false
}

// Changement de métier : recharge la liste et réinitialise la sélection.
watch(activeMetier, async () => {
  selectedLogique.value = null
  search.value = ''
  await loadLogiques()
})

// ─── Chargement initial ───────────────────────────────────────────────────────
onMounted(loadLogiques)
</script>


<template>
  <div class="flex min-h-0 flex-1 flex-col gap-4 p-4 lg:flex-row lg:px-8 lg:pt-4 lg:pb-4">
    <!-- ── Liste des logiques du métier ─────────────────────────────────── -->
    <aside
      class="surface-card flex max-h-96 flex-none flex-col overflow-hidden rounded-xl lg:max-h-none lg:w-76"
      aria-label="Logiques métier">
      <div class="border-rule flex-none space-y-2.5 border-b p-3">
        <AppButtonValidated theme="brand" type="button" class="w-full" @click="openCreateLogique">
          <template #default>
            <span class="flex items-center gap-2">
              <Icon name="lucide:plus" size="16" />
              Nouvelle logique
            </span>
          </template>
        </AppButtonValidated>
        <div class="relative">
          <Icon
            name="lucide:search"
            size="14"
            class="text-ink-soft pointer-events-none absolute top-1/2 left-3 -translate-y-1/2" />
          <input
            v-model="search"
            type="text"
            placeholder="Rechercher…"
            aria-label="Rechercher une logique"
            class="form-control h-9 pl-9" />
        </div>
      </div>

      <!-- Chargement -->
      <div v-if="loadingLogiques" class="flex items-center justify-center py-10">
        <Icon name="lucide:loader-circle" size="22" class="text-magenta-600 animate-spin" />
      </div>

      <!-- Aucune logique -->
      <div v-else-if="logiques.length === 0" class="flex flex-col items-center gap-3 px-4 py-12 text-center">
        <span class="flex size-12 items-center justify-center rounded-xl bg-slate-100 dark:bg-white/8">
          <Icon name="lucide:workflow" size="22" class="text-slate-400" />
        </span>
        <div class="space-y-1">
          <p class="text-ink text-sm font-medium">Aucune logique</p>
          <p class="text-ink-soft text-xs">Créez la première logique de ce métier.</p>
        </div>
      </div>

      <!-- Aucun résultat -->
      <div v-else-if="logiquesFiltrees.length === 0" class="text-ink-soft flex flex-col items-center gap-2 px-4 py-12">
        <Icon name="lucide:search-x" size="22" class="opacity-40" />
        <p class="text-sm">Aucun résultat</p>
      </div>

      <!-- Liste : même sélection que la barre latérale (fond gris, repère magenta) -->
      <ul v-else class="flex-1 space-y-0.5 overflow-y-auto p-2">
        <li
          v-for="logique in logiquesFiltrees"
          :key="logique.id"
          class="group relative flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2.5 transition-colors"
          :class="panneauItem(selectedLogique?.id === logique.id)"
          @click="selectLogique(logique)">
          <Icon
            :name="logique.icone || 'lucide:workflow'"
            size="18"
            class="flex-none"
            :class="panneauIcone(selectedLogique?.id === logique.id)" />
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm leading-snug font-medium">{{ logique.nom }}</p>
            <p
              class="text-ink-soft mt-0.5 truncate text-xs"
              :class="{ 'italic opacity-70': !logique.description }"
              :title="logique.description || ''">
              {{ logique.description || 'Sans description' }}
            </p>
          </div>
          <span
            v-if="logique.nb_questions !== undefined"
            class="inline-flex h-5.5 min-w-6.5 flex-none items-center justify-center rounded-full px-1.5 text-xs font-bold tabular-nums"
            :class="panneauBadge(selectedLogique?.id === logique.id)"
            :title="`${logique.nb_questions} question${logique.nb_questions > 1 ? 's' : ''}`">
            {{ logique.nb_questions }}
          </span>
          <div
            class="flex flex-none items-center transition-opacity group-focus-within:opacity-100"
            :class="selectedLogique?.id === logique.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'"
            @click.stop>
            <AppDropdownMenu
              :panel-class="MENU_PANNEAU"
              :open="openDropdownId === logique.id"
              @update:open="(v) => (openDropdownId = v ? logique.id : null)">
              <template #trigger>
                <span :class="BOUTON_ICONE" class="size-7!" title="Actions">
                  <Icon name="lucide:ellipsis-vertical" size="15" />
                </span>
              </template>
              <div class="flex w-40 flex-col">
                <button type="button" :class="MENU_ENTREE" @click="openEditLogique(logique)">
                  <Icon name="lucide:pencil" size="15" class="text-ink-soft" />
                  Modifier
                </button>
                <button type="button" :class="MENU_ENTREE_DANGER" @click="askDeleteLogique(logique)">
                  <Icon name="lucide:trash-2" size="15" />
                  Supprimer
                </button>
              </div>
            </AppDropdownMenu>
          </div>
        </li>
      </ul>
    </aside>

    <!-- ── Éditeur de la logique choisie ────────────────────────────────── -->
    <section
      class="surface-card flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl max-lg:min-h-[70vh]"
      aria-label="Éditeur de la logique">
      <div
        v-if="!selectedLogique && !loadingLogique"
        class="text-ink-soft flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
        <Icon name="lucide:workflow" size="44" class="opacity-30" />
        <p class="text-sm">Choisissez une logique dans la liste, ou créez-en une.</p>
        <AppButtonValidated theme="outline" type="button" @click="openCreateLogique">
          <template #default>
            <span class="flex items-center gap-2">
              <Icon name="lucide:plus" size="16" />
              Nouvelle logique
            </span>
          </template>
        </AppButtonValidated>
      </div>
      <div v-else-if="loadingLogique" class="flex h-full items-center justify-center py-16">
        <Icon name="lucide:loader-circle" size="26" class="text-magenta-600 animate-spin" />
      </div>
      <AssistantsLogiqueEditor v-else :logique="selectedLogique" @changed="handleLogiqueChange" />
    </section>

    <!-- ── Fiche : créer / modifier une logique ─────────────────────────── -->
    <AppSidePanelForm
      :open="showFormLogique"
      surtitre="Logique métier"
      :titre="formNom.trim() || (editingLogique ? '—' : 'Nouvelle logique')"
      :valid="!!formNom.trim()"
      :dirty="formDirty"
      :locked="savingLogique"
      :submit-label="editingLogique ? 'Enregistrer' : 'Créer la logique'"
      @close="showFormLogique = false"
      @submit="submitLogique">
      <template #visuel>
        <span class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/12 text-white">
          <Icon :name="formIcone || 'lucide:workflow'" size="22" />
        </span>
      </template>

      <section class="surface-card space-y-4 rounded-xl p-5" aria-labelledby="logique-fiche">
        <h3 id="logique-fiche" class="text-ink font-semibold">Logique</h3>
        <div>
          <label for="logique-nom" :class="CHAMP_LIBELLE">Nom</label>
          <input
            id="logique-nom"
            v-model="formNom"
            type="text"
            autocomplete="off"
            class="form-control h-10"
            placeholder="Ex. : Appareil de voie" />
        </div>
        <div>
          <label for="logique-description" :class="CHAMP_LIBELLE">Description</label>
          <textarea
            id="logique-description"
            v-model="formDescription"
            rows="3"
            class="form-control resize-y py-2.5"
            placeholder="Description facultative…" />
        </div>
      </section>

      <section class="surface-card space-y-3 rounded-xl p-5" aria-labelledby="logique-icone">
        <div>
          <h3 id="logique-icone" class="text-ink font-semibold">Icône</h3>
          <p class="text-ink-soft mt-0.5 text-xs">Une suggestion, ou le nom de n'importe quelle icône Lucide.</p>
        </div>
        <div class="grid grid-cols-6 gap-2">
          <button
            v-for="ic in ICONES_SUGGEREES"
            :key="ic"
            type="button"
            class="flex h-10 cursor-pointer items-center justify-center rounded-lg border transition-colors"
            :class="segmentOption(formIcone === ic)"
            :title="ic.replace('lucide:', '')"
            :aria-pressed="formIcone === ic"
            @click="formIcone = ic">
            <Icon :name="ic" size="18" />
          </button>
        </div>
        <div class="relative">
          <Icon
            :name="formIcone || 'lucide:workflow'"
            size="16"
            class="text-ink-soft pointer-events-none absolute top-1/2 left-3 -translate-y-1/2" />
          <input
            v-model="formIcone"
            type="text"
            autocomplete="off"
            aria-label="Nom de l'icône Lucide"
            placeholder="lucide:workflow"
            class="form-control h-10 pl-9 font-mono" />
        </div>
      </section>
    </AppSidePanelForm>

    <!-- Suppression -->
    <AppConfirmModal v-model="showDeleteLogique" title="Supprimer la logique" @confirm="confirmDeleteLogique">
      La logique <strong class="text-ink">« {{ logiqueToDelete?.nom }} »</strong> et toutes ses questions seront
      supprimées définitivement.
    </AppConfirmModal>
  </div>
</template>
