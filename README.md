# Data Judgment Training Platform

一套以 Google 生態為核心、由 AI 協助開發與營運的訓練平台，主要用於訓練使用者的**資料判斷 (Data Judgment)**、資料清洗工程規劃、與商業邏輯異常辨識能力。

## 產品概念 (Product Concept)

本平台採用「可複製 User UI + 單一 Central Backend + Central Database」的輕量級架構：
*   **前端 (User UI)**：每位使用者擁有獨立的 Google Sheet，具備自動渲染、進度動畫與座標錨點技術。
*   **後端 (Backend)**：單一 GAS Web App 集中處理核心邏輯，支援 3 層重試與 Fallback 機制。
*   **資料庫 (Database)**：中央 Google Sheet 存儲所有 Questions/Responses/Scores，並具備 AuditLog 稽核軌跡。
*   **動態提示詞 (Dynamic Prompts)**：Prompt 本體存於資料庫中，支援即時微調與版本追溯，無需重新部署。
*   **成本模型 (BYOK)**：使用者自備 API Key，系統自動偵測並切換 Gemini 2.0 Pro/Flash 模型。

## 專案結構 (Project Structure)

```
Data Training Tool/
├── README.md                          # 本文件
├── .gitignore
├── PRD/                               # 產品規格與設計文件
│   ├── prd_and_blueprint_draft.md     # PRD 與系統架構藍圖
│   ├── interface_contract_spec.md     # 前後端 API 規格
│   ├── database_schema_spec.md        # 中央資料庫欄位定義
│   ├── prompt_spec.md                 # AI Prompt 結構與評分規則
│   └── user_sheet_ui_spec.md          # 使用者前端 UI 配置規格
├── data_training_tool_clasp/          # Clasp 程式碼管理
│   ├── Backend Side/                  # 後端 GAS 程式碼 (Web App)
│   │   ├── Config.js                  # 中央設定檔
│   │   ├── Router.js                  # API 路由 (doGet / doPost)
│   │   ├── PromptBuilder.js           # Prompt 組裝邏輯
│   │   ├── GeminiClient.js            # Gemini API 呼叫 (含重試/Fallback)
│   │   ├── Database.js                # 資料庫讀寫封裝
│   │   ├── DatabaseSetup.js           # 一鍵初始化 DB 欄位
│   │   └── TestRunner.js              # 測試工具函式
│   └── User Side/                     # 使用者端 GAS 程式碼
│       ├── UserClient.js              # 前端邏輯 (選單/生成/提交)
│       └── LoadingDialog.html         # 生成中的載入動畫 UI
```

## 開發技術棧 (Tech Stack)

*   **Google Apps Script (GAS)**: 後端 API Layer 與試算表資料存取層。
*   **Google Sheets**: 前端 UI 介面與後端資料庫。
*   **Clasp (Command Line Apps Script Projects)**: 本地端 GAS 開發部署工具。
*   **Gemini API (v1beta)**: 處理動態題目生成與作答評分。

## 部署架構 (Deployment)

| 元件 | 帳號 | 說明 |
|------|------|------|
| Backend Web App | 個人 Gmail | 確保 "Anyone" 存取權限可用 |
| Admin Database Sheet | 企業/個人 | 需分享編輯權限給 Backend 帳號 |
| User Sheet UI | 任意帳號 | 使用者各自複製一份 |

> **注意**：Google Workspace 企業帳號在部署 Web App 時受限於組織 IT 政策，建議後端使用個人 Gmail 帳號部署。

## 環境變數設定 (Environment Variables)

為了保護開發用的 API Key 不外洩，當你在 Google Apps Script 後台進行功能測試（例如執行 `TestRunner.js`）時，系統會要求讀取 `TEST_API_KEY`。

**設定步驟：**
1. 打開 Backend GAS 專案的線上編輯器。
2. 點擊左側齒輪圖示進入 **專案設定 (Project Settings)**。
3. 捲動到底部的 **指令碼屬性 (Script Properties)**，點擊「新增指令碼屬性」。
4. 屬性 (Property) 填入：`TEST_API_KEY`
5. 值 (Value) 填入：你申請的 Gemini API Key (可至 Google AI Studio 申請)。
6. 儲存設定。

## 關鍵資源 (Key Resources)

| 資源 | ID / URL |
|------|----------|
| Admin Database Sheet | `1a-Po10_gmaLxfEWwSU31hQjoW0Jqpv_t4U9YM4KZnNw` |
| Backend GAS Project | `1fLZFUhYszQr8XPEDeoXcTw78f56eVsobICWjNJ1FPuWUaLjQw8bIjx0K` |
| User UI Sheet | `1rHl80WEJmPpOo2opER0KQi33zqej4SsahopArk-I_1g` |
| User Side GAS Project | `15wCum8Lk8-y8uZLk5vOSR0SYCW44FFuUqDpV-9TTHHeQHKZepLTB7N_n` |

## 開發進度 (Development Status)

| Module | 名稱 | 狀態 |
|--------|------|------|
| A | Backend API Router | ✅ 完成 |
| B | Prompt Orchestration | ✅ 完成 (已資料庫化) |
| C | AI Client (Gemini) | ✅ 完成 (含 3 層重試 + Fallback) |
| D | User Sheet UI | ✅ 完成 (生成 ✅ / 提交 ✅) |
| E | Sheet Data Access | ✅ 完成 (含 User 自動註冊與 Sheet 追蹤) |
| F | Scoring & Feedback | ✅ 完成 (端對端全通) |
| G | Reporting / Export | ⬜ 未開始 |
