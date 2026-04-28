/**
 * Router.js
 * 負責處理 HTTP GET 請求 (可用於測試 Endpoint 是否存活)
 */
function doGet(e) {
  return ContentService.createTextOutput("Data Judgment Training Platform - Backend API is running.")
    .setMimeType(ContentService.MimeType.TEXT);
}

// 產生唯一的 ID 工具
function generateId(prefix) {
  return prefix + "_" + new Date().getTime() + "_" + Math.floor(Math.random() * 1000);
}

/**
 * 處理 HTTP POST 請求 (主要 API 接口)
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("Empty POST data received.");
    }
    const postData = JSON.parse(e.postData.contents);
    const action = postData.action;
    
    // 允許前端帶入 API Key，如果沒帶就用環境變數的 (測試用)
    const apiKey = postData.apiKey || CONFIG.GEMINI_API_KEY; 
    const userEmail = postData.userEmail || "anonymous@example.com";

    let responseData = {};

    switch(action) {
      case "register-key":
        // 驗證 API Key 的邏輯可後續實作，目前先回傳成功
        responseData = { status: "success", message: "API Key Validate - Mocked Success" };
        break;
        
      case "generate-question": {
        Database.validateUserAccess(postData);
        
        const { domain, difficulty } = postData;
        const prompts = PromptBuilder.buildGenerationPrompt(domain, difficulty);
        const aiResult = GeminiClient.callApi(apiKey, prompts.systemInstruction, prompts.userPrompt, false, { user_email: userEmail, action: 'generate-question' });
        
        const questionId = generateId("Q");
        const dbRecord = {
          question_id: questionId,
          user_email: userEmail,
          difficulty: difficulty,
          domain: domain,
          prompt_version: prompts.promptVersion || "v1.0",
          title: aiResult.title,
          business_context: aiResult.business_context,
          instruction: aiResult.instruction,
          sample_data: aiResult.sample_data,
          expected_health_check_answers: aiResult.expected_health_check_answers,
          question_tab_url: postData.question_tab_url || '',
          cleaned_data_template: aiResult.cleaned_data_template || null
        };
        Database.saveQuestion(dbRecord);
        Database.saveAuditLog({ user_email: userEmail, action_type: "generate-question", related_id: questionId, status: "success" });
        
        responseData = { status: "success", question_id: questionId, data: aiResult };
        break;
      }
      
      case "submit-response": {
        Database.validateUserAccess(postData);
        
        const { question_id, user_health_check_sop, user_cleaned_data } = postData;
        
        const questionRecord = Database.getQuestionData(question_id);
        if (!questionRecord) throw new Error("Question not found: " + question_id);
        
        const responseId = generateId("R");
        Database.saveResponse({
          response_id: responseId,
          question_id: question_id,
          user_email: userEmail,
          user_health_check_sop: user_health_check_sop,
          user_cleaned_data: user_cleaned_data
        });
        
        const prompts = PromptBuilder.buildEvaluationPrompt(
          questionRecord.business_context, 
          questionRecord.expected_health_check_answers, 
          user_health_check_sop, 
          user_cleaned_data
        );
        const aiScore = GeminiClient.callApi(apiKey, prompts.systemInstruction, prompts.userPrompt, false, { user_email: userEmail, action: 'evaluate-response' });
        
        const scoreId = generateId("S");
        Database.saveScore({
          score_id: scoreId,
          question_id: question_id,
          response_id: responseId,
          user_email: userEmail,
          overall_score: aiScore.overall_score,
          format_score: aiScore.format_score,
          business_logic_score: aiScore.business_logic_score,
          strategy_score: aiScore.strategy_score,
          completeness_score: aiScore.completeness_score,
          evaluator_version: prompts.promptVersion || "v1.0",
          feedback_comment: aiScore.feedback_comment
        });
        Database.saveAuditLog({ user_email: userEmail, action_type: "submit-response", related_id: responseId, status: "success" });

        // Attach standard_answers from question record if evaluation prompt didn't return it
        if (!aiScore.standard_answers) {
          const rawAnswers = questionRecord.expected_health_check_answers;
          if (rawAnswers) {
            try {
              const parsed = JSON.parse(rawAnswers);
              if (Array.isArray(parsed)) {
                aiScore.standard_answers = parsed.map(function(item, i) {
                  return (i + 1) + '. ' + (typeof item === 'object' ? JSON.stringify(item, null, 2) : String(item));
                }).join('\n');
              } else if (typeof parsed === 'object') {
                aiScore.standard_answers = JSON.stringify(parsed, null, 2);
              } else {
                aiScore.standard_answers = String(parsed);
              }
            } catch(e) {
              aiScore.standard_answers = String(rawAnswers);
            }
          }
        }

        // Attach cleaned_data_template stored at question-generation time
        if (!aiScore.cleaned_data_template) {
          const rawTemplate = questionRecord.cleaned_data_template;
          if (rawTemplate && rawTemplate !== 'null') {
            try {
              const parsed = JSON.parse(rawTemplate);
              aiScore.cleaned_data_template = Array.isArray(parsed) || typeof parsed === 'object'
                ? JSON.stringify(parsed, null, 2)
                : String(parsed);
            } catch(e) {
              aiScore.cleaned_data_template = String(rawTemplate);
            }
          }
        }

        responseData = { status: "success", score: aiScore };
        break;
      }
      
      default:
        responseData = { status: "error", message: "Unknown action: " + action };
    }

    return ContentService.createTextOutput(JSON.stringify(responseData))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    let email = "unknown";
    let act = "unknown";
    try {
      if (e && e.postData && e.postData.contents) {
        const pd = JSON.parse(e.postData.contents);
        email = pd.userEmail || email;
        act = pd.action || act;
      }
    } catch(err) {}
    
    Database.saveAuditLog({ 
      user_email: email, 
      action_type: act, 
      status: "error", 
      error_message: error.toString() 
    });

    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
