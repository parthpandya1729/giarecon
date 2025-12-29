package client

import (
	"testing"
	"time"
)

func TestConnectionWatcher(t *testing.T) {
	// Reset global instances for testing
	connectionManagerMutex.Lock()
	globalConnectionManager = nil
	connectionManagerMutex.Unlock()

	connectionWatcherMutex.Lock()
	globalConnectionWatcher = nil
	connectionWatcherMutex.Unlock()

	// Get new instances
	cm := GetConnectionManager()
	cw := GetConnectionWatcher()

	// Set a short check interval for testing
	cw.SetCheckInterval(100 * time.Millisecond)

	// Create mock clients
	client1 := &MockEmailClient{connected: true}
	client2 := &MockEmailClient{connected: false}

	// Register clients
	cm.RegisterClient("client1", client1)
	cm.RegisterClient("client2", client2)

	// Start the connection manager and watcher
	cm.Start()
	cw.Start()

	// Wait for the watcher to check connections
	time.Sleep(200 * time.Millisecond)

	// Stop the watcher and manager
	cw.Stop()
	cm.Stop()

	// Verify that the disconnected client had a reconnection attempt scheduled
	if client2.connectCalls < 1 {
		t.Errorf("Expected at least 1 connect call for disconnected client, got %d", client2.connectCalls)
	}
}
