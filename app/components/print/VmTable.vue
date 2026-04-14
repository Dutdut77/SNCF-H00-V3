<script setup>
defineProps({
  title: { type: String, required: true },
  lignes: { type: Array, required: true },
  totaux: { type: Object, required: true },
  fmt: { type: Function, required: true },
  fmtPk: { type: Function, required: true }
})
</script>

<template>
  <div>
    <!-- Titre section -->
    <div class="mb-2 flex items-center gap-2">
      <div class="h-1 w-6 rounded-full bg-orange-400"></div>
      <h2 class="text-base font-bold uppercase tracking-wider text-gray-700">{{ title }}</h2>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full border-collapse text-xs">
        <!-- En-têtes -->
        <thead>
          <tr class="bg-gray-700 text-white">
            <th class="border border-gray-600 px-2 py-2 text-center font-semibold">Voie</th>
            <th class="border border-gray-600 px-2 py-2 text-center font-semibold">Pk début</th>
            <th class="border border-gray-600 px-2 py-2 text-center font-semibold">Pk fin</th>
            <th class="border border-gray-600 px-2 py-2 text-center font-semibold">Long. (m)</th>
            <th class="border border-gray-600 px-2 py-2 text-center font-semibold">Profil</th>
            <th class="border border-gray-600 px-2 py-2 text-center font-semibold">Traverses</th>
            <th class="border border-gray-600 px-2 py-2 text-center font-semibold">Travelage</th>
            <th class="border border-gray-600 px-2 py-2 text-center font-semibold">Travaux</th>
            <th class="border border-gray-600 px-2 py-2 text-center font-semibold">Prof. (cm)</th>
            <th class="border border-blue-400 bg-blue-600 px-2 py-2 text-center font-semibold" colspan="2">Vieux ballast</th>
            <th class="border border-green-400 bg-green-600 px-2 py-2 text-center font-semibold" colspan="2">T. bois</th>
            <th class="border border-amber-400 bg-amber-600 px-2 py-2 text-center font-semibold" colspan="2">TBA Bibloc</th>
            <th class="border border-purple-400 bg-purple-600 px-2 py-2 text-center font-semibold" colspan="2">TBA Monobloc</th>
            <th class="border border-red-400 bg-red-600 px-2 py-2 text-center font-semibold" colspan="2">Rail</th>
          </tr>
          <tr class="bg-gray-100 text-gray-500">
            <th colspan="9" class="border border-gray-200"></th>
            <th class="border border-gray-200 bg-blue-50 px-2 py-1 text-center">Vol. m³</th>
            <th class="border border-gray-200 bg-blue-50 px-2 py-1 text-center">T</th>
            <th class="border border-gray-200 bg-green-50 px-2 py-1 text-center">Nb</th>
            <th class="border border-gray-200 bg-green-50 px-2 py-1 text-center">T</th>
            <th class="border border-gray-200 bg-amber-50 px-2 py-1 text-center">Nb</th>
            <th class="border border-gray-200 bg-amber-50 px-2 py-1 text-center">T</th>
            <th class="border border-gray-200 bg-purple-50 px-2 py-1 text-center">Nb</th>
            <th class="border border-gray-200 bg-purple-50 px-2 py-1 text-center">T</th>
            <th class="border border-gray-200 bg-red-50 px-2 py-1 text-center">m</th>
            <th class="border border-gray-200 bg-red-50 px-2 py-1 text-center">T</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="(ligne, i) in lignes"
            :key="ligne.id"
            :class="i % 2 === 0 ? 'bg-white' : 'bg-gray-50'"
          >
            <td class="border border-gray-200 px-2 py-1.5 text-center font-medium text-gray-800">{{ ligne.voie || '—' }}</td>
            <td class="border border-gray-200 px-2 py-1.5 text-center tabular-nums text-gray-600">{{ fmtPk(ligne.pk_debut) }}</td>
            <td class="border border-gray-200 px-2 py-1.5 text-center tabular-nums text-gray-600">{{ fmtPk(ligne.pk_fin) }}</td>
            <td class="border border-gray-200 px-2 py-1.5 text-center tabular-nums font-medium text-gray-700">
              {{ ligne.calc.longueur != null ? fmt(ligne.calc.longueur, 1) : '—' }}
            </td>
            <td class="border border-gray-200 px-2 py-1.5 text-center text-gray-600">
              {{ ligne.profil_rail ? `${ligne.profil_rail} kg` : '—' }}
            </td>
            <td class="border border-gray-200 px-2 py-1.5 text-center text-gray-600">{{ ligne.type_traverses || '—' }}</td>
            <td class="border border-gray-200 px-2 py-1.5 text-center tabular-nums text-gray-600">{{ ligne.travelage || '—' }}</td>
            <td class="border border-gray-200 px-2 py-1.5 text-center font-medium text-gray-700">{{ ligne.type_travaux || '—' }}</td>
            <td class="border border-gray-200 px-2 py-1.5 text-center text-gray-600">{{ ligne.profondeur_degarnissage || '—' }}</td>
            <!-- Ballast -->
            <td class="border border-gray-200 bg-blue-50/60 px-2 py-1.5 text-center tabular-nums text-blue-700">{{ fmt(ligne.calc.ballast_volume) }}</td>
            <td class="border border-gray-200 bg-blue-50/60 px-2 py-1.5 text-center tabular-nums font-medium text-blue-700">{{ fmt(ligne.calc.ballast_tonnage) }}</td>
            <!-- T. bois -->
            <td class="border border-gray-200 bg-green-50/60 px-2 py-1.5 text-center tabular-nums text-green-700">{{ fmt(ligne.calc.tbois_nombre) }}</td>
            <td class="border border-gray-200 bg-green-50/60 px-2 py-1.5 text-center tabular-nums font-medium text-green-700">{{ fmt(ligne.calc.tbois_tonnage) }}</td>
            <!-- Bibloc -->
            <td class="border border-gray-200 bg-amber-50/60 px-2 py-1.5 text-center tabular-nums text-amber-700">{{ fmt(ligne.calc.bibloc_nombre) }}</td>
            <td class="border border-gray-200 bg-amber-50/60 px-2 py-1.5 text-center tabular-nums font-medium text-amber-700">{{ fmt(ligne.calc.bibloc_tonnage) }}</td>
            <!-- Monobloc -->
            <td class="border border-gray-200 bg-purple-50/60 px-2 py-1.5 text-center tabular-nums text-purple-700">{{ fmt(ligne.calc.monobloc_nombre) }}</td>
            <td class="border border-gray-200 bg-purple-50/60 px-2 py-1.5 text-center tabular-nums font-medium text-purple-700">{{ fmt(ligne.calc.monobloc_tonnage) }}</td>
            <!-- Rail -->
            <td class="border border-gray-200 bg-red-50/60 px-2 py-1.5 text-center tabular-nums text-red-700">{{ fmt(ligne.calc.rail_longueur) }}</td>
            <td class="border border-gray-200 bg-red-50/60 px-2 py-1.5 text-center tabular-nums font-medium text-red-700">{{ fmt(ligne.calc.rail_tonnage) }}</td>
          </tr>
        </tbody>

        <!-- Ligne somme -->
        <tfoot>
          <tr class="bg-gray-100 text-xs font-semibold">
            <td colspan="9" class="border border-gray-300 px-3 py-2 text-center uppercase tracking-wider text-gray-500">Somme</td>
            <td class="border border-gray-300 px-2 py-2 text-center tabular-nums text-blue-700">{{ fmt(totaux.ballast_volume) }}</td>
            <td class="border border-gray-300 px-2 py-2 text-center tabular-nums text-blue-700">{{ fmt(totaux.ballast_tonnage) }}</td>
            <td class="border border-gray-300 px-2 py-2 text-center tabular-nums text-green-700">{{ fmt(totaux.tbois_nombre) }}</td>
            <td class="border border-gray-300 px-2 py-2 text-center tabular-nums text-green-700">{{ fmt(totaux.tbois_tonnage) }}</td>
            <td class="border border-gray-300 px-2 py-2 text-center tabular-nums text-amber-700">{{ fmt(totaux.bibloc_nombre) }}</td>
            <td class="border border-gray-300 px-2 py-2 text-center tabular-nums text-amber-700">{{ fmt(totaux.bibloc_tonnage) }}</td>
            <td class="border border-gray-300 px-2 py-2 text-center tabular-nums text-purple-700">{{ fmt(totaux.monobloc_nombre) }}</td>
            <td class="border border-gray-300 px-2 py-2 text-center tabular-nums text-purple-700">{{ fmt(totaux.monobloc_tonnage) }}</td>
            <td class="border border-gray-300 px-2 py-2 text-center tabular-nums text-red-700">{{ fmt(totaux.rail_longueur) }}</td>
            <td class="border border-gray-300 px-2 py-2 text-center tabular-nums text-red-700">{{ fmt(totaux.rail_tonnage) }}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
</template>
