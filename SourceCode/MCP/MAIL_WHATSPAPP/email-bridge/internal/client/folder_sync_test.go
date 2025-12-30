package client

import (
	"sync"
	"testing"

	"github.com/emersion/go-imap"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/user/email-bridge/internal/config"
	"github.com/user/email-bridge/internal/models"
	"github.com/user/email-bridge/internal/store"
)

// MockIMAPClient is a mock implementation of the go-imap client
type MockIMAPClient struct {
	mock.Mock
}

func (m *MockIMAPClient) List(ref, pattern string, ch chan *imap.MailboxInfo) error {
	args := m.Called(ref, pattern, ch)

	// Send mock data to the channel
	folders := args.Get(0).([]imap.MailboxInfo)
	for _, folder := range folders {
		ch <- &folder
	}
	close(ch)

	return args.Error(1)
}

func (m *MockIMAPClient) Lsub(ref, pattern string, ch chan *imap.MailboxInfo) error {
	args := m.Called(ref, pattern, ch)

	// Send mock data to the channel
	folders := args.Get(0).([]imap.MailboxInfo)
	for _, folder := range folders {
		ch <- &folder
	}
	close(ch)

	return args.Error(1)
}

func (m *MockIMAPClient) Create(name string) error {
	args := m.Called(name)
	return args.Error(0)
}

func (m *MockIMAPClient) Delete(name string) error {
	args := m.Called(name)
	return args.Error(0)
}

func (m *MockIMAPClient) Rename(oldName, newName string) error {
	args := m.Called(oldName, newName)
	return args.Error(0)
}

func (m *MockIMAPClient) Subscribe(name string) error {
	args := m.Called(name)
	return args.Error(0)
}

func (m *MockIMAPClient) Unsubscribe(name string) error {
	args := m.Called(name)
	return args.Error(0)
}

// MockStore is a mock implementation of the store.Store interface
type MockStore struct {
	mock.Mock
}

func (m *MockStore) Initialize() error {
	args := m.Called()
	return args.Error(0)
}

func (m *MockStore) Close() error {
	args := m.Called()
	return args.Error(0)
}

func (m *MockStore) StoreEmail(email models.Email) error {
	args := m.Called(email)
	return args.Error(0)
}

func (m *MockStore) GetEmail(id string) (models.Email, error) {
	args := m.Called(id)
	return args.Get(0).(models.Email), args.Error(1)
}

func (m *MockStore) SearchEmails(criteria models.SearchCriteria) ([]models.Email, error) {
	args := m.Called(criteria)
	return args.Get(0).([]models.Email), args.Error(1)
}

func (m *MockStore) UpdateEmailStatus(id string, status models.EmailStatus) error {
	args := m.Called(id, status)
	return args.Error(0)
}

func (m *MockStore) MoveEmail(id string, folder string) error {
	args := m.Called(id, folder)
	return args.Error(0)
}

func (m *MockStore) DeleteEmail(id string) error {
	args := m.Called(id)
	return args.Error(0)
}

func (m *MockStore) StoreAttachment(attachment models.Attachment) error {
	args := m.Called(attachment)
	return args.Error(0)
}

func (m *MockStore) GetAttachment(id string) (models.Attachment, error) {
	args := m.Called(id)
	return args.Get(0).(models.Attachment), args.Error(1)
}

func (m *MockStore) GetFolders(accountID string) ([]string, error) {
	args := m.Called(accountID)
	return args.Get(0).([]string), args.Error(1)
}

func (m *MockStore) CreateFolder(accountID string, name string) error {
	args := m.Called(accountID, name)
	return args.Error(0)
}

func (m *MockStore) RenameFolder(accountID string, oldName string, newName string) error {
	args := m.Called(accountID, oldName, newName)
	return args.Error(0)
}

func (m *MockStore) DeleteFolder(accountID string, name string) error {
	args := m.Called(accountID, name)
	return args.Error(0)
}

func (m *MockStore) StoreAccount(account models.Account) error {
	args := m.Called(account)
	return args.Error(0)
}

func (m *MockStore) GetAccount(id string) (models.Account, error) {
	args := m.Called(id)
	return args.Get(0).(models.Account), args.Error(1)
}

func (m *MockStore) GetAccounts() ([]models.Account, error) {
	args := m.Called()
	return args.Get(0).([]models.Account), args.Error(1)
}

func (m *MockStore) DeleteAccount(id string) error {
	args := m.Called(id)
	return args.Error(0)
}

