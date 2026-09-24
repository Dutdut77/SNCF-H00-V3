<script setup>
const props = defineProps({
  // null + uncategorized=true → carte « Sans catégorie »
  categorie: { type: Object, default: null },
  palette: { type: Object, default: () => ({}) },
  uncategorized: { type: Boolean, default: false },
  ensembles: { type: Array, default: () => [] }, // déjà filtrés/triés par le parent
  categories: { type: Array, default: () => [] } // pour le menu « Déplacer vers… »
})

const emit = defineEmits([
  'edit', // renommer la catégorie
  'delete', // supprimer la catégorie
  'open-ensemble', // ouvrir l'éditeur d'un ensemble
  'add-ensemble', // créer un ensemble dans cette catégorie
  'edit-ensemble', // renommer / déplacer un ensemble
  'delete-ensemble', // supprimer un ensemble
  'move-ensemble' // { ensemble, categorieId }
])

// Palette neutre (slate) pour la carte « Sans catégorie ».
const NEUTRAL = {
  ring: 'ring-slate-200',
  bg: 'bg-slate-50',
  hdrBg: 'bg-slate-100',
  text: 'text-slate-600',
  dot: 'bg-slate-400',
  border: 'border-slate-200'
}
const pal = computed(() => (props.uncategorized ? NEUTRAL : props.palette))
const titre = computed(() => (props.uncategorized ? 'Sans catégorie' : (props.categorie?.nom ?? '')))
const icone = computed(() => (props.uncategorized ? 'lucide:inbox' : 'lucide:layers'))

// « Déplacer vers… » : ferme le menu, puis déplace l'ensemble
const deplacer = (close, ensemble, categorieId) => {
  close()
  emit('move-ensemble', { ensemble, categorieId })
}

// Recherche locale à la carte (filtre la liste déjà filtrée par le parent).
const cardSearch = ref('')
const displayedEnsembles = computed(() => {
  const q = cardSearch.value.trim().toLowerCase()
  if (!q) return props.ensembles
  return props.ensembles.filter(
    (e) => (e.nom || '').toLowerCase().includes(q) || (e.description || '').toLowerCase().includes(q)
  )
})
</script>

