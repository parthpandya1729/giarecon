package models

import (
	"time"
)

// Email represents an email message
type Email struct {
	ID             string            `json:"id"`
	AccountID      string            `json:"account_id"`
	MessageID      string            `json:"message_id"`
	Folder         string            `json:"folder"`
	From           Address           `json:"from"`
	To             []Address         `json:"to"`
	Cc             []Address         `json:"cc"`
	Bcc            []Address         `json:"bcc"`
	Subject        string            `json:"subject"`
	TextContent    string            `json:"text_content"`
	HtmlContent    string            `json:"html_content"`
	Date           time.Time         `json:"date"`
	IsRead         bool              `json:"is_read"`
	HasAttachments bool              `json:"has_attachments"`
	Attachments    []Attachment      `json:"attachments,omitempty"`
	Headers        map[string]string `json:"headers,omitempty"`
}

// Address represents an email address with optional name
type Address struct {
	Name  string `json:"name"`
	Email string `json:"email"`
}

// Attachment represents an email attachment
type Attachment struct {
	ID          string `json:"id"`
	EmailID     string `json:"email_id"`
	Filename    string `json:"filename"`
	ContentType string `json:"content_type"`
	Size        int64  `json:"size"`
	ContentID   string `json:"content_id,omitempty"` // For inline attachments
	Path        string `json:"path,omitempty"`       // Local storage path
}

// SearchCriteria represents parameters for searching emails
type SearchCriteria struct {
	AccountID      string    `json:"account_id"`
	Folder         string    `json:"folder"`
	Query          string    `json:"query"`
	FromAddress    string    `json:"from_address"`
	ToAddress      string    `json:"to_address"`
	Subject        string    `json:"subject"`
	AfterDate      time.Time `json:"after_date"`
	BeforeDate     time.Time `json:"before_date"`
	HasAttachments *bool     `json:"has_attachments"`
	IsRead         *bool     `json:"is_read"`
	Limit          int       `json:"limit"`
	Offset         int       `json:"offset"`
}

// EmailStatus represents the status of an email
type EmailStatus struct {
	IsRead bool   `json:"is_read"`
	Folder string `json:"folder"`
}
