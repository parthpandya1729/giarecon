import type { SystemConfig } from '@/types/system.types'

export const defaultSystemConfig: SystemConfig = {
  email: {
    enabled: true,
    imapServer: 'imap.gmail.com',
    imapPort: 993,
    imapUsername: 'gia@benow.in',
    imapPassword: '', // Empty by default for security
    smtpServer: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUsername: 'gia@benow.in',
    smtpPassword: '',
    useTLS: true,
    checkIntervalMinutes: 5,
  },
  agent: {
    enabled: true,
    model: 'gpt-4',
    temperature: 0.3,
    maxTokens: 4096,
    autoReconcile: false,
    autoNotify: true,
    requireApproval: true,
  },
  notifications: {
    emailNotifications: true,
    notifyOnSuccess: true,
    notifyOnWarning: true,
    notifyOnError: true,
    recipients: ['parth@varahitechnologies.com', 'valter@varahitechnologies.com'],
  },
  preferences: {
    timezone: 'Asia/Kolkata',
    dateFormat: 'YYYY-MM-DD',
    currencyFormat: 'INR',
    language: 'en',
    theme: 'light',
  },
};
