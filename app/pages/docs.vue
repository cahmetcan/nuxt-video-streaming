<script setup lang="ts">
definePageMeta({ layout: 'default' })
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-16">
    <h1 class="text-3xl font-bold sv-gradient-text mb-8">Documentation</h1>

    <div class="space-y-12">
      <!-- Getting Started -->
      <section>
        <h2 class="text-xl font-semibold text-white mb-4">Getting Started</h2>
        <div class="sv-card p-6 space-y-4">
          <div>
            <h3 class="text-sm font-semibold text-white mb-2">1. Create an Account</h3>
            <p class="text-sm text-[var(--sv-text-secondary)]">Sign up for a free account to get started with 5GB storage and 20GB bandwidth.</p>
          </div>
          <div>
            <h3 class="text-sm font-semibold text-white mb-2">2. Upload Your Video</h3>
            <p class="text-sm text-[var(--sv-text-secondary)]">Use the dashboard upload feature or our API to upload videos. We support MP4, WebM, MOV, MKV, and AVI formats. Large files are automatically chunked for reliable uploads.</p>
          </div>
          <div>
            <h3 class="text-sm font-semibold text-white mb-2">3. Share or Embed</h3>
            <p class="text-sm text-[var(--sv-text-secondary)]">Get embed codes, direct stream URLs, or HLS manifest URLs from the Embed section of your dashboard.</p>
          </div>
        </div>
      </section>

      <!-- API Reference -->
      <section>
        <h2 class="text-xl font-semibold text-white mb-4">API Reference</h2>
        <div class="space-y-4">
          <div class="sv-card p-5">
            <div class="flex items-center gap-2 mb-2">
              <span class="px-2 py-0.5 rounded bg-green-500/10 text-green-400 text-xs sv-mono">GET</span>
              <code class="text-sm text-white sv-mono">/api/videos</code>
            </div>
            <p class="text-sm text-[var(--sv-text-secondary)]">List all your videos. Supports pagination, search, and status filtering.</p>
          </div>

          <div class="sv-card p-5">
            <div class="flex items-center gap-2 mb-2">
              <span class="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-xs sv-mono">POST</span>
              <code class="text-sm text-white sv-mono">/api/videos</code>
            </div>
            <p class="text-sm text-[var(--sv-text-secondary)]">Create a new video record. Returns video ID for upload.</p>
          </div>

          <div class="sv-card p-5">
            <div class="flex items-center gap-2 mb-2">
              <span class="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-xs sv-mono">POST</span>
              <code class="text-sm text-white sv-mono">/api/videos/upload/init</code>
            </div>
            <p class="text-sm text-[var(--sv-text-secondary)]">Initialize a chunked upload session. Returns upload ID and chunk configuration.</p>
          </div>

          <div class="sv-card p-5">
            <div class="flex items-center gap-2 mb-2">
              <span class="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-xs sv-mono">POST</span>
              <code class="text-sm text-white sv-mono">/api/videos/upload/chunk</code>
            </div>
            <p class="text-sm text-[var(--sv-text-secondary)]">Upload a single chunk. Send as multipart form with uploadId, chunkIndex, and chunk data.</p>
          </div>

          <div class="sv-card p-5">
            <div class="flex items-center gap-2 mb-2">
              <span class="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-xs sv-mono">POST</span>
              <code class="text-sm text-white sv-mono">/api/videos/upload/complete</code>
            </div>
            <p class="text-sm text-[var(--sv-text-secondary)]">Complete a chunked upload. Merges chunks and starts processing.</p>
          </div>

          <div class="sv-card p-5">
            <div class="flex items-center gap-2 mb-2">
              <span class="px-2 py-0.5 rounded bg-green-500/10 text-green-400 text-xs sv-mono">GET</span>
              <code class="text-sm text-white sv-mono">/api/videos/stream/:id</code>
            </div>
            <p class="text-sm text-[var(--sv-text-secondary)]">Stream a video with range request support for seeking.</p>
          </div>
        </div>
      </section>

      <!-- Streaming -->
      <section>
        <h2 class="text-xl font-semibold text-white mb-4">Video Streaming</h2>
        <div class="sv-card p-6 space-y-4">
          <p class="text-sm text-[var(--sv-text-secondary)]">StreamVault streams videos using a Hono worker running on Cloudflare Workers, pulling directly from R2 storage. Videos are served with:</p>
          <ul class="space-y-2 text-sm text-[var(--sv-text-secondary)]">
            <li class="flex items-start gap-2">
              <svg class="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
              <span><strong class="text-white">Range request support</strong> - Efficient seeking without downloading the full file</span>
            </li>
            <li class="flex items-start gap-2">
              <svg class="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
              <span><strong class="text-white">HLS adaptive streaming</strong> - Automatic quality adaptation based on connection speed</span>
            </li>
            <li class="flex items-start gap-2">
              <svg class="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
              <span><strong class="text-white">Edge caching</strong> - Responses cached at Cloudflare's 150+ edge locations</span>
            </li>
            <li class="flex items-start gap-2">
              <svg class="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
              <span><strong class="text-white">Zero egress fees</strong> - Cloudflare R2 has no egress charges</span>
            </li>
          </ul>
        </div>
      </section>

      <!-- Embed Player -->
      <section>
        <h2 class="text-xl font-semibold text-white mb-4">Embed Player</h2>
        <div class="sv-card p-6">
          <p class="text-sm text-[var(--sv-text-secondary)] mb-4">Embed StreamVault's player on any website with a simple iframe:</p>
          <pre class="p-3 rounded-lg bg-[var(--sv-bg-primary)] text-xs text-[var(--sv-text-secondary)] sv-mono overflow-x-auto">&lt;iframe
  src="https://worker.your-domain.com/embed/VIDEO_ID"
  width="100%"
  style="aspect-ratio: 16/9;"
  frameborder="0"
  allow="autoplay; fullscreen"
  allowfullscreen
&gt;&lt;/iframe&gt;</pre>
        </div>
      </section>
    </div>
  </div>
</template>
