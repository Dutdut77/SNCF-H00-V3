<script setup>
import { APP_VERSION } from '~/utils/changelog'

definePageMeta({
  requiresAuth: false,
  layout: false
})
useHead({
  title: 'H00 - Login',
  description: 'Page de connexion'
})

const { isDark } = useDarkMode()
const isRedirecting = ref(false)

const redirectToAuth = () => {
  if (isRedirecting.value) return
  isRedirecting.value = true
  const currentUrl = new URL(window.location.href)
  const redirectUrl = currentUrl.searchParams.get('redirect') || '/'
  window.location.href = `/api/auth/login?redirect=${encodeURIComponent(redirectUrl)}`
}

const modules = [
  {
    key: 'chantiers',
    title: 'Chantiers',
    text: 'Chaque chantier réunit ses tâches, sa timeline, ses contacts, ses études et ses photos.'
  },
  {
    key: 'calendriers',
    title: 'Calendriers',
    text: 'Le plan de charge général, le planning des agents et le calendrier annuel des tâches.'
  },
  {
    key: 'dashboard',
    title: 'Dashboard',
    text: "Alertes, RP1 / RP3, statistiques, logistique et EPM sur l'ensemble des chantiers."
  }
]
</script>

<template>
  <div class="login2 relative min-h-dvh w-full lg:grid lg:grid-cols-[19rem_1fr]" :class="{ 'theme-dark': isDark }">
    <!-- Ombre portée partagée par les « feuilles » des illustrations -->
    <svg width="0" height="0" class="absolute" aria-hidden="true">
      <defs>
        <filter id="login2-paper-shadow" x="-30%" y="-30%" width="160%" height="170%">
          <feDropShadow dx="0" dy="6" stdDeviation="7" flood-color="#062a33" flood-opacity="0.22" />
        </filter>
      </defs>
    </svg>

    <!-- ===== Panneau latéral ===== -->
    <aside
      class="side relative flex flex-col overflow-hidden px-6 py-5 text-white lg:sticky lg:top-0 lg:h-dvh lg:px-6 lg:py-10">
      <div class="relative flex shrink-0 items-center gap-4 lg:flex-col lg:gap-5 lg:text-center">
        <img src="/images/logo_uo.png" alt="Logo UO Travaux Paris Est" class="w-14 shrink-0 lg:w-24" />
        <div>
          <p class="font-[Traverse] text-2xl leading-none tracking-wide lg:text-[2.4rem] lg:leading-[1.05]">
            H00
            <br class="hidden lg:block" />
            Travaux
          </p>
          <p class="side__motto mt-1 font-[Pacifico] text-sm lg:mt-3">Vos projets, notre savoir-fer</p>
        </div>
      </div>

      <!-- Schéma de voie type TCO : décor seul, rien de cliquable -->
      <div class="tco relative mt-8 hidden min-h-0 flex-1 lg:block" aria-hidden="true">
        <svg viewBox="0 0 240 360" preserveAspectRatio="xMidYMid slice" class="h-full w-full">
          <g class="tco__idle">
            <path d="M95 0 V360" />
            <path d="M145 0 V360" />
            <!-- Aiguillages et voie de service -->
            <path d="M145 90 C145 120 95 125 95 150" />
            <path d="M95 210 C95 235 145 240 145 270" />
            <path d="M145 150 C145 172 185 175 185 197 V250" />
          </g>

          <!-- Heurtoir en bout de voie de service -->
          <path class="tco__buffer" d="M175 250 H195" />

          <!-- Signal à voie libre -->
          <g class="tco__signal">
            <path d="M78 206 V186" />
            <circle cx="78" cy="181" r="4.5" />
          </g>

          <!-- Itinéraire : V2, bascule sur V1, retour sur V2 -->
          <path
            class="tco__live"
            pathLength="100"
            d="M145 0 V90 C145 120 95 125 95 150 V210 C95 235 145 240 145 270 V360" />

          <g class="tco__label">
            <text x="86" y="60" text-anchor="end">V1</text>
            <text x="154" y="60">V2</text>
            <text x="194" y="226">VS</text>
          </g>
        </svg>
      </div>

      <p class="side__foot relative hidden shrink-0 pt-8 text-center text-xs lg:block">
        v{{ APP_VERSION }}
        <br />
        © 2026 UO Travaux Paris Est
      </p>
    </aside>

    <!-- Bascule thème : dans le bandeau sur mobile, en haut à droite du contenu sur desktop -->
    <button
      type="button"
      @click="isDark = !isDark"
      class="theme-toggle absolute top-7 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full lg:top-5 lg:right-5"
      :aria-label="isDark ? 'Activer le thème clair' : 'Activer le thème sombre'">
      <Icon :name="isDark ? 'lucide:sun' : 'lucide:moon'" size="18" />
    </button>

    <!-- ===== Contenu ===== -->
    <main class="content px-6 pt-10 pb-14 sm:px-10 lg:px-14 lg:pt-20 xl:px-20">
      <div class="mx-auto max-w-6xl">
        <header class="max-w-2xl">
          <h1 class="content__title">Bienvenue sur H00&nbsp;!</h1>
          <p class="content__lead mt-5">
            Votre espace pour suivre les chantiers de l'UO Travaux Paris Est&nbsp;: tâches, plannings et alertes, au
            même endroit.
          </p>

          <div class="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-5">
            <button
              type="button"
              @click="redirectToAuth"
              :disabled="isRedirecting"
              :aria-busy="isRedirecting"
              class="cta">
              <Icon
                :name="isRedirecting ? 'lucide:loader-circle' : 'lucide:log-in'"
                size="18"
                class="shrink-0"
                :class="{ 'animate-spin': isRedirecting }" />
              {{ isRedirecting ? 'Redirection…' : 'Se connecter avec mon compte SNCF' }}
            </button>
            <span class="content__note flex items-center gap-1.5 text-xs">
              <Icon name="lucide:shield-check" size="14" />
              Authentification unique SNCF
            </span>
          </div>
        </header>

        <hr class="content__rule my-10 lg:my-12" />

        <!-- ===== Modules ===== -->
        <section class="grid gap-6 md:grid-cols-3" aria-label="Modules de l'application">
          <article v-for="(mod, i) in modules" :key="mod.key" class="card" :style="{ '--i': i }">
            <div class="card__art">
              <!-- Chantiers : photo de voie + liste de tâches + cône -->
              <svg v-if="mod.key === 'chantiers'" viewBox="0 0 320 220" aria-hidden="true">
                <polygon class="facet facet--light" points="0,0 150,0 40,150" />
                <polygon class="facet facet--dark" points="320,30 320,220 190,220" />
                <polygon class="facet facet--light" points="210,0 320,0 320,70" />

                <g transform="translate(46 30)">
                  <g class="paper" style="--r: -8deg; --d: 0ms">
                    <rect class="paper__sheet" width="150" height="112" rx="8" />
                    <rect class="ill-sky" x="10" y="10" width="130" height="92" rx="4" />
                    <circle class="ill-sun" cx="108" cy="32" r="10" />
                    <path class="ill-hill" d="M10 74 L52 46 L80 62 L108 48 L140 70 V102 H10 Z" />
                    <path class="ill-ballast" d="M38 102 L71 62 H79 L112 102 Z" />
                    <path
                      class="ill-sleeper"
                      d="M45.7 97 H104.3 M53.3 87 H96.7 M59.3 79 H90.7 M64.5 72 H85.5 M68.3 67 H81.7" />
                    <path class="ill-rail" d="M48 102 L73 62 M102 102 L77 62" />
                  </g>
                </g>

                <g transform="translate(170 100)">
                  <g class="paper" style="--r: 6deg; --d: 90ms">
                    <rect class="paper__sheet" width="118" height="88" rx="8" />
                    <rect class="ill-check-on" x="14" y="16" width="14" height="14" rx="3" />
                    <path class="ill-tick" d="M17.5 23 l3 3 l5.5 -6" />
                    <rect class="ill-line" x="36" y="20" width="62" height="6" rx="3" />
                    <rect class="ill-check-on" x="14" y="38" width="14" height="14" rx="3" />
                    <path class="ill-tick" d="M17.5 45 l3 3 l5.5 -6" />
                    <rect class="ill-line" x="36" y="42" width="48" height="6" rx="3" />
                    <rect class="ill-check-off" x="15" y="61" width="12" height="12" rx="3" />
                    <rect class="ill-line" x="36" y="64" width="56" height="6" rx="3" />
                  </g>
                </g>

                <g transform="translate(28 150)" class="cone">
                  <path class="ill-cone" d="M14 0 L28 44 H0 Z" />
                  <path class="ill-cone-band" d="M9.2 15 H18.8 L21.7 24 H6.3 Z" />
                  <rect class="ill-cone-base" x="-6" y="42" width="40" height="7" rx="2" />
                </g>
              </svg>

              <!-- Calendriers : feuille de calendrier + planning en barres -->
              <svg v-else-if="mod.key === 'calendriers'" viewBox="0 0 320 220" aria-hidden="true">
                <polygon class="facet facet--dark" points="0,70 0,220 110,220" />
                <polygon class="facet facet--light" points="120,0 320,0 320,110" />
                <polygon class="facet facet--light" points="0,0 70,0 0,60" />

                <g transform="translate(150 22)">
                  <g class="paper" style="--r: 7deg; --d: 0ms">
                    <rect class="paper__sheet" width="140" height="124" rx="8" />
                    <path class="ill-cal-head" d="M0 8 a8 8 0 0 1 8 -8 h124 a8 8 0 0 1 8 8 v18 h-140 Z" />
                    <circle class="ill-ring" cx="36" cy="13" r="4" />
                    <circle class="ill-ring" cx="104" cy="13" r="4" />
                    <g class="ill-cells">
                      <rect x="12" y="38" width="18" height="16" rx="3" />
                      <rect class="is-soft" x="36" y="38" width="18" height="16" rx="3" />
                      <rect class="is-soft" x="60" y="38" width="18" height="16" rx="3" />
                      <rect x="84" y="38" width="18" height="16" rx="3" />
                      <rect x="108" y="38" width="18" height="16" rx="3" />
                      <rect x="12" y="60" width="18" height="16" rx="3" />
                      <rect x="36" y="60" width="18" height="16" rx="3" />
                      <rect class="is-strong" x="60" y="60" width="18" height="16" rx="3" />
                      <rect class="is-strong" x="84" y="60" width="18" height="16" rx="3" />
                      <rect x="108" y="60" width="18" height="16" rx="3" />
                      <rect class="is-today" x="12" y="82" width="18" height="16" rx="3" />
                      <rect class="is-soft" x="36" y="82" width="18" height="16" rx="3" />
                      <rect x="60" y="82" width="18" height="16" rx="3" />
                      <rect x="84" y="82" width="18" height="16" rx="3" />
                      <rect class="is-soft" x="108" y="82" width="18" height="16" rx="3" />
                    </g>
                  </g>
                </g>

                <g transform="translate(34 92)">
                  <g class="paper" style="--r: -6deg; --d: 90ms">
                    <rect class="paper__sheet" width="160" height="92" rx="8" />
                    <path class="ill-grid" d="M40 14 V78 M80 14 V78 M120 14 V78" />
                    <rect class="ill-bar-strong" x="14" y="18" width="70" height="10" rx="5" />
                    <rect class="ill-bar" x="46" y="36" width="84" height="10" rx="5" />
                    <rect class="ill-bar-soft" x="30" y="54" width="46" height="10" rx="5" />
                    <rect class="ill-bar-strong" x="92" y="54" width="52" height="10" rx="5" />
                    <path class="ill-today" d="M104 10 V82" />
                  </g>
                </g>
              </svg>

              <!-- Dashboard : histogramme + carte d'alerte -->
              <svg v-else viewBox="0 0 320 220" aria-hidden="true">
                <polygon class="facet facet--light" points="0,0 190,0 0,120" />
                <polygon class="facet facet--dark" points="230,220 320,220 320,90" />
                <circle class="facet facet--light" cx="92" cy="176" r="46" />

                <g transform="translate(36 34)">
                  <g class="paper" style="--r: -7deg; --d: 0ms">
                    <rect class="paper__sheet" width="148" height="120" rx="8" />
                    <rect class="ill-line" x="14" y="14" width="56" height="6" rx="3" />
                    <path class="ill-grid" d="M14 102 H134" />
                    <rect class="ill-bar-strong" x="20" y="58" width="16" height="44" rx="2" />
                    <rect class="ill-bar" x="44" y="40" width="16" height="62" rx="2" />
                    <rect class="ill-bar-strong" x="68" y="68" width="16" height="34" rx="2" />
                    <rect class="ill-bar-soft" x="92" y="48" width="16" height="54" rx="2" />
                    <rect class="ill-bar" x="116" y="30" width="16" height="72" rx="2" />
                  </g>
                </g>

                <g transform="translate(176 96)">
                  <g class="paper" style="--r: 5deg; --d: 90ms">
                    <rect class="paper__sheet" width="116" height="92" rx="8" />
                    <circle class="ill-alert-bg" cx="30" cy="30" r="16" />
                    <path class="ill-alert" d="M30 20 L40 38 H20 Z" />
                    <path class="ill-alert-mark" d="M30 26.5 V31.5 M30 34.5 V34.6" />
                    <rect class="ill-line" x="54" y="22" width="46" height="6" rx="3" />
                    <rect class="ill-line is-faint" x="54" y="33" width="32" height="5" rx="2.5" />
                    <rect class="ill-line" x="16" y="60" width="84" height="6" rx="3" />
                    <rect class="ill-line is-faint" x="16" y="72" width="60" height="5" rx="2.5" />
                  </g>
                </g>
              </svg>
            </div>

            <div class="card__body">
              <h2 class="card__title">{{ mod.title }}</h2>
              <p class="card__text">{{ mod.text }}</p>
            </div>
          </article>
        </section>

        <p class="content__note mt-12 text-xs lg:hidden">v{{ APP_VERSION }} · © 2026 UO Travaux Paris Est</p>
      </div>
    </main>
  </div>
