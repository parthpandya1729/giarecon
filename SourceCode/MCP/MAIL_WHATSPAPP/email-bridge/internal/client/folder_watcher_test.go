package client

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/user/email-bridge/internal/models"
)

// TestFolderWatcher tests the folder watcher functionality
func TestFolderWatcher(t *testing.T) {
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

	// Set up expectations for GetFoldersDetailed
	mockClient.On("GetFoldersDetailed").Return(folders, nil)

	// Set up expectations for SyncFolders
	mockClient.On("SyncFolders", mockStore, mock.Anything).Return(nil)

	// Set up expectations for GetFolders
	mockStore.On("GetFolders", "test-account").Return(localFolders, nil)

	// Create the folder watcher with a short sync interval for testing
	watcher := GetFolderWatcher(mockStore)
	watcher.SetSyncInterval(100 * time.Millisecond)

	// Register the client
	watcher.RegisterClient("test-account", mockClient)

	// Start the watcher
	watcher.Start()

	// Wait for at least one sync to occur
	time.Sleep(200 * time.Millisecond)

	// Stop the watcher
	watcher.Stop()

	// Verify expectations
	mockClient.AssertExpectations(t)
	mockStore.AssertExpectations(t)
}

// TestSyncFoldersForAccount tests the SyncFoldersForAccount method
func TestSyncFoldersForAccount(t *testing.T) {
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
	}

	// Local folders
	localFolders := []string{"INBOX"}

	// Set up expectations for GetFoldersDetailed
	mockClient.On("GetFoldersDetailed").Return(folders, nil)

	// Set up expectations for SyncFolders
	mockClient.On("SyncFolders", mockStore, mock.Anything).Return(nil)

	// Set up expectations for GetFolders
	mockStore.On("GetFolders", "test-account").Return(localFolders, nil)

	// Create the folder watcher
	watcher := GetFolderWatcher(mockStore)

	// Register the client
	watcher.RegisterClient("test-account", mockClient)

	// Sync folders for the account
	err := watcher.SyncFoldersForAccount("test-account")
	assert.NoError(t, err)

	// Wait for the sync to complete
	time.Sleep(100 * time.Millisecond)

	// Try to sync folders for a non-existent account
	err = watcher.SyncFoldersForAccount("non-existent")
	assert.Error(t, err)

	// Verify expectations
	mockClient.AssertExpectations(t)
	mockStore.AssertExpectations(t)
}
