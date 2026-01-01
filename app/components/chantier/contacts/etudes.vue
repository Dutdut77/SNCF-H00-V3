<script setup>
const props = defineProps({
  chantier: {
    type: Object,
    required: true
  }
})

const { getContactsEtudes, upsertContactsEtudes } = useContacts()
const { getAllUsers, users } = useUsers()
const { setLoader } = useLoader()

const contactsEtudes = ref([])
const showEditEtudes = ref(false)
const editFormEtudes = ref({
  plan_technique_nom: '',
  plan_technique_email: '',
  documents_execution_nom: '',
  documents_execution_email: ''
})

// Charger toutes les données
const loadAllData = async () => {
  setLoader(true)
  try {
    await getAllUsers()
    const etudes = await getContactsEtudes(props.chantier.id)
    contactsEtudes.value = etudes
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

// ============================================
// ÉTUDES
// ============================================
const openEditEtudes = () => {
  editFormEtudes.value = {
    plan_technique_nom: contactsEtudes.value?.plan_technique_nom || '',
    plan_technique_email: contactsEtudes.value?.plan_technique_email || '',
    documents_execution_nom: contactsEtudes.value?.documents_execution_nom || '',
    documents_execution_email: contactsEtudes.value?.documents_execution_email || ''
  }
  showEditEtudes.value = true
}

const saveEtudes = async () => {
  setLoader(true)
  try {
    const result = await upsertContactsEtudes(props.chantier.id, editFormEtudes.value)
    if (result) {
      contactsEtudes.value = result
      showEditEtudes.value = false
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
          <div class="bg-primary-600/20 text-primary-700 flex h-10 w-10 items-center justify-center rounded-xl">
            <Icon name="lucide:book-open" size="20" />
          </div>
          <div>
            <h2 class="text-primary-800 text-lg font-bold">Contacts études</h2>
            <p class="text-primary-700 text-xs">Plans techniques et documents d'exécution</p>
          </div>
        </div>
        <AppButtonValidated type="button" theme="primary" @click="openEditEtudes">
          <template #default>
            <span class="flex items-center gap-2">
              <Icon name="lucide:pencil" size="16" />
              <p class="hidden lg:block">Modifier</p>
            </span>
          </template>
        </AppButtonValidated>
      </div>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <!-- Plans techniques -->
        <div class="border-primary-200 bg-primary-50 rounded-lg border p-4 shadow-lg">
          <div class="mb-3 flex items-center gap-2">
            <Icon name="lucide:file-text" size="16" class="text-secondary-900" />
            <label class="text-secondary-900 text-xs font-semibold tracking-wider uppercase">Plans techniques</label>
          </div>
          <p class="text-primary-900 text-base font-semibold">
            {{ contactsEtudes?.plan_technique_nom || '-' }}
          </p>
          <a
            v-if="contactsEtudes?.plan_technique_email"
            :href="`mailto:${contactsEtudes.plan_technique_email}`"
            class="text-secondary-900 mt-1 flex items-center gap-1 text-sm hover:underline">
            <Icon name="lucide:mail" size="14" />
            {{ contactsEtudes.plan_technique_email }}
          </a>
          <p v-else class="text-primary-400 text-sm">Aucun email</p>
        </div>

        <!-- Documents d'exécution -->
        <div class="border-primary-200 bg-primary-50 rounded-lg border p-4 shadow-lg">
          <div class="mb-3 flex items-center gap-2">
            <Icon name="lucide:folder-open" size="16" class="text-primary-700" />
            <label class="text-primary-700 text-xs font-semibold tracking-wider uppercase">Documents d'exécution</label>
          </div>
          <p class="text-primary-900 text-base font-semibold">
            {{ contactsEtudes?.documents_execution_nom || '-' }}
          </p>
          <a
            v-if="contactsEtudes?.documents_execution_email"
            :href="`mailto:${contactsEtudes.documents_execution_email}`"
            class="text-primary-700 mt-1 flex items-center gap-1 text-sm hover:underline">
            <Icon name="lucide:mail" size="14" />
            {{ contactsEtudes.documents_execution_email }}
          </a>
          <p v-else class="text-primary-400 text-sm">Aucun email</p>
        </div>
      </div>
    </div>
    <AppSlideOver :sideModal="showEditEtudes" :closeSideModal="() => (showEditEtudes = false)">
      <AppSlideOverContent v-if="showEditEtudes" :closeSideModal="() => (showEditEtudes = false)">
        <template #header>
          <h2 class="text-primary-800 font-[Pacifico] text-3xl">Contacts études</h2>
          <p class="text-primary-500 text-sm">Modifier les contacts études du chantier</p>
        </template>

        <template #default>
          <form @submit.prevent="saveEtudes" class="space-y-6">
            <!-- Plans techniques -->
            <div class="space-y-4">
              <div class="border-primary-200 flex items-center gap-2 border-b pb-2">
                <Icon name="lucide:file-text" size="16" class="text-primary-900" />
                <h3 class="text-primary-700 text-sm font-semibold tracking-wider uppercase">Plans techniques</h3>
              </div>
              <AppInput
                v-model="editFormEtudes.plan_technique_nom"
                name="plan_technique_nom"
                title="Nom"
                placeholder="Nom du contact" />
              <AppInput
                v-model="editFormEtudes.plan_technique_email"
                name="plan_technique_email"
                title="Email"
                type="email"
                placeholder="email@exemple.com" />
            </div>

            <!-- Documents d'exécution -->
            <div class="space-y-4">
              <div class="border-primary-200 flex items-center gap-2 border-b pb-2">
                <Icon name="lucide:folder-open" size="16" class="text-primary-900" />
                <h3 class="text-primary-700 text-sm font-semibold tracking-wider uppercase">Documents d'exécution</h3>
              </div>
              <AppInput
                v-model="editFormEtudes.documents_execution_nom"
                name="documents_execution_nom"
                title="Nom"
                placeholder="Nom du contact" />
              <AppInput
                v-model="editFormEtudes.documents_execution_email"
                name="documents_execution_email"
                title="Email"
                type="email"
                placeholder="email@exemple.com" />
            </div>
          </form>
        </template>

        <template #footer>
          <div class="border-primary-200 flex justify-end gap-3 border-t pt-4">
            <AppButtonValidated theme="cancel" type="button" @click="showEditEtudes = false">
              <template #default>Annuler</template>
            </AppButtonValidated>
            <AppButtonValidated theme="primary" type="button" @click="saveEtudes">
              <template #default>Enregistrer</template>
            </AppButtonValidated>
          </div>
        </template>
      </AppSlideOverContent>
    </AppSlideOver>
  </div>
</template>
