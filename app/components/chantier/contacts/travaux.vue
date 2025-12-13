<script setup>
const props = defineProps({
  chantier: {
    type: Object,
    required: true
  }
})

const { getContactsTravaux, upsertContactsTravaux } = useContacts()
const {
  getAllUsers,
  users,
  getUsersRltVoie,
  getUsersRltSes,
  getUsersRltCat,
  getUsersLogistique,
  getUsersKvVoie,
  getUsersKvSes,
  getUsersKvCat,
  getUsersPreopVoie,
  getUsersPreopSes,
  getUsersRefRdu
} = useUsers()
const { setLoader } = useLoader()

const contactsTravaux = ref([])
const showEditTravaux = ref(false)
const editFormTravaux = ref({
  rlt_voie_principale: null,
  rlt_voie_secondaire: [],
  rlt_ses_principale: null,
  rlt_ses_secondaire: [],
  rlt_cat_principale: null,
  rlt_cat_secondaire: [],
  kv_voie: [],
  kv_ses: [],
  kv_cat: [],
  preop_voie: null,
  preop_ses: null,
  logistique: null,
  supervisor: []
})

// Options utilisateurs pour les selects (travaux)
const userOptions = (users) => {
  if (users?.length > 0) {
    return users.map((u) => ({
      id: u.id,
      label: u.prenom && u.nom ? `${u.prenom} ${u.nom}` : u.email
    }))
  }
  return []
}

// Charger toutes les données
const loadAllData = async () => {
  setLoader(true)
  try {
    await getAllUsers()
    const trav = await getContactsTravaux(props.chantier.id)
    contactsTravaux.value = trav
  } finally {
    setLoader(false)
  }
}

onMounted(async () => {
  await loadAllData()
})

// Obtenir le nom d'un utilisateur par son ID
const getUserName = (userId) => {
  if (!userId) return '-'
  const user = users.value.find((u) => u.id === userId)
  if (!user) return '-'
  return user.prenom && user.nom ? `${user.prenom} ${user.nom}` : user.email
}

// Obtenir plusieurs noms d'utilisateurs
const getUserNames = (userIds) => {
  if (!userIds || userIds.length === 0) return '-'
  return (
    userIds
      .map((id) => getUserName(id))
      .filter((n) => n !== '-')
      .join(', ') || '-'
  )
}
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
    kv_voie: contactsTravaux.value?.kv_voie || [],
    kv_ses: contactsTravaux.value?.kv_ses || [],
    kv_cat: contactsTravaux.value?.kv_cat || [],
    preop_voie: contactsTravaux.value?.preop_voie || null,
    preop_ses: contactsTravaux.value?.preop_ses || null,
    logistique: contactsTravaux.value?.logistique || null,
    supervisor: contactsTravaux.value?.supervisor || []
  }
  showEditTravaux.value = true
}

const saveTravaux = async () => {
  setLoader(true)
  try {
    const result = await upsertContactsTravaux(props.chantier.id, editFormTravaux.value)
    if (result) {
      contactsTravaux.value = result
      showEditTravaux.value = false
    }
  } finally {
    setLoader(false)
  }
}
</script>

