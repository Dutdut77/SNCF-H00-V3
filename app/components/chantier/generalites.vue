<script setup>
const props = defineProps({
  chantier: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['update']);

const { updateChantier } = useChantiers();
const { getWeekendsByChantier, addWeekend, deleteTimelineItem, getWeekPosition } = useTimeline();
const { setLoader } = useLoader();

// État du SlideOver
const showEditSlideOver = ref(false);

// Week-ends du chantier
const weekends = ref([]);

// Week-ends triés par ordre croissant
const sortedWeekends = computed(() => {
  return [...weekends.value].sort((a, b) => {
    if (a.annee_debut !== b.annee_debut) {
      return a.annee_debut - b.annee_debut;
    }
    return a.semaine_debut - b.semaine_debut;
  });
});

// Formulaire pour nouveau week-end
const newWeekend = ref({
  semaineDebut: null,
  anneeDebut: new Date().getFullYear(),
  semaineFin: null,
  anneeFin: new Date().getFullYear()
});

// Options pour les semaines (1-53)
const semaineOptions = computed(() => {
  return Array.from({ length: 53 }, (_, i) => ({
    id: i + 1,
    label: `S${i + 1}`
  }));
});

// Options pour les années
const anneeOptions = computed(() => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 5 }, (_, i) => ({
    id: currentYear - 2 + i,
    label: String(currentYear - 2 + i)
  }));
});

// Formulaire d'édition
const editForm = ref({
  compte: '',
  name: '',
  ligne_id: null,
  type_essais: null,
  decret: null,
  matiere: '',
  compte_moe: '',
  compte_slg: '',
  compte_matieres: '',
  autre: '',
  date_start_travaux: null,
  date_end_travaux: null
});

// Charger les week-ends
const loadWeekends = async () => {
  if (props.chantier?.id) {
    weekends.value = await getWeekendsByChantier(props.chantier.id);
  }
};

// Ajouter un week-end
const handleAddWeekend = async () => {
  if (!newWeekend.value.semaineDebut || !newWeekend.value.semaineFin) return;
  
  setLoader(true);
  try {
    const result = await addWeekend(
      props.chantier.id,
      newWeekend.value.semaineDebut,
      newWeekend.value.anneeDebut,
      newWeekend.value.semaineFin,
      newWeekend.value.anneeFin
    );
    
    if (result) {
      await loadWeekends();
      // Reset form
      newWeekend.value = {
        semaineDebut: null,
        anneeDebut: new Date().getFullYear(),
        semaineFin: null,
        anneeFin: new Date().getFullYear()
      };
    }
  } finally {
    setLoader(false);
  }
};

// Supprimer un week-end
const handleDeleteWeekend = async (weekendId) => {
  setLoader(true);
  try {
    const success = await deleteTimelineItem(weekendId);
    if (success) {
      await loadWeekends();
    }
  } finally {
    setLoader(false);
  }
};

// Charger les week-ends au montage et quand le chantier change
onMounted(loadWeekends);
watch(() => props.chantier?.id, loadWeekends);

// Formater une date en format court (01/10/25)
const formatDateShort = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
};

// Calculer le numéro de semaine ISO
const getWeekNumber = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  return 'S' + (1 + Math.ceil((firstThursday - target) / 604800000));
};

// Options pour les selects
const typeEssaisOptions = [
  { id: 'simple', label: 'Simple' },
  { id: 'complexe', label: 'Complexe' }
];

const decretOptions = [
  { id: '92', label: 'Décret 92' },
  { id: '94', label: 'Décret 94' }
];

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

// Formater le type d'essais
const getTypeEssaisLabel = (type) => {
  if (!type) return '-';
  return type === 'simple' ? 'Simple' : type === 'complexe' ? 'Complexe' : type;
};

// Formater le décret
const getDecretLabel = (decret) => {
  if (!decret) return '-';
  return `Décret ${decret}`;
};

// Convertir une date (string ISO ou timestamp) en timestamp local à midi
const toTimestamp = (date) => {
  if (!date) return null;
  if (typeof date === 'number') return date;
  // Pour les dates ISO, extraire uniquement la partie date pour éviter les problèmes de timezone
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0).getTime();
};

