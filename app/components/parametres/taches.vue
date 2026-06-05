<script setup>
const { taches, getTaches, createTache, updateTache, deleteTache } = useTaches()
const { categories, getCategories } = useCategories()
const { profilTaches, getAllProfilTache } = useProfilTache()
const { setLoader } = useLoader()

const globalFilter = ref('')
const open = ref(false)
const printComponentRef = ref(null)
const isNewTache = ref(false)
const tache = ref({})
const oldTache = ref(null)

// État du modal de confirmation de suppression
const showDeleteModal = ref(false)
const tacheToDelete = ref(null)
const isDeleting = ref(false)

// Filtrer les tâches en fonction de la recherche
const filteredTaches = computed(() => {
  if (!globalFilter.value) return taches.value
  const search = globalFilter.value.toLowerCase()
  return taches.value.filter(
    (t) => t.tache?.toLowerCase().includes(search) || t.categorie?.toLowerCase().includes(search)
  )
})

// Options pour le select opt_delais
const optDelaisOptions = [
  { id: 0, label: 'Par rapport au début des travaux' },
  { id: 1, label: 'Par rapport à la fin des travaux' }
]

// Computed pour le switch RP1 (conversion number <-> boolean)
const rp1Switch = computed({
  get: () => tache.value.rp1 === 1,
  set: (val) => {
    tache.value.rp1 = val ? 1 : 0
  }
})

// Fonction pour vérifier si un profil est sélectionné
const isProfilSelected = (profilId) => {
  return tache.value.tache_profil?.includes(profilId) || false
}

// Fonction pour définir l'état d'un profil (pour les checkboxes)
const setProfilSelected = (profilId, selected) => {
  if (!tache.value.tache_profil) {
    tache.value.tache_profil = []
  }
  const index = tache.value.tache_profil.indexOf(profilId)
  if (selected && index === -1) {
    tache.value.tache_profil.push(profilId)
  } else if (!selected && index > -1) {
    tache.value.tache_profil.splice(index, 1)
  }
}

// Options pour le select des catégories
const categoriesOptions = computed(() => {
  return categories.value.map((c) => ({
    id: c.id,
    label: c.name
  }))
})

// Validation du formulaire
const validatedFields = computed(() => {
  return (
    tache.value.tache &&
    tache.value.tache.trim().length > 0 &&
    tache.value.id_categories &&
    tache.value.delais !== null &&
    tache.value.delais !== undefined
  )
})

// Formater le délai pour l'affichage
const formatDelais = (delais) => {
  if (delais === null || delais === undefined) return '—'
  const absDelais = Math.abs(delais)
  const prefix = delais < 0 ? 'J+' : 'J-'
  return `${prefix}${absDelais}`
}

// Formater les profils pour l'affichage
const formatProfils = (profilIds) => {
  if (!profilIds || profilIds.length === 0) return '—'
  const profilNames = profilIds.map((id) => {
    const profil = profilTaches.value.find((p) => p.id === id)
    return profil ? profil.label : `#${id}`
  })
  return profilNames.join(', ')
}

// Ouvrir le slide pour éditer une tâche
const openSlide = (row) => {
  if (row) {
    tache.value = { ...row }
    oldTache.value = { ...row }
    isNewTache.value = false
    open.value = true
  }
}

// Ouvrir le slide pour créer une nouvelle tâche
const openSlideNew = () => {
  tache.value = {
    tache: '',
    id_categories: null,
    delais: 0,
    tache_profil: [],
    opt_delais: 0,
    rp1: 0
  }
  oldTache.value = null
  isNewTache.value = true
  open.value = true
}

// Fermer le slide
const closeSlide = () => {
  open.value = false
  tache.value = {}
  oldTache.value = null
  isNewTache.value = false
}

// Enregistrer (créer ou modifier)
const enregistrer = async () => {
  if (!validatedFields.value) return

  setLoader(true)
  try {
    if (isNewTache.value) {
      await createTache({
        tache: tache.value.tache.trim(),
        id_categories: tache.value.id_categories,
        delais: parseInt(tache.value.delais),
        tache_profil: tache.value.tache_profil || [],
        opt_delais: tache.value.opt_delais || 0,
        rp1: tache.value.rp1 || 0
      })
    } else {
      await updateTache(
        tache.value.id,
        {
          tache: tache.value.tache.trim(),
          id_categories: tache.value.id_categories,
          delais: parseInt(tache.value.delais),
          tache_profil: tache.value.tache_profil || [],
          opt_delais: tache.value.opt_delais,
          rp1: tache.value.rp1
        },
        oldTache.value
      )
    }
    closeSlide()
  } finally {
    setLoader(false)
  }
}

// Ouvrir le modal de confirmation de suppression
const openDeleteModal = (t) => {
  if (!t?.id) return
  tacheToDelete.value = t
  showDeleteModal.value = true
}

