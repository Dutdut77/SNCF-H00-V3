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
          <div class="bg-secondary-500/80 text-secondary-50 flex h-10 w-10 items-center justify-center rounded-xl">
            <Icon name="lucide:user-circle" size="20" />
          </div>
          <div>
            <h2 class="text-primary-800 text-lg font-bold">Contacts généraux</h2>
            <p class="text-primary-500 text-xs">Chef de projet et coordinateur sécurité</p>
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

      <!-- Généralités -->
      <div class="bg-primary-50 rounded-lg p-4 shadow-lg">
        <div
          v-if="
            contactsGeneralites &&
            (contactsGeneralites?.chef_projet_nom || contactsGeneralites?.coordinateur_securite_nom)
          "
          class="mb-4">
          <p class="text-primary-700 pb-4 text-base font-semibold tracking-wide uppercase">Généralités</p>

          <table class="w-full text-left text-sm">
            <thead>
              <tr class="bg-secondary-900/10 border-primary-200 border-b">
                <th class="text-secondary-800 px-2 py-1.5 font-semibold">Fonction</th>
                <th class="text-secondary-800 px-2 py-1.5 font-semibold">Nom</th>
                <th class="text-secondary-800 px-2 py-1.5 font-semibold">Email</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="contactsGeneralites?.chef_projet_nom" class="border-primary-100 border-b">
                <td class="text-primary-700 px-2 py-1.5 font-bold">Chef de projet</td>
                <td class="text-primary-700 px-2 py-1.5">{{ contactsGeneralites.chef_projet_nom }}</td>
                <td class="text-primary-700 px-2 py-1.5">
                  <a
                    v-if="contactsGeneralites?.chef_projet_email"
                    :href="`mailto:${contactsGeneralites.chef_projet_email}`"
                    class="hover:underline">
                    {{ contactsGeneralites.chef_projet_email }}
                  </a>
                </td>
              </tr>
              <tr v-if="contactsGeneralites?.coordinateur_securite_nom" class="border-primary-100 border-b">
                <td class="text-primary-700 px-2 py-1.5 font-bold">Coordinateur sécurité</td>
                <td class="text-primary-700 px-2 py-1.5">{{ contactsGeneralites.coordinateur_securite_nom }}</td>
                <td class="text-primary-700 px-2 py-1.5">
                  <a
                    v-if="contactsGeneralites?.coordinateur_securite_email"
                    :href="`mailto:${contactsGeneralites.coordinateur_securite_email}`"
                    class="hover:underline">
                    {{ contactsGeneralites.coordinateur_securite_email }}
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="text-primary-600 flex flex-col items-center justify-center py-12">
          <Icon name="lucide:users" size="48" class="mb-4 opacity-50" />
          <p class="text-lg font-medium">Aucun contact d'enregistré</p>
          <p class="text-sm">Cliquez sur "Modifier" pour ajouter un contact</p>
        </div>
      </div>
    </div>

    <AppSlideOver :sideModal="showEditGeneralites" :closeSideModal="() => (showEditGeneralites = false)">
      <AppSlideOverContent v-if="showEditGeneralites" :closeSideModal="() => (showEditGeneralites = false)">
        <template #header>
          <h2 class="text-primary-800 font-[Pacifico] text-3xl">Contacts généraux</h2>
          <p class="text-primary-500 text-sm">Modifier les contacts généraux du chantier</p>
        </template>

        <template #default>
          <form @submit.prevent="saveGeneralites" class="space-y-6">
            <!-- Chef de projet -->
            <div class="space-y-4">
              <div class="border-primary-200 flex items-center gap-2 border-b pb-2">
                <Icon name="lucide:briefcase" size="16" class="text-primary-700" />
                <h3 class="text-primary-700 text-sm font-semibold tracking-wider uppercase">Chef de projet</h3>
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
              <div class="border-primary-200 flex items-center gap-2 border-b pb-2">
                <Icon name="lucide:shield-check" size="16" class="text-primary-700" />
                <h3 class="text-primary-700 text-sm font-semibold tracking-wider uppercase">Coordinateur sécurité</h3>
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
          <div class="border-primary-200 flex justify-end gap-3 border-t pt-4">
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
