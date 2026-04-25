# Interface Contract & API Spec

> **最後更新**: 2026-04-25
> **狀態**: 已與實作對齊 (Router.js v1.0)

## 1. Canonical IDs

| ID 類型 | 格式 | 範例 |
|---------|------|------|
| `question_id` | `Q_<timestamp>_<random3>` | `Q_1745585234000_742` |
| `response_id` | `R_<timestamp>_<random3>` | `R_1745585280000_153` |
| `score_id` | `S_<timestamp>_<random3>` | `S_1745585310000_891` |

*   **user_email**: 系統主要識別單位。所有 API 呼叫皆需包含此欄位。

## 2. API 通訊方式

### 架構
*   **Protocol**: HTTP POST (透過 `UrlFetchApp.fetch`)
*   **Backend**: GAS Web App (`doGet` / `doPost`)
*   **Authentication**: Google Workspace 環境下需帶 `Authorization: Bearer <OAuthToken>`；個人帳號部署可免。
*   **Content-Type**: `application/json`

### Request 格式 (Flat Structure)
```json
{
  "action": "action_name",
  "apiKey": "user_gemini_api_key",
  "userEmail": "user@example.com",
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

### 3.1 POST — `register-key`
*   **Purpose**: 註冊並驗證 API Key（目前為 Mock 實作）。
*   **Request**:
    ```json
    { "action": "register-key", "apiKey": "..." }
    ```
*   **Response**:
    ```json
    { "status": "success", "message": "API Key Validate - Mocked Success" }
    ```
*   **🔧 待辦**: 實作真正的 Gemini API 輕量測試驗證。

### 3.2 POST — `generate-question`
*   **Purpose**: 根據產業領域與難度等級，呼叫 AI 生成地雷題目。
*   **Request**:
    ```json
    {
      "action": "generate-question",
      "apiKey": "user_api_key",
      "userEmail": "user@example.com",
      "domain": "電商與零售 (E-commerce / Retail)",
      "difficulty": "Level 1",
      "question_tab_url": "https://docs.google.com/...#gid=123"
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
        "internal_notes": "出題邏輯說明..."
      }
    }
    ```
*   **副作用**: 自動寫入 `Questions` 工作表。

### 3.3 POST — `submit-response`
*   **Purpose**: 提交使用者的健檢 SOP 與清洗後資料，呼叫 AI 評分。
*   **Request**:
    ```json
    {
      "action": "submit-response",
      "apiKey": "user_api_key",
      "userEmail": "user@example.com",
      "question_id": "Q_1745585234000_742",
      "user_health_check_sop": [
        { "field": "order_id", "error_type": "格式錯誤", "strategy": "標記", "note": "..." }
      ],
      "user_cleaned_data": [{ "order_id": "A001", ... }, ...]
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
        "feedback_comment": "🟢 基礎格式敏感度 (4/5)：..."
      }
    }
    ```
*   **副作用**: 自動寫入 `Responses` 與 `Scores` 工作表，並同步記錄 `AuditLog`。

### 3.4 GET — Health Check
*   **Purpose**: 確認 Backend 是否存活。
*   **Response**: `Data Judgment Training Platform - Backend API is running.`

## 4. 尚未實作的 Endpoints

| Endpoint | 用途 | 優先級 |
|----------|------|--------|
| `register-key` (完整版) | 真正驗證 API Key 有效性 | 🟡 Medium |
| `export-records` | 匯出 DB 紀錄為 JSON/CSV | ⬜ Low |
| `user-summary` | 取得使用者歷史統計 | ⬜ Low |
