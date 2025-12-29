package client

import (
	"crypto/tls"
	"encoding/base64"
	"fmt"
	"net/smtp"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/user/email-bridge/internal/config"
	"github.com/user/email-bridge/internal/models"
)

// SMTPClientImpl implements the SMTPClient interface
type SMTPClientImpl struct {
	config    config.AccountConfig
	client    *smtp.Client
	connected bool
	mutex     sync.Mutex
}

// NewSMTPClientImpl creates a new SMTP client
func NewSMTPClientImpl(config config.AccountConfig) *SMTPClientImpl {
	return &SMTPClientImpl{
		config:    config,
		connected: false,
		mutex:     sync.Mutex{},
	}
}

// Connect establishes a connection to the SMTP server
func (c *SMTPClientImpl) Connect() error {
	c.mutex.Lock()
	defer c.mutex.Unlock()

	if c.connected && c.client != nil {
		return nil
	}

	var err error
	var smtpClient *smtp.Client

	// Get decrypted credentials
	cm, err := GetCredentialManager("./keys/master.key")
	if err != nil {
		return fmt.Errorf("failed to initialize credential manager: %w", err)
	}

	decryptedConfig, err := cm.GetDecryptedAccount(c.config)
	if err != nil {
		return fmt.Errorf("failed to decrypt credentials: %w", err)
	}

	// Connect to the server
	addr := fmt.Sprintf("%s:%d", decryptedConfig.SMTPConfig.Server, decryptedConfig.SMTPConfig.Port)

	if decryptedConfig.SMTPConfig.UseTLS {
		// Connect with TLS
		tlsConfig := &tls.Config{
			ServerName: decryptedConfig.SMTPConfig.Server,
		}
		conn, err := tls.Dial("tcp", addr, tlsConfig)
		if err != nil {
			return fmt.Errorf("failed to connect to SMTP server with TLS: %w", err)
		}

		smtpClient, err = smtp.NewClient(conn, decryptedConfig.SMTPConfig.Server)
		if err != nil {
			return fmt.Errorf("failed to create SMTP client: %w", err)
		}
	} else {
		// Connect without TLS
		smtpClient, err = smtp.Dial(addr)
		if err != nil {
			return fmt.Errorf("failed to connect to SMTP server: %w", err)
		}

		// Start TLS if server supports it
		if ok, _ := smtpClient.Extension("STARTTLS"); ok {
			tlsConfig := &tls.Config{
				ServerName: decryptedConfig.SMTPConfig.Server,
			}
			if err := smtpClient.StartTLS(tlsConfig); err != nil {
				// Non-fatal error, continue without TLS
				fmt.Printf("Warning: Failed to start TLS: %v\n", err)
			}
		}
	}

	// Authenticate
	if decryptedConfig.AuthType == "oauth" && decryptedConfig.OAuthConfig != nil {
		// TODO: Implement OAuth authentication
		return fmt.Errorf("OAuth authentication not implemented yet")
	} else {
		// Login with username and password
		auth := smtp.PlainAuth("", decryptedConfig.SMTPConfig.Username, decryptedConfig.SMTPConfig.Password, decryptedConfig.SMTPConfig.Server)
		if err := smtpClient.Auth(auth); err != nil {
			smtpClient.Quit()
			return fmt.Errorf("failed to authenticate with SMTP server: %w", err)
		}
	}

	c.client = smtpClient
	c.connected = true
	return nil
}

// Disconnect closes the connection to the SMTP server
func (c *SMTPClientImpl) Disconnect() error {
	c.mutex.Lock()
	defer c.mutex.Unlock()

	if !c.connected || c.client == nil {
		return nil
	}

	// Quit and close connection
	if err := c.client.Quit(); err != nil {
		return fmt.Errorf("failed to quit SMTP connection: %w", err)
	}

	c.client = nil
	c.connected = false
	return nil
}

// IsConnected checks if the client is connected
func (c *SMTPClientImpl) IsConnected() bool {
	c.mutex.Lock()
	defer c.mutex.Unlock()
	return c.connected && c.client != nil
}

