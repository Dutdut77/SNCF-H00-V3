<script setup>
const props = defineProps({
  chantier: {
    type: Object,
    required: true
  },
  weeks: {
    type: Array,
    required: true
  },
  selectedYear: {
    type: Number,
    required: true
  },
  hoveredWeek: {
    type: Number,
    default: null
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

const emit = defineEmits(['week-click', 'week-hover', 'week-leave'])

const { isWeekendForChantier } = useTimeline()
const { users } = useUsers()
const { allContactsTravaux } = useContacts()

// Fonction pour obtenir le numéro de semaine ISO d'une date
const getWeekNumber = (date) => {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 4 - (d.getDay() || 7))
  const yearStart = new Date(d.getFullYear(), 0, 1)
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7)
}

// Fonction pour obtenir la couleur des périodes de préparation
const getChantierPrepaColor = (week, selectedYear, chantier) => {
  if (!week || !selectedYear || !chantier) return null

  if (!chantier.date_prepa || !Array.isArray(chantier.date_prepa) || chantier.date_prepa.length === 0) {
    return null
  }

  const { etat } = chantier

  const dateFromWeek = (week, year) => {
    const jan4 = new Date(year, 0, 4)
    const jan4Day = jan4.getDay() || 7
    const mondayWeek1 = new Date(jan4)
    mondayWeek1.setDate(jan4.getDate() - (jan4Day - 1))

    const d = new Date(mondayWeek1)
    d.setDate(mondayWeek1.getDate() + (week - 1) * 7)
    return d
  }

  const weekDate = dateFromWeek(week, selectedYear)

  const isInPeriod = chantier.date_prepa.some((periode) => {
    if (!periode.date_start_prepa) return false

    const start = new Date(periode.date_start_prepa)
    const end = periode.date_end_prepa ? new Date(periode.date_end_prepa) : start

    return weekDate >= start && weekDate <= end
  })

  if (!isInPeriod) return null

  switch (etat) {
    case 2:
      return 'bg-lime-500/60 border border-lime-600'
    case 1:
      return 'bg-purple-500/60 border border-purple-600'
    case 0:
      return 'bg-sky-500/60 border border-sky-600'
    case -1:
      return 'bg-slate-500/60 border border-slate-600'
    default:
      return 'bg-gray-500/60 border border-gray-600'
  }
}

const getChantierColor = (week, selectedYear, chantier) => {
  if (!week || !selectedYear || !chantier) return null

  if (!chantier.date_rea || !Array.isArray(chantier.date_rea) || chantier.date_rea.length === 0) {
    return null
  }

  const { etat } = chantier

  const dateFromWeek = (week, year) => {
    const jan4 = new Date(year, 0, 4)
    const jan4Day = jan4.getDay() || 7
    const mondayWeek1 = new Date(jan4)
    mondayWeek1.setDate(jan4.getDate() - (jan4Day - 1))

    const d = new Date(mondayWeek1)
    d.setDate(mondayWeek1.getDate() + (week - 1) * 7)
    return d
  }

  const weekDate = dateFromWeek(week, selectedYear)

  const isInPeriod = chantier.date_rea.some((periode) => {
    if (!periode.date_start_travaux) return false

    const start = new Date(periode.date_start_travaux)
    const end = periode.date_end_travaux ? new Date(periode.date_end_travaux) : start

    return weekDate >= start && weekDate <= end
  })

  if (!isInPeriod) return null

  switch (etat) {
    case 2:
      return 'bg-lime-500/60 border border-lime-600'
    case 1:
      return 'bg-purple-500/60 border border-purple-600'
    case 0:
      return 'bg-sky-500/60 border border-sky-600'
    case -1:
      return 'bg-slate-500/60 border border-slate-600'
    default:
      return 'bg-gray-500/60 border border-gray-600'
  }
}

// Couleurs selon l'état du chantier
const getEtatColor = (etat) => {
  switch (etat) {
    case 2:
      return 'bg-lime-500'
    case 1:
      return 'bg-purple-500'
    case 0:
      return 'bg-sky-500'
    case -1:
      return 'bg-slate-500'
    default:
      return 'bg-gray-500'
  }
}

const getContactName = (chantierId, contactType, isSecondary = false) => {
  if (!allContactsTravaux.value || !Array.isArray(allContactsTravaux.value)) return null

  const contact = allContactsTravaux.value.find((c) => c.chantier_id === chantierId)
  if (!contact) return null

  const contactData = contact[contactType]

  if (isSecondary && Array.isArray(contactData)) {
    if (contactData.length === 0) return null
    return contactData[0]
  }

  return contactData || null
}

const getUserInfo = (userId) => {
  if (!userId || !users.value) return null

  const user = users.value.find((u) => u.id === userId)
  if (!user) return null

  return {
    nom: user.nom || '',
    prenom: user.prenom || '',
    fullName: user.prenom && user.nom ? `${user.prenom} ${user.nom}` : user.email || '-'
  }
}

const getContactInfo = (chantierId, contactType, isSecondary = false) => {
  const contactId = getContactName(chantierId, contactType, isSecondary)
  if (!contactId) return null

  return getUserInfo(contactId)
}

const getAllSecondaryContacts = (chantierId, contactType) => {
  if (!allContactsTravaux.value || !Array.isArray(allContactsTravaux.value)) return []

  const contact = allContactsTravaux.value.find((c) => c.chantier_id === chantierId)
  if (!contact) return []

  const contactData = contact[contactType]

  if (!Array.isArray(contactData) || contactData.length === 0) return []

  return contactData.map((userId) => getUserInfo(userId)).filter((info) => info !== null)
}

const handleWeekClick = () => {
  if (props.clickable) {
    emit('week-click', props.chantier)
  }
}
</script>

<template>
  <tr class="group transition-colors hover:bg-gray-200 dark:hover:bg-gray-700/30">
    <!-- Info chantier -->
    <td
      class="sticky left-0 z-10 border-r border-gray-200 bg-white px-2 py-1 transition-colors group-hover:bg-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:group-hover:bg-gray-700/30">
      <NuxtLink
        :to="`/chantiers/${chantier.id}`"
        class="truncate text-sm font-medium text-gray-700 transition-colors dark:text-white"
        :title="chantier.name">
        <div class="flex items-center gap-1.5">
          <span class="h-3 w-1 shrink-0 rounded-full" :class="getEtatColor(chantier.etat)"></span>
          <span
            class="shrink-0 rounded bg-gray-100 px-1 py-0.5 font-mono text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-400">
            {{ chantier.compte || '-' }}
          </span>
          {{ chantier.name || 'Sans intitulé' }}
        </div>
      </NuxtLink>
    </td>

    <!-- Semaines -->
    <td
      v-for="week in weeks"
      :key="week.number"
      class="relative px-px"
      :class="[
        {
          'bg-gray-200 dark:bg-gray-700/30': hoveredWeek === week.number,
          'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-semibold':
            week.number === getWeekNumber(new Date()) && selectedYear === new Date().getFullYear()
        },
        clickable ? 'cursor-pointer' : ''
      ]"
      @mouseenter="emit('week-hover', week.number)"
      @mouseleave="emit('week-leave')"
      @click="handleWeekClick">
      <div class="relative h-2.5">
        <!-- Barre de préparation (fond, opacité 50%) -->
        <div
          v-if="getChantierPrepaColor(week.number, selectedYear, chantier)"
          class="absolute inset-0 rounded-xs opacity-50"
          :class="getChantierPrepaColor(week.number, selectedYear, chantier)"></div>

        <!-- Barre de réalisation (au-dessus) -->
        <div
          class="absolute inset-0 rounded-xs border border-gray-200"
          :class="getChantierColor(week.number, selectedYear, chantier)"></div>

        <!-- Barre verticale orange pour les week-ends -->
        <div
          v-if="isWeekendForChantier(week.number, selectedYear, chantier.id)"
          class="absolute -top-1.5 -right-[3px] -bottom-1.5 z-2 w-[4px] bg-orange-500"
          :title="`Week-end S${week.number}`"></div>
      </div>
    </td>

    <!-- Contacts (optionnels) -->
    <template v-if="showContacts">
      <!-- RLT VOIE Principal -->
      <td class="border-r border-l border-gray-200 dark:border-gray-700">
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
        <div v-else class="flex h-full w-full items-center justify-center text-gray-400">-</div>
      </td>

      <!-- RLT VOIE Secondaire -->
      <td class="border-r border-l border-gray-200 dark:border-gray-700">
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
      </td>

      <!-- Kv VOIE -->
      <td class="border-r border-l border-gray-200 dark:border-gray-700">
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
      </td>

      <!-- RLT SES Principal -->
      <td class="border-r border-l border-gray-200 dark:border-gray-700">
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
      </td>

      <!-- RLT SES Secondaire -->
      <td class="border-r border-l border-gray-200 dark:border-gray-700">
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
      </td>

      <!-- Kv SES -->
      <td class="border-r border-l border-gray-200 dark:border-gray-700">
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
      </td>

      <!-- RLT CAT Principal -->
      <td class="border-r border-l border-gray-200 dark:border-gray-700">
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
      </td>

      <!-- RLT CAT Secondaire -->
      <td class="border-r border-l border-gray-200 dark:border-gray-700">
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
      </td>

      <!-- Kv Cat -->
      <td class="border-r border-l border-gray-200 dark:border-gray-700">
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
      </td>

      <!-- Préop Voie -->
      <td class="border-r border-l border-gray-200 dark:border-gray-700">
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
      </td>

      <!-- Préop SES -->
      <td class="border-r border-l border-gray-200 dark:border-gray-700">
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
      </td>

      <!-- Logistique -->
      <td class="border-r border-l border-gray-200 dark:border-gray-700">
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
      </td>
    </template>
  </tr>
</template>

