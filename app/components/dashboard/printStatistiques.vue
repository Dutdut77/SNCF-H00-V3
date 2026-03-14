<script setup>
const props = defineProps({
  kpiRoles: { type: Array, required: true },
  allYears: { type: Array, required: true },
  barYearOptions: { type: Object, required: true },
  barYearSeries: { type: Array, required: true },
  stackedBarOptions: { type: Object, required: true },
  stackedBarSeries: { type: Array, required: true },
  printDate: { type: String, required: true }
})

// Options adaptées pour l'impression (barres plus fines, pas d'animation)
const printBarYearOptions = computed(() => ({
  ...props.barYearOptions,
  chart: { ...props.barYearOptions.chart, animations: { enabled: false } },
  plotOptions: { bar: { borderRadius: 2, columnWidth: '40%' } }
}))

const printStackedBarOptions = computed(() => ({
  ...props.stackedBarOptions,
  chart: { ...props.stackedBarOptions.chart, animations: { enabled: false } },
  plotOptions: { bar: { borderRadius: 2, columnWidth: '35%' } }
}))
</script>

<template>
  <div class="print-only">
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between border-b border-gray-300 pb-3">
      <div class="flex items-center gap-4">
        <img src="/images/logo_uo.png" alt="Uo Travaux" class="h-14" />
        <div>
          <h1 class="text-2xl font-bold text-gray-800">Statistiques Uo Travaux</h1>
          <p class="text-sm text-gray-500">{{ printDate }}</p>
        </div>
      </div>
    </div>

    <!-- KPI Cards -->
    <div class="mb-6 grid grid-cols-6 gap-3">
      <div
        v-for="kpi in kpiRoles"
        :key="kpi.label"
        class="rounded-lg border border-gray-300 p-3">
        <p class="text-xs font-medium uppercase tracking-wide text-gray-500">{{ kpi.label }}</p>
        <p class="mt-1 text-2xl font-bold" :class="kpi.color">{{ kpi.count }}</p>
      </div>
    </div>

    <!-- Graphs côte à côte -->
    <div class="grid grid-cols-2 gap-4">
      <div class="rounded-lg border border-gray-300 p-3">
        <h3 class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Chantiers & week-ends par année</h3>
        <ClientOnly>
          <apexchart v-if="allYears.length > 0" type="bar" height="260" width="100%" :options="printBarYearOptions" :series="barYearSeries" />
        </ClientOnly>
      </div>
      <div class="rounded-lg border border-gray-300 p-3">
        <h3 class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Répartition des états par année</h3>
        <ClientOnly>
          <apexchart v-if="allYears.length > 0" type="bar" height="260" width="100%" :options="printStackedBarOptions" :series="stackedBarSeries" />
        </ClientOnly>
      </div>
    </div>
  </div>
</template>

<style>
/* Hors écran mais rendu (pour que ApexCharts dessine les SVG) */
.print-only {
  position: fixed;
  left: -9999px;
  width: 277mm; /* A4 landscape - margins */
}
@media print {
  @page {
    size: landscape;
    margin: 10mm;
  }
  .print-only {
    position: static;
    left: auto;
    width: auto;
  }
  nav,
  footer {
    display: none !important;
  }
  body {
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
  body,
  #__nuxt,
  #__nuxt > div,
  main,
  main > div {
    overflow: visible !important;
    height: auto !important;
    max-height: none !important;
  }
  ::-webkit-scrollbar {
    display: none !important;
  }
}
</style>
