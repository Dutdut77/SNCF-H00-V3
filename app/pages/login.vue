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
</script>

<template>
  <div
    class="login-root relative flex min-h-dvh w-full items-center justify-center py-10"
    :class="{ 'theme-dark': isDark }">
    <!-- ===== Décor d'arrière-plan (clippé : ne doit jamais générer de scroll) ===== -->
    <div class="decor" aria-hidden="true">
      <div class="login-bg"></div>

      <!-- Schéma de voie type TCO : la carte se pose dessus comme un poste -->
      <div class="tco">
        <svg viewBox="0 0 1440 300" preserveAspectRatio="xMidYMid meet" class="tco__svg">
          <g class="tco__idle">
            <path d="M0 70 H1440" />
            <path d="M0 150 H1440" />
            <path d="M0 230 H470" />
            <!-- Aiguillages -->
            <path d="M360 150 C392 150 428 70 460 70" />
            <path d="M120 230 C152 230 188 150 220 150" />
            <path d="M980 70 C1012 70 1048 150 1080 150" />
          </g>

          <!-- Heurtoir en bout de voie de service -->
          <path class="tco__buffer" d="M470 216 V244" />

          <!-- Itinéraire : V2, aiguillage vers V1, passage derrière la carte, retour sur V2 -->
          <path class="tco__live" d="M0 150 H360 C392 150 428 70 460 70 H980 C1012 70 1048 150 1080 150 H1440" />

          <g class="tco__label">
            <text x="70" y="60">V1</text>
            <text x="70" y="140">V2</text>
            <text x="70" y="220">VS</text>
          </g>

          <g class="tco__pk">
            <path d="M410 252 v10" />
            <text x="410" y="278">PK 12+400</text>
          </g>
        </svg>
      </div>

      <!-- Halos colorés -->
      <div class="orb orb--teal"></div>
      <div class="orb orb--blue"></div>
      <div class="grain"></div>
    </div>

    <!-- ===== Bascule thème ===== -->
    <button
      type="button"
      @click="isDark = !isDark"
      class="theme-toggle group absolute top-6 right-6 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/40 bg-white/50 text-slate-700 backdrop-blur-md transition-all duration-300 hover:scale-110 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
      :aria-label="isDark ? 'Activer le thème clair' : 'Activer le thème sombre'">
      <Icon
        :name="isDark ? 'lucide:sun' : 'lucide:moon'"
        size="20"
        class="transition-transform duration-500 group-hover:rotate-45" />
    </button>

    <!-- ===== Carte de connexion ===== -->
    <main class="relative z-10 flex w-[90%] max-w-md flex-col items-center px-2">
      <!-- Logo + halo -->
      <div class="reveal logo-wrap" style="--d: 0ms">
        <div class="logo-glow"></div>
        <img
          src="/images/logo_uo.png"
          alt="Logo UO Travaux Paris Est"
          class="logo-img relative w-40 drop-shadow-2xl lg:w-44" />
      </div>

      <div
        class="login-card reveal -mt-10 flex w-full flex-col items-center gap-5 rounded-3xl border border-white/60 bg-white/70 px-7 pt-16 pb-8 text-center shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/60"
        style="--d: 120ms">
        <!-- Eyebrow -->
        <span
          class="eyebrow flex items-center gap-2 text-[11px] font-semibold tracking-[0.25em] text-secondary-700 uppercase dark:text-secondary-300">
          <span class="dot"></span>
          UO Travaux · Paris Est
        </span>

        <!-- Titre -->
        <h1 class="login-title font-[Bangers] text-5xl tracking-wider md:text-6xl">H00 Travaux</h1>

        <!-- Devise -->
        <p class="-mt-3 font-[Pacifico] text-base text-secondary-700/80 dark:text-secondary-300/80">
          Vos projets, notre savoir-fer
        </p>

        <!-- Description -->
        <p class="max-w-sm text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          Connectez-vous pour accéder à votre espace, suivre l'avancement de vos chantiers assignés et collaborer avec
          vos collègues en temps réel.
        </p>

        <!-- CTA -->
        <button
          type="button"
          @click="redirectToAuth"
          :disabled="isRedirecting"
          :aria-busy="isRedirecting"
          class="login-cta group mt-2">
          <span class="login-cta__shine"></span>
          <Icon
            :name="isRedirecting ? 'lucide:loader-circle' : 'lucide:badge-check'"
            size="20"
            class="relative shrink-0"
            :class="{ 'animate-spin': isRedirecting }" />
          <span class="relative">{{ isRedirecting ? 'Redirection…' : 'Se connecter' }}</span>
          <Icon
            v-if="!isRedirecting"
            name="lucide:arrow-right"
            size="18"
            class="relative shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
        </button>

        <!-- Mention SNCF -->
        <div class="mt-2 flex items-center gap-2 text-[11px] tracking-wide text-slate-500 dark:text-slate-400">
          <Icon name="lucide:shield-check" size="14" />
          Connexion sécurisée via l'OIDC SNCF
        </div>
      </div>

      <p
        class="reveal mono mt-6 flex items-center gap-3 text-[11px] tracking-[0.22em] text-slate-500 uppercase dark:text-slate-400"
        style="--d: 240ms">
        <span>v{{ APP_VERSION }}</span>
        <span class="hairline" aria-hidden="true"></span>
        <span>© 2026 — UO Travaux</span>
      </p>
    </main>
  </div>
