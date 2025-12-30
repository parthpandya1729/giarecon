# BUILD_QUICK.ps1
# Quick build script without extensive checks

Write-Host "Building GIA Frontend..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Build successful! Output in 'dist' folder" -ForegroundColor Green
    Write-Host "Run 'npm run preview' to test the build" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "Build failed! Check errors above." -ForegroundColor Red
    exit 1
}
