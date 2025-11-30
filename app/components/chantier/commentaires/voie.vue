<script setup>
const props = defineProps({
  chantier: {
    type: Object,
    required: true,
  },
});
</script>

<template>
  <ChantierCommentairesCommentaireEditor
    :chantier="props.chantier"
    type-key="voie"
    title="Commentaires - Voie"
    description="Suivi des travaux voie, particulariés..."
    icon="lucide:train-track"
    tone="emerald"
  />
</template>


