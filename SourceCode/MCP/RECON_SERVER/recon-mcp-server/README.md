# Recon MCP Server

A Model Context Protocol (MCP) server that provides AI assistants with tools to interact with the Benow Recon API for automated reconciliation operations.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [MCP Tools Reference](#mcp-tools-reference)
- [Complete Workflow Example](#complete-workflow-example)
- [Claude Desktop Integration](#claude-desktop-integration)
- [API Endpoint Mapping](#api-endpoint-mapping)
- [Troubleshooting](#troubleshooting)
- [Development](#development)
- [License](#license)

## Overview

Recon MCP Server enables AI assistants (like Claude) to automate reconciliation workflows using the Benow Recon API. It provides 6 core MCP tools that cover the complete reconciliation lifecycle:

1. Authentication
2. File upload
3. Field mapping configuration
4. Reconciliation execution
5. Status monitoring
6. Results download

This server is part of the GIA (Generative Intelligence Agent) project for Samsung reconciliation automation.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Claude Desktop                            │
│                    (AI Assistant Interface)                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ MCP Protocol (stdio)
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    Recon MCP Server (FastMCP)                    │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │   main.py   │  │  config.py   │  │   recon_api.py         │ │
│  │ (6 MCP      │  │  (Samsung    │  │   (ReconAPIClient)     │ │
│  │  Tools)     │  │   Template)  │  │   (8 Methods)          │ │
│  └─────────────┘  └──────────────┘  └────────────────────────┘ │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTPS/REST API
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    Benow Recon API                               │
│            https://recon.benow.in/api/recon                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │  Auth    │  │  Upload  │  │  Mapping │  │  Recon   │        │
│  │ Service  │  │ Service  │  │ Service  │  │ Service  │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

## Features

- **JWT Authentication**: Secure token-based authentication with automatic expiration management
- **File Upload**: Upload two Excel files for reconciliation with multipart/form-data support
- **Field Mapping**: Configure column mappings between files (Samsung template pre-configured)
- **Reconciliation Execution**: Run reconciliation operations asynchronously
- **Status Monitoring**: Check progress and status of running reconciliations
- **Results Download**: Download reconciliation results as Excel files
- **Comprehensive Logging**: All operations logged to `recon_mcp.log` with timestamps
- **Error Handling**: Structured error responses with detailed messages
- **Automatic Token Refresh**: Token validity checked before each API call

## Requirements

- Python 3.11 or higher
- UV package manager (will be installed automatically by build script)
- Benow Recon API credentials (username and password)
- Windows OS (for PowerShell build script)

## Installation

### Option 1: Automated Installation (Recommended)

1. Clone the repository and navigate to the project directory:

```powershell
cd SourceCode/MCP/RECON_SERVER/recon-mcp-server
```

2. Run the build script:

```powershell
.\scripts\build.ps1
```

The script will:
- Check Python installation (3.11+)
- Install UV package manager if needed
- Create virtual environment (.venv)
- Install all dependencies
- Create .env file from template
- Display setup instructions

### Option 2: Manual Installation

1. Check Python version:

```powershell
python --version  # Should be 3.11 or higher
```

2. Install UV package manager:

```powershell
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
```

3. Create virtual environment:

```powershell
uv venv .venv
```

4. Install dependencies:

```powershell
uv pip install -r pyproject.toml
```

5. Create .env file:

```powershell
Copy-Item .env.example .env
```

## Configuration

### Environment Variables

Edit the `.env` file and configure the following variables:

```env
# API Base URL (choose one)
# Production: https://recon.benow.in/api/recon
# Development: http://13.201.0.183:8000/api/recon
RECON_API_BASE_URL=https://recon.benow.in/api/recon

# Authentication Credentials
RECON_USERNAME=your_username_here
RECON_PASSWORD=your_password_here

# Optional: Debug mode
DEBUG=false
```

### Samsung Field Mapping Template

The server includes a pre-configured Samsung template with 10 field mappings:

| File 1 Column              | File 2 Column              | Primary Key |
|----------------------------|----------------------------|-------------|
| txn_ref_number             | Transaction Reference      | Yes         |
| TRANSACTIONAMOUNT          | Paid Amount                | No          |
| product_amount             | MRP                        | No          |
| PRODUCT_CATEGORY           | PRODUCT_CATEGORY           | No          |
| Tenure                     | Tenure                     | No          |
| RATE_OF_INTEREST____P_A_   | RATE_OF_INTEREST____P_A_   | No          |
| EMI_AMOUNT                 | EMI_AMOUNT                 | No          |
| LOAN_AMOUNT                | LOAN_AMOUNT                | No          |
| Brand share                | Correct brand share        | No          |
| Bank share                 | Correct bank share         | No          |

## Usage

### Standalone Testing

Run the server directly to test configuration:

```powershell
.\.venv\Scripts\python.exe main.py
```

The server will:
- Validate configuration
- Display any errors or warnings
- Attempt automatic authentication (if credentials are set)
- Start listening on stdio transport

### With Claude Desktop

See [Claude Desktop Integration](#claude-desktop-integration) section below.

## MCP Tools Reference

### 1. authenticate

Authenticate with the Benow Recon API and obtain JWT token.

**Parameters:**
- `username` (string, required): Email or username for authentication
- `password` (string, required): Password for authentication

**Returns:**
```json
{
  "success": true,
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

**Example:**
```
Please authenticate with username "user@example.com" and password "password123"
```

**Notes:**
- Must be called first before using other tools
- Token expires after 1 hour
- Token is automatically used for subsequent API calls

---

### 2. upload_files

Upload two Excel files to create a reconciliation workspace.

**Parameters:**
- `file1_path` (string, required): Absolute path to first Excel file
- `file2_path` (string, required): Absolute path to second Excel file
- `config_name` (string, required): Name for the reconciliation configuration

**Returns:**
```json
{
  "success": true,
  "workspace_id": "ws_abc123def456",
  "config_id": "cfg_xyz789ghi012",
  "message": "Files uploaded successfully"
}
```

**Example:**
```
Please upload files:
- File 1: C:/data/samsung_dec_2025.xlsx
- File 2: C:/data/bank_dec_2025.xlsx
- Config name: Samsung_Dec_2025
```

**Notes:**
- Both files must exist at specified paths
- Files must be Excel format (.xlsx)
- Save workspace_id and config_id for subsequent operations

---

### 3. set_field_mapping

Configure field mappings between the two uploaded Excel files.

**Parameters:**
- `workspace_id` (string, required): Workspace identifier from upload_files
- `config_id` (string, required): Configuration identifier from upload_files
- `use_samsung_template` (boolean, optional): Use Samsung template (default: true)
- `custom_mappings` (object, optional): Custom mapping dictionary (if not using template)

**Returns:**
```json
{
  "success": true,
  "message": "Field mappings configured successfully"
}
```

**Example (with Samsung template):**
```
Please configure field mappings for workspace ws_abc123def456
and config cfg_xyz789ghi012 using the Samsung template
```

**Example (with custom mappings):**
```
Please configure custom field mappings for workspace ws_abc123def456
and config cfg_xyz789ghi012 with the following mappings:
- id -> reference (primary key)
- amount -> total
```

**Notes:**
- Samsung template includes 10 pre-configured field mappings
- Primary key is required for matching records
- Custom mappings must follow the structure in config.py

---

### 4. run_reconciliation

Execute reconciliation using the configured field mappings.

**Parameters:**
- `config_id` (string, required): Configuration identifier from upload_files
- `file1_path` (string, required): Absolute path to first Excel file
- `file2_path` (string, required): Absolute path to second Excel file

**Returns:**
```json
{
  "success": true,
  "workspace_id": "ws_abc123def456",
  "message": "Reconciliation started successfully"
}
```

**Example:**
```
Please run reconciliation with config cfg_xyz789ghi012 using files:
- File 1: C:/data/samsung_dec_2025.xlsx
- File 2: C:/data/bank_dec_2025.xlsx
```

**Notes:**
- Operation is asynchronous - returns immediately
- Use check_reconciliation_status to monitor progress
- Files must be the same as used in upload_files

---

### 5. check_reconciliation_status

Check the status and progress of a reconciliation operation.

**Parameters:**
- `workspace_id` (string, required): Workspace identifier

**Returns:**
```json
{
  "success": true,
  "status": "completed",
  "progress": 100,
  "message": "Reconciliation completed successfully"
}
```

**Status values:**
- `running`: Reconciliation is in progress
- `completed`: Reconciliation finished successfully
- `failed`: Reconciliation encountered an error

**Example:**
```
Please check the status of reconciliation for workspace ws_abc123def456
```

**Notes:**
- Call periodically to monitor progress (e.g., every 5-10 seconds)
- When status is "completed", call download_results
- Progress is a percentage from 0 to 100

---

### 6. download_results

Download reconciliation results as an Excel file.

**Parameters:**
- `workspace_id` (string, required): Workspace identifier
- `output_path` (string, required): Absolute path where to save results

**Returns:**
```json
{
  "success": true,
  "file_path": "C:/results/samsung_dec_2025_results.xlsx",
  "file_size": 2048576
}
```

**Example:**
```
Please download results for workspace ws_abc123def456
and save to C:/results/samsung_dec_2025_results.xlsx
```

**Notes:**
- Only call after reconciliation status is "completed"
- Directory will be created if it doesn't exist
- Results include matched, unmatched, and discrepancy data

## Complete Workflow Example

Here's a complete example of using all tools in sequence:

### Step 1: Authenticate

```
User: Please authenticate with the Recon API using credentials from .env file
```

Expected response:
```
Authentication successful! Token expires in 3600 seconds.
```

### Step 2: Upload Files

```
User: Upload these files for reconciliation:
- Samsung data: C:/data/samsung_dec_2025.xlsx
- Bank data: C:/data/bank_dec_2025.xlsx
- Configuration name: Samsung_Dec_2025
```

Expected response:
```
Files uploaded successfully!
Workspace ID: ws_abc123def456
Config ID: cfg_xyz789ghi012
```

### Step 3: Configure Field Mappings

```
User: Configure field mappings using the Samsung template for
workspace ws_abc123def456 and config cfg_xyz789ghi012
```

Expected response:
```
Field mappings configured successfully using Samsung template
with 10 field mappings including primary key (txn_ref_number).
```

### Step 4: Run Reconciliation

```
User: Run reconciliation with config cfg_xyz789ghi012 using the same files
```

Expected response:
```
Reconciliation started successfully!
Workspace ID: ws_abc123def456
Use this ID to monitor progress.
```

### Step 5: Monitor Progress

```
User: Check the status of reconciliation for workspace ws_abc123def456
```

Expected responses (poll every 5-10 seconds):
```
Status: running, Progress: 45%
Status: running, Progress: 78%
Status: completed, Progress: 100%
```

### Step 6: Download Results

```
User: Download results for workspace ws_abc123def456
and save to C:/results/samsung_dec_2025_results.xlsx
```

Expected response:
```
Results downloaded successfully!
File saved to: C:/results/samsung_dec_2025_results.xlsx
File size: 2048576 bytes (2.0 MB)
```

## Claude Desktop Integration

### Configuration

1. Locate your Claude Desktop configuration file:
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
   - Mac: `~/Library/Application Support/Claude/claude_desktop_config.json`

2. Add the Recon MCP Server configuration:

```json
{
  "mcpServers": {
    "recon": {
      "command": "python",
      "args": [
        "C:/projects/cashless/giarecon/SourceCode/MCP/RECON_SERVER/recon-mcp-server/main.py"
      ],
      "env": {
        "PYTHONPATH": "C:/projects/cashless/giarecon/SourceCode/MCP/RECON_SERVER/recon-mcp-server"
      }
    }
  }
}
```

**Important:** Replace the paths with your actual project location.

3. Restart Claude Desktop

4. Verify integration:
   - Ask Claude: "What Recon tools are available?"
   - Claude should list all 6 MCP tools

### Example Conversation

```
User: I need to run a reconciliation for Samsung data.
The files are at C:/data/samsung_dec_2025.xlsx and C:/data/bank_dec_2025.xlsx

Claude: I'll help you run a reconciliation. Let me start by authenticating
with the Recon API and then upload your files.

[Claude calls authenticate tool]
[Claude calls upload_files tool]
[Claude calls set_field_mapping tool with Samsung template]
[Claude calls run_reconciliation tool]
[Claude polls check_reconciliation_status until completed]
[Claude calls download_results tool]

Claude: Reconciliation completed successfully! I've downloaded the results
to C:/results/samsung_dec_2025_results.xlsx. The file contains:
- Matched records
- Unmatched records from both files
- Discrepancy analysis
- Summary statistics
```

## API Endpoint Mapping

| MCP Tool                    | HTTP Method | API Endpoint                                      | Notes                           |
|-----------------------------|-------------|---------------------------------------------------|----------------------------------|
| authenticate                | POST        | `/auth/login`                                     | Form-urlencoded                 |
| upload_files                | POST        | `/workspaces/upload`                              | Multipart/form-data             |
| set_field_mapping           | POST        | `/field-mapping/{workspace_id}/{config_id}`       | JSON body                       |
| run_reconciliation          | POST        | `/auto-recon/{config_id}`                         | Multipart/form-data             |
| check_reconciliation_status | GET         | `/workspaces/{workspace_id}/status`               | No body                         |
| download_results            | GET         | `/workspaces/{workspace_id}/download`             | Streaming response              |

## Troubleshooting

### Authentication Errors

**Problem:** "Authentication failed with status 401"

**Solutions:**
- Verify credentials in .env file are correct
- Check if API base URL is correct (production vs development)
- Ensure username and password have no extra whitespace

---

**Problem:** "No valid authentication token"

**Solutions:**
- Call `authenticate` tool first before other tools
- Token may have expired (valid for 1 hour) - re-authenticate
- Check if token_expiration was set correctly

### File Upload Errors

**Problem:** "File not found: /path/to/file.xlsx"

**Solutions:**
- Verify file path is absolute, not relative
- Check if file exists at the specified location
- Ensure file has .xlsx extension
- Check file permissions (read access required)

---

**Problem:** "Upload failed with status 413"

**Solutions:**
- File size may be too large (check API limits)
- Try compressing Excel file or reducing data
- Contact API administrator for size limit increase

### Field Mapping Errors

**Problem:** "Field mapping failed with status 400"

**Solutions:**
- Verify workspace_id and config_id are correct
- Check if column names in mapping match actual Excel columns
- Ensure at least one field is marked as primary key
- Validate mapping structure against config.py example

### Reconciliation Errors

**Problem:** "Reconciliation failed with status 404"

**Solutions:**
- Verify config_id is correct
- Check if field mappings were set before running reconciliation
- Ensure files used are the same as uploaded

---

**Problem:** Status stuck at "running" for long time

**Solutions:**
- Large files may take 5-10 minutes to process
- Check API server status (may be overloaded)
- Wait for status to change to "completed" or "failed"
- Check recon_mcp.log for detailed error messages

### Download Errors

**Problem:** "Download failed with status 404"

**Solutions:**
- Verify workspace_id is correct
- Ensure reconciliation status is "completed" before downloading
- Check if results have expired (may have TTL on server)

---

**Problem:** "File I/O error: Permission denied"

**Solutions:**
- Check write permissions for output directory
- Close output file if already open in Excel
- Try different output path
- Run with administrator privileges if needed

### Network Errors

**Problem:** "Network error during [operation]: Connection timeout"

**Solutions:**
- Check internet connection
- Verify API base URL is accessible
- Check firewall/proxy settings
- Increase timeout in recon_api.py (default: 30-120 seconds)

---

**Problem:** "SSL Certificate verification failed"

**Solutions:**
- For development environment, may need to disable SSL verification (not recommended for production)
- Update system CA certificates
- Contact API administrator about certificate issues

### Configuration Errors

**Problem:** Build script fails with "Python 3.11 or higher is required"

**Solutions:**
- Install Python 3.11+ from https://www.python.org/downloads/
- Ensure Python is added to PATH during installation
- Restart terminal after installation

---

**Problem:** "UV not found" or UV installation fails

**Solutions:**
- Install UV manually: `powershell -c "irm https://astral.sh/uv/install.ps1 | iex"`
- Restart terminal to refresh PATH
- Check internet connection
- Visit https://docs.astral.sh/uv/ for alternative installation methods

### Logging and Debugging

All operations are logged to `recon_mcp.log` with timestamps. Check this file for detailed error messages and stack traces.

Enable debug mode in .env:
```env
DEBUG=true
```

This will provide more verbose logging output.

## Development

### Project Structure

```
recon-mcp-server/
├── main.py                 # FastMCP server with 6 MCP tools
├── recon_api.py            # ReconAPIClient class (HTTP API wrapper)
├── config.py               # Configuration and Samsung template
├── pyproject.toml          # Dependencies and project metadata
├── .python-version         # Python version specification (3.11)
├── .env                    # Environment variables (gitignored)
├── .env.example            # Environment variables template
├── .gitignore              # Git exclusions
├── README.md               # This file
├── recon_mcp.log           # Operation logs (gitignored)
├── scripts/
│   └── build.ps1           # Build automation script
└── .venv/                  # Virtual environment (gitignored)
```

### Adding New Tools

To add a new MCP tool:

1. Add method to `ReconAPIClient` class in `recon_api.py`
2. Add MCP tool decorator in `main.py`:

```python
@mcp.tool()
def new_tool_name(param1: str, param2: int) -> Dict[str, Any]:
    """
    Comprehensive docstring with examples.
    """
    return api_client.new_method(param1, param2)
```

3. Update README.md with tool documentation
4. Test thoroughly before deployment

### Testing

```powershell
# Run server standalone
.\.venv\Scripts\python.exe main.py

# Test configuration
.\.venv\Scripts\python.exe -c "from config import validate_config; print(validate_config())"

# Test authentication
.\.venv\Scripts\python.exe -c "from recon_api import ReconAPIClient; from config import API_BASE_URL, USERNAME, PASSWORD; client = ReconAPIClient(API_BASE_URL); print(client.authenticate(USERNAME, PASSWORD))"
```

## License

MIT License - See LICENSE file for details

---

For support or questions, please contact the development team or refer to the GIA project documentation in `/Requirement/CLAUDE.md`.
