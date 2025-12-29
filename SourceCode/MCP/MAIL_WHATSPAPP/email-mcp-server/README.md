# Email MCP Server

Email MCP Server is a Model Context Protocol (MCP) server that provides standardized tools for AI assistants to interact with email data through the Email Bridge service.

## Features

- Search and retrieve emails
- Compose and send emails
- Reply to and forward emails
- Download attachments
- Manage email folders
- MCP tools for AI assistants

## Requirements

- Python 3.8 or later
- Email Bridge service

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

Set the following environment variables:

- `EMAIL_BRIDGE_API_URL`: URL of the Email Bridge API (default: http://localhost:8080)
- `PORT`: Port to listen on (default: 8000)
- `DEBUG`: Enable debug mode (default: False)

## Usage

Run the server:

```
python main.py
```

The server will start and listen on the configured port (default: 8000).

## MCP Tools

The following MCP tools are available:

- `search_emails`: Search emails by various criteria
- `get_email`: Get a specific email with full content
- `send_email`: Compose and send a new email
- `reply_to_email`: Reply to an existing email
- `forward_email`: Forward an existing email
- `list_folders`: List available folders
- `download_attachment`: Download an email attachment

## API Documentation

API documentation is available at `/docs` when the server is running.

## License

MIT
