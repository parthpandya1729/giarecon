package store

import (
	"crypto/rand"
	"database/sql"
	"encoding/json"
	"fmt"
	"strconv"
	"time"

	_ "github.com/mattn/go-sqlite3"
	"github.com/user/email-bridge/internal/crypto"
	"github.com/user/email-bridge/internal/models"
)

// Store is the interface for database operations
type Store interface {
	// Initialize initializes the database
	Initialize() error
	// Close closes the database connection
	Close() error

	// Email operations
	StoreEmail(email models.Email) error
	GetEmail(id string) (models.Email, error)
	SearchEmails(criteria models.SearchCriteria) ([]models.Email, error)
	UpdateEmailStatus(id string, status models.EmailStatus) error
	MoveEmail(id string, folder string) error
	DeleteEmail(id string) error

	// Attachment operations
	StoreAttachment(attachment models.Attachment) error
	GetAttachment(id string) (models.Attachment, error)

	// Folder operations
	GetFolders(accountID string) ([]string, error)
	CreateFolder(accountID string, name string) error
	RenameFolder(accountID string, oldName string, newName string) error
	DeleteFolder(accountID string, name string) error

	// Account operations
	StoreAccount(account models.Account) error
	GetAccount(id string) (models.Account, error)
	GetAccounts() ([]models.Account, error)
	DeleteAccount(id string) error

	// Sync operations
	GetSyncStatus(accountID, folderID string) (SyncStatus, error)
	UpdateSyncStatus(status SyncStatus) error
	GetAllSyncStatus(accountID string) ([]SyncStatus, error)
	DeleteSyncStatus(accountID, folderID string) error
}

// SQLiteStore is an implementation of Store using SQLite
type SQLiteStore struct {
	db     *sql.DB
	crypto *crypto.CredentialCrypto
}

// NewSQLiteStore creates a new SQLite store
func NewSQLiteStore(path string, crypto *crypto.CredentialCrypto) (Store, error) {
	db, err := sql.Open("sqlite3", path)
	if err != nil {
		return nil, err
	}

	// Test the connection
	if err := db.Ping(); err != nil {
		db.Close()
		return nil, err
	}

	return &SQLiteStore{
		db:     db,
		crypto: crypto,
	}, nil
}

// Initialize initializes the database
func (s *SQLiteStore) Initialize() error {
	// Execute the schema creation SQL
	_, err := s.db.Exec(Schema)
	return err
}

// Close closes the database connection
func (s *SQLiteStore) Close() error {
	return s.db.Close()
}

