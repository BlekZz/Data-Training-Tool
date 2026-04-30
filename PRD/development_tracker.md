# 📋 Development Tracker & Checklist

> **專案名稱**: Data Judgment Training Platform
> **建立日期**: 2026-04-26
> **最後更新**: 2026-04-30
> **目前版本**: v1.2

---

## 一、版本歷程

| 版本 | 日期 | 主要變更 |
|------|------|---------|
| v1.0 | 04-26 | MVP：完整 generate → submit → score 端對端流程 |
| v1.1 | 04-27 | 多使用者修正、ApiCallLog、出題時產生 cleaned_data_template、formatDisplayText |
| v1.2 | 04-28 | 可靠彈窗 UX、CLIENT_VERSION、多使用者推送基礎設施 |
| v1.3 | 04-30 | UI 範圍擴充 (12 欄)、文字錨點定位 (`__CLEAN_END__`)、雙行距 regex、本地時區紀錄、修復 Web App 部署陷阱 |

---

## 二、開發里程碑總覽

```
Phase 1: 基礎建設       ██████████████████████ 100%
Phase 2: 後端核心       ██████████████████████ 100%
Phase 3: 前後端串接     ██████████████████████ 100%
Phase 4: 評分閉環       ██████████████████████ 100%
Phase 5: 管理與報表     ████████████░░░░░░░░░  60% (v1.3 修復, weekly_limit 未開始)
Phase 6: 品質與上線     ████████████░░░░░░░░░  60% (QA Checklist/文件完成, 回歸測試未開始)
```

---

## 三、Phase 1 — 基礎建設 ✅ COMPLETED

> 目標：建立專案骨架、環境配置、資料庫初始化

| # | 任務 | 狀態 | 完成日期 | 備註 |
|---|------|------|---------|------|
| 1.1 | 建立 PRD 與系統藍圖 | ✅ | 04-23 | `prd_and_blueprint_draft.md` |
| 1.2 | 定義 Database Schema | ✅ | 04-25 | `database_schema_spec.md` |
| 1.3 | 定義 Prompt Spec | ✅ | 04-25 | `prompt_spec.md` |
| 1.4 | 定義 Interface Contract | ✅ | 04-25 | `interface_contract_spec.md` |
| 1.5 | 定義 User Sheet UI Spec | ✅ | 04-25 | `user_sheet_ui_spec.md` |
| 1.6 | 建立 `.gitignore` | ✅ | 04-25 | API Key 已隔離 |
| 1.7 | Clasp 登入 & 專案建立 | ✅ | 04-25 | Backend GAS 專案已建立 |
| 1.8 | 資料夾結構整理 | ✅ | 04-25 | `Backend Side/` + `User Side/` + `PRD/` |
| 1.9 | 建立 Admin Database Sheet | ✅ | 04-25 | 8 張工作表 + 欄位標題已初始化 |
| 1.10 | SystemConfig 預設值寫入 | ✅ | 04-25 | 動態模型名稱設定完成 |

---

## 四、Phase 2 — 後端核心模組 ✅ COMPLETED

> 目標：完成所有後端 GAS 模組，可獨立測試

| # | 任務 | 對應模組 | 狀態 | 完成日期 | 驗證方式 |
|---|------|---------|------|---------|---------| 
| 2.1 | `Config.js` — 中央設定檔 | — | ✅ | 04-25 | 含動態模型 + Fallback |
| 2.2 | `Router.js` — API 路由 | Module A | ✅ | 04-25 | doGet/doPost 完整路由 |
| 2.3 | `PromptBuilder.js` — Prompt 組裝 | Module B | ✅ | 04-25 | 生成 + 評分兩種 Prompt |
| 2.4 | `GeminiClient.js` — AI 呼叫 | Module C | ✅ | 04-25 | 含 3 層重試 + Fallback + 全形修復 + ApiCallLog |
| 2.5 | `Database.js` — DB 讀寫 | Module E | ✅ | 04-25 | CRUD: Questions/Responses/Scores/SystemConfig/AuditLog/ApiCallLog |
| 2.6 | `DatabaseSetup.js` — 初始化工具 | — | ✅ | 04-25 | 一鍵建立所有工作表 + 遷移腳本 |
| 2.7 | `TestRunner.js` — 測試函式 | — | ✅ | 04-25 | 3 個測試 + 1 個診斷工具 |
| 2.8 | Gemini API 連線測試 | — | ✅ | 04-25 | `test_GeminiConnection` 通過 |
| 2.9 | 題目生成端對端測試 | — | ✅ | 04-25 | `test_GenerateQuestion` 通過 |
| 2.10 | 資料庫讀寫測試 | — | ✅ | 04-25 | `test_DatabaseWrite` 通過 |
| 2.11 | Web App 部署 | — | ✅ | 04-25 | 個人帳號部署，HTTP 200 確認 |

---

## 五、Phase 3 — 前後端串接 ✅ COMPLETED

> 目標：User Sheet 能完整呼叫 Backend 完成訓練流程

