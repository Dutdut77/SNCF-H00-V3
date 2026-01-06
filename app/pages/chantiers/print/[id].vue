<script setup>
definePageMeta({
  requiresAuth: true,
  requisecondaryRole: '',
  layout: false
})

const route = useRoute()
const { getChantierById } = useChantiers()
const { getTimelineByChantier, getWeekendsByChantier } = useTimeline()
const { getAllContacts } = useContacts()
const { getCommentaire } = useCommentaires()
const { getDexByChantier, getPtByChantier, getDocumentStatus, getPtStatus, formatDate } = useEtudes()
const { getAllUsers, users } = useUsers()

// ID du chantier
const chantierId = computed(() => route.params.id)

// États des données
const chantier = ref(null)
const timeline = ref([])
const weekends = ref([])
const contacts = ref(null)
const commentaires = ref({})
const dex = ref([])
const pt = ref([])
const isLoading = ref(true)

// Titre de la page
useHead({
  title: computed(() =>
    chantier.value ? `Impression - ${chantier.value.compte} - ${chantier.value.name}` : 'Impression Chantier'
  )
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

// Trier la timeline
const sortedTimeline = computed(() => {
  return [...timeline.value].sort((a, b) => {
    if (a.annee_debut !== b.annee_debut) return a.annee_debut - b.annee_debut
    return a.semaine_debut - b.semaine_debut
  })
})

// Type de timeline
const getTypeLabel = (type) => {
  const labels = { weekend: 'Week-end', semaine: 'Semaine' }
  return labels[type] || 'Semaine'
}

// Obtenir le nom complet d'un utilisateur par son ID
const getUserName = (userId) => {
  if (!userId) return null
  const user = users.value.find((u) => u.id === userId)
  if (!user) return null
  return user.prenom && user.nom ? `${user.prenom} ${user.nom}` : user.email
}

// Obtenir l'email d'un utilisateur par son ID
const getUserEmail = (userId) => {
  if (!userId) return null
  const user = users.value.find((u) => u.id === userId)
  return user?.email || null
}

// Obtenir plusieurs noms d'utilisateurs (pour les arrays)
const getUserNames = (userIds) => {
  if (!userIds || userIds.length === 0) return null
  const names = userIds.map((id) => getUserName(id)).filter((n) => n)
  return names.length > 0 ? names.join(', ') : null
}

// Charger toutes les données
const loadData = async () => {
  isLoading.value = true
  try {
    // Charger d'abord les utilisateurs pour pouvoir résoudre les noms
    await getAllUsers()

    const [chantierData, timelineData, weekendsData, contactsData, dexData, ptData] = await Promise.all([
      getChantierById(chantierId.value),
      getTimelineByChantier(chantierId.value),
      getWeekendsByChantier(chantierId.value),
      getAllContacts(chantierId.value),
      getDexByChantier(chantierId.value),
      getPtByChantier(chantierId.value)
    ])

    chantier.value = chantierData
    timeline.value = timelineData
    weekends.value = weekendsData
    contacts.value = contactsData
    dex.value = dexData
    pt.value = ptData

    // Charger les commentaires
    const commentaireTypes = ['generalite', 'ses', 'voie', 'logistique', 'terrain']
    const commentairesData = await Promise.all(commentaireTypes.map((type) => getCommentaire(chantierId.value, type)))
    commentaireTypes.forEach((type, index) => {
      commentaires.value[type] = commentairesData[index]
    })
  } catch (error) {
    console.error('Erreur lors du chargement:', error)
  } finally {
    isLoading.value = false
  }
}

// Lancer l'impression
const triggerPrint = () => {
  setTimeout(() => {
    window.print()
  }, 800)
}

// Charger au montage
onMounted(async () => {
  await loadData()
  triggerPrint()
})

// Date d'impression
const printDate = new Date().toLocaleDateString('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})

// Calculer la plage de semaines à afficher
const weekRange = computed(() => {
  const allWeeks = []

  // Récupérer toutes les semaines des périodes de préparation
  if (chantier.value?.date_prepa) {
    chantier.value.date_prepa.forEach((p) => {
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
  if (chantier.value?.date_rea) {
    chantier.value.date_rea.forEach((r) => {
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
  if (!chantier.value?.date_prepa) return false

  return chantier.value.date_prepa.some((p) => {
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
  if (!chantier.value?.date_rea) return false

  return chantier.value.date_rea.some((r) => {
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
// Week-ends triés par ordre croissant
const sortedWeekends = computed(() => {
  return [...weekends.value].sort((a, b) => {
    if (a.annee_debut !== b.annee_debut) {
      return a.annee_debut - b.annee_debut
    }
    return a.semaine_debut - b.semaine_debut
  })
})
</script>

<template>
  <div class="min-h-screen bg-gray-100 print:bg-white">
    <!-- Écran de chargement -->
    <div v-if="isLoading" class="flex min-h-screen flex-col items-center justify-center gap-4">
      <div class="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500"></div>
      <p class="text-gray-600">Préparation du document...</p>
    </div>

    <!-- Contenu imprimable -->
    <div
      v-else-if="chantier"
      class="mx-auto max-w-4xl bg-white p-8 shadow-lg print:max-w-none print:p-0 print:shadow-none">
      <!-- Boutons (non imprimés) -->
      <!-- <div class="mb-6 flex gap-3 print:hidden">
        <button
          @click="window.print()"
          class="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700">
          <Icon name="lucide:printer" size="18" />
          Imprimer
        </button>
      </div> -->

      <!-- En-tête -->
      <header class="mb-8 flex h-full min-h-screen flex-col items-center justify-center border border-gray-400">
        <div class="flex w-full flex-col items-center justify-center">
          <img src="/images/logo_uo.png" alt="H00" class="h-80" />
          <span class="font-[pacifico] text-4xl font-bold text-gray-700">H00 Travaux</span>
          <span class="pl-3 text-xs text-gray-400">Imprimé le {{ printDate }}</span>
          <div class="mt-20 min-w-1/2 rounded-lg border border-gray-400 p-8 text-center shadow-2xl">
            <h1 class="font-[Bangers] text-4xl font-bold text-gray-700">{{ chantier.compte }}</h1>
            <h2 class="font-[Bangers] text-3xl font-medium text-gray-600">{{ chantier.name }}</h2>
          </div>
        </div>
      </header>

      <!-- Section 1 : Informations Générales -->
      <section class="mb-12">
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
              <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Préparation</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="border-secondary-900 bg-secondary-800/60 h-4 w-6 rounded border"></div>
              <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Réalisation</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="h-4 w-1.5 rounded bg-orange-500"></div>
              <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Week-end</span>
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
                <span class="mb-1 text-[10px] font-medium text-gray-500 dark:text-gray-400">
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
                    class="absolute inset-0 rounded-sm border border-gray-200 bg-gray-100 dark:border-gray-600 dark:bg-gray-700"></div>

                  <!-- Barre verticale week-end -->
                  <div
                    v-if="isWeekendWeek(week.number, week.year)"
                    class="absolute -top-2 -right-0.75 -bottom-2 z-10 w-1 rounded bg-orange-500 shadow-md"></div>
                </div>

                <!-- Année (affichée uniquement pour la première semaine de chaque année) -->
                <span
                  v-if="week.number === 1 || weekRange.weeks.indexOf(week) === 0"
                  class="pt-1 text-[9px] font-bold text-gray-500 dark:text-gray-500">
                  {{ week.year }}
                </span>
                <span v-else class="pt-1 text-[9px] font-bold text-gray-500 dark:text-gray-500">&nbsp;</span>
              </div>
            </div>
          </div>

          <!-- Message si pas de période -->
          <div v-else class="flex flex-col items-center justify-center py-8 text-center">
            <Icon name="lucide:calendar-x" size="32" class="mb-2 text-gray-300 dark:text-gray-600" />
            <p class="text-sm text-gray-400 italic dark:text-gray-500">Aucune période définie</p>
          </div>

          <!-- Détails des périodes -->
          <div
            v-if="
              (chantier.date_prepa && chantier.date_prepa.length > 0) ||
              (chantier.date_rea && chantier.date_rea.length > 0) ||
              weekends.length > 0
            "
            class="mt-2 flex h-full flex-row items-start justify-center gap-4 space-y-4 border-t border-gray-100 pt-4 dark:border-gray-700">
            <!-- Périodes de préparation -->
            <div v-if="chantier.date_prepa && chantier.date_prepa.length > 0" class="flex-1 px-4">
              <p class="text-sm font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-400">Préparation</p>
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
              <p class="text-sm font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-400">Réalisation</p>
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
              <p class="text-sm font-semibold tracking-wider text-gray-600 uppercase dark:text-gray-400">Week-ends</p>
              <div class="mt-2 flex flex-wrap gap-2">
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
            <div class="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-700/50">
              <label class="text-secondary-900 text-xs font-semibold tracking-wider uppercase">Compte MOE</label>
              <p class="mt-2 font-mono text-lg font-bold text-gray-900 dark:text-white">
                {{ chantier.compte_moe || '-' }}
              </p>
            </div>
            <div class="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-700/50">
              <label class="text-secondary-900 text-xs font-semibold tracking-wider uppercase dark:text-cyan-400">
                Compte SLG
              </label>
              <p class="mt-2 font-mono text-lg font-bold text-gray-900 dark:text-white">
                {{ chantier.compte_slg || '-' }}
              </p>
            </div>
            <div class="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-700/50">
              <label class="text-secondary-900 text-xs font-semibold tracking-wider uppercase dark:text-cyan-400">
                Compte Matière
              </label>
              <p class="mt-2 font-mono text-lg font-bold text-gray-900 dark:text-white">
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
            <h3 class="text-lg font-bold text-gray-900 uppercase">Informations complémentaires</h3>
          </div>
          <p class="pl-4 text-base whitespace-pre-wrap text-gray-700">
            {{ chantier.autre }}
          </p>
        </div>
      </section>

      <!-- Section 2 : Contacts -->
      <section v-if="contacts" class="mb-8 break-inside-avoid">
        <div class="mb-4 flex items-center gap-3 border-b border-gray-100 pb-2">
          <div class="bg-primary-600/20 text-primary-700 flex h-8 w-8 items-center justify-center rounded-lg">
            <Icon name="lucide:users" size="18" />
          </div>
          <h3 class="text-lg font-bold text-gray-700 uppercase">Contacts</h3>
        </div>

        <!-- Généralités -->
        <div
          v-if="
            contacts.generalites &&
            (contacts.generalites.chef_projet_nom || contacts.generalites.coordinateur_securite_nom)
          "
          class="mb-4">
          <p class="mb-2 text-base font-semibold tracking-wide text-gray-500 uppercase">Généralités</p>

          <table class="w-full text-left text-xs">
            <thead>
              <tr class="bg-secondary-900/10 border-b border-gray-200">
                <th class="text-secondary-900 px-2 py-1.5 font-semibold">Fonction</th>
                <th class="text-secondary-900 px-2 py-1.5 font-semibold">Nom</th>
                <th class="text-secondary-900 px-2 py-1.5 font-semibold">Email</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="contacts.generalites.chef_projet_nom" class="border-b border-gray-100">
                <td class="px-2 py-1.5 font-bold text-gray-700">Chef de projet</td>
                <td class="px-2 py-1.5 text-gray-700">{{ contacts.generalites.chef_projet_nom }}</td>
                <td class="px-2 py-1.5 text-gray-700">{{ contacts.generalites.chef_projet_email || '-' }}</td>
              </tr>
              <tr v-if="contacts.generalites.coordinateur_securite_nom" class="border-b border-gray-100">
                <td class="px-2 py-1.5 font-bold text-gray-700">Coordinateur sécurité</td>
                <td class="px-2 py-1.5 text-gray-700">{{ contacts.generalites.coordinateur_securite_nom }}</td>
                <td class="px-2 py-1.5 text-gray-700">{{ contacts.generalites.coordinateur_securite_email || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Travaux -->
        <div
          v-if="
            contacts.travaux &&
            (getUserName(contacts.travaux.rlt_voie_principale) ||
              getUserName(contacts.travaux.rlt_ses_principale) ||
              getUserName(contacts.travaux.rlt_cat_principale) ||
              getUserName(contacts.travaux.preop_voie) ||
              getUserName(contacts.travaux.preop_ses) ||
              getUserName(contacts.travaux.logistique))
          "
          class="mb-4">
          <p class="mb-2 text-base font-semibold tracking-wide text-gray-500 uppercase">Équipe Travaux</p>
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="bg-secondary-900/10 border-b border-gray-200">
                <th class="text-secondary-900 px-2 py-1.5 font-semibold">Fonction</th>
                <th class="text-secondary-900 px-2 py-1.5 font-semibold">Nom</th>
                <th class="text-secondary-900 px-2 py-1.5 font-semibold">Email</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="getUserName(contacts.travaux.rlt_voie_principale)" class="border-b border-gray-100">
                <td class="px-2 py-1.5 font-medium text-gray-600">RLT Voie</td>
                <td class="px-2 py-1.5 text-gray-900">{{ getUserName(contacts.travaux.rlt_voie_principale) }}</td>
                <td class="px-2 py-1.5 text-gray-500">
                  {{ getUserEmail(contacts.travaux.rlt_voie_principale) || '-' }}
                </td>
              </tr>
              <tr v-if="getUserNames(contacts.travaux.rlt_voie_secondaire)" class="border-b border-gray-100">
                <td class="px-2 py-1.5 font-medium text-gray-500">RLT Voie (sec.)</td>
                <td class="px-2 py-1.5 text-gray-900">{{ getUserNames(contacts.travaux.rlt_voie_secondaire) }}</td>
                <td class="px-2 py-1.5 text-gray-500">-</td>
              </tr>
              <tr v-if="getUserName(contacts.travaux.rlt_ses_principale)" class="border-b border-gray-100">
                <td class="px-2 py-1.5 font-medium text-gray-600">RLT SES</td>
                <td class="px-2 py-1.5 text-gray-900">{{ getUserName(contacts.travaux.rlt_ses_principale) }}</td>
                <td class="px-2 py-1.5 text-gray-500">
                  {{ getUserEmail(contacts.travaux.rlt_ses_principale) || '-' }}
                </td>
              </tr>
              <tr v-if="getUserNames(contacts.travaux.rlt_ses_secondaire)" class="border-b border-gray-100">
                <td class="px-2 py-1.5 font-medium text-gray-500">RLT SES (sec.)</td>
                <td class="px-2 py-1.5 text-gray-900">{{ getUserNames(contacts.travaux.rlt_ses_secondaire) }}</td>
                <td class="px-2 py-1.5 text-gray-500">-</td>
              </tr>
              <tr v-if="getUserName(contacts.travaux.rlt_cat_principale)" class="border-b border-gray-100">
                <td class="px-2 py-1.5 font-medium text-gray-600">RLT CAT</td>
                <td class="px-2 py-1.5 text-gray-900">{{ getUserName(contacts.travaux.rlt_cat_principale) }}</td>
                <td class="px-2 py-1.5 text-gray-500">
                  {{ getUserEmail(contacts.travaux.rlt_cat_principale) || '-' }}
                </td>
              </tr>
              <tr v-if="getUserNames(contacts.travaux.rlt_cat_secondaire)" class="border-b border-gray-100">
                <td class="px-2 py-1.5 font-medium text-gray-500">RLT CAT (sec.)</td>
                <td class="px-2 py-1.5 text-gray-900">{{ getUserNames(contacts.travaux.rlt_cat_secondaire) }}</td>
                <td class="px-2 py-1.5 text-gray-500">-</td>
              </tr>
              <tr v-if="getUserNames(contacts.travaux.kv_voie)" class="border-b border-gray-100">
                <td class="px-2 py-1.5 font-medium text-gray-600">Contrôleur Voie</td>
                <td class="px-2 py-1.5 text-gray-900">{{ getUserNames(contacts.travaux.kv_voie) }}</td>
                <td class="px-2 py-1.5 text-gray-500">-</td>
              </tr>
              <tr v-if="getUserNames(contacts.travaux.kv_ses)" class="border-b border-gray-100">
                <td class="px-2 py-1.5 font-medium text-gray-600">Contrôleur SES</td>
                <td class="px-2 py-1.5 text-gray-900">{{ getUserNames(contacts.travaux.kv_ses) }}</td>
                <td class="px-2 py-1.5 text-gray-500">-</td>
              </tr>
              <tr v-if="getUserNames(contacts.travaux.kv_cat)" class="border-b border-gray-100">
                <td class="px-2 py-1.5 font-medium text-gray-600">Contrôleur CAT</td>
                <td class="px-2 py-1.5 text-gray-900">{{ getUserNames(contacts.travaux.kv_cat) }}</td>
                <td class="px-2 py-1.5 text-gray-500">-</td>
              </tr>
              <tr v-if="getUserName(contacts.travaux.preop_voie)" class="border-b border-gray-100">
                <td class="px-2 py-1.5 font-medium text-gray-600">Pré-op Voie</td>
                <td class="px-2 py-1.5 text-gray-900">{{ getUserName(contacts.travaux.preop_voie) }}</td>
                <td class="px-2 py-1.5 text-gray-500">{{ getUserEmail(contacts.travaux.preop_voie) || '-' }}</td>
              </tr>
              <tr v-if="getUserName(contacts.travaux.preop_ses)" class="border-b border-gray-100">
                <td class="px-2 py-1.5 font-medium text-gray-600">Pré-op SES</td>
                <td class="px-2 py-1.5 text-gray-900">{{ getUserName(contacts.travaux.preop_ses) }}</td>
                <td class="px-2 py-1.5 text-gray-500">{{ getUserEmail(contacts.travaux.preop_ses) || '-' }}</td>
              </tr>
              <tr v-if="getUserName(contacts.travaux.logistique)" class="border-b border-gray-100">
                <td class="px-2 py-1.5 font-medium text-gray-600">Logistique</td>
                <td class="px-2 py-1.5 text-gray-900">{{ getUserName(contacts.travaux.logistique) }}</td>
                <td class="px-2 py-1.5 text-gray-500">{{ getUserEmail(contacts.travaux.logistique) || '-' }}</td>
              </tr>
              <tr v-if="getUserNames(contacts.travaux.supervisor)" class="border-b border-gray-100">
                <td class="px-2 py-1.5 font-medium text-slate-600">Superviseurs</td>
                <td class="px-2 py-1.5 text-gray-900">{{ getUserNames(contacts.travaux.supervisor) }}</td>
                <td class="px-2 py-1.5 text-gray-500">-</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Études -->
        <div
          v-if="contacts.etudes && (contacts.etudes.plan_technique_nom || contacts.etudes.documents_execution_nom)"
          class="mb-4">
          <p class="mb-2 text-base font-semibold tracking-wide text-gray-500 uppercase">Études</p>
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="bg-secondary-900/10 border-b border-gray-200">
                <th class="text-secondary-900 px-2 py-1.5 font-semibold">Fonction</th>
                <th class="text-secondary-900 px-2 py-1.5 font-semibold">Nom</th>
                <th class="text-secondary-900 px-2 py-1.5 font-semibold">Email</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="contacts.etudes.plan_technique_nom" class="border-b border-gray-100">
                <td class="px-2 py-1.5 font-medium text-gray-600">Plan technique</td>
                <td class="px-2 py-1.5 text-gray-900">{{ contacts.etudes.plan_technique_nom }}</td>
                <td class="px-2 py-1.5 text-gray-500">{{ contacts.etudes.plan_technique_email || '-' }}</td>
              </tr>
              <tr v-if="contacts.etudes.documents_execution_nom" class="border-b border-gray-100">
                <td class="px-2 py-1.5 font-medium text-gray-600">Documents d'exécution</td>
                <td class="px-2 py-1.5 text-gray-900">{{ contacts.etudes.documents_execution_nom }}</td>
                <td class="px-2 py-1.5 text-gray-500">{{ contacts.etudes.documents_execution_email || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Entreprises -->
        <div v-if="contacts.entreprises?.length" class="mb-4">
          <p class="mb-2 text-base font-semibold tracking-wide text-gray-500 uppercase">Entreprises</p>
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="bg-secondary-900/10 border-b border-gray-200">
                <th class="text-secondary-900 px-2 py-1.5 font-semibold">Métier</th>
                <th class="text-secondary-900 px-2 py-1.5 font-semibold">Entreprise</th>
                <th class="text-secondary-900 px-2 py-1.5 font-semibold">Responsable</th>
                <th class="text-secondary-900 px-2 py-1.5 font-semibold">Email</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="ent in contacts.entreprises" :key="ent.id" class="border-b border-gray-100">
                <td class="px-2 py-1.5 font-medium text-gray-600">{{ ent.metier || '-' }}</td>
                <td class="px-2 py-1.5 text-gray-900">{{ ent.entreprise || '-' }}</td>
                <td class="px-2 py-1.5 text-gray-900">{{ ent.responsable_nom || '-' }}</td>
                <td class="px-2 py-1.5 text-gray-500">{{ ent.responsable_email || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Autres contacts -->
        <div v-if="contacts.autres?.length">
          <p class="mb-2 text-base font-semibold tracking-wide text-gray-500 uppercase">Autres contacts</p>
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="bg-secondary-900/10 border-b border-gray-200">
                <th class="text-secondary-900 px-2 py-1.5 font-semibold">Fonction</th>
                <th class="text-secondary-900 px-2 py-1.5 font-semibold">Organisme</th>
                <th class="text-secondary-900 px-2 py-1.5 font-semibold">Responsable</th>
                <th class="text-secondary-900 px-2 py-1.5 font-semibold">Email</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="autre in contacts.autres" :key="autre.id" class="border-b border-gray-100">
                <td class="px-2 py-1.5 font-medium text-slate-600">{{ autre.metier || '-' }}</td>
                <td class="px-2 py-1.5 text-gray-900">{{ autre.entreprise || '-' }}</td>
                <td class="px-2 py-1.5 text-gray-900">{{ autre.responsable_nom || '-' }}</td>
                <td class="px-2 py-1.5 text-gray-500">{{ autre.responsable_email || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Section 3 : Timeline -->
      <section v-if="sortedTimeline.length > 0" class="mb-8 break-inside-avoid">
        <div class="mb-4 flex items-center gap-3 border-b border-gray-100 pb-2">
          <div class="bg-primary-600/20 text-primary-700 flex h-8 w-8 items-center justify-center rounded-lg">
            <Icon name="lucide:git-branch" size="18" />
          </div>
          <h3 class="text-lg font-bold text-gray-700 uppercase">Timeline</h3>
        </div>

        <div class="relative ml-4 border-l-2 border-gray-200 pl-4">
          <div v-for="item in sortedTimeline" :key="item.id" class="relative mb-4 last:mb-0">
            <div
              class="absolute top-1 -left-[23px] h-3 w-3 rounded-full border-2 border-white"
              :class="item.type === 'weekend' ? 'bg-orange-500' : 'bg-secondary-900'"></div>
            <div class="rounded-lg border border-gray-100 bg-gray-50 p-3 print:bg-white">
              <div class="mb-1 flex items-center gap-2">
                <span
                  class="text-[10px] font-semibold uppercase"
                  :class="item.type === 'weekend' ? 'text-orange-600' : 'text-secondary-900'">
                  {{ getTypeLabel(item.type) }}
                </span>
                <span class="text-xs text-gray-500">
                  S{{ item.semaine_debut }}/{{ item.annee_debut }}
                  <template v-if="item.semaine_fin">→ S{{ item.semaine_fin }}/{{ item.annee_fin }}</template>
                </span>
              </div>
              <p class="text-sm whitespace-pre-line text-gray-800">{{ item.contenu }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Section 4 : Études -->
      <section v-if="dex.length > 0 || pt.length > 0" class="mb-8 break-before-page">
        <div class="mb-4 flex items-center gap-3 border-b border-gray-100 pb-2">
          <div class="bg-primary-600/20 text-primary-700 flex h-8 w-8 items-center justify-center rounded-lg">
            <Icon name="lucide:graduation-cap" size="18" />
          </div>
          <h3 class="text-lg font-bold text-gray-700 uppercase">Études</h3>
        </div>

        <!-- Documents d'exécution -->
        <div v-if="dex.length > 0" class="mb-4">
          <p class="mb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase">Documents d'exécution</p>
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="border-b border-gray-200 bg-gray-50 print:bg-white">
                <th class="px-2 py-1.5 font-semibold text-gray-600">Indice</th>
                <th class="px-2 py-1.5 font-semibold text-gray-600">Titre</th>
                <th class="px-2 py-1.5 font-semibold text-gray-600">MES</th>
                <th class="px-2 py-1.5 font-semibold text-gray-600">Demande</th>
                <th class="px-2 py-1.5 font-semibold text-gray-600">Reçu</th>
                <th class="px-2 py-1.5 font-semibold text-gray-600">Statut</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="doc in dex" :key="doc.id" class="border-b border-gray-100">
                <td class="px-2 py-1.5 font-mono text-gray-900">{{ doc.indice }}</td>
                <td class="px-2 py-1.5 text-gray-900">{{ doc.titre || '-' }}</td>
                <td class="px-2 py-1.5 text-gray-600">{{ formatDate(doc.date_mes) }}</td>
                <td class="px-2 py-1.5 text-gray-600">{{ formatDate(doc.date_demande) }}</td>
                <td class="px-2 py-1.5 text-gray-600">{{ formatDate(doc.date_recu) }}</td>
                <td class="px-2 py-1.5">
                  <span
                    class="inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold"
                    :class="{
                      'bg-primary-100 text-primary-700 print:bg-primary-50':
                        getDocumentStatus(doc, true).color === 'primary',
                      'bg-amber-100 text-amber-700 print:bg-amber-50': getDocumentStatus(doc, true).color === 'amber',
                      'bg-secondary-100 text-secondary-700 print:bg-secondary-50':
                        getDocumentStatus(doc, true).color === 'secondary',
                      'bg-gray-100 text-gray-600 print:bg-gray-50': getDocumentStatus(doc, true).color === 'gray'
                    }">
                    {{ getDocumentStatus(doc, true).label }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Plans techniques -->
        <div v-if="pt.length > 0">
          <p class="mb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase">Plans techniques</p>
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="border-b border-gray-200 bg-gray-50 print:bg-white">
                <th class="px-2 py-1.5 font-semibold text-gray-600">Indice</th>
                <th class="px-2 py-1.5 font-semibold text-gray-600">Titre</th>
                <th class="px-2 py-1.5 font-semibold text-gray-600">MES</th>
                <th class="px-2 py-1.5 font-semibold text-gray-600">Reçu</th>
                <th class="px-2 py-1.5 font-semibold text-gray-600">Statut</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="plan in pt" :key="plan.id" class="border-b border-gray-100">
                <td class="px-2 py-1.5 font-mono text-gray-900">{{ plan.indice }}</td>
                <td class="px-2 py-1.5 text-gray-900">{{ plan.titre || '-' }}</td>
                <td class="px-2 py-1.5 text-gray-600">{{ formatDate(plan.date_mes) }}</td>
                <td class="px-2 py-1.5 text-gray-600">{{ formatDate(plan.date_recu) }}</td>
                <td class="px-2 py-1.5">
                  <span
                    class="inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold"
                    :class="{
                      'bg-primary-100 text-primary-700 print:bg-primary-50': getPtStatus(plan).color === 'primary',
                      'bg-amber-100 text-amber-700 print:bg-amber-50': getPtStatus(plan).color === 'amber',
                      'bg-secondary-100 text-secondary-700 print:bg-secondary-50':
                        getPtStatus(plan).color === 'secondary',
                      'bg-gray-100 text-gray-600 print:bg-gray-50': getPtStatus(plan).color === 'gray'
                    }">
                    {{ getPtStatus(plan).label }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Section 5 : Commentaires -->
      <section v-if="Object.values(commentaires).some((c) => c?.content)" class="mb-8">
        <div class="mb-4 flex items-center gap-3 border-b border-gray-100 pb-2">
          <div class="bg-primary-600/20 text-primary-700 flex h-8 w-8 items-center justify-center rounded-lg">
            <Icon name="lucide:message-square" size="18" />
          </div>
          <h3 class="text-lg font-bold text-gray-700 uppercase">Commentaires</h3>
        </div>

        <div class="space-y-8">
          <div v-if="commentaires.generalite.content" class="break-inside-avoid border-b border-gray-200 pb-4">
            <h5 class="bg-secondary-900/10 text-secondary-900 mb-2 p-2 text-xs font-bold tracking-wide">Généralités</h5>
            <div class="prose prose-sm max-w-none text-sm text-gray-700" v-html="commentaires.generalite.content"></div>
          </div>
          <div v-if="commentaires.ses?.content" class="break-inside-avoid border-b border-gray-200 pb-4">
            <h5 class="bg-secondary-900/10 text-secondary-900 mb-2 p-2 text-xs font-bold tracking-wide">SES</h5>
            <div class="prose prose-sm max-w-none text-sm text-gray-700" v-html="commentaires.ses.content"></div>
          </div>
          <div v-if="commentaires.voie?.content" class="break-inside-avoid border-b border-gray-200 pb-4">
            <h5 class="bg-secondary-900/10 text-secondary-900 mb-2 p-2 text-sm font-bold tracking-wide">Voie</h5>
            <div class="prose prose-sm max-w-none text-sm text-gray-700" v-html="commentaires.voie.content"></div>
          </div>
          <div v-if="commentaires.logistique?.content" class="break-inside-avoid border-b border-gray-200 pb-4">
            <h5 class="bg-secondary-900/10 text-secondary-900 mb-2 p-2 text-xs font-bold tracking-wide">Logistique</h5>
            <div class="prose prose-sm max-w-none text-sm text-gray-700" v-html="commentaires.logistique.content"></div>
          </div>
          <div v-if="commentaires.terrain?.content" class="break-inside-avoid border-b border-gray-200 pb-4">
            <h5 class="bg-secondary-900/10 text-secondary-900 mb-2 p-2 text-xs font-bold tracking-wide">Terrain</h5>
            <div class="prose prose-sm max-w-none text-sm text-gray-700" v-html="commentaires.terrain.content"></div>
          </div>
        </div>
      </section>

      <!-- Pied de page -->
      <footer class="mt-8 border-t-2 border-gray-200 pt-4">
        <div class="flex justify-between text-[10px] text-gray-400">
          <span>Document généré par H00</span>
          <span>{{ chantier.compte }} - {{ chantier.name }}</span>
        </div>
      </footer>
    </div>
  </div>
</template>

<style>
@media print {
  @page {
    size: A4;
    margin: 10mm;
  }

  .print\:hidden {
    display: none !important;
  }

  .break-before-page {
    break-before: page;
  }

  .break-inside-avoid {
    break-inside: avoid;
  }
}
</style>
