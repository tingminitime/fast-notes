# Phase 5 — 本地持久化與訪客模式

**前置功能需求**：
- [Phase 1 — 側邊欄介面與筆記管理](./phase-1-notes-ui.md)
- [Phase 2 — 分類管理](./phase-2-categories.md)
- [Phase 4 — Firebase 帳號登入](./phase-4-firebase-auth.md)

本階段將筆記與分類持久化至 `browser.storage.local`，並移除強制登入限制，讓使用者不需登入即可使用筆記功能（訪客模式）。登入改為可選操作，為後續雲端同步（Phase 6）做準備。

本階段同時確立「兩個獨立儲存空間」的設計原則：
- **訪客模式**：筆記儲存於 `browser.storage.local`
- **已登入模式**：筆記儲存於 Cloud Firestore（Phase 6 實作）；登入後本地端同步暫停，登出後恢復

---

## 涵蓋使用者故事

- **US-20** — 不登入即可使用筆記功能（訪客模式）
- **US-21** — 筆記與分類於瀏覽器重啟後保留（本地持久化）

---

## EARS 需求規格

### US-20 訪客模式

```
1. WHEN the extension is opened without a signed-in user,
   THE EXTENSION SHALL display the note list (home view) directly
   without requiring authentication.

2. WHEN the user is in guest mode,
   THE EXTENSION SHALL provide full access to note and category CRUD operations.

3. WHILE the user is in guest mode,
   THE EXTENSION SHALL display an optional sign-in prompt in the header
   that navigates to the login page when clicked.
```

### US-21 本地持久化

```
1. WHEN the user creates, edits, or deletes a note or category (in guest mode),
   THE EXTENSION SHALL persist the change to browser.storage.local
   automatically after the operation.

2. WHEN the extension is reopened (side panel toggle, browser restart),
   THE EXTENSION SHALL restore all previously saved notes and categories
   from browser.storage.local before rendering the UI (guest mode only).

3. WHEN the user signs in,
   THE EXTENSION SHALL pause local storage sync and display an empty notes list
   (guest notes remain in browser.storage.local but are not shown;
   cloud notes will be loaded in Phase 6).

4. WHEN the user signs out,
   THE EXTENSION SHALL resume local storage sync and restore guest notes and
   categories from browser.storage.local.
   (Sign-out only clears the authentication session, not local data.)
```

---

## 實作範圍

### 持久化架構

```
[Vue UI] <--reads/writes--> [Pinia ref] --deep watch (guest only)--> [WXT storage.local]
                                  ^
                                  |
                    [storage.watch] -- external change --> update Pinia ref (guest only)

Auth state:
  isAuthenticated = false  →  useStorageSync active (guest mode)
  isAuthenticated = true   →  useStorageSync paused (Phase 6: Firestore takes over)
```

- 使用 WXT 內建 `storage.defineItem<T>('local:key', { fallback })` API
- Storage keys: `local:notes`（`Note[]`）、`local:categories`（`Category[]`）
- 建立 `composables/useStorageSync.ts` 封裝雙向同步邏輯，支援 `pause()` / `resume()`
- `stores/auth.ts` 暴露 `authReady` Promise，在首次 `onAuthStateChanged` 回呼後 resolve
- App 啟動時：等待 `authReady`，若未登入則 hydrate（從 storage 載入），再 mount
- Notes / Categories store 監聽 `authStore.isAuthenticated`，處理登入/登出時的資料空間切換

### 新增 / 修改檔案

| 檔案 | 動作 | 說明 |
|------|------|------|
| `composables/useStorageSync.ts` | 新增 | 雙向 Pinia↔storage 同步 composable，含 `pause()` / `resume()` |
| `composables/useStorageSync.test.ts` | 新增 | 單元測試 (TDD) |
| `stores/notes.ts` | 修改 | 加入 `useStorageSync`，expose `hydrate()`；監聽 auth 狀態切換 |
| `stores/notes.test.ts` | 修改 | 補充持久化與 auth 切換相關測試 |
| `stores/categories.ts` | 修改 | 加入 `useStorageSync`，expose `hydrate()`；監聽 auth 狀態切換 |
| `stores/categories.test.ts` | 修改 | 補充持久化與 auth 切換相關測試 |
| `stores/auth.ts` | 修改 | 新增 `authReady` Promise；`signOut()` 不清空 notes/categories |
| `stores/auth.test.ts` | 修改 | 補充 `authReady` 測試；更新 signOut 測試 |
| `entrypoints/sidepanel/router.ts` | 修改 | 移除強制登入 guard，僅保留已登入時跳過 `/login` |
| `entrypoints/sidepanel/main.ts` | 修改 | async init：等待 authReady，未登入時 hydrate stores，再 mount |
| `entrypoints/sidepanel/App.vue` | 修改 | header 改為永遠顯示；訪客模式顯示「Sign in」連結 |
| `entrypoints/sidepanel/views/LoginView.vue` | 修改 | 新增「以訪客模式繼續」按鈕 |

