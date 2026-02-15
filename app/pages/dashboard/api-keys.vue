<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const { user } = useAuth()
const copied = ref(false)

function copyApiKey() {
  if (user.value?.apiKey) {
    navigator.clipboard.writeText(user.value.apiKey)
    copied.value = true
    setTimeout(() => copied.value = false, 2000)
  }
}

const apiExamples = [
  {
    title: 'List Videos',
    method: 'GET',
    endpoint: '/api/videos',
    code: `curl -H "Authorization: Bearer YOUR_API_KEY" \\
  https://your-domain.com/api/videos`,
  },
  {
    title: 'Upload Video',
    method: 'POST',
    endpoint: '/api/videos',
    code: `curl -X POST -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"title":"My Video","visibility":"public"}' \\
  https://your-domain.com/api/videos`,
  },
  {
    title: 'Get Stream URL',
    method: 'GET',
    endpoint: '/api/videos/stream/:id',
    code: `curl -H "Authorization: Bearer YOUR_API_KEY" \\
  https://your-domain.com/api/videos/stream/VIDEO_ID`,
  },
]
</script>

<template>
  <div>
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-white">API Keys</h1>
      <p class="text-sm text-[var(--sv-text-tertiary)] mt-1">Access the StreamVault API programmatically</p>
    </div>

    <!-- API Key -->
    <div class="sv-card p-5 mb-6">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-semibold text-white">Your API Key</h3>
        <button
          class="text-xs text-indigo-400 hover:text-indigo-300"
          @click="copyApiKey"
        >
          {{ copied ? 'Copied!' : 'Copy' }}
        </button>
      </div>
      <div class="p-3 rounded-lg bg-[var(--sv-bg-primary)] flex items-center gap-3">
        <code class="text-sm text-indigo-400 sv-mono flex-1 break-all">{{ user?.apiKey || 'No API key generated' }}</code>
      </div>
      <p class="text-xs text-[var(--sv-text-tertiary)] mt-2">
        Keep this key secret. Include it in the Authorization header as <code class="text-indigo-400">Bearer YOUR_KEY</code>.
      </p>
    </div>

    <!-- API Documentation -->
    <div class="space-y-4">
      <h3 class="text-base font-semibold text-white">Quick Start</h3>

      <div v-for="example in apiExamples" :key="example.title" class="sv-card p-5">
        <div class="flex items-center gap-2 mb-3">
          <span
            class="px-2 py-0.5 rounded text-xs font-medium sv-mono"
            :class="example.method === 'GET' ? 'bg-green-500/10 text-green-400' : 'bg-blue-500/10 text-blue-400'"
          >
            {{ example.method }}
          </span>
          <span class="text-sm font-medium text-white">{{ example.title }}</span>
          <span class="text-xs text-[var(--sv-text-tertiary)] sv-mono">{{ example.endpoint }}</span>
        </div>
        <pre class="p-3 rounded-lg bg-[var(--sv-bg-primary)] text-xs text-[var(--sv-text-secondary)] sv-mono overflow-x-auto whitespace-pre-wrap">{{ example.code }}</pre>
      </div>
    </div>
  </div>
</template>
