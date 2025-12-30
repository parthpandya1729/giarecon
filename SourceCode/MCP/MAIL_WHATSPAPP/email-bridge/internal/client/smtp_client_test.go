package client

import (
	"testing"

	"github.com/user/email-bridge/internal/config"
	"github.com/user/email-bridge/internal/models"
)

// TestSMTPClientImpl tests the basic functionality of the SMTP client
func TestSMTPClientImpl(t *testing.T) {
	// Create a test configuration
	testConfig := config.AccountConfig{
		ID:    "test-account",
		Name:  "Test Account",
		Email: "test@example.com",
		SMTPConfig: config.SMTPConfig{
			Server:   "smtp.example.com",
			Port:     587,
			Username: "test@example.com",
			Password: "password",
			UseTLS:   true,
		},
		AuthType: "password",
	}

	// Create a client
	client := NewSMTPClientImpl(testConfig)

	// Verify client properties
	if client.config.ID != "test-account" {
		t.Errorf("Expected client ID to be 'test-account', got '%s'", client.config.ID)
	}

	if client.connected {
		t.Errorf("Expected client to be disconnected initially")
	}

	if client.client != nil {
		t.Errorf("Expected client.client to be nil initially")
	}

	// Test IsConnected
	if client.IsConnected() {
		t.Errorf("Expected IsConnected to return false initially")
	}

	// Test Disconnect when not connected
	err := client.Disconnect()
	if err != nil {
		t.Errorf("Expected Disconnect to succeed when not connected, got error: %v", err)
	}
}

// mockSMTPClient is a mock implementation of the SMTPClient interface for testing
type mockSMTPClient struct {
	connected     bool
	connectErr    error
	disconnectErr error
	sendEmailErr  error
}

func (m *mockSMTPClient) Connect() error {
	if m.connectErr != nil {
		return m.connectErr
	}
	m.connected = true
	return nil
}

func (m *mockSMTPClient) Disconnect() error {
	if m.disconnectErr != nil {
		return m.disconnectErr
	}
	m.connected = false
	return nil
}

func (m *mockSMTPClient) IsConnected() bool {
	return m.connected
}

func (m *mockSMTPClient) SendEmail(email models.Email) error {
	if m.sendEmailErr != nil {
		return m.sendEmailErr
	}
	return nil
}

// TestConnectionManagerWithSMTP tests the interaction between the connection manager and SMTP client
func TestConnectionManagerWithSMTP(t *testing.T) {
	// Create a connection manager
	cm := &ConnectionManager{
		clients:       make(map[string]EmailClient),
		reconnectChan: make(chan string, 10),
		stopChan:      make(chan struct{}),
		running:       true,
	}

	// Create a mock SMTP client
	mockClient := &mockSMTPClient{
		connected: false,
	}

	// Register the client
	clientID := "smtp-test"
	cm.RegisterClient(clientID, mockClient)

	// Verify client was registered
	client, ok := cm.GetClient(clientID)
	if !ok {
		t.Errorf("Expected client to be registered")
	}
	if client != mockClient {
		t.Errorf("Expected to get the same client that was registered")
	}

	// Test scheduling reconnect
	cm.ScheduleReconnect(clientID)
	// In a real test, we would verify that the reconnect was scheduled
	// but that would require more complex test setup

	// Test unregistering client
	cm.UnregisterClient(clientID)
	_, ok = cm.GetClient(clientID)
	if ok {
		t.Errorf("Expected client to be unregistered")
	}
}
