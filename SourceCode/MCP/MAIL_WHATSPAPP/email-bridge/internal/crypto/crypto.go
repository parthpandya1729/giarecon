package crypto

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"io"
	"os"
	"path/filepath"

	"golang.org/x/crypto/pbkdf2"
)

const (
	// KeySize is the size of the encryption key in bytes (32 bytes = 256 bits)
	KeySize = 32
	// NonceSize is the size of the nonce for GCM mode
	NonceSize = 12
	// SaltSize is the size of the salt for key derivation
	SaltSize = 32
	// Iterations is the number of iterations for PBKDF2
	Iterations = 100000
)

// CredentialCrypto handles encryption and decryption of credentials
type CredentialCrypto struct {
	masterKey []byte
}

// NewCredentialCrypto creates a new CredentialCrypto instance
func NewCredentialCrypto(keyPath string) (*CredentialCrypto, error) {
	key, err := loadOrCreateMasterKey(keyPath)
	if err != nil {
		return nil, fmt.Errorf("failed to load master key: %w", err)
	}

	return &CredentialCrypto{
		masterKey: key,
	}, nil
}

// NewCredentialCryptoWithPassword creates a new CredentialCrypto instance using a password
func NewCredentialCryptoWithPassword(password string, salt []byte) *CredentialCrypto {
	key := pbkdf2.Key([]byte(password), salt, Iterations, KeySize, sha256.New)
	return &CredentialCrypto{
		masterKey: key,
	}
}

// Encrypt encrypts the given plaintext using AES-GCM
func (c *CredentialCrypto) Encrypt(plaintext string) (string, error) {
	if plaintext == "" {
		return "", nil
	}

	block, err := aes.NewCipher(c.masterKey)
	if err != nil {
		return "", fmt.Errorf("failed to create cipher: %w", err)
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", fmt.Errorf("failed to create GCM: %w", err)
	}

	nonce := make([]byte, NonceSize)
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", fmt.Errorf("failed to generate nonce: %w", err)
	}

	ciphertext := gcm.Seal(nonce, nonce, []byte(plaintext), nil)
	return base64.StdEncoding.EncodeToString(ciphertext), nil
}

// Decrypt decrypts the given ciphertext using AES-GCM
func (c *CredentialCrypto) Decrypt(ciphertext string) (string, error) {
	if ciphertext == "" {
		return "", nil
	}

	data, err := base64.StdEncoding.DecodeString(ciphertext)
	if err != nil {
		return "", fmt.Errorf("failed to decode base64: %w", err)
	}

	if len(data) < NonceSize {
		return "", fmt.Errorf("ciphertext too short")
	}

	block, err := aes.NewCipher(c.masterKey)
	if err != nil {
		return "", fmt.Errorf("failed to create cipher: %w", err)
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", fmt.Errorf("failed to create GCM: %w", err)
	}

	nonce := data[:NonceSize]
	ciphertext_bytes := data[NonceSize:]

	plaintext, err := gcm.Open(nil, nonce, ciphertext_bytes, nil)
	if err != nil {
		return "", fmt.Errorf("failed to decrypt: %w", err)
	}

	return string(plaintext), nil
}

// loadOrCreateMasterKey loads an existing master key or creates a new one
func loadOrCreateMasterKey(keyPath string) ([]byte, error) {
	// Create directory if it doesn't exist
	dir := filepath.Dir(keyPath)
	if err := os.MkdirAll(dir, 0700); err != nil {
		return nil, fmt.Errorf("failed to create key directory: %w", err)
	}

	// Check if key file exists
	if _, err := os.Stat(keyPath); os.IsNotExist(err) {
		// Generate new key
		key := make([]byte, KeySize)
		if _, err := io.ReadFull(rand.Reader, key); err != nil {
			return nil, fmt.Errorf("failed to generate key: %w", err)
		}

		// Save key to file with restricted permissions
		if err := os.WriteFile(keyPath, key, 0600); err != nil {
			return nil, fmt.Errorf("failed to save key: %w", err)
		}

		return key, nil
	}

	// Load existing key
	key, err := os.ReadFile(keyPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read key file: %w", err)
	}

	if len(key) != KeySize {
		return nil, fmt.Errorf("invalid key size: expected %d, got %d", KeySize, len(key))
	}

	return key, nil
}

// GenerateSalt generates a random salt for key derivation
func GenerateSalt() ([]byte, error) {
	salt := make([]byte, SaltSize)
	if _, err := io.ReadFull(rand.Reader, salt); err != nil {
		return nil, fmt.Errorf("failed to generate salt: %w", err)
	}
	return salt, nil
}
