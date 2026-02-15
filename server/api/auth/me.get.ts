import { defineEventHandler } from 'h3'

export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event)
  const db = getDb(event)

  const user = await db.prepare(`
    SELECT id, email, name, avatar_url, plan, plan_status, plan_expires_at,
           storage_used_bytes, bandwidth_used_bytes, bandwidth_reset_at,
           api_key, crypto_wallet_address, created_at
    FROM users WHERE id = ?
  `).bind(auth.sub).first<Record<string, unknown>>()

  if (!user) {
    throw createError({ statusCode: 404, message: 'User not found' })
  }

  // Get video count
  const videoCount = await db.prepare(
    'SELECT COUNT(*) as count FROM videos WHERE user_id = ? AND status != ?'
  ).bind(auth.sub, 'deleted').first<{ count: number }>()

  // Get paygo balance if applicable
  let paygoBalance = null
  if (user.plan === 'paygo') {
    paygoBalance = await db.prepare(
      'SELECT balance_usd, total_deposited_usd, total_spent_usd FROM paygo_balance WHERE user_id = ?'
    ).bind(auth.sub).first()
  }

  return {
    user: {
      ...user,
      videoCount: videoCount?.count || 0,
      paygoBalance,
    },
  }
})
