<script setup>
definePageMeta({
  requiresAuth: true,
  requiredRole: 'admin' // Admin ou superadmin
})
useHead({
  title: 'H00 - Paramètres',
  description: "Paramètres de l'application"
})

const route = useRoute()
const router = useRouter()
const { isSuperAdmin } = useLevelUser()
const { getAllUsers, users } = useUsers()
const { METIERS, currentUserMetier } = useMetier()

// Nombre d'utilisateurs, en pastille dans la barre latérale
onMounted(async () => {
  await getAllUsers()
})

// ============================================
// SECTIONS
// ============================================
// Rangées par groupe dans la barre latérale ; `superAdmin` : réservée aux super administrateurs ;
// `parMetier` : contenu propre à chaque métier (Voie, SE/SM, Caténaire), choisi dans le bandeau.
const SECTIONS = [
  {
    id: 'identite',
    groupe: 'Application',
    label: 'Identité',
    icon: 'lucide:app-window',
    superAdmin: true,
    description: "Nom de l'infrapôle et logo, affichés dans toute l'application"
  },
  {
    id: 'sites',
    groupe: 'Application',
    label: 'Secteurs',
    icon: 'lucide:map-pin',
    superAdmin: true,
    description: "Secteurs de l'infrapôle : attribution des chantiers et rattachement des utilisateurs"
  },
  {
    id: 'utilisateurs',
    groupe: 'Application',
    label: 'Utilisateurs',
    icon: 'lucide:users',
    description: "Comptes, profils, secteurs et droits d'accès"
  },
  {
    id: 'chantiers',
    groupe: 'Chantiers',
    label: 'Chantiers',
    icon: 'lucide:building-2',
    description: 'État des chantiers : passage au RLT, clôture et suppression'
  },
  {
    id: 'taches',
    groupe: 'Chantiers',
    label: 'Tâches',
    icon: 'lucide:clipboard-list',
    superAdmin: true,
    description: 'Tâches H00 : délais, date de référence et profils concernés'
  },
  {
    id: 'categories',
    groupe: 'Chantiers',
    label: 'Catégories de tâches',
    icon: 'lucide:folder-tree',
    superAdmin: true,
    description: 'Catégories qui organisent et filtrent les tâches'
  },
  {
    id: 'imprimantes',
    groupe: 'Logistique',
    label: 'Imprimantes',
    icon: 'lucide:printer',
    description: 'Inventaire des imprimantes, en achat ou en location'
  },
  {
    id: 'boxes',
    groupe: 'Logistique',
    label: 'Box réseau',
    icon: 'lucide:router',
    description: 'Inventaire des box réseau et WiFi'
  },
  {
    id: 'catalogue',
    groupe: 'Matières',
    label: 'Catalogue articles',
    icon: 'lucide:library',
    superAdmin: true,
    description: 'Base commune des articles symbolisés et des contrats cadres'
  },
  {
    id: 'ensembles',
    groupe: 'Matières',
    label: 'Ensembles',
    icon: 'lucide:boxes',
    superAdmin: true,
    parMetier: true,
    description: "Gabarits d'articles réutilisables sur tous les chantiers"
  },
  {
    id: 'assistants',
    groupe: 'Matières',
    label: 'Logiques métier',
    icon: 'lucide:workflow',
    superAdmin: true,
    parMetier: true,
    description: 'Questions qui guident la commande de matière'
  }
]

const sectionsVisibles = computed(() => SECTIONS.filter((s) => !s.superAdmin || isSuperAdmin.value))
const groupes = computed(() => {
  const liste = []
  for (const s of sectionsVisibles.value) {
    const g = liste.find((x) => x.label === s.groupe)
    if (g) g.sections.push(s)
    else liste.push({ label: s.groupe, sections: [s] })
  }
  return liste
})

// Section et métier affichés : dans l'adresse (?section=…&metier=…), pour qu'un rechargement ou un lien
// ramène au même endroit. Une section inconnue ou non autorisée retombe sur la section par défaut.
const sectionId = computed(() => {
  const demandee = route.query.section
  const visibles = sectionsVisibles.value
  if (visibles.some((s) => s.id === demandee)) return demandee
  return visibles.some((s) => s.id === 'taches') ? 'taches' : visibles[0]?.id
})
const section = computed(() => SECTIONS.find((s) => s.id === sectionId.value))

const metier = computed({
  get: () => {
    const demande = route.query.metier
    if (METIERS.some((m) => m.code === demande)) return demande
    return currentUserMetier.value || 'VOIE'
  },
  set: (code) => router.replace({ query: { ...route.query, metier: code } })
})

// Liste des sections, repliée sur mobile (le panneau passe au-dessus du contenu)
const menuOuvert = ref(false)
const choisirSection = (id) => {
  menuOuvert.value = false
  if (id !== sectionId.value) router.replace({ query: { ...route.query, section: id } })
}

