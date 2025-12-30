# Troubleshooting Guide

## Module Import Error: "does not provide an export named 'BaseEntity'"

### Problem
```
Uncaught SyntaxError: The requested module '/src/types/common.types.ts'
does not provide an export named 'BaseEntity' (at chat.types.ts:1:10)
```

### Root Cause
Vite's dev server has cached old module metadata and hasn't recognized the new TypeScript type files.

---

## ✅ COMPLETE SOLUTION (Follow in Order)

### Step 1: Run Diagnostic
```powershell
./diagnose.ps1
```

This will check:
- All type files exist
- Exports are correct
- Dependencies are installed
- Cache status

### Step 2: Restart Dev Server Properly
```powershell
./restart-dev.ps1
```

This script will:
1. Kill any running Node processes
2. Clear all Vite caches
3. Clear npm cache
4. Verify all TypeScript files
5. Start clean dev server

### Step 3: Hard Refresh Browser
After the dev server starts:

**Chrome/Edge:**
- Press `Ctrl + Shift + R`
- OR `F12` → Network tab → Check "Disable cache" → Reload

**Firefox:**
- Press `Ctrl + F5`

---

## Alternative: Manual Steps

If scripts don't work, run these commands manually:

### 1. Stop Dev Server
```powershell
# Press Ctrl+C in terminal running dev server
```

### 2. Kill All Node Processes
```powershell
Get-Process -Name "node" | Stop-Process -Force
```

### 3. Clear Caches
```powershell
Remove-Item -Recurse -Force node_modules/.vite
Remove-Item -Recurse -Force .vite
Remove-Item -Recurse -Force dist
npm cache clean --force
```

### 4. Start Dev Server
```powershell
npm run dev
```

---

## Nuclear Option (Last Resort)

If nothing works, completely reinstall:

```powershell
# Stop dev server
Get-Process -Name "node" | Stop-Process -Force

# Remove everything
Remove-Item -Recurse -Force node_modules
Remove-Item -Recurse -Force dist
Remove-Item -Recurse -Force .vite

# Reinstall
npm install

# Start
npm run dev
```

---

## Verification Checklist

After fixing, verify these work:

### ✓ Dev Server
- [ ] No errors in terminal
- [ ] Shows: `Local: http://localhost:5173/`
- [ ] No TypeScript errors

### ✓ Browser
- [ ] No console errors
- [ ] Page loads with cyberpunk background
- [ ] Sidebar visible on left
- [ ] Dashboard shows KPI cards
- [ ] Chat button visible (bottom-right)

### ✓ Navigation
- [ ] http://localhost:5173/ - Dashboard
- [ ] http://localhost:5173/workspaces - Workspaces page
- [ ] http://localhost:5173/logs - Logs page
- [ ] Click chat button - Opens chat overlay

---

## Common Issues & Fixes

### Issue: "Port 5173 already in use"
```powershell
# Find and kill process on port 5173
netstat -ano | findstr :5173
# Note the PID, then:
taskkill /PID <PID> /F
```

### Issue: "Cannot find module '@/types/...'"
```powershell
# Verify vite.config.ts has path alias
# Should contain:
resolve: {
  alias: {
    "@": path.resolve(__dirname, "./src"),
  },
}
```

### Issue: TypeScript errors about missing types
```powershell
# Ensure tsconfig.app.json has:
"baseUrl": ".",
"paths": {
  "@/*": ["./src/*"]
}
```

### Issue: Blank white screen
1. Open browser DevTools (F12)
2. Check Console for errors
3. Check Network tab for failed requests
4. Hard refresh (Ctrl+Shift+R)

---

## Files Created

The following files help with troubleshooting:

- `diagnose.ps1` - Comprehensive health check
- `restart-dev.ps1` - Clean restart with cache clearing
- `clear-cache.ps1` - Just clear caches
- `TROUBLESHOOTING.md` - This file

---

## Still Not Working?

If you've tried everything above and still have issues:

1. **Verify file contents:**
   ```powershell
   cat src/types/common.types.ts | Select-String "BaseEntity"
   ```
   Should show: `export interface BaseEntity {`

2. **Check TypeScript compilation:**
   ```powershell
   npx tsc --noEmit
   ```
   Should have no errors

3. **Verify Vite can see the files:**
   ```powershell
   npm run dev -- --debug
   ```
   Watch for module resolution logs

4. **Check for file permission issues:**
   ```powershell
   icacls src/types/common.types.ts
   ```
   Ensure you have read permissions

---

## Success Indicators

You've successfully fixed the issue when:

✅ Dev server starts without errors
✅ Browser console is clean
✅ Application loads with animations
✅ All pages navigate correctly
✅ Chat opens when clicking chat button
✅ No module import errors

---

Last Updated: 2025-12-29
