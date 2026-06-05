<script setup>
/**
 * Carte d'une question dans le canvas.
 * - Header coloré avec badge numéro (Q1, Q1.2…) + libellé du type
 * - Titre + description optionnelle
 * - Chips de réponses inline (uniques/booleen) ou liste verticale (multiple)
 * - Émet les positions absolues de chaque port pour que le canvas dessine les connecteurs
 */
const props = defineProps({
  question:   { type: Object, required: true },
  qNumber:    { type: String, default: '' },
  selected:   { type: Boolean, default: false },
  isStart:    { type: Boolean, default: false },
  isGeneric:  { type: Boolean, default: false },
  nodeWidth:  { type: Number, default: 280 },
})

const emit = defineEmits(['select', 'setStart', 'createNext', 'createNextFromQuestion'])

const typeLabel = computed(() => ({
  unique: 'Choix unique',
  multiple: 'Choix multiple',
  booleen: 'Oui / Non',
}[props.question.type] || props.question.type))

const typeIcon = computed(() => ({
  unique: 'lucide:circle-dot',
  multiple: 'lucide:check-square',
  booleen: 'lucide:toggle-left',
}[props.question.type] || 'lucide:help-circle'))

const headerTone = computed(() => {
  if (props.isStart) return { bg: 'bg-amber-50', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-800', ring: 'ring-amber-200' }
  if (props.isGeneric) return { bg: 'bg-amber-50', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-800', ring: 'ring-amber-200' }
  return { bg: 'bg-violet-50', text: 'text-violet-700', badge: 'bg-violet-100 text-violet-700', ring: 'ring-violet-200' }
})
</script>

<template>
  <div
    class="select-none rounded-2xl border-2 bg-white shadow-sm transition-shadow hover:shadow-md dark:bg-slate-800"
    :class="[
      selected
        ? 'border-violet-500 ring-4 ring-violet-100 dark:border-violet-500 dark:ring-violet-900/30'
        : isStart
          ? 'border-amber-300 dark:border-amber-700/60'
          : isGeneric
            ? 'border-amber-200 dark:border-amber-700/40'
            : 'border-slate-200 hover:border-violet-300 dark:border-slate-700',
    ]"
    :style="{ width: nodeWidth + 'px' }"
    @click.stop="emit('select', question)">

    <!-- Header band -->
    <div
      class="flex items-center gap-2 rounded-t-2xl px-3 py-2"
      :class="headerTone.bg">
      <span
        class="inline-flex items-center rounded-md px-1.5 py-0.5 font-mono text-[11px] font-bold tracking-tight"
        :class="headerTone.badge">
        {{ qNumber || 'Q?' }}
      </span>
      <span
        class="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider"
        :class="headerTone.text">
        <Icon :name="typeIcon" size="10" />
        {{ typeLabel }}
      </span>
      <span
        v-if="isStart"
        class="ml-auto inline-flex items-center gap-0.5 rounded bg-amber-200 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-800">
        <Icon name="lucide:flag" size="9" />
        Départ
      </span>
      <span
        v-else-if="isGeneric"
        class="ml-auto inline-flex items-center gap-0.5 rounded bg-amber-200 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-800 dark:bg-amber-700/40 dark:text-amber-200">
        <Icon name="lucide:bookmark" size="9" />
        Générique
      </span>
      <button
        v-else
        type="button"
        class="ml-auto rounded p-1 text-slate-400 transition hover:bg-white/60 hover:text-amber-600"
        title="Définir comme question de départ"
        @click.stop="emit('setStart', question.id)">
        <Icon name="lucide:flag" size="11" />
      </button>
    </div>

    <!-- Title + description -->
    <div class="px-4 pt-3 pb-2">
      <h4 class="text-[15px] leading-snug font-semibold text-slate-900 dark:text-slate-100">
        {{ question.libelle || 'Question sans titre' }}
      </h4>
      <p
        v-if="question.description"
        class="mt-1 line-clamp-2 text-[11px] text-slate-500 dark:text-slate-400">
        {{ question.description }}
      </p>
    </div>

    <!-- Réponses inline (unique / booleen) -->
    <div
      v-if="question.type !== 'multiple'"
      class="flex flex-wrap items-center gap-1.5 px-3 pb-3">
      <template v-if="question.reponses?.length">
        <div
          v-for="r in question.reponses"
          :key="r.id"
          class="group/r inline-flex max-w-full items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[12px] font-medium text-slate-700 transition group-hover:border-slate-300 dark:border-slate-600 dark:bg-slate-700/50 dark:text-slate-200"
          :data-reponse-id="r.id">
          <span class="truncate">{{ r.libelle || '—' }}</span>
          <span
            v-if="(r.articles?.length || 0) > 0"
            class="inline-flex items-center gap-0.5 text-[9px] text-slate-400"
            :title="`${r.articles.length} article(s)`">
            <Icon name="lucide:package" size="9" />
            {{ r.articles.length }}
          </span>
          <span
            v-if="(r.ensembles?.length || 0) > 0"
            class="inline-flex items-center gap-0.5 text-[9px] text-indigo-500"
            :title="`${r.ensembles.length} ensemble(s)`">
            <Icon name="lucide:layers" size="9" />
            {{ r.ensembles.length }}
          </span>
        </div>
      </template>
      <p
        v-else
        class="rounded-md border border-dashed border-slate-300 px-2 py-1 text-[10px] italic text-slate-400 dark:border-slate-600">
        Aucune réponse — clique pour éditer
      </p>
    </div>

    <!-- Réponses convergentes (multiple) -->
    <ul
      v-else
      class="space-y-1 px-3 pb-3">
      <li
        v-for="r in question.reponses"
        :key="r.id"
        class="flex items-center gap-2 rounded-md border border-slate-100 bg-slate-50 px-2 py-1 text-[12px] dark:border-slate-700 dark:bg-slate-700/40">
        <Icon name="lucide:square-check" size="11" class="flex-none text-slate-400" />
        <span class="min-w-0 flex-1 truncate font-medium text-slate-700 dark:text-slate-200">{{ r.libelle || '—' }}</span>
        <span
          v-if="(r.articles?.length || 0) > 0"
          class="inline-flex items-center gap-0.5 text-[9px] text-slate-400">
          <Icon name="lucide:package" size="9" />
          {{ r.articles.length }}
        </span>
        <span
          v-if="(r.ensembles?.length || 0) > 0"
          class="inline-flex items-center gap-0.5 text-[9px] text-indigo-500">
          <Icon name="lucide:layers" size="9" />
          {{ r.ensembles.length }}
        </span>
      </li>
      <li
        v-if="!question.reponses?.length"
        class="rounded-md border border-dashed border-slate-300 px-2 py-1 text-[10px] italic text-slate-400 dark:border-slate-600">
        Aucune réponse — clique pour éditer
      </li>
    </ul>
  </div>
</template>
