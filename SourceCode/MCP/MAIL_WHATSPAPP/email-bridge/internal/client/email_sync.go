package client

import (
	"fmt"
	"sync"
	"time"

	"github.com/emersion/go-imap"
	"github.com/user/email-bridge/internal/models"
	"github.com/user/email-bridge/internal/store"
)

// EmailSyncOptions represents options for email synchronization
type EmailSyncOptions struct {
	// AccountID is the ID of the account to synchronize
	AccountID string
	// Folder is the folder to synchronize (empty for all folders)
	Folder string
	// BatchSize is the number of emails to fetch in each batch
	BatchSize int
	// MaxEmails is the maximum number of emails to synchronize (0 for all)
	MaxEmails int
	// SyncAttachments determines whether to download attachments
	SyncAttachments bool
	// SyncFrom is the date from which to start synchronization (zero value for all)
	SyncFrom time.Time
	// SyncTo is the date until which to synchronize (zero value for all)
	SyncTo time.Time
	// OnProgress is a callback function for progress updates
	OnProgress func(folder string, current, total int)
}

// DefaultEmailSyncOptions returns default synchronization options
func DefaultEmailSyncOptions(accountID string) EmailSyncOptions {
	return EmailSyncOptions{
		AccountID:       accountID,
		BatchSize:       100,
		MaxEmails:       0, // No limit
		SyncAttachments: false,
		OnProgress:      nil,
	}
}

// SyncEmails synchronizes emails from the server to the local database
func (c *IMAPClientImpl) SyncEmails(s store.Store, options EmailSyncOptions) error {
	// Validate options
	if options.AccountID == "" {
		return fmt.Errorf("account ID is required")
	}

	if options.BatchSize <= 0 {
		options.BatchSize = 100
	}

	// Get folders to synchronize
	var folders []string
	var err error

	if options.Folder != "" {
		// Sync a specific folder
		folders = []string{options.Folder}
	} else {
		// Sync all folders
		folders, err = c.GetFolders()
		if err != nil {
			return fmt.Errorf("failed to get folders: %w", err)
		}
	}

	// Synchronize each folder
	for _, folder := range folders {
		if err := c.syncFolder(s, folder, options); err != nil {
			return fmt.Errorf("failed to sync folder %s: %w", folder, err)
		}
	}

	return nil
}

// syncFolder synchronizes a single folder
func (c *IMAPClientImpl) syncFolder(s store.Store, folder string, options EmailSyncOptions) error {
	c.mutex.Lock()
	if !c.connected || c.client == nil {
		c.mutex.Unlock()
		return fmt.Errorf("not connected to IMAP server")
	}

	// Select the mailbox
	mbox, err := c.client.Select(folder, false) // Read-only mode
	if err != nil {
		c.mutex.Unlock()
		// Handle connection error
		if c.handleConnectionError(err) {
			// Try again once if it was a connection error that was fixed
			return c.syncFolder(s, folder, options)
		}
		return fmt.Errorf("failed to select folder %s: %w", folder, err)
	}

	// Get the folder ID from the database or create it if it doesn't exist
	err = s.CreateFolder(options.AccountID, folder)
	if err != nil {
		c.mutex.Unlock()
		return fmt.Errorf("failed to create folder %s: %w", folder, err)
	}

	// Get the sync status for this folder
	folderID := folder // Using folder name as ID for simplicity
	syncStatus, err := s.GetSyncStatus(options.AccountID, folderID)
	if err != nil {
		c.mutex.Unlock()
		return fmt.Errorf("failed to get sync status: %w", err)
	}

	// Check if the mailbox has changed since last sync
	if syncStatus.UIDValidity != "" && syncStatus.UIDValidity == mbox.UidValidity {
		// The mailbox hasn't changed structurally, we can do an incremental sync
		if err := c.incrementalSync(s, folder, mbox, syncStatus, options); err != nil {
			c.mutex.Unlock()
			return fmt.Errorf("failed to perform incremental sync: %w", err)
		}
		c.mutex.Unlock()
		return nil
	}

	// Build search criteria
	searchCriteria := imap.NewSearchCriteria()

	// Add date criteria if specified
	if !options.SyncFrom.IsZero() {
		searchCriteria.Since = options.SyncFrom
	}
	if !options.SyncTo.IsZero() {
		searchCriteria.Before = options.SyncTo
	}

	// Search for all message UIDs that match the criteria
	uids, err := c.client.UidSearch(searchCriteria)
	if err != nil {
		c.mutex.Unlock()
		// Handle connection error
		if c.handleConnectionError(err) {
			// Try again once if it was a connection error that was fixed
			return c.syncFolder(s, folder, options)
		}
		return fmt.Errorf("failed to search emails: %w", err)
	}

	// Apply max emails limit if specified
	if options.MaxEmails > 0 && len(uids) > options.MaxEmails {
		uids = uids[len(uids)-options.MaxEmails:] // Get the most recent emails
	}

	totalEmails := len(uids)
	c.mutex.Unlock()

	// Report initial progress
	if options.OnProgress != nil {
		options.OnProgress(folder, 0, totalEmails)
	}

	// Process emails in batches
	for i := 0; i < len(uids); i += options.BatchSize {
		end := i + options.BatchSize
		if end > len(uids) {
			end = len(uids)
		}

		batchUIDs := uids[i:end]
		if err := c.syncEmailBatch(s, folder, batchUIDs, options); err != nil {
			return fmt.Errorf("failed to sync email batch: %w", err)
		}

		// Report progress
		if options.OnProgress != nil {
			options.OnProgress(folder, end, totalEmails)
		}
	}

	// Update sync status
	syncStatus.AccountID = options.AccountID
	syncStatus.FolderID = folderID
	syncStatus.LastSync = time.Now()
	syncStatus.UIDValidity = mbox.UidValidity

	if err := s.UpdateSyncStatus(syncStatus); err != nil {
		return fmt.Errorf("failed to update sync status: %w", err)
	}

	return nil
}

