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

// Convertir semaine ISO + année → lundi de la semaine
const dateFromWeek = (week, year) => {
  const jan4 = new Date(year, 0, 4)
  const jan4Day = jan4.getDay() || 7
  const mondayWeek1 = new Date(jan4)
  mondayWeek1.setDate(jan4.getDate() - (jan4Day - 1))

  const d = new Date(mondayWeek1)
  d.setDate(mondayWeek1.getDate() + (week - 1) * 7)
  return d
}

// Fonction pour obtenir la couleur des périodes de préparation
const getChantierPrepaColor = (week, selectedYear, chantier) => {
  if (!week || !selectedYear || !chantier) return null
  if (!chantier.date_prepa || !Array.isArray(chantier.date_prepa) || chantier.date_prepa.length === 0) return null

  const { etat } = chantier
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
  if (!chantier.date_rea || !Array.isArray(chantier.date_rea) || chantier.date_rea.length === 0) return null

  const { etat } = chantier
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
</script>

<template>
  <tr class="group transition-colors hover:bg-gray-200 dark:hover:bg-gray-700/30">
    <!-- Info chantier -->
    <td
      class="left-0 z-10 border-r border-gray-200 bg-white px-2 py-1 transition-colors group-hover:bg-gray-200 lg:sticky dark:border-gray-700 dark:bg-gray-800 dark:group-hover:bg-gray-700/30">
      <NuxtLink
        :to="`/chantiers/${chantier.id}`"
        class="truncate text-xs font-medium text-gray-700 transition-colors dark:text-white"
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
      :class="{
        'bg-gray-200 dark:bg-gray-700/30': hoveredWeek === week.number,
        'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-semibold':
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
          class="absolute inset-0 rounded-xs border border-gray-200"
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