</template>

<style scoped>
.login-root {
  --bg-1: #f3f1ea;
  --bg-2: #e6edee;
  --top-glow: rgba(63, 141, 125, 0.1);
  --vignette: rgba(15, 23, 42, 0.05);
  --hair: rgba(15, 23, 42, 0.14);
  --hair-strong: rgba(15, 23, 42, 0.26);
  --live: #2f6f62;
  --live-glow: rgba(47, 111, 98, 0.35);
  --label: rgba(15, 23, 42, 0.38);
  --glow-teal: rgba(63, 141, 125, 0.22);
  --glow-blue: rgba(59, 130, 246, 0.16);
  --logo-halo: rgba(63, 141, 125, 0.45);
}

.login-root.theme-dark {
  --bg-1: #05080f;
  --bg-2: #0d1525;
  --top-glow: rgba(63, 141, 125, 0.2);
  --vignette: rgba(0, 0, 0, 0.55);
  --hair: rgba(148, 163, 184, 0.22);
  --hair-strong: rgba(203, 213, 225, 0.34);
  --live: #55ab96;
  --live-glow: rgba(85, 171, 150, 0.75);
  --label: rgba(148, 163, 184, 0.5);
  --glow-teal: rgba(63, 141, 125, 0.34);
  --glow-blue: rgba(59, 130, 246, 0.24);
  --logo-halo: rgba(63, 141, 125, 0.6);
}

/* Conteneur de décor : clippe tout débordement (orbes, voie) */
.decor {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

/* Fond dégradé */
.login-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 110% 60% at 50% -8%, var(--top-glow), transparent 60%),
    radial-gradient(ellipse 85% 85% at 50% 48%, transparent 52%, var(--vignette) 100%),
    linear-gradient(165deg, var(--bg-1) 0%, var(--bg-2) 55%, var(--bg-1) 100%);
}

/* Face technique : repères du schéma, version */
.mono {
  font-family: ui-monospace, 'SF Mono', SFMono-Regular, Menlo, Consolas, monospace;
}

/* Filet de séparation, repris du trait des voies */
.hairline {
  width: 18px;
  height: 1px;
  background: currentColor;
  opacity: 0.5;
}

/* ===== Schéma de voie type TCO ===== */
.tco {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  transform: translate(-50%, -50%);
  -webkit-mask-image: linear-gradient(90deg, transparent 0%, #000 9%, #000 91%, transparent 100%);
  mask-image: linear-gradient(90deg, transparent 0%, #000 9%, #000 91%, transparent 100%);
}
.tco__svg {
  display: block;
  width: 100%;
  height: auto;
  overflow: visible;
}

.tco__idle path {
  fill: none;
  stroke: var(--hair);
  stroke-width: 2;
}
.tco__buffer {
  fill: none;
  stroke: var(--hair-strong);
  stroke-width: 3;
  stroke-linecap: round;
}

/* L'itinéraire s'illumine, comme une section occupée sur un TCO */
.tco__live {
  fill: none;
  stroke: var(--live);
  stroke-width: 3;
  stroke-linecap: round;
  filter: drop-shadow(0 0 9px var(--live-glow));
  stroke-dasharray: 220 1800;
  animation: circulation 13s cubic-bezier(0.45, 0, 0.55, 1) infinite;
}

.tco__label text {
  fill: var(--label);
  font-family: ui-monospace, 'SF Mono', SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 13px;
  letter-spacing: 0.08em;
}
.tco__pk path {
  stroke: var(--hair);
  stroke-width: 1.5;
}
.tco__pk text {
  fill: var(--label);
  opacity: 0.8;
  font-family: ui-monospace, 'SF Mono', SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 11px;
  letter-spacing: 0.12em;
  text-anchor: middle;
}

/* Halos */
.orb {
  position: absolute;
  border-radius: 9999px;
  filter: blur(80px);
  pointer-events: none;
}
.orb--teal {
  width: 420px;
  height: 420px;
  top: -10%;
  left: -8%;
  background: var(--glow-teal);
  animation: float-a 14s ease-in-out infinite;
}
.orb--blue {
  width: 380px;
  height: 380px;
  bottom: -12%;
  right: -8%;
  background: var(--glow-blue);
  animation: float-b 16s ease-in-out infinite;
}

/* Grain */
.grain {
  position: absolute;
  inset: 0;
  opacity: 0.5;
  pointer-events: none;
  mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E");
}

/* Logo */
.logo-wrap {
  position: relative;
  z-index: 2;
  display: flex;
  justify-content: center;
  animation: float-logo 6s ease-in-out infinite;
}
.logo-glow {
  position: absolute;
  inset: 0;
  margin: auto;
  width: 70%;
  height: 70%;
  border-radius: 9999px;
  background: radial-gradient(circle, var(--logo-halo), transparent 70%);
  filter: blur(28px);
  animation: pulse 4s ease-in-out infinite;
}

/* Carte */
.login-card {
  position: relative;
}
.login-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 1.5rem;
  padding: 1px;
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.8), transparent 45%);
  -webkit-mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}
