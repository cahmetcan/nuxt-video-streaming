import { defineEventHandler, getRouterParam, getQuery, createError, setHeader, sendStream } from 'h3'

// Video streaming endpoint with range request support
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'Video ID is required' })
  }

  const db = getDb(event)

  // Get video info
  const video = await db.prepare(`
    SELECT id, r2_key, file_size_bytes, status, visibility, password, user_id
    FROM videos WHERE id = ? AND status = ?
  `).bind(id, 'ready').first<{
    id: string
    r2_key: string
    file_size_bytes: number
    status: string
    visibility: string
    password: string | null
    user_id: string
  }>()

  if (!video) {
    throw createError({ statusCode: 404, message: 'Video not found or not ready' })
  }

  // Check visibility
  if (video.visibility === 'private') {
    // Require auth for private videos
    const token = getCookie(event, 'sv_token') || event.node.req.headers['authorization']?.replace('Bearer ', '')
    if (!token) {
      throw createError({ statusCode: 403, message: 'Private video' })
    }
    const config = useRuntimeConfig()
    const payload = await verifyJWT(token, config.jwtSecret)
    if (!payload || payload.sub !== video.user_id) {
      throw createError({ statusCode: 403, message: 'Access denied' })
    }
  }

  const r2 = getR2(event)
  const rangeHeader = event.node.req.headers.range

  // Increment view count
  await db.prepare(
    'UPDATE videos SET views_count = views_count + 1 WHERE id = ?'
  ).bind(id).run()

  if (rangeHeader) {
    // Handle range requests for seeking
    const [startStr, endStr] = rangeHeader.replace('bytes=', '').split('-')
    const start = parseInt(startStr) || 0
    const end = endStr ? parseInt(endStr) : Math.min(start + 5 * 1024 * 1024 - 1, video.file_size_bytes - 1) // 5MB chunks
    const contentLength = end - start + 1

    const object = await r2.get(video.r2_key, {
      range: { offset: start, length: contentLength },
    })

    if (!object) {
      throw createError({ statusCode: 404, message: 'Video file not found in storage' })
    }

    event.node.res.statusCode = 206
    setHeader(event, 'Content-Type', 'video/mp4')
    setHeader(event, 'Content-Range', `bytes ${start}-${end}/${video.file_size_bytes}`)
    setHeader(event, 'Content-Length', String(contentLength))
    setHeader(event, 'Accept-Ranges', 'bytes')
    setHeader(event, 'Cache-Control', 'public, max-age=86400')

    return sendStream(event, object.body as any)
  }

  // Full file request
  const object = await r2.get(video.r2_key)
  if (!object) {
    throw createError({ statusCode: 404, message: 'Video file not found in storage' })
  }

  setHeader(event, 'Content-Type', 'video/mp4')
  setHeader(event, 'Content-Length', String(video.file_size_bytes))
  setHeader(event, 'Accept-Ranges', 'bytes')
  setHeader(event, 'Cache-Control', 'public, max-age=86400')

  return sendStream(event, object.body as any)
})

function getCookie(event: any, name: string): string | undefined {
  const cookies = event.node.req.headers.cookie || ''
  const match = cookies.match(new RegExp(`${name}=([^;]+)`))
  return match ? match[1] : undefined
}
