<script setup>
definePageMeta({
  requiresAuth: true,
  requiredRole: '',
});

useHead({
  title: "H00 - Plan de Charge Général",
  description: "Calendrier annuel des chantiers",
});

const { getChantiers } = useChantiers();
const { setLoader } = useLoader();

// État réactif pour l'année sélectionnée
const selectedYear = ref(new Date().getFullYear());

// Barre de recherche
const searchQuery = ref('');

// Accès direct au state partagé des chantiers
const allChantiers = useState('chantiers_list', () => []);

// Générer les semaines S1 à S53
const weeks = computed(() => {
  return Array.from({ length: 53 }, (_, i) => ({
    number: i + 1,
    label: `${i + 1}`
  }));
});

// Fonction pour obtenir le numéro de semaine ISO d'une date
const getWeekNumber = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};

// Filtrer les chantiers pour l'année sélectionnée et la recherche
const filteredChantiers = computed(() => {
  if (!allChantiers.value || !Array.isArray(allChantiers.value)) return [];
  
  const search = searchQuery.value.toLowerCase().trim();
  
  return allChantiers.value.filter(chantier => {
    // Filtre par recherche
    if (search) {
      const matchCompte = chantier.compte?.toLowerCase().includes(search);
      const matchName = chantier.name?.toLowerCase().includes(search);
      const matchLigne = chantier.ligne?.toLowerCase().includes(search);
      if (!matchCompte && !matchName && !matchLigne) return false;
    }
    
    if (!chantier.date_start_travaux && !chantier.date_end_travaux) return false;
    
    const startDate = chantier.date_start_travaux ? new Date(chantier.date_start_travaux) : null;
    const endDate = chantier.date_end_travaux ? new Date(chantier.date_end_travaux) : null;
    
    const startYear = startDate ? startDate.getFullYear() : null;
    const endYear = endDate ? endDate.getFullYear() : null;
    
    // Le chantier est visible si son année de début OU de fin correspond à l'année sélectionnée
    // OU si l'année sélectionnée est entre les deux
    if (startYear && endYear) {
      return startYear <= selectedYear.value && endYear >= selectedYear.value;
    }
    if (startYear) return startYear === selectedYear.value;
    if (endYear) return endYear === selectedYear.value;
    
    return false;
  }).sort((a, b) => {
    // Trier par date de début
    const dateA = a.date_start_travaux ? new Date(a.date_start_travaux) : new Date();
    const dateB = b.date_start_travaux ? new Date(b.date_start_travaux) : new Date();
    return dateA - dateB;
  });
});

// Calculer la position et la largeur de la barre pour un chantier
const getChantierBarStyle = (chantier) => {
  const startDate = chantier.date_start_travaux ? new Date(chantier.date_start_travaux) : null;
  const endDate = chantier.date_end_travaux ? new Date(chantier.date_end_travaux) : null;
  
  if (!startDate && !endDate) return { display: 'none' };
  
  let startWeek, endWeek;
  
  // Calcul de la semaine de début
  if (startDate) {
    const startYear = startDate.getFullYear();
    if (startYear < selectedYear.value) {
      startWeek = 1;
    } else if (startYear > selectedYear.value) {
      startWeek = 53;
    } else {
      startWeek = getWeekNumber(startDate);
    }
  } else {
    startWeek = 1;
  }
  
  // Calcul de la semaine de fin
  if (endDate) {
    const endYear = endDate.getFullYear();
    if (endYear > selectedYear.value) {
      endWeek = 53;
    } else if (endYear < selectedYear.value) {
      endWeek = 1;
    } else {
      endWeek = getWeekNumber(endDate);
    }
  } else {
    endWeek = startWeek;
  }
  
  // S'assurer que startWeek <= endWeek
  if (startWeek > endWeek) {
    [startWeek, endWeek] = [endWeek, startWeek];
  }
  
  // Calculer la position en pourcentage
  const left = ((startWeek - 1) / 53) * 100;
  const width = ((endWeek - startWeek + 1) / 53) * 100;
  
  return {
    left: `${left}%`,
    width: `${Math.max(width, 1.5)}%`
  };
};

