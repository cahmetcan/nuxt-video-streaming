<script setup lang="ts">
import Hls from 'hls.js'

interface Props {
  src: string
  poster?: string
  autoplay?: boolean
  muted?: boolean
  loop?: boolean
  hlsEnabled?: boolean
  videoId?: string
}

const props = withDefaults(defineProps<Props>(), {
  autoplay: false,
  muted: false,
  loop: false,
  hlsEnabled: true,
})

const emit = defineEmits<{
  ready: []
  play: []
  pause: []
  ended: []
  timeUpdate: [time: number]
  error: [error: string]
}>()

const videoRef = ref<HTMLVideoElement>()
const containerRef = ref<HTMLDivElement>()
const hls = ref<Hls | null>(null)

// Player state
const playing = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const buffered = ref(0)
const volume = ref(1)
const muted = ref(props.muted)
const fullscreen = ref(false)
const showControls = ref(true)
const loading = ref(true)
const quality = ref('auto')
const qualities = ref<{ label: string; height: number; index: number }[]>([])
const showQualityMenu = ref(false)
const showVolumeSlider = ref(false)
const hideControlsTimer = ref<ReturnType<typeof setTimeout>>()
const playbackRate = ref(1)
const showSpeedMenu = ref(false)

const speeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]

const progressPercent = computed(() => {
  return duration.value > 0 ? (currentTime.value / duration.value) * 100 : 0
})

const bufferedPercent = computed(() => {
  return duration.value > 0 ? (buffered.value / duration.value) * 100 : 0
})

function formatTime(seconds: number): string {
  if (isNaN(seconds) || !isFinite(seconds)) return '0:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

function initPlayer() {
  const video = videoRef.value
  if (!video) return

  const isHLS = props.src.includes('.m3u8')

  if (isHLS && Hls.isSupported() && props.hlsEnabled) {
    const hlsInstance = new Hls({
      maxBufferLength: 30,
      maxMaxBufferLength: 60,
      startLevel: -1, // auto quality
      capLevelToPlayerSize: true,
      progressive: true,
    })

    hlsInstance.loadSource(props.src)
    hlsInstance.attachMedia(video)

    hlsInstance.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
      qualities.value = data.levels.map((level, index) => ({
        label: `${level.height}p`,
        height: level.height,
        index,
      }))
      qualities.value.unshift({ label: 'Auto', height: 0, index: -1 })
      loading.value = false
      emit('ready')

      if (props.autoplay) {
        video.play().catch(() => {})
      }
    })

    hlsInstance.on(Hls.Events.ERROR, (_event, data) => {
      if (data.fatal) {
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            hlsInstance.startLoad()
            break
          case Hls.ErrorTypes.MEDIA_ERROR:
            hlsInstance.recoverMediaError()
            break
          default:
            emit('error', 'Fatal playback error')
            break
        }
      }
    })

    hlsInstance.on(Hls.Events.LEVEL_SWITCHED, (_event, data) => {
      const level = hlsInstance.levels[data.level]
      if (level) {
        quality.value = quality.value === 'auto' ? 'auto' : `${level.height}p`
      }
    })

    hls.value = hlsInstance
  } else if (isHLS && video.canPlayType('application/vnd.apple.mpegurl')) {
    // Native HLS support (Safari)
    video.src = props.src
    loading.value = false
    emit('ready')
  } else {
    // Direct video playback
    video.src = props.src
    loading.value = false
    emit('ready')
  }
}

function togglePlay() {
  const video = videoRef.value
  if (!video) return

  if (video.paused) {
    video.play()
  } else {
    video.pause()
  }
}

function seek(event: MouseEvent) {
  const video = videoRef.value
  const bar = event.currentTarget as HTMLElement
  if (!video || !bar) return

  const rect = bar.getBoundingClientRect()
  const percent = (event.clientX - rect.left) / rect.width
  video.currentTime = percent * duration.value
}

function setVolume(event: MouseEvent) {
  const video = videoRef.value
  const bar = event.currentTarget as HTMLElement
  if (!video || !bar) return

  const rect = bar.getBoundingClientRect()
  const percent = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width))
  video.volume = percent
  volume.value = percent
  muted.value = percent === 0
}

