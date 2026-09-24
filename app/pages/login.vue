<script setup>
// Page de connexion aux couleurs de la bannière SNCF Réseau : pourpre et prune, magenta en accent.
// Écrite uniquement en classes Tailwind (tokens magenta-* et prune-* dans main.css).
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

// Feuille d'illustration : tournée de --r, elle se pose au chargement (décalée par carte, --i, et par feuille, --d)
const FEUILLE =
  'transform-fill origin-center rotate-(--r) animate-settle [animation-delay:calc(var(--i)*120ms_+_var(--d)_+_150ms)] [filter:url(#login-ombre)] motion-reduce:animate-none'
// Facettes claires et sombres du fond des cartes, comme la vague de la bannière
const FACETTE_CLAIRE = 'fill-white/10 dark:fill-white/6'
const FACETTE_SOMBRE = 'fill-black/15 dark:fill-black/25'
</script>

<template>
  <div
    class="relative min-h-dvh w-full bg-slate-50 text-zinc-800 lg:grid lg:grid-cols-[19rem_1fr] dark:bg-zinc-950 dark:text-zinc-100">
    <!-- Ombre portée partagée par les « feuilles » des illustrations -->
    <svg width="0" height="0" class="absolute" aria-hidden="true">
      <defs>
        <filter id="login-ombre" x="-30%" y="-30%" width="160%" height="170%">
          <feDropShadow dx="0" dy="6" stdDeviation="7" flood-color="#230820" flood-opacity="0.4" />
        </filter>
      </defs>
    </svg>

    <!-- ===== Panneau latéral : dégradé de la bannière, bord biseauté comme sa découpe ===== -->
    <aside
      class="from-magenta-700 via-magenta-800 to-magenta-900 dark:from-magenta-900 dark:via-magenta-950 dark:to-prune-950 relative flex flex-col overflow-hidden bg-linear-160 px-6 pt-5 pb-12 text-white [clip-path:polygon(0_0,100%_0,100%_calc(100%-2.5rem),0_100%)] lg:sticky lg:top-0 lg:h-dvh lg:px-6 lg:py-10 lg:[clip-path:polygon(0_0,100%_0,84%_100%,0_100%)]">
      <!-- Reflet du magenta vif, en haut à gauche comme sur la bannière -->
      <div
        class="bg-magenta-500/35 dark:bg-magenta-500/15 pointer-events-none absolute -top-24 -left-24 size-80 rounded-full blur-3xl"
        aria-hidden="true" />

      <div class="relative flex shrink-0 items-center gap-4 lg:flex-col lg:gap-5 lg:pt-6 lg:text-center">
        <span v-if="logoUrl" class="inline-flex rounded-xl bg-white p-1.5">
          <AppLogo class="h-10 w-auto lg:h-16" />
        </span>
        <div>
          <p class="font-traverse text-2xl leading-none tracking-wide lg:text-[2.4rem] lg:leading-[1.05]">
            H00
            <br class="hidden lg:block" />
            Travaux
          </p>
          <p v-if="nomEntite" class="mt-1.5 text-sm font-medium text-white/80 lg:mt-4">{{ nomEntite }}</p>
        </div>
      </div>

      <!-- Schéma de voie type TCO : décor seul, rien de cliquable -->
      <div class="relative mt-8 hidden min-h-0 flex-1 overflow-hidden mask-y-from-86% lg:block" aria-hidden="true">
        <svg viewBox="0 0 240 360" preserveAspectRatio="xMidYMid meet" class="size-full overflow-visible">
          <g class="fill-none stroke-white/20" stroke-width="2">
            <path d="M95 -600 V960" />
            <path d="M145 -600 V960" />
            <path d="M145 90 C145 120 95 125 95 150" />
            <path d="M95 210 C95 235 145 240 145 270" />
            <path d="M145 150 C145 172 185 175 185 197 V250" />
          </g>
          <path class="fill-none stroke-white/40" stroke-width="3" stroke-linecap="round" d="M175 250 H195" />
          <path class="stroke-white/35" stroke-width="1.5" d="M78 206 V186" />
          <circle class="fill-white drop-shadow-[0_0_4px_rgb(255_255_255/0.8)]" cx="78" cy="181" r="4.5" />
          <!-- Itinéraire : V2, bascule sur V1, retour sur V2 -->
          <path
            class="animate-circulation fill-none stroke-white drop-shadow-[0_0_6px_rgb(255_255_255/0.7)] motion-reduce:animate-none motion-reduce:[stroke-dasharray:none]"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-dasharray="16 200"
            pathLength="100"
            d="M145 0 V90 C145 120 95 125 95 150 V210 C95 235 145 240 145 270 V360" />
          <g class="fill-white/45 text-[11px] tracking-[0.08em]">
            <text x="86" y="60" text-anchor="end">V1</text>
            <text x="154" y="60">V2</text>
            <text x="194" y="226">VS</text>
          </g>
        </svg>
      </div>

      <p class="relative hidden shrink-0 pt-8 pr-10 text-center text-xs leading-relaxed text-white/90 lg:block">
        v{{ APP_VERSION }}
        <br />
        © 2026 Applissimo
      </p>
    </aside>

    <!-- Bascule thème -->
    <button
      type="button"
      class="focus-visible:outline-magenta-500 absolute top-5 right-4 z-10 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/12 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-3 lg:top-5 lg:right-5 lg:text-zinc-500 lg:hover:bg-zinc-900/8 lg:hover:text-zinc-800 dark:lg:text-zinc-400 dark:lg:hover:bg-white/10 dark:lg:hover:text-white"
      :aria-label="isDark ? 'Activer le thème clair' : 'Activer le thème sombre'"
      @click="isDark = !isDark">
      <Icon :name="isDark ? 'lucide:sun' : 'lucide:moon'" size="18" />
    </button>

    <!-- ===== Contenu ===== -->
    <main class="px-6 pt-8 pb-14 sm:px-10 lg:flex lg:flex-col lg:justify-center lg:px-14 lg:py-16 xl:px-20">
      <div class="mx-auto w-full max-w-6xl">
        <header class="max-w-2xl">
          <h1
            class="font-traverse from-magenta-500 via-prune-500 to-prune-700 dark:from-magenta-500 dark:via-prune-300 dark:to-prune-100 w-fit bg-linear-90 bg-clip-text pb-1 text-[clamp(2rem,1.2rem+2.8vw,3.4rem)] leading-[1.1] tracking-[0.02em] text-transparent">
            Bienvenue sur H00&nbsp;!
          </h1>
          <p class="mt-5 max-w-xl text-[1.0625rem] leading-relaxed text-zinc-600 dark:text-zinc-400">
            Votre espace pour suivre {{ chantiersDe }}&nbsp;: tâches, plannings et alertes, au même endroit.
          </p>

          <div class="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-5">
            <button
              type="button"
              :disabled="isRedirecting"
              :aria-busy="isRedirecting"
              class="focus-visible:outline-magenta-500 from-magenta-500 via-prune-500 to-prune-700 enabled:hover:from-magenta-700 enabled:hover:via-prune-600 enabled:hover:to-prune-800 grid cursor-pointer place-items-center rounded-lg bg-linear-90 px-4 py-3.5 text-[0.9rem] font-semibold text-white shadow-[0_8px_20px_-10px_rgb(142_9_105/0.75)] transition focus-visible:outline-2 focus-visible:outline-offset-3 enabled:active:translate-y-px disabled:cursor-wait disabled:opacity-80 sm:px-5.5 sm:text-[0.95rem] dark:shadow-none"
              @click="redirectToAuth">
              <!-- Deux libellés superposés dans la même cellule : le bouton garde la largeur du plus long
                   pendant la redirection (invisible les retire aussi des lecteurs d'écran) -->
              <span class="inline-flex items-center gap-2.5 [grid-area:1/1]" :class="{ invisible: isRedirecting }">
                <Icon name="lucide:log-in" size="18" class="shrink-0" />
                Se connecter avec mon compte SNCF
              </span>
              <span class="inline-flex items-center gap-2.5 [grid-area:1/1]" :class="{ invisible: !isRedirecting }">
                <Icon
                  name="lucide:loader-circle"
                  size="18"
                  class="shrink-0"
                  :class="{ 'animate-spin': isRedirecting }" />
                Redirection…
              </span>
            </button>
            <span class="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              <Icon name="lucide:shield-check" size="14" />
              Authentification unique SNCF
            </span>
          </div>
        </header>

        <hr class="border-magenta-900/12 my-10 lg:my-12 dark:border-white/10" />

        <!-- ===== Modules ===== -->
        <section class="grid gap-6 md:grid-cols-3" aria-label="Modules de l'application">
          <article
            v-for="(mod, i) in modules"
            :key="mod.key"
            class="surface-card overflow-hidden rounded-xl sm:max-md:grid sm:max-md:grid-cols-[15rem_1fr] sm:max-md:items-center dark:bg-zinc-900"
            :style="{ '--i': i }">
            <div
              class="from-magenta-700 to-magenta-500 dark:from-magenta-800 dark:to-magenta-950 bg-linear-150 *:block *:aspect-[320/220] *:h-auto *:w-full">
              <!-- Chantiers : photo de voie + liste de tâches + cône -->
              <svg v-if="mod.key === 'chantiers'" viewBox="0 0 320 220" aria-hidden="true">
                <polygon :class="FACETTE_CLAIRE" points="0,0 150,0 40,150" />
                <polygon :class="FACETTE_SOMBRE" points="320,30 320,220 190,220" />
                <polygon :class="FACETTE_CLAIRE" points="210,0 320,0 320,70" />
                <g transform="translate(46 30)">
                  <g :class="FEUILLE" class="[--d:0ms] [--r:-8deg]">
                    <rect class="fill-white dark:fill-zinc-100" width="150" height="112" rx="8" />
                    <rect class="fill-magenta-50" x="10" y="10" width="130" height="92" rx="4" />
                    <circle class="fill-magenta-500" cx="108" cy="32" r="10" />
                    <path class="fill-magenta-200" d="M10 74 L52 46 L80 62 L108 48 L140 70 V102 H10 Z" />
                    <path class="fill-magenta-500/35" d="M38 102 L71 62 H79 L112 102 Z" />
                    <path
                      class="stroke-magenta-800/55 fill-none"
                      stroke-width="2"
                      stroke-linecap="round"
                      d="M45.7 97 H104.3 M53.3 87 H96.7 M59.3 79 H90.7 M64.5 72 H85.5 M68.3 67 H81.7" />
                    <path
                      class="stroke-magenta-800 fill-none"
                      stroke-width="2.2"
                      stroke-linecap="round"
                      d="M48 102 L73 62 M102 102 L77 62" />
                  </g>
                </g>
                <g transform="translate(170 100)">
                  <g :class="FEUILLE" class="[--d:90ms] [--r:6deg]">
                    <rect class="fill-white dark:fill-zinc-100" width="118" height="88" rx="8" />
                    <rect class="fill-magenta-500" x="14" y="16" width="14" height="14" rx="3" />
                    <path
                      class="fill-none stroke-white"
                      stroke-width="2.2"
                      stroke-linecap="round"
                      d="M17.5 23 l3 3 l5.5 -6" />
                    <rect class="fill-zinc-200" x="36" y="20" width="62" height="6" rx="3" />
                    <rect class="fill-magenta-500" x="14" y="38" width="14" height="14" rx="3" />
                    <path
                      class="fill-none stroke-white"
                      stroke-width="2.2"
                      stroke-linecap="round"
                      d="M17.5 45 l3 3 l5.5 -6" />
                    <rect class="fill-zinc-200" x="36" y="42" width="48" height="6" rx="3" />
                    <rect
                      class="stroke-magenta-200 fill-none"
                      stroke-width="2"
                      x="15"
                      y="61"
                      width="12"
                      height="12"
                      rx="3" />
                    <rect class="fill-zinc-200" x="36" y="64" width="56" height="6" rx="3" />
                  </g>
                </g>
                <g transform="translate(28 150)">
                  <path class="fill-magenta-500" d="M14 0 L28 44 H0 Z" />
                  <path class="fill-white" d="M9.2 15 H18.8 L21.7 24 H6.3 Z" />
                  <rect class="fill-magenta-800" x="-6" y="42" width="40" height="7" rx="2" />
                </g>
              </svg>

              <!-- Calendriers : feuille de calendrier + planning en barres -->
              <svg v-else-if="mod.key === 'calendriers'" viewBox="0 0 320 220" aria-hidden="true">
                <polygon :class="FACETTE_SOMBRE" points="0,70 0,220 110,220" />
                <polygon :class="FACETTE_CLAIRE" points="120,0 320,0 320,110" />
                <polygon :class="FACETTE_CLAIRE" points="0,0 70,0 0,60" />
                <g transform="translate(150 22)">
                  <g :class="FEUILLE" class="[--d:0ms] [--r:7deg]">
                    <rect class="fill-white dark:fill-zinc-100" width="140" height="124" rx="8" />
                    <path class="fill-magenta-700" d="M0 8 a8 8 0 0 1 8 -8 h124 a8 8 0 0 1 8 8 v18 h-140 Z" />
                    <circle class="fill-white dark:fill-zinc-100" cx="36" cy="13" r="4" />
                    <circle class="fill-white dark:fill-zinc-100" cx="104" cy="13" r="4" />
                    <g class="fill-magenta-50">
                      <rect x="12" y="38" width="18" height="16" rx="3" />
                      <rect class="fill-magenta-200" x="36" y="38" width="18" height="16" rx="3" />
                      <rect class="fill-magenta-200" x="60" y="38" width="18" height="16" rx="3" />
                      <rect x="84" y="38" width="18" height="16" rx="3" />
                      <rect x="108" y="38" width="18" height="16" rx="3" />
                      <rect x="12" y="60" width="18" height="16" rx="3" />
                      <rect x="36" y="60" width="18" height="16" rx="3" />
                      <rect class="fill-magenta-500" x="60" y="60" width="18" height="16" rx="3" />
                      <rect class="fill-magenta-500" x="84" y="60" width="18" height="16" rx="3" />
                      <rect x="108" y="60" width="18" height="16" rx="3" />
                      <rect class="fill-magenta-500" x="12" y="82" width="18" height="16" rx="3" />
                      <rect class="fill-magenta-200" x="36" y="82" width="18" height="16" rx="3" />
                      <rect x="60" y="82" width="18" height="16" rx="3" />
                      <rect x="84" y="82" width="18" height="16" rx="3" />
                      <rect class="fill-magenta-200" x="108" y="82" width="18" height="16" rx="3" />
                    </g>
                  </g>
                </g>
                <g transform="translate(34 92)">
                  <g :class="FEUILLE" class="[--d:90ms] [--r:-6deg]">
                    <rect class="fill-white dark:fill-zinc-100" width="160" height="92" rx="8" />
                    <path class="fill-none stroke-zinc-200" stroke-width="1.5" d="M40 14 V78 M80 14 V78 M120 14 V78" />
                    <rect class="fill-magenta-700" x="14" y="18" width="70" height="10" rx="5" />
                    <rect class="fill-magenta-500" x="46" y="36" width="84" height="10" rx="5" />
                    <rect class="fill-magenta-200" x="30" y="54" width="46" height="10" rx="5" />
                    <rect class="fill-magenta-700" x="92" y="54" width="52" height="10" rx="5" />
                    <path class="stroke-magenta-500" stroke-width="2" stroke-dasharray="4 4" d="M104 10 V82" />
                  </g>
                </g>
              </svg>

              <!-- Dashboard : histogramme + carte d'alerte -->
              <svg v-else viewBox="0 0 320 220" aria-hidden="true">
                <polygon :class="FACETTE_CLAIRE" points="0,0 190,0 0,120" />
                <polygon :class="FACETTE_SOMBRE" points="230,220 320,220 320,90" />
                <circle :class="FACETTE_CLAIRE" cx="92" cy="176" r="46" />
                <g transform="translate(36 34)">
                  <g :class="FEUILLE" class="[--d:0ms] [--r:-7deg]">
                    <rect class="fill-white dark:fill-zinc-100" width="148" height="120" rx="8" />
                    <rect class="fill-zinc-200" x="14" y="14" width="56" height="6" rx="3" />
                    <path class="fill-none stroke-zinc-200" stroke-width="1.5" d="M14 102 H134" />
                    <rect class="fill-magenta-700" x="20" y="58" width="16" height="44" rx="2" />
                    <rect class="fill-magenta-500" x="44" y="40" width="16" height="62" rx="2" />
                    <rect class="fill-magenta-700" x="68" y="68" width="16" height="34" rx="2" />
                    <rect class="fill-magenta-200" x="92" y="48" width="16" height="54" rx="2" />
                    <rect class="fill-magenta-500" x="116" y="30" width="16" height="72" rx="2" />
                  </g>
                </g>
                <g transform="translate(176 96)">
                  <g :class="FEUILLE" class="[--d:90ms] [--r:5deg]">
                    <rect class="fill-white dark:fill-zinc-100" width="116" height="92" rx="8" />
                    <circle class="fill-magenta-100" cx="30" cy="30" r="16" />
                    <path
                      class="fill-magenta-500 stroke-magenta-500"
                      stroke-width="3"
                      stroke-linejoin="round"
                      d="M30 20 L40 38 H20 Z" />
                    <path
                      class="stroke-white"
                      stroke-width="2.4"
                      stroke-linecap="round"
                      d="M30 26.5 V31.5 M30 34.5 V34.6" />
                    <rect class="fill-zinc-200" x="54" y="22" width="46" height="6" rx="3" />
                    <rect class="fill-zinc-200/60" x="54" y="33" width="32" height="5" rx="2.5" />
                    <rect class="fill-zinc-200" x="16" y="60" width="84" height="6" rx="3" />
                    <rect class="fill-zinc-200/60" x="16" y="72" width="60" height="5" rx="2.5" />
                  </g>
                </g>
              </svg>
            </div>

            <div class="px-6 pt-5 pb-6.5">
              <h2 class="dark:text-magenta-200 text-lg font-semibold text-slate-800 dark:text-zinc-50">
                {{ mod.title }}
              </h2>
              <p class="mt-2 text-sm leading-normal text-zinc-600 dark:text-zinc-400">{{ mod.text }}</p>
            </div>
          </article>
        </section>

        <p class="mt-12 text-center text-xs text-zinc-500 lg:hidden">v{{ APP_VERSION }} · © 2026 Applissimo</p>
      </div>
    </main>
  </div>
</template>