// Convertir un timestamp en date ISO pour Supabase (à midi UTC pour éviter les décalages)
const toDateForDB = (timestamp) => {
  if (!timestamp) return null;
  const d = new Date(timestamp);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  // Format ISO avec heure à midi UTC pour éviter les problèmes de timezone
  return `${year}-${month}-${day}T12:00:00.000Z`;
};

// Ouvrir le SlideOver avec les données actuelles
const openEditSlideOver = () => {
  editForm.value = {
    compte: props.chantier.compte || '',
    name: props.chantier.name || '',
    ligne_id: props.chantier.ligne_id || null,
    type_essais: props.chantier.type_essais || null,
    decret: props.chantier.decret || null,
    matiere: props.chantier.matiere || '',
    compte_moe: props.chantier.compte_moe || '',
    compte_slg: props.chantier.compte_slg || '',
    compte_matieres: props.chantier.compte_matieres || '',
    autre: props.chantier.autre || '',
    date_start_travaux: toTimestamp(props.chantier.date_start_travaux),
    date_end_travaux: toTimestamp(props.chantier.date_end_travaux)
  };
  showEditSlideOver.value = true;
};

// Fermer le SlideOver
const closeEditSlideOver = () => {
  showEditSlideOver.value = false;
};

// Sauvegarder les modifications
const saveChanges = async () => {
  setLoader(true);
  try {
    const updated = await updateChantier(props.chantier.id, {
      compte: editForm.value.compte || null,
      name: editForm.value.name || null,
      ligne_id: editForm.value.ligne_id || null,
      type_essais: editForm.value.type_essais || null,
      decret: editForm.value.decret || null,
      matiere: editForm.value.matiere || null,
      compte_moe: editForm.value.compte_moe || null,
      compte_slg: editForm.value.compte_slg || null,
      compte_matieres: editForm.value.compte_matieres || null,
      autre: editForm.value.autre || null,
      date_start_travaux: toDateForDB(editForm.value.date_start_travaux),
      date_end_travaux: toDateForDB(editForm.value.date_end_travaux)
    });
    
    if (updated) {
      // Mettre à jour le chantier parent
      Object.assign(props.chantier, updated);
      closeEditSlideOver();
    }
  } finally {
    setLoader(false);
  }
};
</script>

