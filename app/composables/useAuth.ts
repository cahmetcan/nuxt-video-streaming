interface User {
  id: string
  email: string
  name: string
  plan: string
  planStatus: string
  planExpiresAt: string | null
  storageUsedBytes: number
  bandwidthUsedBytes: number
  apiKey: string
  videoCount: number
  avatarUrl: string | null
  createdAt: string
}

interface AuthState {
  user: User | null
  token: string | null
  loading: boolean
  error: string | null
}

const authState = reactive<AuthState>({
  user: null,
  token: null,
  loading: false,
  error: null,
})

export function useAuth() {
  const router = useRouter()

  const isAuthenticated = computed(() => !!authState.user)
  const user = computed(() => authState.user)
  const loading = computed(() => authState.loading)
  const error = computed(() => authState.error)

  async function register(email: string, password: string, name: string) {
    authState.loading = true
    authState.error = null

    try {
      const data = await $fetch<{ user: User; token: string }>('/api/auth/register', {
        method: 'POST',
        body: { email, password, name },
      })

      authState.user = data.user as User
      authState.token = data.token
      await router.push('/dashboard')
    } catch (err: any) {
      authState.error = err.data?.message || 'Registration failed'
      throw err
    } finally {
      authState.loading = false
    }
  }

  async function login(email: string, password: string) {
    authState.loading = true
    authState.error = null

    try {
      const data = await $fetch<{ user: User; token: string }>('/api/auth/login', {
        method: 'POST',
        body: { email, password },
      })

      authState.user = data.user as User
      authState.token = data.token
      await router.push('/dashboard')
    } catch (err: any) {
      authState.error = err.data?.message || 'Login failed'
      throw err
    } finally {
      authState.loading = false
    }
  }

  async function logout() {
    try {
      await $fetch('/api/auth/logout', { method: 'POST' })
    } catch {}

    authState.user = null
    authState.token = null
    await router.push('/')
  }

  async function fetchUser() {
    try {
      const data = await $fetch<{ user: User }>('/api/auth/me')
      authState.user = data.user
    } catch {
      authState.user = null
      authState.token = null
    }
  }

  return {
    user,
    isAuthenticated,
    loading,
    error,
    register,
    login,
    logout,
    fetchUser,
  }
}
