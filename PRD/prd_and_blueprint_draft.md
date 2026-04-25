# Data Judgment Training Platform
## PRD + Blueprint Draft

---

# 1. 文件目的

本文件定義一套以 Google 生態為核心、由 AI 協助開發與營運的訓練平台，用於訓練使用者的資料判斷（Data Judgment）、結構化輸出、報表解讀與口頭表達能力。

本文件同時作為：
- 產品需求文件（PRD）
- 系統藍圖（Blueprint）
- 多 AI agent 協作開發分工依據
- 風險與控制點清單

---

# 2. Product Overview

## 2.1 產品名稱（暫定）
Data Judgment Training Platform

## 2.2 問題定義
目前訓練對象在以下能力存在缺口：
- 無法快速將模糊概念轉成清楚結構
- 無法在有限資訊下進行資料判斷與問題 framing
- 面對報表或資料樣本時，缺少 pattern recognition 與口頭表達能力
- 缺乏穩定、可週期化、可追蹤的訓練系統

## 2.3 產品目標
建立一套可重複使用、低教學負擔、可多使用者擴展的訓練系統，使訓練者可以：
- 控制題目生成邏輯與 prompt
- 控制難度、領域與評分規則
- 留存使用者題目、回答、評分與歷史紀錄
- 透過每位使用者自備 API Key 的方式，避免中央 token 成本膨脹

## 2.4 非目標（Out of Scope for MVP）
以下不列入 MVP：
- 完整獨立 Web App 前端
- 複雜帳號系統
- 即時多人協作編輯
- 高精度自動化作弊偵測
- 語音辨識與語音評分
- 自適應推薦引擎

---

# 3. Core Product Concept

## 3.1 核心架構理念
採用「可複製 User UI + 單一 Central Backend + Central Database」模式。

### 前端（User-facing）
每位使用者擁有一份自己的 Google Sheet，作為：
- 個人 UI
- 個人題目操作介面
- 個人回答紀錄與成績查閱入口
- 個人 API Key 註冊入口

### 後端（Admin-controlled）
由單一中央 Google Apps Script Backend 負責：
- 題目生成 prompt 控制
- 題目評分 prompt 控制
- 難度與領域規則控制
- 對 Gemini / AI API 的呼叫編排
- 對中央 Database 的寫入與讀取

### 資料中台（Database）
由中央後台 Google Sheet 承擔：
- user profile/config
- 題目記錄
- 回答記錄
- 評分記錄
- prompt version 與系統設定

## 3.2 成本模型
每位使用者自行註冊個人 API Key，儲存在其 User Sheet 對應的 user-level properties 中。

目的：
- 讓 token usage 由使用者自行承擔
- 強制使用者學會基本 API onboarding
- 避免中央成本不可控
- 形成自然 rate limit

---

# 4. User Roles

## 4.1 Trainer / Admin
職責：
- 規劃訓練目標與週期
- 管理 prompt 邏輯、版本與規則
- 檢視所有 user 的歷史表現
- 控制允許的難度與領域範圍

## 4.2 Trainee / User
職責：
- 完成 API Key 註冊
- 在被允許的範圍內生成題目
- 填寫回答並提交
- 查看個人成績與歷史紀錄

## 4.3 AI Development Agents
職責：
- 根據 blueprint 與 spec 分工設計與開發不同模組
- 保持介面一致與資料格式一致
- 避免跨模組隱性耦合

---

# 5. Primary Use Cases

## 5.1 User 首次啟用
1. User 取得一份複製後的 User Google Sheet
2. User 按照課程說明去 Google AI Studio 取得個人 API Key
3. User 在 Profile / Setup 頁面完成：
   - 名稱
   - email / user id
   - API Key 註冊
4. 系統檢查 API Key 是否可用
5. User 開始生成題目

## 5.2 User 生成題目
1. User 在 UI 選擇允許範圍內的：
   - difficulty
   - domain
2. 點擊 Generate Question
3. User Sheet 呼叫 Central Backend
4. Backend 根據：
   - user config
   - difficulty rules
   - domain rules
   - current prompt version
   - user API Key
   產生題目
5. Backend 回傳結果
6. User Sheet 新增一個題目分頁並寫入：
   - 題目描述
   - sample data
   - metadata

## 5.3 User 提交回答
1. User 在題目分頁填寫回答
2. 點擊 Submit
3. User Sheet 呼叫 Central Backend
4. Backend 執行評分流程
5. Backend 回傳：
   - 總分
   - 維度分數
   - comment
6. User Sheet 更新：
   - 該題成績
   - profile 頁摘要
7. Backend 同步寫入 central database

## 5.4 Trainer 管理後台
1. Trainer 在 Backend Admin Sheet 調整：
   - difficulty availability
   - prompt version
   - domain config
   - usage limits