---

## Tasks

### `useStorageSync` composable

- [x] 建立 `composables/useStorageSync.test.ts`，撰寫失敗測試（TDD red）
  - [x] 測試 `hydrate()` 從 storage 讀取並填入 ref
  - [x] 測試 ref 變更後觸發 `setValue`
  - [x] 測試外部 storage 變更更新 ref
  - [x] 測試相同值不造成無限迴圈
  - [x] 測試 `pause()` 暫停後 ref 變更不觸發 `setValue`
  - [x] 測試 `pause()` 暫停後外部 storage 變更不更新 ref
  - [x] 測試 `resume()` 恢復後 ref 變更觸發 `setValue`
  - [x] 測試 `resume()` 恢復後外部 storage 變更更新 ref
- [x] 實作 `composables/useStorageSync.ts`，加入 `pause()` / `resume()`（TDD green）

### Auth Store `authReady`

- [x] 補充 `stores/auth.test.ts`：`authReady` 在首次 `onAuthStateChanged` 後 resolve（TDD red）
- [x] 修改 `stores/auth.ts`：新增 `authReady` Promise，resolve 於 `onAuthStateChanged` 首次回呼（TDD green）

### Notes Store 持久化整合與 auth 切換

- [x] 補充 `stores/notes.test.ts` 持久化測試（TDD red）
  - [x] 測試 `hydrate()` 從 storage 載入筆記
  - [x] 測試 `addNote()` 後 storage `setValue` 被呼叫
  - [x] 測試登入時（`isAuthenticated` true）本地同步暫停、`notes` 清空
  - [x] 測試登出時（`isAuthenticated` false）本地同步恢復、訪客筆記重新載入
- [x] 修改 `stores/notes.ts`：加入 `useStorageSync`、`hydrate()`、auth 狀態 watcher（TDD green）

### Categories Store 持久化整合與 auth 切換

- [x] 補充 `stores/categories.test.ts` 持久化測試（TDD red）
  - [x] 測試 `hydrate()` 從 storage 載入分類
  - [x] 測試 `addCategory()` 後 storage `setValue` 被呼叫
  - [x] 測試登入時本地同步暫停、`categories` 清空
  - [x] 測試登出時本地同步恢復、訪客分類重新載入
- [x] 修改 `stores/categories.ts`：加入 `useStorageSync`、`hydrate()`、auth 狀態 watcher（TDD green）

### Auth Store signOut 行為修正

- [x] 更新 `stores/auth.test.ts`：signOut 不應清空 notes/categories（TDD red）
- [x] 修改 `stores/auth.ts`：移除 `splice(0)` 呼叫（TDD green）

### Router 訪客模式

- [x] 更新 router 測試：未登入可存取 `/`（TDD red）
- [x] 修改 `entrypoints/sidepanel/router.ts`：移除強制登入重導（TDD green）

### App 初始化與 UI

- [x] 修改 `entrypoints/sidepanel/main.ts`：async init + 等待 authReady + 未登入時 hydrate stores + mount
- [x] 修改 `entrypoints/sidepanel/App.vue`：header 永遠顯示，訪客模式顯示 Sign in 連結
- [x] 修改 `entrypoints/sidepanel/views/LoginView.vue`：新增「Continue without signing in」按鈕，副標題改為「Sign in to sync across devices」

---

## Manual Testing Tasks

> 以下項目需要手動在瀏覽器中驗證。

- [x] **訪客模式**：開啟擴充功能，確認不需登入即可看到筆記列表（首頁）
- [x] **筆記 CRUD**：在訪客模式下新增、編輯、刪除筆記，確認功能正常
- [x] **持久化**：新增筆記後關閉並重新開啟側邊欄，確認筆記仍存在
- [x] **分類持久化**：新增分類後重新開啟側邊欄，確認分類仍存在
- [x] **登入切換空間**：在訪客模式下新增筆記，登入後確認筆記清單顯示為空（訪客筆記保留在 local storage 但不顯示）
- [x] **登出恢復訪客筆記**：登入後登出，確認之前訪客模式建立的筆記重新顯示
- [x] **Sign in 連結**：訪客模式下，確認 header 顯示「Sign in」連結，點擊可導向登入頁
- [x] **Continue as guest**：在登入頁點擊「Continue without signing in」，確認導向首頁
