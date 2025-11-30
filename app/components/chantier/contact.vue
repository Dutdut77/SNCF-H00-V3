<script setup>
const props = defineProps({
  chantier: {
    type: Object,
    required: true
  }
});

const {
  getContactsGeneralites,
  upsertContactsGeneralites,
  getContactsTravaux,
  upsertContactsTravaux,
  getContactsEntreprises,
  addContactEntreprise,
  updateContactEntreprise,
  deleteContactEntreprise,
  getContactsEtudes,
  upsertContactsEtudes,
  getContactsAutres,
  addContactAutre,
  updateContactAutre,
  deleteContactAutre
} = useContacts();

const { getAllUsers, users } = useUsers();
const { setLoader } = useLoader();

// Onglet actif
const activeTab = ref('generalites');
const tabs = [
  { id: 'generalites', label: 'Généralités', icon: 'lucide:user-circle' },
  { id: 'travaux', label: 'Travaux', icon: 'lucide:hard-hat' },
  { id: 'entreprises', label: 'Entreprises', icon: 'lucide:building-2' },
  { id: 'etudes', label: 'Études', icon: 'lucide:book-open' },
  { id: 'autres', label: 'Autres', icon: 'lucide:users' }
];

// États des données
const contactsGeneralites = ref(null);
const contactsTravaux = ref(null);
const contactsEntreprises = ref([]);
const contactsEtudes = ref(null);
const contactsAutres = ref([]);

// États des SlideOver
const showEditGeneralites = ref(false);
const showEditTravaux = ref(false);
const showEditEtudes = ref(false);
const showAddEntreprise = ref(false);
const showEditEntreprise = ref(false);
const showAddAutre = ref(false);
const showEditAutre = ref(false);

// Formulaires d'édition
const editFormGeneralites = ref({
  chef_projet_nom: '',
  chef_projet_email: '',
  coordinateur_securite_nom: '',
  coordinateur_securite_email: ''
});

const editFormTravaux = ref({
  rlt_voie_principale: null,
  rlt_voie_secondaire: [],
  rlt_ses_principale: null,
  rlt_ses_secondaire: [],
  rlt_cat_principale: null,
  rlt_cat_secondaire: [],
  preop_voie: null,
  preop_ses: null,
  logistique: null,
  supervisor: []
});

const editFormEtudes = ref({
  plan_technique_nom: '',
  plan_technique_email: '',
  documents_execution_nom: '',
  documents_execution_email: ''
});

const editFormEntreprise = ref({
  id: null,
  metier: '',
  entreprise: '',
  responsable_nom: '',
  responsable_email: ''
});

const editFormAutre = ref({
  id: null,
  metier: '',
  entreprise: '',
  responsable_nom: '',
  responsable_email: ''
});

// Options utilisateurs pour les selects (travaux)
const userOptions = computed(() => {
  return users.value.map(u => ({
    id: u.id,
    label: u.prenom && u.nom ? `${u.prenom} ${u.nom}` : u.email
  }));
});

// Charger toutes les données
const loadAllData = async () => {
  setLoader(true);
  try {
    await getAllUsers();
    const [gen, trav, ent, etu, aut] = await Promise.all([
      getContactsGeneralites(props.chantier.id),
      getContactsTravaux(props.chantier.id),
      getContactsEntreprises(props.chantier.id),
      getContactsEtudes(props.chantier.id),
      getContactsAutres(props.chantier.id)
    ]);
    contactsGeneralites.value = gen;
    contactsTravaux.value = trav;
    contactsEntreprises.value = ent;
    contactsEtudes.value = etu;
    contactsAutres.value = aut;
  } finally {
    setLoader(false);
  }
};

// Obtenir le nom d'un utilisateur par son ID
const getUserName = (userId) => {
  if (!userId) return '-';
  const user = users.value.find(u => u.id === userId);
  if (!user) return '-';
  return user.prenom && user.nom ? `${user.prenom} ${user.nom}` : user.email;
};

// Obtenir plusieurs noms d'utilisateurs
const getUserNames = (userIds) => {
  if (!userIds || userIds.length === 0) return '-';
  return userIds.map(id => getUserName(id)).filter(n => n !== '-').join(', ') || '-';
};

// ============================================
// GÉNÉRALITÉS
// ============================================
const openEditGeneralites = () => {
  editFormGeneralites.value = {
    chef_projet_nom: contactsGeneralites.value?.chef_projet_nom || '',
    chef_projet_email: contactsGeneralites.value?.chef_projet_email || '',
    coordinateur_securite_nom: contactsGeneralites.value?.coordinateur_securite_nom || '',
    coordinateur_securite_email: contactsGeneralites.value?.coordinateur_securite_email || ''
  };
  showEditGeneralites.value = true;
};

const saveGeneralites = async () => {
  setLoader(true);
  try {
    const result = await upsertContactsGeneralites(props.chantier.id, editFormGeneralites.value);
    if (result) {
      contactsGeneralites.value = result;
      showEditGeneralites.value = false;
    }
  } finally {
    setLoader(false);
  }
};