2. Trainer 查看整體 user 表現紀錄
3. Trainer 對 prompt 或系統版本進行迭代

---

# 6. Functional Requirements

## 6.1 User UI Requirements
### 6.1.1 Profile / Setup Page
必須包含：
- User Name
- User Identifier（email 或 system id）
- API Key registration 區域
- 可用難度與領域選單
- 個人成績摘要
- 當前 prompt / system version（可顯示簡化版本）

### 6.1.2 Question Generation
- User 僅可選擇被允許的 difficulty / domain
- 點擊後系統生成一題
- 每題以一個獨立 sheet tab 呈現
- 每題需有唯一 question_id

### 6.1.3 Question Tab
每一題應包含：
- 任務情境 (Business Context) 與題目資訊
- sample data (微型高密度，約 10~15 筆)
- instruction
- Health Check SOP 區塊（要求填寫：異常欄位、錯誤類型、處置策略）
- 清洗後資料填寫區
- metadata（question_id, difficulty, domain, created_at）
- submit button
- score 與 AI 盲區雷達診斷區（提交後顯示）

### 6.1.4 History / Summary
MVP 可簡化為：
- Profile Page 上顯示最近幾筆紀錄
- 或獨立 History sheet

## 6.2 Backend Requirements
### 6.2.1 Prompt Management
Backend 必須集中管理：
- generation prompt
- evaluation prompt
- scoring rules
- version id

### 6.2.2 User Config Management
需可查詢：
- user allowed difficulty
- domain access
- usage cap
- API status

### 6.2.3 Evaluation Output
至少回傳（維度與雷達圖相關）：
- overall_score
- format_score
- business_logic_score
- strategy_score
- completeness_score
- feedback_comment (AI 盲區雷達診斷文字版)

### 6.2.4 Logging
需記錄：
- request timestamp
- user id
- action type
- question id
- status
- error message（若有）

## 6.3 Database Requirements
中央後台 sheet 至少需有以下 tables / tabs：
- Users
- Questions
- Responses
- Scores
- PromptVersions
- SystemConfig
- AuditLog

---

# 7. Non-Functional Requirements

## 7.1 Maintainability
- 所有核心邏輯集中於 backend
- User Sheet 僅承擔 UI 與輕量交互
- Prompt 不能散落在 user-side

## 7.2 Security
- User API Key 不得寫入中央 database 明文保存
- Prompt 不直接回傳給 user
- Endpoint 須有限制與驗證

## 7.3 Scalability
- 可支持多 user 同時使用
- 可在不修改 User UI 主結構下更新 backend prompt

## 7.4 Versioning
- Prompt version 必須可追蹤
- API schema version 建議保留
- 資料表 schema 若改版需有 migration 說明

---

# 8. System Blueprint

## 8.1 High-Level Architecture

```text
[User Google Sheet UI]
  ├─ Profile / Setup
  ├─ Generate Question Button
  ├─ Question Tabs
  └─ Submit Button
          ↓
    [User-side GAS thin client]
          ↓
    [Central GAS Web App Backend]
          ├─ Auth / Request validation
          ├─ Prompt orchestration
          ├─ AI API call orchestration
          ├─ Scoring logic
          └─ Database write/read
          ↓
    [Central Backend Google Sheet Database]
          ↓
      [Reporting / Admin view]
```

## 8.2 Design Principle
- UI 與核心邏輯分離
- Prompt 與 scoring rule 集中
- Database 為 single source of truth
- User API Key 為 user-owned cost layer
- 所有關鍵行為皆可 log

---

# 9. Data Model Draft

## 9.1 Users
建議欄位：
- user_id
- user_name
- user_email
- sheet_id
- status
- allowed_difficulty
- allowed_domain
- weekly_limit
- created_at
- updated_at

## 9.2 Questions
- question_id
- user_id
- difficulty
- domain
- prompt_version
- question_title
- question_body
- sample_data_json / serialized text
- created_at
- sheet_tab_name

## 9.3 Responses
- response_id
- question_id
- user_id
- response_text
- submitted_at
- raw_payload_snapshot

## 9.4 Scores
- score_id
- question_id
- user_id
- overall_score
- format_score
- business_logic_score
- strategy_score
- completeness_score
- evaluator_version
- feedback_comment
- scored_at

## 9.5 PromptVersions
- prompt_version
- type（generation / evaluation）
- content_reference
- notes
- status
- created_at

## 9.6 AuditLog
- log_id
- user_id
- action_type
- related_id
- status
- error_message
- timestamp

---

# 10. API / Endpoint Blueprint Draft

## 10.1 Endpoint Strategy
採用 Central GAS Web App 作為 backend API layer。

## 10.2 Recommended Endpoints
### POST /register-key
用途：註冊與驗證 user API key

Input:
- user_id
- api_key

Output:
- success
- validation_status
- message

