import { defineEventHandler, readBody, createError } from 'h3'

// Initialize a chunked upload session
export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event)
  const body = await readBody(event)
  const { videoId, filename, fileSize, chunkSize: requestedChunkSize } = body

  if (!videoId || !filename || !fileSize) {
    throw createError({ statusCode: 400, message: 'videoId, filename, and fileSize are required' })
  }

  const db = getDb(event)

  // Verify video exists and belongs to user
  const video = await db.prepare(
    'SELECT id, status FROM videos WHERE id = ? AND user_id = ?'
  ).bind(videoId, auth.sub).first<{ id: string; status: string }>()

  if (!video) {
    throw createError({ statusCode: 404, message: 'Video not found' })
  }

  if (video.status !== 'uploading') {
    throw createError({ statusCode: 400, message: 'Video is not in uploading state' })
  }

  // Validate against plan
  const user = await db.prepare(
    'SELECT plan, storage_used_bytes FROM users WHERE id = ?'
  ).bind(auth.sub).first<{ plan: string; storage_used_bytes: number }>()

  if (user) {
    const plan = getPlan(user.plan)
    if (plan) {
      const check = canUploadVideo(plan, user.storage_used_bytes, fileSize)
      if (!check.allowed) {
        throw createError({ statusCode: 403, message: check.reason })
      }
    }
  }

  // Calculate chunks - default 10MB per chunk, configurable
  const chunkSize = Math.min(requestedChunkSize || 10 * 1024 * 1024, 100 * 1024 * 1024) // max 100MB per chunk
  const totalChunks = Math.ceil(fileSize / chunkSize)

  const uploadId = generateId()
  const now = new Date().toISOString()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours

  await db.prepare(`
    INSERT INTO upload_sessions (id, video_id, user_id, filename, file_size, chunk_size, total_chunks, uploaded_chunks, status, created_at, expires_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 0, 'active', ?, ?)
  `).bind(uploadId, videoId, auth.sub, filename, fileSize, chunkSize, totalChunks, now, expiresAt).run()

  return {
    uploadId,
    videoId,
    chunkSize,
    totalChunks,
    expiresAt,
  }
})
