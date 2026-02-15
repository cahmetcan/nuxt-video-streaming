<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const selectedVideo = ref('')
const embedData = ref<any>(null)
const copied = ref('')

const { data: videosData } = await useFetch('/api/videos', {
  query: computed(() => ({ limit: 100, status: 'ready' })),
  default: () => ({ videos: [], pagination: { total: 0 } }),
})

const videos = computed(() => (videosData.value?.videos || []) as any[])

async function loadEmbedConfig() {
  if (!selectedVideo.value) return
  try {
    const data = await $fetch<any>(`/api/videos/embed/${selectedVideo.value}`)
    embedData.value = data
  } catch (err) {
    embedData.value = null
  }
}

watch(selectedVideo, () => loadEmbedConfig())

function copyToClipboard(text: string, type: string) {
  navigator.clipboard.writeText(text)
  copied.value = type
  setTimeout(() => copied.value = '', 2000)
}

const hlsExampleCode = computed(() => {
  if (!embedData.value) return ''
  const hlsLink = embedData.value.hlsLink
  const directLink = embedData.value.directLink
  return '<' + 'script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></' + 'script>\n'
    + '<video id="video" controls></video>\n'
    + '<' + 'script>\n'
    + '  const video = document.getElementById(\'video\');\n'
    + '  if (Hls.isSupported()) {\n'
    + '    const hls = new Hls();\n'
    + '    hls.loadSource(\'' + hlsLink + '\');\n'
    + '    hls.attachMedia(video);\n'
    + '  } else {\n'
    + '    video.src = \'' + directLink + '\';\n'
    + '  }\n'
    + '</' + 'script>'
})
</script>

<template>
  <div>
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-white">Embed</h1>
      <p class="text-sm text-[var(--sv-text-tertiary)] mt-1">Get embed codes and sharing links for your videos</p>
    </div>

    <!-- Video Selector -->
    <div class="sv-card p-5 mb-6">
      <label class="block text-sm font-medium text-[var(--sv-text-secondary)] mb-2">Select a video</label>
      <USelect
        v-model="selectedVideo"
        :items="[{ label: 'Choose a video...', value: '' }, ...videos.map((v: any) => ({ label: v.title, value: v.id }))]"
        class="w-full"
      />
    </div>

    <div v-if="embedData" class="space-y-5">
      <!-- Embed Code -->
      <div class="sv-card p-5">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-semibold text-white">Embed Code (iframe)</h3>
          <button
            class="text-xs text-indigo-400 hover:text-indigo-300"
            @click="copyToClipboard(embedData.embedCode, 'embed')"
          >
            {{ copied === 'embed' ? 'Copied!' : 'Copy' }}
          </button>
        </div>
        <pre class="p-3 rounded-lg bg-[var(--sv-bg-primary)] text-xs text-[var(--sv-text-secondary)] sv-mono overflow-x-auto">{{ embedData.embedCode }}</pre>
      </div>

      <!-- Direct Link -->
      <div class="sv-card p-5">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-semibold text-white">Direct Stream URL</h3>
          <button
            class="text-xs text-indigo-400 hover:text-indigo-300"
            @click="copyToClipboard(embedData.directLink, 'direct')"
          >
            {{ copied === 'direct' ? 'Copied!' : 'Copy' }}
          </button>
        </div>
        <p class="p-3 rounded-lg bg-[var(--sv-bg-primary)] text-xs text-indigo-400 sv-mono break-all">{{ embedData.directLink }}</p>
      </div>

      <!-- HLS Link -->
      <div class="sv-card p-5">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-semibold text-white">HLS Manifest URL</h3>
          <button
            class="text-xs text-indigo-400 hover:text-indigo-300"
            @click="copyToClipboard(embedData.hlsLink, 'hls')"
          >
            {{ copied === 'hls' ? 'Copied!' : 'Copy' }}
          </button>
        </div>
        <p class="p-3 rounded-lg bg-[var(--sv-bg-primary)] text-xs text-indigo-400 sv-mono break-all">{{ embedData.hlsLink }}</p>
      </div>

      <!-- Video.js / HLS.js example -->
      <div class="sv-card p-5">
        <h3 class="text-sm font-semibold text-white mb-3">HLS.js Integration</h3>
        <pre class="p-3 rounded-lg bg-[var(--sv-bg-primary)] text-xs text-[var(--sv-text-secondary)] sv-mono overflow-x-auto whitespace-pre-wrap">{{ hlsExampleCode }}</pre>
      </div>
    </div>

    <div v-else-if="selectedVideo" class="sv-card p-12 text-center">
      <p class="text-sm text-[var(--sv-text-tertiary)]">Loading embed configuration...</p>
    </div>
  </div>
</template>
