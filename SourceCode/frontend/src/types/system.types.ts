export interface EmailConfig {
  enabled: boolean;
  imapServer: string;
  imapPort: number;
  imapUsername: string;
  imapPassword: string; // Will be encrypted in real system
  smtpServer: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword: string;
  useTLS: boolean;
  checkIntervalMinutes: number;
}

export interface AgentConfig {
  enabled: boolean;
  model: 'gpt-4' | 'gpt-3.5-turbo' | 'claude-3';
  temperature: number; // 0-1
  maxTokens: number;
  autoReconcile: boolean;
  autoNotify: boolean;
  requireApproval: boolean;
}

export interface NotificationConfig {
  emailNotifications: boolean;
  notifyOnSuccess: boolean;
  notifyOnWarning: boolean;
  notifyOnError: boolean;
  recipients: string[];
}

export interface SystemPreferences {
  timezone: string;
  dateFormat: string;
  currencyFormat: string;
  language: string;
  theme: 'light' | 'dark' | 'auto';
}

export interface SystemConfig {
  email: EmailConfig;
  agent: AgentConfig;
  notifications: NotificationConfig;
  preferences: SystemPreferences;
}
