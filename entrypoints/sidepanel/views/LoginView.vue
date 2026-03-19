<script lang="ts" setup>
import { watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

watch(() => auth.isAuthenticated, (isAuthenticated) => {
  if (isAuthenticated) {
    router.push({ name: 'home' })
  }
})
</script>

<template>
  <div class="flex h-full flex-col items-center justify-center gap-6 p-6">
    <div class="text-center">
      <h1 class="text-3xl font-bold text-brand-900">
        Fast Notes
      </h1>
      <p class="mt-1 text-sm text-gray-500">
        Sign in to sync across devices
      </p>
    </div>

    <button
      class="
        flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4
        py-2 text-sm font-medium text-gray-700 shadow-sm
        hover:bg-gray-50
        disabled:cursor-not-allowed disabled:opacity-50
      "
      :disabled="auth.isLoading"
      @click="auth.signInWithGoogle()"
    >
      <span
        v-if="auth.isLoading"
        class="icon-[mdi--loading] block size-5 animate-spin"
        aria-hidden="true"
      ></span>
      <span
        v-else
        class="icon-[material-icon-theme--google] block size-5"
        aria-hidden="true"
      ></span>
      Sign in with Google
    </button>

    <RouterLink
      :to="{ name: 'home' }"
      class="text-sm text-gray-500 hover:text-gray-700"
    >
      Continue without signing in
    </RouterLink>

    <p
      v-if="auth.error"
      role="alert"
      class="max-w-xs text-center text-sm text-red-600"
    >
      {{ auth.error }}
    </p>
  </div>
</template>