// Confirmer la suppression
const confirmDelete = async () => {
  if (!tacheToDelete.value?.id) return

  isDeleting.value = true
  try {
    await deleteTache(tacheToDelete.value.id)
    showDeleteModal.value = false
    tacheToDelete.value = null
    closeSlide()
  } finally {
    isDeleting.value = false
  }
}

// Annuler la suppression
const cancelDelete = () => {
  tacheToDelete.value = null
}

// Appeler le composant d'impression
const printTaches = () => {
  printComponentRef.value?.printTaches()
}

// Charger les données au montage
setLoader(true)
try {
  await Promise.all([getTaches(), getCategories(), getAllProfilTache()])
} finally {
  setLoader(false)
}
</script>

<template>
  <div class="flex flex-col gap-4 h-full overflow-auto p-4 w-full">
    <AppTitleMain title="Paramètres Tâches" description="Gestion des tâches et de leurs délais" />

    <!-- Barre de recherche et boutons -->
    <div class="flex w-full flex-col items-center justify-between gap-4 sm:flex-row">
      <AppInputSearch v-model="globalFilter" class="w-full max-w-md" placeholder="Rechercher une tâche ..." />
      <div class="flex items-center gap-3">
        <AppButtonValidated theme="secondary" type="button" @click="printTaches">
          <template #default>
            <span class="flex items-center gap-2">
              <Icon name="lucide:printer" size="18" />
              Imprimer
            </span>
          </template>
        </AppButtonValidated>
        <AppButtonValidated theme="primary" type="button" @click="openSlideNew">
          <template #default>
            <span class="flex items-center gap-2">
              <Icon name="lucide:plus" size="18" />
              Ajouter
            </span>
          </template>
        </AppButtonValidated>
      </div>
    </div>

    <!-- Table des tâches -->
    <div
      class="flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-md border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <div class="flex-1 overflow-auto">
        <table class="w-full text-sm">
          <!-- Header -->
          <thead class="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
            <tr>
              <th class="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">Tâche</th>
              <th class="hidden px-4 py-3 text-left font-semibold text-slate-700 md:table-cell dark:text-slate-200">
                Catégorie
              </th>
              <th class="w-24 px-4 py-3 text-center font-semibold text-slate-700 dark:text-slate-200">Délai</th>
              <th
                class="hidden w-24 px-4 py-3 text-center font-semibold text-slate-700 lg:table-cell dark:text-slate-200">
                RP1
              </th>
              <th class="w-24 px-4 py-3 text-center font-semibold text-slate-700 dark:text-slate-200">Actions</th>
            </tr>
          </thead>

          <!-- Body -->
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            <tr v-for="t in filteredTaches" :key="t.id"
              class="cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50" @click="openSlide(t)">
              <!-- Colonne Tâche -->
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <div
                    class="bg-primary-100 dark:bg-primary-900/30 mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg">
                    <Icon name="lucide:clipboard-list" size="16" class="text-primary-500" />
                  </div>
                  <div class="flex min-w-0 flex-col">
                    <span class="line-clamp-2 font-medium text-slate-900 dark:text-white">
                      {{ t.tache || '—' }}
                    </span>
                    <span class="mt-1 text-xs text-slate-500 md:hidden dark:text-slate-400">
                      {{ t.categorie || 'Sans catégorie' }}
                    </span>
                  </div>
                </div>
              </td>

              <!-- Colonne Catégorie -->
              <td class="hidden px-4 py-3 md:table-cell">
                <span
                  class="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                  {{ t.categorie || 'Sans catégorie' }}
                </span>
              </td>

              <!-- Colonne Délai -->
              <td class="px-4 py-3 text-center">
                <span class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold" :class="t.delais < 0
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-secondary-100 text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-400'
                  ">
                  {{ formatDelais(t.delais) }}
                </span>
              </td>

              <!-- Colonne RP1 -->
              <td class="hidden px-4 py-3 text-center lg:table-cell">
                <span v-if="t.rp1 === 1"
                  class="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  RP1
                </span>
                <span v-else class="text-xs text-slate-400 dark:text-slate-500">—</span>
              </td>

              <!-- Colonne Actions -->
              <td class="px-4 py-3 text-center">
                <div class="flex items-center justify-center gap-1">
                  <button class="rounded-lg p-2 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700"
                    @click.stop="openSlide(t)" title="Modifier">
                    <Icon name="lucide:pencil" class="hover:text-primary-500 h-4 w-4 text-slate-500" />
                  </button>
                  <button class="rounded-lg p-2 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                    @click.stop="openDeleteModal(t)" title="Supprimer">
                    <Icon name="lucide:trash-2" class="h-4 w-4 text-slate-500 hover:text-red-500" />
                  </button>
                </div>
              </td>
            </tr>

            <!-- Message si aucun résultat -->
            <tr v-if="filteredTaches.length === 0">
              <td colspan="5" class="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                <Icon name="lucide:clipboard-x" class="mx-auto mb-2 h-8 w-8 opacity-50" />
                <p>Aucune tâche trouvée</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- SlideOver pour édition/création -->
    <AppSlideOver :sideModal="open" :closeSideModal="closeSlide">
      <template #default>
        <AppSlideOverContent v-if="open" :closeSideModal="closeSlide">
          <template #header>
            <div class="text-center">
              <div
                class="bg-primary-100 dark:bg-primary-900/30 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                <Icon :name="isNewTache ? 'lucide:clipboard-plus' : 'lucide:clipboard-edit'" size="28"
                  class="text-primary-500" />
              </div>
              <h2 class="text-xl font-semibold text-slate-900 dark:text-white">
                {{ isNewTache ? 'Nouvelle tâche' : 'Modifier la tâche' }}
              </h2>
              <p v-if="!isNewTache" class="mt-1 text-sm text-slate-500 dark:text-slate-400">ID: {{ tache.id }}</p>
            </div>
          </template>

          <template #default>
            <form @submit.prevent="enregistrer" class="flex w-full flex-col gap-5">
              <!-- Nom de la tâche -->
              <div class="flex flex-col gap-1.5">
                <label class="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Nom de la tâche
                  <span class="text-red-500">*</span>
                </label>
                <textarea v-model="tache.tache" rows="3"
                  class="focus:ring-primary-500 w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-transparent focus:ring-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                  placeholder="Description de la tâche..."></textarea>
              </div>

              <!-- Catégorie -->
              <div class="flex flex-col gap-1.5">
                <label class="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Catégorie
                  <span class="text-red-500">*</span>
                </label>
                <AppSelect v-model="tache.id_categories" :options="categoriesOptions"
                  placeholder="Sélectionner une catégorie..." />
              </div>

              <!-- Délai -->
              <div class="flex flex-col gap-1.5">
                <label class="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Délai (en jours)
                  <span class="text-red-500">*</span>
                </label>
                <AppInput name="delais" type="number" placeholder="Ex: 30, -15..." v-model="tache.delais" />
                <p class="text-xs text-slate-500 dark:text-slate-400">
                  Valeur positive = avant la date de référence (J-X), négative = après (J+X)
                </p>
              </div>

              <!-- Référence délai -->
              <div class="flex flex-col gap-1.5">
                <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Date de référence</label>
                <AppSelect v-model="tache.opt_delais" :options="optDelaisOptions" placeholder="Sélectionner..." />
                <p v-if="!isNewTache" class="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                  <Icon name="lucide:alert-triangle" class="h-3 w-3" />
                  Modifier cette valeur mettra à jour les prévisions existantes
                </p>
              </div>

              <!-- RP1 -->
              <div class="flex flex-col gap-1.5">
                <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Tâche RP1</label>
                <AppSwitch v-model="rp1Switch" label="Activer pour les tâches RP1" />
              </div>

              <!-- Profils -->
              <div class="flex flex-col gap-1.5">
                <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Profils concernés</label>
                <div class="grid grid-cols-2 gap-3">
                  <AppCheckbox v-for="profil in profilTaches" :key="profil.id" :label="profil.label"
                    :model-value="isProfilSelected(profil.id)"
                    @update:model-value="(val) => setProfilSelected(profil.id, val)" />
                </div>
              </div>
            </form>
          </template>

          <template #footer>
            <div class="flex justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-700">
              <AppButtonValidated theme="cancel" type="button" @click="closeSlide">
                <template #default>Annuler</template>
              </AppButtonValidated>
              <AppButtonValidated :validated="validatedFields" @click="enregistrer">
                <template #default>{{ isNewTache ? 'Créer' : 'Enregistrer' }}</template>
              </AppButtonValidated>
            </div>
          </template>
        </AppSlideOverContent>
      </template>
    </AppSlideOver>

    <!-- Modal de confirmation de suppression -->
    <AppModal v-model="showDeleteModal" size="md" :persistent="isDeleting" @close="cancelDelete">
      <template #header>
        <div class="text-center">
          <div
            class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <Icon name="lucide:triangle-alert" size="28" class="text-red-600 dark:text-red-400" />
          </div>
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Supprimer une tâche</h3>
        </div>
      </template>

      <template #default>
        <p class="text-center text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          Êtes-vous sûr de vouloir supprimer la tâche
          <span class="font-semibold text-slate-900 dark:text-white">
            « {{ tacheToDelete?.tache?.substring(0, 50) || '' }}{{ tacheToDelete?.tache?.length > 50 ? '...' : '' }} »
          </span>
          ? Cette action est irréversible.
        </p>
      </template>

      <template #footer>
        <div class="flex justify-end gap-3">
          <AppButtonValidated theme="cancel" type="button" :validated="!isDeleting" @click="showDeleteModal = false">
            <template #default>Annuler</template>
          </AppButtonValidated>
          <AppButtonValidated theme="delete" type="button" :loading="isDeleting" @click="confirmDelete">
            <template #default>Supprimer</template>
          </AppButtonValidated>
        </div>
      </template>
    </AppModal>

    <!-- Composant d'impression (invisible) -->
    <ParametresTachesPrint ref="printComponentRef" :taches="taches" :profils="profilTaches" />
  </div>
</template>
