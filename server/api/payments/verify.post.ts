import { defineEventHandler, readBody, createError } from 'h3'

// Verify/confirm a crypto payment (in production, this would be called by webhook)
export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event)
  const body = await readBody(event)
  const { paymentId, txHash } = body

  if (!paymentId) {
    throw createError({ statusCode: 400, message: 'paymentId is required' })
  }

  const db = getDb(event)

  const payment = await db.prepare(
    'SELECT * FROM payments WHERE id = ? AND user_id = ?'
  ).bind(paymentId, auth.sub).first<{
    id: string
    user_id: string
    type: string
    plan: string
    amount_usd: number
    status: string
  }>()

  if (!payment) {
    throw createError({ statusCode: 404, message: 'Payment not found' })
  }

  if (payment.status === 'completed') {
    return { success: true, message: 'Payment already confirmed' }
  }

  const now = new Date().toISOString()

  // Update payment status
  await db.prepare(
    'UPDATE payments SET status = ?, crypto_tx_hash = ?, completed_at = ? WHERE id = ?'
  ).bind('completed', txHash || '', now, paymentId).run()

  // Apply the plan or top-up
  if (payment.type === 'subscription') {
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
    await db.prepare(
      'UPDATE users SET plan = ?, plan_status = ?, plan_expires_at = ?, updated_at = ? WHERE id = ?'
    ).bind(payment.plan, 'active', expiresAt, now, auth.sub).run()
  } else if (payment.type === 'paygo_topup') {
    // Check if paygo balance exists
    const existing = await db.prepare(
      'SELECT user_id FROM paygo_balance WHERE user_id = ?'
    ).bind(auth.sub).first()

    if (existing) {
      await db.prepare(
        'UPDATE paygo_balance SET balance_usd = balance_usd + ?, total_deposited_usd = total_deposited_usd + ? WHERE user_id = ?'
      ).bind(payment.amount_usd, payment.amount_usd, auth.sub).run()
    } else {
      await db.prepare(
        'INSERT INTO paygo_balance (user_id, balance_usd, total_deposited_usd, total_spent_usd) VALUES (?, ?, ?, 0)'
      ).bind(auth.sub, payment.amount_usd, payment.amount_usd).run()
    }

    // Update user plan to paygo if not already
    await db.prepare(
      'UPDATE users SET plan = ?, plan_status = ?, updated_at = ? WHERE id = ?'
    ).bind('paygo', 'active', now, auth.sub).run()
  }

  return {
    success: true,
    payment: {
      id: paymentId,
      status: 'completed',
      plan: payment.plan,
    },
  }
})
