<script setup>
const model = defineModel({ default: null });

const props = defineProps({
  placeholder: {
    type: String,
    default: "Choisissez une date",
  },
  title: {
    type: String,
    default: "",
  },
  report: {
    type: String,
    default: "body",
  },
  clearable: {
    type: Boolean,
    default: false,
  },
});

const isOpen = ref(false);
const dropdownRef = ref(null);

// État de navigation du calendrier
const currentMonth = ref(model.value ? new Date(model.value).getMonth() : new Date().getMonth());
const currentYear = ref(model.value ? new Date(model.value).getFullYear() : new Date().getFullYear());

// État de la sélection temporaire (avant validation)
const selectedDay = ref(model.value ? new Date(model.value).getDate() : new Date().getDate());
const selectedMonth = ref(currentMonth.value);
const selectedYear = ref(currentYear.value);

// Popups de sélection mois/année
const showSelectMonth = ref(false);
const showSelectYear = ref(false);

// Constantes
const days = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];
const months = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

// Premier jour du mois (ajusté pour commencer le lundi)
const firstDayOfMonth = computed(() => {
  const firstDay = new Date(currentYear.value, currentMonth.value, 1).getDay();
  return (firstDay + 6) % 7;
});

// Jours dans le mois courant
const datesInMonth = computed(() => {
  const daysInMonth = new Date(currentYear.value, currentMonth.value + 1, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, i) => i + 1);
});

// Date formatée pour l'affichage dans le bouton
const displayDate = computed(() => {
  if (!model.value) return null;
  const date = new Date(model.value);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
});

// Génération des années pour le sélecteur
const yearOptions = computed(() => {
  const years = [];
  for (let i = -6; i <= 6; i++) {
    years.push(currentYear.value + i);
  }
  return years;
});

// Navigation des mois
const prevMonth = () => {
  if (currentMonth.value === 0) {
    currentMonth.value = 11;
    currentYear.value--;
  } else {
    currentMonth.value--;
  }
};

const nextMonth = () => {
  if (currentMonth.value === 11) {
    currentMonth.value = 0;
    currentYear.value++;
  } else {
    currentMonth.value++;
  }
};

// Ouvrir/fermer le picker
const toggleDropdown = () => {
  if (!isOpen.value && model.value) {
    // Synchro avec la valeur actuelle à l'ouverture
    const date = new Date(model.value);
    currentMonth.value = date.getMonth();
    currentYear.value = date.getFullYear();
    selectedDay.value = date.getDate();
    selectedMonth.value = currentMonth.value;
    selectedYear.value = currentYear.value;
  }
  isOpen.value = !isOpen.value;
};

// Sélection d'un jour
const selectDay = (day) => {
  selectedDay.value = day;
  selectedMonth.value = currentMonth.value;
  selectedYear.value = currentYear.value;
};

// Sélection d'un mois
const selectMonth = (monthIndex) => {
  currentMonth.value = monthIndex;
  showSelectMonth.value = false;
};

// Sélection d'une année
const selectYear = (year) => {
  currentYear.value = year;
  showSelectYear.value = false;
};

// Style des jours
const getDayClasses = (day) => {
  const isSelected = 
    currentYear.value === selectedYear.value && 
    currentMonth.value === selectedMonth.value && 
    selectedDay.value === day;
  
  const isToday = 
    new Date().getDate() === day && 
    new Date().getMonth() === currentMonth.value && 
    new Date().getFullYear() === currentYear.value;

  return {
    'bg-primary-600 text-white font-medium shadow-sm': isSelected,
    'ring-2 ring-primary-300 dark:ring-primary-500': isToday && !isSelected,
    'hover:bg-gray-100 dark:hover:bg-gray-700': !isSelected,
  };
};

// Fermer les popups
const closePopups = () => {
  isOpen.value = false;
  showSelectMonth.value = false;
  showSelectYear.value = false;
};

// Valider la sélection
const validChoice = () => {
  // Créer la date à midi pour éviter les problèmes de timezone
  const date = new Date(selectedYear.value, selectedMonth.value, selectedDay.value, 12, 0, 0);
  model.value = date.getTime();
  closePopups();
};

// Effacer la date
const clearDate = () => {
  model.value = null;
  closePopups();
};

// Aller à aujourd'hui
const goToToday = () => {
  const today = new Date();
  currentMonth.value = today.getMonth();
  currentYear.value = today.getFullYear();
  selectedDay.value = today.getDate();
  selectedMonth.value = currentMonth.value;
  selectedYear.value = currentYear.value;
};
</script>

