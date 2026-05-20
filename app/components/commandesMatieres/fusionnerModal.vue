<script setup>
const props = defineProps({
  open:       { type: Boolean, required: true },
  chantierId: { type: [String, Number], required: true },
  commandes:  { type: Array, default: () => [] },
})

const emit = defineEmits(['close', 'merged'])

const { createCommande } = useCommandesMatieres()
const client = useSupabaseClient()
const { addToast } = useToast()

const selectedIds = ref(new Set())
const listNom     = ref('')
const merging     = ref(false)

const toggleSelect = (id) => {
  const next = new Set(selectedIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  selectedIds.value = next
}

// Auto-nom suggéré
watch(selectedIds, () => {
  const selected = props.commandes.filter((c) => selectedIds.value.has(c.id))
  if (selected.length === 0) listNom.value = ''
  else if (selected.length === 1) listNom.value = `${selected[0].nom} (copie)`
  else listNom.value = selected.map((c) => c.nom).join(' + ')
}, { deep: true })

const reset = () => {
  selectedIds.value = new Set()
  listNom.value     = ''
  merging.value     = false
}

watch(() => props.open, (v) => { if (!v) reset() })

// ─── Création / fusion ──────────────────────────────────────────────────────
const doMerge = async () => {
  if (!listNom.value.trim() || selectedIds.value.size === 0) return
  merging.value = true

  const allIds = [...selectedIds.value]

  // Lignes directes de toutes les sources
  const allLignes = await Promise.all(allIds.map((id) =>
    client.from('commandes_matieres_lignes')
      .select('numero_symbole, quantite')
      .eq('commande_id', id)
  ))
  const lignesMap = new Map()
  for (const { data } of allLignes) {
    for (const l of data || []) {
      lignesMap.set(l.numero_symbole, (lignesMap.get(l.numero_symbole) || 0) + (l.quantite || 0))
    }
  }

  // Ensembles de toutes les sources
  const allEnsembles = await Promise.all(allIds.map((id) =>
    client.from('commandes_matieres_ensembles')
      .select('ensemble_id, quantite')
      .eq('commande_id', id)
  ))
  const ensembleMap = new Map()
  for (const { data } of allEnsembles) {
    for (const e of data || []) {
      ensembleMap.set(e.ensemble_id, (ensembleMap.get(e.ensemble_id) || 0) + (e.quantite || 1))
    }
  }

  // Crée la nouvelle liste (en brouillon par défaut)
  const commande = await createCommande({
    nom: listNom.value.trim(),
    chantier_id: props.chantierId,
  })
  if (!commande) { merging.value = false; return }

  const articles = [...lignesMap.entries()]
  if (articles.length > 0) {
    const { error } = await client
      .from('commandes_matieres_lignes')
      .insert(articles.map(([symbole, quantite], i) => ({
        commande_id: commande.id,
        numero_symbole: symbole,
        quantite,
        ordre: i,
      })))
    if (error) {
      addToast({ title: 'Erreur', message: error.message, type: 'Error' })
      merging.value = false
      return
    }
  }

  if (ensembleMap.size > 0) {
    await client
      .from('commandes_matieres_ensembles')
      .insert([...ensembleMap.entries()].map(([eid, qty]) => ({
        commande_id: commande.id,
        ensemble_id: eid,
        quantite: qty,
      })))
  }

  merging.value = false
  emit('merged', { commande })
}

const fmtDate = (iso) => {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

const statutLabel = (c) => c.statut === 'commandee' ? 'Commandée' : 'Brouillon'
</script>

<template>
  <AppModal :model-value="open" size="md" @update:model-value="emit('close')">

    <template #header>
      <h3 class="text-base font-semibold text-gray-800 dark:text-white">
        Nouvelle liste depuis…
      </h3>
    </template>

    <div class="space-y-4">
      <p class="text-sm text-gray-500 dark:text-gray-400">
        Sélectionne une ou plusieurs listes existantes. Leurs articles et ensembles seront regroupés (quantités additionnées) dans une nouvelle liste brouillon. Les listes d'origine ne seront pas modifiées.
      </p>

      <!-- Sélection des listes -->
      <div>
        <p class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-200">
          Listes à regrouper
        </p>

        <div v-if="commandes.length === 0" class="rounded-lg border border-gray-100 px-4 py-6 text-center text-sm text-gray-400 dark:border-gray-700">
          Aucune liste disponible
        </div>

        <div v-else class="max-h-64 space-y-0.5 overflow-y-auto rounded-lg border border-gray-200 p-1.5 dark:border-gray-700">
          <label
            v-for="cmd in commandes"
            :key="cmd.id"
            class="flex cursor-pointer items-center gap-2.5 rounded px-2.5 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50"
          >
            <input
              type="checkbox"
              class="h-3.5 w-3.5 rounded border-gray-300 accent-blue-600"
              :checked="selectedIds.has(cmd.id)"
              @change="toggleSelect(cmd.id)"
            />
            <span class="flex-1 truncate text-sm text-gray-700 dark:text-gray-200">{{ cmd.nom }}</span>
            <span
              class="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
              :class="cmd.statut === 'commandee'
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'">
              {{ statutLabel(cmd) }}
            </span>
            <span class="shrink-0 text-xs text-gray-400">{{ fmtDate(cmd.created_at) }}</span>
          </label>
        </div>
      </div>

      <p v-if="selectedIds.size > 0" class="text-xs text-gray-400">
        Les articles des {{ selectedIds.size }} liste{{ selectedIds.size > 1 ? 's' : '' }} seront regroupés par numéro de symbole (quantités additionnées).
      </p>

      <!-- Nom de la nouvelle liste -->
      <div>
        <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Nom de la nouvelle liste</label>
        <input
          v-model="listNom"
          type="text"
          placeholder="Ex : Commande consolidée"
          class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <button
          type="button"
          class="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          @click="emit('close')"
        >
          Annuler
        </button>
        <button
          type="button"
          :disabled="selectedIds.size === 0 || !listNom.trim() || merging"
          class="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
          @click="doMerge"
        >
          <div v-if="merging" class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          <Icon v-else name="lucide:git-merge" size="15" />
          Créer la liste
        </button>
      </div>
    </template>

  </AppModal>
</template>
