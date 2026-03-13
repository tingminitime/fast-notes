# Phase 6 — 跨瀏覽器支援

**前置功能需求**：
- [Phase 1 — 側邊欄介面與筆記管理](./phase-1-notes-ui.md)
- [Phase 2 — 分類管理](./phase-2-categories.md)
- [Phase 3 — Firebase 帳號登入](./phase-3-firebase-auth.md)
- [Phase 4 — 雲端同步（Firestore）](./phase-4-cloud-sync.md)
- [Phase 5 — 端到端加密](./phase-5-encryption.md)

本階段確認 Fast Notes 可在 Chrome、Firefox、Edge 三款瀏覽器上正確建置、安裝並完整運作。WXT 已提供跨瀏覽器建置指令，本階段重點為相容性驗證與修正。

---

## 涵蓋使用者故事

- **US-15** — 在多種主流瀏覽器上使用

---

## EARS 需求規格

### US-15 在多種主流瀏覽器上使用

```
1. THE EXTENSION SHALL be installable and fully functional on Google Chrome
   via the Chrome Web Store.

2. THE EXTENSION SHALL be installable and fully functional on Mozilla Firefox
   via Firefox Add-ons.

3. THE EXTENSION SHALL be installable and fully functional on Microsoft Edge
   via the Edge Add-ons store.

4. THE EXTENSION SHALL provide a consistent user interface and feature set
   across all three supported browsers.
```

---

## 實作範圍

### 建置指令（已存在，驗證即可）

```bash
pnpm build           # Chrome / Edge (Chromium MV3)
pnpm build:firefox   # Firefox (MV2)
pnpm zip             # Chrome zip for Chrome Web Store
pnpm zip:firefox     # Firefox zip for Firefox Add-ons
```

### 需要注意的相容性差異

| 項目 | Chrome / Edge | Firefox |
|------|--------------|---------|
| Manifest 版本 | MV3 | MV2 |
| Side Panel API | `chrome.sidePanel` | `browser.sidebarAction` |
| Firebase Auth popup | 支援 | 需確認 popup 行為 |
| Web Crypto API | 支援 | 支援 |

### 新增 / 修改檔案

| 檔案 | 說明 |
|------|------|
| `wxt.config.ts` | 確認 Firefox target 設定與 manifest 差異處理 |
| `entrypoints/background.ts` | 確認 Firefox `sidebarAction` API 相容 |

---

## Tasks

### 建置驗證

- [ ] 執行 `pnpm compile`，確認 TypeScript 無型別錯誤
- [ ] 執行 `pnpm build`，確認 Chrome 版本建置成功（無 warning / error）
- [ ] 執行 `pnpm build:firefox`，確認 Firefox 版本建置成功（無 warning / error）
- [ ] 執行 `pnpm lint`，確認無 ESLint 違規

### 相容性修正

- [ ] 檢查 `entrypoints/background.ts` 的 `sidePanel.open` 在 Firefox 建置中的行為，必要時加入 browser 判斷
- [ ] 確認 Firebase Auth popup 在 Firefox extension context 中可正常觸發
- [ ] 確認 Tailwind CSS v4 在三款瀏覽器的渲染一致（測試各主要元件）

---

## Manual Testing Tasks

> 以下項目需要在各瀏覽器中安裝並手動驗證。

### Chrome

- [ ] 載入 `pnpm build` 產出的 `.output/chrome-mv3` 資料夾（開發者模式）
- [ ] 確認 icon 點擊可開啟 / 關閉 side panel
- [ ] 完成完整 smoke test：登入 → 新增筆記 → 分類 → 複製 → 刪除 → 登出
- [ ] 確認筆記在 Firestore 中以密文儲存

### Edge

- [ ] 載入 `pnpm build` 產出的 `.output/chrome-mv3` 資料夾（開發人員模式）
- [ ] 確認 icon 點擊可開啟 / 關閉 side panel
- [ ] 完成完整 smoke test：登入 → 新增筆記 → 分類 → 複製 → 刪除 → 登出

### Firefox

- [ ] 載入 `pnpm build:firefox` 產出的 `.output/firefox-mv2` 資料夾（`about:debugging`）
- [ ] 確認 icon 點擊可開啟 / 關閉 sidebar
- [ ] 完成完整 smoke test：登入 → 新增筆記 → 分類 → 複製 → 刪除 → 登出
- [ ] 確認 UI 在 Firefox 與 Chrome 視覺上一致
