#!/bin/bash
echo "Building Email Bridge..."

# Set environment variables
export CGO_ENABLED=1

# Navigate to project root
cd "$(dirname "$0")/.."

# Create bin directory if it doesn't exist
mkdir -p bin

# Build the application
go build -o bin/email-bridge cmd/server/main.go

if [ $? -eq 0 ]; then
    echo "Build successful! Binary located at bin/email-bridge"
else
    echo "Build failed with error code $?"
fi