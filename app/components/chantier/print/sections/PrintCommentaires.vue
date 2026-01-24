<script setup>
const props = defineProps({
  commentaires: {
    type: Object,
    required: true
  }
})

const hasContent = computed(() => {
  return Object.values(props.commentaires).some((c) => c?.content)
})
</script>

<template>
  <section v-if="hasContent" class="mb-8 break-inside-avoid">
    <div class="mb-4 flex items-center gap-3 border-b border-gray-100 pb-2">
      <div class="bg-primary-600/20 text-primary-700 flex h-8 w-8 items-center justify-center rounded-lg">
        <Icon name="lucide:message-square" size="18" />
      </div>
      <h3 class="text-lg font-bold text-gray-700 uppercase">Commentaires</h3>
    </div>

    <div class="space-y-8">
      <div v-if="commentaires.generalite?.content" class="break-inside-avoid border-b border-gray-200 pb-4">
        <h5 class="bg-secondary-900/10 text-secondary-900 mb-2 p-2 text-xs font-bold tracking-wide">Généralités</h5>
        <div class="prose prose-sm max-w-none text-sm text-gray-700" v-html="commentaires.generalite.content"></div>
      </div>
      <div v-if="commentaires.ses?.content" class="break-inside-avoid border-b border-gray-200 pb-4">
        <h5 class="bg-secondary-900/10 text-secondary-900 mb-2 p-2 text-xs font-bold tracking-wide">SES</h5>
        <div class="prose prose-sm max-w-none text-sm text-gray-700" v-html="commentaires.ses.content"></div>
      </div>
      <div v-if="commentaires.voie?.content" class="break-inside-avoid border-b border-gray-200 pb-4">
        <h5 class="bg-secondary-900/10 text-secondary-900 mb-2 p-2 text-sm font-bold tracking-wide">Voie</h5>
        <div class="prose prose-sm max-w-none text-sm text-gray-700" v-html="commentaires.voie.content"></div>
      </div>
      <div v-if="commentaires.logistique?.content" class="break-inside-avoid border-b border-gray-200 pb-4">
        <h5 class="bg-secondary-900/10 text-secondary-900 mb-2 p-2 text-xs font-bold tracking-wide">Logistique</h5>
        <div class="prose prose-sm max-w-none text-sm text-gray-700" v-html="commentaires.logistique.content"></div>
      </div>
      <div v-if="commentaires.terrain?.content" class="break-inside-avoid border-b border-gray-200 pb-4">
        <h5 class="bg-secondary-900/10 text-secondary-900 mb-2 p-2 text-xs font-bold tracking-wide">Terrain</h5>
        <div class="prose prose-sm max-w-none text-sm text-gray-700" v-html="commentaires.terrain.content"></div>
      </div>
    </div>
  </section>
</template>

