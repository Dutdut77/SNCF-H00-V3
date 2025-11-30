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
    type-key="terrain"
    title="Commentaires - Terrain"
    description="Retours d'informations du terrain."
    icon="lucide:land-plot"
    tone="violet"
  />
</template>


