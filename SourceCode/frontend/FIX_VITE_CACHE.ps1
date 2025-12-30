# ============================================
# FIX VITE CACHE - Resolve Module Import Errors
# ============================================
# This script clears Vite's cache and node_modules to fix
# module resolution errors like "does not provide an export"
# ============================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  VITE CACHE CLEANUP SCRIPT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get the script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

Write-Host "[Step 1/5] Stopping any running dev servers..." -ForegroundColor Yellow
# Kill any running node processes on port 5173
$processes = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
if ($processes) {
    foreach ($p in $processes) {
        $proc = Get-Process -Id $p.OwningProcess -ErrorAction SilentlyContinue
        if ($proc) {
            Write-Host "  Killing process: $($proc.ProcessName) (PID: $($proc.Id))" -ForegroundColor Gray
            Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
        }
    }
}
Write-Host "  Done" -ForegroundColor Green
Write-Host ""

Write-Host "[Step 2/5] Removing node_modules..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force "node_modules" -ErrorAction SilentlyContinue
    Write-Host "  node_modules removed" -ForegroundColor Green
} else {
    Write-Host "  node_modules not found (already clean)" -ForegroundColor Gray
}
Write-Host ""

Write-Host "[Step 3/5] Removing Vite cache..." -ForegroundColor Yellow
$cacheLocations = @(
    "node_modules/.vite",
    ".vite",
    "dist"
)

foreach ($cache in $cacheLocations) {
    if (Test-Path $cache) {
        Remove-Item -Recurse -Force $cache -ErrorAction SilentlyContinue
        Write-Host "  Removed: $cache" -ForegroundColor Green
    } else {
        Write-Host "  Not found: $cache (skipping)" -ForegroundColor Gray
    }
}
Write-Host ""

Write-Host "[Step 4/5] Installing dependencies..." -ForegroundColor Yellow
Write-Host "  Running: npm install" -ForegroundColor Gray
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "  Dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "  ERROR: npm install failed!" -ForegroundColor Red
    exit 1
}
Write-Host ""

Write-Host "[Step 5/5] Starting dev server..." -ForegroundColor Yellow
Write-Host "  Running: npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Dev server starting..." -ForegroundColor Cyan
Write-Host "  Open: http://localhost:5173" -ForegroundColor Cyan
Write-Host "  Press Ctrl+C to stop" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

npm run dev
