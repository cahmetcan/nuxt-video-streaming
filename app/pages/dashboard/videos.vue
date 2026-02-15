<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const router = useRouter()
const search = ref('')
const statusFilter = ref('all')
const currentPage = ref(1)

const { data, pending, refresh } = await useFetch('/api/videos', {
  query: computed(() => ({
    page: currentPage.value,
    limit: 20,
    status: statusFilter.value,
    search: search.value || undefined,
    sort: 'created_at',
    order: 'DESC',
  })),
  default: () => ({ videos: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } }),
})

function formatBytes(bytes: number): string {
  if (!bytes) return '-'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function formatDuration(seconds: number): string {
  if (!seconds) return '-'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

async function deleteVideo(id: string) {
  if (!confirm('Are you sure you want to delete this video?')) return
  await $fetch(`/api/videos/${id}`, { method: 'DELETE' })
  refresh()
}

const statuses = ['all', 'ready', 'processing', 'uploading', 'error']
</script>

<template>
  <div>
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-white">Videos</h1>
        <p class="text-sm text-[var(--sv-text-tertiary)] mt-1">{{ data?.pagination?.total || 0 }} total videos</p>
      </div>
      <NuxtLink to="/dashboard/upload" class="sv-btn-primary text-sm flex items-center gap-2 w-fit">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
        Upload Video
      </NuxtLink>
    </div>

    <!-- Filters -->
    <div class="flex flex-col sm:flex-row gap-3 mb-6">
      <div class="flex-1">
        <input
          v-model="search"
          type="text"
          placeholder="Search videos..."
          class="w-full px-3 py-2 rounded-lg bg-[var(--sv-bg-tertiary)] border border-[var(--sv-border)] text-white text-sm placeholder:text-[var(--sv-text-tertiary)] focus:outline-none focus:border-indigo-500"
        >
      </div>
      <div class="flex gap-1 p-1 rounded-lg bg-[var(--sv-bg-secondary)] border border-[var(--sv-border)]">
        <button
          v-for="status in statuses"
          :key="status"
          class="px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize"
          :class="statusFilter === status ? 'bg-[var(--sv-bg-tertiary)] text-white' : 'text-[var(--sv-text-tertiary)] hover:text-white'"
          @click="statusFilter = status; currentPage = 1"
        >
          {{ status }}
        </button>
      </div>
    </div>

    <!-- Video List -->
    <div class="sv-card overflow-hidden">
      <div v-if="!data?.videos?.length" class="p-16 text-center">
        <div class="w-12 h-12 rounded-full bg-[var(--sv-bg-tertiary)] flex items-center justify-center mx-auto mb-3">
          <svg class="w-6 h-6 text-[var(--sv-text-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
        </div>
        <p class="text-sm text-[var(--sv-text-secondary)] mb-1">No videos found</p>
        <p class="text-xs text-[var(--sv-text-tertiary)] mb-4">Upload your first video to get started</p>
        <NuxtLink to="/dashboard/upload" class="sv-btn-primary text-sm">Upload Video</NuxtLink>
      </div>

      <table v-else class="sv-table">
        <thead>
          <tr>
            <th>Video</th>
            <th class="hidden md:table-cell">Status</th>
            <th class="hidden md:table-cell">Visibility</th>
            <th class="hidden sm:table-cell">Views</th>
            <th class="hidden lg:table-cell">Size</th>
            <th class="hidden lg:table-cell">Duration</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="video in (data?.videos || [])" :key="(video as any).id">
            <td>
              <div class="flex items-center gap-3">
                <div class="w-16 h-9 rounded bg-[var(--sv-bg-tertiary)] shrink-0 flex items-center justify-center">
                  <img v-if="(video as any).thumbnail_url" :src="(video as any).thumbnail_url" class="w-full h-full object-cover rounded" />
                  <svg v-else class="w-4 h-4 text-[var(--sv-text-tertiary)]" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                </div>
                <div class="min-w-0">
                  <p class="text-sm font-medium text-white truncate">{{ (video as any).title }}</p>
                  <p class="text-xs text-[var(--sv-text-tertiary)]">{{ new Date((video as any).created_at).toLocaleDateString() }}</p>
                </div>
              </div>
            </td>
            <td class="hidden md:table-cell">
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
            <td class="hidden md:table-cell capitalize text-xs">{{ (video as any).visibility }}</td>
            <td class="hidden sm:table-cell sv-mono text-xs">{{ (video as any).views_count || 0 }}</td>
            <td class="hidden lg:table-cell sv-mono text-xs">{{ formatBytes((video as any).file_size_bytes) }}</td>
            <td class="hidden lg:table-cell sv-mono text-xs">{{ formatDuration((video as any).duration_seconds) }}</td>
            <td>
              <div class="flex items-center gap-1">
                <NuxtLink
                  :to="`/dashboard/videos/${(video as any).id}`"
                  class="p-1.5 rounded hover:bg-[var(--sv-bg-tertiary)] text-[var(--sv-text-tertiary)] hover:text-white transition-colors"
                  title="Edit"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </NuxtLink>
                <button
                  class="p-1.5 rounded hover:bg-red-500/10 text-[var(--sv-text-tertiary)] hover:text-red-400 transition-colors"
                  title="Delete"
                  @click="deleteVideo((video as any).id)"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div v-if="(data?.pagination?.totalPages || 0) > 1" class="p-4 border-t border-[var(--sv-border)] flex items-center justify-between">
        <p class="text-xs text-[var(--sv-text-tertiary)]">
          Page {{ data?.pagination?.page }} of {{ data?.pagination?.totalPages }}
        </p>
        <div class="flex gap-1">
          <button
            :disabled="currentPage <= 1"
            class="sv-btn-secondary text-xs px-3 py-1.5 disabled:opacity-30"
            @click="currentPage--"
          >
            Previous
          </button>
          <button
            :disabled="currentPage >= (data?.pagination?.totalPages || 1)"
            class="sv-btn-secondary text-xs px-3 py-1.5 disabled:opacity-30"
            @click="currentPage++"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
