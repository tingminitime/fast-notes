<script lang="ts" setup>
import { useCategoriesStore } from '../stores/categories'

defineProps<{ modelValue: string | null }>()

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
}>()

const categoriesStore = useCategoriesStore()
</script>

<template>
  <div class="flex flex-wrap gap-1">
    <button
      class="rounded-sm px-2 py-0.5 text-xs transition-colors"
      :class="modelValue === null
        ? 'bg-blue-500 text-white'
        : 'border border-gray-300 text-gray-600 hover:bg-gray-100'"
      @click="emit('update:modelValue', null)"
    >
      All
    </button>
    <button
      v-for="cat in categoriesStore.categories"
      :key="cat.id"
      class="rounded-sm px-2 py-0.5 text-xs transition-colors"
      :class="modelValue === cat.id
        ? 'bg-blue-500 text-white'
        : 'border border-gray-300 text-gray-600 hover:bg-gray-100'"
      @click="emit('update:modelValue', cat.id)"
    >
      {{ cat.name }}
    </button>
  </div>
</template>
