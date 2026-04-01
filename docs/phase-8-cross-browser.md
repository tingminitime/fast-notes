# Phase 8 — 跨瀏覽器支援

**前置功能需求**：
- [Phase 1 — 側邊欄介面與筆記管理](./phase-1-notes-ui.md)
- [Phase 2 — 分類管理](./phase-2-categories.md)
- [Phase 3 — Reka UI 元件整合](./phase-3-reka-ui-integration.md)
- [Phase 4 — Firebase 帳號登入](./phase-4-firebase-auth.md)
- [Phase 5 — 本地持久化與訪客模式](./phase-5-local-persistence.md)
- [Phase 6 — 雲端同步（Firestore）](./phase-6-cloud-sync.md)
- [Phase 7 — 端到端加密](./phase-7-encryption.md)

本階段確認 Fast Notes 可在 Chrome、Edge 兩款瀏覽器上正確建置、安裝並完整運作。兩款瀏覽器均基於 Chromium 並使用 Manifest V3，共用同一份建置產出，本階段重點為相容性驗證。Firefox 支援暫不列入本階段範圍。

---

## 涵蓋使用者故事

- **US-15** — 在多種主流瀏覽器上使用

---

## EARS 需求規格

### US-15 在多種主流瀏覽器上使用

```
1. THE EXTENSION SHALL be installable and fully functional on Google Chrome
   via the Chrome Web Store.

2. THE EXTENSION SHALL be installable and fully functional on Microsoft Edge
   via the Edge Add-ons store.

3. THE EXTENSION SHALL provide a consistent user interface and feature set
   across all supported browsers.
```

---

## 實作範圍

### 建置指令（已存在，驗證即可）

```bash
pnpm build   # Chrome / Edge (Chromium MV3)
pnpm zip     # Chrome zip for Chrome Web Store
```

### 需要注意的相容性說明

Chrome 與 Edge 均基於 Chromium，共用同一份 `.output/chrome-mv3` 建置產出，無需額外相容性處理。

---

## Tasks

### 建置驗證

- [x] 執行 `pnpm compile`，確認 TypeScript 無型別錯誤
- [x] 執行 `pnpm build`，確認建置成功（無 warning / error）
- [x] 執行 `pnpm lint`，確認無 ESLint 違規

---

## Manual Testing Tasks

> 以下項目需要在各瀏覽器中安裝並手動驗證。

### Chrome

- [x] 載入 `pnpm build` 產出的 `.output/chrome-mv3` 資料夾（開發者模式）
- [x] 確認 icon 點擊可開啟 / 關閉 side panel
- [x] 完成完整 smoke test：登入 → 新增筆記 → 分類 → 複製 → 刪除 → 登出
- [x] 確認筆記在 Firestore 中以密文儲存

### Edge

- [x] 載入 `pnpm build` 產出的 `.output/chrome-mv3` 資料夾（開發人員模式）
- [x] 確認 icon 點擊可開啟 / 關閉 side panel
- [x] 完成完整 smoke test：登入 → 新增筆記 → 分類 → 複製 → 刪除 → 登出
- [x] 確認 UI 在 Edge 與 Chrome 視覺上一致
