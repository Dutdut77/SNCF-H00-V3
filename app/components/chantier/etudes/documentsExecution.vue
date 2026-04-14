<script setup>
const props = defineProps({
  chantier: {
    type: Object,
    required: true
  }
});

const {
  getDexByChantier,
  addDex,
  updateDex,
  deleteDex,
  getDocumentStatus,
  getDateRc,
  formatDate,
  getDaysRemaining
} = useEtudes();
const { setLoader } = useLoader();

// État du SlideOver
const showSlideOver = ref(false);
const editMode = ref(false);
const editingItem = ref(null);

// Modal de confirmation de suppression
const showDeleteModal = ref(false);
const itemToDelete = ref(null);

// Liste des documents
const documents = ref([]);

// Formulaire (sans date_demande)
const form = ref({
  indice: '',
  titre: '',
  date_prevu: [],
  date_mes: null,
  date_recu: null,
  observation: ''
});

// Nouvelle date prévue à ajouter
const newDatePrevu = ref(null);

// Documents triés par indice
const sortedDocuments = computed(() => {
  return [...documents.value].sort((a, b) => {
    return a.indice.localeCompare(b.indice, 'fr', { numeric: true });
  });
});

// Statistiques
const stats = computed(() => {
  const total = documents.value.length;
  const received = documents.value.filter(d => d.date_recu).length;
  const overdue = documents.value.filter(d => {
    const status = getDocumentStatus(d, true);
    return status.status === 'overdue';
  }).length;
  const attention = documents.value.filter(d => {
    const status = getDocumentStatus(d, true);
    return status.status === 'attention';
  }).length;

  return { total, received, overdue, attention };
});

// Charger les documents
const loadDocuments = async () => {
  if (props.chantier?.id) {
    documents.value = await getDexByChantier(props.chantier.id);
  }
};

// Convertir une date string en timestamp
const toTimestamp = (date) => {
  if (!date) return null;
  if (typeof date === 'number') return date;
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0).getTime();
};

