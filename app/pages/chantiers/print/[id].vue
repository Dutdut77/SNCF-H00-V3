<script setup>
import { getTemplateComponent } from '~/components/chantier/customPages/index'

definePageMeta({
  requiresAuth: true,
  requireRole: '',
  layout: false
})

const route = useRoute()
const { getChantierById } = useChantiers()
const { getTimelineByChantier, getWeekendsByChantier } = useTimeline()
const { getAllContacts } = useContacts()
const { getCommentaire } = useCommentaires()
const { getDexByChantier, getPtByChantier } = useEtudes()
const { getAllUsers } = useUsers()
const { getPages, chantierPages } = useChantierPages()
const { getLogistiqueByChantier } = useLogistique()
const { imprimantes, getImprimantes } = useImprimantes()
const { boxes, getBoxes } = useBoxes()

// ID du chantier
const chantierId = computed(() => route.params.id)

// Configuration d'impression depuis localStorage
const printConfig = ref(null)
const selectedSections = ref([])

// États des données
const chantier = ref(null)
const timeline = ref([])
const weekends = ref([])
const contacts = ref(null)
const commentaires = ref({})
const dex = ref([])
const pt = ref([])
const logistique = ref(normalizeEquipements({}))
const isLoading = ref(true)

// Charger la configuration d'impression depuis localStorage
const loadPrintConfig = () => {
  try {
    const stored = localStorage.getItem('h00-print-config')
    if (stored) {
      printConfig.value = JSON.parse(stored)
      selectedSections.value = printConfig.value.sections || []
      // Nettoyer le localStorage après lecture
      localStorage.removeItem('h00-print-config')
    }
  } catch (e) {
    console.error('Erreur lors de la lecture de la configuration:', e)
  }
}

// Vérifier si une section est sélectionnée
const isSectionSelected = (sectionId) => {
  // Si pas de configuration, afficher toutes les sections par défaut
  if (!printConfig.value || selectedSections.value.length === 0) return true
  return selectedSections.value.some(s => s.id === sectionId)
}

// Obtenir l'ordre d'une section (pour le tri)
const getSectionOrder = (sectionId) => {
  if (!printConfig.value || selectedSections.value.length === 0) return 999
  const index = selectedSections.value.findIndex(s => s.id === sectionId)
  return index === -1 ? 999 : index
}

// Sections triées dans l'ordre de sélection
const orderedSections = computed(() => {
  const baseSections = ['generalites', 'contacts', 'timeline', 'etudes', 'commentaires', 'logistique']

  // Ajouter les pages personnalisées
  const customPageSections = selectedSections.value
    .filter(s => s.isCustomPage)
    .map(s => s.id)

  const allSections = [...baseSections, ...customPageSections]

  // Si pas de config, retourner l'ordre par défaut
  if (!printConfig.value || selectedSections.value.length === 0) {
    return baseSections
  }

  // Filtrer et trier selon la configuration
  return allSections
    .filter(id => isSectionSelected(id))
    .sort((a, b) => getSectionOrder(a) - getSectionOrder(b))
})

// Obtenir les données d'une page personnalisée
const getCustomPageData = (sectionId) => {
  const section = selectedSections.value.find(s => s.id === sectionId)
  if (section?.pageData) return section.pageData

  // Fallback: chercher dans les pages chargées
  const pageId = sectionId.replace('custom-', '')
  return chantierPages.value?.find(p => p.id === pageId) || null
}

// Titre de la page
useHead({
  title: computed(() =>
    chantier.value ? `Impression - ${chantier.value.compte} - ${chantier.value.name}` : 'Impression Chantier'
  )
})

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

// Charger toutes les données
const loadData = async () => {
  isLoading.value = true
  try {
    // Charger d'abord les utilisateurs pour pouvoir résoudre les noms
    await getAllUsers()

    const [chantierData, timelineData, weekendsData, contactsData, dexData, ptData, logistiqueData] = await Promise.all([
      getChantierById(chantierId.value),
      getTimelineByChantier(chantierId.value),
      getWeekendsByChantier(chantierId.value),
      getAllContacts(chantierId.value),
      getDexByChantier(chantierId.value),
      getPtByChantier(chantierId.value),
      getLogistiqueByChantier(chantierId.value),
      getImprimantes(),
      getBoxes()
    ])

    chantier.value = chantierData
    timeline.value = timelineData
    weekends.value = weekendsData
    contacts.value = contactsData
    dex.value = dexData
    pt.value = ptData
    logistique.value = normalizeEquipements(logistiqueData)

    // Charger les commentaires
    const commentaireTypes = ['generalite', 'ses', 'voie', 'logistique', 'terrain']
    const commentairesData = await Promise.all(commentaireTypes.map((type) => getCommentaire(chantierId.value, type)))
    commentaireTypes.forEach((type, index) => {
      commentaires.value[type] = commentairesData[index]
    })

    // Charger les pages personnalisées si nécessaire
    await getPages(chantierId.value)
  } catch (error) {
    console.error('Erreur lors du chargement:', error)
  } finally {
    isLoading.value = false
  }
}

