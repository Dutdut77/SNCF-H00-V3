<script setup>
// Bandeau d'en-tête de page (design V4) : carte blanche, facettes grises et feuilles posées derrière
// l'illustration, reprises des cartes de la page de connexion. Le slot reçoit `ui`, les classes de texte
// du bandeau (titre, texte, pastille) : le contenu sur mesure d'une page suit ainsi le style du bandeau.
const props = defineProps({
  // Titre et sous-titre par défaut, remplacés par le slot quand la page en fournit un
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  // Illustration à droite (masquée sur mobile) : 'taches' | 'chantiers' | 'planning' | null
  illustration: { type: String, default: null },
  // Titre souligné au survol quand le bandeau mène quelque part (@click posé par la page)
  clickable: { type: Boolean, default: false }
})

// Classes de texte du bandeau, transmises au slot (`ui`). Titre en texte dégradé comme sur la page de
// connexion ; le padding compensé par une marge négative garde les accents et les boucles de l'écriture
// dans la zone peinte (bg-clip-text ne peint que la boîte du texte). À droite, la marge est plus large :
// l'écriture penchée de Pacifico déborde après la dernière lettre. À l'impression : Traverse, en magenta uni
// (le texte en dégradé laisse des filets aux bords dans les PDF).
const ui = {
  titre:
    '-my-[0.2em] -mr-[0.4em] -ml-[0.1em] w-fit py-[0.2em] pr-[0.4em] pl-[0.1em] from-magenta-500 via-prune-500 to-prune-700 dark:from-magenta-400 dark:via-prune-300 dark:to-prune-100 bg-linear-90 bg-clip-text text-transparent decoration-magenta-300 underline-offset-6 group-hover/hero:underline print:bg-none print:text-magenta-700',
  texte: 'text-ink-soft',
  pastille: 'bg-slate-100 text-ink dark:bg-white/10 dark:text-white'
}
</script>

