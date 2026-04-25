// GeminiClient.js
// 負責與 Google Gemini API 溝通的模組 (Module C)

const GeminiClient = {
  /**
   * 呼叫 Gemini API
   * @param {string} apiKey - User 提供的 API Key
   * @param {string} systemInstruction - 系統提示詞 (System Prompt)
   * @param {string} userPrompt - 任務提示詞
   * @param {boolean} useFlash - 是否使用速度較快的 Flash 模型 (預設為 true，因為 JSON 輸出不複雜)
   * @returns {Object} JSON 解析後的結果
   */
  callApi: function(apiKey, systemInstruction, userPrompt, useFlash = true) {
    let attempts = 0;
    const maxAttempts = 3;
    let lastError = null;
    
    // 優先從資料庫讀取模型設定
    const configKey = useFlash ? "GEMINI_FLASH_MODEL" : "GEMINI_PRO_MODEL";
    let modelName = Database.getSystemConfig(configKey, CONFIG.DEFAULT_MODEL);

    while (attempts < maxAttempts) {
      try {
        // 如果是第二次嘗試，切換到備用模型
        if (attempts === 1) {
          modelName = CONFIG.FALLBACK_MODEL;
          console.warn(`第 ${attempts + 1} 次嘗試：切換至備用模型 ${modelName}`);
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
        const responseCode = response.getResponseCode();
        const responseBody = response.getContentText();
        
        if (responseCode !== 200) {
          throw new Error(`API Error ${responseCode}: ${responseBody}`);
        }
        
        const jsonResponse = JSON.parse(responseBody);
        if (!jsonResponse.candidates || jsonResponse.candidates.length === 0) {
          throw new Error("No candidates returned.");
        }

        let textContent = jsonResponse.candidates[0].content.parts[0].text;
        
        // --- 預處理 ---
        textContent = textContent.replace(/```json/g, "").replace(/```/g, "").trim();
        textContent = textContent.replace(/[\uff01-\uff5e]/g, function(ch) {
          return String.fromCharCode(ch.charCodeAt(0) - 0xfee0);
        }).replace(/\u3000/g, " ");
        
        return JSON.parse(textContent); 

      } catch (error) {
        attempts++;
        lastError = error;
        console.error(`第 ${attempts} 次嘗試失敗:`, error.toString());
        
        if (attempts < maxAttempts) {
          // 等待時間隨次數增加 (1.5s, 3s)
          Utilities.sleep(attempts * 1500); 
        }
      }
    }
    
    // 如果走到這，代表三次都失敗
    throw new Error(`AI 導師目前太忙碌 (已嘗試 3 次)，請稍後再試。最後一次錯誤: ${lastError.message}`);
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
