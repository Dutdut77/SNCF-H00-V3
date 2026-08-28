<script setup>
const props = defineProps({
  chantier: {
    type: Object,
    required: true
  }
})

const { getTournees } = useTournees()
const user = useAuthUser()

const tournees = ref([])
const loading = ref(true)
const showActive = ref(false)
const activeTournee = ref(null)
const search = ref('')

const load = async () => {
  loading.value = true
  const { data } = await getTournees(props.chantier.id)
  tournees.value = data
  loading.value = false
}

onMounted(load)

const noteCount = (t) => t.tournee_notes?.[0]?.count ?? 0
const photoCount = (t) => t.photos?.[0]?.count ?? 0

const formatDate = (iso) => {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

const formatTime = (iso) => {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

// « prenom.nom@sncf.fr » → « Prénom Nom ». Sur mobile l'adresse complète
// débordait de la carte ; le nom tient sur une ligne.
const auteurOf = (t) => {
  const email = t.created_by || ''
  const local = email.split('@')[0]
  if (!local) return email
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

const titreOf = (t) => t.titre || 'Tournée du ' + formatDate(t.created_at)

const tourneesFiltrees = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return tournees.value
  return tournees.value.filter(
    (t) =>
      titreOf(t).toLowerCase().includes(q) ||
      (t.created_by || '').toLowerCase().includes(q) ||
      auteurOf(t).toLowerCase().includes(q)
  )
})

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

      <!-- Recherche (desktop) -->
      <div v-if="tournees.length > 3" class="relative hidden lg:block">
        <Icon name="lucide:search" size="15" class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
        <input
          v-model="search"
          type="search"
          placeholder="Rechercher…"
          class="w-56 rounded-lg border border-gray-300 bg-white py-2 pr-3 pl-9 text-sm text-gray-800 outline-none transition focus:border-secondary-400 focus:ring-1 focus:ring-secondary-400 dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
      </div>

      <button
        type="button"
        class="flex shrink-0 items-center gap-1.5 rounded-lg bg-secondary-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-secondary-700"
        @click="openNouvelleTournee">
        <Icon name="lucide:plus" size="16" />
        <span class="hidden sm:inline">Nouvelle tournée</span>
      </button>
    </div>

    <!-- Skeleton -->
    <div v-if="loading" class="grid gap-3 xl:grid-cols-2">
      <div v-for="i in 4" :key="i" class="h-[86px] animate-pulse rounded-xl bg-gray-100 dark:bg-gray-700" />
    </div>

    <!-- Vide -->
    <div v-else-if="tournees.length === 0"
      class="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-16 text-gray-400 dark:border-gray-700 dark:text-gray-500">
      <Icon name="lucide:map-pin" size="48" class="mb-3 opacity-40" />
      <p class="font-medium">Aucune tournée</p>
      <p class="mt-1 text-sm">Créez votre première tournée terrain</p>
      <button
        type="button"
        class="mt-5 flex items-center gap-1.5 rounded-lg bg-secondary-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-secondary-700"
        @click="openNouvelleTournee">
        <Icon name="lucide:plus" size="16" />
        Nouvelle tournée
      </button>
    </div>

    <!-- Aucun résultat de recherche -->
    <div v-else-if="tourneesFiltrees.length === 0" class="py-12 text-center text-sm text-gray-400 dark:text-gray-500">
      Aucune tournée ne correspond à « {{ search }} ».
    </div>

    <!-- Liste : une colonne sur mobile, deux sur grand écran -->
    <div v-else class="grid gap-3 xl:grid-cols-2">
      <button
        v-for="t in tourneesFiltrees"
        :key="t.id"
        type="button"
        class="group flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:border-secondary-300 hover:shadow dark:border-gray-700 dark:bg-gray-800 dark:hover:border-secondary-700"
        @click="openTournee(t)">
        <!-- Empilé sur mobile pour que rien ne soit tronqué, en ligne dès sm -->
        <div class="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div class="flex min-w-0 flex-1 items-start gap-3">
            <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 transition group-hover:bg-secondary-50 dark:bg-gray-700 dark:group-hover:bg-secondary-900/30">
              <Icon name="lucide:map-pin" size="15" class="text-gray-500 transition group-hover:text-secondary-600 dark:text-gray-400 dark:group-hover:text-secondary-300" />
            </span>
            <div class="min-w-0 flex-1">
              <p class="line-clamp-2 leading-snug font-medium text-gray-800 sm:truncate dark:text-white">
                {{ titreOf(t) }}
              </p>
              <!-- flex-wrap plutôt que truncate : la méta passe à la ligne au lieu d'être coupée -->
              <p class="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-gray-500 dark:text-gray-400">
                <span>{{ formatDate(t.created_at) }}</span>
                <span class="text-gray-300 dark:text-gray-600">·</span>
                <span>{{ formatTime(t.created_at) }}</span>
                <span class="text-gray-300 dark:text-gray-600">·</span>
                <span class="min-w-0 break-words">{{ auteurOf(t) }}</span>
                <span v-if="user && t.created_by === user.email" class="font-medium text-secondary-600 dark:text-secondary-400">(vous)</span>
              </p>
            </div>
          </div>

          <!-- Compteurs : sous le texte sur mobile, alignés avec lui -->
          <div class="flex shrink-0 items-center gap-2 pl-12 sm:pl-0">
            <span class="inline-flex items-center gap-1.5 rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
              <Icon name="lucide:pen-line" size="12" />
              {{ noteCount(t) }} note{{ noteCount(t) > 1 ? 's' : '' }}
            </span>
            <span class="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              <Icon name="lucide:camera" size="12" />
              {{ photoCount(t) }} photo{{ photoCount(t) > 1 ? 's' : '' }}
            </span>
          </div>
        </div>

        <Icon
          name="lucide:chevron-right"
          size="16"
          class="shrink-0 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-secondary-600 dark:text-gray-600" />
      </button>
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
