<script setup>
// Bandeau d'en-tête de page (design V4) : dégradé vert d'eau à facettes et feuilles posées, repris
// des cartes de la page de connexion. Il éclaire le haut de page, face au panneau latéral pétrole.
const props = defineProps({
  // Titre et sous-titre par défaut, remplacés par le slot quand la page en fournit un
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  // Illustration à droite (masquée sur mobile) : 'taches' | 'chantiers' | null
  illustration: { type: String, default: null },
  // Titre souligné au survol quand le bandeau mène quelque part (@click posé par la page)
  clickable: { type: Boolean, default: false }
})
</script>

<template>
  <!-- group/hero : les titres (y compris ceux du slot) changent de couleur au survol (group-hover/hero:…) -->
  <header
    class="bg-aqua relative flex min-h-38 shrink-0 items-center overflow-hidden rounded-[0.9rem] px-7 py-6"
    :class="{ 'group/hero cursor-pointer': props.clickable }">
    <svg class="absolute inset-0 size-full" viewBox="0 0 1000 160" preserveAspectRatio="none" aria-hidden="true">
      <polygon class="fill-white/28 dark:fill-white/7" points="0,0 420,0 150,160 0,160" />
      <polygon class="fill-white/28 dark:fill-white/7" points="560,0 760,0 640,160 470,160" />
      <polygon class="fill-petrol-800/12 dark:fill-black/18" points="1000,20 1000,160 760,160" />
    </svg>

    <!-- Slot par défaut : texte sur mesure (ex. compte, nom et périodes d'un chantier), qui reprend
         les tokens text-ink et text-petrol-900/72 (dark:text-white/75) du bandeau. -->
    <div class="relative min-w-0 flex-1">
      <slot>
        <h1
          class="font-traverse text-ink group-hover/hero:text-secondary-700 dark:group-hover/hero:text-secondary-200 text-[clamp(1.6rem,1.1rem+1.2vw,2.25rem)] leading-[1.1] tracking-[0.02em] transition-colors">
          {{ props.title }}
        </h1>
        <p v-if="props.description" class="text-petrol-900/72 mt-1.5 text-[0.9375rem] dark:text-white/75">
          {{ props.description }}
        </p>
      </slot>
    </div>

    <svg
      v-if="props.illustration"
      class="hero-art relative my-[-1.5rem] mr-[-0.75rem] ml-4 hidden h-38 w-72 shrink-0 md:block"
      viewBox="0 0 300 150"
      aria-hidden="true">
      <defs>
        <filter id="hero-paper-shadow" x="-30%" y="-30%" width="160%" height="170%">
          <feDropShadow dx="0" dy="6" stdDeviation="7" flood-color="#062a33" flood-opacity="0.22" />
        </filter>
      </defs>

      <!-- Tâches : feuille de calendrier et liste cochée -->
      <template v-if="props.illustration === 'taches'">
        <g transform="translate(128 20) rotate(6 70 55)" filter="url(#hero-paper-shadow)">
          <rect class="paper" width="140" height="110" rx="8" />
          <path class="ill-head" d="M0 8 a8 8 0 0 1 8 -8 h124 a8 8 0 0 1 8 8 v16 h-140 Z" />
          <circle class="paper" cx="36" cy="12" r="3.5" />
          <circle class="paper" cx="104" cy="12" r="3.5" />
          <g class="ill-cells">
            <rect x="12" y="34" width="18" height="16" rx="3" />
            <rect class="is-soft" x="36" y="34" width="18" height="16" rx="3" />
            <rect x="60" y="34" width="18" height="16" rx="3" />
            <rect class="is-strong" x="84" y="34" width="18" height="16" rx="3" />
            <rect x="108" y="34" width="18" height="16" rx="3" />
            <rect class="is-today" x="12" y="56" width="18" height="16" rx="3" />
            <rect x="36" y="56" width="18" height="16" rx="3" />
            <rect class="is-strong" x="60" y="56" width="18" height="16" rx="3" />
            <rect class="is-soft" x="84" y="56" width="18" height="16" rx="3" />
            <rect x="108" y="56" width="18" height="16" rx="3" />
            <rect class="is-soft" x="12" y="78" width="18" height="16" rx="3" />
            <rect x="36" y="78" width="18" height="16" rx="3" />
            <rect x="60" y="78" width="18" height="16" rx="3" />
            <rect class="is-soft" x="84" y="78" width="18" height="16" rx="3" />
            <rect x="108" y="78" width="18" height="16" rx="3" />
          </g>
        </g>
        <g transform="translate(26 58) rotate(-6 60 42)" filter="url(#hero-paper-shadow)">
          <rect class="paper" width="120" height="84" rx="8" />
          <rect class="ill-check" x="12" y="14" width="14" height="14" rx="3" />
          <path class="ill-tick" d="M15.5 21 l3 3 l5.5 -6" />
          <rect class="ill-line" x="34" y="18" width="66" height="6" rx="3" />
          <rect class="ill-check" x="12" y="36" width="14" height="14" rx="3" />
          <path class="ill-tick" d="M15.5 43 l3 3 l5.5 -6" />
          <rect class="ill-line" x="34" y="40" width="50" height="6" rx="3" />
          <rect class="ill-check-off" x="13" y="59" width="12" height="12" rx="3" />
          <rect class="ill-line" x="34" y="62" width="58" height="6" rx="3" />
        </g>
      </template>

      <!-- Chantiers : photo de voie, liste cochée et cône, comme la carte « Chantiers » de la connexion -->
      <template v-else-if="props.illustration === 'chantiers'">
        <g transform="translate(74 12) rotate(-7 75 56)" filter="url(#hero-paper-shadow)">
          <rect class="paper" width="150" height="112" rx="8" />
          <rect class="ill-sky" x="10" y="10" width="130" height="92" rx="4" />
          <circle class="ill-sun" cx="108" cy="32" r="10" />
          <path class="ill-hill" d="M10 74 L52 46 L80 62 L108 48 L140 70 V102 H10 Z" />
          <path class="ill-ballast" d="M38 102 L71 62 H79 L112 102 Z" />
          <path class="ill-sleeper" d="M45.7 97 H104.3 M53.3 87 H96.7 M59.3 79 H90.7 M64.5 72 H85.5 M68.3 67 H81.7" />
          <path class="ill-rail" d="M48 102 L73 62 M102 102 L77 62" />
        </g>
        <g transform="translate(176 58) rotate(6 55 40)" filter="url(#hero-paper-shadow)">
          <rect class="paper" width="110" height="80" rx="8" />
          <rect class="ill-check" x="12" y="14" width="13" height="13" rx="3" />
          <path class="ill-tick" d="M15 20.5 l2.8 2.8 l5 -5.6" />
          <rect class="ill-line" x="32" y="17" width="58" height="6" rx="3" />
          <rect class="ill-check" x="12" y="34" width="13" height="13" rx="3" />
          <path class="ill-tick" d="M15 40.5 l2.8 2.8 l5 -5.6" />
          <rect class="ill-line" x="32" y="37" width="44" height="6" rx="3" />
          <rect class="ill-check-off" x="13" y="55" width="11" height="11" rx="3" />
          <rect class="ill-line" x="32" y="57" width="52" height="6" rx="3" />
        </g>
        <g transform="translate(30 96)">
          <path class="ill-cone" d="M14 0 L28 44 H0 Z" />
          <path class="paper" d="M9.2 15 H18.8 L21.7 24 H6.3 Z" />
          <rect class="ill-cone-base" x="-6" y="42" width="40" height="7" rx="2" />
        </g>
      </template>
    </svg>
  </header>
</template>

<style scoped>
/* Illustrations SVG : leurs teintes restent en CSS (fill/stroke sur des dizaines de formes) */
/* Feuilles et motifs, mêmes teintes que les illustrations de la page de connexion */
.paper {
  fill: var(--color-paper);
}
.ill-head {
  fill: var(--color-petrol-700);
}
.ill-cells rect {
  fill: var(--color-aqua-50);
}
.ill-cells .is-soft {
  fill: var(--color-secondary-200);
}
.ill-cells .is-strong {
  fill: var(--color-secondary-500);
}
.ill-cells .is-today,
.ill-sun,
.ill-cone {
  fill: #c9665e;
}
.ill-check {
  fill: var(--color-secondary-500);
}
.ill-check-off {
  fill: none;
  stroke: var(--color-secondary-200);
  stroke-width: 2;
}
.ill-tick {
  fill: none;
  stroke: #fff;
  stroke-width: 2.2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.ill-line {
  fill: var(--color-paper-line);
}
.ill-sky {
  fill: var(--color-aqua-50);
}
.ill-hill {
  fill: var(--color-secondary-200);
}
.ill-ballast {
  fill: var(--color-secondary-500);
  opacity: 0.35;
}
.ill-rail,
.ill-sleeper {
  fill: none;
  stroke: var(--color-petrol-700);
  stroke-linecap: round;
}
.ill-rail {
  stroke-width: 2.2;
}
.ill-sleeper {
  stroke-width: 2;
  opacity: 0.55;
}
.ill-cone-base {
  fill: var(--color-petrol-700);
}
</style>
