<script lang="ts" setup>
import type { Note } from '../stores/notes'
import NoteItem from './NoteItem.vue'

defineProps<{ notes: Note[] }>()

const emit = defineEmits<{
  edit: [id: string]
  delete: [id: string]
}>()
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
    <p
      v-else
      class="text-center text-sm text-gray-400"
    >
      No notes yet. Click "New Note" to get started.
    </p>
  </div>
</template>
