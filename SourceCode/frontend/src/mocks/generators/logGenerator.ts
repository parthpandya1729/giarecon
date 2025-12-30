import { faker } from '@faker-js/faker'
import { nanoid } from 'nanoid'
import type { LogEntry, LogLevel, LogAction, LogStats } from '@/types/log.types'
import type { Severity } from '@/types/common.types'

interface GenerateLogsOptions {
  count: number
  dateRange?: {
    from: Date
    to: Date
  }
  workspaceIds?: string[]
  severityDistribution?: {
    info: number // percentage
    warning: number
    error: number
    success: number
  }
}

export function generateLogs(options: GenerateLogsOptions): LogEntry[] {
  const {
    count,
    dateRange = {
      from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      to: new Date(),
    },
    workspaceIds = [],
    severityDistribution = {
      success: 40,
      info: 30,
      warning: 20,
      error: 10,
    },
  } = options

  const logs: LogEntry[] = []

  // Calculate counts for each severity
  const successCount = Math.floor((count * severityDistribution.success) / 100)
  const infoCount = Math.floor((count * severityDistribution.info) / 100)
  const warningCount = Math.floor((count * severityDistribution.warning) / 100)
  const errorCount = count - successCount - infoCount - warningCount

  // Generate success logs
  for (let i = 0; i < successCount; i++) {
    logs.push(generateLog({ severity: 'success', dateRange, workspaceIds }))
  }

  // Generate info logs
  for (let i = 0; i < infoCount; i++) {
    logs.push(generateLog({ severity: 'info', dateRange, workspaceIds }))
  }

  // Generate warning logs
  for (let i = 0; i < warningCount; i++) {
    logs.push(generateLog({ severity: 'warning', dateRange, workspaceIds }))
  }

  // Generate error logs
  for (let i = 0; i < errorCount; i++) {
    logs.push(generateLog({ severity: 'error', dateRange, workspaceIds }))
  }

  // Sort by date descending (newest first)
  return logs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

interface LogOptions {
  severity: Severity
  dateRange: { from: Date; to: Date }
  workspaceIds: string[]
}

function generateLog(options: LogOptions): LogEntry {
  const { severity, dateRange, workspaceIds } = options

  const createdAt = faker.date.between(dateRange)
  const action = getActionBySeverity(severity)
  const source = getSourceByAction(action)
  const level = getLevelBySeverity(severity)

  const log: LogEntry = {
    id: nanoid(),
    level,
    action,
    message: generateMessage(action, severity),
    severity,
    source,
    createdAt,
    updatedAt: createdAt,
  }

  // Add workspace ID for certain actions
  if (
    workspaceIds.length > 0 &&
    [
      'workspace_created',
      'workspace_updated',
      'reconciliation_started',
      'reconciliation_completed',
      'reconciliation_failed',
      'file_uploaded',
    ].includes(action)
  ) {
    log.workspaceId = faker.helpers.arrayElement(workspaceIds)
  }

  // Add user ID for user actions
  if (action === 'user_action' || action.includes('created') || action.includes('updated')) {
    log.userId = `user_${faker.number.int({ min: 1, max: 10 })}`
  }

  // Add duration for certain actions
  if (
    ['reconciliation_completed', 'file_processed', 'reconciliation_failed'].includes(action)
  ) {
    log.duration = faker.number.int({ min: 500, max: 30000 })
  }

  // Add metadata based on action
  log.metadata = generateMetadata(action, severity)

  // Add stack trace for errors
  if (severity === 'error') {
    log.stackTrace = generateStackTrace()
  }

  return log
}

function getActionBySeverity(severity: Severity): LogAction {
  const actionsBySeverity: Record<Severity, LogAction[]> = {
    success: [
      'workspace_created',
      'reconciliation_completed',
      'file_uploaded',
      'file_processed',
      'config_created',
      'config_updated',
      'email_sent',
    ],
    info: [
      'workspace_updated',
      'reconciliation_started',
      'email_received',
      'user_action',
    ],
    warning: ['validation_error', 'reconciliation_started', 'workspace_updated'],
    error: ['reconciliation_failed', 'system_error', 'validation_error'],
  }

  return faker.helpers.arrayElement(actionsBySeverity[severity])
}

function getSourceByAction(action: LogAction): LogEntry['source'] {
  if (action.includes('email')) return 'email'
  if (action.includes('reconciliation')) return 'reconciliation'
  if (action === 'user_action') return 'user'
  return 'system'
}

function getLevelBySeverity(severity: Severity): LogLevel {
  const levelMap: Record<Severity, LogLevel> = {
    success: 'info',
    info: 'info',
    warning: 'warning',
    error: 'error',
  }
  return levelMap[severity]
}

function generateMessage(action: LogAction, severity: Severity): string {
  const messages: Record<LogAction, string[]> = {
    workspace_created: ['Created new workspace successfully', 'Workspace initialized'],
    workspace_updated: ['Workspace settings updated', 'Workspace configuration changed'],
    workspace_deleted: ['Workspace deleted', 'Workspace removed from system'],
    reconciliation_started: [
      'Reconciliation process initiated',
      'Started processing reconciliation',
    ],
    reconciliation_completed: [
      'Reconciliation completed successfully',
      'All records reconciled',
      'Processing finished with 0 errors',
    ],
    reconciliation_failed: [
      'Reconciliation process failed',
      'Error during reconciliation',
      'Processing terminated with errors',
    ],
    file_uploaded: ['File uploaded successfully', 'New file received'],
    file_processed: [
      'File parsed and validated',
      'File processing completed',
      'Data extracted from file',
    ],
    config_created: ['Configuration created', 'New config template saved'],
    config_updated: ['Configuration updated', 'Config settings modified'],
    email_sent: [
      'Email notification sent successfully',
      'Reconciliation report emailed',
      'Alert email delivered',
    ],
    email_received: ['Email received from Samsung', 'Incoming email processed'],
    validation_error: [
      'Validation failed for field',
      'Data validation error detected',
      'Invalid data format',
    ],
    system_error: [
      'System encountered an error',
      'Unexpected error occurred',
      'Service temporarily unavailable',
    ],
    user_action: ['User performed action', 'User interaction logged'],
  }

  return faker.helpers.arrayElement(messages[action])
}

function generateMetadata(action: LogAction, severity: Severity): Record<string, any> {
  const metadata: Record<string, any> = {
    timestamp: new Date().toISOString(),
    environment: 'development',
  }

  switch (action) {
    case 'reconciliation_completed':
      metadata.totalRecords = faker.number.int({ min: 100, max: 10000 })
      metadata.matchedRecords = faker.number.int({ min: 50, max: metadata.totalRecords })
      metadata.processingTime = `${faker.number.float({ min: 1, max: 60, precision: 0.1 })}s`
      break

    case 'file_uploaded':
    case 'file_processed':
      metadata.fileName = faker.system.fileName()
      metadata.fileSize = `${faker.number.float({ min: 0.5, max: 50, precision: 0.1 })} MB`
      metadata.rowCount = faker.number.int({ min: 100, max: 50000 })
      break

    case 'email_sent':
    case 'email_received':
      metadata.emailSubject = faker.lorem.sentence()
      metadata.recipient = faker.internet.email()
      break

    case 'validation_error':
      metadata.field = faker.helpers.arrayElement(['amount', 'date', 'reference', 'account'])
      metadata.expectedType = faker.helpers.arrayElement(['number', 'date', 'string'])
      metadata.actualValue = faker.lorem.word()
      break

    case 'system_error':
      metadata.errorCode = `ERR_${faker.number.int({ min: 1000, max: 9999 })}`
      metadata.component = faker.helpers.arrayElement([
        'EmailService',
        'ReconciliationEngine',
        'DatabaseConnection',
        'FileParser',
      ])
      break
  }

  return metadata
}

function generateStackTrace(): string {
  const lines = faker.number.int({ min: 5, max: 15 })
  const stackLines: string[] = []

  for (let i = 0; i < lines; i++) {
    const file = faker.system.fileName({ extensionCount: 0 })
    const lineNum = faker.number.int({ min: 1, max: 500 })
    const colNum = faker.number.int({ min: 1, max: 80 })
    const func = faker.hacker.verb() + faker.hacker.noun()

    stackLines.push(`    at ${func} (${file}.ts:${lineNum}:${colNum})`)
  }

  return stackLines.join('\n')
}

export function generateLogStats(logs: LogEntry[]): LogStats {
  const stats: LogStats = {
    totalLogs: logs.length,
    byLevel: {
      debug: 0,
      info: 0,
      warning: 0,
      error: 0,
      critical: 0,
    },
    bySeverity: {
      info: 0,
      warning: 0,
      error: 0,
      success: 0,
    },
    byAction: {} as Record<LogAction, number>,
    errorRate: 0,
  }

  logs.forEach((log) => {
    stats.byLevel[log.level]++
    stats.bySeverity[log.severity]++
    stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1
  })

  stats.errorRate = parseFloat(
    ((stats.bySeverity.error / logs.length) * 100).toFixed(2)
  )

  // Calculate average duration
  const logsWithDuration = logs.filter((log) => log.duration !== undefined)
  if (logsWithDuration.length > 0) {
    const totalDuration = logsWithDuration.reduce((sum, log) => sum + (log.duration || 0), 0)
    stats.avgDuration = Math.round(totalDuration / logsWithDuration.length)
  }

  return stats
}

export function generateRealtimeLogs(intervalMs: number = 3000): NodeJS.Timeout {
  return setInterval(() => {
    const log = generateLog({
      severity: faker.helpers.arrayElement(['success', 'info', 'warning', 'error']),
      dateRange: { from: new Date(), to: new Date() },
      workspaceIds: [],
    })
    console.log('[Real-time Log]', log)
    return log
  }, intervalMs)
}
