# Prompt Spec

## 1. Generation Prompt

**Inputs:**
*   `domain`
*   `difficulty`
*   `user_level_rules`
*   `prompt_version`

**Goal:** 根據領域與難度生成題目、指示與假資料。

**Output Format (Strict JSON):**
```json
{
  "title": "...",
  "instruction": "...",
  "sample_data": "...",
  "internal_expected_patterns": ["...", "..."],
  "internal_notes": "..."
}
```

## 2. Evaluation Prompt

**Inputs:**
*   `question_title`
*   `question_instruction`
*   `sample_data_snapshot`
*   `user_response`
*   `rubric_definition`

**Rubric Dimensions (0-5 scale):**
1.  **Structure** (結構)
2.  **Clarity** (清晰度)
3.  **Logic** (邏輯)
4.  **Judgment** (資料判斷力)

**Feedback Comment Rules:**
1.  **字數限制**: 嚴格限制在 100 字以內。
2.  **格式**: 條列式 (Bullet points)。
3.  **內容精簡**: 僅針對需要改善或特別優秀的地方說明。**分數已經代表的意義不需要重複贅述** (例如：不需要說「因為你的邏輯很好所以給你5分」，而是直接點出「精準識別出異常數據點的關聯性」)。

**Output Format (Strict JSON):**
```json
{
  "structure_score": 4,
  "clarity_score": 5,
  "logic_score": 3,
  "judgment_score": 4,
  "overall_score": 16,
  "feedback_comment": "- 結構清晰，易於閱讀。\n- 邏輯推演缺少對時間欄位的驗證。\n- 判斷方向正確，但未涵蓋邊緣案例。"
}
```
