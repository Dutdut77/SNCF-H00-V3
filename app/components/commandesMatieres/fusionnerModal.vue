<script setup>
const props = defineProps({
  open:            { type: Boolean, required: true },
  commandeSource:  { type: Object, default: null },
  commandes:       { type: Array, default: () => [] },
})

const emit = defineEmits(['close', 'merged'])

const { createCommande } = useCommandesMatieres()
const client = useSupabaseClient()
const { addToast } = useToast()

const selectedIds = ref(new Set())
const listNom     = ref('')
const merging     = ref(false)

// Commandes disponibles = toutes sauf la source
const autresCommandes = computed(() =>
  props.commandes.filter((c) => c.id !== props.commandeSource?.id)
)

const toggleSelect = (id) => {
  const next = new Set(selectedIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  selectedIds.value = next
}

// Mise à jour du nom suggéré
watch([selectedIds, () => props.commandeSource], () => {
  const selected = autresCommandes.value.filter((c) => selectedIds.value.has(c.id))
  listNom.value = selected.length === 0
    ? (props.commandeSource?.nom ? `${props.commandeSource.nom} (fusion)` : '')
    : [props.commandeSource?.nom, ...selected.map((c) => c.nom)].filter(Boolean).join(' + ')
}, { deep: true })

const reset = () => {
  selectedIds.value = new Set()
  listNom.value     = ''
  merging.value     = false
}

watch(() => props.open, (v) => {
  if (v) {
    listNom.value = props.commandeSource?.nom ? `${props.commandeSource.nom} (fusion)` : ''
  } else {
    reset()
  }
})

// ─── Fusion ───────────────────────────────────────────────────────────────────
const doMerge = async () => {
  if (!listNom.value.trim() || selectedIds.value.size === 0) return
  merging.value = true

  const allIds = [props.commandeSource.id, ...selectedIds.value]

  // Charger toutes les lignes en parallèle
  const allLignesResults = await Promise.all(
    allIds.map((id) =>
      client
        .from('commandes_matieres_lignes')
        .select('numero_symbole, quantite')
        .eq('commande_id', id)
    )
  )

  // Agréger par symbole (somme des quantités)
  const map = new Map()
  for (const { data } of allLignesResults) {
    for (const l of data || []) {
      map.set(l.numero_symbole, (map.get(l.numero_symbole) || 0) + (l.quantite || 0))
    }
  }

  // Charger les ensembles de toutes les listes et agréger les quantités
  const ensembleResults = await Promise.all(
    allIds.map((id) =>
      client
        .from('commandes_matieres_ensembles')
        .select('ensemble_id, quantite')
        .eq('commande_id', id)
    )
  )

  const ensembleMap = new Map()  // ensemble_id → quantite cumulée
  for (const { data } of ensembleResults) {
    for (const e of data || []) {
      ensembleMap.set(e.ensemble_id, (ensembleMap.get(e.ensemble_id) || 0) + (e.quantite || 1))
    }
  }

  // Créer la nouvelle commande
  const commande = await createCommande({
    nom: listNom.value.trim(),
    chantier_id: props.commandeSource.chantier_id,
  })
  if (!commande) { merging.value = false; return }

  // Bulk insert des lignes fusionnées
  const articles = [...map.entries()]
  if (articles.length > 0) {
    const { error: e1 } = await client
      .from('commandes_matieres_lignes')
      .insert(articles.map(([symbole, quantite], i) => ({
        commande_id: commande.id,
        numero_symbole: symbole,
        quantite,
        ordre: i,
      })))
    if (e1) {
      addToast({ title: 'Erreur', message: e1.message, type: 'Error' })
      merging.value = false
      return
    }
  }

  // Bulk insert des liens ensembles (quantités additionnées)
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
</script>

<template>
  <AppModal :model-value="open" size="md" @update:model-value="emit('close')">

    <template #header>
      <h3 class="text-base font-semibold text-gray-800 dark:text-white">
        Fusionner des listes
      </h3>
    </template>

    <div class="space-y-4">
      <!-- Liste source -->
      <div class="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 dark:border-blue-700/50 dark:bg-blue-900/20">
        <Icon name="lucide:layers" size="15" class="flex-none text-blue-500" />
        <span class="text-sm font-medium text-blue-700 dark:text-blue-300">{{ commandeSource?.nom }}</span>
        <span class="ml-auto text-xs text-blue-400">liste de base</span>
      </div>

      <!-- Sélection des autres listes -->
      <div>
        <p class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-200">
          Fusionner avec :
        </p>

        <div v-if="autresCommandes.length === 0" class="rounded-lg border border-gray-100 px-4 py-6 text-center text-sm text-gray-400 dark:border-gray-700">
          Aucune autre liste disponible
        </div>

        <div v-else class="max-h-48 space-y-0.5 overflow-y-auto rounded-lg border border-gray-200 p-1.5 dark:border-gray-700">
          <label
            v-for="cmd in autresCommandes"
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
            <span class="shrink-0 text-xs text-gray-400">{{ fmtDate(cmd.created_at) }}</span>
          </label>
        </div>
      </div>

      <!-- Info -->
      <p v-if="selectedIds.size > 0" class="text-xs text-gray-400">
        Les articles des {{ selectedIds.size + 1 }} listes seront regroupés par numéro de symbole (quantités additionnées). Les listes d'origine ne seront pas modifiées.
      </p>

      <!-- Nom de la nouvelle liste -->
      <div>
        <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Nom de la nouvelle liste</label>
        <input
          v-model="listNom"
          type="text"
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
          Créer la liste fusionnée
        </button>
      </div>
    </template>

  </AppModal>
</template>
