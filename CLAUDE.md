# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

AI-powered data quality training platform built entirely on Google ecosystem. Users work inside Google Sheets — no separate web app. They generate AI exercises, complete structured diagnostic forms, and receive dimension-based scores from Gemini.

---

## Commands

This project uses **Clasp** (Google Apps Script CLI). There is no `package.json` — clasp is invoked via `npx`.

```bash
# Push Backend changes
cd "data_training_tool_clasp/Backend Side"
npx clasp push --force

# Push User-side changes (single user)
cd "data_training_tool_clasp/User Side"
npx clasp push --force

# Push User-side changes to ALL managed users (global push)
pwsh scripts/push_all.ps1

# Authenticate (first-time or token expired)
npx clasp login
```

**Deployment Rule (from .cursorrules):** Whenever `.js` or `.html` files in `data_training_tool_clasp/` are modified, automatically run `npx clasp push --force` in the corresponding subdirectory — do not ask the user to do it manually. Notify after push.

**Critical:** `clasp push` only updates the GAS script editor. The live `/exec` Web App endpoint will NOT pick up changes until the user creates a new deployment version: GAS editor → Deploy → Manage deployments → Edit → New version → Deploy. Always remind the user to redeploy after a backend push. User Side changes do NOT require this redeploy step.

There is no test runner or linter. Manual testing is done via the live Google Sheet UI. Backend diagnostic functions exist in `TestRunner.js` (run directly in the GAS script editor).

---

## Architecture

**Pattern:** Thin distributed client → single centralized GAS backend → single central Google Sheet database.

```
User Google Sheet (copy per user, container-bound GAS)
    └── UserClient.js (UI, form logic, HTTP calls)
    └── LoadingDialog.html / SubmitLoadingDialog.html (modal UX)
            │  HTTP POST
            ▼
Central GAS Web App (one shared backend)
    └── Router.js → PromptBuilder.js → GeminiClient.js
            │  Read/Write
            ▼
Central Google Sheet (Database)
    Tabs: Users, Questions, Responses, Scores, PromptVersions, SystemConfig, AuditLog, ApiCallLog
            │  REST calls
            ▼
Google Gemini API (v1beta, primary: gemini-2.0-flash, fallback: gemini-2.5-flash)
```

### Key Source Files

| File | Role |
|------|------|
| `Backend Side/Router.js` | `doGet()` health-check + `doPost()` dispatcher — handles `register-key`, `generate-question`, and `submit-response` actions |
| `Backend Side/Config.js` | Database sheet ID, model names (`DEFAULT_MODEL`, `FALLBACK_MODEL`), API base URL |
| `Backend Side/GeminiClient.js` | Gemini REST wrapper — 3-tier retry (1st default model, 2nd+ fallback model), per-attempt `ApiCallLog` writes, full-width → half-width char normalization |
| `Backend Side/Database.js` | All Sheet CRUD — user validation, row append, lookup by column, auto-creates `AuditLog` and `ApiCallLog` if missing |
| `Backend Side/DatabaseSetup.js` | One-time setup + schema migration scripts |
| `Backend Side/PromptBuilder.js` | Reads active prompt from `PromptVersions` tab, injects domain/difficulty via template replacement |
| `Backend Side/TestRunner.js` | GAS-editor-only test/diagnostic functions: Gemini connection, E2E generation, DB write, model listing |
| `User Side/UserClient.js` | Full client logic — generates question tabs, renders SOP form, submits responses, renders feedback. Contains `formatDisplayText()`, `findRowByText()`, `renderFeedback()`. Declares `CLIENT_VERSION` |
| `User Side/LoadingDialog.html` | Modal dialog for question generation — shows loading animation, success instructions, or error state |
| `User Side/SubmitLoadingDialog.html` | Modal dialog for response submission — shows loading animation, score preview on success, or error state |
| `User Side/test.js` | `debug_Network()` — diagnostic function for testing Backend URL connectivity |

### Multi-User Push Infrastructure (v1.2)