const badge = (id) => (id === 'utilisateurs' && users.value?.length ? users.value.length : null)
</script>

<template>
  <AppPageLayout v4>
    <!-- Bandeau : section affichée, et choix du métier pour les ensembles et logiques métier -->
    <template #entete>
      <AppPageHero :illustration="section?.parMetier ? null : 'parametres'">
        <template #default="{ ui }">
          <div class="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
            <div class="min-w-0">
              <p class="text-ink-soft text-xs font-semibold">Paramètres · {{ section?.groupe }}</p>
              <h1 class="font-titre mt-0.5 text-[clamp(1.6rem,1.1rem+1.2vw,2.25rem)] leading-[1.3]" :class="ui.titre">
                {{ section?.label }}
              </h1>
              <p class="mt-1 text-[0.9375rem]" :class="ui.texte">{{ section?.description }}</p>
            </div>
            <div v-if="section?.parMetier" class="flex flex-col gap-1.5">
              <p class="text-ink-soft text-xs font-semibold">Métier</p>
              <AppMetierTabs v-model="metier" v4 class="w-full sm:w-[23rem]" />
            </div>
          </div>
        </template>
      </AppPageHero>
    </template>

    <!-- ============ Barre latérale : sections par groupe ============ -->
    <template #sidebar>
      <div class="pb-6 lg:pt-2">
        <!-- Mobile : la section affichée, qui déplie la liste -->
        <button
          type="button"
          class="surface-card flex w-full cursor-pointer items-center gap-3 rounded-lg px-3.5 py-2.5 text-left lg:hidden"
          :aria-expanded="menuOuvert"
          aria-controls="parametres-sections"
          @click="menuOuvert = !menuOuvert">
          <Icon :name="section?.icon" size="18" class="text-magenta-600 dark:text-magenta-300 shrink-0" />
          <span class="text-ink min-w-0 flex-1 truncate text-sm font-semibold">{{ section?.label }}</span>
          <span class="text-ink-soft text-xs">Changer</span>
          <Icon
            name="lucide:chevron-down"
            size="16"
            class="text-slate-400 transition-transform"
            :class="{ 'rotate-180': menuOuvert }" />
        </button>

        <nav
          id="parametres-sections"
          class="flex flex-col gap-6 max-lg:pt-4"
          :class="{ 'max-lg:hidden': !menuOuvert }"
          aria-label="Sections des paramètres">
          <!-- Groupe : titre, puis ses sections en retrait le long d'un trait vertical (utils/panneau.js) -->
          <div v-for="g in groupes" :key="g.label" class="flex flex-col gap-1.5">
            <p class="px-3" :class="PANNEAU_TITRE">{{ g.label }}</p>
            <div :class="PANNEAU_GROUPE">
              <button
                v-for="s in g.sections"
                :key="s.id"
                type="button"
                class="py-2"
                :class="[PANNEAU_ENTREE, panneauItem(sectionId === s.id)]"
                :aria-current="sectionId === s.id ? 'page' : undefined"
                @click="choisirSection(s.id)">
                <Icon :name="s.icon" size="18" class="shrink-0" :class="panneauIcone(sectionId === s.id)" />
                <span class="min-w-0 flex-1 truncate text-sm font-medium">{{ s.label }}</span>
                <span
                  v-if="badge(s.id)"
                  class="inline-flex h-5.5 min-w-6.5 shrink-0 items-center justify-center rounded-full px-1.5 text-xs font-bold"
                  :class="panneauBadge(sectionId === s.id)">
                  {{ badge(s.id) }}
                </span>
              </button>
            </div>
          </div>
        </nav>
      </div>
    </template>

    <!-- ============ Contenu : la section choisie ============ -->
    <template #default>
      <ParametresApplication v-if="sectionId === 'identite'" />
      <ParametresSites v-else-if="sectionId === 'sites'" />
      <ParametresUtilisateurs v-else-if="sectionId === 'utilisateurs'" />
      <ParametresChantiers v-else-if="sectionId === 'chantiers'" />
      <ParametresTaches v-else-if="sectionId === 'taches'" />
      <ParametresCategories v-else-if="sectionId === 'categories'" />
      <ParametresImprimantes v-else-if="sectionId === 'imprimantes'" />
      <ParametresBox v-else-if="sectionId === 'boxes'" />
      <ParametresCatalogue v-else-if="sectionId === 'catalogue'" />
      <ParametresEnsembles v-else-if="sectionId === 'ensembles'" :metier="metier" />
      <ParametresAssistants v-else-if="sectionId === 'assistants'" :metier="metier" />
    </template>
  </AppPageLayout>
</template>
