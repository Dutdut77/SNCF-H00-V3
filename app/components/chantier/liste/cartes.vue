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
      <!-- Bandeau vert d'eau (design V4) : référence + statut, comme le haut des cartes de connexion -->
      <div class="bg-aqua flex items-center justify-between gap-2 px-4 py-3">
        <span
          class="text-petrol-800 rounded bg-white/65 px-2 py-0.5 text-[0.8125rem] font-bold tabular-nums dark:bg-white/12 dark:text-white">
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
        <h3 class="text-petrol-900 mb-3 line-clamp-2 text-lg font-semibold dark:text-slate-100">
          {{ chantier.name }}
        </h3>

        <!-- Site / ligne -->
        <div class="mb-3 flex flex-wrap items-center gap-1.5">
          <span
            v-if="props.siteLabel(chantier)"
            class="bg-petrol-50 text-petrol-700 rounded-full px-2 py-0.5 text-xs font-medium dark:bg-white/10 dark:text-slate-200">
            {{ props.siteLabel(chantier) }}
          </span>
          <span
            v-if="chantier.ligne"
            class="bg-petrol-50 text-petrol-700 rounded-full px-2 py-0.5 text-xs font-medium dark:bg-white/10 dark:text-slate-200">
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
            class="text-petrol-700 hover:text-secondary-600 dark:text-secondary-300 flex cursor-pointer items-center gap-1 text-sm font-semibold transition-colors"
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
