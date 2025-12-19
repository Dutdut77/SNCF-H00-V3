<script setup>
definePageMeta({
  requiresAuth: true,
  requiredRole: ''
})

const route = useRoute()
const { getChantierById } = useChantiers()
const { allH00Taches, getH00ByChantier } = useH00()
const { setLoader } = useLoader()

// Récupérer l'ID du chantier depuis l'URL
const chantierId = computed(() => route.params.id)

// État du chantier
const chantier = ref(null)
const h00 = ref(null)
// Menu de navigation latérale
const selectedMenu = ref('generalites')
const menuItems = [
  {
    value: 'generalites',
    label: 'Généralités',
    icon: 'lucide:info'
  },
  {
    value: 'contact',
    label: 'Contact',
    icon: 'lucide:contact',
    children: [
      { value: 'contacts-generalites', label: 'Généralités' },
      { value: 'contacts-travaux', label: 'Travaux' },
      { value: 'contacts-entreprises', label: 'Entreprises' },
      { value: 'contacts-etudes', label: 'Etudes' },
      { value: 'contacts-autres', label: 'Autres' }
    ]
  },
  {
    value: 'timeline',
    label: 'Timeline',
    icon: 'lucide:git-branch'
  },
  {
    value: 'etudes',
    label: 'Études',
    icon: 'lucide:graduation-cap',
    children: [
      { value: 'etudes-documents', label: "Documents d'exécution" },
      { value: 'etudes-plans', label: 'Plans techniques' }
    ]
  },
  {
    value: 'commentaires',
    label: 'Commentaires',
    icon: 'lucide:message-square-more',
    children: [
      { value: 'commentaires-generalites', label: 'Généralités' },
      { value: 'commentaires-ses', label: 'SES' },
      { value: 'commentaires-voie', label: 'Voie' },
      { value: 'commentaires-logistique', label: 'Logistique' },
      { value: 'commentaires-terrain', label: 'Terrain' }
    ]
  },
  {
    value: 'photos',
    label: 'Photos',
    icon: 'lucide:image'
  },
  {
    value: 'taches',
    label: 'Tâches',
    icon: 'lucide:clipboard-check',
    badge: computed(() => allH00Taches.value?.length || 0)
  }
]

// Titre dynamique de la page
useHead({
  title: computed(() => (chantier.value ? `H00 - ${chantier.value.compte} - ${chantier.value.name}` : 'H00 - Chantier'))
})

// Labels d'état
const getEtatLabel = (etat) => {
  switch (etat) {
    case 2:
      return 'Pré-op'
    case 1:
      return 'Externe'
    case 0:
      return 'RLT'
    case -1:
      return 'Terminé'
    default:
      return 'Inconnu'
  }
}

// Couleurs d'état
const getEtatClasses = (etat) => {
  switch (etat) {
    case 2:
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
    case 1:
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    case 0:
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
    case -1:
      return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
    default:
      return 'bg-gray-100 text-gray-500'
  }
}

// Charger le chantier au montage
onMounted(async () => {
  setLoader(true)
  try {
    chantier.value = await getChantierById(chantierId.value)
    h00.value = await getH00ByChantier(chantierId.value)
  } finally {
    setLoader(false)
  }
})

// Recharger si l'ID change
watch(chantierId, async (newId) => {
  if (newId) {
    setLoader(true)
    try {
      chantier.value = await getChantierById(newId)
      h00.value = await getH00ByChantier(newId)
    } finally {
      setLoader(false)
    }
  }
})

// Ouvrir la page d'impression dans un nouvel onglet
const openPrintPage = () => {
  const printUrl = `/chantiers/print/${chantierId.value}`
  window.open(printUrl, '_blank')
}
</script>

