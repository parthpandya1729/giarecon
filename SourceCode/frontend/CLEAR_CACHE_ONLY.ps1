# ============================================
# CLEAR CACHE ONLY - Quick Cache Reset
# ============================================
# Clears only Vite cache without reinstalling node_modules
# Use this for quick cache resets
# ============================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  QUICK CACHE CLEAR" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get the script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

Write-Host "[1/3] Stopping dev server..." -ForegroundColor Yellow
$processes = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
if ($processes) {
    foreach ($p in $processes) {
        $proc = Get-Process -Id $p.OwningProcess -ErrorAction SilentlyContinue
        if ($proc) {
            Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
        }
    }
    Write-Host "  Dev server stopped" -ForegroundColor Green
} else {
    Write-Host "  No dev server running" -ForegroundColor Gray
}
Write-Host ""

Write-Host "[2/3] Clearing Vite cache..." -ForegroundColor Yellow
$cacheLocations = @(
    "node_modules/.vite",
    ".vite",
    "dist"
)

$cleared = $false
foreach ($cache in $cacheLocations) {
    if (Test-Path $cache) {
        Remove-Item -Recurse -Force $cache -ErrorAction SilentlyContinue
        Write-Host "  Removed: $cache" -ForegroundColor Green
        $cleared = $true
    }
}

if (-not $cleared) {
    Write-Host "  No cache found to clear" -ForegroundColor Gray
}
Write-Host ""

Write-Host "[3/3] Starting dev server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Cache cleared!" -ForegroundColor Green
Write-Host "  Starting dev server..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

npm run dev
