import type { Category } from '../stores/categories'
import type { Note } from '../stores/notes'
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
} from 'firebase/firestore'
import { db } from '../firebase.config'
import { decrypt, encrypt } from '../utils/crypto'

interface EncryptedNote {
  id: string
  createdAt: number
  iv: string
  ciphertext: string
}

interface EncryptedCategory {
  id: string
  iv: string
  ciphertext: string
}

// 儲存或更新指定使用者的單筆筆記至 Firestore（加密後）
export async function saveNote(
  uid: string,
  note: Note,
  cryptoKey: CryptoKey,
): Promise<void> {
  const { iv, ciphertext } = await encrypt(
    cryptoKey,
    JSON.stringify({ title: note.title, text: note.text, categoryId: note.categoryId }),
  )
  return setDoc(
    doc(db, 'users', uid, 'notes', note.id),
    { id: note.id, createdAt: note.createdAt, iv, ciphertext } satisfies EncryptedNote,
  )
}

// 從 Firestore 刪除指定使用者的單筆筆記
export function deleteNote(uid: string, noteId: string): Promise<void> {
  return deleteDoc(doc(db, 'users', uid, 'notes', noteId))
}

// 儲存或更新指定使用者的單筆分類至 Firestore（加密後）
export async function saveCategory(uid: string, category: Category, cryptoKey: CryptoKey): Promise<void> {
  const { iv, ciphertext } = await encrypt(cryptoKey, JSON.stringify({ name: category.name }))
  return setDoc(
    doc(db, 'users', uid, 'categories', category.id),
    { id: category.id, iv, ciphertext } satisfies EncryptedCategory,
  )
}

// 從 Firestore 刪除指定使用者的單筆分類
export function deleteCategory(uid: string, categoryId: string): Promise<void> {
  return deleteDoc(
    doc(db, 'users', uid, 'categories', categoryId),
  )
}

// 儲存密語驗證文件至 Firestore（首次設定 passphrase 時呼叫）
export async function saveKeyVerification(uid: string, cryptoKey: CryptoKey): Promise<void> {
  const { iv, ciphertext } = await encrypt(cryptoKey, JSON.stringify({ verified: true }))
  return setDoc(doc(db, 'users', uid, 'settings', 'keyVerification'), { iv, ciphertext })
}

// 檢查驗證文件是否存在（用於判斷首次設定或回訪）
export async function hasKeyVerification(uid: string): Promise<boolean> {
  const snap = await getDoc(doc(db, 'users', uid, 'settings', 'keyVerification'))
  return snap.exists()
}

// 嘗試解密驗證文件；成功回傳 true，文件不存在或解密失敗均回傳 false
export async function verifyKey(uid: string, cryptoKey: CryptoKey): Promise<boolean> {
  try {
    const snap = await getDoc(doc(db, 'users', uid, 'settings', 'keyVerification'))
    if (!snap.exists())
      return false
    const { iv, ciphertext } = snap.data() as { iv: string, ciphertext: string }
    await decrypt(cryptoKey, iv, ciphertext)
    return true
  }
  catch {
    return false
  }
}

// 訂閱指定使用者的筆記集合，解密後觸發回呼；回傳取消訂閱函式
export function subscribeNotes(
  uid: string,
  cryptoKey: CryptoKey,
  callback: (notes: Note[]) => void,
): () => void {
  return onSnapshot(
    collection(db, 'users', uid, 'notes'),
    async (snapshot) => {
      const notes = await Promise.all(
        snapshot.docs.map(async (d) => {
          const data = d.data() as EncryptedNote
          try {
            const plaintext = await decrypt(cryptoKey, data.iv, data.ciphertext)

            const payload = JSON.parse(plaintext) as { title: string, text: string, categoryId: string | null }

            return {
              id: data.id,
              createdAt: data.createdAt,
              ...payload,
            } as Note
          }
          catch {
            return { id: data.id, createdAt: data.createdAt, title: '[Decryption failed]', text: '', categoryId: null } as Note
          }
        }),
      )
      callback(notes)
    },
  )
}

// 訂閱指定使用者的分類集合，解密後觸發回呼；回傳取消訂閱函式
export function subscribeCategories(
  uid: string,
  cryptoKey: CryptoKey,
  callback: (categories: Category[]) => void,
): () => void {
  return onSnapshot(collection(db, 'users', uid, 'categories'), async (snapshot) => {
    const categories = await Promise.all(
      snapshot.docs.map(async (d) => {
        const data = d.data() as EncryptedCategory
        try {
          const plaintext = await decrypt(cryptoKey, data.iv, data.ciphertext)

          const payload = JSON.parse(plaintext) as { name: string }

          return {
            id: data.id,
            name: payload.name,
          } as Category
        }
        catch {
          return null
        }
      }),
    )
    callback(categories.filter((c): c is Category => c !== null))
  })
}
