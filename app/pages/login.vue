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
const { nomEntite, logoUrl } = useApplication()
// « de l'Infrapôle… », « de la… » : élision devant une voyelle ou un h
const chantiersDe = computed(() => {
  if (!nomEntite.value) return 'vos chantiers'
  return /^[aeiouyhàâéèêëîïôûü]/i.test(nomEntite.value)
    ? `les chantiers de l'${nomEntite.value}`
    : `les chantiers de ${nomEntite.value}`
})
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
  <div class="text-ink dark:bg-night-900 relative min-h-dvh w-full bg-slate-100 lg:grid lg:grid-cols-[19rem_1fr]">
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
      class="panel-petrol relative flex flex-col overflow-hidden px-6 py-5 text-white lg:sticky lg:top-0 lg:h-dvh lg:px-6 lg:py-10">
      <div class="relative flex shrink-0 items-center gap-4 lg:flex-col lg:gap-5 lg:pt-6 lg:text-center">
        <!-- Pastille blanche : le logo reste lisible sur le pétrole quelle que soit sa couleur -->
        <span v-if="logoUrl" class="inline-flex rounded-xl bg-white p-1.5">
          <AppLogo class="h-10 w-auto lg:h-16" />
        </span>
        <div>
          <p class="font-traverse text-2xl leading-none tracking-wide lg:text-[2.4rem] lg:leading-[1.05]">
            H00
            <br class="hidden lg:block" />
            Travaux
          </p>
          <p v-if="nomEntite" class="text-secondary-300 mt-1.5 text-sm font-medium tracking-[0.01em] lg:mt-4">
            {{ nomEntite }}
          </p>
        </div>
      </div>

      <!-- Schéma de voie type TCO : décor seul, rien de cliquable -->
      <div class="tco relative mt-8 hidden min-h-0 flex-1 lg:block" aria-hidden="true">
        <svg viewBox="0 0 240 360" preserveAspectRatio="xMidYMid meet" class="tco__svg h-full w-full">
          <g class="tco__idle">
            <!-- Voies prolongées hors du cadre : le fondu les fait apparaître quelle que soit la hauteur -->
            <path d="M95 -600 V960" />
            <path d="M145 -600 V960" />
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

      <p class="relative hidden shrink-0 pt-8 text-center text-xs leading-relaxed text-white/45 lg:block">
        v{{ APP_VERSION }}
        <br />
        © 2026 Applissimo
      </p>
    </aside>

    <!-- Bascule thème : dans le bandeau sur mobile, en haut à droite du contenu sur desktop -->
    <button
      type="button"
      @click="isDark = !isDark"
      class="lg:text-ink-soft lg:hover:bg-ink/14 lg:hover:text-ink focus-visible:outline-secondary-500 absolute top-7 right-4 z-10 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-white/75 transition-colors hover:bg-white/12 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-3 lg:top-5 lg:right-5"
      :aria-label="isDark ? 'Activer le thème clair' : 'Activer le thème sombre'">
      <Icon :name="isDark ? 'lucide:sun' : 'lucide:moon'" size="18" />
    </button>

    <!-- ===== Contenu ===== -->
    <main class="px-6 pt-10 pb-14 sm:px-10 lg:px-14 lg:pt-20 xl:px-20">
      <div class="mx-auto max-w-6xl">
        <header class="max-w-2xl">
          <h1 class="font-traverse text-ink text-[clamp(2rem,1.2rem+2.8vw,3.4rem)] leading-[1.1] tracking-[0.02em]">
            Bienvenue sur H00&nbsp;!
          </h1>
          <p class="text-ink-soft mt-5 max-w-xl text-[1.0625rem] leading-relaxed">
            Votre espace pour suivre {{ chantiersDe }}&nbsp;: tâches, plannings et alertes, au même endroit.
          </p>

          <div class="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-5">
            <button
              type="button"
              @click="redirectToAuth"
              :disabled="isRedirecting"
              :aria-busy="isRedirecting"
              class="bg-petrol-700 enabled:hover:bg-secondary-600 dark:bg-secondary-600 dark:enabled:hover:bg-secondary-500 focus-visible:outline-secondary-500 inline-flex cursor-pointer items-center justify-center gap-2.5 rounded-lg px-4 py-3.5 text-[0.9rem] font-semibold text-white shadow-[0_8px_20px_-10px_rgb(6_35_43/0.7)] transition focus-visible:outline-2 focus-visible:outline-offset-3 enabled:active:translate-y-px disabled:cursor-wait disabled:opacity-80 sm:px-5.5 sm:text-[0.95rem] dark:shadow-none">
              <Icon
                :name="isRedirecting ? 'lucide:loader-circle' : 'lucide:log-in'"
                size="18"
                class="shrink-0"
                :class="{ 'animate-spin': isRedirecting }" />
              {{ isRedirecting ? 'Redirection…' : 'Se connecter avec mon compte SNCF' }}
            </button>
            <span class="text-ink-soft flex items-center gap-1.5 text-xs">
              <Icon name="lucide:shield-check" size="14" />
              Authentification unique SNCF
            </span>
          </div>
        </header>

        <hr class="border-ink/14 my-10 lg:my-12" />

        <!-- ===== Modules ===== -->
        <section class="grid gap-6 md:grid-cols-3" aria-label="Modules de l'application">
          <article
            v-for="(mod, i) in modules"
            :key="mod.key"
            class="surface-card overflow-hidden rounded-xl sm:max-md:grid sm:max-md:grid-cols-[15rem_1fr] sm:max-md:items-center"
            :style="{ '--i': i }">
            <div class="bg-aqua *:block *:aspect-[320/220] *:h-auto *:w-full">
              <!-- Chantiers : photo de voie + liste de tâches + cône -->
              <svg v-if="mod.key === 'chantiers'" viewBox="0 0 320 220" aria-hidden="true">
                <polygon class="fill-white/28 dark:fill-white/7" points="0,0 150,0 40,150" />
                <polygon class="fill-petrol-800/12 dark:fill-black/18" points="320,30 320,220 190,220" />
                <polygon class="fill-white/28 dark:fill-white/7" points="210,0 320,0 320,70" />

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
                <polygon class="fill-petrol-800/12 dark:fill-black/18" points="0,70 0,220 110,220" />
                <polygon class="fill-white/28 dark:fill-white/7" points="120,0 320,0 320,110" />
                <polygon class="fill-white/28 dark:fill-white/7" points="0,0 70,0 0,60" />

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
                <polygon class="fill-white/28 dark:fill-white/7" points="0,0 190,0 0,120" />
                <polygon class="fill-petrol-800/12 dark:fill-black/18" points="230,220 320,220 320,90" />
                <circle class="fill-white/28 dark:fill-white/7" cx="92" cy="176" r="46" />

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

            <div class="px-6 pt-5 pb-6.5">
              <h2 class="text-secondary-600 dark:text-secondary-300 text-lg font-semibold">{{ mod.title }}</h2>
              <p class="text-ink-soft mt-2 text-sm leading-normal">{{ mod.text }}</p>
            </div>
          </article>
        </section>

        <p class="text-ink-soft mt-12 text-xs lg:hidden">v{{ APP_VERSION }} · © 2026 Applissimo</p>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* Schéma de voie : l'itinéraire éclairé circule comme une section occupée sur un TCO */
