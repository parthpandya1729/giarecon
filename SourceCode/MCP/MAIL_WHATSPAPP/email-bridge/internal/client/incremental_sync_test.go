package client

import (
	"testing"
	"time"

	"github.com/user/email-bridge/internal/models"
	"github.com/user/email-bridge/internal/store"
)

// TestIncrementalSync tests the incremental sync functionality
func TestIncrementalSync(t *testing.T) {
	// Create a mock IMAP client
	mockClient := &mockIMAPClient{
		folders: []string{"INBOX", "Sent"},
		emails: map[string][]mockEmail{
			"INBOX": {
				{uid: 1, subject: "Old Email 1", date: time.Now().Add(-48 * time.Hour), isRead: true},
				{uid: 2, subject: "Old Email 2", date: time.Now().Add(-24 * time.Hour), isRead: false},
				{uid: 3, subject: "New Email 1", date: time.Now().Add(-1 * time.Hour), isRead: false},
			},
		},
		uidValidity: "12345",
	}

	// Create a mock store
	mockStore := &mockStore{
		emails: make(map[string]models.Email),
		syncStatus: map[string]store.SyncStatus{
			"INBOX": {
				AccountID:   "test-account",
				FolderID:    "INBOX",
				LastSync:    time.Now().Add(-24 * time.Hour),
				UIDValidity: "12345",
				LastUID:     2, // We've seen emails with UIDs 1 and 2
			},
		},
	}

	// Create the IMAP client implementation
	imapClient := &IMAPClientImpl{
		client:    mockClient,
		connected: true,
	}

	// Test incremental sync
	options := IncrementalSyncOptions{
		AccountID: "test-account",
		Folder:    "INBOX",
		BatchSize: 100,
	}

	// Perform the sync
	err := imapClient.IncrementalSync(mockStore, options)
	if err != nil {
		t.Fatalf("Error during incremental sync: %v", err)
	}

	// Verify that only the new email (UID 3) was fetched
	if len(mockStore.emails) != 1 {
		t.Errorf("Expected 1 new email to be fetched, got %d", len(mockStore.emails))
	}

	// Verify that the sync status was updated
	inboxStatus, ok := mockStore.syncStatus["INBOX"]
	if !ok {
		t.Fatalf("Sync status for INBOX not found")
	}

	if inboxStatus.LastUID != 3 {
		t.Errorf("Expected LastUID to be updated to 3, got %d", inboxStatus.LastUID)
	}

	// Test status changes
	// Modify the read status of an existing email
	mockClient.emails["INBOX"][1].isRead = true // Mark email with UID 2 as read

	// Create a new mock store with the email already in it
	mockStore2 := &mockStore{
		emails: map[string]models.Email{
			"email-1": {
				ID:      "email-1",
				Subject: "Old Email 1",
				IsRead:  true,
				Headers: map[string]string{"X-IMAP-UID": "1"},
			},
			"email-2": {
				ID:      "email-2",
				Subject: "Old Email 2",
				IsRead:  false, // This should be updated to true
				Headers: map[string]string{"X-IMAP-UID": "2"},
			},
		},
		syncStatus: map[string]store.SyncStatus{
			"INBOX": {
				AccountID:   "test-account",
				FolderID:    "INBOX",
				LastSync:    time.Now().Add(-1 * time.Hour),
				UIDValidity: "12345",
				LastUID:     2,
			},
		},
	}

	// Perform the sync again
	err = imapClient.IncrementalSync(mockStore2, options)
	if err != nil {
		t.Fatalf("Error during incremental sync with status changes: %v", err)
	}

	// Verify that the read status was updated
	email2, ok := mockStore2.emails["email-2"]
	if !ok {
		t.Fatalf("Email with ID email-2 not found")
	}

	if !email2.IsRead {
		t.Errorf("Expected email with UID 2 to be marked as read")
	}

	// Test moved emails
	// Create a mock client with an email moved to a different folder
	mockClient3 := &mockIMAPClient{
		folders: []string{"INBOX", "Archive"},
		emails: map[string][]mockEmail{
			"INBOX": {
				{uid: 1, subject: "Old Email 1", date: time.Now().Add(-48 * time.Hour), isRead: true},
				// Email with UID 2 is no longer in INBOX
			},
			"Archive": {
				{uid: 2, subject: "Old Email 2", date: time.Now().Add(-24 * time.Hour), isRead: true},
			},
		},
		uidValidity: "12345",
	}

	// Create a mock store with both emails in INBOX
	mockStore3 := &mockStore{
		emails: map[string]models.Email{
			"email-1": {
				ID:      "email-1",
				Subject: "Old Email 1",
				Folder:  "INBOX",
				IsRead:  true,
				Headers: map[string]string{"X-IMAP-UID": "1"},
			},
			"email-2": {
				ID:      "email-2",
				Subject: "Old Email 2",
				Folder:  "INBOX", // This email should be detected as moved/deleted
				IsRead:  true,
				Headers: map[string]string{"X-IMAP-UID": "2"},
			},
		},
		syncStatus: map[string]store.SyncStatus{
			"INBOX": {
				AccountID:   "test-account",
				FolderID:    "INBOX",
				LastSync:    time.Now().Add(-1 * time.Hour),
				UIDValidity: "12345",
				LastUID:     2,
			},
		},
	}

	// Create a new IMAP client with the updated mock client
	imapClient3 := &IMAPClientImpl{
		client:    mockClient3,
		connected: true,
	}

	// Perform the sync
	err = imapClient3.IncrementalSync(mockStore3, options)
	if err != nil {
		t.Fatalf("Error during incremental sync with moved emails: %v", err)
	}

	// Verify that the moved email was deleted from the store
	_, ok = mockStore3.emails["email-2"]
	if ok {
		t.Errorf("Expected email with UID 2 to be deleted from the store")
	}
}

