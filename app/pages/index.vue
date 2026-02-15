<script setup lang="ts">
definePageMeta({ layout: 'default' })

const features = [
  {
    title: 'Edge-Powered Streaming',
    description: 'Videos served from Cloudflare\'s global network with sub-50ms latency. Built on R2 storage and Hono workers.',
    icon: 'globe',
  },
  {
    title: 'Adaptive Bitrate',
    description: 'HLS streaming with automatic quality adaptation. Your viewers get the best quality their connection can handle.',
    icon: 'stream',
  },
  {
    title: 'Resumable Uploads',
    description: 'Chunked upload system handles files of any size. Connection dropped? Pick up right where you left off.',
    icon: 'upload',
  },
  {
    title: 'Crypto Payments',
    description: 'Pay with Bitcoin, Ethereum, USDT, USDC, Solana, or Polygon. No credit card required.',
    icon: 'crypto',
  },
  {
    title: 'Embeddable Player',
    description: 'Custom video player with full controls, quality selection, and keyboard shortcuts. Embed anywhere.',
    icon: 'player',
  },
  {
    title: 'Real-Time Analytics',
    description: 'Track views, watch time, geography, and device breakdowns. Understand your audience.',
    icon: 'analytics',
  },
]

const stats = [
  { value: '150+', label: 'Edge locations' },
  { value: '<50ms', label: 'Global latency' },
  { value: '99.99%', label: 'Uptime SLA' },
  { value: '0%', label: 'Egress markup' },
]
</script>

