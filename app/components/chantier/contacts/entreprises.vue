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
          <div class="bg-secondary-500/80 text-secondary-50 flex h-10 w-10 items-center justify-center rounded-xl">
            <Icon name="lucide:building-2" size="20" />
          </div>
          <div>
            <h2 class="text-primary-800 text-lg font-bold">Entreprises</h2>
            <p class="text-primary-700 text-xs">Entreprises intervenantes sur le chantier</p>
          </div>
        </div>
        <AppButtonValidated type="button" theme="primary" @click="openAddEntreprise" class="cursor-pointer">
          <template #default>
            <span class="flex items-center gap-2">
              <Icon name="lucide:plus" size="16" />
              <p class="hidden lg:block">Ajouter</p>
            </span>
          </template>
        </AppButtonValidated>
      </div>

      <!-- Liste des entreprises -->
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="contact in contactsEntreprises"
          :key="contact.id"
          class="border-primary-200 hover:border-secondary-500 rounded-lg border bg-white p-4 shadow-lg transition-all duration-300 hover:scale-[1.02] dark:bg-slate-900">
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
                @click="openEditEntreprise(contact)"
                class="hover:text-primary-600 text-primary-500 hover:bg-primary-200 flex items-center justify-center rounded-lg p-2 transition-colors">
                <Icon name="lucide:pencil" size="16" />
              </button>
              <button
                @click="handleDeleteEntreprise(contact.id)"
                class="text-primary-500 flex items-center justify-center rounded-lg p-2 transition-colors hover:bg-red-100 hover:text-red-600">
                <Icon name="lucide:trash-2" size="16" />
              </button>
            </div>
          </div>
        </div>

        <!-- État vide -->
        <div
          class="border-primary-400 hover:border-secondary-500 flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed bg-white p-4 shadow-lg transition-all duration-300 hover:scale-[1.02] dark:bg-slate-900"
          @click="openAddEntreprise">
          <Icon name="lucide:circle-plus" size="48" class="text-primary-600" />
          <p class="text-primary-700 text-lg font-medium">Ajouter une entreprise</p>
          <p class="text-primary-500 text-sm">Cliquez sur "Ajouter" pour créer un contact</p>
        </div>
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
          <h2 class="text-primary-800 font-[Pacifico] text-3xl">
            {{ editFormEntreprise.id ? 'Modifier' : 'Ajouter' }} une entreprise
          </h2>
          <p class="text-primary-500 text-sm">Informations de l'entreprise intervenante</p>
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
          <div class="border-primary-200 flex justify-end gap-3 border-t pt-4">
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
