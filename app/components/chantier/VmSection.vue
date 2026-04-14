<script setup>
const props = defineProps({
  title: { type: String, required: true },
  sectionType: { type: String, required: true },
  firstLabel: { type: String, default: 'VOIE' },
  lignes: { type: Array, required: true },
  totaux: { type: Object, required: true },
  typesTravaux: { type: Array, required: true },
  typesTraverses: { type: Array, required: true },
  fmt: { type: Function, required: true },
  readonly: { type: Boolean, default: false }
})

const emit = defineEmits(['add', 'update', 'delete'])

const confirmDeleteId = ref(null)

const profilRailOptions = [
  { id: 46, label: '46 kg' },
  { id: 50, label: '50 kg' },
  { id: 60, label: '60 kg' }
]

const traversesOptions = computed(() =>
  props.typesTraverses.map((t) => ({ id: t, label: t }))
)

const travauxOptions = computed(() =>
  props.typesTravaux.map((t) => ({ id: t, label: t }))
)
</script>

<template>
  <div class="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
    <!-- En-tête section -->
    <div class="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
      <h2 class="font-semibold text-gray-700 dark:text-gray-200">{{ title }}</h2>
      <button
        v-if="!readonly"
        type="button"
        class="flex items-center gap-1.5 rounded-lg bg-orange-50 px-3 py-1.5 text-sm font-medium text-orange-600 transition hover:bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400 dark:hover:bg-orange-900/30"
        @click="emit('add')">
        <Icon name="lucide:plus" size="14" />
        Ajouter une ligne
      </button>
    </div>

    <!-- Tableau -->
    <div class="overflow-x-auto">
      <table class="w-full min-w-[1600px] text-sm">
        <!-- En-têtes -->
        <thead>
          <tr class="bg-gray-50 text-xs font-medium text-gray-500 dark:bg-gray-700/30 dark:text-gray-400">
            <th class="w-36 px-2 py-2 text-center">{{ firstLabel }}</th>
            <th class="w-36 px-2 py-2 text-center">Pk début</th>
            <th class="w-36 px-2 py-2 text-center">Pk fin</th>
            <th class="w-32 px-2 py-2 text-center">Long. (m)</th>
            <th class="w-36 px-2 py-2 text-center">Profil (kg)</th>
            <th class="w-40 px-2 py-2 text-center">Traverses</th>
            <th class="w-36 px-2 py-2 text-center">Travelage</th>
            <th class="w-40 px-2 py-2 text-center">Travaux</th>
            <th class="w-36 px-2 py-2 text-center">Prof. (cm)</th>
            <th class="bg-blue-50 px-2 py-2 text-center dark:bg-blue-900/10" colspan="2">Vieux ballast</th>
            <th class="bg-green-50 px-2 py-2 text-center dark:bg-green-900/10" colspan="2">T. bois</th>
            <th class="bg-amber-50 px-2 py-2 text-center dark:bg-amber-900/10" colspan="2">TBA Bibloc</th>
            <th class="bg-purple-50 px-2 py-2 text-center dark:bg-purple-900/10" colspan="2">TBA Monobloc</th>
            <th class="bg-red-50 px-2 py-2 text-center dark:bg-red-900/10" colspan="2">Rail</th>
            <th v-if="!readonly" class="w-8"></th>
          </tr>
          <tr class="bg-gray-50 text-xs text-gray-400 dark:bg-gray-700/30 dark:text-gray-500">
            <th colspan="9"></th>
            <th class="bg-blue-50 px-2 py-1 text-center dark:bg-blue-900/10">Vol. m³</th>
            <th class="bg-blue-50 px-2 py-1 text-center dark:bg-blue-900/10">T</th>
            <th class="bg-green-50 px-2 py-1 text-center dark:bg-green-900/10">Nb</th>
            <th class="bg-green-50 px-2 py-1 text-center dark:bg-green-900/10">T</th>
            <th class="bg-amber-50 px-2 py-1 text-center dark:bg-amber-900/10">Nb</th>
            <th class="bg-amber-50 px-2 py-1 text-center dark:bg-amber-900/10">T</th>
            <th class="bg-purple-50 px-2 py-1 text-center dark:bg-purple-900/10">Nb</th>
            <th class="bg-purple-50 px-2 py-1 text-center dark:bg-purple-900/10">T</th>
            <th class="bg-red-50 px-2 py-1 text-center dark:bg-red-900/10">m</th>
            <th class="bg-red-50 px-2 py-1 text-center dark:bg-red-900/10">T</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          <!-- Ligne de saisie -->
          <tr
            v-for="ligne in lignes"
            :key="ligne.id"
            class="border-t border-gray-100 hover:bg-gray-50/50 dark:border-gray-700/50 dark:hover:bg-gray-700/20">
            <!-- Voie -->
            <td class="px-1 py-1">
              <input
                :value="ligne.voie"
                type="text"
                :placeholder="firstLabel"
                :disabled="readonly"
                class="w-full rounded border border-gray-200 bg-white px-2 py-1 text-center text-sm text-gray-700 focus:border-orange-400 focus:outline-none disabled:cursor-default disabled:bg-gray-50 disabled:text-gray-600 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:disabled:bg-gray-800 dark:disabled:text-gray-400"
                @change="emit('update', ligne, 'voie', $event.target.value)" />
            </td>
            <!-- Pk début -->
            <td class="px-1 py-1">
              <input
                :value="ligne.pk_debut"
                type="number"
                step="0.001"
                placeholder="0.000"
                :disabled="readonly"
                class="w-full rounded border border-gray-200 bg-white px-2 py-1 text-center text-sm text-gray-700 focus:border-orange-400 focus:outline-none disabled:cursor-default disabled:bg-gray-50 disabled:text-gray-600 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:disabled:bg-gray-800 dark:disabled:text-gray-400"
                @change="emit('update', ligne, 'pk_debut', $event.target.value)" />
            </td>
            <!-- Pk fin -->
            <td class="px-1 py-1">
              <input
                :value="ligne.pk_fin"
                type="number"
                step="0.001"
                placeholder="0.000"
                :disabled="readonly"
                class="w-full rounded border border-gray-200 bg-white px-2 py-1 text-center text-sm text-gray-700 focus:border-orange-400 focus:outline-none disabled:cursor-default disabled:bg-gray-50 disabled:text-gray-600 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:disabled:bg-gray-800 dark:disabled:text-gray-400"
                @change="emit('update', ligne, 'pk_fin', $event.target.value)" />
            </td>
            <!-- Longueur (calculée) -->
            <td class="px-2 py-1 text-center font-medium text-gray-600 dark:text-gray-300">
              {{ ligne.calc.longueur != null ? fmt(ligne.calc.longueur, 1) : '—' }}
            </td>
            <!-- Profil rail -->
            <td class="px-1 py-1">
              <span v-if="readonly" class="block px-2 py-1 text-center text-sm text-gray-600 dark:text-gray-400">
                {{ ligne.profil_rail ? ligne.profil_rail + ' kg' : '—' }}
              </span>
              <AppSelect
                v-else
                :model-value="ligne.profil_rail"
                :options="profilRailOptions"
                placeholder="—"
                nullable
                centered
                @update:model-value="emit('update', ligne, 'profil_rail', $event)" />
            </td>
            <!-- Type traverses -->
            <td class="px-1 py-1">
              <span v-if="readonly" class="block px-2 py-1 text-center text-sm text-gray-600 dark:text-gray-400">
                {{ ligne.type_traverses || '—' }}
              </span>
              <AppSelect
                v-else
                :model-value="ligne.type_traverses"
                :options="traversesOptions"
                placeholder="—"
                nullable
                centered
                @update:model-value="emit('update', ligne, 'type_traverses', $event)" />
            </td>
            <!-- Travelage -->
            <td class="px-1 py-1">
              <input
                :value="ligne.travelage"
                type="number"
                placeholder="1666"
                :disabled="readonly"
                class="w-full rounded border border-gray-200 bg-white px-2 py-1 text-center text-sm text-gray-700 focus:border-orange-400 focus:outline-none disabled:cursor-default disabled:bg-gray-50 disabled:text-gray-600 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:disabled:bg-gray-800 dark:disabled:text-gray-400"
                @change="emit('update', ligne, 'travelage', $event.target.value)" />
            </td>
            <!-- Type travaux -->
            <td class="px-1 py-1">
              <span v-if="readonly" class="block px-2 py-1 text-center text-sm text-gray-600 dark:text-gray-400">
                {{ ligne.type_travaux || '—' }}
              </span>
              <AppSelect
                v-else
                :model-value="ligne.type_travaux"
                :options="travauxOptions"
                placeholder="—"
                nullable
                centered
                @update:model-value="emit('update', ligne, 'type_travaux', $event)" />
            </td>
            <!-- Profondeur -->
            <td class="px-1 py-1">
              <input
                :value="ligne.profondeur_degarnissage"
                type="number"
                placeholder="—"
                :disabled="readonly"
                class="w-full rounded border border-gray-200 bg-white px-2 py-1 text-center text-sm text-gray-700 focus:border-orange-400 focus:outline-none disabled:cursor-default disabled:bg-gray-50 disabled:text-gray-600 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:disabled:bg-gray-800 dark:disabled:text-gray-400"
                @change="emit('update', ligne, 'profondeur_degarnissage', $event.target.value)" />
            </td>
            <!-- Ballast -->
            <td class="px-2 py-1 text-center text-blue-700 dark:text-blue-300">{{ fmt(ligne.calc.ballast_volume) }}</td>
            <td class="px-2 py-1 text-center text-blue-700 dark:text-blue-300">{{ fmt(ligne.calc.ballast_tonnage) }}</td>
            <!-- T. bois -->
            <td class="px-2 py-1 text-center text-green-700 dark:text-green-300">{{ fmt(ligne.calc.tbois_nombre) }}</td>
            <td class="px-2 py-1 text-center text-green-700 dark:text-green-300">{{ fmt(ligne.calc.tbois_tonnage) }}</td>
            <!-- Bibloc -->
            <td class="px-2 py-1 text-center text-amber-700 dark:text-amber-300">{{ fmt(ligne.calc.bibloc_nombre) }}</td>
            <td class="px-2 py-1 text-center text-amber-700 dark:text-amber-300">
              {{ fmt(ligne.calc.bibloc_tonnage) }}
            </td>
            <!-- Monobloc -->
            <td class="px-2 py-1 text-center text-purple-700 dark:text-purple-300">
              {{ fmt(ligne.calc.monobloc_nombre) }}
            </td>
            <td class="px-2 py-1 text-center text-purple-700 dark:text-purple-300">
              {{ fmt(ligne.calc.monobloc_tonnage) }}
            </td>
            <!-- Rail -->
            <td class="px-2 py-1 text-center text-red-700 dark:text-red-300">{{ fmt(ligne.calc.rail_longueur) }}</td>
            <td class="px-2 py-1 text-center text-red-700 dark:text-red-300">{{ fmt(ligne.calc.rail_tonnage) }}</td>
            <!-- Supprimer -->
            <td v-if="!readonly" class="px-1 py-1">
              <button
                v-if="confirmDeleteId !== ligne.id"
                type="button"
                class="rounded p-1 text-gray-300 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                title="Supprimer"
                @click="confirmDeleteId = ligne.id">
                <Icon name="lucide:trash-2" size="14" />
              </button>
              <div v-else class="flex items-center gap-1">
                <button
                  type="button"
                  class="rounded p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  title="Confirmer"
                  @click="
                    () => {
                      emit('delete', ligne.id)
                      confirmDeleteId = null
                    }
                  ">
                  <Icon name="lucide:check" size="14" />
                </button>
                <button
                  type="button"
                  class="rounded p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="Annuler"
                  @click="confirmDeleteId = null">
                  <Icon name="lucide:x" size="14" />
                </button>
              </div>
            </td>
          </tr>

          <!-- État vide -->
          <tr v-if="lignes.length === 0">
            <td colspan="20" class="px-4 py-6 text-center text-sm text-gray-400 dark:text-gray-500">
              Aucune ligne — cliquez sur "Ajouter une ligne" pour commencer
            </td>
          </tr>
        </tbody>

        <!-- Ligne de somme -->
        <tfoot v-if="lignes.length > 0">
          <tr
            class="border-t-2 border-gray-300 bg-gray-50 text-sm font-semibold text-gray-600 dark:border-gray-600 dark:bg-gray-700/30 dark:text-gray-300">
            <td colspan="9" class="px-2 py-2 text-right text-gray-500">Somme :</td>
            <td class="px-2 py-2 text-center text-blue-700 dark:text-blue-300">{{ fmt(totaux.ballast_volume) }}</td>
            <td class="px-2 py-2 text-center text-blue-700 dark:text-blue-300">{{ fmt(totaux.ballast_tonnage) }}</td>
            <td class="px-2 py-2 text-center text-green-700 dark:text-green-300">{{ fmt(totaux.tbois_nombre) }}</td>
            <td class="px-2 py-2 text-center text-green-700 dark:text-green-300">{{ fmt(totaux.tbois_tonnage) }}</td>
            <td class="px-2 py-2 text-center text-amber-700 dark:text-amber-300">{{ fmt(totaux.bibloc_nombre) }}</td>
            <td class="px-2 py-2 text-center text-amber-700 dark:text-amber-300">{{ fmt(totaux.bibloc_tonnage) }}</td>
            <td class="px-2 py-2 text-center text-purple-700 dark:text-purple-300">{{ fmt(totaux.monobloc_nombre) }}</td>
            <td class="px-2 py-2 text-center text-purple-700 dark:text-purple-300">
              {{ fmt(totaux.monobloc_tonnage) }}
            </td>
            <td class="px-2 py-2 text-center text-red-700 dark:text-red-300">{{ fmt(totaux.rail_longueur) }}</td>
            <td class="px-2 py-2 text-center text-red-700 dark:text-red-300">{{ fmt(totaux.rail_tonnage) }}</td>
            <td v-if="!readonly"></td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
</template>
