# 🛠️ 管理員維護指南 (Admin Guide)

本指南對象為 **Trainer (導師)** 或系統維護人員，負責後端設定、Prompt 微調與進度監控。

---

## 🏗️ 系統架構與重大變更

### 1. 更換資料庫 (Database Swap)
若需要建立新的資料庫副本或更換 Google Sheet：
1.  **修改 `Config.js`**: 將 `DATABASE_SHEET_ID` 替換為新 Sheet 的 ID。
2.  **重新執行 Setup**: 在 `DatabaseSetup.js` 中執行 `setupDatabaseHeaders()`，在新 Sheet 中建立所有表頭。
3.  **重新部署**: **非常重要！** 每次修改 `Config.js` 後必須點選「部署」->「建立新版本」，否則 Web App 依然會寫入舊的資料庫。

### 2. 管理 API Token 狀態
*   **後端 Token**: 在 GAS 的「指令碼屬性」設定 `TEST_API_KEY` 僅供後端測試。
*   **前端 Token (BYOK)**: 系統設計為「使用者自備 Token」，這能避免導師帳號的 Quota 被實習生耗盡。若實習生報錯，首要檢查其 `Home` 分頁的 Key 是否有效。

---

## ⚙️ 後端設定與維護

### 1. 修改系統變數 (SystemConfig)
在資料庫 Sheet 的 `SystemConfig` 分頁中：
*   `GEMINI_PRO_MODEL`: 切換出題與評分的主力模型 (推薦 `gemini-2.0-flash`)。
*   此處修改後，後端 API 會即時生效，**無需重新部署**。

### 2. 提示詞微調 (PromptVersions)
這是系統的核心。在 `PromptVersions` 分頁中：
*   `gen_v1.0`: 負責控制出題的風格、地雷密度。
*   `eval_v1.0`: 負責評分標準、回饋口吻。
*   **如何更新**: 
    1. 新增一列，填入新的 Prompt 內容。
    2. 將舊版本的 `is_active` 設為 `FALSE`。
    3. 將新版本的 `is_active` 設為 `TRUE`。
    *   *註：API 每次都會讀取 TRUE 的版本。*

### 3. 查看稽核紀錄 (AuditLog)
如果使用者反應失敗，請檢查 `AuditLog`：
*   **status = error**: 會記錄詳細的 Error Message。
*   **action_type**: 區分是 `generate-question` 還是 `submit-response` 出錯。

---

## 👥 使用者管理 (Users)

*   **自動白名單**: 網域為 `@inboundmarketing.tw` 的使用者在第一次使用時會自動加入。
*   **手動加入**: 若有外部帳號，請手動在 `Users` 表格新增一列，填入 `user_email` 並將 `status` 設為 `active`。
*   **追蹤進度**: 透過 `user_sheet_url` 欄位，管理員可以隨時點擊進入查看實習生的作答現場。

---

## 🛡️ 安全性與 Debug 流程

### 1. 偵錯順序 (Troubleshooting Flow)
當系統不穩定時，請遵循以下檢查順序：
1.  **檢查 AuditLog**: 這是最重要的步驟。如果是程式報錯，這裡會有 `error_message`。
2.  **驗證使用者權限**: 檢查 `Users` 表格中該 Email 的 `status` 是否為 `active`。
3.  **檢查模型狀態**: 在 `SystemConfig` 確認模型名稱是否仍然有效（Google 有時會更新模型名稱後綴）。
4.  **確認 Web App 版本**: 確認 Web App 的 URL 是否為最新部署的版本。

### 2. 重置與清理
*   **清空資料**: 若要清空所有紀錄，直接刪除 Questions/Responses/Scores 下方的資料列即可，但請**保留標題列**。
*   **重新部署**: 任何後端 `.js` 檔案的更動，若未進行「New Deployment」，外部使用者都不會吃到更新。

