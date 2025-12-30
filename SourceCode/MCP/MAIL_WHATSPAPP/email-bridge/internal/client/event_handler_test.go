package client

import (
	"sync"
	"testing"
	"time"

	"github.com/user/email-bridge/internal/models"
	"github.com/user/email-bridge/internal/store"
)

// MockStore implements the store.Store interface for testing
type MockStore struct {
	emails map[string]models.Email
	mutex  sync.RWMutex
}

func NewMockStore() *MockStore {
	return &MockStore{
		emails: make(map[string]models.Email),
		mutex:  sync.RWMutex{},
	}
}

func (s *MockStore) StoreEmail(email models.Email) error {
	s.mutex.Lock()
	defer s.mutex.Unlock()
	s.emails[email.ID] = email
	return nil
}

func (s *MockStore) GetEmail(id string) (models.Email, error) {
	s.mutex.RLock()
	defer s.mutex.RUnlock()
	email, ok := s.emails[id]
	if !ok {
		return models.Email{}, store.ErrEmailNotFound
	}
	return email, nil
}

func (s *MockStore) UpdateEmailStatus(id string, status models.EmailStatus) error {
	s.mutex.Lock()
	defer s.mutex.Unlock()
	email, ok := s.emails[id]
	if !ok {
		return store.ErrEmailNotFound
	}
	email.IsRead = status.IsRead
	s.emails[id] = email
	return nil
}

func (s *MockStore) MoveEmail(id string, folder string) error {
	s.mutex.Lock()
	defer s.mutex.Unlock()
	email, ok := s.emails[id]
	if !ok {
		return store.ErrEmailNotFound
	}
	email.Folder = folder
	s.emails[id] = email
	return nil
}

func (s *MockStore) DeleteEmail(id string) error {
	s.mutex.Lock()
	defer s.mutex.Unlock()
	if _, ok := s.emails[id]; !ok {
		return store.ErrEmailNotFound
	}
	delete(s.emails, id)
	return nil
}

// Implement other required methods from the store.Store interface
func (s *MockStore) SearchEmails(criteria models.SearchCriteria) ([]models.Email, error) {
	return nil, nil
}

func (s *MockStore) GetFolders(accountID string) ([]string, error) {
	return nil, nil
}

func (s *MockStore) StoreAttachment(attachment models.Attachment) error {
	return nil
}

func (s *MockStore) GetAttachment(id string) (models.Attachment, error) {
	return models.Attachment{}, nil
}