<template>
  <AppPageLayout>
    <!-- Header fixe de la sidebar -->
    <template #sidebar-header>
      <div class="p-4 lg:mb-4 dark:border-gray-700">
        <div v-if="chantier" class="flex flex-col items-center gap-2 lg:items-start">
          <div class="relative flex w-full items-center justify-center gap-2 lg:justify-start">
            <h2 class="text-xl leading-tight font-semibold text-gray-700 dark:text-white">
              {{ chantier.compte || 'Sans intitulé' }}
            </h2>
            <div
              class="absolute top-0 right-0 rounded-full px-2 py-0.5 text-xs font-medium"
              :class="getEtatClasses(chantier.etat)">
              {{ getEtatLabel(chantier.etat) }}
            </div>
          </div>

          <h2 class="-mt-2 text-base leading-tight font-semibold text-gray-700 dark:text-gray-100">
            {{ chantier.name || 'Sans intitulé' }}
          </h2>
        </div>
        <div v-else class="space-y-2">
          <div class="h-5 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
          <div class="h-6 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
          <div class="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
        </div>
      </div>
    </template>

    <!-- Navigation scrollable -->
    <template #sidebar>
      <AppLeftNavBar v-model="selectedMenu" :items="menuItems" title="" />
    </template>

    <!-- Footer de la sidebar avec bouton Imprimer -->
    <template #sidebar-footer>
      <div
        v-if="chantier"
        class="hidden border-gray-200 pt-4 lg:flex lg:items-center lg:justify-center lg:border-t dark:border-gray-700">
        <button
          @click="openPrintPage"
          class="group flex w-fit items-center justify-center gap-3 rounded-lg bg-linear-to-r from-slate-700 to-gray-800 px-4 py-2 text-sm font-medium text-white shadow-lg transition-all duration-300 hover:from-slate-600 hover:to-gray-700 hover:shadow-xl dark:from-slate-600 dark:to-gray-700 dark:hover:from-slate-500 dark:hover:to-gray-600">
          <Icon name="lucide:printer" size="18" class="transition-transform duration-300 group-hover:scale-110" />
          <span>Imprimer le chantier</span>
        </button>
      </div>
    </template>

    <!-- Contenu principal -->
    <div v-if="chantier">
      <!-- Généralités -->
      <ChantierGeneralites v-if="selectedMenu === 'generalites'" :chantier="chantier" />

      <!-- Contact -->
      <ChantierContactsGeneralites v-else-if="selectedMenu === 'contacts-generalites'" :chantier="chantier" />
      <ChantierContactsTravaux v-else-if="selectedMenu === 'contacts-travaux'" :chantier="chantier" />
      <ChantierContactsEntreprises v-else-if="selectedMenu === 'contacts-entreprises'" :chantier="chantier" />
      <ChantierContactsEtudes v-else-if="selectedMenu === 'contacts-etudes'" :chantier="chantier" />
      <ChantierContactsAutres v-else-if="selectedMenu === 'contacts-autres'" :chantier="chantier" />

      <!-- Timeline -->
      <ChantierTimeline v-else-if="selectedMenu === 'timeline'" :chantier="chantier" />

      <!-- Études - Documents d'exécution -->
      <ChantierEtudesDocumentsExecution v-else-if="selectedMenu === 'etudes-documents'" :chantier="chantier" />
      <ChantierEtudesPlansTechniques v-else-if="selectedMenu === 'etudes-plans'" :chantier="chantier" />

      <!-- Commentaires -->
      <ChantierCommentairesGeneralites v-else-if="selectedMenu === 'commentaires-generalites'" :chantier="chantier" />
      <ChantierCommentairesSes v-else-if="selectedMenu === 'commentaires-ses'" :chantier="chantier" />
      <ChantierCommentairesVoie v-else-if="selectedMenu === 'commentaires-voie'" :chantier="chantier" />
      <ChantierCommentairesLogistique v-else-if="selectedMenu === 'commentaires-logistique'" :chantier="chantier" />
      <ChantierCommentairesTerrain v-else-if="selectedMenu === 'commentaires-terrain'" :chantier="chantier" />

      <!-- Photos -->
      <ChantierPhotos v-else-if="selectedMenu === 'photos'" :chantier="chantier" />

      <!-- Tâches -->
      <ChantierTaches v-else-if="selectedMenu === 'taches'" :chantier="chantier" />
    </div>

    <!-- État de chargement / Erreur -->
    <div v-else class="flex flex-col items-center justify-center py-24 text-gray-400 dark:text-gray-500">
      <Icon name="lucide:hard-hat" size="64" class="mb-4 opacity-50" />
      <p class="text-lg font-medium">Chargement du chantier...</p>
    </div>
  </AppPageLayout>
</template>