### POST /generate-question
Input:
- user_id
- difficulty
- domain
- api_key_ref / direct key from user-side client
- sheet_context

Output:
- question_id
- title
- instruction
- sample_data
- metadata

### POST /submit-response
Input:
- user_id
- question_id
- response_text
- api_key_ref / direct key

Output:
- score object
- feedback
- scored_at

### GET /user-summary
Input:
- user_id

Output:
- latest scores
- count of completed questions
- avg score
- recent activity

### POST /sync-record
可選，用於同步某些 user-side metadata

## 10.3 API Design Risks
- GAS Web App response format handling 不穩定時，需統一 JSON envelope
- 錯誤碼需標準化，避免前端難以判斷
- request payload 不可過大，sample data 需控長度

---

# 11. UI Blueprint Draft

## 11.1 User Sheet Structure
### Sheet A: Home / Profile
用途：
- onboarding
- API key registration
- 選擇 difficulty / domain
- 啟動 generate
- 顯示成績摘要

### Dynamic Question Sheets
命名範例：
- Q_20260501_001
- Q_20260501_002

用途：
- 題目顯示
- sample data 顯示
- user answer input
- submit action
- score display

### Optional: History
- question list
- score summary
- completion rate

## 11.2 UI Risks
- 每題一個 sheet tab，長期可能造成 sheet 過多
- 若 sample data 過大，UI 會變慢
- 按鈕綁定 script 時，複製 template 後需確認 binding 正常

## 11.3 UI Mitigation
- 設定上限，例如每份 UI sheet 最多保留最近 N 題
- 舊題轉存到 History 或 archive text block
- sample data 控制在小樣本

---

# 12. Prompt System Blueprint

## 12.1 Prompt Separation
分成至少兩類：
- Question Generation Prompt
- Evaluation Prompt

## 12.2 Prompt Control Goals
- 避免 user 提前得知題型全貌與 scoring logic 細節
- 支持多 difficulty / domain
- 支持 prompt versioning

## 12.3 Prompt Risks
- Prompt 洩漏後 user 可逆向利用
- Prompt 過度複雜導致 token 浪費
- prompt 改版造成評分結果漂移

## 12.4 Prompt Mitigation
- prompt 僅存在 backend
- 每次回傳不暴露完整 prompt
- 版本號寫入 Questions / Scores 表
- 建立 prompt regression test cases

---

# 13. Security and Risk Register

## 13.1 API Key Risk
風險：
- User API Key 洩漏
- User 不小心把 API Key 寫到可見欄位

控制：
- 儲存於 user-level properties，不寫入公開儲存格
- UI 提示不得貼到表格中
- 設計 reset / replace key 流程

## 13.2 Prompt Leakage Risk
風險：
- User 直接看到 prompt
- User 繞過系統直接複製 prompt 邏輯

控制：
- Prompt 僅 backend 持有
- endpoint 只回結果，不回 prompt

## 13.3 Abuse / Rate Limit Risk
風險：
- User 無限制生成題目
- backend 被濫用當 proxy

控制：
- 每 user 每日 / 每週上限
- Audit log
- 生成 / 提交動作記錄

## 13.4 Scoring Quality Drift Risk
風險：
- AI 評分不穩
- prompt 改版導致分數不可比

控制：
- 保存 evaluator_version
- 設定固定 rubric
- 使用 benchmark sample 進行回歸測試

## 13.5 Data Integrity Risk
風險：
- user sheet 與 backend DB 記錄不一致
- submission 成功但 DB 寫入失敗

控制：
- transaction-like write ordering
- write status flag
- 補 sync endpoint

## 13.6 Maintainability Risk
風險：
- user-side GAS 寫太重
- 各 agent 各自開發造成介面不一致

控制：
- user-side 只保留 thin client
- 統一 interface spec
- 所有 agent 按 contract 開發

---

# 14. Development Scope by Module

## 14.1 Module A — Backend API Layer
內容：
- Web App endpoints
- request parsing
- response envelope
- routing

重點：
- interface stability
- 錯誤處理一致

風險：
- payload 不一致
- endpoint 命名混亂

## 14.2 Module B — Prompt Orchestration
內容：
- generation prompt templates
- evaluation prompt templates
- version control

重點：
- rubric 穩定
- 難度與領域規則映射

風險：
- prompt 漂移
- token 爆量

## 14.3 Module C — AI Client Layer
內容：
- 呼叫 Gemini / compatible AI API
- request / response parsing
- retry / timeout

重點：
- 正確處理 user API key
- 不落地保存敏感值

風險：
- key handling 不當
- API response 不穩

## 14.4 Module D — User Sheet UI
內容：
- Home / Profile layout
- Generate 按鈕
- Submit 按鈕
- Question sheet creation

重點：
- 操作直覺
- 錯誤提示清楚

風險：
- UX 太複雜
- tab 過多

