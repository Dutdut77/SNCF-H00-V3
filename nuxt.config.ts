import tailwindcss from '@tailwindcss/vite'
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: false },
  css: ['./app/assets/css/main.css'],

  app: {
    head: {
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.png' }
        // { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }, // Fallback
      ]
    }
  },

  vite: {
    plugins: [tailwindcss()]
  },

  nitro: {
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
    public: {
      baseUrl: process.env.NUXT_PUBLIC_BASE_URL
    }
  },
  supabase: {
    redirect: false,
    types: false
  },
  modules: ['@nuxt/icon', '@nuxtjs/supabase']
})
