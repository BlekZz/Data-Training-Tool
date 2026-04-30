/**
 * UserClient.gs
 * 請將此段程式碼貼在「使用者 (實習生)」的 Google Sheet Apps Script 中
 */

const CLIENT_VERSION = "1.1.0";

// ============================================================
// 1. 設定區：請修改下方的 Web App URL
// ============================================================
const BACKEND_URL = "https://script.google.com/macros/s/AKfycbyok8J_IT4GGtaIPG9XEcBpI_WOCeF5AN9-w-idnp5HHYZojXc1goee14zRi1AZSpXhag/exec";

/**
 * Inserts newlines before numbered list items and emoji bullets so AI output
 * renders as proper line-broken text in Google Sheets cells (wrap must be on).
 */
function formatDisplayText(text) {
  if (!text) return text;
  text = String(text);

  // Newline before numbered items mid-text: "...text 1. item" → "...text\n1. item"
  text = text.replace(/([^\n]) +(\d+[\.、]\s)/g, '$1\n$2');

  // Newline before BMP emoji bullets (U+2600–U+27BF)
  text = text.replace(/([^\n]) +([☀-➿])/g, '$1\n$2');
  // Supplemental emoji via surrogate pairs (covers most of U+1F300–U+1FBFF)
  text = text.replace(/([^\n]) +(\uD83C[\uDF00-\uDFFF])/g, '$1\n$2');
  text = text.replace(/([^\n]) +(\uD83D[\uDC00-\uDFFF])/g, '$1\n$2');
  text = text.replace(/([^\n]) +(\uD83E[\uDD00-\uDFFF])/g, '$1\n$2');

  // Collapse 3+ newlines to max 2
  text = text.replace(/\n{3,}/g, '\n\n');

  return text.trim();
}

/**
 * 當 Google Sheet 開啟時自動執行
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🚀 數據判斷訓練')
    .addItem('1. 初始化 Home 頁面', 'setupHomePage')
    .addSeparator()
    .addItem('2. 生成新題目', 'generateNewQuestion')
    .addItem('3. 提交本題回答', 'submitCurrentResponse')
    .addToUi();
}

/**
 * 建立 Home 頁面的 UI 結構
 */
function setupHomePage() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Home');
  if (!sheet) {
    sheet = ss.insertSheet('Home', 0);
  }
  
  sheet.clear();
  sheet.getRange('A1:C1').setValues([['數據判斷訓練平台', '', '']])
       .setBackground('#4A90D9').setFontColor('#FFFFFF').setFontWeight('bold');
  
  const detectedEmail = Session.getActiveUser().getEmail();
  sheet.getRange('A3:B3').setValues([['User Email', detectedEmail || '← 請在此填入你的 Google 帳號 Email']]);
  sheet.getRange('A4:B4').setValues([['Gemini API Key', '在此貼上你的 API Key']]);
  sheet.getRange('A5:B5').setValues([['產業領域', '電商與零售 (E-commerce / Retail)']]);
  sheet.getRange('A6:B6').setValues([['難度等級', 'Level 1']]);
  
  // 設定下拉選單 (難度)
  const difficultyRule = SpreadsheetApp.newDataValidation().requireValueInList(['Level 1', 'Level 2', 'Level 3']).build();
  sheet.getRange('B6').setDataValidation(difficultyRule);
  
  // 設定下拉選單 (領域)
  const domains = ['電商與零售 (E-commerce / Retail)', '金融與支付 (FinTech / Banking)', '醫療與健康照護 (Healthcare)', '行銷與 CRM (Marketing / CRM)'];
  const domainRule = SpreadsheetApp.newDataValidation().requireValueInList(domains).build();
  sheet.getRange('B5').setDataValidation(domainRule);
  
  sheet.getRange('A8').setValue('💡 設定完成後，請點選選單中的「2. 生成新題目」開始訓練。').setFontStyle('italic');
  
  sheet.setColumnWidth(1, 150);
  sheet.setColumnWidth(2, 400);
  
  SpreadsheetApp.getUi().alert('✅ Home 頁面初始化完成！請在 B4 儲存格貼上你的 API Key 並選擇難度。');
}

/**
 * 2. 生成新題目 (入口：僅開啟彈窗)
 */
