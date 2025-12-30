package client

import (
	"testing"
	"time"

	"github.com/user/email-bridge/internal/models"
)

// TestIMAPClientMonitoring tests the IMAP client monitoring functionality
func TestIMAPClientMonitoring(t *testing.T) {
	// Create a mock IMAP client
	mockClient := &MockIMAPClient{
		connected:  true,
		monitoring: false,
	}

	// Create a channel to receive emails
	emailChan := make(chan models.Email, 1)

	// Start monitoring
	err := mockClient.MonitorMailbox(func(email models.Email) {
		emailChan <- email
	})

	if err != nil {
		t.Fatalf("Failed to start monitoring: %v", err)
	}

	// Check if monitoring is active
	if !mockClient.monitoring {
		t.Error("Client should be monitoring")
	}

	// Create a test email
	testEmail := models.Email{
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

	// Simulate receiving a new email
	mockClient.monitoringFunc(testEmail)

	// Wait for the email to be processed
	select {
	case receivedEmail := <-emailChan:
		// Verify the email
		if receivedEmail.ID != testEmail.ID {
			t.Errorf("Received email ID does not match: got %s, want %s", receivedEmail.ID, testEmail.ID)
		}
		if receivedEmail.Subject != testEmail.Subject {
			t.Errorf("Received email subject does not match: got %s, want %s", receivedEmail.Subject, testEmail.Subject)
		}
	case <-time.After(1 * time.Second):
		t.Error("Timed out waiting for email")
	}

	// Stop monitoring
	err = mockClient.StopMonitoring()
	if err != nil {
		t.Fatalf("Failed to stop monitoring: %v", err)
	}

	// Check if monitoring was stopped
	if mockClient.monitoring {
		t.Error("Client should not be monitoring")
	}
}

// TestIMAPClientMonitoringIntegration tests the integration between IMAP client monitoring and the email event handler
func TestIMAPClientMonitoringIntegration(t *testing.T) {
	// Create a mock store
	mockStore := NewMockStore()

	// Create an email event handler
	eventHandler := GetEmailEventHandler(mockStore)

	// Create a channel to track events
	eventChan := make(chan EmailEvent, 1)

	// Register an event handler for new emails
	eventHandler.RegisterEventHandler(EmailEventNew, func(event EmailEvent) {
		eventChan <- event
	})

	// Create a mock IMAP client
	mockClient := &MockIMAPClient{
		connected:  true,
		monitoring: false,
	}

	// Start monitoring with a callback that uses the event handler
	err := mockClient.MonitorMailbox(func(email models.Email) {
		eventHandler.HandleNewEmail(email)
	})

	if err != nil {
		t.Fatalf("Failed to start monitoring: %v", err)
	}

	// Create a test email
	testEmail := models.Email{
		ID:        "test-email-integration",
		AccountID: "test-account",
		MessageID: "<test-integration@example.com>",
		Folder:    "INBOX",
		Subject:   "Test Integration Email",
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
		TextContent: "This is a test integration email",
		Date:        time.Now(),
	}

	// Simulate receiving a new email
	mockClient.monitoringFunc(testEmail)

	// Wait for the event to be processed
	select {
	case event := <-eventChan:
		// Verify the event
		if event.Type != EmailEventNew {
			t.Errorf("Event type does not match: got %s, want %s", event.Type, EmailEventNew)
		}
		if event.Email.ID != testEmail.ID {
			t.Errorf("Event email ID does not match: got %s, want %s", event.Email.ID, testEmail.ID)
		}
		if event.Email.Subject != testEmail.Subject {
			t.Errorf("Event email subject does not match: got %s, want %s", event.Email.Subject, testEmail.Subject)
		}
	case <-time.After(1 * time.Second):
		t.Error("Timed out waiting for event")
	}

	// Verify the email was stored in the mock store
	storedEmail, err := mockStore.GetEmail("test-email-integration")
	if err != nil {
		t.Errorf("Failed to get stored email: %v", err)
	}

	if storedEmail.ID != testEmail.ID {
		t.Errorf("Stored email ID does not match: got %s, want %s", storedEmail.ID, testEmail.ID)
	}

	// Stop monitoring
	err = mockClient.StopMonitoring()
	if err != nil {
		t.Fatalf("Failed to stop monitoring: %v", err)
	}
}
