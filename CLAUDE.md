# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**GIA (Generative Intelligence Agent)** is an intelligent reconciliation automation system for Samsung, built on the Benow Recon platform. The system automates the monthly reconciliation workflow by monitoring emails, processing data through the Benow platform, and notifying stakeholders without manual intervention.

### Project Scope

- **Client**: Samsung (via Benow)
- **Timeline**: 30 days (December 22, 2025 - January 30, 2026)
- **Goal**: Automate Samsung's monthly reconciliation workflow with 70-80% reduction in manual effort
- **Success Criteria**: >99% accuracy, <1-2 minutes processing time for 400K records, 100% action logging

### System Components

1. **Email MCP Server** (`SourceCode/MCP/MAIL_WHATSPAPP/email-mcp-server/`)
   - 24/7 monitoring of designated inbox (gia@benow.in)
   - Automated Excel attachment extraction
   - Email composition and notification sending
   - Context-aware communication management

2. **Recon MCP Server** (To be developed)
   - Complete integration with Benow Recon API (16+ endpoints)
   - Automated file upload and workspace creation
   - Field mapping and validation rule configuration
   - Reconciliation job triggering and monitoring
   - Result retrieval and parsing

3. **Orchestration Agent** (To be developed)
   - Workflow coordination across all MCP servers
   - Decision-making based on reconciliation outputs
   - Error handling and recovery
   - Task scheduling and execution

4. **Chat-Based UI** (To be developed)
   - Natural language interaction with agent
   - Real-time status monitoring
   - Manual trigger capability
   - Mobile-responsive React 18 + Tailwind CSS interface

5. **Agent Logs & Monitoring** (To be developed)
   - Comprehensive activity logs with timestamps
   - Real-time log viewer with filtering
   - Export capability for auditing
   - Complete audit trail for compliance

### Technology Stack

- **Backend**: Python 3.11+, FastAPI, FastMCP
- **MCP Framework**: Model Context Protocol for modularity
- **Email**: IMAP/SMTP via Email Bridge (Go) + Email MCP Server (Python)
- **Frontend**: React 18, Tailwind CSS, WebSocket for real-time updates
- **Infrastructure**: Cloud platform (Railway/Render), TLS 1.3, JWT authentication
- **Logging**: Structured JSON logs

### Supporting Infrastructure

The project includes existing WhatsApp/Email communication bridges:

1. **WhatsApp Bridge** (`SourceCode/MCP/MAIL_WHATSPAPP/whatsapp-bridge/`) - Go service connecting to WhatsApp Web API
2. **Email Bridge** (`SourceCode/MCP/MAIL_WHATSPAPP/email-bridge/`) - Go service for IMAP/SMTP operations
3. **WhatsApp MCP Server** (`SourceCode/MCP/MAIL_WHATSPAPP/whatsapp-mcp-server/`) - Python MCP server for WhatsApp tools

The architecture implements Model Context Protocol (MCP) to allow AI agents to interact with various services through standardized tools.

## Build Commands

### Windows Environment

This project is designed for Windows development with PowerShell scripts. **DO NOT run commands on WSL** - generate PowerShell (.ps1) scripts for execution on Windows.

#### WhatsApp Bridge (Go)

```powershell
# Navigate to whatsapp-bridge directory
cd SourceCode\MCP\MAIL_WHATSPAPP\whatsapp-bridge

# Enable CGO (required for go-sqlite3 on Windows)
$env:CGO_ENABLED=1

# Run the bridge
go run main.go

# Build executable
go build -o bin\whatsapp-bridge.exe main.go
```

**Important**: On Windows, CGO must be enabled and a C compiler (MinGW via MSYS2) must be installed for SQLite support.

#### Email Bridge (Go)

```powershell
# Build using the provided script
cd SourceCode\MCP\MAIL_WHATSPAPP\email-bridge
.\scripts\build.bat

# Or manually
$env:GOOS="windows"
$env:GOARCH="amd64"
$env:CGO_ENABLED=1
go build -o bin\email-bridge.exe cmd\server\main.go
```

#### WhatsApp MCP Server (Python)

