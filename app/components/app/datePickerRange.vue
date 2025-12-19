<script setup>
const emit = defineEmits(['select', 'close'])

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: 'Sélectionner une période'
  },
  report: {
    type: String,
    default: 'body'
  }
})

// État de navigation du calendrier
const currentMonth = ref(new Date().getMonth())
const currentYear = ref(new Date().getFullYear())

// État de la sélection de plage
const startDate = ref(null)
const endDate = ref(null)
const hoverDate = ref(null)

// Popups de sélection mois/année
const showSelectMonth = ref(false)
const showSelectYear = ref(false)

// Constantes
const days = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di']
const months = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre'
]

// Premier jour du mois (ajusté pour commencer le lundi)
const firstDayOfMonth = computed(() => {
  const firstDay = new Date(currentYear.value, currentMonth.value, 1).getDay()
  return (firstDay + 6) % 7
})

// Jours dans le mois courant
const datesInMonth = computed(() => {
  const daysInMonth = new Date(currentYear.value, currentMonth.value + 1, 0).getDate()
  return Array.from({ length: daysInMonth }, (_, i) => i + 1)
})

// Génération des années pour le sélecteur
const yearOptions = computed(() => {
  const years = []
  for (let i = -6; i <= 6; i++) {
    years.push(currentYear.value + i)
  }
  return years
})

