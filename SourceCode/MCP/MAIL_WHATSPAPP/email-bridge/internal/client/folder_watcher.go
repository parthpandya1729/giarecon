package client

import (
	"fmt"
	"sync"
	"time"

	"github.com/user/email-bridge/internal/models"
	"github.com/user/email-bridge/internal/store"
)

// FolderWatcher watches for folder changes and synchronizes them
type FolderWatcher struct {
	store        store.Store
	clients      map[string]IMAPClient
	syncInterval time.Duration
	mutex        sync.RWMutex
	stopChans    map[string]chan struct{}
	running      bool
}

var (
	// Global folder watcher instance
	globalFolderWatcher *FolderWatcher
	folderWatcherMutex  sync.Mutex
)

// GetFolderWatcher returns the global folder watcher instance
func GetFolderWatcher(store store.Store) *FolderWatcher {
	folderWatcherMutex.Lock()
	defer folderWatcherMutex.Unlock()

	if globalFolderWatcher == nil {
		globalFolderWatcher = &FolderWatcher{
			store:        store,
			clients:      make(map[string]IMAPClient),
			syncInterval: 15 * time.Minute, // Default sync interval
			mutex:        sync.RWMutex{},
			stopChans:    make(map[string]chan struct{}),
			running:      false,
		}
	}

	// Update the store if provided
	if store != nil {
		globalFolderWatcher.store = store
	}

	return globalFolderWatcher
}

// SetSyncInterval sets the folder synchronization interval
func (w *FolderWatcher) SetSyncInterval(interval time.Duration) {
	w.mutex.Lock()
	defer w.mutex.Unlock()
	w.syncInterval = interval
}

// RegisterClient registers an IMAP client with the folder watcher
func (w *FolderWatcher) RegisterClient(accountID string, client IMAPClient) {
	w.mutex.Lock()
	defer w.mutex.Unlock()

	w.clients[accountID] = client

	// Start watching if not already running
	if w.running {
		w.startWatchingAccount(accountID, client)
	}
}

// UnregisterClient unregisters an IMAP client from the folder watcher
func (w *FolderWatcher) UnregisterClient(accountID string) {
	w.mutex.Lock()
	defer w.mutex.Unlock()

	// Stop watching this account
	if stopChan, ok := w.stopChans[accountID]; ok {
		close(stopChan)
		delete(w.stopChans, accountID)
	}

	delete(w.clients, accountID)
}

// Start starts the folder watcher
func (w *FolderWatcher) Start() {
	w.mutex.Lock()
	defer w.mutex.Unlock()

	if w.running {
		return
	}

	w.running = true

	// Start watching all registered clients
	for accountID, client := range w.clients {
		w.startWatchingAccount(accountID, client)
	}
}

// Stop stops the folder watcher
func (w *FolderWatcher) Stop() {
	w.mutex.Lock()
	defer w.mutex.Unlock()

	if !w.running {
		return
	}

	// Stop all watchers
	for accountID, stopChan := range w.stopChans {
		close(stopChan)
		delete(w.stopChans, accountID)
	}

	w.running = false
}

// startWatchingAccount starts watching for folder changes for a specific account
func (w *FolderWatcher) startWatchingAccount(accountID string, client IMAPClient) {
	// Stop existing watcher if any
	if stopChan, ok := w.stopChans[accountID]; ok {
		close(stopChan)
	}

	// Create a new stop channel
	stopChan := make(chan struct{})
	w.stopChans[accountID] = stopChan

	// Start the watcher goroutine
	go w.watchFolders(accountID, client, stopChan)
}

// watchFolders periodically synchronizes folders for an account
func (w *FolderWatcher) watchFolders(accountID string, client IMAPClient, stopChan chan struct{}) {
	// Initial sync
	w.syncFolders(accountID, client)

	// Set up ticker for periodic sync
	ticker := time.NewTicker(w.syncInterval)
	defer ticker.Stop()

	for {
		select {
		case <-stopChan:
			return
		case <-ticker.C:
			w.syncFolders(accountID, client)
		}
	}
}

// syncFolders synchronizes folders for an account
func (w *FolderWatcher) syncFolders(accountID string, client IMAPClient) {
	// Skip if store is not set
	if w.store == nil {
		return
	}

	// Create sync options
	options := models.FolderSyncOptions{
		AccountID:     accountID,
		CreateMissing: true,  // Create missing folders in the database
		DeleteExtra:   false, // Don't delete extra folders
		SubscribeNew:  false, // Don't subscribe to new folders
	}

	// Get the event handler
	eventHandler := GetEmailEventHandler(w.store)

	// Synchronize folders
	if err := eventHandler.SyncFolders(client, accountID, options); err != nil {
		fmt.Printf("Warning: Failed to synchronize folders for account %s: %v\n", accountID, err)
	}
}

// SyncAllFolders synchronizes folders for all accounts
func (w *FolderWatcher) SyncAllFolders() {
	w.mutex.RLock()
	defer w.mutex.RUnlock()

	for accountID, client := range w.clients {
		go w.syncFolders(accountID, client)
	}
}

// SyncFoldersForAccount synchronizes folders for a specific account
func (w *FolderWatcher) SyncFoldersForAccount(accountID string) error {
	w.mutex.RLock()
	defer w.mutex.RUnlock()

	client, ok := w.clients[accountID]
	if !ok {
		return fmt.Errorf("no client registered for account %s", accountID)
	}

	go w.syncFolders(accountID, client)
	return nil
}
