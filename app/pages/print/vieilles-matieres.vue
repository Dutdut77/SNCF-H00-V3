<script setup>
definePageMeta({
  requiresAuth: true,
  requiredRole: '',
  layout: false
})

useHead({ title: 'Impression — Vieilles matières' })

const isLoading = ref(true)
const chantier = ref(null)
const lignesVoieCourante = ref([])
const lignesAdv = ref([])
const totauxVoieCourante = ref({})
const totauxAdv = ref({})
const totauxGeneral = ref({})

const printDate = new Date().toLocaleDateString('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric'
})

const fmt = (val, decimals = 2) => {
  if (val == null || val === '' || val === 0) return '—'
  return Number(val).toFixed(decimals)
}

const fmtPk = (val) => {
  if (val == null) return '—'
  return Number(val).toFixed(3)
}

const handlePrint = () => window.print()
const handleClose = () => window.close()

onMounted(() => {
  try {
    const stored = sessionStorage.getItem('printVieillesMatires')
    if (stored) {
      const data = JSON.parse(stored)
      chantier.value = data.chantier
      lignesVoieCourante.value = data.lignesVoieCourante
      lignesAdv.value = data.lignesAdv
      totauxVoieCourante.value = data.totauxVoieCourante
      totauxAdv.value = data.totauxAdv
      totauxGeneral.value = data.totauxGeneral
    }
  } finally {
    isLoading.value = false
    setTimeout(handlePrint, 600)
  }
})
</script>

