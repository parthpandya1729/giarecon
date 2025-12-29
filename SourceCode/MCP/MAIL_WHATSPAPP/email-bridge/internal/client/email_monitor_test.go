package client

import (
	"sync"
	"testing"
	"time"

	"github.com/user/email-bridge/internal/models"
	"github.com/user/email-bridge/internal/store"
)

// MockIMAPClient is a mock implementation of the IMAPClient interface for testing
type MockIMAPClient struct {
	connected      bool
	monitoring     bool
	monitoringFunc func(models.Email)
	mutex          sync.Mutex
}

func (m *MockIMAPClient) Connect() error {
	m.mutex.Lock()
	defer m.mutex.Unlock()
	m.connected = true
	return nil
}

func (m *MockIMAPClient) Disconnect() error {
	m.mutex.Lock()
	defer m.mutex.Unlock()
	m.connected = false
	m.monitoring = false
	return nil
}

func (m *MockIMAPClient) IsConnected() bool {
	m.mutex.Lock()
	defer m.mutex.Unlock()
	return m.connected
}

func (m *MockIMAPClient) FetchEmails(criteria models.SearchCriteria) ([]models.Email, error) {
	return []models.Email{}, nil
}

func (m *MockIMAPClient) GetFolders() ([]string, error) {
	return []string{"INBOX"}, nil
}

func (m *MockIMAPClient) MonitorMailbox(callback func(models.Email)) error {
	m.mutex.Lock()
	defer m.mutex.Unlock()
	m.monitoring = true
	m.monitoringFunc = callback
	return nil
}

func (m *MockIMAPClient) StopMonitoring() error {
	m.mutex.Lock()
	defer m.mutex.Unlock()
	m.monitoring = false
	return nil
}

func (m *MockIMAPClient) MarkAsRead(emailID string) error {
	return nil
}

func (m *MockIMAPClient) MarkAsUnread(emailID string) error {
	return nil
}

func (m *MockIMAPClient) MoveEmail(emailID string, folder string) error {
	return nil
}

func (m *MockIMAPClient) DeleteEmail(emailID string) error {
	return nil
}

func (m *MockIMAPClient) GetAttachment(emailID string, attachmentID string) (models.Attachment, error) {
	return models.Attachment{}, nil
}

// MockStore is a mock implementation of the store.Store interface for testing
type MockStore struct {
	emails map[string]models.Email
	mutex  sync.Mutex
}

func NewMockStore() *MockStore {
	return &MockStore{
		emails: make(map[string]models.Email),
		mutex:  sync.Mutex{},
	}
}

func (s *MockStore) StoreEmail(email models.Email) error {
	s.mutex.Lock()
	defer s.mutex.Unlock()
	s.emails[email.ID] = email
	return nil
}

func (s *MockStore) GetEmail(id string) (models.Email, error) {
	s.mutex.Lock()
	defer s.mutex.Unlock()
	email, ok := s.emails[id]
	if !ok {
		return models.Email{}, store.ErrEmailNotFound
	}
	return email, nil
}

func (s *MockStore) SearchEmails(criteria models.SearchCriteria) ([]models.Email, error) {
	return []models.Email{}, nil
}

func (s *MockStore) UpdateEmailStatus(id string, status models.EmailStatus) error {
	return nil
}

func (s *MockStore) MoveEmail(id string, folder string) error {
	return nil
}

func (s *MockStore) DeleteEmail(id string) error {
	s.mutex.Lock()
	defer s.mutex.Unlock()
	delete(s.emails, id)
	return nil
}

func (s *MockStore) StoreAttachment(attachment models.Attachment) error {
	return nil
}

func (s *MockStore) GetAttachment(id string) (models.Attachment, error) {
	return models.Attachment{}, nil
}

func (s *MockStore) GetFolders(accountID string) ([]string, error) {
	return []string{"INBOX"}, nil
}

func (s *MockStore) Close() error {
	return nil
}

// TestEmailMonitor tests the email monitor functionality
func TestEmailMonitor(t *testing.T) {
	// Create a mock store
	mockStore := NewMockStore()

	// Create an email monitor
	monitor := GetEmailMonitor(mockStore)

	// Create a mock IMAP client
	mockClient := &MockIMAPClient{
		connected:  true,
		monitoring: false,
	}

	// Register the client with the monitor
	monitor.RegisterClient("test-client", mockClient)

	// Start the monitor
	monitor.Start()

	// Wait for monitoring to start
	time.Sleep(100 * time.Millisecond)

	// Check if the client is being monitored
	if !mockClient.monitoring {
		t.Error("Client should be monitoring")
	}

	// Simulate a new email
	email := models.Email{
		ID:        "test-email",
		AccountID: "test-account",
		MessageID: "<test@example.com>",
		Folder:    "INBOX",
		Subject:   "Test Email",
		From: models.Address{
			Name:  "Test Sender",
			Email: "sender@example.com",
		},
		To: []models.Address{
			{
				Name:  "Test Recipient",
				Email: "recipient@example.com",
			},
		},
		TextContent: "This is a test email",
		Date:        time.Now(),
	}

	// Trigger the callback
	mockClient.monitoringFunc(email)

	// Wait for the email to be processed
	time.Sleep(100 * time.Millisecond)

	// Check if the email was stored
	storedEmail, err := mockStore.GetEmail("test-email")
	if err != nil {
		t.Errorf("Failed to get stored email: %v", err)
	}

	if storedEmail.ID != email.ID {
		t.Errorf("Stored email ID does not match: got %s, want %s", storedEmail.ID, email.ID)
	}

	// Stop the monitor
	monitor.Stop()

	// Wait for monitoring to stop
	time.Sleep(100 * time.Millisecond)

	// Check if monitoring was stopped
	if mockClient.monitoring {
		t.Error("Client should not be monitoring")
	}
}

// TestEmailMonitorMultipleClients tests the email monitor with multiple clients
func TestEmailMonitorMultipleClients(t *testing.T) {
	// Create a mock store
	mockStore := NewMockStore()

	// Create an email monitor
	monitor := GetEmailMonitor(mockStore)

	// Create mock IMAP clients
	mockClient1 := &MockIMAPClient{
		connected:  true,
		monitoring: false,
	}

	mockClient2 := &MockIMAPClient{
		connected:  true,
		monitoring: false,
	}

	// Register the clients with the monitor
	monitor.RegisterClient("test-client-1", mockClient1)
	monitor.RegisterClient("test-client-2", mockClient2)

	// Start the monitor
	monitor.Start()

	// Wait for monitoring to start
	time.Sleep(100 * time.Millisecond)

	// Check if the clients are being monitored
	if !mockClient1.monitoring {
		t.Error("Client 1 should be monitoring")
	}

	if !mockClient2.monitoring {
		t.Error("Client 2 should be monitoring")
	}

	// Unregister one client
	monitor.UnregisterClient("test-client-1")

	// Wait for unregistration to take effect
	time.Sleep(100 * time.Millisecond)

	// Check if client 1 is no longer monitoring
	if mockClient1.monitoring {
		t.Error("Client 1 should not be monitoring")
	}

	// Check if client 2 is still monitoring
	if !mockClient2.monitoring {
		t.Error("Client 2 should still be monitoring")
	}

	// Stop the monitor
	monitor.Stop()

	// Wait for monitoring to stop
	time.Sleep(100 * time.Millisecond)

	// Check if all monitoring was stopped
	if mockClient2.monitoring {
		t.Error("Client 2 should not be monitoring")
	}
}
