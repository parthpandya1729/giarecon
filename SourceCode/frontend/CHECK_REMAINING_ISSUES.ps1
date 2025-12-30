# ============================================
# CHECK REMAINING ISSUES
# ============================================
# This script searches for any remaining type imports
# that should use "import type" syntax
# ============================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CHECKING FOR REMAINING TYPE IMPORTS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

Write-Host "[Step 1/3] Searching for type file imports without 'import type'..." -ForegroundColor Yellow
Write-Host ""

# Search for imports from type files
Write-Host "Checking imports from @/types/..." -ForegroundColor Gray
$typeImports = Select-String -Path "src/**/*.ts", "src/**/*.tsx" -Pattern "^import \{[^}]*\} from ['`"]@/types/" -Exclude "*.d.ts"

if ($typeImports) {
    Write-Host "  Found potential issues:" -ForegroundColor Red
    $typeImports | ForEach-Object {
        Write-Host "    $($_.Path):$($_.LineNumber) - $($_.Line.Trim())" -ForegroundColor Yellow
    }
    Write-Host ""
} else {
    Write-Host "  No issues found in @/types imports" -ForegroundColor Green
    Write-Host ""
}

Write-Host "[Step 2/3] Checking imports from mock files..." -ForegroundColor Yellow
Write-Host ""

# Search for imports of interfaces/types from mocks
Write-Host "Checking imports from @/mocks/data/..." -ForegroundColor Gray
$mockImports = Select-String -Path "src/**/*.ts", "src/**/*.tsx" -Pattern "^import \{[^}]*\} from ['`"]@/mocks/data/(kpis|workspaces|configs|logs|chatHistory)" -Exclude "*.d.ts"

$issuesFound = $false
if ($mockImports) {
    foreach ($import in $mockImports) {
        # Check if it's importing types/interfaces (common patterns)
        if ($import.Line -match "(KPIMetric|SystemHealth|QuickAction|RecentActivity|DashboardKPIs|Workspace|WorkspaceStats|FileInfo|ChatMessage|ChatThread|ReconciliationConfig|LogEntry|LogStats)") {
            if ($import.Line -notmatch "^import type") {
                Write-Host "  Potential issue:" -ForegroundColor Red
                Write-Host "    $($import.Path):$($import.LineNumber) - $($import.Line.Trim())" -ForegroundColor Yellow
                $issuesFound = $true
            }
        }
    }
}

if (-not $issuesFound) {
    Write-Host "  No issues found in @/mocks imports" -ForegroundColor Green
}
Write-Host ""

Write-Host "[Step 3/4] Checking external library type imports..." -ForegroundColor Yellow
Write-Host ""

# Check for LucideIcon imports (common type from lucide-react)
Write-Host "Checking LucideIcon imports from lucide-react..." -ForegroundColor Gray
$lucideIconImports = Select-String -Path "src/**/*.ts", "src/**/*.tsx" -Pattern "import \{[^}]*LucideIcon[^}]*\} from ['`"]lucide-react" -Exclude "*.d.ts"

$externalIssuesFound = $false
if ($lucideIconImports) {
    foreach ($import in $lucideIconImports) {
        if ($import.Line -notmatch "^import type") {
            Write-Host "  Potential issue:" -ForegroundColor Red
            Write-Host "    $($import.Path):$($import.LineNumber) - $($import.Line.Trim())" -ForegroundColor Yellow
            $externalIssuesFound = $true
        }
    }
}

if (-not $externalIssuesFound) {
    Write-Host "  No issues found in external library imports" -ForegroundColor Green
}
Write-Host ""

Write-Host "[Step 4/4] Summary" -ForegroundColor Yellow
Write-Host ""

if ($typeImports -or $issuesFound -or $externalIssuesFound) {
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "  ISSUES FOUND!" -ForegroundColor Red
    Write-Host "  Please review the imports listed above" -ForegroundColor Red
    Write-Host "  and convert them to 'import type' syntax" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    exit 1
} else {
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  ALL CHECKS PASSED!" -ForegroundColor Green
    Write-Host "  No remaining type import issues found" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now run VERIFY_FIX.ps1 to test the build" -ForegroundColor Cyan
}
