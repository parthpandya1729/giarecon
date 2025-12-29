package client

import (
	"fmt"
	"time"

	"github.com/user/email-bridge/internal/config"
	"github.com/user/email-bridge/internal/models"
	"github.com/user/email-bridge/internal/store"
)

// EmailClient is the interface for email operations
type EmailClient interface {
	// Connect establishes a connection to the email server
	Connect() error
	// Disconnect closes the connection to the email server
	Disconnect() error
	// IsConnected checks if the client is connected
	IsConnected() bool
}

// IMAPClient is the interface for IMAP operations
type IMAPClient interface {
	EmailClient
	// FetchEmails retrieves emails based on search criteria
	FetchEmails(criteria models.SearchCriteria) ([]models.Email, error)
	// GetFolders retrieves the list of folders
	GetFolders() ([]string, error)
	// GetFoldersDetailed retrieves detailed folder information
	GetFoldersDetailed() ([]models.Folder, error)
	// SyncFolders synchronizes folders between the server and local database
	SyncFolders(store store.Store, options models.FolderSyncOptions) error
	// SyncEmails synchronizes emails from the server to the local database
	SyncEmails(s store.Store, options EmailSyncOptions) error
	// SyncEmailsWithProgress synchronizes emails with progress reporting
	SyncEmailsWithProgress(s store.Store, accountID string, progressCallback func(folder string, current, total int)) error
	// SyncEmailsForFolder synchronizes emails for a specific folder
	SyncEmailsForFolder(s store.Store, accountID string, folder string) error
	// SyncRecentEmails synchronizes recent emails (since the last sync)
	SyncRecentEmails(s store.Store, accountID string, since time.Time) error
	// SyncEmailsWithLimit synchronizes a limited number of emails
	SyncEmailsWithLimit(s store.Store, accountID string, maxEmails int) error
	// IncrementalSync performs an incremental synchronization of emails
	IncrementalSync(s store.Store, options IncrementalSyncOptions) error
	// SyncNewEmails synchronizes only new emails since the last sync
	SyncNewEmails(s store.Store, accountID string) error
	// SyncEmailsIncrementally synchronizes emails incrementally with progress reporting
	SyncEmailsIncrementally(s store.Store, accountID string, progressCallback func(folder string, current, total int)) error
	// SyncFolderIncrementally synchronizes emails incrementally for a specific folder
	SyncFolderIncrementally(s store.Store, accountID string, folder string) error
	// CreateFolder creates a new folder on the server
	CreateFolder(name string) error
	// RenameFolder renames a folder on the server
	RenameFolder(oldName string, newName string) error
	// DeleteFolder deletes a folder on the server
	DeleteFolder(name string) error
	// SubscribeFolder subscribes to a folder
	SubscribeFolder(name string) error
	// UnsubscribeFolder unsubscribes from a folder
	UnsubscribeFolder(name string) error
	// MonitorMailbox starts monitoring for new emails
	MonitorMailbox(callback func(models.Email)) error
	// StopMonitoring stops monitoring for new emails
	StopMonitoring() error
	// MarkAsRead marks an email as read
	MarkAsRead(emailID string) error
	// MarkAsUnread marks an email as unread
	MarkAsUnread(emailID string) error
	// MoveEmail moves an email to a different folder
	MoveEmail(emailID string, folder string) error
	// DeleteEmail deletes an email
	DeleteEmail(emailID string) error
	// GetAttachment downloads an attachment
	GetAttachment(emailID string, attachmentID string) (models.Attachment, error)
}

// SMTPClient is the interface for SMTP operations
type SMTPClient interface {
	EmailClient
	// SendEmail sends an email
	SendEmail(email models.Email) error
}

// NewIMAPClient creates a new IMAP client
func NewIMAPClient(config config.AccountConfig) (IMAPClient, error) {
	client := NewIMAPClientImpl(config)
	err := client.Connect()
	if err != nil {
		return nil, fmt.Errorf("failed to connect to IMAP server: %w", err)
	}
	return client, nil
}

// NewSMTPClient creates a new SMTP client
func NewSMTPClient(config config.AccountConfig) (SMTPClient, error) {
	client := NewSMTPClientImpl(config)
	err := client.Connect()
	if err != nil {
		return nil, fmt.Errorf("failed to connect to SMTP server: %w", err)
	}
	return client, nil
}