func (m *MockStore) GetSyncStatus(accountID, folderID string) (store.SyncStatus, error) {
	args := m.Called(accountID, folderID)
	return args.Get(0).(store.SyncStatus), args.Error(1)
}

func (m *MockStore) UpdateSyncStatus(status store.SyncStatus) error {
	args := m.Called(status)
	return args.Error(0)
}

func (m *MockStore) GetAllSyncStatus(accountID string) ([]store.SyncStatus, error) {
	args := m.Called(accountID)
	return args.Get(0).([]store.SyncStatus), args.Error(1)
}

func (m *MockStore) DeleteSyncStatus(accountID, folderID string) error {
	args := m.Called(accountID, folderID)
	return args.Error(0)
}

// TestGetFoldersDetailed tests the GetFoldersDetailed method
func TestGetFoldersDetailed(t *testing.T) {
	// Create a mock IMAP client
	mockClient := new(MockIMAPClient)

	// Create test folders
	folders := []imap.MailboxInfo{
		{
			Name:       "INBOX",
			Attributes: []string{},
		},
		{
			Name:       "Sent",
			Attributes: []string{},
		},
		{
			Name:       "Trash",
			Attributes: []string{},
		},
		{
			Name:       "Drafts",
			Attributes: []string{},
		},
		{
			Name:       "Custom Folder",
			Attributes: []string{},
		},
		{
			Name:       "No Select Folder",
			Attributes: []string{imap.NoSelectAttr},
		},
	}

	// Create subscribed folders
	subscribedFolders := []imap.MailboxInfo{
		{
			Name:       "INBOX",
			Attributes: []string{},
		},
		{
			Name:       "Sent",
			Attributes: []string{},
		},
		{
			Name:       "Custom Folder",
			Attributes: []string{},
		},
	}

	// Set up expectations
	mockClient.On("List", "", "*", mock.Anything).Return(folders, nil)
	mockClient.On("Lsub", "", "*", mock.Anything).Return(subscribedFolders, nil)

	// Create the IMAP client implementation
	client := &IMAPClientImpl{
		config:    config.AccountConfig{ID: "test-account"},
		client:    mockClient,
		connected: true,
		mutex:     sync.Mutex{},
	}

	// Call the method
	result, err := client.GetFoldersDetailed()

	// Assert no error
	assert.NoError(t, err)

	// Assert the correct number of folders
	assert.Equal(t, len(folders), len(result))

	// Assert folder properties
	for _, folder := range result {
		switch folder.Name {
		case "INBOX":
			assert.True(t, folder.IsInbox)
			assert.True(t, folder.IsSubscribed)
		case "Sent":
			assert.True(t, folder.IsSent)
			assert.True(t, folder.IsSubscribed)
		case "Trash":
			assert.True(t, folder.IsTrash)
			assert.False(t, folder.IsSubscribed)
		case "Drafts":
			assert.True(t, folder.IsDrafts)
			assert.False(t, folder.IsSubscribed)
		case "Custom Folder":
			assert.False(t, folder.IsInbox)
			assert.False(t, folder.IsSent)
			assert.False(t, folder.IsTrash)
			assert.False(t, folder.IsDrafts)
			assert.True(t, folder.IsSubscribed)
		case "No Select Folder":
			assert.False(t, folder.CanSelect)
			assert.False(t, folder.IsSubscribed)
		}
	}

	// Verify expectations
	mockClient.AssertExpectations(t)
}

// TestSyncFolders tests the SyncFolders method
func TestSyncFolders(t *testing.T) {
	// Create a mock IMAP client
	mockClient := new(MockIMAPClient)

	// Create a mock store
	mockStore := new(MockStore)

	// Create test folders
	folders := []imap.MailboxInfo{
		{
			Name:       "INBOX",
			Attributes: []string{},
		},
		{
			Name:       "Sent",
			Attributes: []string{},
		},
		{
			Name:       "Server Only",
			Attributes: []string{},
		},
	}

	// Create subscribed folders (all folders are subscribed in this test)
	subscribedFolders := []imap.MailboxInfo{
		{
			Name:       "INBOX",
			Attributes: []string{},
		},
		{
			Name:       "Sent",
			Attributes: []string{},
		},
		{
			Name:       "Server Only",
			Attributes: []string{},
		},
	}

	// Local folders
	localFolders := []string{"INBOX", "Sent", "Local Only"}

	// Set up expectations
	mockClient.On("List", "", "*", mock.Anything).Return(folders, nil)
	mockClient.On("Lsub", "", "*", mock.Anything).Return(subscribedFolders, nil)
	mockStore.On("GetFolders", "test-account").Return(localFolders, nil)

	// Expect CreateFolder for "Server Only" folder in local store
	mockStore.On("CreateFolder", "test-account", "Server Only").Return(nil)

	// Expect CreateFolder for "Local Only" folder on server
	mockClient.On("Create", "Local Only").Return(nil)

	// Expect Subscribe for "Local Only" folder
	mockClient.On("Subscribe", "Local Only").Return(nil)

	// Create the IMAP client implementation
	client := &IMAPClientImpl{
		config:    config.AccountConfig{ID: "test-account"},
		client:    mockClient,
		connected: true,
		mutex:     sync.Mutex{},
	}

	// Create sync options
	options := models.FolderSyncOptions{
		AccountID:     "test-account",
		CreateMissing: true,
		DeleteExtra:   false,
		SubscribeNew:  true,
	}

	// Call the method
	err := client.SyncFolders(mockStore, options)

	// Assert no error
	assert.NoError(t, err)

	// Verify expectations
	mockClient.AssertExpectations(t)
	mockStore.AssertExpectations(t)
}

