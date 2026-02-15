export default defineNuxtRouteMiddleware((to) => {
  const { isAuthenticated } = useAuth()

  if (to.path.startsWith('/dashboard') && !isAuthenticated.value) {
    return navigateTo('/auth/login')
  }
})
