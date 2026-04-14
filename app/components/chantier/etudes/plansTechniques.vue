<script setup>
const props = defineProps({
  chantier: {
    type: Object,
    required: true
  }
});

const {
  getPtByChantier,
  addPt,
  updatePt,
  deletePt,
  getPtStatus,
  formatDate,
  getDaysRemaining
} = useEtudes();
const { setLoader } = useLoader();

const showSlideOver = ref(false);
const editMode = ref(false);
const editingItem = ref(null);

const showDeleteModal = ref(false);
const itemToDelete = ref(null);

const plans = ref([]);

const form = ref({
  indice: '',
  titre: '',
  date_prevu: [],
  date_mes: null,
  date_recu: null,
  observation: ''
});

const newDatePrevu = ref(null);

const sortedPlans = computed(() => {
  return [...plans.value].sort((a, b) => {
    return a.indice.localeCompare(b.indice, 'fr', { numeric: true });
  });
});

const stats = computed(() => {
  const total = plans.value.length;
  const received = plans.value.filter(p => p.date_recu).length;
  const overdue = plans.value.filter(p => getPtStatus(p).status === 'overdue').length;
  const attention = plans.value.filter(p => getPtStatus(p).status === 'attention').length;
  return { total, received, overdue, attention };
});

const loadPlans = async () => {
  if (props.chantier?.id) {
    plans.value = await getPtByChantier(props.chantier.id);
  }
};

const toTimestamp = (date) => {
  if (!date) return null;
  if (typeof date === 'number') return date;
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0).getTime();
};

const toDateForDB = (timestamp) => {
  if (!timestamp) return null;
  const d = new Date(timestamp);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const openAddSlideOver = () => {
  editMode.value = false;
  editingItem.value = null;
  form.value = { indice: '', titre: '', date_prevu: [], date_mes: null, date_recu: null, observation: '' };
  newDatePrevu.value = null;
  showSlideOver.value = true;
};

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

const closeSlideOver = () => {
  showSlideOver.value = false;
  editMode.value = false;
  editingItem.value = null;
};

const addDatePrevu = () => {
  if (newDatePrevu.value) {
    const dateStr = toDateForDB(newDatePrevu.value);
    if (dateStr && !form.value.date_prevu.includes(dateStr)) {
      form.value.date_prevu.push(dateStr);
    }
    newDatePrevu.value = null;
  }
};

const removeDatePrevu = (index) => {
  form.value.date_prevu.splice(index, 1);
};

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
      const result = await updatePt(editingItem.value.id, data);
      if (result) { await loadPlans(); closeSlideOver(); }
    } else {
      const result = await addPt(props.chantier.id, data);
      if (result) { await loadPlans(); closeSlideOver(); }
    }
  } finally {
    setLoader(false);
  }
};

const openDeleteModal = (item) => {
  itemToDelete.value = item;
  showDeleteModal.value = true;
};

const closeDeleteModal = () => {
  showDeleteModal.value = false;
  itemToDelete.value = null;
};

const confirmDelete = async () => {
  if (!itemToDelete.value) return;
  setLoader(true);
  try {
    const success = await deletePt(itemToDelete.value.id);
    if (success) { await loadPlans(); closeDeleteModal(); }
  } finally {
    setLoader(false);
  }
};

const getStatusClasses = (status) => {
  const colors = {
    received: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700',
    attention: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-700',
    overdue:   'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-700',
    pending:   'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-600'
  };
  return colors[status] || colors.pending;
};

const getStatusBarClass = (status) => {
  const colors = {
    received: 'bg-emerald-500',
    attention: 'bg-amber-500',
    overdue:   'bg-red-500',
    pending:   'bg-gray-300 dark:bg-gray-600'
  };
  return colors[status] || colors.pending;
};

const getStatusDotClass = (status) => {
  const colors = {
    received: 'bg-emerald-500',
    attention: 'bg-amber-500',
    overdue:   'bg-red-500',
    pending:   'bg-gray-400'
  };
  return colors[status] || colors.pending;
};

const getPreviousStatusLabel = (previousStatus) => {
  if (!previousStatus) return '';
  const labels = {
    pending:   'dans les temps',
    attention: 'avec retard sur prévision',
    overdue:   'après la date MES'
  };
  return labels[previousStatus.status] || '';
};

