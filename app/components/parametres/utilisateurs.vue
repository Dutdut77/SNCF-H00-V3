<script setup>
const { getAllUsers, updateUser, createUser, users } = useUsers();
const { getAllProfilTache, profilTaches } = useProfilTache();
const { getAttributions, siteOptions } = useAttributions();
const { setLoader } = useLoader();
const { isSuperAdmin } = useLevelUser(); // Pas de chantier pour cette page

// Options du select « Site » : Pôle IT (= tous les sites) + les vrais sites.
const userSiteOptions = computed(() => [{ id: 'Pôle IT', label: 'Pôle IT' }, ...siteOptions.value]);

// Libellé du site à partir des options (code -> label) ; fallback sur le code brut.
const getSiteLabel = (code) => {
  if (!code) return '—';
  return userSiteOptions.value.find((o) => o.id === code)?.label || code;
};

// Couleur du badge : Pôle IT (accès tous sites) en sarcelle, sites normaux en neutre.
const getSiteBadgeClass = (code) =>
  code === 'Pôle IT'
    ? 'bg-secondary-100 text-secondary-800 dark:bg-secondary-900/30 dark:text-secondary-300'
    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';

// Ordre et regroupement d'affichage du select « Profil ».
// On ne se base PAS sur num_profil croissant (RLT/KV s'entremêleraient) : l'ordre est défini
// ici explicitement. Les num_profil restent ceux de la BDD (référencés par users.profils et
// taches.tache_profil). `group: null` => option seule (sans en-tête).
const PROFIL_ORDER = [
  { num: -1, group: null },        // Visiteur
  { num: 41, group: 'Pôle IT' },   // Moetx Amont
  { num: 42, group: 'Pôle IT' },   // Chef de projet
  { num: 1, group: 'Secteur' },    // Logistique
  { num: 10, group: 'Secteur' },   // RLT voie
  { num: 20, group: 'Secteur' },   // RLT SES
  { num: 30, group: 'Secteur' },   // RLT CAT
  { num: 11, group: 'Secteur' },   // KV Voie
  { num: 21, group: 'Secteur' },   // KV SES
  { num: 31, group: 'Secteur' },   // KV Cat
];

// Options du select Profil : ordonnées + groupées selon PROFIL_ORDER.
// Tout profil présent en BDD mais non listé ci-dessus est ajouté en fin (groupe « Autres »).
const profilOptions = computed(() => {
  const byNum = new Map(profilTaches.value.map((p) => [p.id, p]));
  const ordered = [];
  for (const { num, group } of PROFIL_ORDER) {
    const p = byNum.get(num);
    if (p) ordered.push({ id: p.id, label: p.label, group });
  }
  const known = new Set(PROFIL_ORDER.map((o) => o.num));
  for (const p of profilTaches.value) {
    if (!known.has(p.id)) ordered.push({ id: p.id, label: p.label, group: 'Autres' });
  }
  return ordered;
});

const globalFilter = ref("");
const open = ref(false);
const openAdd = ref(false); // Modal d'ajout
const user = ref({});
const newUser = ref({
  email: '',
  nom: '',
  prenom: '',
  profils: -1,
  role: 0,
  pre_op: false,
  ref_du_rdu: false,
  en_formation: false,
  site: null
});

// Options pour les rôles (filtrées selon le niveau de l'utilisateur connecté)
const roleOptions = computed(() => {
  const options = [
    { id: 0, label: 'Aucun' },
    { id: 1, label: 'Admin' },
  ];
  // Seul un SuperAdmin peut attribuer le rôle SuperAdmin
  if (isSuperAdmin.value) {
    options.push({ id: 2, label: 'SuperAdmin' });
  }
  return options;
});

// Filtrer les utilisateurs en fonction de la recherche
const filteredUsers = computed(() => {
  if (!globalFilter.value) return users.value;
  const search = globalFilter.value.toLowerCase();
  return users.value.filter(u => {
    const searchable = [
      u.nom,
      u.prenom,
      u.email,
      u.profil_name,
      getSiteLabel(u.site),
      getRoleLabel(u.role),
      u.pre_op ? 'pre-op' : '',
      u.ref_du_rdu ? 'rdu' : '',
      u.en_formation ? 'en formation' : '',
    ].join(' ').toLowerCase()
    return searchable.includes(search)
  });
});

