<script setup>
const props = defineProps({
  chantier: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update'])

const { updateChantier } = useChantiers()
const { getWeekendsByChantier, replaceWeekendsForChantier } = useTimeline()
const { recalculateH00Previsions } = useH00()
const { getAllLignes, allLignes } = useLigne()
const { addToast } = useToast()
const { taches, getTaches } = useTaches()
const { loading, setLoader } = useLoader()

onMounted(async () => {
  setLoader(true)
  await getAllLignes()
  await getTaches()
  setLoader(false)
})
// État du SlideOver
const showEditSlideOver = ref(false)
const initialRealisation = ref([])

// Week-ends du chantier
const weekends = ref([])

// Week-ends triés par ordre croissant
const sortedWeekends = computed(() => {
  return [...weekends.value].sort((a, b) => {
    if (a.annee_debut !== b.annee_debut) {
      return a.annee_debut - b.annee_debut
    }
    return a.semaine_debut - b.semaine_debut
  })
})

// État des formulaires d'ajout
const isPreparationAdd = ref(false)
const isRealisationAdd = ref(false)
const isWeekendAdd = ref(false)

// Formulaire pour nouveau week-end
const newWeekend = ref({
  semaineDebut: null,
  anneeDebut: new Date().getFullYear()
})

// Options pour les semaines (1-53)
const semaineOptions = computed(() => {
  return Array.from({ length: 53 }, (_, i) => ({
    id: i + 1,
    label: `S${i + 1}`
  }))
})

// Options pour les années
const anneeOptions = computed(() => {
  const currentYear = new Date().getFullYear()
  return Array.from({ length: 5 }, (_, i) => ({
    id: currentYear - 2 + i,
    label: String(currentYear - 2 + i)
  }))
})

// Formulaire d'édition complet
const editForm = ref({
  preparation: [],
  realisation: [],
  weekends: [],
  // Champs généraux
  ligne_id: null,
  type_essais: null,
  decret: null,
  matiere: '',
  matiere_da: '',
  compte_moe: '',
  compte_slg: '',
  compte_matieres: '',
  autre: ''
})

// Charger les week-ends
const loadWeekends = async () => {
  if (props.chantier?.id) {
    weekends.value = await getWeekendsByChantier(props.chantier.id)
  }
}

// Calcule la semaine suivante (gère le passage d'année)
const getNextWeek = (semaine, annee) => {
  if (semaine >= 52) {
    const dec31 = new Date(annee, 11, 31)
    const jan4 = new Date(annee, 0, 4)
    const jan4Day = jan4.getDay() || 7
    const mondayWeek1 = new Date(jan4)
    mondayWeek1.setDate(jan4.getDate() - (jan4Day - 1))
    const weeksInYear = Math.ceil((dec31 - mondayWeek1) / (7 * 24 * 60 * 60 * 1000))
    if (semaine >= weeksInYear) {
      return { semaine: 1, annee: annee + 1 }
    }
  }
  return { semaine: semaine + 1, annee: annee }
}

// Ajouter un week-end
const handleAddWeekend = async () => {
  if (!newWeekend.value.semaineDebut) return

  const { semaine: semaineFin, annee: anneeFin } = getNextWeek(
    newWeekend.value.semaineDebut,
    newWeekend.value.anneeDebut
  )

  editForm.value.weekends.push({
    debutSemaine: newWeekend.value.semaineDebut,
    debutAnnee: newWeekend.value.anneeDebut,
    finSemaine: semaineFin,
    finAnnee: anneeFin
  })

  isWeekendAdd.value = false
  newWeekend.value = {
    semaineDebut: null,
    anneeDebut: new Date().getFullYear()
  }
}

// Supprimer un week-end
const handleDeleteWeekend = (index) => {
  editForm.value.weekends.splice(index, 1)
}

// Ajouter une période de préparation
const handleAddPreparationFromPicker = (range) => {
  editForm.value.preparation.push({
    date_start: range.date_start,
    date_end: range.date_end
  })
  isPreparationAdd.value = false
}

// Supprimer une préparation
const handleDeletePreparation = (index) => {
  editForm.value.preparation.splice(index, 1)
}

// Ajouter une période de réalisation
const handleAddRealisationFromPicker = (range) => {
  editForm.value.realisation.push({
    date_start: range.date_start,
    date_end: range.date_end
  })
  isRealisationAdd.value = false
}

// Supprimer une réalisation
const handleDeleteRealisation = (index) => {
  editForm.value.realisation.splice(index, 1)
}

// Charger les week-ends au montage et quand le chantier change
onMounted(loadWeekends)
watch(() => props.chantier?.id, loadWeekends)

// Formater une date en format court (01/10/25)
const formatDateShort = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = String(date.getFullYear()).slice(-2)
  return `${day}/${month}/${year}`
}

// Fonction pour formater un timestamp en date lisible
const formatTimestampToDisplay = (timestamp) => {
  if (!timestamp) return '-'
  const date = new Date(timestamp)
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
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

// Calculer la plage de semaines à afficher
const weekRange = computed(() => {
  const allWeeks = []

  // Récupérer toutes les semaines des périodes de préparation
  if (props.chantier?.date_prepa) {
    props.chantier.date_prepa.forEach((p) => {
      if (p.date_start_prepa) {
        const startWeek = getWeekNumberValue(p.date_start_prepa)
        const startYear = new Date(p.date_start_prepa).getFullYear()
        const endWeek = p.date_end_prepa ? getWeekNumberValue(p.date_end_prepa) : startWeek
        const endYear = p.date_end_prepa ? new Date(p.date_end_prepa).getFullYear() : startYear
        allWeeks.push({ week: startWeek, year: startYear })
        allWeeks.push({ week: endWeek, year: endYear })
      }
    })
  }

  // Récupérer toutes les semaines des périodes de réalisation
  if (props.chantier?.date_rea) {
    props.chantier.date_rea.forEach((r) => {
      if (r.date_start_travaux) {
        const startWeek = getWeekNumberValue(r.date_start_travaux)
        const startYear = new Date(r.date_start_travaux).getFullYear()
        const endWeek = r.date_end_travaux ? getWeekNumberValue(r.date_end_travaux) : startWeek
        const endYear = r.date_end_travaux ? new Date(r.date_end_travaux).getFullYear() : startYear
        allWeeks.push({ week: startWeek, year: startYear })
        allWeeks.push({ week: endWeek, year: endYear })
      }
    })
  }

  // Récupérer toutes les semaines des week-ends
  weekends.value.forEach((w) => {
    allWeeks.push({ week: w.semaine_debut, year: w.annee_debut })
    allWeeks.push({ week: w.semaine_fin, year: w.annee_fin })
  })

  if (allWeeks.length === 0) return { weeks: [], minWeek: 1, maxWeek: 53, year: new Date().getFullYear() }

  // Trouver min et max (en tenant compte de l'année)
  const sorted = allWeeks.sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year
    return a.week - b.week
  })

  const min = sorted[0]
  const max = sorted[sorted.length - 1]

  // Si toutes les périodes sont dans la même année
  if (min.year === max.year) {
    const minWeek = Math.max(1, min.week - 2)
    const maxWeek = Math.min(53, max.week + 2)
    const weeks = []
    for (let i = minWeek; i <= maxWeek; i++) {
      weeks.push({ number: i, year: min.year })
    }
    return { weeks, minWeek, maxWeek, year: min.year }
  }

  // Si les périodes s'étendent sur plusieurs années
  const weeks = []
  let currentYear = min.year
  let currentWeek = Math.max(1, min.week - 2)
  const endWeek = Math.min(53, max.week + 2)
  const endYear = max.year

  while (currentYear < endYear || (currentYear === endYear && currentWeek <= endWeek)) {
    weeks.push({ number: currentWeek, year: currentYear })
    currentWeek++
    if (currentWeek > 53) {
      currentWeek = 1
      currentYear++
    }
    // Sécurité pour éviter les boucles infinies
    if (weeks.length > 104) break
  }

  return { weeks, minWeek: min.week, maxWeek: max.week, year: min.year }
})

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
  return weekends.value.some((w) => {
    // On affiche le week-end uniquement sur la semaine de début
    return weekNum === w.semaine_debut && year === w.annee_debut
  })
}