function generateNewQuestion() {
  const ui = SpreadsheetApp.getUi();
  const html = HtmlService.createHtmlOutputFromFile('LoadingDialog')
      .setWidth(420)
      .setHeight(300);
  ui.showModalDialog(html, 'AI 題庫生成中...');
}

/**
 * 【核心總控】供彈窗呼叫：執行完整生成流程 (Fetch -> DB -> Render)
 * 這樣可以避免資料在前後端之間傳遞導致的崩潰
 */
function performFullGeneration() {
  try {
    // 1. 抓取資料
    const result = runGenerationLogic();
    if (result.status !== "success") {
      return { status: "error", message: result.message };
    }

    // 2. 渲染分頁 (內含寫入 Z1 隱藏格)
    renderQuestionTab(result.question_id, result.data);
    
    return { status: "success" };
  } catch (e) {
    return { status: "error", message: e.toString() };
  }
}


/**
 * 真正的後端生成邏輯
 */
function runGenerationLogic() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const home = ss.getSheetByName('Home');
  if (!home) throw new Error("找不到 Home 頁面");
  
  const apiKey = String(home.getRange('B4').getValue()).trim();
  const domain = home.getRange('B5').getValue();
  const difficulty = home.getRange('B6').getValue();
  const userEmail = String(home.getRange('B3').getValue()).trim();

  // Pre-flight validation — fail fast before hitting the backend
  if (!userEmail || userEmail.startsWith('←')) {
    throw new Error("請在 Home 頁面 B3 儲存格填入你的 Google 帳號 Email，再重新生成。");
  }
  if (!apiKey || apiKey === '在此貼上你的 API Key' || apiKey === '') {
    throw new Error("請在 Home 頁面 B4 儲存格貼上你的 Gemini API Key，再重新生成。");
  }

  const payload = {
    action: "generate-question",
    apiKey: apiKey,
    userEmail: userEmail,
    domain: domain,
    difficulty: difficulty,
    userSheetId: ss.getId(),
    userSheetUrl: ss.getUrl()
  };

  const options = {
    method: "post",
    contentType: "application/json",
    headers: { "Authorization": "Bearer " + ScriptApp.getOAuthToken() },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(BACKEND_URL, options);
  const responseText = response.getContentText();
  return JSON.parse(responseText);
}


/**
 * 渲染題目分頁 (完整版：固定錨點 + 顏色標記 + 防禦性解析)
 */
