<script lang="ts" setup>
import { ToggleGroupItem, ToggleGroupRoot } from 'reka-ui'
import { useCategoriesStore } from '../stores/categories'

defineProps<{ modelValue: string | null }>()

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
}>()

const categoriesStore = useCategoriesStore()
</script>

<template>
  <ToggleGroupRoot
    type="single"
    class="flex flex-wrap gap-1"
    :model-value="modelValue ?? 'all'"
    @update:model-value="val => emit('update:modelValue', val === 'all' ? null : (typeof val === 'string' ? val : null))"
  >
    <ToggleGroupItem
      value="all"
      data-testid="filter-item"
      class="
        rounded-sm px-2 py-0.5 text-xs transition-colors
        data-[state=off]:border data-[state=off]:border-gray-300
        data-[state=off]:text-gray-600
        data-[state=off]:hover:bg-gray-100
        data-[state=on]:bg-gray-700 data-[state=on]:text-white
      "
    >
      All
    </ToggleGroupItem>
    <ToggleGroupItem
      v-for="cat in categoriesStore.categories"
      :key="cat.id"
      :value="cat.id"
      data-testid="filter-item"
      class="
        rounded-sm px-2 py-0.5 text-xs transition-colors
        data-[state=off]:border data-[state=off]:border-gray-300
        data-[state=off]:text-gray-600
        data-[state=off]:hover:bg-gray-100
        data-[state=on]:bg-gray-700 data-[state=on]:text-white
      "
    >
      {{ cat.name }}
    </ToggleGroupItem>
  </ToggleGroupRoot>
</template>
