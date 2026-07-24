<script setup>
// Modale de création d'une commande à partir d'une ou plusieurs listes de matières.
// Les listes sources sont aplaties + fusionnées par symbole (cf. createCommandeFromListes).
const props = defineProps({
  open:       { type: Boolean, required: true },
  chantierId: { type: [String, Number], required: true },
  listes:     { type: Array, default: () => [] }, // commandes_matieres du chantier
})

const emit = defineEmits(['close', 'created'])

const { createCommandeFromListes } = useCommandes()
const { metierLabel } = useMetier()

const selectedIds = ref(new Set())
const nom = ref('')
const creating = ref(false)

const toggleSelect = (id) => {
  const next = new Set(selectedIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  selectedIds.value = next
}

// Auto-nom suggéré à partir des listes sélectionnées
watch(selectedIds, () => {
  const sel = props.listes.filter((l) => selectedIds.value.has(l.id))
  if (sel.length === 0) nom.value = ''
  else if (sel.length === 1) nom.value = `Commande ${sel[0].nom}`
  else nom.value = sel.map((l) => l.nom).join(' + ')
}, { deep: true })

const reset = () => {
  selectedIds.value = new Set()
  nom.value = ''
  creating.value = false
}
watch(() => props.open, (v) => { if (!v) reset() })

const doCreate = async () => {
  if (!nom.value.trim() || selectedIds.value.size === 0) return
  creating.value = true
  const ids = [...selectedIds.value]
  // Métier hérité de la première liste sélectionnée
  const first = props.listes.find((l) => selectedIds.value.has(l.id))
  const commande = await createCommandeFromListes(props.chantierId, ids, {
    nom: nom.value.trim(),
    metier: first?.metier ?? null,
  })
  creating.value = false
  if (commande) emit('created', { commande })
}
</script>

<template>
  <AppModal :model-value="open" size="md" @update:model-value="emit('close')">
    <template #header>
      <h3 class="text-base font-semibold text-slate-800 dark:text-white">
        Nouvelle commande
      </h3>
    </template>

    <div class="space-y-4">
      <p class="text-sm text-slate-500 dark:text-slate-400">
        Sélectionne une ou plusieurs listes de matières. Leur contenu (articles + ensembles éclatés) sera regroupé et fusionné par numéro de symbole dans une commande « en cours ». Les listes d'origine ne sont pas modifiées.
      </p>

      <div>
        <p class="mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">Listes à reprendre</p>

        <div v-if="listes.length === 0" class="rounded-lg border border-slate-100 px-4 py-6 text-center text-sm text-slate-400 dark:border-slate-700">
          Aucune liste de matières disponible sur ce chantier
        </div>

        <div v-else class="max-h-64 space-y-0.5 overflow-y-auto rounded-lg border border-slate-200 p-1.5 dark:border-slate-700">
          <label
            v-for="l in listes"
            :key="l.id"
            class="flex cursor-pointer items-center gap-2.5 rounded px-2.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50">
            <input
              type="checkbox"
              class="h-3.5 w-3.5 rounded border-slate-300 accent-secondary-600"
              :checked="selectedIds.has(l.id)"
              @change="toggleSelect(l.id)" />
            <span class="flex-1 truncate text-sm text-slate-700 dark:text-slate-200">{{ l.nom }}</span>
            <span
              v-if="l.metier"
              class="shrink-0 rounded-full bg-secondary-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-400">
              {{ metierLabel(l.metier) }}
            </span>
          </label>
        </div>
      </div>

      <p v-if="selectedIds.size > 0" class="text-xs text-slate-400">
        Les symboles des {{ selectedIds.size }} liste{{ selectedIds.size > 1 ? 's' : '' }} seront fusionnés (quantités additionnées, ensembles éclatés).
      </p>

      <div>
        <label class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Nom de la commande</label>
        <input
          v-model="nom"
          type="text"
          placeholder="Ex : Commande phase 1"
          class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-secondary-400 focus:ring-2 focus:ring-secondary-100 dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <button
          type="button"
          class="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
          @click="emit('close')">
          Annuler
        </button>
        <button
          type="button"
          :disabled="selectedIds.size === 0 || !nom.trim() || creating"
          class="flex items-center gap-2 rounded-lg bg-secondary-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-secondary-700 disabled:opacity-50"
          @click="doCreate">
          <div v-if="creating" class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          <Icon v-else name="lucide:clipboard-list" size="15" />
          Créer la commande
        </button>
      </div>
    </template>
  </AppModal>
</template>
