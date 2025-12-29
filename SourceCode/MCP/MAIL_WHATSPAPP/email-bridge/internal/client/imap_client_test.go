package client

import (
	"testing"

	"github.com/user/email-bridge/internal/config"
)

func TestNewIMAPClientImpl(t *testing.T) {
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
	if client == nil {
		t.Fatal("Expected non-nil client")
	}

	if client.IsConnected() {
		t.Error("New client should not be connected")
	}

	// Note: We're not testing actual connection here as it would require a real IMAP server
	// In a real environment, you would use a mock IMAP server for testing
}

func TestIMAPClientReconnect(t *testing.T) {
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

	// Test the reconnect logic without actually connecting
	// This just ensures the method doesn't panic
	err := client.reconnect()
	if err == nil {
		// We expect an error since we're not actually connecting to a server
		t.Error("Expected error when reconnecting to non-existent server")
	}
}

func TestIMAPClientGetFolders(t *testing.T) {
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

	// Test getting folders without being connected
	folders, err := client.GetFolders()
	if err == nil {
		t.Error("Expected error when getting folders without connection")
	}
	if folders != nil {
		t.Error("Expected nil folders when getting folders without connection")
	}
}