function renderQuestionTab(questionId, data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const tabName = 'Q_' + questionId.split('_').pop();
  const sheet = ss.insertSheet(tabName);
  const HIDDEN = '#FFFFFF';

  // === 先把 question_id 存好 (最優先，確保 Z1 一定寫入) ===
  sheet.getRange('Z1').setValue(questionId).setFontColor(HIDDEN);

  // === 區塊 1: 題目標題 ===
  sheet.getRange('A1:H1').merge()
    .setValue(data.title || '（無標題）')
    .setBackground('#2E5FA3').setFontColor('#FFFFFF')
    .setFontWeight('bold').setFontSize(13);

  // === 區塊 2: 任務情境 ===
  const ctx = formatDisplayText(data.business_context || data.business_Context || '（無情境）');
  sheet.getRange('A2:H5').merge()
    .setValue('【任務情境】\n' + ctx)
    .setBackground('#EBF3FB').setWrap(true).setVerticalAlignment('top');
  sheet.setRowHeight(2, 20); sheet.setRowHeight(3, 20);
  sheet.setRowHeight(4, 20); sheet.setRowHeight(5, 20);

  // === 區塊 3: 操作指示 ===
  sheet.getRange('A6:H6').merge()
    .setValue('📄 ' + (data.instruction || '請找出資料中的所有異常。'))
    .setBackground('#F8F9FA').setFontStyle('italic');

  // === 區塊 4: Sample Data ===
  const dataHeaderRow = 7;

  // 防禦性解析：Gemini 有時回傳 JSON 字串而非 Array
  let sampleData = data.sample_data;
  if (typeof sampleData === 'string') {
    try { 
      sampleData = JSON.parse(sampleData); 
    } catch (e) { 
      sampleData = []; 
    }
  }

  let dataRowCount = 0;
  if (Array.isArray(sampleData) && sampleData.length > 0) {
    const headers = Object.keys(sampleData[0]);
    const values  = sampleData.map(r => headers.map(h => r[h] !== undefined ? r[h] : ''));
    dataRowCount  = values.length;

    sheet.getRange(dataHeaderRow, 1, 1, headers.length)
      .setValues([headers])
      .setBackground('#CFE2FF').setFontWeight('bold');
    sheet.getRange(dataHeaderRow + 1, 1, dataRowCount, headers.length)
      .setValues(values);
  } else {
    sheet.getRange(dataHeaderRow, 1).setValue('⚠️ sample_data 解析失敗，請查看後端 Log。')
      .setFontColor('#CC0000');
    dataRowCount = 1;
  }

  // === 區塊 5: 健檢 SOP (步驟一) ===
  const SOP_INPUT_ROWS = 7;
  const sopLabelRow = dataHeaderRow + dataRowCount + 2;
  const sopHeadRow  = sopLabelRow + 1;
  const sopDataRow  = sopHeadRow  + 1;
  const sopEndRow   = sopDataRow  + SOP_INPUT_ROWS - 1;

  sheet.getRange(sopLabelRow, 1, 1, 8).merge()
    .setValue('🧠 步驟一：健檢診斷 SOP（填寫你發現的每一個地雷）')
    .setBackground('#4A4A8A').setFontColor('#FFFFFF').setFontWeight('bold');

  sheet.getRange(sopHeadRow, 1, 1, 4)
    .setValues([['異常欄位', '錯誤類型', '處置策略', '詳細說明']])
    .setBackground('#DEDEFA').setFontWeight('bold');

  // 輸入區：淡黃色
  sheet.getRange(sopDataRow, 1, SOP_INPUT_ROWS, 4)
    .setBackground('#FFFDE7')
    .setBorder(true, true, true, true, true, true, '#BDBDBD', SpreadsheetApp.BorderStyle.SOLID);

  // 下拉選單
  const errRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['基礎格式錯誤', '商業邏輯地雷', '遺失值', '數值異常', '時間序列錯誤', '其他']).build();
  sheet.getRange(sopDataRow, 2, SOP_INPUT_ROWS, 1).setDataValidation(errRule);

  const strRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['刪除', '填補預設值', '標記待處理', '保留並註釋']).build();
  sheet.getRange(sopDataRow, 3, SOP_INPUT_ROWS, 1).setDataValidation(strRule);

  // === 區塊 6: 清洗後資料 (步驟二) ===
  const CLEAN_INPUT_ROWS = 20;
  const cleanLabelRow = sopEndRow + 2;
  const cleanTitleRow = cleanLabelRow + 1;
  const cleanDataRow  = cleanTitleRow + 1;
  const cleanEndRow   = cleanDataRow + CLEAN_INPUT_ROWS - 1;

  sheet.getRange(cleanLabelRow, 1, 1, 8).merge()
    .setValue('✨ 步驟二：清洗後資料（在下方填寫欄位標題，然後貼上清洗後的資料）')
    .setBackground('#2E7D32').setFontColor('#FFFFFF').setFontWeight('bold');

  sheet.getRange(cleanTitleRow, 1, 1, 8)
    .setBackground('#C8E6C9')
    .setBorder(true, true, true, true, false, false, '#A5D6A7', SpreadsheetApp.BorderStyle.SOLID);
  sheet.getRange(cleanTitleRow, 1).setValue('← 在此列填寫欄位標題').setFontStyle('italic').setFontColor('#555555');

  // 輸入區：淡綠色
  sheet.getRange(cleanDataRow, 1, CLEAN_INPUT_ROWS, 8)
    .setBackground('#F1F8E9')
    .setBorder(true, true, true, true, false, false, '#A5D6A7', SpreadsheetApp.BorderStyle.SOLID);

  // === 儲存錨點座標到隱藏格 Z 欄 ===
  sheet.getRange('Z2').setValue(sopDataRow).setFontColor(HIDDEN);
  sheet.getRange('Z3').setValue(sopEndRow).setFontColor(HIDDEN);
  sheet.getRange('Z4').setValue(cleanTitleRow).setFontColor(HIDDEN);
  sheet.getRange('Z5').setValue(cleanEndRow).setFontColor(HIDDEN);

  // === 欄寬整理 ===
  sheet.setColumnWidth(1, 140);
  sheet.setColumnWidth(2, 160);
  sheet.setColumnWidth(3, 130);
  sheet.setColumnWidth(4, 260);
  sheet.setFrozenRows(1);
  sheet.activate();

}

