package client

import (
	"fmt"
	"sync"
	"time"

	"github.com/user/email-bridge/internal/models"
	"github.com/user/email-bridge/internal/store"
)

// EmailMonitor manages email monitoring for multiple accounts
type EmailMonitor struct {
	clients      map[string]IMAPClient
	eventHandler *EmailEventHandler
	mutex        sync.RWMutex
	stopChan     chan struct{}
	running      bool
}

var (
	// Global email monitor instance
	globalEmailMonitor *EmailMonitor
	emailMonitorMutex  sync.Mutex
)

// GetEmailMonitor returns the global email monitor instance
func GetEmailMonitor(store store.Store) *EmailMonitor {
	emailMonitorMutex.Lock()
	defer emailMonitorMutex.Unlock()

	if globalEmailMonitor == nil {
		globalEmailMonitor = &EmailMonitor{
			clients:      make(map[string]IMAPClient),
			eventHandler: GetEmailEventHandler(store),
			mutex:        sync.RWMutex{},
			stopChan:     make(chan struct{}),
			running:      false,
		}
	}

	return globalEmailMonitor
}

// Start starts the email monitor
func (em *EmailMonitor) Start() {
	em.mutex.Lock()
	defer em.mutex.Unlock()

	if em.running {
		return
	}

	em.running = true
	em.stopChan = make(chan struct{})

	// Start monitoring for each client
	for id, client := range em.clients {
		go em.monitorClient(id, client)
	}
}

// Stop stops the email monitor
func (em *EmailMonitor) Stop() {
	em.mutex.Lock()
	defer em.mutex.Unlock()

	if !em.running {
		return
	}

	close(em.stopChan)
	em.running = false

	// Stop monitoring for each client
	for _, client := range em.clients {
		client.StopMonitoring()
	}
}

// RegisterClient registers a client with the email monitor
func (em *EmailMonitor) RegisterClient(id string, client IMAPClient) {
	em.mutex.Lock()
	defer em.mutex.Unlock()

	em.clients[id] = client

	// If already running, start monitoring for this client
	if em.running {
		go em.monitorClient(id, client)
	}
}

// UnregisterClient unregisters a client from the email monitor
func (em *EmailMonitor) UnregisterClient(id string) {
	em.mutex.Lock()
	defer em.mutex.Unlock()

	if client, ok := em.clients[id]; ok {
		client.StopMonitoring()
		delete(em.clients, id)
	}
}

// monitorClient starts monitoring for a specific client
func (em *EmailMonitor) monitorClient(id string, client IMAPClient) {
	// Define the callback function for new emails
	callback := func(email models.Email) {
		// Process the new email through the event handler
		if err := em.eventHandler.HandleNewEmail(email); err != nil {
			fmt.Printf("Error handling new email: %v\n", err)
		}
	}

	// Start monitoring with exponential backoff for failures
	maxRetries := 10
	for i := 0; i < maxRetries; i++ {
		select {
		case <-em.stopChan:
			return
		default:
			// Continue with monitoring
		}

		// Start monitoring
		err := client.MonitorMailbox(callback)
		if err == nil {
			// Monitoring started successfully
			fmt.Printf("Started email monitoring for account %s\n", id)
			return
		}

		// If there was an error, wait with exponential backoff
		backoffTime := time.Duration(1<<uint(i)) * time.Second
		if backoffTime > 5*time.Minute {
			backoffTime = 5 * time.Minute
		}

		fmt.Printf("Failed to start monitoring for account %s: %v. Retrying in %v...\n",
			id, err, backoffTime)

		select {
		case <-time.After(backoffTime):
			// Continue with retry
		case <-em.stopChan:
			return
		}
	}

	fmt.Printf("Failed to start monitoring for account %s after %d attempts\n", id, maxRetries)
}

// IsMonitoring checks if a client is being monitored
func (em *EmailMonitor) IsMonitoring(id string) bool {
	em.mutex.RLock()
	defer em.mutex.RUnlock()

	client, ok := em.clients[id]
	if !ok {
		return false
	}

	// Check if the client is connected and monitoring
	// This is a simplification - the actual monitoring state would need to be tracked
	return client.IsConnected()
}
