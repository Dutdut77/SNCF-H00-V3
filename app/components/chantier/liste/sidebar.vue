<script setup>
// Barre latérale de la liste des chantiers : portée + vue + filtre par état, trois sélections qui coexistent
// (un v-model chacune).
const props = defineProps({
  counts: { type: Object, default: () => ({}) }
})

const portee = defineModel('portee', { default: 'tous' }) // 'tous' | 'mes'
const vue = defineModel('vue', { default: 'tableau' }) // 'tableau' | 'cartes'
const etat = defineModel('etat', { default: 'all' })

const { etatOptions } = useEtatChantier()

const porteeOptions = [
  { id: 'tous', label: 'Tous les chantiers', icon: 'lucide:layout-list' },
  { id: 'mes', label: 'Mes chantiers', icon: 'lucide:user-round' }
]

const vueOptions = [
  { id: 'tableau', label: 'Tableau', icon: 'lucide:table-2' },
  { id: 'cartes', label: 'Cartes', icon: 'lucide:layout-grid' },
  { id: 'planning', label: 'Planning', icon: 'lucide:calendar-range' }
]

// Barre latérale V4 (blanche) : rubriques en retrait le long d'un trait, sélection en gris + repère magenta,
// comme les autres pages (classes communes dans utils/panneau.js).

// Pastilles de la version mobile
const PASTILLE = 'border-slate-200 bg-white text-ink-soft dark:border-white/15 dark:bg-white/6 dark:text-white/80'

const selectVue = (option) => {
  if (option.disabled) return
  vue.value = option.id
}
</script>

<template>
  <!-- ============ Desktop : rubriques en retrait le long d'un trait vertical (utils/panneau.js) ============ -->
  <section class="hidden flex-col gap-5 pb-6 lg:flex lg:pt-2">
    <!-- Portée -->
    <nav class="flex flex-col gap-1.5" aria-label="Portée">
      <p class="px-3" :class="PANNEAU_TITRE">Chantiers</p>
      <div :class="PANNEAU_GROUPE">
        <button
          v-for="option in porteeOptions"
          :key="option.id"
          type="button"
          class="py-2"
          :class="[PANNEAU_ENTREE, panneauItem(portee === option.id)]"
          :aria-pressed="portee === option.id"
          @click="portee = option.id">
          <Icon :name="option.icon" size="18" class="shrink-0" :class="panneauIcone(portee === option.id)" />
          <span class="min-w-0 flex-1 truncate text-sm font-medium">{{ option.label }}</span>
        </button>
      </div>
    </nav>

    <!-- Vues -->
    <nav class="flex flex-col gap-1.5" aria-label="Vues">
      <p class="px-3" :class="PANNEAU_TITRE">Vues</p>
      <div :class="PANNEAU_GROUPE">
        <template v-for="option in vueOptions" :key="option.id">
          <AppTooltip v-if="option.disabled" text="Bientôt disponible" position="right" class="w-full">
            <div class="-ml-px flex w-full cursor-not-allowed items-center gap-3 px-3 py-2 opacity-40">
              <Icon :name="option.icon" size="18" class="shrink-0 text-slate-400 dark:text-white/55" />
              <span class="text-ink-soft flex-1 text-sm font-medium">{{ option.label }}</span>
              <Icon name="lucide:lock" size="14" class="text-slate-400 dark:text-white/55" />
            </div>
          </AppTooltip>
          <button
            v-else
            type="button"
            class="py-2"
            :class="[PANNEAU_ENTREE, panneauItem(vue === option.id)]"
            :aria-pressed="vue === option.id"
            @click="selectVue(option)">
            <Icon :name="option.icon" size="18" class="shrink-0" :class="panneauIcone(vue === option.id)" />
            <span class="min-w-0 flex-1 truncate text-sm font-medium">{{ option.label }}</span>
          </button>
        </template>
      </div>
    </nav>

    <!-- Filtres par état -->
    <nav class="flex flex-col gap-1.5" aria-label="Filtrer par état">
      <p class="px-3" :class="PANNEAU_TITRE">Filtres</p>
      <div :class="PANNEAU_GROUPE">
        <button
          v-for="option in etatOptions"
          :key="option.id"
          type="button"
          class="py-2"
          :class="[PANNEAU_ENTREE, panneauItem(etat === option.id)]"
          :aria-pressed="etat === option.id"
          @click="etat = option.id">
          <span class="mx-1.25 size-2 shrink-0 rounded-full" :class="option.dot" />
          <span class="min-w-0 flex-1 truncate text-sm font-medium">{{ option.label }}</span>
          <span
            class="inline-flex h-5.5 min-w-6.5 shrink-0 items-center justify-center rounded-full px-1.5 text-xs font-bold"
            :class="panneauBadge(etat === option.id)">
            {{ props.counts[option.id] ?? 0 }}
          </span>
        </button>
      </div>
    </nav>
  </section>

  <!-- ============ Mobile : rangées de pastilles défilables ============ -->
  <section class="flex flex-col gap-2 lg:hidden">
    <div class="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      <button
        v-for="option in porteeOptions"
        :key="option.id"
        type="button"
        class="flex flex-none items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors"
        :class="
          portee === option.id
            ? 'border-magenta-200 bg-magenta-50 text-magenta-800 dark:border-magenta-400/40 dark:bg-magenta-500/15 dark:text-white'
            : PASTILLE
        "
        @click="portee = option.id">
        <Icon :name="option.icon" size="16" />
        {{ option.label }}
      </button>
    </div>
    <!-- Le sélecteur de vue n'est pas repris ici : la barre d'outils l'affiche à toutes les tailles. -->

    <div class="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      <button
        v-for="option in etatOptions"
        :key="option.id"
        type="button"
        class="flex flex-none items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all duration-200"
        :class="etat === option.id ? option.color + ' border-2 shadow-sm' : PASTILLE"
        @click="etat = option.id">
        <Icon :name="option.icon" size="16" />
        {{ option.label }}
        <span
          class="ml-1 rounded-full px-1.5 text-xs font-bold"
          :class="etat === option.id ? 'bg-white/30' : 'bg-slate-100 dark:bg-white/10'">
          {{ props.counts[option.id] ?? 0 }}
        </span>
      </button>
    </div>
  </section>
</template>
