import { defineEventHandler, readBody, createError } from 'h3'

export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event)
  const body = await readBody(event)
  const { title, description, visibility, category, tags, fileSize, filename } = body

  if (!title) {
    throw createError({ statusCode: 400, message: 'Title is required' })
  }

  const db = getDb(event)

  // Get user plan info
  const user = await db.prepare(
    'SELECT plan, storage_used_bytes FROM users WHERE id = ?'
  ).bind(auth.sub).first<{ plan: string; storage_used_bytes: number }>()

  if (!user) {
    throw createError({ statusCode: 404, message: 'User not found' })
  }

  // Check plan limits
  const plan = getPlan(user.plan)
  if (plan && fileSize) {
    const check = canUploadVideo(plan, user.storage_used_bytes, fileSize)
    if (!check.allowed) {
      throw createError({ statusCode: 403, message: check.reason })
    }
  }

  // Check video count limit
  if (plan && plan.features.maxVideos > 0) {
    const countResult = await db.prepare(
      'SELECT COUNT(*) as count FROM videos WHERE user_id = ? AND status != ?'
    ).bind(auth.sub, 'deleted').first<{ count: number }>()

    if (countResult && countResult.count >= plan.features.maxVideos) {
      throw createError({ statusCode: 403, message: `Video limit reached. Your plan allows ${plan.features.maxVideos} videos.` })
    }
  }

  const id = generateId()
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + id.slice(0, 8)
  const now = new Date().toISOString()

  await db.prepare(`
    INSERT INTO videos (id, user_id, title, description, slug, status, visibility, category, tags, file_size_bytes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'uploading', ?, ?, ?, ?, ?, ?)
  `).bind(id, auth.sub, title, description || '', slug, visibility || 'private', category || '', tags || '', fileSize || 0, now, now).run()

  return {
    video: {
      id,
      slug,
      title,
      status: 'uploading',
    },
  }
})
