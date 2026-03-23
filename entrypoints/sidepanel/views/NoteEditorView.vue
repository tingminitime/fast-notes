<script lang="ts" setup>
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import NoteEditor from '@/components/NoteEditor.vue'
import { useNotesStore } from '@/stores/notes'

const route = useRoute()
const router = useRouter()
const store = useNotesStore()

const isEditing = computed(() => route.name === 'notes-edit')

const editingNote = computed(() =>
  isEditing.value ? store.notes.find(n => n.id === route.params.id) : undefined,
)

watch(editingNote, (note) => {
  if (isEditing.value && !note)
    router.push({ name: 'notes' })
}, { immediate: true })

function saveNote(text: string, categoryId: string | null, title: string) {
  if (isEditing.value && route.params.id) {
    store.updateNote(route.params.id as string, text, categoryId, title)
  }
  else {
    store.addNote(text, categoryId, title)
  }
  router.push({ name: 'notes' })
}

function cancel() {
  router.push({ name: 'notes' })
}
</script>

<template>
  <div class="p-3">
    <NoteEditor
      :initial-title="editingNote?.title"
      :initial-text="editingNote?.text"
      :initial-category-id="editingNote?.categoryId"
      :is-editing="isEditing"
      @save="saveNote"
      @cancel="cancel"
    />
  </div>
</template>
