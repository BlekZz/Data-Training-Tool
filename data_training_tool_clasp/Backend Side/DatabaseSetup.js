// DatabaseSetup.js
// 一次性執行：初始化 Database Google Sheet 的所有欄位標題
// 請在 GAS 後台手動執行一次 setupDatabaseHeaders()

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
      "question_tab_url", "created_at"
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
      "prompt_version", "type", "notes", "status", "created_at"
    ],
    "SystemConfig": [
      "config_key", "config_value", "description", "updated_at"
    ],
    "AuditLog": [
      "log_id", "user_email", "action_type", "related_id",
      "status", "error_message", "timestamp"
    ]
  };

  Object.entries(schemas).forEach(([sheetName, headers]) => {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      Logger.log(`✅ 建立工作表: ${sheetName}`);
    } else {
      Logger.log(`⚠️ 工作表已存在，僅更新標題: ${sheetName}`);
    }
    // 寫入標題列
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // 初始化預設設定 (僅在 SystemConfig 為空時)
    if (sheetName === "SystemConfig" && sheet.getLastRow() === 1) {
      const defaultConfigs = [
        ["GEMINI_PRO_MODEL", "gemini-2.0-flash", "用於出題與評分的高階模型", new Date().toISOString()],
        ["GEMINI_FLASH_MODEL", "gemini-2.0-flash", "用於快速回應的輕量模型", new Date().toISOString()]
      ];
      sheet.getRange(2, 1, defaultConfigs.length, defaultConfigs[0].length).setValues(defaultConfigs);
    }

    // 設定標題樣式
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#4A90D9");
    headerRange.setFontColor("#FFFFFF");
    sheet.setFrozenRows(1);
  });

  Logger.log("🎉 所有 Database 工作表初始化完成！");
}