// TestIncrementalSyncFirstRun tests that incremental sync falls back to full sync on first run
func TestIncrementalSyncFirstRun(t *testing.T) {
	// Create a mock IMAP client
	mockClient := &mockIMAPClient{
		folders: []string{"INBOX"},
		emails: map[string][]mockEmail{
			"INBOX": {
				{uid: 1, subject: "Email 1", date: time.Now().Add(-48 * time.Hour), isRead: true},
				{uid: 2, subject: "Email 2", date: time.Now().Add(-24 * time.Hour), isRead: false},
			},
		},
		uidValidity: "12345",
	}

	// Create a mock store with no sync status (first run)
	mockStore := &mockStore{
		emails:     make(map[string]models.Email),
		syncStatus: make(map[string]store.SyncStatus),
	}

	// Create the IMAP client implementation
	imapClient := &IMAPClientImpl{
		client:    mockClient,
		connected: true,
	}

	// Test incremental sync
	options := IncrementalSyncOptions{
		AccountID: "test-account",
		Folder:    "INBOX",
		BatchSize: 100,
	}

	// Perform the sync
	err := imapClient.IncrementalSync(mockStore, options)
	if err != nil {
		t.Fatalf("Error during incremental sync first run: %v", err)
	}

	// Verify that all emails were fetched (full sync)
	if len(mockStore.emails) != 2 {
		t.Errorf("Expected 2 emails to be fetched, got %d", len(mockStore.emails))
	}

	// Verify that the sync status was created
	inboxStatus, ok := mockStore.syncStatus["INBOX"]
	if !ok {
		t.Fatalf("Sync status for INBOX not found")
	}

	if inboxStatus.LastUID != 2 {
		t.Errorf("Expected LastUID to be set to 2, got %d", inboxStatus.LastUID)
	}

	if inboxStatus.UIDValidity != "12345" {
		t.Errorf("Expected UIDValidity to be set to 12345, got %s", inboxStatus.UIDValidity)
	}
}

// TestIncrementalSyncUIDValidityChanged tests that incremental sync falls back to full sync when UID validity changes
func TestIncrementalSyncUIDValidityChanged(t *testing.T) {
	// Create a mock IMAP client with a different UID validity
	mockClient := &mockIMAPClient{
		folders: []string{"INBOX"},
		emails: map[string][]mockEmail{
			"INBOX": {
				{uid: 1, subject: "Email 1", date: time.Now().Add(-48 * time.Hour), isRead: true},
				{uid: 2, subject: "Email 2", date: time.Now().Add(-24 * time.Hour), isRead: false},
			},
		},
		uidValidity: "67890", // Different from the stored one
	}

	// Create a mock store with existing sync status
	mockStore := &mockStore{
		emails: make(map[string]models.Email),
		syncStatus: map[string]store.SyncStatus{
			"INBOX": {
				AccountID:   "test-account",
				FolderID:    "INBOX",
				LastSync:    time.Now().Add(-24 * time.Hour),
				UIDValidity: "12345", // Different from the server
				LastUID:     2,
			},
		},
	}

	// Create the IMAP client implementation
	imapClient := &IMAPClientImpl{
		client:    mockClient,
		connected: true,
	}

	// Test incremental sync
	options := IncrementalSyncOptions{
		AccountID: "test-account",
		Folder:    "INBOX",
		BatchSize: 100,
	}

	// Perform the sync
	err := imapClient.IncrementalSync(mockStore, options)
	if err != nil {
		t.Fatalf("Error during incremental sync with changed UID validity: %v", err)
	}

	// Verify that all emails were fetched (full sync)
	if len(mockStore.emails) != 2 {
		t.Errorf("Expected 2 emails to be fetched, got %d", len(mockStore.emails))
	}

	// Verify that the sync status was updated
	inboxStatus, ok := mockStore.syncStatus["INBOX"]
	if !ok {
		t.Fatalf("Sync status for INBOX not found")
	}

	if inboxStatus.UIDValidity != "67890" {
		t.Errorf("Expected UIDValidity to be updated to 67890, got %s", inboxStatus.UIDValidity)
	}
}
