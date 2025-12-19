<script setup>
definePageMeta({
  requiresAuth: true,
  requiredRole: ''
})

useHead({
  title: 'H00 - Dashboard Alertes',
  description: 'Dashboard des alertes H00'
})

const { setLoader } = useLoader()
const { addToast } = useToast()

onMounted(() => {
  setLoader(true)
  addToast({
    title: 'Alertes',
    message: 'Dashboard des alertes H00'
  })
})
</script>

<template>
  <div>
    <h1>Alertes</h1>
  </div>
</template>
