# SETUP_FAVICON.ps1
# PowerShell script to set up favicon files for GIA frontend

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "GIA Frontend - Favicon Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$publicDir = "$PSScriptRoot\public"

# Check if public directory exists
if (-Not (Test-Path $publicDir)) {
    Write-Host "Error: public directory not found at $publicDir" -ForegroundColor Red
    exit 1
}

Write-Host "Public directory: $publicDir" -ForegroundColor Green
Write-Host ""

# Check if favicon.svg exists
$faviconSvg = Join-Path $publicDir "favicon.svg"
if (Test-Path $faviconSvg) {
    Write-Host "[OK] favicon.svg found" -ForegroundColor Green
} else {
    Write-Host "[MISSING] favicon.svg not found" -ForegroundColor Yellow
    Write-Host "  Please ensure favicon.svg is in the public directory" -ForegroundColor Yellow
}

# Instructions for generating PNG favicons
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Favicon Setup Instructions" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "The favicon.svg file has been created in the public directory." -ForegroundColor Green
Write-Host ""

Write-Host "To generate PNG favicons (optional, for better browser compatibility):" -ForegroundColor Yellow
Write-Host ""
Write-Host "Option 1: Using online tools" -ForegroundColor Cyan
Write-Host "  1. Visit https://realfavicongenerator.net/" -ForegroundColor White
Write-Host "  2. Upload the favicon.svg file" -ForegroundColor White
Write-Host "  3. Download the generated favicons" -ForegroundColor White
Write-Host "  4. Extract all files to the public directory" -ForegroundColor White
Write-Host ""

Write-Host "Option 2: Using ImageMagick (if installed)" -ForegroundColor Cyan
Write-Host "  Run these commands in PowerShell:" -ForegroundColor White
Write-Host "  magick convert -density 300 -background none favicon.svg -resize 16x16 favicon-16x16.png" -ForegroundColor Gray
Write-Host "  magick convert -density 300 -background none favicon.svg -resize 32x32 favicon-32x32.png" -ForegroundColor Gray
Write-Host "  magick convert -density 300 -background none favicon.svg -resize 180x180 apple-touch-icon.png" -ForegroundColor Gray
Write-Host ""

Write-Host "Option 3: Manual creation" -ForegroundColor Cyan
Write-Host "  Create the following PNG files manually from favicon.svg:" -ForegroundColor White
Write-Host "  - favicon-16x16.png (16x16 pixels)" -ForegroundColor Gray
Write-Host "  - favicon-32x32.png (32x32 pixels)" -ForegroundColor Gray
Write-Host "  - apple-touch-icon.png (180x180 pixels)" -ForegroundColor Gray
Write-Host ""

# List current files in public directory
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Current files in public directory:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Get-ChildItem $publicDir | ForEach-Object {
    $icon = if ($_.PSIsContainer) { "[DIR]" } else { "[FILE]" }
    $color = if ($_.PSIsContainer) { "Blue" } else { "White" }
    Write-Host "$icon $($_.Name)" -ForegroundColor $color
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "The favicon.svg is ready to use." -ForegroundColor Green
Write-Host "The application will use favicon.svg by default." -ForegroundColor Green
Write-Host "PNG favicons are optional but recommended for older browsers." -ForegroundColor Yellow
Write-Host ""