// syncEmailBatch synchronizes a batch of emails
func (c *IMAPClientImpl) syncEmailBatch(s store.Store, folder string, uids []uint32, options EmailSyncOptions) error {
	c.mutex.Lock()
	defer c.mutex.Unlock()

	if !c.connected || c.client == nil {
		return fmt.Errorf("not connected to IMAP server")
	}

	// Create sequence set for fetching
	seqSet := new(imap.SeqSet)
	seqSet.AddNum(uids...)

	// Define items to fetch
	items := []imap.FetchItem{
		imap.FetchEnvelope,
		imap.FetchFlags,
		imap.FetchInternalDate,
		imap.FetchRFC822Size,
		imap.FetchUid,
		imap.FetchBodyStructure,
		"BODY.PEEK[]",
	}

	// Fetch messages
	messages := make(chan *imap.Message, 10)
	done := make(chan error, 1)
	go func() {
		done <- c.client.UidFetch(seqSet, items, messages)
	}()

	// Process messages
	var wg sync.WaitGroup
	var processErr error
	var processErrMutex sync.Mutex

	// Use a semaphore to limit concurrent processing
	semaphore := make(chan struct{}, 5) // Process up to 5 emails concurrently

	for msg := range messages {
		if processErr != nil {
			continue // Skip processing if an error occurred
		}

		wg.Add(1)
		semaphore <- struct{}{} // Acquire semaphore

		go func(msg *imap.Message) {
			defer wg.Done()
			defer func() { <-semaphore }() // Release semaphore

			// Parse the message
			email, err := c.parseMessage(msg, folder)
			if err != nil {
				processErrMutex.Lock()
				processErr = fmt.Errorf("failed to parse message: %w", err)
				processErrMutex.Unlock()
				return
			}

			// Set account ID
			email.AccountID = options.AccountID

			// Store the email in the database
			err = s.StoreEmail(email)
			if err != nil {
				processErrMutex.Lock()
				processErr = fmt.Errorf("failed to store email: %w", err)
				processErrMutex.Unlock()
				return
			}

			// Download attachments if requested
			if options.SyncAttachments && email.HasAttachments {
				// This will be implemented in task 7.3
			}
		}(msg)
	}

	// Wait for all goroutines to finish
	wg.Wait()

	// Check for fetch error
	if err := <-done; err != nil {
		// Handle connection error
		if c.handleConnectionError(err) {
			// Try again once if it was a connection error that was fixed
			return c.syncEmailBatch(s, folder, uids, options)
		}
		return fmt.Errorf("failed to fetch emails: %w", err)
	}

	// Check for processing error
	if processErr != nil {
		return processErr
	}

	return nil
}

// SyncEmailsWithProgress synchronizes emails with progress reporting
func (c *IMAPClientImpl) SyncEmailsWithProgress(s store.Store, accountID string, progressCallback func(folder string, current, total int)) error {
	options := DefaultEmailSyncOptions(accountID)
	options.OnProgress = progressCallback
	return c.SyncEmails(s, options)
}

// SyncEmailsForFolder synchronizes emails for a specific folder
func (c *IMAPClientImpl) SyncEmailsForFolder(s store.Store, accountID string, folder string) error {
	options := DefaultEmailSyncOptions(accountID)
	options.Folder = folder
	return c.SyncEmails(s, options)
}

