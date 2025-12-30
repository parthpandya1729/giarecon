# Benow Favicon Setup Instructions

## Overview
This guide explains how to add the Benow logo as the favicon for the GIA Recon application.

## Steps

### 1. Download Benow Logo

The Benow logo is available at: https://www.benow.in/assets/img/logo.png

**Option A - Manual Download:**
1. Open https://www.benow.in/assets/img/logo.png in your browser
2. Right-click and save as `benow-logo.png` in `/public` folder

**Option B - PowerShell Download:**
```powershell
# Run from /SourceCode/frontend directory
Invoke-WebRequest -Uri "https://www.benow.in/assets/img/logo.png" -OutFile "public/benow-logo.png"
```

### 2. Convert to Favicon Formats

You need to create multiple favicon sizes for cross-browser compatibility:

**Option A - Online Converter (Recommended):**
1. Go to https://realfavicongenerator.net/
2. Upload `benow-logo.png`
3. Adjust settings as needed
4. Download the favicon package
5. Extract to `/public` folder

**Option B - Using ImageMagick (if installed):**
```powershell
# Install ImageMagick first if not installed
# https://imagemagick.org/script/download.php#windows

# Generate favicons
magick convert public/benow-logo.png -resize 16x16 public/favicon-16x16.png
magick convert public/benow-logo.png -resize 32x32 public/favicon-32x32.png
magick convert public/benow-logo.png -resize 192x192 public/android-chrome-192x192.png
magick convert public/benow-logo.png -resize 512x512 public/android-chrome-512x512.png
magick convert public/benow-logo.png -resize 180x180 public/apple-touch-icon.png

# Create .ico file (combine 16x16 and 32x32)
magick convert public/favicon-16x16.png public/favicon-32x32.png public/favicon.ico
```

### 3. Update index.html

Find your main HTML file (usually `index.html` or `public/index.html`) and update the favicon links:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <!-- Benow Favicon -->
    <link rel="icon" type="image/x-icon" href="/favicon.ico" />
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
    <link rel="manifest" href="/site.webmanifest" />

    <title>GIA Recon - By Benow</title>

    <!-- Rest of your HTML -->
  </head>
  <body>
    <!-- ... -->
  </body>
</html>
```

### 4. Create Web Manifest (Optional)

Create `/public/site.webmanifest` for PWA support:

```json
{
  "name": "GIA Recon",
  "short_name": "GIA",
  "description": "Generative Intelligence Agent for Reconciliation - By Benow",
  "icons": [
    {
      "src": "/android-chrome-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/android-chrome-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "theme_color": "#1a56db",
  "background_color": "#f9fafb",
  "display": "standalone"
}
```

### 5. Verify Favicon

After setup, verify the favicon appears:

1. Clear browser cache (Ctrl+Shift+Delete)
2. Run dev server: `npm run dev`
3. Open `http://localhost:5173` (or your dev URL)
4. Check browser tab - should show Benow logo
5. Check on mobile devices (if applicable)

### 6. Production Build

Before deploying:

```powershell
# Build the project
npm run build

# Check that favicon files are in dist/public
Get-ChildItem -Path dist/public -Filter "favicon*"
Get-ChildItem -Path dist/public -Filter "*chrome*"
Get-ChildItem -Path dist/public -Filter "apple-touch-icon.png"
```

## Troubleshooting

### Favicon Not Showing

1. **Clear browser cache**: Hard refresh with Ctrl+F5
2. **Check file paths**: Ensure favicon files are in `/public` folder
3. **Verify HTML links**: Ensure `<link>` tags are in `<head>` section
4. **Check dev server**: Some dev servers cache favicons aggressively

### Wrong Icon Appears

1. **Browser cache**: Clear all browsing data
2. **File names**: Ensure files match the HTML `<link>` tags exactly
3. **File format**: Ensure .ico file is valid (use online converter)

### Mobile Issues

- **iOS**: Requires `apple-touch-icon.png` (180x180px minimum)
- **Android**: Requires `android-chrome-192x192.png` and `android-chrome-512x512.png`
- **Manifest**: Create `site.webmanifest` for PWA support

## Quick Setup Script

Save this as `SETUP_FAVICON.ps1` and run from `/SourceCode/frontend`:

```powershell
# Download Benow logo
Write-Host "Downloading Benow logo..." -ForegroundColor Cyan
Invoke-WebRequest -Uri "https://www.benow.in/assets/img/logo.png" -OutFile "public/benow-logo.png"
Write-Host "✓ Logo downloaded to public/benow-logo.png" -ForegroundColor Green

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Convert benow-logo.png to favicon formats using:" -ForegroundColor White
Write-Host "   https://realfavicongenerator.net/" -ForegroundColor Cyan
Write-Host "2. Extract favicon package to /public folder" -ForegroundColor White
Write-Host "3. Update index.html with favicon links (see FAVICON_SETUP.md)" -ForegroundColor White
Write-Host ""
```

## Expected Files in `/public`

After setup, you should have:

```
/public
  ├── favicon.ico              # Combined 16x16 and 32x32
  ├── favicon-16x16.png        # 16x16 favicon
  ├── favicon-32x32.png        # 32x32 favicon
  ├── apple-touch-icon.png     # 180x180 for iOS
  ├── android-chrome-192x192.png  # 192x192 for Android
  ├── android-chrome-512x512.png  # 512x512 for Android
  ├── benow-logo.png           # Original logo (backup)
  └── site.webmanifest         # PWA manifest
```

## Benow Brand Colors (for reference)

- **Primary**: #1a56db (benow-blue-600)
- **Background**: #f9fafb (gray-50)
- **Text**: #1f2937 (gray-800)

---

**Status**: Manual setup required
**Estimated Time**: 5-10 minutes
**Tools Needed**: Web browser, online favicon converter (or ImageMagick)