// Fonction pour afficher le rôle en texte
const getRoleLabel = (role) => {
  switch (role) {
    case 2: return 'SuperAdmin';
    case 1: return 'Admin';
    default: return 'Aucun';
  }
};

// Fonction pour obtenir la couleur du badge de rôle
const getRoleBadgeClass = (role) => {
  switch (role) {
    case 2: return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
    case 1: return 'bg-secondary-100 text-secondary-800 dark:bg-secondary-900/30 dark:text-secondary-300';
    default: return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
  }
};

const validatedFields = computed(() => {
  return true; // Toujours valide car on peut juste modifier les champs
});

// Validation pour le nouvel utilisateur (email obligatoire)
const validatedNewUser = computed(() => {
  return newUser.value.email && newUser.value.email.includes('@');
});

// Ouvrir le slide avec les données de l'utilisateur
const openSlide = (row) => {
  if (row) {
    user.value = {
      ...row,
      role: row.role ?? 0,
      pre_op: row.pre_op ?? false,
      ref_du_rdu: row.ref_du_rdu ?? false,
      en_formation: row.en_formation ?? false
    };
    open.value = true;
  }
};

// Fermer le slide
const closeSlide = () => {
  open.value = false;
  user.value = {};
};

const modifierUser = async () => {
  setLoader(true);
  try {
    await updateUser(user.value);
    closeSlide();
  } finally {
    setLoader(false);
  }
};

// Ouvrir le modal d'ajout
const openAddSlide = () => {
  newUser.value = {
    email: '',
    nom: '',
    prenom: '',
    profils: -1,
    role: 0,
    pre_op: false,
    ref_du_rdu: false,
    en_formation: false,
    site: null
  };
  openAdd.value = true;
};

// Fermer le modal d'ajout
const closeAddSlide = () => {
  openAdd.value = false;
  newUser.value = {
    email: '',
    nom: '',
    prenom: '',
    profils: -1,
    role: 0,
    pre_op: false,
    ref_du_rdu: false,
    en_formation: false,
    site: null
  };
};

// Créer un nouvel utilisateur
const ajouterUser = async () => {
  setLoader(true);
  try {
    const result = await createUser(newUser.value);
    if (result) {
      closeAddSlide();
    }
  } finally {
    setLoader(false);
  }
};

// Active le loader pendant le chargement initial
setLoader(true);
try {
  await Promise.all([
    getAllUsers(),
    getAllProfilTache(),
    getAttributions()
  ]);
} finally {
  setLoader(false);
}
</script>

