import type { Note } from './notes'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, reactive } from 'vue'
import { useCategoriesStore } from './categories'
import { useNotesStore } from './notes'

const mockStore = new Map<string, any>()

vi.mock('wxt/utils/storage', () => ({
  storage: {
    defineItem: (key: string, opts?: { fallback?: any }) => ({
      key,
      fallback: opts?.fallback,
      getValue: vi.fn(async () => mockStore.get(key) ?? opts?.fallback),
      setValue: vi.fn(async (val: any) => {
        mockStore.set(key, val)
      }),
      watch: vi.fn(() => () => {}),
    }),
  },
}))

const mockCryptoKey = {} as CryptoKey
let mockAuthState: { isAuthenticated: boolean, uid: string | null, cryptoKey: CryptoKey | null }

vi.mock('./auth', () => ({
  useAuthStore: () => mockAuthState,
}))

const { mockSaveNote, mockFirestoreDeleteNote, mockSubscribeNotes } = vi.hoisted(() => ({
  mockSaveNote: vi.fn(),
  mockFirestoreDeleteNote: vi.fn(),
  mockSubscribeNotes: vi.fn(),
}))

vi.mock('../services/firestore', () => ({
  saveNote: mockSaveNote,
  deleteNote: mockFirestoreDeleteNote,
  subscribeNotes: mockSubscribeNotes,
}))

beforeEach(() => {
  mockAuthState = reactive({ isAuthenticated: false, uid: null, cryptoKey: null })
  setActivePinia(createPinia())
  mockStore.clear()
  vi.clearAllMocks()
  mockSubscribeNotes.mockReturnValue(vi.fn())
})

