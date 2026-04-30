# Data Judgment Training Platform

一套以 Google 生態為核心、由 AI 協助開發與營運的訓練平台，主要用於訓練使用者的**資料判斷 (Data Judgment)**、資料清洗工程規劃、與商業邏輯異常辨識能力。

## 產品概念 (Product Concept)

本平台採用「可複製 User UI + 單一 Central Backend + Central Database」的輕量級架構：
*   **前端 (User UI)**：每位使用者擁有獨立的 Google Sheet，具備自動渲染、進度動畫與座標錨點技術。
*   **後端 (Backend)**：單一 GAS Web App 集中處理核心邏輯，支援 3 層重試與 Fallback 機制。
*   **資料庫 (Database)**：中央 Google Sheet 存儲所有 Questions/Responses/Scores，並具備 AuditLog 與 ApiCallLog 稽核軌跡。
*   **動態提示詞 (Dynamic Prompts)**：Prompt 本體存於資料庫中，支援即時微調與版本追溯，無需重新部署。
*   **成本模型 (BYOK)**：使用者自備 Gemini API Key，成本由個人承擔。

## 專案結構 (Project Structure)

```
Data Training Tool/
├── README.md
├── CLAUDE.md                           # AI Agent 開發指引
├── .cursorrules                        # Cursor AI Agent 規則
├── .gitignore
├── .claude/                            # Claude Code 設定
│   ├── settings.local.json             # 允許的指令白名單
│   └── commands/                       # Slash 指令
│       ├── push-users.md               # /push-users: 全域推送 User Side
│       └── add-user.md                 # /add-user: 新增管理使用者
├── PRD/                                # 產品規格與設計文件
│   ├── prd_and_blueprint_draft.md
│   ├── interface_contract_spec.md
│   ├── database_schema_spec.md
│   ├── prompt_spec.md
│   ├── user_sheet_ui_spec.md
│   └── development_tracker.md
├── docs/                               # 操作與維護文件
│   ├── user_guide.md                   # 使用者操作指南
│   ├── admin_guide.md                  # 管理員維護指南
│   └── system_architecture.md          # 系統架構與流程圖
├── scripts/                            # DevOps 工具
│   ├── managed_users.json              # 管理的 User Side GAS Script ID 清單
│   └── push_all.ps1                    # 全域推送 PowerShell 腳本
├── data_training_tool_clasp/
│   ├── Backend Side/                   # 後端 GAS 程式碼 (Web App)
│   │   ├── .clasp.json                 # Backend GAS 專案 ID
│   │   ├── appsscript.json             # GAS 專案設定
│   │   ├── Config.js                   # 中央設定檔（模型名稱、DB ID）
│   │   ├── Router.js                   # API 路由 (doGet / doPost)
│   │   ├── PromptBuilder.js            # Prompt 組裝邏輯
│   │   ├── GeminiClient.js             # Gemini API 呼叫（含 3 層重試/Fallback/ApiCallLog）
│   │   ├── Database.js                 # 資料庫讀寫封裝
│   │   ├── DatabaseSetup.js            # DB 初始化 + 遷移腳本
│   │   └── TestRunner.js               # 測試工具函式
│   └── User Side/                      # 使用者端 GAS 程式碼
│       ├── .clasp.json                 # User Side GAS 專案 ID
│       ├── appsscript.json             # GAS 專案設定
│       ├── UserClient.js               # 前端邏輯（選單/生成/提交/渲染）
│       ├── LoadingDialog.html          # 生成中載入動畫（含成功/失敗狀態）
│       ├── SubmitLoadingDialog.html    # 提交中載入動畫（含分數預覽/失敗狀態）
│       └── test.js                     # 網路連線診斷工具
```

## 開發技術棧 (Tech Stack)

*   **Google Apps Script (GAS)**: 後端 API Layer 與試算表資料存取層。
*   **Google Sheets**: 前端 UI 介面與後端資料庫。
*   **Clasp**: 本地端 GAS 開發部署工具（透過 `npx` 呼叫，無 `package.json`）。
*   **Gemini API (v1beta)**: 題目生成與作答評分，預設模型 `gemini-2.0-flash`，Fallback `gemini-2.5-flash`。
*   **PowerShell**: 多使用者全域推送腳本 (`push_all.ps1`)。

## 部署架構 (Deployment)

| 元件 | 帳號 | 說明 |
|------|------|------|
| Backend Web App | 個人 Gmail | 確保 "Anyone" 存取權限可用 |
| Admin Database Sheet | 企業/個人 | 需分享編輯權限給 Backend 帳號 |
| User Sheet UI | 任意帳號 | 使用者各自複製一份 |

> **注意**：Google Workspace 企業帳號在部署 Web App 時受限於組織 IT 政策，建議後端使用個人 Gmail 帳號部署。

