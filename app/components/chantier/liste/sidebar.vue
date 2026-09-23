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

// Panneau pétrole (design V4) : sélection en voile blanc + repère sarcelle, comme les chantiers
// de la page Tâches.
const rowClass = (active) => (active ? 'bg-white/10 before:bg-secondary-400 before:absolute before:inset-y-1.75 before:left-0 before:w-0.75 before:rounded-full' : 'hover:bg-white/6')

const iconClass = (active) => (active ? 'text-secondary-300' : 'text-white/55')
const labelClass = (active) => (active ? 'text-white font-semibold' : 'text-white/80')
const badgeClass = (active) => (active ? 'bg-secondary-400 text-petrol-950' : 'bg-white/10 text-white/80')

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
        :class="rowClass(portee === option.id)">
        <Icon
          :name="option.icon"
          size="20"
          class="transition-colors duration-200"
          :class="iconClass(portee === option.id)" />
        <span class="text-sm transition-colors duration-200" :class="labelClass(portee === option.id)">
          {{ option.label }}
        </span>
      </div>
    </div>

    <!-- Vues -->
    <p
      class="mt-4 border-t border-white/10 px-3 pt-3.5 pb-1 text-xs font-semibold text-white/50">
      Vues
    </p>
    <template v-for="option in vueOptions" :key="option.id">
      <AppTooltip v-if="option.disabled" text="Bientôt disponible" position="right" class="w-full">
        <div class="w-full cursor-not-allowed pt-1 opacity-40">
          <div class="flex h-9 items-center gap-2 rounded-md px-3 py-1.5">
            <Icon :name="option.icon" size="20" class="text-white/55" />
            <span class="text-sm text-white/80">{{ option.label }}</span>
            <Icon name="lucide:lock" size="14" class="ml-auto text-white/55" />
          </div>
        </div>
      </AppTooltip>
      <div v-else class="cursor-pointer pt-1" @click="selectVue(option)">
        <div
          class="group relative flex h-9 items-center gap-2 rounded-md px-3 py-1.5"
          :class="rowClass(vue === option.id)">
          <Icon
            :name="option.icon"
            size="20"
            class="transition-colors duration-200"
            :class="iconClass(vue === option.id)" />
          <span class="text-sm transition-colors duration-200" :class="labelClass(vue === option.id)">
            {{ option.label }}
          </span>
        </div>
      </div>
    </template>

    <!-- Filtres par état -->
    <p
      class="mt-4 border-t border-white/10 px-3 pt-3.5 pb-1 text-xs font-semibold text-white/50">
      Filtres
    </p>
    <div v-for="option in etatOptions" :key="option.id" class="cursor-pointer pt-1" @click="etat = option.id">
      <div
        class="group relative flex h-9 items-center gap-2 rounded-md px-3 py-1.5"
        :class="rowClass(etat === option.id)">
        <span class="h-2 w-2 shrink-0 rounded-full" :class="option.dot" />
        <span class="text-sm transition-colors duration-200" :class="labelClass(etat === option.id)">
          {{ option.label }}
        </span>
        <span class="ml-auto flex w-8 justify-center">
          <span class="w-full rounded text-center text-xs font-semibold" :class="badgeClass(etat === option.id)">
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
          portee === option.id ? 'text-petrol-900 border-white bg-white' : 'border-white/15 bg-white/6 text-white/80'
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
        :class="etat === option.id ? option.color + ' border-2 shadow-sm' : 'border-white/15 bg-white/6 text-white/80'"
        @click="etat = option.id">
        <Icon :name="option.icon" size="16" />
        {{ option.label }}
        <span
          class="ml-1 rounded-full px-1.5 text-xs font-bold"
          :class="etat === option.id ? 'bg-white/30' : 'bg-white/10'">
          {{ props.counts[option.id] ?? 0 }}
        </span>
      </button>
    </div>
  </section>
</template>
