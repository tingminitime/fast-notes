<script lang="ts" setup>
import { ref } from 'vue'
import { useCategoriesStore } from '../stores/categories'
import { useNotesStore } from '../stores/notes'
import ConfirmDialog from './ConfirmDialog.vue'

const categoriesStore = useCategoriesStore()
const notesStore = useNotesStore()

const newName = ref('')
const pendingDeleteId = ref<string | null>(null)

function submit() {
  if (categoriesStore.addCategory(newName.value)) {
    newName.value = ''
  }
}

function requestDelete(id: string) {
  pendingDeleteId.value = id
}

function confirmDelete() {
  if (pendingDeleteId.value) {
    categoriesStore.deleteCategory(pendingDeleteId.value)
    pendingDeleteId.value = null
  }
}

function cancelDelete() {
  pendingDeleteId.value = null
}

function noteCountForCategory(id: string) {
  return notesStore.notes.filter(n => n.categoryId === id).length
}

function deleteMessage() {
  if (!pendingDeleteId.value)
    return ''
  const count = noteCountForCategory(pendingDeleteId.value)
  if (count > 0)
    return `This category has ${count} note${count > 1 ? 's' : ''}. They will become uncategorized. Continue?`
  return 'Delete this category?'
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <h2 class="text-sm font-semibold text-gray-700">
      Manage Categories
    </h2>

    <form
      class="flex gap-2"
      @submit.prevent="submit"
    >
      <input
        v-model="newName"
        class="
          flex-1 rounded-sm border border-gray-300 px-2 py-1 text-sm
          focus:ring-2 focus:ring-blue-400 focus:outline-none
        "
        placeholder="New category name…"
      >
      <button
        type="submit"
        class="
          rounded-sm bg-blue-500 px-3 py-1 text-sm text-white
          hover:bg-blue-600
        "
      >
        Add
      </button>
    </form>

    <p
      v-if="categoriesStore.error"
      class="text-xs text-red-500"
    >
      {{ categoriesStore.error }}
    </p>

    <ul
      v-if="categoriesStore.categories.length"
      class="flex flex-col gap-1"
    >
      <li
        v-for="cat in categoriesStore.categories"
        :key="cat.id"
        class="
          flex items-center justify-between rounded-sm border border-gray-200
          px-3 py-1.5
        "
      >
        <span class="text-sm text-gray-800">{{ cat.name }}</span>
        <button
          class="rounded-sm p-1 text-xs text-red-400 hover:bg-red-50"
          @click="requestDelete(cat.id)"
        >
          Delete
        </button>
      </li>
    </ul>

    <p
      v-else
      class="text-center text-sm text-gray-400"
    >
      No categories yet.
    </p>

    <ConfirmDialog
      v-if="pendingDeleteId"
      :message="deleteMessage()"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />
  </div>
</template>
