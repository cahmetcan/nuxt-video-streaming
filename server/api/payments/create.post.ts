import { defineEventHandler, readBody, createError } from 'h3'

// Create a crypto payment for subscription or top-up
export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event)
  const body = await readBody(event)
  const { planId, billingCycle, currency, amount, type } = body

  if (!currency) {
    throw createError({ statusCode: 400, message: 'Currency is required' })
  }

  const validCurrency = CRYPTO_CURRENCIES.find(c => c.id === currency)
  if (!validCurrency) {
    throw createError({ statusCode: 400, message: 'Invalid cryptocurrency' })
  }

  const db = getDb(event)
  let amountUsd = 0
  let paymentType = type || 'subscription'
  let plan = ''

  if (paymentType === 'subscription') {
    if (!planId) {
      throw createError({ statusCode: 400, message: 'planId is required for subscription' })
    }

    const selectedPlan = PLANS.find(p => p.id === planId)
    if (!selectedPlan || selectedPlan.id === 'free') {
      throw createError({ statusCode: 400, message: 'Invalid plan' })
    }

    amountUsd = billingCycle === 'yearly' ? selectedPlan.yearlyPrice : selectedPlan.monthlyPrice
    plan = planId
  } else if (paymentType === 'paygo_topup') {
    if (!amount || amount < 5) {
      throw createError({ statusCode: 400, message: 'Minimum top-up is $5' })
    }
    amountUsd = amount
    plan = 'paygo'
  } else {
    throw createError({ statusCode: 400, message: 'Invalid payment type' })
  }

  const paymentId = generateId()
  const paymentAddress = getPaymentAddress(validCurrency.network)

  // Estimate crypto amount (in production, use a real-time price oracle)
  const cryptoAmount = estimateCryptoAmount(amountUsd, currency)

  const now = new Date().toISOString()
  await db.prepare(`
    INSERT INTO payments (id, user_id, type, plan, amount_usd, crypto_currency, crypto_amount, crypto_address, payment_provider, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'crypto', 'pending', ?)
  `).bind(paymentId, auth.sub, paymentType, plan, amountUsd, currency, cryptoAmount, paymentAddress, now).run()

  return {
    payment: {
      id: paymentId,
      type: paymentType,
      plan,
      amountUsd,
      cryptoCurrency: currency,
      cryptoAmount,
      cryptoAddress: paymentAddress,
      network: validCurrency.network,
      status: 'pending',
      // Payment expires in 30 minutes
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    },
  }
})

function getPaymentAddress(network: string): string {
  const config = useRuntimeConfig()
  const addressMap: Record<string, string> = {
    bitcoin: config.cryptoAddressBtc,
    ethereum: config.cryptoAddressEth,
    polygon: config.cryptoAddressEth,
    solana: config.cryptoAddressSol,
  }
  const address = addressMap[network]
  if (!address) {
    throw createError({ statusCode: 500, message: 'Payment address not configured for this network' })
  }
  return address
}

function estimateCryptoAmount(usd: number, currency: string): string {
  // Placeholder exchange rates - in production, use CoinGecko/CoinMarketCap API
  const rates: Record<string, number> = {
    btc: 97000,
    eth: 3200,
    usdt: 1,
    usdc: 1,
    sol: 180,
    matic: 0.85,
  }

  const rate = rates[currency] || 1
  const amount = usd / rate

  // Format to appropriate decimal places
  if (currency === 'btc') return amount.toFixed(8)
  if (currency === 'eth' || currency === 'sol') return amount.toFixed(6)
  return amount.toFixed(2)
}
