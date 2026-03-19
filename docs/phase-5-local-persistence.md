# Phase 5 — 本地持久化與訪客模式

**前置功能需求**：
- [Phase 1 — 側邊欄介面與筆記管理](./phase-1-notes-ui.md)
- [Phase 2 — 分類管理](./phase-2-categories.md)
- [Phase 4 — Firebase 帳號登入](./phase-4-firebase-auth.md)

本階段將筆記與分類持久化至 `browser.storage.local`，並移除強制登入限制，讓使用者不需登入即可使用筆記功能（訪客模式）。登入改為可選操作，為後續雲端同步（Phase 6）做準備。

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
1. WHEN the user creates, edits, or deletes a note or category,
   THE EXTENSION SHALL persist the change to browser.storage.local
   automatically after the operation.

2. WHEN the extension is reopened (side panel toggle, browser restart),
   THE EXTENSION SHALL restore all previously saved notes and categories
   from browser.storage.local before rendering the UI.

3. WHEN the user signs out,
   THE EXTENSION SHALL retain all locally stored notes and categories
   (sign-out only clears the authentication session, not local data).
```

---

## 實作範圍

### 持久化架構

```
[Vue UI] <--reads/writes--> [Pinia ref] --deep watch--> [WXT storage.local]
                                  ^
                                  |
                    [storage.watch] -- external change --> update Pinia ref
```

- 使用 WXT 內建 `storage.defineItem<T>('local:key', { fallback })` API
- Storage keys: `local:notes`（`Note[]`）、`local:categories`（`Category[]`）
- 建立 `composables/useStorageSync.ts` 封裝雙向同步邏輯
- App 啟動時先 hydrate（從 storage 載入）再 mount，避免空白閃爍

### 新增 / 修改檔案

| 檔案 | 動作 | 說明 |
|------|------|------|
| `composables/useStorageSync.ts` | 新增 | 雙向 Pinia↔storage 同步 composable |
| `composables/useStorageSync.test.ts` | 新增 | 單元測試 (TDD) |
| `stores/notes.ts` | 修改 | 加入 `useStorageSync`，expose `hydrate()` |
| `stores/notes.test.ts` | 修改 | 補充持久化相關測試 |
| `stores/categories.ts` | 修改 | 加入 `useStorageSync`，expose `hydrate()` |
| `stores/categories.test.ts` | 修改 | 補充持久化相關測試 |
| `stores/auth.ts` | 修改 | `signOut()` 移除清空 notes/categories 的邏輯 |
| `stores/auth.test.ts` | 修改 | 更新 signOut 測試 |
| `entrypoints/sidepanel/router.ts` | 修改 | 移除強制登入 guard，僅保留已登入時跳過 `/login` |
| `entrypoints/sidepanel/main.ts` | 修改 | 改為 async init，hydrate stores 後再 mount |
| `entrypoints/sidepanel/App.vue` | 修改 | header 改為永遠顯示；訪客模式顯示「Sign in」連結 |
| `entrypoints/sidepanel/views/LoginView.vue` | 修改 | 新增「以訪客模式繼續」按鈕 |

---

## Tasks

### `useStorageSync` composable

- [ ] 建立 `composables/useStorageSync.test.ts`，撰寫失敗測試（TDD red）
  - [ ] 測試 `hydrate()` 從 storage 讀取並填入 ref
  - [ ] 測試 ref 變更後觸發 `setValue`
  - [ ] 測試外部 storage 變更更新 ref
  - [ ] 測試相同值不造成無限迴圈
- [ ] 實作 `composables/useStorageSync.ts`，使所有測試通過（TDD green）

### Notes Store 持久化整合

- [ ] 補充 `stores/notes.test.ts` 持久化測試（TDD red）
  - [ ] 測試 `hydrate()` 從 storage 載入筆記
  - [ ] 測試 `addNote()` 後 storage `setValue` 被呼叫
- [ ] 修改 `stores/notes.ts`，加入 `useStorageSync` 並 expose `hydrate()`（TDD green）

### Categories Store 持久化整合

- [ ] 補充 `stores/categories.test.ts` 持久化測試（TDD red）
  - [ ] 測試 `hydrate()` 從 storage 載入分類
  - [ ] 測試 `addCategory()` 後 storage `setValue` 被呼叫
- [ ] 修改 `stores/categories.ts`，加入 `useStorageSync` 並 expose `hydrate()`（TDD green）

### Auth Store signOut 行為修正

- [ ] 更新 `stores/auth.test.ts`：signOut 不應清空 notes/categories（TDD red）
- [ ] 修改 `stores/auth.ts`：移除 `splice(0)` 呼叫（TDD green）

### Router 訪客模式

- [ ] 更新 router 測試：未登入可存取 `/`（TDD red）
- [ ] 修改 `entrypoints/sidepanel/router.ts`：移除強制登入重導（TDD green）

### App 初始化與 UI

- [ ] 修改 `entrypoints/sidepanel/main.ts`：async init + hydrate stores before mount
- [ ] 修改 `entrypoints/sidepanel/App.vue`：header 永遠顯示，訪客模式顯示 Sign in 連結
- [ ] 修改 `entrypoints/sidepanel/views/LoginView.vue`：新增「Continue without signing in」按鈕，副標題改為「Sign in to sync across devices」

---

## Manual Testing Tasks

> 以下項目需要手動在瀏覽器中驗證。

- [ ] **訪客模式**：開啟擴充功能，確認不需登入即可看到筆記列表（首頁）
- [ ] **筆記 CRUD**：在訪客模式下新增、編輯、刪除筆記，確認功能正常
- [ ] **持久化**：新增筆記後關閉並重新開啟側邊欄，確認筆記仍存在
- [ ] **分類持久化**：新增分類後重新開啟側邊欄，確認分類仍存在
- [ ] **登出不清資料**：登入後新增筆記，登出後確認筆記仍保留在本地
- [ ] **Sign in 連結**：訪客模式下，確認 header 顯示「Sign in」連結，點擊可導向登入頁
- [ ] **Continue as guest**：在登入頁點擊「Continue without signing in」，確認導向首頁
