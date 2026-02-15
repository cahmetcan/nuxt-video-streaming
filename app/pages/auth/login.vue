<script setup lang="ts">
definePageMeta({ layout: 'default' })

const { login, loading, error } = useAuth()

const form = reactive({
  email: '',
  password: '',
})

async function handleSubmit() {
  try {
    await login(form.email, form.password)
  } catch {}
}
</script>

<template>
  <div class="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-sm">
      <!-- Logo -->
      <div class="text-center mb-8">
        <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
          <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-white">Welcome back</h1>
        <p class="text-sm text-[var(--sv-text-tertiary)] mt-1">Sign in to your StreamVault account</p>
      </div>

      <!-- Error -->
      <div v-if="error" class="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
        <p class="text-sm text-red-400">{{ error }}</p>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-[var(--sv-text-secondary)] mb-1.5">Email</label>
          <input
            v-model="form.email"
            type="email"
            required
            placeholder="you@example.com"
            class="w-full px-3 py-2.5 rounded-lg bg-[var(--sv-bg-tertiary)] border border-[var(--sv-border)] text-white text-sm placeholder:text-[var(--sv-text-tertiary)] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
          >
        </div>

        <div>
          <label class="block text-sm font-medium text-[var(--sv-text-secondary)] mb-1.5">Password</label>
          <input
            v-model="form.password"
            type="password"
            required
            placeholder="Enter your password"
            class="w-full px-3 py-2.5 rounded-lg bg-[var(--sv-bg-tertiary)] border border-[var(--sv-border)] text-white text-sm placeholder:text-[var(--sv-text-tertiary)] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
          >
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full sv-btn-primary py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ loading ? 'Signing in...' : 'Sign in' }}
        </button>
      </form>

      <p class="text-center text-sm text-[var(--sv-text-tertiary)] mt-6">
        Don't have an account?
        <NuxtLink to="/auth/register" class="text-indigo-400 hover:text-indigo-300 transition-colors">Create one</NuxtLink>
      </p>
    </div>
  </div>
</template>
