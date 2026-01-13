<script setup>
//    <AppButtonValidated class="w-32" theme="cancel"> <template #default> Se connecter </template> </AppButtonValidated>
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
  <!-- Delete -->
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
  <!-- Cancel -->
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
  <!-- White -->
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
  <!-- Blue -->
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
  <!-- Secondary -->
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
  <!-- Primary -->
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
