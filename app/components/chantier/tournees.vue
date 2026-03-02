<script setup>
const props = defineProps({
  chantier: {
    type: Object,
    required: true
  }
})

const { getTournees, deleteTournee } = useTournees()
const user = useAuthUser()

const tournees = ref([])
const loading = ref(true)
const showActive = ref(false)
const showDetail = ref(false)
const activeTournee = ref(null)
const detailTournee = ref(null)
const showDeleteConfirm = ref(false)
const tourneeToDelete = ref(null)

const load = async () => {
  loading.value = true
  const { data } = await getTournees(props.chantier.id)
  tournees.value = data
  loading.value = false
}

onMounted(load)

// Tournée en cours (non terminée)
const tourneEnCours = computed(() => tournees.value.find((t) => !t.terminee))

const formatDate = (iso) => {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const openNouvelleTournee = async () => {
  activeTournee.value = null
  showActive.value = true
}

const reprendreTournee = (t) => {
  activeTournee.value = t
  showActive.value = true
}

const openDetail = (t) => {
  detailTournee.value = t
  showDetail.value = true
}

const onTourneeTerminee = () => {
  showActive.value = false
  load()
}

const onDetailClose = () => {
  showDetail.value = false
  load()
}

const confirmDelete = (t) => {
  tourneeToDelete.value = t
  showDeleteConfirm.value = true
}

const doDelete = async () => {
  if (!tourneeToDelete.value) return
  await deleteTournee(tourneeToDelete.value.id)
  showDeleteConfirm.value = false
  tourneeToDelete.value = null
  load()
}
</script>

<template>
  <div class="p-4 lg:p-6">
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h2 class="text-xl font-semibold text-gray-800 dark:text-white">Tournées</h2>
        <p class="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Notes de terrain prises lors des visites chantier</p>
      </div>
      <button
        type="button"
        class="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
        @click="openNouvelleTournee">
        <Icon name="lucide:plus" size="16" />
        Nouvelle tournée
      </button>
    </div>

    <!-- Tournée en cours -->
    <div v-if="tourneEnCours" class="mb-4 rounded-xl border-2 border-blue-400 bg-blue-50 p-4 dark:border-blue-600 dark:bg-blue-900/20">
      <div class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-800">
            <Icon name="lucide:map-pin" size="20" class="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <p class="font-semibold text-gray-800 dark:text-white">
                {{ tourneEnCours.titre || 'Tournée en cours' }}
              </p>
              <span class="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-medium text-white">En cours</span>
            </div>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ formatDate(tourneEnCours.created_at) }} · {{ tourneEnCours.created_by }}
            </p>
          </div>
        </div>
        <button
          type="button"
          class="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          @click="reprendreTournee(tourneEnCours)">
          <Icon name="lucide:play" size="14" />
          Reprendre
        </button>
      </div>
    </div>

    <!-- Liste des tournées terminées -->
    <div v-if="loading" class="space-y-3">
      <div v-for="i in 3" :key="i" class="h-20 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-700" />
    </div>

    <div v-else-if="tournees.filter(t => t.terminee).length === 0 && !tourneEnCours" class="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
      <Icon name="lucide:map-pin" size="48" class="mb-3 opacity-40" />
      <p class="font-medium">Aucune tournée</p>
      <p class="mt-1 text-sm">Créez votre première tournée terrain</p>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="t in tournees.filter(t => t.terminee)"
        :key="t.id"
        class="cursor-pointer rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-gray-300 hover:shadow dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600"
        @click="openDetail(t)">
        <div class="flex items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
              <Icon name="lucide:map-pin" size="16" class="text-gray-500 dark:text-gray-400" />
            </div>
            <div>
              <p class="font-medium text-gray-800 dark:text-white">
                {{ t.titre || 'Tournée du ' + formatDate(t.created_at) }}
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ formatDate(t.created_at) }} · {{ t.created_by }}
              </p>
            </div>
          </div>
          <div class="flex shrink-0 items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
            <span class="flex items-center gap-1">
              <Icon name="lucide:mic" size="13" />
              {{ t.tournee_notes?.[0]?.count ?? 0 }}
            </span>
            <span class="flex items-center gap-1">
              <Icon name="lucide:image" size="13" />
              {{ t.photos?.[0]?.count ?? 0 }}
            </span>
            <Icon name="lucide:chevron-right" size="16" />
          </div>
        </div>
      </div>
    </div>

    <!-- Interface terrain -->
    <ChantierTourneeActive
      v-if="showActive"
      v-model="showActive"
      :chantier="chantier"
      :tournee-initiale="activeTournee"
      @terminee="onTourneeTerminee" />

    <!-- Vue détail -->
    <ChantierTourneeDetail
      v-if="showDetail && detailTournee"
      v-model="showDetail"
      :tournee="detailTournee"
      @close="onDetailClose"
      @deleted="onDetailClose" />
  </div>
</template>
