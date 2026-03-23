import type { Category } from '../stores/categories'
import type { Note } from '../stores/notes'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  deleteCategory,
  deleteNote,
  saveCategory,
  saveNote,
  subscribeCategories,
  subscribeNotes,
} from './firestore'

const {
  mockSetDoc,
  mockDeleteDoc,
  mockOnSnapshot,
  mockDoc,
  mockCollection,
} = vi.hoisted(() => ({
  mockSetDoc: vi.fn(),
  mockDeleteDoc: vi.fn(),
  mockOnSnapshot: vi.fn(),
  mockDoc: vi.fn(),
  mockCollection: vi.fn(),
}))

vi.mock('firebase/firestore', () => ({
  setDoc: mockSetDoc,
  deleteDoc: mockDeleteDoc,
  onSnapshot: mockOnSnapshot,
  doc: mockDoc,
  collection: mockCollection,
}))

vi.mock('../firebase.config', () => ({
  db: { _isMockDb: true },
}))

const mockDb = { _isMockDb: true }

beforeEach(() => {
  vi.clearAllMocks()
  mockSetDoc.mockResolvedValue(undefined)
  mockDeleteDoc.mockResolvedValue(undefined)
  mockDoc.mockImplementation((_db: unknown, ...path: string[]) => ({ _path: path.join('/') }))
  mockCollection.mockImplementation((_db: unknown, ...path: string[]) => ({ _path: path.join('/') }))
  mockOnSnapshot.mockReturnValue(vi.fn())
})

describe('saveNote', () => {
  it('calls setDoc with correct path and data', async () => {
    const note: Note = { id: 'n1', title: 'Test', text: 'Hello', createdAt: 1000, categoryId: null }
    await saveNote('uid123', note)
    expect(mockDoc).toHaveBeenCalledWith(mockDb, 'users', 'uid123', 'notes', 'n1')
    expect(mockSetDoc).toHaveBeenCalledWith({ _path: 'users/uid123/notes/n1' }, note, { merge: true })
  })
})

describe('deleteNote', () => {
  it('calls deleteDoc with correct path', async () => {
    await deleteNote('uid123', 'n1')
    expect(mockDoc).toHaveBeenCalledWith(mockDb, 'users', 'uid123', 'notes', 'n1')
    expect(mockDeleteDoc).toHaveBeenCalledWith({ _path: 'users/uid123/notes/n1' })
  })
})

describe('saveCategory', () => {
  it('calls setDoc with correct path and data', async () => {
    const category: Category = { id: 'c1', name: 'Work' }
    await saveCategory('uid123', category)
    expect(mockDoc).toHaveBeenCalledWith(mockDb, 'users', 'uid123', 'categories', 'c1')
    expect(mockSetDoc).toHaveBeenCalledWith({ _path: 'users/uid123/categories/c1' }, category, { merge: true })
  })
})

describe('deleteCategory', () => {
  it('calls deleteDoc with correct path', async () => {
    await deleteCategory('uid123', 'c1')
    expect(mockDoc).toHaveBeenCalledWith(mockDb, 'users', 'uid123', 'categories', 'c1')
    expect(mockDeleteDoc).toHaveBeenCalledWith({ _path: 'users/uid123/categories/c1' })
  })
})

describe('subscribeNotes', () => {
  it('calls onSnapshot with correct collection path and returns unsubscribe function', () => {
    const unsubscribe = vi.fn()
    mockOnSnapshot.mockReturnValue(unsubscribe)
    const callback = vi.fn()

    const result = subscribeNotes('uid123', callback)

    expect(mockCollection).toHaveBeenCalledWith(mockDb, 'users', 'uid123', 'notes')
    expect(mockOnSnapshot).toHaveBeenCalledWith({ _path: 'users/uid123/notes' }, expect.any(Function))
    expect(result).toBe(unsubscribe)
  })

  it('invokes callback with mapped note data when snapshot fires', () => {
    const notes: Note[] = [
      { id: 'n1', title: '', text: 'Hello', createdAt: 1000, categoryId: null },
    ]
    mockOnSnapshot.mockImplementation((_ref: unknown, cb: (snap: unknown) => void) => {
      cb({ docs: notes.map(n => ({ data: () => n })) })
      return vi.fn()
    })
    const callback = vi.fn()

    subscribeNotes('uid123', callback)

    expect(callback).toHaveBeenCalledWith(notes)
  })
})

describe('subscribeCategories', () => {
  it('calls onSnapshot with correct collection path and returns unsubscribe function', () => {
    const unsubscribe = vi.fn()
    mockOnSnapshot.mockReturnValue(unsubscribe)
    const callback = vi.fn()

    const result = subscribeCategories('uid123', callback)

    expect(mockCollection).toHaveBeenCalledWith(mockDb, 'users', 'uid123', 'categories')
    expect(mockOnSnapshot).toHaveBeenCalledWith({ _path: 'users/uid123/categories' }, expect.any(Function))
    expect(result).toBe(unsubscribe)
  })

  it('invokes callback with mapped category data when snapshot fires', () => {
    const categories: Category[] = [{ id: 'c1', name: 'Work' }]
    mockOnSnapshot.mockImplementation((_ref: unknown, cb: (snap: unknown) => void) => {
      cb({ docs: categories.map(c => ({ data: () => c })) })
      return vi.fn()
    })
    const callback = vi.fn()

    subscribeCategories('uid123', callback)

    expect(callback).toHaveBeenCalledWith(categories)
  })
})
