<script setup>
/**
 * Sélecteur « question suivante » cherchable.
 * - Options groupées par branche de la question de départ (via la numérotation
 *   hiérarchique Q1.2.3 → branche = réponse de départ), + « Non rattachées ».
 * - Champ de recherche pour s'y retrouver dans les grosses logiques.
 * - Badge numéro (Q1.2) sur chaque option pour situer dans le flux.
 */
const props = defineProps({
  modelValue:        { type: String, default: null },
  logique:           { type: Object, required: true },
  numbering:         { type: Map, required: true },
  currentQuestionId: { type: String, default: null },
})
const emit = defineEmits(['update:modelValue'])

const open = ref(false)
const search = ref('')
const searchRef = ref(null)

const byId = computed(() => new Map((props.logique.questions || []).map((q) => [q.id, q])))
const startQ = computed(() => byId.value.get(props.logique.start_question_id) || null)
const selected = computed(() => (props.modelValue ? byId.value.get(props.modelValue) : null))
const selectedNumber = computed(() => (props.modelValue ? props.numbering.get(props.modelValue) || '' : ''))

const branchLabel = (idx) => {
  const s = startQ.value
  if (!s) return `Branche ${idx}`
  if (s.type === 'multiple') return 'Puis'
  return s.reponses?.[idx - 1]?.libelle || `Réponse ${idx}`
}

const numKey = (s) => (s || '').replace(/^Q/, '').split('.').map((x) => parseInt(x, 10) || 0)
const sortByNum = (arr) => [...arr].sort((a, b) => {
  const A = numKey(a.number); const B = numKey(b.number)
  for (let i = 0; i < Math.max(A.length, B.length); i++) {
    const d = (A[i] ?? -1) - (B[i] ?? -1)
    if (d) return d
  }
  return 0
})

const groups = computed(() => {
  const q = (search.value || '').trim().toLowerCase()
  const matches = (o) => !q
    || (o.libelle || '').toLowerCase().includes(q)
    || o.number.toLowerCase().includes(q)
    || (o.description || '').toLowerCase().includes(q)

  const others = (props.logique.questions || [])
    .filter((x) => x.id !== props.currentQuestionId)
    .map((x) => ({ id: x.id, number: props.numbering.get(x.id) || '', libelle: x.libelle, description: x.description }))
    .filter(matches)

  const depart = []; const branchMap = new Map(); const orphans = []
  for (const o of others) {
    const n = o.number
    if (n === 'Q1') depart.push(o)
    else if (n.startsWith('Q1.')) {
      const idx = parseInt(n.slice(3).split('.')[0], 10) || 0
      if (!branchMap.has(idx)) branchMap.set(idx, [])
      branchMap.get(idx).push(o)
    } else orphans.push(o)
  }

  const res = []
  if (depart.length) res.push({ key: 'depart', label: 'Question de départ', icon: 'lucide:flag', items: sortByNum(depart) })
  for (const idx of [...branchMap.keys()].sort((a, b) => a - b)) {
    res.push({ key: `b${idx}`, label: branchLabel(idx), icon: 'lucide:corner-down-right', items: sortByNum(branchMap.get(idx)) })
  }
  if (orphans.length) res.push({ key: 'orphans', label: 'Non rattachées', icon: 'lucide:circle-slash', items: sortByNum(orphans) })
  return res
})

const showEnd = computed(() => {
  const q = (search.value || '').trim().toLowerCase()
  return !q || 'fin du wizard'.includes(q)
})
const totalShown = computed(() => groups.value.reduce((a, g) => a + g.items.length, 0))

const choose = (id) => { emit('update:modelValue', id); open.value = false; search.value = '' }

// Groupes repliés par défaut : on suit ceux qui sont DÉPLIÉS.
// (Pendant une recherche, tout est déplié pour ne pas masquer de résultat.)
const expandedGroups = ref(new Set())
const toggleGroup = (key) => {
  const s = new Set(expandedGroups.value)
  s.has(key) ? s.delete(key) : s.add(key)
  expandedGroups.value = s
}
const isCollapsed = (key) => !(search.value || '').trim() && !expandedGroups.value.has(key)

