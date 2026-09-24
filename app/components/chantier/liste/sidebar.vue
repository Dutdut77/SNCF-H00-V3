<script setup>
// Barre latérale de la liste des chantiers : portée + vue + filtre par état.
// Les classes reprennent celles de AppLeftNavBar, qui ne peut pas servir ici :
// il n'expose qu'un seul v-model alors que les trois sélections coexistent.
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

// Barre latérale V4 (blanche) : sélection en rose pâle + repère magenta, comme les chantiers de la
// page Tâches (classes communes dans utils/panneau.js).
const labelClass = (active) => (active ? 'font-semibold' : '')

// Pastilles de la version mobile
const PASTILLE = 'border-slate-200 bg-white text-ink-soft dark:border-white/15 dark:bg-white/6 dark:text-white/80'

const selectVue = (option) => {
  if (option.disabled) return
  vue.value = option.id
}
</script>

<template>
  <!-- ============ Desktop ============ -->
  <section class="hidden lg:block">
    <!-- Portée -->
    <div
      v-for="option in porteeOptions"
      :key="option.id"
      class="cursor-pointer pt-1"
      @click="portee = option.id">
      <div
        class="group relative flex h-9 items-center gap-2 rounded-md px-3 py-1.5"
        :class="panneauItem(portee === option.id)">
        <Icon
          :name="option.icon"
          size="20"
          class="transition-colors duration-200"
          :class="panneauIcone(portee === option.id)" />
        <span class="text-sm transition-colors duration-200" :class="labelClass(portee === option.id)">
          {{ option.label }}
        </span>
      </div>
    </div>

    <!-- Vues -->
    <p class="border-rule mt-4 border-t px-3 pt-3.5 pb-1" :class="PANNEAU_TITRE">
      Vues
    </p>
    <template v-for="option in vueOptions" :key="option.id">
      <AppTooltip v-if="option.disabled" text="Bientôt disponible" position="right" class="w-full">
        <div class="w-full cursor-not-allowed pt-1 opacity-40">
          <div class="flex h-9 items-center gap-2 rounded-md px-3 py-1.5">
            <Icon :name="option.icon" size="20" class="text-slate-400 dark:text-white/55" />
            <span class="text-ink-soft text-sm">{{ option.label }}</span>
            <Icon name="lucide:lock" size="14" class="ml-auto text-slate-400 dark:text-white/55" />
          </div>
        </div>
      </AppTooltip>
      <div v-else class="cursor-pointer pt-1" @click="selectVue(option)">
        <div
          class="group relative flex h-9 items-center gap-2 rounded-md px-3 py-1.5"
          :class="panneauItem(vue === option.id)">
          <Icon
            :name="option.icon"
            size="20"
            class="transition-colors duration-200"
            :class="panneauIcone(vue === option.id)" />
          <span class="text-sm transition-colors duration-200" :class="labelClass(vue === option.id)">
            {{ option.label }}
          </span>
        </div>
      </div>
    </template>

    <!-- Filtres par état -->
    <p class="border-rule mt-4 border-t px-3 pt-3.5 pb-1" :class="PANNEAU_TITRE">
      Filtres
    </p>
    <div v-for="option in etatOptions" :key="option.id" class="cursor-pointer pt-1" @click="etat = option.id">
      <div
        class="group relative flex h-9 items-center gap-2 rounded-md px-3 py-1.5"
        :class="panneauItem(etat === option.id)">
        <span class="h-2 w-2 shrink-0 rounded-full" :class="option.dot" />
        <span class="text-sm transition-colors duration-200" :class="labelClass(etat === option.id)">
          {{ option.label }}
        </span>
        <span class="ml-auto flex w-8 justify-center">
          <span class="w-full rounded text-center text-xs font-semibold" :class="panneauBadge(etat === option.id)">
            {{ props.counts[option.id] ?? 0 }}
          </span>
        </span>
      </div>
    </div>
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
          portee === option.id ? 'border-magenta-200 bg-magenta-50 text-magenta-800 dark:border-magenta-400/40 dark:bg-magenta-500/15 dark:text-white' : PASTILLE
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
