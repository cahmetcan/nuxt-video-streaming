import { defineEventHandler, readBody, createError } from 'h3'

// Complete a chunked upload - merge chunks and finalize
export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event)
  const body = await readBody(event)
  const { uploadId } = body

  if (!uploadId) {
    throw createError({ statusCode: 400, message: 'uploadId is required' })
  }

  const db = getDb(event)
  const r2 = getR2(event)

  // Verify upload session
  const session = await db.prepare(`
    SELECT id, video_id, user_id, filename, file_size, total_chunks, uploaded_chunks, status
    FROM upload_sessions WHERE id = ? AND user_id = ?
  `).bind(uploadId, auth.sub).first<{
    id: string
    video_id: string
    user_id: string
    filename: string
    file_size: number
    total_chunks: number
    uploaded_chunks: number
    status: string
  }>()

  if (!session) {
    throw createError({ statusCode: 404, message: 'Upload session not found' })
  }

  if (session.status !== 'active') {
    throw createError({ statusCode: 400, message: 'Upload session is not active' })
  }

  if (session.uploaded_chunks < session.total_chunks) {
    throw createError({
      statusCode: 400,
      message: `Upload incomplete: ${session.uploaded_chunks}/${session.total_chunks} chunks uploaded`,
    })
  }

  // Merge chunks into a single file
  const chunks: ArrayBuffer[] = []
  for (let i = 0; i < session.total_chunks; i++) {
    const key = chunkR2Key(uploadId, i)
    const chunk = await r2.get(key)
    if (!chunk) {
      throw createError({ statusCode: 500, message: `Missing chunk ${i}` })
    }
    chunks.push(await chunk.arrayBuffer())
  }

  // Combine chunks
  const totalSize = chunks.reduce((sum, c) => sum + c.byteLength, 0)
  const combined = new Uint8Array(totalSize)
  let offset = 0
  for (const chunk of chunks) {
    combined.set(new Uint8Array(chunk), offset)
    offset += chunk.byteLength
  }

  // Store merged file in R2
  const finalKey = videoR2Key(auth.sub, session.video_id, session.filename)
  await r2.put(finalKey, combined.buffer as ArrayBuffer, {
    httpMetadata: {
      contentType: getContentType(session.filename),
      cacheControl: 'public, max-age=31536000',
    },
    customMetadata: {
      videoId: session.video_id,
      userId: auth.sub,
      originalFilename: session.filename,
    },
  })

  // Clean up chunk files
  for (let i = 0; i < session.total_chunks; i++) {
    const key = chunkR2Key(uploadId, i)
    await r2.delete(key)
  }

  // Update video record
  const now = new Date().toISOString()
  await db.prepare(`
    UPDATE videos SET status = 'processing', r2_key = ?, file_size_bytes = ?, updated_at = ?
    WHERE id = ?
  `).bind(finalKey, totalSize, now, session.video_id).run()

  // Update upload session
  await db.prepare(
    'UPDATE upload_sessions SET status = ? WHERE id = ?'
  ).bind('completed', uploadId).run()

  // Update user storage
  await db.prepare(
    'UPDATE users SET storage_used_bytes = storage_used_bytes + ? WHERE id = ?'
  ).bind(totalSize, auth.sub).run()

  // Simulate processing completion (in production, this would trigger a Worker)
  // For now, mark as ready after upload
  setTimeout(async () => {
    await db.prepare(
      'UPDATE videos SET status = ?, updated_at = ? WHERE id = ?'
    ).bind('ready', new Date().toISOString(), session.video_id).run()
  }, 2000)

  return {
    success: true,
    video: {
      id: session.video_id,
      r2Key: finalKey,
      fileSize: totalSize,
      status: 'processing',
    },
  }
})
