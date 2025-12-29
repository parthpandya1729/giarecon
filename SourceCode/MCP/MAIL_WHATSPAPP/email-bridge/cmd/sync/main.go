package main

import (
	"flag"
	"fmt"
	"os"
	"path/filepath"
	"time"

	"github.com/user/email-bridge/internal/client"
	"github.com/user/email-bridge/internal/config"
	"github.com/user/email-bridge/internal/crypto"
	"github.com/user/email-bridge/internal/store"
)

func main() {
	// Parse command line flags
	accountID := flag.String("account", "", "Account ID to synchronize")
	folder := flag.String("folder", "", "Folder to synchronize (empty for all folders)")
	batchSize := flag.Int("batch-size", 100, "Number of emails to fetch in each batch")
	maxEmails := flag.Int("max-emails", 0, "Maximum number of emails to synchronize (0 for all)")
	syncAttachments := flag.Bool("attachments", false, "Download attachments")
	syncDays := flag.Int("days", 0, "Synchronize emails from the last N days (0 for all)")
	dbPath := flag.String("db", "./email-bridge.db", "Path to the SQLite database")
	configPath := flag.String("config", "./config.json", "Path to the configuration file")
	flag.Parse()

	// Validate required parameters
	if *accountID == "" {
		fmt.Println("Error: Account ID is required")
		flag.Usage()
		os.Exit(1)
	}

	// Load configuration
	cfg, err := config.LoadConfig(*configPath)
	if err != nil {
		fmt.Printf("Error loading configuration: %v\n", err)
		os.Exit(1)
	}

	// Find the account in the configuration
	var accountConfig config.AccountConfig
	found := false
	for _, acc := range cfg.Accounts {
		if acc.ID == *accountID {
			accountConfig = acc
			found = true
			break
		}
	}

	if !found {
		fmt.Printf("Error: Account with ID %s not found in configuration\n", *accountID)
		os.Exit(1)
	}

	// Initialize crypto for secure storage
	masterKeyPath := filepath.Join(filepath.Dir(*configPath), "keys", "master.key")
	cryptoManager, err := crypto.NewCredentialCrypto(masterKeyPath)
	if err != nil {
		fmt.Printf("Error initializing crypto: %v\n", err)
		os.Exit(1)
	}

	// Initialize database
	db, err := store.NewSQLiteStore(*dbPath, cryptoManager)
	if err != nil {
		fmt.Printf("Error connecting to database: %v\n", err)
		os.Exit(1)
	}
	defer db.Close()

	// Initialize database schema if needed
	if err := db.Initialize(); err != nil {
		fmt.Printf("Error initializing database: %v\n", err)
		os.Exit(1)
	}

	// Create IMAP client
	imapClient, err := client.NewIMAPClient(accountConfig)
	if err != nil {
		fmt.Printf("Error connecting to IMAP server: %v\n", err)
		os.Exit(1)
	}
	defer imapClient.Disconnect()

	// Set up sync options
	options := client.EmailSyncOptions{
		AccountID:       *accountID,
		Folder:          *folder,
		BatchSize:       *batchSize,
		MaxEmails:       *maxEmails,
		SyncAttachments: *syncAttachments,
	}

	// Set up date range if specified
	if *syncDays > 0 {
		options.SyncFrom = time.Now().AddDate(0, 0, -*syncDays)
	}

	// Set up progress reporting
	options.OnProgress = func(folder string, current, total int) {
		fmt.Printf("\rSynchronizing %s: %d/%d emails (%.1f%%)", folder, current, total, float64(current)/float64(total)*100)
		if current == total {
			fmt.Println()
		}
	}

	// Start synchronization
	fmt.Println("Starting email synchronization...")
	startTime := time.Now()

	err = imapClient.SyncEmails(db, options)
	if err != nil {
		fmt.Printf("Error synchronizing emails: %v\n", err)
		os.Exit(1)
	}

	duration := time.Since(startTime)
	fmt.Printf("Synchronization completed in %v\n", duration)
}