```powershell
cd SourceCode\MCP\MAIL_WHATSPAPP\whatsapp-mcp-server

# Using uv (recommended)
uv run main.py

# Or with virtual environment
python -m venv .venv
.\.venv\Scripts\activate
pip install -e .
python main.py
```

#### Email MCP Server (Python)

```powershell
cd SourceCode\MCP\MAIL_WHATSPAPP\email-mcp-server

# Build dependencies
.\scripts\build.bat

# Run server
python main.py
```

### Testing

```powershell
# Go tests (run from respective bridge directories)
go test ./...
go test -v ./internal/client/...  # Specific package

# Python tests (if implemented)
pytest
pytest tests/test_specific.py -v
```

## Architecture Overview

### Data Flow

1. **WhatsApp Flow**:
   - WhatsApp Bridge → WhatsApp Web API (via whatsmeow library)
   - WhatsApp Bridge → SQLite (`store/whatsapp.db` for sessions, `store/messages.db` for history)
   - WhatsApp MCP Server → WhatsApp Bridge (HTTP API on port 8080)
   - AI Assistant → WhatsApp MCP Server (MCP protocol)

2. **Email Flow**:
   - Email Bridge → IMAP/SMTP servers
   - Email Bridge → SQLite (`email_bridge.db`)
   - Email MCP Server → Email Bridge (HTTP API on port 8080)
   - AI Assistant → Email MCP Server (MCP protocol)

### Key Components

#### WhatsApp Bridge (`whatsapp-bridge/main.go`)

- **Authentication**: QR code-based pairing with WhatsApp (re-auth needed ~20 days)
- **Message Storage**: Stores chats and messages with media metadata in SQLite
- **Media Handling**: Uploads/downloads images, videos, audio, documents via WhatsApp API
- **REST API Endpoints**:
  - `POST /api/send` - Send messages/media
  - `POST /api/download` - Download media from messages
- **Event Handlers**: Processes incoming messages and history sync events
- **Database Schema**: `chats` and `messages` tables with media fields (url, media_key, file_sha256, etc.)

#### Email Bridge Architecture

- **Configuration**: `config.json` with server, database, and account settings
- **Multi-Account**: Supports multiple email accounts with IMAP/SMTP configs
- **Database Schema** (`internal/store/schema.go`):
  - `accounts`, `folders`, `emails`, `recipients`, `attachments`, `sync_status`
- **Sync Strategy**: Tracks `last_sync`, `uid_validity`, `last_uid` per folder
- **Security**: Encrypted credential storage via `internal/crypto/crypto.go`

**Note**: Email bridge server implementation is incomplete (TODOs in `cmd/server/main.go`)

#### MCP Servers

Both Python MCP servers implement standardized tools for AI assistants:

**WhatsApp Tools**: search_contacts, list_messages, list_chats, send_message, send_file, send_audio_message, download_media

**Email Tools**: search_emails, get_email, send_email, reply_to_email, forward_email, list_folders, download_attachment

### Database Structure

#### WhatsApp (`store/messages.db`)

```sql
chats (jid PRIMARY KEY, name, last_message_time)
messages (id, chat_jid, sender, content, timestamp, is_from_me,
          media_type, filename, url, media_key, file_sha256,
          file_enc_sha256, file_length)
```

#### Email (`email_bridge.db`)

```sql
accounts (id, email, imap_config, smtp_config, auth_type, oauth_data)
folders (id, account_id, name, path)
emails (id, account_id, message_id, folder_id, from_email, subject,
        text_content, html_content, date, is_read, has_attachments)
recipients (id, email_id, type [to/cc/bcc], name, email)
attachments (id, email_id, filename, content_type, size, path)
sync_status (account_id, folder_id, last_sync, uid_validity, last_uid)
```

## Development Guidelines

### Script Generation

- **Always generate PowerShell (.ps1) files**, not bash scripts
- **Never execute builds or run projects** - provide scripts for manual execution
- Store setup scripts with clear naming (e.g., `SETUP_GRADLE_WRAPPER.ps1`, `FINAL_BUILD.ps1`)

