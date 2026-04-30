# Interface Contract & API Spec

> **最後更新**: 2026-04-30
> **狀態**: 已與實作對齊 (Router.js / UserClient.js — v1.2)

## 1. Canonical IDs

| ID 類型 | 格式 | 範例 |
|---------|------|------|
| `question_id` | `Q_<timestamp>_<random3>` | `Q_1745585234000_742` |
| `response_id` | `R_<timestamp>_<random3>` | `R_1745585280000_153` |
| `score_id` | `S_<timestamp>_<random3>` | `S_1745585310000_891` |
| `user_id` | `U_<timestamp>_<random3>` | `U_1745585100000_421` |
| `log_id` (AuditLog) | `L_<timestamp>_<random3>` | `L_1745585310000_632` |
| `log_id` (ApiCallLog) | `AC_<timestamp>_<random3>` | `AC_1745585310000_105` |

*   **user_email**: 系統主要識別單位。所有 API 呼叫皆需包含此欄位。Backend 會對 email 執行 `.trim().toLowerCase()` 正規化。

## 2. API 通訊方式

### 架構
*   **Protocol**: HTTP POST (透過 `UrlFetchApp.fetch`)
*   **Backend**: GAS Web App (`doGet` / `doPost`)
*   **Authentication**: 目前使用 `Authorization: Bearer <OAuthToken>` header（由 `ScriptApp.getOAuthToken()` 取得）
*   **Content-Type**: `application/json`

### Request 格式 (Flat Structure)
```json
{
  "action": "action_name",
  "apiKey": "user_gemini_api_key",
  "userEmail": "user@example.com",
  "userSheetId": "spreadsheet_id",
  "userSheetUrl": "spreadsheet_url",
  ...action-specific fields
}
```

### Response 格式
```json
{
  "status": "success" | "error",
  "message": "...",
  ...action-specific data
}
```

## 3. Endpoints

### 3.1 GET — Health Check
*   **Purpose**: 確認 Backend 是否存活。
*   **Response**: `Data Judgment Training Platform - Backend API is running.`

### 3.2 POST — `register-key`
*   **Purpose**: 註冊並驗證 API Key（目前為 Mock 實作）。
*   **Request**:
    ```json
    { "action": "register-key", "apiKey": "..." }
    ```
*   **Response**:
    ```json
    { "status": "success", "message": "API Key Validate - Mocked Success" }
    ```
*   **🔧 待辦**: 實作真正的 Gemini API 輕量測試驗證 (呼叫 `ListModels`)。

### 3.3 POST — `generate-question`
*   **Purpose**: 根據產業領域與難度等級，呼叫 AI 生成地雷題目。
*   **Request**:
    ```json
    {
      "action": "generate-question",
      "apiKey": "user_api_key",
      "userEmail": "user@example.com",
      "domain": "電商與零售 (E-commerce / Retail)",
      "difficulty": "Level 1",
      "userSheetId": "spreadsheet_id",
      "userSheetUrl": "spreadsheet_url"
    }
    ```
*   **Response**:
    ```json
    {
      "status": "success",
      "question_id": "Q_1745585234000_742",
      "data": {
        "title": "電商日銷售報表初階稽核",
        "business_context": "這是一份 2023-10-25 的單日銷售清單...",
        "instruction": "請找出資料中的所有異常...",
        "sample_data": [{ "order_id": "A001", ... }, ...],
        "expected_health_check_answers": ["ORD-003 金額為中文非數值...", ...],
        "cleaned_data_template": [{ "order_id": "A001", ... }, ...],
        "internal_notes": "出題邏輯說明..."
      }
    }
    ```
*   **副作用**:
    - 自動寫入 `Questions` 工作表（含 `cleaned_data_template`）
    - 自動寫入 `AuditLog`
    - 每次 Gemini 呼叫寫入 `ApiCallLog`
    - 若 `userEmail` 為 `@inboundmarketing.tw` 且未註冊，自動寫入 `Users` 工作表

### 3.4 POST — `submit-response`
*   **Purpose**: 提交使用者的健檢 SOP 與清洗後資料，呼叫 AI 評分。
*   **Request**:
    ```json
    {
      "action": "submit-response",
      "apiKey": "user_api_key",
      "userEmail": "user@example.com",
      "question_id": "Q_1745585234000_742",
      "user_health_check_sop": [
        { "field": "order_id", "error_type": "基礎格式錯誤", "strategy": "標記待處理", "note": "..." }
      ],
      "user_cleaned_data": [{ "order_id": "A001", ... }, ...],
      "userSheetId": "spreadsheet_id",
      "userSheetUrl": "spreadsheet_url"
    }
    ```
*   **Response**:
    ```json
    {
      "status": "success",
      "score": {
        "format_score": 4,
        "business_logic_score": 3,
        "strategy_score": 4,
        "completeness_score": 4,
        "overall_score": 15,
        "feedback_comment": "🟢 基礎格式敏感度 (4/5)：...",
        "standard_answers": "1. ORD-003 金額為中文非數值...\n2. ...",
        "cleaned_data_template": "[{\"order_id\": \"A001\", ...}, ...]"
      }
    }
    ```
*   **Fallback 邏輯** (在 Router.js 中處理):
    - 若 Gemini 回傳未含 `standard_answers` → 從 `Questions.expected_health_check_answers` 取出並格式化
    - 若 Gemini 回傳未含 `cleaned_data_template` → 從 `Questions.cleaned_data_template` 取出
*   **副作用**:
    - 自動寫入 `Responses` 工作表
    - 自動寫入 `Scores` 工作表
    - 自動寫入 `AuditLog`
    - 每次 Gemini 呼叫寫入 `ApiCallLog`

## 4. 錯誤處理

所有 `doPost` 內的未捕獲錯誤會被 catch 區塊攔截並：
1. 寫入 `AuditLog`（含 `error_message`）
2. 回傳統一格式：
    ```json
    { "status": "error", "message": "Error: ..." }
    ```

### 常見錯誤訊息
| 錯誤 | 原因 |
|------|------|
| `User Email 未填寫或為空白` | Home B3 未填入 Email |
| `您的帳號 (...) 不在白名單中` | 非 `@inboundmarketing.tw` 且未手動加入 Users 表 |
| `Question not found: Q_xxx` | question_id 在 Questions 表中找不到 |
| `AI 呼叫失敗 (已嘗試 3 次)` | Gemini API 三次重試全部失敗 |

## 5. 尚未實作的 Endpoints

| Endpoint | 用途 | 優先級 |
|----------|------|--------|
| `register-key` (完整版) | 真正驗證 API Key 有效性 (呼叫 ListModels) | 🟡 Medium |
| `export-records` | 匯出 DB 紀錄為 JSON/CSV | ⬜ Low (Module G) |
| `user-summary` | 取得使用者歷史統計 | ⬜ Low (Module G) |

## 6. Client 版本追蹤

自 v1.2 起，`UserClient.js` 宣告 `CLIENT_VERSION` 常數，用於未來版本相容性檢查：
```javascript
const CLIENT_VERSION = "1.1.0";
```
