import { defineEventHandler, readBody, createError } from 'h3'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email, password } = body

  if (!email || !password) {
    throw createError({ statusCode: 400, message: 'Email and password are required' })
  }

  const db = getDb(event)

  const user = await db.prepare(
    'SELECT id, email, password_hash, name, plan, plan_status FROM users WHERE email = ?'
  ).bind(email).first<{
    id: string
    email: string
    password_hash: string
    name: string
    plan: string
    plan_status: string
  }>()

  if (!user) {
    throw createError({ statusCode: 401, message: 'Invalid email or password' })
  }

  const validPassword = await verifyPassword(password, user.password_hash)
  if (!validPassword) {
    throw createError({ statusCode: 401, message: 'Invalid email or password' })
  }

  const config = useRuntimeConfig()
  const token = await createJWT(
    { sub: user.id, email: user.email, name: user.name, plan: user.plan },
    config.jwtSecret
  )

  setAuthCookie(event, token)

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      plan: user.plan,
      planStatus: user.plan_status,
    },
    token,
  }
})
