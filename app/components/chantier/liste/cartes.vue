<script setup>
const props = defineProps({
  chantiers: { type: Array, default: () => [] },
  siteLabel: { type: Function, required: true },
  canEdit: { type: Boolean, default: false }
})

const emit = defineEmits(['open', 'edit'])

const { getEtatInfo } = useEtatChantier()
const { formatDate, getFirstReaDate, getLastReaDate } = useChantierDates()
</script>

<template>
  <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
    <div
      v-for="chantier in props.chantiers"
      :key="chantier.id"
      class="surface-card hover:surface-raised group relative flex cursor-pointer flex-col overflow-hidden rounded-xl transition-shadow"
      @click="emit('open', chantier.id)">
      <!-- En-tête discret (design V4) : gris très clair séparé par un filet, référence + statut ; l'étiquette
           de compte est celle des tableaux -->
      <div class="border-rule flex items-center justify-between gap-2 border-b bg-slate-50 px-4 py-3 dark:bg-white/4">
        <span
          class="bg-magenta-50 text-magenta-700 dark:bg-secondary-400/14 dark:text-secondary-300 rounded px-2 py-0.5 text-[0.8125rem] font-bold tabular-nums">
          {{ chantier.compte }}
        </span>
        <span
          class="rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap"
          :class="[getEtatInfo(chantier.etat).bgLight, getEtatInfo(chantier.etat).textColor]">
          {{ getEtatInfo(chantier.etat).label }}
        </span>
      </div>

      <div class="flex flex-1 flex-col p-4">
        <!-- Nom -->
        <h3 class="text-magenta-900 mb-3 line-clamp-2 text-lg font-semibold dark:text-slate-100">
          {{ chantier.name }}
        </h3>

        <!-- Site / ligne -->
        <div class="mb-3 flex flex-wrap items-center gap-1.5">
          <span
            v-if="props.siteLabel(chantier)"
            class="bg-magenta-50 text-magenta-700 rounded-full px-2 py-0.5 text-xs font-medium dark:bg-white/10 dark:text-slate-200">
            {{ props.siteLabel(chantier) }}
          </span>
          <span
            v-if="chantier.ligne"
            class="bg-magenta-50 text-magenta-700 rounded-full px-2 py-0.5 text-xs font-medium dark:bg-white/10 dark:text-slate-200">
            Ligne {{ chantier.ligne }}
          </span>
        </div>

        <!-- Période -->
        <div v-if="getFirstReaDate(chantier)" class="text-primary-600 mb-3 flex items-center gap-2 text-sm">
          <Icon name="lucide:calendar" size="16" class="text-primary-400" />
          <span>{{ formatDate(getFirstReaDate(chantier)) }}</span>
          <template v-if="getLastReaDate(chantier) && getLastReaDate(chantier) !== getFirstReaDate(chantier)">
            <Icon name="lucide:arrow-right" size="14" class="text-primary-400" />
            <span>{{ formatDate(getLastReaDate(chantier)) }}</span>
          </template>
        </div>
        <div v-else class="text-primary-400 mb-3 flex items-center gap-2 text-sm italic">
          <Icon name="lucide:calendar-x" size="16" />
          <span>Aucune date de réalisation</span>
        </div>

        <!-- Actions -->
        <div
          class="mt-auto flex items-center justify-between border-t border-slate-900/[0.08] pt-3 dark:border-white/10">
          <button
            type="button"
            class="flex cursor-pointer items-center gap-1 text-sm font-semibold text-slate-700 transition-colors hover:text-slate-900 dark:text-slate-200 dark:hover:text-white"
            @click.stop="emit('open', chantier.id)">
            <Icon name="lucide:eye" size="16" />
            Voir détails
          </button>
          <button
            v-if="props.canEdit"
            type="button"
            class="text-primary-500 hover:text-primary-700 flex cursor-pointer items-center gap-1 text-sm font-medium transition-colors"
            @click.stop="emit('edit', chantier)">
            <Icon name="lucide:pencil" size="16" />
            Modifier
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