// SyncRecentEmails synchronizes recent emails (since the last sync)
func (c *IMAPClientImpl) SyncRecentEmails(s store.Store, accountID string, since time.Time) error {
	options := DefaultEmailSyncOptions(accountID)
	options.SyncFrom = since
	return c.SyncEmails(s, options)
}

// SyncEmailsWithLimit synchronizes a limited number of emails
func (c *IMAPClientImpl) SyncEmailsWithLimit(s store.Store, accountID string, maxEmails int) error {
	options := DefaultEmailSyncOptions(accountID)
	options.MaxEmails = maxEmails
	return c.SyncEmails(s, options)
}

// incrementalSync performs an incremental synchronization of a folder
// It only fetches emails that have arrived since the last sync
// and checks for status changes in existing emails
func (c *IMAPClientImpl) incrementalSync(s store.Store, folder string, mbox *imap.MailboxStatus, syncStatus store.SyncStatus, options EmailSyncOptions) error {
	// Use the new incremental sync implementation
	incrementalOptions := IncrementalSyncOptions{
		AccountID:          options.AccountID,
		Folder:             folder,
		BatchSize:          options.BatchSize,
		MaxEmails:          options.MaxEmails,
		SyncAttachments:    options.SyncAttachments,
		OnProgress:         options.OnProgress,
		CheckStatusChanges: true,
	}

	// Call the dedicated incremental sync function
	return c.incrementalSyncFolder(s, folder, incrementalOptions)
}

// syncEmailStatusChanges checks for status changes in existing emails
// such as read/unread status and flags
func (c *IMAPClientImpl) syncEmailStatusChanges(s store.Store, folder string, accountID string) error {
	// Get all emails in this folder from the database
	emails, err := s.SearchEmails(models.SearchCriteria{
		AccountID: accountID,
		Folder:    folder,
		Limit:     0, // No limit
	})
	if err != nil {
		return fmt.Errorf("failed to get emails from database: %w", err)
	}

	// If there are no emails in the database, nothing to do
	if len(emails) == 0 {
		return nil
	}

	// Create a map of email UIDs to database IDs for quick lookup
	emailMap := make(map[uint32]string, len(emails))
	uids := make([]uint32, 0, len(emails))

	for _, email := range emails {
		// Extract UID from the email ID or metadata
		uid, err := extractUID(email)
		if err != nil {
			// Skip emails where we can't extract the UID
			continue
		}

		emailMap[uid] = email.ID
		uids = append(uids, uid)
	}

	// If we couldn't extract any UIDs, nothing to do
	if len(uids) == 0 {
		return nil
	}

	// Create sequence set for fetching
	seqSet := new(imap.SeqSet)
	seqSet.AddNum(uids...)

	// Define items to fetch (only flags and UID)
	items := []imap.FetchItem{
		imap.FetchFlags,
		imap.FetchUid,
	}

	// Fetch message flags
	c.mutex.Lock()
	messages := make(chan *imap.Message, 10)
	done := make(chan error, 1)
	go func() {
		done <- c.client.UidFetch(seqSet, items, messages)
	}()
	c.mutex.Unlock()

	// Process messages and update status
	for msg := range messages {
		uid := msg.Uid
		emailID, ok := emailMap[uid]
		if !ok {
			// Skip if we can't find the email in our map
			continue
		}

		// Check if the email is marked as read
		isRead := false
		for _, flag := range msg.Flags {
			if flag == imap.SeenFlag {
				isRead = true
				break
			}
		}

		// Update the email status in the database if needed
		err := s.UpdateEmailStatus(emailID, models.EmailStatus{
			IsRead: isRead,
			// Add other status fields as needed
		})
		if err != nil {
			return fmt.Errorf("failed to update email status: %w", err)
		}
	}

	// Check for fetch error
	if err := <-done; err != nil {
		// Handle connection error
		if c.handleConnectionError(err) {
			// Try again once if it was a connection error that was fixed
			return c.syncEmailStatusChanges(s, folder, accountID)
		}
		return fmt.Errorf("failed to fetch email flags: %w", err)
	}

	return nil
}

// extractUID extracts the UID from an email
// This is a helper function that needs to be implemented based on how UIDs are stored
func extractUID(email models.Email) (uint32, error) {
	// This is a placeholder implementation
	// In a real implementation, the UID might be stored in the email ID or in metadata

	// Example: If the UID is stored in a header field
	if uidStr, ok := email.Headers["X-IMAP-UID"]; ok {
		var uid uint32
		_, err := fmt.Sscanf(uidStr, "%d", &uid)
		if err != nil {
			return 0, fmt.Errorf("failed to parse UID: %w", err)
		}
		return uid, nil
	}

	return 0, fmt.Errorf("UID not found in email")
}
