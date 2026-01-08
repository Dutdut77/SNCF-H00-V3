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
      id: u.email,
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

// Obtenir l'email d'un utilisateur par son ID
const getUserEmail = (userEmail) => {
  if (!userEmail) return null
  else {
    return userEmail
  }
  // const user = users.value.find((u) => u.id === userEmail)
  // return user?.email || null
}

// Obtenir le nom d'un utilisateur par son ID
const getUserName = (userEmail) => {
  if (!userEmail) return '-'
  const user = users.value.find((u) => u.email === userEmail)
  if (!user) return '-'
  return user.prenom && user.nom ? `${user.prenom} ${user.nom}` : user.email
}

// Obtenir plusieurs noms d'utilisateurs
// const getUserNames = (userIds) => {
//   if (!userIds || userIds.length === 0) return '-'
//   return (
//     userIds
//       .map((id) => getUserName(id))
//       .filter((n) => n !== '-')
//       .join(', ') || '-'
//   )
// }
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
          <div class="bg-secondary-500/80 text-secondary-50 flex h-10 w-10 items-center justify-center rounded-xl">
            <Icon name="lucide:hard-hat" size="20" />
          </div>
          <div>
            <h2 class="text-primary-800 text-lg font-bold">Équipe travaux</h2>
            <p class="text-primary-500 text-xs">RLT, Pré-op, Logistique et Superviseurs</p>
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

      <div class="bg-primary-50 border-primary-200 rounded-lg border p-4 shadow-lg">
        <!-- VOIE -->
        <div
          v-if="
            contactsTravaux &&
            (getUserName(contactsTravaux?.rlt_voie_principale) ||
              getUserName(contactsTravaux?.rlt_ses_principale) ||
              getUserName(contactsTravaux?.rlt_cat_principale) ||
              getUserName(contactsTravaux?.preop_voie) ||
              getUserName(contactsTravaux?.preop_ses) ||
              getUserName(contactsTravaux?.logistique))
          "
          class="mb-4">
          <p class="text-primary-600 mb-2 text-base font-semibold tracking-wide uppercase">équipe VOIE</p>
          <table class="w-full text-left text-sm">
            <thead>
              <tr class="bg-secondary-900/10 border-primary-200 border-b">
                <th class="text-secondary-800 px-2 py-1.5 font-semibold">Fonction</th>
                <th class="text-secondary-800 px-2 py-1.5 font-semibold">Nom</th>
                <th class="text-secondary-800 px-2 py-1.5 font-semibold">Email</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="getUserName(contactsTravaux?.rlt_voie_principale)" class="border-primary-100 border-b">
                <td class="text-primary-700 px-2 py-1.5 font-bold">RLT Voie Principal</td>
                <td class="text-primary-700 px-2 py-1.5">{{ getUserName(contactsTravaux.rlt_voie_principale) }}</td>
                <td class="text-primary-700 px-2 py-1.5">
                  <a
                    v-if="getUserEmail(contactsTravaux.rlt_voie_principale)"
                    :href="`mailto:${getUserEmail(contactsTravaux.rlt_voie_principale)}`"
                    class="hover:underline">
                    {{ getUserEmail(contactsTravaux.rlt_voie_principale) }}
                  </a>
                </td>
              </tr>

              <tr
                v-for="user in contactsTravaux?.rlt_voie_secondaire"
                :key="user.id"
                class="border-primary-100 border-b">
                <td class="text-primary-700 px-2 py-1.5 font-bold">RLT Voie Secondaire</td>
                <td class="text-primary-700 px-2 py-1.5">{{ getUserName(user) }}</td>
                <td class="text-primary-700 px-2 py-1.5">
                  <a v-if="getUserEmail(user)" :href="`mailto:${getUserEmail(user)}`" class="hover:underline">
                    {{ getUserEmail(user) }}
                  </a>
                </td>
              </tr>

              <tr v-for="user in contactsTravaux?.kv_voie" class="border-primary-100 border-b">
                <td class="text-primary-700 px-2 py-1.5 font-bold">Contrôleur Voie</td>
                <td class="text-primary-700 px-2 py-1.5">{{ getUserName(user) }}</td>
                <td class="text-primary-700 px-2 py-1.5">
                  <a v-if="getUserEmail(user)" :href="`mailto:${getUserEmail(user)}`" class="hover:underline">
                    {{ getUserEmail(user) }}
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- SES -->
        <div
          v-if="
            contactsTravaux &&
            (getUserName(contactsTravaux?.rlt_voie_principale) ||
              getUserName(contactsTravaux?.rlt_ses_principale) ||
              getUserName(contactsTravaux?.rlt_cat_principale) ||
              getUserName(contactsTravaux?.preop_voie) ||
              getUserName(contactsTravaux?.preop_ses) ||
              getUserName(contactsTravaux?.logistique))
          "
          class="mb-4">
          <p class="text-primary-600 mb-2 pt-8 text-base font-semibold tracking-wide uppercase">équipe SES</p>
          <table class="w-full text-left text-sm">
            <thead>
              <tr class="bg-secondary-900/10 border-primary-200 border-b">
                <th class="text-secondary-800 px-2 py-1.5 font-semibold">Fonction</th>
                <th class="text-secondary-800 px-2 py-1.5 font-semibold">Nom</th>
                <th class="text-secondary-800 px-2 py-1.5 font-semibold">Email</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="getUserName(contactsTravaux?.rlt_ses_principale)" class="border-primary-100 border-b">
                <td class="text-primary-700 px-2 py-1.5 font-bold">RLT SES Principal</td>
                <td class="text-primary-700 px-2 py-1.5">{{ getUserName(contactsTravaux.rlt_ses_principale) }}</td>
                <td class="text-primary-700 px-2 py-1.5">
                  <a
                    v-if="getUserEmail(contactsTravaux.rlt_ses_principale)"
                    :href="`mailto:${getUserEmail(contactsTravaux.rlt_ses_principale)}`"
                    class="hover:underline">
                    {{ getUserEmail(contactsTravaux.rlt_ses_principale) }}
                  </a>
                </td>
              </tr>

              <tr
                v-for="user in contactsTravaux?.rlt_ses_secondaire"
                :key="user.id"
                class="border-primary-100 border-b">
                <td class="text-primary-700 px-2 py-1.5 font-bold">RLT SES Secondaire</td>
                <td class="text-primary-700 px-2 py-1.5">{{ getUserName(user) }}</td>
                <td class="text-primary-700 px-2 py-1.5">
                  <a v-if="getUserEmail(user)" :href="`mailto:${getUserEmail(user)}`" class="hover:underline">
                    {{ getUserEmail(user) }}
                  </a>
                </td>
              </tr>

              <tr v-for="user in contactsTravaux?.kv_ses" class="border-primary-100 border-b">
                <td class="text-primary-700 px-2 py-1.5 font-bold">Contrôleur SES</td>
                <td class="text-primary-700 px-2 py-1.5">{{ getUserName(user) }}</td>
                <td class="text-primary-700 px-2 py-1.5">
                  <a v-if="getUserEmail(user)" :href="`mailto:${getUserEmail(user)}`" class="hover:underline">
                    {{ getUserEmail(user) }}
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- CAT -->
        <div
          v-if="
            contactsTravaux &&
            (getUserName(contactsTravaux?.rlt_cat_principale) ||
              getUserName(contactsTravaux?.rlt_cat_secondaire) ||
              getUserName(contactsTravaux?.kv_cat))
          "
          class="mb-4">
          <p class="text-primary-600 mb-2 pt-8 text-base font-semibold tracking-wide uppercase">équipe CAT</p>
          <table class="w-full text-left text-sm">
            <thead>
              <tr class="bg-secondary-900/10 border-primary-200 border-b">
                <th class="text-secondary-800 px-2 py-1.5 font-semibold">Fonction</th>
                <th class="text-secondary-800 px-2 py-1.5 font-semibold">Nom</th>
                <th class="text-secondary-800 px-2 py-1.5 font-semibold">Email</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="getUserName(contactsTravaux?.rlt_cat_principale)" class="border-primary-100 border-b">
                <td class="text-primary-700 px-2 py-1.5 font-bold">RLT CAT Principal</td>
                <td class="text-primary-700 px-2 py-1.5">{{ getUserName(contactsTravaux.rlt_cat_principale) }}</td>
                <td class="text-primary-700 px-2 py-1.5">
                  <a
                    v-if="getUserEmail(contactsTravaux.rlt_cat_principale)"
                    :href="`mailto:${getUserEmail(contactsTravaux.rlt_cat_principale)}`"
                    class="hover:underline">
                    {{ getUserEmail(contactsTravaux.rlt_cat_principale) }}
                  </a>
                </td>
              </tr>

              <tr
                v-for="user in contactsTravaux?.rlt_cat_secondaire"
                :key="user.id"
                class="border-primary-100 border-b">
                <td class="text-primary-700 px-2 py-1.5 font-bold">RLT CAT Secondaire</td>
                <td class="text-primary-700 px-2 py-1.5">{{ getUserName(user) }}</td>
                <td class="text-primary-700 px-2 py-1.5">
                  <a v-if="getUserEmail(user)" :href="`mailto:${getUserEmail(user)}`" class="hover:underline">
                    {{ getUserEmail(user) }}
                  </a>
                </td>
              </tr>

              <tr v-for="user in contactsTravaux?.kv_cat" class="border-primary-100 border-b">
                <td class="text-primary-700 px-2 py-1.5 font-bold">Contrôleur CAT</td>
                <td class="text-primary-700 px-2 py-1.5">{{ getUserName(user) }}</td>
                <td class="text-primary-700 px-2 py-1.5">
                  <a v-if="getUserEmail(user)" :href="`mailto:${getUserEmail(user)}`" class="hover:underline">
                    {{ getUserEmail(user) }}
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pré-op & Logistique -->
        <div
          v-if="
            contactsTravaux &&
            (getUserName(contactsTravaux?.preop_voie) ||
              getUserName(contactsTravaux?.preop_ses) ||
              getUserName(contactsTravaux?.logistique))
          "
          class="mb-4">
          <p class="text-primary-600 mb-2 pt-8 text-base font-semibold tracking-wide uppercase">Cellule Pré-op</p>
          <table class="w-full text-left text-sm">
            <thead>
              <tr class="bg-secondary-900/10 border-primary-200 border-b">
                <th class="text-secondary-800 px-2 py-1.5 font-semibold">Fonction</th>
                <th class="text-secondary-800 px-2 py-1.5 font-semibold">Nom</th>
                <th class="text-secondary-800 px-2 py-1.5 font-semibold">Email</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="getUserName(contactsTravaux?.preop_voie)" class="border-primary-100 border-b">
                <td class="text-primary-700 px-2 py-1.5 font-bold">Spécialité Voie</td>
                <td class="text-primary-700 px-2 py-1.5">{{ getUserName(contactsTravaux.preop_voie) }}</td>
                <td class="text-primary-700 px-2 py-1.5">
                  <a
                    v-if="getUserEmail(contactsTravaux.preop_voie)"
                    :href="`mailto:${getUserEmail(contactsTravaux.preop_voie)}`"
                    class="hover:underline">
                    {{ getUserEmail(contactsTravaux.preop_voie) }}
                  </a>
                </td>
              </tr>

              <tr v-if="getUserName(contactsTravaux?.preop_ses)" class="border-primary-100 border-b">
                <td class="text-primary-700 px-2 py-1.5 font-bold">Spécialité SES</td>
                <td class="text-primary-700 px-2 py-1.5">{{ getUserName(contactsTravaux.preop_ses) }}</td>
                <td class="text-primary-700 px-2 py-1.5">
                  <a
                    v-if="getUserEmail(contactsTravaux.preop_ses)"
                    :href="`mailto:${getUserEmail(contactsTravaux.preop_ses)}`"
                    class="hover:underline">
                    {{ getUserEmail(contactsTravaux.preop_ses) }}
                  </a>
                </td>
              </tr>

              <tr v-if="getUserName(contactsTravaux?.logistique)" class="border-primary-100 border-b">
                <td class="text-primary-700 px-2 py-1.5 font-bold">Spécialité Logistique</td>
                <td class="text-primary-700 px-2 py-1.5">{{ getUserName(contactsTravaux.logistique) }}</td>
                <td class="text-primary-700 px-2 py-1.5">
                  <a
                    v-if="getUserEmail(contactsTravaux.logistique)"
                    :href="`mailto:${getUserEmail(contactsTravaux.logistique)}`"
                    class="hover:underline">
                    {{ getUserEmail(contactsTravaux.logistique) }}
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Superviseurs -->
        <div v-if="contactsTravaux && getUserName(contactsTravaux?.supervisor)" class="mb-4">
          <p class="text-primary-600 mb-2 pt-8 text-base font-semibold tracking-wide uppercase">Superviseurs</p>
          <table class="w-full text-left text-sm">
            <thead>
              <tr class="bg-secondary-900/10 border-primary-200 border-b">
                <th class="text-secondary-800 px-2 py-1.5 font-semibold">Fonction</th>
                <th class="text-secondary-800 px-2 py-1.5 font-semibold">Nom</th>
                <th class="text-secondary-800 px-2 py-1.5 font-semibold">Email</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in contactsTravaux?.supervisor" :key="user.id" class="border-primary-100 border-b">
                <td class="text-primary-700 px-2 py-1.5 font-bold">Superviseur</td>
                <td class="text-primary-700 px-2 py-1.5">{{ getUserName(user) }}</td>
                <td class="text-primary-700 px-2 py-1.5">
                  <a v-if="getUserEmail(user)" :href="`mailto:${getUserEmail(user)}`" class="hover:underline">
                    {{ getUserEmail(user) }}
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <AppSlideOver :sideModal="showEditTravaux" :closeSideModal="() => (showEditTravaux = false)">
      <AppSlideOverContent v-if="showEditTravaux" :closeSideModal="() => (showEditTravaux = false)">
        <template #header>
          <h2 class="text-primary-800 font-[Pacifico] text-3xl">Équipe travaux</h2>
          <p class="text-primary-700 text-sm">Modifier l'équipe travaux du chantier</p>
        </template>

        <template #default>
          <form @submit.prevent="saveTravaux" class="space-y-6">
            <!-- RLT Voie -->
            <div class="space-y-4">
              <div class="border-primary-200 flex items-center gap-2 border-b pb-2">
                <Icon name="lucide:train-track" size="16" class="text-primary-700" />
                <h3 class="text-primary-700 text-sm font-semibold tracking-wider uppercase">RLT Voie</h3>
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
              <div class="border-primary-200 flex items-center gap-2 border-b pb-2">
                <Icon name="lucide:zap" size="16" class="text-primary-700" />
                <h3 class="text-primary-700 text-sm font-semibold tracking-wider uppercase">RLT SES</h3>
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
              <div class="border-primary-200 flex items-center gap-2 border-b pb-2">
                <Icon name="lucide:cable" size="16" class="text-primary-700" />
                <h3 class="text-primary-700 text-sm font-semibold tracking-wider uppercase">RLT CAT</h3>
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
              <div class="border-primary-200 flex items-center gap-2 border-b pb-2">
                <Icon name="lucide:clipboard-check" size="16" class="text-primary-700" />
                <h3 class="text-primary-700 text-sm font-semibold tracking-wider uppercase">Pré-op</h3>
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
              <div class="border-primary-200 flex items-center gap-2 border-b pb-2">
                <Icon name="lucide:truck" size="16" class="text-primary-700" />
                <h3 class="text-primary-700 text-sm font-semibold tracking-wider uppercase">Logistique</h3>
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
              <div class="border-primary-200 flex items-center gap-2 border-b pb-2">
                <Icon name="lucide:eye" size="16" class="text-primary-700" />
                <h3 class="text-primary-700 text-sm font-semibold tracking-wider uppercase">Superviseurs</h3>
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
          <div class="border-primary-200 flex justify-end gap-3 border-t pt-4">
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
