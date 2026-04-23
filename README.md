# Data Judgment Training Platform

一套以 Google 生態為核心、由 AI 協助開發與營運的訓練平台，主要用於訓練使用者的**資料判斷 (Data Judgment)**、結構化輸出、報表解讀與口頭表達能力。

## 產品概念 (Product Concept)

本平台採用「可複製 User UI + 單一 Central Backend + Central Database」的輕量級架構：
*   **前端 (User UI)**：每位使用者擁有獨立的 Google Sheet 作為專屬介面。
*   **後端 (Backend)**：單一 Google Apps Script (GAS) 集中管理題目生成、AI 評分與業務邏輯。
*   **資料庫 (Database)**：由一個中央 Google Sheet 承擔，紀錄所有題目、回答與成績。
*   **成本模型 (BYOK)**：使用者自備 API Key 進行操作，避免中央成本膨脹。

## 專案文件 (Documentation)

詳細的系統設計與規格皆以 Markdown 檔案形式保存在本專案中：

*   [`prd_and_blueprint_draft.md`](./prd_and_blueprint_draft.md) - 產品需求文件 (PRD) 與整體系統架構藍圖。
*   [`interface_contract_spec.md`](./interface_contract_spec.md) - 前後端 API 規格與 Request/Response JSON 定義。
*   [`database_schema_spec.md`](./database_schema_spec.md) - 中央資料庫 (Google Sheet) 欄位定義。
*   [`prompt_spec.md`](./prompt_spec.md) - AI 生成與評分所需的 Prompt 結構與輸入/輸出定義。
*   [`user_sheet_ui_spec.md`](./user_sheet_ui_spec.md) - 使用者前端 Google Sheet 介面配置規格。

## 開發技術棧 (Tech Stack)

*   **Google Apps Script (GAS)**: 後端 API Layer 與試算表資料存取層。
*   **Google Sheets**: 前端 UI 介面與後端資料庫。
*   **Clasp (Command Line Apps Script Projects)**: 本地端 GAS 開發部署工具。
*   **Generative AI API (e.g., Gemini)**: 處理動態題目生成與作答評分。
