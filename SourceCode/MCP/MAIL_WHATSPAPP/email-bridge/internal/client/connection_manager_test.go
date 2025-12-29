package client

import (
	"errors"
	"testing"
	"time"
)

// MockEmailClient implements the EmailClient interface for testing
type MockEmailClient struct {
	connected       bool
	connectError    error
	disconnectError error
	connectCalls    int
	disconnectCalls int
}

func (m *MockEmailClient) Connect() error {
	m.connectCalls++
	if m.connectError != nil {
		return m.connectError
	}
	m.connected = true
	return nil
}

func (m *MockEmailClient) Disconnect() error {
	m.disconnectCalls++
	if m.disconnectError != nil {
		return m.disconnectError
	}
	m.connected = false
	return nil
}

func (m *MockEmailClient) IsConnected() bool {
	return m.connected
}

func TestConnectionManager(t *testing.T) {
	// Reset global connection manager for testing
	connectionManagerMutex.Lock()
	globalConnectionManager = nil
	connectionManagerMutex.Unlock()

	// Get a new connection manager
	cm := GetConnectionManager()

	// Start the connection manager
	cm.Start()
	defer cm.Stop()

	// Create mock clients
	client1 := &MockEmailClient{}
	client2 := &MockEmailClient{connectError: errors.New("connection error")}

	// Register clients
	cm.RegisterClient("client1", client1)
	cm.RegisterClient("client2", client2)

	// Test getting clients
	c1, ok := cm.GetClient("client1")
	if !ok {
		t.Error("Expected to find client1")
	}
	if c1 != client1 {
		t.Error("Got wrong client for client1")
	}

	c2, ok := cm.GetClient("client2")
	if !ok {
		t.Error("Expected to find client2")
	}
	if c2 != client2 {
		t.Error("Got wrong client for client2")
	}

	// Test reconnection scheduling
	cm.ScheduleReconnect("client1")

	// Wait a bit for reconnection to be processed
	time.Sleep(100 * time.Millisecond)

	if client1.connectCalls != 1 {
		t.Errorf("Expected 1 connect call for client1, got %d", client1.connectCalls)
	}

	// Test reconnection with error
	cm.ScheduleReconnect("client2")

	// Wait a bit for reconnection to be processed
	time.Sleep(100 * time.Millisecond)

	if client2.connectCalls != 1 {
		t.Errorf("Expected 1 connect call for client2, got %d", client2.connectCalls)
	}

	// Test unregistering client
	cm.UnregisterClient("client1")
	_, ok = cm.GetClient("client1")
	if ok {
		t.Error("Expected client1 to be unregistered")
	}
}
