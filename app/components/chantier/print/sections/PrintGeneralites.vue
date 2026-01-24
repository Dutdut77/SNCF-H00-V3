<script setup>
const props = defineProps({
  chantier: {
    type: Object,
    required: true
  },
  weekRange: {
    type: Object,
    required: true
  },
  weekends: {
    type: Array,
    default: () => []
  }
})

// Formater une date en format court
const formatDateShort = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = String(date.getFullYear()).slice(-2)
  return `${day}/${month}/${year}`
}

// Calculer le numéro de semaine ISO
const getWeekNumber = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  const target = new Date(date.valueOf())
  const dayNr = (date.getDay() + 6) % 7
  target.setDate(target.getDate() - dayNr + 3)
  const firstThursday = target.valueOf()
  target.setMonth(0, 1)
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7))
  }
  return 'S' + (1 + Math.ceil((firstThursday - target) / 604800000))
}

// Obtenir le numéro de semaine sous forme de nombre
const getWeekNumberValue = (dateStr) => {
  if (!dateStr) return 1
  const date = new Date(dateStr)
  const target = new Date(date.valueOf())
  const dayNr = (date.getDay() + 6) % 7
  target.setDate(target.getDate() - dayNr + 3)
  const firstThursday = target.valueOf()
  target.setMonth(0, 1)
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7))
  }
  return 1 + Math.ceil((firstThursday - target) / 604800000)
}

// Week-ends triés par ordre croissant
const sortedWeekends = computed(() => {
  return [...props.weekends].sort((a, b) => {
    if (a.annee_debut !== b.annee_debut) {
      return a.annee_debut - b.annee_debut
    }
    return a.semaine_debut - b.semaine_debut
  })
})

// Vérifier si une semaine est dans une période de préparation
const isPreparationWeek = (weekNum, year) => {
  if (!props.chantier?.date_prepa) return false

  return props.chantier.date_prepa.some((p) => {
    if (!p.date_start_prepa) return false

    const startDate = new Date(p.date_start_prepa)
    const endDate = p.date_end_prepa ? new Date(p.date_end_prepa) : startDate

    const startWeek = getWeekNumberValue(p.date_start_prepa)
    const startYear = startDate.getFullYear()
    const endWeek = getWeekNumberValue(p.date_end_prepa || p.date_start_prepa)
    const endYear = endDate.getFullYear()

    // Même année
    if (startYear === endYear && year === startYear) {
      return weekNum >= startWeek && weekNum <= endWeek
    }

    // Années différentes
    if (year === startYear && weekNum >= startWeek) return true
    if (year === endYear && weekNum <= endWeek) return true
    if (year > startYear && year < endYear) return true

    return false
  })
}

// Vérifier si une semaine est dans une période de réalisation
const isRealisationWeek = (weekNum, year) => {
  if (!props.chantier?.date_rea) return false

  return props.chantier.date_rea.some((r) => {
    if (!r.date_start_travaux) return false

    const startDate = new Date(r.date_start_travaux)
    const endDate = r.date_end_travaux ? new Date(r.date_end_travaux) : startDate

    const startWeek = getWeekNumberValue(r.date_start_travaux)
    const startYear = startDate.getFullYear()
    const endWeek = getWeekNumberValue(r.date_end_travaux || r.date_start_travaux)
    const endYear = endDate.getFullYear()

    // Même année
    if (startYear === endYear && year === startYear) {
      return weekNum >= startWeek && weekNum <= endWeek
    }

    // Années différentes
    if (year === startYear && weekNum >= startWeek) return true
    if (year === endYear && weekNum <= endWeek) return true
    if (year > startYear && year < endYear) return true

    return false
  })
}

// Vérifier si une semaine est un week-end (uniquement sur la semaine de début)
const isWeekendWeek = (weekNum, year) => {
  return props.weekends.some((w) => {
    return weekNum === w.semaine_debut && year === w.annee_debut
  })
}
</script>

