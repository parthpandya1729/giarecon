import type { BaseEntity, Severity } from './common.types'

export type LogLevel = 'debug' | 'info' | 'warning' | 'error' | 'critical'

export type LogAction =
  | 'workspace_created'
  | 'workspace_updated'
  | 'workspace_deleted'
  | 'reconciliation_started'
  | 'reconciliation_completed'
  | 'reconciliation_failed'
  | 'file_uploaded'
  | 'file_processed'
  | 'config_created'
  | 'config_updated'
  | 'email_sent'
  | 'email_received'
  | 'validation_error'
  | 'system_error'
  | 'user_action'

export interface LogEntry extends BaseEntity {
  level: LogLevel
  action: LogAction
  message: string
  workspaceId?: string
  userId?: string
  metadata?: Record<string, any>
  severity: Severity
  source: 'system' | 'user' | 'email' | 'reconciliation'
  stackTrace?: string
  duration?: number // milliseconds
}

export interface LogFilters {
  level?: LogLevel[]
  action?: LogAction[]
  severity?: Severity[]
  source?: ('system' | 'user' | 'email' | 'reconciliation')[]
  workspaceId?: string
  userId?: string
  dateFrom?: Date
  dateTo?: Date
  searchQuery?: string
}

export interface LogExportOptions {
  format: 'csv' | 'json' | 'txt'
  filters?: LogFilters
  includeMetadata?: boolean
  includeStackTrace?: boolean
}

export interface LogStats {
  totalLogs: number
  byLevel: Record<LogLevel, number>
  bySeverity: Record<Severity, number>
  byAction: Record<LogAction, number>
  errorRate: number
  avgDuration?: number
}

export interface LogStreamEvent {
  type: 'new_log' | 'log_updated' | 'connection_status'
  data: LogEntry | { connected: boolean }
  timestamp: Date
}
