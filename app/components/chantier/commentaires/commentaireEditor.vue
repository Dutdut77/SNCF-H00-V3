<script setup>
const props = defineProps({
  chantier: {
    type: Object,
    required: true,
  },
  typeKey: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  icon: {
    type: String,
    default: 'lucide:message-square-text',
  },
  tone: {
    type: String,
    default: 'primary',
  },
});

const { getCommentaire, saveCommentaire } = useCommentaires();
const { addToast } = useToast();

const content = ref('');
const loading = ref(false);
const saving = ref(false);
const lastSavedContent = ref('');
const lastSavedAt = ref(null);
const autoSaveTimer = ref(null);

const toneMap = {
  primary: {
    icon: 'bg-primary-500/10 text-primary-500 ring-primary-500/20',
    badge: 'bg-primary-500/10 text-primary-600 border-primary-500/20 dark:bg-primary-500/10 dark:text-primary-200 dark:border-primary-500/30',
  },
  amber: {
    icon: 'bg-amber-500/10 text-amber-500 ring-amber-500/20',
    badge: 'bg-amber-500/10 text-amber-700 border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200 dark:border-amber-500/30',
  },
  emerald: {
    icon: 'bg-emerald-500/10 text-emerald-500 ring-emerald-500/20',
    badge: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200 dark:border-emerald-500/30',
  },
  sky: {
    icon: 'bg-sky-500/10 text-sky-500 ring-sky-500/20',
    badge: 'bg-sky-500/10 text-sky-700 border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-200 dark:border-sky-500/30',
  },
  violet: {
    icon: 'bg-violet-500/10 text-violet-500 ring-violet-500/20',
    badge: 'bg-violet-500/10 text-violet-700 border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-200 dark:border-violet-500/30',
  },
};

const toneClasses = computed(() => toneMap[props.tone] || toneMap.primary);
const hasUnsavedChanges = computed(() => content.value !== lastSavedContent.value);
const formattedLastSavedAt = computed(() => {
  if (!lastSavedAt.value) return null;
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(lastSavedAt.value);
});

const statusBadge = computed(() => {
  if (loading.value) {
    return {
      label: 'Chargement du commentaire',
      icon: 'lucide:loader-2',
      classes: 'bg-amber-500/10 text-amber-700 border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200 dark:border-amber-500/30',
    };
  }
  if (saving.value) {
    return {
      label: 'Sauvegarde en cours',
      icon: 'lucide:loader-2',
      classes: 'bg-primary-500/10 text-primary-600 border-primary-500/20 dark:bg-primary-500/10 dark:text-primary-200 dark:border-primary-500/30',
    };
  }
  if (hasUnsavedChanges.value) {
    return {
      label: 'Modifications non enregistrées',
      icon: 'lucide:alert-triangle',
      classes: 'bg-amber-500/10 text-amber-700 border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200 dark:border-amber-500/30',
    };
  }
  if (lastSavedAt.value) {
    return {
      label: 'Dernière version sauvegardée',
      icon: 'lucide:check',
      classes: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200 dark:border-emerald-500/30',
    };
  }
  return null;
});

const resetEditor = () => {
  content.value = '';
  lastSavedContent.value = '';
  lastSavedAt.value = null;
};

const clearAutoSaveTimer = () => {
  if (autoSaveTimer.value) {
    clearTimeout(autoSaveTimer.value);
    autoSaveTimer.value = null;
  }
};

const loadCommentaire = async () => {
  if (!props.chantier?.id) return;
  loading.value = true;
  try {
    const commentaire = await getCommentaire(props.chantier.id, props.typeKey);
    content.value = commentaire?.content || '';
    lastSavedContent.value = commentaire?.content || '';
    lastSavedAt.value = commentaire?.updated_at
      ? new Date(commentaire.updated_at)
      : commentaire?.created_at
        ? new Date(commentaire.created_at)
        : commentaire
          ? new Date()
          : null;
  } catch (err) {
    console.error('Erreur lors du chargement du commentaire :', err);
  } finally {
    loading.value = false;
  }
};

const handleSave = async (mode = 'manual') => {
  if (!props.chantier?.id || saving.value) return;

  saving.value = true;
  clearAutoSaveTimer();

  try {
    await saveCommentaire(props.chantier.id, props.typeKey, content.value);
    lastSavedContent.value = content.value;
    lastSavedAt.value = new Date();
    addToast({
      title: mode === 'manual' ? 'Commentaire enregistré' : 'Sauvegarde automatique',
      message: mode === 'manual'
        ? 'Le commentaire a été enregistré avec succès.'
        : 'Le commentaire a été sauvegardé automatiquement.',
      type: 'Success',
    });
  } catch (err) {
    console.error('Erreur lors de l’enregistrement du commentaire :', err);
  } finally {
    saving.value = false;
  }
};

watch(
  () => props.chantier?.id,
  (newId, oldId) => {
    if (!newId) {
      resetEditor();
      return;
    }
    if (newId !== oldId) {
      clearAutoSaveTimer();
      resetEditor();
      loadCommentaire();
    }
  },
  { immediate: true }
);

watch(content, () => {
  if (!props.chantier?.id) return;
  clearAutoSaveTimer();

  if (!hasUnsavedChanges.value) return;

  autoSaveTimer.value = setTimeout(() => {
    if (hasUnsavedChanges.value) {
      handleSave('auto');
    }
  }, 5000);
});

onBeforeUnmount(() => {
  clearAutoSaveTimer();
});
</script>

<template>
  <div class="space-y-5">
   
      <div class="flex flex-col gap-5 ">
        <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div class="flex items-start gap-4">

            <div class="flex-1">
              <AppTitleMain :title="title" :description="description" />
            </div>
          </div>
          <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-4">
            <p v-if="formattedLastSavedAt" class="text-xs text-gray-500 dark:text-gray-400">
              Dernière sauvegarde<br>
              <span class="font-semibold text-gray-900 dark:text-gray-100">
                {{ formattedLastSavedAt }}
              </span>
            </p>
            <AppButtonValidated
              type="button"
              theme="primary"
              :validated="Boolean(props.chantier?.id)"
              @click="handleSave('manual')"
            >
              <template #default>
                <span class="flex items-center gap-2 text-sm">
                  <Icon
                    :name="saving ? 'lucide:loader-2' : 'lucide:save'"
                    size="16"
                    :class="saving ? 'animate-spin' : ''"
                  />
                  {{ saving ? 'Enregistrement...' : 'Enregistrer' }}
                </span>
              </template>
            </AppButtonValidated>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <span
            v-if="statusBadge"
            class="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium"
            :class="statusBadge.classes"
          >
            <Icon :name="statusBadge.icon" size="14" :class="statusBadge.icon === 'lucide:loader-2' ? 'animate-spin' : ''" />
            {{ statusBadge.label }}
          </span>
          <span class="text-xs text-gray-400 dark:text-gray-500">
            Sauvegarde automatique après 5 secondes d’inactivité.
          </span>
        </div>
      </div>


    <div class="rounded-lg border  border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/70 shadow-md">
      <div v-if="loading" class="flex h-[420px] flex-col items-center justify-center gap-3 text-gray-400 dark:text-gray-500">
        <Icon name="lucide:loader-2" size="32" class="animate-spin" />
        <p class="text-sm font-medium">Chargement du commentaire...</p>
      </div>
      <div v-else class="">

     
        
            <QuillEditor v-model="content"  class="h-full border-0"/>
        
 
      </div>
    </div>
  </div>
</template>


