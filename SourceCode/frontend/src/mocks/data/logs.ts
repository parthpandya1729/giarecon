import { generateLogs } from '../generators/logGenerator'
import { mockWorkspaces } from './workspaces'

// Generate 500+ logs covering the last 7 days
export const mockLogs = generateLogs({
  count: 567,
  dateRange: {
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    to: new Date(),
  },
  workspaceIds: mockWorkspaces.map((ws) => ws.id),
  severityDistribution: {
    success: 40,
    info: 30,
    warning: 20,
    error: 10,
  },
})

export function getLogsByWorkspaceId(workspaceId: string) {
  return mockLogs.filter((log) => log.workspaceId === workspaceId)
}

export function getLogsBySeverity(severity: 'info' | 'warning' | 'error' | 'success') {
  return mockLogs.filter((log) => log.severity === severity)
}

export function getRecentLogs(limit: number = 50) {
  return mockLogs.slice(0, limit)
}

export function getErrorLogs() {
  return mockLogs.filter((log) => log.severity === 'error')
}

export function getLogsInDateRange(from: Date, to: Date) {
  return mockLogs.filter(
    (log) => log.createdAt >= from && log.createdAt <= to
  )
}
