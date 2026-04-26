# 📋 Development Tracker & Checklist

> **專案名稱**: Data Judgment Training Platform
> **建立日期**: 2026-04-26
> **最後更新**: 2026-04-26
> **開發模式**: 逐步開發 (Incremental)

---

## 一、開發里程碑總覽

```
Phase 1: 基礎建設 ██████████████████████ 100%
Phase 2: 後端核心 ██████████████████████ 100%
Phase 3: 前後端串接 ██████████████████████ 100%
Phase 4: 評分閉環 ██████████████████████ 100%
Phase 5: 管理與報表 ███████████░░░░░░░░░░  50%
Phase 6: 品質與上線 ░░░░░░░░░░░░░░░░░░░░░   0%
```

---

## 二、Phase 1 — 基礎建設 ✅ COMPLETED

> 目標：建立專案骨架、環境配置、資料庫初始化

| # | 任務 | 狀態 | 完成日期 | 備註 |
|---|------|------|---------|------|
| 1.1 | 建立 PRD 與系統藍圖 | ✅ | 04-23 | `prd_and_blueprint_draft.md` |
| 1.2 | 定義 Database Schema | ✅ | 04-25 | `database_schema_spec.md` |
| 1.3 | 定義 Prompt Spec | ✅ | 04-25 | `prompt_spec.md` |
| 1.4 | 定義 Interface Contract | ✅ | 04-25 | `interface_contract_spec.md` |
| 1.5 | 定義 User Sheet UI Spec | ✅ | 04-25 | `user_sheet_ui_spec.md` |
| 1.6 | 建立 `.gitignore` / `.env` | ✅ | 04-25 | API Key 已隔離 |
| 1.7 | Clasp 登入 & 專案建立 | ✅ | 04-25 | Backend GAS 專案已建立 |
| 1.8 | 資料夾結構整理 | ✅ | 04-25 | `Backend Side/` + `User Side/` + `PRD/` |
| 1.9 | 建立 Admin Database Sheet | ✅ | 04-25 | 7 張工作表 + 欄位標題已初始化 |
| 1.10 | SystemConfig 預設值寫入 | ✅ | 04-25 | 動態模型名稱設定完成 |

---

## 三、Phase 2 — 後端核心模組 ✅ COMPLETED

> 目標：完成所有後端 GAS 模組，可獨立測試

| # | 任務 | 對應模組 | 狀態 | 完成日期 | 驗證方式 |
|---|------|---------|------|---------|---------|
| 2.1 | `Config.js` — 中央設定檔 | — | ✅ | 04-25 | 含動態模型 + Fallback |
| 2.2 | `Router.js` — API 路由 | Module A | ✅ | 04-25 | doGet/doPost 完整路由 |
| 2.3 | `PromptBuilder.js` — Prompt 組裝 | Module B | ✅ | 04-25 | 生成 + 評分兩種 Prompt |
| 2.4 | `GeminiClient.js` — AI 呼叫 | Module C | ✅ | 04-25 | 含 3 層重試 + Fallback + 全形修復 |
| 2.5 | `Database.js` — DB 讀寫 | Module E | ✅ | 04-25 | CRUD: Questions/Responses/Scores/SystemConfig |
| 2.6 | `DatabaseSetup.js` — 初始化工具 | — | ✅ | 04-25 | 一鍵建立所有工作表 |
| 2.7 | `TestRunner.js` — 測試函式 | — | ✅ | 04-25 | 3 個測試 + 1 個診斷工具 |
| 2.8 | Gemini API 連線測試 | — | ✅ | 04-25 | `test_GeminiConnection` 通過 |
| 2.9 | 題目生成端對端測試 | — | ✅ | 04-25 | `test_GenerateQuestion` 通過 |
| 2.10 | 資料庫讀寫測試 | — | ✅ | 04-25 | `test_DatabaseWrite` 通過 |
| 2.11 | Web App 部署 | — | ✅ | 04-25 | 個人帳號部署，HTTP 200 確認 |

