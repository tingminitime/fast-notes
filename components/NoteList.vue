<script lang="ts" setup>
import type { Note } from '@/stores/notes'
import { useTemplateRef } from 'vue'
import NoteItem from './NoteItem.vue'

defineProps<{ notes: Note[] }>()

const emit = defineEmits<{
  edit: [id: string]
  delete: [id: string]
}>()

const emptyStateEl = useTemplateRef<HTMLDivElement>('empty-state')
defineExpose({ emptyStateEl })
</script>

<template>
  <div class="flex flex-col gap-2">
    <template v-if="notes.length">
      <NoteItem
        v-for="note in notes"
        :key="note.id"
        :note="note"
        @edit="emit('edit', $event)"
        @delete="emit('delete', $event)"
      />
    </template>
    <div
      v-else
      ref="empty-state"
      class="flex flex-col items-center gap-1 pt-2"
    >
      <p class="text-center text-sm text-text-muted">
        No notes yet. Click "+" to add your first note.
      </p>
    </div>
  </div>
</template>
