<script setup>
// Calendrier générique (imprimantes / box réseau), façon plan de charge RLT :
// une ligne par matériel, les chantiers où il est installé en barres,
// pour repérer les chevauchements d'un même matériel.
const props = defineProps({
  items: { type: Array, default: () => [] }, // [{ id, identification, name }]
  chantiers: { type: Array, default: () => [] }, // cards { id, compte, name, etat, date_rea, date_prepa, equipements }
  posteKey: { type: String, default: 'imprimante' }, // 'imprimante' | 'wifi'
  title: { type: String, default: 'Calendrier' },
  print: { type: Boolean, default: false } // mode impression : masque les contrôles, grille compacte
})
const emit = defineEmits(['assign', 'remove'])

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

const idsOf = (c) => c.equipements?.[props.posteKey]?.ids || []

// Couleur de la barre selon l'état d'installation du matériel sur ce chantier
// (et non selon le statut du chantier) : retirée → gris, installée → vert, sinon → à installer (rouge).
const installColor = (c) => {
  const poste = c.equipements?.[props.posteKey]
  if (poste?.depose?.status === 2) return 'bg-slate-400 border border-slate-600'
  if (poste?.pose?.status === 2) return 'bg-green-500 border border-green-700'
  return 'bg-red-500 border border-red-700'
}

// Une ligne par matériel : chantiers rattachés (de l'année) + détection de chevauchement
const rows = computed(() =>
  props.items.map((item) => {
    const chantiers = props.chantiers.filter((c) => idsOf(c).includes(item.id)).filter(inSelectedYear)
    const ranges = chantiers.map((c) => ({ id: c.id, r: chantierRange(c) }))
    const conflictIds = new Set()
    for (let i = 0; i < ranges.length; i++) {
      for (let j = i + 1; j < ranges.length; j++) {
        const a = ranges[i].r
        const b = ranges[j].r
        if (a && b && a.start <= b.end && b.start <= a.end) {
          conflictIds.add(ranges[i].id)
          conflictIds.add(ranges[j].id)
        }
      }
    }
    return { item, chantiers, hasConflict: conflictIds.size > 0 }
  })
)

// Picker "+ ajouter un chantier"
const showPicker = ref(false)
const pickerItem = ref(null)
const pickerSearch = ref('')
const openPicker = (item) => {
  pickerItem.value = item
  pickerSearch.value = ''
  showPicker.value = true
}
const availableChantiers = computed(() => {
  if (!pickerItem.value) return []
  const q = pickerSearch.value.trim().toLowerCase()
  return props.chantiers
    .filter((c) => !idsOf(c).includes(pickerItem.value.id))
    .filter((c) => !q || c.compte?.toLowerCase().includes(q) || c.name?.toLowerCase().includes(q))
})
const assign = (chantier) => {
  emit('assign', { itemId: pickerItem.value.id, chantierId: chantier.id })
  showPicker.value = false
}
const onRemove = (itemId, chantierId) => emit('remove', { itemId, chantierId })
</script>

