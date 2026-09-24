<script setup>
// Filtre en pastilles de la barre d'outils (design V4) : une option active à la fois, avec compteur et
// point de couleur facultatifs. Défile horizontalement sur mobile.
//   <AppFilterPills v-model="etat" :options="[{ id: null, label: 'Tous', count: 12 }, { id: 2, label: 'Pré-op', dot: 'bg-lime-500' }]" />
const model = defineModel({ default: null })

const props = defineProps({
  options: { type: Array, required: true },
  label: { type: String, default: 'Filtrer' }
})
</script>

<template>
  <div class="-mx-1 flex gap-1.5 overflow-x-auto px-1 py-0.5" role="group" :aria-label="props.label">
    <button
      v-for="o in props.options"
      :key="String(o.id)"
      type="button"
      class="focus-visible:outline-secondary-500 flex h-10 flex-none cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
      :class="filtrePastille(model === o.id)"
      :aria-pressed="model === o.id"
      @click="model = o.id">
      <!-- Point de couleur cerclé de blanc sur le dégradé du filtre actif, pour rester lisible -->
      <span
        v-if="o.dot"
        class="size-2 shrink-0 rounded-full"
        :class="[o.dot, { 'ring-2 ring-white/85': model === o.id }]" />
      {{ o.label }}
      <span
        v-if="o.count !== undefined"
        class="inline-flex h-5 min-w-5.5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold tabular-nums"
        :class="filtreCompteur(model === o.id)">
        {{ o.count }}
      </span>
    </button>
  </div>
</template>
