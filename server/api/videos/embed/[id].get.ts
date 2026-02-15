import { defineEventHandler, getRouterParam, createError } from 'h3'

export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: 'Video ID is required' })
  }

  const db = getDb(event)

  // Verify ownership
  const video = await db.prepare(
    'SELECT id, title, embed_enabled FROM videos WHERE id = ? AND user_id = ?'
  ).bind(id, auth.sub).first()

  if (!video) {
    throw createError({ statusCode: 404, message: 'Video not found' })
  }

  // Get or create embed config
  let config = await db.prepare(
    'SELECT * FROM embed_configs WHERE video_id = ?'
  ).bind(id).first()

  if (!config) {
    const configId = generateId()
    await db.prepare(`
      INSERT INTO embed_configs (id, video_id, user_id, autoplay, muted, loop, controls, branding, color, responsive, created_at)
      VALUES (?, ?, ?, 0, 0, 0, 1, 1, '#6366f1', 1, ?)
    `).bind(configId, id, auth.sub, new Date().toISOString()).run()

    config = {
      id: configId,
      video_id: id,
      autoplay: 0,
      muted: 0,
      loop: 0,
      controls: 1,
      branding: 1,
      color: '#6366f1',
      responsive: 1,
    }
  }

  const runtimeConfig = useRuntimeConfig()
  const workerUrl = runtimeConfig.public.workerUrl

  // Generate embed code
  const embedCode = `<iframe src="${workerUrl}/embed/${id}" width="100%" height="100%" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen style="aspect-ratio:16/9;max-width:100%;"></iframe>`

  // Direct link
  const directLink = `${workerUrl}/stream/${id}`

  // HLS link
  const hlsLink = `${workerUrl}/hls/${id}/master.m3u8`

  return {
    config,
    embedCode,
    directLink,
    hlsLink,
  }
})
