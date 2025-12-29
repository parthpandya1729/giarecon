package client

import (
	"fmt"
	"path/filepath"

	"github.com/user/email-bridge/internal/config"
	"github.com/user/email-bridge/internal/store"
)

// InitializeEmailClients initializes all email clients and connection management
func InitializeEmailClients(cfg config.Config, keyPath string, emailStore store.Store) error {
	// Initialize credential manager
	cm, err := GetCredentialManager(filepath.Join(keyPath, "master.key"))
	if err != nil {
		return fmt.Errorf("failed to initialize credential manager: %w", err)
	}

	// Initialize connection manager
	connManager := GetConnectionManager()
	connManager.Start()

	// Initialize connection watcher
	connWatcher := GetConnectionWatcher()
	connWatcher.Start()

	// Initialize email monitor
	emailMonitor := GetEmailMonitor(emailStore)
	emailMonitor.Start()

	// Initialize folder watcher
	folderWatcher := GetFolderWatcher(emailStore)
	folderWatcher.Start()

	// Initialize clients for each account
	for _, account := range cfg.Accounts {
		// Create a copy of the account to avoid issues with loop variable capture
		accountCopy := account

		// Initialize IMAP client
		imapClient := NewIMAPClientImpl(accountCopy)

		// Register with connection manager
		imapClientID := fmt.Sprintf("imap-%s", accountCopy.ID)
		connManager.RegisterClient(imapClientID, imapClient)

		// Try to connect
		if err := imapClient.Connect(); err != nil {
			fmt.Printf("Warning: Failed to connect to IMAP server for account %s: %v\n", accountCopy.ID, err)
			// Continue with other accounts
			continue
		}

		// Register with email monitor for mailbox monitoring
		emailMonitor.RegisterClient(imapClientID, imapClient)
		fmt.Printf("Started email monitoring for account %s\n", accountCopy.ID)

		// Register with folder watcher for folder synchronization
		folderWatcher.RegisterClient(accountCopy.ID, imapClient)
		fmt.Printf("Started folder synchronization for account %s\n", accountCopy.ID)

		// Initialize SMTP client
		smtpClient := NewSMTPClientImpl(accountCopy)

		// Register with connection manager
		smtpClientID := fmt.Sprintf("smtp-%s", accountCopy.ID)
		connManager.RegisterClient(smtpClientID, smtpClient)

		// Try to connect
		if err := smtpClient.Connect(); err != nil {
			fmt.Printf("Warning: Failed to connect to SMTP server for account %s: %v\n", accountCopy.ID, err)
			// Continue with other clients
		} else {
			fmt.Printf("Successfully connected to SMTP server for account %s\n", accountCopy.ID)
		}
	}

	return nil
}

// ShutdownEmailClients gracefully shuts down all email clients
func ShutdownEmailClients() {
	// Stop email monitor first to prevent new monitoring attempts
	emailMonitor := GetEmailMonitor(nil)
	emailMonitor.Stop()

	// Stop folder watcher
	folderWatcher := GetFolderWatcher(nil)
	folderWatcher.Stop()

	// Stop connection watcher
	connWatcher := GetConnectionWatcher()
	connWatcher.Stop()

	// Get all clients and disconnect them
	connManager := GetConnectionManager()
	connManager.mutex.RLock()
	clients := make(map[string]EmailClient)
	for id, client := range connManager.clients {
		clients[id] = client
	}
	connManager.mutex.RUnlock()

	// Disconnect each client
	for id, client := range clients {
		if err := client.Disconnect(); err != nil {
			fmt.Printf("Warning: Failed to disconnect client %s: %v\n", id, err)
		}
	}

	// Stop connection manager
	connManager.Stop()
}
