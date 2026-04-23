# User Sheet UI Spec

## 1. Settings & Summary Tab (Home)
這是使用者開啟 Google Sheet 的第一個固定畫面 (MVP 階段不限制過往 tab 的顯示，可集中在此做總覽)。

*   **User Info**: 顯示 User Name, User Email。
*   **API Key Setup**: 包含 API Key 輸入框與 `[Validate & Save]` 按鈕。點擊後透過 GAS 呼叫後端 `/register-key` 進行驗證，若成功才隱藏寫入 User Properties。
*   **Configuration**: Difficulty dropdown (難度選擇), Domain dropdown (領域選擇)。
*   **Action**: `[Generate Question]` 按鈕。
*   **Historical Result Summary Table**: 統整列出所有歷史答題記錄、成績與對應的 Tab 快速連結。

## 2. Question Tabs (Unlimited)
每次點擊 Generate 後，系統自動在 User Sheet 中新增的獨立 Tab。歷史 tabs 不受數量限制。

*   **Layout Structure**:
    *   **Question Block**: 顯示 Title, Instruction。
    *   **Sample Data Block**: 顯示資料區塊供使用者判讀。
    *   **Answer Block**: 使用者填寫回答的文字區塊 (例如統一在 B20)。
    *   **Action**: `[Submit Answer]` 按鈕。
    *   **Detailed Feedback Block**: 提交回答後，後端回傳的結果會顯示於此。包含各維度分數 (Structure, Clarity, Logic, Judgment)、總分，以及條列式的 Feedback Comment。
*   **URL Handling**: 
    *   在產生 Tab 後或按下 Submit 時，GAS Thin Client 需獲取當前 Tab 的專屬 URL (例如結尾為 `#gid=12345`)。
    *   透過 API 將此 `question_tab_url` 傳給後端，以便寫入 Database 中，方便 Trainer 或 Admin 直接點擊該連結查看原始答題情況。
