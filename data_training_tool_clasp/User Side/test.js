function debug_Network() {
  const token = ScriptApp.getOAuthToken();
  Logger.log("Token 長度: " + token.length); // 如果長度很短代表 Token 沒抓到
  
  const options = {
    method: "get", // 先用簡單的 GET 測試
    headers: { "Authorization": "Bearer " + token },
    muteHttpExceptions: true,
    followRedirects: true
  };
  
  const response = UrlFetchApp.fetch(BACKEND_URL, options);
  Logger.log("HTTP 狀態碼: " + response.getResponseCode());
  Logger.log("內容前 200 字: " + response.getContentText().substring(0, 200));
}
