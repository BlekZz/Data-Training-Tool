# Database Schema Spec

**Strategy**: Single Backend Google Sheet with Multiple Tabs.

## 1. Users
以 `user_email` 為主要識別。為了 MVP 階段測試 token usage，將啟用每週生成與提交上限。
*   `user_id` (Primary Key)
*   `user_email` (Unique, 主要識別)
*   `user_name`
*   `user_sheet_id` / `user_sheet_url`
*   `status`
*   `allowed_difficulty`
*   `allowed_domain`
*   `weekly_limit` (MVP 啟動以測試 token usage)
*   `key_status` (Valid/Invalid)
*   `last_validated_at`
*   `created_at`
*   `updated_at`

## 2. Questions
歷史 tabs 數量不受限。儲存對應的 tab URL 以供管理員/Trainer 直接跳轉查看該題目的完整 UI。
*   `question_id` (PK)
*   `user_email` / `user_id`
*   `difficulty`
*   `domain`
*   `prompt_version`
*   `question_title`
*   `question_instruction`
*   `sample_data_snapshot`
*   `question_tab_url` (直接跳轉至該題 tab 的連結)
*   `created_at`

## 3. Responses
*   `response_id` (PK)
*   `question_id` (FK)
*   `user_email` / `user_id`
*   `response_text`
*   `submitted_at`
*   `response_status`

## 4. Scores
*   `score_id` (PK)
*   `question_id` (FK)
*   `response_id` (FK)
*   `user_email` / `user_id`
*   `overall_score`
*   `structure_score`
*   `clarity_score`
*   `logic_score`
*   `judgment_score`
*   `feedback_comment` (100字內，條列式)
*   `evaluator_version`
*   `scored_at`

## 5. Other Tabs
*   **PromptVersions**: 紀錄 prompt 版本與參照。
*   **SystemConfig**: 存放系統全域變數 (例如 default_weekly_limit)。
*   **AuditLog**: 紀錄所有 API 請求、成功/失敗狀態，用於 debug 與安全稽核。
