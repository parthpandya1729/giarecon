# Recon MCP Server Build Script
# This script sets up the development environment and installs dependencies

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Recon MCP Server - Build Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to project root
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptPath
Set-Location $projectRoot

Write-Host "Project Root: $projectRoot" -ForegroundColor Yellow
Write-Host ""

# Check Python version
Write-Host "[1/6] Checking Python installation..." -ForegroundColor Green
try {
    $pythonVersion = python --version 2>&1
    Write-Host "Found: $pythonVersion" -ForegroundColor Yellow

    # Extract version number
    if ($pythonVersion -match "Python (\d+)\.(\d+)") {
        $major = [int]$matches[1]
        $minor = [int]$matches[2]

        if ($major -lt 3 -or ($major -eq 3 -and $minor -lt 11)) {
            Write-Host "ERROR: Python 3.11 or higher is required!" -ForegroundColor Red
            Write-Host "Please install Python 3.11+ from https://www.python.org/downloads/" -ForegroundColor Red
            exit 1
        }
    }
} catch {
    Write-Host "ERROR: Python is not installed or not in PATH!" -ForegroundColor Red
    Write-Host "Please install Python 3.11+ from https://www.python.org/downloads/" -ForegroundColor Red
    exit 1
}

Write-Host "Python version check passed!" -ForegroundColor Green
Write-Host ""

# Check/Install UV package manager
Write-Host "[2/6] Checking UV package manager..." -ForegroundColor Green
try {
    $uvVersion = uv --version 2>&1
    Write-Host "Found: $uvVersion" -ForegroundColor Yellow
} catch {
    Write-Host "UV not found. Installing UV..." -ForegroundColor Yellow

    try {
        Invoke-WebRequest -Uri "https://astral.sh/uv/install.ps1" -UseBasicParsing | Invoke-Expression
        Write-Host "UV installed successfully!" -ForegroundColor Green

        # Refresh PATH
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
    } catch {
        Write-Host "ERROR: Failed to install UV package manager!" -ForegroundColor Red
        Write-Host "Please install manually from https://docs.astral.sh/uv/" -ForegroundColor Red
        exit 1
    }
}

Write-Host "UV package manager ready!" -ForegroundColor Green
Write-Host ""

# Create virtual environment
Write-Host "[3/6] Creating virtual environment..." -ForegroundColor Green
if (Test-Path ".venv") {
    Write-Host "Virtual environment already exists. Skipping creation." -ForegroundColor Yellow
} else {
    try {
        uv venv .venv
        Write-Host "Virtual environment created successfully!" -ForegroundColor Green
    } catch {
        Write-Host "ERROR: Failed to create virtual environment!" -ForegroundColor Red
        exit 1
    }
}
Write-Host ""

# Install dependencies
Write-Host "[4/6] Installing dependencies..." -ForegroundColor Green
try {
    uv pip install -r pyproject.toml
    Write-Host "Dependencies installed successfully!" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to install dependencies!" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Setup .env file
Write-Host "[5/6] Setting up environment configuration..." -ForegroundColor Green
if (Test-Path ".env") {
    Write-Host ".env file already exists. Skipping creation." -ForegroundColor Yellow
} else {
    try {
        Copy-Item ".env.example" ".env"
        Write-Host ".env file created from template!" -ForegroundColor Green
        Write-Host "IMPORTANT: Please edit .env file and add your credentials!" -ForegroundColor Yellow
    } catch {
        Write-Host "ERROR: Failed to create .env file!" -ForegroundColor Red
        exit 1
    }
}
Write-Host ""

# Display completion message and setup instructions
Write-Host "[6/6] Build completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Next Steps" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Configure credentials:" -ForegroundColor Yellow
Write-Host "   Edit .env file and set:" -ForegroundColor White
Write-Host "   - RECON_API_BASE_URL" -ForegroundColor White
Write-Host "   - RECON_USERNAME" -ForegroundColor White
Write-Host "   - RECON_PASSWORD" -ForegroundColor White
Write-Host ""
Write-Host "2. Test the server:" -ForegroundColor Yellow
Write-Host "   .\.venv\Scripts\python.exe main.py" -ForegroundColor White
Write-Host ""
Write-Host "3. Integrate with Claude Desktop:" -ForegroundColor Yellow
Write-Host "   Add to: %APPDATA%\Claude\claude_desktop_config.json" -ForegroundColor White
Write-Host ""
Write-Host "   {" -ForegroundColor Gray
Write-Host "     `"mcpServers`": {" -ForegroundColor Gray
Write-Host "       `"recon`": {" -ForegroundColor Gray
Write-Host "         `"command`": `"python`"," -ForegroundColor Gray
Write-Host "         `"args`": [`"$projectRoot\main.py`"]," -ForegroundColor Gray
Write-Host "         `"env`": {" -ForegroundColor Gray
Write-Host "           `"PYTHONPATH`": `"$projectRoot`"" -ForegroundColor Gray
Write-Host "         }" -ForegroundColor Gray
Write-Host "       }" -ForegroundColor Gray
Write-Host "     }" -ForegroundColor Gray
Write-Host "   }" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Restart Claude Desktop to load the MCP server" -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "For more information, see README.md" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