<template>
  <div class="relative w-full text-sm" ref="dropdownRef">
    <label v-if="props.title" class="block text-sm text-gray-700 dark:text-gray-300 mb-0.5">
      {{ props.title }}
    </label>
    
    <div class="relative">
      <button 
        @click="toggleDropdown" 
        type="button"
        class="w-full border border-gray-300 dark:border-gray-600 px-3 py-1.5 rounded-md focus:ring-0 focus:border-gray-400 dark:focus:border-gray-500 flex gap-3 items-center cursor-pointer bg-white dark:bg-gray-800 transition-colors hover:border-gray-400 dark:hover:border-gray-500"
        :class="isOpen ? 'border-primary-500 ring-1 ring-primary-500' : ''"
      >
        <Icon name="lucide:calendar" class="w-4 h-4 text-gray-500 dark:text-gray-400" />
        <span
          :class="displayDate ? 'text-gray-700 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500'"
          class="flex-1 text-left"
        >
          {{ displayDate || placeholder }}
        </span>
        <Icon 
          v-if="props.clearable && model"
          name="lucide:x" 
          class="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          @click.stop="clearDate"
        />
      </button>
    </div>

    <Teleport :to="props.report">
      <Transition name="fade">
        <div 
          v-if="isOpen" 
          class="fixed inset-0 z-50 backdrop-blur-sm bg-black/20 dark:bg-black/40 flex justify-center items-center p-4"
          @click="closePopups"
        >
          <div 
            class="relative flex flex-col bg-white dark:bg-gray-900 w-full max-w-xs rounded-xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700"
            @click.stop
          >
            <!-- Header avec date sélectionnée -->
            <div class="p-4 bg-linear-to-br from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700">
              <p class="text-primary-100 text-xs font-medium uppercase tracking-wider">Date sélectionnée</p>
              <p class="text-white text-xl font-semibold mt-1">
                {{ selectedDay }} {{ months[selectedMonth] }} {{ selectedYear }}
              </p>
            </div>

            <!-- Navigation mois/année -->
            <div class="flex items-center justify-between px-3 py-2 border-b border-gray-100 dark:border-gray-800">
              <button 
                @click="prevMonth" 
                type="button"
                class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
              >
                <Icon name="lucide:chevron-left" class="w-5 h-5" />
              </button>
              
              <div class="flex items-center gap-1">
                <button 
                  @click="showSelectMonth = true"
                  type="button"
                  class="px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 font-medium text-gray-700 dark:text-gray-200 transition-colors"
                >
                  {{ months[currentMonth] }}
                </button>
                <button 
                  @click="showSelectYear = true"
                  type="button"
                  class="px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 font-medium text-gray-700 dark:text-gray-200 transition-colors"
                >
                  {{ currentYear }}
                </button>
              </div>
              
              <button 
                @click="nextMonth" 
                type="button"
                class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
              >
                <Icon name="lucide:chevron-right" class="w-5 h-5" />
              </button>
            </div>

            <!-- Calendrier -->
            <div class="p-3">
              <!-- Jours de la semaine -->
              <div class="grid grid-cols-7 gap-1 mb-2">
                <div 
                  v-for="day in days" 
                  :key="day" 
                  class="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 py-1"
                >
                  {{ day }}
                </div>
              </div>
              
              <!-- Grille des dates - hauteur fixe pour 6 lignes -->
              <div class="grid grid-cols-7 grid-rows-6 gap-1">
                <div v-for="n in firstDayOfMonth" :key="'empty-' + n" class="w-9 h-9" />
                <button
                  v-for="date in datesInMonth"
                  :key="date"
                  @click="selectDay(date)"
                  type="button"
                  class="w-9 h-9 flex items-center justify-center rounded-full text-sm transition-all duration-150 text-gray-700 dark:text-gray-300"
                  :class="getDayClasses(date)"
                >
                  {{ date }}
                </button>
              </div>
            </div>

            <!-- Footer actions -->
            <div class="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <button 
                @click="goToToday"
                type="button"
                class="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors"
              >
                Aujourd'hui
              </button>
              <div class="flex gap-3">
                <button 
                  @click="closePopups"
                  type="button"
                  class="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium transition-colors"
                >
                  Annuler
                </button>
                <button 
                  @click="validChoice"
                  type="button"
                  class="px-4 py-1.5 text-sm bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
                >
                  Valider
                </button>
              </div>
            </div>

            <!-- Overlay sélection du mois -->
            <Transition name="slide-up">
              <div 
                v-if="showSelectMonth" 
                class="absolute inset-0 bg-white dark:bg-gray-900 flex flex-col"
              >
                <div class="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <h3 class="font-semibold text-gray-800 dark:text-gray-200">Sélectionner un mois</h3>
                  <button 
                    @click="showSelectMonth = false"
                    type="button"
                    class="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Icon name="lucide:x" class="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <div class="flex-1 grid grid-cols-3 gap-2 p-4 overflow-y-auto">
                  <button
                    v-for="(month, index) in months"
                    :key="month"
                    @click="selectMonth(index)"
                    type="button"
                    class="py-3 px-2 rounded-lg text-sm font-medium transition-colors"
                    :class="index === currentMonth 
                      ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'"
                  >
                    {{ month }}
                  </button>
                </div>
              </div>
            </Transition>

            <!-- Overlay sélection de l'année -->
            <Transition name="slide-up">
              <div 
                v-if="showSelectYear" 
                class="absolute inset-0 bg-white dark:bg-gray-900 flex flex-col"
              >
                <div class="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <h3 class="font-semibold text-gray-800 dark:text-gray-200">Sélectionner une année</h3>
                  <button 
                    @click="showSelectYear = false"
                    type="button"
                    class="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Icon name="lucide:x" class="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <div class="flex-1 grid grid-cols-3 gap-2 p-4 overflow-y-auto">
                  <button
                    v-for="year in yearOptions"
                    :key="year"
                    @click="selectYear(year)"
                    type="button"
                    class="py-3 px-2 rounded-lg text-sm font-medium transition-colors"
                    :class="year === currentYear 
                      ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'"
                  >
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
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
