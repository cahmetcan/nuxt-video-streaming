import { defineEventHandler, getQuery } from 'h3'

export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event)
  const query = getQuery(event)
  const db = getDb(event)

  const page = parseInt(query.page as string) || 1
  const limit = Math.min(parseInt(query.limit as string) || 20, 50)
  const offset = (page - 1) * limit

  const payments = await db.prepare(`
    SELECT id, type, plan, amount_usd, crypto_currency, crypto_amount, crypto_tx_hash, status, created_at, completed_at
    FROM payments WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).bind(auth.sub, limit, offset).all()

  const total = await db.prepare(
    'SELECT COUNT(*) as count FROM payments WHERE user_id = ?'
  ).bind(auth.sub).first<{ count: number }>()

  return {
    payments: payments.results,
    pagination: {
      page,
      limit,
      total: total?.count || 0,
    },
  }
})
