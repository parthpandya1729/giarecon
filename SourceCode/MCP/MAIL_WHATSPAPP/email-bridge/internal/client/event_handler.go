package client

import (
	"fmt"
	"sync"

	"github.com/user/email-bridge/internal/models"
	"github.com/user/email-bridge/internal/store"
)

// EmailEventType represents the type of email event
type EmailEventType string

const (
	// EmailEventNew represents a new email event
	EmailEventNew EmailEventType = "new"
	// EmailEventRead represents an email read event
	EmailEventRead EmailEventType = "read"
	// EmailEventUnread represents an email unread event
	EmailEventUnread EmailEventType = "unread"
	// EmailEventMoved represents an email moved event
	EmailEventMoved EmailEventType = "moved"
	// EmailEventDeleted represents an email deleted event
	EmailEventDeleted EmailEventType = "deleted"

	// FolderEventCreated represents a folder created event
	FolderEventCreated EmailEventType = "folder_created"
	// FolderEventRenamed represents a folder renamed event
	FolderEventRenamed EmailEventType = "folder_renamed"
	// FolderEventDeleted represents a folder deleted event
	FolderEventDeleted EmailEventType = "folder_deleted"
	// FolderEventSynced represents a folder sync event
	FolderEventSynced EmailEventType = "folder_synced"
)

// EmailEvent represents an email event
type EmailEvent struct {
	Type      EmailEventType
	Email     models.Email
	AccountID string          // Used for folder events
	OldValue  string          // Used for moved/renamed events (old folder)
	NewValue  string          // Used for moved/renamed events (new folder)
	Folders   []models.Folder // Used for folder sync events
}

// EmailEventHandler handles email events
type EmailEventHandler struct {
	store         store.Store
	eventHandlers map[EmailEventType][]func(EmailEvent)
	mutex         sync.RWMutex
}

var (
	// Global event handler instance
	globalEventHandler *EmailEventHandler
	eventHandlerMutex  sync.Mutex
)

// GetEmailEventHandler returns the global email event handler instance
func GetEmailEventHandler(store store.Store) *EmailEventHandler {
	eventHandlerMutex.Lock()
	defer eventHandlerMutex.Unlock()

	if globalEventHandler == nil {
		globalEventHandler = &EmailEventHandler{
			store:         store,
			eventHandlers: make(map[EmailEventType][]func(EmailEvent)),
			mutex:         sync.RWMutex{},
		}
	}

	return globalEventHandler
}

// RegisterEventHandler registers a handler for a specific event type
func (h *EmailEventHandler) RegisterEventHandler(eventType EmailEventType, handler func(EmailEvent)) {
	h.mutex.Lock()
	defer h.mutex.Unlock()

	h.eventHandlers[eventType] = append(h.eventHandlers[eventType], handler)
}

// HandleNewEmail handles a new email event
func (h *EmailEventHandler) HandleNewEmail(email models.Email) error {
	// Store the email in the database
	if h.store != nil {
		if err := h.store.StoreEmail(email); err != nil {
			return fmt.Errorf("failed to store email: %w", err)
		}
	}

	// Create the event
	event := EmailEvent{
		Type:  EmailEventNew,
		Email: email,
	}

	// Notify handlers
	h.notifyHandlers(event)

	return nil
}

// HandleStatusChange handles an email status change event
func (h *EmailEventHandler) HandleStatusChange(emailID string, status models.EmailStatus) error {
	// Get the email from the store
	email, err := h.store.GetEmail(emailID)
	if err != nil {
		return fmt.Errorf("failed to get email: %w", err)
	}

	// Update the email status in the store
	if h.store != nil {
		if err := h.store.UpdateEmailStatus(emailID, status); err != nil {
			return fmt.Errorf("failed to update email status: %w", err)
		}
	}

	// Create the event
	eventType := EmailEventRead
	if !status.IsRead {
		eventType = EmailEventUnread
	}

	event := EmailEvent{
		Type:  eventType,
		Email: email,
	}

	// Notify handlers
	h.notifyHandlers(event)

	return nil
}