</template>

<style scoped>
.login2 {
  /* Panneau latéral : pétrole, entre le navy du thème sombre et la sarcelle du logo */
  --side-top: #06232b;
  --side-bottom: #0d3f47;
  --side-glow: rgba(63, 141, 125, 0.35);

  --page: #eef1f0;
  --ink: #0a2630;
  --ink-soft: #3d5158;
  --rule: rgba(10, 38, 48, 0.14);

  --card: #fbfcfb;
  --card-edge: rgba(10, 38, 48, 0.06);
  --card-shadow: 0 1px 2px rgba(10, 38, 48, 0.06), 0 12px 28px -12px rgba(10, 38, 48, 0.22);
  --card-title: var(--color-secondary-600);

  /* Illustrations */
  --art-a: #9fd0c4;
  --art-b: #d7ebe6;
  --facet-light: rgba(255, 255, 255, 0.28);
  --facet-dark: rgba(14, 64, 71, 0.12);
  --paper: #ffffff;
  --petrol: #0e4a55;
  --teal: #3f8d7d;
  --teal-soft: #b0dbd0;
  --teal-mist: #e3f1ed;
  --line: #d9e3e1;
  /* Vieux rose du logo UO : seul contrepoint chaud, utilisé avec parcimonie */
  --rust: #c9665e;
  --rust-soft: #f6dcd8;

  background: var(--page);
  color: var(--ink);
}