| # | 任務 | 狀態 | 完成日期 | 備註 |
|---|------|------|---------|------|
| 3.1 | User Side Clasp 專案建立 | ✅ | 04-25 | `clasp clone` 完成 |
| 3.2 | `UserClient.js` — 選單建立 | ✅ | 04-25 | `onOpen()` 3 個選項 |
| 3.3 | `setupHomePage()` — Home 頁面初始化 | ✅ | 04-25 | 下拉選單 + API Key 輸入 |
| 3.4 | `generateNewQuestion()` — 生成題目 | ✅ | 04-26 | Server-Side Master 模式 |
| 3.5 | `LoadingDialog.html` — 載入動畫 | ✅ | 04-26 | v1.2: 三態 (loading/success/error) |
| 3.6 | `renderQuestionTab()` — 渲染題目 | ✅ | 04-26 | 顏色標記 (黃/綠) + Z-Column 隱藏錨點 |
| 3.7 | Backend ↔ User 通訊驗證 | ✅ | 04-25 | HTTP 200 + JSON 解析成功 |
| 3.8 | `submitCurrentResponse()` — 提交回答 | ✅ | 04-26 | findRowByText 動態定位 + 資料收集 |
| 3.9 | `SubmitLoadingDialog.html` — 提交動畫 | ✅ | 04-26 | v1.2: 三態 (loading/score preview/error) |

---

## 六、Phase 4 — 評分閉環 ✅ COMPLETED

> 目標：使用者提交回答 → AI 評分 → 結果渲染回 Sheet → 寫入 DB

| # | 任務 | 狀態 | 完成日期 | 備註 |
|---|------|------|---------|------|
| 4.1 | 固定錨點 (Z-Anchors) 設計 | ✅ | 04-26 | Z1~Z5 儲存 question_id 與區塊座標 |
| 4.2 | 讀取使用者填寫的 SOP 資料 | ✅ | 04-26 | `findRowByText()` 動態定位 |
| 4.3 | 固定 SOP 列數 (7 列) 與下拉選單 | ✅ | 04-26 | 錯誤類型 & 處置策略下拉選單 |
| 4.4 | 讀取使用者貼上的清洗後資料 | ✅ | 04-26 | 右至左標題掃描，容忍中間空欄位 |
| 4.5 | 提交前的確認對話框 | ✅ | 04-26 | 含 SOP 筆數 + 清洗資料筆數預覽 |
| 4.6 | POST 至 Backend `submit-response` | ✅ | 04-26 | 包含 userSheetId/Url 自動追蹤 |
| 4.7 | `renderFeedback()` — 渲染 AI Feedback | ✅ | 04-26 | 分數表格 + 評語 + 標準答案 + 清洗範本 |
| 4.8 | Home 歷史成績記錄 | ✅ | 04-26 | `handleSubmitSuccess()` 自動插入行 |
| 4.9 | **端對端提交測試** | ✅ | 04-26 | 全通：填寫 → 提交 → 看到分數與 AuditLog |

---

## 七、Phase 5 — 管理、安全與 DevOps 🟡 PARTIAL

> 目標：強化安全性、追蹤性與管理功能

| # | 任務 | 優先級 | 狀態 | 完成日期 | 備註 |
|---|------|--------|------|---------|------|
| 5.1 | AuditLog 完整寫入 | 🟢 | ✅ | 04-26 | 含 Success 與 Error 捕捉 |
| 5.2 | ApiCallLog 實作 | 🟢 | ✅ | 04-27 | 每次 Gemini 呼叫記錄，含 retry |
| 5.3 | Prompt 動態讀取 (DB 化) | 🟢 | ✅ | 04-26 | 從 PromptVersions 載入 |
| 5.4 | `cleaned_data_template` 於出題時生成 | 🟢 | ✅ | 04-27 | Gemini 一次性生成，評分時直接讀取 |
| 5.5 | User 自動註冊 (@inboundmarketing.tw) | 🟢 | ✅ | 04-26 | `validateUserAccess()` 自動建立 |
| 5.6 | Email 正規化 | 🟢 | ✅ | 04-27 | `.trim().toLowerCase()` |
| 5.7 | 彈窗 UX 全面升級 (v1.2) | 🟢 | ✅ | 04-28 | 所有回饋客戶端處理，移除 server-side alert |
| 5.8 | CLIENT_VERSION 追蹤 | 🟡 | ✅ | 04-28 | `const CLIENT_VERSION = "1.1.0"` |
| 5.9 | 多使用者推送基礎設施 | 🟢 | ✅ | 04-28 | `push_all.ps1`, `managed_users.json`, Claude 指令 |
| 5.9.1 | UI 防呆與字串修復 (v1.3) | 🟢 | ✅ | 04-30 | 12欄位擴充、雙行距 regex 修復、Z-Anchor 修復 |
| 5.9.2 | 本地時區紀錄修正 (v1.3) | 🟢 | ✅ | 04-30 | 移除 ISOString 轉用 Session 時區格式 |
| 5.10 | 實作 `register-key` 真正驗證 | 🟡 P1 | ⬜ | — | 呼叫 ListModels 測試 Key |
| 5.11 | 實作 `weekly_limit` 檢查 | ⬜ P2 | ⬜ | — | 查詢本週已生成次數 |
| 5.12 | 實作 `export-records` Endpoint | ⬜ P3 | ⬜ | — | Module G: JSON/CSV 匯出 |
| 5.13 | 實作 `user-summary` Endpoint | ⬜ P3 | ⬜ | — | Module G: 歷史統計 API |
| 5.14 | Trainer Dashboard 報表 | ⬜ P3 | ⬜ | — | Module G: 獨立 Sheet 或新 Tab |

