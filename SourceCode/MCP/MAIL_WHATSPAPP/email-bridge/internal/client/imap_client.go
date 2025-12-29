package client

import (
	"crypto/tls"
	"fmt"
	"io"
	"io/ioutil"
	"strings"
	"sync"
	"time"

	"github.com/emersion/go-imap"
	"github.com/emersion/go-imap/client"
	"github.com/emersion/go-message/mail"
	"github.com/user/email-bridge/internal/config"
	"github.com/user/email-bridge/internal/models"
)

// IMAPClientImpl implements the IMAPClient interface
type IMAPClientImpl struct {
	config     config.AccountConfig
	client     *client.Client
	connected  bool
	monitoring bool
	mutex      sync.Mutex
	stopChan   chan struct{}
}

// NewIMAPClientImpl creates a new IMAP client
func NewIMAPClientImpl(config config.AccountConfig) *IMAPClientImpl {
	return &IMAPClientImpl{
		config:     config,
		connected:  false,
		monitoring: false,
		mutex:      sync.Mutex{},
		stopChan:   make(chan struct{}),
	}
}

// Connect establishes a connection to the IMAP server
func (c *IMAPClientImpl) Connect() error {
	c.mutex.Lock()
	defer c.mutex.Unlock()

	if c.connected && c.client != nil {
		return nil
	}

	var err error
	var imapClient *client.Client

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
	if decryptedConfig.IMAPConfig.UseTLS {
		// Connect with TLS
		imapClient, err = client.DialTLS(fmt.Sprintf("%s:%d", decryptedConfig.IMAPConfig.Server, decryptedConfig.IMAPConfig.Port), &tls.Config{
			ServerName: decryptedConfig.IMAPConfig.Server,
		})
	} else {
		// Connect without TLS
		imapClient, err = client.Dial(fmt.Sprintf("%s:%d", decryptedConfig.IMAPConfig.Server, decryptedConfig.IMAPConfig.Port))
	}

	if err != nil {
		return fmt.Errorf("failed to connect to IMAP server: %w", err)
	}

	// Authenticate
	if decryptedConfig.AuthType == "oauth" && decryptedConfig.OAuthConfig != nil {
		// TODO: Implement OAuth authentication
		return fmt.Errorf("OAuth authentication not implemented yet")
	} else {
		// Login with username and password
		if err := imapClient.Login(decryptedConfig.IMAPConfig.Username, decryptedConfig.IMAPConfig.Password); err != nil {
			imapClient.Logout()
			return fmt.Errorf("failed to authenticate with IMAP server: %w", err)
		}
	}

	c.client = imapClient
	c.connected = true
	return nil
}

// Disconnect closes the connection to the IMAP server
func (c *IMAPClientImpl) Disconnect() error {
	c.mutex.Lock()
	defer c.mutex.Unlock()

	if !c.connected || c.client == nil {
		return nil
	}

	// Stop monitoring if active
	if c.monitoring {
		c.StopMonitoring()
	}

	// Logout and close connection
	if err := c.client.Logout(); err != nil {
		return fmt.Errorf("failed to logout from IMAP server: %w", err)
	}

	c.client = nil
	c.connected = false
	return nil
}

// IsConnected checks if the client is connected
func (c *IMAPClientImpl) IsConnected() bool {
	c.mutex.Lock()
	defer c.mutex.Unlock()
	return c.connected && c.client != nil
}

