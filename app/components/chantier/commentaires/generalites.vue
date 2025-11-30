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
    type-key="generalite"
    title="Commentaires - Généralités"
    description="Espace pour consigner tous les commentaires d’ordre général."
    icon="lucide:message-square-more"
    tone="primary"
  />
</template>


