<script setup>
// Confirmation d'une action (design V4), le plus souvent une suppression : pastille d'icône, titre, message
// (slot), puis Annuler et le bouton d'action. Action destructive (`danger`, par défaut) : bouton liseré rouge.
//   <AppConfirmModal v-model="ouvert" title="Supprimer le secteur" :loading="suppression" @confirm="supprimer">
//     Le secteur « UTM » sera supprimé.
//   </AppConfirmModal>
const model = defineModel({ type: Boolean, default: false })

const props = defineProps({
  title: { type: String, required: true },
  confirmLabel: { type: String, default: 'Supprimer' },
  // Icône de la pastille ; par défaut une corbeille pour une action destructive
  icon: { type: String, default: '' },
  danger: { type: Boolean, default: true },
  // Action en cours : la fenêtre reste ouverte et les boutons inactifs
  loading: { type: Boolean, default: false }
})

const emit = defineEmits(['confirm', 'cancel'])

const annuler = () => {
  model.value = false
  emit('cancel')
}
</script>

<template>
  <AppModal v-model="model" size="md" :persistent="props.loading" :show-close-button="false" @close="emit('cancel')">
    <template #header>
      <div class="flex items-center gap-3.5">
        <span
          class="flex size-11 shrink-0 items-center justify-center rounded-full"
          :class="
            props.danger
              ? 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-300'
              : 'text-magenta-700 bg-slate-100 dark:bg-white/10 dark:text-white'
          ">
          <Icon :name="props.icon || (props.danger ? 'lucide:trash-2' : 'lucide:circle-help')" size="20" />
        </span>
        <h3 class="text-ink text-lg leading-snug font-semibold">{{ props.title }}</h3>
      </div>
    </template>

    <div class="text-ink-soft text-sm leading-relaxed">
      <slot />
    </div>

    <template #footer>
      <div class="flex justify-end gap-2 pt-2">
        <AppButtonValidated theme="outline" type="button" :validated="!props.loading" @click="annuler">
          <template #default>Annuler</template>
        </AppButtonValidated>
        <AppButtonValidated
          :theme="props.danger ? 'outline-danger' : 'brand'"
          type="button"
          :validated="!props.loading"
          @click="emit('confirm')">
          <template #default>
            <span class="flex items-center gap-2">
              <Icon v-if="props.loading" name="lucide:loader-circle" size="16" class="animate-spin" />
              {{ props.confirmLabel }}
            </span>
          </template>
        </AppButtonValidated>
      </div>
    </template>
  </AppModal>
</template>
