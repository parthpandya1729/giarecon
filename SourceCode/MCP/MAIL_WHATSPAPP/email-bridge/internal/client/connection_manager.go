package client

import (
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/user/email-bridge/internal/config"
	"github.com/user/email-bridge/internal/models"
)

// ConnectionManager handles connection management for email clients
type ConnectionManager struct {
	clients       map[string]EmailClient
	mutex         sync.RWMutex
	reconnectChan chan string
	stopChan      chan struct{}
	running       bool
}

var (
	// Global connection manager instance
	globalConnectionManager *ConnectionManager
	connectionManagerMutex  sync.Mutex
)

// GetConnectionManager returns the global connection manager instance
func GetConnectionManager() *ConnectionManager {
	connectionManagerMutex.Lock()
	defer connectionManagerMutex.Unlock()

	if globalConnectionManager == nil {
		globalConnectionManager = &ConnectionManager{
			clients:       make(map[string]EmailClient),
			mutex:         sync.RWMutex{},
			reconnectChan: make(chan string, 100),
			stopChan:      make(chan struct{}),
			running:       false,
		}
	}

	return globalConnectionManager
}

// Start starts the connection manager
func (cm *ConnectionManager) Start() {
	cm.mutex.Lock()
	defer cm.mutex.Unlock()

	if cm.running {
		return
	}

	cm.running = true
	go cm.reconnectLoop()
}

// Stop stops the connection manager
func (cm *ConnectionManager) Stop() {
	cm.mutex.Lock()
	defer cm.mutex.Unlock()

	if !cm.running {
		return
	}

	close(cm.stopChan)
	cm.stopChan = make(chan struct{})
	cm.running = false
}

// RegisterClient registers a client with the connection manager
func (cm *ConnectionManager) RegisterClient(id string, client EmailClient) {
	cm.mutex.Lock()
	defer cm.mutex.Unlock()

	cm.clients[id] = client
}

// UnregisterClient unregisters a client from the connection manager
func (cm *ConnectionManager) UnregisterClient(id string) {
	cm.mutex.Lock()
	defer cm.mutex.Unlock()

	delete(cm.clients, id)
}

// GetClient returns a client by ID
func (cm *ConnectionManager) GetClient(id string) (EmailClient, bool) {
	cm.mutex.RLock()
	defer cm.mutex.RUnlock()

	client, ok := cm.clients[id]
	return client, ok
}

// ScheduleReconnect schedules a reconnection attempt for a client
func (cm *ConnectionManager) ScheduleReconnect(id string) {
	select {
	case cm.reconnectChan <- id:
		// Successfully scheduled reconnect
	default:
		// Channel is full, log this but don't block
		fmt.Printf("Warning: Reconnect channel is full, skipping reconnect for %s\n", id)
	}
}

// reconnectLoop handles reconnection attempts for clients
func (cm *ConnectionManager) reconnectLoop() {
	// Track reconnection attempts and backoff times
	reconnectAttempts := make(map[string]int)
	nextReconnectTime := make(map[string]time.Time)

	for {
		select {
		case <-cm.stopChan:
			return
		case id := <-cm.reconnectChan:
			// Check if we should attempt reconnection now or wait
			now := time.Now()
			if nextTime, ok := nextReconnectTime[id]; ok && now.Before(nextTime) {
				// Reschedule for later
				go func(id string, delay time.Duration) {
					time.Sleep(delay)
					cm.ScheduleReconnect(id)
				}(id, nextTime.Sub(now))
				continue
			}

			// Get the client
			cm.mutex.RLock()
			client, ok := cm.clients[id]
			cm.mutex.RUnlock()

			if !ok {
				// Client no longer exists
				delete(reconnectAttempts, id)
				delete(nextReconnectTime, id)
				continue
			}

			// Attempt reconnection
			err := client.Connect()
			if err != nil {
				// Reconnection failed, increment attempt counter and schedule next attempt
				attempts := reconnectAttempts[id] + 1
				reconnectAttempts[id] = attempts

				// Calculate backoff time (exponential backoff with max of 5 minutes)
				backoff := time.Duration(1<<uint(min(attempts, 8))) * time.Second
				if backoff > 5*time.Minute {
					backoff = 5 * time.Minute
				}

				nextReconnectTime[id] = time.Now().Add(backoff)

				fmt.Printf("Reconnection attempt %d for %s failed: %v. Next attempt in %v\n",
					attempts, id, err, backoff)

				// Schedule next attempt
				go func(id string, delay time.Duration) {
					time.Sleep(delay)
					cm.ScheduleReconnect(id)
				}(id, backoff)
			} else {
				// Reconnection successful, reset counters
				delete(reconnectAttempts, id)
				delete(nextReconnectTime, id)
				fmt.Printf("Successfully reconnected %s\n", id)

				// If this is an IMAP client, synchronize folders
				if imapClient, ok := client.(IMAPClient); ok && strings.HasPrefix(id, "imap-") {
					// Extract account ID from client ID
					accountID := strings.TrimPrefix(id, "imap-")

					// Get the event handler
					eventHandler := GetEmailEventHandler(nil) // We'll set the store later

					// Create sync options
					options := models.FolderSyncOptions{
						AccountID:     accountID,
						CreateMissing: false, // Don't create missing folders on reconnect
						DeleteExtra:   false, // Don't delete extra folders on reconnect
						SubscribeNew:  false, // Don't subscribe to new folders on reconnect
					}

					// Synchronize folders in a goroutine to avoid blocking
					go func() {
						if err := eventHandler.SyncFolders(imapClient, accountID, options); err != nil {
							fmt.Printf("Warning: Failed to synchronize folders for account %s: %v\n", accountID, err)
						}
					}()
				}
			}
		}
	}
}

// min returns the minimum of two integers
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

// InitializeClients initializes email clients for all configured accounts
func InitializeClients(configs []config.AccountConfig) error {
	cm := GetConnectionManager()
	cm.Start()

	for _, cfg := range configs {
		// Initialize IMAP client
		imapClient, err := NewIMAPClient(cfg)
		if err != nil {
			fmt.Printf("Warning: Failed to initialize IMAP client for account %s: %v\n", cfg.ID, err)
			// Continue with other accounts
			continue
		}

		// Register client with connection manager
		cm.RegisterClient(fmt.Sprintf("imap-%s", cfg.ID), imapClient)

		// Initialize SMTP client
		smtpClient, err := NewSMTPClient(cfg)
		if err != nil {
			fmt.Printf("Warning: Failed to initialize SMTP client for account %s: %v\n", cfg.ID, err)
			// Continue with other accounts
			continue
		}

		// Register client with connection manager
		cm.RegisterClient(fmt.Sprintf("smtp-%s", cfg.ID), smtpClient)
	}

	return nil
}