// Formater une date pour l'affichage
const formatDate = (date) => {
  if (!date) return null
  const d = new Date(date)
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

// Affichage de la plage sélectionnée dans le header
const displayRange = computed(() => {
  if (!startDate.value && !endDate.value) {
    return 'Sélectionnez la date de début'
  }
  if (startDate.value && !endDate.value) {
    return `${formatDate(startDate.value)} → ...`
  }
  return `${formatDate(startDate.value)} → ${formatDate(endDate.value)}`
})

// Navigation des mois
const prevMonth = () => {
  if (currentMonth.value === 0) {
    currentMonth.value = 11
    currentYear.value--
  } else {
    currentMonth.value--
  }
}

const nextMonth = () => {
  if (currentMonth.value === 11) {
    currentMonth.value = 0
    currentYear.value++
  } else {
    currentMonth.value++
  }
}

// Créer un timestamp pour un jour donné
const createDate = (day) => {
  return new Date(currentYear.value, currentMonth.value, day, 12, 0, 0).getTime()
}

// Sélection d'un jour
const selectDay = (day) => {
  const dateValue = createDate(day)

  if (!startDate.value || (startDate.value && endDate.value)) {
    // Première sélection ou reset
    startDate.value = dateValue
    endDate.value = null
  } else {
    // Deuxième sélection
    if (dateValue < startDate.value) {
      // Si la date est avant le début, inverser
      endDate.value = startDate.value
      startDate.value = dateValue
    } else {
      endDate.value = dateValue
    }
  }
}

// Survol d'un jour
const onDayHover = (day) => {
  if (startDate.value && !endDate.value) {
    hoverDate.value = createDate(day)
  }
}

const onDayLeave = () => {
  hoverDate.value = null
}

// Sélection d'un mois
const selectMonth = (monthIndex) => {
  currentMonth.value = monthIndex
  showSelectMonth.value = false
}

// Sélection d'une année
const selectYear = (year) => {
  currentYear.value = year
  showSelectYear.value = false
}

// Style des jours
const getDayClasses = (day) => {
  const dateValue = createDate(day)

  const isStartDate = startDate.value && dateValue === startDate.value
  const isEndDate = endDate.value && dateValue === endDate.value

  const isInRange = startDate.value && endDate.value && dateValue > startDate.value && dateValue < endDate.value

  const isInHoverRange =
    startDate.value &&
    !endDate.value &&
    hoverDate.value &&
    ((dateValue > startDate.value && dateValue <= hoverDate.value) ||
      (dateValue < startDate.value && dateValue >= hoverDate.value))

  const isToday =
    new Date().getDate() === day &&
    new Date().getMonth() === currentMonth.value &&
    new Date().getFullYear() === currentYear.value

  return {
    'bg-primary-600 text-white font-medium shadow-sm rounded-full': isStartDate || isEndDate,
    'bg-primary-100 dark:bg-primary-900/40': isInRange,
    'bg-primary-50 dark:bg-primary-900/20': isInHoverRange,
    'ring-2 ring-primary-300 dark:ring-primary-500': isToday && !isStartDate && !isEndDate,
    'hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full': !isStartDate && !isEndDate && !isInRange
  }
}

// Fermer les popups
const closePopups = () => {
  showSelectMonth.value = false
  showSelectYear.value = false
  emit('close')
}

// Valider la sélection
const validChoice = () => {
  if (startDate.value && endDate.value) {
    emit('select', {
      date_start: startDate.value,
      date_end: endDate.value
    })
    // Reset pour la prochaine utilisation
    startDate.value = null
    endDate.value = null
    closePopups()
  }
}

// Aller à aujourd'hui
const goToToday = () => {
  const today = new Date()
  currentMonth.value = today.getMonth()
  currentYear.value = today.getFullYear()
}

// Reset quand le picker se ferme
watch(
  () => props.isOpen,
  (newVal) => {
    if (!newVal) {
      startDate.value = null
      endDate.value = null
      hoverDate.value = null
    }
  }
)
</script>

<template>
  <Teleport :to="props.report">
    <Transition name="fade">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-80 flex items-center justify-center bg-black/20 p-4 backdrop-blur-sm dark:bg-black/40"
        @click="closePopups">
        <div
          class="relative flex w-full max-w-xs flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900"
          @click.stop>
          <!-- Header avec plage sélectionnée -->
          <div class="from-primary-600 to-primary-700 dark:from-primary-600 dark:to-primary-700 bg-linear-to-br p-4">
            <p class="text-xs font-medium tracking-wider text-white uppercase">{{ title }}</p>
            <p class="mt-1 text-lg font-semibold text-white">
              {{ displayRange }}
            </p>
          </div>

          <!-- Navigation mois/année -->
          <div class="flex items-center justify-between border-b border-gray-100 px-3 py-2 dark:border-gray-800">
            <button
              @click="prevMonth"
              type="button"
              class="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800">
              <Icon name="lucide:chevron-left" class="h-5 w-5" />
            </button>

            <div class="flex items-center gap-1">
              <button
                @click="showSelectMonth = true"
                type="button"
                class="rounded-md px-2 py-1 font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800">
                {{ months[currentMonth] }}
              </button>
              <button
                @click="showSelectYear = true"
                type="button"
                class="rounded-md px-2 py-1 font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800">
                {{ currentYear }}
              </button>
            </div>

            <button
              @click="nextMonth"
              type="button"
              class="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800">
              <Icon name="lucide:chevron-right" class="h-5 w-5" />
            </button>
          </div>

          <!-- Instructions -->
          <div class="bg-gray-50 px-3 py-2 text-center text-xs text-gray-500 dark:bg-gray-800/50 dark:text-gray-400">
            <span v-if="!startDate">Cliquez pour sélectionner la date de début</span>
            <span v-else-if="!endDate">Cliquez pour sélectionner la date de fin</span>
            <span v-else class="text-primary-600 dark:text-primary-400">Période sélectionnée ✓</span>
          </div>

          <!-- Calendrier -->
          <div class="p-3">
            <!-- Jours de la semaine -->
            <div class="mb-2 grid grid-cols-7 gap-1">
              <div
                v-for="day in days"
                :key="day"
                class="py-1 text-center text-xs font-semibold text-gray-500 dark:text-gray-400">
                {{ day }}
              </div>
            </div>

            <!-- Grille des dates -->
            <div class="grid grid-cols-7 grid-rows-6 gap-1">
              <div v-for="n in firstDayOfMonth" :key="'empty-' + n" class="h-9 w-9" />
              <button
                v-for="date in datesInMonth"
                :key="date"
                @click="selectDay(date)"
                @mouseenter="onDayHover(date)"
                @mouseleave="onDayLeave"
                type="button"
                class="flex h-9 w-9 items-center justify-center text-sm text-gray-700 transition-all duration-150 dark:text-gray-300"
                :class="getDayClasses(date)">
                {{ date }}
              </button>
            </div>
          </div>

          <!-- Footer actions -->
          <div
            class="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-800/50">
            <button
              @click="goToToday"
              type="button"
              class="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium transition-colors">
              Aujourd'hui
            </button>
            <div class="flex gap-3">
              <button
                @click="closePopups"
                type="button"
                class="px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200">
                Annuler
              </button>
              <button
                @click="validChoice"
                type="button"
                :disabled="!startDate || !endDate"
                class="bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 dark:disabled:bg-primary-800 rounded-lg px-4 py-1.5 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed">
                Valider
              </button>
            </div>
          </div>

          <!-- Overlay sélection du mois -->
          <Transition name="slide-up">
            <div v-if="showSelectMonth" class="absolute inset-0 flex flex-col bg-white dark:bg-gray-900">
              <div class="flex items-center justify-between border-b border-gray-100 p-4 dark:border-gray-800">
                <h3 class="font-semibold text-gray-800 dark:text-gray-200">Sélectionner un mois</h3>
                <button
                  @click="showSelectMonth = false"
                  type="button"
                  class="rounded p-1 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800">
                  <Icon name="lucide:x" class="h-5 w-5 text-gray-500" />
                </button>
              </div>
              <div class="grid flex-1 grid-cols-3 gap-2 overflow-y-auto p-4">
                <button
                  v-for="(month, index) in months"
                  :key="month"
                  @click="selectMonth(index)"
                  type="button"
                  class="rounded-lg px-2 py-3 text-sm font-medium transition-colors"
                  :class="
                    index === currentMonth
                      ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                  ">
                  {{ month }}
                </button>
              </div>
            </div>
          </Transition>

          <!-- Overlay sélection de l'année -->
          <Transition name="slide-up">
            <div v-if="showSelectYear" class="absolute inset-0 flex flex-col bg-white dark:bg-gray-900">
              <div class="flex items-center justify-between border-b border-gray-100 p-4 dark:border-gray-800">
                <h3 class="font-semibold text-gray-800 dark:text-gray-200">Sélectionner une année</h3>
                <button
                  @click="showSelectYear = false"
                  type="button"
                  class="rounded p-1 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800">
                  <Icon name="lucide:x" class="h-5 w-5 text-gray-500" />
                </button>
              </div>
              <div class="grid flex-1 grid-cols-3 gap-2 overflow-y-auto p-4">
                <button
                  v-for="year in yearOptions"
                  :key="year"
                  @click="selectYear(year)"
                  type="button"
                  class="rounded-lg px-2 py-3 text-sm font-medium transition-colors"
                  :class="
                    year === currentYear
                      ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                  ">
                  {{ year }}
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition:
    transform 0.2s ease,
    opacity 0.2s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
