<script setup lang="ts">
definePageMeta({ layout: 'default' })

const route = useRoute()
const config = useRuntimeConfig()

const slug = route.params.slug as string

// For public video pages, we fetch by slug
// In production, this would be a public API endpoint
const { data: videoData, error } = await useFetch(`/api/videos/stream/${slug}`, {
  method: 'HEAD',
})

const workerUrl = config.public.workerUrl
const hlsUrl = `${workerUrl}/hls/${slug}/master.m3u8`
const directUrl = `${workerUrl}/stream/${slug}`
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 py-8">
    <!-- Video Player -->
    <div class="mb-6">
      <VideoPlayer
        :src="hlsUrl"
        :video-id="slug"
        hls-enabled
      />
    </div>

    <div v-if="error">
      <div class="sv-card p-12 text-center">
        <p class="text-[var(--sv-text-tertiary)]">Video not found or not available</p>
      </div>
    </div>
  </div>
</template>
