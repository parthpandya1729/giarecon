# VERIFY_BUILD.ps1
# Verify the production build before deployment

param(
    [string]$DistPath = "dist"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Build Verification" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$issues = @()
$warnings = @()

# Check if dist exists
if (-Not (Test-Path $DistPath)) {
    Write-Host "[ERROR] Build directory '$DistPath' not found" -ForegroundColor Red
    Write-Host "Run BUILD_PRODUCTION.ps1 first" -ForegroundColor Yellow
    exit 1
}

Write-Host "Checking build output in: $DistPath" -ForegroundColor White
Write-Host ""

# Check index.html
Write-Host "1. Checking index.html..." -ForegroundColor Yellow
if (Test-Path "$DistPath/index.html") {
    $indexContent = Get-Content "$DistPath/index.html" -Raw
    
    # Check title
    if ($indexContent -match '<title>GIA - Generative Intelligence Agent</title>') {
        Write-Host "  [OK] Title is set correctly" -ForegroundColor Green
    } else {
        $issues += "index.html title is not set correctly"
        Write-Host "  [FAIL] Title is not correct" -ForegroundColor Red
    }
    
    # Check favicon
    if ($indexContent -match 'favicon\.svg') {
        Write-Host "  [OK] Favicon reference found" -ForegroundColor Green
    } else {
        $warnings += "Favicon reference not found in index.html"
        Write-Host "  [WARN] Favicon reference not found" -ForegroundColor Yellow
    }
    
    # Check for script tags
    if ($indexContent -match '<script.*type="module".*src=".*\.js"') {
        Write-Host "  [OK] JavaScript bundle referenced" -ForegroundColor Green
    } else {
        $issues += "JavaScript bundle not referenced in index.html"
        Write-Host "  [FAIL] JavaScript bundle not found" -ForegroundColor Red
    }
} else {
    $issues += "index.html not found"
    Write-Host "  [FAIL] index.html not found" -ForegroundColor Red
}
Write-Host ""

# Check favicon
Write-Host "2. Checking favicon..." -ForegroundColor Yellow
if (Test-Path "$DistPath/favicon.svg") {
    Write-Host "  [OK] favicon.svg exists" -ForegroundColor Green
} else {
    $warnings += "favicon.svg not found in dist"
    Write-Host "  [WARN] favicon.svg not found" -ForegroundColor Yellow
}
Write-Host ""

# Check assets folder
Write-Host "3. Checking assets folder..." -ForegroundColor Yellow
if (Test-Path "$DistPath/assets") {
    $jsFiles = Get-ChildItem "$DistPath/assets" -Filter "*.js" -File
    $cssFiles = Get-ChildItem "$DistPath/assets" -Filter "*.css" -File
    
    if ($jsFiles.Count -gt 0) {
        Write-Host "  [OK] Found $($jsFiles.Count) JavaScript file(s)" -ForegroundColor Green
    } else {
        $issues += "No JavaScript files found in assets"
        Write-Host "  [FAIL] No JavaScript files found" -ForegroundColor Red
    }
    
    if ($cssFiles.Count -gt 0) {
        Write-Host "  [OK] Found $($cssFiles.Count) CSS file(s)" -ForegroundColor Green
    } else {
        $warnings += "No CSS files found in assets"
        Write-Host "  [WARN] No CSS files found" -ForegroundColor Yellow
    }
} else {
    $issues += "assets folder not found"
    Write-Host "  [FAIL] assets folder not found" -ForegroundColor Red
}
Write-Host ""

# Check file sizes
Write-Host "4. Checking file sizes..." -ForegroundColor Yellow
$totalSize = (Get-ChildItem -Path $DistPath -Recurse -File | Measure-Object -Property Length -Sum).Sum
$totalSizeMB = [math]::Round($totalSize / 1MB, 2)

Write-Host "  Total build size: $totalSizeMB MB" -ForegroundColor White

if ($totalSizeMB -gt 10) {
    $warnings += "Build size is large ($totalSizeMB MB). Consider optimization."
    Write-Host "  [WARN] Build size is quite large" -ForegroundColor Yellow
} elseif ($totalSizeMB -gt 5) {
    $warnings += "Build size is moderate ($totalSizeMB MB)"
    Write-Host "  [INFO] Build size is moderate" -ForegroundColor Cyan
} else {
    Write-Host "  [OK] Build size is good" -ForegroundColor Green
}

# Check largest files
if (Test-Path "$DistPath/assets") {
    $largestFiles = Get-ChildItem "$DistPath/assets" -File | 
        Sort-Object Length -Descending | 
        Select-Object -First 3
    
    Write-Host ""
    Write-Host "  Largest files:" -ForegroundColor White
    foreach ($file in $largestFiles) {
        $sizeMB = [math]::Round($file.Length / 1MB, 2)
        $sizeKB = [math]::Round($file.Length / 1KB, 2)
        $size = if ($sizeMB -gt 0.1) { "$sizeMB MB" } else { "$sizeKB KB" }
        Write-Host "    - $($file.Name): $size" -ForegroundColor Gray
    }
}
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Verification Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($issues.Count -eq 0 -and $warnings.Count -eq 0) {
    Write-Host "All checks passed!" -ForegroundColor Green
    Write-Host "Build is ready for deployment" -ForegroundColor Green
    exit 0
} elseif ($issues.Count -eq 0) {
    Write-Host "Build verification completed with warnings:" -ForegroundColor Yellow
    foreach ($warning in $warnings) {
        Write-Host "  - $warning" -ForegroundColor Yellow
    }
    Write-Host ""
    Write-Host "Build can be deployed but review warnings" -ForegroundColor Yellow
    exit 0
} else {
    Write-Host "Build verification failed with issues:" -ForegroundColor Red
    foreach ($issue in $issues) {
        Write-Host "  - $issue" -ForegroundColor Red
    }
    if ($warnings.Count -gt 0) {
        Write-Host ""
        Write-Host "Warnings:" -ForegroundColor Yellow
        foreach ($warning in $warnings) {
            Write-Host "  - $warning" -ForegroundColor Yellow
        }
    }
    Write-Host ""
    Write-Host "Fix issues before deploying" -ForegroundColor Red
    exit 1
}
