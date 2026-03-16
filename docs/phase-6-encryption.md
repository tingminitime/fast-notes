# Phase 6 — 端到端加密

**前置功能需求**：
- [Phase 4 — Firebase 帳號登入](./phase-4-firebase-auth.md)（需要 Firebase UID 作為金鑰衍生來源）
- [Phase 5 — 雲端同步（Firestore）](./phase-5-cloud-sync.md)（加密後的密文才能寫入 Firestore）

本階段在 Firestore 讀寫流程中加入 Web Crypto API，以 PBKDF2 從 Firebase UID 衍生 AES-GCM 256-bit 金鑰，確保 Firestore 中儲存的資料皆為密文，解密完全在客戶端完成。

---

## 涵蓋使用者故事

- **US-13** — 筆記端到端加密儲存
- **US-14** — 本地解密筆記瀏覽

---

## EARS 需求規格

### US-13 筆記端到端加密儲存

```
1. THE EXTENSION SHALL encrypt all note content using AES-GCM 256-bit encryption
   before transmitting data to Cloud Firestore.

2. THE EXTENSION SHALL derive the encryption key using PBKDF2
   based on the authenticated user's Firebase UID.

3. THE EXTENSION SHALL perform encryption and decryption operations exclusively on the client side.

4. WHILE storing notes,
   THE EXTENSION SHALL ensure that Cloud Firestore receives and stores only ciphertext,
   never plaintext note content.
```

### US-14 本地解密筆記瀏覽

```
1. WHEN the extension loads the user's notes from Firestore,
   THE EXTENSION SHALL automatically decrypt each note's ciphertext using the locally derived key
   before displaying it.

2. IF decryption of a note fails due to a key mismatch or data corruption,
   THEN THE EXTENSION SHALL display a placeholder error for that note and log the failure
   without exposing raw ciphertext to the user.
```

---

## 實作範圍

### 加密方案

| 項目 | 規格 |
|------|------|
| 加密演算法 | AES-GCM，256-bit key |
| 金鑰衍生 | PBKDF2，`password = Firebase UID`，`salt = uid (UTF-8 bytes)`，100,000 iterations，SHA-256 |
| IV | 每次加密產生隨機 12-byte IV，與密文一起儲存 |
| 儲存格式 | `iv` (base64) + `ciphertext` (base64) |

### Firestore 文件欄位變更

```
users/{uid}/notes/{noteId}
  - id: string
  - text: string  →  改為  ciphertext: string  (base64 encoded AES-GCM output)
  - iv: string              (base64 encoded 12-byte random IV)
  - createdAt: number
  - categoryId: string | null
  - updatedAt: number
```

### 新增 / 修改檔案

| 檔案 | 說明 |
|------|------|
| `utils/crypto.ts` | Web Crypto API 工具函式（deriveKey, encrypt, decrypt） |
| `utils/crypto.test.ts` | 加密 / 解密單元測試 (TDD) |
| `stores/auth.ts` | 登入後衍生並快取 CryptoKey |
| `services/firestore.ts` | 寫入前加密、讀取後解密 |
| `services/firestore.test.ts` | 補充加密相關測試案例 |

---

## Tasks

### 加密工具（`utils/crypto.ts`）

- [ ] 建立 `utils/crypto.test.ts`，撰寫失敗測試（TDD red）
  - [ ] 測試 `deriveKey(uid)` — 回傳 CryptoKey 物件，且相同 uid 每次產生相同金鑰
  - [ ] 測試 `encrypt(key, plaintext)` — 回傳含 `iv` 與 `ciphertext` 的物件
  - [ ] 測試 `decrypt(key, iv, ciphertext)` — 正確還原 plaintext
  - [ ] 測試 `decrypt` 使用錯誤金鑰時拋出錯誤（DOMException）
  - [ ] 測試加密輸出為 base64 字串，且不含原始明文
- [ ] 實作 `utils/crypto.ts`，使所有測試通過（TDD green）
  - [ ] `deriveKey(uid: string): Promise<CryptoKey>` — PBKDF2 → AES-GCM 256
  - [ ] `encrypt(key: CryptoKey, plaintext: string): Promise<{ iv: string; ciphertext: string }>`
  - [ ] `decrypt(key: CryptoKey, iv: string, ciphertext: string): Promise<string>`

### Auth Store 整合（`stores/auth.ts`）

- [ ] 補充測試：登入後 `cryptoKey` 不為 null
- [ ] 更新 `stores/auth.ts`
  - [ ] 新增 `state`: `cryptoKey: CryptoKey | null`
  - [ ] 登入成功（`onAuthStateChanged` 取得 user）後，呼叫 `deriveKey(uid)` 並存入 `cryptoKey`
  - [ ] 登出時清空 `cryptoKey`

### Firestore Service 整合（`services/firestore.ts`）

- [ ] 補充 `services/firestore.test.ts` — 驗證寫入 Firestore 的 payload 不含明文 `text`
- [ ] 更新 `services/firestore.ts`
  - [ ] `saveNote(uid, note, cryptoKey)` — 加密 `note.text`，以 `{ ciphertext, iv }` 取代 `text` 寫入
  - [ ] `subscribeNotes` 的 snapshot 回呼中，對每筆資料呼叫 `decrypt`，失敗時替換為錯誤 placeholder
- [ ] 確認 Note store 呼叫 `saveNote` 時傳入 `authStore.cryptoKey`

---

## Manual Testing Tasks

> 以下項目需要手動在瀏覽器與 Firebase Console 中驗證。

- [ ] **密文驗證**：新增一條筆記後，至 Firebase Console → Firestore，確認文件中只有 `ciphertext` 與 `iv` 欄位，**不存在** `text` 明文欄位
- [ ] **自動解密**：確認側邊欄中顯示的筆記內容為可讀的明文，使用者無需任何額外操作
- [ ] **跨裝置解密**：在兩台裝置以相同 Google 帳號登入，確認兩端均能正確顯示筆記（PBKDF2 衍生的金鑰一致）
- [ ] **解密失敗處理**：在 Firestore Console 手動修改某筆記的 `ciphertext` 為損壞資料，確認該筆記在側邊欄顯示錯誤 placeholder 而非崩潰或顯示亂碼
