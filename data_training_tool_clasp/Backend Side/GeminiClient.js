// GeminiClient.js
// 負責與 Google Gemini API 溝通的模組 (Module C)

const GeminiClient = {
  /**
   * 呼叫 Gemini API
   * @param {string} apiKey - User 提供的 API Key
   * @param {string} systemInstruction - 系統提示詞 (System Prompt)
   * @param {string} userPrompt - 任務提示詞
   * @param {boolean} useFlash - 是否使用速度較快的 Flash 模型
   * @param {Object} [context] - 供 ApiCallLog 使用的呼叫上下文，例如 { user_email, action }
   * @returns {Object} JSON 解析後的結果
   */
  callApi: function(apiKey, systemInstruction, userPrompt, useFlash = true, context) {
    context = context || {};
    let attempts = 0;
    const maxAttempts = 3;
    let lastError = null;

    // 優先從資料庫讀取模型設定
    const configKey = useFlash ? "GEMINI_FLASH_MODEL" : "GEMINI_PRO_MODEL";
    let modelName = Database.getSystemConfig(configKey, CONFIG.DEFAULT_MODEL);

    while (attempts < maxAttempts) {
      const attemptNum = attempts + 1;
      const attemptStart = Date.now();
      let httpStatus = null;
      let errorDetail = '';

      try {
        // 第二次嘗試起切換備用模型
        if (attempts === 1) {
          modelName = CONFIG.FALLBACK_MODEL;
          console.warn(`第 ${attemptNum} 次嘗試：切換至備用模型 ${modelName}`);
        }

        const url = `${CONFIG.API_BASE_URL}${modelName}:generateContent?key=${apiKey}`;

        const payload = {
          "system_instruction": { "parts": [{ "text": systemInstruction }] },
          "contents": [{ "parts": [{ "text": userPrompt }] }],
          "generationConfig": {
            "temperature": 0.2,
            "response_mime_type": "application/json"
          }
        };

        const options = {
          "method": "post",
          "contentType": "application/json",
          "payload": JSON.stringify(payload),
          "muteHttpExceptions": true
        };

        const response = UrlFetchApp.fetch(url, options);
        httpStatus = response.getResponseCode();
        const responseBody = response.getContentText();

        if (httpStatus !== 200) {
          errorDetail = responseBody.substring(0, 800);
          throw new Error(`API Error ${httpStatus}: ${responseBody}`);
        }

        const jsonResponse = JSON.parse(responseBody);
        if (!jsonResponse.candidates || jsonResponse.candidates.length === 0) {
          errorDetail = "No candidates in response: " + responseBody.substring(0, 400);
          throw new Error("No candidates returned.");
        }

        let textContent = jsonResponse.candidates[0].content.parts[0].text;

        // --- 預處理：清除 markdown fence、轉換全形符號 ---
        textContent = textContent.replace(/```json/g, "").replace(/```/g, "").trim();
        textContent = textContent.replace(/[！-～]/g, function(ch) {
          return String.fromCharCode(ch.charCodeAt(0) - 0xfee0);
        }).replace(/　/g, " ");

        const result = JSON.parse(textContent);

        Database.saveApiCallLog({
          user_email: context.user_email || '',
          action: context.action || '',
          model_name: modelName,
          attempt: attemptNum,
          http_status: httpStatus,
          duration_ms: Date.now() - attemptStart,
          success: true,
          error_detail: ''
        });

        return result;

      } catch (error) {
        lastError = error;

        Database.saveApiCallLog({
          user_email: context.user_email || '',
          action: context.action || '',
          model_name: modelName,
          attempt: attemptNum,
          http_status: httpStatus !== null ? httpStatus : '',
          duration_ms: Date.now() - attemptStart,
          success: false,
          error_detail: errorDetail || error.toString().substring(0, 800)
        });

        attempts++;
        console.error(`第 ${attemptNum} 次嘗試失敗:`, error.toString());

        if (attempts < maxAttempts) {
          // 等待時間隨次數增加 (1.5s, 3s)
          Utilities.sleep(attempts * 1500);
        }
      }
    }

    // 三次全部失敗
    throw new Error(`AI 呼叫失敗 (已嘗試 ${maxAttempts} 次)，請稍後再試。最後錯誤: ${lastError.message}`);
  },

  /**
   * 診斷用：列出這把 API Key 可以使用的所有模型名稱
   */
  listAvailableModels: function(apiKey) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const response = UrlFetchApp.fetch(url, { "muteHttpExceptions": true });
    return response.getContentText();
  }
};