// ============================================================
// 輔助函式：根據文字內容找到所在列號 (1-indexed)
// ============================================================
function findRowByText(sheet, searchText) {
  const lastRow = sheet.getLastRow();
  // 只搜尋 A 欄，避免掃描整個表格浪費時間
  const range = sheet.getRange(1, 1, lastRow, 1);
  const values = range.getValues();
  for (let i = 0; i < values.length; i++) {
    if (String(values[i][0]).includes(searchText)) {
      return i + 1; // 轉回 1-indexed
    }
  }
  return -1; // 未找到
}

// ============================================================
// 輔助函式：渲染 AI 評分結果到 Question Tab
// ============================================================
function renderFeedback(sheet, score) {
  // 動態尋找是否已有舊的評分區塊
  let startRow = findRowByText(sheet, '📊 AI 盲區雷達診斷');
  
  if (startRow !== -1) {
    // 清除舊的評分區塊 (從 startRow 往下清空)
    const lastRow = sheet.getLastRow();
    if (lastRow >= startRow) {
      const oldRange = sheet.getRange(startRow, 1, lastRow - startRow + 1, sheet.getLastColumn());
      oldRange.breakApart(); // 解除合併儲存格
      oldRange.clear();      // 清除內容、顏色、格式
      // 將列高恢復預設
      for (let r = startRow; r <= lastRow; r++) {
        sheet.setRowHeight(r, 21);
      }
    }
  } else {
    // 第一次提交，接在最後一列的下方
    startRow = sheet.getLastRow() + 2;
  }

  // 標題
  sheet.getRange(startRow, 1, 1, 6).merge()
    .setValue('📊 AI 盲區雷達診斷')
    .setBackground('#4A4A8A')
    .setFontColor('#FFFFFF')
    .setFontWeight('bold')
    .setFontSize(12);

  // 分數表格標題
  const headers = ['基礎格式敏感度', '商業邏輯判斷', '處置策略', '清洗完整度', '總分'];
  const scores  = [score.format_score, score.business_logic_score, score.strategy_score, score.completeness_score, score.overall_score];
  const maxes   = [5, 5, 5, 5, 20];

  sheet.getRange(startRow + 1, 1, 1, 5).setValues([headers])
    .setBackground('#E8E8F5').setFontWeight('bold');
  sheet.getRange(startRow + 2, 1, 1, 5).setValues(
    [scores.map((s, i) => `${s} / ${maxes[i]}`)]  
  ).setHorizontalAlignment('center');

  // 評語
  sheet.getRange(startRow + 4, 1, 1, 6).merge()
    .setValue(formatDisplayText(score.feedback_comment))
    .setWrap(true)
    .setBackground('#F3F4FF')
    .setVerticalAlignment('top');
  sheet.setRowHeight(startRow + 4, 120);

  // === 新增：標準答案與清洗範本 ===
  const stdStart = startRow + 6;
  sheet.getRange(stdStart, 1, 1, 6).merge()
    .setValue('✅ 標準健檢解答')
    .setBackground('#4A4A8A').setFontColor('#FFFFFF').setFontWeight('bold');
  sheet.getRange(stdStart + 1, 1, 1, 6).merge()
    .setValue(formatDisplayText(score.standard_answers) || '（無提供資料）')
    .setWrap(true).setBackground('#F8F9FA').setVerticalAlignment('top');
  sheet.setRowHeight(stdStart + 1, 120);

  sheet.getRange(stdStart + 3, 1, 1, 6).merge()
    .setValue('📄 清洗數據範本')
    .setBackground('#4A4A8A').setFontColor('#FFFFFF').setFontWeight('bold');
  sheet.getRange(stdStart + 4, 1, 1, 6).merge()
    .setValue(formatDisplayText(score.cleaned_data_template) || '（無提供資料）')
    .setWrap(true).setBackground('#F8F9FA').setVerticalAlignment('top');
  sheet.setRowHeight(stdStart + 4, 100);

  // 自動捲動到結果
  sheet.setActiveRange(sheet.getRange(startRow, 1));
}

