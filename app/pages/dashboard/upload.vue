<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const router = useRouter()
const { state: uploadState, uploadVideo, formatSpeed, formatSize } = useUpload()

const file = ref<File | null>(null)
const dragActive = ref(false)
const metadata = reactive({
  title: '',
  description: '',
  visibility: 'private',
  category: '',
  tags: '',
})

const fileInput = ref<HTMLInputElement>()

function handleDrop(e: DragEvent) {
  dragActive.value = false
  const files = e.dataTransfer?.files
  if (files?.length) {
    selectFile(files[0])
  }
}

function handleFileSelect(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files?.length) {
    selectFile(input.files[0])
  }
}

function selectFile(f: File) {
  const validTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska', 'video/x-msvideo']
  if (!validTypes.includes(f.type) && !f.name.match(/\.(mp4|webm|mov|mkv|avi)$/i)) {
    alert('Please select a valid video file (MP4, WebM, MOV, MKV, AVI)')
    return
  }

  file.value = f
  if (!metadata.title) {
    metadata.title = f.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
  }
}

async function handleUpload() {
  if (!file.value || !metadata.title) return

  try {
    const result = await uploadVideo(file.value, {
      title: metadata.title,
      description: metadata.description,
      visibility: metadata.visibility,
      category: metadata.category,
      tags: metadata.tags,
    })

    if (result?.videoId) {
      router.push(`/dashboard/videos`)
    }
  } catch (err) {
    // Error is already in uploadState.error
  }
}

function removeFile() {
  file.value = null
  metadata.title = ''
  metadata.description = ''
}

const categories = ['', 'Education', 'Entertainment', 'Gaming', 'Music', 'Technology', 'Business', 'Sports', 'News', 'Other']
const visibilities = [
  { value: 'private', label: 'Private', description: 'Only you can see' },
  { value: 'unlisted', label: 'Unlisted', description: 'Anyone with link' },
  { value: 'public', label: 'Public', description: 'Visible to everyone' },
]
</script>

<template>
  <div class="max-w-3xl">
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-white">Upload Video</h1>
      <p class="text-sm text-[var(--sv-text-tertiary)] mt-1">Upload and publish video content</p>
    </div>

    <!-- Upload Area -->
    <div v-if="!file" class="mb-8">
      <div
        class="sv-card p-12 text-center cursor-pointer transition-all"
        :class="dragActive ? 'border-indigo-500 bg-indigo-500/5' : 'hover:border-[var(--sv-border-hover)]'"
        @dragover.prevent="dragActive = true"
        @dragleave.prevent="dragActive = false"
        @drop.prevent="handleDrop"
        @click="fileInput?.click()"
      >
        <div class="w-14 h-14 rounded-full bg-indigo-500/10 flex items-center justify-center mx-auto mb-4">
          <svg class="w-7 h-7 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <p class="text-sm font-medium text-white mb-1">
          {{ dragActive ? 'Drop your video here' : 'Drag and drop your video file' }}
        </p>
        <p class="text-xs text-[var(--sv-text-tertiary)] mb-4">or click to browse</p>
        <p class="text-xs text-[var(--sv-text-tertiary)]">
          MP4, WebM, MOV, MKV, AVI &middot; Chunked upload for large files
        </p>
        <input
          ref="fileInput"
          type="file"
          accept="video/*,.mp4,.webm,.mov,.mkv,.avi"
          class="hidden"
          @change="handleFileSelect"
        >
      </div>
    </div>

    <!-- File Selected -->
    <div v-else>
      <!-- File Info -->
      <div class="sv-card p-4 mb-6 flex items-center gap-4">
        <div class="w-12 h-12 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
          <svg class="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-white truncate">{{ file.name }}</p>
          <p class="text-xs text-[var(--sv-text-tertiary)]">{{ formatSize(file.size) }} &middot; {{ file.type || 'video' }}</p>
        </div>
        <button
          v-if="!uploadState.uploading"
          class="text-[var(--sv-text-tertiary)] hover:text-red-400 p-1"
          @click="removeFile"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Upload Progress -->
      <div v-if="uploadState.uploading" class="sv-card p-5 mb-6">
        <div class="flex items-center justify-between mb-3">
          <span class="text-sm font-medium text-white">Uploading...</span>
          <span class="text-sm text-[var(--sv-text-secondary)] sv-mono">{{ uploadState.progress }}%</span>
        </div>
        <div class="sv-progress-bar mb-3">
          <div class="sv-progress-fill" :style="{ width: `${uploadState.progress}%` }" />
        </div>
        <div class="flex items-center justify-between text-xs text-[var(--sv-text-tertiary)]">
          <span>Chunk {{ uploadState.currentChunk }} / {{ uploadState.totalChunks }}</span>
          <span class="sv-mono">{{ formatSpeed(uploadState.speed) }}</span>
        </div>
      </div>

      <!-- Error -->
      <div v-if="uploadState.error" class="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
        <p class="text-sm text-red-400">{{ uploadState.error }}</p>
      </div>

      <!-- Metadata Form -->
      <div v-if="!uploadState.uploading" class="space-y-5">
        <div>
          <label class="block text-sm font-medium text-[var(--sv-text-secondary)] mb-1.5">Title *</label>
          <input
            v-model="metadata.title"
            type="text"
            required
            placeholder="Video title"
            class="w-full px-3 py-2.5 rounded-lg bg-[var(--sv-bg-tertiary)] border border-[var(--sv-border)] text-white text-sm placeholder:text-[var(--sv-text-tertiary)] focus:outline-none focus:border-indigo-500"
          >
        </div>

        <div>
          <label class="block text-sm font-medium text-[var(--sv-text-secondary)] mb-1.5">Description</label>
          <textarea
            v-model="metadata.description"
            rows="3"
            placeholder="Describe your video..."
            class="w-full px-3 py-2.5 rounded-lg bg-[var(--sv-bg-tertiary)] border border-[var(--sv-border)] text-white text-sm placeholder:text-[var(--sv-text-tertiary)] focus:outline-none focus:border-indigo-500 resize-none"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-[var(--sv-text-secondary)] mb-1.5">Visibility</label>
            <select
              v-model="metadata.visibility"
              class="w-full px-3 py-2.5 rounded-lg bg-[var(--sv-bg-tertiary)] border border-[var(--sv-border)] text-white text-sm focus:outline-none focus:border-indigo-500"
            >
              <option v-for="v in visibilities" :key="v.value" :value="v.value">
                {{ v.label }} - {{ v.description }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-[var(--sv-text-secondary)] mb-1.5">Category</label>
            <select
              v-model="metadata.category"
              class="w-full px-3 py-2.5 rounded-lg bg-[var(--sv-bg-tertiary)] border border-[var(--sv-border)] text-white text-sm focus:outline-none focus:border-indigo-500"
            >
              <option v-for="cat in categories" :key="cat" :value="cat">
                {{ cat || 'Select category' }}
              </option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-[var(--sv-text-secondary)] mb-1.5">Tags</label>
          <input
            v-model="metadata.tags"
            type="text"
            placeholder="Comma-separated tags"
            class="w-full px-3 py-2.5 rounded-lg bg-[var(--sv-bg-tertiary)] border border-[var(--sv-border)] text-white text-sm placeholder:text-[var(--sv-text-tertiary)] focus:outline-none focus:border-indigo-500"
          >
        </div>

        <div class="flex items-center gap-3 pt-2">
          <button
            class="sv-btn-primary flex items-center gap-2"
            :disabled="!metadata.title"
            @click="handleUpload"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Upload Video
          </button>
          <button class="sv-btn-secondary" @click="removeFile">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>
