<script setup>
const props = defineProps({
  chantier: {
    type: Object,
    required: true
  }
})

const { getTournees } = useTournees()

const tournees = ref([])
const loading = ref(true)
const showActive = ref(false)
const activeTournee = ref(null)

const load = async () => {
  loading.value = true
  const { data } = await getTournees(props.chantier.id)
  tournees.value = data
  loading.value = false
}

onMounted(load)

const formatDate = (iso) => {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const openNouvelleTournee = () => {
  activeTournee.value = null
  showActive.value = true
}

const openTournee = (t) => {
  activeTournee.value = t
  showActive.value = true
}

// Rechargement dès que le modal se ferme
watch(showActive, (val) => { if (!val) load() })
</script>

<template>
  <div class="p-4 lg:p-6">
    <!-- Header -->
    <div class="mb-6 flex items-center gap-3">
      <div class="min-w-0 flex-1">
        <h2 class="text-xl font-semibold text-gray-800 dark:text-white">Tournées</h2>
        <p class="mt-0.5 hidden text-sm text-gray-500 sm:block dark:text-gray-400">Notes de terrain prises lors des visites chantier</p>
      </div>
      <button
        type="button"
        class="flex shrink-0 items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
        @click="openNouvelleTournee">
        <Icon name="lucide:plus" size="16" />
        <span class="hidden sm:inline">Nouvelle tournée</span>
      </button>
    </div>

    <!-- Skeleton -->
    <div v-if="loading" class="space-y-3">
      <div v-for="i in 3" :key="i" class="h-20 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-700" />
    </div>

    <!-- Vide -->
    <div v-else-if="tournees.length === 0"
      class="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
      <Icon name="lucide:map-pin" size="48" class="mb-3 opacity-40" />
      <p class="font-medium">Aucune tournée</p>
      <p class="mt-1 text-sm">Créez votre première tournée terrain</p>
    </div>

    <!-- Liste unifiée -->
    <div v-else class="space-y-3">
      <div
        v-for="t in tournees"
        :key="t.id"
        class="cursor-pointer rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-gray-300 hover:shadow dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600"
        @click="openTournee(t)">
        <div class="flex items-center gap-3">
          <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
            <Icon name="lucide:map-pin" size="15" class="text-gray-500 dark:text-gray-400" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate font-medium text-gray-800 dark:text-white">
              {{ t.titre || 'Tournée du ' + formatDate(t.created_at) }}
            </p>
            <p class="truncate text-xs text-gray-500 dark:text-gray-400">
              {{ formatDate(t.created_at) }} · {{ t.created_by }}
            </p>
          </div>
          <div class="flex shrink-0 items-center gap-3 text-gray-400 dark:text-gray-500">
            <span class="flex items-center gap-1 text-xs">
              <Icon name="lucide:mic" size="12" />
              {{ t.tournee_notes?.[0]?.count ?? 0 }}
            </span>
            <span class="flex items-center gap-1 text-xs">
              <Icon name="lucide:image" size="12" />
              {{ t.photos?.[0]?.count ?? 0 }}
            </span>
            <Icon name="lucide:chevron-right" size="15" />
          </div>
        </div>
      </div>
    </div>

    <!-- Interface tournée (création, reprise ou lecture seule) -->
    <ChantierTourneeActive
      v-if="showActive"
      v-model="showActive"
      :chantier="chantier"
      :tournee-initiale="activeTournee"
      />
  </div>
</template>
