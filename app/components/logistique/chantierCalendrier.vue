<script setup>
// Calendrier des chantiers « à installer ou en place » (base vie / radio), façon plan de charge :
// une ligne par chantier, barres colorées selon l'état de pose. Contrairement aux imprimantes / box,
// ces postes n'ont pas d'inventaire partagé → liste plate de chantiers (pas de regroupement par matériel).
const props = defineProps({
  chantiers: { type: Array, default: () => [] }, // cards { id, compte, name, date_rea, date_prepa, equipements }
  posteKey: { type: String, default: 'base_vie' }, // 'base_vie' | 'radios'
  title: { type: String, default: 'Calendrier' },
  print: { type: Boolean, default: false } // mode impression : masque les contrôles, grille compacte
})
const emit = defineEmits(['edit'])

const selectedYear = ref(new Date().getFullYear())
const previousYear = () => selectedYear.value--
const nextYear = () => selectedYear.value++

const weeks = computed(() => Array.from({ length: 53 }, (_, i) => ({ number: i + 1, label: `${i + 1}` })))

const monthNames = ['Janv.', 'Fév.', 'Mars', 'Avril', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.']

const getThursdayOfWeek = (weekNumber, year) => {
  const jan4 = new Date(year, 0, 4)
  const dayOfWeek = jan4.getDay() || 7
  const monday = new Date(jan4)
  monday.setDate(jan4.getDate() - dayOfWeek + 1)
  const targetMonday = new Date(monday)
  targetMonday.setDate(monday.getDate() + (weekNumber - 1) * 7)
  const thursday = new Date(targetMonday)
  thursday.setDate(targetMonday.getDate() + 3)
  return thursday
}

const monthsWithColspan = computed(() => {
  const year = selectedYear.value
  const weeksByMonth = Array(12).fill(0)
  for (let week = 1; week <= 53; week++) {
    const thursday = getThursdayOfWeek(week, year)
    const thursdayYear = thursday.getFullYear()
    const month = thursday.getMonth()
    if (thursdayYear === year) weeksByMonth[month]++
    else if (thursdayYear < year) weeksByMonth[0]++
    else weeksByMonth[11]++
  }
  return monthNames.map((name, index) => ({ name, colspan: weeksByMonth[index] })).filter((m) => m.colspan > 0)
})

const getWeekNumber = (date) => {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 4 - (d.getDay() || 7))
  const yearStart = new Date(d.getFullYear(), 0, 1)
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7)
}

const chantierRange = (c) => {
  const starts = []
  const ends = []
  ;(c.date_rea || []).forEach((r) => {
    if (r.date_start_travaux) starts.push(+new Date(r.date_start_travaux))
    if (r.date_end_travaux) ends.push(+new Date(r.date_end_travaux))
  })
  ;(c.date_prepa || []).forEach((p) => {
    if (p.date_start_prepa) starts.push(+new Date(p.date_start_prepa))
    if (p.date_end_prepa) ends.push(+new Date(p.date_end_prepa))
  })
  if (!starts.length) return null
  return { start: Math.min(...starts), end: ends.length ? Math.max(...ends) : Math.min(...starts) }
}

const inSelectedYear = (c) => {
  const r = chantierRange(c)
  if (!r) return true
  const yStart = +new Date(selectedYear.value, 0, 1)
  const yEnd = +new Date(selectedYear.value, 11, 31, 23, 59, 59, 999)
  return r.start <= yEnd && r.end >= yStart
}

// Catégorie du poste (base vie / radio suivent le même cycle besoin -> pose -> dépose).
const bucketOf = (c) => {
  const p = c.equipements?.[props.posteKey]
  if (!p) return 'a_definir'
  if (p.besoin === false) return 'pas_besoin'
  if (p.besoin !== true) return 'a_definir'
  if (p.depose?.status === 2) return 'retiree'
  if (p.pose?.status === 2) return 'installee'
  return 'a_installer'
}

// Couleur de la barre selon l'état de pose : posée → vert, engagée (date prévue ou
// commentaire saisi sans avoir coché « posé ») → orange, sinon → à installer (rouge).
const installColor = (c) => POSE_BAR_COLORS[slotProgress(c.equipements?.[props.posteKey]?.pose)]

// Chantiers « à installer ou en place » de l'année, triés par début de chantier.
const rows = computed(() =>
  props.chantiers
    .filter((c) => ['a_installer', 'installee'].includes(bucketOf(c)))
    .filter(inSelectedYear)
    .sort((a, b) => {
      const ra = chantierRange(a)
      const rb = chantierRange(b)
      if (!ra && !rb) return (a.compte || '').localeCompare(b.compte || '')
      if (!ra) return 1
      if (!rb) return -1
      return ra.start - rb.start
    })
)

