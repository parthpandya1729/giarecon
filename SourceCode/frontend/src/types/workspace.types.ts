import type { BaseEntity, Status } from './common.types'

export interface Workspace extends BaseEntity {
  name: string
  description: string
  status: Status
  lastRunAt?: Date
  configId?: string
  stats: WorkspaceStats
  files?: {
    file1?: FileInfo
    file2?: FileInfo
  }
}

export interface WorkspaceStats {
  totalRecords: number
  matched: number
  unmatched: number
  discrepancies: number
  matchPercentage?: number
  processingTime?: number // in milliseconds
}

export interface FileInfo {
  name: string
  size: number
  uploadedAt: Date
  rowCount?: number
}

export interface CreateWorkspaceInput {
  name: string
  description: string
  configName: string
}

export interface WorkspaceFilters {
  status?: Status[]
  searchQuery?: string
  sortBy?: 'name' | 'createdAt' | 'lastRunAt' | 'status'
  sortOrder?: 'asc' | 'desc'
}
