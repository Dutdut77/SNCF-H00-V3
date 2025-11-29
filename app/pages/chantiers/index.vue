<script setup>
definePageMeta({
  requiresAuth: true,
  requiredRole: '',
});

useHead({
  title: "H00 - Chantiers",
  description: "Liste des chantiers H00",
});

const { setLoader } = useLoader();

setLoader(true);
</script>
<template>
  <div>
    <h1>Chantiers</h1>
  </div>
</template>