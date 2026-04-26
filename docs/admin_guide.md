# 🛠️ 管理員維護指南 (Admin Guide)

本指南對象為 **Trainer (導師)** 或系統維護人員，負責後端設定、Prompt 微調與進度監控。

---

## 🏗️ 系統架構簡述

平台採用 **"Central Backend, Distributed Frontend"** 模式：
*   **Central Database**: 單一 Google Sheet 儲存所有紀錄。
*   **Central Backend**: 部署於個人 Gmail 的 GAS Web App。
*   **User Sheets**: 使用者各自擁有的副本，透過 API 聯繫後端。

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

## ⚠️ 重大更動注意事項
*   **修改程式碼後**: 必須執行 `clasp push` 並在 GAS 後台 **「建立新版本部署 (New Version Deployment)」**。
*   **API Key 安全**: 嚴禁將 API Key 寫死在代碼中，請使用 GAS 的「指令碼屬性 (Script Properties)」存儲。
