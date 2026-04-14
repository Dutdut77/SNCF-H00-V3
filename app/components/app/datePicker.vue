<script setup>
const model = defineModel({ default: null })

const props = defineProps({
  placeholder: {
    type: String,
    default: 'Choisissez une date'
  },
  title: {
    type: String,
    default: ''
  },
  report: {
    type: String,
    default: 'body'
  },
  clearable: {
    type: Boolean,
    default: false
  }
})

onMounted(() => {
  if (!model.value && !props.clearable) {
    const today = new Date()
    today.setHours(12, 0, 0, 0) // midi pour éviter les problèmes de timezone
    model.value = today.getTime()
  }
})

const isOpen = ref(false)
const dropdownRef = ref(null)

// État de navigation du calendrier
const currentMonth = ref(model.value ? new Date(model.value).getMonth() : new Date().getMonth())
const currentYear = ref(model.value ? new Date(model.value).getFullYear() : new Date().getFullYear())

// État de la sélection temporaire (avant validation)
const selectedDay = ref(model.value ? new Date(model.value).getDate() : new Date().getDate())
const selectedMonth = ref(currentMonth.value)
const selectedYear = ref(currentYear.value)

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

// Fonction pour calculer le numéro de semaine ISO 8601
const getWeekNumber = (date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7)
}

// Calcul des numéros de semaine pour chaque ligne du calendrier
const weekNumbers = computed(() => {
  const weeks = []
  let currentDate = 1

  // Pour chaque ligne (6 lignes maximum)
  for (let week = 0; week < 6; week++) {
    const dayInWeek = week * 7 - firstDayOfMonth.value + 1

    if (dayInWeek > 0 && dayInWeek <= datesInMonth.value.length) {
      const date = new Date(currentYear.value, currentMonth.value, dayInWeek)
      weeks.push(getWeekNumber(date))
    } else if (dayInWeek <= 0) {
      // Première semaine peut commencer le mois précédent
      const prevMonth = currentMonth.value === 0 ? 11 : currentMonth.value - 1
      const prevYear = currentMonth.value === 0 ? currentYear.value - 1 : currentYear.value
      const daysInPrevMonth = new Date(prevYear, prevMonth + 1, 0).getDate()
      const date = new Date(prevYear, prevMonth, daysInPrevMonth + dayInWeek)
      weeks.push(getWeekNumber(date))
    } else {
      // Dernière semaine peut déborder sur le mois suivant
      const nextMonth = currentMonth.value === 11 ? 0 : currentMonth.value + 1
      const nextYear = currentMonth.value === 11 ? currentYear.value + 1 : currentYear.value
      const date = new Date(nextYear, nextMonth, dayInWeek - datesInMonth.value.length)
      weeks.push(getWeekNumber(date))
    }
  }

  return weeks
})

// Date formatée pour l'affichage dans le bouton
const displayDate = computed(() => {
  if (!model.value) return null
  const date = new Date(model.value)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
})

