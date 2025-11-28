<script setup>
const { getAllUsers, updateUser, users } = useUsers();
const { getAllProfilTache, profilTaches } = useProfilTache();
const { setLoader } = useLoader();
const { isSuperAdmin } = useLevelUser(); // Pas de chantier pour cette page

const globalFilter = ref("");
const open = ref(false);
const user = ref({});

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
  return users.value.filter(u => 
    (u.nom?.toLowerCase().includes(search)) ||
    (u.prenom?.toLowerCase().includes(search)) ||
    (u.email?.toLowerCase().includes(search)) ||
    (u.profil_name?.toLowerCase().includes(search))
  );
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
    case 1: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    default: return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
  }
};

const validatedFields = computed(() => {
  return true; // Toujours valide car on peut juste modifier les champs
});

// Ouvrir le slide avec les données de l'utilisateur
const openSlide = (row) => {
  if (row) {
    user.value = { 
      ...row,
      role: row.role ?? 0,
      pre_op: row.pre_op ?? false,
      ref_du_rdu: row.ref_du_rdu ?? false
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

// Active le loader pendant le chargement initial
setLoader(true);
try {
  await Promise.all([
    getAllUsers(),
    getAllProfilTache()
  ]);
} finally {
  setLoader(false);
}
</script>

<template>
  <div class="flex flex-col w-full h-full gap-4">
    <AppTitleMain title="Paramètres Utilisateurs" description="Gestion des utilisateurs et de leurs permissions" />
    <div class="flex flex-col lg:flex-row gap-4 items-center w-full max-w-md ">
      <AppInputSearch v-model="globalFilter" class="w-full" size="lg" placeholder="Rechercher un utilisateur ..." />
    </div>
    
    <!-- Table des utilisateurs -->
    <div class="flex flex-col w-full h-full overflow-hidden rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <!-- Header -->
          <thead class="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th class="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">Utilisateur</th>
              <th class="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200">Profil</th>
              <th class="px-4 py-3 text-center font-semibold text-gray-700 dark:text-gray-200">Rôle</th>
              <th class="px-4 py-3 text-center font-semibold text-gray-700 dark:text-gray-200">Pré-Op</th>
              <th class="px-4 py-3 text-center font-semibold text-gray-700 dark:text-gray-200">RDU</th>
            </tr>
          </thead>
          
          <!-- Body -->
          <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
            <tr 
              v-for="u in filteredUsers" 
              :key="u.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
              @click="openSlide(u)"
            >
              <!-- Colonne Utilisateur (Nom Prénom + Email) -->
              <td class="px-4 py-3">
                <div class="flex flex-col">
                  <span class="font-medium text-gray-900 dark:text-white">
                    {{ u.nom || '—' }} {{ u.prenom || '' }}
                  </span>
                  <span class="text-xs text-gray-500 dark:text-gray-400">
                    {{ u.email || '—' }}
                  </span>
                </div>
              </td>
              
              <!-- Colonne Profil -->
              <td class="px-4 py-3 text-gray-700 dark:text-gray-300">
                {{ u.profil_name || '—' }}
              </td>
              
              <!-- Colonne Rôle -->
              <td class="px-4 py-3 text-center">
                <span 
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :class="getRoleBadgeClass(u.role)"
                >
                  {{ getRoleLabel(u.role) }}
                </span>
              </td>
              
              <!-- Colonne Pré-Op -->
              <td class="px-4 py-3 text-center">
                <Icon 
                  :name="u.pre_op ? 'lucide:check-circle' : 'lucide:x-circle'" 
                  :class="u.pre_op ? 'text-green-500' : 'text-gray-300 dark:text-gray-600'"
                  size="18"
                />
              </td>
              
              <!-- Colonne RDU -->
              <td class="px-4 py-3 text-center">
                <Icon 
                  :name="u.ref_du_rdu ? 'lucide:check-circle' : 'lucide:x-circle'" 
                  :class="u.ref_du_rdu ? 'text-green-500' : 'text-gray-300 dark:text-gray-600'"
                  size="18"
                />
              </td>
            </tr>
            
            <!-- Message si aucun résultat -->
            <tr v-if="filteredUsers.length === 0">
              <td colspan="5" class="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
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
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Modifier l'utilisateur</h2>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ user.email }}</p>
            </div>
          </template>

          <template #default>
            <form @submit.prevent="modifierUser" class="flex flex-col gap-5 w-full">
              
              <!-- Nom et Prénom -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AppInput 
                  name="nom" 
                  title="Nom" 
                  placeholder="Nom de l'utilisateur" 
                  v-model="user.nom" 
                />
                <AppInput 
                  name="prenom" 
                  title="Prénom" 
                  placeholder="Prénom de l'utilisateur" 
                  v-model="user.prenom" 
                />
              </div>

              <!-- Profil -->
              <AppSelect 
                name="profil" 
                title="Profil" 
                v-model="user.profils" 
                :options="profilTaches"
                placeholder="Aucun profil"


              />

              <!-- Rôle -->
              <AppSelect 
                name="role" 
                title="Rôle" 
                v-model="user.role" 
                :options="roleOptions"
              />

              <!-- Switches Pré-Op et RDU -->
              <div class="flex flex-col gap-4 pt-2">
                <AppSwitch 
                  v-model="user.pre_op" 
                  name="pre_op" 
                  label="Pré-Op" 
                />
                <AppSwitch 
                  v-model="user.ref_du_rdu" 
                  name="ref_du_rdu" 
                  label="Référent du RDU" 
                />
              </div>
              
            </form>
          </template>

          <template #footer>
            <div class="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
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



  </div>
</template>

