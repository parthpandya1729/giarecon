# Email Bridge

Email Bridge is a service that connects email services (SMTP/IMAP) to a Model Context Protocol (MCP) server, enabling AI assistants to interact with email data.

## Features

- Connect to email servers via IMAP and SMTP
- Synchronize emails with a local SQLite database
- Search and retrieve emails
- Compose and send emails
- Handle email attachments
- Manage email folders
- Secure credential storage
- REST API for email operations

## Requirements

- Go 1.21 or later
- SQLite
- IMAP/SMTP email account

## Installation

1. Clone the repository
2. Build the application:

```
# Windows
scripts\build.bat

# Linux/macOS
chmod +x scripts/build.sh
./scripts/build.sh
```

## Configuration

Create a `config.json` file with the following structure:

```json
{
  "server": {
    "host": "localhost",
    "port": 8080
  },
  "database": {
    "path": "email_bridge.db"
  },
  "accounts": [
    {
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
    }
  ]
}
```

## Usage

Run the application:

```
bin/email-bridge
```

The server will start and listen on the configured port (default: 8080).

## API Endpoints

- `GET /emails` - List emails with filtering options
- `GET /emails/{id}` - Get a specific email
- `POST /emails` - Send a new email
- `PUT /emails/{id}/status` - Update email status
- `PUT /emails/{id}/folder` - Move email to a different folder
- `DELETE /emails/{id}` - Delete an email
- `GET /folders` - List folders
- `GET /attachments/{id}` - Download an attachment
- `GET /search` - Search emails

## License

MIT
