<script setup>
const props = defineProps({
  chantier: {
    type: Object,
    required: true
  },
  user: {
    type: Object,
    default: null
  },
  canDelete: {
    type: Boolean,
    default: false
  },
  weeks: {
    type: Array,
    required: true
  },
  selectedYear: {
    type: Number,
    required: true
  },
  showContacts: {
    type: Boolean,
    default: true
  },
  clickable: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['week-click', 'delete-chantier', 'contact-updated'])

const {
  canEdit,
  showDeleteModal,
  chantierToDelete,
  showContactEditModal,
  editingContactType,
  editingContactValue,
  editingConfig,
  editingUserOptions,
  getWeekNumber,
  weekColorMap,
  getContactInfo,
  getAllSecondaryContacts,
  openContactEdit,
  saveContactEdit,
  deleteModal
} = useTimelineRowLogic(props)

// Chef de projet (contacts généralités)
const { allContactsGeneralites } = useContacts()

const chefProjetInfo = computed(() => {
  if (!allContactsGeneralites.value) return null
  const gen = allContactsGeneralites.value.find((c) => c.chantier_id === props.chantier.id)
  if (!gen?.chef_projet_nom) return null
  return {
    nom: gen.chef_projet_nom,
    initials: gen.chef_projet_nom.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  }
})

const handleWeekClick = () => {
  if (props.clickable) {
    emit('week-click', props.chantier)
  }
}

const deleteContact = () => {
  emit('delete-chantier', chantierToDelete.value.id, chantierToDelete.value.foundIn, props.user.email)
}
</script>

<template>
  <!-- Row wrapper : subgrid pour s'aligner sur la grille parente -->
  <div
    class="group col-span-full grid grid-cols-subgrid items-center transition-colors hover:bg-primary-200 print:hover:bg-transparent">
    <!-- Info chantier (colonne 1, sticky left) -->
    <div
      class="border-primary-200 bg-primary-50 sticky left-0 z-20 border-r px-2 py-0 transition-colors group-hover:bg-primary-200 print:bg-white print:py-0 print:group-hover:bg-transparent">
      <div class="flex items-center">
        <NuxtLink
          :to="`/chantiers/${chantier.id}`"
          class="text-primary-700 truncate text-sm font-medium transition-colors"
          :title="chantier.name">
          <div class="flex items-center gap-1.5">
            <div
              v-if="
                chantier.foundIn &&
                (chantier.foundIn === 'rlt_voie_principale' ||
                  chantier.foundIn === 'rlt_ses_principale' ||
                  chantier.foundIn === 'rlt_cat_principale')
              "
              class="w-22 flex-none rounded bg-green-700/50 text-center text-xs text-white italic print:w-8">
              <span class="print:hidden">Principal</span>
              <span class="hidden print:block">P</span>
            </div>
            <div
              v-if="
                chantier.foundIn &&
                (chantier.foundIn === 'rlt_voie_secondaire' ||
                  chantier.foundIn === 'rlt_ses_secondaire' ||
                  chantier.foundIn === 'rlt_cat_secondaire')
              "
              class="w-22 flex-none rounded bg-orange-700/50 text-center text-xs text-white italic print:w-8">
              <span class="print:hidden">Secondaire</span>
              <span class="hidden print:block">S</span>
            </div>
            <span
              class="bg-primary-100 text-primary-700 print:text-primary-900 shrink-0 rounded px-1 py-0.5 text-xs font-bold print:text-xs">
              {{ chantier.compte || '-' }}
            </span>
            <span class="truncate print:text-xs">{{ chantier.name || 'Sans intitulé' }}</span>
          </div>
        </NuxtLink>
        <div v-if="canEdit" class="ml-auto flex w-6 items-center justify-center transition-colors print:hidden">
          <div v-if="canDelete" @click="deleteModal(chantier)">
            <div class="flex cursor-pointer items-center gap-1 rounded px-1 py-0.5">
              <Icon name="lucide:minus" size="12" class="text-red-500" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Semaines (colonnes 2 à 54) -->
    <div
      v-for="week in props.weeks"
      :key="week.number"
      :data-week="week.number"
      class="relative flex items-center self-stretch px-px"
      :class="[
        {
          'bg-primary-300/50 text-primary-800 font-semibold print:bg-white':
            week.number === getWeekNumber(new Date()) && selectedYear === new Date().getFullYear()
        },
        clickable ? 'cursor-pointer' : ''
      ]"
      @click="handleWeekClick">
      <div class="relative h-2.5 w-full">
        <!-- Barre de préparation -->
        <div
          v-if="weekColorMap.get(week.number)?.prepa"
          class="absolute inset-0 rounded-xs opacity-50"
          :class="weekColorMap.get(week.number).prepa"></div>

        <!-- Barre de réalisation -->
        <div
          class="absolute inset-0 rounded-xs border border-gray-300 dark:border-gray-800"
          :class="weekColorMap.get(week.number)?.rea"></div>

        <!-- Barre verticale orange pour les week-ends -->
        <div
          v-if="weekColorMap.get(week.number)?.weekend"
          class="absolute -top-1.5 -right-[3px] -bottom-1.5 z-2 w-[4px] bg-orange-500"
          :title="`Week-end S${week.number}`"></div>
      </div>
    </div>

    <!-- Contacts -->
    <template v-if="showContacts">
      <!-- RLT VOIE Principal -->
      <div class="border-primary-200 flex items-center justify-center border-r border-l" :class="canEdit ? 'cursor-pointer hover:bg-purple-50' : ''" @click="canEdit && openContactEdit('rlt_voie_principale')">
        <template v-if="getContactInfo(chantier.id, 'rlt_voie_principale')">
          <AppTooltip :text="getContactInfo(chantier.id, 'rlt_voie_principale').fullName" class="h-full w-full">
            <div class="flex h-full w-full items-center justify-center">
              <AppAvatar
                :nom="getContactInfo(chantier.id, 'rlt_voie_principale').nom"
                :prenom="getContactInfo(chantier.id, 'rlt_voie_principale').prenom"
                size="xs"
                color="bg-purple-200 text-purple-600" />
            </div>
          </AppTooltip>
        </template>
        <div v-else class="text-primary-400 flex h-full w-full items-center justify-center">-</div>
      </div>

      <!-- RLT VOIE Secondaire -->
      <div class="border-primary-200 flex items-center justify-center border-r border-l" :class="canEdit ? 'cursor-pointer hover:bg-purple-50' : ''" @click="canEdit && openContactEdit('rlt_voie_secondaire')">
        <template v-if="getAllSecondaryContacts(chantier.id, 'rlt_voie_secondaire').length > 0">
          <div class="flex h-full w-full items-center justify-center">
            <div class="flex -space-x-2">
              <AppTooltip
                v-for="(contact, idx) in getAllSecondaryContacts(chantier.id, 'rlt_voie_secondaire')"
                :key="idx"
                :text="contact.fullName"
                class="hover:z-10">
                <AppAvatar
                  :nom="contact.nom"
                  :prenom="contact.prenom"
                  size="xs"
                  class="ring-2 ring-white dark:ring-gray-800"
                  color="bg-purple-200 text-purple-600" />
              </AppTooltip>
            </div>
          </div>
        </template>
        <div v-else class="flex h-full w-full items-center justify-center text-gray-400">-</div>
      </div>

      <!-- Kv VOIE -->
      <div class="border-primary-200 flex items-center justify-center border-r border-l" :class="canEdit ? 'cursor-pointer hover:bg-purple-50' : ''" @click="canEdit && openContactEdit('kv_voie')">
        <template v-if="getAllSecondaryContacts(chantier.id, 'kv_voie').length > 0">
          <div class="flex h-full w-full items-center justify-center">
            <div class="flex -space-x-2">
              <AppTooltip
                v-for="(contact, idx) in getAllSecondaryContacts(chantier.id, 'kv_voie')"
                :key="idx"
                :text="contact.fullName"
                class="hover:z-10">
                <AppAvatar
                  :nom="contact.nom"
                  :prenom="contact.prenom"
                  size="xs"
                  class="ring-2 ring-white dark:ring-gray-800"
                  color="bg-purple-200 text-purple-600" />
              </AppTooltip>
            </div>
          </div>
        </template>
        <div v-else class="flex h-full w-full items-center justify-center text-gray-400">-</div>
      </div>

      <!-- RLT SES Principal -->
      <div class="border-primary-200 flex items-center justify-center border-r border-l" :class="canEdit ? 'cursor-pointer hover:bg-primary-100' : ''" @click="canEdit && openContactEdit('rlt_ses_principale')">
        <template v-if="getContactInfo(chantier.id, 'rlt_ses_principale')">
          <AppTooltip :text="getContactInfo(chantier.id, 'rlt_ses_principale').fullName" class="h-full w-full">
            <div class="flex h-full w-full items-center justify-center">
              <AppAvatar
                :nom="getContactInfo(chantier.id, 'rlt_ses_principale').nom"
                :prenom="getContactInfo(chantier.id, 'rlt_ses_principale').prenom"
                size="xs"
                color="bg-primary-200 text-primary-600" />
            </div>
          </AppTooltip>
        </template>
        <div v-else class="flex h-full w-full items-center justify-center text-gray-400">-</div>
      </div>

      <!-- RLT SES Secondaire -->
      <div class="border-primary-200 flex items-center justify-center border-r border-l" :class="canEdit ? 'cursor-pointer hover:bg-primary-100' : ''" @click="canEdit && openContactEdit('rlt_ses_secondaire')">
        <template v-if="getAllSecondaryContacts(chantier.id, 'rlt_ses_secondaire').length > 0">
          <div class="flex h-full w-full items-center justify-center">
            <div class="flex -space-x-2">
              <AppTooltip
                v-for="(contact, idx) in getAllSecondaryContacts(chantier.id, 'rlt_ses_secondaire')"
                :key="idx"
                :text="contact.fullName"
                class="hover:z-10">
                <AppAvatar
                  :nom="contact.nom"
                  :prenom="contact.prenom"
                  size="xs"
                  class="ring-2 ring-white dark:ring-gray-800"
                  color="bg-primary-200 text-primary-600" />
              </AppTooltip>
            </div>
          </div>
        </template>
        <div v-else class="flex h-full w-full items-center justify-center text-gray-400">-</div>
      </div>

      <!-- Kv SES -->
      <div class="border-primary-200 flex items-center justify-center border-r border-l" :class="canEdit ? 'cursor-pointer hover:bg-primary-100' : ''" @click="canEdit && openContactEdit('kv_ses')">
        <template v-if="getAllSecondaryContacts(chantier.id, 'kv_ses').length > 0">
          <div class="flex h-full w-full items-center justify-center">
            <div class="flex -space-x-2">
              <AppTooltip
                v-for="(contact, idx) in getAllSecondaryContacts(chantier.id, 'kv_ses')"
                :key="idx"
                :text="contact.fullName"
                class="hover:z-10">
                <AppAvatar
                  :nom="contact.nom"
                  :prenom="contact.prenom"
                  size="xs"
                  class="ring-2 ring-white dark:ring-gray-800"
                  color="bg-primary-200 text-primary-600" />
              </AppTooltip>
            </div>
          </div>
        </template>
        <div v-else class="flex h-full w-full items-center justify-center text-gray-400">-</div>
      </div>

      <!-- RLT CAT Principal -->
      <div class="border-primary-200 flex items-center justify-center border-r border-l" :class="canEdit ? 'cursor-pointer hover:bg-blue-50' : ''" @click="canEdit && openContactEdit('rlt_cat_principale')">
        <template v-if="getContactInfo(chantier.id, 'rlt_cat_principale')">
          <AppTooltip :text="getContactInfo(chantier.id, 'rlt_cat_principale').fullName" class="h-full w-full">
            <div class="flex h-full w-full items-center justify-center">
              <AppAvatar
                :nom="getContactInfo(chantier.id, 'rlt_cat_principale').nom"
                :prenom="getContactInfo(chantier.id, 'rlt_cat_principale').prenom"
                size="xs"
                color="bg-blue-200 text-blue-600" />
            </div>
          </AppTooltip>
        </template>
        <div v-else class="flex h-full w-full items-center justify-center text-gray-400">-</div>
      </div>

      <!-- RLT CAT Secondaire -->
      <div class="border-primary-200 flex items-center justify-center border-r border-l" :class="canEdit ? 'cursor-pointer hover:bg-blue-50' : ''" @click="canEdit && openContactEdit('rlt_cat_secondaire')">
        <template v-if="getAllSecondaryContacts(chantier.id, 'rlt_cat_secondaire').length > 0">
          <div class="flex h-full w-full items-center justify-center">
            <div class="flex -space-x-2">
              <AppTooltip
                v-for="(contact, idx) in getAllSecondaryContacts(chantier.id, 'rlt_cat_secondaire')"
                :key="idx"
                :text="contact.fullName"
                position="left"
                class="hover:z-10">
                <AppAvatar
                  :nom="contact.nom"
                  :prenom="contact.prenom"
                  size="xs"
                  class="ring-2 ring-white dark:ring-gray-800"
                  color="bg-blue-200 text-blue-600" />
              </AppTooltip>
            </div>
          </div>
        </template>
        <div v-else class="flex h-full w-full items-center justify-center text-gray-400">-</div>
      </div>

      <!-- Kv Cat -->
      <div class="border-primary-200 flex items-center justify-center border-r border-l" :class="canEdit ? 'cursor-pointer hover:bg-blue-50' : ''" @click="canEdit && openContactEdit('kv_cat')">
        <template v-if="getAllSecondaryContacts(chantier.id, 'kv_cat').length > 0">
          <div class="flex h-full w-full items-center justify-center">
            <div class="flex -space-x-2">
              <AppTooltip
                v-for="(contact, idx) in getAllSecondaryContacts(chantier.id, 'kv_cat')"
                :key="idx"
                :text="contact.fullName"
                class="hover:z-10">
                <AppAvatar
                  :nom="contact.nom"
                  :prenom="contact.prenom"
                  size="xs"
                  class="ring-2 ring-white dark:ring-gray-800"
                  color="bg-blue-200 text-blue-600" />
              </AppTooltip>
            </div>
          </div>
        </template>
        <div v-else class="flex h-full w-full items-center justify-center text-gray-400">-</div>
      </div>

      <!-- Préop Voie -->
      <div class="border-primary-200 flex items-center justify-center border-r border-l" :class="canEdit ? 'cursor-pointer hover:bg-emerald-50' : ''" @click="canEdit && openContactEdit('preop_voie')">
        <template v-if="getContactInfo(chantier.id, 'preop_voie')">
          <AppTooltip :text="getContactInfo(chantier.id, 'preop_voie').fullName" class="h-full w-full">
            <div class="flex h-full w-full items-center justify-center">
              <AppAvatar
                :nom="getContactInfo(chantier.id, 'preop_voie').nom"
                :prenom="getContactInfo(chantier.id, 'preop_voie').prenom"
                size="xs"
                color="bg-emerald-200 text-emerald-600" />
            </div>
          </AppTooltip>
        </template>
        <div v-else class="flex h-full w-full items-center justify-center text-gray-400">-</div>
      </div>

      <!-- Préop SES -->
      <div class="border-primary-200 flex items-center justify-center border-r border-l" :class="canEdit ? 'cursor-pointer hover:bg-emerald-50' : ''" @click="canEdit && openContactEdit('preop_ses')">
        <template v-if="getContactInfo(chantier.id, 'preop_ses')">
          <AppTooltip :text="getContactInfo(chantier.id, 'preop_ses').fullName" position="left" class="h-full w-full">
            <div class="flex h-full w-full items-center justify-center">
              <AppAvatar
                :nom="getContactInfo(chantier.id, 'preop_ses').nom"
                :prenom="getContactInfo(chantier.id, 'preop_ses').prenom"
                size="xs"
                color="bg-emerald-200 text-emerald-600" />
            </div>
          </AppTooltip>
        </template>
        <div v-else class="flex h-full w-full items-center justify-center text-gray-400">-</div>
      </div>

      <!-- Logistique -->
      <div class="border-primary-200 flex items-center justify-center border-r border-l" :class="canEdit ? 'cursor-pointer hover:bg-emerald-50' : ''" @click="canEdit && openContactEdit('logistique')">
        <template v-if="getContactInfo(chantier.id, 'logistique')">
          <AppTooltip :text="getContactInfo(chantier.id, 'logistique').fullName" position="left" class="h-full w-full">
            <div class="flex h-full w-full items-center justify-center">
              <AppAvatar
                :nom="getContactInfo(chantier.id, 'logistique').nom"
                :prenom="getContactInfo(chantier.id, 'logistique').prenom"
                size="xs"
                color="bg-emerald-200 text-emerald-600" />
            </div>
          </AppTooltip>
        </template>
        <div v-else class="flex h-full w-full items-center justify-center text-gray-400">-</div>
      </div>

      <!-- CdP (Chef de Projet) -->
      <div class="border-primary-200 flex items-center justify-center border-r border-l">
        <template v-if="chefProjetInfo">
          <AppTooltip :text="chefProjetInfo.nom" position="left" class="h-full w-full">
            <div class="flex h-full w-full items-center justify-center">
              <AppAvatar
                :nom="chefProjetInfo.nom.split(' ').slice(-1)[0] || ''"
                :prenom="chefProjetInfo.nom.split(' ')[0] || ''"
                size="xs"
                color="bg-amber-200 text-amber-700" />
            </div>
          </AppTooltip>
        </template>
        <div v-else class="text-primary-400 flex h-full w-full items-center justify-center">-</div>
      </div>
    </template>
  </div>

  <!-- Modal de confirmation de suppression -->
  <AppModal v-model="showDeleteModal" size="md" @close="deleteModal()">
    <template #header>
      <div class="text-center">
        <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <Icon name="lucide:triangle-alert" size="28" class="text-red-600 dark:text-red-400" />
        </div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Retirer un chantier</h3>
      </div>
    </template>

    <template #default>
      <p class="text-center text-sm leading-relaxed text-gray-600 dark:text-gray-300">
        Êtes-vous sûr de vouloir retirer le chantier
        <span class="font-semibold text-gray-900 dark:text-white">{{ chantierToDelete?.name || '' }}</span>
        pour
        <span class="font-semibold text-gray-900 dark:text-white">{{ props.user?.prenom }} {{ props.user?.nom }}</span>
        ?
      </p>
    </template>

    <template #footer>
      <div class="flex justify-end gap-3">
        <AppButtonValidated theme="cancel" type="button" @click="deleteModal()">
          <template #default>Annuler</template>
        </AppButtonValidated>
        <AppButtonValidated theme="delete" type="button" @click="deleteContact">
          <template #default>Supprimer</template>
        </AppButtonValidated>
      </div>
    </template>
  </AppModal>

  <!-- Modal d'édition rapide de contact -->
  <AppModal v-model="showContactEditModal" size="sm" @close="showContactEditModal = false">
    <template #header>
      <div class="text-center">
        <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-100">
          <Icon name="lucide:user-pen" size="28" class="text-primary-600" />
        </div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ editingConfig?.label }}</h3>
        <p class="text-sm text-gray-500 mt-1">{{ chantier.compte }} - {{ chantier.name }}</p>
      </div>
    </template>

    <template #default>
      <div class="space-y-4">
        <AppSelectMultiple
          v-if="editingConfig?.type === 'multi'"
          v-model="editingContactValue"
          :options="editingUserOptions"
          :title="editingConfig?.label"
          placeholder="Sélectionner..." />
        <AppSelect
          v-else
          v-model="editingContactValue"
          :options="editingUserOptions"
          :title="editingConfig?.label"
          placeholder="Sélectionner..."
          nullable />
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-3">
        <AppButtonValidated theme="cancel" type="button" @click="showContactEditModal = false">
          <template #default>Annuler</template>
        </AppButtonValidated>
        <AppButtonValidated theme="primary" type="button" @click="saveContactEdit">
          <template #default>Enregistrer</template>
        </AppButtonValidated>
      </div>
    </template>
  </AppModal>
</template>