// Options pour les selects
const typeEssaisOptions = [
  { id: 'simple', label: 'Simple' },
  { id: 'complexe', label: 'Complexe' }
]

const decretOptions = [
  { id: '92', label: 'Décret 92' },
  { id: '94', label: 'Décret 94' }
]

// Convertir une date (string ISO ou timestamp) en timestamp local à midi
const toTimestamp = (date) => {
  if (!date) return null
  if (typeof date === 'number') return date
  // Pour les dates ISO, extraire uniquement la partie date pour éviter les problèmes de timezone
  const d = new Date(date)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0).getTime()
}

// Convertir un timestamp en date ISO pour Supabase
const timestampToISODate = (timestamp) => {
  if (!timestamp) return null
  const date = new Date(timestamp)
  return date.toISOString().split('T')[0]
}

// Ouvrir le SlideOver avec les données actuelles
const openEditSlideOver = () => {
  // Convertir les périodes de préparation
  const preparations = (props.chantier.date_prepa || []).map((p) => ({
    date_start: p.date_start_prepa ? toTimestamp(p.date_start_prepa) : null,
    date_end: p.date_end_prepa ? toTimestamp(p.date_end_prepa) : null
  }))

  // Convertir les périodes de réalisation
  const realisations = (props.chantier.date_rea || []).map((r) => ({
    date_start: r.date_start_travaux ? toTimestamp(r.date_start_travaux) : null,
    date_end: r.date_end_travaux ? toTimestamp(r.date_end_travaux) : null
  }))

  // Convertir les week-ends
  const weekendsList = weekends.value.map((w) => ({
    debutSemaine: w.semaine_debut,
    debutAnnee: w.annee_debut,
    finSemaine: w.semaine_fin,
    finAnnee: w.annee_fin
  }))

  // Sauvegarder l'état initial des réalisations
  initialRealisation.value = JSON.parse(JSON.stringify(realisations))

  editForm.value = {
    preparation: preparations,
    realisation: realisations,
    weekends: weekendsList,
    ligne_id: props.chantier.ligne_id || null,
    type_essais: props.chantier.type_essais || null,
    decret: props.chantier.decret || null,
    matiere: props.chantier.matiere || '',
    matiere_da: props.chantier.matiere_da || '',
    compte_moe: props.chantier.compte_moe || '',
    compte_slg: props.chantier.compte_slg || '',
    compte_matieres: props.chantier.compte_matieres || '',
    autre: props.chantier.autre || ''
  }

  showEditSlideOver.value = true
}

