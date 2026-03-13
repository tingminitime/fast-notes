<script lang="ts" setup>
import { computed, ref } from 'vue'
import CategoryFilter from '../../../components/CategoryFilter.vue'
import CategoryManager from '../../../components/CategoryManager.vue'
import NoteEditor from '../../../components/NoteEditor.vue'
import NoteList from '../../../components/NoteList.vue'
import { useNotesStore } from '../../../stores/notes'

const store = useNotesStore()

type Mode = 'list' | 'new' | 'edit' | 'categories'
const mode = ref<Mode>('list')
const editingId = ref<string | null>(null)
const activeCategory = ref<string | null>(null)

function editingNote() {
  if (!editingId.value)
    return undefined
  return store.notes.find(n => n.id === editingId.value)
}

function startEdit(id: string) {
  editingId.value = id
  mode.value = 'edit'
}

function saveNote(text: string, categoryId: string | null) {
  if (mode.value === 'edit' && editingId.value) {
    store.updateNote(editingId.value, text, categoryId)
  }
  else {
    store.addNote(text, categoryId)
  }
  mode.value = 'list'
  editingId.value = null
}

function cancelEditor() {
  mode.value = 'list'
  editingId.value = null
}

function deleteNote(id: string) {
  store.deleteNote(id)
}

const filteredNotes = computed(() => {
  const sorted = store.sortedNotes
  if (activeCategory.value === null)
    return sorted
  return sorted.filter(n => n.categoryId === activeCategory.value)
})
</script>

<template>
  <div class="flex h-full flex-col gap-3 p-3">
    <div class="flex items-center justify-between">
      <h1 class="text-base font-semibold text-gray-800">
        Fast Notes
      </h1>
      <div class="flex gap-2">
        <button
          v-if="mode === 'list'"
          class="
            rounded-sm bg-blue-500 px-3 py-1 text-sm text-white
            hover:bg-blue-600
          "
          @click="mode = 'new'"
        >
          New Note
        </button>
        <button
          v-if="mode === 'list'"
          class="
            rounded-sm border border-gray-300 px-3 py-1 text-sm text-gray-600
            hover:bg-gray-100
          "
          title="Manage categories"
          @click="mode = 'categories'"
        >
          Categories
        </button>
        <button
          v-if="mode === 'categories'"
          class="
            rounded-sm border border-gray-300 px-3 py-1 text-sm text-gray-600
            hover:bg-gray-100
          "
          @click="mode = 'list'"
        >
          ← Back
        </button>
      </div>
    </div>

    <CategoryManager v-if="mode === 'categories'" />

    <template v-if="mode === 'list'">
      <CategoryFilter v-model="activeCategory" />

      <NoteList
        :notes="filteredNotes"
        @edit="startEdit"
        @delete="deleteNote"
      />
    </template>

    <NoteEditor
      v-if="mode === 'new' || mode === 'edit'"
      :initial-text="editingNote()?.text"
      :initial-category-id="editingNote()?.categoryId"
      :is-editing="mode === 'edit'"
      @save="saveNote"
      @cancel="cancelEditor"
    />
  </div>
</template>