## 14.5 Module E — Sheet Data Access Layer
內容：
- 封裝讀寫 Users / Questions / Responses / Scores
- ID generation
- append / update helpers

重點：
- schema 一致
- 可回溯

風險：
- hard-coded range 太多
- schema 改版時崩壞

## 14.6 Module F — Scoring and Feedback
內容：
- 評分 rubric
- score normalization
- feedback comment formatting

重點：
- 分數可比較
- comment 不要過度冗長

風險：
- 評分不一致
- comment 太泛

## 14.7 Module G — Reporting / Export
內容：
- user summary
- trainer dashboard
- API / export hooks

重點：
- trainer 能快速看趨勢
- 格式適合後續串接

風險：
- 先做太重
- 報表設計與核心流程耦合

---

# 15. Multi-Agent Development Blueprint

## 15.1 Agent Design Principle
- 每個 agent 必須有清楚 scope
- 所有 agent 以 shared contract 為準
- 任務切分以模組邊界為單位，不以零散 function 為單位
- 需要一個 integration / architecture owner 做最終收斂

## 15.2 Recommended Agent Roles

### Agent 0 — Architecture / Integration Lead
職責：
- 定義總體架構
- 維護 interface contract
- 審核各 agent 輸出是否一致
- 控制版本與 integration 順序

輸出：
- system architecture doc
- module contract
- integration checklist

風險：
- 若無此角色，各 agent 會各寫各的

---

### Agent 1 — Backend API Architect
職責：
- 設計 backend API schema
- 定義 request / response format
- 設計 error handling

輸出：
- endpoint spec
- payload examples
- response envelope contract

重點：
- 穩定、簡潔、可擴展

---

### Agent 2 — Prompt System Designer
職責：
- 設計 generation prompt
- 設計 evaluation prompt
- 定義 rubric 與 prompt versioning

輸出：
- prompt templates
- prompt variables spec
- scoring rubric
- regression samples

重點：
- 控制 prompt 漂移
- 控制 token 成本

---

### Agent 3 — GAS Backend Engineer
職責：
- 實作 Central GAS Web App
- endpoint routing
- AI client integration
- backend service logic

輸出：
- GAS backend code
- deployment steps
- env / config keys list

重點：
- 統一 logging
- 正確處理 user API key flow

---

### Agent 4 — Sheet Data Layer Engineer
職責：
- 實作 sheet-based database access layer
- CRUD helper functions
- ID / record management

輸出：
- data access utilities
- schema helper
- write / read abstraction

重點：
- 避免各模組直接操作 range

---

### Agent 5 — User Sheet UI / UX Designer
職責：
- 設計 Home / Profile page
- 設計 Question sheet layout
- 設計使用者操作流

輸出：
- UI layout spec
- sheet field map
- button placement plan

重點：
- 降低 user 認知負擔
- 確保複製後可用

---

### Agent 6 — User-side GAS Thin Client Engineer
職責：
- 實作 User Sheet 上的按鈕與事件
- 封裝 generate / submit call
- 管理 user properties 中的 API key

輸出：
- thin client GAS code
- property handling functions

重點：
- 不寫重邏輯
- 不暴露 prompt

---

### Agent 7 — Scoring QA / Evaluation Analyst
職責：
- 驗證評分邏輯合理性
- 測試不同回答下的分數穩定度
- 制定 benchmark

輸出：
- evaluation test plan
- benchmark cases
- scoring drift report

重點：
- 可比較性
- 穩定性

---

### Agent 8 — Security / Abuse Control Reviewer
職責：
- 審查 API key handling
- 審查 prompt leakage 風險
- 審查 abuse / rate limit 機制

輸出：
- security checklist
- abuse scenarios
- mitigation recommendations

重點：
- 防止系統被當 proxy 濫用

---

### Agent 9 — Reporting / Analytics Designer
職責：
- 設計 trainer dashboard
- 設計 export / API-ready summary structure
- 設計個人進度追蹤欄位

輸出：
- dashboard metrics spec
- export schema
- trend indicators

重點：
- 不要過早做過重 dashboard

---

# 16. Agent Collaboration Rules

## 16.1 Shared Contracts Required
以下內容必須先定稿再同步開發：
- user_id definition
- question_id definition
- endpoint names
- JSON payload schema
- database field names
- scoring output format
- prompt variable names

## 16.2 Integration Order
建議順序：
1. Architecture / integration contract
2. Data schema
3. API spec
4. Prompt spec
5. Backend implementation
6. User thin client
7. UI polish
8. QA / security / reporting

## 16.3 Merge Rules
- 不允許 agent 自行改 shared field names
- 所有跨模組變更需更新 contract doc
- integration lead 需負責最後對齊

---

# 17. MVP Development Phases

## Phase 0 — Architecture Freeze
產出：
- PRD 定稿
- blueprint 定稿
- interface contract 定稿

