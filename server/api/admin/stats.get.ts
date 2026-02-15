import { defineEventHandler } from 'h3'

export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event)
  const db = getDb(event)

  // Get user's dashboard statistics
  const totalVideos = await db.prepare(
    'SELECT COUNT(*) as count FROM videos WHERE user_id = ? AND status != ?'
  ).bind(auth.sub, 'deleted').first<{ count: number }>()

  const totalViews = await db.prepare(
    'SELECT SUM(views_count) as total FROM videos WHERE user_id = ? AND status != ?'
  ).bind(auth.sub, 'deleted').first<{ total: number }>()

  const totalStorage = await db.prepare(
    'SELECT storage_used_bytes FROM users WHERE id = ?'
  ).bind(auth.sub).first<{ storage_used_bytes: number }>()

  const totalBandwidth = await db.prepare(
    'SELECT bandwidth_used_bytes FROM users WHERE id = ?'
  ).bind(auth.sub).first<{ bandwidth_used_bytes: number }>()

  // Recent views (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const recentViews = await db.prepare(`
    SELECT COUNT(*) as count FROM video_analytics
    WHERE video_id IN (SELECT id FROM videos WHERE user_id = ?)
    AND event_type = ? AND timestamp > ?
  `).bind(auth.sub, 'view', sevenDaysAgo).first<{ count: number }>()

  // Top videos
  const topVideos = await db.prepare(`
    SELECT id, title, views_count, duration_seconds, created_at
    FROM videos WHERE user_id = ? AND status = ?
    ORDER BY views_count DESC LIMIT 5
  `).bind(auth.sub, 'ready').all()

  // Recent uploads
  const recentUploads = await db.prepare(`
    SELECT id, title, status, file_size_bytes, created_at
    FROM videos WHERE user_id = ? AND status != ?
    ORDER BY created_at DESC LIMIT 5
  `).bind(auth.sub, 'deleted').all()

  return {
    stats: {
      totalVideos: totalVideos?.count || 0,
      totalViews: totalViews?.total || 0,
      storageUsed: totalStorage?.storage_used_bytes || 0,
      bandwidthUsed: totalBandwidth?.bandwidth_used_bytes || 0,
      recentViews: recentViews?.count || 0,
    },
    topVideos: topVideos.results,
    recentUploads: recentUploads.results,
  }
})
