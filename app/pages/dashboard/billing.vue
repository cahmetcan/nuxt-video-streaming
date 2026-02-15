<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const { user } = useAuth()

const showPaymentModal = ref(false)
const selectedPlan = ref('')
const selectedCurrency = ref('eth')
const billingCycle = ref<'monthly' | 'yearly'>('monthly')
const paymentLoading = ref(false)
const paymentData = ref<any>(null)
const topUpAmount = ref(25)
const paymentType = ref<'subscription' | 'paygo_topup'>('subscription')

const plans = [
  { id: 'free', name: 'Free', monthlyPrice: 0, yearlyPrice: 0, storage: '5 GB', bandwidth: '20 GB' },
  { id: 'starter', name: 'Starter', monthlyPrice: 12, yearlyPrice: 120, storage: '100 GB', bandwidth: '500 GB' },
  { id: 'pro', name: 'Pro', monthlyPrice: 49, yearlyPrice: 490, storage: '1 TB', bandwidth: '5 TB' },
  { id: 'enterprise', name: 'Enterprise', monthlyPrice: 199, yearlyPrice: 1990, storage: '10 TB', bandwidth: '50 TB' },
]

const cryptoCurrencies = [
  { id: 'btc', name: 'Bitcoin', symbol: 'BTC' },
  { id: 'eth', name: 'Ethereum', symbol: 'ETH' },
  { id: 'usdt', name: 'USDT', symbol: 'USDT' },
  { id: 'usdc', name: 'USDC', symbol: 'USDC' },
  { id: 'sol', name: 'Solana', symbol: 'SOL' },
  { id: 'matic', name: 'Polygon', symbol: 'MATIC' },
]

const { data: paymentHistory } = await useFetch('/api/payments/history', {
  default: () => ({ payments: [], pagination: { page: 1, limit: 20, total: 0 } }),
})

function openUpgradeModal(planId: string) {
  selectedPlan.value = planId
  paymentType.value = 'subscription'
  showPaymentModal.value = true
  paymentData.value = null
}

function openTopUpModal() {
  paymentType.value = 'paygo_topup'
  showPaymentModal.value = true
  paymentData.value = null
}

async function createPayment() {
  paymentLoading.value = true
  try {
    const body: any = {
      currency: selectedCurrency.value,
      type: paymentType.value,
    }

    if (paymentType.value === 'subscription') {
      body.planId = selectedPlan.value
      body.billingCycle = billingCycle.value
    } else {
      body.amount = topUpAmount.value
    }

    const result = await $fetch<{ payment: any }>('/api/payments/create', {
      method: 'POST',
      body,
    })

    paymentData.value = result.payment
  } catch (err: any) {
    alert(err.data?.message || 'Payment creation failed')
  } finally {
    paymentLoading.value = false
  }
}

async function confirmPayment() {
  if (!paymentData.value) return
  paymentLoading.value = true
  try {
    await $fetch('/api/payments/verify', {
      method: 'POST',
      body: {
        paymentId: paymentData.value.id,
        txHash: 'simulated-tx-' + Date.now(),
      },
    })
    showPaymentModal.value = false
    paymentData.value = null
    // Refresh page
    window.location.reload()
  } catch (err: any) {
    alert(err.data?.message || 'Verification failed')
  } finally {
    paymentLoading.value = false
  }
}

const currentPlan = computed(() => plans.find(p => p.id === user.value?.plan) || plans[0])
</script>

