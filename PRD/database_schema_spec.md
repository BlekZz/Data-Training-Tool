# Database Schema Spec

> **最後更新**: 2026-04-25
> **狀態**: 已與實作對齊 (DatabaseSetup.js / Database.js)

**Strategy**: Single Backend Google Sheet with Multiple Tabs.
**Sheet ID**: `1a-Po10_gmaLxfEWwSU31hQjoW0Jqpv_t4U9YM4KZnNw`

---

## 1. Users
以 `user_email` 為主要識別。

| 欄位 | 說明 |
|------|------|
| `user_id` | Primary Key |
| `user_email` | Unique, 主要識別 |
| `user_name` | 使用者名稱 |
| `user_sheet_id` | 使用者專屬 Sheet 的 ID |
| `user_sheet_url` | 使用者專屬 Sheet 的 URL |
| `status` | 帳號狀態 (active / inactive) |
| `allowed_difficulty` | 允許的難度範圍 |
| `allowed_domain` | 允許的產業領域 |
| `weekly_limit` | 每週生成/提交上限 (MVP 測試 token usage) |
| `key_status` | API Key 狀態 (Valid / Invalid) |
| `last_validated_at` | 最後一次驗證時間 |
| `created_at` | 建立時間 |
| `updated_at` | 更新時間 |

> **🔧 待辦**: `weekly_limit` 檢查邏輯尚未在 Router.js 中實作。

## 2. Questions
每次 AI 生成題目時自動寫入一筆。

| 欄位 | 說明 |
|------|------|
| `question_id` | PK, 格式 `Q_<timestamp>_<random>` |
| `user_email` | 請求生成的使用者 |
| `difficulty` | Level 1 / Level 2 / Level 3 |
| `domain` | 電商/金融/醫療/行銷 |
| `prompt_version` | 使用的 Prompt 版本 (e.g. `v1.0`) |
| `question_title` | AI 生成的題目名稱 |
| `business_context` | 任務情境 / 解題線索 |
| `question_instruction` | 給實習生的操作指示 |
| `sample_data_snapshot` | JSON 字串，約 10~15 筆微型高密度資料 |
| `expected_health_check_answers` | JSON 字串，標準答案預期 |
| `question_tab_url` | 題目在 User Sheet 中的分頁 URL |
| `created_at` | 建立時間 (ISO 8601) |

## 3. Responses
每次使用者提交回答時寫入一筆。

| 欄位 | 說明 |
|------|------|
| `response_id` | PK, 格式 `R_<timestamp>_<random>` |
| `question_id` | FK → Questions |
| `user_email` | 提交者 |
| `user_health_check_sop` | JSON 字串，使用者填寫的健檢 SOP 表單 |
| `user_cleaned_data` | JSON 字串，使用者清洗後的最終資料 |
| `submitted_at` | 提交時間 (ISO 8601) |
| `response_status` | 狀態 (SUBMITTED / SCORED) |

## 4. Scores
每次 AI 評分完成後寫入一筆。

| 欄位 | 說明 |
|------|------|
| `score_id` | PK, 格式 `S_<timestamp>_<random>` |
| `question_id` | FK → Questions |
| `response_id` | FK → Responses |
| `user_email` | 被評分者 |
| `overall_score` | 總分 (0-20) |
| `format_score` | 基礎格式敏感度 (0-5) |
| `business_logic_score` | 商業邏輯判斷 (0-5) |
| `strategy_score` | 異常值處置策略 (0-5) |
| `completeness_score` | 清洗完整度 (0-5) |
| `evaluator_version` | AI 評分器版本 |
| `feedback_comment` | AI 盲區雷達診斷文字 (150字內) |
| `scored_at` | 評分時間 (ISO 8601) |

## 5. PromptVersions
紀錄 Prompt 版本與參照。

| 欄位 | 說明 |
|------|------|
| `prompt_version` | 版本號 (e.g. `v1.0`) |
| `type` | generation / evaluation |
| `notes` | 版本備註 |
| `status` | active / deprecated |
| `created_at` | 建立時間 |

## 6. SystemConfig
存放系統全域變數，支援動態切換 AI 模型。

| 欄位 | 說明 |
|------|------|
| `config_key` | 設定鍵 |
| `config_value` | 設定值 |
| `description` | 說明 |
| `updated_at` | 更新時間 |

**目前已寫入的設定值：**

| config_key | config_value | 用途 |
|------------|-------------|------|
| `GEMINI_PRO_MODEL` | `gemini-2.0-flash` | 出題與評分使用的模型 |
| `GEMINI_FLASH_MODEL` | `gemini-2.0-flash` | 輕量測試使用的模型 |

> **💡 設計重點**: 當 Google 更新模型名稱時，只需在此表修改，無需改動任何程式碼。`GeminiClient.js` 會在每次呼叫時動態讀取此表。

## 7. AuditLog
紀錄所有 API 請求，用於 debug 與安全稽核。

| 欄位 | 說明 |
|------|------|
| `log_id` | 唯一識別 |
| `user_email` | 操作者 |
| `action_type` | 動作類型 (generate-question / submit-response) |
| `related_id` | 關聯的 question_id 或 response_id |
| `status` | success / error |
| `error_message` | 若失敗，記錄錯誤訊息 |
| `timestamp` | 操作時間 |

> **🔧 待辦**: AuditLog 寫入邏輯尚未在 Router.js 中實作。