<template>
  <div class="space-y-4">
    <!-- Header avec titre et bouton modifier -->
    <div class="flex flex-col lg:flex-row gap-4 items-center justify-between">
      <AppTitleMain title="Informations générales" description="Données principales du chantier" />
      <AppButtonValidated 
        type="button"
        theme="primary"
        @click="openEditSlideOver"
      >
        <template #default>
          <span class="flex items-center gap-2">
            <Icon name="lucide:pencil" size="16" />
            Modifier
          </span>
        </template>
      </AppButtonValidated>
    </div>
    
    <!-- Carte Période des travaux (Timeline) - Pleine largeur -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700">
        <div class="p-6">
          <div class="flex items-center gap-3 mb-6">
            <div class="flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-br from-blue-100 to-indigo-200 dark:from-blue-900/50 dark:to-indigo-800/50">
              <Icon name="lucide:calendar-range" size="20" class="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 class="text-lg font-bold text-gray-800 dark:text-gray-100">Période des travaux</h2>
              <p class="text-xs text-gray-500 dark:text-gray-400">Planification temporelle</p>
            </div>
          </div>
          
          <!-- Timeline horizontale améliorée -->
          <div class="relative py-2">
            <!-- Ligne de connexion (en arrière-plan, sur toute la largeur) -->
            <div class="absolute left-[70px] right-[70px] top-1/2 -translate-y-1/2 h-1 rounded-full bg-linear-to-r from-blue-400 to-indigo-500 shadow-sm z-0"></div>
            
            <div class="flex items-center w-full relative">
              <!-- Point de début -->
              <div class="flex flex-col items-center min-w-[70px] z-10 bg-white dark:bg-gray-800">
                <div class="px-2 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/40 mb-2">
                  <span class="text-xs font-bold text-blue-700 dark:text-blue-400">
                    {{ getWeekNumber(chantier.date_start_travaux) }}
                  </span>
                </div>
                <div class="relative">
                  <div class="w-4 h-4 rounded-full bg-blue-500 shadow-lg shadow-blue-500/40"></div>
                  <div class="absolute inset-0 w-4 h-4 rounded-full bg-blue-400 animate-ping opacity-20"></div>
                </div>
                <span class="text-xs font-semibold text-gray-800 dark:text-gray-200 mt-2">
                  {{ formatDateShort(chantier.date_start_travaux) }}
                </span>
                <span class="text-[10px] font-medium text-blue-600 dark:text-blue-400">DÉBUT</span>
              </div>
              
              <!-- Espace flexible -->
              <div class="flex-1"></div>
              
              <!-- Week-ends (par dessus la timeline) -->
              <div v-if="weekends.length > 0" class="flex items-center gap-2 z-20">
                <div 
                  v-for="(weekend, index) in sortedWeekends" 
                  :key="weekend.id"
                  class="flex flex-col items-center relative"
                >
                  <!-- Badge semaine début (en haut) -->
                  <div class="px-1.5 py-0.5  mb-1">
                    <span class="text-xs font-bold text-orange-700 dark:text-orange-400 whitespace-nowrap">
                      S{{ weekend.semaine_debut }}
                    </span>
                  </div>
                  <!-- Trait vertical (traverse la ligne) -->
                  <div class="w-1 h-10 bg-orange-500 dark:bg-orange-400 rounded-full shadow-md relative">
                    <!-- Petit point au milieu pour marquer la timeline -->
                    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-orange-500 dark:bg-orange-400 border-2 border-white dark:border-gray-800 shadow-sm"></div>
                  </div>
                  <!-- Badge semaine fin (en bas) -->
                  <div class="px-1.5 py-0.5  mt-1 ">
                    <span class="text-xs font-bold text-orange-700 dark:text-orange-400 whitespace-nowrap">
                      S{{ weekend.semaine_fin }}
                    </span>
                  </div>
                </div>
              </div>
              
              <!-- Petit espace avant le point de fin -->
              <div class="w-2"></div>
              
              <!-- Point de fin -->
              <div class="flex flex-col items-center min-w-[70px] z-10 bg-white dark:bg-gray-800">
                <div class="px-2 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 mb-2">
                  <span class="text-xs font-bold text-indigo-700 dark:text-indigo-400">
                    {{ getWeekNumber(chantier.date_end_travaux) }}
                  </span>
                </div>
                <div class="relative">
                  <div class="w-4 h-4 rounded-full bg-indigo-500 shadow-lg shadow-indigo-500/40"></div>
                </div>
                <span class="text-xs font-semibold text-gray-800 dark:text-gray-200 mt-2">
                  {{ formatDateShort(chantier.date_end_travaux) }}
                </span>
                <span class="text-[10px] font-medium text-indigo-600 dark:text-indigo-400">FIN</span>
              </div>
            </div>
          </div>
          
          <!-- Liste des week-ends -->
          <div v-if="weekends.length > 0" class="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Week-ends programmés</p>
            <div class="flex flex-wrap gap-2">
              <div 
                v-for="weekend in weekends" 
                :key="weekend.id"
                class="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs font-medium"
              >
                <Icon name="lucide:calendar-days" size="12" />
                S{{ weekend.semaine_debut }}/{{ weekend.annee_debut }} → S{{ weekend.semaine_fin }}/{{ weekend.annee_fin }}
              </div>
            </div>
          </div>
        </div>
      </div>

    <!-- Section Ligne + Essais + Décret -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
        
      <!-- Carte Ligne -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700">
        <div class="p-5">
          <div class="flex items-center gap-3 mb-4">
            <div class="flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-br from-sky-100 to-blue-200 dark:from-sky-900/50 dark:to-blue-800/50">
              <Icon name="lucide:train-track" size="20" class="text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <h2 class="text-lg font-bold text-gray-800 dark:text-gray-100">Ligne</h2>
              <p class="text-xs text-gray-500 dark:text-gray-400">Ligne ferroviaire</p>
            </div>
          </div>
          <p class="text-xl font-bold text-gray-900 dark:text-white">
            {{ chantier.ligne || '-' }}
          </p>
        </div>
      </div>

      <!-- Carte Décret -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700">
        <div class="p-5">
          <div class="flex items-center gap-3 mb-4">
            <div class="flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700">
              <Icon name="lucide:scale" size="20" class="text-slate-600 dark:text-slate-400" />
            </div>
            <div>
              <h2 class="text-lg font-bold text-gray-800 dark:text-gray-100">Décret</h2>
              <p class="text-xs text-gray-500 dark:text-gray-400">Réglementation</p>
            </div>
          </div>
          <p class="text-xl font-bold text-gray-900 dark:text-white">
            {{ chantier.decret ? `Décret ${chantier.decret}` : '-' }}
          </p>
        </div>
      </div>

      <!-- Carte Essais -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700">
        <div class="p-5">
          <div class="flex items-center gap-3 mb-4">
            <div class="flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-br from-indigo-100 to-violet-200 dark:from-indigo-900/50 dark:to-violet-800/50">
              <Icon name="lucide:flask-conical" size="20" class="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 class="text-lg font-bold text-gray-800 dark:text-gray-100">Essais</h2>
              <p class="text-xs text-gray-500 dark:text-gray-400">Type d'essais</p>
            </div>
          </div>
          <p class="text-xl font-bold text-gray-900 dark:text-white">
            {{ chantier.type_essais ? (chantier.type_essais === 'simple' ? 'Simple' : 'Complexe') : '-' }}
          </p>
        </div>
      </div>
    </div>

    <!-- Lien matières commandées -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700">
      <div class="p-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-br from-amber-100 to-orange-200 dark:from-amber-900/50 dark:to-orange-800/50">
              <Icon name="lucide:package" size="20" class="text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 class="text-lg font-bold text-gray-800 dark:text-gray-100">Matières commandées</h2>
              <p class="text-xs text-gray-500 dark:text-gray-400">Accès au suivi des commandes</p>
            </div>
          </div>
          
          <div v-if="chantier.matiere">
            <a 
              :href="chantier.matiere" 
              target="_blank" 
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-linear-to-r from-amber-500 to-orange-500 text-white font-medium text-sm shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30 hover:scale-105 transition-all duration-300"
            >
              <Icon name="lucide:external-link" size="16" />
              Ouvrir le lien
            </a>
          </div>
          <span v-else class="text-sm text-gray-400 dark:text-gray-500 italic">
            Aucun lien défini
          </span>
        </div>
      </div>
    </div>

    <!-- Rubrique Comptes -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700">
      <div class="p-6">
        <div class="flex items-center gap-3 mb-5">
          <div class="flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-br from-cyan-100 to-teal-200 dark:from-cyan-900/50 dark:to-teal-800/50">
            <Icon name="lucide:wallet" size="20" class="text-cyan-600 dark:text-cyan-400" />
          </div>
          <div>
            <h2 class="text-lg font-bold text-gray-800 dark:text-gray-100">Comptes</h2>
            <p class="text-xs text-gray-500 dark:text-gray-400">Références comptables du chantier</p>
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-100 dark:border-gray-600">
            <label class="text-xs font-semibold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">Compte MOE</label>
            <p class="mt-2 text-lg font-bold text-gray-900 dark:text-white font-mono">{{ chantier.compte_moe || '-' }}</p>
          </div>
          <div class="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-100 dark:border-gray-600">
            <label class="text-xs font-semibold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">Compte SLG</label>
            <p class="mt-2 text-lg font-bold text-gray-900 dark:text-white font-mono">{{ chantier.compte_slg || '-' }}</p>
          </div>
          <div class="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-100 dark:border-gray-600">
            <label class="text-xs font-semibold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">Compte Matière</label>
            <p class="mt-2 text-lg font-bold text-gray-900 dark:text-white font-mono">{{ chantier.compte_matieres || '-' }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Rubrique Autre -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700">
      <div class="p-6">
        <div class="flex items-center gap-3 mb-5">
          <div class="flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-br from-indigo-100 to-purple-200 dark:from-indigo-900/50 dark:to-purple-800/50">
            <Icon name="lucide:file-text" size="20" class="text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h2 class="text-lg font-bold text-gray-800 dark:text-gray-100">Autre</h2>
            <p class="text-xs text-gray-500 dark:text-gray-400">Informations complémentaires</p>
          </div>
        </div>
        
        <div v-if="chantier.autre" class="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-100 dark:border-gray-600">
          <p class="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{{ chantier.autre }}</p>
        </div>
        <div v-else class="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-100 dark:border-gray-600 text-center">
          <Icon name="lucide:file-x" size="32" class="text-gray-300 dark:text-gray-600 mx-auto mb-2" />
          <p class="text-sm text-gray-400 dark:text-gray-500 italic">
            Aucune information complémentaire
          </p>
        </div>
      </div>
    </div>

    <!-- SlideOver de modification -->
    <AppSlideOver :sideModal="showEditSlideOver" :closeSideModal="closeEditSlideOver">
      <AppSlideOverContent v-if="showEditSlideOver" :closeSideModal="closeEditSlideOver">
        <template #header>
          <h2 class="text-3xl font-[Pacifico] text-gray-800 dark:text-white">
            Modifier les informations
          </h2>
          <p class="text-sm text-gray-500 dark:text-gray-400 ">
            Modifiez les informations générales du chantier
          </p>
        </template>

        <template #default>
          <form @submit.prevent="saveChanges" class="space-y-6">
            <!-- Identification -->
            <div class="space-y-4">
              <div class="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                <Icon name="lucide:building-2" size="16" class="text-primary-500" />
                <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Identification</h3>
              </div>
              
              <AppInput 
                v-model="editForm.compte"
                name="compte"
                title="Compte"
                placeholder="Numéro de compte"
              />
              
              <AppInput 
                v-model="editForm.name"
                name="name"
                title="Intitulé du chantier"
                placeholder="Nom du chantier"
              />
              
              <AppSelect 
                v-model="editForm.type_essais"
                name="type_essais"
                title="Type d'essais"
                :options="typeEssaisOptions"
                placeholder="Sélectionner..."
                nullable
              />
              
              <AppSelect 
                v-model="editForm.decret"
                name="decret"
                title="Décret"
                :options="decretOptions"
                placeholder="Sélectionner..."
                nullable
              />
            </div>

            <!-- Dates -->
            <div class="space-y-4">
              <div class="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                <Icon name="lucide:calendar-range" size="16" class="text-primary-500" />
                <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Période des travaux</h3>
              </div>
              
              <div class="grid grid-cols-2 gap-4">
                <AppDatePicker 
                  v-model="editForm.date_start_travaux"
                  title="Date de début"
                  placeholder="Sélectionner..."
                  clearable
                />
                
                <AppDatePicker 
                  v-model="editForm.date_end_travaux"
                  title="Date de fin"
                  placeholder="Sélectionner..."
                  clearable
                />
              </div>
            </div>

            <!-- Week-ends -->
            <div class="space-y-4">
              <div class="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                <Icon name="lucide:calendar-days" size="16" class="text-orange-500" />
                <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Week-ends</h3>
              </div>
              
              <!-- Liste des week-ends existants -->
              <div v-if="weekends.length > 0" class="space-y-2">
                <div 
                  v-for="weekend in weekends" 
                  :key="weekend.id"
                  class="flex items-center justify-between p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800"
                >
                  <div class="flex items-center gap-2">
                    <Icon name="lucide:calendar-days" size="16" class="text-orange-500" />
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                      S{{ weekend.semaine_debut }}/{{ weekend.annee_debut }} → S{{ weekend.semaine_fin }}/{{ weekend.annee_fin }}
                    </span>
                  </div>
                  <button 
                    type="button"
                    @click="handleDeleteWeekend(weekend.id)"
                    class="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-colors"
                  >
                    <Icon name="lucide:trash-2" size="16" />
                  </button>
                </div>
              </div>
              <p v-else class="text-sm text-gray-400 italic">Aucun week-end programmé</p>
              
              <!-- Formulaire d'ajout -->
              <div class="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <p class="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-3">Ajouter un week-end</p>
                
                <div class="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label class="block text-xs text-gray-500 mb-1">Semaine début</label>
                    <AppSelect 
                      v-model="newWeekend.semaineDebut"
                      :options="semaineOptions"
                      placeholder="S..."
                      nullable
                    />
                  </div>
                  <div>
                    <label class="block text-xs text-gray-500 mb-1">Année</label>
                    <AppSelect 
                      v-model="newWeekend.anneeDebut"
                      :options="anneeOptions"
                      placeholder="Année"
                    />
                  </div>
                </div>
                
                <div class="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label class="block text-xs text-gray-500 mb-1">Semaine fin</label>
                    <AppSelect 
                      v-model="newWeekend.semaineFin"
                      :options="semaineOptions"
                      placeholder="S..."
                      nullable
                    />
                  </div>
                  <div>
                    <label class="block text-xs text-gray-500 mb-1">Année</label>
                    <AppSelect 
                      v-model="newWeekend.anneeFin"
                      :options="anneeOptions"
                      placeholder="Année"
                    />
                  </div>
                </div>
                
                <AppButtonValidated 
                  type="button"
                  theme="secondary"
                  :validated="!!newWeekend.semaineDebut && !!newWeekend.semaineFin"
                  @click="handleAddWeekend"
                >
                  <template #default>
                    <span class="flex items-center gap-2">
                      <Icon name="lucide:plus" size="16" />
                      Ajouter
                    </span>
                  </template>
                </AppButtonValidated>
              </div>
            </div>

            <!-- Lien matières -->
            <div class="space-y-4">
              <div class="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                <Icon name="lucide:link" size="16" class="text-primary-500" />
                <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Matières commandées</h3>
              </div>
              
              <AppInput 
                v-model="editForm.matiere"
                name="matiere"
                title="Lien web"
                type="url"
                placeholder="https://..."
              />
            </div>

            <!-- Comptes -->
            <div class="space-y-4">
              <div class="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                <Icon name="lucide:wallet" size="16" class="text-primary-500" />
                <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Comptes</h3>
              </div>
              
              <AppInput 
                v-model="editForm.compte_moe"
                name="compte_moe"
                title="Compte MOE"
                placeholder="Numéro de compte MOE"
              />
              
              <AppInput 
                v-model="editForm.compte_slg"
                name="compte_slg"
                title="Compte SLG"
                placeholder="Numéro de compte SLG"
              />
              
              <AppInput 
                v-model="editForm.compte_matieres"
                name="compte_matieres"
                title="Compte Matière"
                placeholder="Numéro de compte Matière"
              />
            </div>

            <!-- Autre -->
            <div class="space-y-4">
              <div class="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                <Icon name="lucide:file-text" size="16" class="text-primary-500" />
                <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Autre</h3>
              </div>
              
              <div class="w-full">
                <label for="autre" class="block text-sm mb-0.5">Informations complémentaires</label>
                <textarea 
                  v-model="editForm.autre"
                  id="autre"
                  name="autre"
                  rows="4"
                  class="appearance-none border border-gray-300 dark:border-gray-600 text-sm rounded-md py-2 px-3 w-full text-gray-700 dark:text-gray-200 dark:bg-gray-800 leading-tight focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 resize-none"
                  placeholder="Notes, remarques, informations diverses..."
                ></textarea>
              </div>
            </div>
          </form>
        </template>

        <template #footer>
          <div class="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <AppButtonValidated 
              theme="cancel" 
              type="button"
              @click="closeEditSlideOver"
            >
              <template #default>Annuler</template>
            </AppButtonValidated>
            <AppButtonValidated 
              theme="primary" 
              type="button"
              @click="saveChanges"
            >
              <template #default>Enregistrer</template>
            </AppButtonValidated>
          </div>
        </template>
      </AppSlideOverContent>
    </AppSlideOver>
  </div>
</template>
