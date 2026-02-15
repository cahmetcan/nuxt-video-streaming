import { H3Event } from 'h3'

// R2 Storage utility
// Uses S3-compatible API to interact with Cloudflare R2

export interface R2Bucket {
  put(key: string, value: ReadableStream | ArrayBuffer | string, options?: R2PutOptions): Promise<R2Object>
  get(key: string, options?: R2GetOptions): Promise<R2ObjectBody | null>
  delete(key: string | string[]): Promise<void>
  list(options?: R2ListOptions): Promise<R2Objects>
  head(key: string): Promise<R2Object | null>
}

interface R2PutOptions {
  httpMetadata?: {
    contentType?: string
    contentDisposition?: string
    cacheControl?: string
  }
  customMetadata?: Record<string, string>
}

interface R2GetOptions {
  range?: { offset: number; length?: number } | { suffix: number }
}

interface R2Object {
  key: string
  size: number
  etag: string
  httpMetadata?: Record<string, string>
  customMetadata?: Record<string, string>
  uploaded: Date
}

interface R2ObjectBody extends R2Object {
  body: ReadableStream
  arrayBuffer(): Promise<ArrayBuffer>
  text(): Promise<string>
}

interface R2ListOptions {
  prefix?: string
  limit?: number
  cursor?: string
  delimiter?: string
}

interface R2Objects {
  objects: R2Object[]
  truncated: boolean
  cursor?: string
}

// Development in-memory R2 mock
const memoryBucket: Map<string, { data: ArrayBuffer; metadata: Record<string, string> }> = new Map()

class MemoryR2Bucket implements R2Bucket {
  async put(key: string, value: ReadableStream | ArrayBuffer | string, options?: R2PutOptions): Promise<R2Object> {
    let data: ArrayBuffer
    if (typeof value === 'string') {
      data = new TextEncoder().encode(value).buffer as ArrayBuffer
    } else if (value instanceof ArrayBuffer) {
      data = value
    } else {
      // ReadableStream
      const reader = value.getReader()
      const chunks: Uint8Array[] = []
      while (true) {
        const { done, value: chunk } = await reader.read()
        if (done) break
        chunks.push(chunk)
      }
      const totalLength = chunks.reduce((acc, c) => acc + c.length, 0)
      const result = new Uint8Array(totalLength)
      let offset = 0
      for (const chunk of chunks) {
        result.set(chunk, offset)
        offset += chunk.length
      }
      data = result.buffer as ArrayBuffer
    }

    memoryBucket.set(key, {
      data,
      metadata: options?.httpMetadata || {},
    })

    return {
      key,
      size: data.byteLength,
      etag: crypto.randomUUID(),
      httpMetadata: options?.httpMetadata,
      customMetadata: options?.customMetadata,
      uploaded: new Date(),
    }
  }

  async get(key: string, options?: R2GetOptions): Promise<R2ObjectBody | null> {
    const item = memoryBucket.get(key)
    if (!item) return null

    let data = item.data
    if (options?.range && 'offset' in options.range) {
      const { offset, length } = options.range
      data = data.slice(offset, length ? offset + length : undefined)
    }

    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array(data))
        controller.close()
      },
    })

    return {
      key,
      size: item.data.byteLength,
      etag: 'dev-etag',
      httpMetadata: item.metadata,
      uploaded: new Date(),
      body,
      async arrayBuffer() { return data },
      async text() { return new TextDecoder().decode(data) },
    }
  }

  async delete(key: string | string[]): Promise<void> {
    const keys = Array.isArray(key) ? key : [key]
    for (const k of keys) {
      memoryBucket.delete(k)
    }
  }

  async list(options?: R2ListOptions): Promise<R2Objects> {
    const objects: R2Object[] = []
    for (const [key, item] of memoryBucket) {
      if (options?.prefix && !key.startsWith(options.prefix)) continue
      objects.push({
        key,
        size: item.data.byteLength,
        etag: 'dev-etag',
        uploaded: new Date(),
      })
      if (options?.limit && objects.length >= options.limit) break
    }
    return { objects, truncated: false }
  }

  async head(key: string): Promise<R2Object | null> {
    const item = memoryBucket.get(key)
    if (!item) return null
    return {
      key,
      size: item.data.byteLength,
      etag: 'dev-etag',
      uploaded: new Date(),
    }
  }
}

let devBucket: R2Bucket | null = null

export function getR2(event?: H3Event): R2Bucket {
  // In Cloudflare Pages/Workers, R2 is available through platform bindings
  if (event) {
    const cf = (event.context as any).cloudflare
    if (cf?.env?.R2_BUCKET) {
      return cf.env.R2_BUCKET as R2Bucket
    }
  }

  // Development fallback
  if (!devBucket) {
    devBucket = new MemoryR2Bucket()
  }
  return devBucket
}

// Helper: Get content type from filename
export function getContentType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase()
  const types: Record<string, string> = {
    mp4: 'video/mp4',
    webm: 'video/webm',
    mkv: 'video/x-matroska',
    avi: 'video/x-msvideo',
    mov: 'video/quicktime',
    m3u8: 'application/vnd.apple.mpegurl',
    ts: 'video/mp2t',
    m4s: 'video/iso.segment',
    mpd: 'application/dash+xml',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
  }
  return types[ext || ''] || 'application/octet-stream'
}

// Helper: Generate R2 key for video
export function videoR2Key(userId: string, videoId: string, filename: string): string {
  return `videos/${userId}/${videoId}/${filename}`
}

// Helper: Generate R2 prefix for HLS segments
export function hlsR2Prefix(userId: string, videoId: string): string {
  return `videos/${userId}/${videoId}/hls/`
}

// Helper: Generate R2 key for thumbnail
export function thumbnailR2Key(userId: string, videoId: string): string {
  return `videos/${userId}/${videoId}/thumbnail.jpg`
}

// Helper: Generate R2 key for chunk
export function chunkR2Key(uploadId: string, chunkIndex: number): string {
  return `uploads/${uploadId}/chunk_${String(chunkIndex).padStart(6, '0')}`
}

// Helper: Format bytes for display
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}
