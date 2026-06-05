<script setup>
const props = defineProps({
  chantier: {
    type: Object,
    required: true
  }
})

const { equip, canEditLogistique, enregistrer } = useLogistiqueEditor(() => props.chantier?.id)
</script>

<template>
  <ChantierLogistiqueShell
    title="Radio"
    description="Besoin, couverture, pose et dépose"
    icon="lucide:radio"
    :can-edit="canEditLogistique"
    :ready="!!equip"
    @save="enregistrer">
    <section class="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
      <LogistiqueRadioEditor v-model="equip.radios" />
    </section>
  </ChantierLogistiqueShell>
</template>
