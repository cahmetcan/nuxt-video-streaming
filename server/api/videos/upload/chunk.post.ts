import { defineEventHandler, readMultipartFormData, createError } from 'h3'

// Upload a single chunk
export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event)
  const db = getDb(event)
  const r2 = getR2(event)

  const formData = await readMultipartFormData(event)
  if (!formData) {
    throw createError({ statusCode: 400, message: 'No form data provided' })
  }

  let uploadId = ''
  let chunkIndex = -1
  let chunkData: Buffer | null = null

  for (const field of formData) {
    if (field.name === 'uploadId') {
      uploadId = field.data.toString()
    } else if (field.name === 'chunkIndex') {
      chunkIndex = parseInt(field.data.toString())
    } else if (field.name === 'chunk') {
      chunkData = field.data
    }
  }

  if (!uploadId || chunkIndex < 0 || !chunkData) {
    throw createError({ statusCode: 400, message: 'uploadId, chunkIndex, and chunk data are required' })
  }

  // Verify upload session
  const session = await db.prepare(
    'SELECT id, video_id, user_id, total_chunks, status FROM upload_sessions WHERE id = ? AND user_id = ?'
  ).bind(uploadId, auth.sub).first<{
    id: string
    video_id: string
    user_id: string
    total_chunks: number
    status: string
  }>()

  if (!session) {
    throw createError({ statusCode: 404, message: 'Upload session not found' })
  }

  if (session.status !== 'active') {
    throw createError({ statusCode: 400, message: 'Upload session is not active' })
  }

  if (chunkIndex >= session.total_chunks) {
    throw createError({ statusCode: 400, message: 'Chunk index exceeds total chunks' })
  }

  // Store chunk in R2
  const r2Key = chunkR2Key(uploadId, chunkIndex)
  await r2.put(r2Key, chunkData.buffer as ArrayBuffer, {
    httpMetadata: { contentType: 'application/octet-stream' },
    customMetadata: {
      uploadId,
      chunkIndex: String(chunkIndex),
      videoId: session.video_id,
    },
  })

  // Record chunk
  const chunkId = generateId()
  await db.prepare(`
    INSERT INTO upload_chunks (id, upload_id, video_id, chunk_index, chunk_size, r2_key, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 'uploaded', ?)
  `).bind(chunkId, uploadId, session.video_id, chunkIndex, chunkData.length, r2Key, new Date().toISOString()).run()

  // Update session progress
  await db.prepare(
    'UPDATE upload_sessions SET uploaded_chunks = uploaded_chunks + 1 WHERE id = ?'
  ).bind(uploadId).run()

  return {
    success: true,
    chunkIndex,
    size: chunkData.length,
  }
})