<template>
  <!-- group/hero : les titres (y compris ceux du slot) réagissent au survol (group-hover/hero:…) -->
  <header
    class="surface-card relative flex min-h-30 shrink-0 items-center overflow-hidden rounded-[0.9rem] px-7 py-5"
    :class="{ 'group/hero cursor-pointer': props.clickable }">
    <svg class="absolute inset-0 size-full" viewBox="0 0 1000 160" preserveAspectRatio="none" aria-hidden="true">
      <!-- Facettes derrière l'illustration seulement -->
      <polygon class="fill-slate-100 dark:fill-white/4" points="640,0 1000,0 1000,160 520,160" />
      <polygon class="fill-slate-200/70 dark:fill-white/6" points="1000,20 1000,160 760,160" />
    </svg>

    <!-- Slot par défaut : texte sur mesure (ex. compte, nom et périodes d'un chantier), qui reprend
         les classes du bandeau (ui.titre, ui.texte, ui.pastille). -->
    <div class="relative min-w-0 flex-1">
      <slot :ui="ui">
        <h1
          class="font-titre print:font-traverse text-[clamp(1.6rem,1.1rem+1.2vw,2.25rem)] leading-[1.3] print:leading-[1.1] print:tracking-[0.02em]"
          :class="ui.titre">
          {{ props.title }}
        </h1>
        <p v-if="props.description" class="mt-1.5 text-[0.9375rem]" :class="ui.texte">
          {{ props.description }}
        </p>
      </slot>
    </div>

    <svg
      v-if="props.illustration"
      class="hero-art relative -my-5 -mr-3 ml-4 hidden h-30 w-60 shrink-0 md:block"
      viewBox="0 0 300 150"
      aria-hidden="true">
      <defs>
        <filter id="hero-paper-shadow" x="-30%" y="-30%" width="160%" height="170%">
          <feDropShadow dx="0" dy="6" stdDeviation="7" flood-color="#230820" flood-opacity="0.4" />
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
          <path class="ill-cone-band" d="M9.2 15 H18.8 L21.7 24 H6.3 Z" />
          <rect class="ill-cone-base" x="-6" y="42" width="40" height="7" rx="2" />
        </g>
      </template>

      <!-- Planning : feuille de Gantt (barres aux couleurs des états, week-ends, trait du jour)
           et fiche des intervenants affectés -->
      <template v-else-if="props.illustration === 'planning'">
        <g transform="translate(122 14) rotate(5 75 56)" filter="url(#hero-paper-shadow)">
          <rect class="paper" width="150" height="112" rx="8" />
          <path class="ill-head" d="M0 8 a8 8 0 0 1 8 -8 h134 a8 8 0 0 1 8 8 v12 h-150 Z" />
          <rect class="paper opacity-60" x="48" y="8" width="22" height="4" rx="2" />
          <rect class="paper opacity-60" x="82" y="8" width="22" height="4" rx="2" />
          <rect class="paper opacity-60" x="116" y="8" width="22" height="4" rx="2" />
          <rect class="ill-line" x="40" y="26" width="1.5" height="80" />
          <g class="ill-line">
            <rect x="10" y="33" width="24" height="5" rx="2.5" />
            <rect x="10" y="53" width="20" height="5" rx="2.5" />
            <rect x="10" y="73" width="24" height="5" rx="2.5" />
            <rect x="10" y="93" width="18" height="5" rx="2.5" />
          </g>
          <rect class="fill-sky-500 opacity-45" x="46" y="31" width="22" height="9" rx="2.5" />
          <rect class="fill-sky-500" x="68" y="31" width="44" height="9" rx="2.5" />
          <rect class="fill-lime-500 opacity-45" x="58" y="51" width="26" height="9" rx="2.5" />
          <rect class="fill-lime-500" x="84" y="51" width="56" height="9" rx="2.5" />
          <rect class="fill-purple-500" x="50" y="71" width="34" height="9" rx="2.5" />
          <rect class="fill-sky-500 opacity-45" x="96" y="91" width="18" height="9" rx="2.5" />
          <rect class="fill-sky-500" x="114" y="91" width="28" height="9" rx="2.5" />
          <rect class="fill-orange-500" x="90" y="28" width="3" height="15" />
          <rect class="fill-orange-500" x="124" y="88" width="3" height="15" />
          <path class="stroke-secondary-500 fill-none" d="M106 24 V106" stroke-width="1.5" stroke-dasharray="3 3" />
        </g>
        <g transform="translate(24 64) rotate(-6 55 38)" filter="url(#hero-paper-shadow)">
          <rect class="paper" width="110" height="76" rx="8" />
          <circle class="fill-purple-300" cx="20" cy="18" r="7" />
          <rect class="ill-line" x="34" y="15" width="56" height="6" rx="3" />
          <circle class="fill-secondary-300" cx="18" cy="38" r="7" />
          <circle class="stroke-paper fill-sky-300" cx="28" cy="38" r="7" stroke-width="2" />
          <rect class="ill-line" x="42" y="35" width="44" height="6" rx="3" />
          <circle class="fill-emerald-300" cx="20" cy="58" r="7" />
          <rect class="ill-line" x="34" y="55" width="50" height="6" rx="3" />
        </g>
      </template>
    </svg>
  </header>
</template>

<style scoped>
/* Illustrations SVG : leurs teintes restent en CSS (fill/stroke sur des dizaines de formes) */
/* Feuilles et motifs : gris neutres, touches magenta (en-têtes, cases cochées, jour, soleil, cône) */
.paper {
  fill: var(--color-paper);
}
.ill-head {
  fill: var(--color-magenta-700);
}
.ill-cells rect {
  fill: var(--color-slate-100);
}
.ill-cells .is-soft {
  fill: var(--color-slate-200);
}
.ill-cells .is-strong {
  fill: var(--color-magenta-700);
}
.ill-cells .is-today,
.ill-sun,
.ill-cone {
  fill: var(--color-magenta-500);
}
.ill-cone-band {
  fill: var(--color-paper);
}
.ill-check {
  fill: var(--color-magenta-500);
}
.ill-check-off {
  fill: none;
  stroke: var(--color-slate-300);
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
  fill: var(--color-slate-100);
}
.ill-hill {
  fill: var(--color-slate-200);
}
.ill-ballast {
  fill: var(--color-slate-400);
  opacity: 0.35;
}
.ill-rail,
.ill-sleeper {
  fill: none;
  stroke: var(--color-magenta-800);
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
  fill: var(--color-magenta-900);
}
</style>
