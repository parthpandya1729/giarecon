package main

import (
	"flag"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/user/email-bridge/internal/client"
	"github.com/user/email-bridge/internal/config"
	"github.com/user/email-bridge/internal/crypto"
	"github.com/user/email-bridge/internal/store"
)

func main() {
	// Parse command-line arguments
	accountID := flag.String("account", "", "Account ID to synchronize")
	folder := flag.String("folder", "", "Folder to synchronize (empty for all folders)")
	batchSize := flag.Int("batch-size", 100, "Number of emails to fetch in each batch")
	maxEmails := flag.Int("max-emails", 0, "Maximum number of emails to synchronize (0 for all)")
	attachments := flag.Bool("attachments", false, "Download attachments")
	days := flag.Int("days", 0, "Synchronize emails from the last N days (0 for all)")
	dbPath := flag.String("db", "./email-bridge.db", "Path to the SQLite database")
	configPath := flag.String("config", "./config.json", "Path to the configuration file")
	statusChanges := flag.Bool("status-changes", true, "Check for status changes in existing emails")
	verbose := flag.Bool("verbose", false, "Enable verbose logging")

	flag.Parse()

	// Validate required arguments
	if *accountID == "" {
		fmt.Println("Error: Account ID is required")
		flag.Usage()
		os.Exit(1)
	}

	// Load configuration
	cfg, err := config.LoadConfig(*configPath)
	if err != nil {
		log.Fatalf("Error loading configuration: %v", err)
	}

	// Find account configuration
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
		log.Fatalf("Account with ID %s not found in configuration", *accountID)
	}

	// Initialize crypto manager
	cryptoManager, err := crypto.NewCredentialCrypto(cfg.EncryptionKey)
	if err != nil {
		log.Fatalf("Error initializing crypto manager: %v", err)
	}

	// Initialize database
	db, err := store.NewSQLiteStore(*dbPath, cryptoManager)
	if err != nil {
		log.Fatalf("Error connecting to database: %v", err)
	}
	defer db.Close()

	if err := db.Initialize(); err != nil {
		log.Fatalf("Error initializing database: %v", err)
	}

	// Create IMAP client
	imapClient, err := client.NewIMAPClient(accountConfig)
	if err != nil {
		log.Fatalf("Error connecting to IMAP server: %v", err)
	}
	defer imapClient.Disconnect()

	// Create incremental sync options
	options := client.IncrementalSyncOptions{
		AccountID:          *accountID,
		Folder:             *folder,
		BatchSize:          *batchSize,
		MaxEmails:          *maxEmails,
		SyncAttachments:    *attachments,
		CheckStatusChanges: *statusChanges,
	}

	// Add date filter if specified
	if *days > 0 {
		since := time.Now().AddDate(0, 0, -*days)
		if *verbose {
			fmt.Printf("Synchronizing emails since %s\n", since.Format("2006-01-02"))
		}
	}

	// Add progress reporting
	options.OnProgress = func(folder string, current, total int) {
		if total > 0 {
			fmt.Printf("\rSynchronizing %s: %d/%d emails (%.1f%%)", folder, current, total, float64(current)/float64(total)*100)
		} else {
			fmt.Printf("\rSynchronizing %s: No new emails found", folder)
		}
		if current == total {
			fmt.Println()
		}
	}

	// Perform incremental sync
	fmt.Println("Starting incremental synchronization...")
	startTime := time.Now()

	err = imapClient.IncrementalSync(db, options)
	if err != nil {
		log.Fatalf("Error during incremental synchronization: %v", err)
	}

	duration := time.Since(startTime)
	fmt.Printf("Incremental synchronization completed in %s\n", duration)
}