/**
 * 3. 提交本題回答至後端
 */
function submitCurrentResponse() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet();
  const questionId = sheet.getRange('Z1').getValue();

  if (!questionId || !questionId.startsWith('Q_')) {
    return SpreadsheetApp.getUi().alert('⚠️ 請先切換到題目分頁（Q_開頭的 Tab），再執行提交。');
  }

  const home = ss.getSheetByName('Home');
  if (!home) return SpreadsheetApp.getUi().alert('⚠️ 找不到 Home 頁面，請先初始化。');

  const apiKey    = home.getRange('B4').getValue();
  const userEmail = home.getRange('B3').getValue();

  if (!apiKey || apiKey === '在此貼上你的 API Key') {
    return SpreadsheetApp.getUi().alert('⚠️ 請先在 Home 頁面填寫 API Key。');
  }

  // --- Step 1: 動態定位 SOP 區塊 ---
  const sopLabelRow = findRowByText(sheet, '🧠 步驟一：健檢診斷 SOP');
  const cleanLabelRow = findRowByText(sheet, '✨ 步驟二：清洗後資料');
  
  if (sopLabelRow === -1 || cleanLabelRow === -1) {
    return SpreadsheetApp.getUi().alert('⚠️ 找不到 SOP 或清洗資料區塊的標題，請確認格式是否被破壞。');
  }

  const sopDataRow = sopLabelRow + 2;
  const sopEndRow  = cleanLabelRow - 2; // 推算 SOP 結束列

  if (!sopDataRow || !sopEndRow) {
    return SpreadsheetApp.getUi().alert('\u26a0\ufe0f \u7121\u6cd5\u8b80\u53d6\u984c\u76ee\u7d50\u69cb\u8cc7\u8a0a\uff0c\u8acb\u78ba\u8a8d\u4f7f\u7528\u7684\u662f\u7cfb\u7d71\u7522\u751f\u7684\u984c\u76ee\u5206\u9801\u3002');
  }

  const SOP_ROWS    = sopEndRow - sopDataRow + 1;
  const sopRawData  = sheet.getRange(sopDataRow, 1, SOP_ROWS, 4).getValues();
  const userHealthCheckSop = sopRawData
    .filter(row => row.some(cell => String(cell).trim() !== ''))
    .map(row => ({
      field:      String(row[0]).trim(),
      error_type: String(row[1]).trim(),
      strategy:   String(row[2]).trim(),
      note:       String(row[3]).trim()
    }));

  if (userHealthCheckSop.length === 0) {
    return SpreadsheetApp.getUi().alert('\u26a0\ufe0f \u6b65\u9a5f\u4e00\u7684\u5065\u6aa2 SOP \u8868\u683c\u662f\u7a7a\u7684\uff0c\u8acb\u81f3\u5c11\u586b\u5beb\u4e00\u7b46\u8a3a\u65b7\u8a18\u9304\u3002');
  }

  // --- Step 2: 動態定位清洗區塊 ---
  const cleanTitleRow = cleanLabelRow + 1;
  let cleanEndRow = findRowByText(sheet, '📊 AI 盲區雷達診斷');
  if (cleanEndRow !== -1) {
    cleanEndRow = cleanEndRow - 2;
  } else {
    cleanEndRow = sheet.getLastRow();
  }

  if (!cleanTitleRow || !cleanEndRow) {
    return SpreadsheetApp.getUi().alert('⚠️ 無法讀取清洗區座標，請確認使用的是系統產生的題目分頁。');
  }

  const colCount    = sheet.getLastColumn();
  const titleValues = sheet.getRange(cleanTitleRow, 1, 1, colCount).getValues()[0];
  
  // 反向尋找最後一個有文字的標題，確保中間即使有空白欄位也能正確框出範圍
  let usedCols = 0;
  for (let i = titleValues.length - 1; i >= 0; i--) {
    if (String(titleValues[i]).trim() !== '') {
      usedCols = i + 1;
      break;
    }
  }

  // 如果這行沒寫標題就直接防呆退出
  if (usedCols === 0) {
    return SpreadsheetApp.getUi().alert('⚠️ 請在步驟二的淡綠色區塊輸入你要留下的「欄位標題」。');
  }

  // 把前 usedCols 欄保留下來（包含中間的空字串），確保資料對齊
  const cleanCols = titleValues.slice(0, usedCols).map(h => String(h).trim());

  let userCleanedData = [];
  if (usedCols > 0) {
    const CLEAN_ROWS  = cleanEndRow - cleanTitleRow; // 不含標題列
    const dataRows    = sheet.getRange(cleanTitleRow + 1, 1, CLEAN_ROWS, usedCols).getValues();
    userCleanedData   = dataRows
      .filter(row => row.some(cell => String(cell).trim() !== ''))
      .map(row => {
        let obj = {};
        cleanCols.forEach((h, i) => { obj[h] = row[i]; });
        return obj;
      });
  }

  // --- Step 3: 顯示載入動畫並提交 ---
  const ui = SpreadsheetApp.getUi();
  const confirm = ui.alert(
    '提交確認',
    `將提交以下內容給 AI 評分：\n\n• 健檢 SOP：${userHealthCheckSop.length} 筆診斷記錄\n• 清洗後資料：${userCleanedData.length} 筆\n\n確定提交？`,
    ui.ButtonSet.OK_CANCEL
  );

  if (confirm !== ui.Button.OK) return;

  const payload = {
    action: 'submit-response',
    apiKey: apiKey,
    userEmail: userEmail,
    question_id: questionId,
    user_health_check_sop: userHealthCheckSop,
    user_cleaned_data: userCleanedData,
    userSheetId: ss.getId(),
    userSheetUrl: ss.getUrl()
  };

  // --- Step 3: 開啟評分彈窗 (由彈窗腳本執行 POST) ---
  const html = HtmlService.createHtmlOutputFromFile('SubmitLoadingDialog')
      .setWidth(420)
      .setHeight(300);
  
  // 將資料暫存到全域，供彈窗讀取（或直接傳遞）
  // 這裡使用簡單的 JSON 傳遞方式
  html.append('<script>var payload = ' + JSON.stringify(payload) + ';</script>');
  
  ui.showModalDialog(html, 'AI 評分中...');
}

