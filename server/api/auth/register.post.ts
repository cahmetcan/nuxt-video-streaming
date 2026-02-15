import { defineEventHandler, readBody, createError } from 'h3'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email, password, name } = body

  if (!email || !password || !name) {
    throw createError({ statusCode: 400, message: 'Email, password, and name are required' })
  }

  if (password.length < 8) {
    throw createError({ statusCode: 400, message: 'Password must be at least 8 characters' })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw createError({ statusCode: 400, message: 'Invalid email address' })
  }

  const db = getDb(event)

  // Check if email already exists
  const existing = await db.prepare('SELECT id FROM users WHERE email = ?').bind(email).first()
  if (existing) {
    throw createError({ statusCode: 409, message: 'Email already registered' })
  }

  const id = generateId()
  const passwordHash = await hashPassword(password)
  const apiKey = generateApiKey()
  const now = new Date().toISOString()

  await db.prepare(`
    INSERT INTO users (id, email, password_hash, name, plan, plan_status, storage_used_bytes, bandwidth_used_bytes, api_key, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'free', 'active', 0, 0, ?, ?, ?)
  `).bind(id, email, passwordHash, name, apiKey, now, now).run()

  // Create JWT
  const config = useRuntimeConfig()
  const token = await createJWT({ sub: id, email, name, plan: 'free' }, config.jwtSecret)
  setAuthCookie(event, token)

  return {
    user: { id, email, name, plan: 'free' },
    token,
  }
})
