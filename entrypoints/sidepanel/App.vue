<script lang="ts" setup>
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
</script>

<template>
  <div class="flex h-full flex-col">
    <header
      class="
        flex items-center justify-between border-b border-gray-200 px-3 py-2
      "
    >
      <template v-if="auth.isAuthenticated">
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
      </template>
      <template v-else>
        <span class="text-sm text-gray-400">Guest mode</span>
        <RouterLink
          :to="{ name: 'login' }"
          class="
            rounded-sm border border-gray-300 px-2 py-1 text-xs text-gray-600
            hover:bg-gray-100
          "
        >
          Sign in
        </RouterLink>
      </template>
    </header>
    <div class="min-h-0 flex-1">
      <RouterView />
    </div>
  </div>
</template>
