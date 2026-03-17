<script lang="ts" setup>
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
</script>

<template>
  <div class="flex h-full flex-col">
    <header
      v-if="auth.isAuthenticated"
      class="
        flex items-center justify-between border-b border-gray-200 px-3 py-2
      "
    >
      <span class="text-sm text-gray-600">{{ auth.user?.displayName ?? auth.user?.email }}</span>
      <button
        class="
          rounded-sm border border-gray-300 px-2 py-1 text-xs text-gray-600
          hover:bg-gray-100
        "
        @click="auth.signOut()"
      >
        Sign out
      </button>
    </header>
    <div class="min-h-0 flex-1">
      <RouterView />
    </div>
  </div>
</template>
