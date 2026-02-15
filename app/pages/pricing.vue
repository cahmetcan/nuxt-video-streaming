<script setup lang="ts">
definePageMeta({ layout: 'default' })

const billing = ref<'monthly' | 'yearly'>('monthly')

const plans = [
  {
    id: 'free',
    name: 'Free',
    description: 'Get started with basic video hosting',
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      '5 GB storage',
      '20 GB bandwidth/mo',
      'Up to 10 videos',
      '720p max resolution',
      'HLS streaming',
      'Basic embed player',
      'Basic analytics',
    ],
    cta: 'Get started',
    highlighted: false,
  },
  {
    id: 'starter',
    name: 'Starter',
    description: 'For creators getting serious',
    monthlyPrice: 12,
    yearlyPrice: 120,
    features: [
      '100 GB storage',
      '500 GB bandwidth/mo',
      'Up to 200 videos',
      '1080p max resolution',
      'Custom video player',
      'Advanced analytics',
      'API access',
      'Password protection',
    ],
    cta: 'Start free trial',
    highlighted: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For professionals and businesses',
    monthlyPrice: 49,
    yearlyPrice: 490,
    features: [
      '1 TB storage',
      '5 TB bandwidth/mo',
      'Unlimited videos',
      '4K max resolution',
      'Custom branding',
      'Full analytics suite',
      'Priority support',
      'Custom domain',
      'White-label player',
    ],
    cta: 'Start free trial',
    highlighted: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large-scale operations',
    monthlyPrice: 199,
    yearlyPrice: 1990,
    features: [
      '10 TB storage',
      '50 TB bandwidth/mo',
      'Unlimited everything',
      '4K max resolution',
      'Dedicated support',
      'Custom SLA',
      'SSO & team management',
      'Advanced security',
      'Custom integrations',
    ],
    cta: 'Contact sales',
    highlighted: false,
  },
]

const paygoRates = [
  { item: 'Storage', rate: '$0.015/GB/month', detail: 'Only pay for what you store' },
  { item: 'Bandwidth', rate: '$0.05/GB', detail: 'Egress to viewers' },
  { item: 'Transcoding', rate: '$0.02/minute', detail: 'Video processing' },
  { item: 'API Calls', rate: '$0.01/1,000', detail: 'Programmatic access' },
]

const cryptoCurrencies = [
  { name: 'Bitcoin', symbol: 'BTC' },
  { name: 'Ethereum', symbol: 'ETH' },
  { name: 'USDT', symbol: 'USDT' },
  { name: 'USDC', symbol: 'USDC' },
  { name: 'Solana', symbol: 'SOL' },
  { name: 'Polygon', symbol: 'MATIC' },
]
</script>

<template>
  <div class="py-16">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="text-center mb-12">
        <h1 class="text-4xl font-bold sv-gradient-text mb-4">Simple, transparent pricing</h1>
        <p class="text-[var(--sv-text-secondary)] max-w-xl mx-auto mb-8">
          Start free, scale as you grow. Pay monthly or save with annual billing. All plans accept crypto.
        </p>

        <!-- Billing Toggle -->
        <div class="inline-flex items-center gap-3 p-1 rounded-lg bg-[var(--sv-bg-secondary)] border border-[var(--sv-border)]">
          <button
            class="px-4 py-2 rounded-md text-sm font-medium transition-all"
            :class="billing === 'monthly' ? 'bg-indigo-500 text-white' : 'text-[var(--sv-text-secondary)] hover:text-white'"
            @click="billing = 'monthly'"
          >
            Monthly
          </button>
          <button
            class="px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-1.5"
            :class="billing === 'yearly' ? 'bg-indigo-500 text-white' : 'text-[var(--sv-text-secondary)] hover:text-white'"
            @click="billing = 'yearly'"
          >
            Yearly
            <span class="text-xs px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">Save 17%</span>
          </button>
        </div>
      </div>

      <!-- Plan Cards -->
      <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-5 mb-20">
        <div
          v-for="plan in plans"
          :key="plan.id"
          class="sv-card p-6 flex flex-col"
          :class="plan.highlighted ? 'border-indigo-500/50 ring-1 ring-indigo-500/20' : ''"
        >
          <div v-if="plan.highlighted" class="text-xs font-medium text-indigo-400 mb-2">Most popular</div>
          <h3 class="text-lg font-semibold text-white">{{ plan.name }}</h3>
          <p class="text-xs text-[var(--sv-text-tertiary)] mt-1 mb-4">{{ plan.description }}</p>

          <div class="mb-6">
            <span class="text-3xl font-bold text-white sv-mono">
              ${{ billing === 'monthly' ? plan.monthlyPrice : Math.round(plan.yearlyPrice / 12) }}
            </span>
            <span class="text-sm text-[var(--sv-text-tertiary)]">/mo</span>
            <div v-if="billing === 'yearly' && plan.yearlyPrice > 0" class="text-xs text-[var(--sv-text-tertiary)] mt-1">
              ${{ plan.yearlyPrice }} billed annually
            </div>
          </div>

          <ul class="space-y-2.5 mb-8 flex-1">
            <li v-for="feature in plan.features" :key="feature" class="flex items-start gap-2 text-sm">
              <svg class="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span class="text-[var(--sv-text-secondary)]">{{ feature }}</span>
            </li>
          </ul>

          <NuxtLink
            :to="plan.id === 'free' ? '/auth/register' : `/auth/register?plan=${plan.id}`"
            :class="plan.highlighted ? 'sv-btn-primary' : 'sv-btn-secondary'"
            class="w-full text-center"
          >
            {{ plan.cta }}
          </NuxtLink>
        </div>
      </div>

      <!-- Pay As You Go -->
      <div class="mb-20">
        <div class="text-center mb-10">
          <h2 class="text-2xl font-bold sv-gradient-text mb-3">Pay As You Go</h2>
          <p class="text-[var(--sv-text-secondary)] max-w-lg mx-auto">
            Only pay for what you use. Top up your balance with crypto and get charged per usage.
          </p>
        </div>

        <div class="max-w-2xl mx-auto">
          <div class="sv-card overflow-hidden">
            <table class="sv-table">
              <thead>
                <tr>
                  <th>Resource</th>
                  <th>Rate</th>
                  <th>Detail</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="rate in paygoRates" :key="rate.item">
                  <td class="text-white font-medium">{{ rate.item }}</td>
                  <td class="sv-mono text-indigo-400">{{ rate.rate }}</td>
                  <td>{{ rate.detail }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Crypto Payments -->
      <div class="text-center">
        <h2 class="text-2xl font-bold sv-gradient-text mb-3">Pay with crypto</h2>
        <p class="text-[var(--sv-text-secondary)] max-w-lg mx-auto mb-8">
          We accept major cryptocurrencies. No credit card needed.
        </p>

        <div class="flex flex-wrap items-center justify-center gap-4">
          <div
            v-for="coin in cryptoCurrencies"
            :key="coin.symbol"
            class="sv-card px-5 py-3 flex items-center gap-2"
          >
            <span class="text-sm font-medium text-white">{{ coin.name }}</span>
            <span class="text-xs text-[var(--sv-text-tertiary)] sv-mono">{{ coin.symbol }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