// Fermer le SlideOver
const closeEditSlideOver = () => {
  showEditSlideOver.value = false
}

const haveRealisationDatesChanged = () => {
  const current = editForm.value.realisation
  const initial = initialRealisation.value

  // Vérifier si le nombre de périodes a changé
  if (current.length !== initial.length) {
    return true
  }

  // Comparer chaque période
  for (let i = 0; i < current.length; i++) {
    if (current[i].date_start !== initial[i].date_start || current[i].date_end !== initial[i].date_end) {
      return true
    }
  }

  return false
}

// Sauvegarder les modifications
const saveChanges = async () => {
  setLoader(true)
  try {
    // Préparer les données de préparation au format attendu par la BDD
    const datePrepa = editForm.value.preparation.map((p) => ({
      date_start_prepa: timestampToISODate(p.date_start),
      date_end_prepa: timestampToISODate(p.date_end)
    }))

    // Préparer les données de réalisation au format attendu par la BDD
    const dateRea = editForm.value.realisation.map((r) => ({
      date_start_travaux: timestampToISODate(r.date_start),
      date_end_travaux: timestampToISODate(r.date_end)
    }))

    // Mettre à jour le chantier avec tous les champs
    const updated = await updateChantier(props.chantier.id, {
      date_prepa: datePrepa,
      date_rea: dateRea,
      ligne_id: editForm.value.ligne_id || null,
      type_essais: editForm.value.type_essais || null,
      decret: editForm.value.decret || null,
      matiere: editForm.value.matiere || null,
      matiere_da: editForm.value.matiere_da || null,
      compte_moe: editForm.value.compte_moe || null,
      compte_slg: editForm.value.compte_slg || null,
      compte_matieres: editForm.value.compte_matieres || null,
      autre: editForm.value.autre || null
    })

    // Mettre à jour les week-ends
    await replaceWeekendsForChantier(props.chantier.id, editForm.value.weekends)

    // Vérifier si les dates de réalisation ont changé
    const realisationChanged = haveRealisationDatesChanged()

    if (realisationChanged && taches.value.length > 0) {
      const { updated } = await recalculateH00Previsions(props.chantier.id, dateRea, taches.value)
      if (updated > 0) {
        addToast({
          title: 'Tâches H00 recalculées',
          message: `${updated} dates de prévision ont été mises à jour.`,
          type: 'Info'
        })
      }
    }

    if (updated) {
      // Mettre à jour le chantier parent
      Object.assign(props.chantier, updated)
      await loadWeekends()
      closeEditSlideOver()
    }
  } finally {
    setLoader(false)
  }
}
</script>

