<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const router = useRouter()
const videoId = route.params.id as string
const config = useRuntimeConfig()

const saving = ref(false)
const saved = ref(false)
const copied = ref('')

const { data, pending, refresh } = await useFetch(`/api/videos/${videoId}`, {
  default: () => ({ video: null, embedConfig: null, recentViews: 0 }),
})

const video = computed(() => data.value?.video as any)

const form = reactive({
  title: '',
  description: '',
  visibility: 'private',
  category: '',
  tags: '',
  allow_download: false,
  embed_enabled: true,
})

watch(video, (v) => {
  if (v) {
    form.title = v.title || ''
    form.description = v.description || ''
    form.visibility = v.visibility || 'private'
    form.category = v.category || ''
    form.tags = v.tags || ''
    form.allow_download = !!v.allow_download
    form.embed_enabled = v.embed_enabled !== 0
  }
}, { immediate: true })

async function saveVideo() {
  saving.value = true
  saved.value = false
  try {
    await $fetch(`/api/videos/${videoId}`, {
      method: 'PUT',
      body: {
        title: form.title,
        description: form.description,
        visibility: form.visibility,
        category: form.category,
        tags: form.tags,
        allow_download: form.allow_download ? 1 : 0,
        embed_enabled: form.embed_enabled ? 1 : 0,
      },
    })
    saved.value = true
    setTimeout(() => saved.value = false, 3000)
  } catch (err: any) {
    alert(err.data?.message || 'Save failed')
  } finally {
    saving.value = false
  }
}

async function deleteVideo() {
  if (!confirm('Are you sure you want to delete this video? This cannot be undone.')) return
  await $fetch(`/api/videos/${videoId}`, { method: 'DELETE' })
  router.push('/dashboard/videos')
}

function copyToClipboard(text: string, type: string) {
  navigator.clipboard.writeText(text)
  copied.value = type
  setTimeout(() => copied.value = '', 2000)
}

