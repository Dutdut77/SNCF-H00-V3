<script setup>
const props = defineProps({
  // null + uncategorized=true → carte « Sans catégorie »
  categorie: { type: Object, default: null },
  palette: { type: Object, default: () => ({}) },
  uncategorized: { type: Boolean, default: false },
  ensembles: { type: Array, default: () => [] }, // déjà filtrés/triés par le parent
  categories: { type: Array, default: () => [] }, // pour le menu « Déplacer vers… »
})

const emit = defineEmits([
  'edit',            // renommer la catégorie
  'delete',          // supprimer la catégorie
  'open-ensemble',   // ouvrir l'éditeur d'un ensemble
  'add-ensemble',    // créer un ensemble dans cette catégorie
  'edit-ensemble',   // renommer / déplacer un ensemble
  'delete-ensemble', // supprimer un ensemble
  'move-ensemble',   // { ensemble, categorieId }
])

// Palette neutre (slate) pour la carte « Sans catégorie ».
const NEUTRAL = {
  ring: 'ring-slate-200', bg: 'bg-slate-50', hdrBg: 'bg-slate-100',
  text: 'text-slate-600', dot: 'bg-slate-400', border: 'border-slate-200',
}
const pal = computed(() => (props.uncategorized ? NEUTRAL : props.palette))
const titre = computed(() => (props.uncategorized ? 'Sans catégorie' : props.categorie?.nom ?? ''))
const icone = computed(() => (props.uncategorized ? 'lucide:inbox' : 'lucide:layers'))

// Recherche locale à la carte (filtre la liste déjà filtrée par le parent).
const cardSearch = ref('')
const displayedEnsembles = computed(() => {
  const q = cardSearch.value.trim().toLowerCase()
  if (!q) return props.ensembles
  return props.ensembles.filter((e) =>
    (e.nom || '').toLowerCase().includes(q) ||
    (e.description || '').toLowerCase().includes(q),
  )
})
</script>