<template>
  <div class="space-y-4">
    <!-- Header avec titre et bouton modifier -->
    <div class="flex flex-row items-center justify-between gap-4">
      <AppTitleMain title="Généralités du chantier" description="Informations générales du chantier" />
      <AppButtonValidated type="button" theme="primary" @click="openEditSlideOver">
        <template #default>
          <span class="flex items-center gap-2">
            <Icon name="lucide:pencil" size="16" />
            Modifier
          </span>
        </template>
      </AppButtonValidated>
    </div>

    <!-- Section Ligne + Essais + Décret -->
    <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div
        class="dark:bg-primary-200 flex items-center gap-4 rounded-lg bg-white p-5 shadow-md transition hover:shadow-lg">
        <div class="bg-primary-600/20 text-primary-700 flex h-10 w-10 items-center justify-center rounded-xl">
          <Icon name="lucide:train-track" size="20" />
        </div>
        <div>
          <p class="text-primary-500 text-sm">Ligne ferroviaire</p>
          <p class="text-primary-900 text-xl font-semibold">{{ chantier.ligne || '-' }}</p>
        </div>
      </div>

      <div
        class="dark:bg-primary-200 flex items-center gap-4 rounded-lg bg-white p-5 shadow-md transition hover:shadow-lg">
        <div class="bg-primary-600/20 text-primary-700 flex h-10 w-10 items-center justify-center rounded-xl">
          <Icon name="lucide:scale" size="20" />
        </div>
        <div>
          <p class="text-primary-500 text-sm">Réglementation</p>
          <p class="text-primary-900 text-xl font-semibold">
            {{ chantier.decret ? `Décret ${chantier.decret}` : '-' }}
          </p>
        </div>
      </div>

      <div
        class="dark:bg-primary-200 flex items-center gap-4 rounded-lg bg-white p-5 shadow-md transition hover:shadow-lg">
        <div class="bg-primary-600/20 text-primary-700 flex h-10 w-10 items-center justify-center rounded-xl">
          <Icon name="lucide:flask-conical" size="20" />
        </div>
        <div>
          <p class="text-primary-500 text-sm">Type d'essais</p>
          <p class="text-primary-900 text-xl font-semibold">
            {{ chantier.type_essais ? (chantier.type_essais === 'simple' ? 'Simple' : 'Complexe') : '-' }}
          </p>
        </div>
      </div>
    </div>

    <!-- Carte Timeline style Plan de charge -->
    <div class="dark:bg-primary-200 border-primary-100 rounded-lg border bg-white shadow-lg">
      <div class="p-6">
        <div class="mb-6 flex items-center gap-3">
          <div class="bg-primary-600/20 text-primary-700 flex h-10 w-10 items-center justify-center rounded-xl">
            <Icon name="lucide:calendar-range" size="20" />
          </div>
          <div>
            <h2 class="text-primary-800 text-lg font-bold">Période des travaux</h2>
            <p class="text-primary-700 text-xs">Planification temporelle</p>
          </div>
        </div>
        <!-- Légende -->
        <div class="mb-6 flex flex-wrap items-center justify-center gap-4">
          <div class="flex items-center gap-2">
            <div class="h-4 w-6 rounded border border-red-900/40 bg-red-900/20"></div>
            <span class="text-primary-600 text-xs font-medium">Préparation</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="h-4 w-6 rounded border border-red-900 bg-red-800/60"></div>
            <span class="text-primary-600 text-xs font-medium">Réalisation</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="h-4 w-1.5 rounded bg-orange-500"></div>
            <span class="text-primary-600 text-xs font-medium">Week-end</span>
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
              <span class="text-primary-600 mb-1 text-[10px] font-medium">
                {{ week.number }}
              </span>

              <!-- Brique de la semaine -->
              <div class="relative h-4 w-6 rounded-sm">
                <!-- Fond préparation (plus clair) -->
                <div
                  v-if="isPreparationWeek(week.number, week.year)"
                  class="absolute inset-0 rounded-sm border border-red-900/40 bg-red-900/20"></div>

                <!-- Fond réalisation (plus foncé, par-dessus) -->
                <div
                  v-if="isRealisationWeek(week.number, week.year)"
                  class="absolute inset-0 rounded-sm border border-red-900 bg-red-800/60"></div>

                <!-- Fond neutre si pas de période -->
                <div
                  v-if="!isPreparationWeek(week.number, week.year) && !isRealisationWeek(week.number, week.year)"
                  class="border-primary-200 bg-primary-100 absolute inset-0 rounded-sm border"></div>

                <!-- Barre verticale week-end -->
                <div
                  v-if="isWeekendWeek(week.number, week.year)"
                  class="absolute -top-2 -right-0.75 -bottom-2 z-10 w-1 rounded bg-orange-500 shadow-md"></div>
              </div>

              <!-- Année (affichée uniquement pour la première semaine de chaque année) -->
              <span
                v-if="week.number === 1 || weekRange.weeks.indexOf(week) === 0"
                class="text-primary-600 pt-1 text-[9px] font-bold">
                {{ week.year }}
              </span>
              <span v-else class="text-primary-600 pt-1 text-[9px] font-bold">&nbsp;</span>
            </div>
          </div>
        </div>

        <!-- Message si pas de période -->
        <div v-else class="flex flex-col items-center justify-center py-8 text-center">
          <Icon name="lucide:calendar-x" size="32" class="text-primary-600 mb-2" />
          <p class="text-primary-600 text-sm italic">Aucune période définie</p>
        </div>

        <!-- Détails des périodes -->
        <div
          v-if="
            (chantier.date_prepa && chantier.date_prepa.length > 0) ||
            (chantier.date_rea && chantier.date_rea.length > 0) ||
            weekends.length > 0
          "
          class="border-primary-100 mt-2 flex h-full flex-col items-start justify-center gap-4 space-y-4 border-t pt-4 lg:flex-row">
          <!-- Périodes de préparation -->
          <div v-if="chantier.date_prepa && chantier.date_prepa.length > 0" class="flex-1 px-4">
            <p class="text-primary-700 text-sm font-semibold tracking-wider uppercase">Préparation</p>
            <div class="mt-2 flex flex-wrap gap-2">
              <div
                v-for="(periode, index) in chantier.date_prepa"
                :key="'prepa-' + index"
                class="inline-flex items-center gap-1 rounded-lg border border-red-900/40 bg-red-900/20 px-2 py-1 text-xs font-medium text-red-900">
                <Icon name="lucide:calendar" size="12" />
                {{ getWeekNumber(periode.date_start_prepa) }} →
                {{ getWeekNumber(periode.date_end_prepa || periode.date_start_prepa) }}
                <span class="text-red-900">
                  ({{ formatDateShort(periode.date_start_prepa) }} -
                  {{ formatDateShort(periode.date_end_prepa || periode.date_start_prepa) }})
                </span>
              </div>
            </div>
          </div>

          <!-- Périodes de réalisation -->
          <div v-if="chantier.date_rea && chantier.date_rea.length > 0" class="flex-1 px-4">
            <p class="text-primary-800 text-sm font-semibold tracking-wider uppercase">Réalisation</p>
            <div class="mt-2 flex flex-wrap gap-2">
              <div
                v-for="(periode, index) in chantier.date_rea"
                :key="'rea-' + index"
                class="text-primary-50 inline-flex items-center gap-1 rounded-lg border border-red-900 bg-red-800/60 px-2 py-1 text-xs font-medium">
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
            <p class="text-primary-800 text-xs font-semibold tracking-wider uppercase">
              Week-ends ({{ weekends.length }})
            </p>
            <div class="border-primary-200 mt-2 flex flex-wrap gap-2 border-l-2 pl-2">
              <div
                v-for="weekend in sortedWeekends"
                :key="weekend.id"
                class="inline-flex items-center gap-1 rounded-lg border border-orange-200 bg-orange-50 px-2 py-1 text-xs font-medium text-orange-700 dark:border-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                <Icon name="lucide:calendar-days" size="12" />
                S{{ weekend.semaine_debut }}/{{ weekend.annee_debut }} → S{{ weekend.semaine_fin }}/{{
                  weekend.annee_fin
                }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Lien matières commandées -->
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div class="dark:bg-primary-200 border-primary-100 rounded-lg border bg-white shadow-lg">
        <div class="p-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="bg-primary-600/20 text-primary-700 flex h-10 w-10 items-center justify-center rounded-xl">
                <Icon name="lucide:package" size="20" />
              </div>
              <div>
                <h2 class="text-primary-800 text-lg font-bold">Matières DM</h2>
                <p class="text-primary-700 text-xs">Accès au suivi des commandes</p>
              </div>
            </div>

            <div v-if="chantier.matiere">
              <a
                :href="chantier.matiere"
                target="_blank"
                rel="noopener noreferrer"
                class="border-secondary-900 bg-secondary-800/60 text-primary-50 inline-flex items-center gap-2 rounded-lg border px-4 py-1 text-sm font-medium shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl">
                <Icon name="lucide:external-link" size="16" />
                Ouvrir le lien
              </a>
            </div>
            <span v-else class="text-primary-600 text-sm italic">Aucun lien défini</span>
          </div>
        </div>
      </div>
      <div class="dark:bg-primary-200 border-primary-100 rounded-lg border bg-white shadow-lg">
        <div class="p-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="bg-primary-600/20 text-primary-700 flex h-10 w-10 items-center justify-center rounded-xl">
                <Icon name="lucide:package" size="20" />
              </div>
              <div>
                <h2 class="text-primary-800 text-lg font-bold">Matières DA</h2>
                <p class="text-primary-700 text-xs">Accès au suivi des commandes</p>
              </div>
            </div>

            <div v-if="chantier.matiere_da">
              <a
                :href="chantier.matiere_da"
                target="_blank"
                rel="noopener noreferrer"
                class="border-secondary-900 bg-secondary-800/60 text-primary-50 inline-flex items-center gap-2 rounded-lg border px-4 py-1 text-sm font-medium shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl">
                <Icon name="lucide:external-link" size="16" />
                Ouvrir le lien
              </a>
            </div>
            <span v-else class="text-primary-600 text-sm italic">Aucun lien défini</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Rubrique Comptes -->
    <div class="border-primary-100 dark:bg-primary-200 rounded-lg border bg-white shadow-lg">
      <div class="p-6">
        <div class="mb-5 flex items-center gap-3">
          <div class="bg-primary-600/20 text-primary-700 flex h-10 w-10 items-center justify-center rounded-xl">
            <Icon name="lucide:wallet" size="20" />
          </div>
          <div>
            <h2 class="text-primary-800 text-lg font-bold">Comptes</h2>
            <p class="text-primary-700 text-xs">Références comptables du chantier</p>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div class="border-primary-100 bg-primary-50 rounded-xl border p-4">
            <label class="text-secondary-900 text-xs font-semibold tracking-wider uppercase dark:text-cyan-400">
              Compte MOE
            </label>
            <p class="text-primary-900 mt-2 font-mono text-lg font-bold">
              {{ chantier.compte_moe || '-' }}
            </p>
          </div>
          <div class="border-primary-100 bg-primary-50 rounded-xl border p-4">
            <label class="text-secondary-900 text-xs font-semibold tracking-wider uppercase dark:text-cyan-400">
              Compte SLG
            </label>
            <p class="text-primary-900 mt-2 font-mono text-lg font-bold">
              {{ chantier.compte_slg || '-' }}
            </p>
          </div>
          <div class="border-primary-100 bg-primary-50 rounded-xl border p-4">
            <label class="text-secondary-900 text-xs font-semibold tracking-wider uppercase dark:text-cyan-400">
              Compte Matière
            </label>
            <p class="text-primary-900 mt-2 font-mono text-lg font-bold">
              {{ chantier.compte_matieres || '-' }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Rubrique Autre -->
    <div class="border-primary-100 dark:bg-primary-200 rounded-lg border bg-white shadow-lg">
      <div class="p-6">
        <div class="mb-5 flex items-center gap-3">
          <div class="bg-primary-600/20 text-primary-700 flex h-10 w-10 items-center justify-center rounded-xl">
            <Icon name="lucide:file-text" size="20" />
          </div>
          <div>
            <h2 class="text-primary-800 text-lg font-bold">Autre</h2>
            <p class="text-primary-700 text-xs">Informations complémentaires</p>
          </div>
        </div>

        <div v-if="chantier.autre" class="border-primary-100 bg-primary-50 rounded-xl border p-4">
          <p class="text-primary-700 text-sm leading-relaxed whitespace-pre-wrap">
            {{ chantier.autre }}
          </p>
        </div>
        <div v-else class="border-primary-100 bg-primary-50 rounded-xl border p-4 text-center">
          <Icon name="lucide:file-x" size="32" class="text-primary-600 mx-auto mb-2" />
          <p class="text-primary-600 text-sm italic">Aucune information complémentaire</p>
        </div>
      </div>
    </div>

    <!-- SlideOver de modification des périodes -->
    <AppSlideOver :sideModal="showEditSlideOver" :closeSideModal="closeEditSlideOver">
      <AppSlideOverContent v-if="showEditSlideOver" :closeSideModal="closeEditSlideOver">
        <template #header>
          <h2 class="text-primary-800 font-[Pacifico] text-3xl">Périodes du chantier</h2>
          <p class="text-primary-500 text-sm">Gérez les périodes de préparation, réalisation et week-ends</p>
        </template>

        <template #default>
          <div class="space-y-6">
            <!-- Section Préparation -->
            <div class="space-y-4">
              <div class="border-primary-200 flex items-center gap-2 border-b pb-2">
                <div class="border-secondary-900/40 bg-secondary-900/20 h-4 w-6 rounded border"></div>
                <h3 class="text-primary-700 text-sm font-semibold tracking-wider uppercase">Périodes de préparation</h3>
                <div
                  class="hover:text-secondary-700 text-primary-900 ml-auto flex h-4 w-6 cursor-pointer items-center justify-center rounded transition-all duration-300"
                  @click="isPreparationAdd = true">
                  <Icon name="lucide:plus" size="16" class="" />
                </div>
              </div>

              <!-- Liste des périodes existantes -->
              <div v-if="editForm.preparation.length > 0" class="space-y-2">
                <div
                  v-for="(periode, index) in editForm.preparation"
                  :key="'edit-prepa-' + index"
                  class="border-secondary-900/40 bg-secondary-900/20 text-secondary-900 flex items-center justify-between rounded-lg border p-3">
                  <div class="flex items-center gap-2">
                    <Icon name="lucide:calendar" size="16" class="text-secondary-900" />
                    <span class="text-primary-700 text-sm font-medium">
                      {{ formatTimestampToDisplay(periode.date_start) }} →
                      {{ formatTimestampToDisplay(periode.date_end) }}
                    </span>
                  </div>
                  <button
                    type="button"
                    @click="handleDeletePreparation(index)"
                    class="text-primary-700 hover:text-primary-700 cursor-pointer rounded p-1 transition-colors">
                    <Icon name="lucide:x" size="16" />
                  </button>
                </div>
              </div>
              <p v-else class="text-primary-700 text-sm italic">Aucune période de préparation</p>

              <!-- Bouton ajouter -->
              <!-- <AppButtonValidated type="button" theme="cancel" @click="isPreparationAdd = true">
                <template #default>
                  <span class="flex items-center gap-2">
                    <Icon name="lucide:plus" size="16" />
                    Ajouter une période
                  </span>
                </template>
              </AppButtonValidated> -->

              <!-- Date picker (modal) -->
              <AppDatePickerRange
                :is-open="isPreparationAdd"
                title="Période de préparation"
                @select="handleAddPreparationFromPicker"
                @close="isPreparationAdd = false" />
            </div>

            <!-- Section Réalisation -->
            <div class="space-y-4">
              <div class="border-primary-200 flex items-center gap-2 border-b pb-2">
                <div class="h-4 w-6 rounded border border-red-900 bg-red-800/60"></div>
                <h3 class="text-primary-700 text-sm font-semibold tracking-wider uppercase">Périodes de réalisation</h3>
                <div
                  class="hover:text-secondary-700 text-primary-900 ml-auto flex h-4 w-6 cursor-pointer items-center justify-center rounded transition-all duration-300"
                  @click="isRealisationAdd = true">
                  <Icon name="lucide:plus" size="16" class="" />
                </div>
              </div>

              <!-- Liste des périodes existantes -->
              <div v-if="editForm.realisation.length > 0" class="space-y-2">
                <div
                  v-for="(periode, index) in editForm.realisation"
                  :key="'edit-rea-' + index"
                  class="text-primary-50 flex items-center justify-between rounded-lg border border-red-900 bg-red-800/60 p-3">
                  <div class="flex items-center gap-2">
                    <Icon name="lucide:calendar-check" size="16" class="text-white" />
                    <span class="text-primary-50 text-sm font-medium">
                      {{ formatTimestampToDisplay(periode.date_start) }} →
                      {{ formatTimestampToDisplay(periode.date_end) }}
                    </span>
                  </div>
                  <button
                    type="button"
                    @click="handleDeleteRealisation(index)"
                    class="text-primary-500 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 cursor-pointer rounded p-1 transition-colors">
                    <Icon name="lucide:x" size="16" />
                  </button>
                </div>
              </div>
              <p v-else class="text-sm text-white italic">Aucune période de réalisation</p>

              <!-- Bouton ajouter -->
              <!-- <AppButtonValidated type="button" theme="cancel" @click="isRealisationAdd = true">
                <template #default>
                  <span class="flex items-center gap-2">
                    <Icon name="lucide:plus" size="16" />
                    Ajouter une période
                  </span>
                </template>
              </AppButtonValidated> -->

              <!-- Date picker (modal) -->
              <AppDatePickerRange
                :is-open="isRealisationAdd"
                title="Période de réalisation"
                @select="handleAddRealisationFromPicker"
                @close="isRealisationAdd = false" />
            </div>

            <!-- Section Week-ends -->
            <div class="space-y-4">
              <div class="border-primary-200 flex items-center gap-2 border-b pb-2">
                <div class="h-4 w-1.5 rounded bg-orange-500"></div>
                <h3 class="text-primary-700 text-sm font-semibold tracking-wider uppercase">Week-ends</h3>
                <div
                  class="hover:text-secondary-700 text-primary-900 ml-auto flex h-4 w-6 cursor-pointer items-center justify-center rounded transition-all duration-300"
                  @click="isWeekendAdd = true">
                  <Icon name="lucide:plus" size="16" class="" />
                </div>
              </div>

              <!-- Liste des week-ends existants -->
              <div v-if="editForm.weekends.length > 0" class="space-y-2">
                <div
                  v-for="(weekend, index) in editForm.weekends"
                  :key="'edit-weekend-' + index"
                  class="flex items-center justify-between rounded-lg border border-orange-200 bg-orange-50 p-3 dark:border-orange-800 dark:bg-orange-900/20">
                  <div class="flex items-center gap-2">
                    <Icon name="lucide:calendar-days" size="16" class="text-orange-500" />
                    <span class="text-primary-700 text-sm font-medium">
                      S{{ weekend.debutSemaine }}/{{ weekend.debutAnnee }} → S{{ weekend.finSemaine }}/{{
                        weekend.finAnnee
                      }}
                    </span>
                  </div>
                  <button
                    type="button"
                    @click="handleDeleteWeekend(index)"
                    class="text-primary-700 hover:text-primary-700 cursor-pointer rounded p-1 transition-colors">
                    <Icon name="lucide:x" size="16" />
                  </button>
                </div>
              </div>
              <p v-else class="text-primary-700 text-sm italic">Aucun week-end programmé</p>

              <!-- Formulaire d'ajout -->
              <div v-if="!isWeekendAdd">
                <!-- <AppButtonValidated type="button" theme="cancel" @click="isWeekendAdd = true">
                  <template #default>
                    <span class="flex items-center gap-2">
                      <Icon name="lucide:plus" size="16" />
                      Ajouter un week-end
                    </span>
                  </template>
                </AppButtonValidated> -->
              </div>
              <div v-else class="border-primary-200 bg-primary-50 rounded-lg border p-4">
                <p class="text-primary-600 dark:text-primary-400 mb-3 text-xs font-semibold tracking-wider uppercase">
                  Semaine de début (la fin sera automatiquement définie)
                </p>
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="text-primary-700 mb-1 block text-xs">Semaine</label>
                    <AppSelect
                      v-model="newWeekend.semaineDebut"
                      :options="semaineOptions"
                      placeholder="S..."
                      nullable />
                  </div>
                  <div>
                    <label class="text-primary-700 mb-1 block text-xs">Année</label>
                    <AppSelect v-model="newWeekend.anneeDebut" :options="anneeOptions" placeholder="Année" />
                  </div>
                </div>
                <div class="mt-3 flex gap-2">
                  <AppButtonValidated
                    type="button"
                    theme="primary"
                    :validated="!!newWeekend.semaineDebut"
                    @click="handleAddWeekend">
                    <template #default>
                      <span class="flex items-center gap-2">
                        <Icon name="lucide:plus" size="16" />
                        Ajouter
                      </span>
                    </template>
                  </AppButtonValidated>
                  <button
                    type="button"
                    @click="isWeekendAdd = false"
                    class="text-primary-700 hover:text-primary-700 text-sm">
                    Annuler
                  </button>
                </div>
              </div>
            </div>

            <!-- Section Informations générales -->
            <div class="space-y-4">
              <div class="border-primary-200 flex items-center gap-2 border-b pb-2">
                <Icon name="lucide:info" size="16" class="text-primary-500" />
                <h3 class="text-primary-700 text-sm font-semibold tracking-wider uppercase">Informations générales</h3>
              </div>

              <AppSelect
                v-model="editForm.ligne_id"
                name="type_essais"
                title="Ligne"
                :options="allLignes"
                placeholder="Sélectionner la ligne..."
                nullable />

              <AppSelect
                v-model="editForm.type_essais"
                name="type_essais"
                title="Type d'essais"
                :options="typeEssaisOptions"
                placeholder="Sélectionner le type d'essais..."
                nullable />

              <AppSelect
                v-model="editForm.decret"
                name="decret"
                title="Décret"
                :options="decretOptions"
                placeholder="Sélectionner..."
                nullable />
            </div>

            <!-- Section Matières commandées -->
            <div class="space-y-4">
              <div class="border-primary-200 flex items-center gap-2 border-b pb-2">
                <Icon name="lucide:package" size="16" class="text-primary-500" />
                <h3 class="text-primary-700 text-sm font-semibold tracking-wider uppercase">Matières DM</h3>
              </div>

              <AppInput
                v-model="editForm.matiere"
                name="matiere"
                title="Lien web"
                type="url"
                placeholder="https://..." />
            </div>
            <div class="space-y-4">
              <div class="border-primary-200 flex items-center gap-2 border-b pb-2">
                <Icon name="lucide:package" size="16" class="text-primary-500" />
                <h3 class="text-primary-700 text-sm font-semibold tracking-wider uppercase">Matières DA</h3>
              </div>

              <AppInput
                v-model="editForm.matiere_da"
                name="matiere_da"
                title="Lien web"
                type="url"
                placeholder="https://..." />
            </div>

            <!-- Section Comptes -->
            <div class="space-y-4">
              <div class="border-primary-200 flex items-center gap-2 border-b pb-2">
                <Icon name="lucide:wallet" size="16" class="text-primary-500" />
                <h3 class="text-primary-700 text-sm font-semibold tracking-wider uppercase">Comptes</h3>
              </div>

              <AppInput
                v-model="editForm.compte_moe"
                name="compte_moe"
                title="Compte MOE"
                placeholder="Numéro de compte MOE" />

              <AppInput
                v-model="editForm.compte_slg"
                name="compte_slg"
                title="Compte SLG"
                placeholder="Numéro de compte SLG" />

              <AppInput
                v-model="editForm.compte_matieres"
                name="compte_matieres"
                title="Compte Matière"
                placeholder="Numéro de compte Matière" />
            </div>

            <!-- Section Autre -->
            <div class="space-y-4">
              <div class="border-primary-200 flex items-center gap-2 border-b pb-2">
                <Icon name="lucide:file-text" size="16" class="text-primary-500" />
                <h3 class="text-primary-700 text-sm font-semibold tracking-wider uppercase">Autre</h3>
              </div>

              <div class="w-full">
                <label for="autre" class="mb-0.5 block text-sm">Informations complémentaires</label>
                <textarea
                  v-model="editForm.autre"
                  id="autre"
                  name="autre"
                  rows="4"
                  class="focus:border-primary-500 focus:ring-primary-500 border-primary-300 text-primary-700 w-full resize-none appearance-none rounded-lg border px-3 py-2 text-sm leading-tight focus:ring-1 focus:outline-none"
                  placeholder="Notes, remarques, informations diverses..."></textarea>
              </div>
            </div>
          </div>
        </template>

        <template #footer>
          <div class="border-primary-200 flex justify-end gap-3 border-t pt-4">
            <AppButtonValidated theme="cancel" type="button" @click="closeEditSlideOver">
              <template #default>Annuler</template>
            </AppButtonValidated>
            <AppButtonValidated theme="primary" type="button" @click="saveChanges">
              <template #default>Enregistrer</template>
            </AppButtonValidated>
          </div>
        </template>
      </AppSlideOverContent>
    </AppSlideOver>
  </div>
</template>