.tco {
  overflow: hidden;
  -webkit-mask-image: linear-gradient(transparent, #000 14%, #000 86%, transparent);
  mask-image: linear-gradient(transparent, #000 14%, #000 86%, transparent);
}
.tco__svg {
  overflow: visible;
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
  font-size: 11px;
  letter-spacing: 0.08em;
}
/* ===== Illustrations ===== */
.paper {
  transform-box: fill-box;
  transform-origin: center;
  transform: rotate(var(--r));
  filter: url(#login2-paper-shadow);
  animation: settle 0.75s cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: calc(var(--i, 0) * 120ms + var(--d, 0ms) + 150ms);
}
.paper__sheet {
  fill: var(--color-paper);
}

.ill-sky {
  fill: var(--color-aqua-50);
}
.ill-sun {
  fill: var(--color-rust-500);
}
.ill-hill {
  fill: var(--color-secondary-200);
}
.ill-ballast {
  fill: var(--color-secondary-500);
  opacity: 0.35;
}
.ill-rail {
  stroke: var(--color-petrol-700);
  stroke-width: 2.2;
  stroke-linecap: round;
  fill: none;
}
.ill-sleeper {
  stroke: var(--color-petrol-700);
  stroke-width: 2;
  stroke-linecap: round;
  opacity: 0.55;
}

.ill-check-on {
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
.ill-line.is-faint {
  opacity: 0.6;
}

.ill-cone {
  fill: var(--color-rust-500);
}
.ill-cone-band {
  fill: #fff;
}
.ill-cone-base {
  fill: var(--color-petrol-700);
}

.ill-cal-head {
  fill: var(--color-petrol-700);
}
.ill-ring {
  fill: var(--color-paper);
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
.ill-cells .is-today {
  fill: var(--color-rust-500);
}

.ill-grid {
  stroke: var(--color-paper-line);
  stroke-width: 1.5;
  fill: none;
}
.ill-bar-strong {
  fill: var(--color-petrol-700);
}
.ill-bar {
  fill: var(--color-secondary-500);
}
.ill-bar-soft {
  fill: var(--color-secondary-200);
}
.ill-today {
  stroke: var(--color-rust-500);
  stroke-width: 2;
  stroke-dasharray: 4 4;
}

.ill-alert-bg {
  fill: var(--color-rust-100);
}
.ill-alert {
  fill: var(--color-rust-500);
  stroke: var(--color-rust-500);
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
