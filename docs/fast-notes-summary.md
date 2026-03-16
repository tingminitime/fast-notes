# Fast Notes

一個輕量的瀏覽器側邊欄筆記工具，讓你在任何網頁上快速記錄、管理與取用你的筆記內容。

---

## 核心功能

- **瀏覽器側邊欄展開**：點擊擴充功能的 icon 後，側邊欄會展開，顯示筆記內容
- **雲端同步**：透過 Google 帳號登入並同步資料，方便不同裝置與瀏覽器同步使用者的筆記內容
- **端到端加密**：將使用者的筆記進行端到端加密，確保使用者的資料安全與隱私
- **筆記分類**：使用者可以新增筆記分類，方便使用者管理筆記
- **快速複製**：一鍵複製筆記內容至剪貼簿
- **功能設計**：新增、編輯、刪除筆記 (純文字輸入，儲存格式預留 Markdown 相容)
- **主要支援瀏覽器**：Chrome、Edge、Firefox

---

## 使用技術

### 擴充套件框架
- [WXT](https://wxt.dev/) — 跨瀏覽器擴充套件開發框架

### 前端
- Vue3 + TypeScript
- Vite
- Pinia (狀態管理)
- VueUse (組合式工具函式庫)
- Tailwind CSS v4 (樣式)
- Reka UI (UI 元件庫)
- Iconify (圖示)

### 測試
- Vitest (單元測試)

### 後端 / 雲端服務
- Firebase Authentication (Google 帳號登入)
- Cloud Firestore (資料儲存與跨裝置同步)

### 資料安全
- Web Crypto API — AES-GCM 256-bit 端對端加密
- PBKDF2 金鑰衍生 (基於 Firebase UID)
- 加密資料於本地完成，Firestore 僅儲存密文

### 目標平台
| 瀏覽器 | 商店 |
|--------|------|
| Google Chrome | Chrome Web Store |
| Mozilla Firefox | Firefox Add-ons |
| Microsoft Edge | Edge Add-ons |

---

## 專案規劃

### MVP 優先功能
1. 側邊欄 UI（新增 / 編輯 / 刪除筆記）
2. 分類與標籤管理
3. Google 帳號登入 + Firestore 同步 (同時保留擴展其他第三方登入的彈性)
4. 端對端加密保護

### 後續規劃功能
- 匯出 / 匯入筆記備份（JSON / Markdown）
- 支援 Markdown 預覽
- 擴展其他第三方登入服務 (e.g. Apple ID)
