# Clear all Vite and Node caches
Write-Host "Clearing Vite and Node caches..." -ForegroundColor Cyan

# Remove node_modules/.vite cache
if (Test-Path "node_modules/.vite") {
    Write-Host "Removing node_modules/.vite..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "node_modules/.vite"
}

# Remove .vite cache in project root
if (Test-Path ".vite") {
    Write-Host "Removing .vite..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force ".vite"
}

# Remove dist folder
if (Test-Path "dist") {
    Write-Host "Removing dist..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "dist"
}

# Clear npm cache (optional but thorough)
Write-Host "Clearing npm cache..." -ForegroundColor Yellow
npm cache clean --force

Write-Host "`nCache cleared successfully!" -ForegroundColor Green
Write-Host "Now run: npm run dev" -ForegroundColor Cyan