.login2.theme-dark {
  --side-top: #03141a;
  --side-bottom: #082b31;
  --side-glow: rgba(63, 141, 125, 0.28);

  --page: #0b1220;
  --ink: #eef3f2;
  --ink-soft: #a5b4b9;
  --rule: rgba(203, 213, 225, 0.14);

  --card: #111b2b;
  --card-edge: rgba(255, 255, 255, 0.07);
  --card-shadow: 0 1px 2px rgba(0, 0, 0, 0.3), 0 16px 32px -14px rgba(0, 0, 0, 0.6);
  --card-title: var(--color-secondary-300);

  --art-a: #1f5a52;
  --art-b: #2f6f62;
  --facet-light: rgba(255, 255, 255, 0.07);
  --facet-dark: rgba(0, 0, 0, 0.18);
  --paper: #e9f0ee;
  --line: #cbd8d5;
}

/* ===== Panneau latéral ===== */
.side {
  background:
    radial-gradient(120% 55% at 0% 100%, var(--side-glow), transparent 70%),
    linear-gradient(180deg, var(--side-top) 0%, var(--side-bottom) 100%);
}
.side__motto {
  color: var(--color-secondary-300);
}

/* Schéma de voie : l'itinéraire éclairé circule comme une section occupée sur un TCO */
.tco {
  -webkit-mask-image: linear-gradient(transparent, #000 14%, #000 86%, transparent);
  mask-image: linear-gradient(transparent, #000 14%, #000 86%, transparent);
}
.tco__idle path {
  fill: none;
  stroke: rgba(255, 255, 255, 0.16);
  stroke-width: 2;
}
.tco__buffer {
  fill: none;
  stroke: rgba(255, 255, 255, 0.32);
  stroke-width: 3;
  stroke-linecap: round;
}
.tco__signal path {
  stroke: rgba(255, 255, 255, 0.3);
  stroke-width: 1.5;
}
.tco__signal circle {
  fill: var(--color-secondary-400);
  filter: drop-shadow(0 0 4px var(--color-secondary-400));
}
.tco__live {
  fill: none;
  stroke: var(--color-secondary-400);
  stroke-width: 2.5;
  stroke-linecap: round;
  filter: drop-shadow(0 0 6px rgba(85, 171, 150, 0.8));
  stroke-dasharray: 16 200;
  animation: circulation 9s cubic-bezier(0.45, 0, 0.55, 1) infinite;
}
.tco__label text {
  fill: rgba(255, 255, 255, 0.38);
  font-size: 9px;
  letter-spacing: 0.08em;
}
.side__foot {
  color: rgba(255, 255, 255, 0.45);
  line-height: 1.6;
}

/* ===== Contenu ===== */
.content__title {
  /* Traverse : capitales en traits parallèles, comme des rails (n'existe qu'en 400) */
  font-family: 'Traverse', sans-serif;
  font-size: clamp(2rem, 1.2rem + 2.8vw, 3.4rem);
  font-weight: 400;
  line-height: 1.1;
  letter-spacing: 0.02em;
  color: var(--ink);
}
.content__lead {
  max-width: 36rem;
  font-size: 1.0625rem;
  line-height: 1.6;
  color: var(--ink-soft);
}
.content__note {
  color: var(--ink-soft);
}
.content__rule {
  border: 0;
  border-top: 1px solid var(--rule);
}

.theme-toggle {
  color: rgba(255, 255, 255, 0.75);
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
  cursor: pointer;
}
.theme-toggle:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.12);
}
@media (min-width: 1024px) {
  .theme-toggle {
    color: var(--ink-soft);
  }
  .theme-toggle:hover {
    color: var(--ink);
    background: var(--rule);
  }
}

