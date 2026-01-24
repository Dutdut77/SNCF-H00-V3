<script setup>
const props = defineProps({
  dex: {
    type: Array,
    default: () => []
  },
  pt: {
    type: Array,
    default: () => []
  }
})

const { formatDate, getDocumentStatus, getPtStatus } = useEtudes()
</script>

<template>
  <section v-if="dex.length > 0 || pt.length > 0" class="mb-8 break-before-page">
    <div class="mb-4 flex items-center gap-3 border-b border-gray-100 pb-2">
      <div class="bg-primary-600/20 text-primary-700 flex h-8 w-8 items-center justify-center rounded-lg">
        <Icon name="lucide:graduation-cap" size="18" />
      </div>
      <h3 class="text-lg font-bold text-gray-700 uppercase">Études</h3>
    </div>

    <!-- Documents d'exécution -->
    <div v-if="dex.length > 0" class="mb-4">
      <p class="mb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase">Documents d'exécution</p>
      <table class="w-full text-left text-xs">
        <thead>
          <tr class="border-b border-gray-200 bg-gray-50 print:bg-white">
            <th class="px-2 py-1.5 font-semibold text-gray-600">Indice</th>
            <th class="px-2 py-1.5 font-semibold text-gray-600">Titre</th>
            <th class="px-2 py-1.5 font-semibold text-gray-600">MES</th>
            <th class="px-2 py-1.5 font-semibold text-gray-600">Demande</th>
            <th class="px-2 py-1.5 font-semibold text-gray-600">Reçu</th>
            <th class="px-2 py-1.5 font-semibold text-gray-600">Statut</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="doc in dex" :key="doc.id" class="border-b border-gray-100">
            <td class="px-2 py-1.5 font-mono text-gray-900">{{ doc.indice }}</td>
            <td class="px-2 py-1.5 text-gray-900">{{ doc.titre || '-' }}</td>
            <td class="px-2 py-1.5 text-gray-600">{{ formatDate(doc.date_mes) }}</td>
            <td class="px-2 py-1.5 text-gray-600">{{ formatDate(doc.date_demande) }}</td>
            <td class="px-2 py-1.5 text-gray-600">{{ formatDate(doc.date_recu) }}</td>
            <td class="px-2 py-1.5">
              <span
                class="inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold"
                :class="{
                  'bg-primary-100 text-primary-700 print:bg-primary-50':
                    getDocumentStatus(doc, true).color === 'primary',
                  'bg-amber-100 text-amber-700 print:bg-amber-50': getDocumentStatus(doc, true).color === 'amber',
                  'bg-secondary-100 text-secondary-700 print:bg-secondary-50':
                    getDocumentStatus(doc, true).color === 'secondary',
                  'bg-gray-100 text-gray-600 print:bg-gray-50': getDocumentStatus(doc, true).color === 'gray'
                }">
                {{ getDocumentStatus(doc, true).label }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Plans techniques -->
    <div v-if="pt.length > 0">
      <p class="mb-2 text-xs font-semibold tracking-wide text-gray-500 uppercase">Plans techniques</p>
      <table class="w-full text-left text-xs">
        <thead>
          <tr class="border-b border-gray-200 bg-gray-50 print:bg-white">
            <th class="px-2 py-1.5 font-semibold text-gray-600">Indice</th>
            <th class="px-2 py-1.5 font-semibold text-gray-600">Titre</th>
            <th class="px-2 py-1.5 font-semibold text-gray-600">MES</th>
            <th class="px-2 py-1.5 font-semibold text-gray-600">Reçu</th>
            <th class="px-2 py-1.5 font-semibold text-gray-600">Statut</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="plan in pt" :key="plan.id" class="border-b border-gray-100">
            <td class="px-2 py-1.5 font-mono text-gray-900">{{ plan.indice }}</td>
            <td class="px-2 py-1.5 text-gray-900">{{ plan.titre || '-' }}</td>
            <td class="px-2 py-1.5 text-gray-600">{{ formatDate(plan.date_mes) }}</td>
            <td class="px-2 py-1.5 text-gray-600">{{ formatDate(plan.date_recu) }}</td>
            <td class="px-2 py-1.5">
              <span
                class="inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold"
                :class="{
                  'bg-primary-100 text-primary-700 print:bg-primary-50': getPtStatus(plan).color === 'primary',
                  'bg-amber-100 text-amber-700 print:bg-amber-50': getPtStatus(plan).color === 'amber',
                  'bg-secondary-100 text-secondary-700 print:bg-secondary-50':
                    getPtStatus(plan).color === 'secondary',
                  'bg-gray-100 text-gray-600 print:bg-gray-50': getPtStatus(plan).color === 'gray'
                }">
                {{ getPtStatus(plan).label }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