**踩過的坑 (Lessons Learned):**
- `gemini-1.5-flash-latest` 在此 API Key 下不可用 → 改用 `gemini-2.0-flash`
- `v1` 端點不支援 `system_instruction` → 必須使用 `v1beta`
- Gemini 偶爾輸出全形數字 → 加入自動半形轉換
- 503 高峰壅塞 → 加入 3 層重試 + Fallback 模型機制
- Google Workspace 企業帳號 Web App 存取限制 → 改用個人 Gmail 部署
- 大物件傳輸不穩定 → 改用「Server-Side Master」模式，由後端一條龍渲染
- 合併儲存格與文字搜尋定位失效 → 改用「Z-Column 隱藏錨點」存儲座標
- 前端資料讀取脆弱性 → 改用「右至左掃描」邏輯防止中間空欄位導致資料錯位
- Prompt 硬編碼維護困難 → 實作 Prompt 資料庫化，支援動態載入與版本追溯
- AuditLog 遺漏錯誤紀錄 → 補齊 catch 區塊的 Log 寫入邏輯

---

## 四、Phase 3 — 前後端串接 🟡 IN PROGRESS (80%)

> 目標：User Sheet 能完整呼叫 Backend 完成訓練流程

| # | 任務 | 狀態 | 完成日期 | 備註 |
|---|------|------|---------|------|
| 3.1 | User Side Clasp 專案建立 | ✅ | 04-25 | `clasp clone` 完成 |
| 3.2 | `UserClient.js` — 選單建立 | ✅ | 04-25 | `onOpen()` 3 個選項 |
| 3.3 | `setupHomePage()` — Home 頁面初始化 | ✅ | 04-25 | 下拉選單 + API Key 輸入 |
| 3.4 | `generateNewQuestion()` — 生成題目 | ✅ | 04-26 | 採用 Server-Side Master 模式解決大物件連線中斷問題 |
| 3.5 | `LoadingDialog.html` — 載入動畫 | ✅ | 04-26 | 優化後的自動關閉邏輯 |
| 3.6 | `renderQuestionTab()` — 渲染題目 | ✅ | 04-26 | 顏色標記 (黃/綠) + 固定錨點 (Z2~Z5) |
| 3.7 | Backend ↔ User 通訊驗證 | ✅ | 04-25 | HTTP 200 + JSON 解析成功 |
| 3.8 | `submitCurrentResponse()` — 提交回答 | ✅ | 04-26 | 程式碼已完成 (待測試) |
| 3.9 | Question Tab URL 回傳給後端 | ✅ | 04-26 | `question_tab_url` 已實作 |

---

## 五、Phase 4 — 評分閉環 🟡 IN PROGRESS (70%)

> 目標：使用者提交回答 → AI 評分 → 結果渲染回 Sheet → 寫入 DB

| # | 任務 | 狀態 | 依賴 | 驗證標準 |
|---|------|------|------|---------|
| 4.1 | 固定錨點 (Z-Anchors) 設計 | ✅ | 04-26 | Z2~Z5 儲存 SOP 與清洗區座標 |
| 4.2 | 讀取使用者填寫的 SOP 資料 | ✅ | 04-26 | 依據錨點讀取，無視文字變動 |
| 4.3 | 固定 SOP 列數 (7 列) 與下拉選單 | ✅ | 04-26 | 錯誤類型 & 處置策略下拉選單 |
| 4.4 | 讀取使用者貼上的清洗後資料 | ✅ | 04-26 | 採用「右至左標題掃描」確保欄位對齊 |
| 4.5 | 提交前的 `SubmitLoadingDialog.html` | ✅ | 04-26 | 使用 Client-Triggered 模式確保彈窗必關 |
| 4.6 | POST 至 Backend `submit-response` | ✅ | 04-26 | 包含 userSheetId/Url 自動追蹤 |
| 4.7 | 渲染 AI Feedback 區塊 | ✅ | 04-26 | `renderFeedback` 實作完成 |
| 4.8 | **端對端提交測試** | **✅** | 04-26 | **全通：填寫 → 提交 → 看到分數與 AuditLog** |

---

## 六、Phase 5 — 管理、安全與報表 ⬜ NOT STARTED

> 目標：強化安全性、追蹤性與管理功能

| # | 任務 | 優先級 | 狀態 | 備註 |
|---|------|--------|------|------|
| 5.1 | 實作 `register-key` 真正驗證 | 🟡 P1 | ⬜ | 呼叫 ListModels 測試 Key |
| 5.2 | 實作 AuditLog 完整寫入 | ✅ | 04-26 | 含 Success 與 Error 捕捉 |
| 5.3 | 實作 Prompt 動態讀取 (DB 化) | ✅ | 04-26 | 從 PromptVersions 載入，無需改 Code |
| 5.3 | 實作 `weekly_limit` 檢查 | ⬜ P2 | ⬜ | 查詢本週已生成次數 |
| 5.4 | Home Tab 歷史成績摘要表 | ⬜ P2 | ⬜ | 顯示最近 N 題的分數 |
| 5.5 | Question Tab URL 寫入 DB | ⬜ P2 | ⬜ | 取得 `#gid=xxx` 並回傳 |
| 5.6 | 實作 `export-records` Endpoint | ⬜ P3 | ⬜ | JSON/CSV 匯出 |
| 5.7 | 實作 `user-summary` Endpoint | ⬜ P3 | ⬜ | 歷史統計 API |
| 5.8 | Trainer Dashboard 報表 | ⬜ P3 | ⬜ | 獨立 Sheet 或新 Tab |

