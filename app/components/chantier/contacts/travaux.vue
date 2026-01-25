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

const contactsTravaux = ref(null)
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

const contact = computed(() => contactsTravaux.value || {})

const hasVoie = computed(() => {
  const c = contact.value
  return Boolean(c.rlt_voie_principale) || (c.rlt_voie_secondaire?.length ?? 0) > 0 || (c.kv_voie?.length ?? 0) > 0
})

const hasSes = computed(() => {
  const c = contact.value
  return Boolean(c.rlt_ses_principale) || (c.rlt_ses_secondaire?.length ?? 0) > 0 || (c.kv_ses?.length ?? 0) > 0
})

const hasCat = computed(() => {
  const c = contact.value
  return Boolean(c.rlt_cat_principale) || (c.rlt_cat_secondaire?.length ?? 0) > 0 || (c.kv_cat?.length ?? 0) > 0
})

const hasPreopLog = computed(() => {
  const c = contact.value
  return Boolean(c.preop_voie) || Boolean(c.preop_ses) || Boolean(c.logistique)
})

const hasSupervisors = computed(() => (contact.value?.supervisor?.length ?? 0) > 0)

const hasAny = computed(
  () => hasVoie.value || hasSes.value || hasCat.value || hasPreopLog.value || hasSupervisors.value
)

const countSection = (emails) => {
  if (!Array.isArray(emails)) return 0
  return emails.filter(Boolean).length
}

