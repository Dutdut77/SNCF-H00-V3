<script setup>
definePageMeta({
  requiresAuth: false,
  layout: false
})
useHead({
  title: 'H00 - Login',
  description: 'Page de connexion'
})

const { isDark } = useDarkMode()

const redirectToAuth = () => {
  const currentUrl = new URL(window.location.href)
  const redirectUrl = currentUrl.searchParams.get('redirect') || '/'
  window.location.href = `/api/auth/login?redirect=${encodeURIComponent(redirectUrl)}`
}
</script>

<template>
  <div
    class="login-root relative flex h-dvh w-full items-center justify-center overflow-hidden"
    :class="{ 'theme-dark': isDark }">
    <!-- ===== Décor d'arrière-plan ===== -->
    <div class="login-bg" aria-hidden="true"></div>
    <div class="grid-bg" aria-hidden="true"></div>

    <!-- Voie ferrée en perspective -->
    <div class="track" aria-hidden="true">
      <div class="track__ties"></div>
      <div class="track__rail track__rail--l"></div>
      <div class="track__rail track__rail--r"></div>
    </div>

    <!-- Halos colorés -->
    <div class="orb orb--teal" aria-hidden="true"></div>
    <div class="orb orb--blue" aria-hidden="true"></div>
    <div class="grain" aria-hidden="true"></div>

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
          class="eyebrow flex items-center gap-2 text-[11px] font-semibold tracking-[0.25em] text-teal-700 uppercase dark:text-teal-300">
          <span class="dot"></span>
          UO Travaux · Paris Est
        </span>

        <!-- Titre -->
        <h1 class="login-title font-[Bangers] text-5xl tracking-wider md:text-6xl">H00 Travaux</h1>

        <!-- Devise -->
        <p class="-mt-3 font-[Pacifico] text-base text-teal-700/80 dark:text-teal-300/80">
          Vos projets, notre savoir-fer
        </p>

        <!-- Description -->
        <p class="max-w-sm text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          Connectez-vous pour accéder à votre espace, suivre l'avancement de vos chantiers assignés et collaborer avec
          vos collègues en temps réel.
        </p>

        <!-- CTA -->
        <button type="button" @click="redirectToAuth" class="login-cta group mt-2">
          <span class="login-cta__shine"></span>
          <Icon name="lucide:badge-check" size="20" class="relative shrink-0" />
          <span class="relative">Se connecter</span>
          <Icon
            name="lucide:arrow-right"
            size="18"
            class="relative shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
        </button>

        <!-- Mention SNCF -->
        <div class="mt-2 flex items-center gap-2 text-[11px] tracking-wide text-slate-400 dark:text-slate-500">
          <Icon name="lucide:shield-check" size="14" />
          Connexion sécurisée via l'OIDC SNCF
        </div>
      </div>

      <p class="reveal mt-6 text-xs tracking-widest text-slate-400 uppercase dark:text-slate-600" style="--d: 240ms">
        © 2026 — UO Travaux
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
  --grid: rgba(15, 23, 42, 0.045);
  --tie: rgba(15, 23, 42, 0.07);
  --rail: rgba(15, 23, 42, 0.14);
  --glow-teal: rgba(63, 141, 125, 0.22);
  --glow-blue: rgba(59, 130, 246, 0.16);
  --logo-halo: rgba(63, 141, 125, 0.45);
}

.login-root.theme-dark {
  --bg-1: #05080f;
  --bg-2: #0d1525;
  --top-glow: rgba(63, 141, 125, 0.2);
  --vignette: rgba(0, 0, 0, 0.55);
  --grid: rgba(148, 163, 184, 0.06);
  --tie: rgba(148, 163, 184, 0.13);
  --rail: rgba(148, 163, 184, 0.28);
  --glow-teal: rgba(63, 141, 125, 0.34);
  --glow-blue: rgba(59, 130, 246, 0.24);
  --logo-halo: rgba(63, 141, 125, 0.6);
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

/* Grille blueprint */
.grid-bg {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(var(--grid) 1px, transparent 1px), linear-gradient(90deg, var(--grid) 1px, transparent 1px);
  background-size: 46px 46px;
  -webkit-mask-image: radial-gradient(ellipse 70% 70% at 50% 45%, #000 0%, transparent 78%);
  mask-image: radial-gradient(ellipse 70% 70% at 50% 45%, #000 0%, transparent 78%);
}

/* Voie ferrée en perspective */
.track {
  position: absolute;
  bottom: -6%;
  left: 50%;
  width: min(720px, 92vw);
  height: 88vh;
  transform: translateX(-50%) perspective(600px) rotateX(63deg);
  transform-origin: bottom center;
  -webkit-mask-image: radial-gradient(ellipse 55% 85% at 50% 100%, #000 6%, transparent 72%);
  mask-image: radial-gradient(ellipse 55% 85% at 50% 100%, #000 6%, transparent 72%);
}
.track__ties {
  position: absolute;
  inset: 0;
  background-image: repeating-linear-gradient(0deg, var(--tie) 0 5px, transparent 5px 48px);
  animation: tie-move 5s linear infinite;
}
.track__rail {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 3px;
  background: linear-gradient(to top, var(--rail), transparent 92%);
}
.track__rail--l {
  left: 33%;
}
.track__rail--r {
  right: 33%;
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
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}
.theme-dark .login-card::before {
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.14), transparent 45%);
}

/* Titre dégradé */
.login-title {
  background: linear-gradient(160deg, #1e293b 0%, #3f8d7d 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  filter: drop-shadow(0 4px 12px rgba(63, 141, 125, 0.25));
}
.theme-dark .login-title {
  background: linear-gradient(160deg, #f1f5f9 0%, #5bb3a1 100%);
  -webkit-background-clip: text;
  background-clip: text;
}

/* Eyebrow */
.eyebrow .dot {
  width: 6px;
  height: 6px;
  border-radius: 9999px;
  background: #3f8d7d;
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
  background: linear-gradient(135deg, #1e293b 0%, #2f6f62 100%);
  box-shadow: 0 10px 30px -8px rgba(47, 111, 98, 0.6);
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
  cursor: pointer;
}
.login-cta:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 16px 40px -8px rgba(47, 111, 98, 0.7);
}
.login-cta:active {
  transform: translateY(0) scale(0.99);
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
.login-cta:hover .login-cta__shine {
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
@keyframes tie-move {
  to {
    background-position: 0 48px;
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
  .track__ties,
  .logo-wrap,
  .logo-glow,
  .orb,
  .eyebrow .dot {
    animation: none;
  }
}
</style>