function toggleMute() {
  const video = videoRef.value
  if (!video) return

  muted.value = !muted.value
  video.muted = muted.value
}

function toggleFullscreen() {
  const container = containerRef.value
  if (!container) return

  if (document.fullscreenElement) {
    document.exitFullscreen()
    fullscreen.value = false
  } else {
    container.requestFullscreen()
    fullscreen.value = true
  }
}

function setQuality(index: number) {
  if (hls.value) {
    hls.value.currentLevel = index
    quality.value = index === -1 ? 'auto' : `${qualities.value.find(q => q.index === index)?.height}p`
  }
  showQualityMenu.value = false
}

function setSpeed(speed: number) {
  const video = videoRef.value
  if (!video) return
  video.playbackRate = speed
  playbackRate.value = speed
  showSpeedMenu.value = false
}

function resetControlsTimer() {
  showControls.value = true
  if (hideControlsTimer.value) clearTimeout(hideControlsTimer.value)
  hideControlsTimer.value = setTimeout(() => {
    if (playing.value) showControls.value = false
  }, 3000)
}

function onKeydown(event: KeyboardEvent) {
  const video = videoRef.value
  if (!video) return

  switch (event.key) {
    case ' ':
    case 'k':
      event.preventDefault()
      togglePlay()
      break
    case 'f':
      event.preventDefault()
      toggleFullscreen()
      break
    case 'm':
      event.preventDefault()
      toggleMute()
      break
    case 'ArrowLeft':
      event.preventDefault()
      video.currentTime = Math.max(0, video.currentTime - 10)
      break
    case 'ArrowRight':
      event.preventDefault()
      video.currentTime = Math.min(duration.value, video.currentTime + 10)
      break
    case 'ArrowUp':
      event.preventDefault()
      video.volume = Math.min(1, video.volume + 0.1)
      volume.value = video.volume
      break
    case 'ArrowDown':
      event.preventDefault()
      video.volume = Math.max(0, video.volume - 0.1)
      volume.value = video.volume
      break
  }
}

onMounted(() => {
  initPlayer()

  const video = videoRef.value
  if (!video) return

  video.addEventListener('play', () => { playing.value = true; emit('play') })
  video.addEventListener('pause', () => { playing.value = false; emit('pause') })
  video.addEventListener('ended', () => { playing.value = false; emit('ended') })
  video.addEventListener('timeupdate', () => {
    currentTime.value = video.currentTime
    emit('timeUpdate', video.currentTime)
  })
  video.addEventListener('durationchange', () => { duration.value = video.duration })
  video.addEventListener('progress', () => {
    if (video.buffered.length > 0) {
      buffered.value = video.buffered.end(video.buffered.length - 1)
    }
  })
  video.addEventListener('waiting', () => { loading.value = true })
  video.addEventListener('canplay', () => { loading.value = false })
  video.addEventListener('volumechange', () => {
    volume.value = video.volume
    muted.value = video.muted
  })

  document.addEventListener('fullscreenchange', () => {
    fullscreen.value = !!document.fullscreenElement
  })
})

onUnmounted(() => {
  if (hls.value) {
    hls.value.destroy()
  }
  if (hideControlsTimer.value) {
    clearTimeout(hideControlsTimer.value)
  }
})

watch(() => props.src, () => {
  if (hls.value) {
    hls.value.destroy()
    hls.value = null
  }
  initPlayer()
})
</script>

