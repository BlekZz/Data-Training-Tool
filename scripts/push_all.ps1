# push_all.ps1
# Global push of User Side scripts to all managed GAS IDs.
# Usage: pwsh scripts/push_all.ps1
# Run from project root: C:\Users\lolz_\Desktop\Data-Training-Tool

$ErrorActionPreference = "Stop"

$ProjectRoot  = Split-Path $PSScriptRoot -Parent
$UserSideDir  = Join-Path $ProjectRoot "data_training_tool_clasp\User Side"
$ClaspJson    = Join-Path $UserSideDir ".clasp.json"
$ManagedFile  = Join-Path $PSScriptRoot "managed_users.json"

# --- Read version from UserClient.js ---
$ClientJs     = Join-Path $UserSideDir "UserClient.js"
$VersionLine  = Select-String -Path $ClientJs -Pattern 'CLIENT_VERSION\s*=\s*"([^"]+)"' | Select-Object -First 1
$Version      = if ($VersionLine) { $VersionLine.Matches[0].Groups[1].Value } else { "unknown" }

# --- Read managed list ---
$Config       = Get-Content $ManagedFile | ConvertFrom-Json
$Scripts      = $Config.managed_scripts

# --- Print push manifest ---
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  USER SIDE GLOBAL PUSH" -ForegroundColor Cyan
Write-Host "  Version: $Version" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Files to push (from: User Side/):" -ForegroundColor Yellow
Get-ChildItem $UserSideDir -File | ForEach-Object { Write-Host "  - $($_.Name)" }
Write-Host ""
Write-Host "Target scripts ($($Scripts.Count) total):" -ForegroundColor Yellow

$i = 1
foreach ($s in $Scripts) {
    Write-Host "  [$i] $($s.label)" -ForegroundColor White
    Write-Host "      email : $($s.email)"
    Write-Host "      id    : $($s.id)"
    if ($s.note) { Write-Host "      note  : $($s.note)" -ForegroundColor DarkGray }
    $i++
}

Write-Host ""
$confirm = Read-Host "Proceed with push to all $($Scripts.Count) script(s)? [y/N]"
if ($confirm -notin @("y", "Y")) {
    Write-Host "Aborted." -ForegroundColor Red
    exit 0
}

# --- Backup original .clasp.json ---
$OriginalClasp = Get-Content $ClaspJson -Raw

Write-Host ""
$success = 0
$failed  = @()

foreach ($s in $Scripts) {
    Write-Host "[$($Scripts.IndexOf($s)+1)/$($Scripts.Count)] Pushing to: $($s.label) ..." -NoNewline

    # Swap scriptId in .clasp.json
    $claspObj = $OriginalClasp | ConvertFrom-Json
    $claspObj.scriptId = $s.id
    $claspObj | ConvertTo-Json -Depth 5 | Set-Content $ClaspJson -Encoding UTF8

    try {
        Push-Location $UserSideDir
        $output = & npx clasp push --force 2>&1
        Pop-Location
        if ($LASTEXITCODE -ne 0) { throw $output }
        Write-Host " OK" -ForegroundColor Green
        $success++
    } catch {
        Write-Host " FAILED" -ForegroundColor Red
        Write-Host "      Error: $_" -ForegroundColor DarkRed
        $failed += $s.label
    }
}

# --- Restore original .clasp.json ---
$OriginalClasp | Set-Content $ClaspJson -Encoding UTF8

# --- Summary ---
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PUSH COMPLETE" -ForegroundColor Cyan
Write-Host "  Success : $success / $($Scripts.Count)" -ForegroundColor $(if ($success -eq $Scripts.Count) { "Green" } else { "Yellow" })
if ($failed.Count -gt 0) {
    Write-Host "  Failed  : $($failed -join ', ')" -ForegroundColor Red
}
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
