<script setup>
const { allAttributions, getAttributions, createAttribution, updateAttribution, deleteAttribution } = useAttributions();
const { setLoader } = useLoader();

const globalFilter = ref("");
const open = ref(false);
const isNewSite = ref(false);
const site = ref({});

// État du modal de confirmation de suppression
const showDeleteModal = ref(false);
const siteToDelete = ref(null);
const isDeleting = ref(false);

// Filtrer les sites en fonction de la recherche
const filteredSites = computed(() => {
  if (!globalFilter.value) return allAttributions.value;
  const search = globalFilter.value.toLowerCase();
  return allAttributions.value.filter((s) =>
    [s.code, s.label].join(' ').toLowerCase().includes(search)
  );
});

// Validation : libellé obligatoire (+ code obligatoire à la création).
const validatedFields = computed(() => {
  const labelOk = site.value.label && site.value.label.trim().length > 0;
  if (isNewSite.value) {
    return labelOk && site.value.code && site.value.code.trim().length > 0;
  }
  return labelOk;
});

// Ouvrir le slide pour éditer un site
const openSlide = (row) => {
  if (!row) return;
  site.value = {
    code: row.code,
    label: row.label,
    ordre: row.ordre ?? 0
  };
  isNewSite.value = false;
  open.value = true;
};

// Ouvrir le slide pour créer un nouveau site
const openSlideNew = () => {
  site.value = {
    code: '',
    label: '',
    ordre: (allAttributions.value.length || 0) + 1
  };
  isNewSite.value = true;
  open.value = true;
};

// Fermer le slide
const closeSlide = () => {
  open.value = false;
  site.value = {};
  isNewSite.value = false;
};

// Enregistrer (créer ou modifier)
const enregistrer = async () => {
  if (!validatedFields.value) return;

  const payload = {
    code: site.value.code.trim(),
    label: site.value.label.trim(),
    ordre: Number(site.value.ordre) || 0
  };

  setLoader(true);
  try {
    const result = isNewSite.value
      ? await createAttribution(payload)
      : await updateAttribution(payload);
    if (result) closeSlide();
  } finally {
    setLoader(false);
  }
};

// Ouvrir le modal de confirmation de suppression
const openDeleteModal = (s) => {
  if (!s?.code) return;
  siteToDelete.value = s;
  showDeleteModal.value = true;
};

// Confirmer la suppression
const confirmDelete = async () => {
  if (!siteToDelete.value?.code) return;

  isDeleting.value = true;
  try {
    const ok = await deleteAttribution(siteToDelete.value.code);
    if (ok) {
      showDeleteModal.value = false;
      siteToDelete.value = null;
    }
  } finally {
    isDeleting.value = false;
  }
};

// Annuler la suppression
const cancelDelete = () => {
  siteToDelete.value = null;
};

// Charger les sites au montage
setLoader(true);
try {
  await getAttributions();
} finally {
  setLoader(false);
}
</script>