const onEdit = (chantier) => emit('edit', chantier)
</script>

<template>
  <div
    class="border-primary-200 overflow-hidden rounded-xl border bg-white print:break-inside-avoid print:overflow-visible dark:bg-slate-900">
    <div class="border-primary-100 flex flex-wrap items-center gap-2 border-b px-4 py-3 dark:border-slate-700">
      <Icon name="lucide:calendar-range" size="18" class="text-primary-500" />
      <h3 class="text-primary-800 font-semibold dark:text-white">{{ title }}</h3>
      <span class="text-primary-400 text-xs">Chantiers à installer ou en place</span>
      <!-- Légende : couleur des barres = état de pose -->
      <div class="text-primary-600 ml-auto flex flex-wrap items-center gap-3 text-xs dark:text-gray-300">
        <span class="flex items-center gap-1.5">
          <span class="h-2.5 w-3 rounded-xs border border-green-700 bg-green-500"></span>En place
        </span>
        <span class="flex items-center gap-1.5">
          <span class="h-2.5 w-3 rounded-xs border border-orange-700 bg-orange-500"></span>En cours
        </span>
        <span class="flex items-center gap-1.5">
          <span class="h-2.5 w-3 rounded-xs border border-red-700 bg-red-500"></span>À installer
        </span>
      </div>
    </div>

    <div class="poste-cal-scroll overflow-x-auto overflow-y-hidden pb-2">
      <div
        class="poste-cal-grid grid min-w-[1200px] print:min-w-0"
        style="grid-template-columns: minmax(260px, auto) repeat(53, minmax(20px, 1fr))">
        <!-- Header sticky : année + mois + semaines -->
        <div class="bg-primary-50 sticky top-0 z-30 col-span-full grid grid-cols-subgrid" style="grid-row: span 2">
          <div
            class="bg-primary-50 border-primary-200 sticky left-0 z-40 row-span-2 flex items-center justify-center border-r border-b px-3 py-2">
            <button
              v-if="!print"
              @click="previousYear"
              class="flex cursor-pointer items-center rounded-l-lg px-2 text-gray-600 transition-colors hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700"
              title="Année précédente">
              <Icon name="lucide:chevron-left" size="18" />
            </button>
            <span class="px-2 text-base font-semibold text-gray-700 dark:text-white">{{ selectedYear }}</span>
            <button
              v-if="!print"
              @click="nextYear"
              class="flex cursor-pointer items-center rounded-r-lg px-2 text-gray-600 transition-colors hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700"
              title="Année suivante">
              <Icon name="lucide:chevron-right" size="18" />
            </button>
          </div>

          <div
            v-for="(month, index) in monthsWithColspan"
            :key="'m-' + index"
            :style="{ gridColumn: `span ${month.colspan}` }"
            class="border-primary-200 bg-primary-100 text-primary-700 border-x border-b px-1 py-1 text-center text-xs font-semibold">
            {{ month.name }}
          </div>

          <div
            v-for="week in weeks"
            :key="'wh-' + week.number"
            class="flex min-w-5 items-center justify-center text-center text-xs font-medium text-gray-500 dark:text-gray-400"
            :class="{
              'bg-primary-100 dark:bg-primary-900/30 text-primary-700 font-semibold':
                week.number === getWeekNumber(new Date()) && selectedYear === new Date().getFullYear()
            }">
            {{ week.label }}
          </div>
        </div>

        <!-- Une ligne par chantier -->
        <ChantierTimelineGridRow
          v-for="chantier in rows"
          :key="chantier.id"
          :chantier="chantier"
          :weeks="weeks"
          :user="{ email: '', nom: '', prenom: '' }"
          :can-delete="false"
          :selected-year="selectedYear"
          :show-contacts="false"
          :clickable="!print"
          :color-override="installColor(chantier)"
          @week-click="onEdit" />

        <div v-if="!rows.length" class="col-span-full p-8 text-center">
          <span class="text-primary-400 text-sm">Aucun chantier à installer ou en place.</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@media print {
  /* La grille large devient une grille fluide qui tient sur la largeur de la page. */
  .poste-cal-scroll {
    overflow: visible !important;
  }
  .poste-cal-grid {
    grid-template-columns: 150px repeat(53, minmax(0, 1fr)) !important;
    min-width: 0 !important;
  }
  /* Les en-têtes de semaine ne forcent plus de largeur minimale. */
  .poste-cal-grid .min-w-5 {
    min-width: 0 !important;
  }
}
</style>