<template>
  <div class="min-h-screen bg-gray-100 print:bg-white">
    <!-- Chargement -->
    <div v-if="isLoading" class="flex min-h-screen flex-col items-center justify-center gap-4">
      <div class="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-orange-500"></div>
      <p class="text-gray-500">Préparation du document...</p>
    </div>

    <div v-else class="mx-auto max-w-[1200px] bg-white p-8 shadow-lg print:max-w-none print:p-6 print:shadow-none">
      <!-- Boutons (écran uniquement) -->
      <div class="mb-6 flex gap-3 print:hidden">
        <button
          class="flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-orange-700"
          @click="handlePrint">
          <Icon name="lucide:printer" size="16" />
          Imprimer / Exporter PDF
        </button>
        <button
          class="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
          @click="handleClose">
          Fermer
        </button>
      </div>

      <!-- ── EN-TÊTE ──────────────────────────────────────────────────── -->
      <header class="mb-8 border-b-2 border-orange-500 pb-6">
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-4">
            <img src="/images/logo_uo.png" alt="SNCF" class="h-12 w-auto" onerror="this.style.display = 'none'" />
            <div>
              <h1 class="text-2xl font-bold tracking-wide text-gray-800">ÉVACUATION VIEILLES MATIÈRES</h1>
              <p class="text-sm text-gray-500">Quantités prévisionnelles de matériaux à évacuer</p>
            </div>
          </div>
          <div class="text-center text-xs text-gray-400">
            <p>Imprimé le {{ printDate }}</p>
          </div>
        </div>

        <!-- Infos chantier -->
        <div v-if="chantier" class="mt-5 grid grid-cols-3 gap-4">
          <div class="rounded-lg bg-orange-50 px-4 py-3">
            <p class="text-xs font-medium tracking-wider text-orange-500 uppercase">N° Compte</p>
            <p class="mt-0.5 text-lg font-bold text-gray-800">{{ chantier.compte }}</p>
          </div>
          <div class="col-span-2 rounded-lg bg-gray-50 px-4 py-3">
            <p class="text-xs font-medium tracking-wider text-gray-400 uppercase">Désignation</p>
            <p class="mt-0.5 font-semibold text-gray-800">{{ chantier.name }}</p>
          </div>
        </div>
      </header>

      <!-- ── LÉGENDE COULEURS ──────────────────────────────────────────── -->
      <div class="mb-6 flex flex-wrap gap-3 print:mb-4">
        <span class="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
          <span class="h-2 w-2 rounded-full bg-blue-400"></span>
          Vieux ballast
        </span>
        <span class="flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
          <span class="h-2 w-2 rounded-full bg-green-400"></span>
          Traverses bois
        </span>
        <span class="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
          <span class="h-2 w-2 rounded-full bg-amber-400"></span>
          TBA Bibloc
        </span>
        <span class="flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">
          <span class="h-2 w-2 rounded-full bg-purple-400"></span>
          TBA Monobloc
        </span>
        <span class="flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
          <span class="h-2 w-2 rounded-full bg-red-400"></span>
          Rail
        </span>
      </div>

      <!-- ── SECTION : VOIE COURANTE ───────────────────────────────────── -->
      <PrintVmTable
        v-if="lignesVoieCourante.length > 0"
        title="Voie Courante"
        :lignes="lignesVoieCourante"
        :totaux="totauxVoieCourante"
        :fmt="fmt"
        :fmt-pk="fmtPk" />

      <!-- ── SECTION : ADV ─────────────────────────────────────────────── -->
      <PrintVmTable
        v-if="lignesAdv.length > 0"
        title="ADV"
        :lignes="lignesAdv"
        :totaux="totauxAdv"
        :fmt="fmt"
        :fmt-pk="fmtPk"
        class="mt-8 print:mt-6" />

      <!-- ── TOTAL GÉNÉRAL ─────────────────────────────────────────────── -->
      <div class="mt-8 print:mt-6">
        <div class="mb-2 flex items-center gap-2">
          <div class="h-1 w-6 rounded-full bg-orange-500"></div>
          <h2 class="text-base font-bold tracking-wider text-gray-700 uppercase">Total Général</h2>
        </div>
        <table class="w-full border-collapse text-xs">
          <thead>
            <tr class="bg-orange-500 text-white">
              <th class="border border-orange-600 px-3 py-2 text-left font-semibold">Section</th>
              <th class="border border-orange-600 px-3 py-2 text-center font-semibold" colspan="2">Vieux ballast</th>
              <th class="border border-orange-600 px-3 py-2 text-center font-semibold" colspan="2">Traverses bois</th>
              <th class="border border-orange-600 px-3 py-2 text-center font-semibold" colspan="2">TBA Bibloc</th>
              <th class="border border-orange-600 px-3 py-2 text-center font-semibold" colspan="2">TBA Monobloc</th>
              <th class="border border-orange-600 px-3 py-2 text-center font-semibold" colspan="2">Rail</th>
            </tr>
            <tr class="bg-orange-50 text-gray-500">
              <th class="border border-gray-200 px-3 py-1.5"></th>
              <th class="border border-gray-200 px-3 py-1.5 text-center">Vol. (m³)</th>
              <th class="border border-gray-200 px-3 py-1.5 text-center">Ton. (T)</th>
              <th class="border border-gray-200 px-3 py-1.5 text-center">Nombre</th>
              <th class="border border-gray-200 px-3 py-1.5 text-center">Ton. (T)</th>
              <th class="border border-gray-200 px-3 py-1.5 text-center">Nombre</th>
              <th class="border border-gray-200 px-3 py-1.5 text-center">Ton. (T)</th>
              <th class="border border-gray-200 px-3 py-1.5 text-center">Nombre</th>
              <th class="border border-gray-200 px-3 py-1.5 text-center">Ton. (T)</th>
              <th class="border border-gray-200 px-3 py-1.5 text-center">Long. (m)</th>
              <th class="border border-gray-200 px-3 py-1.5 text-center">Ton. (T)</th>
            </tr>
          </thead>
          <tbody>
            <!-- Voie Courante -->
            <tr class="bg-white text-gray-700">
              <td class="border border-gray-200 px-3 py-2 font-medium">Voie Courante</td>
              <td class="border border-gray-200 px-3 py-2 text-center text-blue-700">
                {{ fmt(totauxVoieCourante.ballast_volume) }}
              </td>
              <td class="border border-gray-200 px-3 py-2 text-center text-blue-700">
                {{ fmt(totauxVoieCourante.ballast_tonnage) }}
              </td>
              <td class="border border-gray-200 px-3 py-2 text-center text-green-700">
                {{ fmt(totauxVoieCourante.tbois_nombre) }}
              </td>
              <td class="border border-gray-200 px-3 py-2 text-center text-green-700">
                {{ fmt(totauxVoieCourante.tbois_tonnage) }}
              </td>
              <td class="border border-gray-200 px-3 py-2 text-center text-amber-700">
                {{ fmt(totauxVoieCourante.bibloc_nombre) }}
              </td>
              <td class="border border-gray-200 px-3 py-2 text-center text-amber-700">
                {{ fmt(totauxVoieCourante.bibloc_tonnage) }}
              </td>
              <td class="border border-gray-200 px-3 py-2 text-center text-purple-700">
                {{ fmt(totauxVoieCourante.monobloc_nombre) }}
              </td>
              <td class="border border-gray-200 px-3 py-2 text-center text-purple-700">
                {{ fmt(totauxVoieCourante.monobloc_tonnage) }}
              </td>
              <td class="border border-gray-200 px-3 py-2 text-center text-red-700">
                {{ fmt(totauxVoieCourante.rail_longueur) }}
              </td>
              <td class="border border-gray-200 px-3 py-2 text-center text-red-700">
                {{ fmt(totauxVoieCourante.rail_tonnage) }}
              </td>
            </tr>
            <!-- ADV -->
            <tr class="bg-gray-50 text-gray-700">
              <td class="border border-gray-200 px-3 py-2 font-medium">ADV</td>
              <td class="border border-gray-200 px-3 py-2 text-center text-blue-700">
                {{ fmt(totauxAdv.ballast_volume) }}
              </td>
              <td class="border border-gray-200 px-3 py-2 text-center text-blue-700">
                {{ fmt(totauxAdv.ballast_tonnage) }}
              </td>
              <td class="border border-gray-200 px-3 py-2 text-center text-green-700">
                {{ fmt(totauxAdv.tbois_nombre) }}
              </td>
              <td class="border border-gray-200 px-3 py-2 text-center text-green-700">
                {{ fmt(totauxAdv.tbois_tonnage) }}
              </td>
              <td class="border border-gray-200 px-3 py-2 text-center text-amber-700">
                {{ fmt(totauxAdv.bibloc_nombre) }}
              </td>
              <td class="border border-gray-200 px-3 py-2 text-center text-amber-700">
                {{ fmt(totauxAdv.bibloc_tonnage) }}
              </td>
              <td class="border border-gray-200 px-3 py-2 text-center text-purple-700">
                {{ fmt(totauxAdv.monobloc_nombre) }}
              </td>
              <td class="border border-gray-200 px-3 py-2 text-center text-purple-700">
                {{ fmt(totauxAdv.monobloc_tonnage) }}
              </td>
              <td class="border border-gray-200 px-3 py-2 text-center text-red-700">
                {{ fmt(totauxAdv.rail_longueur) }}
              </td>
              <td class="border border-gray-200 px-3 py-2 text-center text-red-700">
                {{ fmt(totauxAdv.rail_tonnage) }}
              </td>
            </tr>
            <!-- Total -->
            <tr class="bg-orange-50 font-bold text-gray-800">
              <td class="border border-orange-200 px-3 py-2.5 text-orange-800">Total</td>
              <td class="border border-orange-200 px-3 py-2.5 text-center text-blue-700">
                {{ fmt(totauxGeneral.ballast_volume) }}
              </td>
              <td class="border border-orange-200 px-3 py-2.5 text-center text-blue-700">
                {{ fmt(totauxGeneral.ballast_tonnage) }}
              </td>
              <td class="border border-orange-200 px-3 py-2.5 text-center text-green-700">
                {{ fmt(totauxGeneral.tbois_nombre) }}
              </td>
              <td class="border border-orange-200 px-3 py-2.5 text-center text-green-700">
                {{ fmt(totauxGeneral.tbois_tonnage) }}
              </td>
              <td class="border border-orange-200 px-3 py-2.5 text-center text-amber-700">
                {{ fmt(totauxGeneral.bibloc_nombre) }}
              </td>
              <td class="border border-orange-200 px-3 py-2.5 text-center text-amber-700">
                {{ fmt(totauxGeneral.bibloc_tonnage) }}
              </td>
              <td class="border border-orange-200 px-3 py-2.5 text-center text-purple-700">
                {{ fmt(totauxGeneral.monobloc_nombre) }}
              </td>
              <td class="border border-orange-200 px-3 py-2.5 text-center text-purple-700">
                {{ fmt(totauxGeneral.monobloc_tonnage) }}
              </td>
              <td class="border border-orange-200 px-3 py-2.5 text-center text-red-700">
                {{ fmt(totauxGeneral.rail_longueur) }}
              </td>
              <td class="border border-orange-200 px-3 py-2.5 text-center text-red-700">
                {{ fmt(totauxGeneral.rail_tonnage) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ── PIED DE PAGE ──────────────────────────────────────────────── -->
      <footer
        class="mt-auto flex items-center justify-between border-t border-gray-200 pt-4 text-xs text-gray-400 print:mt-6">
        <span>H00 Travaux — Vielles Matières</span>
        <span>{{ chantier?.compte }} — {{ chantier?.name }}</span>
      </footer>
    </div>
  </div>
</template>

<style>
@media print {
  @page {
    size: A3 landscape;
    margin: 12mm;
  }
}
</style>
