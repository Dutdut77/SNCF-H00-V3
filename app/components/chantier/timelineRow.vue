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
// Fonction pour obtenir le lundi ET le dimanche d'une semaine
const getWeekRange = (week, year) => {
  const jan4 = new Date(year, 0, 4)
  const jan4Day = jan4.getDay() || 7
  const mondayWeek1 = new Date(jan4)
  mondayWeek1.setDate(jan4.getDate() - (jan4Day - 1))

  const monday = new Date(mondayWeek1)
  monday.setDate(mondayWeek1.getDate() + (week - 1) * 7)
  monday.setHours(0, 0, 0, 0)

  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)

  return { monday, sunday }
}

// Fonction corrigée pour obtenir la couleur des périodes de préparation
const getChantierPrepaColor = (week, selectedYear, chantier) => {
  if (!week || !selectedYear || !chantier) return null

  if (!chantier.date_prepa || !Array.isArray(chantier.date_prepa) || chantier.date_prepa.length === 0) {
    return null
  }

  const { etat } = chantier
  const { monday, sunday } = getWeekRange(week, selectedYear)

  // Vérifier si la semaine chevauche une période
  const isInPeriod = chantier.date_prepa.some((periode) => {
    if (!periode.date_start_prepa) return false

    const start = new Date(periode.date_start_prepa)
    start.setHours(0, 0, 0, 0)

    const end = periode.date_end_prepa ? new Date(periode.date_end_prepa) : start
    end.setHours(23, 59, 59, 999)

    // La semaine est concernée si elle chevauche la période
    // (le début de la semaine est avant la fin de la période ET la fin de la semaine est après le début de la période)
    return monday <= end && sunday >= start
  })

  if (!isInPeriod) return null

  switch (etat) {
    case 2:
      return 'bg-lime-500/80 border border-lime-700'
    case 1:
      return 'bg-purple-500/80 border border-purple-700'
    case 0:
      return 'bg-sky-500/80 border border-sky-700'
    case -1:
      return 'bg-slate-500/80 border border-slate-700'
    default:
      return 'bg-gray-500/80 border border-gray-700'
  }
}

// Fonction corrigée pour obtenir la couleur des périodes de réalisation
const getChantierColor = (week, selectedYear, chantier) => {
  if (!week || !selectedYear || !chantier) return null

  if (!chantier.date_rea || !Array.isArray(chantier.date_rea) || chantier.date_rea.length === 0) {
    return null
  }

  const { etat } = chantier
  const { monday, sunday } = getWeekRange(week, selectedYear)

  // Vérifier si la semaine chevauche une période
  const isInPeriod = chantier.date_rea.some((periode) => {
    if (!periode.date_start_travaux) return false

    const start = new Date(periode.date_start_travaux)
    start.setHours(0, 0, 0, 0)

    const end = periode.date_end_travaux ? new Date(periode.date_end_travaux) : start
    end.setHours(23, 59, 59, 999)

    // La semaine est concernée si elle chevauche la période
    return monday <= end && sunday >= start
  })

  if (!isInPeriod) return null

  switch (etat) {
    case 2:
      return 'bg-lime-500 border border-lime-700'
    case 1:
      return 'bg-purple-500 border border-purple-700'
    case 0:
      return 'bg-sky-500 border border-sky-700'
    case -1:
      return 'bg-slate-500 border border-slate-700'
    default:
      return 'bg-gray-500 border border-gray-700'
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
  if (!Array.isArray(allContactsTravaux.value)) return null

  const contact = allContactsTravaux.value.find((c) => c.chantier_id === chantierId)
  if (!contact) return null

  const contactData = contact[contactType]

  if (isSecondary && Array.isArray(contactData)) {
    return contactData.length ? contactData[0] : null
  }

  return contactData || null
}
const getUserInfoByEmail = (email) => {
  if (!email || !Array.isArray(users.value)) return null

  const user = users.value.find((u) => u.email?.toLowerCase() === email.toLowerCase())
  if (!user) return null

  return {
    nom: user.nom || '',
    prenom: user.prenom || '',
    email: user.email || '',
    fullName: user.prenom && user.nom ? `${user.prenom} ${user.nom}` : user.email || '-'
  }
}

const getContactInfo = (chantierId, contactType, isSecondary = false) => {
  const contactEmail = getContactName(chantierId, contactType, isSecondary)
  if (!contactEmail) return null

  return getUserInfoByEmail(contactEmail)
}

const getAllSecondaryContacts = (chantierId, contactType) => {
  if (!Array.isArray(allContactsTravaux.value)) return []

  const contact = allContactsTravaux.value.find((c) => c.chantier_id === chantierId)
  if (!contact) return []

  const contactData = contact[contactType]

  if (!Array.isArray(contactData) || contactData.length === 0) return []

  return contactData.map((email) => getUserInfoByEmail(email)).filter(Boolean)
}

const handleWeekClick = () => {
  if (props.clickable) {
    emit('week-click', props.chantier)
  }
}
</script>

<template>
  <tr class="group hover:bg-primary-200 transition-colors print:hover:bg-transparent">
    <!-- Info chantier -->
    <td
      class="border-primary-200 group-hover:bg-primary-200 bg-primary-50 left-0 z-10 border-r px-2 py-1 transition-colors lg:sticky print:w-32 print:max-w-32 print:overflow-hidden print:bg-white print:group-hover:bg-transparent">
      <NuxtLink
        :to="`/chantiers/${chantier.id}`"
        class="text-primary-700 block truncate text-sm font-medium transition-colors"
        :title="chantier.name">
        <div class="flex items-center gap-1.5">
          <span class="h-3 w-1 shrink-0 rounded-full print:hidden" :class="getEtatColor(chantier.etat)"></span>
          <span
            class="bg-primary-100 text-primary-700 shrink-0 rounded px-1 py-0.5 font-mono text-xs print:text-sm print:text-[10px]">
            {{ chantier.compte || '-' }}
          </span>
          <span class="truncate print:text-xs">{{ chantier.name || 'Sans intitulé' }}</span>
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
          'bg-primary-200 print:bg-white': hoveredWeek === week.number,
          'bg-primary-100 text-primary-700 font-semibold print:bg-white':
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
          class="absolute inset-0 rounded-xs border border-gray-300 dark:border-gray-800"
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
      <td class="border-primary-200 border-r border-l">
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
      </td>

      <!-- RLT VOIE Secondaire -->
      <td class="border-primary-200 border-r border-l">
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
      <td class="border-primary-200 border-r border-l">
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
      <td class="border-primary-200 border-r border-l">
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
      <td class="border-primary-200 border-r border-l">
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
      <td class="border-primary-200 border-r border-l">
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
      <td class="border-primary-200 border-r border-l">
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
      <td class="border-primary-200 border-r border-l">
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
      <td class="border-primary-200 border-r border-l">
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
      <td class="border-primary-200 border-r border-l">
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
      <td class="border-primary-200 border-r border-l">
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
      <td class="border-primary-200 border-r border-l">
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