/* Bouton de connexion */
.cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  padding: 0.85rem 1rem;
  border-radius: 0.6rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: #fff;
  background: var(--petrol);
  box-shadow: 0 8px 20px -10px rgba(6, 35, 43, 0.7);
  transition:
    background-color 0.2s ease,
    transform 0.2s ease;
  cursor: pointer;
}
@media (min-width: 640px) {
  .cta {
    padding-inline: 1.4rem;
    font-size: 0.95rem;
  }
}
.cta:hover:not(:disabled) {
  background: var(--color-secondary-600);
}
.cta:active:not(:disabled) {
  transform: translateY(1px);
}
.cta:disabled {
  cursor: wait;
  opacity: 0.8;
}
.theme-dark .cta {
  background: var(--color-secondary-600);
  box-shadow: none;
}
.theme-dark .cta:hover:not(:disabled) {
  background: var(--color-secondary-500);
}
.cta:focus-visible,
.theme-toggle:focus-visible {
  outline: 2px solid var(--color-secondary-500);
  outline-offset: 3px;
}

/* ===== Cartes modules ===== */
.card {
  overflow: hidden;
  border-radius: 0.75rem;
  background: var(--card);
  box-shadow: var(--card-shadow);
  outline: 1px solid var(--card-edge);
  outline-offset: -1px;
}
/* Entre mobile et 3 colonnes : illustration à gauche, texte à droite */
@media (min-width: 640px) and (max-width: 767.98px) {
  .card {
    display: grid;
    grid-template-columns: 15rem 1fr;
    align-items: center;
  }
}
.card__art {
  background: linear-gradient(150deg, var(--art-a) 0%, var(--art-b) 100%);
}
.card__art svg {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 320 / 220;
}
.card__body {
  padding: 1.25rem 1.5rem 1.6rem;
}
.card__title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--card-title);
}
.card__text {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  line-height: 1.55;
  color: var(--ink-soft);
}

