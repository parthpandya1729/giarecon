# Email Synchronization

This module implements email synchronization between IMAP servers and the local database. It provides functionality for both initial full synchronization and incremental updates.

## Features

- Full mailbox synchronization
- Incremental synchronization for efficient updates
- Batched processing for large mailboxes
- Progress reporting
- Folder-specific synchronization
- Date range filtering
- Attachment handling (optional)
- Synchronization state tracking
- Status change detection (read/unread, moved emails)

## Usage

### Basic Synchronization

```go
// Create an IMAP client
imapClient, err := client.NewIMAPClient(accountConfig)
if err != nil {
    log.Fatalf("Error connecting to IMAP server: %v", err)
}
defer imapClient.Disconnect()

// Initialize database
db, err := store.NewSQLiteStore("./email-bridge.db", cryptoManager)
if err != nil {
    log.Fatalf("Error connecting to database: %v", err)
}
defer db.Close()

// Synchronize all emails for an account
options := client.DefaultEmailSyncOptions(accountID)
err = imapClient.SyncEmails(db, options)
if err != nil {
    log.Fatalf("Error synchronizing emails: %v", err)
}
```

### Synchronization with Progress Reporting

```go
// Synchronize with progress reporting
err = imapClient.SyncEmailsWithProgress(db, accountID, func(folder string, current, total int) {
    fmt.Printf("\rSynchronizing %s: %d/%d emails (%.1f%%)", folder, current, total, float64(current)/float64(total)*100)
    if current == total {
        fmt.Println()
    }
})
```

### Folder-Specific Synchronization

```go
// Synchronize a specific folder
err = imapClient.SyncEmailsForFolder(db, accountID, "INBOX")
```

### Recent Emails Synchronization

```go
// Synchronize emails from the last 7 days
since := time.Now().AddDate(0, 0, -7)
err = imapClient.SyncRecentEmails(db, accountID, since)
```

### Incremental Synchronization

```go
// Synchronize only new emails since the last sync
err = imapClient.SyncNewEmails(db, accountID)

// Incremental sync with progress reporting
err = imapClient.SyncEmailsIncrementally(db, accountID, func(folder string, current, total int) {
    fmt.Printf("\rSynchronizing %s: %d/%d new emails (%.1f%%)", folder, current, total, float64(current)/float64(total)*100)
    if current == total {
        fmt.Println()
    }
})

// Incremental sync for a specific folder
err = imapClient.SyncFolderIncrementally(db, accountID, "INBOX")
```

### Limited Synchronization

```go
// Synchronize only the most recent 100 emails
err = imapClient.SyncEmailsWithLimit(db, accountID, 100)
```

## Advanced Options

### Full Synchronization Options

For more control over the full synchronization process, you can create custom `EmailSyncOptions`:

```go
options := client.EmailSyncOptions{
    AccountID:       accountID,
    Folder:          "INBOX",           // Specific folder (empty for all folders)
    BatchSize:       200,               // Number of emails to fetch in each batch
    MaxEmails:       1000,              // Maximum number of emails to synchronize
    SyncAttachments: true,              // Download attachments
    SyncFrom:        time.Now().AddDate(0, -1, 0), // Sync from 1 month ago
    OnProgress: func(folder string, current, total int) {
        // Custom progress reporting
    },
}

err = imapClient.SyncEmails(db, options)
```

### Incremental Synchronization Options

For more control over the incremental synchronization process, you can create custom `IncrementalSyncOptions`:

```go
options := client.IncrementalSyncOptions{
    AccountID:          accountID,
    Folder:             "INBOX",        // Specific folder (empty for all folders)
    BatchSize:          200,            // Number of emails to fetch in each batch
    MaxEmails:          1000,           // Maximum number of emails to synchronize
    SyncAttachments:    true,           // Download attachments
    CheckStatusChanges: true,           // Check for status changes in existing emails
    OnProgress: func(folder string, current, total int) {
        // Custom progress reporting
    },
}

err = imapClient.IncrementalSync(db, options)
```

## Command-Line Tool

A command-line tool is available for testing and manual synchronization:

```
cd cmd/sync
go build
./sync -account=your-account-id -folder=INBOX -days=7 -attachments
```

Options:

- `-account`: Account ID to synchronize (required)
- `-folder`: Folder to synchronize (empty for all folders)
- `-batch-size`: Number of emails to fetch in each batch (default 100)
- `-max-emails`: Maximum number of emails to synchronize (0 for all)
- `-attachments`: Download attachments
- `-days`: Synchronize emails from the last N days (0 for all)
- `-incremental`: Use incremental sync instead of full sync
- `-status-changes`: Check for status changes in existing emails (default true with incremental sync)
- `-db`: Path to the SQLite database (default "./email-bridge.db")
- `-config`: Path to the configuration file (default "./config.json")
