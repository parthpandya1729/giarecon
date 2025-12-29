package client

import (
	"fmt"
	"time"

	"github.com/emersion/go-imap"
	"github.com/user/email-bridge/internal/models"
	"github.com/user/email-bridge/internal/store"
)

// IncrementalSyncOptions represents options for incremental email synchronization
type IncrementalSyncOptions struct {
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
	// OnProgress is a callback function for progress updates
	OnProgress func(folder string, current, total int)
	// CheckStatusChanges determines whether to check for status changes in existing emails
	CheckStatusChanges bool
}

// DefaultIncrementalSyncOptions returns default incremental synchronization options
func DefaultIncrementalSyncOptions(accountID string) IncrementalSyncOptions {
	return IncrementalSyncOptions{
		AccountID:          accountID,
		BatchSize:          100,
		MaxEmails:          0, // No limit
		SyncAttachments:    false,
		OnProgress:         nil,
		CheckStatusChanges: true,
	}
}

// SyncNewEmails synchronizes only new emails since the last sync
func (c *IMAPClientImpl) SyncNewEmails(s store.Store, accountID string) error {
	options := DefaultIncrementalSyncOptions(accountID)
	return c.IncrementalSync(s, options)
}

// IncrementalSync performs an incremental synchronization of emails
func (c *IMAPClientImpl) IncrementalSync(s store.Store, options IncrementalSyncOptions) error {
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

	// Synchronize each folder incrementally
	for _, folder := range folders {
		if err := c.incrementalSyncFolder(s, folder, options); err != nil {
			return fmt.Errorf("failed to incrementally sync folder %s: %w", folder, err)
		}
	}

	return nil
}

// incrementalSyncFolder performs an incremental synchronization of a single folder
func (c *IMAPClientImpl) incrementalSyncFolder(s store.Store, folder string, options IncrementalSyncOptions) error {
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
			return c.incrementalSyncFolder(s, folder, options)
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

	// Check if this is the first sync for this folder
	if syncStatus.UIDValidity == "" || syncStatus.LastSync.IsZero() {
		// This is the first sync, do a full sync instead
		c.mutex.Unlock()
		syncOptions := EmailSyncOptions{
			AccountID:       options.AccountID,
			Folder:          folder,
			BatchSize:       options.BatchSize,
			MaxEmails:       options.MaxEmails,
			SyncAttachments: options.SyncAttachments,
			OnProgress:      options.OnProgress,
		}
		return c.syncFolder(s, folder, syncOptions)
	}

	// Check if the mailbox has changed structurally (UID validity changed)
	if syncStatus.UIDValidity != mbox.UidValidity {
		// UID validity has changed, need to do a full sync
		c.mutex.Unlock()
		syncOptions := EmailSyncOptions{
			AccountID:       options.AccountID,
			Folder:          folder,
			BatchSize:       options.BatchSize,
			MaxEmails:       options.MaxEmails,
			SyncAttachments: options.SyncAttachments,
			OnProgress:      options.OnProgress,
		}
		return c.syncFolder(s, folder, syncOptions)
	}

	// Search for new emails (UIDs greater than the last one we've seen)
	searchCriteria := imap.NewSearchCriteria()

	// Add UID criteria for emails newer than what we've seen
	if syncStatus.LastUID > 0 {
		// Create a sequence set for UIDs greater than lastUID
		uidRange := new(imap.SeqSet)
		uidRange.AddRange(syncStatus.LastUID+1, 0) // 0 means the highest UID available
		searchCriteria.Uid = uidRange
	}

	// Search for new message UIDs
	newUIDs, err := c.client.UidSearch(searchCriteria)
	if err != nil {
		c.mutex.Unlock()
		// Handle connection error
		if c.handleConnectionError(err) {
			// Try again once if it was a connection error that was fixed
			return c.incrementalSyncFolder(s, folder, options)
		}
		return fmt.Errorf("failed to search for new emails: %w", err)
	}

	// Apply max emails limit if specified
	if options.MaxEmails > 0 && len(newUIDs) > options.MaxEmails {
		newUIDs = newUIDs[len(newUIDs)-options.MaxEmails:] // Get the most recent emails
	}

	totalNewEmails := len(newUIDs)
	c.mutex.Unlock()

	// Report initial progress
	if options.OnProgress != nil {
		options.OnProgress(folder, 0, totalNewEmails)
	}

	// Process new emails in batches
	if totalNewEmails > 0 {
		for i := 0; i < len(newUIDs); i += options.BatchSize {
			end := i + options.BatchSize
			if end > len(newUIDs) {
				end = len(newUIDs)
			}

			batchUIDs := newUIDs[i:end]
			if err := c.syncEmailBatch(s, folder, batchUIDs, EmailSyncOptions{
				AccountID:       options.AccountID,
				BatchSize:       options.BatchSize,
				SyncAttachments: options.SyncAttachments,
			}); err != nil {
				return fmt.Errorf("failed to sync new email batch: %w", err)
			}

			// Report progress
			if options.OnProgress != nil {
				options.OnProgress(folder, end, totalNewEmails)
			}
		}

		// Update the last UID we've seen
		if len(newUIDs) > 0 {
			// Find the highest UID in the batch
			highestUID := uint32(0)
			for _, uid := range newUIDs {
				if uid > highestUID {
					highestUID = uid
				}
			}

			// Update the last UID in the sync status
			if highestUID > syncStatus.LastUID {
				syncStatus.LastUID = highestUID
			}
		}
	} else if options.OnProgress != nil {
		// Report that no new emails were found
		options.OnProgress(folder, 0, 0)
	}

	// Check for status changes in existing emails (read/unread, flags, moved)
	if options.CheckStatusChanges {
		if err := c.syncEmailStatusChanges(s, folder, options.AccountID); err != nil {
			return fmt.Errorf("failed to sync email status changes: %w", err)
		}

		// Check for emails that have been moved between folders
		if err := c.syncMovedEmails(s, options.AccountID, folder); err != nil {
			return fmt.Errorf("failed to sync moved emails: %w", err)
		}
	}

	// Update sync status
	syncStatus.LastSync = time.Now()

	if err := s.UpdateSyncStatus(syncStatus); err != nil {
		return fmt.Errorf("failed to update sync status: %w", err)
	}

	return nil
}

