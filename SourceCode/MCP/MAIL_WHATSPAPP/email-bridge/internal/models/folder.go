package models

// Folder represents an email folder
type Folder struct {
	ID        string `json:"id"`
	AccountID string `json:"account_id"`
	Name      string `json:"name"`
	Path      string `json:"path"`
	// Special flags for system folders like Inbox, Sent, Trash, etc.
	IsInbox     bool `json:"is_inbox"`
	IsSent      bool `json:"is_sent"`
	IsTrash     bool `json:"is_trash"`
	IsDrafts    bool `json:"is_drafts"`
	IsJunk      bool `json:"is_junk"`
	IsArchive   bool `json:"is_archive"`
	IsImportant bool `json:"is_important"`
	// Folder attributes
	CanSelect    bool `json:"can_select"`    // Can be selected (contains messages)
	CanCreate    bool `json:"can_create"`    // Can create subfolders
	IsSubscribed bool `json:"is_subscribed"` // User is subscribed to this folder
}

// FolderSyncOptions represents options for folder synchronization
type FolderSyncOptions struct {
	AccountID string `json:"account_id"`
	// Whether to create folders on the server that exist locally but not on the server
	CreateMissing bool `json:"create_missing"`
	// Whether to delete folders on the server that don't exist locally
	DeleteExtra bool `json:"delete_extra"`
	// Whether to subscribe to new folders
	SubscribeNew bool `json:"subscribe_new"`
}