function formatBytes(bytes: number): string {
  if (!bytes) return '-'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

const workerUrl = config.public.workerUrl
const streamUrl = computed(() => `${workerUrl}/stream/${videoId}`)
const hlsUrl = computed(() => `${workerUrl}/hls/${videoId}/master.m3u8`)
const embedUrl = computed(() => `${workerUrl}/embed/${videoId}`)

const visibilities = [
  { value: 'private', label: 'Private' },
  { value: 'unlisted', label: 'Unlisted' },
  { value: 'public', label: 'Public' },
]
</script>

<template>
  <div class="max-w-4xl">
    <!-- Back -->
    <NuxtLink to="/dashboard/videos" class="inline-flex items-center gap-1.5 text-sm text-[var(--sv-text-tertiary)] hover:text-white mb-6">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
      Back to Videos
    </NuxtLink>

    <div v-if="pending" class="sv-card p-12 text-center">
      <div class="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
    </div>

    <div v-else-if="!video" class="sv-card p-12 text-center">
      <p class="text-[var(--sv-text-tertiary)]">Video not found</p>
    </div>

    <div v-else>
      <!-- Video Preview -->
      <div class="mb-6">
        <VideoPlayer
          v-if="video.status === 'ready'"
          :src="hlsUrl"
          :video-id="videoId"
          hls-enabled
        />
        <div v-else class="sv-player-container flex items-center justify-center">
          <div class="text-center">
            <div class="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
              <svg v-if="video.status === 'processing'" class="w-6 h-6 text-yellow-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              <svg v-else class="w-6 h-6 text-[var(--sv-text-tertiary)]" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            </div>
            <p class="text-sm text-[var(--sv-text-tertiary)] capitalize">{{ video.status }}</p>
          </div>
        </div>
      </div>

      <!-- Video Info Stats -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div class="sv-card p-3 text-center">
          <p class="text-lg font-bold text-white sv-mono">{{ video.views_count || 0 }}</p>
          <p class="text-xs text-[var(--sv-text-tertiary)]">Views</p>
        </div>
        <div class="sv-card p-3 text-center">
          <p class="text-lg font-bold text-white sv-mono">{{ formatBytes(video.file_size_bytes) }}</p>
          <p class="text-xs text-[var(--sv-text-tertiary)]">File Size</p>
        </div>
        <div class="sv-card p-3 text-center">
          <p class="text-lg font-bold text-white capitalize">{{ video.status }}</p>
          <p class="text-xs text-[var(--sv-text-tertiary)]">Status</p>
        </div>
        <div class="sv-card p-3 text-center">
          <p class="text-lg font-bold text-white capitalize">{{ video.visibility }}</p>
          <p class="text-xs text-[var(--sv-text-tertiary)]">Visibility</p>
        </div>
      </div>

      <!-- Links -->
      <div class="sv-card p-5 mb-6 space-y-3">
        <h3 class="text-sm font-semibold text-white">Sharing Links</h3>
        <div class="flex items-center gap-2">
          <span class="text-xs text-[var(--sv-text-tertiary)] w-16 shrink-0">Stream</span>
          <code class="flex-1 text-xs text-indigo-400 sv-mono truncate">{{ streamUrl }}</code>
          <button class="text-xs text-indigo-400" @click="copyToClipboard(streamUrl, 'stream')">{{ copied === 'stream' ? 'Copied' : 'Copy' }}</button>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs text-[var(--sv-text-tertiary)] w-16 shrink-0">HLS</span>
          <code class="flex-1 text-xs text-indigo-400 sv-mono truncate">{{ hlsUrl }}</code>
          <button class="text-xs text-indigo-400" @click="copyToClipboard(hlsUrl, 'hls')">{{ copied === 'hls' ? 'Copied' : 'Copy' }}</button>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs text-[var(--sv-text-tertiary)] w-16 shrink-0">Embed</span>
          <code class="flex-1 text-xs text-indigo-400 sv-mono truncate">{{ embedUrl }}</code>
          <button class="text-xs text-indigo-400" @click="copyToClipboard(embedUrl, 'embed')">{{ copied === 'embed' ? 'Copied' : 'Copy' }}</button>
        </div>
      </div>

      <!-- Edit Form -->
      <div class="sv-card p-6 mb-6">
        <h3 class="text-base font-semibold text-white mb-4">Video Details</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm text-[var(--sv-text-secondary)] mb-1.5">Title</label>
            <input
              v-model="form.title"
              type="text"
              class="w-full px-3 py-2.5 rounded-lg bg-[var(--sv-bg-tertiary)] border border-[var(--sv-border)] text-white text-sm focus:outline-none focus:border-indigo-500"
            >
          </div>
          <div>
            <label class="block text-sm text-[var(--sv-text-secondary)] mb-1.5">Description</label>
            <textarea
              v-model="form.description"
              rows="3"
              class="w-full px-3 py-2.5 rounded-lg bg-[var(--sv-bg-tertiary)] border border-[var(--sv-border)] text-white text-sm focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm text-[var(--sv-text-secondary)] mb-1.5">Visibility</label>
              <USelect
                v-model="form.visibility"
                :items="visibilities.map((v: any) => ({ label: v.label, value: v.value }))"
                class="w-full"
              />
            </div>
            <div>
              <label class="block text-sm text-[var(--sv-text-secondary)] mb-1.5">Category</label>
              <input
                v-model="form.category"
                type="text"
                class="w-full px-3 py-2.5 rounded-lg bg-[var(--sv-bg-tertiary)] border border-[var(--sv-border)] text-white text-sm focus:outline-none focus:border-indigo-500"
              >
            </div>
          </div>
          <div>
            <label class="block text-sm text-[var(--sv-text-secondary)] mb-1.5">Tags</label>
            <input
              v-model="form.tags"
              type="text"
              placeholder="Comma-separated tags"
              class="w-full px-3 py-2.5 rounded-lg bg-[var(--sv-bg-tertiary)] border border-[var(--sv-border)] text-white text-sm focus:outline-none focus:border-indigo-500"
            >
          </div>
          <div class="flex items-center gap-6">
            <label class="flex items-center gap-2 cursor-pointer">
              <input v-model="form.embed_enabled" type="checkbox" class="accent-indigo-500">
              <span class="text-sm text-[var(--sv-text-secondary)]">Allow embedding</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input v-model="form.allow_download" type="checkbox" class="accent-indigo-500">
              <span class="text-sm text-[var(--sv-text-secondary)]">Allow download</span>
            </label>
          </div>
          <div class="flex items-center gap-3">
            <button class="sv-btn-primary text-sm" :disabled="saving" @click="saveVideo">
              {{ saving ? 'Saving...' : 'Save Changes' }}
            </button>
            <span v-if="saved" class="text-xs text-green-400">Saved</span>
          </div>
        </div>
      </div>

      <!-- Delete -->
      <div class="sv-card p-6 border-red-500/20">
        <h3 class="text-sm font-semibold text-red-400 mb-2">Delete Video</h3>
        <p class="text-xs text-[var(--sv-text-tertiary)] mb-3">This will permanently delete the video and all associated data.</p>
        <button
          class="px-4 py-2 rounded-lg border border-red-500/30 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
          @click="deleteVideo"
        >
          Delete Video
        </button>
      </div>
    </div>
  </div>
</template>
