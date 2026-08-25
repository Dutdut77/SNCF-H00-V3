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
      class="group border-primary-200 bg-primary-50 hover:border-secondary-300 relative cursor-pointer overflow-hidden rounded-xl border shadow-sm transition-all duration-300 hover:shadow-lg"
      @click="emit('open', chantier.id)">
      <div class="flex h-full flex-col p-4">
        <!-- En-tête : référence + statut -->
        <div class="mb-3 flex items-start justify-between gap-2">
          <span class="bg-primary-100 text-primary-700 rounded-md px-2 py-1 font-mono text-sm font-bold">
            {{ chantier.compte }}
          </span>
          <span
            class="rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap"
            :class="[getEtatInfo(chantier.etat).bgLight, getEtatInfo(chantier.etat).textColor]">
            {{ getEtatInfo(chantier.etat).label }}
          </span>
        </div>

        <!-- Nom -->
        <h3 class="text-primary-800 mb-3 line-clamp-2 text-lg font-semibold">
          {{ chantier.name }}
        </h3>

        <!-- Site / ligne -->
        <div class="mb-3 flex flex-wrap items-center gap-1.5">
          <span
            v-if="props.siteLabel(chantier)"
            class="bg-primary-100 text-primary-600 rounded-full px-2 py-0.5 text-xs font-medium">
            {{ props.siteLabel(chantier) }}
          </span>
          <span
            v-if="chantier.ligne"
            class="bg-primary-100 text-primary-600 rounded-full px-2 py-0.5 text-xs font-medium">
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
        <div class="border-primary-200 mt-auto flex items-center justify-between border-t pt-3">
          <button
            type="button"
            class="text-primary-600 hover:text-secondary-600 flex cursor-pointer items-center gap-1 text-sm font-medium transition-colors"
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

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
