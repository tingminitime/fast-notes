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
  mockEncrypt,
  mockDecrypt,
} = vi.hoisted(() => ({
  mockSetDoc: vi.fn(),
  mockDeleteDoc: vi.fn(),
  mockOnSnapshot: vi.fn(),
  mockDoc: vi.fn(),
  mockCollection: vi.fn(),
  mockEncrypt: vi.fn(),
  mockDecrypt: vi.fn(),
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

vi.mock('../utils/crypto', () => ({
  encrypt: mockEncrypt,
  decrypt: mockDecrypt,
}))

const mockDb = { _isMockDb: true }
const mockKey = {} as CryptoKey

beforeEach(() => {
  vi.clearAllMocks()
  mockSetDoc.mockResolvedValue(undefined)
  mockDeleteDoc.mockResolvedValue(undefined)
  mockDoc.mockImplementation((_db: unknown, ...path: string[]) => ({ _path: path.join('/') }))
  mockCollection.mockImplementation((_db: unknown, ...path: string[]) => ({ _path: path.join('/') }))
  mockOnSnapshot.mockReturnValue(vi.fn())
  mockEncrypt.mockResolvedValue({ iv: 'test-iv', ciphertext: 'test-ciphertext' })
  mockDecrypt.mockResolvedValue(JSON.stringify({ title: 'Test', text: 'Hello', categoryId: null }))
})

describe('saveNote', () => {
  it('calls setDoc with correct path', async () => {
    const note: Note = { id: 'n1', title: 'Test', text: 'Hello', createdAt: 1000, categoryId: null }
    await saveNote('uid123', note, mockKey)
    expect(mockDoc).toHaveBeenCalledWith(mockDb, 'users', 'uid123', 'notes', 'n1')
    expect(mockSetDoc).toHaveBeenCalledWith({ _path: 'users/uid123/notes/n1' }, expect.any(Object))
  })

  it('writes { id, createdAt, iv, ciphertext } without plaintext fields', async () => {
    const note: Note = { id: 'n1', title: 'My Note', text: 'Hello', createdAt: 1000, categoryId: 'cat1' }
    await saveNote('uid123', note, mockKey)

    expect(mockEncrypt).toHaveBeenCalledWith(mockKey, JSON.stringify({ title: 'My Note', text: 'Hello', categoryId: 'cat1' }))

    const payload = mockSetDoc.mock.calls[0][1]
    expect(payload).not.toHaveProperty('title')
    expect(payload).not.toHaveProperty('text')
    expect(payload).not.toHaveProperty('categoryId')
    expect(payload).toMatchObject({ id: 'n1', createdAt: 1000, iv: 'test-iv', ciphertext: 'test-ciphertext' })
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
  it('calls setDoc with correct path', async () => {
    const category: Category = { id: 'c1', name: 'Work' }
    await saveCategory('uid123', category, mockKey)
    expect(mockDoc).toHaveBeenCalledWith(mockDb, 'users', 'uid123', 'categories', 'c1')
    expect(mockSetDoc).toHaveBeenCalledWith({ _path: 'users/uid123/categories/c1' }, expect.any(Object))
  })

  it('writes { id, iv, ciphertext } without plaintext name field', async () => {
    const category: Category = { id: 'c1', name: 'Work' }
    await saveCategory('uid123', category, mockKey)

    expect(mockEncrypt).toHaveBeenCalledWith(mockKey, JSON.stringify({ name: 'Work' }))

    const payload = mockSetDoc.mock.calls[0][1]
    expect(payload).not.toHaveProperty('name')
    expect(payload).toMatchObject({ id: 'c1', iv: 'test-iv', ciphertext: 'test-ciphertext' })
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

    const result = subscribeNotes('uid123', mockKey, callback)

    expect(mockCollection).toHaveBeenCalledWith(mockDb, 'users', 'uid123', 'notes')
    expect(mockOnSnapshot).toHaveBeenCalledWith({ _path: 'users/uid123/notes' }, expect.any(Function))
    expect(result).toBe(unsubscribe)
  })

  it('invokes callback with decrypted note data when snapshot fires', async () => {
    const encryptedDoc = { id: 'n1', createdAt: 1000, iv: 'test-iv', ciphertext: 'test-ciphertext' }
    const decryptedPayload = { title: 'Note Title', text: 'Hello', categoryId: 'cat1' }
    mockDecrypt.mockResolvedValueOnce(JSON.stringify(decryptedPayload))

    mockOnSnapshot.mockImplementation((_ref: unknown, cb: (_snap: unknown) => void) => {
      cb({ docs: [{ data: () => encryptedDoc }] })
      return vi.fn()
    })
    const callback = vi.fn()

    subscribeNotes('uid123', mockKey, callback)

    await vi.waitFor(() => expect(callback).toHaveBeenCalled())
    expect(callback).toHaveBeenCalledWith([
      { id: 'n1', createdAt: 1000, title: 'Note Title', text: 'Hello', categoryId: 'cat1' },
    ])
  })

  it('replaces failed decryption with error placeholder', async () => {
    const encryptedDoc = { id: 'n1', createdAt: 1000, iv: 'bad-iv', ciphertext: 'bad-ct' }
    mockDecrypt.mockRejectedValueOnce(new Error('Decryption failed'))

    mockOnSnapshot.mockImplementation((_ref: unknown, cb: (_snap: unknown) => void) => {
      cb({ docs: [{ data: () => encryptedDoc }] })
      return vi.fn()
    })
    const callback = vi.fn()

    subscribeNotes('uid123', mockKey, callback)

    await vi.waitFor(() => expect(callback).toHaveBeenCalled())
    const [notes] = callback.mock.calls[0] as [Note[]]
    expect(notes[0].id).toBe('n1')
    expect(notes[0].title).toBe('[Decryption failed]')
    expect(notes[0].text).toBe('')
  })
})

describe('subscribeCategories', () => {
  it('calls onSnapshot with correct collection path and returns unsubscribe function', () => {
    const unsubscribe = vi.fn()
    mockOnSnapshot.mockReturnValue(unsubscribe)
    const callback = vi.fn()

    const result = subscribeCategories('uid123', mockKey, callback)

    expect(mockCollection).toHaveBeenCalledWith(mockDb, 'users', 'uid123', 'categories')
    expect(mockOnSnapshot).toHaveBeenCalledWith({ _path: 'users/uid123/categories' }, expect.any(Function))
    expect(result).toBe(unsubscribe)
  })

  it('invokes callback with decrypted category data when snapshot fires', async () => {
    const encryptedDoc = { id: 'c1', iv: 'test-iv', ciphertext: 'test-ciphertext' }
    mockDecrypt.mockResolvedValueOnce(JSON.stringify({ name: 'Work' }))

    mockOnSnapshot.mockImplementation((_ref: unknown, cb: (_snap: unknown) => void) => {
      cb({ docs: [{ data: () => encryptedDoc }] })
      return vi.fn()
    })
    const callback = vi.fn()

    subscribeCategories('uid123', mockKey, callback)

    await vi.waitFor(() => expect(callback).toHaveBeenCalled())
    expect(callback).toHaveBeenCalledWith([{ id: 'c1', name: 'Work' }])
  })
})
