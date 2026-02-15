interface UploadState {
  uploading: boolean
  progress: number
  currentChunk: number
  totalChunks: number
  speed: number
  error: string | null
  videoId: string | null
  uploadId: string | null
}

export function useUpload() {
  const state = reactive<UploadState>({
    uploading: false,
    progress: 0,
    currentChunk: 0,
    totalChunks: 0,
    speed: 0,
    error: null,
    videoId: null,
    uploadId: null,
  })

  async function uploadVideo(
    file: File,
    metadata: { title: string; description?: string; visibility?: string; category?: string; tags?: string }
  ) {
    state.uploading = true
    state.progress = 0
    state.error = null
    state.speed = 0

    try {
      // Step 1: Create video record
      const videoResult = await $fetch<{ video: { id: string; slug: string } }>('/api/videos', {
        method: 'POST',
        body: {
          ...metadata,
          fileSize: file.size,
          filename: file.name,
        },
      })

      state.videoId = videoResult.video.id

      // Step 2: Initialize upload session
      const chunkSize = 10 * 1024 * 1024 // 10MB chunks
      const initResult = await $fetch<{
        uploadId: string
        totalChunks: number
        chunkSize: number
      }>('/api/videos/upload/init', {
        method: 'POST',
        body: {
          videoId: state.videoId,
          filename: file.name,
          fileSize: file.size,
          chunkSize,
        },
      })

      state.uploadId = initResult.uploadId
      state.totalChunks = initResult.totalChunks
      const actualChunkSize = initResult.chunkSize

      // Step 3: Upload chunks
      const startTime = Date.now()
      let uploadedBytes = 0

      for (let i = 0; i < state.totalChunks; i++) {
        state.currentChunk = i + 1
        const start = i * actualChunkSize
        const end = Math.min(start + actualChunkSize, file.size)
        const chunk = file.slice(start, end)

        const formData = new FormData()
        formData.append('uploadId', state.uploadId!)
        formData.append('chunkIndex', String(i))
        formData.append('chunk', chunk)

        let retries = 0
        const maxRetries = 3

        while (retries <= maxRetries) {
          try {
            await $fetch('/api/videos/upload/chunk', {
              method: 'POST',
              body: formData,
            })
            break
          } catch (err) {
            retries++
            if (retries > maxRetries) throw err
            await new Promise(r => setTimeout(r, 1000 * retries))
          }
        }

        uploadedBytes += end - start
        state.progress = Math.round((uploadedBytes / file.size) * 100)

        // Calculate speed
        const elapsed = (Date.now() - startTime) / 1000
        state.speed = elapsed > 0 ? uploadedBytes / elapsed : 0
      }

      // Step 4: Complete upload
      await $fetch('/api/videos/upload/complete', {
        method: 'POST',
        body: { uploadId: state.uploadId },
      })

      state.progress = 100
      return { videoId: state.videoId }
    } catch (err: any) {
      state.error = err.data?.message || err.message || 'Upload failed'
      throw err
    } finally {
      state.uploading = false
    }
  }

  function formatSpeed(bytesPerSec: number): string {
    if (bytesPerSec === 0) return '0 B/s'
    const k = 1024
    const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s']
    const i = Math.floor(Math.log(bytesPerSec) / Math.log(k))
    return `${parseFloat((bytesPerSec / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
  }

  function formatSize(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }

  function formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    return `${m}:${String(s).padStart(2, '0')}`
  }

  return {
    state: readonly(state),
    uploadVideo,
    formatSpeed,
    formatSize,
    formatDuration,
  }
}