<template>
  <section class="mb-12 break-inside-avoid">
    <!-- Timeline visuelle des phases -->
    <div class="">
      <div class="mb-4 flex items-center gap-3 border-b border-gray-100 pb-2">
        <div class="bg-primary-600/20 text-primary-700 flex h-8 w-8 items-center justify-center rounded-lg">
          <Icon name="lucide:calendar-range" size="18" />
        </div>
        <h3 class="text-lg font-bold text-gray-700 uppercase">Période des travaux</h3>
      </div>

      <!-- Légende -->
      <div class="mb-6 flex flex-wrap items-center justify-center gap-4">
        <div class="flex items-center gap-2">
          <div class="border-secondary-900/40 bg-secondary-900/20 h-4 w-6 rounded border"></div>
          <span class="text-xs font-medium text-gray-600">Préparation</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="border-secondary-900 bg-secondary-800/60 h-4 w-6 rounded border"></div>
          <span class="text-xs font-medium text-gray-600">Réalisation</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="h-4 w-1.5 rounded bg-orange-500"></div>
          <span class="text-xs font-medium text-gray-600">Week-end</span>
        </div>
      </div>

      <!-- Timeline en brique style plan de charge -->
      <div v-if="weekRange.weeks.length > 0" class="overflow-x-auto pb-2">
        <div class="flex min-w-full flex-wrap items-center justify-center gap-0.5">
          <div
            v-for="week in weekRange.weeks"
            :key="`${week.year}-${week.number}`"
            class="relative flex flex-col items-center py-4">
            <!-- Numéro de semaine -->
            <span class="mb-1 text-[10px] font-medium text-gray-500">
              {{ week.number }}
            </span>

            <!-- Brique de la semaine -->
            <div class="relative h-4 w-6 rounded-sm">
              <!-- Fond préparation (plus clair) -->
              <div
                v-if="isPreparationWeek(week.number, week.year)"
                class="border-secondary-900/40 bg-secondary-900/20 absolute inset-0 rounded-sm border"></div>

              <!-- Fond réalisation (plus foncé, par-dessus) -->
              <div
                v-if="isRealisationWeek(week.number, week.year)"
                class="border-secondary-900 bg-secondary-800/60 absolute inset-0 rounded-sm border"></div>

              <!-- Fond neutre si pas de période -->
              <div
                v-if="!isPreparationWeek(week.number, week.year) && !isRealisationWeek(week.number, week.year)"
                class="absolute inset-0 rounded-sm border border-gray-200 bg-gray-100"></div>

              <!-- Barre verticale week-end -->
              <div
                v-if="isWeekendWeek(week.number, week.year)"
                class="absolute -top-2 -right-0.75 -bottom-2 z-10 w-1 rounded bg-orange-500 shadow-md"></div>
            </div>

            <!-- Année (affichée uniquement pour la première semaine de chaque année) -->
            <span
              v-if="week.number === 1 || weekRange.weeks.indexOf(week) === 0"
              class="pt-1 text-[9px] font-bold text-gray-500">
              {{ week.year }}
            </span>
            <span v-else class="pt-1 text-[9px] font-bold text-gray-500">&nbsp;</span>
          </div>
        </div>
      </div>

      <!-- Message si pas de période -->
      <div v-else class="flex flex-col items-center justify-center py-8 text-center">
        <Icon name="lucide:calendar-x" size="32" class="mb-2 text-gray-300" />
        <p class="text-sm text-gray-400 italic">Aucune période définie</p>
      </div>

      <!-- Détails des périodes -->
      <div
        v-if="
          (chantier.date_prepa && chantier.date_prepa.length > 0) ||
          (chantier.date_rea && chantier.date_rea.length > 0) ||
          weekends.length > 0
        "
        class="mt-2 flex h-full flex-row items-start justify-center gap-4 space-y-4 border-t border-gray-100 pt-4">
        <!-- Périodes de préparation -->
        <div v-if="chantier.date_prepa && chantier.date_prepa.length > 0" class="flex-1 px-4">
          <p class="text-sm font-semibold tracking-wider text-gray-600 uppercase">Préparation</p>
          <div class="mt-2 flex flex-wrap gap-2">
            <div
              v-for="(periode, index) in chantier.date_prepa"
              :key="'prepa-' + index"
              class="border-secondary-900/40 bg-secondary-900/20 text-secondary-900 inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium">
              <Icon name="lucide:calendar" size="12" />
              {{ getWeekNumber(periode.date_start_prepa) }} →
              {{ getWeekNumber(periode.date_end_prepa || periode.date_start_prepa) }}
              <span class="text-secondary-900">
                ({{ formatDateShort(periode.date_start_prepa) }} -
                {{ formatDateShort(periode.date_end_prepa || periode.date_start_prepa) }})
              </span>
            </div>
          </div>
        </div>

        <!-- Périodes de réalisation -->
        <div v-if="chantier.date_rea && chantier.date_rea.length > 0" class="flex-1 px-4">
          <p class="text-sm font-semibold tracking-wider text-gray-600 uppercase">Réalisation</p>
          <div class="mt-2 flex flex-wrap gap-2">
            <div
              v-for="(periode, index) in chantier.date_rea"
              :key="'rea-' + index"
              class="border-secondary-900 bg-secondary-800/60 inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium text-white">
              <Icon name="lucide:calendar-check" size="12" />
              {{ getWeekNumber(periode.date_start_travaux) }} →
              {{ getWeekNumber(periode.date_end_travaux || periode.date_start_travaux) }}
              <span class="text-white">
                ({{ formatDateShort(periode.date_start_travaux) }} -
                {{ formatDateShort(periode.date_end_travaux || periode.date_start_travaux) }})
              </span>
            </div>
          </div>
        </div>

        <!-- Week-ends -->
        <div v-if="weekends.length > 0" class="flex-1 px-4">
          <p class="text-sm font-semibold tracking-wider text-gray-600 uppercase">Week-ends</p>
          <div class="mt-2 flex flex-wrap gap-2">
            <div
              v-for="weekend in sortedWeekends"
              :key="weekend.id"
              class="inline-flex items-center gap-1 rounded-lg border border-orange-200 bg-orange-50 px-2 py-1 text-xs font-medium text-orange-700">
              <Icon name="lucide:calendar-days" size="12" />
              S{{ weekend.semaine_debut }}/{{ weekend.annee_debut }} → S{{ weekend.semaine_fin }}/{{
                weekend.annee_fin
              }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Section Ligne + Essais + Décret -->
    <div class="mt-12">
      <div class="mb-4 flex items-center gap-3 border-b border-gray-100 pb-2">
        <div class="bg-primary-600/20 text-primary-700 flex h-8 w-8 items-center justify-center rounded-lg">
          <Icon name="lucide:info" size="18" />
        </div>
        <h3 class="text-lg font-bold text-gray-700 uppercase">Généralités</h3>
      </div>

      <div class="grid grid-cols-3 gap-4 pl-4">
        <div class="flex items-center gap-4 rounded-lg">
          <div>
            <p class="text-sm text-gray-500">Ligne ferroviaire</p>
            <p class="text-xl font-semibold text-gray-900">{{ chantier.ligne || '-' }}</p>
          </div>
        </div>

        <div class="flex items-center gap-4 rounded-lg">
          <div>
            <p class="text-sm text-gray-500">Réglementation</p>
            <p class="text-xl font-semibold text-gray-900">
              {{ chantier.decret ? `Décret ${chantier.decret}` : '-' }}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-4 rounded-lg">
          <div>
            <p class="text-sm text-gray-500">Type d'essais</p>
            <p class="text-xl font-semibold text-gray-900">
              {{ chantier.type_essais ? (chantier.type_essais === 'simple' ? 'Simple' : 'Complexe') : '-' }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Rubrique Comptes -->
    <div class="mt-12">
      <div class="mb-4 flex items-center gap-3 border-b border-gray-100 pb-2">
        <div class="bg-primary-600/20 text-primary-700 flex h-8 w-8 items-center justify-center rounded-lg">
          <Icon name="lucide:landmark" size="18" />
        </div>
        <h3 class="text-lg font-bold text-gray-700 uppercase">Comptes</h3>
      </div>

      <div class="grid grid-cols-3 gap-4 pl-4">
        <div class="rounded-xl border border-gray-100 bg-gray-50 p-4">
          <label class="text-secondary-900 text-xs font-semibold tracking-wider uppercase">Compte MOE</label>
          <p class="mt-2 font-mono text-lg font-bold text-gray-900">
            {{ chantier.compte_moe || '-' }}
          </p>
        </div>
        <div class="rounded-xl border border-gray-100 bg-gray-50 p-4">
          <label class="text-secondary-900 text-xs font-semibold tracking-wider uppercase">
            Compte SLG
          </label>
          <p class="mt-2 font-mono text-lg font-bold text-gray-900">
            {{ chantier.compte_slg || '-' }}
          </p>
        </div>
        <div class="rounded-xl border border-gray-100 bg-gray-50 p-4">
          <label class="text-secondary-900 text-xs font-semibold tracking-wider uppercase">
            Compte Matière
          </label>
          <p class="mt-2 font-mono text-lg font-bold text-gray-900">
            {{ chantier.compte_matieres || '-' }}
          </p>
        </div>
      </div>
    </div>

    <!-- Autre -->
    <div v-if="chantier.autre" class="mt-8">
      <div class="mb-4 flex items-center gap-3 border-b border-gray-100 pb-2">
        <div class="bg-primary-600/20 text-primary-700 flex h-8 w-8 items-center justify-center rounded-lg">
          <Icon name="lucide:wallet" size="18" />
        </div>
        <h3 class="text-lg font-bold text-gray-700 uppercase">Informations complémentaires</h3>
      </div>
      <p class="pl-4 text-xs whitespace-pre-wrap text-gray-700">
        {{ chantier.autre }}
      </p>
    </div>
  </section>
</template>

