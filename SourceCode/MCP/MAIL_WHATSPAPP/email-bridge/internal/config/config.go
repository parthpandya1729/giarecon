package config

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
)

// Config represents the application configuration
type Config struct {
	Server   ServerConfig    `json:"server"`
	Database DatabaseConfig  `json:"database"`
	Accounts []AccountConfig `json:"accounts"`
}

// ServerConfig represents the server configuration
type ServerConfig struct {
	Host string `json:"host"`
	Port int    `json:"port"`
}

// DatabaseConfig represents the database configuration
type DatabaseConfig struct {
	Path string `json:"path"`
}

// AccountConfig represents an email account configuration
type AccountConfig struct {
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
	ClientID     string `json:"client_id"`
	ClientSecret string `json:"client_secret"`
	RefreshToken string `json:"refresh_token"`
	AccessToken  string `json:"access_token"`
	Expiry       string `json:"expiry"`
}

// DefaultConfig returns the default configuration
func DefaultConfig() Config {
	return Config{
		Server: ServerConfig{
			Host: "localhost",
			Port: 8080,
		},
		Database: DatabaseConfig{
			Path: "email_bridge.db",
		},
		Accounts: []AccountConfig{},
	}
}

// LoadConfig loads the configuration from the specified file
func LoadConfig(path string) (Config, error) {
	config := DefaultConfig()

	// Create directory if it doesn't exist
	dir := filepath.Dir(path)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return config, fmt.Errorf("failed to create config directory: %w", err)
	}

	// Check if file exists
	if _, err := os.Stat(path); os.IsNotExist(err) {
		// Create default config file
		if err := SaveConfig(path, config); err != nil {
			return config, fmt.Errorf("failed to create default config: %w", err)
		}
		return config, nil
	}

	// Read config file
	data, err := os.ReadFile(path)
	if err != nil {
		return config, fmt.Errorf("failed to read config file: %w", err)
	}

	// Parse config file
	if err := json.Unmarshal(data, &config); err != nil {
		return config, fmt.Errorf("failed to parse config file: %w", err)
	}

	return config, nil
}

// SaveConfig saves the configuration to the specified file
func SaveConfig(path string, config Config) error {
	data, err := json.MarshalIndent(config, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal config: %w", err)
	}

	if err := os.WriteFile(path, data, 0644); err != nil {
		return fmt.Errorf("failed to write config file: %w", err)
	}

	return nil
}
