<script setup lang="ts">
const { fetchUser } = useAuth()

// Try to restore auth state on app load
onMounted(async () => {
  try {
    await fetchUser()
  } catch {}
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
