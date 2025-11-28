<script setup>
//    <AppButtonValidated class="w-32" theme="cancel"> <template #default> Se connecter </template> </AppButtonValidated>
const props = defineProps({
  validated: {
    type: Boolean,
    default: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  type: {
    type: String,
    default: "submit",
  },
  theme: {
    type: String,
    default: "primary",
  },
});
</script>

<template>
  <button v-if="props.theme == 'delete'" :type="props.type" :disabled="!props.validated" class="text-center rounded-lg h-auto p-2 duration-300" :class="props.validated ? ' hover:shadow-md hover:shadow-red-800/50 cursor-pointer text-white bg-linear-to-br from-red-500 to-red-800' : 'bg-gray-200 text-gray-600  cursor-not-allowed '">
    <span v-if="props.loading">Connexion en cours</span>
    <span v-else><slot name="default"></slot></span>
  </button>
  <button v-else-if="props.theme == 'cancel'" :type="props.type" :disabled="!props.validated" class="text-center rounded-lg h-auto p-2 duration-300" :class="props.validated ? ' hover:shadow-md hover:shadow-slate-800/50 cursor-pointer text-white bg-linear-to-br from-slate-600 to-slate-900' : 'bg-gray-200 text-gray-600  cursor-not-allowed '">
    <span v-if="props.loading">Connexion en cours</span>
    <span v-else><slot name="default"></slot></span>
  </button>
  <button v-else-if="props.theme == 'white'" :type="props.type" :disabled="!props.validated" class="text-center rounded-lg h-auto p-2 duration-300" :class="props.validated ? ' hover:shadow-md hover:shadow-slate-800/50 cursor-pointer text-sncf-start bg-white' : 'bg-white text-cyan-700  cursor-not-allowed '">
    <span v-if="props.loading">Connexion en cours</span>
    <span v-else><slot name="default"></slot></span>
  </button>
  <button v-else-if="props.theme == 'blue'" :type="props.type" :disabled="!props.validated" class="text-center rounded-lg h-auto p-2 duration-300" :class="props.validated ? ' hover:shadow-md hover:shadow-sncf-bleu/30 cursor-pointer text-white bg-sncf-bleu' : 'bg-gray-200 text-gray-600  cursor-not-allowed '">
    <span v-if="props.loading">Connexion en cours</span>
    <span v-else><slot name="default"></slot></span>
  </button>
  <button v-else-if="props.theme == 'secondary'" :type="props.type" :disabled="!props.validated" class="text-center rounded-lg h-auto p-2 duration-300" :class="props.validated ? ' hover:shadow-md hover:shadow-sncf-secondary/30 cursor-pointer text-white bg-sncf-secondary' : 'bg-gray-200 text-gray-600  cursor-not-allowed '">
    <span v-if="props.loading">Connexion en cours</span>
    <span v-else><slot name="default"></slot></span>
  </button>
  <button v-else :type="props.type" :disabled="!props.validated" class="text-center text-shadow-xl font-medium rounded-lg h-auto p-2 duration-300" :class="props.validated ? 'hover:scale-105 hover:shadow-xl hover:shadow-primary-500/30 cursor-pointer text-white bg-linear-to-br from-primary-300 to-primary-500' : 'bg-gray-200 text-gray-600  cursor-not-allowed '">
    <span v-if="props.loading">Connexion en cours</span>
    <span v-else><slot name="default" ></slot></span>
  </button>
</template>

<style></style>