## Phase 1 — Core End-to-End
目標：
- User 可以註冊 key
- 生成一題
- 回答一題
- 提交評分
- 寫入 DB

## Phase 2 — Stability and Logging
目標：
- error handling
- audit logs
- usage cap
- version tracking

## Phase 3 — Reporting and Operationalization
目標：
- trainer summary
- export / API hooks
- user progress tracking

---

# 18. Open Decisions / Pending Questions

以下議題尚待定案：
1. User-side 是否允許保留多少歷史 question tabs？
2. API key 註冊流程是否需要驗證成功後才解鎖 generate？
3. 使用者識別以 email 為主，或自定 user_id 為主？
4. 評分 comment 要多短、多結構化？
5. 每週生成與提交上限要不要直接在 MVP 實作？
6. export 功能先做 sheet summary，還是直接做 API response？
7. Backend database 是否單 sheet 多 tabs，或拆多份 sheet 檔案？

---

# 19. Suggested Next Deliverables

建議下一輪文件拆分為：
1. Interface Contract Spec
2. Database Schema Spec
3. Prompt Spec
4. User Sheet UI Spec
5. Backend Endpoint Spec
6. Agent Task Board

---

# 20. One-line Strategic Summary

這個系統的最佳實作策略不是讓每個使用者擁有一套完整獨立邏輯，而是讓每個使用者擁有可複製的 UI，並由中央 backend 集中控制 prompt、規則、評分與資料記錄，同時把 API 使用成本下放給使用者自己承擔。

---

# Appendix A — Interface Contract Spec (Draft)

## A.1 Purpose
本規格定義 User Sheet、User-side GAS thin client、Central Backend、Database layer 之間的共用介面，作為所有 AI agent 的共同 contract。

## A.2 Contract Design Principles
- 所有跨模組資料交換一律使用明確欄位名稱
- 不允許 agent 自行發明同義欄位
- 所有 response 必須使用統一 envelope
- 所有 timestamp 使用 ISO 8601 string
- 所有 id 欄位一律為 string

## A.3 Canonical IDs
### user_id
建議格式：
- `usr_<stable_hash_or_slug>`

來源原則：
- 優先由 backend 建立與發放
- 不建議直接用 user name 當主鍵
- email 可作為 lookup key，但不作為唯一內部 ID 顯示給一般 agent 使用

### question_id
建議格式：
- `q_<yyyymmdd>_<random6>`

### response_id
建議格式：
- `r_<yyyymmdd>_<random6>`

### score_id
建議格式：
- `s_<yyyymmdd>_<random6>`

## A.4 Shared Enums
### action_type
允許值：
- `register_key`
- `generate_question`
- `submit_response`
- `get_user_summary`
- `sync_record`

### difficulty
允許值（MVP）：
- `L1`
- `L2`
- `L3`

### domain
允許值（初稿，可擴）：
- `ecommerce`
- `ads`
- `finance`
- `crm`
- `general_business`

### score_dimension
固定為：
- `structure`
- `clarity`
- `logic`
- `judgment`

## A.5 Standard Request Envelope
所有 POST request body 統一為：

```json
{
  "meta": {
    "action": "generate_question",
    "client_version": "v0.1",
    "request_id": "req_xxx",
    "timestamp": "2026-04-24T10:30:00+08:00"
  },
  "auth": {
    "user_id": "usr_xxx"
  },
  "payload": {}
}
```

### Contract Notes
- `request_id` 用於 audit 與錯誤追蹤
- `client_version` 用於判斷 user-side thin client 是否過舊
- `auth` 在 MVP 階段僅最小化使用，後續可擴充

## A.6 Standard Response Envelope
所有 backend response 統一為：

```json
{
  "success": true,
  "code": "OK",
  "message": "Request completed",
  "data": {},
  "error": null,
  "meta": {
    "request_id": "req_xxx",
    "backend_version": "v0.1",
    "timestamp": "2026-04-24T10:30:02+08:00"
  }
}
```

錯誤情況：

```json
{
  "success": false,
  "code": "INVALID_API_KEY",
  "message": "API key validation failed",
  "data": null,
  "error": {
    "type": "validation_error",
    "details": "User API key was rejected"
  },
  "meta": {
    "request_id": "req_xxx",
    "backend_version": "v0.1",
    "timestamp": "2026-04-24T10:30:02+08:00"
  }
}
```

## A.7 Endpoint Contracts
### A.7.1 register-key
#### Request payload
```json
{
  "user_name": "Blake Intern A",
  "user_email": "internA@example.com",
  "api_key": "user_supplied_key"
}
```

#### Response data
```json
{
  "user_id": "usr_xxx",
  "validation_status": "valid",
  "registered_at": "2026-04-24T10:30:00+08:00"
}
```

