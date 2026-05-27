<script setup>
definePageMeta({
  requiresAuth: true,
  layout: false,
})

const route = useRoute()
const { getChantierById } = useChantiers()

const chantierId = computed(() => route.params.id)
const chantier = ref(null)
const loading = ref(true)

useHead({
  title: computed(() => chantier.value
    ? `Commandes matières — ${chantier.value.name || chantier.value.compte || 'Chantier'}`
    : 'Commandes matières'),
})

watch(chantierId, async (id) => {
  if (!id) return
  loading.value = true
  chantier.value = await getChantierById(id)
  loading.value = false
}, { immediate: true })

const backLink = computed(() => `/chantiers/${chantierId.value}`)
</script>

<template>
  <div class="relative flex h-dvh w-full flex-col overflow-hidden bg-white dark:bg-gray-900">

    <!-- ── Bouton retour : overlay top-right, au niveau du titre du composant ── -->
    <div class="pointer-events-none absolute top-3 right-4 z-20 flex items-center gap-2.5">
      <span
        v-if="chantier"
        class="pointer-events-auto flex items-center gap-1.5 rounded-md border border-gray-200 bg-white/80 px-2.5 py-1 text-xs font-medium text-gray-600 backdrop-blur-sm dark:border-gray-600 dark:bg-gray-800/80 dark:text-gray-300">
        <Icon name="lucide:building-2" size="12" class="text-gray-400" />
        <span class="truncate">{{ chantier.name || chantier.compte || `#${chantier.id}` }}</span>
        <span v-if="chantier.compte && chantier.name" class="rounded bg-gray-100 px-1 font-mono text-[10px] font-bold text-gray-500 dark:bg-gray-700 dark:text-gray-400">
          {{ chantier.compte }}
        </span>
      </span>
      <NuxtLink
        :to="backLink"
        class="group pointer-events-auto flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-sm font-medium text-gray-600 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
        :title="`Retour au chantier ${chantier?.name || ''}`">
        <Icon name="lucide:arrow-left" size="14" class="transition-transform group-hover:-translate-x-0.5" />
        Retour au chantier
      </NuxtLink>
    </div>

    <!-- ── Contenu plein écran ─────────────────────────────────────────── -->
    <div v-if="loading" class="flex h-full items-center justify-center">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
    </div>
    <div v-else-if="!chantier" class="flex h-full flex-col items-center justify-center gap-3 text-gray-400">
      <Icon name="lucide:alert-circle" size="32" />
      <p class="text-sm">Chantier introuvable</p>
      <NuxtLink :to="backLink" class="text-sm text-blue-600 hover:underline">Retour</NuxtLink>
    </div>
    <ChantierCommandesMatieres v-else :chantier="chantier" />
  </div>
</template>
