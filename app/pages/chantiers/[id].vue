<script setup>
definePageMeta({
  requiresAuth: true,
  requiredRole: '',
});

const route = useRoute();
const { getChantierById } = useChantiers();
const { setLoader } = useLoader();

// Récupérer l'ID du chantier depuis l'URL
const chantierId = computed(() => route.params.id);

// État du chantier
const chantier = ref(null);

// Menu de navigation latérale
const selectedMenu = ref('generalites');
const menuItems = [
  { 
    value: 'generalites', 
    label: 'Généralités', 
    icon: 'lucide:info' 
  },
  { 
    value: 'contact', 
    label: 'Contact', 
    icon: 'lucide:contact' 
  },
  { 
    value: 'timeline', 
    label: 'Timeline', 
    icon: 'lucide:git-branch' 
  },
  { 
    value: 'etudes', 
    label: 'Études', 
    icon: 'lucide:folder-search',
    children: [
      { value: 'etudes-documents', label: "Documents d'exécution" },
      { value: 'etudes-plans', label: 'Plans techniques' }
    ]
  },
  { 
    value: 'commentaires', 
    label: 'Commentaires', 
    icon: 'lucide:message-square',
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
    icon: 'lucide:list-checks',
    badge: '0'
  },
];

// Titre dynamique de la page
useHead({
  title: computed(() => chantier.value ? `H00 - ${chantier.value.compte} - ${chantier.value.name}` : 'H00 - Chantier'),
});

// Labels d'état
const getEtatLabel = (etat) => {
  switch (etat) {
    case 2: return 'Pré-op';
    case 1: return 'Externe';
    case 0: return 'RLT';
    case -1: return 'Terminé';
    default: return 'Inconnu';
  }
};

// Couleurs d'état
const getEtatClasses = (etat) => {
  switch (etat) {
    case 2: return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    case 1: return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    case 0: return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
    case -1: return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
    default: return 'bg-gray-100 text-gray-500';
  }
};

// Charger le chantier au montage
onMounted(async () => {
  setLoader(true);
  try {
    chantier.value = await getChantierById(chantierId.value);
  } finally {
    setLoader(false);
  }
});

// Recharger si l'ID change
watch(chantierId, async (newId) => {
  if (newId) {
    setLoader(true);
    try {
      chantier.value = await getChantierById(newId);
    } finally {
      setLoader(false);
    }
  }
});
</script>

<template>
  <AppPageLayout>
    <!-- Header fixe de la sidebar -->
    <template #sidebar-header>
      <div class="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div v-if="chantier" class="space-y-2">
          <div class="relative flex justify-center items-center gap-2">
            <h2 class="text-base text-center font-semibold text-gray-700 dark:text-white leading-tight">
              {{ chantier.compte || 'Sans intitulé' }}
            </h2>
            <div 
              class="absolute top-0 right-0 text-xs px-2 py-0.5 rounded-full font-medium"
              :class="getEtatClasses(chantier.etat)"
            >
              {{ getEtatLabel(chantier.etat) }}
            </div>
          </div>
          <h2 class="text-base text-center font-semibold text-gray-700 dark:text-white leading-tight">
            {{ chantier.name || 'Sans intitulé' }}
          </h2>
        </div>
        <div v-else class="space-y-2">
          <div class="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div class="h-6 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div class="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
      </div>
    </template>

    <!-- Navigation scrollable -->
    <template #sidebar>
      <AppLeftNavBar 
        v-model="selectedMenu"
        :items="menuItems"
        title=""
      />
    </template>

    <!-- Contenu principal -->
    <div v-if="chantier">
      <!-- Généralités -->
      <ChantierGeneralites 
        v-if="selectedMenu === 'generalites'" 
        :chantier="chantier" 
      />

      <!-- Contact -->
      <ChantierContact 
        v-else-if="selectedMenu === 'contact'" 
        :chantier="chantier" 
      />

      <!-- Timeline -->
      <ChantierTimeline 
        v-else-if="selectedMenu === 'timeline'" 
        :chantier="chantier" 
      />

      <!-- Études - Documents d'exécution -->
      <ChantierEtudesDocumentsExecution 
        v-else-if="selectedMenu === 'etudes-documents'" 
        :chantier="chantier" 
      />

      <!-- Études - Plans techniques -->
      <ChantierEtudesPlansTechniques 
        v-else-if="selectedMenu === 'etudes-plans'" 
        :chantier="chantier" 
      />

      <!-- Commentaires - Généralités -->
      <ChantierCommentairesGeneralites 
        v-else-if="selectedMenu === 'commentaires-generalites'" 
        :chantier="chantier" 
      />

      <!-- Commentaires - SES -->
      <ChantierCommentairesSes 
        v-else-if="selectedMenu === 'commentaires-ses'" 
        :chantier="chantier" 
      />

      <!-- Commentaires - Voie -->
      <ChantierCommentairesVoie 
        v-else-if="selectedMenu === 'commentaires-voie'" 
        :chantier="chantier" 
      />

      <!-- Commentaires - Logistique -->
      <ChantierCommentairesLogistique 
        v-else-if="selectedMenu === 'commentaires-logistique'" 
        :chantier="chantier" 
      />

      <!-- Commentaires - Terrain -->
      <ChantierCommentairesTerrain 
        v-else-if="selectedMenu === 'commentaires-terrain'" 
        :chantier="chantier" 
      />

      <!-- Photos -->
      <ChantierPhotos 
        v-else-if="selectedMenu === 'photos'" 
        :chantier="chantier" 
      />

      <!-- Tâches -->
      <ChantierTaches 
        v-else-if="selectedMenu === 'taches'" 
        :chantier="chantier" 
      />
    </div>

    <!-- État de chargement / Erreur -->
    <div v-else class="flex flex-col items-center justify-center py-24 text-gray-400 dark:text-gray-500">
      <Icon name="lucide:hard-hat" size="64" class="mb-4 opacity-50" />
      <p class="text-lg font-medium">Chargement du chantier...</p>
    </div>
  </AppPageLayout>
</template>