// StoreEmail stores an email in the database
func (s *SQLiteStore) StoreEmail(email models.Email) error {
	tx, err := s.db.Begin()
	if err != nil {
		return err
	}
	defer func() {
		if err != nil {
			tx.Rollback()
		}
	}()

	// Get folder ID or create if it doesn't exist
	var folderID string
	err = tx.QueryRow("SELECT id FROM folders WHERE account_id = ? AND name = ?",
		email.AccountID, email.Folder).Scan(&folderID)
	if err == sql.ErrNoRows {
		folderID = generateID()
		_, err = tx.Exec("INSERT INTO folders (id, account_id, name, path) VALUES (?, ?, ?, ?)",
			folderID, email.AccountID, email.Folder, email.Folder)
		if err != nil {
			return err
		}
	} else if err != nil {
		return err
	}

	// Convert headers to JSON string if present
	var headersJSON sql.NullString
	if len(email.Headers) > 0 {
		jsonData, err := json.Marshal(email.Headers)
		if err != nil {
			return err
		}
		headersJSON = sql.NullString{String: string(jsonData), Valid: true}
	}

	// Insert email
	_, err = tx.Exec(`
		INSERT INTO emails (id, account_id, message_id, folder_id, from_name, from_email, 
			subject, text_content, html_content, date, is_read, has_attachments, headers)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		email.ID, email.AccountID, email.MessageID, folderID, email.From.Name, email.From.Email,
		email.Subject, email.TextContent, email.HtmlContent, email.Date, email.IsRead,
		email.HasAttachments, headersJSON)
	if err != nil {
		return err
	}

	// Insert recipients
	for _, to := range email.To {
		_, err = tx.Exec("INSERT INTO recipients (id, email_id, type, name, email) VALUES (?, ?, ?, ?, ?)",
			generateID(), email.ID, "to", to.Name, to.Email)
		if err != nil {
			return err
		}
	}

	for _, cc := range email.Cc {
		_, err = tx.Exec("INSERT INTO recipients (id, email_id, type, name, email) VALUES (?, ?, ?, ?, ?)",
			generateID(), email.ID, "cc", cc.Name, cc.Email)
		if err != nil {
			return err
		}
	}

	for _, bcc := range email.Bcc {
		_, err = tx.Exec("INSERT INTO recipients (id, email_id, type, name, email) VALUES (?, ?, ?, ?, ?)",
			generateID(), email.ID, "bcc", bcc.Name, bcc.Email)
		if err != nil {
			return err
		}
	}

	// Insert attachments if any
	for _, attachment := range email.Attachments {
		attachment.EmailID = email.ID
		_, err = tx.Exec(`
			INSERT INTO attachments (id, email_id, filename, content_type, size, content_id, path)
			VALUES (?, ?, ?, ?, ?, ?, ?)`,
			attachment.ID, attachment.EmailID, attachment.Filename, attachment.ContentType,
			attachment.Size, attachment.ContentID, attachment.Path)
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}

// GetEmail retrieves an email by ID
func (s *SQLiteStore) GetEmail(id string) (models.Email, error) {
	var email models.Email
	var folderID string
	var fromName, fromEmail sql.NullString
	var headersJSON sql.NullString

	// Query the email
	err := s.db.QueryRow(`
		SELECT e.id, e.account_id, e.message_id, e.folder_id, e.from_name, e.from_email,
			e.subject, e.text_content, e.html_content, e.date, e.is_read, e.has_attachments, e.headers,
			f.name as folder_name
		FROM emails e
		JOIN folders f ON e.folder_id = f.id
		WHERE e.id = ?`, id).Scan(
		&email.ID, &email.AccountID, &email.MessageID, &folderID, &fromName, &fromEmail,
		&email.Subject, &email.TextContent, &email.HtmlContent, &email.Date, &email.IsRead,
		&email.HasAttachments, &headersJSON, &email.Folder)

	if err != nil {
		return email, err
	}

	// Set from address
	email.From = models.Address{
		Name:  fromName.String,
		Email: fromEmail.String,
	}

	// Parse headers if present
	if headersJSON.Valid {
		err = json.Unmarshal([]byte(headersJSON.String), &email.Headers)
		if err != nil {
			return email, err
		}
	} else {
		email.Headers = make(map[string]string)
	}

	// Query recipients
	rows, err := s.db.Query("SELECT type, name, email FROM recipients WHERE email_id = ?", id)
	if err != nil {
		return email, err
	}
	defer rows.Close()

	for rows.Next() {
		var recipType, name, emailAddr string
		if err := rows.Scan(&recipType, &name, &emailAddr); err != nil {
			return email, err
		}

		addr := models.Address{Name: name, Email: emailAddr}
		switch recipType {
		case "to":
			email.To = append(email.To, addr)
		case "cc":
			email.Cc = append(email.Cc, addr)
		case "bcc":
			email.Bcc = append(email.Bcc, addr)
		}
	}

	// Query attachments if any
	if email.HasAttachments {
		attachRows, err := s.db.Query(`
			SELECT id, filename, content_type, size, content_id, path
			FROM attachments
			WHERE email_id = ?`, id)
		if err != nil {
			return email, err
		}
		defer attachRows.Close()

		for attachRows.Next() {
			var attachment models.Attachment
			var contentID, path sql.NullString
			if err := attachRows.Scan(&attachment.ID, &attachment.Filename, &attachment.ContentType,
				&attachment.Size, &contentID, &path); err != nil {
				return email, err
			}
			attachment.EmailID = id
			attachment.ContentID = contentID.String
			attachment.Path = path.String
			email.Attachments = append(email.Attachments, attachment)
		}
	}

	return email, nil
}

// SearchEmails searches for emails based on criteria
func (s *SQLiteStore) SearchEmails(criteria models.SearchCriteria) ([]models.Email, error) {
	var emails []models.Email
	var args []interface{}
	query := `
		SELECT e.id, e.account_id, e.message_id, f.name as folder_name, e.from_name, e.from_email,
			e.subject, e.date, e.is_read, e.has_attachments
		FROM emails e
		JOIN folders f ON e.folder_id = f.id
		WHERE 1=1`

	// Add filters based on criteria
	if criteria.AccountID != "" {
		query += " AND e.account_id = ?"
		args = append(args, criteria.AccountID)
	}

	if criteria.Folder != "" {
		query += " AND f.name = ?"
		args = append(args, criteria.Folder)
	}

	if criteria.Query != "" {
		query += " AND (e.subject LIKE ? OR e.text_content LIKE ? OR e.html_content LIKE ?)"
		searchTerm := "%" + criteria.Query + "%"
		args = append(args, searchTerm, searchTerm, searchTerm)
	}

	if criteria.FromAddress != "" {
		query += " AND e.from_email LIKE ?"
		args = append(args, "%"+criteria.FromAddress+"%")
	}

	if criteria.ToAddress != "" {
		query += " AND EXISTS (SELECT 1 FROM recipients r WHERE r.email_id = e.id AND r.email LIKE ?)"
		args = append(args, "%"+criteria.ToAddress+"%")
	}

	if criteria.Subject != "" {
		query += " AND e.subject LIKE ?"
		args = append(args, "%"+criteria.Subject+"%")
	}

	if !criteria.AfterDate.IsZero() {
		query += " AND e.date >= ?"
		args = append(args, criteria.AfterDate)
	}

	if !criteria.BeforeDate.IsZero() {
		query += " AND e.date <= ?"
		args = append(args, criteria.BeforeDate)
	}

	if criteria.HasAttachments != nil {
		query += " AND e.has_attachments = ?"
		args = append(args, *criteria.HasAttachments)
	}

	if criteria.IsRead != nil {
		query += " AND e.is_read = ?"
		args = append(args, *criteria.IsRead)
	}

	// Add order by and limit
	query += " ORDER BY e.date DESC"
	if criteria.Limit > 0 {
		query += " LIMIT ?"
		args = append(args, criteria.Limit)

		if criteria.Offset > 0 {
			query += " OFFSET ?"
			args = append(args, criteria.Offset)
		}
	}

	// Execute query
	rows, err := s.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	// Process results
	for rows.Next() {
		var email models.Email
		var fromName, fromEmail sql.NullString
		if err := rows.Scan(&email.ID, &email.AccountID, &email.MessageID, &email.Folder,
			&fromName, &fromEmail, &email.Subject, &email.Date, &email.IsRead, &email.HasAttachments); err != nil {
			return nil, err
		}

		email.From = models.Address{
			Name:  fromName.String,
			Email: fromEmail.String,
		}

		emails = append(emails, email)
	}

	return emails, nil
}

// UpdateEmailStatus updates the status of an email
func (s *SQLiteStore) UpdateEmailStatus(id string, status models.EmailStatus) error {
	var folderID string
	var err error

	// Begin transaction
	tx, err := s.db.Begin()
	if err != nil {
		return err
	}
	defer func() {
		if err != nil {
			tx.Rollback()
		}
	}()

	// Update read status
	_, err = tx.Exec("UPDATE emails SET is_read = ? WHERE id = ?", status.IsRead, id)
	if err != nil {
		return err
	}

	// Update folder if specified
	if status.Folder != "" {
		// Get email's account ID
		var accountID string
		err = tx.QueryRow("SELECT account_id FROM emails WHERE id = ?", id).Scan(&accountID)
		if err != nil {
			return err
		}

		// Check if folder exists, create if not
		err = tx.QueryRow("SELECT id FROM folders WHERE account_id = ? AND name = ?",
			accountID, status.Folder).Scan(&folderID)
		if err == sql.ErrNoRows {
			folderID = generateID()
			_, err = tx.Exec("INSERT INTO folders (id, account_id, name, path) VALUES (?, ?, ?, ?)",
				folderID, accountID, status.Folder, status.Folder)
			if err != nil {
				return err
			}
		} else if err != nil {
			return err
		}

		// Update email's folder
		_, err = tx.Exec("UPDATE emails SET folder_id = ? WHERE id = ?", folderID, id)
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}

// MoveEmail moves an email to a different folder
func (s *SQLiteStore) MoveEmail(id string, folder string) error {
	var folderID string
	var err error

	// Begin transaction
	tx, err := s.db.Begin()
	if err != nil {
		return err
	}
	defer func() {
		if err != nil {
			tx.Rollback()
		}
	}()

	// Get email's account ID
	var accountID string
	err = tx.QueryRow("SELECT account_id FROM emails WHERE id = ?", id).Scan(&accountID)
	if err != nil {
		return err
	}

	// Check if folder exists, create if not
	err = tx.QueryRow("SELECT id FROM folders WHERE account_id = ? AND name = ?",
		accountID, folder).Scan(&folderID)
	if err == sql.ErrNoRows {
		folderID = generateID()
		_, err = tx.Exec("INSERT INTO folders (id, account_id, name, path) VALUES (?, ?, ?, ?)",
			folderID, accountID, folder, folder)
		if err != nil {
			return err
		}
	} else if err != nil {
		return err
	}

	// Update email's folder
	_, err = tx.Exec("UPDATE emails SET folder_id = ? WHERE id = ?", folderID, id)
	if err != nil {
		return err
	}

	return tx.Commit()
}

// DeleteEmail deletes an email
func (s *SQLiteStore) DeleteEmail(id string) error {
	tx, err := s.db.Begin()
	if err != nil {
		return err
	}
	defer func() {
		if err != nil {
			tx.Rollback()
		}
	}()

	// Delete recipients
	_, err = tx.Exec("DELETE FROM recipients WHERE email_id = ?", id)
	if err != nil {
		return err
	}

	// Delete attachments
	_, err = tx.Exec("DELETE FROM attachments WHERE email_id = ?", id)
	if err != nil {
		return err
	}

	// Delete email
	_, err = tx.Exec("DELETE FROM emails WHERE id = ?", id)
	if err != nil {
		return err
	}

	return tx.Commit()
}

// StoreAttachment stores an attachment
func (s *SQLiteStore) StoreAttachment(attachment models.Attachment) error {
	_, err := s.db.Exec(`
		INSERT INTO attachments (id, email_id, filename, content_type, size, content_id, path)
		VALUES (?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(id) DO UPDATE SET
		filename = excluded.filename,
		content_type = excluded.content_type,
		size = excluded.size,
		content_id = excluded.content_id,
		path = excluded.path`,
		attachment.ID, attachment.EmailID, attachment.Filename, attachment.ContentType,
		attachment.Size, attachment.ContentID, attachment.Path)
	return err
}

// GetAttachment retrieves an attachment by ID
func (s *SQLiteStore) GetAttachment(id string) (models.Attachment, error) {
	var attachment models.Attachment
	var contentID, path sql.NullString

	err := s.db.QueryRow(`
		SELECT id, email_id, filename, content_type, size, content_id, path
		FROM attachments
		WHERE id = ?`, id).Scan(
		&attachment.ID, &attachment.EmailID, &attachment.Filename, &attachment.ContentType,
		&attachment.Size, &contentID, &path)

	if err != nil {
		return attachment, err
	}

	attachment.ContentID = contentID.String
	attachment.Path = path.String

	return attachment, nil
}

// GetFolders retrieves all folders for an account
func (s *SQLiteStore) GetFolders(accountID string) ([]string, error) {
	var folders []string

	rows, err := s.db.Query("SELECT name FROM folders WHERE account_id = ? ORDER BY name", accountID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var folder string
		if err := rows.Scan(&folder); err != nil {
			return nil, err
		}
		folders = append(folders, folder)
	}

	return folders, nil
}

// CreateFolder creates a new folder
func (s *SQLiteStore) CreateFolder(accountID string, name string) error {
	// Check if folder already exists
	var count int
	err := s.db.QueryRow("SELECT COUNT(*) FROM folders WHERE account_id = ? AND name = ?",
		accountID, name).Scan(&count)
	if err != nil {
		return err
	}

	if count > 0 {
		return nil // Folder already exists
	}

	// Create folder
	_, err = s.db.Exec("INSERT INTO folders (id, account_id, name, path) VALUES (?, ?, ?, ?)",
		generateID(), accountID, name, name)
	return err
}

// RenameFolder renames a folder
func (s *SQLiteStore) RenameFolder(accountID string, oldName string, newName string) error {
	_, err := s.db.Exec("UPDATE folders SET name = ?, path = ? WHERE account_id = ? AND name = ?",
		newName, newName, accountID, oldName)
	return err
}

// DeleteFolder deletes a folder and optionally moves its emails
func (s *SQLiteStore) DeleteFolder(accountID string, name string) error {
	tx, err := s.db.Begin()
	if err != nil {
		return err
	}
	defer func() {
		if err != nil {
			tx.Rollback()
		}
	}()

	// Get folder ID
	var folderID string
	err = tx.QueryRow("SELECT id FROM folders WHERE account_id = ? AND name = ?",
		accountID, name).Scan(&folderID)
	if err != nil {
		return err
	}

	// Delete emails in the folder (cascade will delete recipients and attachments)
	_, err = tx.Exec("DELETE FROM emails WHERE folder_id = ?", folderID)
	if err != nil {
		return err
	}

	// Delete folder
	_, err = tx.Exec("DELETE FROM folders WHERE id = ?", folderID)
	if err != nil {
		return err
	}

	return tx.Commit()
}

// StoreAccount stores an account
func (s *SQLiteStore) StoreAccount(account models.Account) error {
	// Encrypt sensitive information
	imapPassword, err := s.crypto.Encrypt(account.IMAPConfig.Password)
	if err != nil {
		return err
	}

	smtpPassword, err := s.crypto.Encrypt(account.SMTPConfig.Password)
	if err != nil {
		return err
	}

	var oauthData sql.NullString
	if account.OAuthConfig != nil {
		// Encrypt OAuth data
		clientSecret, err := s.crypto.Encrypt(account.OAuthConfig.ClientSecret)
		if err != nil {
			return err
		}
		refreshToken, err := s.crypto.Encrypt(account.OAuthConfig.RefreshToken)
		if err != nil {
			return err
		}
		accessToken, err := s.crypto.Encrypt(account.OAuthConfig.AccessToken)
		if err != nil {
			return err
		}

		// Create OAuth data object with encrypted values
		oauthDataObj := struct {
			ClientID     string    `json:"client_id"`
			ClientSecret string    `json:"client_secret"`
			RefreshToken string    `json:"refresh_token"`
			AccessToken  string    `json:"access_token"`
			Expiry       time.Time `json:"expiry"`
		}{
			ClientID:     account.OAuthConfig.ClientID,
			ClientSecret: clientSecret,
			RefreshToken: refreshToken,
			AccessToken:  accessToken,
			Expiry:       account.OAuthConfig.Expiry,
		}

		// Convert to JSON
		oauthDataJSON, err := json.Marshal(oauthDataObj)
		if err != nil {
			return err
		}
		oauthData = sql.NullString{String: string(oauthDataJSON), Valid: true}
	}

	// Insert or update account
	_, err = s.db.Exec(`
		INSERT INTO accounts (
			id, name, email, 
			imap_server, imap_port, imap_username, imap_password, imap_use_tls,
			smtp_server, smtp_port, smtp_username, smtp_password, smtp_use_tls,
			auth_type, oauth_data
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(id) DO UPDATE SET
			name = excluded.name,
			email = excluded.email,
			imap_server = excluded.imap_server,
			imap_port = excluded.imap_port,
			imap_username = excluded.imap_username,
			imap_password = excluded.imap_password,
			imap_use_tls = excluded.imap_use_tls,
			smtp_server = excluded.smtp_server,
			smtp_port = excluded.smtp_port,
			smtp_username = excluded.smtp_username,
			smtp_password = excluded.smtp_password,
			smtp_use_tls = excluded.smtp_use_tls,
			auth_type = excluded.auth_type,
			oauth_data = excluded.oauth_data`,
		account.ID, account.Name, account.Email,
		account.IMAPConfig.Server, account.IMAPConfig.Port, account.IMAPConfig.Username, imapPassword, account.IMAPConfig.UseTLS,
		account.SMTPConfig.Server, account.SMTPConfig.Port, account.SMTPConfig.Username, smtpPassword, account.SMTPConfig.UseTLS,
		account.AuthType, oauthData)

	return err
}

// GetAccount retrieves an account by ID
func (s *SQLiteStore) GetAccount(id string) (models.Account, error) {
	var account models.Account
	var imapPassword, smtpPassword string
	var oauthData sql.NullString

	err := s.db.QueryRow(`
		SELECT 
			id, name, email, 
			imap_server, imap_port, imap_username, imap_password, imap_use_tls,
			smtp_server, smtp_port, smtp_username, smtp_password, smtp_use_tls,
			auth_type, oauth_data
		FROM accounts
		WHERE id = ?`, id).Scan(
		&account.ID, &account.Name, &account.Email,
		&account.IMAPConfig.Server, &account.IMAPConfig.Port, &account.IMAPConfig.Username, &imapPassword, &account.IMAPConfig.UseTLS,
		&account.SMTPConfig.Server, &account.SMTPConfig.Port, &account.SMTPConfig.Username, &smtpPassword, &account.SMTPConfig.UseTLS,
		&account.AuthType, &oauthData)

	if err != nil {
		return account, err
	}

	// Decrypt passwords
	account.IMAPConfig.Password, err = s.crypto.Decrypt(imapPassword)
	if err != nil {
		return account, err
	}

	account.SMTPConfig.Password, err = s.crypto.Decrypt(smtpPassword)
	if err != nil {
		return account, err
	}

	// Parse OAuth data if present
	if oauthData.Valid {
		var oauthDataObj struct {
			ClientID     string    `json:"client_id"`
			ClientSecret string    `json:"client_secret"`
			RefreshToken string    `json:"refresh_token"`
			AccessToken  string    `json:"access_token"`
			Expiry       time.Time `json:"expiry"`
		}

		err = json.Unmarshal([]byte(oauthData.String), &oauthDataObj)
		if err != nil {
			return account, err
		}

		// Decrypt OAuth data
		clientSecret, err := s.crypto.Decrypt(oauthDataObj.ClientSecret)
		if err != nil {
			return account, err
		}
		refreshToken, err := s.crypto.Decrypt(oauthDataObj.RefreshToken)
		if err != nil {
			return account, err
		}
		accessToken, err := s.crypto.Decrypt(oauthDataObj.AccessToken)
		if err != nil {
			return account, err
		}

		account.OAuthConfig = &models.OAuthConfig{
			ClientID:     oauthDataObj.ClientID,
			ClientSecret: clientSecret,
			RefreshToken: refreshToken,
			AccessToken:  accessToken,
			Expiry:       oauthDataObj.Expiry,
		}
	}

	return account, nil
}

// GetAccounts retrieves all accounts
func (s *SQLiteStore) GetAccounts() ([]models.Account, error) {
	var accounts []models.Account

	rows, err := s.db.Query(`
		SELECT 
			id, name, email, 
			imap_server, imap_port, imap_username, imap_use_tls,
			smtp_server, smtp_port, smtp_username, smtp_use_tls,
			auth_type
		FROM accounts
		ORDER BY name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var account models.Account
		if err := rows.Scan(
			&account.ID, &account.Name, &account.Email,
			&account.IMAPConfig.Server, &account.IMAPConfig.Port, &account.IMAPConfig.Username, &account.IMAPConfig.UseTLS,
			&account.SMTPConfig.Server, &account.SMTPConfig.Port, &account.SMTPConfig.Username, &account.SMTPConfig.UseTLS,
			&account.AuthType); err != nil {
			return nil, err
		}

		// Note: We don't load passwords or OAuth data here for security reasons
		accounts = append(accounts, account)
	}

	return accounts, nil
}

// DeleteAccount deletes an account and all associated data
func (s *SQLiteStore) DeleteAccount(id string) error {
	tx, err := s.db.Begin()
	if err != nil {
		return err
	}
	defer func() {
		if err != nil {
			tx.Rollback()
		}
	}()

	// Get all folder IDs for this account
	rows, err := tx.Query("SELECT id FROM folders WHERE account_id = ?", id)
	if err != nil {
		return err
	}
	defer rows.Close()

	var folderIDs []string
	for rows.Next() {
		var folderID string
		if err := rows.Scan(&folderID); err != nil {
			return err
		}
		folderIDs = append(folderIDs, folderID)
	}

	// Delete sync status
	_, err = tx.Exec("DELETE FROM sync_status WHERE account_id = ?", id)
	if err != nil {
		return err
	}

	// For each folder, delete emails and related data
	for _, folderID := range folderIDs {
		// Get all email IDs in this folder
		emailRows, err := tx.Query("SELECT id FROM emails WHERE folder_id = ?", folderID)
		if err != nil {
			return err
		}

		var emailIDs []string
		for emailRows.Next() {
			var emailID string
			if err := emailRows.Scan(&emailID); err != nil {
				emailRows.Close()
				return err
			}
			emailIDs = append(emailIDs, emailID)
		}
		emailRows.Close()

		// Delete recipients and attachments for each email
		for _, emailID := range emailIDs {
			_, err = tx.Exec("DELETE FROM recipients WHERE email_id = ?", emailID)
			if err != nil {
				return err
			}

			_, err = tx.Exec("DELETE FROM attachments WHERE email_id = ?", emailID)
			if err != nil {
				return err
			}
		}

		// Delete emails in this folder
		_, err = tx.Exec("DELETE FROM emails WHERE folder_id = ?", folderID)
		if err != nil {
			return err
		}
	}

	// Delete folders
	_, err = tx.Exec("DELETE FROM folders WHERE account_id = ?", id)
	if err != nil {
		return err
	}

	// Delete account
	_, err = tx.Exec("DELETE FROM accounts WHERE id = ?", id)
	if err != nil {
		return err
	}

	return tx.Commit()
}

// Helper function to generate a unique ID
func generateID() string {
	b := make([]byte, 16)
	_, err := rand.Read(b)
	if err != nil {
		return time.Now().Format("20060102150405") + strconv.FormatInt(rand.Int63(), 10)
	}
	return fmt.Sprintf("%x-%x-%x-%x-%x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:])
}

// SyncStatus represents the synchronization status of a folder
type SyncStatus struct {
	AccountID   string    `json:"account_id"`
	FolderID    string    `json:"folder_id"`
	LastSync    time.Time `json:"last_sync"`
	UIDValidity string    `json:"uid_validity"`
	LastUID     uint32    `json:"last_uid"` // Last seen UID in this folder
}

// GetSyncStatus retrieves the sync status for a folder
func (s *SQLiteStore) GetSyncStatus(accountID, folderID string) (SyncStatus, error) {
	var status SyncStatus
	var lastSync string

	err := s.db.QueryRow(`
		SELECT account_id, folder_id, last_sync, uid_validity, last_uid
		FROM sync_status
		WHERE account_id = ? AND folder_id = ?`,
		accountID, folderID).Scan(
		&status.AccountID, &status.FolderID, &lastSync, &status.UIDValidity, &status.LastUID)

	if err == sql.ErrNoRows {
		// No sync status found, return empty status
		status.AccountID = accountID
		status.FolderID = folderID
		status.LastSync = time.Time{}
		status.UIDValidity = ""
		status.LastUID = 0
		return status, nil
	} else if err != nil {
		return status, err
	}

	// Parse last_sync timestamp
	status.LastSync, err = time.Parse(time.RFC3339, lastSync)
	if err != nil {
		return status, fmt.Errorf("failed to parse last_sync timestamp: %w", err)
	}

	return status, nil
}

// UpdateSyncStatus updates the sync status for a folder
func (s *SQLiteStore) UpdateSyncStatus(status SyncStatus) error {
	// Format timestamp as RFC3339
	lastSync := status.LastSync.Format(time.RFC3339)

	_, err := s.db.Exec(`
		INSERT INTO sync_status (account_id, folder_id, last_sync, uid_validity, last_uid)
		VALUES (?, ?, ?, ?, ?)
		ON CONFLICT(account_id, folder_id) DO UPDATE SET
		last_sync = excluded.last_sync,
		uid_validity = excluded.uid_validity,
		last_uid = excluded.last_uid`,
		status.AccountID, status.FolderID, lastSync, status.UIDValidity, status.LastUID)

	return err
}

// GetAllSyncStatus retrieves all sync statuses for an account
func (s *SQLiteStore) GetAllSyncStatus(accountID string) ([]SyncStatus, error) {
	var statuses []SyncStatus

	rows, err := s.db.Query(`
		SELECT account_id, folder_id, last_sync, uid_validity, last_uid
		FROM sync_status
		WHERE account_id = ?
		ORDER BY folder_id`,
		accountID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var status SyncStatus
		var lastSync string
		if err := rows.Scan(&status.AccountID, &status.FolderID, &lastSync, &status.UIDValidity, &status.LastUID); err != nil {
			return nil, err
		}

		// Parse last_sync timestamp
		status.LastSync, err = time.Parse(time.RFC3339, lastSync)
		if err != nil {
			return nil, fmt.Errorf("failed to parse last_sync timestamp: %w", err)
		}

		statuses = append(statuses, status)
	}

	return statuses, nil
}

// DeleteSyncStatus deletes the sync status for a folder
func (s *SQLiteStore) DeleteSyncStatus(accountID, folderID string) error {
	_, err := s.db.Exec(`
		DELETE FROM sync_status
		WHERE account_id = ? AND folder_id = ?`,
		accountID, folderID)
	return err
}