#### Risks / Notes
- backend 不應明文保存 user API key 到 central sheet
- 若需保存狀態，只記 `key_status`、`last_validated_at`

### A.7.2 generate-question
#### Request payload
```json
{
  "difficulty": "L2",
  "domain": "ecommerce",
  "api_key": "user_supplied_key",
  "sheet_id": "user_sheet_id",
  "sheet_name": "Profile"
}
```

#### Response data
```json
{
  "question": {
    "question_id": "q_20260424_ab12cd",
    "title": "Order Data Judgment Exercise",
    "instruction": "Please identify likely issues in the sample data.",
    "sample_data": "serialized table or markdown block",
    "difficulty": "L2",
    "domain": "ecommerce",
    "prompt_version": "gen_v1"
  }
}
```

#### Risks / Notes
- `sample_data` 長度需控管
- response 不回 prompt text

### A.7.3 submit-response
#### Request payload
```json
{
  "question_id": "q_20260424_ab12cd",
  "response_text": "User answer here",
  "api_key": "user_supplied_key"
}
```

#### Response data
```json
{
  "score": {
    "score_id": "s_20260424_ef34gh",
    "overall_score": 16,
    "structure_score": 4,
    "clarity_score": 4,
    "logic_score": 4,
    "judgment_score": 4,
    "feedback_comment": "Clear structure and reasonable judgment.",
    "evaluator_version": "eval_v1",
    "scored_at": "2026-04-24T10:40:00+08:00"
  }
}
```

#### Risks / Notes
- response_text 長度上限需定義
- 必須可追蹤 question_id 與 evaluator_version

### A.7.4 get-user-summary
#### Request payload
```json
{
  "target_user_id": "usr_xxx"
}
```

#### Response data
```json
{
  "summary": {
    "completed_questions": 12,
    "average_score": 15.3,
    "latest_score": 17,
    "latest_activity_at": "2026-04-24T10:40:00+08:00",
    "weakest_dimension": "judgment"
  }
}
```

## A.8 UI Contract
User-side thin client 可依賴的最小欄位：
- Profile!B2 = user_name
- Profile!B3 = user_email
- Profile!B5 = selected_difficulty
- Profile!B6 = selected_domain
- Question tab 固定 answer input cell 需統一（例如 B20）

### Risks / Notes
- UI layout 若頻繁改動，thin client 會壞
- 建議由 UI spec 凍結命名區域或固定欄位映射

## A.9 Logging Contract
最低 log 欄位：
- request_id
- user_id
- action_type
- related_id
- status
- error_code
- timestamp

---

# Appendix B — Database Schema Spec (Draft)

## B.1 Purpose
本規格定義 central backend Google Sheet database 的 tabs、欄位與寫入規則，作為所有寫入/讀取 agent 的共同來源。

## B.2 Database Strategy
MVP 採用「單一 Backend Spreadsheet，多 tabs 分表」模式。

理由：
- 管理簡單
- 權限集中
- 易於人工檢查

### Risks
- 單一 sheet 長期膨脹
- 高頻 append 時效能下降

### Mitigation
- 保留 archive 策略
- 長期可拆分 log / score 到獨立檔案

## B.3 Tab Definitions
### B.3.1 Users
用途：user metadata 與控制設定

欄位：
- `user_id`
- `user_name`
- `user_email`
- `user_sheet_id`
- `status`
- `allowed_difficulty`
- `allowed_domain`
- `weekly_limit`
- `key_status`
- `last_validated_at`
- `created_at`
- `updated_at`

注意：
- 不保存 raw API key
- `allowed_difficulty` / `allowed_domain` 若需多值，可先用逗號字串，後續再抽象

### B.3.2 Questions
用途：保存每次生成的題目

欄位：
- `question_id`
- `user_id`
- `difficulty`
- `domain`
- `prompt_version`
- `question_title`
- `question_instruction`
- `sample_data_snapshot`
- `user_sheet_id`
- `user_sheet_tab_name`
- `created_at`

注意：
- `sample_data_snapshot` 為小樣本，不應保存極大文本
- 需保留 prompt_version 供回溯

### B.3.3 Responses
用途：保存使用者提交的回答

欄位：
- `response_id`
- `question_id`
- `user_id`
- `response_text`
- `submitted_at`
- `response_status`
- `raw_payload_snapshot`

注意：
- `response_status` 可標記 `submitted`, `scored`, `error`
- `raw_payload_snapshot` 用於 debug，需控制長度

### B.3.4 Scores
用途：保存評分結果

欄位：
- `score_id`
- `question_id`
- `response_id`
- `user_id`
- `overall_score`
- `structure_score`
- `clarity_score`
- `logic_score`
- `judgment_score`
- `feedback_comment`
- `evaluator_version`
- `scored_at`

注意：
- `overall_score` 建議來自固定 rubric，而非自由生成
- `evaluator_version` 必填

