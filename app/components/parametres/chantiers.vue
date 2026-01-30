<script setup>
const {
  getChantiers,
  getChantiersEtat2,
  getChantiersEtat1,
  getChantiersEtat0,
  getChantiersTermines,
  passerChantier,
  terminerChantier,
  supprimerChantier
} = useChantiers();

const { setLoader } = useLoader();

// États pour les selects (stockent l'ID)
const selectedChantierPasser = ref(null);
const selectedChantierTerminer = ref(null);
const selectedChantierSupprimer = ref(null);

// Fonction pour formater l'affichage d'un chantier dans le select
const formatChantierLabel = (chantier) => {
  if (!chantier) return '';
  const parts = [];
  if (chantier.compte) parts.push(chantier.compte);
  if (chantier.name) parts.push(chantier.name);
  if (chantier.ligne) parts.push(chantier.ligne);
  return parts.length > 0 ? parts.join(' - ') : `Chantier #${chantier.id}`;
};

// Computed pour les chantiers en cours (état 2 - Pré-op) - pour passer au RLT
const chantiersEnCoursOptions = computed(() => {
  return getChantiersEtat2.value.map(chantier => ({
    id: chantier.id,
    label: formatChantierLabel(chantier)
  }));
});

// Computed pour les chantiers RLT (état 0) et externes (état 1) - pour terminer
const chantiersATerminerOptions = computed(() => {
  const chantiersRLT = getChantiersEtat0.value.map(chantier => ({
    id: chantier.id,
    label: `[RLT] ${formatChantierLabel(chantier)}`
  }));
  const chantiersExternes = getChantiersEtat1.value.map(chantier => ({
    id: chantier.id,
    label: `[Externe] ${formatChantierLabel(chantier)}`
  }));
  return [...chantiersRLT, ...chantiersExternes];
});

// Computed pour les chantiers terminés (état -1) - pour supprimer
const chantiersTerminesOptions = computed(() => {
  return getChantiersTermines.value.map(chantier => ({
    id: chantier.id,
    label: formatChantierLabel(chantier)
  }));
});

// Fonction pour passer un chantier (état 2 → 0)
const handlePasser = async () => {
  if (!selectedChantierPasser.value) return;
  setLoader(true);
  try {
    await passerChantier(selectedChantierPasser.value);
    selectedChantierPasser.value = null;
  } finally {
    setLoader(false);
  }
};

// Fonction pour terminer un chantier (état 0 → -1)
const handleTerminer = async () => {
  if (!selectedChantierTerminer.value) return;
  setLoader(true);
  try {
    await terminerChantier(selectedChantierTerminer.value);
    selectedChantierTerminer.value = null;
  } finally {
    setLoader(false);
  }
};

// Fonction pour supprimer un chantier
const handleSupprimer = async () => {
  if (!selectedChantierSupprimer.value) return;
  setLoader(true);
  try {
    await supprimerChantier(selectedChantierSupprimer.value);
    selectedChantierSupprimer.value = null;
  } finally {
    setLoader(false);
  }
};

// Charger les chantiers au montage
onMounted(async () => {
  setLoader(true);
  try {
    await getChantiers();
  } finally {
    setLoader(false);
  }
});
</script>
<template>
  <div class="flex flex-col gap-4 h-full overflow-auto p-4 w-full">
    <AppTitleMain title="Paramètres Chantiers" description="Gestion des chantiers" />

    <!-- Section 1: Passer un chantier au RLT (état 2 → 0) -->
    <div class="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
      <div class="flex items-center gap-2 mb-4">
        <Icon name="lucide:arrow-right-circle" class="w-5 h-5 text-primary-500" />
        <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200">Passer un chantier au RLT</h3>
      </div>
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Sélectionnez un chantier en cours (Pré-op) pour le passer au statut RLT.
      </p>
      <div class="flex flex-col sm:flex-row gap-3">
        <div class="flex-1">
          <AppSelect v-model="selectedChantierPasser" :options="chantiersEnCoursOptions"
            placeholder="Sélectionner un chantier en cours..." nullable />
        </div>
        <AppButtonValidated :validated="!!selectedChantierPasser" theme="primary" type="button" @click="handlePasser">
          <template #default>Passer au RLT</template>
        </AppButtonValidated>
      </div>
      <p v-if="chantiersEnCoursOptions.length === 0" class="text-sm text-gray-400 dark:text-gray-500 mt-2 italic">
        Aucun chantier en cours disponible.
      </p>
    </div>

    <!-- Section 2: Terminer un chantier (état 0 ou 1 → -1) -->
    <div class="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
      <div class="flex items-center gap-2 mb-4">
        <Icon name="lucide:check-circle" class="w-5 h-5 text-green-500" />
        <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200">Terminer un chantier</h3>
      </div>
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Sélectionnez un chantier RLT ou externe pour le marquer comme terminé.
      </p>
      <div class="flex flex-col sm:flex-row gap-3">
        <div class="flex-1">
          <AppSelect v-model="selectedChantierTerminer" :options="chantiersATerminerOptions"
            placeholder="Sélectionner un chantier RLT ou externe..." nullable />
        </div>
        <AppButtonValidated :validated="!!selectedChantierTerminer" theme="secondary" type="button"
          @click="handleTerminer">
          <template #default>Terminer</template>
        </AppButtonValidated>
      </div>
      <p v-if="chantiersATerminerOptions.length === 0" class="text-sm text-gray-400 dark:text-gray-500 mt-2 italic">
        Aucun chantier RLT ou externe disponible.
      </p>
    </div>

    <!-- Section 3: Supprimer un chantier (état -1) -->
    <div class="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-red-200 dark:border-red-900/30">
      <div class="flex items-center gap-2 mb-4">
        <Icon name="lucide:trash-2" class="w-5 h-5 text-red-500" />
        <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200">Supprimer un chantier</h3>
      </div>
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Sélectionnez un chantier terminé pour le supprimer définitivement.
      </p>
      <div class="flex flex-col sm:flex-row gap-3">
        <div class="flex-1">
          <AppSelect v-model="selectedChantierSupprimer" :options="chantiersTerminesOptions"
            placeholder="Sélectionner un chantier terminé..." nullable />
        </div>
        <AppButtonValidated :validated="!!selectedChantierSupprimer" theme="delete" type="button"
          @click="handleSupprimer">
          <template #default>Supprimer</template>
        </AppButtonValidated>
      </div>
      <p v-if="chantiersTerminesOptions.length === 0" class="text-sm text-gray-400 dark:text-gray-500 mt-2 italic">
        Aucun chantier terminé disponible.
      </p>
    </div>



  </div>
</template>