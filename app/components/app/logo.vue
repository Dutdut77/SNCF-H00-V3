<script setup>
// Logo de l'infrapôle (Paramètres → Application → Identité). Sans logo réglé, rien ne s'affiche :
// l'identité reste portée par « H00 Travaux ».
const { logoUrl, nomEntite } = useApplication()
</script>

<template>
  <img v-if="logoUrl" :src="logoUrl" :alt="nomEntite ? `Logo ${nomEntite}` : 'Logo'" />
</template>