// TestCreateFolder tests the CreateFolder method
func TestCreateFolder(t *testing.T) {
	// Create a mock IMAP client
	mockClient := new(MockIMAPClient)

	// Set up expectations
	mockClient.On("Create", "New Folder").Return(nil)

	// Create the IMAP client implementation
	client := &IMAPClientImpl{
		config:    config.AccountConfig{ID: "test-account"},
		client:    mockClient,
		connected: true,
		mutex:     sync.Mutex{},
	}

	// Call the method
	err := client.CreateFolder("New Folder")

	// Assert no error
	assert.NoError(t, err)

	// Verify expectations
	mockClient.AssertExpectations(t)
}

// TestRenameFolder tests the RenameFolder method
func TestRenameFolder(t *testing.T) {
	// Create a mock IMAP client
	mockClient := new(MockIMAPClient)

	// Set up expectations
	mockClient.On("Rename", "Old Folder", "New Folder").Return(nil)

	// Create the IMAP client implementation
	client := &IMAPClientImpl{
		config:    config.AccountConfig{ID: "test-account"},
		client:    mockClient,
		connected: true,
		mutex:     sync.Mutex{},
	}

	// Call the method
	err := client.RenameFolder("Old Folder", "New Folder")

	// Assert no error
	assert.NoError(t, err)

	// Verify expectations
	mockClient.AssertExpectations(t)
}

// TestDeleteFolder tests the DeleteFolder method
func TestDeleteFolder(t *testing.T) {
	// Create a mock IMAP client
	mockClient := new(MockIMAPClient)

	// Set up expectations
	mockClient.On("Delete", "Folder to Delete").Return(nil)

	// Create the IMAP client implementation
	client := &IMAPClientImpl{
		config:    config.AccountConfig{ID: "test-account"},
		client:    mockClient,
		connected: true,
		mutex:     sync.Mutex{},
	}

	// Call the method
	err := client.DeleteFolder("Folder to Delete")

	// Assert no error
	assert.NoError(t, err)

	// Verify expectations
	mockClient.AssertExpectations(t)
}

// TestSubscribeFolder tests the SubscribeFolder method
func TestSubscribeFolder(t *testing.T) {
	// Create a mock IMAP client
	mockClient := new(MockIMAPClient)

	// Set up expectations
	mockClient.On("Subscribe", "Folder to Subscribe").Return(nil)

	// Create the IMAP client implementation
	client := &IMAPClientImpl{
		config:    config.AccountConfig{ID: "test-account"},
		client:    mockClient,
		connected: true,
		mutex:     sync.Mutex{},
	}

	// Call the method
	err := client.SubscribeFolder("Folder to Subscribe")

	// Assert no error
	assert.NoError(t, err)

	// Verify expectations
	mockClient.AssertExpectations(t)
}

// TestUnsubscribeFolder tests the UnsubscribeFolder method
func TestUnsubscribeFolder(t *testing.T) {
	// Create a mock IMAP client
	mockClient := new(MockIMAPClient)

	// Set up expectations
	mockClient.On("Unsubscribe", "Folder to Unsubscribe").Return(nil)

	// Create the IMAP client implementation
	client := &IMAPClientImpl{
		config:    config.AccountConfig{ID: "test-account"},
		client:    mockClient,
		connected: true,
		mutex:     sync.Mutex{},
	}

	// Call the method
	err := client.UnsubscribeFolder("Folder to Unsubscribe")

	// Assert no error
	assert.NoError(t, err)

	// Verify expectations
	mockClient.AssertExpectations(t)
}