.theme-dark .login-card::before {
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.14), transparent 45%);
}

/* Titre dégradé */
.login-title {
  background: linear-gradient(160deg, #1e293b 0%, var(--color-secondary-500) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  filter: drop-shadow(0 4px 12px rgba(63, 141, 125, 0.25));
}
.theme-dark .login-title {
  background: linear-gradient(160deg, #f1f5f9 0%, var(--color-secondary-400) 100%);
  -webkit-background-clip: text;
  background-clip: text;
}

/* Eyebrow */
.eyebrow .dot {
  width: 6px;
  height: 6px;
  border-radius: 9999px;
  background: var(--color-secondary-500);
  box-shadow: 0 0 0 4px rgba(63, 141, 125, 0.18);
  animation: pulse 2.5s ease-in-out infinite;
}

/* Bouton CTA */
.login-cta {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  overflow: hidden;
  padding: 0.85rem 1.9rem;
  border-radius: 0.9rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, #1e293b 0%, var(--color-secondary-600) 100%);
  box-shadow: 0 10px 30px -8px rgba(47, 111, 98, 0.6);
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
  cursor: pointer;
}
.login-cta:hover:not(:disabled) {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 16px 40px -8px rgba(47, 111, 98, 0.7);
}
.login-cta:active:not(:disabled) {
  transform: translateY(0) scale(0.99);
}
.login-cta:disabled {
  cursor: wait;
  opacity: 0.75;
}
.login-cta:focus-visible,
.theme-toggle:focus-visible {
  outline: 2px solid var(--color-secondary-500);
  outline-offset: 3px;
}
.login-cta__shine {
  position: absolute;
  top: 0;
  left: -120%;
  width: 60%;
  height: 100%;
  background: linear-gradient(110deg, transparent, rgba(255, 255, 255, 0.35), transparent);
  transform: skewX(-20deg);
  transition: left 0.6s ease;
}
.login-cta:hover:not(:disabled) .login-cta__shine {
  left: 130%;
}

/* ===== Animations ===== */
.reveal {
  opacity: 0;
  animation: reveal-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  animation-delay: var(--d, 0ms);
}

@keyframes reveal-up {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes circulation {
  0% {
    stroke-dashoffset: 220;
  }
  72% {
    stroke-dashoffset: -1760;
  }
  100% {
    stroke-dashoffset: -1760;
  }
}
@keyframes float-logo {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}
@keyframes pulse {
  0%,
  100% {
    opacity: 0.55;
  }
  50% {
    opacity: 1;
  }
}
@keyframes float-a {
  0%,
  100% {
    transform: translate(0, 0);
  }
  50% {
    transform: translate(30px, 24px);
  }
}
@keyframes float-b {
  0%,
  100% {
    transform: translate(0, 0);
  }
  50% {
    transform: translate(-28px, -22px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .reveal {
    opacity: 1;
    animation: none;
  }
  .logo-wrap,
  .logo-glow,
  .orb,
  .eyebrow .dot,
  .login-cta .animate-spin {
    animation: none;
  }
  /* L'itinéraire reste tracé, sans circulation */
  .tco__live {
    animation: none;
    stroke-dasharray: none;
    opacity: 0.9;
  }
}
</style>
