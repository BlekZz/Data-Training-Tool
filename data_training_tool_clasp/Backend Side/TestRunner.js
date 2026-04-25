// TestRunner.js
// 用於直接在 GAS 後台測試各個模組的功能
// ⚠️ 僅供開發測試使用，正式部署前請確認 API Key 安全處理

// ============================================================
// 測試 1: 測試 Gemini 連線
// 直接在 GAS 後台執行此函式，確認 Gemini API 是否可正常呼叫
// ============================================================
function test_GeminiConnection() {
  // ⚠️ 此處直接填入測試用 API Key，測試後請移除
  const TEST_API_KEY = "AIzaSyBa3Q0RjVKqrKlqM2aAkDzPwIj7Veqf71w";
  
  const systemInstruction = "你是一個測試機器人，請回覆一個簡單的 JSON 物件。";
  const userPrompt = "請回覆: {\"status\": \"ok\", \"message\": \"Gemini 連線測試成功！\"}";
  
  try {
    const result = GeminiClient.callApi(TEST_API_KEY, systemInstruction, userPrompt, true);
    Logger.log("✅ Gemini 連線成功！回應: " + JSON.stringify(result));
  } catch (e) {
    Logger.log("❌ Gemini 連線失敗: " + e.toString());
  }
}

// ============================================================
// 測試 2: 端對端測試生成題目
// ============================================================
function test_GenerateQuestion() {
  const TEST_API_KEY = "AIzaSyBa3Q0RjVKqrKlqM2aAkDzPwIj7Veqf71w";
  const TEST_DOMAIN = "電商與零售 (E-commerce / Retail)";
  const TEST_DIFFICULTY = "Level 1";

  const prompts = PromptBuilder.buildGenerationPrompt(TEST_DOMAIN, TEST_DIFFICULTY);
  Logger.log("📋 [Generation Prompt Preview]\nSystem: " + prompts.systemInstruction.substring(0, 200) + "...");
  
  try {
    const aiResult = GeminiClient.callApi(TEST_API_KEY, prompts.systemInstruction, prompts.userPrompt, false);
    Logger.log("✅ 題目生成成功！");
    Logger.log("  標題: " + aiResult.title);
    Logger.log("  資料筆數: " + (aiResult.sample_data ? aiResult.sample_data.length : "N/A"));
    Logger.log("  預期發現錯誤: " + JSON.stringify(aiResult.expected_health_check_answers));
  } catch (e) {
    Logger.log("❌ 題目生成失敗: " + e.toString());
  }
}

// ============================================================
// 測試 3: 測試資料庫寫入
// ============================================================
function test_DatabaseWrite() {
  try {
    // 測試寫入 Questions
    Database.saveQuestion({
      question_id: "Q_TEST_001",
      user_email: "test@example.com",
      difficulty: "Level 1",
      domain: "E-commerce",
      prompt_version: "v1.0",
      title: "測試題目",
      business_context: "這是一個測試情境。",
      instruction: "請找出資料中的錯誤。",
      sample_data: [{ id: 1, name: "Test", status: "OK" }],
      expected_health_check_answers: ["測試錯誤 1"]
    });
    Logger.log("✅ Database.saveQuestion 寫入成功！");
    
    // 測試讀取 Questions
    const q = Database.getQuestionData("Q_TEST_001");
    Logger.log("✅ Database.getQuestionData 讀取成功！標題: " + (q ? q.question_title : "未找到"));
    
  } catch (e) {
    Logger.log("❌ 資料庫測試失敗: " + e.toString());
  }
}

// ============================================================
// 診斷工具: 列出所有可用模型
// ============================================================
function diagnose_Models() {
  const TEST_API_KEY = "AIzaSyBa3Q0RjVKqrKlqM2aAkDzPwIj7Veqf71w";
  const result = GeminiClient.listAvailableModels(TEST_API_KEY);
  Logger.log("📋 可用模型列表:\n" + result);
}