// HandleFolderChange handles an email folder change event
func (h *EmailEventHandler) HandleFolderChange(emailID string, oldFolder, newFolder string) error {
	// Get the email from the store
	email, err := h.store.GetEmail(emailID)
	if err != nil {
		return fmt.Errorf("failed to get email: %w", err)
	}

	// Update the email folder in the store
	if h.store != nil {
		if err := h.store.MoveEmail(emailID, newFolder); err != nil {
			return fmt.Errorf("failed to move email: %w", err)
		}
	}

	// Create the event
	event := EmailEvent{
		Type:     EmailEventMoved,
		Email:    email,
		OldValue: oldFolder,
		NewValue: newFolder,
	}

	// Notify handlers
	h.notifyHandlers(event)

	return nil
}

// HandleDeletedEmail handles an email deleted event
func (h *EmailEventHandler) HandleDeletedEmail(emailID string) error {
	// Get the email from the store before deleting it
	email, err := h.store.GetEmail(emailID)
	if err != nil {
		return fmt.Errorf("failed to get email: %w", err)
	}

	// Delete the email from the store
	if h.store != nil {
		if err := h.store.DeleteEmail(emailID); err != nil {
			return fmt.Errorf("failed to delete email: %w", err)
		}
	}

	// Create the event
	event := EmailEvent{
		Type:  EmailEventDeleted,
		Email: email,
	}

	// Notify handlers
	h.notifyHandlers(event)

	return nil
}

// notifyHandlers notifies all registered handlers for an event
func (h *EmailEventHandler) notifyHandlers(event EmailEvent) {
	h.mutex.RLock()
	defer h.mutex.RUnlock()

	// Get handlers for this event type
	handlers, ok := h.eventHandlers[event.Type]
	if !ok {
		return
	}

	// Notify all handlers
	for _, handler := range handlers {
		go handler(event)
	}
}

// HandleFolderCreated handles a folder creation event
func (h *EmailEventHandler) HandleFolderCreated(accountID string, folderName string) error {
	// Create the folder in the database
	if h.store != nil {
		if err := h.store.CreateFolder(accountID, folderName); err != nil {
			return fmt.Errorf("failed to create folder: %w", err)
		}
	}

	// Create the event
	event := EmailEvent{
		Type:      FolderEventCreated,
		AccountID: accountID,
		NewValue:  folderName,
	}

	// Notify handlers
	h.notifyHandlers(event)

	return nil
}

// HandleFolderRenamed handles a folder rename event
func (h *EmailEventHandler) HandleFolderRenamed(accountID string, oldName string, newName string) error {
	// Rename the folder in the database
	if h.store != nil {
		if err := h.store.RenameFolder(accountID, oldName, newName); err != nil {
			return fmt.Errorf("failed to rename folder: %w", err)
		}
	}

	// Create the event
	event := EmailEvent{
		Type:      FolderEventRenamed,
		AccountID: accountID,
		OldValue:  oldName,
		NewValue:  newName,
	}

	// Notify handlers
	h.notifyHandlers(event)

	return nil
}

// HandleFolderDeleted handles a folder deletion event
func (h *EmailEventHandler) HandleFolderDeleted(accountID string, folderName string) error {
	// Delete the folder from the database
	if h.store != nil {
		if err := h.store.DeleteFolder(accountID, folderName); err != nil {
			return fmt.Errorf("failed to delete folder: %w", err)
		}
	}

	// Create the event
	event := EmailEvent{
		Type:      FolderEventDeleted,
		AccountID: accountID,
		OldValue:  folderName,
	}

	// Notify handlers
	h.notifyHandlers(event)

	return nil
}

// SyncFolders synchronizes folders between the server and local database
func (h *EmailEventHandler) SyncFolders(client IMAPClient, accountID string, options models.FolderSyncOptions) error {
	// Set the account ID in the options
	options.AccountID = accountID

	// Get folders from the server before synchronization
	serverFolders, err := client.GetFoldersDetailed()
	if err != nil {
		return fmt.Errorf("failed to get folders from server: %w", err)
	}

	// Synchronize folders
	if err := client.SyncFolders(h.store, options); err != nil {
		return fmt.Errorf("failed to synchronize folders: %w", err)
	}

	// Create the event
	event := EmailEvent{
		Type:      FolderEventSynced,
		AccountID: accountID,
		Folders:   serverFolders,
	}

	// Notify handlers
	h.notifyHandlers(event)

	return nil
}
