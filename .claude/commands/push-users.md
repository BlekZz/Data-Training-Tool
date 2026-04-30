Execute a global push of the User Side GAS script to all managed user scripts listed in `scripts/managed_users.json`.

**Important:** `push_all.ps1` uses `Read-Host` for confirmation which hangs in Claude Code's non-interactive environment. Do NOT run `push_all.ps1` directly. Instead, run the push logic inline via PowerShell using the block below — the user invoking `/push-users` in the conversation already counts as confirmation.

Run this PowerShell block:

```powershell
$ErrorActionPreference = "Stop"
$ProjectRoot = "C:\Users\lolz_\Desktop\Data-Training-Tool"
$UserSideDir = Join-Path $ProjectRoot "data_training_tool_clasp\User Side"
$ClaspJson   = Join-Path $UserSideDir ".clasp.json"
$ManagedFile = Join-Path $ProjectRoot "scripts\managed_users.json"
$ClientJs    = Join-Path $UserSideDir "UserClient.js"

$VersionLine = Select-String -Path $ClientJs -Pattern 'CLIENT_VERSION\s*=\s*"([^"]+)"' | Select-Object -First 1
$Version     = if ($VersionLine) { $VersionLine.Matches[0].Groups[1].Value } else { "unknown" }

$Config  = Get-Content $ManagedFile | ConvertFrom-Json
$Scripts = $Config.managed_scripts

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  USER SIDE GLOBAL PUSH  v$Version" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Targets: $($Scripts.Count)" -ForegroundColor Yellow
foreach ($s in $Scripts) { Write-Host "  - $($s.label) ($($s.email))" }
Write-Host ""

$OriginalClasp = Get-Content $ClaspJson -Raw
$success = 0
$failed  = @()

foreach ($s in $Scripts) {
    Write-Host "Pushing -> $($s.label) ..." -NoNewline

    $claspObj = $OriginalClasp | ConvertFrom-Json
    $claspObj.scriptId = $s.id
    $claspObj | ConvertTo-Json -Depth 5 | Set-Content $ClaspJson -Encoding UTF8

    try {
        $out = & npx clasp push --force 2>&1
        if ($LASTEXITCODE -ne 0) { throw ($out -join "`n") }
        Write-Host " OK" -ForegroundColor Green
        $success++
    } catch {
        Write-Host " FAILED" -ForegroundColor Red
        Write-Host "  $_" -ForegroundColor DarkRed
        $failed += $s.label
    }
}

$OriginalClasp | Set-Content $ClaspJson -Encoding UTF8

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DONE: $success / $($Scripts.Count) succeeded" -ForegroundColor $(if ($success -eq $Scripts.Count) { "Green" } else { "Yellow" })
if ($failed.Count -gt 0) { Write-Host "  Failed: $($failed -join ', ')" -ForegroundColor Red }
Write-Host "========================================" -ForegroundColor Cyan
```

After the push completes, remind the user that **only the User Side container-bound scripts are updated** — no redeployment step is needed (unlike the Backend Side web app).