// Génération des années pour le sélecteur
const yearOptions = computed(() => {
  const years = []
  for (let i = -6; i <= 6; i++) {
    years.push(currentYear.value + i)
  }
  return years
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

// Ouvrir/fermer le picker
const toggleDropdown = () => {
  if (!isOpen.value && model.value) {
    // Synchro avec la valeur actuelle à l'ouverture
    const date = new Date(model.value)
    currentMonth.value = date.getMonth()
    currentYear.value = date.getFullYear()
    selectedDay.value = date.getDate()
    selectedMonth.value = currentMonth.value
    selectedYear.value = currentYear.value
  }
  isOpen.value = !isOpen.value
}

// Sélection d'un jour
const selectDay = (day) => {
  selectedDay.value = day
  selectedMonth.value = currentMonth.value
  selectedYear.value = currentYear.value
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
  const isSelected =
    currentYear.value === selectedYear.value && currentMonth.value === selectedMonth.value && selectedDay.value === day

  const isToday =
    new Date().getDate() === day &&
    new Date().getMonth() === currentMonth.value &&
    new Date().getFullYear() === currentYear.value

  return {
    'bg-primary-600 text-white font-medium shadow-sm': isSelected,
    'ring-2 ring-primary-300 dark:ring-primary-500': isToday && !isSelected,
    'hover:bg-gray-100 dark:hover:bg-gray-700': !isSelected
  }
}

// Fermer les popups
const closePopups = () => {
  isOpen.value = false
  showSelectMonth.value = false
  showSelectYear.value = false
}

// Valider la sélection
const validChoice = () => {
  // Créer la date à midi pour éviter les problèmes de timezone
  const date = new Date(selectedYear.value, selectedMonth.value, selectedDay.value, 12, 0, 0)
  model.value = date.getTime()
  closePopups()
}

// Effacer la date
const clearDate = () => {
  model.value = null
  closePopups()
}

// Aller à aujourd'hui
const goToToday = () => {
  const today = new Date()
  currentMonth.value = today.getMonth()
  currentYear.value = today.getFullYear()
  selectedDay.value = today.getDate()
  selectedMonth.value = currentMonth.value
  selectedYear.value = currentYear.value
}
</script>

<template>
  <div class="relative w-full text-sm" ref="dropdownRef">
    <label v-if="props.title" class="mb-0.5 block text-sm text-gray-700 dark:text-gray-300">
      {{ props.title }}
    </label>

    <div class="relative">
      <button
        @click="toggleDropdown"
        type="button"
        class="flex w-full cursor-pointer items-center gap-3 rounded-md border border-gray-300 bg-white px-3 py-1.5 transition-colors hover:border-gray-400 focus:border-gray-400 focus:ring-0 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-gray-500 dark:focus:border-gray-500"
        :class="isOpen ? 'border-primary-500 ring-primary-500 ring-1' : ''">
        <Icon name="lucide:calendar" class="h-4 w-4 text-gray-500 dark:text-gray-400" />
        <span
          :class="displayDate ? 'text-gray-700 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500'"
          class="flex-1 text-left">
          {{ displayDate || placeholder }}
        </span>
        <Icon
          v-if="props.clearable && model"
          name="lucide:x"
          class="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          @click.stop="clearDate" />
      </button>
    </div>

    <Teleport :to="props.report">
      <Transition name="fade">
        <div
          v-if="isOpen"
          class="fixed inset-0 z-80 flex items-center justify-center bg-black/20 p-4 backdrop-blur-sm dark:bg-black/40"
          @click="closePopups">
          <div
            class="border-primary-800 relative flex w-full max-w-sm flex-col overflow-hidden rounded-xl border bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900"
            @click.stop>
            <!-- Header avec date sélectionnée -->
            <div class="from-primary-600 to-primary-700 dark:from-primary-700 dark:to-primary-900 bg-linear-to-br p-4">
              <p class="text-xs font-medium tracking-wider text-white uppercase">Date sélectionnée</p>
              <p class="mt-1 text-xl font-semibold text-white">
                {{ selectedDay }} {{ months[selectedMonth] }} {{ selectedYear }}
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

            <!-- Calendrier -->
            <div class="p-3">
              <!-- En-tête avec S# et jours de la semaine -->
              <div class="mb-2 grid gap-1" style="grid-template-columns: 2rem repeat(7, 1fr)">
                <div class="text-secondary-800 py-1 text-center text-xs font-semibold">#</div>
                <div
                  v-for="day in days"
                  :key="day"
                  class="py-1 text-center text-xs font-semibold text-gray-500 dark:text-gray-400">
                  {{ day }}
                </div>
              </div>

              <!-- Grille des dates avec numéros de semaine - hauteur fixe pour 6 lignes -->
              <div class="grid gap-1" style="grid-template-columns: 2rem repeat(7, 1fr)">
                <template v-for="weekIndex in 6" :key="'week-' + weekIndex">
                  <!-- Numéro de semaine pour cette ligne -->
                  <div class="text-secondary-800 flex items-center justify-center text-xs font-medium">
                    {{ weekNumbers[weekIndex - 1] }}
                  </div>

                  <!-- Les 7 jours de cette semaine -->
                  <template v-for="dayIndex in 7" :key="'day-' + weekIndex + '-' + dayIndex">
                    <template v-if="weekIndex === 1">
                      <!-- Première ligne : gérer les jours vides avant le début du mois -->
                      <div v-if="dayIndex <= firstDayOfMonth" class="h-9 w-9" />
                      <button
                        v-else-if="dayIndex - firstDayOfMonth <= datesInMonth.length"
                        @click="selectDay(dayIndex - firstDayOfMonth)"
                        type="button"
                        class="flex h-9 w-9 items-center justify-center rounded-full text-sm text-gray-700 transition-all duration-150 dark:text-gray-300"
                        :class="getDayClasses(dayIndex - firstDayOfMonth)">
                        {{ dayIndex - firstDayOfMonth }}
                      </button>
                    </template>
                    <template v-else>
                      <!-- Autres lignes : calculer le numéro du jour -->
                      <template
                        v-if="
                          (weekIndex - 1) * 7 + dayIndex - firstDayOfMonth > 0 &&
                          (weekIndex - 1) * 7 + dayIndex - firstDayOfMonth <= datesInMonth.length
                        ">
                        <button
                          @click="selectDay((weekIndex - 1) * 7 + dayIndex - firstDayOfMonth)"
                          type="button"
                          class="flex h-9 w-9 items-center justify-center rounded-full text-sm text-gray-700 transition-all duration-150 dark:text-gray-300"
                          :class="getDayClasses((weekIndex - 1) * 7 + dayIndex - firstDayOfMonth)">
                          {{ (weekIndex - 1) * 7 + dayIndex - firstDayOfMonth }}
                        </button>
                      </template>
                      <div v-else class="h-9 w-9" />
                    </template>
                  </template>
                </template>
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
                  class="bg-primary-600 hover:bg-primary-700 rounded-lg px-4 py-1.5 text-sm font-medium text-white transition-colors">
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
  </div>
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
