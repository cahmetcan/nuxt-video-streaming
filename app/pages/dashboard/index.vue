<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const { user } = useAuth()

const { data: stats, pending } = await useFetch('/api/admin/stats', {
  default: () => ({
    stats: { totalVideos: 0, totalViews: 0, storageUsed: 0, bandwidthUsed: 0, recentViews: 0 },
    topVideos: [],
    recentUploads: [],
  }),
})

function formatBytes(bytes: number): string {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

function formatNumber(num: number): string {
  if (!num) return '0'
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return String(num)
}

const overviewCards = computed(() => [
  { label: 'Total Videos', value: stats.value?.stats?.totalVideos || 0, icon: 'video', color: 'indigo' },
  { label: 'Total Views', value: formatNumber(stats.value?.stats?.totalViews || 0), icon: 'eye', color: 'purple' },
  { label: 'Storage Used', value: formatBytes(stats.value?.stats?.storageUsed || 0), icon: 'storage', color: 'blue' },
  { label: 'Bandwidth', value: formatBytes(stats.value?.stats?.bandwidthUsed || 0), icon: 'bandwidth', color: 'green' },
])
</script>

<template>
  <div>
    <!-- Page Header -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-white">Dashboard</h1>
      <p class="text-sm text-[var(--sv-text-tertiary)] mt-1">Welcome back, {{ user?.name || 'User' }}</p>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div
        v-for="(card, i) in overviewCards"
        :key="i"
        class="sv-card p-5"
      >
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs text-[var(--sv-text-tertiary)] uppercase tracking-wider">{{ card.label }}</span>
          <div class="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
            <svg v-if="card.icon === 'video'" class="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            <svg v-else-if="card.icon === 'eye'" class="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            <svg v-else-if="card.icon === 'storage'" class="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
            <svg v-else class="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
          </div>
        </div>
        <p class="text-2xl font-bold text-white sv-mono">{{ card.value }}</p>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="grid md:grid-cols-3 gap-4 mb-8">
      <NuxtLink to="/dashboard/upload" class="sv-card p-5 flex items-center gap-4 hover:border-indigo-500/30">
        <div class="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
          <svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
        </div>
        <div>
          <p class="text-sm font-medium text-white">Upload Video</p>
          <p class="text-xs text-[var(--sv-text-tertiary)]">Drag & drop or browse files</p>
        </div>
      </NuxtLink>

      <NuxtLink to="/dashboard/videos" class="sv-card p-5 flex items-center gap-4 hover:border-indigo-500/30">
        <div class="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
          <svg class="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
        </div>
        <div>
          <p class="text-sm font-medium text-white">Video Library</p>
          <p class="text-xs text-[var(--sv-text-tertiary)]">Manage your content</p>
        </div>
      </NuxtLink>

      <NuxtLink to="/dashboard/analytics" class="sv-card p-5 flex items-center gap-4 hover:border-indigo-500/30">
        <div class="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
          <svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
        </div>
        <div>
          <p class="text-sm font-medium text-white">View Analytics</p>
          <p class="text-xs text-[var(--sv-text-tertiary)]">Track performance</p>
        </div>
      </NuxtLink>
    </div>

    <!-- Recent Uploads -->
    <div class="sv-card">
      <div class="p-5 border-b border-[var(--sv-border)] flex items-center justify-between">
        <h2 class="text-base font-semibold text-white">Recent Videos</h2>
        <NuxtLink to="/dashboard/videos" class="text-xs text-indigo-400 hover:text-indigo-300">View all</NuxtLink>
      </div>
      <div v-if="!stats?.recentUploads?.length" class="p-12 text-center">
        <div class="w-12 h-12 rounded-full bg-[var(--sv-bg-tertiary)] flex items-center justify-center mx-auto mb-3">
          <svg class="w-6 h-6 text-[var(--sv-text-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
        </div>
        <p class="text-sm text-[var(--sv-text-tertiary)] mb-3">No videos yet</p>
        <NuxtLink to="/dashboard/upload" class="sv-btn-primary text-sm">Upload your first video</NuxtLink>
      </div>
      <div v-else>
        <table class="sv-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Size</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="video in stats?.recentUploads" :key="(video as any).id">
              <td class="text-white font-medium">{{ (video as any).title }}</td>
              <td>
                <span
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                  :class="{
                    'bg-green-500/10 text-green-400': (video as any).status === 'ready',
                    'bg-yellow-500/10 text-yellow-400': (video as any).status === 'processing',
                    'bg-blue-500/10 text-blue-400': (video as any).status === 'uploading',
                    'bg-red-500/10 text-red-400': (video as any).status === 'error',
                  }"
                >
                  {{ (video as any).status }}
                </span>
              </td>
              <td class="sv-mono text-xs">{{ formatBytes((video as any).file_size_bytes || 0) }}</td>
              <td class="text-xs">{{ new Date((video as any).created_at).toLocaleDateString() }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