watch(open, (v) => {
  if (v) {
    expandedGroups.value = new Set() // réouverture → tout réduit
    nextTick(() => searchRef.value?.focus())
  } else {
    search.value = ''
  }
})
</script>

<template>
  <AppDropdownMenu v-model:open="open" full-width match-trigger-width :offset="4">
    <template #trigger>
      <div
        class="flex w-full cursor-pointer items-center gap-1.5 rounded border bg-white px-1.5 py-1 text-xs text-slate-700 transition dark:bg-slate-800 dark:text-slate-200"
        :class="open ? 'border-secondary-400 ring-1 ring-secondary-200 dark:border-secondary-500' : 'border-slate-200 hover:border-secondary-300 dark:border-slate-600'">
        <template v-if="selected">
          <span class="flex-none rounded bg-secondary-100 px-1 py-0.5 font-mono text-[10px] font-bold text-secondary-700 dark:bg-secondary-900/40 dark:text-secondary-300">{{ selectedNumber }}</span>
          <span class="min-w-0 flex-1 truncate">{{ selected.libelle }}</span>
        </template>
        <span v-else class="min-w-0 flex-1 truncate text-slate-400">— Fin du wizard —</span>
        <Icon name="lucide:chevrons-up-down" size="12" class="flex-none text-slate-400" />
      </div>
    </template>

    <div class="w-full">
      <div class="relative mb-1.5">
        <Icon name="lucide:search" size="12" class="absolute top-1/2 left-2 -translate-y-1/2 text-slate-400" />
        <input
          ref="searchRef"
          v-model="search"
          type="text"
          placeholder="Rechercher une question…"
          class="w-full rounded-md border border-slate-200 bg-white py-1.5 pr-2 pl-7 text-xs text-slate-700 outline-none focus:border-secondary-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200" />
      </div>

      <div class="max-h-72 overflow-y-auto">
        <button
          v-if="showEnd"
          type="button"
          class="flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-left text-xs transition"
          :class="modelValue == null ? 'bg-secondary-100 text-secondary-700 dark:bg-secondary-900/40 dark:text-secondary-300' : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700'"
          @click="choose(null)">
          <Icon name="lucide:flag-triangle-right" size="12" class="flex-none" />
          — Fin du wizard —
        </button>

        <div v-for="g in groups" :key="g.key">
          <button
            type="button"
            class="mt-1.5 mb-0.5 flex w-full items-center gap-1 rounded px-2 py-1 text-[10px] font-semibold tracking-wide text-slate-400 uppercase transition hover:bg-slate-100 dark:hover:bg-slate-700/50"
            @click="toggleGroup(g.key)">
            <Icon :name="isCollapsed(g.key) ? 'lucide:chevron-right' : 'lucide:chevron-down'" size="11" class="flex-none" />
            <Icon :name="g.icon" size="10" class="flex-none" />
            <span class="truncate">{{ g.label }}</span>
            <span class="ml-auto flex-none rounded-full bg-slate-100 px-1.5 font-mono text-[9px] text-slate-400 dark:bg-slate-700">{{ g.items.length }}</span>
          </button>
          <template v-if="!isCollapsed(g.key)">
            <button
              v-for="o in g.items"
              :key="o.id"
              type="button"
              :title="o.description || ''"
              class="flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-left text-xs transition"
              :class="modelValue === o.id ? 'bg-secondary-100 text-secondary-700 dark:bg-secondary-900/40 dark:text-secondary-300' : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700'"
              @click="choose(o.id)">
              <span class="flex-none rounded bg-slate-200 px-1 py-0.5 font-mono text-[10px] font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-300">{{ o.number }}</span>
              <span class="min-w-0 flex-1 truncate">{{ o.libelle }}</span>
            </button>
          </template>
        </div>

        <div v-if="totalShown === 0 && !showEnd" class="px-2 py-3 text-center text-xs text-slate-400">Aucun résultat</div>
      </div>
    </div>
  </AppDropdownMenu>
</template>