---

## 七、Phase 6 — 品質保證與上線 ⬜ NOT STARTED

> 目標：確保系統穩定可交付使用

| # | 任務 | 狀態 | 備註 |
|---|------|------|------|
| 6.1 | Prompt 回歸測試 | ⬜ | 各 Domain × Difficulty 組合至少各跑一次 |
| 6.2 | 評分穩定度測試 | ⬜ | 相同回答重複提交 3 次，檢查分數偏差 |
| 6.3 | 多使用者並行測試 | ⬜ | 2+ 人同時生成題目 |
| 6.4 | 清理 `UserClient_Template.gs` | ⬜ | 刪除或標記為 DEPRECATED |
| 6.5 | 使用者操作手冊 | ⬜ | 含截圖的 Step-by-step 指南 |
| 6.6 | 最終 Code Review | ⬜ | 確認無明文 API Key 殘留 |
| 6.7 | 正式版部署 | ⬜ | 更新 Web App 版本號 |

---

## 八、已完成的技術決策紀錄

| 決策項目 | 選擇 | 原因 |
|---------|------|------|
| API 端點版本 | `v1beta` | `v1` 不支援 `system_instruction` 與 `response_mime_type` |
| 部署帳號 | 個人 Gmail | Google Workspace 企業帳號受 IT 政策限制 (HTTP 401) |
| 模型管理 | 動態 (SystemConfig) | 避免模型名稱過期時需改程式碼 |
| 提示詞管理 | 資料庫化 (PromptVersions) | 支援版本回溯與免部署即時微調 |
| 資料讀取邊界 | 右至左標題掃描 | 容忍使用者在資料區中間插入空欄位 |
| 身份識別 | Email 自動註冊 | `@inboundmarketing.tw` 自動生成 ID 並填寫 Name |
| 題目資料量 | 10-15 筆 | 高密度地雷 > 大量資料 |

---

## 九、接續開發 Checklist

### ✅ 開始 Phase 4 前的前置確認

- [ ] 確認 Backend Web App 已部署最新版本 (`clasp push` → 重新部署)
- [ ] 確認 `SystemConfig` 中的模型名稱正確 (`gemini-2.0-flash`)
- [ ] 確認 User Sheet 的 `BACKEND_URL` 指向正確的 `/exec` 網址
- [ ] 確認可以成功生成至少一題（驗證前端→後端→AI→DB 全通）
- [ ] 確認生成的 Question Tab 中有 SOP 表格與清洗區

### 🔧 Phase 4 開發 Checklist

- [ ] **4.1** 在 `UserClient.js` 中實作 `findRowByText(sheet, searchText)` 輔助函式
- [ ] **4.2** 讀取 SOP 區域：從「🧠 步驟一」下方第 2 列開始，到出現空行為止
- [ ] **4.3** 將 SOP 每列轉為 `{ field, error_type, strategy, note }` 物件陣列
- [ ] **4.4** 讀取清洗資料：從「✨ 步驟二」下方第 1 列讀取標題，接續讀取資料列
- [ ] **4.5** 將清洗資料轉為 JSON Array (含標題 key mapping)
- [ ] **4.6** 建立 `SubmitLoadingDialog.html` (或複用 `LoadingDialog.html`)
- [ ] **4.7** POST payload: `{ action, apiKey, userEmail, question_id, user_health_check_sop, user_cleaned_data }`
- [ ] **4.8** 解析 Backend response，提取 `score` 物件
- [ ] **4.9** 在 Question Tab 下方渲染：分數表格 + feedback_comment
- [ ] **4.10** 測試：手動填寫 SOP + 清洗資料 → 提交 → 確認看到 AI 評分
- [ ] **4.11** 測試：提交空白 SOP → 確認有適當的錯誤提示
- [ ] **4.12** `clasp push` 並更新 Web App 部署版本