const voieCount = computed(() =>
  countSection([
    contact.value?.rlt_voie_principale,
    ...(contact.value?.rlt_voie_secondaire || []),
    ...(contact.value?.kv_voie || [])
  ])
)
const sesCount = computed(() =>
  countSection([
    contact.value?.rlt_ses_principale,
    ...(contact.value?.rlt_ses_secondaire || []),
    ...(contact.value?.kv_ses || [])
  ])
)
const catCount = computed(() =>
  countSection([
    contact.value?.rlt_cat_principale,
    ...(contact.value?.rlt_cat_secondaire || []),
    ...(contact.value?.kv_cat || [])
  ])
)
const preopCount = computed(() =>
  countSection([contact.value?.preop_voie, contact.value?.preop_ses, contact.value?.logistique])
)
const supervisorsCount = computed(() => countSection(contact.value?.supervisor || []))

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
    rlt_voie_principale: contact.value?.rlt_voie_principale || null,
    rlt_voie_secondaire: contact.value?.rlt_voie_secondaire || [],
    rlt_ses_principale: contact.value?.rlt_ses_principale || null,
    rlt_ses_secondaire: contact.value?.rlt_ses_secondaire || [],
    rlt_cat_principale: contact.value?.rlt_cat_principale || null,
    rlt_cat_secondaire: contact.value?.rlt_cat_secondaire || [],
    kv_voie: contact.value?.kv_voie || [],
    kv_ses: contact.value?.kv_ses || [],
    kv_cat: contact.value?.kv_cat || [],
    preop_voie: contact.value?.preop_voie || null,
    preop_ses: contact.value?.preop_ses || null,
    logistique: contact.value?.logistique || null,
    supervisor: contact.value?.supervisor || []
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

  <div class="flex flex-col gap-4 h-full overflow-auto p-4 w-full ">
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

    <div>
      <div v-if="hasAny" class="space-y-6">
        <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <!-- VOIE -->
          <section v-if="hasVoie"
            class="border-primary-200 hover:border-secondary-500 rounded-lg border bg-white p-4 shadow-lg transition-all duration-300 hover:scale-[1.02] dark:bg-slate-900">
            <div class="mb-3 flex items-center gap-2">
              <Icon name="lucide:train-track" size="16" class="text-primary-700" />
              <p class="text-primary-700 text-sm font-semibold tracking-wider uppercase">Équipe Voie</p>
            </div>
            <div class="space-y-2">
              <div v-if="contact?.rlt_voie_principale"
                class="border-primary-200 bg-primary-50 rounded-lg border px-3 py-2">
                <div class="flex flex-wrap items-center gap-2">
                  <span
                    class="border-secondary-500 bg-secondary-500/80 text-secondary-50 inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-semibold">
                    RLT Voie - Principal
                  </span>
                  <span class="text-primary-800 font-medium">{{ getUserName(contact.rlt_voie_principale) }}</span>
                </div>
                <a v-if="getUserEmail(contact.rlt_voie_principale)"
                  :href="`mailto:${getUserEmail(contact.rlt_voie_principale)}`"
                  class="text-primary-600 mt-1 inline-flex items-center gap-2 text-xs break-all hover:underline">
                  <Icon name="lucide:mail" size="14" />
                  {{ getUserEmail(contact.rlt_voie_principale) }}
                </a>
              </div>

              <div v-for="userEmail in contact?.rlt_voie_secondaire || []" :key="userEmail"
                class="border-primary-200 bg-primary-50 rounded-lg border px-3 py-2">
                <div class="flex flex-wrap items-center gap-2">
                  <span
                    class="border-secondary-500 bg-secondary-500/80 text-secondary-50 inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-semibold">
                    RLT Voie - Secondaire
                  </span>
                  <span class="text-primary-800 font-medium">{{ getUserName(userEmail) }}</span>
                </div>
                <a v-if="getUserEmail(userEmail)" :href="`mailto:${getUserEmail(userEmail)}`"
                  class="text-primary-600 mt-1 inline-flex items-center gap-2 text-xs break-all hover:underline">
                  <Icon name="lucide:mail" size="14" />
                  {{ getUserEmail(userEmail) }}
                </a>
              </div>

              <div v-for="userEmail in contact?.kv_voie || []" :key="userEmail"
                class="border-primary-200 bg-primary-50 rounded-lg border px-3 py-2">
                <div class="flex flex-wrap items-center gap-2">
                  <span
                    class="border-secondary-500 bg-secondary-500/80 text-secondary-50 inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-semibold">
                    Contrôleur Voie
                  </span>
                  <span class="text-primary-800 font-medium">{{ getUserName(userEmail) }}</span>
                </div>
                <a v-if="getUserEmail(userEmail)" :href="`mailto:${getUserEmail(userEmail)}`"
                  class="text-primary-600 mt-1 inline-flex items-center gap-2 text-xs break-all hover:underline">
                  <Icon name="lucide:mail" size="14" />
                  {{ getUserEmail(userEmail) }}
                </a>
              </div>
            </div>
          </section>

          <!-- SES -->
          <section v-if="hasSes"
            class="border-primary-200 hover:border-secondary-500 rounded-lg border bg-white p-4 shadow-lg transition-all duration-300 hover:scale-[1.02] dark:bg-slate-900">
            <div class="mb-3 flex items-center gap-2">
              <Icon name="lucide:zap" size="16" class="text-primary-700" />
              <p class="text-primary-700 text-sm font-semibold tracking-wider uppercase">Équipe SES</p>
            </div>
            <div class="space-y-2">
              <div v-if="contact?.rlt_ses_principale"
                class="border-primary-200 bg-primary-50 rounded-lg border px-3 py-2">
                <div class="flex flex-wrap items-center gap-2">
                  <span
                    class="border-secondary-500 bg-secondary-500/80 text-secondary-50 inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-semibold">
                    RLT SES - Principal
                  </span>
                  <span class="text-primary-800 font-medium">{{ getUserName(contact.rlt_ses_principale) }}</span>
                </div>
                <a v-if="getUserEmail(contact.rlt_ses_principale)"
                  :href="`mailto:${getUserEmail(contact.rlt_ses_principale)}`"
                  class="text-primary-600 mt-1 inline-flex items-center gap-2 text-xs break-all hover:underline">
                  <Icon name="lucide:mail" size="14" />
                  {{ getUserEmail(contact.rlt_ses_principale) }}
                </a>
              </div>

              <div v-for="userEmail in contact?.rlt_ses_secondaire || []" :key="userEmail"
                class="border-primary-200 bg-primary-50 rounded-lg border px-3 py-2">
                <div class="flex flex-wrap items-center gap-2">
                  <span
                    class="border-secondary-500 bg-secondary-500/80 text-secondary-50 inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-semibold">
                    RLT SES - Secondaire
                  </span>
                  <span class="text-primary-800 font-medium">{{ getUserName(userEmail) }}</span>
                </div>
                <a v-if="getUserEmail(userEmail)" :href="`mailto:${getUserEmail(userEmail)}`"
                  class="text-primary-600 mt-1 inline-flex items-center gap-2 text-xs break-all hover:underline">
                  <Icon name="lucide:mail" size="14" />
                  {{ getUserEmail(userEmail) }}
                </a>
              </div>

              <div v-for="userEmail in contact?.kv_ses || []" :key="userEmail"
                class="border-primary-200 bg-primary-50 rounded-lg border px-3 py-2">
                <div class="flex flex-wrap items-center gap-2">
                  <span
                    class="border-secondary-500 bg-secondary-500/80 text-secondary-50 inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-semibold">
                    Contrôleur SES
                  </span>
                  <span class="text-primary-800 font-medium">{{ getUserName(userEmail) }}</span>
                </div>
                <a v-if="getUserEmail(userEmail)" :href="`mailto:${getUserEmail(userEmail)}`"
                  class="text-primary-600 mt-1 inline-flex items-center gap-2 text-xs break-all hover:underline">
                  <Icon name="lucide:mail" size="14" />
                  {{ getUserEmail(userEmail) }}
                </a>
              </div>
            </div>
          </section>

          <!-- CAT -->
          <section v-if="hasCat"
            class="border-primary-200 hover:border-secondary-500 rounded-lg border bg-white p-4 shadow-lg transition-all duration-300 hover:scale-[1.02] dark:bg-slate-900">
            <div class="mb-3 flex items-center gap-2">
              <Icon name="lucide:cable" size="16" class="text-primary-700" />
              <p class="text-primary-700 text-sm font-semibold tracking-wider uppercase">Équipe CAT</p>
            </div>
            <div class="space-y-2">
              <div v-if="contact?.rlt_cat_principale"
                class="border-primary-200 bg-primary-50 rounded-lg border px-3 py-2">
                <div class="flex flex-wrap items-center gap-2">
                  <span
                    class="border-secondary-500 bg-secondary-500/80 text-secondary-50 inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-semibold">
                    RLT CAT - Principal
                  </span>
                  <span class="text-primary-800 font-medium">{{ getUserName(contact.rlt_cat_principale) }}</span>
                </div>
                <a v-if="getUserEmail(contact.rlt_cat_principale)"
                  :href="`mailto:${getUserEmail(contact.rlt_cat_principale)}`"
                  class="text-primary-600 mt-1 inline-flex items-center gap-2 text-xs break-all hover:underline">
                  <Icon name="lucide:mail" size="14" />
                  {{ getUserEmail(contact.rlt_cat_principale) }}
                </a>
              </div>

              <div v-for="userEmail in contact?.rlt_cat_secondaire || []" :key="userEmail"
                class="border-primary-200 bg-primary-50 rounded-lg border px-3 py-2">
                <div class="flex flex-wrap items-center gap-2">
                  <span
                    class="border-secondary-500 bg-secondary-500/80 text-secondary-50 inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-semibold">
                    RLT CAT - Secondaire
                  </span>
                  <span class="text-primary-800 font-medium">{{ getUserName(userEmail) }}</span>
                </div>
                <a v-if="getUserEmail(userEmail)" :href="`mailto:${getUserEmail(userEmail)}`"
                  class="text-primary-600 mt-1 inline-flex items-center gap-2 text-xs break-all hover:underline">
                  <Icon name="lucide:mail" size="14" />
                  {{ getUserEmail(userEmail) }}
                </a>
              </div>

              <div v-for="userEmail in contact?.kv_cat || []" :key="userEmail"
                class="border-primary-200 bg-primary-50 rounded-lg border px-3 py-2">
                <div class="flex flex-wrap items-center gap-2">
                  <span
                    class="border-secondary-500 bg-secondary-500/80 text-secondary-50 inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-semibold">
                    Contrôleur CAT
                  </span>
                  <span class="text-primary-800 font-medium">{{ getUserName(userEmail) }}</span>
                </div>
                <a v-if="getUserEmail(userEmail)" :href="`mailto:${getUserEmail(userEmail)}`"
                  class="text-primary-600 mt-1 inline-flex items-center gap-2 text-xs break-all hover:underline">
                  <Icon name="lucide:mail" size="14" />
                  {{ getUserEmail(userEmail) }}
                </a>
              </div>
            </div>
          </section>
        </div>

        <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <!-- Pré-op & Logistique -->
          <section v-if="hasPreopLog"
            class="border-primary-200 hover:border-secondary-500 rounded-lg border bg-white p-4 shadow-lg transition-all duration-300 hover:scale-[1.02] dark:bg-slate-900">
            <div class="mb-3 flex items-center gap-2">
              <Icon name="lucide:clipboard-check" size="16" class="text-primary-700" />
              <p class="text-primary-700 text-sm font-semibold tracking-wider uppercase">
                Cellule Pré-op / Logistique
              </p>
            </div>
            <div class="space-y-2">
              <div v-if="contact?.preop_voie" class="border-primary-200 bg-primary-50 rounded-lg border px-3 py-2">
                <div class="flex flex-wrap items-center gap-2">
                  <span
                    class="border-secondary-500 bg-secondary-500/80 text-secondary-50 inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-semibold">
                    Pré-op - Voie
                  </span>
                  <span class="text-primary-800 font-medium">{{ getUserName(contact.preop_voie) }}</span>
                </div>
                <a v-if="getUserEmail(contact.preop_voie)" :href="`mailto:${getUserEmail(contact.preop_voie)}`"
                  class="text-primary-600 mt-1 inline-flex items-center gap-2 text-xs break-all hover:underline">
                  <Icon name="lucide:mail" size="14" />
                  {{ getUserEmail(contact.preop_voie) }}
                </a>
              </div>

              <div v-if="contact?.preop_ses" class="border-primary-200 bg-primary-50 rounded-lg border px-3 py-2">
                <div class="flex flex-wrap items-center gap-2">
                  <span
                    class="border-secondary-500 bg-secondary-500/80 text-secondary-50 inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-semibold">
                    Pré-op - SES
                  </span>
                  <span class="text-primary-800 font-medium">{{ getUserName(contact.preop_ses) }}</span>
                </div>
                <a v-if="getUserEmail(contact.preop_ses)" :href="`mailto:${getUserEmail(contact.preop_ses)}`"
                  class="text-primary-600 mt-1 inline-flex items-center gap-2 text-xs break-all hover:underline">
                  <Icon name="lucide:mail" size="14" />
                  {{ getUserEmail(contact.preop_ses) }}
                </a>
              </div>

              <div v-if="contact?.logistique" class="border-primary-200 bg-primary-50 rounded-lg border px-3 py-2">
                <div class="flex flex-wrap items-center gap-2">
                  <span
                    class="border-secondary-500 bg-secondary-500/80 text-secondary-50 inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-semibold">
                    Logistique
                  </span>
                  <span class="text-primary-800 font-medium">{{ getUserName(contact.logistique) }}</span>
                </div>
                <a v-if="getUserEmail(contact.logistique)" :href="`mailto:${getUserEmail(contact.logistique)}`"
                  class="text-primary-600 mt-1 inline-flex items-center gap-2 text-xs break-all hover:underline">
                  <Icon name="lucide:mail" size="14" />
                  {{ getUserEmail(contact.logistique) }}
                </a>
              </div>
            </div>
          </section>

          <!-- Superviseurs -->
          <section v-if="hasSupervisors"
            class="border-primary-200 hover:border-secondary-500 rounded-lg border bg-white p-4 shadow-lg transition-all duration-300 hover:scale-[1.02] dark:bg-slate-900">
            <div class="mb-3 flex items-center gap-2">
              <Icon name="lucide:eye" size="16" class="text-primary-700" />
              <p class="text-primary-700 text-sm font-semibold tracking-wider uppercase">Superviseurs</p>
            </div>
            <div class="space-y-2">
              <div v-for="userEmail in contact?.supervisor || []" :key="userEmail"
                class="border-primary-200 bg-primary-50 rounded-lg border px-3 py-2">
                <div class="flex flex-wrap items-center gap-2">
                  <span
                    class="border-secondary-500 bg-secondary-500/80 text-secondary-50 inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-semibold">
                    Superviseur
                  </span>
                  <span class="text-primary-800 font-medium">{{ getUserName(userEmail) }}</span>
                </div>
                <a v-if="getUserEmail(userEmail)" :href="`mailto:${getUserEmail(userEmail)}`"
                  class="text-primary-600 mt-1 inline-flex items-center gap-2 text-xs break-all hover:underline">
                  <Icon name="lucide:mail" size="14" />
                  {{ getUserEmail(userEmail) }}
                </a>
              </div>
            </div>
          </section>
        </div>
      </div>

      <div v-else class="text-primary-600 flex flex-col items-center justify-center py-12">
        <Icon name="lucide:hard-hat" size="48" class="mb-4 opacity-50" />
        <p class="text-lg font-medium">Aucun membre d'équipe renseigné</p>
        <p class="text-sm">Cliquez sur "Modifier" pour compléter l'équipe travaux</p>
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
            <AppSelect v-model="editFormTravaux.rlt_voie_principale" :options="userOptions(getUsersRltVoie)"
              title="Principal" placeholder="Sélectionner..." nullable />
            <AppSelectMultiple v-model="editFormTravaux.rlt_voie_secondaire" :options="userOptions(getUsersRltVoie)"
              title="Secondaire(s)" placeholder="Sélectionner un profil Voie" />
            <AppSelectMultiple v-model="editFormTravaux.kv_voie" :options="userOptions(getUsersKvVoie)"
              title="Contrôleur(s)" placeholder="Sélectionner un profil Voie" />
          </div>

          <!-- RLT SES -->
          <div class="space-y-4">
            <div class="border-primary-200 flex items-center gap-2 border-b pb-2">
              <Icon name="lucide:zap" size="16" class="text-primary-700" />
              <h3 class="text-primary-700 text-sm font-semibold tracking-wider uppercase">RLT SES</h3>
            </div>
            <AppSelect v-model="editFormTravaux.rlt_ses_principale" :options="userOptions(getUsersRltSes)"
              title="Principal" placeholder="Sélectionner..." nullable />

            <AppSelectMultiple v-model="editFormTravaux.rlt_ses_secondaire" :options="userOptions(getUsersRltSes)"
              title="Secondaire(s)" placeholder="Sélectionner un profil SES" />
            <AppSelectMultiple v-model="editFormTravaux.kv_ses" :options="userOptions(getUsersKvSes)"
              title="Contrôleur(s)" placeholder="Sélectionner un profil SES" />
          </div>

          <!-- RLT CAT -->
          <div class="space-y-4">
            <div class="border-primary-200 flex items-center gap-2 border-b pb-2">
              <Icon name="lucide:cable" size="16" class="text-primary-700" />
              <h3 class="text-primary-700 text-sm font-semibold tracking-wider uppercase">RLT CAT</h3>
            </div>
            <AppSelect v-model="editFormTravaux.rlt_cat_principale" :options="userOptions(getUsersRltCat)"
              title="Principal" placeholder="Sélectionner..." nullable />
            <AppSelectMultiple v-model="editFormTravaux.rlt_cat_secondaire" :options="userOptions(getUsersRltCat)"
              title="Secondaire(s)" placeholder="Sélectionner un profil CAT" />
            <AppSelectMultiple v-model="editFormTravaux.kv_cat" :options="userOptions(getUsersKvCat)"
              title="Contrôleur(s)" placeholder="Sélectionner un profil CAT" />
          </div>

          <!-- Pré-op -->
          <div class="space-y-4">
            <div class="border-primary-200 flex items-center gap-2 border-b pb-2">
              <Icon name="lucide:clipboard-check" size="16" class="text-primary-700" />
              <h3 class="text-primary-700 text-sm font-semibold tracking-wider uppercase">Pré-op</h3>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <AppSelect v-model="editFormTravaux.preop_voie" :options="userOptions(getUsersPreopVoie)" title="Voie"
                placeholder="Sélectionner..." nullable />
              <AppSelect v-model="editFormTravaux.preop_ses" :options="userOptions(getUsersPreopSes)" title="SES"
                placeholder="Sélectionner..." nullable />
            </div>
          </div>

          <!-- Logistique -->
          <div class="space-y-4">
            <div class="border-primary-200 flex items-center gap-2 border-b pb-2">
              <Icon name="lucide:truck" size="16" class="text-primary-700" />
              <h3 class="text-primary-700 text-sm font-semibold tracking-wider uppercase">Logistique</h3>
            </div>
            <AppSelect v-model="editFormTravaux.logistique" :options="userOptions(getUsersLogistique)"
              title="Responsable logistique" placeholder="Sélectionner..." nullable />
          </div>

          <!-- Superviseurs -->
          <div class="space-y-4">
            <div class="border-primary-200 flex items-center gap-2 border-b pb-2">
              <Icon name="lucide:eye" size="16" class="text-primary-700" />
              <h3 class="text-primary-700 text-sm font-semibold tracking-wider uppercase">Superviseurs</h3>
            </div>
            <AppSelectMultiple v-model="editFormTravaux.supervisor" :options="userOptions(getUsersRefRdu)"
              title="Superviseurs" placeholder="Sélectionner un superviseur" />
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

</template>
