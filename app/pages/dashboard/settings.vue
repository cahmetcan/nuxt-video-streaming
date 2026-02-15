<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const { user, logout } = useAuth()

const profile = reactive({
  name: user.value?.name || '',
  email: user.value?.email || '',
})

const saving = ref(false)
const saved = ref(false)

async function saveProfile() {
  saving.value = true
  saved.value = false
  try {
    // In production, this would call an API
    await new Promise(r => setTimeout(r, 500))
    saved.value = true
    setTimeout(() => saved.value = false, 3000)
  } finally {
    saving.value = false
  }
}

function formatBytes(bytes: number): string {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}
</script>

<template>
  <div class="max-w-2xl">
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-white">Settings</h1>
      <p class="text-sm text-[var(--sv-text-tertiary)] mt-1">Manage your account settings</p>
    </div>

    <!-- Profile -->
    <div class="sv-card p-6 mb-6">
      <h3 class="text-base font-semibold text-white mb-4">Profile</h3>

      <div class="flex items-center gap-4 mb-6">
        <div class="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
          <span class="text-xl font-bold text-white">{{ user?.name?.[0]?.toUpperCase() || 'U' }}</span>
        </div>
        <div>
          <p class="text-sm font-medium text-white">{{ user?.name }}</p>
          <p class="text-xs text-[var(--sv-text-tertiary)]">{{ user?.email }}</p>
          <p class="text-xs text-indigo-400 capitalize mt-0.5">{{ user?.plan }} plan</p>
        </div>
      </div>

      <div class="space-y-4">
        <div>
          <label class="block text-sm text-[var(--sv-text-secondary)] mb-1.5">Name</label>
          <input
            v-model="profile.name"
            type="text"
            class="w-full px-3 py-2.5 rounded-lg bg-[var(--sv-bg-tertiary)] border border-[var(--sv-border)] text-white text-sm focus:outline-none focus:border-indigo-500"
          >
        </div>

        <div>
          <label class="block text-sm text-[var(--sv-text-secondary)] mb-1.5">Email</label>
          <input
            v-model="profile.email"
            type="email"
            class="w-full px-3 py-2.5 rounded-lg bg-[var(--sv-bg-tertiary)] border border-[var(--sv-border)] text-white text-sm focus:outline-none focus:border-indigo-500"
          >
        </div>

        <div class="flex items-center gap-3">
          <button
            class="sv-btn-primary text-sm"
            :disabled="saving"
            @click="saveProfile"
          >
            {{ saving ? 'Saving...' : 'Save Changes' }}
          </button>
          <span v-if="saved" class="text-xs text-green-400">Saved successfully</span>
        </div>
      </div>
    </div>

    <!-- Usage -->
    <div class="sv-card p-6 mb-6">
      <h3 class="text-base font-semibold text-white mb-4">Usage</h3>

      <div class="space-y-4">
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-sm text-[var(--sv-text-secondary)]">Storage</span>
            <span class="text-sm text-white sv-mono">{{ formatBytes(user?.storageUsedBytes || 0) }}</span>
          </div>
          <div class="sv-progress-bar">
            <div class="sv-progress-fill" style="width: 0%" />
          </div>
        </div>

        <div>
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-sm text-[var(--sv-text-secondary)]">Bandwidth (this month)</span>
            <span class="text-sm text-white sv-mono">{{ formatBytes(user?.bandwidthUsedBytes || 0) }}</span>
          </div>
          <div class="sv-progress-bar">
            <div class="sv-progress-fill" style="width: 0%" />
          </div>
        </div>
      </div>
    </div>

    <!-- Danger Zone -->
    <div class="sv-card p-6 border-red-500/20">
      <h3 class="text-base font-semibold text-red-400 mb-4">Danger Zone</h3>
      <p class="text-sm text-[var(--sv-text-tertiary)] mb-4">
        Signing out will end your current session.
      </p>
      <button class="px-4 py-2 rounded-lg border border-red-500/30 text-sm text-red-400 hover:bg-red-500/10 transition-colors" @click="logout">
        Sign out
      </button>
    </div>
  </div>
</template>