### Commit Policy

- **DO NOT commit automatically** - user commits manually
- Changes should be staged but not committed by Claude

### Go Development

- **CGO Requirement**: Both bridges require CGO_ENABLED=1 for SQLite
- **Module Paths**:
  - WhatsApp: `whatsapp-client` (go.mod uses Go 1.24.1)
  - Email: `github.com/user/email-bridge` (go.mod uses Go 1.21)
- **Key Libraries**:
  - WhatsApp: `go.mau.fi/whatsmeow`, `github.com/mattn/go-sqlite3`
  - Email: `github.com/emersion/go-imap`, `github.com/emersion/go-smtp`

### Python Development

- **Package Manager**: Use `uv` for WhatsApp MCP server
- **Dependencies**:
  - WhatsApp MCP: `mcp[cli]>=1.6.0`, `httpx>=0.28.1`, `requests>=2.32.3`
  - Email MCP: `fastapi>=0.95.0`, `uvicorn>=0.21.1`, `pydantic>=1.10.7`
- **Python Versions**: WhatsApp MCP requires >=3.11, Email MCP requires >=3.8

### Media Handling

#### WhatsApp

- **Audio**: Requires .ogg Opus format for voice messages; FFmpeg auto-converts other formats
- **Images**: jpg, png, gif, webp supported
- **Video**: mp4, avi, mov supported
- **Documents**: Any file type as fallback
- **Download Pattern**: Media metadata stored in DB; actual files downloaded on-demand to `store/{chat_jid}/`

#### Email

- **Attachments**: Stored separately with content_type, size, and local path
- **Content**: Both text and HTML content stored per email

### Configuration Files

#### WhatsApp

- No config file needed; session stored in SQLite
- QR code authentication on first run

#### Email (`config.json`)

```json
{
  "server": {"host": "localhost", "port": 8080},
  "database": {"path": "email_bridge.db"},
  "accounts": [{
    "id": "account1",
    "name": "My Email",
    "email": "user@example.com",
    "imap_config": {
      "server": "imap.example.com",
      "port": 993,
      "username": "user@example.com",
      "password": "password",
      "use_tls": true
    },
    "smtp_config": {
      "server": "smtp.example.com",
      "port": 587,
      "username": "user@example.com",
      "password": "password",
      "use_tls": true
    },
    "auth_type": "password"
  }]
}
```

### MCP Integration

To connect MCP servers to Claude Desktop or Cursor:

