# ============================================
# VERIFY FIX - Test TypeScript Import Type Fix
# ============================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  VERIFYING TYPESCRIPT IMPORT TYPE FIX" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

Write-Host "[Step 1/3] Running TypeScript type check..." -ForegroundColor Yellow
Write-Host "  Command: npx tsc --noEmit" -ForegroundColor Gray
Write-Host ""

npx tsc --noEmit

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "  Type check PASSED" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "  Type check FAILED - Please review errors above" -ForegroundColor Red
    Write-Host ""
    exit 1
}

Write-Host "[Step 2/3] Building production bundle..." -ForegroundColor Yellow
Write-Host "  Command: npm run build" -ForegroundColor Gray
Write-Host ""

npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "  Build PASSED" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "  Build FAILED - Please review errors above" -ForegroundColor Red
    Write-Host ""
    exit 1
}

Write-Host "[Step 3/3] Starting development server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ALL CHECKS PASSED!" -ForegroundColor Green
Write-Host "  Starting dev server at http://localhost:5173" -ForegroundColor Cyan
Write-Host "  Check browser console for any runtime errors" -ForegroundColor Yellow
Write-Host "  Press Ctrl+C to stop" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

npm run dev
