// DatabaseSetup.js
// 一次性執行：初始化 Database Google Sheet 的所有欄位標題
// 請在 GAS 後台手動執行一次 setupDatabaseHeaders()
// 已有資料的 Sheet 請改執行 migrateQuestionsAddCleanedData() 和 migrateGenerationPrompt()

function setupDatabaseHeaders() {
  const ss = SpreadsheetApp.openById(CONFIG.DATABASE_SHEET_ID);

  const schemas = {
    "Users": [
      "user_id", "user_email", "user_name", "user_sheet_id", "user_sheet_url",
      "status", "allowed_difficulty", "allowed_domain", "weekly_limit",
      "key_status", "last_validated_at", "created_at", "updated_at"
    ],
    "Questions": [
      "question_id", "user_email", "difficulty", "domain", "prompt_version",
      "question_title", "business_context", "question_instruction",
      "sample_data_snapshot", "expected_health_check_answers",
      "question_tab_url", "created_at",
      "cleaned_data_template"  // col 13 — added after initial launch
    ],
    "Responses": [
      "response_id", "question_id", "user_email",
      "user_health_check_sop", "user_cleaned_data",
      "submitted_at", "response_status"
    ],
    "Scores": [
      "score_id", "question_id", "response_id", "user_email",
      "overall_score", "format_score", "business_logic_score",
      "strategy_score", "completeness_score",
      "evaluator_version", "feedback_comment", "scored_at"
    ],
    "PromptVersions": [
      "prompt_version", "type", "system_instruction", "user_prompt_template", "is_active", "created_at"
    ],
    "SystemConfig": [
      "config_key", "config_value", "description", "updated_at"
    ],
    "AuditLog": [
      "log_id", "user_email", "action_type", "related_id",
      "status", "error_message", "timestamp"
    ]
  };

  Object.entries(schemas).forEach(function(entry) {
    const sheetName = entry[0];
    const headers = entry[1];
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      Logger.log('✅ 建立工作表: ' + sheetName);
    } else {
      Logger.log('⚠️ 工作表已存在，僅更新標題: ' + sheetName);
    }
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

    if (sheetName === "SystemConfig" && sheet.getLastRow() === 1) {
      const defaultConfigs = [
        ["GEMINI_PRO_MODEL", "gemini-2.0-flash", "用於出題與評分的高階模型", new Date().toISOString()],
        ["GEMINI_FLASH_MODEL", "gemini-2.0-flash", "用於快速回應的輕量模型", new Date().toISOString()]
      ];
      sheet.getRange(2, 1, defaultConfigs.length, defaultConfigs[0].length).setValues(defaultConfigs);
    }

    if (sheetName === "PromptVersions" && sheet.getLastRow() === 1) {
      const GEN_SYSTEM = '你是一位嚴格的數據分析導師。你的任務是生成一份「微型、高密度」的資料集來訓練實習生的資料判斷力。\n請嚴格遵守以下 JSON 輸出格式，絕不允許任何 Markdown 標籤 (如 ```json) 或額外文字。\n\n【輸出格式】\n{\n  "title": "題目名稱",\n  "business_context": "任務情境，必須包含能解開產業邏輯地雷的隱藏線索。",\n  "instruction": "給實習生的操作指示",\n  "sample_data": [{...}, {...}],\n  "expected_health_check_answers": ["預期他們應該發現的錯誤 1", "預期他們應該發現的錯誤 2"],\n  "cleaned_data_template": [{...}, {...}],\n  "internal_notes": "出題邏輯說明"\n}\n\n【cleaned_data_template 規則】\n- 格式與 sample_data 完全相同 (相同欄位結構)\n- 內容是 sample_data 的「完整正確版本」：所有格式錯誤已修正、商業邏輯地雷已還原、遺失值已填補\n- 這是學員提交後對照用的標準答案資料集，務必完整輸出每一筆。';

      const GEN_USER = '請根據以下設定生成題目：\n- 產業領域 (Domain): ${domain}\n- 難度等級 (Difficulty): ${difficulty}\n\n【資料生成要求】\n1. 數量限制：精準生成 10 到 15 筆資料。\n2. 錯誤分佈：\n   - 30% 完全正確的干擾項\n   - 30% 基礎格式錯誤 (例如：空白、型別錯置、全半角混用)\n   - 40% 商業邏輯地雷 (必須與 business_context 中的條件產生矛盾，例如退貨卻算入營收)\n3. 在「${domain}」領域中，請埋入常見的業務陷阱。\n4. 在 Level ${difficulty} 難度下，調整條件的隱蔽性 (Level 1 為明示，Level 2 為跨欄位暗示，Level 3 為多重條件交錯)。\n5. cleaned_data_template 必須與 sample_data 筆數一致，完整輸出所有清洗後的正確資料。';

      const EVAL_SYSTEM = '你是一位資深的數據分析主管，現在要評估實習生提交的資料清洗結果。\n請嚴格輸出符合下列格式的 JSON，絕不允許任何 Markdown 標籤 (如 ```json) 或額外文字。\n\n【輸出格式】\n{\n  "format_score": <數字 0-5>,\n  "business_logic_score": <數字 0-5>,\n  "strategy_score": <數字 0-5>,\n  "completeness_score": <數字 0-5>,\n  "overall_score": <數字 0-20>,\n  "feedback_comment": "AI 盲區雷達診斷 (請務必使用「要點式 (Bullet points)」撰寫，字數精簡，包含各維度短評，並使用 🟢 🟡 🔴 標示好壞)",\n  "standard_answers": "完整的標準健檢 SOP 解答 (要點式列出所有該發現的地雷與正確處置)"\n}\n\n請務必確保輸出的 JSON 結構包含上述所有 7 個 Key，絕不可遺漏。';

      const EVAL_USER = '【題目背景】\n任務情境: ${questionContext}\n標準答案預期: ${expectedAnswers}\n\n【實習生提交結果】\n實習生填寫的健檢 SOP: ${userSop}\n實習生清洗後的資料: ${userCleanedData}\n\n請根據以上資訊，給出嚴格且有建設性的評分與雷達短評。';

      const defaultPrompts = [
        ["gen_v1.1", "generation", GEN_SYSTEM, GEN_USER, true, new Date().toISOString()],
        ["eval_v1.1", "evaluation", EVAL_SYSTEM, EVAL_USER, true, new Date().toISOString()]
      ];
      sheet.getRange(2, 1, defaultPrompts.length, defaultPrompts[0].length).setValues(defaultPrompts);
    }

    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#4A90D9");
    headerRange.setFontColor("#FFFFFF");
    sheet.setFrozenRows(1);
  });

  Logger.log("🎉 所有 Database 工作表初始化完成！");
}

