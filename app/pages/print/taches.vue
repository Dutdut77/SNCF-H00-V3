<script setup>
definePageMeta({
  requiresAuth: true,
  requiredRole: '',
  layout: false
})

const route = useRoute()
const user = useAuthUser()

// Récupérer les tâches depuis le state ou localStorage
const taches = ref([])
const isLoading = ref(true)

// Titre de la page
useHead({
  title: 'Impression - Liste des tâches'
})

// Formater une date en "Déc 2025"
const formatDateMonthYear = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  const monthYear = date.toLocaleDateString('fr-FR', {
    month: 'short',
    year: 'numeric'
  })
  return monthYear.charAt(0).toUpperCase() + monthYear.slice(1)
}

// Fonction pour déterminer le statut de réalisation
const getRealisationStatus = (tache) => {
  const status = tache.status
  const prevision = tache.prevision

  if (status === 2) {
    return { type: 'fait', label: 'Fait', color: '#10b981' }
  }
  if (status === 1) {
    return { type: 'en_cours', label: 'En cours', color: '#f59e0b' }
  }
  if (status === 0 && prevision) {
    const now = new Date()
    const previsionDate = new Date(prevision)
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const previsionMonth = new Date(previsionDate.getFullYear(), previsionDate.getMonth(), 1)
    if (previsionMonth <= currentMonth) {
      return { type: 'a_faire', label: 'À faire', color: '#ef4444' }
    }
  }
  return { type: 'planifie', label: 'Planifié', color: '#6b7280' }
}

// Grouper les tâches par chantier
const tachesGroupedByChantier = computed(() => {
  const grouped = {}
  taches.value.forEach((tache) => {
    const chantierId = tache.chantier_id
    const chantierKey = `${tache.chantiers?.compte || 'N/A'} - ${tache.chantiers?.name || 'Sans nom'}`
    if (!grouped[chantierKey]) {
      grouped[chantierKey] = {
        chantier: tache.chantiers,
        taches: []
      }
    }
    grouped[chantierKey].taches.push(tache)
  })
  return grouped
})

// Charger les données depuis sessionStorage
const loadData = async () => {
  isLoading.value = true
  try {
    const storedTaches = sessionStorage.getItem('printTaches')
    if (storedTaches) {
      taches.value = JSON.parse(storedTaches)
    }
  } catch (error) {
    console.error('Erreur lors du chargement:', error)
  } finally {
    isLoading.value = false
  }
}

// Lancer l'impression automatique
const triggerPrint = () => {
  setTimeout(() => {
    window.print()
  }, 600)
}