// ============================================
// TRAVAUX
// ============================================
const openEditTravaux = () => {
  editFormTravaux.value = {
    rlt_voie_principale: contactsTravaux.value?.rlt_voie_principale || null,
    rlt_voie_secondaire: contactsTravaux.value?.rlt_voie_secondaire || [],
    rlt_ses_principale: contactsTravaux.value?.rlt_ses_principale || null,
    rlt_ses_secondaire: contactsTravaux.value?.rlt_ses_secondaire || [],
    rlt_cat_principale: contactsTravaux.value?.rlt_cat_principale || null,
    rlt_cat_secondaire: contactsTravaux.value?.rlt_cat_secondaire || [],
    preop_voie: contactsTravaux.value?.preop_voie || null,
    preop_ses: contactsTravaux.value?.preop_ses || null,
    logistique: contactsTravaux.value?.logistique || null,
    supervisor: contactsTravaux.value?.supervisor || []
  };
  showEditTravaux.value = true;
};

const saveTravaux = async () => {
  setLoader(true);
  try {
    const result = await upsertContactsTravaux(props.chantier.id, editFormTravaux.value);
    if (result) {
      contactsTravaux.value = result;
      showEditTravaux.value = false;
    }
  } finally {
    setLoader(false);
  }
};

// Ajouter/Retirer utilisateur secondaire
const toggleSecondaire = (field, userId) => {
  const arr = editFormTravaux.value[field];
  const idx = arr.indexOf(userId);
  if (idx === -1) {
    arr.push(userId);
  } else {
    arr.splice(idx, 1);
  }
};

const toggleSupervisor = (userId) => {
  const arr = editFormTravaux.value.supervisor;
  const idx = arr.indexOf(userId);
  if (idx === -1) {
    arr.push(userId);
  } else {
    arr.splice(idx, 1);
  }
};

// ============================================
// ENTREPRISES
// ============================================
const openAddEntreprise = () => {
  editFormEntreprise.value = {
    id: null,
    metier: '',
    entreprise: '',
    responsable_nom: '',
    responsable_email: ''
  };
  showAddEntreprise.value = true;
};

const openEditEntreprise = (contact) => {
  editFormEntreprise.value = {
    id: contact.id,
    metier: contact.metier || '',
    entreprise: contact.entreprise || '',
    responsable_nom: contact.responsable_nom || '',
    responsable_email: contact.responsable_email || ''
  };
  showEditEntreprise.value = true;
};

const saveEntreprise = async () => {
  setLoader(true);
  try {
    let result;
    if (editFormEntreprise.value.id) {
      result = await updateContactEntreprise(editFormEntreprise.value.id, editFormEntreprise.value);
    } else {
      result = await addContactEntreprise(props.chantier.id, editFormEntreprise.value);
    }
    if (result) {
      contactsEntreprises.value = await getContactsEntreprises(props.chantier.id);
      showAddEntreprise.value = false;
      showEditEntreprise.value = false;
    }
  } finally {
    setLoader(false);
  }
};

const handleDeleteEntreprise = async (id) => {
  if (!confirm('Supprimer ce contact entreprise ?')) return;
  setLoader(true);
  try {
    const success = await deleteContactEntreprise(id);
    if (success) {
      contactsEntreprises.value = await getContactsEntreprises(props.chantier.id);
    }
  } finally {
    setLoader(false);
  }
};

// ============================================
// ÉTUDES
// ============================================
const openEditEtudes = () => {
  editFormEtudes.value = {
    plan_technique_nom: contactsEtudes.value?.plan_technique_nom || '',
    plan_technique_email: contactsEtudes.value?.plan_technique_email || '',
    documents_execution_nom: contactsEtudes.value?.documents_execution_nom || '',
    documents_execution_email: contactsEtudes.value?.documents_execution_email || ''
  };
  showEditEtudes.value = true;
};

const saveEtudes = async () => {
  setLoader(true);
  try {
    const result = await upsertContactsEtudes(props.chantier.id, editFormEtudes.value);
    if (result) {
      contactsEtudes.value = result;
      showEditEtudes.value = false;
    }
  } finally {
    setLoader(false);
  }
};

// ============================================
// AUTRES
// ============================================
const openAddAutre = () => {
  editFormAutre.value = {
    id: null,
    metier: '',
    entreprise: '',
    responsable_nom: '',
    responsable_email: ''
  };
  showAddAutre.value = true;
};

const openEditAutre = (contact) => {
  editFormAutre.value = {
    id: contact.id,
    metier: contact.metier || '',
    entreprise: contact.entreprise || '',
    responsable_nom: contact.responsable_nom || '',
    responsable_email: contact.responsable_email || ''
  };
  showEditAutre.value = true;
};

const saveAutre = async () => {
  setLoader(true);
  try {
    let result;
    if (editFormAutre.value.id) {
      result = await updateContactAutre(editFormAutre.value.id, editFormAutre.value);
    } else {
      result = await addContactAutre(props.chantier.id, editFormAutre.value);
    }
    if (result) {
      contactsAutres.value = await getContactsAutres(props.chantier.id);
      showAddAutre.value = false;
      showEditAutre.value = false;
    }
  } finally {
    setLoader(false);
  }
};

