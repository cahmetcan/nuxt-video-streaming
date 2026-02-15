<script setup lang="ts">
const { isAuthenticated, user, logout } = useAuth()
const route = useRoute()

const isDashboard = computed(() => route.path.startsWith('/dashboard'))
const showMobileMenu = ref(false)

const navLinks = [
  { label: 'Features', to: '/#features' },
  { label: 'Pricing', to: '/pricing' },
  { label: 'Docs', to: '/docs' },
]
</script>

<template>
  <div class="min-h-screen bg-[var(--sv-bg-primary)]">
    <!-- Top Navigation -->
    <header v-if="!isDashboard" class="fixed top-0 left-0 right-0 z-50 sv-glass">
      <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <!-- Logo -->
        <NuxtLink to="/" class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <span class="text-lg font-semibold text-white">StreamVault</span>
        </NuxtLink>

        <!-- Desktop Nav -->
        <div class="hidden md:flex items-center gap-8">
          <NuxtLink
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            class="text-sm text-[var(--sv-text-secondary)] hover:text-white transition-colors"
          >
            {{ link.label }}
          </NuxtLink>
        </div>

        <!-- Auth Buttons -->
        <div class="hidden md:flex items-center gap-3">
          <template v-if="isAuthenticated">
            <NuxtLink
              to="/dashboard"
              class="sv-btn-secondary text-sm"
            >
              Dashboard
            </NuxtLink>
          </template>
          <template v-else>
            <NuxtLink
              to="/auth/login"
              class="text-sm text-[var(--sv-text-secondary)] hover:text-white transition-colors px-4 py-2"
            >
              Sign in
            </NuxtLink>
            <NuxtLink
              to="/auth/register"
              class="sv-btn-primary text-sm"
            >
              Get Started
            </NuxtLink>
          </template>
        </div>

        <!-- Mobile Menu Button -->
        <button
          class="md:hidden text-white p-2"
          @click="showMobileMenu = !showMobileMenu"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path v-if="!showMobileMenu" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </nav>

      <!-- Mobile Menu -->
      <div v-if="showMobileMenu" class="md:hidden border-t border-[var(--sv-border)] p-4">
        <div class="flex flex-col gap-3">
          <NuxtLink
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            class="text-sm text-[var(--sv-text-secondary)] hover:text-white py-2"
            @click="showMobileMenu = false"
          >
            {{ link.label }}
          </NuxtLink>
          <div class="border-t border-[var(--sv-border)] pt-3 flex flex-col gap-2">
            <template v-if="isAuthenticated">
              <NuxtLink to="/dashboard" class="sv-btn-primary text-sm text-center" @click="showMobileMenu = false">
                Dashboard
              </NuxtLink>
            </template>
            <template v-else>
              <NuxtLink to="/auth/login" class="sv-btn-secondary text-sm text-center" @click="showMobileMenu = false">
                Sign in
              </NuxtLink>
              <NuxtLink to="/auth/register" class="sv-btn-primary text-sm text-center" @click="showMobileMenu = false">
                Get Started
              </NuxtLink>
            </template>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main :class="!isDashboard ? 'pt-16' : ''">
      <slot />
    </main>

    <!-- Footer (only on marketing pages) -->
    <footer v-if="!isDashboard" class="border-t border-[var(--sv-border)] mt-24">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <div class="flex items-center gap-2 mb-4">
              <div class="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <svg class="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <span class="font-semibold text-white">StreamVault</span>
            </div>
            <p class="text-xs text-[var(--sv-text-tertiary)] leading-relaxed">
              Professional video streaming platform built entirely on Cloudflare's edge network.
            </p>
          </div>
          <div>
            <h4 class="text-sm font-medium text-white mb-3">Product</h4>
            <div class="flex flex-col gap-2">
              <NuxtLink to="/#features" class="text-xs text-[var(--sv-text-tertiary)] hover:text-white transition-colors">Features</NuxtLink>
              <NuxtLink to="/pricing" class="text-xs text-[var(--sv-text-tertiary)] hover:text-white transition-colors">Pricing</NuxtLink>
              <NuxtLink to="/docs" class="text-xs text-[var(--sv-text-tertiary)] hover:text-white transition-colors">Documentation</NuxtLink>
              <span class="text-xs text-[var(--sv-text-tertiary)]">API</span>
            </div>
          </div>
          <div>
            <h4 class="text-sm font-medium text-white mb-3">Company</h4>
            <div class="flex flex-col gap-2">
              <span class="text-xs text-[var(--sv-text-tertiary)]">About</span>
              <span class="text-xs text-[var(--sv-text-tertiary)]">Blog</span>
              <span class="text-xs text-[var(--sv-text-tertiary)]">Careers</span>
              <span class="text-xs text-[var(--sv-text-tertiary)]">Contact</span>
            </div>
          </div>
          <div>
            <h4 class="text-sm font-medium text-white mb-3">Legal</h4>
            <div class="flex flex-col gap-2">
              <span class="text-xs text-[var(--sv-text-tertiary)]">Privacy Policy</span>
              <span class="text-xs text-[var(--sv-text-tertiary)]">Terms of Service</span>
              <span class="text-xs text-[var(--sv-text-tertiary)]">Cookie Policy</span>
            </div>
          </div>
        </div>
        <div class="border-t border-[var(--sv-border)] mt-8 pt-8 flex items-center justify-between">
          <p class="text-xs text-[var(--sv-text-tertiary)]">&copy; {{ new Date().getFullYear() }} StreamVault. All rights reserved.</p>
          <p class="text-xs text-[var(--sv-text-tertiary)]">Powered by Cloudflare</p>
        </div>
      </div>
    </footer>
  </div>
</template>