<template>
  <div
    class="border-primary-200 overflow-hidden rounded-xl border bg-white print:break-inside-avoid print:overflow-visible dark:bg-slate-900">
    <div class="border-primary-100 flex flex-wrap items-center gap-2 border-b px-4 py-3 dark:border-slate-700">
      <Icon name="lucide:calendar-range" size="18" class="text-primary-500" />
      <h3 class="text-primary-800 font-semibold dark:text-white">{{ title }}</h3>
      <span class="text-primary-400 text-xs">Chevauchements d'un même matériel</span>
      <!-- Légende : couleur des barres = état d'installation -->
      <div class="text-primary-600 ml-auto flex flex-wrap items-center gap-3 text-xs dark:text-gray-300">
        <span class="flex items-center gap-1.5">
          <span class="h-2.5 w-3 rounded-xs border border-green-700 bg-green-500"></span>Installée
        </span>
        <span class="flex items-center gap-1.5">
          <span class="h-2.5 w-3 rounded-xs border border-red-700 bg-red-500"></span>À installer
        </span>
        <span class="flex items-center gap-1.5">
          <span class="h-2.5 w-3 rounded-xs border border-slate-600 bg-slate-400"></span>Retirée
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

        <!-- Lignes par matériel -->
        <template v-for="row in rows" :key="row.item.id">
          <div class="col-span-full grid grid-cols-subgrid items-center border-t border-slate-200 dark:border-slate-700">
            <div class="bg-primary-50 border-primary-200 sticky left-0 z-20 border-r px-3 py-2 dark:bg-slate-800">
              <div class="flex items-center gap-2">
                <span
                  v-if="row.item.identification"
                  class="rounded-md bg-teal-600 px-2 py-0.5 font-mono text-xs font-semibold text-white">
                  {{ row.item.identification }}
                </span>
                <span class="truncate text-sm font-semibold text-gray-800 dark:text-white">{{ row.item.name }}</span>
                <span
                  v-if="row.hasConflict"
                  class="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700 dark:bg-red-900/40 dark:text-red-300"
                  title="Chevauchement sur plusieurs chantiers">
                  <Icon name="lucide:triangle-alert" size="12" />
                  Chevauchement
                </span>
                <button
                  v-if="!print"
                  type="button"
                  @click="openPicker(row.item)"
                  class="text-primary-700 hover:text-primary-900 ml-auto cursor-pointer transition-colors"
                  title="Ajouter un chantier">
                  <Icon name="lucide:plus" size="16" />
                </button>
              </div>
            </div>
            <div style="grid-column: span 53" class="text-end">
              <span class="text-primary-500 mr-2 text-xs italic">
                {{ row.chantiers.length }} chantier{{ row.chantiers.length > 1 ? 's' : '' }}
              </span>
            </div>
          </div>

          <ChantierTimelineGridRow
            v-for="chantier in row.chantiers"
            :key="`${row.item.id}-${chantier.id}`"
            :chantier="chantier"
            :weeks="weeks"
            :user="{ email: '', nom: row.item.name, prenom: '' }"
            :can-delete="true"
            :selected-year="selectedYear"
            :show-contacts="false"
            :clickable="false"
            :color-override="installColor(chantier)"
            @delete-chantier="(id) => onRemove(row.item.id, id)" />

          <div v-if="row.chantiers.length === 0" class="col-span-full grid grid-cols-subgrid items-center">
            <div class="border-primary-200 bg-primary-50 sticky left-0 z-20 border-r px-3 pl-6 dark:bg-slate-800">
              <span class="text-xs text-gray-400 italic dark:text-gray-500">Aucun chantier</span>
            </div>
          </div>
        </template>

        <div v-if="!rows.length" class="col-span-full p-8 text-center">
          <span class="text-primary-400 text-sm">Aucun matériel dans l'inventaire.</span>
        </div>
      </div>
    </div>

    <!-- Modal d'ajout d'un chantier -->
    <AppModal v-model="showPicker" size="lg">
      <template #header>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          Ajouter un chantier
          <span v-if="pickerItem" class="text-primary-500 text-sm font-normal">— {{ pickerItem.name }}</span>
        </h3>
      </template>
      <template #default>
        <div class="space-y-3">
          <AppInputSearch v-model="pickerSearch" placeholder="Rechercher un chantier ..." />
          <div v-if="availableChantiers.length" class="flex max-h-80 flex-col gap-1.5 overflow-y-auto">
            <button
              v-for="c in availableChantiers"
              :key="c.id"
              type="button"
              @click="assign(c)"
              class="border-primary-200 hover:border-primary-400 hover:bg-primary-50 flex items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors dark:border-slate-700 dark:hover:bg-slate-800">
              <span class="bg-primary-100 text-primary-700 rounded px-1.5 py-0.5 text-xs font-bold dark:bg-slate-700 dark:text-gray-200">
                {{ c.compte }}
              </span>
              <span class="text-primary-800 truncate text-sm font-medium dark:text-gray-100">{{ c.name }}</span>
            </button>
          </div>
          <p v-else class="py-6 text-center text-sm text-gray-500">Aucun chantier disponible.</p>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end">
          <AppButtonValidated type="button" theme="cancel" @click="showPicker = false">
            <template #default><span>Fermer</span></template>
          </AppButtonValidated>
        </div>
      </template>
    </AppModal>
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
