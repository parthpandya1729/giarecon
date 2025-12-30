# BUILD_PRODUCTION.ps1
# PowerShell script to build the GIA frontend for production

param(
    [switch]$Clean = $false,
    [switch]$SkipLint = $false,
    [switch]$Preview = $false
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "GIA Frontend - Production Build" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Set working directory to script location
Set-Location $PSScriptRoot

# Function to check if command exists
function Test-Command {
    param($Command)
    $null = Get-Command $Command -ErrorAction SilentlyContinue
    return $?
}

# Check Node.js
Write-Host "[1/6] Checking prerequisites..." -ForegroundColor Yellow
if (-Not (Test-Command "node")) {
    Write-Host "Error: Node.js is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

$nodeVersion = node --version
Write-Host "  Node.js version: $nodeVersion" -ForegroundColor Green

if (-Not (Test-Command "npm")) {
    Write-Host "Error: npm is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

$npmVersion = npm --version
Write-Host "  npm version: $npmVersion" -ForegroundColor Green
Write-Host ""

# Clean previous build
if ($Clean) {
    Write-Host "[2/6] Cleaning previous build..." -ForegroundColor Yellow
    if (Test-Path "dist") {
        Remove-Item -Recurse -Force "dist"
        Write-Host "  Removed dist directory" -ForegroundColor Green
    }
    if (Test-Path "node_modules/.vite") {
        Remove-Item -Recurse -Force "node_modules/.vite"
        Write-Host "  Removed Vite cache" -ForegroundColor Green
    }
    Write-Host ""
} else {
    Write-Host "[2/6] Skipping clean (use -Clean flag to clean before build)" -ForegroundColor Gray
    Write-Host ""
}

# Check dependencies
Write-Host "[3/6] Checking dependencies..." -ForegroundColor Yellow
if (-Not (Test-Path "node_modules")) {
    Write-Host "  node_modules not found. Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: npm install failed" -ForegroundColor Red
        exit 1
    }
    Write-Host "  Dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "  Dependencies already installed" -ForegroundColor Green
}
Write-Host ""

# Run linting (optional)
if (-Not $SkipLint) {
    Write-Host "[4/6] Running ESLint..." -ForegroundColor Yellow
    npm run lint
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Warning: Linting found issues. Build will continue..." -ForegroundColor Yellow
        Write-Host "  (Use -SkipLint flag to skip linting)" -ForegroundColor Gray
    } else {
        Write-Host "  No linting errors found" -ForegroundColor Green
    }
    Write-Host ""
} else {
    Write-Host "[4/6] Skipping linting" -ForegroundColor Gray
    Write-Host ""
}

# Build the project
Write-Host "[5/6] Building production bundle..." -ForegroundColor Yellow
Write-Host "  Running: npm run build" -ForegroundColor Gray
Write-Host ""

$buildStartTime = Get-Date
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "Build Failed!" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    exit 1
}

$buildEndTime = Get-Date
$buildDuration = ($buildEndTime - $buildStartTime).TotalSeconds
Write-Host ""
Write-Host "  Build completed in $([math]::Round($buildDuration, 2)) seconds" -ForegroundColor Green
Write-Host ""

# Verify build output
Write-Host "[6/6] Verifying build output..." -ForegroundColor Yellow

if (-Not (Test-Path "dist")) {
    Write-Host "Error: dist directory was not created" -ForegroundColor Red
    exit 1
}

if (-Not (Test-Path "dist/index.html")) {
    Write-Host "Error: dist/index.html was not created" -ForegroundColor Red
    exit 1
}

Write-Host "  Build output verified successfully" -ForegroundColor Green
Write-Host ""

# Display build statistics
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Build Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$distSize = (Get-ChildItem -Path "dist" -Recurse | Measure-Object -Property Length -Sum).Sum
$distSizeMB = [math]::Round($distSize / 1MB, 2)
$distFiles = (Get-ChildItem -Path "dist" -Recurse -File).Count

Write-Host "Output Directory: $PSScriptRoot\dist" -ForegroundColor White
Write-Host "Total Size:       $distSizeMB MB" -ForegroundColor White
Write-Host "Total Files:      $distFiles" -ForegroundColor White
Write-Host "Build Time:       $([math]::Round($buildDuration, 2)) seconds" -ForegroundColor White
Write-Host ""

# List main files
Write-Host "Main Files:" -ForegroundColor Cyan
if (Test-Path "dist/index.html") {
    $indexSize = [math]::Round((Get-Item "dist/index.html").Length / 1KB, 2)
    Write-Host "  index.html        $indexSize KB" -ForegroundColor White
}

if (Test-Path "dist/assets") {
    $jsFiles = Get-ChildItem "dist/assets" -Filter "*.js" | Sort-Object Length -Descending | Select-Object -First 3
    $cssFiles = Get-ChildItem "dist/assets" -Filter "*.css" | Sort-Object Length -Descending | Select-Object -First 3
    
    Write-Host ""
    Write-Host "JavaScript Files (top 3):" -ForegroundColor Cyan
    foreach ($file in $jsFiles) {
        $size = [math]::Round($file.Length / 1KB, 2)
        Write-Host "  $($file.Name.Substring(0, [Math]::Min(40, $file.Name.Length)))... $size KB" -ForegroundColor Gray
    }
    
    Write-Host ""
    Write-Host "CSS Files:" -ForegroundColor Cyan
    foreach ($file in $cssFiles) {
        $size = [math]::Round($file.Length / 1KB, 2)
        Write-Host "  $($file.Name.Substring(0, [Math]::Min(40, $file.Name.Length)))... $size KB" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Build Successful!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Preview option
if ($Preview) {
    Write-Host "Starting preview server..." -ForegroundColor Yellow
    Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Gray
    Write-Host ""
    npm run preview
} else {
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host "  1. Test the build locally:" -ForegroundColor White
    Write-Host "     npm run preview" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  2. Deploy the 'dist' folder to your web server" -ForegroundColor White
    Write-Host ""
    Write-Host "  3. Or use -Preview flag to preview now:" -ForegroundColor White
    Write-Host "     .\BUILD_PRODUCTION.ps1 -Preview" -ForegroundColor Gray
    Write-Host ""
}
