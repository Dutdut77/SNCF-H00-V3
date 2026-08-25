<script setup>
// Vue Planning : frise annuelle des périodes (préparation / réalisation / week-ends).
// Réutilise ChantierTimelineGridRow, la ligne déjà employée par les plans de charge,
// en configuration minimale (ni contacts ni colonnes site) pour rester lisible ici.
const props = defineProps({
  chantiers: { type: Array, default: () => [] },
  canEdit: { type: Boolean, default: false }
})

const emit = defineEmits(['edit'])

const annee = defineModel('annee', { default: () => new Date().getFullYear() })

const { weeks, getWeekNumber, getMonthsWithColspan } = useCalendrierSemaines()
const { isChantierVisibleForYear } = useChantierDates()

const monthsWithColspan = computed(() => getMonthsWithColspan(annee.value))

// Un chantier sans réalisation, préparation ni week-end sur l'année affichée
// n'aurait qu'une ligne vide : on ne le liste pas.
const chantiersDeLAnnee = computed(() =>
  props.chantiers.filter((chantier) => isChantierVisibleForYear(chantier, annee.value))
)

const nbMasques = computed(() => props.chantiers.length - chantiersDeLAnnee.value.length)

// Colonne 1 (chantier) + 53 semaines. La ligne s'y aligne via grid-cols-subgrid.
const gridTemplateColumns = 'minmax(280px, auto) repeat(53, minmax(20px, 1fr))'

const semaineCourante = computed(() => getWeekNumber(new Date()))
const estAnneeCourante = computed(() => annee.value === new Date().getFullYear())
</script>

<template>
  <div class="border-primary-200 max-h-full overflow-auto rounded-xl border bg-white dark:bg-slate-900">
    <!-- gap-y : aère les lignes ici seulement. ChantierTimelineGridRow est partagé avec les
         plans de charge, son gabarit reste inchangé. L'entête, qui couvre les 2 premières
         lignes, absorbe l'écart dans sa propre hauteur. -->
    <div class="grid min-w-[1100px] gap-y-2" :style="{ gridTemplateColumns }">
      <!-- ===== Entête collant (2 lignes) ===== -->
      <div class="col-span-full grid grid-cols-subgrid bg-white dark:bg-slate-900 sticky top-0 z-30" style="grid-row: span 2">
        <!-- Navigation année, sur les 2 lignes -->
        <div
          class="border-primary-200 sticky left-0 z-40 row-span-2 flex items-center justify-center border-r border-b bg-white px-3 py-2 dark:bg-slate-900">
          <button
            type="button"
            class="text-primary-600 hover:bg-primary-200 flex cursor-pointer items-center rounded-l-lg px-2 transition-colors"
            title="Année précédente"
            @click="annee--">
            <Icon name="lucide:chevron-left" size="18" />
          </button>
          <span class="text-primary-700 px-2 text-base font-semibold">{{ annee }}</span>
          <button
            type="button"
            class="text-primary-600 hover:bg-primary-200 flex cursor-pointer items-center rounded-r-lg px-2 transition-colors"
            title="Année suivante"
            @click="annee++">
            <Icon name="lucide:chevron-right" size="18" />
          </button>
        </div>

        <!-- Ligne 1 : mois -->
        <div
          v-for="(month, index) in monthsWithColspan"
          :key="'month-' + index"
          :style="{ gridColumn: `span ${month.colspan}` }"
          class="border-primary-200 bg-primary-100 text-primary-700 border-x border-b px-1 py-1 text-center text-xs font-semibold">
          {{ month.name }}
        </div>

        <!-- Ligne 2 : numéros de semaine -->
        <div
          v-for="week in weeks"
          :key="'weekh-' + week.number"
          :data-week="week.number"
          class="text-primary-700 flex min-w-5 items-center justify-center px-0 text-center text-xs font-medium"
          :class="{ 'bg-primary-300 text-primary-800 font-semibold': week.number === semaineCourante && estAnneeCourante }">
          {{ week.label }}
        </div>
      </div>

      <!-- ===== Lignes chantiers ===== -->
      <ChantierTimelineGridRow
        v-for="chantier in chantiersDeLAnnee"
        :key="chantier.id"
        :chantier="chantier"
        :weeks="weeks"
        :selected-year="annee"
        :show-contacts="false"
        :show-site-info="false"
        :clickable="props.canEdit"
        @week-click="emit('edit', $event)" />

      <!-- Aucun chantier sur l'année affichée -->
      <div v-if="chantiersDeLAnnee.length === 0" class="col-span-full px-6 py-12 text-center">
        <Icon name="lucide:calendar-x" size="40" class="text-primary-300 mx-auto mb-3" />
        <p class="text-primary-500 text-sm font-medium">Aucun chantier planifié en {{ annee }}</p>
        <p v-if="props.chantiers.length > 0" class="text-primary-400 mt-1 text-xs">
          {{ props.chantiers.length }} chantier{{ props.chantiers.length > 1 ? 's' : '' }} dans la sélection, sur
          d'autres années.
        </p>
      </div>
    </div>

    <!-- Rappel discret : la sélection contient des chantiers hors de l'année affichée -->
    <p
      v-if="chantiersDeLAnnee.length > 0 && nbMasques > 0"
      class="text-primary-400 border-primary-100 border-t px-4 py-2 text-xs">
      {{ nbMasques }} chantier{{ nbMasques > 1 ? 's' : '' }} de la sélection {{ nbMasques > 1 ? 'ne sont' : "n'est" }}
      pas planifié{{ nbMasques > 1 ? 's' : '' }} en {{ annee }}.
    </p>
  </div>
</template>
