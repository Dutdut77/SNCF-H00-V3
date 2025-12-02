<script setup>
const { taches, getTaches, createTache, updateTache, deleteTache } =
  useTaches();
const { categories, getCategories } = useCategories();
const { profilTaches, getAllProfilTache } = useProfilTache();
const { setLoader } = useLoader();

const globalFilter = ref("");
const open = ref(false);
const printComponentRef = ref(null);
const isNewTache = ref(false);
const tache = ref({});
const oldTache = ref(null);

// État du modal de confirmation de suppression
const showDeleteModal = ref(false);
const tacheToDelete = ref(null);
const isDeleting = ref(false);

// Filtrer les tâches en fonction de la recherche
const filteredTaches = computed(() => {
  if (!globalFilter.value) return taches.value;
  const search = globalFilter.value.toLowerCase();
  return taches.value.filter(
    (t) =>
      t.tache?.toLowerCase().includes(search) ||
      t.categorie?.toLowerCase().includes(search)
  );
});

// Options pour le select opt_delais
const optDelaisOptions = [
  { id: 0, label: "Par rapport au début des travaux" },
  { id: 1, label: "Par rapport à la fin des travaux" },
];

// Computed pour le switch RP1 (conversion number <-> boolean)
const rp1Switch = computed({
  get: () => tache.value.rp1 === 1,
  set: (val) => {
    tache.value.rp1 = val ? 1 : 0;
  },
});

// Fonction pour vérifier si un profil est sélectionné
const isProfilSelected = (profilId) => {
  return tache.value.tache_profil?.includes(profilId) || false;
};

// Fonction pour définir l'état d'un profil (pour les checkboxes)
const setProfilSelected = (profilId, selected) => {
  if (!tache.value.tache_profil) {
    tache.value.tache_profil = [];
  }
  const index = tache.value.tache_profil.indexOf(profilId);
  if (selected && index === -1) {
    tache.value.tache_profil.push(profilId);
  } else if (!selected && index > -1) {
    tache.value.tache_profil.splice(index, 1);
  }
};

// Options pour le select des catégories
const categoriesOptions = computed(() => {
  return categories.value.map((c) => ({
    id: c.id,
    label: c.name,
  }));
});

// Validation du formulaire
const validatedFields = computed(() => {
  return (
    tache.value.tache &&
    tache.value.tache.trim().length > 0 &&
    tache.value.id_categories &&
    tache.value.delais !== null &&
    tache.value.delais !== undefined
  );
});

// Formater le délai pour l'affichage
const formatDelais = (delais) => {
  if (delais === null || delais === undefined) return "—";
  const absDelais = Math.abs(delais);
  const prefix = delais < 0 ? "J+" : "J-";
  return `${prefix}${absDelais}`;
};

// Formater les profils pour l'affichage
const formatProfils = (profilIds) => {
  if (!profilIds || profilIds.length === 0) return "—";
  const profilNames = profilIds.map((id) => {
    const profil = profilTaches.value.find((p) => p.id === id);
    return profil ? profil.label : `#${id}`;
  });
  return profilNames.join(", ");
};

// Ouvrir le slide pour éditer une tâche
const openSlide = (row) => {
  if (row) {
    tache.value = { ...row };
    oldTache.value = { ...row };
    isNewTache.value = false;
    open.value = true;
  }
};

// Ouvrir le slide pour créer une nouvelle tâche
const openSlideNew = () => {
  tache.value = {
    tache: "",
    id_categories: null,
    delais: 0,
    tache_profil: [],
    opt_delais: 0,
    rp1: 0,
  };
  oldTache.value = null;
  isNewTache.value = true;
  open.value = true;
};

// Fermer le slide
const closeSlide = () => {
  open.value = false;
  tache.value = {};
  oldTache.value = null;
  isNewTache.value = false;
};

// Enregistrer (créer ou modifier)
const enregistrer = async () => {
  if (!validatedFields.value) return;

  setLoader(true);
  try {
    if (isNewTache.value) {
      await createTache({
        tache: tache.value.tache.trim(),
        id_categories: tache.value.id_categories,
        delais: parseInt(tache.value.delais),
        tache_profil: tache.value.tache_profil || [],
        opt_delais: tache.value.opt_delais || 0,
        rp1: tache.value.rp1 || 0,
      });
    } else {
      await updateTache(
        tache.value.id,
        {
          tache: tache.value.tache.trim(),
          id_categories: tache.value.id_categories,
          delais: parseInt(tache.value.delais),
          tache_profil: tache.value.tache_profil || [],
          opt_delais: tache.value.opt_delais,
          rp1: tache.value.rp1,
        },
        oldTache.value
      );
    }
    closeSlide();
  } finally {
    setLoader(false);
  }
};

// Ouvrir le modal de confirmation de suppression
const openDeleteModal = (t) => {
  if (!t?.id) return;
  tacheToDelete.value = t;
  showDeleteModal.value = true;
};