func TestEmailEventHandler(t *testing.T) {
	// Create a mock store
	mockStore := NewMockStore()

	// Create an event handler
	handler := GetEmailEventHandler(mockStore)

	// Test email
	testEmail := models.Email{
		ID:        "test-email-1",
		AccountID: "test-account",
		MessageID: "<test@example.com>",
		Folder:    "INBOX",
		From: models.Address{
			Name:  "Sender",
			Email: "sender@example.com",
		},
		To: []models.Address{
			{
				Name:  "Recipient",
				Email: "recipient@example.com",
			},
		},
		Subject:     "Test Email",
		TextContent: "This is a test email",
		Date:        time.Now(),
		IsRead:      false,
	}

	// Test HandleNewEmail
	t.Run("HandleNewEmail", func(t *testing.T) {
		// Register a handler for new email events
		eventReceived := make(chan bool, 1)
		handler.RegisterEventHandler(EmailEventNew, func(event EmailEvent) {
			if event.Type != EmailEventNew {
				t.Errorf("Expected event type %s, got %s", EmailEventNew, event.Type)
			}
			if event.Email.ID != testEmail.ID {
				t.Errorf("Expected email ID %s, got %s", testEmail.ID, event.Email.ID)
			}
			eventReceived <- true
		})

		// Handle a new email
		err := handler.HandleNewEmail(testEmail)
		if err != nil {
			t.Fatalf("HandleNewEmail failed: %v", err)
		}

		// Wait for the event to be processed
		select {
		case <-eventReceived:
			// Event was received
		case <-time.After(time.Second):
			t.Fatal("Timed out waiting for event")
		}

		// Verify the email was stored
		storedEmail, err := mockStore.GetEmail(testEmail.ID)
		if err != nil {
			t.Fatalf("Failed to get stored email: %v", err)
		}
		if storedEmail.ID != testEmail.ID {
			t.Errorf("Expected email ID %s, got %s", testEmail.ID, storedEmail.ID)
		}
	})

	// Test HandleStatusChange
	t.Run("HandleStatusChange", func(t *testing.T) {
		// Register a handler for read email events
		eventReceived := make(chan bool, 1)
		handler.RegisterEventHandler(EmailEventRead, func(event EmailEvent) {
			if event.Type != EmailEventRead {
				t.Errorf("Expected event type %s, got %s", EmailEventRead, event.Type)
			}
			if event.Email.ID != testEmail.ID {
				t.Errorf("Expected email ID %s, got %s", testEmail.ID, event.Email.ID)
			}
			eventReceived <- true
		})

		// Handle a status change
		err := handler.HandleStatusChange(testEmail.ID, models.EmailStatus{IsRead: true})
		if err != nil {
			t.Fatalf("HandleStatusChange failed: %v", err)
		}

		// Wait for the event to be processed
		select {
		case <-eventReceived:
			// Event was received
		case <-time.After(time.Second):
			t.Fatal("Timed out waiting for event")
		}

		// Verify the email status was updated
		storedEmail, err := mockStore.GetEmail(testEmail.ID)
		if err != nil {
			t.Fatalf("Failed to get stored email: %v", err)
		}
		if !storedEmail.IsRead {
			t.Error("Expected email to be marked as read")
		}
	})

	// Test HandleFolderChange
	t.Run("HandleFolderChange", func(t *testing.T) {
		// Register a handler for moved email events
		eventReceived := make(chan bool, 1)
		handler.RegisterEventHandler(EmailEventMoved, func(event EmailEvent) {
			if event.Type != EmailEventMoved {
				t.Errorf("Expected event type %s, got %s", EmailEventMoved, event.Type)
			}
			if event.Email.ID != testEmail.ID {
				t.Errorf("Expected email ID %s, got %s", testEmail.ID, event.Email.ID)
			}
			if event.OldValue != "INBOX" {
				t.Errorf("Expected old folder INBOX, got %s", event.OldValue)
			}
			if event.NewValue != "Archive" {
				t.Errorf("Expected new folder Archive, got %s", event.NewValue)
			}
			eventReceived <- true
		})

		// Handle a folder change
		err := handler.HandleFolderChange(testEmail.ID, "INBOX", "Archive")
		if err != nil {
			t.Fatalf("HandleFolderChange failed: %v", err)
		}

		// Wait for the event to be processed
		select {
		case <-eventReceived:
			// Event was received
		case <-time.After(time.Second):
			t.Fatal("Timed out waiting for event")
		}

		// Verify the email folder was updated
		storedEmail, err := mockStore.GetEmail(testEmail.ID)
		if err != nil {
			t.Fatalf("Failed to get stored email: %v", err)
		}
		if storedEmail.Folder != "Archive" {
			t.Errorf("Expected folder Archive, got %s", storedEmail.Folder)
		}
	})

	// Test HandleDeletedEmail
	t.Run("HandleDeletedEmail", func(t *testing.T) {
		// Register a handler for deleted email events
		eventReceived := make(chan bool, 1)
		handler.RegisterEventHandler(EmailEventDeleted, func(event EmailEvent) {
			if event.Type != EmailEventDeleted {
				t.Errorf("Expected event type %s, got %s", EmailEventDeleted, event.Type)
			}
			if event.Email.ID != testEmail.ID {
				t.Errorf("Expected email ID %s, got %s", testEmail.ID, event.Email.ID)
			}
			eventReceived <- true
		})

		// Handle a deleted email
		err := handler.HandleDeletedEmail(testEmail.ID)
		if err != nil {
			t.Fatalf("HandleDeletedEmail failed: %v", err)
		}

		// Wait for the event to be processed
		select {
		case <-eventReceived:
			// Event was received
		case <-time.After(time.Second):
			t.Fatal("Timed out waiting for event")
		}

		// Verify the email was deleted
		_, err = mockStore.GetEmail(testEmail.ID)
		if err != store.ErrEmailNotFound {
			t.Errorf("Expected error %v, got %v", store.ErrEmailNotFound, err)
		}
	})
}
