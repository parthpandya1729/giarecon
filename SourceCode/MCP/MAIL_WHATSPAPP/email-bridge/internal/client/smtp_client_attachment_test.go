package client

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/user/email-bridge/internal/config"
	"github.com/user/email-bridge/internal/models"
)

// TestAttachmentHandling tests the attachment handling functionality
func TestAttachmentHandling(t *testing.T) {
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

	// Create a temporary file for testing
	tempDir, err := os.MkdirTemp("", "email-bridge-test")
	if err != nil {
		t.Fatalf("Failed to create temp directory: %v", err)
	}
	defer os.RemoveAll(tempDir)

	// Create a test file
	testFilePath := filepath.Join(tempDir, "test-attachment.txt")
	testContent := "This is a test attachment file."
	err = os.WriteFile(testFilePath, []byte(testContent), 0644)
	if err != nil {
		t.Fatalf("Failed to create test file: %v", err)
	}

	// Create an email with an attachment
	email := models.Email{
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
		Subject:        "Email with File Attachment",
		TextContent:    "This email has a file attachment.",
		Date:           time.Now(),
		HasAttachments: true,
		Attachments: []models.Attachment{
			{
				ID:          "att-1",
				EmailID:     "test-email-id",
				Filename:    "test-attachment.txt",
				ContentType: "text/plain",
				Size:        int64(len(testContent)),
				Path:        testFilePath,
			},
		},
	}

	// Create the message
	msg, err := client.createMessage(email)
	if err != nil {
		t.Errorf("Failed to create message with file attachment: %v", err)
	}

	// Verify message contains expected headers and content
	if !strings.Contains(msg, "Content-Type: multipart/mixed") {
		t.Errorf("Message missing multipart/mixed Content-Type header")
	}
	if !strings.Contains(msg, fmt.Sprintf("Content-Disposition: attachment; filename=\"%s\"", "test-attachment.txt")) {
		t.Errorf("Message missing attachment Content-Disposition header")
	}

	// The content should be base64 encoded, so we won't find the exact content
	// but we can check that the file was read by verifying the message doesn't contain
	// the placeholder text
	if strings.Contains(msg, "[Attachment data not available]") {
		t.Errorf("Message contains placeholder text instead of actual attachment data")
	}

	// Test with non-existent file path
	email.Attachments[0].Path = filepath.Join(tempDir, "non-existent-file.txt")
	_, err = client.createMessage(email)
	if err == nil {
		t.Errorf("Expected error when creating message with non-existent attachment file")
	}
	if err != nil && !strings.Contains(err.Error(), "failed to read attachment file") {
		t.Errorf("Expected 'failed to read attachment file' error, got: %v", err)
	}
}