// reconnect attempts to reconnect to the SMTP server
func (c *SMTPClientImpl) reconnect() error {
	c.mutex.Lock()
	wasConnected := c.connected
	c.connected = false
	c.client = nil
	c.mutex.Unlock()

	if !wasConnected {
		return nil
	}

	// Use the connection manager to handle reconnection
	cm := GetConnectionManager()

	// Find this client's ID in the connection manager
	var clientID string
	cm.mutex.RLock()
	for id, client := range cm.clients {
		if client == c {
			clientID = id
			break
		}
	}
	cm.mutex.RUnlock()

	if clientID == "" {
		// Client not registered with connection manager, handle reconnection directly
		maxRetries := 5
		var err error
		for i := 0; i < maxRetries; i++ {
			err = c.Connect()
			if err == nil {
				return nil
			}

			// Wait before retrying (exponential backoff)
			backoffTime := time.Duration(1<<uint(i)) * time.Second
			time.Sleep(backoffTime)
		}

		return fmt.Errorf("failed to reconnect after %d attempts: %w", maxRetries, err)
	}

	// Schedule reconnection through the connection manager
	cm.ScheduleReconnect(clientID)
	return fmt.Errorf("connection lost, reconnection scheduled")
}

// handleConnectionError handles SMTP connection errors and attempts to reconnect
// Returns true if the connection was restored and the operation should be retried
func (c *SMTPClientImpl) handleConnectionError(err error) bool {
	// Check if it's a connection error
	if err == nil {
		return false
	}

	// Common connection error messages
	connectionErrors := []string{
		"connection closed",
		"connection reset",
		"EOF",
		"i/o timeout",
		"broken pipe",
		"use of closed network connection",
	}

	isConnectionError := false
	errStr := err.Error()
	for _, connErr := range connectionErrors {
		if strings.Contains(strings.ToLower(errStr), strings.ToLower(connErr)) {
			isConnectionError = true
			break
		}
	}

	if !isConnectionError {
		return false
	}

	// It's a connection error, try to reconnect
	c.mutex.Lock()
	c.connected = false
	c.client = nil
	c.mutex.Unlock()

	// Try to reconnect
	reconnectErr := c.reconnect()
	if reconnectErr != nil {
		// Reconnection failed
		return false
	}

	// Reconnection successful
	return true
}

// SendEmail sends an email
func (c *SMTPClientImpl) SendEmail(email models.Email) error {
	c.mutex.Lock()
	defer c.mutex.Unlock()

	if !c.connected || c.client == nil {
		return fmt.Errorf("not connected to SMTP server")
	}

	// Validate email
	if len(email.To) == 0 && len(email.Cc) == 0 && len(email.Bcc) == 0 {
		return fmt.Errorf("email must have at least one recipient")
	}

	if email.From.Email == "" {
		return fmt.Errorf("email must have a sender")
	}

	// Create message
	msg, err := c.createMessage(email)
	if err != nil {
		return fmt.Errorf("failed to create email message: %w", err)
	}

	// Set sender
	if err := c.client.Mail(email.From.Email); err != nil {
		// Handle connection error
		if c.handleConnectionError(err) {
			// Try again once if it was a connection error that was fixed
			return c.SendEmail(email)
		}
		return fmt.Errorf("failed to set sender: %w", err)
	}

	// Add recipients
	recipients := make(map[string]bool)

	// Add To recipients
	for _, to := range email.To {
		if to.Email != "" && !recipients[to.Email] {
			if err := c.client.Rcpt(to.Email); err != nil {
				// Handle connection error
				if c.handleConnectionError(err) {
					// Try again once if it was a connection error that was fixed
					return c.SendEmail(email)
				}
				return fmt.Errorf("failed to add recipient %s: %w", to.Email, err)
			}
			recipients[to.Email] = true
		}
	}

	// Add Cc recipients
	for _, cc := range email.Cc {
		if cc.Email != "" && !recipients[cc.Email] {
			if err := c.client.Rcpt(cc.Email); err != nil {
				// Handle connection error
				if c.handleConnectionError(err) {
					// Try again once if it was a connection error that was fixed
					return c.SendEmail(email)
				}
				return fmt.Errorf("failed to add CC recipient %s: %w", cc.Email, err)
			}
			recipients[cc.Email] = true
		}
	}

	// Add Bcc recipients
	for _, bcc := range email.Bcc {
		if bcc.Email != "" && !recipients[bcc.Email] {
			if err := c.client.Rcpt(bcc.Email); err != nil {
				// Handle connection error
				if c.handleConnectionError(err) {
					// Try again once if it was a connection error that was fixed
					return c.SendEmail(email)
				}
				return fmt.Errorf("failed to add BCC recipient %s: %w", bcc.Email, err)
			}
			recipients[bcc.Email] = true
		}
	}

	// Get data writer
	w, err := c.client.Data()
	if err != nil {
		// Handle connection error
		if c.handleConnectionError(err) {
			// Try again once if it was a connection error that was fixed
			return c.SendEmail(email)
		}
		return fmt.Errorf("failed to get data writer: %w", err)
	}

	// Write message
	if _, err := w.Write([]byte(msg)); err != nil {
		// Handle connection error
		if c.handleConnectionError(err) {
			// Try again once if it was a connection error that was fixed
			return c.SendEmail(email)
		}
		return fmt.Errorf("failed to write message: %w", err)
	}

	// Close data writer
	if err := w.Close(); err != nil {
		// Handle connection error
		if c.handleConnectionError(err) {
			// Try again once if it was a connection error that was fixed
			return c.SendEmail(email)
		}
		return fmt.Errorf("failed to close data writer: %w", err)
	}

	return nil
}

