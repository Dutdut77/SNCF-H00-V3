<script setup>
definePageMeta({
  requiresAuth: true,
  requiredRole: 'admin'
})

useHead({
  title: 'H00 - Alertes',
  description: 'Alertes Chantiers'
})

const { setLoader } = useLoader()
const { getChantiers, getChantiersNonTermines } = useChantiers()
const { getH00AlertesByChantierArray } = useH00()

// Tâches en alerte des chantiers non terminés, regroupées par chantier (DashboardSuiviTaches)
const chantiers = ref([])

const loadData = async () => {
  setLoader(true)
  try {
    await getChantiers()
    const ids = getChantiersNonTermines.value.map((chantier) => chantier.id)
    const { data, error } = await getH00AlertesByChantierArray(ids)
    if (error) throw error
    chantiers.value = regrouperTachesParChantier(data)
  } catch (error) {
    console.error('Erreur lors du chargement des données:', error)
  } finally {
    setLoader(false)
  }
}

onMounted(loadData)
</script>

<template>
  <DashboardSuiviTaches
    :chantiers="chantiers"
    titre="Alertes"
    description="Les tâches signalées en alerte sur les chantiers en cours"
    :unite="{ singulier: 'alerte', pluriel: 'alertes' }">
    <template #impression="{ chantiers: aImprimer }">
      <DashboardPrintAlertes :alertes="aImprimer" />
    </template>
  </DashboardSuiviTaches>
</template>