describe('useNotesStore', () => {
  describe('addNote', () => {
    it('adds a note and increments list length', () => {
      const store = useNotesStore()
      const result = store.addNote('Hello world')
      expect(result).toBe(true)
      expect(store.notes).toHaveLength(1)
      expect(store.notes[0].text).toBe('Hello world')
    })

    it('trims whitespace when saving', () => {
      const store = useNotesStore()
      store.addNote('  trimmed  ')
      expect(store.notes[0].text).toBe('trimmed')
    })

    it('does not add note with empty content and returns false', () => {
      const store = useNotesStore()
      const result = store.addNote('   ')
      expect(result).toBe(false)
      expect(store.notes).toHaveLength(0)
    })

    it('does not add note with Tiptap empty paragraph and returns false', () => {
      const store = useNotesStore()
      const result = store.addNote('<p></p>')
      expect(result).toBe(false)
      expect(store.notes).toHaveLength(0)
    })

    it('adds note with HTML content and stores it unchanged', () => {
      const store = useNotesStore()
      const result = store.addNote('<p>Hello</p>')
      expect(result).toBe(true)
      expect(store.notes[0].text).toBe('<p>Hello</p>')
    })
  })

  describe('updateNote', () => {
    it('updates note content correctly', () => {
      const store = useNotesStore()
      store.addNote('original')
      const id = store.notes[0].id
      const result = store.updateNote(id, 'updated')
      expect(result).toBe(true)
      expect(store.notes[0].text).toBe('updated')
    })

    it('trims whitespace on update', () => {
      const store = useNotesStore()
      store.addNote('original')
      const id = store.notes[0].id
      store.updateNote(id, '  padded  ')
      expect(store.notes[0].text).toBe('padded')
    })

    it('returns false and does not update if text is empty', () => {
      const store = useNotesStore()
      store.addNote('original')
      const id = store.notes[0].id
      const result = store.updateNote(id, '   ')
      expect(result).toBe(false)
      expect(store.notes[0].text).toBe('original')
    })

    it('returns false and does not update if text is Tiptap empty paragraph', () => {
      const store = useNotesStore()
      store.addNote('original')
      const id = store.notes[0].id
      const result = store.updateNote(id, '<p></p>')
      expect(result).toBe(false)
      expect(store.notes[0].text).toBe('original')
    })

    it('returns false for non-existent id', () => {
      const store = useNotesStore()
      const result = store.updateNote('no-such-id', 'text')
      expect(result).toBe(false)
    })
  })

  describe('deleteNote', () => {
    it('removes the note from the list', () => {
      const store = useNotesStore()
      store.addNote('to delete')
      const id = store.notes[0].id
      store.deleteNote(id)
      expect(store.notes).toHaveLength(0)
    })

    it('only removes the targeted note', () => {
      const store = useNotesStore()
      store.addNote('keep')
      store.addNote('delete me')
      const idToDelete = store.notes.find(n => n.text === 'delete me')!.id
      store.deleteNote(idToDelete)
      expect(store.notes).toHaveLength(1)
      expect(store.notes[0].text).toBe('keep')
    })
  })

  describe('addNote with categoryId', () => {
    it('stores categoryId when provided', () => {
      const store = useNotesStore()
      store.addNote('hello', 'cat-1')
      expect(store.notes[0].categoryId).toBe('cat-1')
    })

    it('defaults categoryId to null when not provided', () => {
      const store = useNotesStore()
      store.addNote('hello')
      expect(store.notes[0].categoryId).toBeNull()
    })
  })

  describe('updateNote with categoryId', () => {
    it('updates categoryId when provided', () => {
      const store = useNotesStore()
      store.addNote('hello')
      const id = store.notes[0].id
      store.updateNote(id, 'hello', 'cat-2')
      expect(store.notes[0].categoryId).toBe('cat-2')
    })

    it('leaves categoryId unchanged when not provided', () => {
      const store = useNotesStore()
      store.addNote('hello', 'cat-1')
      const id = store.notes[0].id
      store.updateNote(id, 'updated')
      expect(store.notes[0].categoryId).toBe('cat-1')
    })
  })

  describe('notesByCategory getter', () => {
    it('returns only notes matching the given categoryId', () => {
      const store = useNotesStore()
      store.addNote('work note', 'cat-1')
      store.addNote('personal note', 'cat-2')
      store.addNote('uncategorized note')
      const result = store.notesByCategory('cat-1')
      expect(result).toHaveLength(1)
      expect(result[0].text).toBe('work note')
    })

    it('returns uncategorized notes when null is passed', () => {
      const store = useNotesStore()
      store.addNote('has category', 'cat-1')
      store.addNote('no category')
      expect(store.notesByCategory(null)).toHaveLength(1)
      expect(store.notesByCategory(null)[0].text).toBe('no category')
    })
  })

  describe('clearCategoryFromNotes', () => {
    it('sets categoryId to null for all notes with the given categoryId', () => {
      const store = useNotesStore()
      store.addNote('note 1', 'cat-1')
      store.addNote('note 2', 'cat-1')
      store.addNote('note 3', 'cat-2')
      store.clearCategoryFromNotes('cat-1')
      expect(store.notes.find(n => n.text === 'note 1')!.categoryId).toBeNull()
      expect(store.notes.find(n => n.text === 'note 2')!.categoryId).toBeNull()
      expect(store.notes.find(n => n.text === 'note 3')!.categoryId).toBe('cat-2')
    })
  })

  describe('deleteCategory integration', () => {
    it('clearing a category from categories store nullifies associated notes', () => {
      const notesStore = useNotesStore()
      const categoriesStore = useCategoriesStore()
      categoriesStore.addCategory('Work')
      const catId = categoriesStore.categories[0].id
      notesStore.addNote('work note', catId)
      categoriesStore.deleteCategory(catId)
      expect(notesStore.notes[0].categoryId).toBeNull()
    })
  })

  describe('addNote with title', () => {
    it('stores title when provided', () => {
      const store = useNotesStore()
      store.addNote('hello', null, 'My Title')
      expect(store.notes[0].title).toBe('My Title')
    })

    it('defaults title to empty string when not provided', () => {
      const store = useNotesStore()
      store.addNote('hello')
      expect(store.notes[0].title).toBe('')
    })

    it('trims title on save', () => {
      const store = useNotesStore()
      store.addNote('hello', null, '  padded  ')
      expect(store.notes[0].title).toBe('padded')
    })
  })

  describe('updateNote with title', () => {
    it('updates title when provided', () => {
      const store = useNotesStore()
      store.addNote('hello', null, 'Old Title')
      const id = store.notes[0].id
      store.updateNote(id, 'hello', null, 'New Title')
      expect(store.notes[0].title).toBe('New Title')
    })

    it('leaves title unchanged when not provided', () => {
      const store = useNotesStore()
      store.addNote('hello', null, 'Keep Me')
      const id = store.notes[0].id
      store.updateNote(id, 'updated')
      expect(store.notes[0].title).toBe('Keep Me')
    })
  })

  describe('sortedNotes getter', () => {
    it('returns notes sorted newest-first by createdAt', () => {
      const store = useNotesStore()
      store.addNote('first')
      store.addNote('second')
      store.addNote('third')
      const sorted = store.sortedNotes
      expect(sorted[0].text).toBe('third')
      expect(sorted[1].text).toBe('second')
      expect(sorted[2].text).toBe('first')
    })

    it('does not mutate the original notes array order', () => {
      const store = useNotesStore()
      store.addNote('a')
      store.addNote('b')
      const originalFirst = store.notes[0].text
      void store.sortedNotes
      expect(store.notes[0].text).toBe(originalFirst)
    })
  })

  describe('persistence', () => {
    it('hydrate() loads notes from storage', async () => {
      const storedNotes = [{ id: '1', title: 'Test', text: 'hello', createdAt: 1000, categoryId: null }]
      mockStore.set('local:notes', storedNotes)

      const store = useNotesStore()
      await store.hydrate()

      expect(store.notes).toEqual(storedNotes)
    })

    it('hydrate() returns empty array when storage is empty', async () => {
      const store = useNotesStore()
      await store.hydrate()

      expect(store.notes).toEqual([])
    })

    it('sortedNotes returns [] without throwing when storage contains non-array data', async () => {
      mockStore.set('local:notes', { corrupted: true })
      const store = useNotesStore()
      await store.hydrate()
      expect(() => store.sortedNotes).not.toThrow()
      expect(store.sortedNotes).toEqual([])
    })
  })

  describe('auth state transitions', () => {
    it('when user signs in, notes are cleared', async () => {
      const store = useNotesStore()
      store.addNote('guest note')
      expect(store.notes).toHaveLength(1)

      mockAuthState.isAuthenticated = true
      await nextTick()

      expect(store.notes).toHaveLength(0)
    })

    it('when user signs out, guest notes are restored from storage', async () => {
      const storedNotes = [{ id: '1', title: '', text: 'guest', createdAt: 100, categoryId: null }]
      mockStore.set('local:notes', storedNotes)

      const store = useNotesStore()

      // Sign in → notes cleared
      mockAuthState.isAuthenticated = true
      await nextTick()
      expect(store.notes).toHaveLength(0)

      // Sign out → guest notes restored
      mockAuthState.isAuthenticated = false
      await nextTick()
      await nextTick() // wait for async hydrate()

      expect(store.notes).toEqual(storedNotes)
    })
  })

  describe('firestore sync', () => {
    it('subscribes to Firestore notes when user signs in with uid', async () => {
      const store = useNotesStore()

      mockAuthState.isAuthenticated = true
      mockAuthState.uid = 'test-uid'
      mockAuthState.cryptoKey = mockCryptoKey
      await nextTick()

      expect(mockSubscribeNotes).toHaveBeenCalledWith('test-uid', mockCryptoKey, expect.any(Function))
      expect(store.notes).toHaveLength(0)
    })

    it('populates notes from Firestore snapshot callback', async () => {
      const snapshotNotes: Note[] = [
        { id: 'n1', title: '', text: 'Firestore note', createdAt: 100, categoryId: null },
      ]
      mockSubscribeNotes.mockImplementation((_uid: string, _key: CryptoKey, cb: (notes: Note[]) => void) => {
        cb(snapshotNotes)
        return vi.fn()
      })

      const store = useNotesStore()
      mockAuthState.isAuthenticated = true
      mockAuthState.uid = 'test-uid'
      mockAuthState.cryptoKey = mockCryptoKey
      await nextTick()

      expect(store.notes).toEqual(snapshotNotes)
    })

    it('calls unsubscribe when user signs out', async () => {
      const unsubscribeMock = vi.fn()
      mockSubscribeNotes.mockReturnValue(unsubscribeMock)

      const store = useNotesStore()
      mockAuthState.isAuthenticated = true
      mockAuthState.uid = 'test-uid'
      mockAuthState.cryptoKey = mockCryptoKey
      await nextTick()

      mockAuthState.isAuthenticated = false
      mockAuthState.uid = null
      await nextTick()

      expect(unsubscribeMock).toHaveBeenCalled()
      void store
    })

    it('calls saveNote when addNote is called while authenticated', () => {
      mockAuthState = reactive({ isAuthenticated: true, uid: 'test-uid', cryptoKey: mockCryptoKey })
      const store = useNotesStore()

      store.addNote('cloud note')

      expect(mockSaveNote).toHaveBeenCalledWith('test-uid', expect.objectContaining({ text: 'cloud note' }), mockCryptoKey)
    })

    it('does not push to notes.value directly when addNote is called while authenticated', () => {
      mockAuthState = reactive({ isAuthenticated: true, uid: 'test-uid', cryptoKey: mockCryptoKey })
      const store = useNotesStore()

      store.addNote('cloud note')

      expect(store.notes).toHaveLength(0)
    })

    it('calls saveNote when updateNote is called while authenticated', () => {
      mockAuthState = reactive({ isAuthenticated: true, uid: 'test-uid', cryptoKey: mockCryptoKey })
      const store = useNotesStore()
      store.notes.push({ id: 'n1', title: '', text: 'original', createdAt: 100, categoryId: null })

      store.updateNote('n1', 'updated')

      expect(mockSaveNote).toHaveBeenCalledWith('test-uid', expect.objectContaining({ id: 'n1', text: 'updated' }), mockCryptoKey)
    })

    it('calls deleteNote service when deleteNote is called while authenticated', () => {
      mockAuthState = reactive({ isAuthenticated: true, uid: 'test-uid', cryptoKey: mockCryptoKey })
      const store = useNotesStore()

      store.deleteNote('n1')

      expect(mockFirestoreDeleteNote).toHaveBeenCalledWith('test-uid', 'n1')
    })
  })
})
