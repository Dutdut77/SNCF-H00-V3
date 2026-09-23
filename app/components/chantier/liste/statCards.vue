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
  tous: 'bg-petrol-50 text-petrol-700 dark:bg-white/10 dark:text-slate-200',
  all: 'bg-white/60 text-petrol-700 dark:bg-white/15 dark:text-white',
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
    <!-- Cartes blanches du design V4 ; « En cours », la vue principale, prend le vert d'eau des bandeaux -->
    <button
      v-for="option in etatOptions"
      :key="option.id"
      type="button"
      class="tuile"
      :class="{ 'tuile--principale': option.id === 'all', 'is-active': etat === option.id }"
      :aria-pressed="etat === option.id"
      @click="etat = option.id">
      <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" :class="TILE[option.id]">
        <Icon :name="option.icon" size="20" />
      </span>
      <span class="min-w-0">
        <span class="tuile__nombre">{{ props.counts[option.id] ?? 0 }}</span>
        <span class="tuile__libelle">{{ option.id === 'all' ? 'En cours' : option.label }}</span>
        <span v-if="sousTitre(option.id)" class="tuile__detail">{{ sousTitre(option.id) }}</span>
      </span>
    </button>
  </div>
</template>

<style scoped>
.tuile {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 0.75rem;
  text-align: left;
  background: #fff;
  box-shadow:
    0 1px 2px rgb(10 38 48 / 0.06),
    0 10px 24px -14px rgb(10 38 48 / 0.22);
  outline: 1px solid rgb(10 38 48 / 0.06);
  outline-offset: -1px;
  cursor: pointer;
  transition:
    box-shadow 0.2s ease,
    outline-color 0.2s ease;
}
.tuile:hover {
  box-shadow:
    0 1px 2px rgb(10 38 48 / 0.08),
    0 14px 30px -14px rgb(10 38 48 / 0.3);
}
.tuile--principale {
  background: linear-gradient(150deg, #9fd0c4 0%, #d7ebe6 100%);
}
/* Tuile active : liseré sarcelle, lisible sur fond blanc comme sur le vert d'eau */
.tuile.is-active {
  outline: 2px solid var(--color-secondary-500);
  outline-offset: 2px;
}
.tuile:focus-visible {
  outline: 2px solid var(--color-secondary-500);
  outline-offset: 2px;
}
.tuile__nombre {
  display: block;
  font-family: 'Traverse', sans-serif;
  font-size: 1.75rem;
  line-height: 1.05;
  letter-spacing: 0.02em;
  color: var(--color-petrol-900);
}
.tuile__libelle {
  display: block;
  overflow: hidden;
  font-size: 0.875rem;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--color-petrol-900);
}
.tuile__detail {
  display: block;
  margin-top: 0.125rem;
  overflow: hidden;
  font-size: 0.75rem;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #4a5d63;
}

.dark .tuile {
  background: var(--color-night-800);
  box-shadow: 0 16px 32px -14px rgb(0 0 0 / 0.6);
  outline-color: rgb(255 255 255 / 0.07);
}
.dark .tuile--principale {
  background: linear-gradient(150deg, #1f5a52 0%, #2f6f62 100%);
}
.dark .tuile.is-active {
  outline-color: var(--color-secondary-400);
}
.dark .tuile__nombre,
.dark .tuile__libelle {
  color: #e6eef0;
}
.dark .tuile__detail {
  color: #9fb0b6;
}
</style>
