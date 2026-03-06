import tailwindcss from '@tailwindcss/vite'
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: false },
  css: ['./app/assets/css/main.css'],
  app: {
    head: {
      meta: [
        { name: 'theme-color', content: '#3b82f6' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
        { name: 'apple-mobile-web-app-title', content: 'H00 Travaux' },
        { name: 'mobile-web-app-capable', content: 'yes' }
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.png' },
        { rel: 'manifest', href: '/manifest.json' },
        { rel: 'apple-touch-icon', href: '/icons/icon-192x192.png' },
        { rel: 'apple-touch-icon', sizes: '152x152', href: '/icons/icon-152x152.png' },
        { rel: 'apple-touch-icon', sizes: '144x144', href: '/icons/icon-144x144.png' },
        // Splash screens iOS
        { rel: 'apple-touch-startup-image', href: '/splash/iphone-15-pro-max.jpg', media: 'screen and (device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
        { rel: 'apple-touch-startup-image', href: '/splash/iphone-15-pro.jpg',     media: 'screen and (device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
        { rel: 'apple-touch-startup-image', href: '/splash/iphone-15.jpg',         media: 'screen and (device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
        { rel: 'apple-touch-startup-image', href: '/splash/iphone-15-plus.jpg',    media: 'screen and (device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
        { rel: 'apple-touch-startup-image', href: '/splash/iphone-13-mini.jpg',    media: 'screen and (device-width: 360px) and (device-height: 780px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
        { rel: 'apple-touch-startup-image', href: '/splash/iphone-se.jpg',         media: 'screen and (device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
        { rel: 'apple-touch-startup-image', href: '/splash/iphone-8-plus.jpg',     media: 'screen and (device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
        { rel: 'apple-touch-startup-image', href: '/splash/ipad-pro-129.jpg',      media: 'screen and (device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
        { rel: 'apple-touch-startup-image', href: '/splash/ipad-pro-11.jpg',       media: 'screen and (device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
        { rel: 'apple-touch-startup-image', href: '/splash/ipad-air.jpg',          media: 'screen and (device-width: 820px) and (device-height: 1180px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
        { rel: 'apple-touch-startup-image', href: '/splash/ipad-mini.jpg',         media: 'screen and (device-width: 744px) and (device-height: 1133px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' }
      ]
    }
  },

  vite: {
    plugins: [tailwindcss()]
  },

  nitro: {
    preset: 'vercel',
    externals: {
      inline: ['@supabase/supabase-js']
    }
  },
  runtimeConfig: {
    oidc: {
      clientId: process.env.NUXT_OIDC_CLIENT_ID,
      clientSecret: process.env.NUXT_OIDC_CLIENT_SECRET,
      authUrl: process.env.NUXT_PUBLIC_OIDC_AUTH_URL,
      tokenUrl: process.env.NUXT_PUBLIC_OIDC_TOKEN_URL, // ex: "https://idp.sncf.fr/auth/realms/sncf/protocol/openid-connect/token"
      userinfoUrl: process.env.NUXT_PUBLIC_OIDC_USERINFO_URL,
      endSessionUrl: process.env.NUXT_PUBLIC_OIDC_ENDSESSION_URL
    },
    smtp: {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    public: {
      baseUrl: process.env.NUXT_PUBLIC_BASE_URL
    }
  },
  supabase: {
    redirect: false,
    types: false,
    clientOptions: {
      auth: {
        autoRefreshToken: false,
        persistSession: true
      }
    }
  },
  modules: ['@nuxt/icon', '@nuxtjs/supabase']
})
