# Complete dev server restart with cache clearing
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "GIA Frontend Dev Server Restart" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Step 1: Kill any running Node/Vite processes
Write-Host "[1/6] Stopping any running processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

# Step 2: Remove Vite cache
Write-Host "[2/6] Clearing Vite cache..." -ForegroundColor Yellow
Remove-Item -Recurse -Force "node_modules/.vite" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force ".vite" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "dist" -ErrorAction SilentlyContinue

# Step 3: Clear npm cache
Write-Host "[3/6] Clearing npm cache..." -ForegroundColor Yellow
npm cache clean --force 2>&1 | Out-Null

# Step 4: Verify TypeScript files
Write-Host "[4/6] Verifying TypeScript type files..." -ForegroundColor Yellow
$typeFiles = @(
    "src/types/common.types.ts",
    "src/types/workspace.types.ts",
    "src/types/reconciliation.types.ts",
    "src/types/log.types.ts",
    "src/types/config.types.ts",
    "src/types/chat.types.ts",
    "src/types/index.ts"
)

$allExist = $true
foreach ($file in $typeFiles) {
    if (Test-Path $file) {
        Write-Host "  ✓ $file" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $file MISSING!" -ForegroundColor Red
        $allExist = $false
    }
}

if (-not $allExist) {
    Write-Host "`nERROR: Some type files are missing!" -ForegroundColor Red
    Write-Host "Please ensure all files were created properly." -ForegroundColor Red
    exit 1
}

# Step 5: Check TypeScript configuration
Write-Host "[5/6] Checking TypeScript configuration..." -ForegroundColor Yellow
if (Test-Path "tsconfig.app.json") {
    Write-Host "  ✓ tsconfig.app.json exists" -ForegroundColor Green
} else {
    Write-Host "  ✗ tsconfig.app.json MISSING!" -ForegroundColor Red
    exit 1
}

# Step 6: Start dev server
Write-Host "[6/6] Starting development server..." -ForegroundColor Yellow
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Dev server starting..." -ForegroundColor Cyan
Write-Host "Open: http://localhost:5173" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan

# Start the dev server
npm run dev
