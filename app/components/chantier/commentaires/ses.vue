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
    type-key="ses"
    title="Commentaires - SES"
    description="Suivi de la signalisation, particulariés SES..."
    icon="lucide:zap"
    tone="amber"
  />
</template>


