<script lang="ts" setup>
import { useRouter } from 'vue-router'
import CategoryManager from '@/components/CategoryManager.vue'

const router = useRouter()
</script>

<template>
  <div class="flex h-full flex-col gap-3 p-3">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold text-brand-900">
        Fast Notes
      </h1>
      <button
        class="
          rounded-sm border border-gray-300 px-3 py-1 text-sm text-gray-600
          hover:bg-gray-100
        "
        @click="router.push({ name: 'notes' })"
      >
        ← Back
      </button>
    </div>
    <CategoryManager />
  </div>
</template>