// syncMovedEmails checks for emails that have been moved between folders
func (c *IMAPClientImpl) syncMovedEmails(s store.Store, accountID string, folder string) error {
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

	// Define items to fetch (only UID)
	items := []imap.FetchItem{
		imap.FetchUid,
	}

	// Fetch message UIDs to check if they still exist in this folder
	c.mutex.Lock()
	messages := make(chan *imap.Message, 10)
	done := make(chan error, 1)
	go func() {
		done <- c.client.UidFetch(seqSet, items, messages)
	}()
	c.mutex.Unlock()

	// Create a set of UIDs that still exist in this folder
	existingUIDs := make(map[uint32]bool)
	for msg := range messages {
		existingUIDs[msg.Uid] = true
	}

	// Check for fetch error
	if err := <-done; err != nil {
		// Handle connection error
		if c.handleConnectionError(err) {
			// Try again once if it was a connection error that was fixed
			return c.syncMovedEmails(s, accountID, folder)
		}
		return fmt.Errorf("failed to fetch email UIDs: %w", err)
	}

	// Check for emails that no longer exist in this folder
	for uid, emailID := range emailMap {
		if !existingUIDs[uid] {
			// This email is no longer in this folder
			// It might have been moved or deleted
			// For now, we'll just mark it as deleted in our database
			// A future sync of other folders will re-add it if it was moved
			if err := s.DeleteEmail(emailID); err != nil {
				return fmt.Errorf("failed to delete moved/deleted email: %w", err)
			}
		}
	}

	return nil
}

// SyncEmailsIncrementally synchronizes emails incrementally with progress reporting
func (c *IMAPClientImpl) SyncEmailsIncrementally(s store.Store, accountID string, progressCallback func(folder string, current, total int)) error {
	options := DefaultIncrementalSyncOptions(accountID)
	options.OnProgress = progressCallback
	return c.IncrementalSync(s, options)
}

// SyncFolderIncrementally synchronizes emails incrementally for a specific folder
func (c *IMAPClientImpl) SyncFolderIncrementally(s store.Store, accountID string, folder string) error {
	options := DefaultIncrementalSyncOptions(accountID)
	options.Folder = folder
	return c.IncrementalSync(s, options)
}

// SyncRecentEmailsIncrementally synchronizes recent emails incrementally
func (c *IMAPClientImpl) SyncRecentEmailsIncrementally(s store.Store, accountID string, since time.Time) error {
	options := DefaultIncrementalSyncOptions(accountID)
	return c.IncrementalSync(s, options)
}