<template>
  <div
    class="group/card flex flex-col overflow-hidden rounded-xl border bg-white shadow-sm dark:bg-slate-800"
    :class="[pal.border, 'dark:border-slate-700']"
  >
    <!-- Bandeau coloré -->
    <div class="flex flex-none items-center gap-2.5 px-4 py-3" :class="[pal.hdrBg, 'dark:bg-slate-700/40']">
      <span class="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-white/70 dark:bg-slate-800/60">
        <Icon :name="icone" size="16" :class="pal.text" />
      </span>
      <h3 class="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
        {{ titre }}
      </h3>

      <!-- Compteur collé à droite + actions qui se glissent au survol -->
      <div class="flex flex-none items-center">
        <span
          class="inline-flex items-center justify-center rounded-full bg-white/70 px-2 py-0.5 text-xs font-bold dark:bg-slate-800/60"
          :class="pal.text"
        >
          {{ ensembles.length }}
        </span>

        <!-- Actions catégorie (réelles uniquement) -->
        <div
          v-if="!uncategorized"
          class="flex max-w-0 items-center gap-0.5 overflow-hidden opacity-0 transition-all duration-200 group-hover/card:ml-1 group-hover/card:max-w-20 group-hover/card:opacity-100"
        >
          <button
            type="button"
            class="rounded p-1 text-slate-400 hover:bg-white/60 hover:text-slate-600 dark:hover:bg-slate-800/60 dark:hover:text-slate-200"
            title="Renommer"
            @click="emit('edit')"
          >
            <Icon name="lucide:pencil" size="13" />
          </button>
          <button
            type="button"
            class="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
            title="Supprimer"
            @click="emit('delete')"
          >
            <Icon name="lucide:trash-2" size="13" />
          </button>
        </div>
      </div>
    </div>

    <!-- Liste des ensembles -->
    <div class="max-h-80 flex-1 overflow-y-auto p-1.5">
      <!-- Recherche locale (collante en haut de la liste) -->
      <div
        v-if="ensembles.length"
        class="sticky top-0 z-10 mb-1 bg-white/95 px-0.5 pb-1 backdrop-blur dark:bg-slate-800/95"
      >
        <div class="relative">
          <Icon name="lucide:search" size="12" class="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            v-model="cardSearch"
            type="text"
            placeholder="Filtrer…"
            class="w-full rounded-md border border-slate-200 bg-white py-1 pl-7 pr-2 text-xs text-slate-700 outline-none transition focus:border-secondary-300 focus:ring-1 focus:ring-secondary-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
          />
        </div>
      </div>

      <p v-if="!ensembles.length" class="px-2 py-6 text-center text-xs italic text-slate-300 dark:text-slate-600">
        Aucun ensemble
      </p>
      <p v-else-if="!displayedEnsembles.length" class="px-2 py-4 text-center text-xs text-slate-400">
        Aucun résultat
      </p>
      <ul v-else class="flex flex-col gap-0.5">
        <li
          v-for="ens in displayedEnsembles"
          :key="ens.id"
          class="group/row flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 transition hover:bg-slate-50 dark:hover:bg-slate-700/50"
          @click="emit('open-ensemble', ens)"
        >
          <span class="h-1.5 w-1.5 flex-none rounded-full" :class="pal.dot" />
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium text-slate-700 dark:text-slate-200">{{ ens.nom }}</p>
            <p v-if="ens.description" class="truncate text-xs text-slate-400">{{ ens.description }}</p>
          </div>

          <div
            class="flex flex-none items-center gap-0.5 opacity-0 transition-opacity group-hover/row:opacity-100"
            @click.stop
          >
            <!-- Déplacer vers… -->
            <AppDropdownMenu>
              <template #trigger>
                <span class="block rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200" title="Déplacer vers…">
                  <Icon name="lucide:folder-input" size="13" />
                </span>
              </template>
              <template #default>
                <div class="w-52 py-1">
                  <p class="px-3 pb-1 pt-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Déplacer vers</p>
                  <button
                    v-for="c in categories"
                    :key="c.id"
                    type="button"
                    class="flex w-full items-center justify-between px-3 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-40 dark:text-slate-200 dark:hover:bg-slate-700"
                    :disabled="ens.categorie_id === c.id"
                    @click="emit('move-ensemble', { ensemble: ens, categorieId: c.id })"
                  >
                    {{ c.nom }}
                    <Icon v-if="ens.categorie_id === c.id" name="lucide:check" size="13" class="text-secondary-500" />
                  </button>
                  <div class="my-1 border-t border-slate-100 dark:border-slate-700"></div>
                  <button
                    type="button"
                    class="flex w-full items-center justify-between px-3 py-1.5 text-left text-sm text-slate-500 hover:bg-slate-100 disabled:opacity-40 dark:hover:bg-slate-700"
                    :disabled="!ens.categorie_id"
                    @click="emit('move-ensemble', { ensemble: ens, categorieId: null })"
                  >
                    Sans catégorie
                    <Icon v-if="!ens.categorie_id" name="lucide:check" size="13" class="text-secondary-500" />
                  </button>
                </div>
              </template>
            </AppDropdownMenu>
            <button
              type="button"
              class="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
              title="Modifier"
              @click="emit('edit-ensemble', ens)"
            >
              <Icon name="lucide:pencil" size="13" />
            </button>
            <button
              type="button"
              class="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
              title="Supprimer"
              @click="emit('delete-ensemble', ens)"
            >
              <Icon name="lucide:trash-2" size="13" />
            </button>
          </div>
        </li>
      </ul>
    </div>

    <!-- Pied : ajouter un ensemble -->
    <button
      type="button"
      class="flex flex-none items-center justify-center gap-1.5 border-t border-slate-100 px-4 py-2.5 text-xs font-medium text-slate-400 transition hover:bg-secondary-50/50 hover:text-secondary-600 dark:border-slate-700/60 dark:hover:bg-secondary-900/10 dark:hover:text-secondary-400"
      @click="emit('add-ensemble')"
    >
      <Icon name="lucide:plus" size="13" />
      Nouvel ensemble
    </button>
  </div>
</template>
