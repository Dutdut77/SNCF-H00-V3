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
    type-key="logistique"
    title="Commentaires - Logistique"
    description="Organisation des moyens, accès, approvisionnements et base vie..."
    icon="lucide:truck"
    tone="sky"
  />
</template>


