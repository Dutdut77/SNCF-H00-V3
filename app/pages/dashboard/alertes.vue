<script setup>
definePageMeta({
  requiresAuth: true,
  requiredRole: 'admin'
})

useHead({
  title: 'H00 - Alertes',
  description: 'Alertes Chantiers'
})

const { setLoader } = useLoader()
const { addToast } = useToast()
const { getChantiers, getChantiersNonTermines } = useChantiers()
const { getH00AlertesByChantierArray } = useH00()
// États pour les chantiers et tâches
const listChantiersAlertes = ref([])
const allTaches = ref([])
const selectedChantier = ref(null)
const globalFilterChantier = ref('')
const globalFilterTache = ref('')
const selectedTache = ref({})
const commentaire = ref('')
const important = ref(false)
const alerte = ref(false)
const dateCloture = ref(null)
const open = ref(false)

const regrouperTachesParChantier = (data) => {
  const map = {}

  data.forEach((item) => {
    const chantier = item.chantiers
    const chantierId = chantier.id

    if (!map[chantierId]) {
      map[chantierId] = {
        id: chantier.id,
        label: chantier.name,
        compte: chantier.compte,
        etat: chantier.etat,
        taches: []
      }
    }

    map[chantierId].taches.push({
      id: item.id,
      tache_id: item.tache_id,
      libelle: item.taches.tache,
      categorie: item.categories.name,
      prevision: item.prevision,
      realisation: item.realisation,
      status: item.status,
      important: item.important,
      alerte: item.alerte
    })
  })

  return Object.values(map)
}

const loadData = async () => {
  setLoader(true)
  try {
    await getChantiers()
    // Récupérer les IDs des chantiers non terminés
    let listChantiers = getChantiersNonTermines.value.map((chantier) => chantier.id)
    const { data, error } = await getH00AlertesByChantierArray(listChantiers)
    if (error) throw error
    console.log(data)
    listChantiersAlertes.value = regrouperTachesParChantier(data)
  } catch (error) {
    console.error('Erreur lors du chargement des données:', error)
  } finally {
    setLoader(false)
  }
}

const filteredItemsLeftNavBar = computed(() => {
  const search = globalFilterChantier.value?.toLowerCase() ?? ''

  let result = listChantiersAlertes.value

  // Filtre texte
  if (search) {
    result = result.filter((t) => t.compte?.toLowerCase().includes(search) || t.label?.toLowerCase().includes(search))
  }

  return result
})

onMounted(() => {
  setLoader(true)
  loadData()
  setLoader(false)
})
</script>

<template>
  <AppPageLayout>
    <!-- Slot sidebar - Partie gauche sticky -->
    <template #sidebar>
      <div class="space-y-4">
        <div class="flex flex-col">
          <div class="text-primary-700 trak text-center font-[Bangers] text-2xl font-bold tracking-wider">Alertes</div>
          <span class="text-primary-600 text-center text-sm">Liste des chantiers.</span>
        </div>

        <AppInputSearch
          v-model="globalFilterChantier"
          class="w-full max-w-md"
          placeholder="Rechercher un chantier ..." />

        <!-- Liste des chantiers en cartes compactes -->
        <div class="flex flex-col gap-1.5 overflow-y-auto pr-1 pb-8">
          <div
            v-for="(item, index) in filteredItemsLeftNavBar"
            :key="index"
            @click="selectedChantier = item"
            class="group relative cursor-pointer overflow-hidden rounded-lg border p-3 transition-all duration-200"
            :class="
              selectedChantier === item
                ? 'border-primary-700/30 bg-linear-to-br from-slate-700 to-slate-900 shadow-lg'
                : 'hover:border-primary-700/30 border-primary-200 bg-primary-50 hover:shadow-lg'
            ">
            <!-- Indicateur latéral animé -->
            <div
              class="from-secondary-400 to-secondary-500 absolute top-0 left-0 h-full w-1 bg-linear-to-t transition-all duration-200"
              :class="selectedChantier === item ? '' : 'scale-y-0 group-hover:scale-y-100'"></div>

            <div class="flex items-center gap-3">
              <!-- Icône avec fond -->
              <div
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors duration-200"
                :class="
                  selectedChantier === item
                    ? 'bg-primary-500/20 text-secondary-400'
                    : 'bg-primary-700/20 group-hover:bg-primary-700/30 text-white'
                ">
                <Icon :name="item.icon || 'lucide:folder'" size="18" />
              </div>

              <!-- Label -->
              <div class="min-w-0 flex-1">
                <div class="flex flex-col">
                  <div
                    class="text-sm font-medium transition-colors duration-200"
                    :class="selectedChantier === item ? 'text-white' : 'text-primary-600'">
                    {{ item.compte }}
                  </div>
                  <div
                    class="truncate text-sm font-medium transition-colors duration-200"
                    :class="selectedChantier === item ? 'text-white' : 'text-primary-600'">
                    {{ item.label }}
                  </div>
                </div>
              </div>

              <!-- Badge avec le nombre de tâches -->
              <div
                v-if="item.taches.length > 0"
                class="flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-xs font-bold transition-all duration-200"
                :class="
                  selectedChantier === item
                    ? 'from-secondary-400 to-secondary-500 text-secondary-50 bg-linear-to-t'
                    : 'bg-primary-700/20 text-primary-800 group-hover:bg-primary-700/30'
                ">
                {{ item.taches.length }}
              </div>
            </div>
          </div>

          <!-- Message si aucun résultat -->
          <div
            v-if="filteredItemsLeftNavBar.length === 0"
            class="text-primary-500 flex flex-col items-center justify-center py-8">
            <Icon name="lucide:search-x" size="32" class="mb-2" />
            <p class="text-sm">Aucun chantier trouvé</p>
          </div>
        </div>
      </div>
    </template>

    <!-- Contenu principal avec bouton de test -->
    <template #default>
      {{ selectedChantier }}
    </template>
  </AppPageLayout>
</template>