### B.3.5 PromptVersions
用途：保存 prompt 版本索引

欄位：
- `prompt_version`
- `prompt_type`
- `description`
- `status`
- `created_at`
- `notes`

注意：
- 不建議把完整 prompt 直接存於易誤編輯 tab
- 可存 reference id 或簡化摘要

### B.3.6 SystemConfig
用途：控制系統行為

欄位：
- `config_key`
- `config_value`
- `config_scope`
- `updated_at`
- `notes`

典型 key：
- `max_question_tabs_per_user_sheet`
- `default_weekly_limit`
- `max_response_length`
- `generation_enabled`
- `submission_enabled`

### B.3.7 AuditLog
用途：操作審計與除錯

欄位：
- `log_id`
- `request_id`
- `user_id`
- `action_type`
- `related_id`
- `status`
- `error_code`
- `error_message`
- `timestamp`

## B.4 Write Rules
- 所有 append 由 data access layer 封裝
- 不允許 endpoint 直接手寫 range row logic
- 所有 records 都要有 created_at / timestamp 類欄位
- 先寫 Questions / Responses，再寫 Scores，不可反向

## B.5 Data Integrity Rules
- `question_id` 必須唯一
- `response_id` 必須唯一
- `score_id` 必須唯一
- `Scores.question_id` 必須存在於 Questions
- `Responses.question_id` 必須存在於 Questions
- `Scores.response_id` 必須存在於 Responses

## B.6 Indexing and Practical Notes
Google Sheets 無真正索引，實務上：
- user_id、question_id、response_id 必須格式簡短且可搜尋
- 若資料量增加，需建立 helper maps 或 cache

## B.7 Risks / Control Points
### Risk: Schema drift
控制：
- schema field names 凍結
- 改版時更新 schema version

### Risk: Manual edits break integrity
控制：
- Backend Sheet 只開放 trainer/admin 編輯
- 重要 tabs 設保護範圍

### Risk: Large text bloat
控制：
- 控制 sample_data_snapshot 與 raw_payload_snapshot 長度
- 長文本必要時只保存摘要 + external reference

---

# Appendix C — Prompt Spec (Draft)

## C.1 Purpose
本規格定義 generation 與 evaluation prompt 的設計原則、變數、輸出格式與版本控管方式，確保 prompt 可維護、可比較、可回歸測試。

## C.2 Prompt Strategy
Prompt 分為兩大類：
1. Generation Prompt
2. Evaluation Prompt

兩者皆由 backend 持有與注入，不下放到 user-side。

## C.3 Shared Prompt Principles
- 僅使用必要上下文，避免 token 浪費
- 強制要求穩定輸出格式
- 不讓模型自由發揮 system behavior
- 所有 prompt 都必須對應 version

## C.4 Generation Prompt Spec
### Goal
根據指定 domain 與 difficulty，生成一題資料判斷題，包含：
- 題目標題
- instruction
- sample data
- 預期 focus area（僅 backend 用）

### Required Input Variables
- `domain`
- `difficulty`
- `user_level_rules`
- `question_style_rules`
- `data_error_pattern_pool`
- `prompt_version`

### Hidden Backend Variables
不回傳給 user：
- error pattern selection logic
- expected answer categories
- internal difficulty mapping notes

### Suggested Output Format
模型輸出先要求 JSON：

```json
{
  "title": "...",
  "instruction": "...",
  "sample_data": "...",
  "internal_expected_patterns": ["format_error", "duplicate"],
  "internal_notes": "..."
}
```

### User-facing Mapping
回給 user 僅包含：
- title
- instruction
- sample_data
- metadata

### Risks
- 輸出格式不穩
- sample data 過長
- 題目過度暴露答案方向

### Controls
- 嚴格要求 JSON
- sample_data 限定行數與欄數
- internal fields 不回傳 user

## C.5 Evaluation Prompt Spec
### Goal
對 user response 依固定 rubric 評分，產出：
- 各維度分數
- 總分
- 簡短 feedback

### Required Input Variables
- `question_title`
- `question_instruction`
- `sample_data_snapshot`
- `user_response`
- `rubric_definition`
- `evaluator_version`

### Rubric Dimensions
固定 4 維：
- structure
- clarity
- logic
- judgment

### Scoring Scale
建議每維 0–5：
- 0 = absent / unusable
- 1 = weak
- 2 = partial
- 3 = acceptable
- 4 = good
- 5 = strong

### Evaluation Output Format
```json
{
  "structure_score": 4,
  "clarity_score": 3,
  "logic_score": 4,
  "judgment_score": 3,
  "overall_score": 14,
  "feedback_comment": "Clear structure, but judgment depth can be improved."
}
```

### Risks
- comment 漂移太大
- 分數不穩定
- 模型自由加入不必要評論