// Confirmer la suppression
const confirmDelete = async () => {
  if (!tacheToDelete.value?.id) return;

  isDeleting.value = true;
  try {
    await deleteTache(tacheToDelete.value.id);
    showDeleteModal.value = false;
    tacheToDelete.value = null;
    closeSlide();
  } finally {
    isDeleting.value = false;
  }
};

// Annuler la suppression
const cancelDelete = () => {
  tacheToDelete.value = null;
};

// Appeler le composant d'impression
const printTaches = () => {
  printComponentRef.value?.printTaches();
};

// Charger les données au montage
setLoader(true);
try {
  await Promise.all([getTaches(), getCategories(), getAllProfilTache()]);
} finally {
  setLoader(false);
}
</script>

<template>
  <div class="flex flex-col w-full h-full gap-4 overflow-hidden">
    <AppTitleMain
      title="Paramètres Tâches"
      description="Gestion des tâches et de leurs délais"
    />

    <!-- Barre de recherche et boutons -->
    <div
      class="flex flex-col sm:flex-row gap-4 items-center justify-between w-full"
    >
      <AppInputSearch
        v-model="globalFilter"
        class="w-full max-w-md"
        placeholder="Rechercher une tâche ..."
      />
      <div class="flex items-center gap-3">
        <AppButtonValidated
          theme="secondary"
          type="button"
          @click="printTaches"
        >
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
      class="flex flex-col w-full flex-1 min-h-0 overflow-hidden rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
    >
      <div class="overflow-auto flex-1">
        <table class="w-full text-sm">
          <!-- Header -->
          <thead
            class="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10"
          >
            <tr>
              <th
                class="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200"
              >
                Tâche
              </th>
              <th
                class="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200 hidden md:table-cell"
              >
                Catégorie
              </th>
              <th
                class="px-4 py-3 text-center font-semibold text-gray-700 dark:text-gray-200 w-24"
              >
                Délai
              </th>
              <th
                class="px-4 py-3 text-center font-semibold text-gray-700 dark:text-gray-200 w-24 hidden lg:table-cell"
              >
                RP1
              </th>
              <th
                class="px-4 py-3 text-center font-semibold text-gray-700 dark:text-gray-200 w-24"
              >
                Actions
              </th>
            </tr>
          </thead>

          <!-- Body -->
          <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
            <tr
              v-for="t in filteredTaches"
              :key="t.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
              @click="openSlide(t)"
            >
              <!-- Colonne Tâche -->
              <td class="px-4 py-3">
                <div class="flex items-start gap-3">
                  <div
                    class="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0 mt-0.5"
                  >
                    <Icon
                      name="lucide:clipboard-list"
                      size="16"
                      class="text-primary-500"
                    />
                  </div>
                  <div class="flex flex-col min-w-0">
                    <span
                      class="font-medium text-gray-900 dark:text-white line-clamp-2"
                    >
                      {{ t.tache || "—" }}
                    </span>
                    <span
                      class="text-xs text-gray-500 dark:text-gray-400 md:hidden mt-1"
                    >
                      {{ t.categorie || "Sans catégorie" }}
                    </span>
                  </div>
                </div>
              </td>

              <!-- Colonne Catégorie -->
              <td class="px-4 py-3 hidden md:table-cell">
                <span
                  class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                >
                  {{ t.categorie || "Sans catégorie" }}
                </span>
              </td>

              <!-- Colonne Délai -->
              <td class="px-4 py-3 text-center">
                <span
                  class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
                  :class="
                    t.delais < 0
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                  "
                >
                  {{ formatDelais(t.delais) }}
                </span>
              </td>

              <!-- Colonne RP1 -->
              <td class="px-4 py-3 text-center hidden lg:table-cell">
                <span
                  v-if="t.rp1 === 1"
                  class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                >
                  RP1
                </span>
                <span v-else class="text-xs text-gray-400 dark:text-gray-500"
                  >—</span
                >
              </td>

              <!-- Colonne Actions -->
              <td class="px-4 py-3 text-center">
                <div class="flex items-center justify-center gap-1">
                  <button
                    class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    @click.stop="openSlide(t)"
                    title="Modifier"
                  >
                    <Icon
                      name="lucide:pencil"
                      class="w-4 h-4 text-gray-500 hover:text-primary-500"
                    />
                  </button>
                  <button
                    class="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    @click.stop="openDeleteModal(t)"
                    title="Supprimer"
                  >
                    <Icon
                      name="lucide:trash-2"
                      class="w-4 h-4 text-gray-500 hover:text-red-500"
                    />
                  </button>
                </div>
              </td>
            </tr>

            <!-- Message si aucun résultat -->
            <tr v-if="filteredTaches.length === 0">
              <td
                colspan="5"
                class="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
              >
                <Icon
                  name="lucide:clipboard-x"
                  class="w-8 h-8 mx-auto mb-2 opacity-50"
                />
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
                class="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center"
              >
                <Icon
                  :name="
                    isNewTache
                      ? 'lucide:clipboard-plus'
                      : 'lucide:clipboard-edit'
                  "
                  size="28"
                  class="text-primary-500"
                />
              </div>
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
                {{ isNewTache ? "Nouvelle tâche" : "Modifier la tâche" }}
              </h2>
              <p
                v-if="!isNewTache"
                class="text-sm text-gray-500 dark:text-gray-400 mt-1"
              >
                ID: {{ tache.id }}
              </p>
            </div>
          </template>

          <template #default>
            <form
              @submit.prevent="enregistrer"
              class="flex flex-col gap-5 w-full"
            >
              <!-- Nom de la tâche -->
              <div class="flex flex-col gap-1.5">
                <label
                  class="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Nom de la tâche <span class="text-red-500">*</span>
                </label>
                <textarea
                  v-model="tache.tache"
                  rows="3"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  placeholder="Description de la tâche..."
                ></textarea>
              </div>

              <!-- Catégorie -->
              <div class="flex flex-col gap-1.5">
                <label
                  class="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Catégorie <span class="text-red-500">*</span>
                </label>
                <AppSelect
                  v-model="tache.id_categories"
                  :options="categoriesOptions"
                  placeholder="Sélectionner une catégorie..."
                />
              </div>

              <!-- Délai -->
              <div class="flex flex-col gap-1.5">
                <label
                  class="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Délai (en jours) <span class="text-red-500">*</span>
                </label>
                <AppInput
                  name="delais"
                  type="number"
                  placeholder="Ex: 30, -15..."
                  v-model="tache.delais"
                />
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  Valeur positive = avant la date de référence (J-X), négative =
                  après (J+X)
                </p>
              </div>

              <!-- Référence délai -->
              <div class="flex flex-col gap-1.5">
                <label
                  class="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Date de référence
                </label>
                <AppSelect
                  v-model="tache.opt_delais"
                  :options="optDelaisOptions"
                  placeholder="Sélectionner..."
                />
                <p
                  v-if="!isNewTache"
                  class="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1"
                >
                  <Icon name="lucide:alert-triangle" class="w-3 h-3" />
                  Modifier cette valeur mettra à jour les prévisions existantes
                </p>
              </div>

              <!-- RP1 -->
              <div class="flex flex-col gap-1.5">
                <label
                  class="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Tâche RP1
                </label>
                <AppSwitch
                  v-model="rp1Switch"
                  label="Activer pour les tâches RP1"
                />
              </div>

              <!-- Profils -->
              <div class="flex flex-col gap-1.5">
                <label
                  class="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Profils concernés
                </label>
                <div class="grid grid-cols-2 gap-3">
                  <AppCheckbox
                    v-for="profil in profilTaches"
                    :key="profil.id"
                    :label="profil.label"
                    :model-value="isProfilSelected(profil.id)"
                    @update:model-value="
                      (val) => setProfilSelected(profil.id, val)
                    "
                  />
                </div>
              </div>
            </form>
          </template>

          <template #footer>
            <div
              class="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700"
            >
              <AppButtonValidated
                theme="cancel"
                type="button"
                @click="closeSlide"
              >
                <template #default>Annuler</template>
              </AppButtonValidated>
              <AppButtonValidated
                :validated="validatedFields"
                @click="enregistrer"
              >
                <template #default>{{
                  isNewTache ? "Créer" : "Enregistrer"
                }}</template>
              </AppButtonValidated>
            </div>
          </template>
        </AppSlideOverContent>
      </template>
    </AppSlideOver>

    <!-- Modal de confirmation de suppression -->
    <AppModal
      v-model="showDeleteModal"
      size="md"
      :persistent="isDeleting"
      @close="cancelDelete"
    >
      <template #header>
        <div class="text-center">
          <div
            class="w-14 h-14 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center"
          >
            <Icon
              name="lucide:triangle-alert"
              size="28"
              class="text-red-600 dark:text-red-400"
            />
          </div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Supprimer une tâche
          </h3>
        </div>
      </template>

      <template #default>
        <p
          class="text-center text-gray-600 dark:text-gray-300 text-sm leading-relaxed"
        >
          Êtes-vous sûr de vouloir supprimer la tâche
          <span class="font-semibold text-gray-900 dark:text-white"
            >« {{ tacheToDelete?.tache?.substring(0, 50) || ""
            }}{{ tacheToDelete?.tache?.length > 50 ? "..." : "" }} »</span
          >
          ? Cette action est irréversible.
        </p>
      </template>

      <template #footer>
        <div class="flex gap-3 justify-end">
          <AppButtonValidated
            theme="cancel"
            type="button"
            :validated="!isDeleting"
            @click="showDeleteModal = false"
          >
            <template #default>Annuler</template>
          </AppButtonValidated>
          <AppButtonValidated
            theme="delete"
            type="button"
            :loading="isDeleting"
            @click="confirmDelete"
          >
            <template #default>Supprimer</template>
          </AppButtonValidated>
        </div>
      </template>
    </AppModal>

    <!-- Composant d'impression (invisible) -->
    <ParametresTachesPrint
      ref="printComponentRef"
      :taches="taches"
      :profils="profilTaches"
    />
  </div>
</template>