/**
 * 遷移腳本 1：對已有資料的 Questions 工作表新增 cleaned_data_template 欄位。
 * 在 GAS 後台手動執行一次即可，不影響現有資料。
 */
function migrateQuestionsAddCleanedData() {
  const ss = SpreadsheetApp.openById(CONFIG.DATABASE_SHEET_ID);
  const sheet = ss.getSheetByName('Questions');
  if (!sheet) {
    Logger.log('❌ 找不到 Questions 工作表');
    return;
  }

  const lastCol = sheet.getLastColumn();
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

  if (headers.indexOf('cleaned_data_template') !== -1) {
    Logger.log('✅ cleaned_data_template 欄位已存在，無需遷移');
    return;
  }

  const newCol = lastCol + 1;
  const cell = sheet.getRange(1, newCol);
  cell.setValue('cleaned_data_template');
  cell.setFontWeight('bold').setBackground('#4A90D9').setFontColor('#FFFFFF');
  Logger.log('✅ 已在 Questions 工作表第 ' + newCol + ' 欄新增 cleaned_data_template');
}

/**
 * 遷移腳本 2：更新現有 generation prompt，加入 cleaned_data_template 輸出欄位。
 * 在 GAS 後台手動執行一次即可。
 */
function migrateGenerationPrompt() {
  const ss = SpreadsheetApp.openById(CONFIG.DATABASE_SHEET_ID);
  const sheet = ss.getSheetByName('PromptVersions');
  if (!sheet) {
    Logger.log('❌ 找不到 PromptVersions 工作表');
    return;
  }

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const typeIdx   = headers.indexOf('type');
  const sysIdx    = headers.indexOf('system_instruction');
  const userIdx   = headers.indexOf('user_prompt_template');
  const activeIdx = headers.indexOf('is_active');

  for (let i = 1; i < data.length; i++) {
    if (data[i][typeIdx] !== 'generation' || data[i][activeIdx] !== true) continue;

    const sysInstruction = String(data[i][sysIdx]);

    if (sysInstruction.indexOf('cleaned_data_template') !== -1) {
      Logger.log('✅ Generation prompt 已包含 cleaned_data_template，無需遷移');
      return;
    }

    // 在 internal_notes 前插入 cleaned_data_template 欄位定義
    const needle = '"internal_notes"';
    const insert = '  "cleaned_data_template": [{...}, {...}],\n  ';
    const updated = sysInstruction.indexOf(needle) !== -1
      ? sysInstruction.replace(needle, insert + needle)
      : sysInstruction + '\n\n【cleaned_data_template 規則】\n- 格式與 sample_data 完全相同 (相同欄位結構)\n- 內容是 sample_data 的完整正確版本：所有格式錯誤已修正、地雷已還原、遺失值已填補\n- 務必完整輸出每一筆資料';

    // Append cleaned_data_template requirement to user prompt too
    const userPrompt = String(data[i][userIdx]);
    const updatedUser = userPrompt.indexOf('cleaned_data_template') !== -1
      ? userPrompt
      : userPrompt + '\n5. cleaned_data_template 必須與 sample_data 筆數一致，完整輸出所有清洗後的正確資料。';

    sheet.getRange(i + 1, sysIdx + 1).setValue(updated);
    sheet.getRange(i + 1, userIdx + 1).setValue(updatedUser);
    Logger.log('✅ 已更新 generation prompt，加入 cleaned_data_template 欄位定義');
    return;
  }

  Logger.log('⚠️ 找不到啟用中的 generation prompt');
}
