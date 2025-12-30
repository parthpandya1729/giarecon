# 🏗️ GIA Frontend - Build Instructions

## Quick Start (Choose One)

### 1️⃣ Quick Build (Fastest)
For development builds when you just need to create a build quickly:
```powershell
cd SourceCode\frontend
.\BUILD_QUICK.ps1
```

### 2️⃣ Production Build (Recommended)
For production-ready builds with full verification:
```powershell
cd SourceCode\frontend
.\BUILD_PRODUCTION.ps1
```

### 3️⃣ Manual Build
Using npm directly:
```powershell
cd SourceCode\frontend
npm run build
```

---

## 📋 Build Scripts Overview

| Script | Purpose | When to Use |
|--------|---------|-------------|
| **BUILD_QUICK.ps1** | Fast build, minimal output | Quick development builds |
| **BUILD_PRODUCTION.ps1** | Full production build with checks | Before deployment |
| **VERIFY_BUILD.ps1** | Verify build output | After building, before deploying |
| **npm run build** | Direct build command | Manual control |

---

## 🚀 BUILD_PRODUCTION.ps1 (Recommended)

### Basic Usage
```powershell
.\BUILD_PRODUCTION.ps1
```

### Advanced Options
```powershell
# Clean previous build first
.\BUILD_PRODUCTION.ps1 -Clean

# Skip linting for faster build
.\BUILD_PRODUCTION.ps1 -SkipLint

# Build and preview immediately
.\BUILD_PRODUCTION.ps1 -Preview

# Combine options
.\BUILD_PRODUCTION.ps1 -Clean -Preview
```

### What It Does
1. ✅ Checks Node.js and npm are installed
2. 🧹 Optionally cleans previous build
3. 📦 Verifies dependencies
4. 🔍 Runs ESLint (optional)
5. 🏗️ Builds production bundle
6. ✔️ Verifies build output
7. 📊 Shows build statistics
8. 🚀 Optionally starts preview server

---

## ⚡ BUILD_QUICK.ps1

### Usage
```powershell
.\BUILD_QUICK.ps1
```

### What It Does
- Runs `npm run build` immediately
- Shows success/failure
- Minimal output for speed

Perfect for:
- Development iterations
- Quick testing
- When you don't need detailed stats

---

## ✅ VERIFY_BUILD.ps1

### Usage
```powershell
# After building
.\BUILD_PRODUCTION.ps1
.\VERIFY_BUILD.ps1
```

### What It Checks
- ✅ index.html exists and is correct
- ✅ Title is set to "GIA - Generative Intelligence Agent"
- ✅ Favicon references are correct
- ✅ JavaScript bundles exist
- ✅ CSS files exist
- ✅ Build size is reasonable
- ✅ Shows largest files

---

## 📁 Build Output

After a successful build, the `dist` folder contains:

```
dist/
├── index.html              # Entry point (1-2 KB)
├── favicon.svg             # Favicon (< 1 KB)
├── assets/
│   ├── index-[hash].js     # Main JS bundle (500-800 KB)
│   ├── index-[hash].css    # Main CSS (50-100 KB)
│   └── [other].js          # Code-split chunks
└── vite.svg                # Vite logo
```

**Typical sizes:**
- Total: 1-3 MB
- JavaScript: 500-800 KB (minified + gzipped: ~150-200 KB)
- CSS: 50-100 KB (minified + gzipped: ~10-15 KB)

---

## 🧪 Testing the Build

### Option 1: Preview Server
```powershell
# After building
npm run preview

# Or build + preview in one command
.\BUILD_PRODUCTION.ps1 -Preview
```

Opens at: `http://localhost:4173`

### Option 2: Manual Testing
1. Build the project
2. Copy `dist` folder to your web server
3. Test in browser

---

## 🔧 Common Build Commands

### Development
```powershell
npm run dev              # Start dev server (port 5173)
```

### Building
```powershell
npm run build            # Build for production
npm run preview          # Preview production build
```

### Code Quality
```powershell
npm run lint             # Run ESLint
npx tsc --noEmit        # Type check without building
```

---

## 🐛 Troubleshooting

### Build Fails with TypeScript Errors

```powershell
# Check errors without building
npx tsc --noEmit

# Fix the errors shown, then rebuild
.\BUILD_PRODUCTION.ps1
```

### Build Succeeds but App Doesn't Work

```powershell
# Clean build
.\BUILD_PRODUCTION.ps1 -Clean

# Verify build
.\VERIFY_BUILD.ps1
```

### "Command not found" Errors

**Problem:** Node.js or npm not installed/not in PATH

**Solution:**
1. Install Node.js from https://nodejs.org/ (LTS version)
2. Restart PowerShell
3. Verify: `node --version` and `npm --version`

### Build is Very Slow

```powershell
# Skip linting
.\BUILD_PRODUCTION.ps1 -SkipLint

# Or use quick build
.\BUILD_QUICK.ps1
```

### "npm install failed"

```powershell
# Clean install
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

---

## 📦 Deployment

### Step 1: Build
```powershell
.\BUILD_PRODUCTION.ps1 -Clean
```

### Step 2: Verify
```powershell
.\VERIFY_BUILD.ps1
```

### Step 3: Preview Locally
```powershell
npm run preview
```

### Step 4: Deploy
Upload the entire `dist` folder to your web server.

**Server Configuration Required:**
- Serve `index.html` as default
- Redirect all routes to `index.html` (for React Router)

Example Nginx config:
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

---

## 📊 Build Statistics Example

After running `BUILD_PRODUCTION.ps1`, you'll see:

```
========================================
Build Summary
========================================

Output Directory: C:\...\frontend\dist
Total Size:       2.34 MB
Total Files:      12
Build Time:       8.45 seconds

Main Files:
  index.html        1.2 KB

JavaScript Files (top 3):
  index-a1b2c3d4.js... 650 KB
  vendor-e5f6g7h8.js... 120 KB
  chunk-i9j0k1l2.js... 45 KB

CSS Files:
  index-m3n4o5p6.css... 78 KB
```

---

## 🎯 Build Checklist

Before deploying to production:

- [ ] Run: `.\BUILD_PRODUCTION.ps1 -Clean`
- [ ] Run: `.\VERIFY_BUILD.ps1`
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] Preview works: `npm run preview`
- [ ] All pages load correctly
- [ ] Console has no errors
- [ ] Network tab shows no 404s
- [ ] Favicon displays correctly
- [ ] Tested in Chrome, Firefox, Edge
- [ ] Tested on mobile (responsive)
- [ ] Build size is reasonable (< 5 MB)

---

## 📚 Additional Resources

- **Full Build Guide:** See `BUILD_GUIDE.md` for comprehensive documentation
- **Vite Documentation:** https://vitejs.dev/guide/build.html
- **React Production:** https://react.dev/learn/start-a-new-react-project

---

## 🎓 Learning Path

### Beginner
1. Use `BUILD_QUICK.ps1` for simple builds
2. Learn to use `npm run preview` to test
3. Understand the `dist` folder structure

### Intermediate
1. Use `BUILD_PRODUCTION.ps1` with options
2. Learn to read build statistics
3. Use `VERIFY_BUILD.ps1` before deployment

### Advanced
1. Customize `vite.config.ts` for optimization
2. Set up CI/CD pipelines
3. Implement code splitting and lazy loading

---

**Last Updated:** December 30, 2024  
**Project:** GIA - Generative Intelligence Agent  
**Version:** 0.1.0

For questions or issues, refer to `BUILD_GUIDE.md` or check the project documentation.
