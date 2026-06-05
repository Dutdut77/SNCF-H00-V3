<script setup>
definePageMeta({
  requiresAuth: true,
  requiredRole: ''
})

const route = useRoute()
const { getChantierById } = useChantiers()
const { allH00Taches, getH00ByChantier } = useH00()
const { setLoader } = useLoader()
const { getPages, chantierPages, getPagesAsMenuItems, getPageById } = useChantierPages()
const { isSuperAdmin, isAdmin } = useLevelUser()
const canSeeTournees = computed(() => true)
// Récupérer l'ID du chantier depuis l'URL
const chantierId = computed(() => route.params.id)

// État du chantier
const chantier = ref(null)
const h00 = ref(null)

// État pour la gestion des pages personnalisées
const showPageManager = ref(false)
const editingPage = ref(null)

// État pour le système d'impression
const showPrintSelector = ref(false)

// Menu de navigation latérale (items de base)
const selectedMenu = ref('generalites')
const baseMenuItems = [
  {
    value: 'generalites',
    label: 'Généralités',
    icon: 'lucide:info'
  },
  {
    value: 'contact',
    label: 'Contact',
    icon: 'lucide:contact',
    children: [
      { value: 'contacts-generalites', label: 'Généralités' },
      { value: 'contacts-travaux', label: 'Travaux' },
      { value: 'contacts-entreprises', label: 'Entreprises' },
      { value: 'contacts-etudes', label: 'Etudes' },
      { value: 'contacts-autres', label: 'Autres' }
    ]
  },
  {
    value: 'timeline',
    label: 'Timeline',
    icon: 'lucide:git-branch'
  },
  {
    value: 'logistique',
    label: 'Logistique',
    icon: 'i-lucide-truck',
    children: [
      { value: 'logistique-base-vie', label: 'Base vie' },
      { value: 'logistique-imprimante', label: 'Imprimante' },
      { value: 'logistique-reseau', label: 'Réseau' },
      { value: 'logistique-radio', label: 'Radio' }
    ]
  },
  {
    value: 'etudes',
    label: 'Études',
    icon: 'lucide:graduation-cap',
    children: [
      { value: 'etudes-documents', label: "Documents d'exécution" },
      { value: 'etudes-plans', label: 'Plans techniques' }
    ]
  },

  {
    value: 'commentaires',
    label: 'Commentaires',
    icon: 'lucide:message-square-more',
    children: [
      { value: 'commentaires-generalites', label: 'Généralités' },
      { value: 'commentaires-ses', label: 'SES' },
      { value: 'commentaires-voie', label: 'Voie' },
      { value: 'commentaires-logistique', label: 'Logistique' },
      { value: 'commentaires-terrain', label: 'Terrain' }
    ]
  },
  {
    value: 'photos',
    label: 'Photos',
    icon: 'lucide:image'
  },
  {
    value: 'taches',
    label: 'Tâches',
    icon: 'lucide:clipboard-check',
    badge: computed(() => allH00Taches.value?.length || 0)
  },
  {
    value: 'outils',
    label: 'Outils',
    icon: 'lucide:wrench',
    children: [
      { value: 'outils-vieilles-matieres', label: 'Vieilles matières' },
      { value: 'outils-commandes-matieres', label: 'Commandes matières' }
    ]
  }
]

// Menu complet avec pages personnalisées
const menuItems = computed(() => {
  const customPages = getPagesAsMenuItems.value
  const items = [...baseMenuItems]

  // Ajouter l'onglet Tournées pour les admins uniquement
  if (canSeeTournees.value) {
    items.push({ value: 'tournees', label: 'Tournées', icon: 'lucide:map-pin' })
  }

  if (customPages.length === 0) return items

  // Ajouter les pages personnalisées après "Photos" et avant "Tâches"
  const tachesIndex = items.findIndex((i) => i.value === 'taches')

  // Créer un groupe "Pages" si on a des pages personnalisées
  const customPagesGroup = {
    value: 'custom-pages',
    label: 'Pages',
    icon: 'lucide:files',
    children: customPages
  }

  if (tachesIndex !== -1) {
    items.splice(tachesIndex, 0, customPagesGroup)
  } else {
    items.push(customPagesGroup)
  }

  return items
})

// Détecte si on affiche une page personnalisée
const isCustomPageSelected = computed(() => {
  return selectedMenu.value?.startsWith('custom-page-')
})