<template>
  <div
    ref="containerRef"
    class="sv-player-container group relative select-none"
    tabindex="0"
    @mousemove="resetControlsTimer"
    @mouseleave="playing && (showControls = false)"
    @keydown="onKeydown"
    @click.self="togglePlay"
  >
    <!-- Video Element -->
    <video
      ref="videoRef"
      class="w-full h-full object-contain"
      :poster="poster"
      :loop="loop"
      :muted="muted"
      playsinline
      @click="togglePlay"
      @dblclick="toggleFullscreen"
    />

    <!-- Loading Spinner -->
    <div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-black/30">
      <div class="w-12 h-12 border-3 border-white/20 border-t-white rounded-full animate-spin" />
    </div>

    <!-- Play/Pause Overlay -->
    <div
      v-if="!playing && !loading"
      class="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer"
      @click="togglePlay"
    >
      <div class="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-all">
        <svg class="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
    </div>

    <!-- Controls -->
    <div
      class="absolute bottom-0 left-0 right-0 transition-opacity duration-300"
      :class="showControls || !playing ? 'opacity-100' : 'opacity-0 pointer-events-none'"
    >
      <!-- Gradient overlay -->
      <div class="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

      <div class="relative px-4 pb-3 pt-8">
        <!-- Progress Bar -->
        <div
          class="w-full h-1 bg-white/20 rounded-full cursor-pointer group/progress mb-3 hover:h-1.5 transition-all"
          @click="seek"
        >
          <!-- Buffered -->
          <div
            class="absolute h-full bg-white/20 rounded-full"
            :style="{ width: `${bufferedPercent}%` }"
          />
          <!-- Progress -->
          <div
            class="absolute h-full bg-indigo-500 rounded-full transition-[width] duration-100"
            :style="{ width: `${progressPercent}%` }"
          >
            <div class="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity" />
          </div>
        </div>

        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <!-- Play/Pause -->
            <button class="text-white hover:text-white/80 p-1" @click="togglePlay">
              <svg v-if="playing" class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
              <svg v-else class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>

            <!-- Volume -->
            <div class="flex items-center gap-1 relative" @mouseenter="showVolumeSlider = true" @mouseleave="showVolumeSlider = false">
              <button class="text-white hover:text-white/80 p-1" @click="toggleMute">
                <svg v-if="muted || volume === 0" class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                </svg>
                <svg v-else-if="volume < 0.5" class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z" />
                </svg>
                <svg v-else class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                </svg>
              </button>

              <div
                v-show="showVolumeSlider"
                class="w-20 h-1 bg-white/20 rounded-full cursor-pointer"
                @click="setVolume"
              >
                <div
                  class="h-full bg-white rounded-full"
                  :style="{ width: `${(muted ? 0 : volume) * 100}%` }"
                />
              </div>
            </div>

            <!-- Time -->
            <span class="text-white/70 text-xs sv-mono">
              {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
            </span>
          </div>

          <div class="flex items-center gap-1">
            <!-- Speed -->
            <div class="relative">
              <button
                class="text-white/70 hover:text-white text-xs px-2 py-1 sv-mono"
                @click="showSpeedMenu = !showSpeedMenu; showQualityMenu = false"
              >
                {{ playbackRate }}x
              </button>
              <div
                v-if="showSpeedMenu"
                class="absolute bottom-full right-0 mb-2 bg-black/90 backdrop-blur-sm rounded-lg border border-white/10 py-1 min-w-[80px]"
              >
                <button
                  v-for="speed in speeds"
                  :key="speed"
                  class="block w-full text-left px-3 py-1.5 text-xs hover:bg-white/10 transition-colors"
                  :class="playbackRate === speed ? 'text-indigo-400' : 'text-white/70'"
                  @click="setSpeed(speed)"
                >
                  {{ speed }}x
                </button>
              </div>
            </div>

            <!-- Quality -->
            <div v-if="qualities.length > 1" class="relative">
              <button
                class="text-white/70 hover:text-white text-xs px-2 py-1"
                @click="showQualityMenu = !showQualityMenu; showSpeedMenu = false"
              >
                <svg class="w-4 h-4 inline-block mr-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
                </svg>
                {{ quality === 'auto' ? 'Auto' : quality }}
              </button>
              <div
                v-if="showQualityMenu"
                class="absolute bottom-full right-0 mb-2 bg-black/90 backdrop-blur-sm rounded-lg border border-white/10 py-1 min-w-[100px]"
              >
                <button
                  v-for="q in qualities"
                  :key="q.index"
                  class="block w-full text-left px-3 py-1.5 text-xs hover:bg-white/10 transition-colors"
                  :class="(quality === 'auto' && q.index === -1) || quality === q.label ? 'text-indigo-400' : 'text-white/70'"
                  @click="setQuality(q.index)"
                >
                  {{ q.label }}
                </button>
              </div>
            </div>

            <!-- Fullscreen -->
            <button class="text-white hover:text-white/80 p-1" @click="toggleFullscreen">
              <svg v-if="!fullscreen" class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
              </svg>
              <svg v-else class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
