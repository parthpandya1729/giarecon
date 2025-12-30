package store

// Schema contains the SQL statements to create the database schema
const Schema = `
CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT,
    imap_server TEXT,
    imap_port INTEGER,
    imap_username TEXT,
    imap_password TEXT,
    imap_use_tls BOOLEAN,
    smtp_server TEXT,
    smtp_port INTEGER,
    smtp_username TEXT,
    smtp_password TEXT,
    smtp_use_tls BOOLEAN,
    auth_type TEXT,
    oauth_data TEXT
);

CREATE TABLE IF NOT EXISTS folders (
    id TEXT PRIMARY KEY,
    account_id TEXT,
    name TEXT,
    path TEXT,
    FOREIGN KEY (account_id) REFERENCES accounts(id)
);

CREATE TABLE IF NOT EXISTS emails (
    id TEXT PRIMARY KEY,
    account_id TEXT,
    message_id TEXT,
    folder_id TEXT,
    from_name TEXT,
    from_email TEXT,
    subject TEXT,
    text_content TEXT,
    html_content TEXT,
    date TIMESTAMP,
    is_read BOOLEAN,
    has_attachments BOOLEAN,
    headers TEXT,
    FOREIGN KEY (account_id) REFERENCES accounts(id),
    FOREIGN KEY (folder_id) REFERENCES folders(id)
);

CREATE TABLE IF NOT EXISTS recipients (
    id TEXT PRIMARY KEY,
    email_id TEXT,
    type TEXT, -- to, cc, bcc
    name TEXT,
    email TEXT,
    FOREIGN KEY (email_id) REFERENCES emails(id)
);

CREATE TABLE IF NOT EXISTS attachments (
    id TEXT PRIMARY KEY,
    email_id TEXT,
    filename TEXT,
    content_type TEXT,
    size INTEGER,
    content_id TEXT,
    path TEXT,
    FOREIGN KEY (email_id) REFERENCES emails(id)
);

CREATE TABLE IF NOT EXISTS sync_status (
    account_id TEXT,
    folder_id TEXT,
    last_sync TIMESTAMP,
    uid_validity TEXT,
    last_uid INTEGER DEFAULT 0,
    PRIMARY KEY (account_id, folder_id),
    FOREIGN KEY (account_id) REFERENCES accounts(id),
    FOREIGN KEY (folder_id) REFERENCES folders(id)
);
`
