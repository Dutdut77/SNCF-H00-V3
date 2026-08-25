<script setup>
// Tuiles de synthèse — cliquables : elles pilotent le même filtre que la barre latérale.
const props = defineProps({
  counts: { type: Object, default: () => ({}) },
  nouveauxCeMois: { type: Number, default: 0 }
})

const etat = defineModel({ default: 'all' })

const { etatOptions } = useEtatChantier()

// Palette de la tuile d'icône, par filtre.
const TILE = {
  all: 'bg-white/20 text-white',
  rlt: 'bg-sky-100 text-sky-600',
  preop: 'bg-lime-100 text-lime-600',
  externe: 'bg-purple-100 text-purple-600',
  termine: 'bg-slate-100 text-slate-600'
}

// La maquette affichait des deltas mensuels : la base ne journalise pas les
// changements d'état, seul `created_at` existe. On n'affiche donc que ce qui est vrai.
const sousTitre = (id) => {
  const total = props.counts.all ?? 0
  if (id === 'all') {
    if (!props.nouveauxCeMois) return 'Aucun créé ce mois'
    return `${props.nouveauxCeMois} créé${props.nouveauxCeMois > 1 ? 's' : ''} ce mois`
  }
  if (id === 'termine') return null
  if (!total) return null
  return `${Math.round(((props.counts[id] ?? 0) / total) * 100)} % des chantiers en cours`
}
</script>

<template>
  <div class="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
    <button
      v-for="option in etatOptions"
      :key="option.id"
      type="button"
      class="cursor-pointer rounded-xl border p-4 text-left transition-all duration-200 hover:shadow-md"
      :class="
        option.id === 'all'
          ? 'from-secondary-400 to-secondary-600 border-secondary-400 bg-linear-to-br shadow-sm' +
            (etat === option.id ? ' ring-secondary-600 ring-2 ring-offset-2 dark:ring-offset-slate-900' : '')
          : 'border-primary-200 bg-primary-50 shadow-sm' +
            (etat === option.id ? ' ring-secondary-500 border-secondary-400 ring-2 ring-offset-2 dark:ring-offset-slate-900' : '')
      "
      @click="etat = option.id">
      <div class="flex items-start gap-3">
        <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" :class="TILE[option.id]">
          <Icon :name="option.icon" size="20" />
        </span>
        <div class="min-w-0">
          <p class="text-2xl leading-tight font-bold" :class="option.id === 'all' ? 'text-white' : 'text-primary-800'">
            {{ props.counts[option.id] ?? 0 }}
          </p>
          <p
            class="truncate text-sm font-medium"
            :class="option.id === 'all' ? 'text-white/90' : 'text-primary-600'">
            {{ option.id === 'all' ? 'En cours' : option.label }}
          </p>
          <p
            v-if="sousTitre(option.id)"
            class="mt-0.5 truncate text-xs"
            :class="option.id === 'all' ? 'text-white/70' : 'text-primary-400'">
            {{ sousTitre(option.id) }}
          </p>
        </div>
      </div>
    </button>
  </div>
</template>
