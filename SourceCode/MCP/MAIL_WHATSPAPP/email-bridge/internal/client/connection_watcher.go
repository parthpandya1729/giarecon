package client

import (
	"fmt"
	"sync"
	"time"
)

// ConnectionWatcher monitors the health of email connections
type ConnectionWatcher struct {
	connectionManager *ConnectionManager
	checkInterval     time.Duration
	stopChan          chan struct{}
	running           bool
	mutex             sync.Mutex
}

var (
	// Global connection watcher instance
	globalConnectionWatcher *ConnectionWatcher
	connectionWatcherMutex  sync.Mutex
)

// GetConnectionWatcher returns the global connection watcher instance
func GetConnectionWatcher() *ConnectionWatcher {
	connectionWatcherMutex.Lock()
	defer connectionWatcherMutex.Unlock()

	if globalConnectionWatcher == nil {
		globalConnectionWatcher = &ConnectionWatcher{
			connectionManager: GetConnectionManager(),
			checkInterval:     time.Minute, // Check connections every minute
			stopChan:          make(chan struct{}),
			running:           false,
			mutex:             sync.Mutex{},
		}
	}

	return globalConnectionWatcher
}

// Start starts the connection watcher
func (cw *ConnectionWatcher) Start() {
	cw.mutex.Lock()
	defer cw.mutex.Unlock()

	if cw.running {
		return
	}

	cw.running = true
	go cw.watchConnections()
}

// Stop stops the connection watcher
func (cw *ConnectionWatcher) Stop() {
	cw.mutex.Lock()
	defer cw.mutex.Unlock()

	if !cw.running {
		return
	}

	close(cw.stopChan)
	cw.stopChan = make(chan struct{})
	cw.running = false
}

// SetCheckInterval sets the interval for checking connections
func (cw *ConnectionWatcher) SetCheckInterval(interval time.Duration) {
	cw.mutex.Lock()
	defer cw.mutex.Unlock()
	cw.checkInterval = interval
}

// watchConnections periodically checks the health of all connections
func (cw *ConnectionWatcher) watchConnections() {
	ticker := time.NewTicker(cw.checkInterval)
	defer ticker.Stop()

	for {
		select {
		case <-cw.stopChan:
			return
		case <-ticker.C:
			cw.checkAllConnections()
		}
	}
}

// checkAllConnections checks the health of all registered connections
func (cw *ConnectionWatcher) checkAllConnections() {
	cm := cw.connectionManager
	cm.mutex.RLock()
	clientIDs := make([]string, 0, len(cm.clients))
	for id := range cm.clients {
		clientIDs = append(clientIDs, id)
	}
	cm.mutex.RUnlock()

	for _, id := range clientIDs {
		cm.mutex.RLock()
		client, ok := cm.clients[id]
		cm.mutex.RUnlock()

		if !ok {
			continue
		}

		// Check if the client is connected
		if !client.IsConnected() {
			fmt.Printf("Connection watcher detected disconnected client: %s\n", id)
			cm.ScheduleReconnect(id)
		}
	}
}
