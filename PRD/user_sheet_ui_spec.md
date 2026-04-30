# User Sheet UI Spec

> **最後更新**: 2026-04-30
> **狀態**: 已與實作對齊 (UserClient.js / LoadingDialog.html / SubmitLoadingDialog.html — v1.2)

---

## 1. 選單結構 (Custom Menu)

使用者開啟 Google Sheet 時，`onOpen()` 會自動在工具列建立選單：

```
🚀 數據判斷訓練
├── 1. 初始化 Home 頁面    → setupHomePage()
├── ─────────────────────
├── 2. 生成新題目          → generateNewQuestion()
└── 3. 提交本題回答        → submitCurrentResponse()
```

---

## 2. Home Tab (Settings & Summary)

使用者開啟 Google Sheet 的第一個固定畫面，由 `setupHomePage()` 自動生成。

### 儲存格對應表

| 儲存格 | 欄位名稱 | 內容 / 行為 |
|--------|----------|-------------|
| A1:C1 | 標題列 | `數據判斷訓練平台` (藍底白字) |
| A3 | Label | `User Email` |
| B3 | Value | 自動填入 `Session.getActiveUser().getEmail()` |
| A4 | Label | `Gemini API Key` |
| B4 | Value | 使用者手動貼入 API Key |
| A5 | Label | `產業領域` |
| B5 | Dropdown | 電商與零售 / 金融與支付 / 醫療與健康照護 / 行銷與 CRM |
| A6 | Label | `難度等級` |
| B6 | Dropdown | Level 1 / Level 2 / Level 3 |
| A8 | 提示文字 | `💡 設定完成後，請點選選單中的「2. 生成新題目」開始訓練。` |
| Row 10 | 歷史表頭 | `做題日期 / 產業領域 / 難度 / 總分 / 文字診斷` (每次提交後自動插入新行) |

### 設計重點
*   Column A 寬度：150px / Column B 寬度：400px
*   B5, B6 使用 `DataValidation` 下拉選單
*   API Key 儲存在明文儲存格 (BYOK 設計，per-request 傳遞，不寫入後端資料庫)
*   歷史成績表會在提交評分後由 `handleSubmitSuccess()` 自動寫入

---

## 3. 生成流程 UX

### 3.1 Loading Dialog (Modal) — `LoadingDialog.html`
按下「2. 生成新題目」後，系統會彈出一個 **Modal Dialog**：

*   **尺寸**：420 x 300 px
*   **三種狀態**：

| 狀態 | 視覺元素 | 觸發條件 |
|------|---------|---------|
| **Loading** | CSS 旋轉動畫 + 漸進式進度條 + 模擬 Log 文字 | 初始狀態 |
| **Success** | 🆕 圖示 + 指引文字 (黃色區=SOP, 綠色區=清洗) + 「確定，開始作答」按鈕 | `performFullGeneration()` 回傳成功 |
| **Error** | ❌ 圖示 + 錯誤訊息 + 「關閉」按鈕 | 回傳失敗或例外 |

*   **模擬 Log 文字**（每 3.5 秒更新一次）：
    1. `正在解析產業領域背景...`
    2. `正在構思隱蔽的資料地雷...`
    3. `正在生成高密度商業資料...`
    4. `正在注入常見業務陷阱...`
    5. `即將完成，正在佈置工作表...`

### 3.2 Server-Side Master 模式
彈窗透過 `google.script.run.performFullGeneration()` 觸發整個生成流程，後端一條龍完成：
1. `runGenerationLogic()` — 讀取 Home 設定 → POST 到 Backend
2. `renderQuestionTab()` — 建立新分頁 + 渲染 UI
3. 回傳 `{ status: "success" }` 或 `{ status: "error", message: "..." }`

> **v1.2 重要變更**：所有 UI 回饋 (成功/失敗/白名單拒絕) 都在彈窗 HTML 內處理，不再使用 server-side `ui.alert()`。

---

## 4. Question Tab (動態生成)

每次成功生成題目後，由 `renderQuestionTab()` 自動建立。

### Tab 命名規則
`Q_<question_id 最後一段>` (例如 `Q_742`)

