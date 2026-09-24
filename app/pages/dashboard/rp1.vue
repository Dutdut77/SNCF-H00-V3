<script setup>
definePageMeta({
  requiresAuth: true,
  requiredRole: 'admin'
})

useHead({
  title: 'H00 - RP1 / RP3',
  description: 'Liste des taches RP1 et RP3 de tous les chantiers'
})

const { setLoader } = useLoader()
const { getChantiers, getChantiersNonTermines } = useChantiers()
const { allTachesRp1, getTachesRp1 } = useTaches()
const { getH00Rp1ByChantierArray } = useH00()

// Tâches RP1 / RP3 des chantiers non terminés, regroupées par chantier (DashboardSuiviTaches)
const chantiers = ref([])

const loadData = async () => {
  setLoader(true)
  try {
    await getChantiers()
    await getTachesRp1()
    const tacheIds = allTachesRp1.value.map((tache) => tache.id)
    const chantierIds = getChantiersNonTermines.value.map((chantier) => chantier.id)
    const { data, error } = await getH00Rp1ByChantierArray(chantierIds, tacheIds)
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
    titre="RP1 / RP3"
    description="Les tâches RP1 et RP3 des chantiers en cours"
    :unite="{ singulier: 'tâche RP1 / RP3', pluriel: 'tâches RP1 / RP3' }">
    <template #impression="{ chantiers: aImprimer }">
      <DashboardPrintRp1 :taches="aImprimer" />
    </template>
  </DashboardSuiviTaches>
</template>
