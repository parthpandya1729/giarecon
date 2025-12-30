package client

import (
	"os"
	"testing"
	"time"

	"github.com/user/email-bridge/internal/config"
)

func TestInitializeEmailClients(t *testing.T) {
	// Create a temporary directory for testing
	tempDir, err := os.MkdirTemp("", "email-bridge-test")
	if err != nil {
		t.Fatalf("Failed to create temp directory: %v", err)
	}
	defer os.RemoveAll(tempDir)

	// Create test configuration
	cfg := config.Config{
		Server: config.ServerConfig{
			Host: "localhost",
			Port: 8080,
		},
		Database: config.DatabaseConfig{
			Path: "test.db",
		},
		Accounts: []config.AccountConfig{
			{
				ID:    "test-account",
				Name:  "Test Account",
				Email: "test@example.com",
				IMAPConfig: config.IMAPConfig{
					Server:   "imap.example.com",
					Port:     993,
					Username: "test@example.com",
					Password: "password",
					UseTLS:   true,
				},
				SMTPConfig: config.SMTPConfig{
					Server:   "smtp.example.com",
					Port:     587,
					Username: "test@example.com",
					Password: "password",
					UseTLS:   true,
				},
				AuthType: "password",
			},
		},
	}

	// Reset global instances for testing
	connectionManagerMutex.Lock()
	globalConnectionManager = nil
	connectionManagerMutex.Unlock()

	connectionWatcherMutex.Lock()
	globalConnectionWatcher = nil
	connectionWatcherMutex.Unlock()

	credentialManagerMutex.Lock()
	globalCredentialManager = nil
	credentialManagerMutex.Unlock()

	emailMonitorMutex.Lock()
	globalEmailMonitor = nil
	emailMonitorMutex.Unlock()

	// Create a mock store for testing
	mockStore := NewMockStore()

	// Initialize email clients
	err = InitializeEmailClients(cfg, tempDir, mockStore)
	if err != nil {
		t.Fatalf("Failed to initialize email clients: %v", err)
	}

	// Verify that the connection manager has clients registered
	cm := GetConnectionManager()
	cm.mutex.RLock()
	clientCount := len(cm.clients)
	hasIMAPClient := false
	hasSMTPClient := false
	for id := range cm.clients {
		if id == "imap-test-account" {
			hasIMAPClient = true
		}
		if id == "smtp-test-account" {
			hasSMTPClient = true
		}
	}
	cm.mutex.RUnlock()

	// We expect both IMAP and SMTP clients to be registered
	expectedClientCount := 2
	if clientCount != expectedClientCount {
		t.Errorf("Expected %d clients to be registered, got %d", expectedClientCount, clientCount)
	}

	if !hasIMAPClient {
		t.Errorf("Expected IMAP client to be registered")
	}

	if !hasSMTPClient {
		t.Errorf("Expected SMTP client to be registered")
	}

	// Verify that the email monitor is running
	em := GetEmailMonitor(nil) // We already initialized it, so we can pass nil here
	em.mutex.RLock()
	running := em.running
	clientMonitorCount := len(em.clients)
	em.mutex.RUnlock()

	if !running {
		t.Error("Expected email monitor to be running")
	}

	// The client count might be 0 in tests since the actual connection would fail
	// but we can at least verify the monitor was initialized
	t.Logf("Email monitor has %d clients registered", clientMonitorCount)

	// Wait a moment to ensure all goroutines have started
	time.Sleep(100 * time.Millisecond)

	// Shutdown email clients
	ShutdownEmailClients()

	// Verify that the connection manager has stopped
	cm.mutex.RLock()
	cmRunning := cm.running
	cm.mutex.RUnlock()

	if cmRunning {
		t.Error("Expected connection manager to be stopped")
	}

	// Verify that the email monitor has stopped
	em.mutex.RLock()
	emRunning := em.running
	em.mutex.RUnlock()

	if emRunning {
		t.Error("Expected email monitor to be stopped")
	}
}
