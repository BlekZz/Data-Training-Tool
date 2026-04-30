# 🧪 QA Checklist — Clasp 自動化測試指引

> **建立日期**: 2026-04-30
> **目標**: 提供給 Flash 模型透過 Clasp 進行系統性測試的完整清單
> **測試方式**: 在 GAS 後台編輯器中執行測試函式，或透過 `clasp run` 呼叫

---

## 測試前置準備

### 環境確認
- [ ] **P0** Backend Web App 已部署最新版本 (`clasp push --force` → GAS 編輯器重新部署)
- [ ] **P0** `SystemConfig` 中的模型名稱正確 (`gemini-2.0-flash` / `gemini-2.5-flash`)
- [ ] **P0** GAS Script Properties 已設定 `TEST_API_KEY`
- [ ] **P0** User Sheet 的 `BACKEND_URL` 指向正確的 `/exec` 網址
- [ ] **P0** `managed_users.json` 中所有 script ID 有效

### 測試用資料
```javascript
const TEST_EMAIL = "test@inboundmarketing.tw"; // 自動註冊白名單
const TEST_DOMAIN = "電商與零售 (E-commerce / Retail)";
const TEST_DIFFICULTY = "Level 1";
```

---

## Section A: Backend 基礎連線 (TestRunner.js)

> 在 GAS **Backend Side** 編輯器中直接執行

| ID | 測試項目 | 函式 | 預期結果 | 優先級 |
|----|---------|------|---------|--------|
| A1 | Gemini API 連線 | `test_GeminiConnection()` | Logger 輸出 `✅ Gemini 連線成功` + JSON `{"status":"ok"}` | P0 |
| A2 | 端對端題目生成 | `test_GenerateQuestion()` | Logger 輸出標題、資料筆數 (10-15)、預期錯誤列表 | P0 |
| A3 | 資料庫寫入/讀取 | `test_DatabaseWrite()` | Questions 表出現 `Q_TEST_001`，`getQuestionData` 成功讀取 | P0 |
| A4 | 可用模型列表 | `diagnose_Models()` | Logger 輸出含 `gemini-2.0-flash` 的模型清單 | P1 |

### A 類手動驗證
- [ ] A1 通過後，檢查 `ApiCallLog` 是否新增一筆 `success=TRUE` 記錄
- [ ] A2 通過後，檢查 `Questions` 表最後一筆是否包含 `cleaned_data_template` (col 13 非空)
- [ ] A3 通過後，手動刪除 `Q_TEST_001` 測試資料

---

## Section B: API 路由測試 (doPost)

> 建議新增至 `TestRunner.js` 或建立獨立測試函式

| ID | 測試項目 | 測試方法 | 預期結果 | 優先級 |
|----|---------|---------|---------|--------|
| B1 | doGet 健康檢查 | 瀏覽器開啟 Web App URL | 回傳 `Backend API is running.` | P0 |
| B2 | 空 POST 防禦 | POST 空 body | `{"status":"error","message":"Error: Empty POST data..."}` | P0 |
| B3 | 未知 action 防禦 | POST `{"action":"unknown"}` | `{"status":"error","message":"Unknown action: unknown"}` | P1 |
| B4 | 缺少 email 防禦 | POST generate-question 不帶 userEmail | `error` + `User Email 未填寫` | P0 |
| B5 | 非白名單 email | POST `userEmail: "test@gmail.com"` | `error` + `不在白名單中` | P0 |
| B6 | 白名單自動註冊 | POST `userEmail: "newuser@inboundmarketing.tw"` | `success` + Users 表新增一筆 | P1 |

### B 類測試函式範例
```javascript
function test_EmptyPost() {
  const e = { postData: { contents: '{}' } };
  const result = doPost(e);
  Logger.log(result.getContent());
}

function test_UnknownAction() {
  const e = { postData: { contents: JSON.stringify({ action: "unknown" }) } };
  const result = doPost(e);
  Logger.log(result.getContent());
}

function test_MissingEmail() {
  const TEST_API_KEY = PropertiesService.getScriptProperties().getProperty("TEST_API_KEY");
  const e = { postData: { contents: JSON.stringify({
    action: "generate-question",
    apiKey: TEST_API_KEY,
    domain: "電商與零售 (E-commerce / Retail)",
    difficulty: "Level 1"
  }) } };
  const result = doPost(e);
  Logger.log(result.getContent());
}

function test_NonWhitelistEmail() {
  const TEST_API_KEY = PropertiesService.getScriptProperties().getProperty("TEST_API_KEY");
  const e = { postData: { contents: JSON.stringify({
    action: "generate-question",
    apiKey: TEST_API_KEY,
    userEmail: "outsider@gmail.com",
    domain: "電商與零售 (E-commerce / Retail)",
    difficulty: "Level 1"
  }) } };
  const result = doPost(e);
  Logger.log(result.getContent());
}
```

