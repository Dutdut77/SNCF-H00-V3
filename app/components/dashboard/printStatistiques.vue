<script setup>
// Page d'impression des statistiques (A4 paysage) : chiffres de l'année, effectifs, graphiques toutes années.
// Rendue hors écran : ApexCharts doit pouvoir dessiner les graphiques avant l'impression.
const { nomEntite } = useApplication()
const props = defineProps({
  annee: { type: Number, required: true },
  ligneAnnee: { type: Object, required: true },
  etats: { type: Array, required: true },
  effectifs: { type: Array, required: true },
  hasData: { type: Boolean, default: false },
  etatsOptions: { type: Object, required: true },
  etatsSeries: { type: Array, required: true },
  weekendsOptions: { type: Object, required: true },
  weekendsSeries: { type: Array, required: true },
  printDate: { type: String, required: true }
})

// Pas d'animation à l'impression ; couleurs de l'écran clair
const sansAnimation = (options) => ({ ...options, chart: { ...options.chart, animations: { enabled: false } } })
const etatsPrint = computed(() => ({
  ...sansAnimation(props.etatsOptions),
  colors: props.etats.map((e) => e.clair)
}))
const weekendsPrint = computed(() => sansAnimation(props.weekendsOptions))
</script>

<template>
  <div class="print-only text-zinc-800">
    <div class="mb-5 flex items-end justify-between border-b border-zinc-300 pb-3">
      <div class="flex items-center gap-4">
        <AppLogo class="h-14" />
        <div>
          <h1 class="font-traverse text-magenta-700 text-3xl leading-tight tracking-[0.03em]">Statistiques</h1>
          <p class="text-sm text-zinc-500">{{ nomEntite }}</p>
        </div>
      </div>
      <p class="text-sm text-zinc-500">Imprimé le {{ printDate }}</p>
    </div>

    <!-- Chiffres de l'année et effectifs -->
    <div class="mb-5 grid grid-cols-8 gap-3">
      <div class="rounded-lg border border-zinc-300 p-3">
        <p class="text-xs text-zinc-500">Chantiers {{ annee }}</p>
        <p class="font-traverse mt-1 text-2xl">{{ ligneAnnee.total }}</p>
      </div>
      <div v-for="e in etats" :key="e.code" class="rounded-lg border border-zinc-300 p-3">
        <p class="flex items-center gap-1.5 text-xs text-zinc-500">
          <span class="size-2 rounded-xs" :style="{ backgroundColor: e.clair }" />
          {{ e.label }}
        </p>
        <p class="font-traverse mt-1 text-2xl">{{ ligneAnnee.parEtat[e.code] || 0 }}</p>
      </div>
      <div class="rounded-lg border border-zinc-300 p-3">
        <p class="text-xs text-zinc-500">Week-ends {{ annee }}</p>
        <p class="font-traverse mt-1 text-2xl">{{ ligneAnnee.weekends }}</p>
      </div>
      <div v-for="g in effectifs" :key="g.groupe" class="rounded-lg border border-zinc-300 p-3">
        <p class="text-xs text-zinc-500">{{ g.groupe }}</p>
        <p class="mt-1 text-sm">
          <span v-for="(r, i) in g.roles" :key="r.label">{{ i ? ' · ' : '' }}{{ r.label }} {{ r.nb }}</span>
        </p>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div class="rounded-lg border border-zinc-300 p-3">
        <h3 class="mb-2 text-sm font-semibold">Chantiers par année, par état</h3>
        <ClientOnly>
          <apexchart v-if="hasData" type="bar" height="260" width="100%" :options="etatsPrint" :series="etatsSeries" />
        </ClientOnly>
      </div>
      <div class="rounded-lg border border-zinc-300 p-3">
        <h3 class="mb-2 text-sm font-semibold">Week-ends travaillés par année</h3>
        <ClientOnly>
          <apexchart
            v-if="hasData"
            type="bar"
            height="260"
            width="100%"
            :options="weekendsPrint"
            :series="weekendsSeries" />
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
  width: 277mm; /* A4 paysage, marges déduites */
}
@media print {
  @page {
    size: A4 landscape;
    margin: 10mm;
  }
  .print-only {
    position: static;
    left: auto;
    width: auto;
  }
  body {
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
}
</style>
