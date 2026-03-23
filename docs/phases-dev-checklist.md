## Phases Development Checklist

This checklist outlines the key development tasks and milestones for each phase of the Fast Notes project.

- [x] Phase 1 — 側邊欄介面與筆記管理：
  - **前置功能需求**：無（此為基礎功能，其他 Phase 皆依賴本階段）
  - 本階段完成核心筆記 CRUD 功能與側邊欄 UI，所有邏輯為純本地端操作（記憶體內），不涉及雲端或加密。
- [x] Phase 2 — 分類管理
  - **前置功能需求**：Phase 1
  - 本階段在 Phase 1 筆記功能的基礎上，新增分類（Category）的建立、指派與刪除功能，讓使用者能依主題組織筆記並進行篩選瀏覽。
- [x] Phase 3 — Reka UI 元件整合
  - **前置功能需求**：Phase 1、Phase 2
  - 本階段使用 `reka-ui` 無樣式 UI 元件庫，搭配 Tailwind CSS v4，取代 Phase 1 與 Phase 2 中所有手寫的 HTML 表單元素與互動元件，提升可及性（a11y）、鍵盤操作體驗與未來元件擴展性。
- [x] Phase 4 — Firebase 帳號登入
  - **前置功能需求**：Phase 1
  - 本階段整合 Firebase Authentication，讓使用者以 Google 帳號登入並登出。登入後的 UID 將作為 Phase 7 金鑰衍生的依據，Firestore 同步（Phase 6）也需要有效 session。
- [x] Phase 5 — 本地持久化與訪客模式
  - **前置功能需求**：Phase 1、Phase 2、Phase 4
  - 本階段將筆記與分類持久化至 `browser.storage.local`，並移除強制登入限制，讓使用者不需登入即可使用筆記功能（訪客模式）。登入改為可選操作，為後續雲端同步做準備。
- [x] Phase 6 — 雲端同步（Firestore）
  - **前置功能需求**：Phase 1、Phase 4、Phase 5
  - 本階段將 Phase 5 的本地持久化筆記 store 串接 Cloud Firestore，實現登入使用者的筆記自動雲端同步與跨裝置即時更新。離線時本地變更將被佇列，待連線恢復後自動補送。
- [ ] Phase 7 — 端到端加密
  - **前置功能需求**：Phase 1、Phase 4、Phase 6
  - 本階段在 Firestore 讀寫流程中加入 Web Crypto API，以 PBKDF2 從 Firebase UID 衍生 AES-GCM 256-bit 金鑰，確保 Firestore 中儲存的資料皆為密文，解密完全在客戶端完成。
- [ ] Phase 8 — 跨瀏覽器相容性
  - **前置功能需求**：Phase 1、Phase 2、Phase 3、Phase 4、Phase 5、Phase 6、Phase 7
  - 本階段確認 Fast Notes 可在 Chrome、Firefox、Edge 三款瀏覽器上正確建置、安裝並完整運作。WXT 已提供跨瀏覽器建置指令，本階段重點為相容性驗證與修正。
- [ ] Phase 9 — 後續規劃功能
  - **前置功能需求**：Phase 1、Phase 2
  - 本階段為 MVP 完成後的後續功能，每個子功能相互獨立，可按優先順序個別實作。