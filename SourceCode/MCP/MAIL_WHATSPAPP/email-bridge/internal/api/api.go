package api

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/user/email-bridge/internal/client"
	"github.com/user/email-bridge/internal/models"
	"github.com/user/email-bridge/internal/store"
)

// API represents the REST API
type API struct {
	store      store.Store
	imapClient client.IMAPClient
	smtpClient client.SMTPClient
}

// NewAPI creates a new API instance
func NewAPI(store store.Store, imapClient client.IMAPClient, smtpClient client.SMTPClient) *API {
	return &API{
		store:      store,
		imapClient: imapClient,
		smtpClient: smtpClient,
	}
}

// SetupRoutes sets up the API routes
func (api *API) SetupRoutes() http.Handler {
	mux := http.NewServeMux()

	// Health check
	mux.HandleFunc("/health", api.handleHealth)

	// Email endpoints
	mux.HandleFunc("/emails", api.handleEmails)
	mux.HandleFunc("/emails/", api.handleEmailByID)

	// Folder endpoints
	mux.HandleFunc("/folders", api.handleFolders)

	// Attachment endpoints
	mux.HandleFunc("/attachments/", api.handleAttachments)

	// Account endpoints
	mux.HandleFunc("/accounts", api.handleAccounts)
	mux.HandleFunc("/accounts/", api.handleAccountByID)

	return mux
}

// handleHealth handles health check requests
func (api *API) handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

