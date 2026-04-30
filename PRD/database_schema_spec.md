# Database Schema Spec

> **最後更新**: 2026-04-30
> **狀態**: 已與實作對齊 (DatabaseSetup.js / Database.js — v1.2)

**Strategy**: Single Backend Google Sheet with Multiple Tabs.
**Sheet ID**: `1a-Po10_gmaLxfEWwSU31hQjoW0Jqpv_t4U9YM4KZnNw`
**Timezone**: All timestamps are formatted as `yyyy-MM-dd HH:mm:ss` based on the script's local timezone (v1.3+).

---

## 1. Users
以 `user_email` 為主要識別。系統會自動抓取最新的 `user_sheet_url` 進行追蹤。
`@inboundmarketing.tw` 網域使用者首次呼叫 API 時自動註冊。

| 欄位 | 說明 |
|------|------|
| `user_id` | PK, 自動生成 `U_<timestamp>_<random>` |
| `user_email` | Unique, 主要識別 (normalize: `.trim().toLowerCase()`) |
| `user_name` | 使用者名稱 (自動擷取 Email 前綴) |
| `user_sheet_id` | 使用者最近一次使用的 Sheet ID |
| `user_sheet_url` | 使用者最近一次使用的 Sheet URL |
| `status` | 帳號狀態 (active / inactive) |
| `allowed_difficulty` | 允許的難度範圍 (Phase 5, 尚未實作) |
| `allowed_domain` | 允許的產業領域 (Phase 5, 尚未實作) |
| `weekly_limit` | 每週生成上限 (Phase 5, 尚未實作) |
| `key_status` | API Key 狀態 (Phase 5, 尚未實作) |
| `last_validated_at` | 最後一次驗證時間 |
| `created_at` | 建立時間 |
| `updated_at` | 更新時間 |

---

## 2. Questions
每次 AI 生成題目時自動寫入一筆。

| 欄位 | 說明 |
|------|------|
| `question_id` | PK, 格式 `Q_<timestamp>_<random>` |
| `user_email` | 請求生成的使用者 |
| `difficulty` | Level 1 / Level 2 / Level 3 |
| `domain` | 電商/金融/醫療/行銷 |
| `prompt_version` | 使用的 Prompt 版本 (e.g. `gen_v1.1`) |
| `question_title` | AI 生成的題目名稱 |
| `business_context` | 任務情境 / 解題線索 |
| `question_instruction` | 給實習生的操作指示 |
| `sample_data_snapshot` | JSON 字串，約 10~15 筆微型高密度資料 |
| `expected_health_check_answers` | JSON 字串，標準答案預期 |
| `question_tab_url` | 題目在 User Sheet 中的分頁 URL |
| `created_at` | 建立時間 (Local Time) |
| `cleaned_data_template` | JSON 字串，sample_data 的完整正確版本（v1.1 新增，col 13） |

> **設計重點**: `cleaned_data_template` 於出題時由 Gemini 一次性生成並儲存。評分時直接從此欄位讀取，不再重新生成，確保標準答案一致性。

## 3. Responses
每次使用者提交回答時寫入一筆。

| 欄位 | 說明 |
|------|------|
| `response_id` | PK, 格式 `R_<timestamp>_<random>` |
| `question_id` | FK → Questions |
| `user_email` | 提交者 |
| `user_health_check_sop` | JSON 字串，使用者填寫的健檢 SOP 表單 `[{field, error_type, strategy, note}]` |
| `user_cleaned_data` | JSON 字串，使用者清洗後的最終資料 |
| `submitted_at` | 提交時間 (Local Time) |
| `response_status` | 狀態 (SUBMITTED) |

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
| `evaluator_version` | AI 評分器版本 (e.g. `eval_v1.1`) |
| `feedback_comment` | AI 盲區雷達診斷文字 |
| `scored_at` | 評分時間 (Local Time) |

## 5. PromptVersions
紀錄 Prompt 版本與完整內容，支援即時切換與版本追溯。

| 欄位 | 說明 |
|------|------|
| `prompt_version` | 版本號 (e.g. `gen_v1.1`, `eval_v1.1`) |
| `type` | generation / evaluation |
| `system_instruction` | 完整的 System Instruction 文本 |
| `user_prompt_template` | 包含 `${domain}`, `${difficulty}` 等變數的模板 |
| `is_active` | 是否為目前啟用的版本 (TRUE/FALSE) |
| `created_at` | 建立時間 |

> **設計重點**: Prompt 完整文本直接存於此表，`PromptBuilder.js` 在每次 API 呼叫時動態讀取 `is_active = TRUE` 的版本。修改 Prompt 不需要重新部署程式碼。

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
紀錄所有 API 請求，用於 debug 與安全稽核。若工作表不存在會自動建立。

| 欄位 | 說明 |
|------|------|
| `log_id` | 唯一識別 `L_<timestamp>_<random>` |
| `user_email` | 操作者 |
| `action_type` | 動作類型 (generate-question / submit-response) |
| `related_id` | 關聯 ID (question_id / response_id) |
| `status` | success / error |
| `error_message` | 錯誤堆疊訊息 |
| `timestamp` | 操作時間 (Local Time) |

## 8. ApiCallLog
紀錄每一次 Gemini API 呼叫的詳細記錄（含 retry），用於效能監控與除錯。若工作表不存在會自動建立（v1.1 新增）。

| 欄位 | 說明 |
|------|------|
| `log_id` | 唯一識別 `AC_<timestamp>_<random>` |
| `timestamp` | 呼叫時間 (Local Time) |
| `user_email` | 呼叫者 |
| `action` | 動作類型 (generate-question / evaluate-response) |
| `model_name` | 使用的模型名稱 |
| `attempt` | 第幾次嘗試 (1/2/3) |
| `http_status` | HTTP 回應碼 |
| `duration_ms` | 呼叫耗時 (毫秒) |
| `success` | TRUE / FALSE |
| `error_detail` | 錯誤詳情 (截斷至 1000 字元) |

---

## 9. Schema Migration 記錄

| 遷移函式 | 版本 | 用途 |
|---------|------|------|
| `setupDatabaseHeaders()` | v1.0 | 全新安裝：建立所有工作表 + 預設 Prompt + SystemConfig |
| `migrateQuestionsAddCleanedData()` | v1.1 | 新增 Questions 表第 13 欄 `cleaned_data_template` |
| `migrateGenerationPrompt()` | v1.1 | 更新 generation prompt 加入 `cleaned_data_template` JSON 輸出 |
