<script setup>
definePageMeta({
  requiresAuth: true,
  requiredRole: '',
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

// Labels d'état
const getEtatLabel = (etat) => {
  switch (etat) {
    case 2:
      return 'Pré-op'
    case 1:
      return 'Externe'
    case 0:
      return 'RLT'
    case -1:
      return 'Terminé'
    default:
      return 'Inconnu'
  }
}

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
    const commentaireTypes = ['generalites', 'ses', 'voie', 'logistique', 'terrain']
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
      <div class="mb-6 flex gap-3 print:hidden">
        <button
          @click="$router.back()"
          class="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200">
          <Icon name="lucide:arrow-left" size="18" />
          Retour
        </button>
        <button
          @click="window.print()"
          class="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700">
          <Icon name="lucide:printer" size="18" />
          Imprimer
        </button>
      </div>

      <!-- En-tête -->
      <header class="mb-8 border-b-2 border-gray-200 pb-6">
        <div class="mb-4 flex items-center justify-between">
          <span
            class="bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-2xl font-bold text-transparent print:text-blue-600">
            H00
          </span>
          <span class="text-xs text-gray-400">Imprimé le {{ printDate }}</span>
        </div>
        <div class="text-center">
          <h1 class="text-2xl font-bold text-gray-900">{{ chantier.compte }}</h1>
          <h2 class="mt-1 text-lg font-medium text-gray-600">{{ chantier.name }}</h2>
          <span
            class="mt-3 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold tracking-wide text-blue-700 uppercase print:bg-blue-50">
            {{ getEtatLabel(chantier.etat) }}
          </span>
        </div>
      </header>

      <!-- Section 1 : Informations Générales -->
      <section class="mb-8">
        <div class="mb-4 flex items-center gap-3 border-b border-gray-100 pb-2">
          <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600 print:bg-blue-50">
            <Icon name="lucide:info" size="18" />
          </div>
          <h3 class="text-lg font-bold text-gray-900">Informations Générales</h3>
        </div>

        <!-- Timeline visuelle des phases -->
        <div class="mb-6 rounded-xl border border-gray-200 bg-linear-to-r from-slate-50 to-gray-50 p-4 print:bg-white">
          <div class="mb-4 flex items-center gap-2">
            <Icon name="lucide:calendar-range" size="16" class="text-blue-600" />
            <span class="text-xs font-bold tracking-wide text-blue-700 uppercase">Planning du chantier</span>
          </div>

          <!-- Grille des phases -->
          <div class="space-y-3">
            <!-- Phases Préparation (multiples) -->
            <div v-if="chantier.date_prepa?.length > 0" class="flex items-start gap-3">
              <div class="flex w-28 shrink-0 items-center gap-2 pt-2">
                <div class="h-4 w-4 rounded-full bg-linear-to-br from-indigo-500 to-indigo-600 shadow-sm"></div>
                <span class="text-xs font-bold text-indigo-700 uppercase">Préparation</span>
              </div>
              <div
                class="flex-1 rounded-lg border-2 border-indigo-200 bg-linear-to-r from-indigo-50 to-indigo-100/50 px-4 py-2 print:bg-indigo-50">
                <div class="flex flex-wrap gap-3">
                  <div
                    v-for="(periode, index) in chantier.date_prepa"
                    :key="'prepa-' + index"
                    class="flex items-center gap-2 rounded-lg border border-indigo-300 bg-white px-3 py-1.5 shadow-sm print:bg-indigo-50/50">
                    <div class="text-center">
                      <p class="text-sm font-bold text-indigo-800">{{ getWeekNumber(periode.date_start) }}</p>
                      <p class="text-[9px] text-indigo-500">{{ formatDateShort(periode.date_start) }}</p>
                    </div>
                    <Icon name="lucide:arrow-right" size="14" class="text-indigo-400" />
                    <div class="text-center">
                      <p class="text-sm font-bold text-indigo-800">{{ getWeekNumber(periode.date_end) }}</p>
                      <p class="text-[9px] text-indigo-500">{{ formatDateShort(periode.date_end) }}</p>
                    </div>
                  </div>
                </div>
                <p class="mt-2 text-[10px] font-medium text-indigo-600">
                  {{ chantier.date_prepa.length }} période{{ chantier.date_prepa.length > 1 ? 's' : '' }} de préparation
                </p>
              </div>
            </div>

            <!-- Phases Réalisation (multiples) -->
            <div v-if="chantier.date_rea?.length > 0" class="flex items-start gap-3">
              <div class="flex w-28 shrink-0 items-center gap-2 pt-2">
                <div class="h-4 w-4 rounded-full bg-linear-to-br from-emerald-500 to-emerald-600 shadow-sm"></div>
                <span class="text-xs font-bold text-emerald-700 uppercase">Réalisation</span>
              </div>
              <div
                class="flex-1 rounded-lg border-2 border-emerald-200 bg-linear-to-r from-emerald-50 to-emerald-100/50 px-4 py-2 print:bg-emerald-50">
                <div class="flex flex-wrap gap-3">
                  <div
                    v-for="(periode, index) in chantier.date_rea"
                    :key="'rea-' + index"
                    class="flex items-center gap-2 rounded-lg border border-emerald-300 bg-white px-3 py-1.5 shadow-sm print:bg-emerald-50/50">
                    <div class="text-center">
                      <p class="text-sm font-bold text-emerald-800">{{ getWeekNumber(periode.date_start) }}</p>
                      <p class="text-[9px] text-emerald-500">{{ formatDateShort(periode.date_start) }}</p>
                    </div>
                    <Icon name="lucide:arrow-right" size="14" class="text-emerald-400" />
                    <div class="text-center">
                      <p class="text-sm font-bold text-emerald-800">{{ getWeekNumber(periode.date_end) }}</p>
                      <p class="text-[9px] text-emerald-500">{{ formatDateShort(periode.date_end) }}</p>
                    </div>
                  </div>
                </div>
                <p class="mt-2 text-[10px] font-medium text-emerald-600">
                  {{ chantier.date_rea.length }} période{{ chantier.date_rea.length > 1 ? 's' : '' }} de réalisation
                </p>
              </div>
            </div>

            <!-- Week-ends - Affichage de tous les week-ends -->
            <div v-if="weekends.length > 0" class="flex items-start gap-3">
              <div class="flex w-28 shrink-0 items-center gap-2 pt-2">
                <div class="h-4 w-4 rounded-full bg-linear-to-br from-amber-500 to-orange-500 shadow-sm"></div>
                <span class="text-xs font-bold text-amber-700 uppercase">Week-ends</span>
              </div>
              <div
                class="flex-1 rounded-lg border-2 border-amber-200 bg-linear-to-r from-amber-50 to-orange-50/50 px-4 py-2 print:bg-amber-50">
                <div class="flex flex-wrap gap-2">
                  <div
                    v-for="we in weekends"
                    :key="we.id"
                    class="flex items-center gap-2 rounded-lg border border-amber-300 bg-white px-3 py-1.5 shadow-sm print:bg-amber-50">
                    <div class="text-center">
                      <p class="text-sm font-bold text-amber-700">S{{ we.semaine_debut }}/{{ we.annee_debut }}</p>
                    </div>
                    <Icon name="lucide:arrow-right" size="12" class="text-amber-400" />
                    <div class="text-center">
                      <p class="text-sm font-bold text-amber-700">S{{ we.semaine_fin }}/{{ we.annee_fin }}</p>
                    </div>
                  </div>
                </div>
                <p class="mt-2 text-[10px] font-medium text-amber-600">
                  {{ weekends.length }} week-end{{ weekends.length > 1 ? 's' : '' }} programmé{{
                    weekends.length > 1 ? 's' : ''
                  }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Infos principales en grille -->
        <div class="grid grid-cols-3 gap-3 print:grid-cols-3">
          <div class="rounded-xl border-2 border-slate-200 bg-white p-3 text-center shadow-sm print:shadow-none">
            <Icon name="lucide:train-track" size="20" class="mx-auto mb-1 text-slate-500" />
            <span class="text-[10px] font-semibold tracking-wide text-slate-400 uppercase">Ligne</span>
            <p class="mt-1 text-lg font-bold text-slate-800">{{ chantier.ligne || '-' }}</p>
          </div>
          <div class="rounded-xl border-2 border-slate-200 bg-white p-3 text-center shadow-sm print:shadow-none">
            <Icon name="lucide:flask-conical" size="20" class="mx-auto mb-1 text-slate-500" />
            <span class="text-[10px] font-semibold tracking-wide text-slate-400 uppercase">Essais</span>
            <p class="mt-1 text-lg font-bold text-slate-800">
              {{
                chantier.type_essais === 'simple' ? 'Simple' : chantier.type_essais === 'complexe' ? 'Complexe' : '-'
              }}
            </p>
          </div>
          <div class="rounded-xl border-2 border-slate-200 bg-white p-3 text-center shadow-sm print:shadow-none">
            <Icon name="lucide:scale" size="20" class="mx-auto mb-1 text-slate-500" />
            <span class="text-[10px] font-semibold tracking-wide text-slate-400 uppercase">Décret</span>
            <p class="mt-1 text-lg font-bold text-slate-800">{{ chantier.decret || '-' }}</p>
          </div>
        </div>

        <!-- Comptes -->
        <div class="mt-4">
          <p class="mb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase">Comptes</p>
          <div class="grid grid-cols-3 gap-3">
            <div class="rounded-lg border border-gray-100 bg-gray-50 p-2 print:bg-white">
              <span class="text-[10px] text-gray-500">MOE</span>
              <p class="font-mono text-sm font-semibold text-gray-900">{{ chantier.compte_moe || '-' }}</p>
            </div>
            <div class="rounded-lg border border-gray-100 bg-gray-50 p-2 print:bg-white">
              <span class="text-[10px] text-gray-500">SLG</span>
              <p class="font-mono text-sm font-semibold text-gray-900">{{ chantier.compte_slg || '-' }}</p>
            </div>
            <div class="rounded-lg border border-gray-100 bg-gray-50 p-2 print:bg-white">
              <span class="text-[10px] text-gray-500">Matière</span>
              <p class="font-mono text-sm font-semibold text-gray-900">{{ chantier.compte_matieres || '-' }}</p>
            </div>
          </div>
        </div>

        <!-- Autre -->
        <div v-if="chantier.autre" class="mt-4">
          <p class="mb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase">Informations complémentaires</p>
          <p
            class="rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm whitespace-pre-wrap text-gray-700 print:bg-white">
            {{ chantier.autre }}
          </p>
        </div>
      </section>

      <!-- Section 2 : Contacts -->
      <section v-if="contacts" class="mb-8 break-inside-avoid">
        <div class="mb-4 flex items-center gap-3 border-b border-gray-100 pb-2">
          <div
            class="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 print:bg-emerald-50">
            <Icon name="lucide:users" size="18" />
          </div>
          <h3 class="text-lg font-bold text-gray-900">Contacts</h3>
        </div>

        <!-- Généralités -->
        <div
          v-if="
            contacts.generalites &&
            (contacts.generalites.chef_projet_nom || contacts.generalites.coordinateur_securite_nom)
          "
          class="mb-4">
          <p class="mb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase">Généralités</p>
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="border-b border-gray-200 bg-blue-50 print:bg-blue-50/50">
                <th class="px-2 py-1.5 font-semibold text-blue-700">Fonction</th>
                <th class="px-2 py-1.5 font-semibold text-blue-700">Nom</th>
                <th class="px-2 py-1.5 font-semibold text-blue-700">Email</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="contacts.generalites.chef_projet_nom" class="border-b border-gray-100">
                <td class="px-2 py-1.5 font-medium text-blue-600">Chef de projet</td>
                <td class="px-2 py-1.5 text-gray-900">{{ contacts.generalites.chef_projet_nom }}</td>
                <td class="px-2 py-1.5 text-gray-500">{{ contacts.generalites.chef_projet_email || '-' }}</td>
              </tr>
              <tr v-if="contacts.generalites.coordinateur_securite_nom" class="border-b border-gray-100">
                <td class="px-2 py-1.5 font-medium text-blue-600">Coordinateur sécurité</td>
                <td class="px-2 py-1.5 text-gray-900">{{ contacts.generalites.coordinateur_securite_nom }}</td>
                <td class="px-2 py-1.5 text-gray-500">{{ contacts.generalites.coordinateur_securite_email || '-' }}</td>
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
          <p class="mb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase">Équipe Travaux</p>
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="border-b border-gray-200 bg-emerald-50 print:bg-emerald-50/50">
                <th class="px-2 py-1.5 font-semibold text-emerald-700">Fonction</th>
                <th class="px-2 py-1.5 font-semibold text-emerald-700">Nom</th>
                <th class="px-2 py-1.5 font-semibold text-emerald-700">Email</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="getUserName(contacts.travaux.rlt_voie_principale)" class="border-b border-gray-100">
                <td class="px-2 py-1.5 font-medium text-emerald-600">RLT Voie</td>
                <td class="px-2 py-1.5 text-gray-900">{{ getUserName(contacts.travaux.rlt_voie_principale) }}</td>
                <td class="px-2 py-1.5 text-gray-500">
                  {{ getUserEmail(contacts.travaux.rlt_voie_principale) || '-' }}
                </td>
              </tr>
              <tr v-if="getUserNames(contacts.travaux.rlt_voie_secondaire)" class="border-b border-gray-100">
                <td class="px-2 py-1.5 font-medium text-emerald-500">RLT Voie (sec.)</td>
                <td class="px-2 py-1.5 text-gray-900">{{ getUserNames(contacts.travaux.rlt_voie_secondaire) }}</td>
                <td class="px-2 py-1.5 text-gray-500">-</td>
              </tr>
              <tr v-if="getUserName(contacts.travaux.rlt_ses_principale)" class="border-b border-gray-100">
                <td class="px-2 py-1.5 font-medium text-emerald-600">RLT SES</td>
                <td class="px-2 py-1.5 text-gray-900">{{ getUserName(contacts.travaux.rlt_ses_principale) }}</td>
                <td class="px-2 py-1.5 text-gray-500">
                  {{ getUserEmail(contacts.travaux.rlt_ses_principale) || '-' }}
                </td>
              </tr>
              <tr v-if="getUserNames(contacts.travaux.rlt_ses_secondaire)" class="border-b border-gray-100">
                <td class="px-2 py-1.5 font-medium text-emerald-500">RLT SES (sec.)</td>
                <td class="px-2 py-1.5 text-gray-900">{{ getUserNames(contacts.travaux.rlt_ses_secondaire) }}</td>
                <td class="px-2 py-1.5 text-gray-500">-</td>
              </tr>
              <tr v-if="getUserName(contacts.travaux.rlt_cat_principale)" class="border-b border-gray-100">
                <td class="px-2 py-1.5 font-medium text-emerald-600">RLT CAT</td>
                <td class="px-2 py-1.5 text-gray-900">{{ getUserName(contacts.travaux.rlt_cat_principale) }}</td>
                <td class="px-2 py-1.5 text-gray-500">
                  {{ getUserEmail(contacts.travaux.rlt_cat_principale) || '-' }}
                </td>
              </tr>
              <tr v-if="getUserNames(contacts.travaux.rlt_cat_secondaire)" class="border-b border-gray-100">
                <td class="px-2 py-1.5 font-medium text-emerald-500">RLT CAT (sec.)</td>
                <td class="px-2 py-1.5 text-gray-900">{{ getUserNames(contacts.travaux.rlt_cat_secondaire) }}</td>
                <td class="px-2 py-1.5 text-gray-500">-</td>
              </tr>
              <tr v-if="getUserNames(contacts.travaux.kv_voie)" class="border-b border-gray-100">
                <td class="px-2 py-1.5 font-medium text-blue-600">Contrôleur Voie</td>
                <td class="px-2 py-1.5 text-gray-900">{{ getUserNames(contacts.travaux.kv_voie) }}</td>
                <td class="px-2 py-1.5 text-gray-500">-</td>
              </tr>
              <tr v-if="getUserNames(contacts.travaux.kv_ses)" class="border-b border-gray-100">
                <td class="px-2 py-1.5 font-medium text-blue-600">Contrôleur SES</td>
                <td class="px-2 py-1.5 text-gray-900">{{ getUserNames(contacts.travaux.kv_ses) }}</td>
                <td class="px-2 py-1.5 text-gray-500">-</td>
              </tr>
              <tr v-if="getUserNames(contacts.travaux.kv_cat)" class="border-b border-gray-100">
                <td class="px-2 py-1.5 font-medium text-blue-600">Contrôleur CAT</td>
                <td class="px-2 py-1.5 text-gray-900">{{ getUserNames(contacts.travaux.kv_cat) }}</td>
                <td class="px-2 py-1.5 text-gray-500">-</td>
              </tr>
              <tr v-if="getUserName(contacts.travaux.preop_voie)" class="border-b border-gray-100">
                <td class="px-2 py-1.5 font-medium text-amber-600">Pré-op Voie</td>
                <td class="px-2 py-1.5 text-gray-900">{{ getUserName(contacts.travaux.preop_voie) }}</td>
                <td class="px-2 py-1.5 text-gray-500">{{ getUserEmail(contacts.travaux.preop_voie) || '-' }}</td>
              </tr>
              <tr v-if="getUserName(contacts.travaux.preop_ses)" class="border-b border-gray-100">
                <td class="px-2 py-1.5 font-medium text-amber-600">Pré-op SES</td>
                <td class="px-2 py-1.5 text-gray-900">{{ getUserName(contacts.travaux.preop_ses) }}</td>
                <td class="px-2 py-1.5 text-gray-500">{{ getUserEmail(contacts.travaux.preop_ses) || '-' }}</td>
              </tr>
              <tr v-if="getUserName(contacts.travaux.logistique)" class="border-b border-gray-100">
                <td class="px-2 py-1.5 font-medium text-purple-600">Logistique</td>
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
          <p class="mb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase">Études</p>
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="border-b border-gray-200 bg-indigo-50 print:bg-indigo-50/50">
                <th class="px-2 py-1.5 font-semibold text-indigo-700">Fonction</th>
                <th class="px-2 py-1.5 font-semibold text-indigo-700">Nom</th>
                <th class="px-2 py-1.5 font-semibold text-indigo-700">Email</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="contacts.etudes.plan_technique_nom" class="border-b border-gray-100">
                <td class="px-2 py-1.5 font-medium text-indigo-600">Plan technique</td>
                <td class="px-2 py-1.5 text-gray-900">{{ contacts.etudes.plan_technique_nom }}</td>
                <td class="px-2 py-1.5 text-gray-500">{{ contacts.etudes.plan_technique_email || '-' }}</td>
              </tr>
              <tr v-if="contacts.etudes.documents_execution_nom" class="border-b border-gray-100">
                <td class="px-2 py-1.5 font-medium text-indigo-600">Documents d'exécution</td>
                <td class="px-2 py-1.5 text-gray-900">{{ contacts.etudes.documents_execution_nom }}</td>
                <td class="px-2 py-1.5 text-gray-500">{{ contacts.etudes.documents_execution_email || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Entreprises -->
        <div v-if="contacts.entreprises?.length" class="mb-4">
          <p class="mb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase">Entreprises</p>
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="border-b border-gray-200 bg-cyan-50 print:bg-cyan-50/50">
                <th class="px-2 py-1.5 font-semibold text-cyan-700">Métier</th>
                <th class="px-2 py-1.5 font-semibold text-cyan-700">Entreprise</th>
                <th class="px-2 py-1.5 font-semibold text-cyan-700">Responsable</th>
                <th class="px-2 py-1.5 font-semibold text-cyan-700">Email</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="ent in contacts.entreprises" :key="ent.id" class="border-b border-gray-100">
                <td class="px-2 py-1.5 font-medium text-cyan-600">{{ ent.metier || '-' }}</td>
                <td class="px-2 py-1.5 text-gray-900">{{ ent.entreprise || '-' }}</td>
                <td class="px-2 py-1.5 text-gray-900">{{ ent.responsable_nom || '-' }}</td>
                <td class="px-2 py-1.5 text-gray-500">{{ ent.responsable_email || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Autres contacts -->
        <div v-if="contacts.autres?.length">
          <p class="mb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase">Autres contacts</p>
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="border-b border-gray-200 bg-slate-50 print:bg-slate-50/50">
                <th class="px-2 py-1.5 font-semibold text-slate-700">Fonction</th>
                <th class="px-2 py-1.5 font-semibold text-slate-700">Organisme</th>
                <th class="px-2 py-1.5 font-semibold text-slate-700">Responsable</th>
                <th class="px-2 py-1.5 font-semibold text-slate-700">Email</th>
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
          <div
            class="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-600 print:bg-purple-50">
            <Icon name="lucide:git-branch" size="18" />
          </div>
          <h3 class="text-lg font-bold text-gray-900">Timeline</h3>
        </div>

        <div class="relative border-l-2 border-gray-200 pl-4">
          <div v-for="item in sortedTimeline" :key="item.id" class="relative mb-4 last:mb-0">
            <div
              class="absolute top-1 -left-[21px] h-3 w-3 rounded-full border-2 border-white"
              :class="item.type === 'weekend' ? 'bg-orange-500' : 'bg-blue-500'"></div>
            <div class="rounded-lg border border-gray-100 bg-gray-50 p-3 print:bg-white">
              <div class="mb-1 flex items-center gap-2">
                <span
                  class="text-[10px] font-semibold uppercase"
                  :class="item.type === 'weekend' ? 'text-orange-600' : 'text-blue-600'">
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
          <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-100 text-cyan-600 print:bg-cyan-50">
            <Icon name="lucide:graduation-cap" size="18" />
          </div>
          <h3 class="text-lg font-bold text-gray-900">Études</h3>
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
                      'bg-emerald-100 text-emerald-700 print:bg-emerald-50':
                        getDocumentStatus(doc, true).color === 'emerald',
                      'bg-amber-100 text-amber-700 print:bg-amber-50': getDocumentStatus(doc, true).color === 'amber',
                      'bg-red-100 text-red-700 print:bg-red-50': getDocumentStatus(doc, true).color === 'red',
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
                      'bg-emerald-100 text-emerald-700 print:bg-emerald-50': getPtStatus(plan).color === 'emerald',
                      'bg-amber-100 text-amber-700 print:bg-amber-50': getPtStatus(plan).color === 'amber',
                      'bg-red-100 text-red-700 print:bg-red-50': getPtStatus(plan).color === 'red',
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
          <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-600 print:bg-rose-50">
            <Icon name="lucide:message-square" size="18" />
          </div>
          <h3 class="text-lg font-bold text-gray-900">Commentaires</h3>
        </div>

        <div class="space-y-4">
          <div
            v-if="commentaires.generalites?.content"
            class="break-inside-avoid rounded-lg border border-gray-100 bg-gray-50 p-4 print:bg-white">
            <h5 class="mb-2 border-b border-gray-200 pb-1 text-xs font-bold tracking-wide text-indigo-600 uppercase">
              Généralités
            </h5>
            <div class="prose prose-sm max-w-none text-gray-700" v-html="commentaires.generalites.content"></div>
          </div>
          <div
            v-if="commentaires.ses?.content"
            class="break-inside-avoid rounded-lg border border-gray-100 bg-gray-50 p-4 print:bg-white">
            <h5 class="mb-2 border-b border-gray-200 pb-1 text-xs font-bold tracking-wide text-indigo-600 uppercase">
              SES
            </h5>
            <div class="prose prose-sm max-w-none text-gray-700" v-html="commentaires.ses.content"></div>
          </div>
          <div
            v-if="commentaires.voie?.content"
            class="break-inside-avoid rounded-lg border border-gray-100 bg-gray-50 p-4 print:bg-white">
            <h5 class="mb-2 border-b border-gray-200 pb-1 text-xs font-bold tracking-wide text-indigo-600 uppercase">
              Voie
            </h5>
            <div class="prose prose-sm max-w-none text-gray-700" v-html="commentaires.voie.content"></div>
          </div>
          <div
            v-if="commentaires.logistique?.content"
            class="break-inside-avoid rounded-lg border border-gray-100 bg-gray-50 p-4 print:bg-white">
            <h5 class="mb-2 border-b border-gray-200 pb-1 text-xs font-bold tracking-wide text-indigo-600 uppercase">
              Logistique
            </h5>
            <div class="prose prose-sm max-w-none text-gray-700" v-html="commentaires.logistique.content"></div>
          </div>
          <div
            v-if="commentaires.terrain?.content"
            class="break-inside-avoid rounded-lg border border-gray-100 bg-gray-50 p-4 print:bg-white">
            <h5 class="mb-2 border-b border-gray-200 pb-1 text-xs font-bold tracking-wide text-indigo-600 uppercase">
              Terrain
            </h5>
            <div class="prose prose-sm max-w-none text-gray-700" v-html="commentaires.terrain.content"></div>
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
