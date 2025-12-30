package client

import (
	"fmt"
	"sync"

	"github.com/user/email-bridge/internal/config"
	"github.com/user/email-bridge/internal/crypto"
)

// CredentialManager handles secure storage and retrieval of email credentials
type CredentialManager struct {
	crypto      *crypto.CredentialCrypto
	mutex       sync.Mutex
	keyPath     string
	initialized bool
}

var (
	// Global credential manager instance
	globalCredentialManager *CredentialManager
	credentialManagerMutex  sync.Mutex
)

// GetCredentialManager returns the global credential manager instance
func GetCredentialManager(keyPath string) (*CredentialManager, error) {
	credentialManagerMutex.Lock()
	defer credentialManagerMutex.Unlock()

	if globalCredentialManager != nil && globalCredentialManager.initialized {
		return globalCredentialManager, nil
	}

	crypto, err := crypto.NewCredentialCrypto(keyPath)
	if err != nil {
		return nil, fmt.Errorf("failed to initialize credential crypto: %w", err)
	}

	globalCredentialManager = &CredentialManager{
		crypto:      crypto,
		keyPath:     keyPath,
		mutex:       sync.Mutex{},
		initialized: true,
	}

	return globalCredentialManager, nil
}

// EncryptCredentials encrypts sensitive information in the account configuration
func (cm *CredentialManager) EncryptCredentials(account *config.AccountConfig) error {
	cm.mutex.Lock()
	defer cm.mutex.Unlock()

	if !cm.initialized {
		return fmt.Errorf("credential manager not initialized")
	}

	// Encrypt IMAP password if present
	if account.IMAPConfig.Password != "" {
		encrypted, err := cm.crypto.Encrypt(account.IMAPConfig.Password)
		if err != nil {
			return fmt.Errorf("failed to encrypt IMAP password: %w", err)
		}
		account.IMAPConfig.Password = encrypted
	}

	// Encrypt SMTP password if present
	if account.SMTPConfig.Password != "" {
		encrypted, err := cm.crypto.Encrypt(account.SMTPConfig.Password)
		if err != nil {
			return fmt.Errorf("failed to encrypt SMTP password: %w", err)
		}
		account.SMTPConfig.Password = encrypted
	}

	// Encrypt OAuth credentials if present
	if account.OAuthConfig != nil {
		if account.OAuthConfig.ClientSecret != "" {
			encrypted, err := cm.crypto.Encrypt(account.OAuthConfig.ClientSecret)
			if err != nil {
				return fmt.Errorf("failed to encrypt OAuth client secret: %w", err)
			}
			account.OAuthConfig.ClientSecret = encrypted
		}

		if account.OAuthConfig.RefreshToken != "" {
			encrypted, err := cm.crypto.Encrypt(account.OAuthConfig.RefreshToken)
			if err != nil {
				return fmt.Errorf("failed to encrypt OAuth refresh token: %w", err)
			}
			account.OAuthConfig.RefreshToken = encrypted
		}

		if account.OAuthConfig.AccessToken != "" {
			encrypted, err := cm.crypto.Encrypt(account.OAuthConfig.AccessToken)
			if err != nil {
				return fmt.Errorf("failed to encrypt OAuth access token: %w", err)
			}
			account.OAuthConfig.AccessToken = encrypted
		}
	}

	return nil
}

// DecryptCredentials decrypts sensitive information in the account configuration
func (cm *CredentialManager) DecryptCredentials(account *config.AccountConfig) error {
	cm.mutex.Lock()
	defer cm.mutex.Unlock()

	if !cm.initialized {
		return fmt.Errorf("credential manager not initialized")
	}

	// Decrypt IMAP password if present
	if account.IMAPConfig.Password != "" {
		decrypted, err := cm.crypto.Decrypt(account.IMAPConfig.Password)
		if err != nil {
			return fmt.Errorf("failed to decrypt IMAP password: %w", err)
		}
		account.IMAPConfig.Password = decrypted
	}

	// Decrypt SMTP password if present
	if account.SMTPConfig.Password != "" {
		decrypted, err := cm.crypto.Decrypt(account.SMTPConfig.Password)
		if err != nil {
			return fmt.Errorf("failed to decrypt SMTP password: %w", err)
		}
		account.SMTPConfig.Password = decrypted
	}

	// Decrypt OAuth credentials if present
	if account.OAuthConfig != nil {
		if account.OAuthConfig.ClientSecret != "" {
			decrypted, err := cm.crypto.Decrypt(account.OAuthConfig.ClientSecret)
			if err != nil {
				return fmt.Errorf("failed to decrypt OAuth client secret: %w", err)
			}
			account.OAuthConfig.ClientSecret = decrypted
		}

		if account.OAuthConfig.RefreshToken != "" {
			decrypted, err := cm.crypto.Decrypt(account.OAuthConfig.RefreshToken)
			if err != nil {
				return fmt.Errorf("failed to decrypt OAuth refresh token: %w", err)
			}
			account.OAuthConfig.RefreshToken = decrypted
		}

		if account.OAuthConfig.AccessToken != "" {
			decrypted, err := cm.crypto.Decrypt(account.OAuthConfig.AccessToken)
			if err != nil {
				return fmt.Errorf("failed to decrypt OAuth access token: %w", err)
			}
			account.OAuthConfig.AccessToken = decrypted
		}
	}

	return nil
}

// GetDecryptedAccount returns a copy of the account with decrypted credentials
func (cm *CredentialManager) GetDecryptedAccount(account config.AccountConfig) (config.AccountConfig, error) {
	// Create a copy of the account to avoid modifying the original
	decryptedAccount := account

	// Decrypt the credentials
	if err := cm.DecryptCredentials(&decryptedAccount); err != nil {
		return config.AccountConfig{}, fmt.Errorf("failed to decrypt credentials: %w", err)
	}

	return decryptedAccount, nil
}
