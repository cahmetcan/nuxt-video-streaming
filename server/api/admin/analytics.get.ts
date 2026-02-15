import { defineEventHandler, getQuery } from 'h3'

export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event)
  const query = getQuery(event)
  const db = getDb(event)

  const videoId = query.videoId as string
  const period = (query.period as string) || '7d'

  let daysBack = 7
  if (period === '24h') daysBack = 1
  else if (period === '30d') daysBack = 30
  else if (period === '90d') daysBack = 90

  const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString()

  let whereClause = 'WHERE va.timestamp > ?'
  const params: unknown[] = [since]

  if (videoId) {
    whereClause += ' AND va.video_id = ?'
    params.push(videoId)
  }

  // Total views in period
  const views = await db.prepare(`
    SELECT COUNT(*) as count FROM video_analytics va
    JOIN videos v ON va.video_id = v.id
    ${whereClause} AND v.user_id = ? AND va.event_type = ?
  `).bind(...params, auth.sub, 'view').first<{ count: number }>()

  // Unique viewers
  const uniqueViewers = await db.prepare(`
    SELECT COUNT(*) as count FROM video_analytics va
    JOIN videos v ON va.video_id = v.id
    ${whereClause} AND v.user_id = ? AND va.event_type = ?
  `).bind(...params, auth.sub, 'view').first<{ count: number }>()

  // Average watch time
  const avgWatchTime = await db.prepare(`
    SELECT AVG(watch_duration_seconds) as avg_time FROM video_analytics va
    JOIN videos v ON va.video_id = v.id
    ${whereClause} AND v.user_id = ? AND va.event_type = ?
  `).bind(...params, auth.sub, 'complete').first<{ avg_time: number }>()

  // Top countries
  const countries = await db.prepare(`
    SELECT country, COUNT(*) as count FROM video_analytics va
    JOIN videos v ON va.video_id = v.id
    ${whereClause} AND v.user_id = ? AND va.event_type = ?
    GROUP BY country ORDER BY count DESC LIMIT 10
  `).bind(...params, auth.sub, 'view').all()

  // Device breakdown
  const devices = await db.prepare(`
    SELECT device, COUNT(*) as count FROM video_analytics va
    JOIN videos v ON va.video_id = v.id
    ${whereClause} AND v.user_id = ? AND va.event_type = ?
    GROUP BY device ORDER BY count DESC
  `).bind(...params, auth.sub, 'view').all()

  return {
    period,
    analytics: {
      totalViews: views?.count || 0,
      uniqueViewers: uniqueViewers?.count || 0,
      avgWatchTime: avgWatchTime?.avg_time || 0,
      countries: countries.results,
      devices: devices.results,
    },
  }
})