<template>
  <div>
    <!-- Hero Section -->
    <section class="relative overflow-hidden">
      <div class="sv-gradient-bg absolute inset-0" />
      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
        <div class="text-center max-w-4xl mx-auto">
          <!-- Badge -->
          <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--sv-border)] bg-[var(--sv-bg-secondary)] mb-8">
            <span class="w-1.5 h-1.5 rounded-full bg-green-500 sv-pulse" />
            <span class="text-xs text-[var(--sv-text-secondary)]">Built on Cloudflare's edge network</span>
          </div>

          <h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
            <span class="sv-gradient-text">Video streaming</span>
            <br>
            <span class="sv-gradient-accent">without the complexity</span>
          </h1>

          <p class="text-lg text-[var(--sv-text-secondary)] max-w-2xl mx-auto mb-10 leading-relaxed">
            Upload, stream, and embed videos with a platform built entirely on Cloudflare.
            No transcoding delays. No egress fees. Just fast, reliable video delivery.
          </p>

          <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
            <NuxtLink to="/auth/register" class="sv-btn-primary text-base px-8 py-3 w-full sm:w-auto">
              Start streaming free
            </NuxtLink>
            <NuxtLink to="/pricing" class="sv-btn-secondary text-base px-8 py-3 w-full sm:w-auto">
              View pricing
            </NuxtLink>
          </div>
        </div>

        <!-- Video Player Preview -->
        <div class="mt-16 max-w-4xl mx-auto">
          <div class="sv-card p-1.5">
            <div class="sv-player-container bg-[var(--sv-bg-primary)] rounded-lg">
              <div class="absolute inset-0 flex items-center justify-center">
                <div class="text-center">
                  <div class="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                    <svg class="w-8 h-8 text-indigo-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                  <p class="text-sm text-[var(--sv-text-tertiary)]">Your video, streamed globally</p>
                </div>
              </div>
              <!-- Simulated player UI -->
              <div class="absolute bottom-0 left-0 right-0 px-4 pb-3 pt-8 bg-gradient-to-t from-black/60 to-transparent">
                <div class="w-full h-1 bg-white/20 rounded-full mb-3">
                  <div class="w-1/3 h-full bg-indigo-500 rounded-full" />
                </div>
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-4 h-4 text-white/60">
                      <svg fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    </div>
                    <span class="text-xs text-white/40 sv-mono">1:24 / 4:12</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-xs text-white/40">1080p</span>
                    <div class="w-4 h-4 text-white/60">
                      <svg fill="currentColor" viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" /></svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Stats -->
    <section class="border-y border-[var(--sv-border)] bg-[var(--sv-bg-secondary)]">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div v-for="(stat, i) in stats" :key="i" class="text-center sv-animate-in" :style="{ animationDelay: `${i * 100}ms` }">
            <p class="text-2xl sm:text-3xl font-bold sv-gradient-accent sv-mono">{{ stat.value }}</p>
            <p class="text-sm text-[var(--sv-text-tertiary)] mt-1">{{ stat.label }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section id="features" class="py-24">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <h2 class="text-3xl sm:text-4xl font-bold sv-gradient-text mb-4">Everything you need</h2>
          <p class="text-[var(--sv-text-secondary)] max-w-2xl mx-auto">
            A complete video platform built on Cloudflare's stack. No vendor lock-in, no surprise fees.
          </p>
        </div>

        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div
            v-for="(feature, i) in features"
            :key="i"
            class="sv-card p-6 hover:border-indigo-500/30"
          >
            <div class="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center mb-4">
              <svg v-if="feature.icon === 'globe'" class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <svg v-else-if="feature.icon === 'stream'" class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              <svg v-else-if="feature.icon === 'upload'" class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
              <svg v-else-if="feature.icon === 'crypto'" class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <svg v-else-if="feature.icon === 'player'" class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <svg v-else-if="feature.icon === 'analytics'" class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            </div>
            <h3 class="text-base font-semibold text-white mb-2">{{ feature.title }}</h3>
            <p class="text-sm text-[var(--sv-text-tertiary)] leading-relaxed">{{ feature.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Tech Stack -->
    <section class="py-24 border-t border-[var(--sv-border)]">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <h2 class="text-3xl sm:text-4xl font-bold sv-gradient-text mb-4">Built on Cloudflare</h2>
          <p class="text-[var(--sv-text-secondary)] max-w-2xl mx-auto">
            Every component runs on Cloudflare's infrastructure. No external dependencies.
          </p>
        </div>

        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="sv-card p-5 text-center">
            <div class="text-2xl mb-2 sv-mono font-bold text-orange-400">R2</div>
            <p class="text-sm font-medium text-white mb-1">Object Storage</p>
            <p class="text-xs text-[var(--sv-text-tertiary)]">Zero egress fees for video storage</p>
          </div>
          <div class="sv-card p-5 text-center">
            <div class="text-2xl mb-2 sv-mono font-bold text-orange-400">D1</div>
            <p class="text-sm font-medium text-white mb-1">SQL Database</p>
            <p class="text-xs text-[var(--sv-text-tertiary)]">Edge-replicated SQLite database</p>
          </div>
          <div class="sv-card p-5 text-center">
            <div class="text-2xl mb-2 sv-mono font-bold text-yellow-400">Hono</div>
            <p class="text-sm font-medium text-white mb-1">Edge API</p>
            <p class="text-xs text-[var(--sv-text-tertiary)]">Ultrafast video streaming worker</p>
          </div>
          <div class="sv-card p-5 text-center">
            <div class="text-2xl mb-2 sv-mono font-bold text-green-400">KV</div>
            <p class="text-sm font-medium text-white mb-1">Cache Layer</p>
            <p class="text-xs text-[var(--sv-text-tertiary)]">Global key-value caching</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="py-24">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="sv-card p-12 text-center relative overflow-hidden">
          <div class="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-600/5" />
          <div class="relative">
            <h2 class="text-3xl sm:text-4xl font-bold sv-gradient-text mb-4">Ready to start streaming?</h2>
            <p class="text-[var(--sv-text-secondary)] max-w-lg mx-auto mb-8">
              Get 5GB free storage and 20GB bandwidth. No credit card required. Pay with crypto when you need more.
            </p>
            <NuxtLink to="/auth/register" class="sv-btn-primary text-base px-8 py-3 inline-block">
              Create free account
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
