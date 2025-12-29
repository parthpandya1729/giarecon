package client

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/user/email-bridge/internal/models"
)

// TestHandleFolderEvents tests the folder event handling methods
func TestHandleFolderEvents(t *testing.T) {
	// Create a mock store
	mockStore := new(MockStore)

	// Set up expectations for folder creation
	mockStore.On("CreateFolder", "test-account", "New Folder").Return(nil)

	// Set up expectations for folder renaming
	mockStore.On("RenameFolder", "test-account", "Old Folder", "New Folder").Return(nil)

	// Set up expectations for folder deletion
	mockStore.On("DeleteFolder", "test-account", "Folder to Delete").Return(nil)

	// Create the event handler
	handler := GetEmailEventHandler(mockStore)

	// Test folder creation
	err := handler.HandleFolderCreated("test-account", "New Folder")
	assert.NoError(t, err)

	// Test folder renaming
	err = handler.HandleFolderRenamed("test-account", "Old Folder", "New Folder")
	assert.NoError(t, err)

	// Test folder deletion
	err = handler.HandleFolderDeleted("test-account", "Folder to Delete")
	assert.NoError(t, err)

	// Verify expectations
	mockStore.AssertExpectations(t)
}

// TestSyncFolders tests the SyncFolders method
func TestSyncFolders(t *testing.T) {
	// Create a mock store
	mockStore := new(MockStore)

	// Create a mock IMAP client
	mockClient := new(MockIMAPClient)

	// Create test folders
	folders := []models.Folder{
		{
			AccountID:    "test-account",
			Name:         "INBOX",
			Path:         "INBOX",
			IsInbox:      true,
			IsSubscribed: true,
		},
		{
			AccountID:    "test-account",
			Name:         "Sent",
			Path:         "Sent",
			IsSent:       true,
			IsSubscribed: true,
		},
	}

	// Local folders
	localFolders := []string{"INBOX", "Sent"}

	// Set up expectations
	mockClient.On("GetFoldersDetailed").Return(folders, nil)
	mockStore.On("GetFolders", "test-account").Return(localFolders, nil)

	// Create sync options
	options := models.FolderSyncOptions{
		CreateMissing: false,
		DeleteExtra:   false,
		SubscribeNew:  false,
	}

	// Create the event handler
	handler := GetEmailEventHandler(mockStore)

	// Test folder synchronization
	err := handler.SyncFolders(mockClient, "test-account", options)
	assert.NoError(t, err)

	// Verify expectations
	mockClient.AssertExpectations(t)
	mockStore.AssertExpectations(t)
}