// createMessage creates an email message in RFC 822 format
func (c *SMTPClientImpl) createMessage(email models.Email) (string, error) {
	// Create a buffer for the message
	var msg strings.Builder

	// Add headers
	msg.WriteString(fmt.Sprintf("From: %s\r\n", formatAddress(email.From)))

	// Add To header
	if len(email.To) > 0 {
		msg.WriteString("To: ")
		for i, to := range email.To {
			if i > 0 {
				msg.WriteString(", ")
			}
			msg.WriteString(formatAddress(to))
		}
		msg.WriteString("\r\n")
	}

	// Add Cc header
	if len(email.Cc) > 0 {
		msg.WriteString("Cc: ")
		for i, cc := range email.Cc {
			if i > 0 {
				msg.WriteString(", ")
			}
			msg.WriteString(formatAddress(cc))
		}
		msg.WriteString("\r\n")
	}

	// Add Subject header
	msg.WriteString(fmt.Sprintf("Subject: %s\r\n", email.Subject))

	// Add Date header
	msg.WriteString(fmt.Sprintf("Date: %s\r\n", email.Date.Format(time.RFC1123Z)))

	// Add Message-ID header if provided
	if email.MessageID != "" {
		msg.WriteString(fmt.Sprintf("Message-ID: %s\r\n", email.MessageID))
	} else {
		// Generate a Message-ID if not provided
		msgID := fmt.Sprintf("<%d.%s@%s>", time.Now().UnixNano(), email.From.Email, c.config.SMTPConfig.Server)
		msg.WriteString(fmt.Sprintf("Message-ID: %s\r\n", msgID))
	}

	// Add MIME headers
	boundary := generateBoundary()
	msg.WriteString("MIME-Version: 1.0\r\n")

	// Determine content type based on email content and attachments
	if len(email.Attachments) > 0 {
		// Multipart message with attachments
		msg.WriteString(fmt.Sprintf("Content-Type: multipart/mixed; boundary=\"%s\"\r\n", boundary))
		msg.WriteString("\r\n")

		// Add message body
		msg.WriteString(fmt.Sprintf("--%s\r\n", boundary))

		// If we have both text and HTML content, use multipart/alternative
		if email.TextContent != "" && email.HtmlContent != "" {
			altBoundary := generateBoundary()
			msg.WriteString(fmt.Sprintf("Content-Type: multipart/alternative; boundary=\"%s\"\r\n", altBoundary))
			msg.WriteString("\r\n")

			// Add text part
			msg.WriteString(fmt.Sprintf("--%s\r\n", altBoundary))
			msg.WriteString("Content-Type: text/plain; charset=UTF-8\r\n")
			msg.WriteString("Content-Transfer-Encoding: quoted-printable\r\n")
			msg.WriteString("\r\n")
			msg.WriteString(email.TextContent)
			msg.WriteString("\r\n\r\n")

			// Add HTML part
			msg.WriteString(fmt.Sprintf("--%s\r\n", altBoundary))
			msg.WriteString("Content-Type: text/html; charset=UTF-8\r\n")
			msg.WriteString("Content-Transfer-Encoding: quoted-printable\r\n")
			msg.WriteString("\r\n")
			msg.WriteString(email.HtmlContent)
			msg.WriteString("\r\n\r\n")

			// Close alternative part
			msg.WriteString(fmt.Sprintf("--%s--\r\n", altBoundary))
		} else if email.HtmlContent != "" {
			// HTML only
			msg.WriteString("Content-Type: text/html; charset=UTF-8\r\n")
			msg.WriteString("Content-Transfer-Encoding: quoted-printable\r\n")
			msg.WriteString("\r\n")
			msg.WriteString(email.HtmlContent)
			msg.WriteString("\r\n\r\n")
		} else {
			// Text only
			msg.WriteString("Content-Type: text/plain; charset=UTF-8\r\n")
			msg.WriteString("Content-Transfer-Encoding: quoted-printable\r\n")
			msg.WriteString("\r\n")
			msg.WriteString(email.TextContent)
			msg.WriteString("\r\n\r\n")
		}

		// Add attachments
		for _, attachment := range email.Attachments {
			msg.WriteString(fmt.Sprintf("--%s\r\n", boundary))
			msg.WriteString(fmt.Sprintf("Content-Type: %s; name=\"%s\"\r\n", attachment.ContentType, attachment.Filename))
			msg.WriteString("Content-Transfer-Encoding: base64\r\n")
			msg.WriteString(fmt.Sprintf("Content-Disposition: attachment; filename=\"%s\"\r\n", attachment.Filename))
			if attachment.ContentID != "" {
				msg.WriteString(fmt.Sprintf("Content-ID: <%s>\r\n", attachment.ContentID))
			}
			msg.WriteString("\r\n")

			// If the attachment has a path, read the file and encode it as base64
			if attachment.Path != "" {
				data, err := os.ReadFile(attachment.Path)
				if err != nil {
					return "", fmt.Errorf("failed to read attachment file %s: %w", attachment.Path, err)
				}

				// Encode the data as base64
				encoded := base64.StdEncoding.EncodeToString(data)

				// Write the encoded data in lines of 76 characters
				for i := 0; i < len(encoded); i += 76 {
					end := i + 76
					if end > len(encoded) {
						end = len(encoded)
					}
					msg.WriteString(encoded[i:end] + "\r\n")
				}
			} else {
				// No path provided, just add a placeholder
				msg.WriteString("[Attachment data not available]\r\n\r\n")
			}
		}

		// Close multipart message
		msg.WriteString(fmt.Sprintf("--%s--\r\n", boundary))
	} else if email.HtmlContent != "" && email.TextContent != "" {
		// Multipart alternative with both HTML and text
		msg.WriteString(fmt.Sprintf("Content-Type: multipart/alternative; boundary=\"%s\"\r\n", boundary))
		msg.WriteString("\r\n")

		// Add text part
		msg.WriteString(fmt.Sprintf("--%s\r\n", boundary))
		msg.WriteString("Content-Type: text/plain; charset=UTF-8\r\n")
		msg.WriteString("Content-Transfer-Encoding: quoted-printable\r\n")
		msg.WriteString("\r\n")
		msg.WriteString(email.TextContent)
		msg.WriteString("\r\n\r\n")

		// Add HTML part
		msg.WriteString(fmt.Sprintf("--%s\r\n", boundary))
		msg.WriteString("Content-Type: text/html; charset=UTF-8\r\n")
		msg.WriteString("Content-Transfer-Encoding: quoted-printable\r\n")
		msg.WriteString("\r\n")
		msg.WriteString(email.HtmlContent)
		msg.WriteString("\r\n\r\n")

		// Close multipart message
		msg.WriteString(fmt.Sprintf("--%s--\r\n", boundary))
	} else if email.HtmlContent != "" {
		// HTML only
		msg.WriteString("Content-Type: text/html; charset=UTF-8\r\n")
		msg.WriteString("Content-Transfer-Encoding: quoted-printable\r\n")
		msg.WriteString("\r\n")
		msg.WriteString(email.HtmlContent)
	} else {
		// Text only
		msg.WriteString("Content-Type: text/plain; charset=UTF-8\r\n")
		msg.WriteString("Content-Transfer-Encoding: quoted-printable\r\n")
		msg.WriteString("\r\n")
		msg.WriteString(email.TextContent)
	}

	return msg.String(), nil
}

// formatAddress formats an email address with optional name
func formatAddress(addr models.Address) string {
	if addr.Name != "" {
		return fmt.Sprintf("\"%s\" <%s>", addr.Name, addr.Email)
	}
	return addr.Email
}

// generateBoundary generates a unique boundary string for multipart messages
func generateBoundary() string {
	return fmt.Sprintf("boundary_%d", time.Now().UnixNano())
}
