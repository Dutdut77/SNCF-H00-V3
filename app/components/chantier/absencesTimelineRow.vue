<script setup>
const props = defineProps({
  user: {
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
  canEdit: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['week-hover', 'week-leave', 'add-absence', 'delete-absence'])

const { getAbsencesByUserAndYear, getAbsenceForWeek, getAbsenceTypeInfo, deleteAbsence } = useAbsences()

// Récupérer les absences de l'utilisateur pour l'année sélectionnée
const userAbsences = computed(() => {
  if (!props.user?.email) return []
  return getAbsencesByUserAndYear(props.user.email, props.selectedYear)
})

// Fonction pour obtenir le numéro de semaine ISO d'une date
const getWeekNumber = (date) => {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 4 - (d.getDay() || 7))
  const yearStart = new Date(d.getFullYear(), 0, 1)
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7)
}

// Obtenir la couleur de fond pour une semaine
const getWeekAbsenceColor = (weekNumber) => {
  const absence = getAbsenceForWeek(weekNumber, props.selectedYear, props.user.email)
  if (!absence) return null

  if (absence.type === 'conges') {
    return 'bg-red-400 border border-red-600'
  } else if (absence.type === 'formation') {
    return 'bg-amber-500 border border-amber-700'
  }
  return null
}

// Obtenir l'absence pour une semaine (pour le tooltip)
const getAbsenceInfo = (weekNumber) => {
  return getAbsenceForWeek(weekNumber, props.selectedYear, props.user.email)
}

// Générer le texte du tooltip
const getTooltipText = (weekNumber) => {
  const absence = getAbsenceInfo(weekNumber)
  if (!absence) return ''

  const typeInfo = getAbsenceTypeInfo(absence.type)
  let text = `${typeInfo?.label || 'Absence'} - S${absence.semaine_debut}/${absence.annee_debut} à S${absence.semaine_fin}/${absence.annee_fin}`

  if (absence.commentaire) {
    text += ` - ${absence.commentaire}`
  }

  return text
}

// Modal de suppression
const showDeleteModal = ref(false)
const absenceToDelete = ref(null)

const openDeleteModal = (absence) => {
  absenceToDelete.value = absence
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  absenceToDelete.value = null
}

const confirmDelete = async () => {
  if (absenceToDelete.value) {
    await deleteAbsence(absenceToDelete.value.id)
    emit('delete-absence', absenceToDelete.value.id)
  }
  closeDeleteModal()
}
</script>

<template>
  <!-- Toujours afficher la ligne des absences -->
  <tr class="group hover:bg-primary-200 transition-colors print:hover:bg-transparent">
    <!-- Info absence -->
    <td
      class="border-primary-200 group-hover:bg-primary-200 bg-primary-50 py-0.2 left-0 z-20 border-r px-2 transition-colors lg:sticky print:table-cell print:w-32 print:max-w-32 print:overflow-hidden print:bg-white print:py-0 print:group-hover:bg-transparent">
      <div class="flex items-center gap-1.5">
        <Icon name="lucide:calendar-off" size="14" class="shrink-0 text-gray-400" />
        <span class="rounded px-1 py-0.5 text-xs font-medium text-gray-500 italic dark:text-gray-400">Absences</span>
        <button
          v-if="canEdit"
          type="button"
          @click="emit('add-absence', user)"
          class="hover:text-primary-900 ml-auto cursor-pointer items-center justify-center text-xs text-gray-400 italic transition-colors duration-300 print:hidden"
          title="Ajouter une absence">
          Ajouter
          <!-- <Icon name="lucide:plus" size="14" /> -->
        </button>
      </div>
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
        }
      ]"
      @mouseenter="emit('week-hover', week.number)"
      @mouseleave="emit('week-leave')">
      <div class="relative h-2.5">
        <!-- Fond des semaines vides -->
        <div
          v-if="!getWeekAbsenceColor(week.number)"
          class="absolute inset-0 rounded-xs border border-gray-300 dark:border-gray-700"></div>

        <!-- Barre d'absence -->
        <div
          v-if="getWeekAbsenceColor(week.number)"
          class="group/absence absolute inset-0 rounded-xs"
          :class="[getWeekAbsenceColor(week.number), canEdit ? 'cursor-pointer' : '']"
          @click="canEdit && openDeleteModal(getAbsenceInfo(week.number))">
          <!-- Tooltip custom -->
          <div
            class="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden -translate-x-1/2 rounded bg-gray-900 px-2 py-1 text-xs whitespace-nowrap text-white shadow-lg group-hover/absence:block">
            {{ getTooltipText(week.number) }}
          </div>
        </div>
      </div>
    </td>
  </tr>

  <!-- Modal de confirmation de suppression -->
  <AppModal v-model="showDeleteModal" size="md" @close="closeDeleteModal">
    <template #header>
      <div class="text-center">
        <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <Icon name="lucide:triangle-alert" size="28" class="text-red-600 dark:text-red-400" />
        </div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Supprimer l'absence</h3>
      </div>
    </template>

    <template #default>
      <p class="text-center text-sm leading-relaxed text-gray-600 dark:text-gray-300">
        Êtes-vous sûr de vouloir supprimer cette absence ?
        <br />
        <span class="font-semibold text-gray-900 dark:text-white">
          {{ getAbsenceTypeInfo(absenceToDelete?.type)?.label }}
          - S{{ absenceToDelete?.semaine_debut }}/{{ absenceToDelete?.annee_debut }} à S{{
            absenceToDelete?.semaine_fin
          }}/{{ absenceToDelete?.annee_fin }}
        </span>
      </p>
    </template>

    <template #footer>
      <div class="flex justify-end gap-3">
        <AppButtonValidated theme="cancel" type="button" @click="closeDeleteModal">
          <template #default>Annuler</template>
        </AppButtonValidated>
        <AppButtonValidated theme="delete" type="button" @click="confirmDelete">
          <template #default>Supprimer</template>
        </AppButtonValidated>
      </div>
    </template>
  </AppModal>
</template>
