# Benow Rebrand Verification Script
# Searches for remaining cyberpunk/neon references in the codebase

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Benow Rebrand Verification Script" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

$searchPatterns = @(
    "cyber-",
    "neon-",
    "glass-",
    "holographic",
    "gradient-neon",
    "gradient-cyber",
    "shadow-neon",
    "text-neon",
    "bg-gradient-cyber",
    "bg-gradient-neon",
    "import GlassCard",
    "import NeonButton",
    "from './GlassCard'",
    "from './NeonButton'"
)

$fileExtensions = @("*.tsx", "*.ts", "*.css", "*.json")
$excludePaths = @("node_modules", "dist", "build", ".git", "coverage")

$totalIssues = 0
$issuesByPattern = @{}

foreach ($pattern in $searchPatterns) {
    Write-Host "Searching for: $pattern" -ForegroundColor Yellow

    $results = Get-ChildItem -Path . -Recurse -Include $fileExtensions -ErrorAction SilentlyContinue |
        Where-Object {
            $file = $_
            -not ($excludePaths | Where-Object { $file.FullName -like "*\$_\*" })
        } |
        Select-String -Pattern $pattern -CaseSensitive:$false |
        Select-Object Path, LineNumber, Line

    if ($results) {
        $count = ($results | Measure-Object).Count
        $totalIssues += $count
        $issuesByPattern[$pattern] = $count

        Write-Host "  Found $count occurrence(s):" -ForegroundColor Red

        foreach ($result in $results) {
            $relativePath = Resolve-Path -Relative $result.Path
            Write-Host "    $relativePath`:$($result.LineNumber)" -ForegroundColor Gray
            Write-Host "      $($result.Line.Trim())" -ForegroundColor DarkGray
        }
        Write-Host ""
    } else {
        Write-Host "  ✓ No occurrences found" -ForegroundColor Green
        Write-Host ""
    }
}

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Summary" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

if ($totalIssues -eq 0) {
    Write-Host "✓ All clear! No cyberpunk references found." -ForegroundColor Green
    Write-Host "✓ Benow rebrand verification PASSED." -ForegroundColor Green
} else {
    Write-Host "⚠ Found $totalIssues total issue(s) across patterns:" -ForegroundColor Yellow
    Write-Host ""

    foreach ($pattern in $issuesByPattern.Keys) {
        Write-Host "  - $pattern`: $($issuesByPattern[$pattern]) occurrence(s)" -ForegroundColor Red
    }

    Write-Host ""
    Write-Host "Please review and update the files listed above." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Additional Checks" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

# Check if deprecated components still exist
Write-Host "Checking for deprecated component files..." -ForegroundColor Yellow

$deprecatedFiles = @(
    "src\shared\components\GlassCard.tsx",
    "src\shared\components\NeonButton.tsx",
    "src\styles\cyberpunk.css"
)

foreach ($file in $deprecatedFiles) {
    if (Test-Path $file) {
        Write-Host "  ⚠ Found: $file" -ForegroundColor Yellow
        Write-Host "    (This file should be removed or kept as deprecated wrapper)" -ForegroundColor Gray
    } else {
        Write-Host "  ✓ $file not found (or already removed)" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Benow Brand Checks" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

# Check for Benow branding usage
Write-Host "Checking for Benow brand usage..." -ForegroundColor Yellow

$benowBrandPatterns = @("benow-blue", "https://www.benow.in/assets/img/logo.png")

foreach ($pattern in $benowBrandPatterns) {
    $results = Get-ChildItem -Path . -Recurse -Include $fileExtensions -ErrorAction SilentlyContinue |
        Where-Object {
            $file = $_
            -not ($excludePaths | Where-Object { $file.FullName -like "*\$_\*" })
        } |
        Select-String -Pattern $pattern -CaseSensitive:$false

    if ($results) {
        $count = ($results | Measure-Object).Count
        Write-Host "  ✓ Found '$pattern' in $count file(s)" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ '$pattern' not found - check if Benow branding is applied" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Verification complete!" -ForegroundColor Cyan
Write-Host ""

# Exit code based on results
if ($totalIssues -eq 0) {
    exit 0
} else {
    exit 1
}