// Récupère la page personnalisée sélectionnée
const selectedCustomPage = computed(() => {
  if (!isCustomPageSelected.value) return null
  const pageId = selectedMenu.value.replace('custom-page-', '')
  return getPageById(pageId)
})

// Ouvrir le modal pour créer une page
const openCreatePage = () => {
  editingPage.value = null
  showPageManager.value = true
}

// Ouvrir le modal pour éditer une page
const openEditPage = (page) => {
  editingPage.value = page
  showPageManager.value = true
}

// Callback après sauvegarde d'une page
const onPageSaved = (page) => {
  // Si c'est une nouvelle page, la sélectionner
  if (!editingPage.value) {
    selectedMenu.value = `custom-page-${page.id}`
  }
}

// Callback après suppression d'une page
const onPageDeleted = () => {
  // Retourner aux généralités
  selectedMenu.value = 'generalites'
}

// Titre dynamique de la page
useHead({
  title: computed(() => (chantier.value ? `H00 - ${chantier.value.compte} - ${chantier.value.name}` : 'H00 - Chantier'))
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

// Couleurs d'état
const getEtatClasses = (etat) => {
  switch (etat) {
    case 2:
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
    case 1:
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    case 0:
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
    case -1:
      return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
    default:
      return 'bg-gray-100 text-gray-500'
  }
}

// Charger le chantier au montage
onMounted(async () => {
  setLoader(true)
  try {
    chantier.value = await getChantierById(chantierId.value)
    h00.value = await getH00ByChantier(chantierId.value)
    // Charger les pages personnalisées
    await getPages(chantierId.value)
  } finally {
    setLoader(false)
  }
})

// Recharger si l'ID change
watch(chantierId, async (newId) => {
  if (newId) {
    setLoader(true)
    try {
      chantier.value = await getChantierById(newId)
      h00.value = await getH00ByChantier(newId)
      // Recharger les pages personnalisées
      await getPages(newId)
    } finally {
      setLoader(false)
    }
  }
})

// Ouvrir le sélecteur d'impression
const openPrintSelector = () => {
  showPrintSelector.value = true
}
</script>

<template>
  <AppPageLayout>
    <!-- Header fixe de la sidebar -->
    <template #sidebar-header>
      <div class="p-4 lg:mb-4 dark:border-gray-700">
        <div v-if="chantier" class="flex flex-col items-center gap-2 lg:items-start">
          <div class="relative flex w-full items-center justify-center gap-2 lg:justify-start">
            <h2 class="text-xl leading-tight font-semibold text-gray-700 dark:text-white">
              {{ chantier.compte || 'Sans intitulé' }}
            </h2>
            <div
              class="absolute top-0 right-0 rounded-full px-2 py-0.5 text-xs font-medium"
              :class="getEtatClasses(chantier.etat)">
              {{ getEtatLabel(chantier.etat) }}
            </div>
          </div>

          <h2 class="-mt-2 text-base leading-tight font-semibold text-gray-700 dark:text-gray-100">
            {{ chantier.name || 'Sans intitulé' }}
          </h2>
        </div>
        <div v-else class="space-y-2">
          <div class="h-5 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
          <div class="h-6 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
          <div class="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
        </div>
      </div>
    </template>

    <!-- Navigation scrollable -->
    <template #sidebar>
      <AppLeftNavBar v-model="selectedMenu" :items="menuItems" title="" />
    </template>

    <!-- Footer de la sidebar avec boutons -->
    <template #sidebar-footer>
      <div v-if="chantier" class="hidden flex-col gap-3 border-gray-200 pt-4 lg:flex lg:border-t dark:border-gray-700">
        <!-- Bouton ajouter une page -->
        <button
          v-if="isSuperAdmin"
          type="button"
          class="border-primary-300 text-primary-600 hover:border-primary-400 hover:bg-primary-50 dark:border-primary-700 dark:text-primary-400 dark:hover:border-primary-600 dark:hover:bg-primary-900/20 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-2.5 text-sm font-medium transition"
          @click="openCreatePage">
          <Icon name="lucide:plus" size="18" />
          Ajouter une page
        </button>

        <!-- Bouton imprimer -->
        <AppButtonValidated theme="secondary" type="button" @click="openPrintSelector">
          <template #default>
            <span class="flex items-center justify-center gap-2">
              <Icon name="lucide:printer" size="18" />
              Impression
            </span>
          </template>
        </AppButtonValidated>
      </div>
    </template>

    <!-- Contenu principal -->
    <div v-if="chantier" class="h-full min-h-full w-full">
      <!-- Généralités -->
      <ChantierGeneralites v-if="selectedMenu === 'generalites'" :chantier="chantier" />

      <!-- Contact -->
      <ChantierContactsGeneralites v-else-if="selectedMenu === 'contacts-generalites'" :chantier="chantier" />
      <ChantierContactsTravaux v-else-if="selectedMenu === 'contacts-travaux'" :chantier="chantier" />
      <ChantierContactsEntreprises v-else-if="selectedMenu === 'contacts-entreprises'" :chantier="chantier" />
      <ChantierContactsEtudes v-else-if="selectedMenu === 'contacts-etudes'" :chantier="chantier" />
      <ChantierContactsAutres v-else-if="selectedMenu === 'contacts-autres'" :chantier="chantier" />

      <!-- Timeline -->
      <ChantierTimeline v-else-if="selectedMenu === 'timeline'" :chantier="chantier" />

      <!-- Études - Documents d'exécution -->
      <ChantierEtudesDocumentsExecution v-else-if="selectedMenu === 'etudes-documents'" :chantier="chantier" />
      <ChantierEtudesPlansTechniques v-else-if="selectedMenu === 'etudes-plans'" :chantier="chantier" />

      <!-- Logistique -->
      <ChantierLogistiqueBaseVie v-else-if="selectedMenu === 'logistique-base-vie'" :chantier="chantier" />
      <ChantierLogistiqueImprimante v-else-if="selectedMenu === 'logistique-imprimante'" :chantier="chantier" />
      <ChantierLogistiqueReseau v-else-if="selectedMenu === 'logistique-reseau'" :chantier="chantier" />
      <ChantierLogistiqueRadio v-else-if="selectedMenu === 'logistique-radio'" :chantier="chantier" />

      <!-- Commentaires -->
      <ChantierCommentairesGeneralites v-else-if="selectedMenu === 'commentaires-generalites'" :chantier="chantier" />
      <ChantierCommentairesSes v-else-if="selectedMenu === 'commentaires-ses'" :chantier="chantier" />
      <ChantierCommentairesVoie v-else-if="selectedMenu === 'commentaires-voie'" :chantier="chantier" />
      <ChantierCommentairesLogistique v-else-if="selectedMenu === 'commentaires-logistique'" :chantier="chantier" />
      <ChantierCommentairesTerrain v-else-if="selectedMenu === 'commentaires-terrain'" :chantier="chantier" />

      <!-- Photos -->
      <ChantierPhotos v-else-if="selectedMenu === 'photos'" :chantier="chantier" />

      <!-- Tâches -->
      <ChantierTaches v-else-if="selectedMenu === 'taches'" :chantier="chantier" :taches="allH00Taches" />

      <!-- Tournées (admins uniquement) -->
      <ChantierTournees v-else-if="selectedMenu === 'tournees'" :chantier="chantier" />

      <!-- Outils -->
      <ChantierVieillesMatires v-else-if="selectedMenu === 'outils-vieilles-matieres'" :chantier="chantier" />
      <ChantierCommandesMatieres v-else-if="selectedMenu === 'outils-commandes-matieres'" :chantier="chantier" />

      <!-- Pages personnalisées -->
      <ChantierCustomPagesPageRenderer
        v-else-if="isCustomPageSelected && selectedCustomPage"
        :page="selectedCustomPage"
        :chantier="chantier"
        :editable="true"
        @edit="openEditPage"
        @delete="
          (page) => {
            editingPage = page
            showPageManager = true
          }
        " />
    </div>

    <!-- État de chargement / Erreur -->
    <div v-else class="flex flex-col items-center justify-center py-24 text-gray-400 dark:text-gray-500">
      <Icon name="lucide:hard-hat" size="64" class="mb-4 opacity-50" />
      <p class="text-lg font-medium">Chargement du chantier...</p>
    </div>

    <!-- Modal de gestion des pages personnalisées -->
    <ChantierCustomPagesPageManager
      :is-open="showPageManager"
      :chantier-id="chantierId"
      :editing-page="editingPage"
      @close="showPageManager = false"
      @saved="onPageSaved"
      @deleted="onPageDeleted" />

    <!-- Modal de sélection des sections à imprimer -->
    <ChantierPrintSelector
      v-if="chantier"
      v-model:is-open="showPrintSelector"
      :chantier-id="chantierId"
      :custom-pages="chantierPages"
      @close="showPrintSelector = false" />
  </AppPageLayout>
</template>
