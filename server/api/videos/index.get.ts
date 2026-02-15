import { defineEventHandler, getQuery } from 'h3'

export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event)
  const query = getQuery(event)
  const db = getDb(event)

  const page = parseInt(query.page as string) || 1
  const limit = Math.min(parseInt(query.limit as string) || 20, 100)
  const offset = (page - 1) * limit
  const status = query.status as string
  const search = query.search as string
  const sort = query.sort as string || 'created_at'
  const order = query.order as string || 'DESC'

  let whereClause = 'WHERE user_id = ? AND status != ?'
  const params: unknown[] = [auth.sub, 'deleted']

  if (status && status !== 'all') {
    whereClause += ' AND status = ?'
    params.push(status)
  }

  if (search) {
    whereClause += ' AND title LIKE ?'
    params.push(`%${search}%`)
  }

  // Get total count
  const countResult = await db.prepare(
    `SELECT COUNT(*) as count FROM videos ${whereClause}`
  ).bind(...params).first<{ count: number }>()

  // Get videos
  const validSorts = ['created_at', 'title', 'views_count', 'file_size_bytes', 'duration_seconds']
  const sortCol = validSorts.includes(sort) ? sort : 'created_at'
  const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'

  const videos = await db.prepare(`
    SELECT id, title, description, slug, status, visibility, thumbnail_url,
           duration_seconds, file_size_bytes, width, height, views_count,
           unique_viewers, total_watch_time_seconds, category, tags,
           allow_download, embed_enabled, created_at, updated_at
    FROM videos ${whereClause}
    ORDER BY ${sortCol} ${sortOrder}
    LIMIT ? OFFSET ?
  `).bind(...params, limit, offset).all<Record<string, unknown>>()

  return {
    videos: videos.results,
    pagination: {
      page,
      limit,
      total: countResult?.count || 0,
      totalPages: Math.ceil((countResult?.count || 0) / limit),
    },
  }
})
