# Prompt Spec

> **最後更新**: 2026-04-30
> **狀態**: 已與實作對齊 (PromptBuilder.js / DatabaseSetup.js — v1.2)

---

## 1. Generation Prompt

**用途**: 根據產業領域與難度等級，生成帶有商業情境的微型高密度異常數據樣本，以及對應的完整正確資料 (`cleaned_data_template`)。
**實作位置**: `PromptBuilder.buildGenerationPrompt(domain, difficulty)`
**目前版本**: `gen_v1.1`

### Inputs
*   `domain` — 產業領域 (電商/金融/醫療/行銷)
*   `difficulty` — 難度等級 (Level 1 / Level 2 / Level 3)

### System Instruction (摘要)
```
你是一位嚴格的數據分析導師。你的任務是生成一份「微型、高密度」的資料集來訓練實習生的資料判斷力。
請嚴格遵守以下 JSON 輸出格式，絕不允許任何 Markdown 標籤或額外文字。
```

### User Prompt 核心規則
1.  **數量限制**：精準生成 10 到 15 筆資料。
2.  **錯誤分佈**：
    *   30% 完全正確的干擾項
    *   30% 基礎格式錯誤 (空白、型別錯置、全半角混用)
    *   40% 商業邏輯地雷 (必須與 business_context 中的條件產生矛盾)
3.  **難度調整**：根據 `difficulty` 調整條件的隱蔽性。
4.  **cleaned_data_template 必須與 sample_data 筆數一致**，完整輸出所有清洗後的正確資料。

### Output Format (Strict JSON)
```json
{
  "title": "題目名稱",
  "business_context": "任務情境，包含解開產業邏輯地雷的隱藏線索",
  "instruction": "給實習生的操作指示",
  "sample_data": [{ ... }, { ... }],
  "expected_health_check_answers": ["預期錯誤 1", "預期錯誤 2"],
  "cleaned_data_template": [{ ... }, { ... }],
  "internal_notes": "出題邏輯說明"
}
```

### cleaned_data_template 規則
- 格式與 `sample_data` 完全相同 (相同欄位結構)
- 內容是 `sample_data` 的「完整正確版本」：所有格式錯誤已修正、商業邏輯地雷已還原、遺失值已填補
- 這是學員提交後對照用的標準答案資料集，務必完整輸出每一筆
- 於出題時一次性生成，儲存在 `Questions` 表的第 13 欄，評分時不再重新生成

### Gemini API 設定
*   `temperature`: 0.2 (低溫度，確保 JSON 格式穩定)
*   `response_mime_type`: `application/json` (強制 JSON 輸出)
*   `useFlash`: false (使用 Pro 模型，因出題需要較強邏輯推理)

---

## 2. Evaluation Prompt

**用途**: 評估使用者提交的健檢 SOP 與清洗後資料。
**實作位置**: `PromptBuilder.buildEvaluationPrompt(questionContext, expectedAnswers, userSop, userCleanedData)`
**目前版本**: `eval_v1.1`

### Inputs
*   `questionContext` — 原始題目的 business_context
*   `expectedAnswers` — 標準答案預期 (expected_health_check_answers)
*   `userSop` — 使用者填寫的健檢 SOP 表單 (JSON)
*   `userCleanedData` — 使用者清洗後的資料 (JSON)

### Rubric Dimensions (每項 0-5 分，總分 0-20)

| 維度 | 欄位名 | 說明 |
|------|--------|------|
| 基礎格式敏感度 | `format_score` | 找基礎格式錯誤的能力 |
| 商業邏輯判斷 | `business_logic_score` | 抓出不符 Business Context 的產業地雷 |
| 異常值處置策略 | `strategy_score` | 刪除/填補/標記的決策是否符合實務 |
| 清洗完整度 | `completeness_score` | 最終數據的可用性 |