| File | Role |
|------|------|
| `scripts/managed_users.json` | Registry of all managed User Side GAS script IDs for global push |
| `scripts/push_all.ps1` | PowerShell script — iterates `managed_users.json`, swaps `.clasp.json` scriptId per user, pushes, then restores original |
| `.claude/commands/push-users.md` | Claude Code slash command — non-interactive version of `push_all.ps1` (avoids `Read-Host` hang) |
| `.claude/commands/add-user.md` | Claude Code slash command — adds a new entry to `managed_users.json` |

### Critical Design Decisions

- **BYOK (Bring Your Own Key):** Users paste their Gemini API key into Home sheet cell B4. Keys are passed per-request — never persisted in the database.
- **Prompts-as-Data:** Generation and evaluation prompts live in the `PromptVersions` tab. The active prompt is the row where `is_active = TRUE`. Changes take effect immediately without redeployment.
- **Auto-registration:** Any user with an `@inboundmarketing.tw` email is automatically registered on first API call. Non-whitelisted users are rejected with a clear error message.
- **Email normalization:** `validateUserAccess()` normalizes all emails with `.trim().toLowerCase()` before comparison to prevent silent mismatch.
- **AuditLog & ApiCallLog auto-creation:** Both `saveAuditLog()` and `saveApiCallLog()` call `ensure*Sheet()` functions that create the tab if it doesn't exist. **Important:** `insertSheet` will throw if the sheet already exists with a different casing/spacing.
- **`cleaned_data_template` at generation time:** The cleaned/correct version of `sample_data` is generated by Gemini when the question is created and stored in the `Questions` tab. At submit time it is retrieved from the question record — not re-generated during evaluation.
- **Z-Column Hidden Anchors:** Question tabs store metadata in column Z using white font color. v1.3 introduced `__CLEAN_END__` as a robust text anchor that moves with user row insertions/deletions, avoiding brittle row-number dependencies.
- **Local Timezone Timestamps:** Backend writes to database using `Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss")` to avoid UTC offset issues in Google Sheets.
- **Server-Side Master:** Both generation and submission flows use a server-side orchestration pattern (`performFullGeneration()` / `performFullSubmit()`).
- **Client-Side Dialog UX (v1.2):** All user feedback is handled inside the modal dialog HTML.
- **Web App Deployment Trap:** `clasp push` only updates the GAS Editor's HEAD version. For the `/exec` URL to see backend changes, the user MUST manually "Manage Deployments -> Edit -> New Version". Creating a "New Deployment" changes the URL, breaking the frontend's hardcoded connection.

### Database Tabs

| Tab | Key columns |
|-----|-------------|
| `Users` | `user_id`, `user_email`, `user_name`, `user_sheet_id`, `user_sheet_url`, `status`, `created_at` |
| `Questions` | `question_id`, `user_email`, `difficulty`, `domain`, `sample_data_snapshot`, `expected_health_check_answers`, `cleaned_data_template` (col 13) |
| `Responses` | `response_id`, `question_id`, `user_email`, `user_health_check_sop`, `user_cleaned_data`, `submitted_at` |
| `Scores` | `score_id`, `question_id`, `response_id`, `user_email`, `overall_score`, `format_score`, `business_logic_score`, `strategy_score`, `completeness_score`, `feedback_comment` |
| `PromptVersions` | `prompt_version`, `type`, `system_instruction`, `user_prompt_template`, `is_active` |
| `SystemConfig` | `config_key`, `config_value`, `description` |
| `AuditLog` | `log_id`, `user_email`, `action_type`, `related_id`, `status`, `error_message`, `timestamp` |
| `ApiCallLog` | `log_id`, `timestamp`, `user_email`, `action`, `model_name`, `attempt`, `http_status`, `duration_ms`, `success`, `error_detail` |

### Two Core Flows

**Generate Question** (`generate-question`):
1. `UserClient.js` validates non-empty email + API key locally, then opens `LoadingDialog.html`
2. Dialog calls `performFullGeneration()` → `runGenerationLogic()` POSTs to backend
3. Backend normalizes email, validates user whitelist, reads active generation prompt
4. Calls Gemini — response includes `title`, `business_context`, `sample_data`, `expected_health_check_answers`, `cleaned_data_template`
5. Saves full question record to `Questions` tab
6. Logs to `AuditLog`; each Gemini attempt logged to `ApiCallLog`
7. `renderQuestionTab()` creates new tab with SOP form (yellow, 8 cols) + cleaned data section (green, 12 cols) + Z-column anchors
8. Dialog shows success state with instructions, or error state with message

