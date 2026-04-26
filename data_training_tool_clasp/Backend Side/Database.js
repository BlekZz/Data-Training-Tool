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
   * 驗證用戶權限 (白名單控管)
   * 1. 若存在於 Users 工作表，更新 Sheet 資訊並通過
   * 2. 若為 @inboundmarketing.tw 網域，自動加入 Users 工作表並通過
   * 3. 否則拋出錯誤拒絕存取
   */
  validateUserAccess: function(postData) {
    const userEmail = postData.userEmail || "anonymous@example.com";
    const sheetId = postData.userSheetId || "";
    const sheetUrl = postData.userSheetUrl || "";
    const userName = userEmail.split('@')[0];
    
    const sheet = this.getSheet('Users');
    if (!sheet) throw new Error("找不到 Users 工作表，無法進行權限驗證");
    
    const data = sheet.getDataRange().getValues();
    if (data.length === 0) throw new Error("Users 工作表完全空白，缺少欄位");
    
    const headers = data[0];
    const emailIndex = headers.indexOf('user_email');
    if (emailIndex === -1) throw new Error("Users 工作表缺少 user_email 欄位");
    
    // 檢查是否已在名單中
    for (let i = 1; i < data.length; i++) {
      if (data[i][emailIndex] === userEmail) {
        // 更新現有使用者的 Sheet 資訊
        const idIdx = headers.indexOf('user_sheet_id');
        const urlIdx = headers.indexOf('user_sheet_url');
        if (idIdx !== -1 && sheetId) sheet.getRange(i + 1, idIdx + 1).setValue(sheetId);
        if (urlIdx !== -1 && sheetUrl) sheet.getRange(i + 1, urlIdx + 1).setValue(sheetUrl);
        return true;
      }
    }
    
    // 不在名單中，檢查 Domain 是否允許自動註冊
    if (String(userEmail).endsWith('@inboundmarketing.tw')) {
      const newRow = new Array(headers.length).fill('');
      
      const userIdIdx = headers.indexOf('user_id');
      if (userIdIdx !== -1) newRow[userIdIdx] = generateId("U");
      
      newRow[emailIndex] = userEmail;
      
      const nameIdx = headers.indexOf('user_name');
      if (nameIdx !== -1) newRow[nameIdx] = userName;
      
      const sheetIdIdx = headers.indexOf('user_sheet_id');
      if (sheetIdIdx !== -1) newRow[sheetIdIdx] = sheetId;
      
      const sheetUrlIdx = headers.indexOf('user_sheet_url');
      if (sheetUrlIdx !== -1) newRow[sheetUrlIdx] = sheetUrl;
      
      const statusIdx = headers.indexOf('status');
      if (statusIdx !== -1) newRow[statusIdx] = "active";
      
      const createdAtIndex = headers.indexOf('created_at');
      if (createdAtIndex !== -1) newRow[createdAtIndex] = new Date().toISOString();
      
      sheet.appendRow(newRow);
      return true;
    }
    
    // 拒絕存取
    throw new Error(`您的帳號 (${userEmail}) 不在白名單中，無法進行此操作。請聯繫開發人員協助加入白名單！`);
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
  },

  /**
   * 取得啟用中的 Prompt 版本
   */
  getActivePrompt: function(type) {
    const sheet = this.getSheet('PromptVersions');
    if (!sheet) throw new Error("找不到 PromptVersions 工作表");
    const data = sheet.getDataRange().getValues();
    if (data.length < 2) throw new Error("PromptVersions 工作表為空");
    
    const headers = data[0];
    const typeIndex = headers.indexOf('type');
    const sysIndex = headers.indexOf('system_instruction');
    const userIndex = headers.indexOf('user_prompt_template');
    const activeIndex = headers.indexOf('is_active');
    const idIndex = headers.indexOf('prompt_version');

    if (typeIndex === -1 || sysIndex === -1 || userIndex === -1 || activeIndex === -1 || idIndex === -1) {
      throw new Error("PromptVersions 欄位不齊全");
    }

    for (let i = 1; i < data.length; i++) {
      if (data[i][typeIndex] === type && data[i][activeIndex] === true) {
        return {
          prompt_id: data[i][idIndex],
          system_instruction: data[i][sysIndex],
          user_prompt_template: data[i][userIndex]
        };
      }
    }
    throw new Error(`找不到啟用的 ${type} Prompt 版本`);
  }
};