### 佈局結構

 | 區塊 | 列 (動態) | 內容 | 樣式 |
 |----|------|------|------|
 | 區塊 1 | Row 1 | 題目名稱 (A1:H1 合併) | **深藍底白字** (`#2E5FA3`)、粗體、13px |
 | 區塊 2 | Row 2-5 | 【任務情境】+ business_context (A2:H5) | **淡藍底** (`#EBF3FB`)、自動換行、**列高 60px** |
 | 區塊 3 | Row 6 | 操作指示 (A6:H6) | 淺灰底 (`#F8F9FA`)、斜體 |
 | 區塊 4 | Row 7 | 資料欄位標題 (A7:H7) | **粉藍底** (`#CFE2FF`)、粗體 |
 | 區塊 4 | Row 8~M | Sample Data (由 AI 生成) | 標準格線 (至多 8 欄) |
 | 區塊 5 | M+2 | `🧠 步驟一：健檢診斷 SOP` (A:H) | **深紫底白字** (`#4A4A8A`)、粗體 |
 | 區塊 5 | M+3 | SOP 表格標題：異常欄位 / 錯誤類型 / 處置策略 / 詳細說明 | 淺紫底 (`#DEDEFA`) |
 | 區塊 5 | M+4~M+10 | **SOP 使用者填寫區 (固定 7 列)** | **淡黃底** (`#FFFDE7`)、含下拉選單 |
 | 區塊 6 | M+12 | `✨ 步驟二：清洗後資料` (A:L) | **深綠底白字** (`#2E7D32`)、粗體、**擴展至 12 欄** |
 | 區塊 6 | M+13 | 標題輸入列 (請在此填寫標題) (A:L) | 淺綠底 (`#C8E6C9`) |
 | 區塊 6 | M+14~M+33 | **清洗後資料填寫區 (固定 20 列)** (A:L) | **淡綠底** (`#F1F8E9`) |

 ### 錨點系統 (Z-Column Hidden Anchors)
 為了確保 `submitCurrentResponse()` 即使在使用者修改版面後仍能精準讀取資料，系統在 **Z 欄** 儲存了座標或標記（白色字體隱藏）：

 | 儲存格 / 標記 | 內容 | 用途 |
 |--------|------|------|
 | **Z1** | `question_id` | 提交時關連後端資料庫 |
 | **Z2** | `sopDataRow` (起) | SOP 填寫區的第一列列號 |
 | **Z3** | `sopEndRow` (止) | SOP 填寫區的最後一列列號 |
 | **Z4** | `cleanTitleRow` | 清洗資料標題列的列號 |
 | **動態列 (Z欄)** | `__CLEAN_END__` | 清洗資料填寫區的結束標記，即使使用者插入/刪除列，也能準確在下方渲染 AI 診斷 |

 ### 輸入驗證 (Data Validation)
 *   **錯誤類型 (SOP)**：基礎格式錯誤 / 商業邏輯地雷 / 遺失值 / 數值異常 / 時間序列錯誤 / 其他
 *   **處置策略 (SOP)**：刪除 / 填補預設值 / 標記待處理 / 保留並註釋

---

## 5. 提交回答流程 ✅ 已完成

### 5.1 提交前驗證
`submitCurrentResponse()` 執行以下檢查：
1. 確認目前在 Q_ 開頭的分頁 (Z1 值檢查)
2. 確認 Home 頁面存在且 API Key 已填寫
3. 透過 `findRowByText()` 動態定位 SOP 與清洗區塊
4. 驗證 SOP 至少有一筆填寫
5. 驗證清洗區至少有標題列

### 5.2 Submit Loading Dialog (Modal) — `SubmitLoadingDialog.html`
確認對話框後，系統彈出評分彈窗：

*   **尺寸**：420 x 300 px
*   **三種狀態**：

| 狀態 | 視覺元素 | 觸發條件 |
|------|---------|---------|
| **Loading** | 紫色旋轉動畫 + 漸進式進度條 + 模擬 Log 文字 | 初始狀態 |
| **Success** | ✅ 圖示 + 分數預覽 (`XX / 20 分`) + 「查看結果」按鈕 | `performFullSubmit()` 回傳成功 |
| **Error** | ❌ 圖示 + 錯誤訊息 + 「關閉」按鈕 | 回傳失敗或例外 |

*   **Payload 傳遞方式**：透過 `html.append('<script>var payload = ...')` 將資料注入彈窗

*   **模擬 Log 文字**（每 3 秒更新一次）：
    1. `正在比對標準答案與你的健檢 SOP...`
    2. `正在分析商業邏輯判斷能力...`
    3. `正在評估異常值處置策略...`
    4. `正在計算清洗完整度...`
    5. `正在撰寫 AI 盲區雷達診斷...`

### 5.3 AI Feedback 區塊 (`renderFeedback()`)
提交成功後，在 Question Tab 下方渲染：

| 區塊 | 內容 | 樣式 |
|------|------|------|
| 評分標題 | `📊 AI 盲區雷達診斷` | 深紫底白字 |
| 分數表格 | 格式敏感度 / 商業邏輯 / 處置策略 / 清洗完整度 / 總分 | 淺紫底 |
| 文字評語 | `feedback_comment` (含 🟢🟡🔴 標示) | 淡紫底、自動換行、120px 高 |
| 標準答案標題 | `✅ 標準健檢解答` | 深紫底白字 |
| 標準答案內容 | `standard_answers` 文字 | 淺灰底、自動換行、120px 高 |
| 清洗範本標題 | `📄 清洗數據範本` | 深紫底白字 |
| 清洗範本內容 | `cleaned_data_template` 文字 | 淺灰底、自動換行、100px 高 |

*   重複提交：`renderFeedback()` 會先清除舊的評分區塊再重新渲染
*   Home 歷史表：`handleSubmitSuccess()` 會在 Home 頁面 Row 10 下方插入新行

---

## 6. API 通訊設定

```javascript
const BACKEND_URL = "https://script.google.com/macros/s/.../exec";
const CLIENT_VERSION = "1.1.0";
```

*   **Google Workspace 環境**：需在 `options.headers` 加入 `Authorization: Bearer <OAuthToken>`。
*   **個人 Gmail 部署**：可免除 Auth Header。
*   `CLIENT_VERSION` 自 v1.2 起加入，用於未來版本追蹤。

---

## 7. 文字格式化 (`formatDisplayText()`)

在寫入儲存格前處理 AI 回傳文字，確保在 Google Sheets 中正確換行顯示：
- 檢查條件使用 `*` 取代 `+` 允許無前置空白字元的中文條列（Regex: `/([^\n]) *(\d+[\.、]\s)/g`）
- 在編號項目 (`1. `, `2. `) 前插入雙換行 `\n\n`
- 在 BMP emoji 子彈 (☀–➿) 前插入雙換行 `\n\n`
- 在 supplemental emoji (surrogate pairs) 前插入雙換行 `\n\n`
- 摺疊連續 3+ 個 `\n` 為最多 2 個
