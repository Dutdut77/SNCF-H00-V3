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
  <div class="flex flex-col gap-4 h-full overflow-auto p-4 w-full ">
    <!-- Header -->
    <div class="flex flex-col lg:flex-row gap-4 items-center justify-between">
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

    <!-- Statistiques -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div class="flex items-center gap-3">
          <div class="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700">
            <Icon name="lucide:file-text" size="20" class="text-gray-600 dark:text-gray-400" />
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats.total }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">Total</p>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div class="flex items-center gap-3">
          <div class="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
            <Icon name="lucide:check-circle-2" size="20" class="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p class="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{{ stats.received }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">Reçus</p>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div class="flex items-center gap-3">
          <div class="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30">
            <Icon name="lucide:alert-triangle" size="20" class="text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p class="text-2xl font-bold text-amber-600 dark:text-amber-400">{{ stats.attention }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">Attention</p>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div class="flex items-center gap-3">
          <div class="flex items-center justify-center w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30">
            <Icon name="lucide:alert-circle" size="20" class="text-red-600 dark:text-red-400" />
          </div>
          <div>
            <p class="text-2xl font-bold text-red-600 dark:text-red-400">{{ stats.overdue }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">En retard</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Liste des documents -->
    <div
      class="bg-white h-full min-h-full dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700">
      <div class="p-6">
        <div class="flex items-center gap-3 mb-6">
          <div
            class="flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-br from-indigo-100 to-purple-200 dark:from-indigo-900/50 dark:to-purple-800/50">
            <Icon name="lucide:file-text" size="20" class="text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h2 class="text-lg font-bold text-gray-800 dark:text-gray-100">Liste des DEX</h2>
            <p class="text-xs text-gray-500 dark:text-gray-400">{{ sortedDocuments.length }} document{{
              sortedDocuments.length > 1 ? 's' : '' }}</p>
          </div>
        </div>

        <!-- Légende -->
        <div class="flex flex-wrap items-center gap-4 mb-4 pb-4 border-b border-gray-100 dark:border-gray-700">
          <span class="text-xs font-medium text-gray-500 dark:text-gray-400">Légende :</span>
          <div class="flex items-center gap-1.5">
            <div class="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span class="text-xs text-gray-600 dark:text-gray-400">Reçu</span>
          </div>
          <div class="flex items-center gap-1.5">
            <div class="w-3 h-3 rounded-full bg-gray-400"></div>
            <span class="text-xs text-gray-600 dark:text-gray-400">En attente</span>
          </div>
          <div class="flex items-center gap-1.5">
            <div class="w-3 h-3 rounded-full bg-amber-500"></div>
            <span class="text-xs text-gray-600 dark:text-gray-400">Attention (date prévue dépassée)</span>
          </div>
          <div class="flex items-center gap-1.5">
            <div class="w-3 h-3 rounded-full bg-red-500"></div>
            <span class="text-xs text-gray-600 dark:text-gray-400">En retard (date RC dépassée)</span>
          </div>
        </div>

        <!-- Documents -->
        <div v-if="sortedDocuments.length > 0" class="space-y-3">
          <div v-for="doc in sortedDocuments" :key="doc.id"
            class="group relative p-4 rounded-lg border border-gray-200 dark:border-gray-700 border-l-4 transition-all duration-200 hover:shadow-md cursor-pointer"
            :class="getCardClasses(getDocumentStatus(doc, true).status)" @click="openEditSlideOver(doc)">
            <div class="flex flex-col md:flex-row md:items-center gap-4">
              <!-- Indice et Titre -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-3 mb-1 flex-wrap">
                  <span class="font-mono text-lg font-bold text-gray-900 dark:text-white">{{ doc.indice }}</span>
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border"
                    :class="getStatusClasses(getDocumentStatus(doc, true).status)">
                    <Icon :name="getDocumentStatus(doc, true).icon" size="12" />
                    {{ getDocumentStatus(doc, true).label }}
                  </span>
                  <!-- Indicateur du statut précédent si reçu -->
                  <span
                    v-if="getDocumentStatus(doc, true).status === 'received' && getDocumentStatus(doc, true).previousStatus"
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-sm font-medium"
                    :class="getStatusClasses(getDocumentStatus(doc, true).previousStatus.status)">
                    {{ getPreviousStatusLabel(getDocumentStatus(doc, true).previousStatus) }}
                  </span>
                </div>
                <p v-if="doc.titre" class="text-sm text-gray-600 dark:text-gray-400 truncate">{{ doc.titre }}</p>
                <!-- Observation -->
                <p v-if="doc.observation" class="mt-2 text-xs text-gray-500 dark:text-gray-400 italic line-clamp-2">
                  {{ doc.observation }}
                </p>
              </div>

              <!-- Dates (ordre chronologique) -->
              <div class="flex items-stretch gap-0.5 text-xs self-stretch">
                <template v-for="(dateItem, idx) in getSortedDates(doc)" :key="idx">
                  <div class="flex flex-col items-center justify-center px-3 min-w-[70px] " :class="[
                    dateItem.type === 'prevu' ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300' : '',
                    dateItem.type === 'rc' && (!doc.date_recu && getDaysRemaining(dateItem.date) < 0) ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300' : '',
                    dateItem.type === 'rc' && !(!doc.date_recu && getDaysRemaining(dateItem.date) < 0) ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300' : '',
                    dateItem.type === 'mes' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : '',
                    dateItem.type === 'recu' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300' : '',
                    idx === 0 ? 'rounded-l-lg' : '',
                    idx === getSortedDates(doc).length - 1 ? 'rounded-r-lg' : ''
                  ]">
                    <span class="uppercase tracking-wider font-medium text-xs" :class="[
                      dateItem.type === 'prevu' ? 'text-purple-500' : '',
                      dateItem.type === 'rc' && (!doc.date_recu && getDaysRemaining(dateItem.date) < 0) ? 'text-red-500' : '',
                      dateItem.type === 'rc' && !(!doc.date_recu && getDaysRemaining(dateItem.date) < 0) ? 'text-orange-500' : '',
                      dateItem.type === 'mes' ? 'text-blue-500' : '',
                      dateItem.type === 'recu' ? 'text-emerald-500' : ''
                    ]">{{ dateItem.label }}</span>
                    <span class="font-semibold">{{ formatDate(dateItem.date) }}</span>
                    <span v-if="dateItem.daysRemaining !== null && !doc.date_recu && dateItem.type !== 'recu'"
                      class="text-xs italic"
                      :class="dateItem.daysRemaining < 0 ? 'text-red-500' : dateItem.daysRemaining <= 60 ? 'text-amber-600' : 'text-gray-400'">
                      {{ dateItem.daysRemaining < 0 ? (dateItem.type === 'rc' ? 'Dépassé' :
                        `${Math.abs(dateItem.daysRemaining)}j retard`) : `J-${dateItem.daysRemaining}` }} </span>
                  </div>
                </template>
              </div>

              <!-- Actions -->
              <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button @click.stop="openDeleteModal(doc)"
                  class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-colors">
                  <Icon name="lucide:trash-2" size="16" />
                </button>
              </div>
            </div>


          </div>
        </div>

        <!-- État vide -->
        <div v-else class="text-center py-12">
          <div class="relative inline-block">
            <div
              class="absolute inset-0 bg-linear-to-br from-indigo-200 to-purple-200 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-full blur-2xl opacity-50">
            </div>
            <Icon name="lucide:file-plus" size="64" class="relative text-gray-300 dark:text-gray-600" />
          </div>
          <p class="mt-4 text-lg font-medium text-gray-500 dark:text-gray-400">
            Aucun document d'exécution
          </p>
          <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Ajoutez des DEX pour suivre leur avancement
          </p>
          <button @click="openAddSlideOver"
            class="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors">
            <Icon name="lucide:plus" size="16" />
            Ajouter un DEX
          </button>
        </div>
      </div>
    </div>

    <!-- SlideOver -->
    <AppSlideOver :sideModal="showSlideOver" :closeSideModal="closeSlideOver">
      <AppSlideOverContent v-if="showSlideOver" :closeSideModal="closeSlideOver">
        <template #header>
          <h2 class="text-3xl font-[Pacifico] text-gray-800 dark:text-white">
            {{ editMode ? 'Modifier' : 'Ajouter' }} un DEX
          </h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ editMode ? 'Modifiez les informations du document' : 'Ajoutez un nouveau document d\'exécution' }}
          </p>
        </template>

        <template #default>
          <form @submit.prevent="handleSave" class="space-y-6">
            <!-- Identification -->
            <div class="space-y-4">
              <div class="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                <Icon name="lucide:tag" size="16" class="text-primary-500" />
                <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Identification</h3>
              </div>

              <AppInput v-model="form.indice" name="indice" title="Indice *" placeholder="Ex: DEX-001" />

              <AppInput v-model="form.titre" name="titre" title="Titre" placeholder="Description du document" />
            </div>

            <!-- Dates principales -->
            <div class="space-y-4">
              <div class="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                <Icon name="lucide:calendar" size="16" class="text-primary-500" />
                <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Dates</h3>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AppDatePicker v-model="form.date_mes" title="Date MES" placeholder="Date de mise en service"
                  clearable />

                <!-- Affichage de la date RC calculée -->
                <div v-if="form.date_mes" class="flex flex-col">
                  <label class="block text-sm mb-0.5 text-red-600 dark:text-red-400 font-medium">Date RC
                    (calculée)</label>
                  <div
                    class="flex items-center gap-2 px-3 py-2 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <Icon name="lucide:alert-circle" size="16" class="text-red-500" />
                    <span class="font-semibold text-red-700 dark:text-red-400">
                      {{ formatDate(getDateRc(new Date(form.date_mes))) }}
                    </span>
                    <span class="text-xs text-red-600 dark:text-red-500">(2 mois avant MES)</span>
                  </div>
                </div>
              </div>

              <AppDatePicker v-model="form.date_recu" title="Date de réception" placeholder="Date de réception"
                clearable />
            </div>

            <!-- Dates prévues -->
            <div class="space-y-4">
              <div class="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                <Icon name="lucide:calendar-range" size="16" class="text-primary-500" />
                <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Dates
                  prévues</h3>
              </div>

              <!-- Liste des dates prévues -->
              <div v-if="form.date_prevu.length > 0" class="flex flex-wrap gap-2">
                <div v-for="(dateP, idx) in form.date_prevu" :key="idx"
                  class="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm">
                  <Icon name="lucide:calendar" size="14" class="text-gray-500" />
                  <span class="text-gray-700 dark:text-gray-300">{{ formatDate(dateP) }}</span>
                  <button type="button" @click="removeDatePrevu(idx)"
                    class="ml-1 p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500">
                    <Icon name="lucide:x" size="12" />
                  </button>
                </div>
              </div>
              <p v-else class="text-sm text-gray-400 italic">Aucune date prévue</p>

              <!-- Ajouter une date prévue -->
              <div class="flex items-end gap-2">
                <div class="flex-1">
                  <AppDatePicker v-model="newDatePrevu" title="Nouvelle date prévue" placeholder="Sélectionner..."
                    clearable />
                </div>
                <button type="button" @click="addDatePrevu" :disabled="!newDatePrevu"
                  class=" shrink-0 h-9 w-9 flex items-center justify-center rounded-lg transition-colors" :class="newDatePrevu
                    ? 'bg-linear-to-br from-indigo-300 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white cursor-pointer'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'">
                  <Icon name="lucide:plus" size="18" />
                </button>
              </div>
            </div>

            <!-- Observation -->
            <div class="space-y-4">
              <div class="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                <Icon name="lucide:message-square" size="16" class="text-primary-500" />
                <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Observation
                </h3>
              </div>

              <div class="w-full">
                <textarea v-model="form.observation" rows="3"
                  class="appearance-none border border-gray-300 dark:border-gray-600 text-sm rounded-md py-2 px-3 w-full text-gray-700 dark:text-gray-200 dark:bg-gray-800 leading-tight focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 resize-none"
                  placeholder="Notes, remarques..."></textarea>
              </div>
            </div>
          </form>
        </template>

        <template #footer>
          <div class="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <AppButtonValidated theme="cancel" type="button" @click="closeSlideOver">
              <template #default>Annuler</template>
            </AppButtonValidated>
            <AppButtonValidated theme="primary" type="button" :validated="!!form.indice" @click="handleSave">
              <template #default>{{ editMode ? 'Enregistrer' : 'Ajouter' }}</template>
            </AppButtonValidated>
          </div>
        </template>
      </AppSlideOverContent>
    </AppSlideOver>

    <!-- Modal de confirmation de suppression -->
    <AppModal v-model="showDeleteModal" size="lg" :showCloseButton="false">
      <div class="p-6 text-center">
        <div class="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
          <Icon name="lucide:alert-triangle" size="32" class="text-red-500" />
        </div>

        <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-2">
          Supprimer ce document ?
        </h3>

        <p class="text-gray-500 dark:text-gray-400 mb-2">
          Cette action est irréversible.
        </p>

        <div v-if="itemToDelete" class="mb-6 p-3 rounded-lg bg-gray-100 dark:bg-gray-700/50">
          <p class="font-mono font-bold text-gray-700 dark:text-gray-300">{{ itemToDelete.indice }}</p>
          <p v-if="itemToDelete.titre" class="text-sm text-gray-500 dark:text-gray-400">{{ itemToDelete.titre }}</p>
        </div>

        <div class="flex justify-center gap-3">
          <AppButtonValidated theme="cancel" type="button" @click="closeDeleteModal">
            <template #default>Annuler</template>
          </AppButtonValidated>
          <AppButtonValidated theme="danger" type="button" :validated="true" @click="confirmDelete">
            <template #default>
              <span class="flex items-center gap-2">
                <Icon name="lucide:trash-2" size="16" />
                Supprimer
              </span>
            </template>
          </AppButtonValidated>
        </div>
      </div>
    </AppModal>
  </div>
</template>
