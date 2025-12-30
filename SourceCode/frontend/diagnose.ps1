# Diagnostic script to check project health
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "GIA Frontend Diagnostic Check" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$errors = 0

# Check 1: Node and npm versions
Write-Host "Node & Package Manager:" -ForegroundColor Yellow
Write-Host "  Node version: " -NoNewline
node --version
Write-Host "  npm version: " -NoNewline
npm --version
Write-Host ""

# Check 2: Critical files
Write-Host "Critical Configuration Files:" -ForegroundColor Yellow
$configFiles = @(
    "package.json",
    "vite.config.ts",
    "tsconfig.json",
    "tsconfig.app.json",
    "tsconfig.node.json"
)

foreach ($file in $configFiles) {
    if (Test-Path $file) {
        Write-Host "  ✓ $file" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $file" -ForegroundColor Red
        $errors++
    }
}
Write-Host ""

# Check 3: TypeScript type files
Write-Host "TypeScript Type Files:" -ForegroundColor Yellow
$typeFiles = @(
    "src/types/common.types.ts",
    "src/types/workspace.types.ts",
    "src/types/reconciliation.types.ts",
    "src/types/log.types.ts",
    "src/types/config.types.ts",
    "src/types/chat.types.ts",
    "src/types/index.ts"
)

foreach ($file in $typeFiles) {
    if (Test-Path $file) {
        $size = (Get-Item $file).Length
        Write-Host "  ✓ $file ($size bytes)" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $file MISSING!" -ForegroundColor Red
        $errors++
    }
}
Write-Host ""

# Check 4: Verify exports in common.types.ts
Write-Host "Checking common.types.ts exports:" -ForegroundColor Yellow
$commonTypes = Get-Content "src/types/common.types.ts" -Raw
if ($commonTypes -match "export interface BaseEntity") {
    Write-Host "  ✓ BaseEntity export found" -ForegroundColor Green
} else {
    Write-Host "  ✗ BaseEntity export NOT FOUND!" -ForegroundColor Red
    $errors++
}
if ($commonTypes -match "export type Status") {
    Write-Host "  ✓ Status export found" -ForegroundColor Green
} else {
    Write-Host "  ✗ Status export NOT FOUND!" -ForegroundColor Red
    $errors++
}
Write-Host ""

# Check 5: Verify imports in chat.types.ts
Write-Host "Checking chat.types.ts imports:" -ForegroundColor Yellow
$chatTypes = Get-Content "src/types/chat.types.ts" -Raw
if ($chatTypes -match "import.*BaseEntity.*from.*common.types") {
    Write-Host "  ✓ BaseEntity import found" -ForegroundColor Green
} else {
    Write-Host "  ✗ BaseEntity import NOT FOUND!" -ForegroundColor Red
    $errors++
}
Write-Host ""

# Check 6: node_modules status
Write-Host "Dependencies:" -ForegroundColor Yellow
if (Test-Path "node_modules") {
    $moduleCount = (Get-ChildItem "node_modules" -Directory).Count
    Write-Host "  ✓ node_modules exists ($moduleCount packages)" -ForegroundColor Green

    # Check for critical packages
    $criticalPackages = @("react", "react-dom", "vite", "typescript", "zustand")
    foreach ($pkg in $criticalPackages) {
        if (Test-Path "node_modules/$pkg") {
            Write-Host "  ✓ $pkg installed" -ForegroundColor Green
        } else {
            Write-Host "  ✗ $pkg NOT installed!" -ForegroundColor Red
            $errors++
        }
    }
} else {
    Write-Host "  ✗ node_modules directory MISSING!" -ForegroundColor Red
    Write-Host "  Run: npm install" -ForegroundColor Yellow
    $errors++
}
Write-Host ""

# Check 7: Cache status
Write-Host "Cache Status:" -ForegroundColor Yellow
if (Test-Path "node_modules/.vite") {
    Write-Host "  ⚠ Vite cache exists (node_modules/.vite)" -ForegroundColor Yellow
    Write-Host "    Run ./clear-cache.ps1 to clear" -ForegroundColor Yellow
} else {
    Write-Host "  ✓ No Vite cache" -ForegroundColor Green
}
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
if ($errors -eq 0) {
    Write-Host "✓ All checks passed!" -ForegroundColor Green
    Write-Host "`nRecommended next steps:" -ForegroundColor Cyan
    Write-Host "  1. Run: ./restart-dev.ps1" -ForegroundColor White
    Write-Host "  2. Open: http://localhost:5173" -ForegroundColor White
    Write-Host "  3. Hard refresh browser (Ctrl+Shift+R)" -ForegroundColor White
} else {
    Write-Host "✗ Found $errors error(s)" -ForegroundColor Red
    Write-Host "`nPlease fix the errors above before starting the dev server." -ForegroundColor Yellow
}
Write-Host "========================================" -ForegroundColor Cyan