// Convertir un timestamp en date ISO pour Supabase
const toDateForDB = (timestamp) => {
  if (!timestamp) return null;
  const d = new Date(timestamp);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Ouvrir le slideOver pour ajouter
const openAddSlideOver = () => {
  editMode.value = false;
  editingItem.value = null;
  form.value = {
    indice: '',
    titre: '',
    date_prevu: [],
    date_mes: null,
    date_recu: null,
    observation: ''
  };
  newDatePrevu.value = null;
  showSlideOver.value = true;
};

// Ouvrir le slideOver pour modifier
const openEditSlideOver = (item) => {
  editMode.value = true;
  editingItem.value = item;
  form.value = {
    indice: item.indice,
    titre: item.titre || '',
    date_prevu: item.date_prevu || [],
    date_mes: toTimestamp(item.date_mes),
    date_recu: toTimestamp(item.date_recu),
    observation: item.observation || ''
  };
  newDatePrevu.value = null;
  showSlideOver.value = true;
};

// Fermer le slideOver
const closeSlideOver = () => {
  showSlideOver.value = false;
  editMode.value = false;
  editingItem.value = null;
};

// Ajouter une date prévue
const addDatePrevu = () => {
  if (newDatePrevu.value) {
    const dateStr = toDateForDB(newDatePrevu.value);
    if (dateStr && !form.value.date_prevu.includes(dateStr)) {
      form.value.date_prevu.push(dateStr);
    }
    newDatePrevu.value = null;
  }
};

// Supprimer une date prévue
const removeDatePrevu = (index) => {
  form.value.date_prevu.splice(index, 1);
};

// Sauvegarder
const handleSave = async () => {
  if (!form.value.indice) return;

  setLoader(true);
  try {
    const data = {
      indice: form.value.indice,
      titre: form.value.titre || null,
      date_prevu: form.value.date_prevu,
      date_mes: toDateForDB(form.value.date_mes),
      date_recu: toDateForDB(form.value.date_recu),
      observation: form.value.observation || null
    };

    if (editMode.value && editingItem.value) {
      const result = await updateDex(editingItem.value.id, data);
      if (result) {
        await loadDocuments();
        closeSlideOver();
      }
    } else {
      const result = await addDex(props.chantier.id, data);
      if (result) {
        await loadDocuments();
        closeSlideOver();
      }
    }
  } finally {
    setLoader(false);
  }
};

// Ouvrir le modal de suppression
const openDeleteModal = (item) => {
  itemToDelete.value = item;
  showDeleteModal.value = true;
};

// Fermer le modal de suppression
const closeDeleteModal = () => {
  showDeleteModal.value = false;
  itemToDelete.value = null;
};

// Confirmer la suppression
const confirmDelete = async () => {
  if (!itemToDelete.value) return;

  setLoader(true);
  try {
    const success = await deleteDex(itemToDelete.value.id);
    if (success) {
      await loadDocuments();
      closeDeleteModal();
    }
  } finally {
    setLoader(false);
  }
};

// Obtenir les classes de couleur pour le statut
const getStatusClasses = (status) => {
  const colors = {
    received: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    attention: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    overdue: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
    pending: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-600'
  };
  return colors[status] || colors.pending;
};

// Obtenir les classes de couleur pour la card
const getCardClasses = (status) => {
  const colors = {
    received: 'border-l-emerald-500',
    attention: 'border-l-amber-500',
    overdue: 'border-l-red-500',
    pending: 'border-l-gray-300 dark:border-l-gray-600'
  };
  return colors[status] || colors.pending;
};

// Obtenir le label du statut précédent
const getPreviousStatusLabel = (previousStatus) => {
  if (!previousStatus) return '';
  const labels = {
    pending: 'dans les temps',
    attention: 'avec retard sur prévision',
    overdue: 'après la date RC'
  };
  return labels[previousStatus.status] || '';
};

// Obtenir toutes les dates triées chronologiquement
const getSortedDates = (doc) => {
  const dates = [];

  // Ajouter les dates prévues
  if (doc.date_prevu && doc.date_prevu.length > 0) {
    doc.date_prevu.forEach((dateP, idx) => {
      dates.push({
        type: 'prevu',
        label: 'Prévu',
        date: dateP,
        sortDate: new Date(dateP),
        daysRemaining: getDaysRemaining(dateP)
      });
    });
  }

  // Ajouter la date RC (2 mois avant MES)
  if (doc.date_mes) {
    const rcDate = getDateRc(doc.date_mes);
    dates.push({
      type: 'rc',
      label: 'RC',
      date: rcDate,
      sortDate: new Date(rcDate),
      daysRemaining: getDaysRemaining(rcDate)
    });
  }

  // Ajouter la date MES
  if (doc.date_mes) {
    dates.push({
      type: 'mes',
      label: 'MES',
      date: doc.date_mes,
      sortDate: new Date(doc.date_mes),
      daysRemaining: getDaysRemaining(doc.date_mes)
    });
  }

  // Ajouter la date de réception
  if (doc.date_recu) {
    dates.push({
      type: 'recu',
      label: 'Reçu',
      date: doc.date_recu,
      sortDate: new Date(doc.date_recu),
      daysRemaining: null
    });
  }

  // Trier par date
  return dates.sort((a, b) => a.sortDate - b.sortDate);
};

// Charger au montage
onMounted(loadDocuments);
watch(() => props.chantier?.id, loadDocuments);
</script>

<template>
  <div class="flex flex-col h-full overflow-auto bg-gray-50 dark:bg-gray-950">

    <!-- ══════════ HEADER ══════════ -->
    <div class="flex flex-col lg:flex-row gap-4 items-center justify-between p-4">
      <AppTitleMain title="Documents d'exécution" description="Suivi des DEX du chantier" />
      <AppButtonValidated type="button" theme="primary" @click="openAddSlideOver">
        <template #default>
          <span class="flex items-center gap-2">
            <Icon name="lucide:plus" size="16" />
            Ajouter un DEX
          </span>
        </template>
      </AppButtonValidated>
    </div>

    <!-- ══════════ STATS ══════════ -->
    <div class="mx-4 mb-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div class="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-gray-100 dark:divide-gray-700">
        <div class="flex items-center gap-3 px-5 py-4">
          <div class="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0">
            <Icon name="lucide:file-text" size="18" class="text-gray-500 dark:text-gray-400" />
          </div>
          <div>
            <p class="text-2xl font-bold tabular-nums text-gray-800 dark:text-white leading-none">{{ stats.total }}</p>
            <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Total</p>
          </div>
        </div>
        <div class="flex items-center gap-3 px-5 py-4">
          <div class="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
            <Icon name="lucide:check-circle-2" size="18" class="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p class="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400 leading-none">{{ stats.received }}</p>
            <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              Reçus
              <span v-if="stats.total > 0" class="text-emerald-500 dark:text-emerald-400 font-medium ml-1">
                {{ Math.round((stats.received / stats.total) * 100) }}%
              </span>
            </p>
          </div>
        </div>
        <div class="flex items-center gap-3 px-5 py-4">
          <div class="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
            <Icon name="lucide:alert-triangle" size="18" class="text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p class="text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400 leading-none">{{ stats.attention }}</p>
            <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Attention</p>
          </div>
        </div>
        <div class="flex items-center gap-3 px-5 py-4">
          <div class="w-9 h-9 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
            <Icon name="lucide:alert-circle" size="18" class="text-red-600 dark:text-red-400" />
          </div>
          <div>
            <p class="text-2xl font-bold tabular-nums text-red-600 dark:text-red-400 leading-none">{{ stats.overdue }}</p>
            <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">En retard</p>
          </div>
        </div>
      </div>
    </div>

    <!-- ══════════ LISTE ══════════ -->
    <div class="flex-1 p-4 space-y-1.5">

      <!-- Empty state -->
      <div v-if="sortedDocuments.length === 0" class="flex flex-col items-center justify-center py-20 text-center">
        <div class="relative mb-6">
          <div class="w-20 h-20 rounded-2xl bg-white dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center shadow-sm">
            <Icon name="lucide:file-plus" size="36" class="text-gray-300 dark:text-gray-600" />
          </div>
          <div class="absolute -top-1 -right-1 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center shadow-sm">
            <Icon name="lucide:plus" size="14" class="text-white" />
          </div>
        </div>
        <p class="text-base font-semibold text-gray-600 dark:text-gray-300">Aucun document d'exécution</p>
        <p class="text-sm text-gray-400 dark:text-gray-500 mt-1 mb-5">Ajoutez des DEX pour suivre leur avancement</p>
        <button @click="openAddSlideOver"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors">
          <Icon name="lucide:plus" size="14" />
          Ajouter un DEX
        </button>
      </div>

      <!-- Documents -->
      <div v-for="doc in sortedDocuments" :key="doc.id"
        class="dex-row group relative flex items-stretch bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden cursor-pointer transition-all duration-150 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600"
        @click="openEditSlideOver(doc)">

        <!-- Barre de statut colorée -->
        <div class="w-1 shrink-0 transition-all duration-300"
          :class="[
            getDocumentStatus(doc, true).status === 'received'  ? 'bg-emerald-500' : '',
            getDocumentStatus(doc, true).status === 'attention' ? 'bg-amber-500 bar-pulse-amber' : '',
            getDocumentStatus(doc, true).status === 'overdue'   ? 'bg-red-500 bar-pulse-red' : '',
            getDocumentStatus(doc, true).status === 'pending'   ? 'bg-gray-300 dark:bg-gray-600' : ''
          ]">
        </div>

        <!-- Corps du document -->
        <div class="flex-1 flex flex-col md:flex-row md:items-center gap-3 px-4 py-3 min-w-0">

          <!-- Indice + badge -->
          <div class="flex items-center gap-3 shrink-0">
            <span class="font-mono text-base font-bold text-gray-900 dark:text-white w-20 truncate">
              {{ doc.indice }}
            </span>
            <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border"
              :class="getStatusClasses(getDocumentStatus(doc, true).status)">
              <span class="w-1.5 h-1.5 rounded-full shrink-0"
                :class="[
                  getDocumentStatus(doc, true).status === 'received'  ? 'bg-emerald-500' : '',
                  getDocumentStatus(doc, true).status === 'attention' ? 'bg-amber-500 pulse-dot' : '',
                  getDocumentStatus(doc, true).status === 'overdue'   ? 'bg-red-500' : '',
                  getDocumentStatus(doc, true).status === 'pending'   ? 'bg-gray-400' : ''
                ]">
              </span>
              {{ getDocumentStatus(doc, true).label }}
              <span v-if="getDocumentStatus(doc, true).status === 'received' && getDocumentStatus(doc, true).previousStatus"
                class="opacity-60">
                · {{ getPreviousStatusLabel(getDocumentStatus(doc, true).previousStatus) }}
              </span>
            </span>
          </div>

          <!-- Titre + observation -->
          <div class="flex-1 min-w-0">
            <p v-if="doc.titre" class="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{{ doc.titre }}</p>
            <p v-else class="text-sm text-gray-400 dark:text-gray-500 italic">Sans titre</p>
            <p v-if="doc.observation" class="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">{{ doc.observation }}</p>
          </div>

          <!-- Pipeline de dates -->
          <div class="flex items-center gap-0 shrink-0 self-start md:self-center">
            <template v-if="getSortedDates(doc).length === 0">
              <span class="text-xs text-gray-300 dark:text-gray-600 italic">Aucune date</span>
            </template>
            <template v-for="(dateItem, idx) in getSortedDates(doc)" :key="idx">
              <!-- Connecteur -->
              <div v-if="idx > 0" class="w-4 h-px shrink-0"
                :class="dateItem.type === 'recu' ? 'bg-emerald-300 dark:bg-emerald-700' : 'bg-gray-200 dark:bg-gray-700'">
              </div>
              <!-- Chip de date -->
              <div class="flex flex-col items-center px-2.5 py-1 rounded-md text-xs font-medium leading-tight"
                :class="[
                  dateItem.type === 'prevu' ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300' : '',
                  dateItem.type === 'rc' && !doc.date_recu && getDaysRemaining(dateItem.date) < 0
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                    : '',
                  dateItem.type === 'rc' && !((!doc.date_recu) && getDaysRemaining(dateItem.date) < 0)
                    ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300'
                    : '',
                  dateItem.type === 'mes'  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : '',
                  dateItem.type === 'recu' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300' : '',
                ]">
                <span class="text-[10px] uppercase tracking-wider opacity-60 font-semibold">{{ dateItem.label }}</span>
                <span class="font-bold tabular-nums">{{ formatDate(dateItem.date) }}</span>
                <span v-if="dateItem.daysRemaining !== null && !doc.date_recu"
                  class="text-[10px] font-normal"
                  :class="dateItem.daysRemaining < 0 ? 'text-red-500' : dateItem.daysRemaining <= 60 ? 'text-amber-500' : 'opacity-50'">
                  {{ dateItem.daysRemaining < 0
                    ? (dateItem.type === 'rc' ? 'Dépassé' : `${Math.abs(dateItem.daysRemaining)}j`)
                    : `J-${dateItem.daysRemaining}` }}
                </span>
              </div>
            </template>
          </div>
        </div>

        <!-- Action suppression (hover) -->
        <div class="shrink-0 flex items-center px-3 opacity-0 group-hover:opacity-100 transition-opacity duration-150 border-l border-gray-100 dark:border-gray-700">
          <button @click.stop="openDeleteModal(doc)"
            class="w-7 h-7 flex items-center justify-center rounded-md hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-300 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400 transition-colors">
            <Icon name="lucide:trash-2" size="14" />
          </button>
        </div>
      </div>
    </div>


    <!-- ══════════ SLIDE-OVER ══════════ -->
    <AppSlideOver :sideModal="showSlideOver" :closeSideModal="closeSlideOver">
      <AppSlideOverContent v-if="showSlideOver" :closeSideModal="closeSlideOver">
        <template #header>
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
              <Icon name="lucide:file-text" size="15" class="text-white" />
            </div>
            <div>
              <h2 class="text-2xl font-[Bangers] tracking-wider text-gray-800 dark:text-white leading-none">
                {{ editMode ? 'Modifier le DEX' : 'Nouveau DEX' }}
              </h2>
              <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {{ editMode ? 'Mettez à jour les informations du document' : 'Ajoutez un nouveau document d\'exécution' }}
              </p>
            </div>
          </div>
        </template>

        <template #default>
          <form @submit.prevent="handleSave" class="space-y-6">

            <!-- Identification -->
            <div class="space-y-3">
              <div class="flex items-center gap-2">
                <div class="h-px flex-1 bg-gray-100 dark:bg-gray-700"></div>
                <span class="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-2">Identification</span>
                <div class="h-px flex-1 bg-gray-100 dark:bg-gray-700"></div>
              </div>
              <AppInput v-model="form.indice" name="indice" title="Indice *" placeholder="Ex: DEX-001" />
              <AppInput v-model="form.titre" name="titre" title="Titre" placeholder="Description du document" />
            </div>

            <!-- Dates -->
            <div class="space-y-3">
              <div class="flex items-center gap-2">
                <div class="h-px flex-1 bg-gray-100 dark:bg-gray-700"></div>
                <span class="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-2">Dates clés</span>
                <div class="h-px flex-1 bg-gray-100 dark:bg-gray-700"></div>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div class="rounded-lg border border-blue-100 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-900/10 p-3">
                  <AppDatePicker v-model="form.date_mes" title="Date MES" placeholder="Mise en service" clearable />
                </div>
                <div class="rounded-lg border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-900/10 p-3">
                  <AppDatePicker v-model="form.date_recu" title="Date de réception" placeholder="Non renseignée" clearable />
                </div>
              </div>
              <!-- Date RC calculée -->
              <div v-if="form.date_mes"
                class="flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/50">
                <Icon name="lucide:calendar-clock" size="15" class="text-orange-500 shrink-0" />
                <span class="text-xs text-orange-700 dark:text-orange-400">
                  Date RC calculée :
                  <strong class="font-bold ml-1">{{ formatDate(getDateRc(new Date(form.date_mes))) }}</strong>
                </span>
                <span class="text-xs text-orange-500 dark:text-orange-500 ml-1">(2 mois avant MES)</span>
              </div>
            </div>

            <!-- Dates prévues -->
            <div class="space-y-3">
              <div class="flex items-center gap-2">
                <div class="h-px flex-1 bg-gray-100 dark:bg-gray-700"></div>
                <span class="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-2">Dates prévues</span>
                <div class="h-px flex-1 bg-gray-100 dark:bg-gray-700"></div>
              </div>

              <div v-if="form.date_prevu.length > 0" class="flex flex-wrap gap-2">
                <div v-for="(dateP, idx) in form.date_prevu" :key="idx"
                  class="inline-flex items-center gap-1.5 pl-3 pr-2 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-medium">
                  <Icon name="lucide:calendar" size="12" class="opacity-70" />
                  {{ formatDate(dateP) }}
                  <button type="button" @click="removeDatePrevu(idx)"
                    class="w-4 h-4 rounded-full hover:bg-purple-200 dark:hover:bg-purple-800 flex items-center justify-center transition-colors">
                    <Icon name="lucide:x" size="10" />
                  </button>
                </div>
              </div>
              <p v-else class="text-xs text-gray-400 dark:text-gray-500 italic">Aucune date prévue ajoutée</p>

              <div class="flex items-end gap-2">
                <div class="flex-1">
                  <AppDatePicker v-model="newDatePrevu" title="Ajouter une date prévue" placeholder="Sélectionner..." clearable />
                </div>
                <button type="button" @click="addDatePrevu" :disabled="!newDatePrevu"
                  class="shrink-0 h-9 w-9 flex items-center justify-center rounded-lg transition-colors"
                  :class="newDatePrevu
                    ? 'bg-purple-500 hover:bg-purple-600 text-white cursor-pointer shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-300 dark:text-gray-600 cursor-not-allowed'">
                  <Icon name="lucide:plus" size="18" />
                </button>
              </div>
            </div>

            <!-- Observation -->
            <div class="space-y-3">
              <div class="flex items-center gap-2">
                <div class="h-px flex-1 bg-gray-100 dark:bg-gray-700"></div>
                <span class="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-2">Observation</span>
                <div class="h-px flex-1 bg-gray-100 dark:bg-gray-700"></div>
              </div>
              <textarea v-model="form.observation" rows="3"
                class="appearance-none border border-gray-200 dark:border-gray-600 text-sm rounded-lg py-2.5 px-3 w-full text-gray-700 dark:text-gray-200 dark:bg-gray-800 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 resize-none transition-colors"
                placeholder="Notes, remarques..."></textarea>
            </div>
          </form>
        </template>

        <template #footer>
          <div class="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
            <AppButtonValidated theme="cancel" type="button" @click="closeSlideOver">
              <template #default>Annuler</template>
            </AppButtonValidated>
            <AppButtonValidated theme="primary" type="button" :validated="!!form.indice" @click="handleSave">
              <template #default>
                <span class="flex items-center gap-1.5">
                  <Icon :name="editMode ? 'lucide:save' : 'lucide:plus'" size="14" />
                  {{ editMode ? 'Enregistrer' : 'Ajouter' }}
                </span>
              </template>
            </AppButtonValidated>
          </div>
        </template>
      </AppSlideOverContent>
    </AppSlideOver>


    <!-- ══════════ MODAL SUPPRESSION ══════════ -->
    <AppModal v-model="showDeleteModal" size="lg" :showCloseButton="false">
      <div class="p-6 text-center">
        <div class="mx-auto flex items-center justify-center w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-900/30 mb-4">
          <Icon name="lucide:trash-2" size="26" class="text-red-500" />
        </div>
        <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-1">Supprimer ce document ?</h3>
        <p class="text-sm text-gray-400 dark:text-gray-500 mb-4">Cette action est irréversible.</p>
        <div v-if="itemToDelete" class="mb-5 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700">
          <p class="font-mono font-bold text-gray-800 dark:text-gray-200">{{ itemToDelete.indice }}</p>
          <p v-if="itemToDelete.titre" class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{{ itemToDelete.titre }}</p>
        </div>
        <div class="flex justify-center gap-3">
          <AppButtonValidated theme="cancel" type="button" @click="closeDeleteModal">
            <template #default>Annuler</template>
          </AppButtonValidated>
          <AppButtonValidated theme="danger" type="button" :validated="true" @click="confirmDelete">
            <template #default>
              <span class="flex items-center gap-1.5">
                <Icon name="lucide:trash-2" size="14" />
                Supprimer
              </span>
            </template>
          </AppButtonValidated>
        </div>
      </div>
    </AppModal>

  </div>
</template>

<style scoped>
@keyframes pulse-soft {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.45; }
}
@keyframes pulse-bar {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.6; }
}
.pulse-dot      { animation: pulse-soft 1.8s ease-in-out infinite; }
.bar-pulse-amber { animation: pulse-bar 2.2s ease-in-out infinite; }
.bar-pulse-red   { animation: pulse-bar 1.6s ease-in-out infinite; }
.dex-row { transform: translateY(0); }
.dex-row:hover { transform: translateY(-1px); }
</style>
