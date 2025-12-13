<script setup>
const props = defineProps({
  chantier: {
    type: Object,
    required: true
  }
})

const { getContactsEntreprises, addContactEntreprise, updateContactEntreprise, deleteContactEntreprise } = useContacts()
const { getAllUsers, users } = useUsers()
const { setLoader } = useLoader()

const contactsEntreprises = ref([])
const showAddEntreprise = ref(false)
const showEditEntreprise = ref(false)
const editFormEntreprise = ref({
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
    const entreprises = await getContactsEntreprises(props.chantier.id)
    contactsEntreprises.value = entreprises
  } finally {
    setLoader(false)
  }
}

onMounted(async () => {
  await loadAllData()
})

const openAddEntreprise = () => {
  editFormEntreprise.value = {
    id: null,
    metier: '',
    entreprise: '',
    responsable_nom: '',
    responsable_email: ''
  }
  showAddEntreprise.value = true
}

const openEditEntreprise = (contact) => {
  editFormEntreprise.value = {
    id: contact.id,
    metier: contact.metier || '',
    entreprise: contact.entreprise || '',
    responsable_nom: contact.responsable_nom || '',
    responsable_email: contact.responsable_email || ''
  }
  showEditEntreprise.value = true
}

const saveEntreprise = async () => {
  setLoader(true)
  try {
    let result
    if (editFormEntreprise.value.id) {
      result = await updateContactEntreprise(editFormEntreprise.value.id, editFormEntreprise.value)
    } else {
      result = await addContactEntreprise(props.chantier.id, editFormEntreprise.value)
    }
    if (result) {
      contactsEntreprises.value = await getContactsEntreprises(props.chantier.id)
      showAddEntreprise.value = false
      showEditEntreprise.value = false
    }
  } finally {
    setLoader(false)
  }
}

const handleDeleteEntreprise = async (id) => {
  setLoader(true)
  try {
    const success = await deleteContactEntreprise(id)
    if (success) {
      contactsEntreprises.value = await getContactsEntreprises(props.chantier.id)
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
            class="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-cyan-100 to-blue-200 dark:from-cyan-900/50 dark:to-blue-800/50">
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
              <p class="hidden lg:block">Ajouter</p>
            </span>
          </template>
        </AppButtonValidated>
      </div>

      <!-- Liste des entreprises -->
      <div v-if="contactsEntreprises.length > 0" class="space-y-3">
        <div
          v-for="contact in contactsEntreprises"
          :key="contact.id"
          class="rounded-xl border border-gray-100 bg-gray-50 p-4 transition-colors hover:border-cyan-300 dark:border-gray-600 dark:bg-gray-700/50 dark:hover:border-cyan-700">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="mb-2 flex items-center gap-2">
                <span
                  class="rounded-full bg-cyan-100 px-2 py-0.5 text-xs font-medium text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-400">
                  {{ contact.metier || 'Non défini' }}
                </span>
              </div>
              <p class="text-lg font-bold text-gray-900 dark:text-white">{{ contact.entreprise || '-' }}</p>
              <div class="mt-2 space-y-1">
                <p class="text-sm text-gray-600 dark:text-gray-300">
                  <span class="text-gray-400">Responsable:</span>
                  {{ contact.responsable_nom || '-' }}
                </p>
                <a
                  v-if="contact.responsable_email"
                  :href="`mailto:${contact.responsable_email}`"
                  class="text-primary-600 dark:text-primary-400 flex items-center gap-1 text-sm hover:underline">
                  <Icon name="lucide:mail" size="14" />
                  {{ contact.responsable_email }}
                </a>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button
                @click="openEditEntreprise(contact)"
                class="hover:text-primary-600 rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-200 dark:hover:bg-gray-600">
                <Icon name="lucide:pencil" size="16" />
              </button>
              <button
                @click="handleDeleteEntreprise(contact.id)"
                class="rounded-lg p-2 text-gray-500 transition-colors hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30">
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
    <AppSlideOver
      :sideModal="showAddEntreprise || showEditEntreprise"
      :closeSideModal="
        () => {
          showAddEntreprise = false
          showEditEntreprise = false
        }
      ">
      <AppSlideOverContent
        v-if="showAddEntreprise || showEditEntreprise"
        :closeSideModal="
          () => {
            showAddEntreprise = false
            showEditEntreprise = false
          }
        ">
        <template #header>
          <h2 class="font-[Pacifico] text-3xl text-gray-800 dark:text-white">
            {{ editFormEntreprise.id ? 'Modifier' : 'Ajouter' }} une entreprise
          </h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">Informations de l'entreprise intervenante</p>
        </template>

        <template #default>
          <form @submit.prevent="saveEntreprise" class="space-y-4">
            <AppInput
              v-model="editFormEntreprise.metier"
              name="metier"
              title="Métier / Spécialité"
              placeholder="Ex: Électricité, Terrassement..." />
            <AppInput
              v-model="editFormEntreprise.entreprise"
              name="entreprise"
              title="Nom de l'entreprise"
              placeholder="Nom de l'entreprise" />
            <AppInput
              v-model="editFormEntreprise.responsable_nom"
              name="responsable_nom"
              title="Nom du responsable"
              placeholder="Nom du contact" />
            <AppInput
              v-model="editFormEntreprise.responsable_email"
              name="responsable_email"
              title="Email"
              type="email"
              placeholder="email@exemple.com" />
          </form>
        </template>

        <template #footer>
          <div class="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
            <AppButtonValidated
              theme="cancel"
              type="button"
              @click="((showAddEntreprise = false), (showEditEntreprise = false))">
              <template #default>Annuler</template>
            </AppButtonValidated>
            <AppButtonValidated theme="primary" type="button" @click="saveEntreprise">
              <template #default>{{ editFormEntreprise.id ? 'Modifier' : 'Ajouter' }}</template>
            </AppButtonValidated>
          </div>
        </template>
      </AppSlideOverContent>
    </AppSlideOver>
  </div>
</template>