### Feedback Format (AI 盲區雷達診斷)
*   **格式**: 使用要點式 (Bullet points) 撰寫，字數精簡
*   **標示**: 使用 🟢 🟡 🔴 標示各維度好壞
*   **範例**:
    ```
    🟢 基礎格式敏感度 (4/5)：有抓出日期與全半角問題。
    🟡 商業邏輯判斷 (3/5)：漏抓！退貨訂單依規定不能發放補償金。
    🟢 異常值處置 (4/5)：處置得當，標記了未知的性別而非直接刪除。
    ```

### Output Format (Strict JSON)
```json
{
  "format_score": 4,
  "business_logic_score": 3,
  "strategy_score": 4,
  "completeness_score": 4,
  "overall_score": 15,
  "feedback_comment": "🟢 基礎格式敏感度 (4/5)：...",
  "standard_answers": "完整的標準健檢 SOP 解答 (要點式列出所有該發現的地雷與正確處置)"
}
```

> **必須包含的 7 個 Key**: `format_score`, `business_logic_score`, `strategy_score`, `completeness_score`, `overall_score`, `feedback_comment`, `standard_answers`

### Fallback 邏輯 (Router.js)
- 若 Gemini 回傳未含 `standard_answers` → 從 `Questions.expected_health_check_answers` 讀取並格式化為帶編號的文字
- 若 Gemini 回傳未含 `cleaned_data_template` → 從 `Questions.cleaned_data_template` 讀取

---

## 3. Domain (產業類型) 定義

| Domain | 常見雷區 | 訓練重點 |
|--------|---------|---------| 
| **電商與零售** | 退貨金額 > 購買金額、時間序顛倒、折扣碼疊加後變負數、庫存為負、狀態矛盾 | 時間序列邏輯、金額核算 |
| **金融與支付** | 身分證校驗碼錯誤、未成年開戶、單筆交易極值、幣別匯率錯誤、凍結帳戶有新交易 | 嚴格格式校驗、極值敏感度 |
| **醫療與健康照護** | 生理數據不合理、診斷時間 < 入院時間、性別與診斷矛盾、年齡與疾病不符 | 跨欄位 Domain Knowledge |
| **行銷與 CRM** | Email 網域無效、手機號碼格式錯、重複註冊變體、點擊時間 < 發送時間 | 字串清理、去重、關聯性 |

## 4. Difficulty (難度等級) 定義

| 等級 | 地雷分佈 | Context 特色 | 目標 |
|------|---------|-------------|------|
| **Level 1** (實習生入職) | 格式 60% / 邏輯 40% | 明示型條件 | 培養看文件做事的習慣 |
| **Level 2** (獨立接案) | 格式 30% / 邏輯 70% | 跨欄位暗示型 | 培養「合理性」直覺 |
| **Level 3** (拆彈專家) | 格式 10% / 邏輯 90% | 多重條件交錯 | 複雜業務規則下的邏輯判斷 |

---

## 5. 防禦機制

### 5.1 全形字元自動轉換
Gemini 偶爾會輸出全形數字（如 `１０`），`GeminiClient.js` 內建自動轉換：
```javascript
textContent.replace(/[\uff01-\uff5e]/g, function(ch) {
  return String.fromCharCode(ch.charCodeAt(0) - 0xfee0);
});
```

### 5.2 Markdown 標籤剝離
即使設定了 `response_mime_type: application/json`，偶爾仍會出現 `` ```json `` 標籤：
```javascript
textContent.replace(/```json/g, "").replace(/```/g, "").trim();
```

### 5.3 三層重試機制
1.  第一次：使用偏好模型 (`gemini-2.0-flash`)
2.  第二次：自動切換至 Fallback 模型 (`gemini-2.5-flash`)，等待 1.5s
3.  第三次：繼續使用 Fallback 模型，等待 3s
4.  每次嘗試（不論成敗）都寫入 `ApiCallLog`
5.  三次失敗後回傳清晰錯誤訊息

### 5.4 文字格式化 (v1.1)
`formatDisplayText()` 在寫入 Google Sheet 儲存格前處理 AI 回傳文字：
- 在編號項目 (`1. `, `2. `) 前插入換行符
- 在 emoji 標記 (🟢, 🟡, 🔴 等) 前插入換行符
- 摺疊連續 3+ 個換行為最多 2 個
