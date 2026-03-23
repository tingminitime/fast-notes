<script lang="ts" setup>
import type { Note } from '../stores/notes'
import { computed, ref } from 'vue'
import { useCategoriesStore } from '../stores/categories'
import { toDisplayHtml, toPlainText } from '../utils/noteContent'
import ConfirmDialog from './ConfirmDialog.vue'

const props = defineProps<{ note: Note }>()

const emit = defineEmits<{
  edit: [id: string]
  delete: [id: string]
}>()

const categoriesStore = useCategoriesStore()
const showConfirm = ref(false)
const copyState = ref<'idle' | 'success' | 'error'>('idle')
const displayHtml = computed(() => toDisplayHtml(props.note.text))
let copyTimer: ReturnType<typeof setTimeout> | null = null

async function copyNote() {
  try {
    await navigator.clipboard.writeText(toPlainText(props.note.text))
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
      group flex flex-col gap-2 rounded-sm border border-gray-200 p-3
      hover:bg-gray-50
    "
  >
    <!-- Note's content -->
    <div class="flex min-w-0 flex-col gap-1">
      <div class="flex items-center gap-2">
        <span class="text-lg font-medium text-text-base">
          {{ note.title || 'Untitled' }}
        </span>
        <span
          v-if="note.categoryId"
          class="
            w-fit rounded-sm bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700
          "
        >
          {{ categoriesStore.categoryById(note.categoryId)?.name }}
        </span>
      </div>
      <div
        class="note-preview line-clamp-4 text-sm wrap-break-word text-gray-800"
        v-html="displayHtml"
      ></div>
    </div>

    <!-- Actions -->
    <div
      class="
        flex flex-row gap-1 self-end opacity-0 transition-opacity delay-200
        group-hover:opacity-100 group-hover:delay-0
      "
      :class="(copyState !== 'idle' || showConfirm) ? 'opacity-100' : ''"
    >
      <button
        class="
          relative flex size-8 items-center justify-center rounded-sm p-1
          text-lg text-gray-700
          hover:bg-gray-200
        "
        title="Copy"
        aria-label="copy"
        @click="copyNote"
      >
        <span
          class="icon-[mdi--content-copy]"
          :class="{
            'text-green-500': copyState === 'success',
            'text-red-500': copyState === 'error',
          }"
        ></span>

        <!-- Success: animated checkmark badge -->
        <svg
          v-if="copyState === 'success'"
          class="
            pointer-events-none absolute -right-1 -bottom-1 size-4
            drop-shadow-sm
          "
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <circle
            cx="8"
            cy="8"
            r="7"
            fill="white"
            stroke="#22c55e"
            stroke-width="1.5"
            class="anim-pop"
          />
          <polyline
            points="4,8.5 6.8,11.5 12,5.5"
            stroke="#22c55e"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="anim-draw-check"
          />
        </svg>

        <!-- Error: animated X badge -->
        <svg
          v-else-if="copyState === 'error'"
          class="
            pointer-events-none absolute -right-1 -bottom-1 size-4
            drop-shadow-sm
          "
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <circle
            cx="8"
            cy="8"
            r="7"
            fill="white"
            stroke="#ef4444"
            stroke-width="1.5"
            class="anim-pop"
          />
          <line
            x1="5.5"
            y1="5.5"
            x2="10.5"
            y2="10.5"
            stroke="#ef4444"
            stroke-width="1.8"
            stroke-linecap="round"
            class="anim-draw-x1"
          />
          <line
            x1="10.5"
            y1="5.5"
            x2="5.5"
            y2="10.5"
            stroke="#ef4444"
            stroke-width="1.8"
            stroke-linecap="round"
            class="anim-draw-x2"
          />
        </svg>
      </button>
      <button
        class="
          flex size-8 items-center justify-center rounded-sm p-1 text-lg
          text-gray-700
          hover:bg-gray-200
        "
        title="Edit"
        aria-label="edit"
        @click="emit('edit', note.id)"
      >
        <span class="icon-[mdi--pencil]"></span>
      </button>
      <button
        class="
          flex size-8 items-center justify-center rounded-sm p-1 text-lg
          text-red-400
          hover:bg-red-50
        "
        title="Delete"
        aria-label="delete"
        @click="showConfirm = true"
      >
        <span class="icon-[mdi--delete-outline]"></span>
      </button>
    </div>
  </div>

  <ConfirmDialog
    :open="showConfirm"
    title="Delete note"
    message="Delete this note? This cannot be undone."
    @confirm="confirmDelete"
    @cancel="showConfirm = false"
  />
</template>

<style scoped>
.note-preview :deep(p) {
  margin: 0;
}
.note-preview :deep(p + p) {
  margin-top: 0.15rem;
}

@keyframes pop {
  0% { transform: scale(0); opacity: 0; }
  60% { transform: scale(1.25); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes draw-check {
  from { stroke-dashoffset: 13; }
  to { stroke-dashoffset: 0; }
}

@keyframes draw-x-line {
  from { stroke-dashoffset: 8; }
  to { stroke-dashoffset: 0; }
}

.anim-pop {
  transform-origin: center;
  animation: pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

.anim-draw-check {
  stroke-dasharray: 13;
  stroke-dashoffset: 13;
  animation: draw-check 0.3s ease-out 0.15s forwards;
}

.anim-draw-x1 {
  stroke-dasharray: 8;
  stroke-dashoffset: 8;
  animation: draw-x-line 0.22s ease-out 0.15s forwards;
}

.anim-draw-x2 {
  stroke-dasharray: 8;
  stroke-dashoffset: 8;
  animation: draw-x-line 0.22s ease-out 0.3s forwards;
}
</style>
