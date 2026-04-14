<script setup>
const props = defineProps({
  chantier: { type: Object, required: true }
})

const { getLignes, addLigne, updateLigne, deleteLigne, computeLigne, computeTotaux } = useVieillesMatires()
const { isUserIntervenant } = useLevelUser()

const lignes = ref([])
const loading = ref(false)
const canEdit = ref(false)

const TYPES_TRAVAUX = ['RVB', 'RR', 'RB', 'RT', 'RB+RT', '2R']
const TYPES_TRAVERSES = ['Bois', 'Bibloc', 'Monobloc']

// ─── Chargement ────────────────────────────────────────────────────────────

onMounted(async () => {
  loading.value = true
  ;[lignes.value, canEdit.value] = await Promise.all([
    getLignes(props.chantier.id),
    isUserIntervenant(props.chantier.id)
  ])
  loading.value = false
})

// ─── Lignes par section ─────────────────────────────────────────────────────

const lignesVoieCourante = computed(() =>
  lignes.value.filter((l) => l.section_type === 'voie_courante')
)
const lignesAdv = computed(() =>
  lignes.value.filter((l) => l.section_type === 'adv')
)

// ─── Calculs enrichis ───────────────────────────────────────────────────────

const enriched = computed(() =>
  lignes.value.map((l) => ({ ...l, calc: computeLigne(l) }))
)

const enrichedVoieCourante = computed(() =>
  enriched.value.filter((l) => l.section_type === 'voie_courante')
)
const enrichedAdv = computed(() =>
  enriched.value.filter((l) => l.section_type === 'adv')
)

const totauxVoieCourante = computed(() =>
  computeTotaux(enrichedVoieCourante.value.map((l) => l.calc))
)
const totauxAdv = computed(() =>
  computeTotaux(enrichedAdv.value.map((l) => l.calc))
)
const totauxGeneral = computed(() =>
  computeTotaux(enriched.value.map((l) => l.calc))
)

// ─── Actions ────────────────────────────────────────────────────────────────

const handleAdd = async (sectionType) => {
  const sectionLignes = lignes.value.filter((l) => l.section_type === sectionType)
  const ordre = sectionLignes.length
  const newLigne = await addLigne(props.chantier.id, sectionType, ordre)
  if (newLigne) lignes.value.push(newLigne)
}

const handleUpdate = async (ligne, field, value) => {
  const parsed = ['pk_debut', 'pk_fin', 'profil_rail', 'travelage', 'profondeur_degarnissage'].includes(field)
    ? (value === '' || value == null ? null : Number(value))
    : value

  const idx = lignes.value.findIndex((l) => l.id === ligne.id)
  if (idx !== -1) lignes.value[idx] = { ...lignes.value[idx], [field]: parsed }

  await updateLigne(ligne.id, { [field]: parsed })
}

const handleDelete = async (id) => {
  const ok = await deleteLigne(id)
  if (ok) lignes.value = lignes.value.filter((l) => l.id !== id)
}

// ─── Formatage ──────────────────────────────────────────────────────────────

const fmt = (val, decimals = 2) => {
  if (val == null || val === '') return '—'
  return Number(val).toFixed(decimals)
}

// ─── Impression ─────────────────────────────────────────────────────────────

const handlePrint = () => {
  sessionStorage.setItem('printVieillesMatires', JSON.stringify({
    chantier: props.chantier,
    lignesVoieCourante: enrichedVoieCourante.value,
    lignesAdv: enrichedAdv.value,
    totauxVoieCourante: totauxVoieCourante.value,
    totauxAdv: totauxAdv.value,
    totauxGeneral: totauxGeneral.value,
  }))
  window.open('/print/vieilles-matieres', '_blank')
}
</script>

