# Interface Contract & API Spec

## 1. Canonical IDs
*   **user_id**: 系統內部識別碼，建議由 `user_email` 進行 hash (例如 `usr_md5(email)`) 或由後端統一發放。
*   **user_email**: 系統主要識別單位。所有 API 呼叫的 auth 區塊皆需包含此欄位。
*   **question_id**: 格式 `q_<yyyymmdd>_<random6>`
*   **response_id**: 格式 `r_<yyyymmdd>_<random6>`
*   **score_id**: 格式 `s_<yyyymmdd>_<random6>`

## 2. API Envelope
**Standard Request:**
```json
{
  "meta": {
    "action": "action_name",
    "timestamp": "2026-04-24T10:30:00+08:00"
  },
  "auth": {
    "user_email": "user@example.com",
    "user_name": "User Name"
  },
  "payload": {}
}
```

**Standard Response:**
```json
{
  "success": true,
  "code": "OK",
  "message": "...",
  "data": {},
  "error": null
}
```

## 3. Endpoints

### 3.1 POST /register-key
*   **Purpose**: 註冊並於當下即時測試 API Key。
*   **Payload**: `{"api_key": "user_input_key"}`
*   **Logic**: 
    1. 後端收到請求後，立刻使用該 key 進行輕量級的 Token validation test (例如呼叫 Gemini API 產生極短的回覆)。
    2. 若測試成功，寫入/更新使用者狀態為 valid 並回傳成功。
    3. 若測試失敗 (例如 Invalid key 或 quota exceeded)，回傳錯誤給前端，且**不將該 key 寫入**系統或覆蓋原有 key。

### 3.2 POST /generate-question
*   **Purpose**: 根據設定生成新題目。
*   **Payload**: 
    ```json
    {
      "difficulty": "L2", 
      "domain": "ecommerce", 
      "api_key": "user_api_key"
    }
    ```
*   **Response Data**: 
    ```json
    {
      "question_id": "q_123456", 
      "title": "...", 
      "instruction": "...", 
      "sample_data": "...", 
      "difficulty": "L2", 
      "domain": "ecommerce", 
      "prompt_version": "gen_v1"
    }
    ```

### 3.3 POST /submit-response
*   **Purpose**: 提交回答並進行 AI 評分。
*   **Payload**: 
    ```json
    {
      "question_id": "q_123456", 
      "response_text": "User's answer...", 
      "api_key": "user_api_key", 
      "question_tab_url": "https://docs.google.com/spreadsheets/d/.../edit#gid=123"
    }
    ```
*   **Logic**: 需傳入該題的 Sheet Tab URL，以便後端寫入 Database 供未來點擊追蹤。
*   **Response Data**: 
    ```json
    {
      "score_id": "s_123456", 
      "overall_score": 15, 
      "structure_score": 4, 
      "clarity_score": 4, 
      "logic_score": 4, 
      "judgment_score": 3, 
      "feedback_comment": "- 結構清晰\n- 判斷有待加強", 
      "evaluator_version": "eval_v1"
    }
    ```

### 3.4 GET /export-records
*   **Purpose**: 將後端 Database 紀錄匯出。
*   **Payload**: 
    ```json
    {
      "format": "json", // or "csv"
      "table": "Scores" // or Users, Questions, Responses
    }
    ```
*   **Logic**: 將指定的 backend record table 以 JSON API 的形式吐出，或封裝成 CSV 給前端下載。
