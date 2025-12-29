package client

import (
	"fmt"
	"strings"

	"github.com/emersion/go-imap"
	"github.com/user/email-bridge/internal/models"
	"github.com/user/email-bridge/internal/store"
)

// GetFoldersDetailed retrieves detailed folder information
func (c *IMAPClientImpl) GetFoldersDetailed() ([]models.Folder, error) {
	c.mutex.Lock()
	defer c.mutex.Unlock()

	if !c.connected || c.client == nil {
		return nil, fmt.Errorf("not connected to IMAP server")
	}

	// List mailboxes
	mailboxes := make(chan *imap.MailboxInfo, 10)
	done := make(chan error, 1)
	go func() {
		err := c.client.List("", "*", mailboxes)
		done <- err
	}()

	var folders []models.Folder
	for m := range mailboxes {
		folder := models.Folder{
			AccountID: c.config.ID,
			Name:      m.Name,
			Path:      m.Name,
		}

		// Check if this is a special folder
		lowerName := strings.ToLower(m.Name)
		folder.IsInbox = lowerName == "inbox"
		folder.IsSent = strings.Contains(lowerName, "sent")
		folder.IsTrash = strings.Contains(lowerName, "trash") || strings.Contains(lowerName, "deleted")
		folder.IsDrafts = strings.Contains(lowerName, "draft")
		folder.IsJunk = strings.Contains(lowerName, "junk") || strings.Contains(lowerName, "spam")
		folder.IsArchive = strings.Contains(lowerName, "archive")
		folder.IsImportant = strings.Contains(lowerName, "important") || strings.Contains(lowerName, "starred")

		// Check folder attributes from flags
		for _, flag := range m.Attributes {
			switch flag {
			case imap.NoSelectAttr:
				folder.CanSelect = false
			case imap.HasChildrenAttr:
				folder.CanCreate = true
			case imap.MarkedAttr:
				folder.IsImportant = true
			}
		}

		// By default, folders can be selected unless marked otherwise
		if !folder.CanSelect {
			folder.CanSelect = true
		}

		folders = append(folders, folder)
	}

	if err := <-done; err != nil {
		// Handle connection error
		if c.handleConnectionError(err) {
			// Try again once if it was a connection error that was fixed
			return c.GetFoldersDetailed()
		}
		return nil, fmt.Errorf("failed to list folders: %w", err)
	}

	// Check subscription status for each folder
	if err := c.populateSubscriptionStatus(&folders); err != nil {
		return folders, fmt.Errorf("failed to get subscription status: %w", err)
	}

	return folders, nil
}

// populateSubscriptionStatus checks which folders are subscribed
func (c *IMAPClientImpl) populateSubscriptionStatus(folders *[]models.Folder) error {
	// List subscribed mailboxes
	mailboxes := make(chan *imap.MailboxInfo, 10)
	done := make(chan error, 1)
	go func() {
		err := c.client.Lsub("", "*", mailboxes)
		done <- err
	}()

	// Create a map of subscribed folder names
	subscribed := make(map[string]bool)
	for m := range mailboxes {
		subscribed[m.Name] = true
	}

	if err := <-done; err != nil {
		return err
	}

	// Update subscription status for each folder
	for i := range *folders {
		(*folders)[i].IsSubscribed = subscribed[(*folders)[i].Name]
	}

	return nil
}

