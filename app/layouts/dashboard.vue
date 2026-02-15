<script setup lang="ts">
const { user, logout, isAuthenticated } = useAuth()
const route = useRoute()
const sidebarCollapsed = ref(false)
const showMobileSidebar = ref(false)

const navItems = [
  { label: 'Overview', icon: 'home', to: '/dashboard' },
  { label: 'Videos', icon: 'video', to: '/dashboard/videos' },
  { label: 'Upload', icon: 'upload', to: '/dashboard/upload' },
  { label: 'Analytics', icon: 'chart', to: '/dashboard/analytics' },
  { label: 'Embed', icon: 'code', to: '/dashboard/embed' },
  { label: 'API Keys', icon: 'key', to: '/dashboard/api-keys' },
  { label: 'Billing', icon: 'card', to: '/dashboard/billing' },
  { label: 'Settings', icon: 'settings', to: '/dashboard/settings' },
]

function isActive(path: string) {
  if (path === '/dashboard') return route.path === '/dashboard'
  return route.path.startsWith(path)
}
</script>

<template>
  <div class="min-h-screen bg-[var(--sv-bg-primary)] flex">
    <!-- Sidebar -->
    <aside
      class="fixed inset-y-0 left-0 z-40 flex flex-col border-r border-[var(--sv-border)] bg-[var(--sv-bg-secondary)] transition-all duration-200"
      :class="[
        sidebarCollapsed ? 'w-16' : 'w-60',
        showMobileSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      ]"
    >
      <!-- Logo -->
      <div class="h-16 flex items-center gap-2.5 px-4 border-b border-[var(--sv-border)] shrink-0">
        <NuxtLink to="/" class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
            <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <span v-if="!sidebarCollapsed" class="text-lg font-semibold text-white">StreamVault</span>
        </NuxtLink>
      </div>

      <!-- Nav Items -->
      <nav class="flex-1 py-4 px-2 overflow-y-auto">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all mb-0.5"
          :class="isActive(item.to) ? 'bg-indigo-500/10 text-indigo-400' : 'text-[var(--sv-text-secondary)] hover:text-white hover:bg-[var(--sv-bg-tertiary)]'"
          @click="showMobileSidebar = false"
        >
          <!-- Icons -->
          <svg v-if="item.icon === 'home'" class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
          <svg v-else-if="item.icon === 'video'" class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
          <svg v-else-if="item.icon === 'upload'" class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
          <svg v-else-if="item.icon === 'chart'" class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
          <svg v-else-if="item.icon === 'code'" class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
          <svg v-else-if="item.icon === 'key'" class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
          <svg v-else-if="item.icon === 'card'" class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
          <svg v-else-if="item.icon === 'settings'" class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          <span v-if="!sidebarCollapsed">{{ item.label }}</span>
        </NuxtLink>
      </nav>

      <!-- User section -->
      <div class="border-t border-[var(--sv-border)] p-3 shrink-0">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
            <span class="text-xs font-medium text-white">{{ user?.name?.[0]?.toUpperCase() || 'U' }}</span>
          </div>
          <div v-if="!sidebarCollapsed" class="flex-1 min-w-0">
            <p class="text-sm font-medium text-white truncate">{{ user?.name || 'User' }}</p>
            <p class="text-xs text-[var(--sv-text-tertiary)] truncate capitalize">{{ user?.plan || 'free' }} plan</p>
          </div>
          <button
            v-if="!sidebarCollapsed"
            class="text-[var(--sv-text-tertiary)] hover:text-white p-1"
            title="Sign out"
            @click="logout"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </aside>

    <!-- Main Content Area -->
    <div class="flex-1 transition-all duration-200" :class="sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-60'">
      <!-- Top Bar -->
      <header class="h-16 border-b border-[var(--sv-border)] bg-[var(--sv-bg-secondary)]/80 backdrop-blur-sm flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
        <div class="flex items-center gap-3">
          <button class="lg:hidden text-white p-1" @click="showMobileSidebar = !showMobileSidebar">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <button
            class="hidden lg:block text-[var(--sv-text-tertiary)] hover:text-white p-1"
            @click="sidebarCollapsed = !sidebarCollapsed"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 6h16M4 12h8m-8 6h16" />
            </svg>
          </button>
        </div>

        <div class="flex items-center gap-3">
          <NuxtLink
            to="/dashboard/upload"
            class="sv-btn-primary text-sm flex items-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            <span class="hidden sm:inline">Upload</span>
          </NuxtLink>
        </div>
      </header>

      <!-- Page Content -->
      <div class="p-4 lg:p-6">
        <slot />
      </div>
    </div>

    <!-- Mobile Sidebar Overlay -->
    <div
      v-if="showMobileSidebar"
      class="fixed inset-0 bg-black/50 z-30 lg:hidden"
      @click="showMobileSidebar = false"
    />
  </div>
</template>
