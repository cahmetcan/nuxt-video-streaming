import { defineEventHandler, readBody, getRouterParam, createError } from 'h3'

export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id) {
    throw createError({ statusCode: 400, message: 'Video ID is required' })
  }

  const db = getDb(event)

  // Verify ownership
  const video = await db.prepare(
    'SELECT id FROM videos WHERE id = ? AND user_id = ?'
  ).bind(id, auth.sub).first()

  if (!video) {
    throw createError({ statusCode: 404, message: 'Video not found' })
  }

  const allowedFields = ['title', 'description', 'visibility', 'category', 'tags', 'password', 'allow_download', 'embed_enabled']
  const updates: string[] = []
  const values: unknown[] = []

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updates.push(`${field} = ?`)
      values.push(body[field])
    }
  }

  if (updates.length === 0) {
    throw createError({ statusCode: 400, message: 'No fields to update' })
  }

  updates.push('updated_at = ?')
  values.push(new Date().toISOString())
  values.push(id)
  values.push(auth.sub)

  await db.prepare(
    `UPDATE videos SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`
  ).bind(...values).run()

  return { success: true }
})
