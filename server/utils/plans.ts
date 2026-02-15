// StreamVault SaaS Plans Configuration

export interface Plan {
  id: string
  name: string
  description: string
  monthlyPrice: number
  yearlyPrice: number
  features: PlanFeatures
  highlighted?: boolean
}

export interface PlanFeatures {
  maxStorageGb: number
  maxBandwidthGb: number
  maxVideoSizeMb: number
  maxVideos: number
  maxResolution: string
  hlsEnabled: boolean
  embedEnabled: boolean
  customPlayer: boolean
  analytics: 'basic' | 'advanced' | 'full'
  apiAccess: boolean
  prioritySupport: boolean
  customDomain: boolean
  passwordProtection: boolean
  whitelabel: boolean
}

export interface PaygoRates {
  storagePerGbMonth: number
  bandwidthPerGb: number
  transcodePerMinute: number
  apiCallPer1000: number
}

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Get started with basic video hosting',
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: {
      maxStorageGb: 5,
      maxBandwidthGb: 20,
      maxVideoSizeMb: 500,
      maxVideos: 10,
      maxResolution: '720p',
      hlsEnabled: true,
      embedEnabled: true,
      customPlayer: false,
      analytics: 'basic',
      apiAccess: false,
      prioritySupport: false,
      customDomain: false,
      passwordProtection: false,
      whitelabel: false,
    },
  },
  {
    id: 'starter',
    name: 'Starter',
    description: 'For creators getting serious about video',
    monthlyPrice: 12,
    yearlyPrice: 120,
    features: {
      maxStorageGb: 100,
      maxBandwidthGb: 500,
      maxVideoSizeMb: 5120,
      maxVideos: 200,
      maxResolution: '1080p',
      hlsEnabled: true,
      embedEnabled: true,
      customPlayer: true,
      analytics: 'advanced',
      apiAccess: true,
      prioritySupport: false,
      customDomain: false,
      passwordProtection: true,
      whitelabel: false,
    },
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For professionals and growing businesses',
    monthlyPrice: 49,
    yearlyPrice: 490,
    highlighted: true,
    features: {
      maxStorageGb: 1000,
      maxBandwidthGb: 5000,
      maxVideoSizeMb: 20480,
      maxVideos: -1, // unlimited
      maxResolution: '4K',
      hlsEnabled: true,
      embedEnabled: true,
      customPlayer: true,
      analytics: 'full',
      apiAccess: true,
      prioritySupport: true,
      customDomain: true,
      passwordProtection: true,
      whitelabel: true,
    },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large-scale video operations',
    monthlyPrice: 199,
    yearlyPrice: 1990,
    features: {
      maxStorageGb: 10000,
      maxBandwidthGb: 50000,
      maxVideoSizeMb: 102400,
      maxVideos: -1,
      maxResolution: '4K',
      hlsEnabled: true,
      embedEnabled: true,
      customPlayer: true,
      analytics: 'full',
      apiAccess: true,
      prioritySupport: true,
      customDomain: true,
      passwordProtection: true,
      whitelabel: true,
    },
  },
]

export const PAYGO_RATES: PaygoRates = {
  storagePerGbMonth: 0.015,
  bandwidthPerGb: 0.05,
  transcodePerMinute: 0.02,
  apiCallPer1000: 0.01,
}

export const CRYPTO_CURRENCIES = [
  { id: 'btc', name: 'Bitcoin', symbol: 'BTC', icon: '₿', network: 'bitcoin' },
  { id: 'eth', name: 'Ethereum', symbol: 'ETH', icon: 'Ξ', network: 'ethereum' },
  { id: 'usdt', name: 'Tether', symbol: 'USDT', icon: '$', network: 'ethereum' },
  { id: 'usdc', name: 'USD Coin', symbol: 'USDC', icon: '$', network: 'ethereum' },
  { id: 'sol', name: 'Solana', symbol: 'SOL', icon: '◎', network: 'solana' },
  { id: 'matic', name: 'Polygon', symbol: 'MATIC', icon: '⬡', network: 'polygon' },
] as const

export function getPlan(planId: string): Plan | undefined {
  return PLANS.find(p => p.id === planId)
}

export function canUploadVideo(plan: Plan, currentStorageBytes: number, fileSizeBytes: number): { allowed: boolean; reason?: string } {
  const maxStorageBytes = plan.features.maxStorageGb * 1024 * 1024 * 1024
  const maxFileSizeBytes = plan.features.maxVideoSizeMb * 1024 * 1024

  if (fileSizeBytes > maxFileSizeBytes) {
    return { allowed: false, reason: `File size exceeds plan limit of ${plan.features.maxVideoSizeMb}MB` }
  }

  if (currentStorageBytes + fileSizeBytes > maxStorageBytes) {
    return { allowed: false, reason: `Upload would exceed storage limit of ${plan.features.maxStorageGb}GB` }
  }

  return { allowed: true }
}

export function calculatePaygoCost(type: keyof PaygoRates, amount: number): number {
  return PAYGO_RATES[type] * amount
}
