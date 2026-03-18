# Phase 4 — Firebase 帳號登入

**前置功能需求**：無（可與 Phase 1、2、3 並行開發，但 Phase 5、6 依賴本階段）

本階段整合 Firebase Authentication，讓使用者以 Google 帳號登入並登出。登入後的 UID 將作為 Phase 6 金鑰衍生的依據，Firestore 同步（Phase 5）也需要有效 session。

---

## 涵蓋使用者故事

- **US-10** — 使用 Google 帳號登入
- **US-12** — 登出帳號

---

## EARS 需求規格

### US-10 使用 Google 帳號登入

```
1. WHEN the user clicks the 'Sign in with Google' button,
   THE EXTENSION SHALL initiate the Google OAuth flow via the Chrome Identity API
   (browser.identity.getAuthToken) and sign in to Firebase with the returned credential.

2. WHEN authentication succeeds,
   THE EXTENSION SHALL automatically navigate to the note list and display
   the authenticated user's profile name in the header.

3. IF the authentication flow fails or is cancelled by the user,
   THEN THE EXTENSION SHALL display an appropriate error or status message and remain on the login screen.
```

### US-12 登出帳號

```
1. WHEN the user clicks the sign-out button,
   THE EXTENSION SHALL terminate the active session and clear all locally cached user data.

2. WHEN the user is signed out,
   THE EXTENSION SHALL display the login screen and prevent access to the note list
   until the user signs in again.
```

---

## 實作範圍

### 新增 / 修改檔案

| 檔案 | 說明 |
|------|------|
| `firebase.config.ts` | Firebase app 初始化（apiKey、projectId 等環境變數） |
| `stores/auth.ts` | Pinia auth store — user state, signIn, signOut |
| `stores/auth.test.ts` | Store 單元測試（mock Firebase SDK）(TDD) |
| `entrypoints/sidepanel/views/LoginView.vue` | Google 登入頁面 UI |
| `entrypoints/sidepanel/router.ts` | 加入 `/login` 路由，navigation guard 保護 `/` |
| `entrypoints/sidepanel/App.vue` | 根據 auth 狀態顯示 user info + 登出按鈕 |

### 依賴套件

```bash
pnpm add firebase
```

---

## Tasks

### Firebase 設定

- [x] 在 Firebase Console 建立專案，啟用 Authentication（Google provider）
- [x] 將 Firebase 設定（`firebaseConfig`）存為環境變數（`.env.development.local`）
- [x] 建立 `firebase.config.ts`，初始化 Firebase app 與 Auth 實例
- [x] 將 Firebase 設定相關金鑰加入 `.gitignore`（確保 `.env.*.local` 已被忽略）

### Auth Store（`stores/auth.ts`）

- [x] 建立 `stores/auth.test.ts`，撰寫失敗測試（TDD red，mock `firebase/auth`）
  - [x] 測試初始 state：`user` 為 `null`，`isLoading` 為 `false`
  - [x] 測試 `signInWithGoogle` 成功後 `user` 更新為 mock user 物件
  - [x] 測試 `signInWithGoogle` 失敗後 `error` 更新，`user` 仍為 `null`
  - [x] 測試 `signOut` 後 `user` 變為 `null`
- [x] 實作 `stores/auth.ts`，使所有測試通過（TDD green）
  - [x] `state`: `user: User | null`, `isLoading: boolean`, `error: string | null`
  - [x] `getter`: `isAuthenticated`, `uid`
  - [x] `action`: `signInWithGoogle()` — 使用 `browser.identity.getAuthToken` 取得 OAuth access token，再以 `signInWithCredential` 登入 Firebase（避免 MV3 CSP 限制）
  - [x] `action`: `signOut()` — 呼叫 `firebaseSignOut`，清空本地 notes / categories store
  - [x] `onAuthStateChanged` 監聽器於 store 初始化時啟動

### 路由保護

- [x] 更新 `entrypoints/sidepanel/router.ts`
  - [x] 新增 `/login` 路由 → `LoginView`
  - [x] 加入 navigation guard：未登入時重導至 `/login`；已登入時 `/login` 重導至 `/`

### UI

- [x] 建立 `entrypoints/sidepanel/views/LoginView.vue`
  - [x] 顯示 Fast Notes logo / 標題
  - [x]「Sign in with Google」按鈕
  - [x] 載入中 spinner（`isLoading` 為 true 時）
  - [x] 錯誤訊息區塊（`error` 有值時顯示）
  - [x] 監聽 `isAuthenticated`，登入成功後自動導向 `/`（`watch` on auth state）
- [x] 更新 `entrypoints/sidepanel/App.vue`
  - [x] 已登入時於 header 顯示使用者頭像或名稱
  - [x] 提供「登出」按鈕，點擊後呼叫 `signOut`

---

## Manual Testing Tasks

> 以下項目需要手動在瀏覽器中驗證，無法以 Vitest 自動化測試。

- [x] 在正常 Chrome 中載入 `.output/chrome-mv3-dev/`（OAuth 測試需要真實 Chrome，不能用 `pnpm dev` 的測試瀏覽器）
- [x] **登入流程**：點擊「Sign in with Google」，確認 Chrome 原生帳號選擇視窗彈出
- [x] **登入成功**：選擇 Google 帳號後，確認自動跳轉至筆記頁並顯示使用者名稱
- [x] **登入取消**：在 OAuth popup 點擊取消，確認停留在登入頁並顯示適當訊息
- [x] **Session 持久性**：關閉並重新開啟側邊欄，確認登入狀態仍保留（不需重新登入）
- [x] **登出流程**：點擊登出按鈕，確認跳轉回登入頁，本地筆記清空
- [x] **路由保護**：未登入狀態下直接訪問 `#/`，確認被重導至 `#/login`