<template>
  <!-- Carte blanche V4 : la couleur de la catégorie reste en accent (pastille d'icône, points) -->
  <div class="surface-card group/card flex flex-col overflow-hidden rounded-xl">
    <div class="border-rule flex flex-none items-center gap-2.5 border-b px-4 py-3">
      <span
        class="flex size-8 flex-none items-center justify-center rounded-lg dark:bg-white/8 dark:text-white/85"
        :class="[pal.hdrBg, pal.text]">
        <Icon :name="icone" size="16" />
      </span>
      <h3 class="text-ink min-w-0 flex-1 truncate text-sm font-semibold">
        {{ titre }}
      </h3>

      <!-- Compteur collé à droite + actions qui se glissent au survol (toujours visibles au clavier) -->
      <div class="flex flex-none items-center">
        <span
          class="text-ink-soft inline-flex h-5.5 min-w-6.5 items-center justify-center rounded-full bg-slate-100 px-1.5 text-xs font-bold tabular-nums dark:bg-white/10">
          {{ ensembles.length }}
        </span>

        <!-- Actions catégorie (réelles uniquement) -->
        <div
          v-if="!uncategorized"
          class="flex max-w-0 items-center gap-0.5 overflow-hidden opacity-0 transition-all duration-200 group-focus-within/card:ml-1 group-focus-within/card:max-w-20 group-focus-within/card:opacity-100 group-hover/card:ml-1 group-hover/card:max-w-20 group-hover/card:opacity-100">
          <button type="button" :class="BOUTON_ICONE" class="size-7!" title="Renommer" @click="emit('edit')">
            <Icon name="lucide:pencil" size="14" />
          </button>
          <button type="button" :class="BOUTON_ICONE_DANGER" class="size-7!" title="Supprimer" @click="emit('delete')">
            <Icon name="lucide:trash-2" size="14" />
          </button>
        </div>
      </div>
    </div>

    <!-- Liste des ensembles -->
    <div class="flex min-h-0 flex-1 flex-col overflow-y-auto p-1.5">
      <!-- Recherche locale (collante en haut de la liste) -->
      <div v-if="ensembles.length > 5" class="bg-card sticky top-0 z-10 mb-1 px-0.5 pb-1">
        <div class="relative">
          <Icon
            name="lucide:search"
            size="13"
            class="text-ink-soft pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2" />
          <input
            v-model="cardSearch"
            type="text"
            placeholder="Filtrer…"
            aria-label="Filtrer les ensembles de la catégorie"
            class="form-control h-8 pl-8 text-xs" />
        </div>
      </div>

      <p v-if="!ensembles.length" class="text-ink-soft m-auto px-2 text-center text-xs italic">Aucun ensemble</p>
      <p v-else-if="!displayedEnsembles.length" class="text-ink-soft m-auto px-2 text-center text-xs">Aucun résultat</p>
      <ul v-else class="flex flex-col gap-0.5">
        <li
          v-for="ens in displayedEnsembles"
          :key="ens.id"
          class="group/row flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors hover:bg-taupe-100 dark:hover:bg-taupe-400/8"
          @click="emit('open-ensemble', ens)">
          <span class="size-1.5 flex-none rounded-full" :class="pal.dot" />
          <div class="min-w-0 flex-1">
            <p class="text-ink truncate text-sm font-medium">{{ ens.nom }}</p>
            <p v-if="ens.description" class="text-ink-soft truncate text-xs">{{ ens.description }}</p>
          </div>

          <div
            class="flex flex-none items-center gap-0.5 opacity-0 transition-opacity group-focus-within/row:opacity-100 group-hover/row:opacity-100"
            @click.stop>
            <!-- Déplacer vers… -->
            <AppDropdownMenu :panel-class="MENU_PANNEAU">
              <template #trigger>
                <span :class="BOUTON_ICONE" class="size-7!" title="Déplacer vers…">
                  <Icon name="lucide:folder-input" size="14" />
                </span>
              </template>
              <template #default="{ close }">
                <div class="w-56">
                  <p class="text-ink-soft px-3 pt-1.5 pb-1 text-xs font-semibold">Déplacer vers</p>
                  <button
                    v-for="c in categories"
                    :key="c.id"
                    type="button"
                    :class="MENU_ENTREE"
                    :disabled="ens.categorie_id === c.id"
                    @click="deplacer(close, ens, c.id)">
                    <span class="min-w-0 flex-1 truncate">{{ c.nom }}</span>
                    <Icon v-if="ens.categorie_id === c.id" name="lucide:check" size="14" class="text-magenta-600" />
                  </button>
                  <div class="border-rule my-1 border-t" />
                  <button
                    type="button"
                    :class="MENU_ENTREE"
                    :disabled="!ens.categorie_id"
                    @click="deplacer(close, ens, null)">
                    <span class="min-w-0 flex-1 truncate">Sans catégorie</span>
                    <Icon v-if="!ens.categorie_id" name="lucide:check" size="14" class="text-magenta-600" />
                  </button>
                </div>
              </template>
            </AppDropdownMenu>
            <button
              type="button"
              :class="BOUTON_ICONE"
              class="size-7!"
              title="Modifier"
              @click="emit('edit-ensemble', ens)">
              <Icon name="lucide:pencil" size="14" />
            </button>
            <button
              type="button"
              :class="BOUTON_ICONE_DANGER"
              class="size-7!"
              title="Supprimer"
              @click="emit('delete-ensemble', ens)">
              <Icon name="lucide:trash-2" size="14" />
            </button>
          </div>
        </li>
      </ul>
    </div>

    <!-- Pied : ajouter un ensemble -->
    <button
      type="button"
      class="border-rule text-ink-soft hover:text-magenta-700 dark:hover:text-magenta-300 flex flex-none cursor-pointer items-center justify-center gap-1.5 border-t px-4 py-2.5 text-xs font-semibold transition-colors hover:bg-slate-50 dark:hover:bg-white/4"
      @click="emit('add-ensemble')">
      <Icon name="lucide:plus" size="14" />
      Nouvel ensemble
    </button>
  </div>
</template>
