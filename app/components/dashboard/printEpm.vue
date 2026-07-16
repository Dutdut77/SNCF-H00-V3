<script setup>
const props = defineProps({
  year: { type: Number, required: true },
  stats: { type: Object, required: true },
  rows: { type: Array, required: true }, // chantiers avec réserves restantes
  printDate: { type: String, required: true }
})

const { metierLabel } = useMetier()

const METIERS_EPM = ['VOIE', 'SES']

const METIER_PRINT_STYLES = {
  VOIE: { band: 'bg-sky-50 text-sky-700', dot: 'bg-sky-500' },
  SES: { band: 'bg-violet-50 text-violet-700', dot: 'bg-violet-500' }
}

const restantes = (m) => Math.max(0, (m.total || 0) - (m.realisees || 0))
</script>

<template>
  <div class="print-only-epm">
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between border-b border-gray-300 pb-3">
      <div class="flex items-center gap-4">
        <img src="/images/logo_uo.png" alt="Uo Travaux" class="h-14" />
        <div>
          <h1 class="text-2xl font-bold text-gray-800">Reporting EPM {{ year }}</h1>
          <p class="text-sm text-gray-500">Entrées en périmètre maintenance — édité le {{ printDate }}</p>
        </div>
      </div>
      <p class="text-sm font-medium text-gray-500">{{ stats.chantiers }} chantier(s)</p>
    </div>

    <!-- Stats globales en gros -->
    <div class="mb-6 grid grid-cols-4 gap-3">
      <div class="rounded-lg border border-gray-300 p-4 text-center">
        <p class="text-xs font-semibold tracking-wide text-gray-500 uppercase">EPM réalisées</p>
        <p class="text-secondary-600 mt-1 text-5xl font-bold">{{ stats.epmRealisees }}</p>
        <p class="mt-1 text-xs text-gray-400">sur {{ stats.chantiers * 2 }} attendues</p>
      </div>
      <div class="rounded-lg border border-gray-300 p-4 text-center">
        <p class="text-xs font-semibold tracking-wide text-gray-500 uppercase">Total réserves</p>
        <p class="mt-1 text-5xl font-bold text-amber-600">{{ stats.totalReserves }}</p>
        <p class="mt-1 text-xs text-gray-400">reste {{ stats.reservesRestantes }} à lever</p>
      </div>
      <div class="rounded-lg border border-gray-300 p-4 text-center">
        <p class="text-xs font-semibold tracking-wide text-gray-500 uppercase">Réalisées</p>
        <p class="mt-1 text-5xl font-bold text-emerald-600">{{ stats.reservesRealisees }}</p>
        <p class="mt-1 text-xs text-gray-400">sur {{ stats.totalReserves }}</p>
      </div>
      <div class="from-secondary-400 to-secondary-600 rounded-lg bg-linear-to-br p-4 text-center">
        <p class="text-xs font-semibold tracking-wide text-white/80 uppercase">Avancement</p>
        <p class="mt-1 text-5xl font-bold text-white">{{ stats.avancement }}</p>
        <p class="mt-1 text-xs text-white/70">des réserves levées</p>
      </div>
    </div>

    <!-- Détail par métier -->
    <div class="mb-6 grid grid-cols-2 gap-3">
      <div v-for="m in METIERS_EPM" :key="m" class="overflow-hidden rounded-lg border border-gray-300">
        <div class="px-4 py-2 text-sm font-bold tracking-wide uppercase" :class="METIER_PRINT_STYLES[m].band">
          {{ metierLabel(m) }}
        </div>
        <div class="grid grid-cols-4 divide-x divide-gray-200 p-3 text-center">
          <div>
            <p class="text-[10px] font-semibold text-gray-500 uppercase">EPM</p>
            <p class="text-2xl font-bold text-gray-800">{{ stats[m].epmRealisees }}</p>
          </div>
          <div>
            <p class="text-[10px] font-semibold text-gray-500 uppercase">Réserves</p>
            <p class="text-2xl font-bold text-amber-600">{{ stats[m].total }}</p>
          </div>
          <div>
            <p class="text-[10px] font-semibold text-gray-500 uppercase">Réalisées</p>
            <p class="text-2xl font-bold text-emerald-600">{{ stats[m].realisees }}</p>
          </div>
          <div>
            <p class="text-[10px] font-semibold text-gray-500 uppercase">Avancement</p>
            <p class="text-secondary-600 text-2xl font-bold">{{ stats[m].avancement }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Chantiers avec réserves restantes -->
    <div v-if="rows.length">
      <h2 class="mb-2 text-sm font-bold tracking-wide text-gray-700 uppercase">
        Chantiers avec réserves à lever ({{ rows.length }})
      </h2>
      <table class="w-full border-collapse text-xs">
        <thead>
          <tr class="border-b border-gray-400 text-left text-[10px] text-gray-500 uppercase">
            <th class="py-1.5 pr-2 font-semibold">Compte</th>
            <th class="py-1.5 pr-2 font-semibold">Chantier</th>
            <th v-for="m in METIERS_EPM" :key="`h-${m}`" class="py-1.5 pr-2 text-center font-semibold">
              Restantes {{ metierLabel(m) }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in rows" :key="r.chantier.id" class="border-b border-gray-200">
            <td class="py-1.5 pr-2 font-bold text-gray-800">{{ r.chantier.compte }}</td>
            <td class="py-1.5 pr-2 text-gray-600">{{ r.chantier.name }}</td>
            <td v-for="m in METIERS_EPM" :key="`c-${m}`" class="py-1.5 pr-2 text-center">
              <span v-if="restantes(r[m]) > 0" class="font-bold text-amber-600">{{ restantes(r[m]) }}</span>
              <span v-else class="text-gray-300">—</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-else class="text-sm text-gray-500 italic">Aucune réserve restant à lever — bravo !</p>
  </div>
</template>

<style>
/* Hors écran mais rendu (même pattern que printStatistiques) */
.print-only-epm {
  position: fixed;
  left: -9999px;
  width: 190mm; /* A4 portrait - marges */
}
@media print {
  @page {
    size: A4 portrait;
    margin: 10mm;
  }
  .print-only-epm {
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