---

## Section C: 生成題目 (generate-question) 全流程

| ID | 測試項目 | 預期結果 | 優先級 |
|----|---------|---------|--------|
| C1 | 電商 Level 1 生成 | 回傳含 title, business_context, sample_data (10-15筆), expected_health_check_answers, cleaned_data_template | P0 |
| C2 | 金融 Level 2 生成 | 同上，且 business_context 含金融相關術語 | P1 |
| C3 | 醫療 Level 3 生成 | 同上，且地雷以商業邏輯為主 (90%) | P1 |
| C4 | 行銷 Level 1 生成 | 同上，且 sample_data 含 CRM 相關欄位 | P1 |
| C5 | cleaned_data_template 筆數一致性 | `sample_data.length === cleaned_data_template.length` | P0 |
| C6 | cleaned_data_template 欄位一致性 | `Object.keys(sample_data[0])` 與 `Object.keys(cleaned_data_template[0])` 相同 | P0 |
| C7 | Questions 表寫入完整性 | 所有 13 欄都有值 (col 13 = cleaned_data_template 非空) | P0 |
| C8 | AuditLog 記錄 | AuditLog 出現 `action_type=generate-question`, `status=success` | P0 |
| C9 | ApiCallLog 記錄 | ApiCallLog 出現對應記錄，含 model_name, duration_ms, success=TRUE | P0 |

### C 類測試函式範例
```javascript
function test_GenerateAllDomains() {
  const TEST_API_KEY = PropertiesService.getScriptProperties().getProperty("TEST_API_KEY");
  if (!TEST_API_KEY) throw new Error("需設定 TEST_API_KEY");

  const domains = [
    "電商與零售 (E-commerce / Retail)",
    "金融與支付 (FinTech / Banking)",
    "醫療與健康照護 (Healthcare)",
    "行銷與 CRM (Marketing / CRM)"
  ];
  const difficulties = ["Level 1", "Level 2", "Level 3"];

  // 只測 4 domain × Level 1 (節省 API 配額)
  domains.forEach(function(domain) {
    const prompts = PromptBuilder.buildGenerationPrompt(domain, "Level 1");
    try {
      const result = GeminiClient.callApi(
        TEST_API_KEY, prompts.systemInstruction, prompts.userPrompt, false,
        { user_email: 'qa-test@inboundmarketing.tw', action: 'qa-generate' }
      );
      const sd = result.sample_data || [];
      const ct = result.cleaned_data_template || [];
      Logger.log("✅ " + domain + ": sample=" + sd.length + " clean=" + ct.length +
        " match=" + (sd.length === ct.length));
    } catch (e) {
      Logger.log("❌ " + domain + ": " + e.toString());
    }
  });
}
```

---

## Section D: 提交回答 (submit-response) 全流程

| ID | 測試項目 | 預期結果 | 優先級 |
|----|---------|---------|--------|
| D1 | 正常提交（有效 question_id） | 回傳含 format_score, business_logic_score, strategy_score, completeness_score, overall_score, feedback_comment | P0 |
| D2 | 不存在的 question_id | `error` + `Question not found` | P0 |
| D3 | standard_answers fallback | 若 Gemini 未回傳 standard_answers，則從 Questions 表讀取 expected_health_check_answers | P0 |
| D4 | cleaned_data_template fallback | 若 Gemini 未回傳 cleaned_data_template，則從 Questions 表讀取 | P0 |
| D5 | Responses 表寫入 | 出現新筆記錄，含 user_health_check_sop + user_cleaned_data JSON | P0 |
| D6 | Scores 表寫入 | 出現新筆記錄，含 5 個分數欄位 + feedback_comment | P0 |
| D7 | 分數範圍驗證 | 各維度 0-5，overall 0-20 | P1 |
| D8 | AuditLog 記錄 | `action_type=submit-response`, `status=success` | P0 |

