@echo off
echo Building Email MCP Server...

cd %~dp0\..

:: Create virtual environment if it doesn't exist
if not exist .venv (
    echo Creating virtual environment...
    python -m venv .venv
)

:: Activate virtual environment
call .venv\Scripts\activate.bat

:: Install dependencies
echo Installing dependencies...
pip install -e .

echo Build complete! Run the server with: python main.py