<script setup>
// Tuiles de synthèse — cliquables : elles pilotent le même filtre que la barre latérale.
const props = defineProps({
  counts: { type: Object, default: () => ({}) },
  nouveauxCeMois: { type: Number, default: 0 }
})

const etat = defineModel({ default: 'all' })

const { etatOptions } = useEtatChantier()

// Palette de la tuile d'icône, par filtre (couleurs d'état conservées : elles codent le filtre).
const TILE = {
  tous: 'bg-magenta-50 text-magenta-700 dark:bg-white/10 dark:text-slate-200',
  all: 'bg-white/15 text-white',
  rlt: 'bg-sky-100 text-sky-600',
  preop: 'bg-lime-100 text-lime-600',
  externe: 'bg-purple-100 text-purple-600',
  termine: 'bg-slate-100 text-slate-600'
}

// La maquette affichait des deltas mensuels : la base ne journalise pas les
// changements d'état, seul `created_at` existe. On n'affiche donc que ce qui est vrai.
const sousTitre = (id) => {
  const total = props.counts.all ?? 0
  // « Tous » se distingue d'« En cours » par les terminés : autant le dire.
  if (id === 'tous') {
    const t = props.counts.termine ?? 0
    return t ? `dont ${t} terminé${t > 1 ? 's' : ''}` : null
  }
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
  <div class="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
    <!-- Cartes blanches du design V4 ; « En cours », la vue principale, prend le dégradé des bandeaux.
         Tuile active : liseré magenta (important : il remplace le liseré discret de surface-card). -->
    <button
      v-for="option in etatOptions"
      :key="option.id"
      type="button"
      class="surface-card hover:surface-raised focus-visible:outline-secondary-500! flex cursor-pointer items-start gap-3 rounded-xl p-4 text-left transition-shadow focus-visible:outline-2! focus-visible:outline-offset-2!"
      :class="[
        { 'bg-bandeau': option.id === 'all' },
        etat === option.id && 'outline-secondary-500! dark:outline-secondary-400! outline-2! outline-offset-2!'
      ]"
      :aria-pressed="etat === option.id"
      @click="etat = option.id">
      <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" :class="TILE[option.id]">
        <Icon :name="option.icon" size="20" />
      </span>
      <span class="min-w-0">
        <span
          class="font-traverse block text-[1.75rem] leading-[1.05] tracking-[0.02em]"
          :class="option.id === 'all' ? 'text-white' : 'text-ink'">
          {{ props.counts[option.id] ?? 0 }}
        </span>
        <span class="block truncate text-sm font-semibold" :class="option.id === 'all' ? 'text-white' : 'text-ink'">
          {{ option.id === 'all' ? 'En cours' : option.label }}
        </span>
        <span
          v-if="sousTitre(option.id)"
          class="mt-0.5 block truncate text-xs"
          :class="option.id === 'all' ? 'text-white/80' : 'text-ink-soft'">
          {{ sousTitre(option.id) }}
        </span>
      </span>
    </button>
  </div>
</template>
