import { defineEventHandler, readBody, createError } from 'h3'

// Webhook endpoint for crypto payment processor callbacks
// This would be called by NOWPayments, CoinGate, BTCPay Server, etc.
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  // Verify webhook signature (implementation depends on payment processor)
  const signature = event.node.req.headers['x-webhook-signature'] as string
  if (config.cryptoWebhookSecret && signature) {
    // In production, verify the HMAC signature
    // const expected = await hmacSign(JSON.stringify(body), config.cryptoWebhookSecret)
    // if (signature !== expected) throw createError({ statusCode: 401, message: 'Invalid signature' })
  }

  const { payment_id, payment_status, pay_address, price_amount, pay_amount, pay_currency, order_id, actually_paid } = body

  if (!payment_id && !order_id) {
    throw createError({ statusCode: 400, message: 'Invalid webhook payload' })
  }

  const db = getDb(event)

  // Find payment by crypto address or order ID
  const paymentLookup = order_id || payment_id
  const payment = await db.prepare(
    'SELECT * FROM payments WHERE id = ? OR crypto_address = ?'
  ).bind(paymentLookup, pay_address || '').first<{
    id: string
    user_id: string
    type: string
    plan: string
    amount_usd: number
    status: string
  }>()

  if (!payment) {
    // Not our payment, ignore
    return { received: true }
  }

  // Map payment processor status to our status
  let newStatus = payment.status
  switch (payment_status) {
    case 'waiting':
    case 'confirming':
      newStatus = 'confirming'
      break
    case 'confirmed':
    case 'sending':
    case 'finished':
      newStatus = 'completed'
      break
    case 'failed':
    case 'expired':
      newStatus = 'failed'
      break
    case 'refunded':
      newStatus = 'refunded'
      break
  }

  const now = new Date().toISOString()

  // Update payment record
  await db.prepare(
    'UPDATE payments SET status = ?, crypto_amount = ?, completed_at = ? WHERE id = ?'
  ).bind(newStatus, String(actually_paid || pay_amount || ''), now, payment.id).run()

  // If completed, activate the plan or add balance
  if (newStatus === 'completed' && payment.status !== 'completed') {
    if (payment.type === 'subscription') {
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      await db.prepare(
        'UPDATE users SET plan = ?, plan_status = ?, plan_expires_at = ?, updated_at = ? WHERE id = ?'
      ).bind(payment.plan, 'active', expiresAt, now, payment.user_id).run()
    } else if (payment.type === 'paygo_topup') {
      const existing = await db.prepare(
        'SELECT user_id FROM paygo_balance WHERE user_id = ?'
      ).bind(payment.user_id).first()

      if (existing) {
        await db.prepare(
          'UPDATE paygo_balance SET balance_usd = balance_usd + ?, total_deposited_usd = total_deposited_usd + ? WHERE user_id = ?'
        ).bind(payment.amount_usd, payment.amount_usd, payment.user_id).run()
      } else {
        await db.prepare(
          'INSERT INTO paygo_balance (user_id, balance_usd, total_deposited_usd, total_spent_usd) VALUES (?, ?, ?, 0)'
        ).bind(payment.user_id, payment.amount_usd, payment.amount_usd).run()
      }

      await db.prepare(
        'UPDATE users SET plan = ?, plan_status = ?, updated_at = ? WHERE id = ?'
      ).bind('paygo', 'active', now, payment.user_id).run()
    }
  }

  return { received: true, status: newStatus }
})
