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
  <button
    v-if="props.theme == 'delete'"
    :type="props.type"
    :disabled="!props.validated"
    class="h-auto rounded-lg px-4 py-2 text-center text-sm duration-300"
    :class="
      props.validated
        ? 'cursor-pointer bg-linear-to-br from-red-500 to-red-800 text-white hover:scale-105 hover:shadow-md hover:shadow-red-800/50'
        : 'cursor-not-allowed bg-gray-200 text-gray-600'
    ">
    <span v-if="props.loading">Connexion en cours</span>
    <span v-else><slot name="default"></slot></span>
  </button>
  <button
    v-else-if="props.theme == 'cancel'"
    :type="props.type"
    :disabled="!props.validated"
    class="h-auto rounded-lg px-4 py-2 text-center text-sm duration-300"
    :class="
      props.validated
        ? 'cursor-pointer bg-linear-to-br from-slate-600 to-slate-900 text-white hover:scale-105 hover:shadow-lg hover:shadow-slate-800/50'
        : 'cursor-not-allowed bg-gray-200 text-gray-600'
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
        : 'cursor-not-allowed bg-gray-200 text-gray-600'
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
        ? 'hover:shadow-sncf-secondary/30 from-secondary-300 to-secondary-500 cursor-pointer bg-linear-to-br text-white hover:scale-105 hover:shadow-md'
        : 'cursor-not-allowed bg-gray-200 text-gray-600'
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
        ? 'hover:shadow-primary-500/30 from-primary-300 to-primary-500 cursor-pointer bg-linear-to-br text-white hover:scale-105 hover:shadow-lg'
        : 'cursor-not-allowed bg-gray-200 text-gray-600'
    ">
    <span v-if="props.loading">Connexion en cours</span>
    <span v-else><slot name="default"></slot></span>
  </button>
</template>

<style></style>
