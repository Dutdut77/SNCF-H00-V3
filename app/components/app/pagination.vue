<script setup>
// Pagination côté client.
//   <AppPagination v-model:page="page" v-model:page-size="pageSize" :total="items.length" />
const props = defineProps({
  total: { type: Number, required: true },
  pageSizeOptions: { type: Array, default: () => [10, 25, 50, 100] },
  label: { type: String, default: 'éléments' }
})

const page = defineModel('page', { default: 1 })
const pageSize = defineModel('pageSize', { default: 10 })

const totalPages = computed(() => Math.max(1, Math.ceil(props.total / pageSize.value)))

const from = computed(() => (props.total === 0 ? 0 : (page.value - 1) * pageSize.value + 1))
const to = computed(() => Math.min(page.value * pageSize.value, props.total))

// Fenêtre de numéros : 1 … n-1 [n] n+1 … dernier
const pages = computed(() => {
  const last = totalPages.value
  const current = page.value
  if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1)

  const around = [current - 1, current, current + 1].filter((p) => p > 1 && p < last)
  const result = [1, ...around, last]

  const withGaps = []
  result.forEach((p, i) => {
    if (i > 0 && p - result[i - 1] > 1) withGaps.push(`gap-${p}`)
    withGaps.push(p)
  })
  return withGaps
})

const goTo = (p) => {
  page.value = Math.min(Math.max(1, p), totalPages.value)
}

const sizeOptions = computed(() => props.pageSizeOptions.map((n) => ({ id: n, label: `${n} / page` })))

// Si le nombre d'éléments diminue (filtre, recherche), ne pas rester sur une page vide.
watch(totalPages, (max) => {
  if (page.value > max) page.value = max
})
</script>

<template>
  <div
    class="border-primary-200 flex flex-col items-center justify-between gap-3 border-t px-1 py-3 sm:flex-row">
    <p class="text-primary-500 text-xs">
      <template v-if="props.total > 0">
        Affichage <span class="text-primary-700 font-semibold">{{ from }}-{{ to }}</span> sur
        <span class="text-primary-700 font-semibold">{{ props.total }}</span> {{ props.label }}
      </template>
      <template v-else>Aucun résultat</template>
    </p>

    <div class="flex items-center gap-1">
      <button
        type="button"
        :disabled="page <= 1"
        class="border-primary-200 text-primary-600 hover:bg-primary-100 flex h-8 w-8 items-center justify-center rounded-lg border transition-colors disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
        aria-label="Page précédente"
        @click="goTo(page - 1)">
        <Icon name="lucide:chevron-left" size="16" />
      </button>

      <template v-for="p in pages" :key="p">
        <span v-if="typeof p === 'string'" class="text-primary-400 px-1 text-sm">…</span>
        <button
          v-else
          type="button"
          class="h-8 min-w-8 rounded-lg px-2 text-sm font-medium transition-colors"
          :class="
            p === page
              ? 'from-secondary-400 to-secondary-500 bg-linear-to-br text-white shadow-sm'
              : 'text-primary-600 hover:bg-primary-100 cursor-pointer'
          "
          @click="goTo(p)">
          {{ p }}
        </button>
      </template>

      <button
        type="button"
        :disabled="page >= totalPages"
        class="border-primary-200 text-primary-600 hover:bg-primary-100 flex h-8 w-8 items-center justify-center rounded-lg border transition-colors disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
        aria-label="Page suivante"
        @click="goTo(page + 1)">
        <Icon name="lucide:chevron-right" size="16" />
      </button>
    </div>

    <div class="w-32">
      <AppSelect v-model="pageSize" :options="sizeOptions" name="pageSize" centered />
    </div>
  </div>
</template>
