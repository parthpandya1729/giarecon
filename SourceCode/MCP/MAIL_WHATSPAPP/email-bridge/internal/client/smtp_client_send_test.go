package client

import (
	"net/smtp"
	"strings"
	"testing"
	"time"

	"github.com/user/email-bridge/internal/config"
	"github.com/user/email-bridge/internal/models"
)

// TestSendEmail tests the email sending functionality
func TestSendEmail(t *testing.T) {
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

	// Create a test email
	testEmail := models.Email{
		ID:        "test-email-id",
		AccountID: "test-account",
		MessageID: "<test-message-id@example.com>",
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
		Cc: []models.Address{
			{
				Name:  "Test CC",
				Email: "cc@example.com",
			},
		},
		Subject:     "Test Subject",
		TextContent: "This is a test email.",
		HtmlContent: "<html><body><p>This is a test email.</p></body></html>",
		Date:        time.Now(),
	}

	// Create a client
	client := NewSMTPClientImpl(testConfig)

	// Test validation when not connected
	err := client.SendEmail(testEmail)
	if err == nil {
		t.Errorf("Expected error when sending email while not connected")
	}
	if err.Error() != "not connected to SMTP server" {
		t.Errorf("Expected 'not connected to SMTP server' error, got: %v", err)
	}

	// Test validation with empty recipients
	emptyRecipientsEmail := testEmail
	emptyRecipientsEmail.To = nil
	emptyRecipientsEmail.Cc = nil
	emptyRecipientsEmail.Bcc = nil

	// Mock the connection status
	client.connected = true
	client.client = &smtp.Client{}

	err = client.SendEmail(emptyRecipientsEmail)
	if err == nil {
		t.Errorf("Expected error when sending email with no recipients")
	}
	if err.Error() != "email must have at least one recipient" {
		t.Errorf("Expected 'email must have at least one recipient' error, got: %v", err)
	}

	// Test validation with empty sender
	emptySenderEmail := testEmail
	emptySenderEmail.From = models.Address{}

	err = client.SendEmail(emptySenderEmail)
	if err == nil {
		t.Errorf("Expected error when sending email with no sender")
	}
	if err.Error() != "email must have a sender" {
		t.Errorf("Expected 'email must have a sender' error, got: %v", err)
	}
}

// TestCreateMessage tests the message creation functionality
func TestCreateMessage(t *testing.T) {
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

	// Test with text content only
	textOnlyEmail := models.Email{
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
		Subject:     "Text Only",
		TextContent: "This is a text-only email.",
		Date:        time.Now(),
	}

	msg, err := client.createMessage(textOnlyEmail)
	if err != nil {
		t.Errorf("Failed to create text-only message: %v", err)
	}

	// Verify message contains expected headers and content
	if !containsString(msg, "From: \"Test Sender\" <sender@example.com>") {
		t.Errorf("Message missing From header")
	}
	if !containsString(msg, "To: \"Test Recipient\" <recipient@example.com>") {
		t.Errorf("Message missing To header")
	}
	if !containsString(msg, "Subject: Text Only") {
		t.Errorf("Message missing Subject header")
	}
	if !containsString(msg, "Content-Type: text/plain") {
		t.Errorf("Message missing Content-Type header")
	}
	if !containsString(msg, "This is a text-only email.") {
		t.Errorf("Message missing text content")
	}

	// Test with HTML content only
	htmlOnlyEmail := models.Email{
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
		Subject:     "HTML Only",
		HtmlContent: "<html><body><p>This is an HTML-only email.</p></body></html>",
		Date:        time.Now(),
	}

	msg, err = client.createMessage(htmlOnlyEmail)
	if err != nil {
		t.Errorf("Failed to create HTML-only message: %v", err)
	}

	// Verify message contains expected headers and content
	if !containsString(msg, "Content-Type: text/html") {
		t.Errorf("Message missing HTML Content-Type header")
	}
	if !containsString(msg, "<html><body><p>This is an HTML-only email.</p></body></html>") {
		t.Errorf("Message missing HTML content")
	}

	// Test with both text and HTML content
	multipartEmail := models.Email{
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
		Subject:     "Multipart",
		TextContent: "This is a multipart email.",
		HtmlContent: "<html><body><p>This is a multipart email.</p></body></html>",
		Date:        time.Now(),
	}

	msg, err = client.createMessage(multipartEmail)
	if err != nil {
		t.Errorf("Failed to create multipart message: %v", err)
	}

	// Verify message contains expected headers and content
	if !containsString(msg, "Content-Type: multipart/alternative") {
		t.Errorf("Message missing multipart Content-Type header")
	}
	if !containsString(msg, "This is a multipart email.") {
		t.Errorf("Message missing text content in multipart message")
	}
	if !containsString(msg, "<html><body><p>This is a multipart email.</p></body></html>") {
		t.Errorf("Message missing HTML content in multipart message")
	}

	// Test with attachments
	attachmentEmail := models.Email{
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
		Subject:        "With Attachment",
		TextContent:    "This email has an attachment.",
		Date:           time.Now(),
		HasAttachments: true,
		Attachments: []models.Attachment{
			{
				ID:          "att-1",
				EmailID:     "test-email-id",
				Filename:    "test.txt",
				ContentType: "text/plain",
				Size:        123,
			},
		},
	}

	msg, err = client.createMessage(attachmentEmail)
	if err != nil {
		t.Errorf("Failed to create message with attachment: %v", err)
	}

	// Verify message contains expected headers and content
	if !containsString(msg, "Content-Type: multipart/mixed") {
		t.Errorf("Message missing multipart/mixed Content-Type header")
	}
	if !containsString(msg, "Content-Disposition: attachment; filename=\"test.txt\"") {
		t.Errorf("Message missing attachment Content-Disposition header")
	}
}

// Helper function to check if a string contains a substring
func containsString(s, substr string) bool {
	return strings.Contains(s, substr)
}
