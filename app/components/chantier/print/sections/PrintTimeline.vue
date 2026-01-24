<script setup>
const props = defineProps({
  timeline: {
    type: Array,
    required: true
  }
})

// Trier la timeline
const sortedTimeline = computed(() => {
  return [...props.timeline].sort((a, b) => {
    if (a.annee_debut !== b.annee_debut) return a.annee_debut - b.annee_debut
    return a.semaine_debut - b.semaine_debut
  })
})

// Type de timeline
const getTypeLabel = (type) => {
  const labels = { weekend: 'Week-end', semaine: 'Semaine' }
  return labels[type] || 'Semaine'
}
</script>

<template>
  <section v-if="sortedTimeline.length > 0" class="mb-8 break-inside-avoid">
    <div class="mb-4 flex items-center gap-3 border-b border-gray-100 pb-2">
      <div class="bg-primary-600/20 text-primary-700 flex h-8 w-8 items-center justify-center rounded-lg">
        <Icon name="lucide:git-branch" size="18" />
      </div>
      <h3 class="text-lg font-bold text-gray-700 uppercase">Timeline</h3>
    </div>

    <div class="relative ml-4 border-l-2 border-gray-200 pl-4">
      <div v-for="item in sortedTimeline" :key="item.id" class="relative mb-4 last:mb-0">
        <div
          class="absolute top-1 -left-[23px] h-3 w-3 rounded-full border-2 border-white"
          :class="item.type === 'weekend' ? 'bg-orange-500' : 'bg-secondary-900'"></div>
        <div class="rounded-lg border border-gray-100 bg-gray-50 p-3 print:bg-white">
          <div class="mb-1 flex items-center gap-2">
            <span
              class="text-sm font-semibold uppercase"
              :class="item.type === 'weekend' ? 'text-orange-600' : 'text-secondary-900'">
              {{ getTypeLabel(item.type) }}
            </span>
            <span class="text-xs text-gray-500">
              S{{ item.semaine_debut }}/{{ item.annee_debut }}
              <template v-if="item.semaine_fin">→ S{{ item.semaine_fin }}/{{ item.annee_fin }}</template>
            </span>
          </div>
          <div
            v-html="item.contenu"
            class="text-xs leading-snug font-medium whitespace-pre-line text-gray-800"></div>
        </div>
      </div>
    </div>
  </section>
</template>

