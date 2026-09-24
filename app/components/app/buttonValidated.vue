<script setup>
//    <AppButtonValidated class="w-32" theme="cancel"> <template #default> Se connecter </template> </AppButtonValidated>
// Aucun commentaire HTML entre les boutons du gabarit : en développement, Vue rattache chaque commentaire à la
// branche v-else-if suivante, qui devient un fragment ; les classes passées au composant (ml-auto…) n'étaient
// alors plus appliquées. Thèmes, dans l'ordre du gabarit : delete, puis
//   - Cancel
//   - White
//   - Blue
//   - Secondary
//   - Brand (design V4) : action principale, dégradé magenta → prune du bouton de connexion
//   - Outline (design V4) : action secondaire, fond blanc et filet
//   - Outline danger (design V4) : action destructive, sans aplat rouge
//   - Primary
const props = defineProps({
  validated: {
    type: Boolean,
    default: true
  },
  loading: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    default: 'submit'
  },
  theme: {
    type: String,
    default: 'primary'
  }
})
</script>

<template>
  <button
    v-if="props.theme == 'delete'"
    :type="props.type"
    :disabled="!props.validated"
    class="relative h-auto rounded-lg px-4 py-2 text-center text-sm duration-300"
    :class="
      props.validated
        ? 'cursor-pointer bg-linear-to-br from-red-500 to-red-800 text-white hover:scale-105 hover:shadow-md hover:shadow-red-800/50'
        : 'bg-primary-200 text-primary-600 cursor-not-allowed'
    ">
    <span v-if="props.loading">Connexion en cours</span>
    <span v-else><slot name="default"></slot></span>
  </button>
  <button
    v-else-if="props.theme == 'cancel'"
    :type="props.type"
    :disabled="!props.validated"
    class="relative h-auto rounded-lg px-4 py-2 text-center text-sm duration-300"
    :class="
      props.validated
        ? 'bg-primary-600 cursor-pointer text-white hover:scale-105 hover:shadow-lg hover:shadow-slate-800/50'
        : 'bg-primary-200 text-primary-600 cursor-not-allowed'
    ">
    <span v-if="props.loading">Connexion en cours</span>
    <span v-else><slot name="default"></slot></span>
  </button>
  <button
    v-else-if="props.theme == 'white'"
    :type="props.type"
    :disabled="!props.validated"
    class="h-auto rounded-lg px-4 py-2 text-center text-sm duration-300"
    :class="
      props.validated
        ? 'cursor-pointer bg-white hover:scale-105 hover:shadow-md hover:shadow-slate-800/50'
        : 'cursor-not-allowed bg-white text-cyan-700'
    ">
    <span v-if="props.loading">Connexion en cours</span>
    <span v-else><slot name="default"></slot></span>
  </button>
  <button
    v-else-if="props.theme == 'blue'"
    :type="props.type"
    :disabled="!props.validated"
    class="h-auto rounded-lg px-4 py-2 text-center text-sm duration-300"
    :class="
      props.validated
        ? 'hover:shadow-bleu-400/30 bg-bleu-400 cursor-pointer text-white hover:scale-105 hover:shadow-md'
        : 'bg-primary-200 text-primary-600 cursor-not-allowed'
    ">
    <span v-if="props.loading">Connexion en cours</span>
    <span v-else><slot name="default"></slot></span>
  </button>
  <button
    v-else-if="props.theme == 'secondary'"
    :type="props.type"
    :disabled="!props.validated"
    class="relative h-auto rounded-lg px-4 py-2 text-center text-sm duration-300"
    :class="
      props.validated
        ? 'hover:shadow-secondary-500/30 border-secondary-400 from-secondary-400 to-secondary-500 cursor-pointer bg-linear-to-br text-white hover:scale-105 hover:shadow-lg'
        : 'bg-primary-200 text-primary-600 cursor-not-allowed'
    ">
    <span v-if="props.loading">Connexion en cours</span>
    <span v-else><slot name="default"></slot></span>
  </button>
  <button
    v-else-if="props.theme == 'brand'"
    :type="props.type"
    :disabled="!props.validated"
    class="focus-visible:outline-secondary-500 relative inline-flex min-h-10 items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2"
    :class="
      props.validated
        ? 'from-magenta-500 via-prune-500 to-prune-700 hover:from-magenta-700 hover:via-prune-600 hover:to-prune-800 cursor-pointer bg-linear-90 text-white'
        : 'bg-primary-200 text-primary-600 cursor-not-allowed'
    ">
    <span v-if="props.loading">Connexion en cours</span>
    <span v-else><slot name="default"></slot></span>
  </button>
  <button
    v-else-if="props.theme == 'outline'"
    :type="props.type"
    :disabled="!props.validated"
    class="focus-visible:outline-secondary-500 relative inline-flex min-h-10 items-center justify-center rounded-lg border px-4 py-2 text-sm font-semibold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2"
    :class="
      props.validated
        ? 'text-magenta-700 hover:border-magenta-300 hover:bg-magenta-50 cursor-pointer border-slate-300 bg-white dark:border-white/15 dark:bg-transparent dark:text-slate-100 dark:hover:bg-white/5'
        : 'bg-primary-200 text-primary-600 cursor-not-allowed border-transparent'
    ">
    <span v-if="props.loading">Connexion en cours</span>
    <span v-else><slot name="default"></slot></span>
  </button>
  <button
    v-else-if="props.theme == 'outline-danger'"
    :type="props.type"
    :disabled="!props.validated"
    class="relative inline-flex min-h-10 items-center justify-center rounded-lg border px-4 py-2 text-sm font-semibold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
    :class="
      props.validated
        ? 'cursor-pointer border-red-200 bg-white text-red-700 hover:border-red-300 hover:bg-red-50 dark:border-red-400/30 dark:bg-transparent dark:text-red-300 dark:hover:bg-red-500/10'
        : 'bg-primary-200 text-primary-600 cursor-not-allowed border-transparent'
    ">
    <span v-if="props.loading">Connexion en cours</span>
    <span v-else><slot name="default"></slot></span>
  </button>
  <button
    v-else
    :type="props.type"
    :disabled="!props.validated"
    class="text-shadow-xl relative h-auto rounded-lg px-4 py-2 text-center text-sm font-medium duration-300"
    :class="
      props.validated
        ? 'from-primary-700 to-primary-800 dark:from-primary-300 dark:to-primary-200 cursor-pointer bg-linear-to-br text-white hover:scale-105 hover:shadow-lg hover:shadow-slate-700/30'
        : 'bg-primary-200 text-primary-600 cursor-not-allowed'
    ">
    <span v-if="props.loading">Connexion en cours</span>
    <span v-else><slot name="default"></slot></span>
  </button>
</template>

<style></style>