### D 類測試函式範例
```javascript
function test_SubmitResponse() {
  const TEST_API_KEY = PropertiesService.getScriptProperties().getProperty("TEST_API_KEY");
  if (!TEST_API_KEY) throw new Error("需設定 TEST_API_KEY");

  // Step 1: 先生成一題
  const genPrompts = PromptBuilder.buildGenerationPrompt("電商與零售 (E-commerce / Retail)", "Level 1");
  const question = GeminiClient.callApi(
    TEST_API_KEY, genPrompts.systemInstruction, genPrompts.userPrompt, false,
    { user_email: 'qa@inboundmarketing.tw', action: 'qa-generate' }
  );

  const questionId = generateId("Q");
  Database.saveQuestion({
    question_id: questionId,
    user_email: "qa@inboundmarketing.tw",
    difficulty: "Level 1",
    domain: "電商與零售",
    prompt_version: genPrompts.promptVersion,
    title: question.title,
    business_context: question.business_context,
    instruction: question.instruction,
    sample_data: question.sample_data,
    expected_health_check_answers: question.expected_health_check_answers,
    cleaned_data_template: question.cleaned_data_template || null
  });

  // Step 2: 模擬提交
  const mockSop = [{ field: "order_id", error_type: "基礎格式錯誤", strategy: "標記待處理", note: "測試" }];
  const mockCleanData = question.cleaned_data_template || question.sample_data || [];

  const evalPrompts = PromptBuilder.buildEvaluationPrompt(
    question.business_context,
    JSON.stringify(question.expected_health_check_answers),
    JSON.stringify(mockSop),
    JSON.stringify(mockCleanData)
  );

  const score = GeminiClient.callApi(
    TEST_API_KEY, evalPrompts.systemInstruction, evalPrompts.userPrompt, false,
    { user_email: 'qa@inboundmarketing.tw', action: 'qa-evaluate' }
  );

  // Step 3: 驗證分數
  const dims = ['format_score', 'business_logic_score', 'strategy_score', 'completeness_score', 'overall_score'];
  let pass = true;
  dims.forEach(function(d) {
    const v = score[d];
    const max = d === 'overall_score' ? 20 : 5;
    if (v === undefined || v < 0 || v > max) {
      Logger.log("❌ " + d + " = " + v + " (預期 0-" + max + ")");
      pass = false;
    }
  });
  if (score.feedback_comment) {
    Logger.log("✅ feedback_comment 存在 (" + score.feedback_comment.length + " chars)");
  } else {
    Logger.log("❌ feedback_comment 缺失");
    pass = false;
  }
  Logger.log(pass ? "✅ 全部分數驗證通過" : "❌ 部分分數驗證失敗");
  Logger.log("📊 分數: " + JSON.stringify(score));
}
```

---

## Section E: 資料庫完整性

| ID | 測試項目 | 驗證方式 | 優先級 |
|----|---------|---------|--------|
| E1 | Questions 表 headers 正確 (13 欄) | `setupDatabaseHeaders()` 後檢查 | P0 |
| E2 | AuditLog 自動建立 | 刪除 AuditLog tab → 觸發任意 API → 確認自動重建 | P1 |
| E3 | ApiCallLog 自動建立 | 刪除 ApiCallLog tab → 觸發任意 API → 確認自動重建 | P1 |
| E4 | email 正規化 | 用 `"  Test@GMAIL.COM  "` 呼叫 → 確認存入 `test@gmail.com` | P1 |
| E5 | question_id 唯一性 | 連續生成 5 題 → 確認 5 個不同 question_id | P1 |
| E6 | 遷移腳本冪等性 | 執行 `migrateQuestionsAddCleanedData()` 兩次 → 不會重複新增欄位 | P1 |

---

## Section F: Gemini 容錯機制