// handleEmails handles email requests
func (api *API) handleEmails(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		api.listEmails(w, r)
	case http.MethodPost:
		api.sendEmail(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// handleEmailByID handles requests for a specific email
func (api *API) handleEmailByID(w http.ResponseWriter, r *http.Request) {
	// Extract email ID from URL path
	path := r.URL.Path
	// The path should be in the format "/emails/{id}"
	if len(path) <= len("/emails/") {
		http.Error(w, "Invalid email ID", http.StatusBadRequest)
		return
	}

	emailID := path[len("/emails/"):]

	switch r.Method {
	case http.MethodGet:
		api.getEmailByID(w, r, emailID)
	case http.MethodPut:
		// Will be implemented in task 9.4
		http.Error(w, "Not implemented", http.StatusNotImplemented)
	case http.MethodDelete:
		// Will be implemented in task 9.4
		http.Error(w, "Not implemented", http.StatusNotImplemented)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// handleFolders handles folder requests
func (api *API) handleFolders(w http.ResponseWriter, r *http.Request) {
	// TODO: Implement folder handlers
}

// handleAttachments handles attachment requests
func (api *API) handleAttachments(w http.ResponseWriter, r *http.Request) {
	// TODO: Implement attachment handlers
}

// handleAccounts handles account requests
func (api *API) handleAccounts(w http.ResponseWriter, r *http.Request) {
	// TODO: Implement account handlers
}

// handleAccountByID handles requests for a specific account
func (api *API) handleAccountByID(w http.ResponseWriter, r *http.Request) {
	// TODO: Implement account by ID handler
}

// listEmails handles GET requests to list emails with filtering and pagination
func (api *API) listEmails(w http.ResponseWriter, r *http.Request) {
	// Parse query parameters
	query := r.URL.Query()

	// Create search criteria from query parameters
	criteria := models.SearchCriteria{
		AccountID:   query.Get("account_id"),
		Folder:      query.Get("folder"),
		Query:       query.Get("query"),
		FromAddress: query.Get("from"),
		ToAddress:   query.Get("to"),
		Subject:     query.Get("subject"),
	}

	// Parse date filters if provided
	if afterDateStr := query.Get("after_date"); afterDateStr != "" {
		afterDate, err := time.Parse(time.RFC3339, afterDateStr)
		if err != nil {
			http.Error(w, "Invalid after_date format. Use RFC3339 format.", http.StatusBadRequest)
			return
		}
		criteria.AfterDate = afterDate
	}

	if beforeDateStr := query.Get("before_date"); beforeDateStr != "" {
		beforeDate, err := time.Parse(time.RFC3339, beforeDateStr)
		if err != nil {
			http.Error(w, "Invalid before_date format. Use RFC3339 format.", http.StatusBadRequest)
			return
		}
		criteria.BeforeDate = beforeDate
	}

	// Parse boolean filters if provided
	if hasAttachmentsStr := query.Get("has_attachments"); hasAttachmentsStr != "" {
		hasAttachments, err := strconv.ParseBool(hasAttachmentsStr)
		if err != nil {
			http.Error(w, "Invalid has_attachments value. Use 'true' or 'false'.", http.StatusBadRequest)
			return
		}
		criteria.HasAttachments = &hasAttachments
	}

	if isReadStr := query.Get("is_read"); isReadStr != "" {
		isRead, err := strconv.ParseBool(isReadStr)
		if err != nil {
			http.Error(w, "Invalid is_read value. Use 'true' or 'false'.", http.StatusBadRequest)
			return
		}
		criteria.IsRead = &isRead
	}

	// Parse pagination parameters
	if limitStr := query.Get("limit"); limitStr != "" {
		limit, err := strconv.Atoi(limitStr)
		if err != nil || limit < 0 {
			http.Error(w, "Invalid limit value. Must be a positive integer.", http.StatusBadRequest)
			return
		}
		criteria.Limit = limit
	} else {
		// Default limit
		criteria.Limit = 50
	}

	if offsetStr := query.Get("offset"); offsetStr != "" {
		offset, err := strconv.Atoi(offsetStr)
		if err != nil || offset < 0 {
			http.Error(w, "Invalid offset value. Must be a non-negative integer.", http.StatusBadRequest)
			return
		}
		criteria.Offset = offset
	}

	// Parse sort parameter
	sortBy := query.Get("sort_by")
	sortOrder := query.Get("sort_order")

	// Apply sorting (this will be handled in the response formatting)

	// Search emails based on criteria
	emails, err := api.store.SearchEmails(criteria)
	if err != nil {
		http.Error(w, "Failed to search emails: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Count total emails matching criteria without pagination
	// This is a simplified approach - in a real implementation, you might want to
	// use a separate COUNT query for better performance
	originalLimit := criteria.Limit
	originalOffset := criteria.Offset
	criteria.Limit = 0
	criteria.Offset = 0

	allEmails, err := api.store.SearchEmails(criteria)
	if err != nil {
		http.Error(w, "Failed to count total emails: "+err.Error(), http.StatusInternalServerError)
		return
	}
	totalCount := len(allEmails)

	// Restore original pagination settings
	criteria.Limit = originalLimit
	criteria.Offset = originalOffset

	// Apply custom sorting if needed (the database query already sorts by date DESC)
	if sortBy != "" {
		switch sortBy {
		case "date":
			// Already sorted by date in the database query
		case "subject":
			sort.Slice(emails, func(i, j int) bool {
				if sortOrder == "desc" {
					return emails[i].Subject > emails[j].Subject
				}
				return emails[i].Subject < emails[j].Subject
			})
		case "from":
			sort.Slice(emails, func(i, j int) bool {
				if sortOrder == "desc" {
					return emails[i].From.Email > emails[j].From.Email
				}
				return emails[i].From.Email < emails[j].From.Email
			})
		}
	}

	// Create response with pagination metadata
	response := struct {
		Emails     []models.Email `json:"emails"`
		TotalCount int            `json:"total_count"`
		Limit      int            `json:"limit"`
		Offset     int            `json:"offset"`
	}{
		Emails:     emails,
		TotalCount: totalCount,
		Limit:      criteria.Limit,
		Offset:     criteria.Offset,
	}

	// Set content type and encode response
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(response); err != nil {
		http.Error(w, "Failed to encode response: "+err.Error(), http.StatusInternalServerError)
		return
	}
}

// getEmailByID retrieves a specific email by ID
func (api *API) getEmailByID(w http.ResponseWriter, r *http.Request, emailID string) {
	// Get email from store
	email, err := api.store.GetEmail(emailID)
	if err != nil {
		// Check if it's a "not found" error
		if err.Error() == "sql: no rows in result set" {
			http.Error(w, "Email not found", http.StatusNotFound)
		} else {
			http.Error(w, "Failed to retrieve email: "+err.Error(), http.StatusInternalServerError)
		}
		return
	}

	// Check if the client wants a specific format
	format := r.URL.Query().Get("format")
	if format == "text" {
		// Return only the text content
		w.Header().Set("Content-Type", "text/plain")
		w.Write([]byte(email.TextContent))
		return
	} else if format == "html" && email.HtmlContent != "" {
		// Return only the HTML content if available
		w.Header().Set("Content-Type", "text/html")
		w.Write([]byte(email.HtmlContent))
		return
	}

	// Prepare response with additional metadata
	response := struct {
		models.Email
		AttachmentCount int `json:"attachment_count"`
	}{
		Email:           email,
		AttachmentCount: len(email.Attachments),
	}

	// Set content type and encode response
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(response); err != nil {
		http.Error(w, "Failed to encode response: "+err.Error(), http.StatusInternalServerError)
		return
	}
}

// sendEmail handles POST requests to send a new email
func (api *API) sendEmail(w http.ResponseWriter, r *http.Request) {
	// Check if SMTP client is available
	if api.smtpClient == nil {
		http.Error(w, "SMTP client not configured", http.StatusServiceUnavailable)
		return
	}

	// Check if SMTP client is connected
	if !api.smtpClient.IsConnected() {
		// Try to reconnect
		if err := api.smtpClient.Connect(); err != nil {
			http.Error(w, "Failed to connect to SMTP server: "+err.Error(), http.StatusServiceUnavailable)
			return
		}
	}

	// Parse request body
	var emailRequest struct {
		AccountID   string           `json:"account_id"`
		From        models.Address   `json:"from"`
		To          []models.Address `json:"to"`
		Cc          []models.Address `json:"cc"`
		Bcc         []models.Address `json:"bcc"`
		Subject     string           `json:"subject"`
		TextContent string           `json:"text_content"`
		HtmlContent string           `json:"html_content"`
		Attachments []struct {
			Path        string `json:"path"`
			Filename    string `json:"filename"`
			ContentType string `json:"content_type"`
			ContentID   string `json:"content_id,omitempty"`
		} `json:"attachments"`
	}

	// Decode JSON request
	if err := json.NewDecoder(r.Body).Decode(&emailRequest); err != nil {
		http.Error(w, "Invalid request body: "+err.Error(), http.StatusBadRequest)
		return
	}

	// Validate required fields
	if len(emailRequest.To) == 0 && len(emailRequest.Cc) == 0 && len(emailRequest.Bcc) == 0 {
		http.Error(w, "Email must have at least one recipient", http.StatusBadRequest)
		return
	}

	if emailRequest.From.Email == "" {
		http.Error(w, "Email must have a sender", http.StatusBadRequest)
		return
	}

	if emailRequest.Subject == "" {
		http.Error(w, "Email must have a subject", http.StatusBadRequest)
		return
	}

	if emailRequest.TextContent == "" && emailRequest.HtmlContent == "" {
		http.Error(w, "Email must have content (text or HTML)", http.StatusBadRequest)
		return
	}

	// Create email model
	email := models.Email{
		ID:          generateEmailID(),
		AccountID:   emailRequest.AccountID,
		MessageID:   generateMessageID(emailRequest.From.Email),
		From:        emailRequest.From,
		To:          emailRequest.To,
		Cc:          emailRequest.Cc,
		Bcc:         emailRequest.Bcc,
		Subject:     emailRequest.Subject,
		TextContent: emailRequest.TextContent,
		HtmlContent: emailRequest.HtmlContent,
		Date:        time.Now(),
		Folder:      "Sent", // Default folder for sent emails
	}

	// Process attachments if any
	if len(emailRequest.Attachments) > 0 {
		email.HasAttachments = true
		email.Attachments = make([]models.Attachment, 0, len(emailRequest.Attachments))

		for _, att := range emailRequest.Attachments {
			// Validate attachment path
			if att.Path == "" {
				http.Error(w, "Attachment must have a path", http.StatusBadRequest)
				return
			}

			// Get file info for size
			fileInfo, err := os.Stat(att.Path)
			if err != nil {
				http.Error(w, "Invalid attachment path: "+err.Error(), http.StatusBadRequest)
				return
			}

			// Create attachment model
			attachment := models.Attachment{
				ID:          generateAttachmentID(),
				EmailID:     email.ID,
				Filename:    att.Filename,
				ContentType: att.ContentType,
				ContentID:   att.ContentID,
				Size:        fileInfo.Size(),
				Path:        att.Path,
			}

			// Use default filename if not provided
			if attachment.Filename == "" {
				attachment.Filename = filepath.Base(att.Path)
			}

			// Use default content type if not provided
			if attachment.ContentType == "" {
				// Try to detect content type
				file, err := os.Open(att.Path)
				if err == nil {
					defer file.Close()
					buffer := make([]byte, 512) // Only the first 512 bytes are used for detection
					_, err = file.Read(buffer)
					if err == nil {
						attachment.ContentType = http.DetectContentType(buffer)
					}
				}

				// If detection failed, use a default
				if attachment.ContentType == "" {
					attachment.ContentType = "application/octet-stream"
				}
			}

			email.Attachments = append(email.Attachments, attachment)
		}
	}

	// Send the email
	if err := api.smtpClient.SendEmail(email); err != nil {
		http.Error(w, "Failed to send email: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Store the sent email in the database
	if err := api.store.StoreEmail(email); err != nil {
		// Log the error but don't fail the request since the email was sent
		// In a production system, you might want to handle this differently
		log.Printf("Warning: Failed to store sent email: %v", err)
	}

	// Return success response
	response := struct {
		Success   bool   `json:"success"`
		EmailID   string `json:"email_id"`
		MessageID string `json:"message_id"`
	}{
		Success:   true,
		EmailID:   email.ID,
		MessageID: email.MessageID,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	if err := json.NewEncoder(w).Encode(response); err != nil {
		http.Error(w, "Failed to encode response: "+err.Error(), http.StatusInternalServerError)
		return
	}
}

// generateEmailID generates a unique ID for an email
func generateEmailID() string {
	return fmt.Sprintf("email_%d", time.Now().UnixNano())
}

// generateMessageID generates a Message-ID for an email
func generateMessageID(fromEmail string) string {
	host := strings.Split(fromEmail, "@")[1]
	return fmt.Sprintf("<%d.%s@%s>", time.Now().UnixNano(), strings.Split(fromEmail, "@")[0], host)
}

// generateAttachmentID generates a unique ID for an attachment
func generateAttachmentID() string {
	return fmt.Sprintf("att_%d", time.Now().UnixNano())
}
