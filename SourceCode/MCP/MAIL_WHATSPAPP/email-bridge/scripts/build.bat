@echo off
echo Building Email Bridge...

set GOOS=windows
set GOARCH=amd64
set CGO_ENABLED=1

cd %~dp0\..
go build -o bin\email-bridge.exe cmd\server\main.go

if %ERRORLEVEL% EQU 0 (
    echo Build successful! Binary located at bin\email-bridge.exe
) else (
    echo Build failed with error code %ERRORLEVEL%
)