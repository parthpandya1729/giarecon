package models

import (
	"time"
)

// Account represents an email account
type Account struct {
	ID          string       `json:"id"`
	Name        string       `json:"name"`
	Email       string       `json:"email"`
	IMAPConfig  IMAPConfig   `json:"imap_config"`
	SMTPConfig  SMTPConfig   `json:"smtp_config"`
	AuthType    string       `json:"auth_type"` // password, oauth
	OAuthConfig *OAuthConfig `json:"oauth_config,omitempty"`
}

// IMAPConfig represents IMAP server configuration
type IMAPConfig struct {
	Server   string `json:"server"`
	Port     int    `json:"port"`
	Username string `json:"username"`
	Password string `json:"password,omitempty"`
	UseTLS   bool   `json:"use_tls"`
}

// SMTPConfig represents SMTP server configuration
type SMTPConfig struct {
	Server   string `json:"server"`
	Port     int    `json:"port"`
	Username string `json:"username"`
	Password string `json:"password,omitempty"`
	UseTLS   bool   `json:"use_tls"`
}

// OAuthConfig represents OAuth configuration
type OAuthConfig struct {
	ClientID     string    `json:"client_id"`
	ClientSecret string    `json:"client_secret"`
	RefreshToken string    `json:"refresh_token"`
	AccessToken  string    `json:"access_token"`
	Expiry       time.Time `json:"expiry"`
}
