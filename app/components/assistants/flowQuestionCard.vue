<script setup>
/** Carte « question » du flowchart (placée en absolu par treeView). */
defineProps({
  question: { type: Object, required: true },
  number:   { type: String, default: '' },
  isStart:  { type: Boolean, default: false },
  selected: { type: Boolean, default: false },
})
defineEmits(['select', 'setStart', 'duplicate'])

const typeMeta = (t) => ({
  unique:   { label: 'Choix unique',   icon: 'lucide:circle-dot' },
  multiple: { label: 'Choix multiple', icon: 'lucide:check-square' },
  booleen:  { label: 'Oui / Non',      icon: 'lucide:toggle-left' },
}[t] || { label: t, icon: 'lucide:help-circle' })
</script>

<template>
  <div
    data-card
    class="group w-60 cursor-pointer rounded-xl border bg-white shadow-sm transition-all dark:bg-slate-800"
    :class="selected
      ? 'border-secondary-400 ring-2 ring-secondary-200 dark:border-secondary-500 dark:ring-secondary-900/40'
      : isStart
        ? 'border-amber-300 hover:border-amber-400 dark:border-amber-700/60'
        : 'border-slate-200 hover:border-secondary-300 dark:border-slate-700 dark:hover:border-secondary-600'"
    @click="$emit('select')">

    <!-- Header -->
    <div class="flex items-center gap-2 border-b border-slate-100 px-3 py-2 dark:border-slate-700/60">
      <span class="inline-flex flex-none items-center rounded-md bg-secondary-100 px-1.5 py-0.5 font-mono text-[11px] font-bold text-secondary-700 dark:bg-secondary-900/40 dark:text-secondary-300">
        {{ number || 'Q?' }}
      </span>
      <span class="inline-flex flex-none items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        <Icon :name="typeMeta(question.type).icon" size="11" />
        {{ typeMeta(question.type).label }}
      </span>
      <span
        v-if="isStart"
        class="inline-flex flex-none items-center gap-0.5 rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
        <Icon name="lucide:flag" size="9" />
        Départ
      </span>

      <div class="ml-auto flex flex-none items-center gap-0.5" @click.stop>
        <button
          v-if="!isStart"
          type="button"
          title="Définir comme question de départ"
          class="rounded p-1 text-slate-400 opacity-0 transition hover:bg-amber-50 hover:text-amber-600 group-hover:opacity-100 dark:hover:bg-amber-900/20"
          @click="$emit('setStart')">
          <Icon name="lucide:flag" size="13" />
        </button>
        <button
          type="button"
          title="Dupliquer la question"
          class="rounded p-1 text-slate-400 opacity-0 transition hover:bg-secondary-50 hover:text-secondary-600 group-hover:opacity-100 dark:hover:bg-secondary-900/20"
          @click="$emit('duplicate')">
          <Icon name="lucide:copy" size="13" />
        </button>
      </div>
    </div>

    <!-- Corps -->
    <div class="px-3 py-2.5">
      <h4 class="text-sm leading-snug font-semibold text-slate-800 dark:text-slate-100">
        {{ question.libelle || 'Question sans titre' }}
      </h4>
      <p v-if="question.description" class="mt-0.5 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
        {{ question.description }}
      </p>
    </div>
  </div>
</template>