<template>
  <div class="flex flex-col gap-4 h-full overflow-auto p-4 w-full">
    <AppTitleMain title="Paramètres Sites" description="Gestion des sites (attributions des chantiers)" />

    <!-- Barre de recherche et bouton ajouter -->
    <div class="flex flex-col sm:flex-row gap-4 items-center justify-between w-full">
      <AppInputSearch v-model="globalFilter" class="w-full max-w-md" placeholder="Rechercher un site ..." />
      <AppButtonValidated theme="primary" type="button" @click="openSlideNew">
        <template #default>
          <span class="flex items-center gap-2">
            <Icon name="lucide:plus" size="18" />
            Ajouter
          </span>
        </template>
      </AppButtonValidated>
    </div>

    <!-- Table des sites -->
    <div
      class="flex flex-col w-full flex-1 min-h-0 overflow-hidden rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
      <div class="overflow-auto flex-1">
        <table class="w-full text-sm">
          <!-- Header -->
          <thead class="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
            <tr>
              <th class="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">Site</th>
              <th class="px-4 py-3 text-center font-semibold text-slate-700 dark:text-slate-200 w-24">Actions</th>
            </tr>
          </thead>

          <!-- Body -->
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            <tr v-for="s in filteredSites" :key="s.code"
              class="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors" @click="openSlide(s)">
              <!-- Colonne Site (label + code) -->
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg bg-secondary-100 dark:bg-secondary-900/30 flex items-center justify-center">
                    <Icon name="lucide:map-pin" size="16" class="text-secondary-600 dark:text-secondary-400" />
                  </div>
                  <div class="flex flex-col">
                    <span class="font-medium text-slate-900 dark:text-white">{{ s.label || '—' }}</span>
                    <span class="text-xs text-slate-500 dark:text-slate-400 font-mono">{{ s.code }}</span>
                  </div>
                </div>
              </td>

              <!-- Colonne Actions -->
              <td class="px-4 py-3 text-center">
                <div class="flex items-center justify-center gap-1">
                  <button class="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    @click.stop="openSlide(s)" title="Modifier">
                    <Icon name="lucide:pencil" class="w-4 h-4 text-slate-500 hover:text-primary-500" />
                  </button>
                  <button class="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    @click.stop="openDeleteModal(s)" title="Supprimer">
                    <Icon name="lucide:trash-2" class="w-4 h-4 text-slate-500 hover:text-red-500" />
                  </button>
                </div>
              </td>
            </tr>

            <!-- Message si aucun résultat -->
            <tr v-if="filteredSites.length === 0">
              <td colspan="2" class="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                <Icon name="lucide:map-pin-off" class="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Aucun site trouvé</p>
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
                class="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary-100 dark:bg-secondary-900/30 flex items-center justify-center">
                <Icon :name="isNewSite ? 'lucide:map-pin-plus' : 'lucide:map-pin'" size="28"
                  class="text-secondary-600 dark:text-secondary-400" />
              </div>
              <h2 class="text-xl font-semibold text-slate-900 dark:text-white">
                {{ isNewSite ? 'Nouveau site' : 'Modifier le site' }}
              </h2>
              <p v-if="!isNewSite" class="text-sm text-slate-500 dark:text-slate-400 mt-1 font-mono">
                {{ site.code }}
              </p>
            </div>
          </template>

          <template #default>
            <form @submit.prevent="enregistrer" class="flex flex-col gap-5 w-full">

              <!-- Code (clé primaire : modifiable uniquement à la création) -->
              <div>
                <AppInput name="code" title="Code" placeholder="Ex: UTM L1000" v-model="site.code"
                  :disabled="!isNewSite" required />
                <p v-if="!isNewSite" class="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Le code identifie le site et n'est pas modifiable.
                </p>
              </div>

              <!-- Libellé -->
              <AppInput name="label" title="Libellé" placeholder="Nom affiché du site" v-model="site.label" required />

            </form>
          </template>

          <template #footer>
            <div class="flex gap-3 justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
              <AppButtonValidated theme="cancel" type="button" @click="closeSlide">
                <template #default>Annuler</template>
              </AppButtonValidated>
              <AppButtonValidated :validated="validatedFields" @click="enregistrer">
                <template #default>{{ isNewSite ? 'Créer' : 'Enregistrer' }}</template>
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
            class="w-14 h-14 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <Icon name="lucide:triangle-alert" size="28" class="text-red-600 dark:text-red-400" />
          </div>
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Supprimer un site</h3>
        </div>
      </template>

      <template #default>
        <p class="text-center text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
          Êtes-vous sûr de vouloir supprimer le site
          <span class="font-semibold text-slate-900 dark:text-white">« {{ siteToDelete?.label || '' }} »</span> ?
          Cette action est irréversible et impossible si des chantiers y sont rattachés.
        </p>
      </template>

      <template #footer>
        <div class="flex gap-3 justify-end">
          <AppButtonValidated theme="cancel" type="button" :validated="!isDeleting" @click="showDeleteModal = false">
            <template #default>Annuler</template>
          </AppButtonValidated>
          <AppButtonValidated theme="delete" type="button" :loading="isDeleting" @click="confirmDelete">
            <template #default>Supprimer</template>
          </AppButtonValidated>
        </div>
      </template>
    </AppModal>

  </div>
</template>
