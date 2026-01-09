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
  }
})

const emit = defineEmits(['week-hover', 'week-leave'])

const { isWeekendForChantier } = useTimeline()

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
</script>

<template>
  <tr class="group transition-colors hover:bg-gray-200 dark:hover:bg-gray-700/30 print:hover:bg-transparent">
    <!-- Info chantier -->
    <td
      class="border-primary-200 group-hover:bg-primary-200 bg-primary-50 left-0 z-10 border-r px-2 py-0 transition-colors lg:sticky print:bg-white print:py-0 print:group-hover:bg-transparent">
      <NuxtLink
        :to="`/chantiers/${chantier.id}`"
        class="truncate text-xs font-medium text-gray-700 transition-colors dark:text-white"
        :title="chantier.name">
        <div class="flex items-center gap-1.5">
          <span class="h-3 w-1 shrink-0 rounded-full" :class="getEtatColor(chantier.etat)"></span>
          <span
            class="shrink-0 rounded bg-gray-100 px-1 py-0.5 font-mono text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-400 print:bg-white">
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
      :class="{
        'bg-primary-200 print:bg-transparent': hoveredWeek === week.number,
        'bg-primary-100 text-primary-700 font-semibold print:bg-white':
          week.number === getWeekNumber(new Date()) && selectedYear === new Date().getFullYear()
      }"
      @mouseenter="emit('week-hover', week.number)"
      @mouseleave="emit('week-leave')">
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
  </tr>
</template>
