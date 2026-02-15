export default defineNuxtConfig({
  future: { compatibilityVersion: 4 },

  modules: [
    '@nuxt/ui',
    '@vueuse/nuxt',
    '@nuxt/fonts',
    '@nuxtjs/color-mode',
  ],

  colorMode: {
    classSuffix: '',
    preference: 'dark',
    fallback: 'dark',
  },

  ui: {
    fonts: true,
  },

  fonts: {
    families: [
      { name: 'Inter', provider: 'google', weights: [300, 400, 500, 600, 700, 800, 900] },
      { name: 'JetBrains Mono', provider: 'google', weights: [400, 500, 600, 700] },
    ],
  },

  app: {
    head: {
      title: 'StreamVault - Video Streaming Platform',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Professional video streaming platform built on Cloudflare. Upload, stream, and monetize your video content.' },
        { name: 'theme-color', content: '#0f172a' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
      ],
    },
  },

  css: ['~/assets/css/main.css'],

  // All values come from wrangler.jsonc vars (NUXT_ prefix auto-maps here)
  runtimeConfig: {
    jwtSecret: '',
    cryptoWebhookSecret: '',
    cryptoAddressBtc: '',
    cryptoAddressEth: '',
    cryptoAddressSol: '',
    public: {
      workerUrl: 'http://localhost:8787',
    },
  },

  routeRules: {
    '/dashboard/**': { ssr: false },
    '/api/**': { cors: true },
    '/embed/**': { ssr: true },
  },

  nitro: {
    preset: 'cloudflare-pages',
  },

  devtools: { enabled: false },
  compatibilityDate: '2025-12-01',
})
