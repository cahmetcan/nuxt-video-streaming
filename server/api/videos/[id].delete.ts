import { defineEventHandler, getRouterParam, createError } from 'h3'

export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: 'Video ID is required' })
  }

  const db = getDb(event)
  const r2 = getR2(event)

  const video = await db.prepare(
    'SELECT id, r2_key, r2_hls_prefix, file_size_bytes FROM videos WHERE id = ? AND user_id = ?'
  ).bind(id, auth.sub).first<{
    id: string
    r2_key: string
    r2_hls_prefix: string
    file_size_bytes: number
  }>()

  if (!video) {
    throw createError({ statusCode: 404, message: 'Video not found' })
  }

  // Delete from R2
  try {
    if (video.r2_key) {
      await r2.delete(video.r2_key)
    }
    // Delete HLS segments
    if (video.r2_hls_prefix) {
      const hlsFiles = await r2.list({ prefix: video.r2_hls_prefix })
      if (hlsFiles.objects.length > 0) {
        await r2.delete(hlsFiles.objects.map(o => o.key))
      }
    }
  } catch (e) {
    console.error('Error deleting R2 objects:', e)
  }

  // Soft delete video
  await db.prepare(
    'UPDATE videos SET status = ?, updated_at = ? WHERE id = ?'
  ).bind('deleted', new Date().toISOString(), id).run()

  // Update user storage
  if (video.file_size_bytes) {
    await db.prepare(
      'UPDATE users SET storage_used_bytes = MAX(0, storage_used_bytes - ?) WHERE id = ?'
    ).bind(video.file_size_bytes, auth.sub).run()
  }

  return { success: true }
})
