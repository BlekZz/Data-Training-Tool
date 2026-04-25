# User Sheet UI Spec

> **最後更新**: 2026-04-25
> **狀態**: 已與實作對齊 (UserClient.js / LoadingDialog.html)

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

### 設計重點
*   Column A 寬度：150px / Column B 寬度：400px
*   B5, B6 使用 `DataValidation` 下拉選單
*   API Key 儲存在明文儲存格 (MVP 簡化版)

---

## 3. 生成流程 UX

### 3.1 Loading Dialog (Modal)
按下「2. 生成新題目」後，系統會彈出一個 **Modal Dialog** (`LoadingDialog.html`)：

*   **視覺元素**：CSS 旋轉動畫 + 漸進式進度條
*   **模擬 Log 文字**（每 3 秒更新一次）：
    1. `正在解析產業領域背景...`
    2. `正在構思隱蔽的地雷地雷...`
    3. `正在生成高密度商業資料...`
    4. `正在注入常見業務陷阱...`
    5. `即將完成，正在佈置工作表...`
*   **尺寸**：400 x 250 px
*   **用途**：防止使用者因等待而誤以為系統無回應、重複點擊

### 3.2 生成成功後
*   自動建立一個新的 Question Tab
*   彈出 Alert 通知使用者

---

## 4. Question Tab (動態生成)

每次成功生成題目後，由 `renderQuestionTab()` 自動建立。

### Tab 命名規則
`Q_<question_id 最後一段>` (例如 `Q_742`)

### 佈局結構
 
 | 區塊 | 列 (動態) | 內容 | 樣式 |
 |----|------|------|------|
 | 區塊 1 | Row 1 | 題目名稱 (A1:H1 合併) | **深藍底白字** (`#2E5FA3`)、粗體 |
 | 區塊 2 | Row 2-5 | 【任務情境】+ business_context | **淡藍底** (`#EBF3FB`)、自動換行 |
 | 區塊 3 | Row 6 | 操作指示 (例如：📄 請找出異常...) | 淺灰底、斜體 |
 | 區塊 4 | Row 7 | 資料欄位標題 | **粉藍底** (`#CFE2FF`)、粗體 |
 | 區塊 4 | Row 8~M | Sample Data (由 AI 生成) | 標準格線 |
 | 區塊 5 | M+2 | `🧠 步驟一：健檢診斷 SOP` | **深紫底白字** (`#4A4A8A`)、粗體 |
 | 區塊 5 | M+3 | SOP 表格標題：異常欄位 / 錯誤類型 / 處置策略 / 詳細說明 | 淺紫底 (`#DEDEFA`) |
 | 區塊 5 | M+4~M+10 | **SOP 使用者填寫區 (固定 7 列)** | **淡黃底** (`#FFFDE7`)、含下拉選單 |
 | 區塊 6 | M+12 | `✨ 步驟二：清洗後資料` | **深綠底白字** (`#2E7D32`)、粗體 |
 | 區塊 6 | M+13 | 標題輸入列 (請在此填寫標題) | 淺綠底 (`#C8E6C9`) |
 | 區塊 6 | M+14~M+33 | **清洗後資料填寫區 (固定 20 列)** | **淡綠底** (`#F1F8E9`) |
 
 ### 錨點系統 (Anchors)
 為了確保 `submitCurrentResponse()` 即使在使用者修改版面後仍能精準讀取資料，系統在 **Z 欄 (隱藏)** 儲存了座標：
 
 | 儲存格 | 內容 | 用途 |
 |--------|------|------|
 | **Z1** | `question_id` | 提交時關連後端資料庫 |
 | **Z2** | `sopDataRow` (起) | SOP 填寫區的第一列列號 |
 | **Z3** | `sopEndRow` (止) | SOP 填寫區的最後一列列號 |
 | **Z4** | `cleanTitleRow` | 清洗資料標題列的列號 |
 | **Z5** | `cleanEndRow` | 清洗資料填寫區的最後一列列號 |
 
 ### 輸入驗證 (Data Validation)
 *   **錯誤類型 (SOP)**：基礎格式錯誤 / 商業邏輯地雷 / 遺失值 / 數值異常 / 時間序列錯誤 / 其他
 *   **處置策略 (SOP)**：刪除 / 填補預設值 / 標記待處理 / 保留並註釋

---

## 5. 提交回答流程

### 5.1 目前狀態：🔧 部分完成
`submitCurrentResponse()` 目前為 **Stub 實作**，尚需完成：
1.  **精準定位 SOP 資料範圍**：根據「🧠 步驟一」標題動態找到 SOP 表格起始列。
2.  **精準定位清洗後資料範圍**：根據「✨ 步驟二」標題動態找到資料起始列。
3.  **POST 至後端**：將 `user_health_check_sop` 與 `user_cleaned_data` 打包為 JSON 傳送。
4.  **渲染評分結果**：在 Question Tab 下方顯示 AI 回傳的分數與雷達診斷。

### 5.2 預期完成後的 AI Feedback 區塊

| 列 | 內容 |
|----|------|
| 評分標題列 | `📊 AI 盲區雷達診斷` |
| 分數表格 | 格式敏感度 / 商業邏輯 / 處置策略 / 清洗完整度 / 總分 |
| 文字評語 | feedback_comment (含 🟢🟡🔴 標示) |

---

## 6. API 通訊設定

```javascript
const BACKEND_URL = "https://script.google.com/macros/s/.../exec";
```

*   **Google Workspace 環境**：需在 `options.headers` 加入 `Authorization: Bearer <OAuthToken>`。
*   **個人 Gmail 部署**：可免除 Auth Header。