### Controls
- comment 限定 1–2 句
- rubric 定義明確
- 要求先逐維評估再輸出分數
- 以 benchmark set 做 regression test

## C.6 Prompt Versioning Rules
### Version Naming
- generation: `gen_v1`, `gen_v2`
- evaluation: `eval_v1`, `eval_v2`

### Required Tracking
Questions 表必記：
- `prompt_version`

Scores 表必記：
- `evaluator_version`

### Change Policy
以下變更必須升版：
- rubric 修改
- domain logic 修改
- difficulty mapping 修改
- sample data generation format 修改

## C.7 Prompt Regression Testing
每次 major prompt 調整前後，至少用固定 benchmark 測試：
- 3 題 generation cases
- 5 筆 evaluation cases

比較：
- 題目格式是否穩定
- 題目是否過度暴露
- 分數是否大幅漂移

## C.8 Prompt Authoring Risks
### Risk: Prompt too smart, system too fragile
控制：
- prompt 不做過多隱性推理分支
- 難度、domain、rubric 用結構化變數帶入

### Risk: Prompt too long
控制：
- 用 reusable blocks
- system-level invariants 固定化

### Risk: Evaluation becomes style-biased
控制：
- rubric 聚焦在結構、清晰、邏輯、判斷
- 不對文風、語氣、修辭過度加分

---

# Appendix D — Immediate Build Sequence (Recommended)

## D.1 Freeze first
先定稿以下三件：
1. IDs 與欄位名稱
2. JSON request / response 格式
3. generation / evaluation output JSON 格式

## D.2 Build order
1. Database schema + helper map
2. Backend endpoint skeleton
3. Prompt templates
4. User thin client generate flow
5. User thin client submit flow
6. Score writeback + summary sync

## D.3 Do-not-build-yet list
- adaptive difficulty engine
- advanced analytics dashboard
- multi-backend support
- voice / transcript support
- anti-cheating heuristics

---

# 16. Domains & Difficulty Levels

## 16.1 Domain (產業類型) 定義

在生成題目時，需根據選擇的 `domain` 套用對應的產業地雷與情境：

1.  **電商與零售 (E-commerce / Retail)**
    *   **常見雷區**：退貨金額大於購買金額、訂單/付款/出貨的時間序顛倒、折扣碼疊加後金額變負數、庫存為負、狀態矛盾（已取消卻顯示已出貨）。
    *   **訓練重點**：時間序列邏輯、金額核算。
2.  **金融與支付 (FinTech / Banking)**
    *   **常見雷區**：身分證/統編邏輯校驗碼錯誤、未成年開戶（開戶日 - 生日 < 18）、異常的單筆交易極值、幣別與匯率換算錯誤、帳戶狀態已凍結卻有新交易。
    *   **訓練重點**：嚴格的格式校驗、極值敏感度。
3.  **醫療與健康照護 (Healthcare)**
    *   **常見雷區**：生理數據不合理（例如心跳 300、體重 5kg 的成人）、診斷時間早於入院時間、男性出現婦科診斷紀錄、年齡與疾病不符（10 歲得阿茲海默症）。
    *   **訓練重點**：跨欄位的 Domain Knowledge 常識判斷。
4.  **行銷與 CRM (Marketing / CRM)**
    *   **常見雷區**：Email 網域無效（如 `@gmaill.con`）、手機號碼區碼與長度錯誤、一個使用者有多個變體的 User ID（重複註冊）、活動點擊時間早於 Email 發送時間。
    *   **訓練重點**：字串清理、重複值去重 (Deduplication)、關聯性判斷。

## 16.2 Difficulty (難度等級) 定義

在生成題目時，需根據 `difficulty` 調整情境的隱蔽度與錯誤的複雜度：

*   **Level 1: 實習生入職 (Basic)**
    *   **地雷比例**：格式錯誤 60%、商業邏輯 40%
    *   **Context 特色**：「明示型」條件（例如：直接說明年齡小於18不能算）。
    *   **目標**：培養看文件做事的習慣，熟練處理常見格式髒數據，抓出字面上違規。
*   **Level 2: 獨立接案 (Intermediate)**
    *   **地雷比例**：格式錯誤 30%、商業邏輯 70%
    *   **Context 特色**：「跨欄位/暗示型」條件（例如：要求計算 Q1 營收，需自行推導退款不計入、日期需篩選）。
    *   **目標**：培養對「合理性」的直覺，找出跨欄位的邏輯矛盾。
*   **Level 3: 拆彈專家 (Advanced / Edge Cases)**
    *   **地雷比例**：格式錯誤 10%、極端商業邏輯 90%
    *   **Context 特色**：「多重條件交錯」（例如：VIP與一般會員退貨天數不同，特價品另有規定）。
    *   **目標**：訓練在複雜業務規則下的邏輯判斷，需綜合多個欄位條件才能揪出異常。