const getSortedDates = (plan) => {
  const dates = [];
  if (plan.date_prevu && plan.date_prevu.length > 0) {
    plan.date_prevu.forEach((dateP, idx) => {
      dates.push({
        type: 'prevu',
        label: plan.date_prevu.length > 1 ? `Prévu ${idx + 1}` : 'Prévu',
        date: dateP,
        sortDate: new Date(dateP),
        daysRemaining: getDaysRemaining(dateP)
      });
    });
  }
  if (plan.date_mes) {
    dates.push({
      type: 'mes',
      label: 'MES',
      date: plan.date_mes,
      sortDate: new Date(plan.date_mes),
      daysRemaining: getDaysRemaining(plan.date_mes)
    });
  }
  if (plan.date_recu) {
    dates.push({
      type: 'recu',
      label: 'Reçu',
      date: plan.date_recu,
      sortDate: new Date(plan.date_recu),
      daysRemaining: null
    });
  }
  return dates.sort((a, b) => a.sortDate - b.sortDate);
};

onMounted(loadPlans);
watch(() => props.chantier?.id, loadPlans);
</script>

<template>
  <div class="flex flex-col h-full overflow-auto bg-gray-50 dark:bg-gray-950">

    <!-- ══════════ HEADER ══════════ -->
    <div class="flex flex-col lg:flex-row gap-4 items-center justify-between p-4">
      <AppTitleMain title="Plans techniques" description="Suivi des PT du chantier" />
      <AppButtonValidated type="button" theme="primary" @click="openAddSlideOver">
        <template #default>
          <span class="flex items-center gap-2">
            <Icon name="lucide:plus" size="16" />
            Ajouter un PT
          </span>
        </template>
      </AppButtonValidated>
    </div>

    <!-- ══════════ STATS ══════════ -->
    <div class="mx-4 mb-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div class="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-gray-100 dark:divide-gray-700">
        <div class="flex items-center gap-3 px-5 py-4">
          <div class="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0">
            <Icon name="lucide:map" size="18" class="text-gray-500 dark:text-gray-400" />
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
      <div v-if="sortedPlans.length === 0" class="flex flex-col items-center justify-center py-20 text-center">
        <div class="relative mb-6">
          <div class="w-20 h-20 rounded-2xl bg-white dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center shadow-sm">
            <Icon name="lucide:map-pin-plus" size="36" class="text-gray-300 dark:text-gray-600" />
          </div>
          <div class="absolute -top-1 -right-1 w-6 h-6 bg-sky-500 rounded-full flex items-center justify-center shadow-sm">
            <Icon name="lucide:plus" size="14" class="text-white" />
          </div>
        </div>
        <p class="text-base font-semibold text-gray-600 dark:text-gray-300">Aucun plan technique</p>
        <p class="text-sm text-gray-400 dark:text-gray-500 mt-1 mb-5">Ajoutez des PT pour suivre leur avancement</p>
        <button @click="openAddSlideOver"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium transition-colors">
          <Icon name="lucide:plus" size="14" />
          Ajouter un PT
        </button>
      </div>

      <!-- Plans -->
      <div v-for="plan in sortedPlans" :key="plan.id"
        class="pt-row group relative flex items-stretch bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden cursor-pointer transition-all duration-150 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600"
        @click="openEditSlideOver(plan)">

        <!-- Barre de statut colorée -->
        <div class="w-1 shrink-0 transition-all duration-300"
          :class="[
            getStatusBarClass(getPtStatus(plan).status),
            getPtStatus(plan).status === 'attention' ? 'bar-pulse-amber' : '',
            getPtStatus(plan).status === 'overdue'   ? 'bar-pulse-red'   : ''
          ]">
        </div>

        <!-- Corps du plan -->
        <div class="flex-1 flex flex-col md:flex-row md:items-center gap-3 px-4 py-3 min-w-0">

          <!-- Indice + badge -->
          <div class="flex items-center gap-3 shrink-0">
            <span class="font-mono text-base font-bold text-gray-900 dark:text-white w-16 truncate">
              {{ plan.indice }}
            </span>
            <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border"
              :class="getStatusClasses(getPtStatus(plan).status)">
              <span class="w-1.5 h-1.5 rounded-full shrink-0"
                :class="[
                  getStatusDotClass(getPtStatus(plan).status),
                  getPtStatus(plan).status === 'attention' ? 'pulse-dot' : ''
                ]">
              </span>
              {{ getPtStatus(plan).label }}
              <span v-if="getPtStatus(plan).status === 'received' && getPtStatus(plan).previousStatus"
                class="opacity-60">
                · {{ getPreviousStatusLabel(getPtStatus(plan).previousStatus) }}
              </span>
            </span>
          </div>

          <!-- Titre + observation -->
          <div class="flex-1 min-w-0">
            <p v-if="plan.titre" class="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
              {{ plan.titre }}
            </p>
            <p v-else class="text-sm text-gray-400 dark:text-gray-500 italic">Sans titre</p>
            <p v-if="plan.observation" class="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">
              {{ plan.observation }}
            </p>
          </div>

          <!-- Pipeline de dates -->
          <div class="flex items-center gap-0 shrink-0 self-start md:self-center">
            <template v-if="getSortedDates(plan).length === 0">
              <span class="text-xs text-gray-300 dark:text-gray-600 italic">Aucune date</span>
            </template>
            <template v-for="(dateItem, idx) in getSortedDates(plan)" :key="idx">
              <!-- Connecteur -->
              <div v-if="idx > 0" class="w-4 h-px shrink-0"
                :class="dateItem.type === 'recu' ? 'bg-emerald-300 dark:bg-emerald-700' : 'bg-gray-200 dark:bg-gray-700'">
              </div>
              <!-- Chip de date -->
              <div class="flex flex-col items-center px-2.5 py-1 rounded-md text-xs font-medium leading-tight"
                :class="[
                  dateItem.type === 'prevu' ? 'bg-purple-50  dark:bg-purple-900/20 text-purple-700 dark:text-purple-300' : '',
                  dateItem.type === 'mes'   ? 'bg-blue-50    dark:bg-blue-900/20   text-blue-700   dark:text-blue-300'   : '',
                  dateItem.type === 'recu'  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300' : '',
                ]">
                <span class="text-[10px] uppercase tracking-wider opacity-60 font-semibold">{{ dateItem.label }}</span>
                <span class="font-bold tabular-nums">{{ formatDate(dateItem.date) }}</span>
                <span v-if="dateItem.daysRemaining !== null && !plan.date_recu"
                  class="text-[10px] font-normal"
                  :class="dateItem.daysRemaining < 0 ? 'text-red-500' : dateItem.daysRemaining <= 30 ? 'text-amber-500' : 'opacity-50'">
                  {{ dateItem.daysRemaining < 0 ? `${Math.abs(dateItem.daysRemaining)}j` : `J-${dateItem.daysRemaining}` }}
                </span>
              </div>
            </template>
          </div>
        </div>

        <!-- Action suppression (hover) -->
        <div class="shrink-0 flex items-center px-3 opacity-0 group-hover:opacity-100 transition-opacity duration-150 border-l border-gray-100 dark:border-gray-700">
          <button @click.stop="openDeleteModal(plan)"
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
            <div class="w-8 h-8 rounded-lg bg-linear-to-br from-sky-500 to-blue-600 flex items-center justify-center shrink-0">
              <Icon name="lucide:map" size="15" class="text-white" />
            </div>
            <div>
              <h2 class="text-2xl font-[Bangers] tracking-wider text-gray-800 dark:text-white leading-none">
                {{ editMode ? 'Modifier le PT' : 'Nouveau PT' }}
              </h2>
              <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {{ editMode ? 'Mettez à jour les informations du plan' : 'Ajoutez un nouveau plan technique' }}
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
              <AppInput v-model="form.indice" name="indice" title="Indice *" placeholder="Ex: 34.1" />
              <AppInput v-model="form.titre" name="titre" title="Titre" placeholder="Nom du plan technique" />
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
                class="appearance-none border border-gray-200 dark:border-gray-600 text-sm rounded-lg py-2.5 px-3 w-full text-gray-700 dark:text-gray-200 dark:bg-gray-800 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 resize-none transition-colors"
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
        <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-1">Supprimer ce plan ?</h3>
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
/* Pulsation douce pour les statuts urgents */
@keyframes pulse-soft {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.45; }
}

@keyframes pulse-bar {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.6; }
}

.pulse-dot {
  animation: pulse-soft 1.8s ease-in-out infinite;
}

.bar-pulse-amber {
  animation: pulse-bar 2.2s ease-in-out infinite;
}

.bar-pulse-red {
  animation: pulse-bar 1.6s ease-in-out infinite;
}

/* Hover lift pour les rows */
.pt-row {
  transform: translateY(0);
}
.pt-row:hover {
  transform: translateY(-1px);
}
</style>