/* ===== Illustrations ===== */
.facet--light {
  fill: var(--facet-light);
}
.facet--dark {
  fill: var(--facet-dark);
}

.paper {
  transform-box: fill-box;
  transform-origin: center;
  transform: rotate(var(--r));
  filter: url(#login2-paper-shadow);
  animation: settle 0.75s cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: calc(var(--i, 0) * 120ms + var(--d, 0ms) + 150ms);
}
.paper__sheet {
  fill: var(--paper);
}

.ill-sky {
  fill: var(--teal-mist);
}
.ill-sun {
  fill: var(--rust);
}
.ill-hill {
  fill: var(--teal-soft);
}
.ill-ballast {
  fill: var(--teal);
  opacity: 0.35;
}
.ill-rail {
  stroke: var(--petrol);
  stroke-width: 2.2;
  stroke-linecap: round;
  fill: none;
}
.ill-sleeper {
  stroke: var(--petrol);
  stroke-width: 2;
  stroke-linecap: round;
  opacity: 0.55;
}

.ill-check-on {
  fill: var(--teal);
}
.ill-check-off {
  fill: none;
  stroke: var(--teal-soft);
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
  fill: var(--line);
}
.ill-line.is-faint {
  opacity: 0.6;
}

.ill-cone {
  fill: var(--rust);
}
.ill-cone-band {
  fill: #fff;
}
.ill-cone-base {
  fill: var(--petrol);
}

.ill-cal-head {
  fill: var(--petrol);
}
.ill-ring {
  fill: var(--paper);
}
.ill-cells rect {
  fill: var(--teal-mist);
}
.ill-cells .is-soft {
  fill: var(--teal-soft);
}
.ill-cells .is-strong {
  fill: var(--teal);
}
.ill-cells .is-today {
  fill: var(--rust);
}

.ill-grid {
  stroke: var(--line);
  stroke-width: 1.5;
  fill: none;
}
.ill-bar-strong {
  fill: var(--petrol);
}
.ill-bar {
  fill: var(--teal);
}
.ill-bar-soft {
  fill: var(--teal-soft);
}
.ill-today {
  stroke: var(--rust);
  stroke-width: 2;
  stroke-dasharray: 4 4;
}

.ill-alert-bg {
  fill: var(--rust-soft);
}
.ill-alert {
  fill: var(--rust);
  stroke: var(--rust);
  stroke-width: 3;
  stroke-linejoin: round;
}
.ill-alert-mark {
  stroke: #fff;
  stroke-width: 2.4;
  stroke-linecap: round;
}

/* Les feuilles se posent sur la carte au chargement : seul mouvement de la page */
@keyframes settle {
  from {
    opacity: 0;
    transform: translateY(-14px) rotate(0deg);
  }
  to {
    opacity: 1;
    transform: rotate(var(--r));
  }
}

@keyframes circulation {
  0% {
    stroke-dashoffset: 16;
  }
  75%,
  100% {
    stroke-dashoffset: -100;
  }
}

@media (prefers-reduced-motion: reduce) {
  .paper {
    animation: none;
  }
  /* L'itinéraire reste tracé, sans circulation */
  .tco__live {
    animation: none;
    stroke-dasharray: none;
    opacity: 0.85;
  }
}
</style>
