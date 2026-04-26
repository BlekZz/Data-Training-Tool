// PromptBuilder.js
// 負責建構丟給 Gemini 的 Prompt (Module B)

const PromptBuilder = {
  
  buildGenerationPrompt: function(domain, difficulty) {
    const promptData = Database.getActivePrompt('generation');
    let userPrompt = promptData.user_prompt_template
      .replace(/\$\{domain\}/g, domain)
      .replace(/\$\{difficulty\}/g, difficulty);

    return { 
      systemInstruction: promptData.system_instruction, 
      userPrompt: userPrompt,
      promptVersion: promptData.prompt_id
    };
  },

  buildEvaluationPrompt: function(questionContext, expectedAnswers, userSop, userCleanedData) {
    const promptData = Database.getActivePrompt('evaluation');
    let userPrompt = promptData.user_prompt_template
      .replace(/\$\{questionContext\}/g, questionContext)
      .replace(/\$\{expectedAnswers\}/g, typeof expectedAnswers === 'string' ? expectedAnswers : JSON.stringify(expectedAnswers))
      .replace(/\$\{userSop\}/g, typeof userSop === 'string' ? userSop : JSON.stringify(userSop))
      .replace(/\$\{userCleanedData\}/g, typeof userCleanedData === 'string' ? userCleanedData : JSON.stringify(userCleanedData));

    return { 
      systemInstruction: promptData.system_instruction, 
      userPrompt: userPrompt,
      promptVersion: promptData.prompt_id
    };
  }
};
