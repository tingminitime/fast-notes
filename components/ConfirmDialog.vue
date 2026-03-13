<script lang="ts" setup>
defineProps<{
  message: string
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
    <div class="w-72 rounded-lg bg-white p-5 shadow-lg">
      <p class="mb-4 text-sm text-gray-700">
        {{ message }}
      </p>
      <div class="flex justify-end gap-2">
        <button
          class="
            rounded-sm border border-gray-300 px-3 py-1 text-sm
            hover:bg-gray-100
          "
          @click="emit('cancel')"
        >
          Cancel
        </button>
        <button
          class="
            rounded-sm bg-red-500 px-3 py-1 text-sm text-white
            hover:bg-red-600
          "
          @click="emit('confirm')"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
</template>
