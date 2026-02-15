import { defineEventHandler, getRouterParam, createError } from 'h3'

export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: 'Video ID is required' })
  }

  const db = getDb(event)
  const video = await db.prepare(`
    SELECT * FROM videos WHERE id = ? AND user_id = ? AND status != ?
  `).bind(id, auth.sub, 'deleted').first<Record<string, unknown>>()

  if (!video) {
    throw createError({ statusCode: 404, message: 'Video not found' })
  }

  // Get embed config
  const embedConfig = await db.prepare(
    'SELECT * FROM embed_configs WHERE video_id = ?'
  ).bind(id).first()

  // Get recent analytics
  const recentViews = await db.prepare(`
    SELECT COUNT(*) as count FROM video_analytics
    WHERE video_id = ? AND event_type = ? AND timestamp > ?
  `).bind(id, 'view', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()).first<{ count: number }>()

  return {
    video,
    embedConfig,
    recentViews: recentViews?.count || 0,
  }
})