---

## 八、Phase 6 — 品質保證與上線 🟡 PARTIAL

> 目標：確保系統穩定可交付使用

| # | 任務 | 狀態 | 完成日期 | 備註 |
|---|------|------|---------|------|
| 6.1 | 使用者操作與維護手冊 | ✅ | 04-26 | `docs/` 文件夾建立完成 |
| 6.2 | 最終 Code Review | ✅ | 04-26 | 確認無明文 API Key 殘留 |
| 6.3 | PRD 文件全面更新 | ✅ | 04-30 | 所有 PRD 與 CLAUDE.md 對齊 v1.3 |
| 6.4 | QA Checklist 制定 | ✅ | 04-30 | `PRD/qa_checklist.md` |
| 6.5 | Prompt 回歸測試 | ⬜ | — | 各 Domain × Difficulty 組合至少各跑一次 |
| 6.6 | 評分穩定度測試 | ⬜ | — | 相同回答重複提交 3 次，檢查分數偏差 |
| 6.7 | 多使用者並行測試 | ⬜ | — | 2+ 人同時生成題目 |
| 6.8 | 正式版部署 | ✅ | 04-30 | 已更新 Web App 版本並推送到所有 managed users |

---

## 九、已完成的技術決策紀錄

| 決策項目 | 選擇 | 原因 |
|---------|------|------|
| API 端點版本 | `v1beta` | `v1` 不支援 `system_instruction` 與 `response_mime_type` |
| 部署帳號 | 個人 Gmail | Google Workspace 企業帳號受 IT 政策限制 (HTTP 401) |
| 模型管理 | 動態 (SystemConfig) | 避免模型名稱過期時需改程式碼 |
| 提示詞管理 | 資料庫化 (PromptVersions) | 支援版本回溯與免部署即時微調 |
| 資料讀取邊界 | 右至左標題掃描 | 容忍使用者在資料區中間插入空欄位 |
| 身份識別 | Email 自動註冊 | `@inboundmarketing.tw` 自動生成 ID 並填寫 Name |
| 題目資料量 | 10-15 筆 | 高密度地雷 > 大量資料 |
| 彈窗回饋 | Client-Side Only | Server-side alert 與開啟中的 modal 衝突導致靜默失敗 |
| 清洗範本 | 出題時一次性生成 | 確保評分時標準答案一致，不再重新生成 |
| 時區處理 | 腳本端格式化 | `Utilities.formatDate` 配合 Session Timezone，取代 UTC |
| 介面動態定位 | 文字錨點 | 在 Z 欄寫入 `__CLEAN_END__` 可隨使用者增刪列移動 |

---

## 十、踩過的坑 (Lessons Learned)

- `gemini-1.5-flash-latest` 在此 API Key 下不可用 → 改用 `gemini-2.0-flash`
- `v1` 端點不支援 `system_instruction` → 必須使用 `v1beta`
- Gemini 偶爾輸出全形數字 → 加入自動半形轉換
- 503 高峰壅塞 → 加入 3 層重試 + Fallback 模型機制
- Google Workspace 企業帳號 Web App 存取限制 → 改用個人 Gmail 部署
- 大物件傳輸不穩定 → 改用「Server-Side Master」模式
- 合併儲存格與文字搜尋定位失效 → 改用「Z-Column 隱藏錨點」存儲座標
- 前端資料讀取脆弱性 → 改用「右至左掃描」邏輯防止中間空欄位導致資料錯位
- Prompt 硬編碼維護困難 → 實作 Prompt 資料庫化
- AuditLog 遺漏錯誤紀錄 → 補齊 catch 區塊的 Log 寫入邏輯
- Server-side `ui.alert()` 與 modal dialog 衝突 → v1.2 移除，全部改為 client-side 處理
- `Bandwidth quota exceeded` 不只是流量問題 → 無效模型名稱回傳大量 HTML 也會觸發
- **Web App 部署陷阱**：`clasp push` 只會更新 HEAD，若未在介面上「管理部署作業 -> 新版本」，`/exec` 呼叫永遠執行舊代碼，導致 Log 遺失或 bug。
- **空白與中文換行陷阱**：Regex 使用 `+` 會漏掉沒有前導空白的中文條列（如 `。2.`），應改為 `*`，並在 Sheet 儲存格使用 `\n\n` 確保行距正常。

---

## 十一、參考文件

*   [👤 使用者操作指南 (User Guide)](../docs/user_guide.md)
*   [🛠️ 管理員維護指南 (Admin Guide)](../docs/admin_guide.md)
*   [🏗️ 系統架構與流程 (Architecture)](../docs/system_architecture.md)