// reconnect attempts to reconnect to the IMAP server
func (c *IMAPClientImpl) reconnect() error {
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

// FetchEmails retrieves emails based on search criteria
func (c *IMAPClientImpl) FetchEmails(criteria models.SearchCriteria) ([]models.Email, error) {
	c.mutex.Lock()
	defer c.mutex.Unlock()

	if !c.connected || c.client == nil {
		return nil, fmt.Errorf("not connected to IMAP server")
	}

	// Select the mailbox (folder)
	folder := "INBOX"
	if criteria.Folder != "" {
		folder = criteria.Folder
	}

	mbox, err := c.client.Select(folder, false)
	if err != nil {
		// Handle connection error
		if c.handleConnectionError(err) {
			// Try again once if it was a connection error that was fixed
			return c.FetchEmails(criteria)
		}
		return nil, fmt.Errorf("failed to select folder %s: %w", folder, err)
	}

	// Build search criteria
	searchCriteria := imap.NewSearchCriteria()

	// Add date criteria
	if !criteria.AfterDate.IsZero() {
		searchCriteria.Since = criteria.AfterDate
	}
	if !criteria.BeforeDate.IsZero() {
		searchCriteria.Before = criteria.BeforeDate
	}

	// Add text search criteria
	if criteria.Query != "" {
		searchCriteria.Text = []string{criteria.Query}
	}

	// Add subject search
	if criteria.Subject != "" {
		searchCriteria.Header.Add("Subject", criteria.Subject)
	}

	// Add from address search
	if criteria.FromAddress != "" {
		searchCriteria.Header.Add("From", criteria.FromAddress)
	}

	// Add to address search
	if criteria.ToAddress != "" {
		searchCriteria.Header.Add("To", criteria.ToAddress)
	}

	// Add read/unread criteria
	if criteria.IsRead != nil {
		if *criteria.IsRead {
			searchCriteria.WithFlags = []string{imap.SeenFlag}
		} else {
			searchCriteria.WithoutFlags = []string{imap.SeenFlag}
		}
	}

	// Search for UIDs
	uids, err := c.client.UidSearch(searchCriteria)
	if err != nil {
		// Handle connection error
		if c.handleConnectionError(err) {
			// Try again once if it was a connection error that was fixed
			return c.FetchEmails(criteria)
		}
		return nil, fmt.Errorf("failed to search emails: %w", err)
	}

	if len(uids) == 0 {
		return []models.Email{}, nil
	}

	// Apply limit and offset
	if criteria.Offset > 0 && criteria.Offset < len(uids) {
		uids = uids[criteria.Offset:]
	}
	if criteria.Limit > 0 && criteria.Limit < len(uids) {
		uids = uids[:criteria.Limit]
	}

	// Create sequence set for fetching
	seqSet := new(imap.SeqSet)
	seqSet.AddNum(uids...)

	// Define items to fetch
	items := []imap.FetchItem{
		imap.FetchEnvelope,
		imap.FetchFlags,
		imap.FetchInternalDate,
		imap.FetchRFC822Size,
		imap.FetchUid,
		imap.FetchBodyStructure,
		"BODY.PEEK[]",
	}

	// Fetch messages
	messages := make(chan *imap.Message, 10)
	done := make(chan error, 1)
	go func() {
		done <- c.client.UidFetch(seqSet, items, messages)
	}()

	// Process messages
	var emails []models.Email
	for msg := range messages {
		email, err := c.parseMessage(msg, folder)
		if err != nil {
			// Log the error but continue processing other messages
			fmt.Printf("Error parsing message: %v\n", err)
			continue
		}
		emails = append(emails, email)
	}

	if err := <-done; err != nil {
		// Handle connection error
		if c.handleConnectionError(err) {
			// Try again once if it was a connection error that was fixed
			return c.FetchEmails(criteria)
		}
		return nil, fmt.Errorf("failed to fetch emails: %w", err)
	}

	return emails, nil
}

// GetFolders retrieves the list of folders
func (c *IMAPClientImpl) GetFolders() ([]string, error) {
	c.mutex.Lock()
	defer c.mutex.Unlock()

	if !c.connected || c.client == nil {
		return nil, fmt.Errorf("not connected to IMAP server")
	}

	// List mailboxes
	mailboxes := make(chan *imap.MailboxInfo, 10)
	done := make(chan error, 1)
	go func() {
		err := c.client.List("", "*", mailboxes)
		done <- err
	}()

	var folders []string
	for m := range mailboxes {
		folders = append(folders, m.Name)
	}

	if err := <-done; err != nil {
		// Handle connection error
		if c.handleConnectionError(err) {
			// Try again once if it was a connection error that was fixed
			return c.GetFolders()
		}
		return nil, fmt.Errorf("failed to list folders: %w", err)
	}

	return folders, nil
}

// handleConnectionError handles IMAP connection errors and attempts to reconnect
// Returns true if the connection was restored and the operation should be retried
func (c *IMAPClientImpl) handleConnectionError(err error) bool {
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

// MonitorMailbox starts monitoring for new emails
func (c *IMAPClientImpl) MonitorMailbox(callback func(models.Email)) error {
	c.mutex.Lock()
	defer c.mutex.Unlock()

	if c.monitoring {
		return fmt.Errorf("already monitoring mailbox")
	}

	if !c.connected || c.client == nil {
		return fmt.Errorf("not connected to IMAP server")
	}

	// Reset the stop channel
	c.stopChan = make(chan struct{})
	c.monitoring = true

	// Start monitoring in a goroutine
	go c.monitorLoop(callback)

	return nil
}

// monitorLoop is the main loop for monitoring emails
// It implements either IMAP IDLE (if supported) or polling
func (c *IMAPClientImpl) monitorLoop(callback func(models.Email)) {
	// Track the last UID we've seen to detect new emails
	lastSeenUID := uint32(0)
	folder := "INBOX" // Default to INBOX, could be configurable

	// Check if the server supports IDLE
	supportsIdle := c.supportsIMAP4rev1Extension("IDLE")

	// Main monitoring loop
	for {
		select {
		case <-c.stopChan:
			// Monitoring was stopped
			return
		default:
			// Continue monitoring
		}

		// Check if we're still connected
		if !c.IsConnected() {
			// Try to reconnect
			if err := c.reconnect(); err != nil {
				// Log the error and wait before retrying
				fmt.Printf("Error reconnecting to IMAP server: %v. Retrying in 30 seconds...\n", err)
				time.Sleep(30 * time.Second)
				continue
			}
		}

		// Lock for the duration of this iteration
		c.mutex.Lock()

		// Select the mailbox
		mbox, err := c.client.Select(folder, false) // Read-only mode
		if err != nil {
			c.mutex.Unlock()
			fmt.Printf("Error selecting folder %s: %v. Retrying in 10 seconds...\n", folder, err)
			time.Sleep(10 * time.Second)
			continue
		}

		// Check for new messages
		if mbox.Messages > 0 {
			// If we haven't seen any messages yet, get the latest UID
			if lastSeenUID == 0 {
				// Search for all messages
				criteria := imap.NewSearchCriteria()
				uids, err := c.client.UidSearch(criteria)
				if err == nil && len(uids) > 0 {
					// Remember the highest UID
					for _, uid := range uids {
						if uid > lastSeenUID {
							lastSeenUID = uid
						}
					}
				}
			} else {
				// Search for new messages with UID greater than the last one we've seen
				criteria := imap.NewSearchCriteria()
				criteria.Uid = new(imap.SeqSet)
				criteria.Uid.AddRange(lastSeenUID+1, 0) // From lastSeenUID+1 to infinity

				uids, err := c.client.UidSearch(criteria)
				if err == nil && len(uids) > 0 {
					// Fetch and process new messages
					seqSet := new(imap.SeqSet)
					seqSet.AddNum(uids...)

					// Define items to fetch
					items := []imap.FetchItem{
						imap.FetchEnvelope,
						imap.FetchFlags,
						imap.FetchInternalDate,
						imap.FetchRFC822Size,
						imap.FetchUid,
						imap.FetchBodyStructure,
						"BODY.PEEK[]",
					}

					// Fetch messages
					messages := make(chan *imap.Message, 10)
					done := make(chan error, 1)
					go func() {
						done <- c.client.UidFetch(seqSet, items, messages)
					}()

					// Process messages
					for msg := range messages {
						email, err := c.parseMessage(msg, folder)
						if err != nil {
							// Log the error but continue processing other messages
							fmt.Printf("Error parsing message: %v\n", err)
							continue
						}

						// Update the last seen UID
						if msg.Uid > lastSeenUID {
							lastSeenUID = msg.Uid
						}

						// Call the callback with the new email
						// We do this outside the mutex lock to avoid deadlocks
						// if the callback interacts with the client
						c.mutex.Unlock()
						callback(email)
						c.mutex.Lock()
					}

					if err := <-done; err != nil {
						fmt.Printf("Error fetching messages: %v\n", err)
					}
				}
			}
		}

		c.mutex.Unlock()

		// Use IDLE if supported, otherwise poll
		if supportsIdle {
			// Use IMAP IDLE
			idleDone := make(chan error, 1)

			// Start IDLE mode
			c.mutex.Lock()
			if c.client != nil && c.connected {
				go func() {
					idleDone <- c.client.Idle(c.stopChan, nil)
				}()
			}
			c.mutex.Unlock()

			// Wait for IDLE to complete or be interrupted
			select {
			case err := <-idleDone:
				if err != nil {
					fmt.Printf("IDLE error: %v. Retrying in 5 seconds...\n", err)
					time.Sleep(5 * time.Second)
				}
			case <-c.stopChan:
				// Monitoring was stopped
				return
			}
		} else {
			// Use polling with a reasonable interval
			select {
			case <-time.After(1 * time.Minute):
				// Continue the loop and check for new messages
			case <-c.stopChan:
				// Monitoring was stopped
				return
			}
		}
	}
}

// supportsIMAP4rev1Extension checks if the server supports a specific IMAP4rev1 extension
func (c *IMAPClientImpl) supportsIMAP4rev1Extension(extension string) bool {
	c.mutex.Lock()
	defer c.mutex.Unlock()

	if !c.connected || c.client == nil {
		return false
	}

	// Check if the client has capability information
	for _, cap := range c.client.Caps {
		if cap == extension {
			return true
		}
	}

	// If not, request capabilities
	caps, err := c.client.Capability()
	if err != nil {
		return false
	}

	// Check if the extension is supported
	for _, cap := range caps {
		if cap == extension {
			return true
		}
	}

	return false
}

// StopMonitoring stops monitoring for new emails
func (c *IMAPClientImpl) StopMonitoring() error {
	c.mutex.Lock()
	defer c.mutex.Unlock()

	if !c.monitoring {
		return nil
	}

	close(c.stopChan)
	c.stopChan = make(chan struct{})
	c.monitoring = false
	return nil
}

// MarkAsRead marks an email as read
func (c *IMAPClientImpl) MarkAsRead(emailID string) error {
	// Will be implemented in a future task
	return fmt.Errorf("not implemented")
}

// MarkAsUnread marks an email as unread
func (c *IMAPClientImpl) MarkAsUnread(emailID string) error {
	// Will be implemented in a future task
	return fmt.Errorf("not implemented")
}

// MoveEmail moves an email to a different folder
func (c *IMAPClientImpl) MoveEmail(emailID string, folder string) error {
	// Will be implemented in a future task
	return fmt.Errorf("not implemented")
}

// DeleteEmail deletes an email
func (c *IMAPClientImpl) DeleteEmail(emailID string) error {
	// Will be implemented in a future task
	return fmt.Errorf("not implemented")
}

// GetAttachment downloads an attachment
func (c *IMAPClientImpl) GetAttachment(emailID string, attachmentID string) (models.Attachment, error) {
	// Will be implemented in a future task
	return models.Attachment{}, fmt.Errorf("not implemented")
}

// parseMessage converts an IMAP message to an Email model
func (c *IMAPClientImpl) parseMessage(msg *imap.Message, folder string) (models.Email, error) {
	if msg == nil {
		return models.Email{}, fmt.Errorf("nil message")
	}

	// Generate a unique ID for the email
	emailID := fmt.Sprintf("%s-%d", c.config.ID, msg.Uid)

	// Check if the message has been read
	isRead := false
	for _, flag := range msg.Flags {
		if flag == imap.SeenFlag {
			isRead = true
			break
		}
	}

	// Create the email model
	email := models.Email{
		ID:        emailID,
		AccountID: c.config.ID,
		MessageID: msg.Envelope.MessageId,
		Folder:    folder,
		Subject:   msg.Envelope.Subject,
		Date:      msg.Envelope.Date,
		IsRead:    isRead,
		Headers:   make(map[string]string),
	}

	// Parse from address
	if len(msg.Envelope.From) > 0 {
		from := msg.Envelope.From[0]
		email.From = models.Address{
			Name:  from.PersonalName,
			Email: from.MailboxName + "@" + from.HostName,
		}
	}

	// Parse to addresses
	for _, to := range msg.Envelope.To {
		email.To = append(email.To, models.Address{
			Name:  to.PersonalName,
			Email: to.MailboxName + "@" + to.HostName,
		})
	}

	// Parse cc addresses
	for _, cc := range msg.Envelope.Cc {
		email.Cc = append(email.Cc, models.Address{
			Name:  cc.PersonalName,
			Email: cc.MailboxName + "@" + cc.HostName,
		})
	}

	// Parse bcc addresses
	for _, bcc := range msg.Envelope.Bcc {
		email.Bcc = append(email.Bcc, models.Address{
			Name:  bcc.PersonalName,
			Email: bcc.MailboxName + "@" + bcc.HostName,
		})
	}

	// Check if the message has attachments
	email.HasAttachments = c.hasAttachments(msg)

	// Parse the message body and attachments
	if err := c.parseMessageBody(msg, &email); err != nil {
		return email, fmt.Errorf("failed to parse message body: %w", err)
	}

	return email, nil
}

// hasAttachments checks if a message has attachments
func (c *IMAPClientImpl) hasAttachments(msg *imap.Message) bool {
	if msg.BodyStructure == nil {
		return false
	}

	// Check if the message has attachments by examining the body structure
	return c.checkPartForAttachment(msg.BodyStructure)
}

// checkPartForAttachment recursively checks if a body part is an attachment
func (c *IMAPClientImpl) checkPartForAttachment(part *imap.BodyStructure) bool {
	if part == nil {
		return false
	}

	// Check if this part is an attachment
	if part.Disposition != "" && strings.ToLower(part.Disposition) == "attachment" {
		return true
	}

	// Check if this part has a filename (likely an attachment)
	for _, param := range part.DispositionParams {
		if strings.ToLower(param) == "filename" && part.DispositionParams[param] != "" {
			return true
		}
	}

	// Recursively check child parts
	if len(part.Parts) > 0 {
		for _, childPart := range part.Parts {
			if c.checkPartForAttachment(childPart) {
				return true
			}
		}
	}

	return false
}

// parseMessageBody extracts the text and HTML content from the message
func (c *IMAPClientImpl) parseMessageBody(msg *imap.Message, email *models.Email) error {
	// Import required packages
	// Note: In a real implementation, you would need to import these packages at the top of the file
	// "github.com/emersion/go-message"
	// "github.com/emersion/go-message/mail"
	// "io"
	// "io/ioutil"

	// Get the full message body
	section := &imap.BodySectionName{}
	r := msg.GetBody(section)
	if r == nil {
		return fmt.Errorf("message body not found")
	}

	// Parse the message
	mr, err := mail.CreateReader(r)
	if err != nil {
		return fmt.Errorf("failed to create mail reader: %w", err)
	}

	// Extract headers
	header := mr.Header
	if header != nil {
		// Extract common headers
		if date, err := header.Date(); err == nil {
			email.Date = date
		}
		if subject, err := header.Subject(); err == nil {
			email.Subject = subject
		}

		// Extract all headers
		for field := range header.Fields() {
			email.Headers[field.Key] = field.Value
		}
	}

	// Process each part of the message
	for {
		p, err := mr.NextPart()
		if err == io.EOF {
			break
		}
		if err != nil {
			return fmt.Errorf("failed to get next part: %w", err)
		}

		switch h := p.Header.(type) {
		case *mail.InlineHeader:
			// This is the message body (text or HTML)
			contentType, _, _ := h.ContentType()

			// Read the content
			content, err := ioutil.ReadAll(p.Body)
			if err != nil {
				return fmt.Errorf("failed to read part body: %w", err)
			}

			// Store the content based on its type
			switch {
			case strings.HasPrefix(contentType, "text/plain"):
				email.TextContent = string(content)
			case strings.HasPrefix(contentType, "text/html"):
				email.HtmlContent = string(content)
			}

		case *mail.AttachmentHeader:
			// This is an attachment
			filename, _ := h.Filename()
			contentType, _, _ := h.ContentType()

			// Create attachment model
			attachment := models.Attachment{
				ID:          fmt.Sprintf("%s-%d", email.ID, len(email.Attachments)+1),
				EmailID:     email.ID,
				Filename:    filename,
				ContentType: contentType,
			}

			// Get the size of the attachment
			if data, err := ioutil.ReadAll(p.Body); err == nil {
				attachment.Size = int64(len(data))
			}

			// Add to attachments list
			email.Attachments = append(email.Attachments, attachment)
			email.HasAttachments = true
		}
	}

	return nil
}