<template>
  <div class="h-full overflow-auto space-y-8 p-4 lg:p-6">
    <!-- Titre -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30">
          <Icon name="lucide:package-open" size="20" class="text-orange-600 dark:text-orange-400" />
        </div>
        <div>
          <h1 class="text-xl font-semibold text-gray-800 dark:text-white">Vieilles matières</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400">Calcul des quantités à évacuer</p>
        </div>
      </div>
      <button
        type="button"
        class="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow-sm transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        @click="handlePrint"
      >
        <Icon name="lucide:printer" size="16" />
        Imprimer
      </button>
    </div>

    <div v-if="loading" class="flex items-center justify-center py-16">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent"></div>
    </div>

    <template v-else>
      <!-- ── VOIE COURANTE ─────────────────────────────────────────────── -->
      <ChantierVmSection
        title="Voie Courante"
        section-type="voie_courante"
        :lignes="enrichedVoieCourante"
        :totaux="totauxVoieCourante"
        :types-travaux="TYPES_TRAVAUX"
        :types-traverses="TYPES_TRAVERSES"
        :fmt="fmt"
        :readonly="!canEdit"
        @add="handleAdd('voie_courante')"
        @update="handleUpdate"
        @delete="handleDelete"
      />

      <!-- ── ADV ──────────────────────────────────────────────────────── -->
      <ChantierVmSection
        title="ADV"
        section-type="adv"
        first-label="ADV"
        :lignes="enrichedAdv"
        :totaux="totauxAdv"
        :types-travaux="TYPES_TRAVAUX"
        :types-traverses="TYPES_TRAVERSES"
        :fmt="fmt"
        :readonly="!canEdit"
        @add="handleAdd('adv')"
        @update="handleUpdate"
        @delete="handleDelete"
      />

      <!-- ── TOTAL GÉNÉRAL ─────────────────────────────────────────────── -->
      <div class="rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
        <div class="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
          <h2 class="font-semibold text-gray-700 dark:text-gray-200">Total Général</h2>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-gray-100 text-xs font-medium text-gray-500 dark:bg-gray-700/50 dark:text-gray-400">
                <th class="px-3 py-2 text-left">Section</th>
                <th class="px-3 py-2 text-center" colspan="2">Vieux ballast</th>
                <th class="px-3 py-2 text-center" colspan="2">Traverses bois</th>
                <th class="px-3 py-2 text-center" colspan="2">TBA Bibloc</th>
                <th class="px-3 py-2 text-center" colspan="2">TBA Monobloc</th>
                <th class="px-3 py-2 text-center" colspan="2">Rail</th>
              </tr>
              <tr class="bg-gray-100 text-xs text-gray-400 dark:bg-gray-700/50 dark:text-gray-500">
                <th class="px-3 py-1.5"></th>
                <th class="px-3 py-1.5 text-center">Vol. (m³)</th>
                <th class="px-3 py-1.5 text-center">Ton. (T)</th>
                <th class="px-3 py-1.5 text-center">Nb</th>
                <th class="px-3 py-1.5 text-center">Ton. (T)</th>
                <th class="px-3 py-1.5 text-center">Nb</th>
                <th class="px-3 py-1.5 text-center">Ton. (T)</th>
                <th class="px-3 py-1.5 text-center">Nb</th>
                <th class="px-3 py-1.5 text-center">Ton. (T)</th>
                <th class="px-3 py-1.5 text-center">Long. (m)</th>
                <th class="px-3 py-1.5 text-center">Ton. (T)</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              <!-- Voie Courante -->
              <tr class="text-gray-700 dark:text-gray-300">
                <td class="px-3 py-2 text-sm font-medium">Voie Courante</td>
                <td class="px-3 py-2 text-center text-blue-700 dark:text-blue-300">{{ fmt(totauxVoieCourante.ballast_volume) }}</td>
                <td class="px-3 py-2 text-center text-blue-700 dark:text-blue-300">{{ fmt(totauxVoieCourante.ballast_tonnage) }}</td>
                <td class="px-3 py-2 text-center text-green-700 dark:text-green-300">{{ fmt(totauxVoieCourante.tbois_nombre) }}</td>
                <td class="px-3 py-2 text-center text-green-700 dark:text-green-300">{{ fmt(totauxVoieCourante.tbois_tonnage) }}</td>
                <td class="px-3 py-2 text-center text-amber-700 dark:text-amber-300">{{ fmt(totauxVoieCourante.bibloc_nombre) }}</td>
                <td class="px-3 py-2 text-center text-amber-700 dark:text-amber-300">{{ fmt(totauxVoieCourante.bibloc_tonnage) }}</td>
                <td class="px-3 py-2 text-center text-purple-700 dark:text-purple-300">{{ fmt(totauxVoieCourante.monobloc_nombre) }}</td>
                <td class="px-3 py-2 text-center text-purple-700 dark:text-purple-300">{{ fmt(totauxVoieCourante.monobloc_tonnage) }}</td>
                <td class="px-3 py-2 text-center text-red-700 dark:text-red-300">{{ fmt(totauxVoieCourante.rail_longueur) }}</td>
                <td class="px-3 py-2 text-center text-red-700 dark:text-red-300">{{ fmt(totauxVoieCourante.rail_tonnage) }}</td>
              </tr>
              <!-- ADV -->
              <tr class="text-gray-700 dark:text-gray-300">
                <td class="px-3 py-2 text-sm font-medium">ADV</td>
                <td class="px-3 py-2 text-center text-blue-700 dark:text-blue-300">{{ fmt(totauxAdv.ballast_volume) }}</td>
                <td class="px-3 py-2 text-center text-blue-700 dark:text-blue-300">{{ fmt(totauxAdv.ballast_tonnage) }}</td>
                <td class="px-3 py-2 text-center text-green-700 dark:text-green-300">{{ fmt(totauxAdv.tbois_nombre) }}</td>
                <td class="px-3 py-2 text-center text-green-700 dark:text-green-300">{{ fmt(totauxAdv.tbois_tonnage) }}</td>
                <td class="px-3 py-2 text-center text-amber-700 dark:text-amber-300">{{ fmt(totauxAdv.bibloc_nombre) }}</td>
                <td class="px-3 py-2 text-center text-amber-700 dark:text-amber-300">{{ fmt(totauxAdv.bibloc_tonnage) }}</td>
                <td class="px-3 py-2 text-center text-purple-700 dark:text-purple-300">{{ fmt(totauxAdv.monobloc_nombre) }}</td>
                <td class="px-3 py-2 text-center text-purple-700 dark:text-purple-300">{{ fmt(totauxAdv.monobloc_tonnage) }}</td>
                <td class="px-3 py-2 text-center text-red-700 dark:text-red-300">{{ fmt(totauxAdv.rail_longueur) }}</td>
                <td class="px-3 py-2 text-center text-red-700 dark:text-red-300">{{ fmt(totauxAdv.rail_tonnage) }}</td>
              </tr>
              <!-- Total -->
              <tr class="bg-gray-100 font-semibold text-gray-800 dark:bg-gray-700/40 dark:text-gray-100">
                <td class="px-3 py-2.5 text-sm">Total</td>
                <td class="px-3 py-2.5 text-center text-blue-700 dark:text-blue-300">{{ fmt(totauxGeneral.ballast_volume) }}</td>
                <td class="px-3 py-2.5 text-center text-blue-700 dark:text-blue-300">{{ fmt(totauxGeneral.ballast_tonnage) }}</td>
                <td class="px-3 py-2.5 text-center text-green-700 dark:text-green-300">{{ fmt(totauxGeneral.tbois_nombre) }}</td>
                <td class="px-3 py-2.5 text-center text-green-700 dark:text-green-300">{{ fmt(totauxGeneral.tbois_tonnage) }}</td>
                <td class="px-3 py-2.5 text-center text-amber-700 dark:text-amber-300">{{ fmt(totauxGeneral.bibloc_nombre) }}</td>
                <td class="px-3 py-2.5 text-center text-amber-700 dark:text-amber-300">{{ fmt(totauxGeneral.bibloc_tonnage) }}</td>
                <td class="px-3 py-2.5 text-center text-purple-700 dark:text-purple-300">{{ fmt(totauxGeneral.monobloc_nombre) }}</td>
                <td class="px-3 py-2.5 text-center text-purple-700 dark:text-purple-300">{{ fmt(totauxGeneral.monobloc_tonnage) }}</td>
                <td class="px-3 py-2.5 text-center text-red-700 dark:text-red-300">{{ fmt(totauxGeneral.rail_longueur) }}</td>
                <td class="px-3 py-2.5 text-center text-red-700 dark:text-red-300">{{ fmt(totauxGeneral.rail_tonnage) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>