> **重要**：`clasp push` 只更新 GAS 編輯器中的程式碼，**不會**自動更新 `/exec` Web App endpoint。每次 push 後必須到 GAS 後台 Deploy → Manage deployments → Edit → New version → Deploy，才能讓線上使用者使用新版程式碼。此規則僅適用於 **Backend Side**；User Side 為 container-bound script，push 後即生效。

## 多使用者推送 (Multi-User Push)

v1.2 引入多使用者推送機制，可將 User Side 程式碼同步推送到所有已註冊的使用者 GAS Script：

*   **互動式推送**：`pwsh scripts/push_all.ps1` — 在終端機中執行，含確認提示
*   **Claude Code 推送**：使用 `/push-users` slash 指令 — 非互動式，自動略過確認
*   **新增使用者**：使用 `/add-user` slash 指令 — 將新的 GAS Script ID 加入 `managed_users.json`

推送機制原理：暫時替換 `User Side/.clasp.json` 中的 `scriptId`，執行 `clasp push --force`，完成後還原。

## 資料庫結構 (Database Tabs)

| 工作表 | 用途 |
|--------|------|
| Users | 使用者白名單與 Sheet 資訊 |
| Questions | 題目完整快照（含乾淨資料範本 `cleaned_data_template`） |
| Responses | 使用者提交的健檢 SOP 與清洗資料 |
| Scores | AI 評分結果（4 維度 + 總分 + 評語） |
| PromptVersions | 生成 / 評分 Prompt 版本管理 |
| SystemConfig | 動態模型設定 |
| AuditLog | 每次 API action 的稽核記錄 |
| ApiCallLog | 每一次 Gemini API 呼叫的詳細記錄（含 retry） |

## 初始化與遷移腳本 (Database Setup)

在 GAS 後台手動執行以下函式（`DatabaseSetup.js`）：

| 函式 | 用途 | 執行時機 |
|------|------|----------|
| `setupDatabaseHeaders()` | 建立所有工作表、預設 Prompt 與 SystemConfig | 全新安裝時 |
| `migrateQuestionsAddCleanedData()` | 新增 `cleaned_data_template` 欄位 | v1.1 升級時 |
| `migrateGenerationPrompt()` | 更新 generation prompt 加入乾淨資料輸出 | v1.1 升級時 |

## 環境變數設定 (Environment Variables)

**設定步驟：**
1. 打開 Backend GAS 專案的線上編輯器。
2. 點擊左側齒輪圖示進入 **專案設定 (Project Settings)**。
3. 捲動到底部的 **指令碼屬性 (Script Properties)**，點擊「新增指令碼屬性」。
4. 屬性填入：`TEST_API_KEY`，值填入你的 Gemini API Key。

> 無 `.env` 檔案，無本地 runtime，所有執行皆在 Google Apps Script 雲端環境中進行。使用者 API Key 以 per-request 方式傳遞，不寫入資料庫。

## 關鍵資源 (Key Resources)

| 資源 | ID / URL |
|------|----------|
| Admin Database Sheet | `1a-Po10_gmaLxfEWwSU31hQjoW0Jqpv_t4U9YM4KZnNw` |
| Backend GAS Project | `1fLZFUhYszQr8XPEDeoXcTw78f56eVsobICWjNJ1FPuWUaLjQw8bIjx0K` |
| User UI Sheet (Template) | `1rHl80WEJmPpOo2opER0KQi33zqej4SsahopArk-I_1g` |
| User Side GAS Project (Template) | `15wCum8Lk8-y8uZLk5vOSR0SYCW44FFuUqDpV-9TTHHeQHKZepLTB7N_n` |

## 開發進度 (Development Status)

| Version | 內容 | 狀態 |
|---------|------|------|
| v1.0 (MVP) | Backend API Router, Prompt Orchestration, AI Client, User Sheet UI, Sheet Data Access, Scoring & Feedback | ✅ 完成 |
| v1.1 | 多使用者修正、ApiCallLog、出題時產生 cleaned_data_template、文字格式化 | ✅ 完成 |
| v1.2 | 可靠的彈窗 UX（所有回饋客戶端處理）、CLIENT_VERSION 追蹤、多使用者推送基礎設施 | ✅ 完成 |

| Module | 名稱 | 狀態 |
|--------|------|------|
| A | Backend API Router | ✅ 完成 |
| B | Prompt Orchestration | ✅ 完成（已資料庫化，版本管理） |
| C | AI Client (Gemini) | ✅ 完成（3 層重試 + Fallback + ApiCallLog） |
| D | User Sheet UI | ✅ 完成（生成 / 提交 / 評分 / 標準答案顯示 / 彈窗回饋） |
| E | Sheet Data Access | ✅ 完成（User 自動註冊、Email 正規化、AuditLog 自動建立） |
| F | Scoring & Feedback | ✅ 完成（端對端全通，cleaned_data_template 於出題時生成） |
| G | Reporting / Export | ⬜ 未開始 |
