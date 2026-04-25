// PromptBuilder.js
// 負責建構丟給 Gemini 的 Prompt (Module B)

const PromptBuilder = {
  
  buildGenerationPrompt: function(domain, difficulty) {
    const systemInstruction = `
你是一位嚴格的數據分析導師。你的任務是生成一份「微型、高密度」的資料集來訓練實習生的資料判斷力。
請嚴格遵守以下 JSON 輸出格式，絕不允許任何 Markdown 標籤 (如 \`\`\`json) 或額外文字。

【輸出格式】
{
  "title": "題目名稱",
  "business_context": "任務情境，必須包含能解開產業邏輯地雷的隱藏線索。",
  "instruction": "給實習生的操作指示",
  "sample_data": [{...}, {...}], // 嚴格限制 10~15 筆 JSON Object
  "expected_health_check_answers": ["預期他們應該發現的錯誤 1", "預期他們應該發現的錯誤 2"],
  "internal_notes": "出題邏輯說明"
}
`;

    const userPrompt = `
請根據以下設定生成題目：
- 產業領域 (Domain): ${domain}
- 難度等級 (Difficulty): ${difficulty}

【資料生成要求】
1. 數量限制：精準生成 10 到 15 筆資料。
2. 錯誤分佈：
   - 30% 完全正確的干擾項
   - 30% 基礎格式錯誤 (例如：空白、型別錯置、全半角混用)
   - 40% 商業邏輯地雷 (必須與 business_context 中的條件產生矛盾，例如退貨卻算入營收)
3. 在「${domain}」領域中，請埋入常見的業務陷阱。
4. 在 Level ${difficulty} 難度下，調整條件的隱蔽性 (Level 1 為明示，Level 2 為跨欄位暗示，Level 3 為多重條件交錯)。
`;

    return { systemInstruction, userPrompt };
  },

  buildEvaluationPrompt: function(questionContext, expectedAnswers, userSop, userCleanedData) {
    const systemInstruction = `
你是一位資深的數據分析主管，現在要評估實習生提交的資料清洗結果。
請嚴格輸出符合下列格式的 JSON，絕不允許任何 Markdown 標籤 (如 \`\`\`json) 或額外文字。

【輸出格式】
{
  "format_score": <數字 0-5>,
  "business_logic_score": <數字 0-5>,
  "strategy_score": <數字 0-5>,
  "completeness_score": <數字 0-5>,
  "overall_score": <數字 0-20>,
  "feedback_comment": "AI 盲區雷達診斷 (150字內，包含維度短評，請使用 🟢 🟡 🔴 標示)"
}
`;

    const userPrompt = `
【題目背景】
任務情境: ${questionContext}
標準答案預期: ${expectedAnswers}

【實習生提交結果】
實習生填寫的健檢 SOP: ${JSON.stringify(userSop)}
實習生清洗後的資料: ${JSON.stringify(userCleanedData)}

請根據以上資訊，給出嚴格且有建設性的評分與雷達短評。
`;

    return { systemInstruction, userPrompt };
  }
};
