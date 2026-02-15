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

  runtimeConfig: {
    cfAccountId: process.env.CF_ACCOUNT_ID || '',
    cfApiToken: process.env.CF_API_TOKEN || '',
    r2AccessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    r2Bucket: process.env.R2_BUCKET || 'streamvault-videos',
    r2Endpoint: process.env.R2_ENDPOINT || '',
    d1DatabaseId: process.env.D1_DATABASE_ID || '',
    jwtSecret: process.env.JWT_SECRET || 'streamvault-secret-change-in-production',
    cryptoPaymentApiKey: process.env.CRYPTO_PAYMENT_API_KEY || '',
    cryptoWebhookSecret: process.env.CRYPTO_WEBHOOK_SECRET || '',
    public: {
      appUrl: process.env.APP_URL || 'http://localhost:3000',
      workerUrl: process.env.WORKER_URL || 'http://localhost:8787',
      cryptoPaymentPublicKey: process.env.CRYPTO_PAYMENT_PUBLIC_KEY || '',
    },
  },

  routeRules: {
    '/dashboard/**': { ssr: false },
    '/api/**': { cors: true },
    '/embed/**': { ssr: true },
  },

  nitro: {
    preset: 'cloudflare-pages',
    cloudflare: {
      pages: {
        routes: {
          exclude: ['/api/*'],
        },
      },
    },
  },

  devtools: { enabled: false },
  compatibilityDate: '2025-12-01',
})
