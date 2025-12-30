package client

import (
	"sync"
	"testing"
	"time"

	"github.com/user/email-bridge/internal/config"
	"github.com/user/email-bridge/internal/models"
)

func TestMonitorMailbox(t *testing.T) {
	// Create a test client
	cfg := config.AccountConfig{
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
		AuthType: "password",
	}

	client := NewIMAPClientImpl(cfg)

	// Test monitoring without being connected
	err := client.MonitorMailbox(func(email models.Email) {})
	if err == nil {
		t.Error("Expected error when monitoring without connection")
	}

	// Note: We can't test actual monitoring without a real IMAP server or a mock
	// In a real environment, you would use a mock IMAP server for testing
}

func TestStopMonitoring(t *testing.T) {
	// Create a test client
	cfg := config.AccountConfig{
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
		AuthType: "password",
	}

	client := NewIMAPClientImpl(cfg)

	// Test stopping monitoring when not monitoring
	err := client.StopMonitoring()
	if err != nil {
		t.Errorf("Expected no error when stopping monitoring when not monitoring, got %v", err)
	}

	// Note: We can't test actual monitoring without a real IMAP server or a mock
	// In a real environment, you would use a mock IMAP server for testing
}

func TestSupportsIMAP4rev1Extension(t *testing.T) {
	// Create a test client
	cfg := config.AccountConfig{
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
		AuthType: "password",
	}

	client := NewIMAPClientImpl(cfg)

	// Test checking for extension without being connected
	supportsIdle := client.supportsIMAP4rev1Extension("IDLE")
	if supportsIdle {
		t.Error("Expected false when checking for extension without connection")
	}

	// Note: We can't test actual extension support without a real IMAP server or a mock
	// In a real environment, you would use a mock IMAP server for testing
}

func TestMonitorLoop(t *testing.T) {
	// Create a test client
	cfg := config.AccountConfig{
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
		AuthType: "password",
	}

	client := NewIMAPClientImpl(cfg)

	// We can't test the monitor loop directly without a real IMAP server or a mock
	// But we can test that it doesn't panic when stopped immediately

	// Set up a callback that will never be called
	var wg sync.WaitGroup
	wg.Add(1)
	callback := func(email models.Email) {
		// This should never be called in this test
		t.Error("Callback should not be called")
		wg.Done()
	}

	// Start monitoring in a goroutine
	go func() {
		// This will fail because we're not connected, but it shouldn't panic
		_ = client.MonitorMailbox(callback)
	}()

	// Give it a moment to start
	time.Sleep(100 * time.Millisecond)

	// Stop monitoring
	_ = client.StopMonitoring()

	// Wait a bit to ensure no callbacks are triggered
	done := make(chan struct{})
	go func() {
		wg.Wait()
		close(done)
	}()

	select {
	case <-done:
		t.Error("Callback was called unexpectedly")
	case <-time.After(500 * time.Millisecond):
		// This is the expected path - no callbacks should be triggered
	}
}
