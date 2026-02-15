<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const period = ref('7d')
const periods = [
  { value: '24h', label: '24 hours' },
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
]

const { data, pending, refresh } = await useFetch('/api/admin/analytics', {
  query: computed(() => ({ period: period.value })),
  default: () => ({
    period: '7d',
    analytics: {
      totalViews: 0,
      uniqueViewers: 0,
      avgWatchTime: 0,
      countries: [],
      devices: [],
    },
  }),
})

watch(period, () => refresh())

function formatTime(seconds: number): string {
  if (!seconds) return '0s'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

function formatNumber(num: number): string {
  if (!num) return '0'
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return String(num)
}

const analyticsCards = computed(() => [
  { label: 'Total Views', value: formatNumber(data.value?.analytics?.totalViews || 0), change: '+0%' },
  { label: 'Unique Viewers', value: formatNumber(data.value?.analytics?.uniqueViewers || 0), change: '+0%' },
  { label: 'Avg. Watch Time', value: formatTime(data.value?.analytics?.avgWatchTime || 0), change: '+0%' },
])
</script>

<template>
  <div>
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div>
        <h1 class="text-2xl font-bold text-white">Analytics</h1>
        <p class="text-sm text-[var(--sv-text-tertiary)] mt-1">Track your video performance</p>
      </div>

      <div class="flex gap-1 p-1 rounded-lg bg-[var(--sv-bg-secondary)] border border-[var(--sv-border)]">
        <button
          v-for="p in periods"
          :key="p.value"
          class="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
          :class="period === p.value ? 'bg-[var(--sv-bg-tertiary)] text-white' : 'text-[var(--sv-text-tertiary)] hover:text-white'"
          @click="period = p.value"
        >
          {{ p.label }}
        </button>
      </div>
    </div>

    <!-- Analytics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div v-for="(card, i) in analyticsCards" :key="i" class="sv-card p-5">
        <p class="text-xs text-[var(--sv-text-tertiary)] uppercase tracking-wider mb-2">{{ card.label }}</p>
        <p class="text-3xl font-bold text-white sv-mono">{{ card.value }}</p>
      </div>
    </div>

    <!-- Devices & Countries -->
    <div class="grid md:grid-cols-2 gap-5">
      <!-- Top Countries -->
      <div class="sv-card">
        <div class="p-5 border-b border-[var(--sv-border)]">
          <h3 class="text-sm font-semibold text-white">Top Countries</h3>
        </div>
        <div v-if="!(data?.analytics?.countries as any[])?.length" class="p-8 text-center">
          <p class="text-sm text-[var(--sv-text-tertiary)]">No data yet</p>
        </div>
        <div v-else class="p-4 space-y-3">
          <div
            v-for="country in (data?.analytics?.countries || []) as any[]"
            :key="country.country"
            class="flex items-center justify-between"
          >
            <span class="text-sm text-[var(--sv-text-secondary)]">{{ country.country || 'Unknown' }}</span>
            <span class="text-sm text-white sv-mono">{{ country.count }}</span>
          </div>
        </div>
      </div>

      <!-- Devices -->
      <div class="sv-card">
        <div class="p-5 border-b border-[var(--sv-border)]">
          <h3 class="text-sm font-semibold text-white">Devices</h3>
        </div>
        <div v-if="!(data?.analytics?.devices as any[])?.length" class="p-8 text-center">
          <p class="text-sm text-[var(--sv-text-tertiary)]">No data yet</p>
        </div>
        <div v-else class="p-4 space-y-3">
          <div
            v-for="device in (data?.analytics?.devices || []) as any[]"
            :key="device.device"
            class="flex items-center justify-between"
          >
            <span class="text-sm text-[var(--sv-text-secondary)] capitalize">{{ device.device || 'Unknown' }}</span>
            <span class="text-sm text-white sv-mono">{{ device.count }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