| ID | 測試項目 | 測試方法 | 預期結果 | 優先級 |
|----|---------|---------|---------|--------|
| F1 | 無效 API Key | 使用 `"INVALID_KEY_12345"` 呼叫 | `error` + `已嘗試 3 次` + ApiCallLog 記錄 3 筆 | P0 |
| F2 | Fallback 模型切換 | 第一次失敗後檢查 ApiCallLog | attempt=2 的 model_name 為 `gemini-2.5-flash` | P1 |
| F3 | 全形字元處理 | 模擬 Gemini 回傳含 `１２３` 的 JSON | 解析後數字為 `123` | P2 |
| F4 | Markdown fence 剝離 | 模擬 Gemini 回傳含 `` ```json `` 的文字 | 正確解析為 JSON | P2 |

### F1 測試函式
```javascript
function test_InvalidApiKey() {
  try {
    GeminiClient.callApi(
      "INVALID_KEY_12345",
      "Test system instruction",
      '回覆 {"status":"ok"}',
      false,
      { user_email: 'qa@test.com', action: 'qa-invalid-key' }
    );
    Logger.log("❌ 預期應拋出錯誤但沒有");
  } catch (e) {
    Logger.log("✅ 正確拋出錯誤: " + e.toString().substring(0, 200));
    // 檢查 ApiCallLog 是否有 3 筆 attempt
    const sheet = SpreadsheetApp.openById(CONFIG.DATABASE_SHEET_ID).getSheetByName('ApiCallLog');
    const data = sheet.getDataRange().getValues();
    let count = 0;
    for (let i = data.length - 1; i >= 1 && count < 5; i--) {
      if (data[i][3] === 'qa-invalid-key') count++;
    }
    Logger.log(count === 3 ? "✅ ApiCallLog 正確記錄 3 次嘗試" : "❌ ApiCallLog 記錄 " + count + " 次 (預期 3)");
  }
}
```

---

## Section G: User Side 前端 (手動/半自動)

> 這些測試需在 User Sheet 中操作，無法完全自動化

| ID | 測試項目 | 操作步驟 | 預期結果 | 優先級 |
|----|---------|---------|---------|--------|
| G1 | Home 頁面初始化 | 選單 → 1. 初始化 Home 頁面 | B3 自動填入 email，B5/B6 有下拉選單 | P0 |
| G2 | 空 email 防禦 | 清空 B3 → 生成題目 | 彈窗顯示錯誤 `請在 Home 頁面 B3 儲存格填入...` | P0 |
| G3 | 空 API Key 防禦 | 清空 B4 → 生成題目 | 彈窗顯示錯誤 `請在 Home 頁面 B4 儲存格貼上...` | P0 |
| G4 | 生成成功 UI | 填入有效 email + API Key → 生成 | 新 Tab `Q_xxx` 出現，含藍/黃/綠三色區塊 | P0 |
| G5 | Z-Column 錨點 | 檢查新 Tab 的 Z1~Z5 | Z1=question_id, Z2~Z5 為列號數字 | P1 |
| G6 | SOP 下拉選單 | 點擊 SOP 區的 B 欄 | 出現「錯誤類型」6 個選項 | P1 |
| G7 | SOP 策略下拉 | 點擊 SOP 區的 C 欄 | 出現「處置策略」4 個選項 | P1 |
| G8 | 非 Q_ Tab 提交防禦 | 在 Home Tab 點「3. 提交本題回答」| Alert: 請先切換到題目分頁 | P0 |
| G9 | 空 SOP 提交防禦 | 在 Q_ Tab 不填寫任何 SOP → 提交 | Alert: SOP 表格是空的 | P0 |
| G10 | 正常提交流程 | 填寫 SOP + 清洗資料 → 提交 | 確認對話 → 評分彈窗 → 分數預覽 → 下方出現評分區塊 | P0 |
| G11 | 評分區塊完整性 | 提交後捲動至底部 | 看到「📊 AI 盲區雷達診斷」+ 分數 + 評語 + 標準答案 + 清洗範本 | P0 |
| G12 | Home 歷史記錄 | 提交後切回 Home | Row 11 出現新的成績記錄 | P1 |
| G13 | 重複提交 | 在同一 Q_ Tab 再次提交 | 舊評分區塊被清除，新結果重新渲染 | P1 |

---

## Section H: 多使用者推送

| ID | 測試項目 | 操作步驟 | 預期結果 | 優先級 |
|----|---------|---------|---------|--------|
| H1 | push_all.ps1 乾跑 | `pwsh scripts/push_all.ps1` → 輸入 N 取消 | 顯示目標清單後中止 | P1 |
| H2 | managed_users.json 有效性 | 檢查所有 script ID | 每個 ID 都能在 GAS 編輯器中開啟 | P1 |
| H3 | .clasp.json 還原 | 執行 push 後檢查 | `.clasp.json` 的 scriptId 還原為原始值 | P0 |

---

## 測試結果記錄模板

| Section | Pass | Fail | Skip | 備註 |
|---------|------|------|------|------|
| A: Backend 基礎 | /4 | | | |
| B: API 路由 | /6 | | | |
| C: 生成題目 | /9 | | | |
| D: 提交回答 | /8 | | | |
| E: 資料庫完整性 | /6 | | | |
| F: Gemini 容錯 | /4 | | | |
| G: User Side | /13 | | | |
| H: 多使用者推送 | /3 | | | |
| **Total** | **/53** | | | |
