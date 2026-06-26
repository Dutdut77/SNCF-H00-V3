<script setup>
/** Puce « réponse » du flowchart (placée en absolu par treeView). */
defineProps({
  reponse:    { type: Object, required: true },
  hasChild:   { type: Boolean, default: false },
  collapsed:  { type: Boolean, default: false },
  canAddNext: { type: Boolean, default: false },
})
defineEmits(['select', 'toggle', 'addNext'])
</script>

<template>
  <div
    data-card
    class="inline-flex w-max max-w-64 cursor-pointer items-center gap-1.5 rounded-full border border-amber-300 bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-900 shadow-sm transition hover:border-amber-400 hover:bg-amber-200/80 dark:border-amber-700/60 dark:bg-amber-900/30 dark:text-amber-200"
    @click="$emit('select')">

    <button
      v-if="hasChild"
      type="button"
      :title="collapsed ? 'Déplier la suite' : 'Replier la suite'"
      class="-ml-1 flex-none rounded p-0.5 text-amber-700/70 transition hover:bg-amber-300/60 hover:text-amber-900 dark:text-amber-300/70"
      @click.stop="$emit('toggle')">
      <Icon :name="collapsed ? 'lucide:chevron-right' : 'lucide:chevron-down'" size="13" />
    </button>

    <span class="min-w-0 truncate">{{ reponse.libelle || '—' }}</span>

    <span v-if="reponse.articles?.length" class="inline-flex flex-none items-center gap-0.5 text-[10px] text-amber-700/80 dark:text-amber-300/80">
      <Icon name="lucide:package" size="10" />{{ reponse.articles.length }}
    </span>
    <span v-if="reponse.ensembles?.length" class="inline-flex flex-none items-center gap-0.5 text-[10px] text-indigo-500 dark:text-indigo-300">
      <Icon name="lucide:layers" size="10" />{{ reponse.ensembles.length }}
    </span>

    <button
      v-if="canAddNext"
      type="button"
      title="Créer la question suivante"
      class="-mr-1 flex-none rounded-full p-0.5 text-amber-700/70 transition hover:bg-amber-300/60 hover:text-amber-900 dark:text-amber-300/70"
      @click.stop="$emit('addNext')">
      <Icon name="lucide:plus" size="13" />
    </button>
  </div>
</template>
