<script setup lang="ts">
definePageMeta({ layout: false })

const route = useRoute()
const config = useRuntimeConfig()
const videoId = route.params.id as string

const workerUrl = config.public.workerUrl
const hlsUrl = `${workerUrl}/hls/${videoId}/master.m3u8`
const directUrl = `${workerUrl}/stream/${videoId}`
</script>

<template>
  <div class="w-screen h-screen bg-black">
    <VideoPlayer
      :src="hlsUrl"
      :video-id="videoId"
      hls-enabled
      autoplay
      muted
    />
  </div>
</template>

<style scoped>
html, body {
  margin: 0;
  padding: 0;
  overflow: hidden;
}
</style>
