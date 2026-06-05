<script setup>
// Chrome commun des pages logistique : en-tête (icône + titre), badge lecture seule,
// bouton Enregistrer, et zone de contenu affichée une fois les données chargées.
defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  icon: { type: String, default: 'lucide:truck' },
  canEdit: { type: Boolean, default: false },
  ready: { type: Boolean, default: false }
})

defineEmits(['save'])
</script>

<template>
  <div class="flex h-full flex-col overflow-auto bg-gray-50 dark:bg-gray-950">
    <div class="flex flex-wrap items-center justify-between gap-3 p-4">
      <div class="flex items-center gap-3">
        <div
          class="bg-primary-100 text-primary-600 dark:bg-slate-700 dark:text-slate-200 flex h-11 w-11 items-center justify-center rounded-xl">
          <Icon :name="icon" size="22" />
        </div>
        <AppTitleMain :title="title" :description="description" />
      </div>
      <div class="flex items-center gap-2">
        <span
          v-if="!canEdit"
          class="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300">
          <Icon name="lucide:lock" size="14" />
          Lecture seule
        </span>
        <AppButtonValidated v-if="canEdit" type="button" theme="primary" @click="$emit('save')">
          <template #default>
            <span class="flex items-center gap-2">
              <Icon name="lucide:save" size="16" />
              Enregistrer
            </span>
          </template>
        </AppButtonValidated>
      </div>
    </div>

    <div v-if="ready" class="px-4 pb-8">
      <slot />
    </div>
  </div>
</template>
