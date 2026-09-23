<script setup>
const props = defineProps({
  chantiers: { type: Array, default: () => [] },
  // (chantier) => { nom, prenom } | null
  chefDeProjetDe: { type: Function, required: true },
  siteLabel: { type: Function, required: true },
  colonnes: { type: Object, default: () => ({ site: true, ligne: true, chefProjet: true }) },
  sortKey: { type: String, default: 'date' },
  sortDir: { type: String, default: 'desc' },
  canEdit: { type: Boolean, default: false }
})

const emit = defineEmits(['sort', 'open', 'edit'])

// Action du menu d'une ligne : le menu se referme d'abord, sinon il resterait par-dessus la fiche latérale
const agir = (close, evenement, valeur) => {
  close()
  emit(evenement, valeur)
}

const { getEtatInfo } = useEtatChantier()
const { formatDate, getFirstReaDate, getLastReaDate } = useChantierDates()

const colonnesTriables = { compte: 'Compte', name: 'Chantier', date: 'Période' }

const caret = (key) => {
  if (props.sortKey !== key) return 'lucide:chevrons-up-down'
  return props.sortDir === 'asc' ? 'lucide:chevron-up' : 'lucide:chevron-down'
}

const nomAffiche = (personne) => {
  if (!personne) return null
  const initiale = personne.prenom ? `${personne.prenom[0]}. ` : ''
  return `${initiale}${personne.nom || personne.email}`
}
</script>

<template>
  <!-- Conteneur de défilement (les deux axes) : l'en-tête `sticky` se cale dessus -->
  <div class="surface-card max-h-full overflow-auto rounded-xl">
    <table class="w-full min-w-max text-sm">
      <!-- En-tête vert d'eau (design V4), comme le tableau des Tâches -->
      <thead class="bg-table-head text-table-head-ink sticky top-0 z-10">
        <tr class="text-[0.78rem]">
          <th
            v-for="(label, key) in colonnesTriables"
            :key="key"
            class="cursor-pointer px-4 py-3 text-left font-semibold whitespace-nowrap select-none"
            @click="emit('sort', key)">
            <span class="inline-flex items-center gap-1">
              {{ label }}
              <Icon :name="caret(key)" size="14" :class="props.sortKey === key ? '' : 'opacity-45'" />
            </span>
          </th>
          <th class="px-4 py-3 text-center font-semibold whitespace-nowrap">Statut</th>
          <th v-if="props.colonnes.site" class="px-4 py-3 text-left font-semibold whitespace-nowrap">Secteur</th>
          <th v-if="props.colonnes.ligne" class="px-4 py-3 text-left font-semibold whitespace-nowrap">Ligne</th>
          <th v-if="props.colonnes.chefProjet" class="px-4 py-3 text-left font-semibold whitespace-nowrap">
            Chef de projet
          </th>
          <th class="w-12 px-4 py-3 text-right font-semibold whitespace-nowrap">Actions</th>
        </tr>
      </thead>

      <tbody class="divide-y divide-slate-900/[0.07] dark:divide-white/[0.07]">
        <tr
          v-for="chantier in props.chantiers"
          :key="chantier.id"
          class="hover:bg-petrol-50 text-primary-800 cursor-pointer transition-colors dark:hover:bg-white/[0.03]"
          @click="emit('open', chantier.id)">
          <!-- Compte -->
          <td class="px-4 py-3 whitespace-nowrap">
            <span
              class="bg-petrol-50 text-petrol-700 dark:bg-secondary-400/14 dark:text-secondary-300 inline-block rounded px-2 py-0.5 text-xs font-semibold tabular-nums">
              {{ chantier.compte }}
            </span>
          </td>

          <!-- Chantier -->
          <td class="text-primary-800 max-w-xs truncate px-4 py-3 font-medium">
            {{ chantier.name }}
          </td>

          <!-- Période -->
          <td class="text-primary-600 px-4 py-3 whitespace-nowrap">
            <template v-if="getFirstReaDate(chantier)">
              <span class="inline-flex items-center gap-1.5">
                {{ formatDate(getFirstReaDate(chantier)) }}
                <template v-if="getLastReaDate(chantier) && getLastReaDate(chantier) !== getFirstReaDate(chantier)">
                  <Icon name="lucide:arrow-right" size="13" class="text-primary-400" />
                  {{ formatDate(getLastReaDate(chantier)) }}
                </template>
              </span>
            </template>
            <span v-else class="text-primary-400 inline-flex items-center gap-1.5 italic">
              <Icon name="lucide:calendar-x" size="14" />
              Aucune date
            </span>
          </td>

          <!-- Statut : badges de largeur fixe, pour qu'ils s'alignent d'une ligne à l'autre -->
          <td class="px-4 py-3 text-center whitespace-nowrap">
            <span
              class="inline-flex w-[84px] justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
              :class="[getEtatInfo(chantier.etat).bgLight, getEtatInfo(chantier.etat).textColor]">
              {{ getEtatInfo(chantier.etat).label }}
            </span>
          </td>

          <!-- Site -->
          <td v-if="props.colonnes.site" class="px-4 py-3 whitespace-nowrap">
            <span
              v-if="props.siteLabel(chantier)"
              class="bg-petrol-50 text-petrol-700 rounded-full px-2.5 py-0.5 text-xs font-medium dark:bg-white/10 dark:text-slate-200">
              {{ props.siteLabel(chantier) }}
            </span>
            <span v-else class="text-primary-400">—</span>
          </td>

          <!-- Ligne -->
          <td v-if="props.colonnes.ligne" class="text-primary-600 px-4 py-3 whitespace-nowrap">
            {{ chantier.ligne || '—' }}
          </td>

          <!-- Chef de projet -->
          <td v-if="props.colonnes.chefProjet" class="px-4 py-3 whitespace-nowrap">
            <div v-if="props.chefDeProjetDe(chantier)" class="flex items-center gap-2">
              <AppAvatar
                :nom="props.chefDeProjetDe(chantier).nom"
                :prenom="props.chefDeProjetDe(chantier).prenom"
                size="xs"
                color="bg-secondary-500" />
              <span class="text-primary-700">{{ nomAffiche(props.chefDeProjetDe(chantier)) }}</span>
            </div>
            <span v-else class="text-primary-400">—</span>
          </td>

          <!-- Actions -->
          <td class="px-4 py-3 text-right" @click.stop>
            <AppDropdownMenu>
              <template #trigger>
                <button
                  type="button"
                  class="text-primary-500 hover:bg-primary-300 hover:text-primary-800 flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition-colors"
                  aria-label="Actions">
                  <Icon name="lucide:more-vertical" size="18" />
                </button>
              </template>

              <template #default="{ close }">
                <div class="flex w-44 flex-col">
                  <button
                    type="button"
                    class="text-primary-700 hover:bg-primary-100 flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-left text-sm"
                    @click="agir(close, 'open', chantier.id)">
                    <Icon name="lucide:eye" size="16" />
                    Voir détails
                  </button>
                  <button
                    v-if="props.canEdit"
                    type="button"
                    class="text-primary-700 hover:bg-primary-100 flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-left text-sm"
                    @click="agir(close, 'edit', chantier)">
                    <Icon name="lucide:pencil" size="16" />
                    Modifier
                  </button>
                </div>
              </template>
            </AppDropdownMenu>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
