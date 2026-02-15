import { defineEventHandler } from 'h3'

export default defineEventHandler(() => {
  return {
    plans: PLANS.map(plan => ({
      id: plan.id,
      name: plan.name,
      description: plan.description,
      monthlyPrice: plan.monthlyPrice,
      yearlyPrice: plan.yearlyPrice,
      highlighted: plan.highlighted || false,
      features: plan.features,
    })),
    paygoRates: PAYGO_RATES,
    cryptoCurrencies: CRYPTO_CURRENCIES,
  }
})