const handleDeleteAutre = async (id) => {
  if (!confirm('Supprimer ce contact ?')) return;
  setLoader(true);
  try {
    const success = await deleteContactAutre(id);
    if (success) {
      contactsAutres.value = await getContactsAutres(props.chantier.id);
    }
  } finally {
    setLoader(false);
  }
};

// Charger au montage
onMounted(loadAllData);
watch(() => props.chantier?.id, loadAllData);
</script>

<template>
  <div class="space-y-4">
    <!-- Header avec titre -->
    <AppTitleMain title="Contacts" description="Gestion des contacts du chantier" />

    <!-- Tabs de navigation -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700">
      <div class="border-b border-gray-200 dark:border-gray-700">
        <nav class="flex -mb-px overflow-x-auto">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            class="flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors"
            :class="activeTab === tab.id 
              ? 'border-primary-500 text-primary-600 dark:text-primary-400' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'"
          >
            <Icon :name="tab.icon" size="18" />
            {{ tab.label }}
          </button>
        </nav>
      </div>

      <div class="p-6">
        <!-- ============================================ -->
        <!-- TAB GÉNÉRALITÉS -->
        <!-- ============================================ -->
        <div v-if="activeTab === 'generalites'" class="space-y-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-br from-violet-100 to-purple-200 dark:from-violet-900/50 dark:to-purple-800/50">
                <Icon name="lucide:user-circle" size="20" class="text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <h2 class="text-lg font-bold text-gray-800 dark:text-gray-100">Contacts généraux</h2>
                <p class="text-xs text-gray-500 dark:text-gray-400">Chef de projet et coordinateur sécurité</p>
              </div>
            </div>
            <AppButtonValidated type="button" theme="primary" @click="openEditGeneralites">
              <template #default>
                <span class="flex items-center gap-2">
                  <Icon name="lucide:pencil" size="16" />
                  Modifier
                </span>
              </template>
            </AppButtonValidated>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Chef de projet -->
            <div class="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-100 dark:border-gray-600">
              <div class="flex items-center gap-2 mb-3">
                <Icon name="lucide:briefcase" size="16" class="text-violet-500" />
                <label class="text-xs font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wider">Chef de projet</label>
              </div>
              <p class="text-base font-semibold text-gray-900 dark:text-white">
                {{ contactsGeneralites?.chef_projet_nom || '-' }}
              </p>
              <a 
                v-if="contactsGeneralites?.chef_projet_email"
                :href="`mailto:${contactsGeneralites.chef_projet_email}`"
                class="text-sm text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1 mt-1"
              >
                <Icon name="lucide:mail" size="14" />
                {{ contactsGeneralites.chef_projet_email }}
              </a>
              <p v-else class="text-sm text-gray-400">Aucun email</p>
            </div>

            <!-- Coordinateur sécurité -->
            <div class="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-100 dark:border-gray-600">
              <div class="flex items-center gap-2 mb-3">
                <Icon name="lucide:shield-check" size="16" class="text-emerald-500" />
                <label class="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Coordinateur sécurité</label>
              </div>
              <p class="text-base font-semibold text-gray-900 dark:text-white">
                {{ contactsGeneralites?.coordinateur_securite_nom || '-' }}
              </p>
              <a 
                v-if="contactsGeneralites?.coordinateur_securite_email"
                :href="`mailto:${contactsGeneralites.coordinateur_securite_email}`"
                class="text-sm text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 mt-1"
              >
                <Icon name="lucide:mail" size="14" />
                {{ contactsGeneralites.coordinateur_securite_email }}
              </a>
              <p v-else class="text-sm text-gray-400">Aucun email</p>
            </div>
          </div>
        </div>

        <!-- ============================================ -->
        <!-- TAB TRAVAUX -->
        <!-- ============================================ -->
        <div v-else-if="activeTab === 'travaux'" class="space-y-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-br from-amber-100 to-orange-200 dark:from-amber-900/50 dark:to-orange-800/50">
                <Icon name="lucide:hard-hat" size="20" class="text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h2 class="text-lg font-bold text-gray-800 dark:text-gray-100">Équipe travaux</h2>
                <p class="text-xs text-gray-500 dark:text-gray-400">RLT, Pré-op, Logistique et Superviseurs</p>
              </div>
            </div>
            <AppButtonValidated type="button" theme="primary" @click="openEditTravaux">
              <template #default>
                <span class="flex items-center gap-2">
                  <Icon name="lucide:pencil" size="16" />
                  Modifier
                </span>
              </template>
            </AppButtonValidated>
          </div>

          <!-- RLT Voie -->
          <div class="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-100 dark:border-gray-600">
            <div class="flex items-center gap-2 mb-3">
              <Icon name="lucide:train-track" size="16" class="text-blue-500" />
              <label class="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">RLT Voie</label>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p class="text-xs text-gray-500 mb-1">Principal</p>
                <p class="text-base font-semibold text-gray-900 dark:text-white">{{ getUserName(contactsTravaux?.rlt_voie_principale) }}</p>
              </div>
              <div>
                <p class="text-xs text-gray-500 mb-1">Secondaire(s)</p>
                <p class="text-base font-semibold text-gray-900 dark:text-white">{{ getUserNames(contactsTravaux?.rlt_voie_secondaire) }}</p>
              </div>
            </div>
          </div>

          <!-- RLT SES -->
          <div class="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-100 dark:border-gray-600">
            <div class="flex items-center gap-2 mb-3">
              <Icon name="lucide:zap" size="16" class="text-yellow-500" />
              <label class="text-xs font-semibold text-yellow-600 dark:text-yellow-400 uppercase tracking-wider">RLT SES</label>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p class="text-xs text-gray-500 mb-1">Principal</p>
                <p class="text-base font-semibold text-gray-900 dark:text-white">{{ getUserName(contactsTravaux?.rlt_ses_principale) }}</p>
              </div>
              <div>
                <p class="text-xs text-gray-500 mb-1">Secondaire(s)</p>
                <p class="text-base font-semibold text-gray-900 dark:text-white">{{ getUserNames(contactsTravaux?.rlt_ses_secondaire) }}</p>
              </div>
            </div>
          </div>

          <!-- RLT CAT -->
          <div class="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-100 dark:border-gray-600">
            <div class="flex items-center gap-2 mb-3">
              <Icon name="lucide:cable" size="16" class="text-rose-500" />
              <label class="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">RLT CAT</label>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p class="text-xs text-gray-500 mb-1">Principal</p>
                <p class="text-base font-semibold text-gray-900 dark:text-white">{{ getUserName(contactsTravaux?.rlt_cat_principale) }}</p>
              </div>
              <div>
                <p class="text-xs text-gray-500 mb-1">Secondaire(s)</p>
                <p class="text-base font-semibold text-gray-900 dark:text-white">{{ getUserNames(contactsTravaux?.rlt_cat_secondaire) }}</p>
              </div>
            </div>
          </div>

          <!-- Pré-op & Logistique -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-100 dark:border-gray-600">
              <div class="flex items-center gap-2 mb-3">
                <Icon name="lucide:clipboard-check" size="16" class="text-indigo-500" />
                <label class="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Pré-op Voie</label>
              </div>
              <p class="text-base font-semibold text-gray-900 dark:text-white">{{ getUserName(contactsTravaux?.preop_voie) }}</p>
            </div>
            <div class="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-100 dark:border-gray-600">
              <div class="flex items-center gap-2 mb-3">
                <Icon name="lucide:clipboard-check" size="16" class="text-indigo-500" />
                <label class="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Pré-op SES</label>
              </div>
              <p class="text-base font-semibold text-gray-900 dark:text-white">{{ getUserName(contactsTravaux?.preop_ses) }}</p>
            </div>
            <div class="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-100 dark:border-gray-600">
              <div class="flex items-center gap-2 mb-3">
                <Icon name="lucide:truck" size="16" class="text-teal-500" />
                <label class="text-xs font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wider">Logistique</label>
              </div>
              <p class="text-base font-semibold text-gray-900 dark:text-white">{{ getUserName(contactsTravaux?.logistique) }}</p>
            </div>
          </div>

          <!-- Superviseurs -->
          <div class="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-100 dark:border-gray-600">
            <div class="flex items-center gap-2 mb-3">
              <Icon name="lucide:eye" size="16" class="text-purple-500" />
              <label class="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Superviseurs</label>
            </div>
            <p class="text-base font-semibold text-gray-900 dark:text-white">{{ getUserNames(contactsTravaux?.supervisor) }}</p>
          </div>
        </div>

        <!-- ============================================ -->
        <!-- TAB ENTREPRISES -->
        <!-- ============================================ -->
        <div v-else-if="activeTab === 'entreprises'" class="space-y-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-br from-cyan-100 to-blue-200 dark:from-cyan-900/50 dark:to-blue-800/50">
                <Icon name="lucide:building-2" size="20" class="text-cyan-600 dark:text-cyan-400" />
              </div>
              <div>
                <h2 class="text-lg font-bold text-gray-800 dark:text-gray-100">Entreprises</h2>
                <p class="text-xs text-gray-500 dark:text-gray-400">Entreprises intervenantes sur le chantier</p>
              </div>
            </div>
            <AppButtonValidated type="button" theme="primary" @click="openAddEntreprise">
              <template #default>
                <span class="flex items-center gap-2">
                  <Icon name="lucide:plus" size="16" />
                  Ajouter
                </span>
              </template>
            </AppButtonValidated>
          </div>

          <!-- Liste des entreprises -->
          <div v-if="contactsEntreprises.length > 0" class="space-y-3">
            <div 
              v-for="contact in contactsEntreprises" 
              :key="contact.id"
              class="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-100 dark:border-gray-600 hover:border-cyan-300 dark:hover:border-cyan-700 transition-colors"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-2">
                    <span class="px-2 py-0.5 text-xs font-medium rounded-full bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-400">
                      {{ contact.metier || 'Non défini' }}
                    </span>
                  </div>
                  <p class="text-lg font-bold text-gray-900 dark:text-white">{{ contact.entreprise || '-' }}</p>
                  <div class="mt-2 space-y-1">
                    <p class="text-sm text-gray-600 dark:text-gray-300">
                      <span class="text-gray-400">Responsable:</span> {{ contact.responsable_nom || '-' }}
                    </p>
                    <a 
                      v-if="contact.responsable_email"
                      :href="`mailto:${contact.responsable_email}`"
                      class="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
                    >
                      <Icon name="lucide:mail" size="14" />
                      {{ contact.responsable_email }}
                    </a>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <button 
                    @click="openEditEntreprise(contact)"
                    class="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 hover:text-primary-600 transition-colors"
                  >
                    <Icon name="lucide:pencil" size="16" />
                  </button>
                  <button 
                    @click="handleDeleteEntreprise(contact.id)"
                    class="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-500 hover:text-red-600 transition-colors"
                  >
                    <Icon name="lucide:trash-2" size="16" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- État vide -->
          <div v-else class="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-500">
            <Icon name="lucide:building-2" size="48" class="mb-4 opacity-50" />
            <p class="text-lg font-medium">Aucune entreprise</p>
            <p class="text-sm">Cliquez sur "Ajouter" pour créer un contact</p>
          </div>
        </div>

        <!-- ============================================ -->
        <!-- TAB ÉTUDES -->
        <!-- ============================================ -->
        <div v-else-if="activeTab === 'etudes'" class="space-y-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-br from-emerald-100 to-green-200 dark:from-emerald-900/50 dark:to-green-800/50">
                <Icon name="lucide:book-open" size="20" class="text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h2 class="text-lg font-bold text-gray-800 dark:text-gray-100">Contacts études</h2>
                <p class="text-xs text-gray-500 dark:text-gray-400">Plans techniques et documents d'exécution</p>
              </div>
            </div>
            <AppButtonValidated type="button" theme="primary" @click="openEditEtudes">
              <template #default>
                <span class="flex items-center gap-2">
                  <Icon name="lucide:pencil" size="16" />
                  Modifier
                </span>
              </template>
            </AppButtonValidated>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Plans techniques -->
            <div class="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-100 dark:border-gray-600">
              <div class="flex items-center gap-2 mb-3">
                <Icon name="lucide:file-text" size="16" class="text-emerald-500" />
                <label class="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Plans techniques</label>
              </div>
              <p class="text-base font-semibold text-gray-900 dark:text-white">
                {{ contactsEtudes?.plan_technique_nom || '-' }}
              </p>
              <a 
                v-if="contactsEtudes?.plan_technique_email"
                :href="`mailto:${contactsEtudes.plan_technique_email}`"
                class="text-sm text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 mt-1"
              >
                <Icon name="lucide:mail" size="14" />
                {{ contactsEtudes.plan_technique_email }}
              </a>
              <p v-else class="text-sm text-gray-400">Aucun email</p>
            </div>

            <!-- Documents d'exécution -->
            <div class="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-100 dark:border-gray-600">
              <div class="flex items-center gap-2 mb-3">
                <Icon name="lucide:folder-open" size="16" class="text-blue-500" />
                <label class="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Documents d'exécution</label>
              </div>
              <p class="text-base font-semibold text-gray-900 dark:text-white">
                {{ contactsEtudes?.documents_execution_nom || '-' }}
              </p>
              <a 
                v-if="contactsEtudes?.documents_execution_email"
                :href="`mailto:${contactsEtudes.documents_execution_email}`"
                class="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 mt-1"
              >
                <Icon name="lucide:mail" size="14" />
                {{ contactsEtudes.documents_execution_email }}
              </a>
              <p v-else class="text-sm text-gray-400">Aucun email</p>
            </div>
          </div>
        </div>

        <!-- ============================================ -->
        <!-- TAB AUTRES -->
        <!-- ============================================ -->
        <div v-else-if="activeTab === 'autres'" class="space-y-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-br from-slate-100 to-gray-200 dark:from-slate-800 dark:to-gray-700">
                <Icon name="lucide:users" size="20" class="text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <h2 class="text-lg font-bold text-gray-800 dark:text-gray-100">Autres contacts</h2>
                <p class="text-xs text-gray-500 dark:text-gray-400">Contacts divers du chantier</p>
              </div>
            </div>
            <AppButtonValidated type="button" theme="primary" @click="openAddAutre">
              <template #default>
                <span class="flex items-center gap-2">
                  <Icon name="lucide:plus" size="16" />
                  Ajouter
                </span>
              </template>
            </AppButtonValidated>
          </div>

          <!-- Liste des autres contacts -->
          <div v-if="contactsAutres.length > 0" class="space-y-3">
            <div 
              v-for="contact in contactsAutres" 
              :key="contact.id"
              class="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-100 dark:border-gray-600 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-2">
                    <span class="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400">
                      {{ contact.metier || 'Non défini' }}
                    </span>
                  </div>
                  <p class="text-lg font-bold text-gray-900 dark:text-white">{{ contact.entreprise || '-' }}</p>
                  <div class="mt-2 space-y-1">
                    <p class="text-sm text-gray-600 dark:text-gray-300">
                      <span class="text-gray-400">Responsable:</span> {{ contact.responsable_nom || '-' }}
                    </p>
                    <a 
                      v-if="contact.responsable_email"
                      :href="`mailto:${contact.responsable_email}`"
                      class="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
                    >
                      <Icon name="lucide:mail" size="14" />
                      {{ contact.responsable_email }}
                    </a>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <button 
                    @click="openEditAutre(contact)"
                    class="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 hover:text-primary-600 transition-colors"
                  >
                    <Icon name="lucide:pencil" size="16" />
                  </button>
                  <button 
                    @click="handleDeleteAutre(contact.id)"
                    class="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-500 hover:text-red-600 transition-colors"
                  >
                    <Icon name="lucide:trash-2" size="16" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- État vide -->
          <div v-else class="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-500">
            <Icon name="lucide:users" size="48" class="mb-4 opacity-50" />
            <p class="text-lg font-medium">Aucun autre contact</p>
            <p class="text-sm">Cliquez sur "Ajouter" pour créer un contact</p>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- SLIDEOVER GÉNÉRALITÉS -->
    <!-- ============================================ -->
    <AppSlideOver :sideModal="showEditGeneralites" :closeSideModal="() => showEditGeneralites = false">
      <AppSlideOverContent v-if="showEditGeneralites" :closeSideModal="() => showEditGeneralites = false">
        <template #header>
          <h2 class="text-3xl font-[Pacifico] text-gray-800 dark:text-white">Contacts généraux</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">Modifier les contacts généraux du chantier</p>
        </template>

        <template #default>
          <form @submit.prevent="saveGeneralites" class="space-y-6">
            <!-- Chef de projet -->
            <div class="space-y-4">
              <div class="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                <Icon name="lucide:briefcase" size="16" class="text-violet-500" />
                <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Chef de projet</h3>
              </div>
              <AppInput v-model="editFormGeneralites.chef_projet_nom" name="chef_projet_nom" title="Nom" placeholder="Nom du chef de projet" />
              <AppInput v-model="editFormGeneralites.chef_projet_email" name="chef_projet_email" title="Email" type="email" placeholder="email@exemple.com" />
            </div>

            <!-- Coordinateur sécurité -->
            <div class="space-y-4">
              <div class="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                <Icon name="lucide:shield-check" size="16" class="text-emerald-500" />
                <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Coordinateur sécurité</h3>
              </div>
              <AppInput v-model="editFormGeneralites.coordinateur_securite_nom" name="coordinateur_securite_nom" title="Nom" placeholder="Nom du coordinateur" />
              <AppInput v-model="editFormGeneralites.coordinateur_securite_email" name="coordinateur_securite_email" title="Email" type="email" placeholder="email@exemple.com" />
            </div>
          </form>
        </template>

        <template #footer>
          <div class="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <AppButtonValidated theme="cancel" type="button" @click="showEditGeneralites = false">
              <template #default>Annuler</template>
            </AppButtonValidated>
            <AppButtonValidated theme="primary" type="button" @click="saveGeneralites">
              <template #default>Enregistrer</template>
            </AppButtonValidated>
          </div>
        </template>
      </AppSlideOverContent>
    </AppSlideOver>

    <!-- ============================================ -->
    <!-- SLIDEOVER TRAVAUX -->
    <!-- ============================================ -->
    <AppSlideOver :sideModal="showEditTravaux" :closeSideModal="() => showEditTravaux = false">
      <AppSlideOverContent v-if="showEditTravaux" :closeSideModal="() => showEditTravaux = false">
        <template #header>
          <h2 class="text-3xl font-[Pacifico] text-gray-800 dark:text-white">Équipe travaux</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">Modifier l'équipe travaux du chantier</p>
        </template>

        <template #default>
          <form @submit.prevent="saveTravaux" class="space-y-6">
            <!-- RLT Voie -->
            <div class="space-y-4">
              <div class="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                <Icon name="lucide:train-track" size="16" class="text-blue-500" />
                <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">RLT Voie</h3>
              </div>
              <AppSelect v-model="editFormTravaux.rlt_voie_principale" :options="userOptions" title="Principal" placeholder="Sélectionner..." nullable />
              <div>
                <label class="block text-sm mb-2">Secondaire(s)</label>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="user in userOptions"
                    :key="user.id"
                    type="button"
                    @click="toggleSecondaire('rlt_voie_secondaire', user.id)"
                    class="px-3 py-1.5 text-xs font-medium rounded-full border transition-colors"
                    :class="editFormTravaux.rlt_voie_secondaire.includes(user.id) 
                      ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/40 dark:border-blue-700 dark:text-blue-400' 
                      : 'bg-gray-100 border-gray-300 text-gray-600 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'"
                  >
                    {{ user.label }}
                  </button>
                </div>
              </div>
            </div>

            <!-- RLT SES -->
            <div class="space-y-4">
              <div class="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                <Icon name="lucide:zap" size="16" class="text-yellow-500" />
                <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">RLT SES</h3>
              </div>
              <AppSelect v-model="editFormTravaux.rlt_ses_principale" :options="userOptions" title="Principal" placeholder="Sélectionner..." nullable />
              <div>
                <label class="block text-sm mb-2">Secondaire(s)</label>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="user in userOptions"
                    :key="user.id"
                    type="button"
                    @click="toggleSecondaire('rlt_ses_secondaire', user.id)"
                    class="px-3 py-1.5 text-xs font-medium rounded-full border transition-colors"
                    :class="editFormTravaux.rlt_ses_secondaire.includes(user.id) 
                      ? 'bg-yellow-100 border-yellow-300 text-yellow-700 dark:bg-yellow-900/40 dark:border-yellow-700 dark:text-yellow-400' 
                      : 'bg-gray-100 border-gray-300 text-gray-600 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'"
                  >
                    {{ user.label }}
                  </button>
                </div>
              </div>
            </div>

            <!-- RLT CAT -->
            <div class="space-y-4">
              <div class="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                <Icon name="lucide:cable" size="16" class="text-rose-500" />
                <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">RLT CAT</h3>
              </div>
              <AppSelect v-model="editFormTravaux.rlt_cat_principale" :options="userOptions" title="Principal" placeholder="Sélectionner..." nullable />
              <div>
                <label class="block text-sm mb-2">Secondaire(s)</label>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="user in userOptions"
                    :key="user.id"
                    type="button"
                    @click="toggleSecondaire('rlt_cat_secondaire', user.id)"
                    class="px-3 py-1.5 text-xs font-medium rounded-full border transition-colors"
                    :class="editFormTravaux.rlt_cat_secondaire.includes(user.id) 
                      ? 'bg-rose-100 border-rose-300 text-rose-700 dark:bg-rose-900/40 dark:border-rose-700 dark:text-rose-400' 
                      : 'bg-gray-100 border-gray-300 text-gray-600 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'"
                  >
                    {{ user.label }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Pré-op -->
            <div class="space-y-4">
              <div class="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                <Icon name="lucide:clipboard-check" size="16" class="text-indigo-500" />
                <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Pré-op</h3>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <AppSelect v-model="editFormTravaux.preop_voie" :options="userOptions" title="Voie" placeholder="Sélectionner..." nullable />
                <AppSelect v-model="editFormTravaux.preop_ses" :options="userOptions" title="SES" placeholder="Sélectionner..." nullable />
              </div>
            </div>

            <!-- Logistique -->
            <div class="space-y-4">
              <div class="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                <Icon name="lucide:truck" size="16" class="text-teal-500" />
                <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Logistique</h3>
              </div>
              <AppSelect v-model="editFormTravaux.logistique" :options="userOptions" title="Responsable logistique" placeholder="Sélectionner..." nullable />
            </div>

            <!-- Superviseurs -->
            <div class="space-y-4">
              <div class="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                <Icon name="lucide:eye" size="16" class="text-purple-500" />
                <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Superviseurs</h3>
              </div>
              <div>
                <label class="block text-sm mb-2">Sélectionner les superviseurs</label>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="user in userOptions"
                    :key="user.id"
                    type="button"
                    @click="toggleSupervisor(user.id)"
                    class="px-3 py-1.5 text-xs font-medium rounded-full border transition-colors"
                    :class="editFormTravaux.supervisor.includes(user.id) 
                      ? 'bg-purple-100 border-purple-300 text-purple-700 dark:bg-purple-900/40 dark:border-purple-700 dark:text-purple-400' 
                      : 'bg-gray-100 border-gray-300 text-gray-600 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'"
                  >
                    {{ user.label }}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </template>

        <template #footer>
          <div class="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <AppButtonValidated theme="cancel" type="button" @click="showEditTravaux = false">
              <template #default>Annuler</template>
            </AppButtonValidated>
            <AppButtonValidated theme="primary" type="button" @click="saveTravaux">
              <template #default>Enregistrer</template>
            </AppButtonValidated>
          </div>
        </template>
      </AppSlideOverContent>
    </AppSlideOver>

    <!-- ============================================ -->
    <!-- SLIDEOVER ENTREPRISE (ADD/EDIT) -->
    <!-- ============================================ -->
    <AppSlideOver :sideModal="showAddEntreprise || showEditEntreprise" :closeSideModal="() => { showAddEntreprise = false; showEditEntreprise = false; }">
      <AppSlideOverContent v-if="showAddEntreprise || showEditEntreprise" :closeSideModal="() => { showAddEntreprise = false; showEditEntreprise = false; }">
        <template #header>
          <h2 class="text-3xl font-[Pacifico] text-gray-800 dark:text-white">
            {{ editFormEntreprise.id ? 'Modifier' : 'Ajouter' }} une entreprise
          </h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">Informations de l'entreprise intervenante</p>
        </template>

        <template #default>
          <form @submit.prevent="saveEntreprise" class="space-y-4">
            <AppInput v-model="editFormEntreprise.metier" name="metier" title="Métier / Spécialité" placeholder="Ex: Électricité, Terrassement..." />
            <AppInput v-model="editFormEntreprise.entreprise" name="entreprise" title="Nom de l'entreprise" placeholder="Nom de l'entreprise" />
            <AppInput v-model="editFormEntreprise.responsable_nom" name="responsable_nom" title="Nom du responsable" placeholder="Nom du contact" />
            <AppInput v-model="editFormEntreprise.responsable_email" name="responsable_email" title="Email" type="email" placeholder="email@exemple.com" />
          </form>
        </template>

        <template #footer>
          <div class="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <AppButtonValidated theme="cancel" type="button" @click="showAddEntreprise = false; showEditEntreprise = false;">
              <template #default>Annuler</template>
            </AppButtonValidated>
            <AppButtonValidated theme="primary" type="button" @click="saveEntreprise">
              <template #default>{{ editFormEntreprise.id ? 'Modifier' : 'Ajouter' }}</template>
            </AppButtonValidated>
          </div>
        </template>
      </AppSlideOverContent>
    </AppSlideOver>

    <!-- ============================================ -->
    <!-- SLIDEOVER ÉTUDES -->
    <!-- ============================================ -->
    <AppSlideOver :sideModal="showEditEtudes" :closeSideModal="() => showEditEtudes = false">
      <AppSlideOverContent v-if="showEditEtudes" :closeSideModal="() => showEditEtudes = false">
        <template #header>
          <h2 class="text-3xl font-[Pacifico] text-gray-800 dark:text-white">Contacts études</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">Modifier les contacts études du chantier</p>
        </template>

        <template #default>
          <form @submit.prevent="saveEtudes" class="space-y-6">
            <!-- Plans techniques -->
            <div class="space-y-4">
              <div class="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                <Icon name="lucide:file-text" size="16" class="text-emerald-500" />
                <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Plans techniques</h3>
              </div>
              <AppInput v-model="editFormEtudes.plan_technique_nom" name="plan_technique_nom" title="Nom" placeholder="Nom du contact" />
              <AppInput v-model="editFormEtudes.plan_technique_email" name="plan_technique_email" title="Email" type="email" placeholder="email@exemple.com" />
            </div>

            <!-- Documents d'exécution -->
            <div class="space-y-4">
              <div class="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                <Icon name="lucide:folder-open" size="16" class="text-blue-500" />
                <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Documents d'exécution</h3>
              </div>
              <AppInput v-model="editFormEtudes.documents_execution_nom" name="documents_execution_nom" title="Nom" placeholder="Nom du contact" />
              <AppInput v-model="editFormEtudes.documents_execution_email" name="documents_execution_email" title="Email" type="email" placeholder="email@exemple.com" />
            </div>
          </form>
        </template>

        <template #footer>
          <div class="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <AppButtonValidated theme="cancel" type="button" @click="showEditEtudes = false">
              <template #default>Annuler</template>
            </AppButtonValidated>
            <AppButtonValidated theme="primary" type="button" @click="saveEtudes">
              <template #default>Enregistrer</template>
            </AppButtonValidated>
          </div>
        </template>
      </AppSlideOverContent>
    </AppSlideOver>

    <!-- ============================================ -->
    <!-- SLIDEOVER AUTRE (ADD/EDIT) -->
    <!-- ============================================ -->
    <AppSlideOver :sideModal="showAddAutre || showEditAutre" :closeSideModal="() => { showAddAutre = false; showEditAutre = false; }">
      <AppSlideOverContent v-if="showAddAutre || showEditAutre" :closeSideModal="() => { showAddAutre = false; showEditAutre = false; }">
        <template #header>
          <h2 class="text-3xl font-[Pacifico] text-gray-800 dark:text-white">
            {{ editFormAutre.id ? 'Modifier' : 'Ajouter' }} un contact
          </h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">Informations du contact</p>
        </template>

        <template #default>
          <form @submit.prevent="saveAutre" class="space-y-4">
            <AppInput v-model="editFormAutre.metier" name="metier" title="Fonction / Rôle" placeholder="Ex: Mairie, Riverain..." />
            <AppInput v-model="editFormAutre.entreprise" name="entreprise" title="Organisme / Société" placeholder="Nom de l'organisme" />
            <AppInput v-model="editFormAutre.responsable_nom" name="responsable_nom" title="Nom du contact" placeholder="Nom du contact" />
            <AppInput v-model="editFormAutre.responsable_email" name="responsable_email" title="Email" type="email" placeholder="email@exemple.com" />
          </form>
        </template>

        <template #footer>
          <div class="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <AppButtonValidated theme="cancel" type="button" @click="showAddAutre = false; showEditAutre = false;">
              <template #default>Annuler</template>
            </AppButtonValidated>
            <AppButtonValidated theme="primary" type="button" @click="saveAutre">
              <template #default>{{ editFormAutre.id ? 'Modifier' : 'Ajouter' }}</template>
            </AppButtonValidated>
          </div>
        </template>
      </AppSlideOverContent>
    </AppSlideOver>
  </div>
</template>
