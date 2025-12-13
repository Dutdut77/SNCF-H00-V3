<script setup>
const props = defineProps({
  chantier: {
    type: Object,
    required: true
  }
})

const { getContactsGeneralites, upsertContactsGeneralites } = useContacts()
const { getAllUsers, users } = useUsers()
const { setLoader } = useLoader()

const contactsGeneralites = ref([])
const showEditGeneralites = ref(false)
const editFormGeneralites = ref({
  chef_projet_nom: '',
  chef_projet_email: '',
  coordinateur_securite_nom: '',
  coordinateur_securite_email: ''
})

// Options utilisateurs pour les selects (travaux)
const userOptions = computed(() => {
  return users.value.map((u) => ({
    id: u.id,
    label: u.prenom && u.nom ? `${u.prenom} ${u.nom}` : u.email
  }))
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
// GÉNÉRALITÉS
// ============================================
const openEditGeneralites = () => {
  editFormGeneralites.value = {
    chef_projet_nom: contactsGeneralites.value?.chef_projet_nom || '',
    chef_projet_email: contactsGeneralites.value?.chef_projet_email || '',
    coordinateur_securite_nom: contactsGeneralites.value?.coordinateur_securite_nom || '',
    coordinateur_securite_email: contactsGeneralites.value?.coordinateur_securite_email || ''
  }
  showEditGeneralites.value = true
}

const saveGeneralites = async () => {
  setLoader(true)
  try {
    const result = await upsertContactsGeneralites(props.chantier.id, editFormGeneralites.value)
    if (result) {
      contactsGeneralites.value = result
      showEditGeneralites.value = false
    }
  } finally {
    setLoader(false)
  }
}

onMounted(async () => {
  const contacts = await getContactsGeneralites(props.chantier.id)
  contactsGeneralites.value = contacts
})
</script>

<template>
  <div>
    <div class="space-y-6">
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-3">
          <div
            class="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-violet-100 to-purple-200 dark:from-violet-900/50 dark:to-purple-800/50">
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
              <p class="hidden lg:block">Modifier</p>
            </span>
          </template>
        </AppButtonValidated>
      </div>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <!-- Chef de projet -->
        <div class="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-700/50">
          <div class="mb-3 flex items-center gap-2">
            <Icon name="lucide:briefcase" size="16" class="text-violet-500" />
            <label class="text-xs font-semibold tracking-wider text-violet-600 uppercase dark:text-violet-400">
              Chef de projet
            </label>
          </div>
          <p class="text-base font-semibold text-gray-900 dark:text-white">
            {{ contactsGeneralites?.chef_projet_nom || '-' }}
          </p>
          <a
            v-if="contactsGeneralites?.chef_projet_email"
            :href="`mailto:${contactsGeneralites.chef_projet_email}`"
            class="mt-1 flex items-center gap-1 text-sm text-violet-600 hover:underline dark:text-violet-400">
            <Icon name="lucide:mail" size="14" />
            {{ contactsGeneralites.chef_projet_email }}
          </a>
          <p v-else class="text-sm text-gray-400">Aucun email</p>
        </div>

        <!-- Coordinateur sécurité -->
        <div class="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-700/50">
          <div class="mb-3 flex items-center gap-2">
            <Icon name="lucide:shield-check" size="16" class="text-emerald-500" />
            <label class="text-xs font-semibold tracking-wider text-emerald-600 uppercase dark:text-emerald-400">
              Coordinateur sécurité
            </label>
          </div>
          <p class="text-base font-semibold text-gray-900 dark:text-white">
            {{ contactsGeneralites?.coordinateur_securite_nom || '-' }}
          </p>
          <a
            v-if="contactsGeneralites?.coordinateur_securite_email"
            :href="`mailto:${contactsGeneralites.coordinateur_securite_email}`"
            class="mt-1 flex items-center gap-1 text-sm text-emerald-600 hover:underline dark:text-emerald-400">
            <Icon name="lucide:mail" size="14" />
            {{ contactsGeneralites.coordinateur_securite_email }}
          </a>
          <p v-else class="text-sm text-gray-400">Aucun email</p>
        </div>
      </div>
    </div>

    <AppSlideOver :sideModal="showEditGeneralites" :closeSideModal="() => (showEditGeneralites = false)">
      <AppSlideOverContent v-if="showEditGeneralites" :closeSideModal="() => (showEditGeneralites = false)">
        <template #header>
          <h2 class="font-[Pacifico] text-3xl text-gray-800 dark:text-white">Contacts généraux</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">Modifier les contacts généraux du chantier</p>
        </template>

        <template #default>
          <form @submit.prevent="saveGeneralites" class="space-y-6">
            <!-- Chef de projet -->
            <div class="space-y-4">
              <div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700">
                <Icon name="lucide:briefcase" size="16" class="text-violet-500" />
                <h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300">
                  Chef de projet
                </h3>
              </div>
              <AppInput
                v-model="editFormGeneralites.chef_projet_nom"
                name="chef_projet_nom"
                title="Nom"
                placeholder="Nom du chef de projet" />
              <AppInput
                v-model="editFormGeneralites.chef_projet_email"
                name="chef_projet_email"
                title="Email"
                type="email"
                placeholder="email@exemple.com" />
            </div>

            <!-- Coordinateur sécurité -->
            <div class="space-y-4">
              <div class="flex items-center gap-2 border-b border-gray-200 pb-2 dark:border-gray-700">
                <Icon name="lucide:shield-check" size="16" class="text-emerald-500" />
                <h3 class="text-sm font-semibold tracking-wider text-gray-700 uppercase dark:text-gray-300">
                  Coordinateur sécurité
                </h3>
              </div>
              <AppInput
                v-model="editFormGeneralites.coordinateur_securite_nom"
                name="coordinateur_securite_nom"
                title="Nom"
                placeholder="Nom du coordinateur" />
              <AppInput
                v-model="editFormGeneralites.coordinateur_securite_email"
                name="coordinateur_securite_email"
                title="Email"
                type="email"
                placeholder="email@exemple.com" />
            </div>
          </form>
        </template>

        <template #footer>
          <div class="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
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
  </div>
</template>