**Submit Response** (`submit-response`):
1. `UserClient.js` validates user is on a Q_ tab, collects SOP rows + cleaned data using Z-anchors (`__CLEAN_END__`) for dynamic positioning
2. Confirmation dialog → opens `SubmitLoadingDialog.html` with payload injected via `<script>` tag
3. Dialog calls `performFullSubmit(payload)` → `runSubmitLogic()` POSTs to backend
4. Backend retrieves question record from `Questions` tab
5. Calls Gemini with evaluation prompt → returns scores + `feedback_comment` + `standard_answers`
6. If `standard_answers` or `cleaned_data_template` missing → falls back to question record
7. Saves to `Responses` + `Scores` tabs; returns enriched score to client
8. `handleSubmitSuccess()` calls `renderFeedback()` which dynamically finds the end of the green area, clears old data, applies `formatDisplayText()` (double newline regex for lists/emojis), and writes to cells
9. Dialog shows score preview on success, or error state with message

### Schema Migration Scripts (`DatabaseSetup.js`)

Run once in GAS editor when upgrading an existing installation:

| Function | What it does |
|----------|--------------| 
| `setupDatabaseHeaders()` | Creates all tabs + default prompts + SystemConfig defaults (fresh install only) |
| `migrateQuestionsAddCleanedData()` | Appends `cleaned_data_template` column to existing Questions sheet |
| `migrateGenerationPrompt()` | Patches active generation prompt to include `cleaned_data_template` in JSON output |

### Debugging

When a user reports a failure:
1. Check `AuditLog` filtered by `user_email` for the action and error message
2. Check `ApiCallLog` filtered by same `user_email` + `action` for Gemini-level details (model used, HTTP status, retry count, raw error body)

Common failure patterns:
- `http_status: 400` in ApiCallLog → invalid model name or malformed request
- `http_status: 429` → Gemini rate limit or quota exceeded
- `Bandwidth quota exceeded` in error → GAS `UrlFetchApp` daily bandwidth limit hit (resets at midnight PT); also triggered when using an invalid model name that returns large HTML error responses
- Missing Logs / API lost functionality → The Backend Web App was not "Deployed as New Version" after a code change, or the DB tabs were renamed.
- Silent dialog failure (pre-v1.2) → server-side `ui.alert()` conflicted with open modal; fixed in v1.2

---

## Key Resource IDs

| Resource | ID |
|----------|---|
| Central Database Sheet | `1a-Po10_gmaLxfEWwSU31hQjoW0Jqpv_t4U9YM4KZnNw` |
| Backend GAS Script | `1fLZFUhYszQr8XPEDeoXcTw78f56eVsobICWjNJ1FPuWUaLjQw8bIjx0K` |
| User Sheet Template | `1rHl80WEJmPpOo2opER0KQi33zqej4SsahopArk-I_1g` |
| User-side GAS Script (Template) | `15wCum8Lk8-y8uZLk5vOSR0SYCW44FFuUqDpV-9TTHHeQHKZepLTB7N_n` |

---

## Environment / Secrets

- The backend reads `TEST_API_KEY` from GAS Project Settings > Script Properties (not from any local file).
- There is no `.env` file and no local runtime — all execution happens inside Google Apps Script's cloud runtime.
- User Gemini API keys are passed per-request in the POST body and never written to the database.

---

## Current Development Status

- **v1.0 (MVP)**: Modules A–F complete — full generation → submission → scoring pipeline
- **v1.1**: Multi-user fix, ApiCallLog, cleaned_data_template at generation, text formatting
- **v1.2**: Reliable dialog UX, CLIENT_VERSION tracking, multi-user push infrastructure
- **v1.3**: UI bound expansion (12 columns), text-marker anchors (`__CLEAN_END__`) to prevent feedback overwrite, robust double-spacing regex, explicit timezone normalization for DB logs, deployment trap fixes.
- **Module G** (trainer reporting dashboard / data export): Not started
