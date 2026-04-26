# 🏗️ 系統架構與流程 (System Architecture)

本文檔說明 **Data Judgment Training Platform** 的底層邏輯與資料流向。

---

## 🎨 系統流程圖

### 1. 題目生成流程 (Generation Flow)

```mermaid
sequenceDiagram
    participant UserSheet as 實習生 Sheet (Frontend)
    participant Backend as GAS Web App (Backend)
    participant DB as Central Database (Sheet)
    participant AI as Gemini AI (API)

    UserSheet->>Backend: POST /generate-question (含 API Key, Domain)
    Backend->>DB: 驗證使用者權限 (Users Tab)
    Backend->>DB: 讀取動態 Prompt (PromptVersions Tab)
    Backend->>AI: 發送出題指令 (System + User Prompt)
    AI-->>Backend: 回傳 JSON 題目內容
    Backend->>DB: 儲存題目副本 (Questions Tab)
    Backend->>DB: 紀錄稽核日誌 (AuditLog)
    Backend-->>UserSheet: 回傳題目 JSON
    UserSheet->>UserSheet: 自動渲染 UI (座標錨點 + 格式化)
```

---

### 2. 提交與評分流程 (Scoring Flow)

```mermaid
sequenceDiagram
    participant UserSheet as 實習生 Sheet (Frontend)
    participant Backend as GAS Web App (Backend)
    participant DB as Central Database (Sheet)
    participant AI as Gemini AI (API)

    UserSheet->>Backend: POST /submit-response (含 SOP, 清洗資料)
    Backend->>DB: 儲存原始回答 (Responses Tab)
    Backend->>DB: 抓取該題標準答案 (Questions Tab)
    Backend->>DB: 讀取動態評分 Prompt (PromptVersions Tab)
    Backend->>AI: 發送評分指令 (含作答 vs 標準答案)
    AI-->>Backend: 回傳 JSON 評分與診斷
    Backend->>DB: 儲存分數與回饋 (Scores Tab)
    Backend->>DB: 紀錄稽核日誌 (AuditLog)
    Backend-->>UserSheet: 回傳分數 JSON
    UserSheet->>UserSheet: 在下方渲染評分結果與雷達圖文字
```

---

## 🛡️ 安全性決策
1.  **BYOK (Bring Your Own Key)**: 後端不儲存使用者的 API Key，由前端動態傳入，確保資安與成本自負。
2.  **Server-Side Master**: 題目生成後先由後端驗證 JSON 結構完整性才回傳，確保前端渲染必成功。
3.  **Audit Log**: 所有的 API 請求皆有存證，包含使用者 Email 與執行狀態，方便後續稽核與 Debug。
