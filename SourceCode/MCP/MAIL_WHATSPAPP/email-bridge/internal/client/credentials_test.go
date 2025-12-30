package client

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/user/email-bridge/internal/config"
)

func TestCredentialManager(t *testing.T) {
	// Create a temporary key file for testing
	tempDir, err := os.MkdirTemp("", "email-bridge-test")
	if err != nil {
		t.Fatalf("Failed to create temp directory: %v", err)
	}
	defer os.RemoveAll(tempDir)

	keyPath := filepath.Join(tempDir, "master.key")

	// Initialize credential manager
	cm, err := GetCredentialManager(keyPath)
	if err != nil {
		t.Fatalf("Failed to initialize credential manager: %v", err)
	}

	// Create test account config
	account := config.AccountConfig{
		ID:    "test-account",
		Name:  "Test Account",
		Email: "test@example.com",
		IMAPConfig: config.IMAPConfig{
			Server:   "imap.example.com",
			Port:     993,
			Username: "test@example.com",
			Password: "password123",
			UseTLS:   true,
		},
		SMTPConfig: config.SMTPConfig{
			Server:   "smtp.example.com",
			Port:     587,
			Username: "test@example.com",
			Password: "password123",
			UseTLS:   true,
		},
		AuthType: "password",
		OAuthConfig: &config.OAuthConfig{
			ClientID:     "client-id",
			ClientSecret: "client-secret",
			RefreshToken: "refresh-token",
			AccessToken:  "access-token",
			Expiry:       "2023-01-01T00:00:00Z",
		},
	}

	// Test encryption
	err = cm.EncryptCredentials(&account)
	if err != nil {
		t.Fatalf("Failed to encrypt credentials: %v", err)
	}

	// Verify passwords are encrypted
	if account.IMAPConfig.Password == "password123" {
		t.Error("IMAP password was not encrypted")
	}
	if account.SMTPConfig.Password == "password123" {
		t.Error("SMTP password was not encrypted")
	}
	if account.OAuthConfig.ClientSecret == "client-secret" {
		t.Error("OAuth client secret was not encrypted")
	}

	// Test decryption
	decryptedAccount, err := cm.GetDecryptedAccount(account)
	if err != nil {
		t.Fatalf("Failed to decrypt credentials: %v", err)
	}

	// Verify passwords are decrypted correctly
	if decryptedAccount.IMAPConfig.Password != "password123" {
		t.Errorf("IMAP password was not decrypted correctly, got: %s", decryptedAccount.IMAPConfig.Password)
	}
	if decryptedAccount.SMTPConfig.Password != "password123" {
		t.Errorf("SMTP password was not decrypted correctly, got: %s", decryptedAccount.SMTPConfig.Password)
	}
	if decryptedAccount.OAuthConfig.ClientSecret != "client-secret" {
		t.Errorf("OAuth client secret was not decrypted correctly, got: %s", decryptedAccount.OAuthConfig.ClientSecret)
	}

	// Verify original account is unchanged
	if account.IMAPConfig.Password == "password123" {
		t.Error("Original IMAP password was modified")
	}
}
