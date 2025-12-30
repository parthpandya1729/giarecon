# GIA Frontend - Build Guide

## Quick Start

### Option 1: Quick Build (Recommended for Development)
```powershell
cd SourceCode\frontend
.\BUILD_QUICK.ps1
```

### Option 2: Full Production Build
```powershell
cd SourceCode\frontend
.\BUILD_PRODUCTION.ps1
```

### Option 3: Manual Build
```powershell
cd SourceCode\frontend
npm run build
```

---

## Build Scripts

### BUILD_QUICK.ps1
**Purpose:** Fast build without extensive checks  
**Use Case:** Quick builds during development

```powershell
.\BUILD_QUICK.ps1
```

**What it does:**
- Runs the build command immediately
- Shows success/failure message
- Minimal output

---

### BUILD_PRODUCTION.ps1
**Purpose:** Complete production-ready build with verification  
**Use Case:** Final builds for deployment

```powershell
# Basic usage
.\BUILD_PRODUCTION.ps1

# With options
.\BUILD_PRODUCTION.ps1 -Clean          # Clean before build
.\BUILD_PRODUCTION.ps1 -SkipLint       # Skip linting
.\BUILD_PRODUCTION.ps1 -Preview        # Preview after build
.\BUILD_PRODUCTION.ps1 -Clean -Preview # Clean, build, and preview
```

**What it does:**
1. ✅ Checks prerequisites (Node.js, npm)
2. 🧹 Optionally cleans previous build
3. 📦 Verifies dependencies are installed
4. 🔍 Runs ESLint (optional)
5. 🏗️ Builds production bundle
6. ✔️ Verifies build output
7. 📊 Shows detailed build statistics
8. 🚀 Optionally starts preview server

**Parameters:**
- `-Clean`: Remove previous build before building
- `-SkipLint`: Skip ESLint checks (faster build)
- `-Preview`: Start preview server after successful build

---

## Build Output

After building, you'll find:

```
dist/
├── index.html          # Main HTML file
├── favicon.svg         # Favicon
├── assets/
│   ├── index-[hash].js    # Main JavaScript bundle
│   ├── index-[hash].css   # Main CSS bundle
│   └── [other assets]     # Images, fonts, etc.
└── vite.svg
```

---

## Build Commands Explained

### npm run build
Runs: `tsc && vite build`

**Steps:**
1. **TypeScript Compilation (`tsc`)**: Type-checks all TypeScript files
2. **Vite Build**: Bundles and optimizes for production
   - Minifies JavaScript and CSS
   - Optimizes images
   - Generates source maps
   - Code splitting
   - Tree shaking (removes unused code)

### npm run preview
Serves the built `dist` folder locally at `http://localhost:4173`

**Use this to:**
- Test the production build before deployment
- Verify all assets load correctly
- Check build size and performance

### npm run lint
Runs ESLint to check code quality

---

## Build Troubleshooting

### Error: "node is not recognized"
**Solution:** Install Node.js from https://nodejs.org/ (LTS version recommended)

### Error: "npm install failed"
**Solution:**
```powershell
# Delete node_modules and package-lock.json
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
# Reinstall
npm install
```

### Error: TypeScript errors during build
**Solution:**
```powershell
# Check TypeScript errors without building
npx tsc --noEmit
# Fix the errors shown
```

### Build succeeds but app doesn't work
**Solution:**
```powershell
# Clean build and caches
.\BUILD_PRODUCTION.ps1 -Clean
```

### Build is very slow
**Solution:**
```powershell
# Skip linting to speed up
.\BUILD_PRODUCTION.ps1 -SkipLint
```

---

## Deployment

### Deploy to Web Server

1. **Build the project:**
   ```powershell
   .\BUILD_PRODUCTION.ps1 -Clean
   ```

2. **Upload the `dist` folder** to your web server

3. **Configure your web server** to:
   - Serve `index.html` as the default file
   - Redirect all routes to `index.html` (for client-side routing)

### Deploy to Vercel

```powershell
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel deploy --prod
```

### Deploy to Netlify

```powershell
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

### Deploy to GitHub Pages

```powershell
# Install gh-pages
npm install -D gh-pages

# Add to package.json scripts:
# "deploy": "npm run build && gh-pages -d dist"

# Deploy
npm run deploy
```

---

## Build Configuration

### Vite Config (`vite.config.ts`)

```typescript
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),  // @ = src/
    },
  },
  server: {
    port: 5173,        // Dev server port
  },
})
```

### TypeScript Config (`tsconfig.json`)

Controls TypeScript compilation and type checking

### Tailwind Config (`tailwind.config.ts`)

Controls CSS utility classes and theming

---

## Build Optimization Tips

### 1. Analyze Bundle Size
```powershell
# Install bundle analyzer
npm install -D rollup-plugin-visualizer

# View bundle breakdown
npm run build
# Open stats.html in browser
```

### 2. Reduce Bundle Size
- Use dynamic imports for large components
- Lazy load routes with React.lazy()
- Remove unused dependencies
- Use tree-shakable libraries

### 3. Improve Build Speed
- Use `-SkipLint` flag during development
- Keep dependencies up to date
- Use SSD for faster file operations
- Close unnecessary applications

---

## Environment Variables

Create `.env.production` for production-specific variables:

```env
VITE_API_URL=https://api.production.com
VITE_APP_NAME=GIA Production
```

Access in code:
```typescript
const apiUrl = import.meta.env.VITE_API_URL
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Build and Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm run preview &
      # Add deployment steps
```

---

## Build Checklist

Before deploying to production:

- [ ] Run full build with linting: `.\BUILD_PRODUCTION.ps1 -Clean`
- [ ] Fix all TypeScript errors
- [ ] Fix all ESLint warnings
- [ ] Test the build locally: `npm run preview`
- [ ] Check all pages load correctly
- [ ] Verify API connections work
- [ ] Test responsive design on mobile
- [ ] Check browser console for errors
- [ ] Verify favicon appears correctly
- [ ] Test in multiple browsers (Chrome, Firefox, Safari, Edge)
- [ ] Check network tab for failed requests
- [ ] Verify build size is reasonable (< 5MB ideal)

---

## Quick Reference

| Task | Command |
|------|---------|
| Quick build | `.\BUILD_QUICK.ps1` |
| Production build | `.\BUILD_PRODUCTION.ps1` |
| Clean build | `.\BUILD_PRODUCTION.ps1 -Clean` |
| Build + preview | `.\BUILD_PRODUCTION.ps1 -Preview` |
| Preview existing build | `npm run preview` |
| Development server | `npm run dev` |
| Check types | `npx tsc --noEmit` |
| Lint code | `npm run lint` |

---

## Need Help?

- **Vite Documentation:** https://vitejs.dev/
- **React Documentation:** https://react.dev/
- **TypeScript Documentation:** https://www.typescriptlang.org/
- **Tailwind CSS:** https://tailwindcss.com/

---

**Last Updated:** December 30, 2024  
**Project:** GIA - Generative Intelligence Agent  
**Version:** 0.1.0