// Couleurs selon l'état du chantier
const getEtatColor = (etat) => {
  switch (etat) {
    case 2: return 'bg-amber-500';
    case 1: return 'bg-blue-500';
    case 0: return 'bg-emerald-500';
    case -1: return 'bg-gray-400';
    default: return 'bg-gray-300';
  }
};

const getEtatBorderColor = (etat) => {
  switch (etat) {
    case 2: return 'border-amber-600';
    case 1: return 'border-blue-600';
    case 0: return 'border-emerald-600';
    case -1: return 'border-gray-500';
    default: return 'border-gray-400';
  }
};

// Label pour l'état
const getEtatLabel = (etat) => {
  switch (etat) {
    case 2: return 'Pré-op';
    case 1: return 'Externe';
    case 0: return 'RLT';
    case -1: return 'Terminé';
    default: return 'Inconnu';
  }
};

// Formater une date
const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// Navigation par année
const previousYear = () => {
  selectedYear.value--;
};

const nextYear = () => {
  selectedYear.value++;
};

// Hover vertical sur les colonnes
const hoveredWeek = ref(null);

// Charger les chantiers au montage
onMounted(async () => {
  setLoader(true);
  try {
    await getChantiers();
  } finally {
    setLoader(false);
  }
});
</script>

<template>
  <div class="flex flex-col w-full h-full overflow-hidden gap-4 p-4 lg:p-6">
    <!-- Header avec titre et navigation -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div class="flex items-center gap-4">
        <h1 class="text-3xl font-[Pacifico] text-gray-700 dark:text-white">Plan de Charge Général</h1>

      </div>
      
      <div class="flex items-center gap-3">
        <!-- Barre de recherche -->
        <div class="relative">
          <Icon name="lucide:search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            v-model="searchQuery"
            type="text" 
            placeholder="Rechercher..."
            class="pl-9 pr-3 py-2 w-48 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        

      </div>
    </div>

    <!-- Tableau calendrier -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex-1 min-h-0 overflow-auto">
        <table class="w-full min-w-[1400px]">
          <!-- Header avec les semaines -->
          <thead class="sticky top-0 z-30">
            <tr class="bg-gray-50 dark:bg-gray-900/50">
              <!-- Colonne chantier -->
              <th class="sticky mx-auto left-0 z-40 bg-gray-50 dark:bg-gray-900/50 px-3 py-2 text-left text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider border-b border-r border-gray-200 dark:border-gray-700 min-w-[240px]">
                       <!-- Navigation par année -->
       <div class="flex items-center justify-center">
                  <button 
            @click="previousYear" 
            class="px-2 flex items-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300 cursor-pointer rounded-l-lg"
            title="Année précédente"
          >
            <Icon name="lucide:chevron-left" size="18" />
          </button>
          
          <span class="text-base font-semibold text-gray-700 dark:text-white px-2">
            {{ selectedYear }}
          </span>
          
          <button 
            @click="nextYear" 
            class="px-2 flex items-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300 cursor-pointer rounded-r-lg"
            title="Année suivante"
          >
            <Icon name="lucide:chevron-right" size="18" />
          </button>
       </div>

       
              </th>
              <!-- Colonnes semaines -->
              <th 
                v-for="week in weeks" 
                :key="week.number"
                class="px-0 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 min-w-[24px] transition-colors"
                :class="{ 
                  'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-semibold': week.number === getWeekNumber(new Date()) && selectedYear === new Date().getFullYear(),
                  'bg-gray-100 dark:bg-gray-700/30': hoveredWeek === week.number
                }"
                @mouseenter="hoveredWeek = week.number"
                @mouseleave="hoveredWeek = null"
              >
                {{ week.label }}
              </th>
            </tr>
          </thead>
          
          <!-- Corps du tableau -->
          <tbody class="divide-y divide-gray-100 dark:divide-gray-700/50">
            <tr 
              v-for="chantier in filteredChantiers" 
              :key="chantier.id"
              class="group hover:bg-gray-100 dark:hover:bg-gray-700/30 transition-colors"
            >
              <!-- Info chantier -->
              <td class="sticky left-0 z-10 bg-white dark:bg-gray-800 group-hover:bg-gray-100 dark:group-hover:bg-gray-700/30 px-2 py-1 border-r border-gray-200 dark:border-gray-700 transition-colors">
                <div class="flex items-center gap-1.5">
                  <span 
                    class="w-1 h-5 rounded-full shrink-0"
                    :class="getEtatColor(chantier.etat)"
                  ></span>
                  <span class="text-[10px] font-mono px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 shrink-0">
                    {{ chantier.compte || '-' }}
                  </span>
     
                  <NuxtLink 
                    :to="`/chantiers/${chantier.id}`"
                    class="text-[11px] font-medium text-gray-900 dark:text-white truncate hover:text-primary-600 dark:hover:text-primary-400 hover:underline transition-colors"
                    :title="chantier.name"
                  >
                    {{ chantier.name || 'Sans intitulé' }}
                  </NuxtLink> 
                              <span 
                    class="text-[9px] px-1.5 py-0.5 rounded-full font-medium shrink-0"
                    :class="{
                      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400': chantier.etat === 2,
                      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400': chantier.etat === 1,
                      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400': chantier.etat === 0,
                      'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400': chantier.etat === -1
                    }"
                  >
                    {{ getEtatLabel(chantier.etat) }}
                  </span>
                </div>
              </td>
              
              <!-- Cellules semaines avec barre de progression -->
              <td :colspan="53" class="relative h-8 p-0">
                <div class="absolute inset-0 flex">
                  <!-- Grille des semaines en arrière-plan -->
                  <div 
                    v-for="week in weeks" 
                    :key="week.number"
                    class="flex-1 border-r border-gray-100 dark:border-gray-700/30 last:border-r-0 transition-colors"
                    :class="{ 
                      'bg-primary-50/50 dark:bg-primary-900/10': week.number === getWeekNumber(new Date()) && selectedYear === new Date().getFullYear(),
                      'bg-gray-100 dark:bg-gray-700/30': hoveredWeek === week.number
                    }"
                    @mouseenter="hoveredWeek = week.number"
                    @mouseleave="hoveredWeek = null"
                  ></div>
                </div>
                
                <!-- Barre du chantier -->
                <div 
                  class="absolute top-1/2 -translate-y-1/2 h-5 rounded border shadow-sm transition-all duration-200 hover:h-6 hover:shadow-md cursor-pointer"
                  :class="[getEtatColor(chantier.etat), getEtatBorderColor(chantier.etat)]"
                  :style="getChantierBarStyle(chantier)"
                  :title="`${chantier.compte} - ${chantier.name}\n${formatDate(chantier.date_start_travaux)} → ${formatDate(chantier.date_end_travaux)}`"
                >
                  <span class="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white/90 truncate px-0.5">
                    {{ chantier.compte }}
                  </span>
                </div>
              </td>
            </tr>
            
            <!-- Message si aucun chantier -->
            <tr v-if="filteredChantiers.length === 0">
              <td colspan="54" class="px-6 py-12 text-center">
                <div class="flex flex-col items-center gap-3">
                  <Icon name="lucide:calendar-x" size="32" class=" text-gray-300 dark:text-gray-600" />
                  <p class="text-gray-500 dark:text-gray-400">Aucun chantier pour l'année {{ selectedYear }}</p>
                  <div class="flex gap-2 mt-2">
                    <button 
                      @click="selectedYear = new Date().getFullYear()" 
                      class="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium cursor-pointer"
                    >
                      Revenir à {{ new Date().getFullYear() }}
                    </button>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
    </div>
  </div>
</template>

<style scoped>
/* Scroll smooth */
.overflow-auto {
  scroll-behavior: smooth;
}
</style>