<template>
  <div>
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div
            class="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-amber-100 to-orange-200 dark:from-amber-900/50 dark:to-orange-800/50">
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
              <p class="hidden lg:block">Modifier</p>
            </span>
          </template>
        </AppButtonValidated>
      </div>

      <div class="rounded-xl border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-600 dark:bg-gray-700/50">
        <div class="mb-3 flex items-center gap-2">
          <Icon name="lucide:train-track" size="16" class="text-blue-500" />
          <label class="text-xs font-semibold tracking-wider text-blue-600 uppercase dark:text-blue-400">
            Spécialité : Voie
          </label>
        </div>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <p class="mb-1 text-xs text-gray-500">RLT Principal</p>
            <p class="text-base font-semibold text-gray-900 dark:text-white">
              {{ getUserName(contactsTravaux?.rlt_voie_principale) }}
            </p>
          </div>
          <div>
            <p class="mb-1 text-xs text-gray-500">RLT Secondaire(s)</p>
            <p class="text-base font-semibold text-gray-900 dark:text-white">
              {{ getUserNames(contactsTravaux?.rlt_voie_secondaire) }}
            </p>
          </div>
          <div>
            <p class="mb-1 text-xs text-gray-500">Controleurs</p>
            <p class="text-base font-semibold text-gray-900 dark:text-white">
              {{ getUserNames(contactsTravaux?.kv_voie) }}
            </p>
          </div>
        </div>
      </div>

      <!-- RLT SES -->
      <div class="rounded-xl border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-600 dark:bg-gray-700/50">
        <div class="mb-3 flex items-center gap-2">
          <Icon name="lucide:zap" size="16" class="text-yellow-500" />
          <label class="text-xs font-semibold tracking-wider text-yellow-600 uppercase dark:text-yellow-400">
            Spécialité : SES
          </label>
        </div>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <p class="mb-1 text-xs text-gray-500">RLT Principal</p>
            <p class="text-base font-semibold text-gray-900 dark:text-white">
              {{ getUserName(contactsTravaux?.rlt_ses_principale) }}
            </p>
          </div>
          <div>
            <p class="mb-1 text-xs text-gray-500">RLT Secondaire(s)</p>
            <p class="text-base font-semibold text-gray-900 dark:text-white">
              {{ getUserNames(contactsTravaux?.rlt_ses_secondaire) }}
            </p>
          </div>
          <div>
            <p class="mb-1 text-xs text-gray-500">Controleurs</p>
            <p class="text-base font-semibold text-gray-900 dark:text-white">
              {{ getUserNames(contactsTravaux?.kv_ses) }}
            </p>
          </div>
        </div>
      </div>

      <!-- RLT CAT -->
      <div class="rounded-xl border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-600 dark:bg-gray-700/50">
        <div class="mb-3 flex items-center gap-2">
          <Icon name="lucide:cable" size="16" class="text-rose-500" />
          <label class="text-xs font-semibold tracking-wider text-rose-600 uppercase dark:text-rose-400">
            Spécialité : CAT
          </label>
        </div>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <p class="mb-1 text-xs text-gray-500">RLT Principal</p>
            <p class="text-base font-semibold text-gray-900 dark:text-white">
              {{ getUserName(contactsTravaux?.rlt_cat_principale) }}
            </p>
          </div>
          <div>
            <p class="mb-1 text-xs text-gray-500">RLT Secondaire(s)</p>
            <p class="text-base font-semibold text-gray-900 dark:text-white">
              {{ getUserNames(contactsTravaux?.rlt_cat_secondaire) }}
            </p>
          </div>
          <div>
            <p class="mb-1 text-xs text-gray-500">Controleurs</p>
            <p class="text-base font-semibold text-gray-900 dark:text-white">
              {{ getUserNames(contactsTravaux?.kv_cat) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Pré-op & Logistique -->
      <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div class="rounded-xl border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-600 dark:bg-gray-700/50">
          <div class="mb-3 flex items-center gap-2">
            <Icon name="lucide:clipboard-check" size="16" class="text-indigo-500" />
            <label class="text-xs font-semibold tracking-wider text-indigo-600 uppercase dark:text-indigo-400">
              Pré-op Voie
            </label>
          </div>
          <p class="text-base font-semibold text-gray-900 dark:text-white">
            {{ getUserName(contactsTravaux?.preop_voie) }}
          </p>
        </div>
        <div class="rounded-xl border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-600 dark:bg-gray-700/50">
          <div class="mb-3 flex items-center gap-2">
            <Icon name="lucide:clipboard-check" size="16" class="text-indigo-500" />
            <label class="text-xs font-semibold tracking-wider text-indigo-600 uppercase dark:text-indigo-400">
              Pré-op SES
            </label>
          </div>
          <p class="text-base font-semibold text-gray-900 dark:text-white">
            {{ getUserName(contactsTravaux?.preop_ses) }}
          </p>
        </div>
        <div class="rounded-xl border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-600 dark:bg-gray-700/50">
          <div class="mb-3 flex items-center gap-2">
            <Icon name="lucide:truck" size="16" class="text-teal-500" />
            <label class="text-xs font-semibold tracking-wider text-teal-600 uppercase dark:text-teal-400">
              Logistique
            </label>
          </div>
          <p class="text-base font-semibold text-gray-900 dark:text-white">
            {{ getUserName(contactsTravaux?.logistique) }}
          </p>
        </div>
      </div>

      <!-- Superviseurs -->
      <div class="rounded-xl border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-600 dark:bg-gray-700/50">
        <div class="mb-3 flex items-center gap-2">
          <Icon name="lucide:eye" size="16" class="text-purple-500" />
          <label class="text-xs font-semibold tracking-wider text-purple-600 uppercase dark:text-purple-400">
            Superviseurs
          </label>
        </div>
        <p class="text-base font-semibold text-gray-900 dark:text-white">
          {{ getUserNames(contactsTravaux?.supervisor) }}
        </p>
      </div>
    </div>

    <AppSlideOver :sideModal="showEditTravaux" :closeSideModal="() => (showEditTravaux = false)">
      <AppSlideOverContent v-if="showEditTravaux" :closeSideModal="() => (showEditTravaux = false)">
        <template #header>
          <h2 class="font-[Pacifico] text-3xl text-gray-800 dark:text-white">Équipe travaux</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">Modifier l'équipe travaux du chantier</p>
        </template>

        <template #default>
          <form @submit.prevent="saveTravaux" class="space-y-6">
            <!-- RLT Voie -->
            <div class="space-y-4">
              <div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700">
                <Icon name="lucide:train-track" size="16" class="text-blue-500" />
                <h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300">
                  RLT Voie
                </h3>
              </div>
              <AppSelect
                v-model="editFormTravaux.rlt_voie_principale"
                :options="userOptions(getUsersRltVoie)"
                title="Principal"
                placeholder="Sélectionner..."
                nullable />
              <AppSelectMultiple
                v-model="editFormTravaux.rlt_voie_secondaire"
                :options="userOptions(getUsersRltVoie)"
                title="Secondaire(s)"
                placeholder="Sélectionner un profil Voie" />
              <AppSelectMultiple
                v-model="editFormTravaux.kv_voie"
                :options="userOptions(getUsersKvVoie)"
                title="Contrôleur(s)"
                placeholder="Sélectionner un profil Voie" />
            </div>

            <!-- RLT SES -->
            <div class="space-y-4">
              <div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700">
                <Icon name="lucide:zap" size="16" class="text-yellow-500" />
                <h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300">RLT SES</h3>
              </div>
              <AppSelect
                v-model="editFormTravaux.rlt_ses_principale"
                :options="userOptions(getUsersRltSes)"
                title="Principal"
                placeholder="Sélectionner..."
                nullable />

              <AppSelectMultiple
                v-model="editFormTravaux.rlt_ses_secondaire"
                :options="userOptions(getUsersRltSes)"
                title="Secondaire(s)"
                placeholder="Sélectionner un profil SES" />
              <AppSelectMultiple
                v-model="editFormTravaux.kv_ses"
                :options="userOptions(getUsersKvSes)"
                title="Contrôleur(s)"
                placeholder="Sélectionner un profil SES" />
            </div>

            <!-- RLT CAT -->
            <div class="space-y-4">
              <div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700">
                <Icon name="lucide:cable" size="16" class="text-rose-500" />
                <h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300">RLT CAT</h3>
              </div>
              <AppSelect
                v-model="editFormTravaux.rlt_cat_principale"
                :options="userOptions(getUsersRltCat)"
                title="Principal"
                placeholder="Sélectionner..."
                nullable />
              <AppSelectMultiple
                v-model="editFormTravaux.rlt_cat_secondaire"
                :options="userOptions(getUsersRltCat)"
                title="Secondaire(s)"
                placeholder="Sélectionner un profil CAT" />
              <AppSelectMultiple
                v-model="editFormTravaux.kv_cat"
                :options="userOptions(getUsersKvCat)"
                title="Contrôleur(s)"
                placeholder="Sélectionner un profil CAT" />
            </div>

            <!-- Pré-op -->
            <div class="space-y-4">
              <div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700">
                <Icon name="lucide:clipboard-check" size="16" class="text-indigo-500" />
                <h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300">Pré-op</h3>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <AppSelect
                  v-model="editFormTravaux.preop_voie"
                  :options="userOptions(getUsersPreopVoie)"
                  title="Voie"
                  placeholder="Sélectionner..."
                  nullable />
                <AppSelect
                  v-model="editFormTravaux.preop_ses"
                  :options="userOptions(getUsersPreopSes)"
                  title="SES"
                  placeholder="Sélectionner..."
                  nullable />
              </div>
            </div>

            <!-- Logistique -->
            <div class="space-y-4">
              <div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700">
                <Icon name="lucide:truck" size="16" class="text-teal-500" />
                <h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300">
                  Logistique
                </h3>
              </div>
              <AppSelect
                v-model="editFormTravaux.logistique"
                :options="userOptions(getUsersLogistique)"
                title="Responsable logistique"
                placeholder="Sélectionner..."
                nullable />
            </div>

            <!-- Superviseurs -->
            <div class="space-y-4">
              <div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700">
                <Icon name="lucide:eye" size="16" class="text-purple-500" />
                <h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300">
                  Superviseurs
                </h3>
              </div>
              <AppSelectMultiple
                v-model="editFormTravaux.supervisor"
                :options="userOptions(getUsersRefRdu)"
                title="Superviseurs"
                placeholder="Sélectionner un superviseur" />
            </div>
          </form>
        </template>

        <template #footer>
          <div class="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
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
  </div>
</template>
