<script setup>
// Choix de l'année dans le coin figé des plans de charge, à la place du titre de la première colonne :
// l'année en Traverse (police des chiffres) entre deux flèches rondes. v-model = l'année affichée.
const annee = defineModel({ type: Number, required: true })

// Flèches : boutons ronds cerclés d'un filet, plus petits sur mobile (colonne étroite)
const FLECHE =
  'text-ink-soft hover:text-ink flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full border border-slate-200 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-secondary-500 md:size-7 dark:border-white/15 dark:hover:bg-white/10'
</script>

<template>
  <div class="flex items-center gap-0.5 md:gap-1" role="group" aria-label="Année affichée">
    <button type="button" :class="FLECHE" aria-label="Année précédente" :title="String(annee - 1)" @click="annee--">
      <Icon name="lucide:chevron-left" size="15" />
    </button>
    <span
      class="font-traverse text-ink min-w-10 text-center text-base leading-none tracking-[0.03em] md:min-w-14 md:text-xl"
      aria-live="polite">
      {{ annee }}
    </span>
    <button type="button" :class="FLECHE" aria-label="Année suivante" :title="String(annee + 1)" @click="annee++">
      <Icon name="lucide:chevron-right" size="15" />
    </button>
  </div>
</template>
