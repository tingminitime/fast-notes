<script lang="ts" setup>
import type { Note } from '../stores/notes'
import { ref } from 'vue'
import { useCategoriesStore } from '../stores/categories'
import ConfirmDialog from './ConfirmDialog.vue'

const props = defineProps<{ note: Note }>()

const emit = defineEmits<{
  edit: [id: string]
  delete: [id: string]
}>()

const categoriesStore = useCategoriesStore()
const showConfirm = ref(false)
const copyState = ref<'idle' | 'success' | 'error'>('idle')
let copyTimer: ReturnType<typeof setTimeout> | null = null

async function copyNote() {
  try {
    await navigator.clipboard.writeText(props.note.text)
    copyState.value = 'success'
  }
  catch {
    copyState.value = 'error'
  }
  if (copyTimer)
    clearTimeout(copyTimer)
  copyTimer = setTimeout(() => {
    copyState.value = 'idle'
  }, 2000)
}

function confirmDelete() {
  showConfirm.value = false
  emit('delete', props.note.id)
}
</script>

<template>
  <div
    class="
      group flex items-start gap-2 rounded-sm border border-gray-200 p-3
      hover:bg-gray-50
    "
  >
    <div class="flex min-w-0 flex-1 flex-col gap-1">
      <p class="line-clamp-4 text-sm wrap-break-word text-gray-800">
        {{ note.text }}
      </p>
      <span
        v-if="note.categoryId"
        class="w-fit rounded-sm bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700"
      >
        {{ categoriesStore.categoryById(note.categoryId)?.name }}
      </span>
    </div>
    <div
      class="
        flex shrink-0 flex-col gap-1 opacity-0 transition-opacity
        group-hover:opacity-100
      "
    >
      <button
        class="rounded-sm p-1 text-xs text-gray-500 hover:bg-gray-200"
        title="Copy"
        @click="copyNote"
      >
        <span
          v-if="copyState === 'success'"
          class="text-green-600"
        >Copied!</span>
        <span
          v-else-if="copyState === 'error'"
          class="text-red-500"
        >Failed</span>
        <span v-else>Copy</span>
      </button>
      <button
        class="rounded-sm p-1 text-xs text-gray-500 hover:bg-gray-200"
        title="Edit"
        @click="emit('edit', note.id)"
      >
        Edit
      </button>
      <button
        class="rounded-sm p-1 text-xs text-red-400 hover:bg-red-50"
        title="Delete"
        @click="showConfirm = true"
      >
        Delete
      </button>
    </div>
  </div>

  <ConfirmDialog
    v-if="showConfirm"
    message="Delete this note? This cannot be undone."
    @confirm="confirmDelete"
    @cancel="showConfirm = false"
  />
</template>