// Lancer l'impression manuellement (bouton)
const handlePrint = () => {
  window.print()
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

// Nom de l'utilisateur
const userName = computed(() => {
  if (!user.value) return 'Utilisateur'
  return user.value.prenom && user.value.nom ? `${user.value.prenom} ${user.value.nom}` : user.value.email
})
</script>

<template>
  <div class="print-page min-h-screen bg-gray-100 print:bg-white">
    <!-- Écran de chargement -->
    <div v-if="isLoading" class="flex min-h-screen flex-col items-center justify-center gap-4">
      <div class="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-emerald-500"></div>
      <p class="text-gray-600">Préparation du document...</p>
    </div>

    <!-- Contenu imprimable -->
    <div v-else class="mx-auto max-w-4xl bg-white p-8 shadow-lg print:max-w-none print:p-0 print:shadow-none">
      <!-- Boutons (non imprimés) -->
      <div class="mb-6 flex gap-3 print:hidden">
        <button
          @click="handlePrint"
          class="hover:bg- -700 flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition">
          <Icon name="lucide:printer" size="18" />
          Imprimer
        </button>
      </div>

      <!-- En-tête du document -->
      <header class="mb-8 border-b-2 border-emerald-600/80 pb-6">
        <div class="flex items-start justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Liste des Tâches</h1>
            <p class="mt-1 text-lg text-gray-600">{{ userName }}</p>
          </div>
          <div class="text-right">
            <div class="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-2">
              <Icon name="lucide:calendar" size="20" class="text-emerald-600" />
              <span class="font-medium text-emerald-700">{{ printDate }}</span>
            </div>
            <p class="mt-2 text-sm text-gray-500">{{ taches.length }} tâche(s) sélectionnée(s)</p>
          </div>
        </div>
      </header>

      <!-- Message si aucune tâche -->
      <div v-if="taches.length === 0" class="py-12 text-center">
        <Icon name="lucide:clipboard-x" size="48" class="mx-auto mb-4 text-gray-300" />
        <p class="text-lg text-gray-500">Aucune tâche à afficher</p>
        <p class="mt-1 text-sm text-gray-400">Sélectionnez des tâches avant d'imprimer</p>
      </div>

      <!-- Contenu par chantier -->
      <div v-else class="space-y-8">
        <section
          v-for="(group, chantierKey) in tachesGroupedByChantier"
          :key="chantierKey"
          class="page-break-inside-avoid">
          <!-- En-tête du chantier -->
          <div
            class="from-primary-400 to-primary-600 border-primary-400 mb-4 flex items-center gap-3 rounded-lg bg-linear-to-br px-4 py-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
              <Icon name="lucide:building-2" size="20" class="text-white" />
            </div>
            <div>
              <h2 class="text-lg font-bold text-white">{{ group.chantier?.compte || 'N/A' }}</h2>
              <p class="text-sm text-indigo-100">{{ group.chantier?.name || 'Sans nom' }}</p>
            </div>
            <div class="ml-auto rounded-full bg-white/20 px-3 py-1">
              <span class="text-sm font-semibold text-white">{{ group.taches.length }} tâche(s)</span>
            </div>
          </div>

          <!-- Tableau des tâches -->
          <table class="w-full border-collapse">
            <thead>
              <tr class="border-b-2 border-gray-200 bg-gray-50">
                <th class="px-3 py-3 text-left text-xs font-semibold tracking-wider text-gray-600 uppercase">Tâche</th>
                <th class="px-3 py-3 text-center text-xs font-semibold tracking-wider text-gray-600 uppercase">
                  Catégorie
                </th>
                <th class="px-3 py-3 text-center text-xs font-semibold tracking-wider text-gray-600 uppercase">
                  Prévision
                </th>
                <th class="px-3 py-3 text-center text-xs font-semibold tracking-wider text-gray-600 uppercase">
                  Status
                </th>
                <th class="px-3 py-3 text-center text-xs font-semibold tracking-wider text-gray-600 uppercase">
                  Alertes
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="tache in group.taches" :key="tache.id" class="hover:bg-gray-50">
                <td class="px-3 py-3">
                  <div class="font-medium text-gray-700">{{ tache.taches?.tache || '-' }}</div>
                  <div v-if="tache.commentaire" class="mt-1 text-xs text-gray-500 italic">
                    {{ tache.commentaire }}
                  </div>
                </td>
                <td class="px-3 py-3 text-center">
                  <span
                    v-if="tache.categories?.name"
                    class="inline-block rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700">
                    {{ tache.categories.name }}
                  </span>
                  <span v-else class="text-gray-400">-</span>
                </td>
                <td class="px-3 py-3 text-center">
                  <span class="text-sm font-medium text-gray-700">{{ formatDateMonthYear(tache.prevision) }}</span>
                </td>
                <td class="px-3 py-3 text-center">
                  <span
                    class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
                    :style="{
                      backgroundColor: getRealisationStatus(tache).color + '20',
                      color: getRealisationStatus(tache).color
                    }">
                    {{ getRealisationStatus(tache).label }}
                  </span>
                </td>
                <td class="px-3 py-3 text-center">
                  <div class="flex items-center justify-center gap-2">
                    <span
                      v-if="tache.important"
                      class="inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700">
                      <Icon name="lucide:triangle-alert" size="12" />
                      Important
                    </span>
                    <span
                      v-if="tache.alerte"
                      class="inline-flex items-center gap-1 rounded bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-700">
                      <Icon name="lucide:siren" size="12" />
                      Alerte
                    </span>
                    <span v-if="!tache.important && !tache.alerte" class="text-gray-400">-</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>

      <!-- Pied de page -->
      <footer class="mt-12 border-t border-gray-200 pt-6 text-center print:mt-8">
        <p class="text-sm text-gray-500">Document généré le {{ printDate }} • H00 - Gestion des chantiers</p>
      </footer>
    </div>
  </div>
</template>

<style>
@media print {
  @page {
    size: A4 portrait;
    margin: 15mm;
  }

  .print-page {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .page-break-inside-avoid {
    page-break-inside: avoid;
  }

  /* Forcer les couleurs de fond */
  .bg-gradient-to-r,
  .bg-indigo-50,
  .bg-amber-100,
  .bg-red-100,
  .bg-gray-50 {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
}
</style>
