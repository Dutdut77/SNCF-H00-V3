<script setup>
// Impression d'une rubrique logistique (base vie / imprimante / réseau / radio).
// Chaque section de statut est rendue comme un bloc titré avec sa propre table.
const props = defineProps({
  title: { type: String, default: 'Logistique' },
  subtitle: { type: String, default: '' },
  mode: { type: String, default: 'ref' }, // 'base_vie' | 'ref' | 'radio'
  itemsLabel: { type: String, default: 'Matériels' },
  sections: { type: Array, default: () => [] } // [{ label, rows: [...] }]
})

const isBaseVie = computed(() => props.mode === 'base_vie')
const isRef = computed(() => props.mode === 'ref')
const isRadio = computed(() => props.mode === 'radio')
</script>

<template>
  <div class="text-primary-900">
    <!-- En-tête -->
    <div class="flex w-full items-center justify-between">
      <div class="flex items-center gap-4">
        <img src="/images/logo_uo.png" alt="Logo" class="w-12" />
        <div class="flex flex-col items-start justify-center">
          <p class="font-[Bangers] text-3xl font-semibold tracking-wider">{{ title }}</p>
          <p v-if="subtitle" class="-mt-1 text-base italic">{{ subtitle }}</p>
        </div>
      </div>
      <div class="ml-auto text-sm italic">
        Impression du {{ new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) }}
      </div>
    </div>

    <!-- Sections -->
    <div class="flex flex-col gap-6 pt-6">
      <div v-for="(section, sIdx) in sections" :key="sIdx" class="flex break-inside-avoid flex-col gap-2">
        <div v-if="section.label" class="flex items-center gap-2 border-b border-teal-500/60 pb-1">
          <span class="brand-section font-[Bangers] text-2xl tracking-wider">{{ section.label }}</span>
          <span class="bg-primary-200 rounded-full px-2 py-0.5 text-xs font-bold">{{ section.rows.length }}</span>
        </div>

        <table class="w-full border-collapse text-sm">
          <thead>
            <tr class="border-primary-300 border-b text-left text-xs uppercase">
              <th class="py-1 pr-3 font-semibold">Chantier</th>
              <th class="py-1 pr-3 font-semibold whitespace-nowrap">Début</th>
              <th class="py-1 pr-3 font-semibold">Statut</th>
              <th v-if="isBaseVie" class="py-1 pr-3 font-semibold">VAC</th>
              <th v-if="isBaseVie" class="py-1 pr-3 font-semibold">ALGECO</th>
              <th v-if="isBaseVie" class="py-1 pr-3 font-semibold whitespace-nowrap">Groupe élec.</th>
              <th v-if="isRef" class="py-1 pr-3 font-semibold">{{ itemsLabel }}</th>
              <th v-if="isRadio" class="py-1 pr-3 font-semibold">Fourniture</th>
              <th v-if="isRadio" class="py-1 pr-3 font-semibold">Nombre</th>
              <th v-if="isRadio" class="py-1 pr-3 font-semibold whitespace-nowrap">Station fixe</th>
              <th v-if="isRadio" class="py-1 pr-3 font-semibold whitespace-nowrap">PK couverture</th>
              <th v-if="!isRef" class="py-1 pr-3 font-semibold">Commentaire</th>
              <th v-if="!isRef" class="py-1 font-semibold">Date</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, rIdx) in section.rows" :key="rIdx" class="border-primary-200 border-b align-top">
              <td class="py-1 pr-3">
                <span class="font-semibold">{{ row.compte }}</span>
                — {{ row.name }}
              </td>
              <td class="py-1 pr-3 whitespace-nowrap">{{ row.start || '—' }}</td>
              <td class="py-1 pr-3 whitespace-nowrap">{{ row.statut }}</td>
              <td v-if="isBaseVie" class="py-1 pr-3 whitespace-nowrap">{{ row.vac || '—' }}</td>
              <td v-if="isBaseVie" class="py-1 pr-3 whitespace-nowrap">{{ row.algeco ? row.algeco + ' mod.' : '—' }}</td>
              <td v-if="isBaseVie" class="py-1 pr-3 whitespace-nowrap">{{ row.ge ? 'Oui' : '—' }}</td>
              <td v-if="isRef" class="py-1 pr-3">
                <template v-if="row.items.length">
                  <span v-for="(it, i) in row.items" :key="i" class="mr-3 inline-block whitespace-nowrap">
                    <span v-if="it.ident" class="font-mono font-semibold">{{ it.ident }}</span>
                    {{ it.label }}
                  </span>
                </template>
                <span v-else>—</span>
              </td>
              <td v-if="isRadio" class="py-1 pr-3 whitespace-nowrap">{{ row.fournisseur || '—' }}</td>
              <td v-if="isRadio" class="py-1 pr-3 whitespace-nowrap">{{ row.nombre || '—' }}</td>
              <td v-if="isRadio" class="py-1 pr-3 whitespace-nowrap">{{ row.stationFixe ? 'Oui' : '—' }}</td>
              <td v-if="isRadio" class="py-1 pr-3">{{ row.pk || '—' }}</td>
              <td v-if="!isRef" class="py-1 pr-3">{{ row.comment || '—' }}</td>
              <td v-if="!isRef" class="py-1 whitespace-nowrap">{{ row.date || '—' }}</td>
            </tr>
            <tr v-if="!section.rows.length">
              <td colspan="9" class="text-primary-500 py-2 text-center italic">Aucun chantier</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Titre de section façon marque "H00 Travaux" : Bangers + dégradé sarcelle. */
.brand-section {
  background: linear-gradient(135deg, #1e293b 0%, var(--color-secondary-500) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
</style>