<template>
  <div>
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-white">Billing</h1>
      <p class="text-sm text-[var(--sv-text-tertiary)] mt-1">Manage your subscription and payments</p>
    </div>

    <!-- Current Plan -->
    <div class="sv-card p-6 mb-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p class="text-xs text-[var(--sv-text-tertiary)] uppercase tracking-wider mb-1">Current Plan</p>
          <p class="text-xl font-bold text-white">{{ currentPlan.name }}</p>
          <p class="text-sm text-[var(--sv-text-secondary)] mt-1">
            {{ currentPlan.storage }} storage &middot; {{ currentPlan.bandwidth }} bandwidth/mo
          </p>
        </div>
        <div class="flex gap-2">
          <button class="sv-btn-secondary text-sm" @click="openTopUpModal">
            Top Up (Pay-as-you-go)
          </button>
        </div>
      </div>
    </div>

    <!-- Plans -->
    <div class="grid md:grid-cols-4 gap-4 mb-8">
      <div
        v-for="plan in plans"
        :key="plan.id"
        class="sv-card p-5"
        :class="plan.id === user?.plan ? 'border-indigo-500/50' : ''"
      >
        <p class="text-sm font-semibold text-white mb-1">{{ plan.name }}</p>
        <p class="text-2xl font-bold text-white sv-mono mb-3">
          ${{ plan.monthlyPrice }}<span class="text-sm text-[var(--sv-text-tertiary)] font-normal">/mo</span>
        </p>
        <p class="text-xs text-[var(--sv-text-tertiary)] mb-4">{{ plan.storage }} &middot; {{ plan.bandwidth }}/mo</p>
        <button
          v-if="plan.id !== user?.plan && plan.id !== 'free'"
          class="sv-btn-primary text-xs w-full"
          @click="openUpgradeModal(plan.id)"
        >
          {{ plan.monthlyPrice > currentPlan.monthlyPrice ? 'Upgrade' : 'Change' }}
        </button>
        <span
          v-else-if="plan.id === user?.plan"
          class="block text-center text-xs text-indigo-400 py-2"
        >
          Current plan
        </span>
      </div>
    </div>

    <!-- Payment History -->
    <div class="sv-card">
      <div class="p-5 border-b border-[var(--sv-border)]">
        <h2 class="text-base font-semibold text-white">Payment History</h2>
      </div>
      <div v-if="!(paymentHistory?.payments as any[])?.length" class="p-12 text-center">
        <p class="text-sm text-[var(--sv-text-tertiary)]">No payments yet</p>
      </div>
      <table v-else class="sv-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Amount</th>
            <th>Currency</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="payment in (paymentHistory?.payments || []) as any[]" :key="payment.id">
            <td class="text-xs">{{ new Date(payment.created_at).toLocaleDateString() }}</td>
            <td class="capitalize text-xs">{{ payment.type }}</td>
            <td class="sv-mono">${{ payment.amount_usd }}</td>
            <td class="uppercase sv-mono text-xs">{{ payment.crypto_currency }}</td>
            <td>
              <span
                class="inline-flex items-center px-2 py-0.5 rounded-full text-xs"
                :class="{
                  'bg-green-500/10 text-green-400': payment.status === 'completed',
                  'bg-yellow-500/10 text-yellow-400': payment.status === 'pending',
                  'bg-red-500/10 text-red-400': payment.status === 'failed',
                }"
              >
                {{ payment.status }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Payment Modal -->
    <Teleport to="body">
      <div v-if="showPaymentModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/60" @click="showPaymentModal = false" />
        <div class="relative sv-card p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-lg font-semibold text-white">
              {{ paymentType === 'subscription' ? 'Upgrade Plan' : 'Top Up Balance' }}
            </h3>
            <button class="text-[var(--sv-text-tertiary)] hover:text-white" @click="showPaymentModal = false">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div v-if="!paymentData">
            <!-- Top-up amount -->
            <div v-if="paymentType === 'paygo_topup'" class="mb-4">
              <label class="block text-sm text-[var(--sv-text-secondary)] mb-1.5">Amount (USD)</label>
              <div class="flex gap-2 mb-2">
                <button
                  v-for="amt in [10, 25, 50, 100]"
                  :key="amt"
                  class="px-3 py-1.5 rounded-lg text-sm"
                  :class="topUpAmount === amt ? 'bg-indigo-500 text-white' : 'bg-[var(--sv-bg-tertiary)] text-[var(--sv-text-secondary)]'"
                  @click="topUpAmount = amt"
                >
                  ${{ amt }}
                </button>
              </div>
              <input
                v-model.number="topUpAmount"
                type="number"
                min="5"
                class="w-full px-3 py-2 rounded-lg bg-[var(--sv-bg-tertiary)] border border-[var(--sv-border)] text-white text-sm focus:outline-none focus:border-indigo-500"
              >
            </div>

            <!-- Billing cycle for subscriptions -->
            <div v-if="paymentType === 'subscription'" class="mb-4">
              <label class="block text-sm text-[var(--sv-text-secondary)] mb-1.5">Billing Cycle</label>
              <div class="flex gap-2">
                <button
                  class="flex-1 px-3 py-2 rounded-lg text-sm"
                  :class="billingCycle === 'monthly' ? 'bg-indigo-500 text-white' : 'bg-[var(--sv-bg-tertiary)] text-[var(--sv-text-secondary)]'"
                  @click="billingCycle = 'monthly'"
                >
                  Monthly
                </button>
                <button
                  class="flex-1 px-3 py-2 rounded-lg text-sm"
                  :class="billingCycle === 'yearly' ? 'bg-indigo-500 text-white' : 'bg-[var(--sv-bg-tertiary)] text-[var(--sv-text-secondary)]'"
                  @click="billingCycle = 'yearly'"
                >
                  Yearly (Save 17%)
                </button>
              </div>
            </div>

            <!-- Cryptocurrency selection -->
            <div class="mb-6">
              <label class="block text-sm text-[var(--sv-text-secondary)] mb-1.5">Pay with</label>
              <div class="grid grid-cols-3 gap-2">
                <button
                  v-for="coin in cryptoCurrencies"
                  :key="coin.id"
                  class="px-3 py-2.5 rounded-lg text-center text-sm transition-all"
                  :class="selectedCurrency === coin.id ? 'bg-indigo-500/20 border border-indigo-500/50 text-white' : 'bg-[var(--sv-bg-tertiary)] border border-[var(--sv-border)] text-[var(--sv-text-secondary)] hover:border-[var(--sv-border-hover)]'"
                  @click="selectedCurrency = coin.id"
                >
                  <span class="block text-xs font-medium">{{ coin.symbol }}</span>
                </button>
              </div>
            </div>

            <button
              class="w-full sv-btn-primary"
              :disabled="paymentLoading"
              @click="createPayment"
            >
              {{ paymentLoading ? 'Creating payment...' : 'Generate Payment Address' }}
            </button>
          </div>

          <!-- Payment address generated -->
          <div v-else class="space-y-4">
            <div class="p-4 rounded-lg bg-[var(--sv-bg-tertiary)] text-center">
              <p class="text-xs text-[var(--sv-text-tertiary)] mb-2">Send exactly</p>
              <p class="text-xl font-bold text-white sv-mono">{{ paymentData.cryptoAmount }} {{ paymentData.cryptoCurrency.toUpperCase() }}</p>
              <p class="text-xs text-[var(--sv-text-tertiary)] mt-1">(~${{ paymentData.amountUsd }} USD)</p>
            </div>

            <div class="p-4 rounded-lg bg-[var(--sv-bg-tertiary)]">
              <p class="text-xs text-[var(--sv-text-tertiary)] mb-2">To this address ({{ paymentData.network }})</p>
              <p class="text-xs text-indigo-400 sv-mono break-all select-all">{{ paymentData.cryptoAddress }}</p>
            </div>

            <div class="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <p class="text-xs text-yellow-400">
                Send the exact amount to the address above. Payment will be confirmed automatically.
              </p>
            </div>

            <button
              class="w-full sv-btn-primary"
              :disabled="paymentLoading"
              @click="confirmPayment"
            >
              {{ paymentLoading ? 'Confirming...' : 'I\'ve sent the payment' }}
            </button>

            <button
              class="w-full sv-btn-secondary text-sm"
              @click="paymentData = null"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
