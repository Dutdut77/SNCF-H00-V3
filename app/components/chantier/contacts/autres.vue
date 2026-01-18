<script setup>
const props = defineProps({
  chantier: {
    type: Object,
    required: true
  }
})

const { getContactsAutres, addContactAutre, updateContactAutre, deleteContactAutre } = useContacts()
const { getAllUsers, users } = useUsers()
const { setLoader } = useLoader()

const contactsAutres = ref([])
const showAddAutre = ref(false)
const showEditAutre = ref(false)
const editFormAutre = ref({
  id: null,
  metier: '',
  entreprise: '',
  responsable_nom: '',
  responsable_email: ''
})

// Charger toutes les données
const loadAllData = async () => {
  setLoader(true)
  try {
    await getAllUsers()
    const autres = await getContactsAutres(props.chantier.id)
    contactsAutres.value = autres
  } finally {
    setLoader(false)
  }
}

onMounted(async () => {
  await loadAllData()
})

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
  }
  showAddAutre.value = true
}

const openEditAutre = (contact) => {
  editFormAutre.value = {
    id: contact.id,
    metier: contact.metier || '',
    entreprise: contact.entreprise || '',
    responsable_nom: contact.responsable_nom || '',
    responsable_email: contact.responsable_email || ''
  }
  showEditAutre.value = true
}

const saveAutre = async () => {
  setLoader(true)
  try {
    let result
    if (editFormAutre.value.id) {
      result = await updateContactAutre(editFormAutre.value.id, editFormAutre.value)
    } else {
      result = await addContactAutre(props.chantier.id, editFormAutre.value)
    }
    if (result) {
      contactsAutres.value = await getContactsAutres(props.chantier.id)
      showAddAutre.value = false
      showEditAutre.value = false
    }
  } finally {
    setLoader(false)
  }
}

const handleDeleteAutre = async (id) => {
  setLoader(true)
  try {
    const success = await deleteContactAutre(id)
    if (success) {
      contactsAutres.value = await getContactsAutres(props.chantier.id)
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
            <Icon name="lucide:users" size="20" />
          </div>
          <div>
            <h2 class="text-primary-800 text-lg font-bold">Autres contacts</h2>
            <p class="text-primary-500 dark:text-primary-400 text-xs">Contacts divers du chantier</p>
          </div>
        </div>
        <AppButtonValidated type="button" theme="primary" @click="openAddAutre">
          <template #default>
            <span class="flex items-center gap-2">
              <Icon name="lucide:plus" size="16" />
              <p class="hidden lg:block">Ajouter</p>
            </span>
          </template>
        </AppButtonValidated>
      </div>

      <!-- Liste des autres contacts -->
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="contact in contactsAutres"
          :key="contact.id"
          class="border-primary-200 bg-primary-50 hover:border-secondary-500 rounded-lg border p-4 shadow-lg transition-all duration-300 hover:scale-[1.02]">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="mb-2 flex items-center gap-2">
                <span
                  class="border-secondary-500 bg-secondary-500/80 text-secondary-50 rounded-sm border px-2 py-0.5 text-xs font-medium">
                  {{ contact.metier || 'Non défini' }}
                </span>
              </div>
              <p class="text-primary-900 text-lg font-bold">{{ contact.entreprise || '-' }}</p>
              <div class="mt-2 space-y-1">
                <p class="text-primary-600 text-sm">
                  <span class="text-primary-400">Responsable:</span>
                  {{ contact.responsable_nom || '-' }}
                </p>
                <a
                  v-if="contact.responsable_email"
                  :href="`mailto:${contact.responsable_email}`"
                  class="text-primary-600 flex items-center gap-1 text-sm hover:underline">
                  <Icon name="lucide:mail" size="14" />
                  {{ contact.responsable_email }}
                </a>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button
                @click="openEditAutre(contact)"
                class="hover:text-primary-600 text-primary-500 hover:bg-primary-200 flex items-center justify-center rounded-lg p-2 transition-colors">
                <Icon name="lucide:pencil" size="16" />
              </button>
              <button
                @click="handleDeleteAutre(contact.id)"
                class="text-primary-500 rounded-lg p-2 transition-colors hover:bg-red-100 hover:text-red-600">
                <Icon name="lucide:trash-2" size="16" />
              </button>
            </div>
          </div>
        </div>

        <!-- État vide -->
        <div
          class="border-primary-400 bg-primary-50 hover:border-secondary-500 flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed p-4 shadow-lg transition-all duration-300 hover:scale-[1.02]"
          @click="openAddAutre">
          <Icon name="lucide:circle-plus" size="48" class="text-primary-600" />
          <p class="text-primary-700 text-lg font-medium">Ajouter un contact</p>
          <p class="text-primary-500 text-sm">Cliquez sur "Ajouter" pour créer un contact</p>
        </div>
      </div>
    </div>
    <AppSlideOver
      :sideModal="showAddAutre || showEditAutre"
      :closeSideModal="
        () => {
          ;((showAddAutre = false), (showEditAutre = false))
        }
      ">
      <AppSlideOverContent
        v-if="showAddAutre || showEditAutre"
        :closeSideModal="
          () => {
            ;((showAddAutre = false), (showEditAutre = false))
          }
        ">
        <template #header>
          <h2 class="text-primary-800 font-[Pacifico] text-3xl">
            {{ editFormAutre.id ? 'Modifier' : 'Ajouter' }} un contact
          </h2>
          <p class="text-primary-500 text-sm">Informations du contact</p>
        </template>

        <template #default>
          <form @submit.prevent="saveAutre" class="space-y-6">
            <AppInput
              v-model="editFormAutre.metier"
              name="metier"
              title="Fonction / Rôle"
              placeholder="Ex: Mairie, Riverain..." />
            <AppInput
              v-model="editFormAutre.entreprise"
              name="entreprise"
              title="Organisme / Société"
              placeholder="Nom de l'organisme" />
            <AppInput
              v-model="editFormAutre.responsable_nom"
              name="responsable_nom"
              title="Nom du contact"
              placeholder="Nom du contact" />
            <AppInput
              v-model="editFormAutre.responsable_email"
              name="responsable_email"
              title="Email"
              type="email"
              placeholder="email@exemple.com" />
          </form>
        </template>

        <template #footer>
          <div class="border-primary-200 flex justify-end gap-3 border-t pt-4">
            <AppButtonValidated theme="cancel" type="button" @click="((showAddAutre = false), (showEditAutre = false))">
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
