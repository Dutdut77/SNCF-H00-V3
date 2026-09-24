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
  canEdit: {
    type: Boolean,
    default: false
  },
  // Habillage design V4 (carte blanche, tokens), comme ChantierTimelineGridRow
  v4: {
    type: Boolean,
    default: false
  }
})

const UI = {
  legacy: {
    row: 'hover:bg-primary-200',
    sticky: 'border-primary-200 bg-primary-50 group-hover:bg-primary-200',
    label: 'text-gray-500 dark:text-gray-400',
    icone: 'text-gray-400',
    ajouter: 'text-gray-400 hover:text-primary-900',
    today: 'bg-primary-300/50 text-primary-800 font-semibold',
    vide: 'border-gray-300 dark:border-gray-700'
  },
  v4: {
    // Survol de ligne : taupe (cellules figées opaques, taupe-800 en sombre)
    row: 'hover:bg-taupe-100 dark:hover:bg-taupe-800',
    sticky: 'border-rule bg-card group-hover:bg-taupe-100 dark:group-hover:bg-taupe-800',
    label: 'text-ink-soft',
    icone: 'text-slate-400 dark:text-white/45',
    ajouter: 'text-ink-soft hover:text-secondary-700 dark:hover:text-secondary-300',
    // Semaine en cours : colonne teintée sur toute la hauteur (en-tête compris), sous le surlignage du survol
    today: 'bg-secondary-50 dark:bg-secondary-400/10',
    vide: 'border-slate-200 dark:border-white/10'
  }
}
const ui = computed(() => (props.v4 ? UI.v4 : UI.legacy))

const emit = defineEmits(['add-absence', 'delete-absence'])

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

// Pré-calcul des couleurs d'absences par semaine
const weekAbsenceMap = computed(() => {
  const map = new Map()
  for (const week of props.weeks) {
    const absence = getAbsenceForWeek(week.number, props.selectedYear, props.user.email)
    let color = null
    if (absence) {
      if (absence.type === 'conges') {
        color = 'bg-red-400 border border-red-600'
      } else if (absence.type === 'formation') {
        color = 'bg-amber-500 border border-amber-700'
      }
    }
    map.set(week.number, { color, absence })
  }
  return map
})

// Générer le texte du tooltip
const getTooltipText = (weekNumber) => {
  const data = weekAbsenceMap.value.get(weekNumber)
  if (!data?.absence) return ''

  const absence = data.absence
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
  <div
    class="group col-span-full grid grid-cols-subgrid items-center transition-colors print:hover:bg-transparent"
    :class="ui.row">
    <!-- Info absence -->
    <div
      class="sticky left-0 z-20 border-r px-2 py-0.5 transition-colors print:bg-white print:py-0 print:group-hover:bg-transparent"
      :class="ui.sticky">
      <div class="flex items-center gap-1.5">
        <Icon name="lucide:calendar-off" size="14" class="shrink-0" :class="ui.icone" />
        <span class="rounded px-1 py-0.5 text-xs font-medium italic" :class="ui.label">Absences</span>
        <button
          v-if="canEdit"
          type="button"
          @click="emit('add-absence', user)"
          class="ml-auto cursor-pointer items-center justify-center text-xs italic transition-colors duration-300 print:hidden"
          :class="ui.ajouter"
          title="Ajouter une absence">
          Ajouter
        </button>
      </div>
    </div>

    <!-- Semaines -->
    <div
      v-for="week in weeks"
      :key="week.number"
      :data-week="week.number"
      class="relative flex items-center self-stretch px-px"
      :class="
        week.number === getWeekNumber(new Date()) &&
        selectedYear === new Date().getFullYear() &&
        `${ui.today} print:bg-white`
      ">
      <div class="relative h-2.5 w-full">
        <!-- Fond des semaines vides -->
        <div
          v-if="!weekAbsenceMap.get(week.number)?.color"
          class="absolute inset-0 rounded-xs border"
          :class="ui.vide"></div>

        <!-- Barre d'absence -->
        <div
          v-if="weekAbsenceMap.get(week.number)?.color"
          class="group/absence absolute inset-0 rounded-xs"
          :class="[weekAbsenceMap.get(week.number).color, canEdit ? 'cursor-pointer' : '']"
          @click="canEdit && openDeleteModal(weekAbsenceMap.get(week.number).absence)">
          <!-- Tooltip custom -->
          <div
            class="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden -translate-x-1/2 rounded bg-gray-900 px-2 py-1 text-xs whitespace-nowrap text-white shadow-lg group-hover/absence:block">
            {{ getTooltipText(week.number) }}
          </div>
        </div>
      </div>
    </div>
  </div>

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
