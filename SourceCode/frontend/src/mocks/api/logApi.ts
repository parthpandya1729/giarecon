import type { LogEntry, LogFilters, LogExportOptions, LogStats } from '@/types/log.types'
import type { ApiResponse, PaginatedResponse, PaginationParams } from '@/types/common.types'
import { mockLogs } from '../data/logs'
import { generateLogs, generateLogStats } from '../generators/logGenerator'

const delay = (ms: number = 300) => new Promise((resolve) => setTimeout(resolve, ms))

const simulateError = () => {
  if (Math.random() < 0.05) {
    throw new Error('Network error: Request failed')
  }
}

// In-memory log storage (continuously growing)
let logs = [...mockLogs]

export const logApi = {
  // Get logs with pagination and filtering
  async getLogs(
    params: PaginationParams & LogFilters
  ): Promise<ApiResponse<PaginatedResponse<LogEntry>>> {
    await delay(250)
    simulateError()

    try {
      let filtered = [...logs]

      // Apply filters
      if (params.level && params.level.length > 0) {
        filtered = filtered.filter((log) => params.level?.includes(log.level))
      }

      if (params.action && params.action.length > 0) {
        filtered = filtered.filter((log) => params.action?.includes(log.action))
      }

      if (params.severity && params.severity.length > 0) {
        filtered = filtered.filter((log) => params.severity?.includes(log.severity))
      }

      if (params.source && params.source.length > 0) {
        filtered = filtered.filter((log) => params.source?.includes(log.source))
      }

      if (params.workspaceId) {
        filtered = filtered.filter((log) => log.workspaceId === params.workspaceId)
      }

      if (params.userId) {
        filtered = filtered.filter((log) => log.userId === params.userId)
      }

      if (params.dateFrom) {
        filtered = filtered.filter((log) => log.createdAt >= params.dateFrom!)
      }

      if (params.dateTo) {
        filtered = filtered.filter((log) => log.createdAt <= params.dateTo!)
      }

      if (params.searchQuery) {
        const query = params.searchQuery.toLowerCase()
        filtered = filtered.filter(
          (log) =>
            log.message.toLowerCase().includes(query) ||
            log.action.toLowerCase().includes(query) ||
            log.source.toLowerCase().includes(query)
        )
      }

      // Apply sorting (logs are typically shown newest first)
      const sortBy = params.sortBy || 'createdAt'
      const sortOrder = params.sortOrder || 'desc'

      filtered.sort((a, b) => {
        let aValue: any
        let bValue: any

        if (sortBy === 'createdAt') {
          aValue = a.createdAt.getTime()
          bValue = b.createdAt.getTime()
        } else if (sortBy === 'level') {
          aValue = a.level
          bValue = b.level
        } else if (sortBy === 'severity') {
          aValue = a.severity
          bValue = b.severity
        } else {
          aValue = a.createdAt.getTime()
          bValue = b.createdAt.getTime()
        }

        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1
        } else {
          return aValue < bValue ? 1 : -1
        }
      })

      // Apply pagination
      const page = params.page || 1
      const limit = params.limit || 50
      const total = filtered.length
      const totalPages = Math.ceil(total / limit)
      const start = (page - 1) * limit
      const end = start + limit
      const data = filtered.slice(start, end)

      return {
        success: true,
        data: {
          data,
          total,
          page,
          limit,
          totalPages,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch logs',
      }
    }
  },

  // Get log by ID
  async getLog(id: string): Promise<ApiResponse<LogEntry>> {
    await delay(150)
    simulateError()

    const log = logs.find((l) => l.id === id)

    if (!log) {
      return {
        success: false,
        error: 'Log entry not found',
      }
    }

    return {
      success: true,
      data: log,
    }
  },

  // Get recent logs (last N logs)
  async getRecentLogs(limit: number = 50): Promise<ApiResponse<LogEntry[]>> {
    await delay(200)
    simulateError()

    // Logs are already sorted newest first
    const recentLogs = logs.slice(0, limit)

    return {
      success: true,
      data: recentLogs,
    }
  },

  // Get error logs
  async getErrorLogs(
    params: PaginationParams = { page: 1, limit: 50 }
  ): Promise<ApiResponse<PaginatedResponse<LogEntry>>> {
    return this.getLogs({
      ...params,
      severity: ['error'],
    })
  },

  // Get logs for specific workspace
  async getWorkspaceLogs(
    workspaceId: string,
    params: PaginationParams = { page: 1, limit: 50 }
  ): Promise<ApiResponse<PaginatedResponse<LogEntry>>> {
    return this.getLogs({
      ...params,
      workspaceId,
    })
  },

  // Get log statistics
  async getLogStats(filters?: LogFilters): Promise<ApiResponse<LogStats>> {
    await delay(300)
    simulateError()

    let filtered = [...logs]

    // Apply filters if provided
    if (filters) {
      if (filters.level && filters.level.length > 0) {
        filtered = filtered.filter((log) => filters.level?.includes(log.level))
      }

      if (filters.dateFrom) {
        filtered = filtered.filter((log) => log.createdAt >= filters.dateFrom!)
      }

      if (filters.dateTo) {
        filtered = filtered.filter((log) => log.createdAt <= filters.dateTo!)
      }
    }

    const stats = generateLogStats(filtered)

    return {
      success: true,
      data: stats,
    }
  },

  // Export logs
  async exportLogs(
    options: LogExportOptions
  ): Promise<ApiResponse<Blob>> {
    await delay(600)
    simulateError()

    try {
      let filtered = [...logs]

      // Apply filters
      if (options.filters) {
        const result = await this.getLogs({
          page: 1,
          limit: 999999,
          ...options.filters,
        })

        if (!result.success || !result.data) {
          return {
            success: false,
            error: 'Failed to filter logs for export',
          }
        }

        filtered = result.data.data
      }

      // In a real app, this would generate actual file
      let content = ''

      if (options.format === 'json') {
        const exportData = filtered.map((log) => ({
          id: log.id,
          timestamp: log.createdAt.toISOString(),
          level: log.level,
          action: log.action,
          message: log.message,
          severity: log.severity,
          source: log.source,
          workspaceId: log.workspaceId,
          userId: log.userId,
          duration: log.duration,
          ...(options.includeMetadata && { metadata: log.metadata }),
          ...(options.includeStackTrace && { stackTrace: log.stackTrace }),
        }))
        content = JSON.stringify(exportData, null, 2)
      } else if (options.format === 'csv') {
        const headers = [
          'ID',
          'Timestamp',
          'Level',
          'Action',
          'Message',
          'Severity',
          'Source',
        ]
        const rows = filtered.map((log) => [
          log.id,
          log.createdAt.toISOString(),
          log.level,
          log.action,
          log.message,
          log.severity,
          log.source,
        ])
        content = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')
      } else {
        // txt format
        content = filtered
          .map(
            (log) =>
              `[${log.createdAt.toISOString()}] [${log.level.toUpperCase()}] [${log.action}] ${log.message}`
          )
          .join('\n')
      }

      const blob = new Blob([content], { type: 'text/plain' })

      return {
        success: true,
        data: blob,
        message: `Exported ${filtered.length} log entries in ${options.format.toUpperCase()} format`,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to export logs',
      }
    }
  },

  // Simulate real-time log streaming
  streamLogs(
    callback: (log: LogEntry) => void,
    intervalMs: number = 3000
  ): () => void {
    const interval = setInterval(() => {
      // Generate a new log entry
      const newLogs = generateLogs({
        count: 1,
        dateRange: { from: new Date(), to: new Date() },
      })

      if (newLogs.length > 0) {
        const newLog = newLogs[0]
        logs.unshift(newLog) // Add to beginning (newest first)
        callback(newLog)
      }
    }, intervalMs)

    // Return cleanup function
    return () => clearInterval(interval)
  },

  // Clear old logs (keep only last N days)
  async clearOldLogs(daysToKeep: number = 30): Promise<ApiResponse<number>> {
    await delay(200)

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

    const initialCount = logs.length
    logs = logs.filter((log) => log.createdAt >= cutoffDate)
    const removedCount = initialCount - logs.length

    return {
      success: true,
      data: removedCount,
      message: `Removed ${removedCount} log entries older than ${daysToKeep} days`,
    }
  },
}