/**
 * 完整提交流程：負責執行 fetch 並跳出 UI 回饋，確保彈窗不會提早關閉
 */
function performFullSubmit(payload) {
  try {
    const result = runSubmitLogic(payload);
    if (result.status === 'success') {
      handleSubmitSuccess(result);
    }
    return result;
  } catch (e) {
    return { status: 'error', message: e.toString() };
  }
}

/**
 * 供 SubmitLoadingDialog 呼叫的後台執行函式
 */
function runSubmitLogic(payload) {
  const options = {
    method:          'post',
    contentType:     'application/json',
    headers:         { 'Authorization': 'Bearer ' + ScriptApp.getOAuthToken() },
    payload:         JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response     = UrlFetchApp.fetch(BACKEND_URL, options);
  const responseText = response.getContentText();
  return JSON.parse(responseText);
}

/**
 * 成功回傳後的處理
 */
function handleSubmitSuccess(result) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet();

  renderFeedback(sheet, result.score);

  try {
    const home = ss.getSheetByName('Home');
    if (home) {
      const domain = home.getRange('B5').getValue();
      const difficulty = home.getRange('B6').getValue();
      const date = new Date().toLocaleString();
      const totalScore = result.score.overall_score + ' / 20';
      const feedback = formatDisplayText(result.score.feedback_comment);

      const historyStartRow = 10;
      if (home.getRange(historyStartRow, 1).getValue() !== '做題日期') {
        home.getRange(historyStartRow, 1, 1, 5)
          .setValues([['做題日期', '產業領域', '難度', '總分', '文字診斷']])
          .setBackground('#E8E8F5').setFontWeight('bold');
        home.setColumnWidth(4, 80);
        home.setColumnWidth(5, 500);
      }
      home.insertRowAfter(historyStartRow);
      home.getRange(historyStartRow + 1, 1, 1, 5)
          .setValues([[date, domain, difficulty, totalScore, feedback]])
          .setWrap(true).setVerticalAlignment('top');
    }
  } catch(e) {
    console.warn("Failed to write to Home: " + e);
  }
}