// Lancer l'impression
const triggerPrint = () => {
  window.print()
}

// Fermer la fenêtre
const closeWindow = () => {
  window.close()
}

// Charger au montage
onMounted(async () => {
  // Charger la configuration d'impression
  loadPrintConfig()

  await loadData()
  // Ne pas lancer l'impression automatiquement - l'utilisateur cliquera sur le bouton
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
</script>

<template>
  <div class="min-h-screen bg-gray-100 print:bg-white">
    <!-- Barre d'actions (masquée à l'impression) -->
    <div v-if="!isLoading && chantier"
      class="sticky top-0 z-50 border-b border-gray-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur print:hidden">
      <div class="mx-auto flex max-w-4xl items-center justify-between">
        <div class="flex items-center gap-3">
          <Icon name="lucide:file-text" size="24" class="text-primary-600" />
          <div>
            <h1 class="text-lg font-bold text-gray-800">{{ chantier.compte }} - {{ chantier.name }}</h1>
            <p class="text-xs text-gray-500">Aperçu avant impression</p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <button type="button"
            class="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            @click="closeWindow">
            <Icon name="lucide:x" size="16" />
            Fermer
          </button>
          <button type="button"
            class="bg-primary-600 hover:bg-primary-700 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition"
            @click="triggerPrint">
            <Icon name="lucide:printer" size="16" />
            Imprimer
          </button>
        </div>
      </div>
    </div>

    <!-- Écran de chargement -->
    <div v-if="isLoading" class="flex min-h-screen flex-col items-center justify-center gap-4">
      <div class="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500"></div>
      <p class="text-gray-600">Préparation du document...</p>
    </div>

    <!-- Contenu imprimable -->
    <div v-else-if="chantier"
      class="mx-auto max-w-4xl bg-white p-8 shadow-lg print:max-w-none print:p-0 print:shadow-none">

      <!-- En-tête -->
      <header class="mb-8 flex h-full min-h-screen flex-col items-center justify-center border border-gray-400">
        <div class="flex w-full flex-col items-center justify-center">
          <img src="/images/logo_uo.png" alt="H00" class="h-80" />
          <span class="font-[Bangers] text-4xl font-bold tracking-wider text-gray-700">H00 Travaux</span>
          <span class="pl-3 text-xs text-gray-400">Imprimé le {{ printDate }}</span>
          <div class="mt-20 min-w-2/3 rounded-lg border border-gray-400 p-8 text-center shadow-2xl">
            <h1 class="font-[Bangers] text-4xl font-bold tracking-wider text-gray-700">{{ chantier.compte }}</h1>
            <h2 class="font-[Bangers] text-3xl font-medium tracking-wider text-gray-600">{{ chantier.name }}</h2>
          </div>
        </div>
      </header>

      <!-- Sections dans l'ordre choisi par l'utilisateur -->
      <template v-for="section in orderedSections" :key="section">
        <!-- Généralités -->
        <ChantierPrintSectionsPrintGeneralites v-if="section === 'generalites'" :chantier="chantier"
          :week-range="weekRange" :weekends="weekends" />

        <!-- Contacts -->
        <ChantierPrintSectionsPrintContacts v-else-if="section === 'contacts' && contacts" :contacts="contacts" />

        <!-- Timeline -->
        <ChantierPrintSectionsPrintTimeline v-else-if="section === 'timeline'" :timeline="timeline" />

        <!-- Études -->
        <ChantierPrintSectionsPrintEtudes v-else-if="section === 'etudes'" :dex="dex" :pt="pt" />

        <!-- Commentaires -->
        <ChantierPrintSectionsPrintCommentaires v-else-if="section === 'commentaires'" :commentaires="commentaires" />

        <!-- Logistique -->
        <ChantierPrintSectionsPrintLogistique
          v-else-if="section === 'logistique'"
          :equipements="logistique"
          :imprimantes="imprimantes"
          :boxes="boxes" />

        <!-- Pages personnalisées -->
        <ChantierPrintSectionsPrintCustomPage
          v-else-if="section.startsWith && section.startsWith('custom-') && getCustomPageData(section)"
          :page-data="getCustomPageData(section)" :chantier="chantier" />
      </template>

      <!-- Pied de page -->
      <!-- <footer class="mt-8 border-t-2 border-gray-200 pt-4">
        <div class="flex justify-between text-xs text-gray-400">
          <span>Document généré par H00</span>
          <span>{{ chantier.compte }} - {{ chantier.name }}</span>
        </div>
      </footer> -->
    </div>
  </div>
</template>

<style>
@media print {
  @page {
    size: A4 landscape;
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
