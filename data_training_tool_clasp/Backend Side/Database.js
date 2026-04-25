// Database.js
// 負責與 Central Database (Google Sheet) 溝通 (Module E)

const Database = {
  getSheet: function(sheetName) {
    return SpreadsheetApp.openById(CONFIG.DATABASE_SHEET_ID).getSheetByName(sheetName);
  },

  /**
   * 寫入新的題目記錄
   */
  saveQuestion: function(questionData) {
    const sheet = this.getSheet('Questions');
    if (!sheet) throw new Error("找不到 Questions 工作表");
    
    // 欄位對應: question_id, user_email, difficulty, domain, prompt_version, question_title, business_context, question_instruction, sample_data_snapshot, expected_health_check_answers, question_tab_url, created_at
    const row = [
      questionData.question_id,
      questionData.user_email,
      questionData.difficulty,
      questionData.domain,
      questionData.prompt_version || 'v1',
      questionData.title,
      questionData.business_context,
      questionData.instruction,
      JSON.stringify(questionData.sample_data),
      JSON.stringify(questionData.expected_health_check_answers),
      questionData.question_tab_url || '',
      new Date().toISOString()
    ];
    sheet.appendRow(row);
  },

  /**
   * 寫入 User 的回答記錄
   */
  saveResponse: function(responseData) {
    const sheet = this.getSheet('Responses');
    if (!sheet) throw new Error("找不到 Responses 工作表");
    
    // 欄位對應: response_id, question_id, user_email, user_health_check_sop, user_cleaned_data, submitted_at, response_status
    const row = [
      responseData.response_id,
      responseData.question_id,
      responseData.user_email,
      JSON.stringify(responseData.user_health_check_sop),
      JSON.stringify(responseData.user_cleaned_data),
      new Date().toISOString(),
      'SUBMITTED'
    ];
    sheet.appendRow(row);
  },

  /**
   * 寫入評分結果
   */
  saveScore: function(scoreData) {
    const sheet = this.getSheet('Scores');
    if (!sheet) throw new Error("找不到 Scores 工作表");
    
    // 欄位對應: score_id, question_id, response_id, user_email, overall_score, format_score, business_logic_score, strategy_score, completeness_score, evaluator_version, feedback_comment, scored_at
    const row = [
      scoreData.score_id,
      scoreData.question_id,
      scoreData.response_id,
      scoreData.user_email,
      scoreData.overall_score,
      scoreData.format_score,
      scoreData.business_logic_score,
      scoreData.strategy_score,
      scoreData.completeness_score,
      scoreData.evaluator_version || 'v1',
      scoreData.feedback_comment,
      new Date().toISOString()
    ];
    sheet.appendRow(row);
  },
  
  /**
   * 讀取題目的標準答案與情境 (評分時需要)
   */
  getQuestionData: function(questionId) {
    const sheet = this.getSheet('Questions');
    if (!sheet) throw new Error("找不到 Questions 工作表");
    
    const data = sheet.getDataRange().getValues();
    if (data.length < 2) return null;
    
    const headers = data[0];
    const qidIndex = headers.indexOf('question_id');
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][qidIndex] === questionId) {
        let rowData = {};
        headers.forEach((h, index) => { rowData[h] = data[i][index]; });
        return rowData;
      }
    }
    return null;
  },

  /**
   * 從 SystemConfig 工作表獲取設定
   */
  getSystemConfig: function(key, defaultValue) {
    try {
      const sheet = this.getSheet('SystemConfig');
      if (!sheet) return defaultValue;
      
      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      const keyIndex = headers.indexOf('config_key');
      const valIndex = headers.indexOf('config_value');
      
      for (let i = 1; i < data.length; i++) {
        if (data[i][keyIndex] === key) {
          return data[i][valIndex] || defaultValue;
        }
      }
    } catch (e) {
      console.warn("getSystemConfig error:", e);
    }
    return defaultValue;
  },

  /**
   * 寫入 AuditLog 紀錄
   */
  saveAuditLog: function(logData) {
    try {
      const sheet = this.getSheet('AuditLog');
      if (!sheet) return;
      const row = [
        generateId("L"),
        logData.user_email || "anonymous",
        logData.action_type || "unknown",
        logData.related_id || "",
        logData.status || "unknown",
        logData.error_message || "",
        new Date().toISOString()
      ];
      sheet.appendRow(row);
    } catch (e) {
      // AuditLog 失敗不應影響主流程
      console.warn("AuditLog write failed:", e);
    }
  }
};