// SyncFolders synchronizes folders between the server and local database
func (c *IMAPClientImpl) SyncFolders(s store.Store, options models.FolderSyncOptions) error {
	// Get folders from the server
	serverFolders, err := c.GetFoldersDetailed()
	if err != nil {
		return fmt.Errorf("failed to get folders from server: %w", err)
	}

	// Get folders from the local database
	localFolderNames, err := s.GetFolders(options.AccountID)
	if err != nil {
		return fmt.Errorf("failed to get folders from database: %w", err)
	}

	// Create maps for easier comparison
	serverFolderMap := make(map[string]models.Folder)
	localFolderMap := make(map[string]bool)

	for _, folder := range serverFolders {
		serverFolderMap[folder.Name] = folder
	}

	for _, name := range localFolderNames {
		localFolderMap[name] = true
	}

	// Create folders that exist on the server but not locally
	for _, folder := range serverFolders {
		if !localFolderMap[folder.Name] {
			if err := s.CreateFolder(options.AccountID, folder.Name); err != nil {
				return fmt.Errorf("failed to create local folder %s: %w", folder.Name, err)
			}
		}
	}

	// Create folders on the server that exist locally but not on the server
	if options.CreateMissing {
		for name := range localFolderMap {
			if _, exists := serverFolderMap[name]; !exists {
				if err := c.CreateFolder(name); err != nil {
					return fmt.Errorf("failed to create server folder %s: %w", name, err)
				}

				// Subscribe to the new folder if requested
				if options.SubscribeNew {
					if err := c.SubscribeFolder(name); err != nil {
						// Log but don't fail the sync
						fmt.Printf("Failed to subscribe to folder %s: %v\n", name, err)
					}
				}
			}
		}
	}

	// Delete extra folders if requested
	if options.DeleteExtra {
		for name := range localFolderMap {
			if _, exists := serverFolderMap[name]; !exists {
				if err := s.DeleteFolder(options.AccountID, name); err != nil {
					return fmt.Errorf("failed to delete local folder %s: %w", name, err)
				}
			}
		}
	}

	return nil
}

// CreateFolder creates a new folder on the server
func (c *IMAPClientImpl) CreateFolder(name string) error {
	c.mutex.Lock()
	defer c.mutex.Unlock()

	if !c.connected || c.client == nil {
		return fmt.Errorf("not connected to IMAP server")
	}

	if err := c.client.Create(name); err != nil {
		// Handle connection error
		if c.handleConnectionError(err) {
			// Try again once if it was a connection error that was fixed
			return c.CreateFolder(name)
		}
		return fmt.Errorf("failed to create folder %s: %w", name, err)
	}

	return nil
}

// RenameFolder renames a folder on the server
func (c *IMAPClientImpl) RenameFolder(oldName string, newName string) error {
	c.mutex.Lock()
	defer c.mutex.Unlock()

	if !c.connected || c.client == nil {
		return fmt.Errorf("not connected to IMAP server")
	}

	if err := c.client.Rename(oldName, newName); err != nil {
		// Handle connection error
		if c.handleConnectionError(err) {
			// Try again once if it was a connection error that was fixed
			return c.RenameFolder(oldName, newName)
		}
		return fmt.Errorf("failed to rename folder from %s to %s: %w", oldName, newName, err)
	}

	return nil
}

// DeleteFolder deletes a folder on the server
func (c *IMAPClientImpl) DeleteFolder(name string) error {
	c.mutex.Lock()
	defer c.mutex.Unlock()

	if !c.connected || c.client == nil {
		return fmt.Errorf("not connected to IMAP server")
	}

	if err := c.client.Delete(name); err != nil {
		// Handle connection error
		if c.handleConnectionError(err) {
			// Try again once if it was a connection error that was fixed
			return c.DeleteFolder(name)
		}
		return fmt.Errorf("failed to delete folder %s: %w", name, err)
	}

	return nil
}

// SubscribeFolder subscribes to a folder
func (c *IMAPClientImpl) SubscribeFolder(name string) error {
	c.mutex.Lock()
	defer c.mutex.Unlock()

	if !c.connected || c.client == nil {
		return fmt.Errorf("not connected to IMAP server")
	}

	if err := c.client.Subscribe(name); err != nil {
		// Handle connection error
		if c.handleConnectionError(err) {
			// Try again once if it was a connection error that was fixed
			return c.SubscribeFolder(name)
		}
		return fmt.Errorf("failed to subscribe to folder %s: %w", name, err)
	}

	return nil
}

// UnsubscribeFolder unsubscribes from a folder
func (c *IMAPClientImpl) UnsubscribeFolder(name string) error {
	c.mutex.Lock()
	defer c.mutex.Unlock()

	if !c.connected || c.client == nil {
		return fmt.Errorf("not connected to IMAP server")
	}

	if err := c.client.Unsubscribe(name); err != nil {
		// Handle connection error
		if c.handleConnectionError(err) {
			// Try again once if it was a connection error that was fixed
			return c.UnsubscribeFolder(name)
		}
		return fmt.Errorf("failed to unsubscribe from folder %s: %w", name, err)
	}

	return nil
}