**Claude Desktop** (`~/Library/Application Support/Claude/claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "whatsapp": {
      "command": "/path/to/uv",
      "args": ["--directory", "/path/to/whatsapp-mcp-server", "run", "main.py"]
    }
  }
}
```

**Cursor** (`~/.cursor/mcp.json`): Same format

## Project Structure Patterns

### Go Bridge Services

```
{bridge-name}/
├── main.go                 # Entry point with HTTP server and event handlers
├── go.mod                  # Module definition and dependencies
├── store/                  # SQLite databases (gitignored)
├── scripts/
│   └── build.bat          # Windows build script
└── bin/                    # Compiled executables (gitignored)
```

### Go Email Bridge (more structured)

```
email-bridge/
├── cmd/
│   ├── server/main.go      # HTTP API server
│   ├── sync/main.go        # Email synchronization
│   └── incremental-sync/   # Incremental sync process
├── internal/
│   ├── api/               # REST API handlers
│   ├── client/            # IMAP/SMTP client implementations
│   │   ├── imap_client.go
│   │   ├── smtp_client.go
│   │   ├── email_sync.go
│   │   └── *_test.go      # Comprehensive test coverage
│   ├── config/            # Configuration management
│   ├── crypto/            # Credential encryption
│   ├── models/            # Data models (Account, Email, Folder)
│   └── store/             # Database schema and operations
└── scripts/build.bat
```

### Python MCP Servers

```
{service}-mcp-server/
├── main.py                # MCP server entry point
├── {service}.py           # Core service logic
├── *_tools.py             # MCP tool implementations
├── pyproject.toml         # Python dependencies
├── .venv/                 # Virtual environment (gitignored)
└── scripts/build.bat      # Dependency installation
```

## Implementation Priorities

Based on the GIA project timeline (30 days: Dec 22, 2025 - Jan 30, 2026):

### Week 1: Foundation & MCP Servers (Dec 22-26, 2025)

**Status**: Email/WhatsApp MCP infrastructure exists but needs integration

1. ✅ Email MCP Server basic structure exists
2. ⚠️ Email Bridge Server incomplete - Complete TODOs in `cmd/server/main.go`:
   - Initialize database connection
   - Set up IMAP/SMTP clients
   - Implement API routes for Email MCP Server
3. 🔴 Configure email monitoring for `gia@benow.in`
4. 🔴 Test email attachment extraction for Excel files

### Week 2-3: Recon MCP Server & Integration (Dec 29 - Jan 9, 2026)

**Status**: Recon MCP Server does not exist - needs complete development

1. 🔴 **Create Recon MCP Server** (`SourceCode/MCP/RECON_SERVER/recon-mcp-server/`)
   - Implement all 16+ Benow API endpoints
   - JWT authentication handling
   - File upload with multipart/form-data
   - Workspace and configuration management
   - Field mapping automation
   - Auth rule and validation rule management
   - Reconciliation job execution and monitoring
   - Result download and parsing

2. 🔴 **Orchestration Agent** (location TBD)
   - Workflow engine to coordinate Email MCP ↔ Recon MCP
   - Decision-making logic based on reconciliation results
   - Error handling and retry mechanisms
   - Task scheduling system

3. 🔴 **End-to-End Workflow Implementation**:
   ```
   Email arrives → Extract attachments → Upload to Recon →
   Configure mappings → Run reconciliation → Download results →
   Analyze → Send notification emails
   ```

### Week 3-4: UI & Intelligence (Jan 10-24, 2026)

**Status**: No UI exists - needs complete development

1. 🔴 **Chat-Based UI** (React 18 + Tailwind CSS)
   - Natural language interface for agent interaction
   - Real-time status dashboard
   - Manual trigger controls
   - WebSocket integration for live updates
   - Mobile-responsive design

2. 🔴 **Agent Logs System**
   - Structured JSON logging framework
   - Real-time log viewer with filtering
   - Export functionality (CSV/JSON)
   - Audit trail implementation

3. 🔴 **Analysis Engine**
   - Parse reconciliation results
   - Identify discrepancies and patterns
   - Generate summary reports
   - Threshold-based alerting

4. 🔴 **Integration Testing**
   - Test 5 real reconciliation scenarios
   - Performance testing (400K records < 2 minutes)
   - Error recovery testing
   - End-to-end workflow validation

### Week 5: Testing & Demo (Jan 23-30, 2026)

1. 🔴 User Acceptance Testing (UAT)
2. 🔴 Documentation completion
3. 🔴 Final demo preparation
4. 🔴 Stakeholder handover

### Immediate Next Steps

1. **Complete Email Bridge Server** - Unblock Email MCP functionality
2. **Create Recon MCP Server** - Primary development effort (largest component)
3. **Design Orchestration Agent** - Define workflow engine architecture
4. **Set up development environment** - API credentials, test data, network access

## Troubleshooting

### Windows + CGO Issues

- Install MSYS2 with MinGW compiler: https://www.msys2.org/
- Add `C:\msys64\ucrt64\bin` to PATH
- Verify with: `gcc --version`

### WhatsApp Authentication

- QR code timeout: 3 minutes (restart if needed)
- Re-authentication: Every ~20 days
- Session stored in `store/whatsapp.db`
- History sync: May take several minutes on first connection

### Database Cleanup

```powershell
# Reset WhatsApp (forces re-authentication)
Remove-Item .\store\whatsapp.db
Remove-Item .\store\messages.db

# Reset Email
Remove-Item .\email_bridge.db
```

## Benow Recon API Integration

The Recon MCP Server must integrate with the existing Benow Recon platform. Complete API documentation is in `Requirement/ReconBackendAPIsCopy.postman_collection.json`.

### API Base URLs

- Production: `https://recon.benow.in/api/recon/`
- Development: `http://13.201.0.183:8000/api/recon/`

### Authentication

**JWT Bearer Token Authentication**

```http
POST /api/recon/auth/login
Content-Type: application/x-www-form-urlencoded

username=user@example.com&password=password
```

Response: JWT token valid for extended period

**Token Usage**:
```http
Authorization: Bearer <jwt_token>
```

**Get Current User**:
```http
GET /api/recon/auth/me
Authorization: Bearer <token>
```

### Core API Endpoints

#### 1. Workspace Management

```http
# List all workspaces
GET /api/recon/workspace-overview/dashboard/workspaces
Authorization: Bearer <token>

# Get specific workspace
GET /api/recon/workspace-overview/dashboard/workspaces/{workspace_id}
Authorization: Bearer <token>
```

#### 2. File Upload

```http
POST /api/recon/upload/?config_name=Demo
Authorization: Bearer <token>
Content-Type: multipart/form-data

file1: BenowFile.xlsx
file2: Brand.xlsx
```

**Files**: Typically two Excel files to reconcile (e.g., internal records vs. external brand data)

#### 3. Configuration Management

```http
# Update configuration
PUT /api/recon/configurations/{config_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Demo",
  "update_recon_jobs": true
}
```

#### 4. Field Mapping

```http
# Auto-complete mapping suggestions
GET /api/recon/automap/autocomplete/{workspace_id}
Authorization: Bearer <token>

# Set field mappings
POST /api/recon/field-mapping/{workspace_id}?config_id={config_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "mappings": [
    {
      "file1_column": "txn_ref_number",
      "file2_column": "Transaction Reference",
      "is_primary_key": true
    },
    {
      "file1_column": "TRANSACTIONAMOUNT",
      "file2_column": "Paid Amount",
      "is_primary_key": false
    },
    {
      "file1_column": "Brand share",
      "file2_column": "Correct brand share",
      "is_primary_key": false
    }
  ]
}
```

**Mapping Logic**: Maps columns between file1 (internal) and file2 (external) for reconciliation. Primary key column is used for matching records.

#### 5. Authentication Rules

```http
# Get auth rules
GET /api/recon/auth-rule/{workspace_id}?config_id={config_id}
Authorization: Bearer <token>

# Create auth rule
POST /api/recon/auth-rule/{workspace_id}?config_id={config_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "entity_type": "entity1",
  "rule_type": "text_format",
  "field": "txn_ref_number",
  "config": {
    "textFormat": ["Alpha", "Numeric"],
    "value": "",
    "operator": "",
    "minThreshold": "",
    "maxThreshold": "",
    "date_format": "",
    "numberType": "",
    "decimalPlaces": null,
    "filterField": "",
    "filterValues": [],
    "uniqueValue": "",
    "expression": "",
    "isExpressionValid": false
  }
}
```

**Rule Types**: `text_format`, `numeric_range`, `date_format`, `unique_value`, `expression`

**Entity Types**: `entity1` (file1), `entity2` (file2)

#### 6. Auth Check (Run Authentication Rules)

```http
POST /api/recon/auth-check/check/{workspace_id}?entity_type=entity1
Authorization: Bearer <token>
Content-Length: 0
```

**Purpose**: Validates data in file1 or file2 against defined authentication rules before reconciliation

#### 7. Metadata

```http
# Get numeric columns for expressions
GET /api/recon/metadata/numeric-columns/{workspace_id}
Authorization: Bearer <token>
```

#### 8. Validation Rules

```http
# Create validation rule
POST /api/recon/validation-rule/validation-rules/{workspace_id}?config_id={config_id}
Content-Type: application/json

{
  "rule_name": "Rule1",
  "left_expression": "Brand_share_sheet1 + Bank_share_sheet1",
  "right_expression": "Correct_brand_share_sheet2 + Correct_bank_share_sheet2",
  "operator": "==",
  "description": ""
}
```

**Validation Logic**: Define mathematical/logical expressions to validate reconciliation results. Columns from file1 use `_sheet1` suffix, file2 use `_sheet2` suffix.

**Operators**: `==`, `!=`, `>`, `<`, `>=`, `<=`

#### 9. Validate (Run Validation Rules)

```http
POST /api/recon/validate/validate/{workspace_id}
Authorization: Bearer <token>
Content-Type: application/json

{}
```

**Purpose**: Executes all validation rules against reconciled data

#### 10. Auto Reconciliation

```http
POST /api/recon/auto-recon/workspace/{config_id}
Authorization: Bearer <token>
Content-Type: multipart/form-data

file1: BenowFile.xlsx
file2: Brand.xlsx
```

**Purpose**: Performs automatic reconciliation using pre-configured field mappings and rules

#### 11. Status Check

```http
GET /api/recon/auto-recon/status/{workspace_id}
Authorization: Bearer <token>
```

**Purpose**: Check reconciliation job status (running, completed, failed)

#### 12. Download Results

```http
GET /api/recon/download/results/{workspace_id}
Authorization: Bearer <token>
```

**Response**: Excel file with reconciliation results showing matched, unmatched, and discrepancy records

### Typical Workflow

1. **Authenticate**: `POST /auth/login` → Get JWT token
2. **Upload Files**: `POST /upload/?config_name=X` → Receive workspace_id
3. **Configure Mapping**:
   - `GET /automap/autocomplete/{workspace_id}` (optional suggestions)
   - `POST /field-mapping/{workspace_id}` (set mappings)
4. **Set Auth Rules**: `POST /auth-rule/{workspace_id}` (data validation rules)
5. **Run Auth Check**: `POST /auth-check/check/{workspace_id}` (validate data)
6. **Set Validation Rules**: `POST /validation-rule/validation-rules/{workspace_id}` (reconciliation validation)
7. **Execute Reconciliation**: `POST /validate/validate/{workspace_id}` OR `POST /auto-recon/workspace/{config_id}`
8. **Monitor Status**: `GET /auto-recon/status/{workspace_id}` (poll until complete)
9. **Download Results**: `GET /download/results/{workspace_id}` → Excel file
10. **Send Notification**: Use Email MCP Server to notify stakeholders

### Sample Reconciliation Data

**Files**:
- `BenowFile.xlsx`: Internal Samsung transaction data
- `Brand.xlsx`: External brand/bank data

**Key Fields**:
- Primary key: `txn_ref_number` / `Transaction Reference`
- Amount fields: `TRANSACTIONAMOUNT` / `Paid Amount`, `product_amount` / `MRP`
- Loan details: `Tenure`, `RATE_OF_INTEREST`, `EMI_AMOUNT`, `LOAN_AMOUNT`
- Share calculations: `Brand share` / `Correct brand share`, `Bank share` / `Correct bank share`
- Product: `PRODUCT_CATEGORY`

## Security Considerations

- **Credential Storage**: Email bridge uses encryption (`internal/crypto/crypto.go`)
- **OAuth Support**: Email bridge supports OAuth2 authentication
- **No Hardcoded Secrets**: Configure via `config.json` (should be gitignored)
- **MCP Security**: Be aware of project injection risks with MCP servers
- **Benow API**: JWT tokens, TLS 1.3 for API communication
- **Sensitive Data**: Samsung transaction data, brand/bank reconciliation data - handle with care

## Project Deliverables (Jan 30, 2026)

### 1. Working System Components

- ✅ Email MCP Server - operational with gia@benow.in monitoring
- ✅ Recon MCP Server - complete Benow API integration (16+ endpoints)
- ✅ Orchestration Agent - workflow engine coordinating all components
- ✅ Chat-Based UI - React web application with natural language interface
- ✅ Agent Logs & Monitoring - comprehensive logging with real-time viewer

### 2. Source Code & Configuration

- Git repository with version history
- Complete codebase for all components
- Configuration files and environment setup
- Deployment scripts (PowerShell for Windows)
- Docker/containerization setup (optional)

### 3. Documentation Suite

- System architecture document
- Benow API integration guide
- Chat interface user manual
- Log viewer usage guide
- Troubleshooting guide
- API reference documentation
- Deployment guide

### 4. Demonstration & Training

- Live demonstration to Samsung stakeholders
- Chat interface walkthrough
- Agent logs demonstration
- Recorded video demo
- Q&A session with technical team
- Handover documentation

## Expected Benefits

### Immediate (Post-MVP - Feb 2026)

- Proof of automation feasibility
- Working demonstration for stakeholders
- Interactive interface for monitoring reconciliation
- Clear understanding of implementation challenges
- Foundation for production rollout

### Long-term (Production Implementation)

- 70-80% reduction in manual reconciliation time
- Near real-time discrepancy detection (< 2 minutes for 400K records)
- Reduced human error in reconciliation
- Better compliance and audit trails (100% action logging)
- Scalability to handle 10x transaction volume
- Freeing up staff for higher-value activities

## Project Team & Contacts

### Development Team

- **Senior Backend Developer** (Full-time, 30 days) - Recon MCP Server, Orchestration Agent
- **Full-Stack Developer** (Full-time, 30 days) - Chat UI, Email integration, Agent logs
- **Technical Architect** (Part-time) - Architecture guidance, code review

### Samsung/Benow Team

- **Project Manager** - Internal coordination, requirements validation
- **Benow SPOC** - Technical requirements, API access, testing support

### Contact Information

- **Technical Queries**: valter@varahitechnologies.com
- **Commercial Queries**: parth@varahitechnologies.com
- **Project Coordination**: Parth Pandya - parth@varahitechnologies.com, +91 7498626189

## Requirements from Samsung/Benow

### Week 1 (Critical - By Dec 26)

- ✅ Benow API credentials (JWT access)
- ✅ Email account setup (`gia@benow.in`)
- ✅ Designated SPOC for requirements
- 🔴 Sample data files (BenowFile.xlsx, Brand.xlsx)
- 🔴 Network access details (VPN/firewall if applicable)

### Week 2 (By Jan 2)

- 🔴 Benow network/VPN access (if required)
- 🔴 List of stakeholders for notifications
- 🔴 Approved email templates
- 🔴 Chat UI wireframe approval

### Week 3 (By Jan 9)

- 🔴 Real reconciliation files for testing
- 🔴 Expected reconciliation outcomes for validation
- 🔴 1-2 Samsung team members for chat UI testing
- 🔴 Feedback on log viewer usability

### Week 4-5 (By Jan 23)

- 🔴 Stakeholder availability for final demo
- 🔴 Demo environment access
- 🔴 UAT sign-off
- 🔴 Feedback incorporation

## Success Metrics

The GIA MVP will be considered successful if it meets these targets:

| Metric | Target | Status |
|--------|--------|--------|
| End-to-End Automation | 1 complete workflow operational | 🔴 Not started |
| Accuracy | >99% match with expected outcomes | 🔴 To be tested |
| Processing Time | <1-2 minutes for 400K records | 🔴 To be tested |
| Reliability | 4 out of 5 test runs successful | 🔴 To be tested |
| Integration | Seamless with Benow Recon system | 🔴 API integration pending |
| Chat Interface | Responsive to natural language | 🔴 Not developed |
| Logs Coverage | 100% of actions logged | 🔴 Logging framework pending |

## Project Timeline Summary

```
Week 1 (Dec 22-26): ████░░░░░░░░░░░░░░░░ 20% - Foundation & Email MCP
Week 2 (Dec 29-Jan 2): ░░░░████░░░░░░░░░░ 40% - Recon MCP Server Development
Week 3 (Jan 5-9): ░░░░░░░░████░░░░░░ 60% - Orchestration & Workflow
Week 4 (Jan 12-16): ░░░░░░░░░░░░████░░ 80% - Chat UI & Agent Logs
Week 5 (Jan 19-23): ░░░░░░░░░░░░░░░░████ 100% - Testing, Demo, UAT
Demo Week (Jan 26-30): Final Demo & Handover
```

**Key Milestone**: Working end-to-end demo by Jan 23, 2026

**Project Kickoff**: December 22, 2025 (10:00 AM)

**Final Delivery**: January 30, 2026