<template>
  <div class="flex flex-col gap-4 h-full overflow-auto p-4 w-full">
    <AppTitleMain title="Paramètres Utilisateurs" description="Gestion des utilisateurs et de leurs permissions" />
    <div class="flex flex-col lg:flex-row gap-4 items-center w-full justify-between">
      <AppInputSearch v-model="globalFilter" class="w-full max-w-md" size="lg"
        placeholder="Rechercher un utilisateur ..." />
      <AppButtonValidated theme="primary" @click="openAddSlide">
        <template #default>
          <span class="flex items-center gap-2">
            <Icon name="lucide:user-plus" size="18" />
            Ajouter un utilisateur
          </span>
        </template>
      </AppButtonValidated>
    </div>

    <!-- Table des utilisateurs -->
    <div
      class="flex flex-col w-full h-full overflow-hidden rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <!-- Header -->
          <thead class="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th class="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">Utilisateur</th>
              <th class="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">Profil</th>
              <th class="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">Site</th>
              <th class="px-4 py-3 text-center font-semibold text-slate-700 dark:text-slate-200">Rôle</th>
              <th class="px-4 py-3 text-center font-semibold text-slate-700 dark:text-slate-200">Pré-Op</th>
              <th class="px-4 py-3 text-center font-semibold text-slate-700 dark:text-slate-200">RDU</th>
              <th class="px-4 py-3 text-center font-semibold text-slate-700 dark:text-slate-200">En formation</th>
            </tr>
          </thead>

          <!-- Body -->
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            <tr v-for="u in filteredUsers" :key="u.id"
              class="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors" @click="openSlide(u)">
              <!-- Colonne Utilisateur (Nom Prénom + Email) -->
              <td class="px-4 py-3">
                <div class="flex flex-col">
                  <span class="font-medium text-slate-900 dark:text-white">
                    {{ u.nom || '—' }} {{ u.prenom || '' }}
                  </span>
                  <span class="text-xs text-slate-500 dark:text-slate-400">
                    {{ u.email || '—' }}
                  </span>
                </div>
              </td>

              <!-- Colonne Profil -->
              <td class="px-4 py-3 text-slate-700 dark:text-slate-300">
                {{ u.profil_name || '—' }}
              </td>

              <!-- Colonne Site -->
              <td class="px-4 py-3">
                <span v-if="u.site" class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :class="getSiteBadgeClass(u.site)">
                  <Icon name="lucide:map-pin" size="12" />
                  {{ getSiteLabel(u.site) }}
                </span>
                <span v-else class="text-slate-400 dark:text-slate-600">—</span>
              </td>

              <!-- Colonne Rôle -->
              <td class="px-4 py-3 text-center">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :class="getRoleBadgeClass(u.role)">
                  {{ getRoleLabel(u.role) }}
                </span>
              </td>

              <!-- Colonne Pré-Op -->
              <td class="px-4 py-3 text-center">
                <Icon :name="u.pre_op ? 'lucide:check-circle' : 'lucide:x-circle'"
                  :class="u.pre_op ? 'text-green-500' : 'text-slate-300 dark:text-slate-600'" size="18" />
              </td>

              <!-- Colonne RDU -->
              <td class="px-4 py-3 text-center">
                <Icon :name="u.ref_du_rdu ? 'lucide:check-circle' : 'lucide:x-circle'"
                  :class="u.ref_du_rdu ? 'text-green-500' : 'text-slate-300 dark:text-slate-600'" size="18" />
              </td>

              <!-- Colonne En formation -->
              <td class="px-4 py-3 text-center">
                <Icon :name="u.en_formation ? 'lucide:check-circle' : 'lucide:x-circle'"
                  :class="u.en_formation ? 'text-green-500' : 'text-slate-300 dark:text-slate-600'" size="18" />
              </td>
            </tr>

            <!-- Message si aucun résultat -->
            <tr v-if="filteredUsers.length === 0">
              <td colspan="7" class="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                <Icon name="lucide:users" class="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Aucun utilisateur trouvé</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <AppSlideOver :sideModal="open" :closeSideModal="closeSlide">
      <template #default>
        <AppSlideOverContent v-if="open" :closeSideModal="closeSlide">

          <template #header>
            <div class="text-center">
              <div
                class="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                <Icon name="lucide:user-cog" size="28" class="text-primary-500" />
              </div>
              <h2 class="text-xl font-semibold text-slate-900 dark:text-white">Modifier l'utilisateur</h2>
              <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">{{ user.email }}</p>
            </div>
          </template>

          <template #default>
            <form @submit.prevent="modifierUser" class="flex flex-col gap-5 w-full">

              <!-- Nom et Prénom -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AppInput name="nom" title="Nom" placeholder="Nom de l'utilisateur" v-model="user.nom" />
                <AppInput name="prenom" title="Prénom" placeholder="Prénom de l'utilisateur" v-model="user.prenom" />
              </div>

              <!-- Profil -->
              <AppSelect name="profil" title="Profil" v-model="user.profils" :options="profilOptions"
                placeholder="Aucun profil" />

              <!-- Rôle -->
              <AppSelect name="role" title="Rôle" v-model="user.role" :options="roleOptions" />

              <!-- Site -->
              <AppSelect name="site" title="Site" v-model="user.site" :options="userSiteOptions"
                placeholder="Aucun site" nullable />

              <!-- Switches Pré-Op et RDU -->
              <div class="flex flex-col gap-4 pt-2">
                <AppSwitch v-model="user.pre_op" name="pre_op" label="Pré-Op" />
                <AppSwitch v-model="user.ref_du_rdu" name="ref_du_rdu" label="Référent du RDU" />
                <AppSwitch v-model="user.en_formation" name="en_formation" label="En formation" />
              </div>

            </form>
          </template>

          <template #footer>
            <div class="flex gap-3 justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
              <AppButtonValidated theme="cancel" type="button" @click="closeSlide">
                <template #default>Annuler</template>
              </AppButtonValidated>
              <AppButtonValidated :validated="validatedFields" @click="modifierUser">
                <template #default>Enregistrer</template>
              </AppButtonValidated>
            </div>
          </template>

        </AppSlideOverContent>
      </template>
    </AppSlideOver>

    <!-- Modal d'ajout d'utilisateur -->
    <AppSlideOver :sideModal="openAdd" :closeSideModal="closeAddSlide">
      <template #default>
        <AppSlideOverContent v-if="openAdd" :closeSideModal="closeAddSlide">

          <template #header>
            <div class="text-center">
              <div
                class="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Icon name="lucide:user-plus" size="28" class="text-green-500" />
              </div>
              <h2 class="text-xl font-semibold text-slate-900 dark:text-white">Ajouter un utilisateur</h2>
              <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">L'utilisateur pourra se connecter avec son compte
                SNCF</p>
            </div>
          </template>

          <template #default>
            <form @submit.prevent="ajouterUser" class="flex flex-col gap-5 w-full">

              <!-- Email (obligatoire) -->
              <AppInput name="email" title="Email SNCF" placeholder="prenom.nom@sncf.fr" v-model="newUser.email"
                required />

              <!-- Nom et Prénom -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AppInput name="nom" title="Nom" placeholder="Nom de l'utilisateur" v-model="newUser.nom" />
                <AppInput name="prenom" title="Prénom" placeholder="Prénom de l'utilisateur" v-model="newUser.prenom" />
              </div>

              <!-- Profil -->
              <AppSelect name="profil" title="Profil" v-model="newUser.profils" :options="profilOptions"
                placeholder="Aucun profil" />

              <!-- Rôle -->
              <AppSelect name="role" title="Rôle" v-model="newUser.role" :options="roleOptions" />

              <!-- Site -->
              <AppSelect name="site" title="Site" v-model="newUser.site" :options="userSiteOptions"
                placeholder="Aucun site" nullable />

              <!-- Switches Pré-Op et RDU -->
              <div class="flex flex-col gap-4 pt-2">
                <AppSwitch v-model="newUser.pre_op" name="new_pre_op" label="Pré-Op" />
                <AppSwitch v-model="newUser.ref_du_rdu" name="new_ref_du_rdu" label="Référent du RDU" />
                <AppSwitch v-model="newUser.en_formation" name="new_en_formation" label="En formation" />
              </div>

              <!-- Info -->
              <div class="p-3 rounded-lg bg-secondary-50 dark:bg-secondary-900/20 border border-secondary-200 dark:border-secondary-800">
                <div class="flex items-start gap-2">
                  <Icon name="lucide:info" size="16" class="text-secondary-500 mt-0.5" />
                  <p class="text-xs text-secondary-700 dark:text-secondary-300">
                    L'utilisateur sera automatiquement lié à son compte lors de sa première connexion via OIDC SNCF.
                  </p>
                </div>
              </div>

            </form>
          </template>

          <template #footer>
            <div class="flex gap-3 justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
              <AppButtonValidated theme="cancel" type="button" @click="closeAddSlide">
                <template #default>Annuler</template>
              </AppButtonValidated>
              <AppButtonValidated :validated="validatedNewUser" @click="ajouterUser">
                <template #default>Créer l'utilisateur</template>
              </AppButtonValidated>
            </div>
          </template>

        </AppSlideOverContent>
      </template>
    </AppSlideOver>

  </div>
</template>
