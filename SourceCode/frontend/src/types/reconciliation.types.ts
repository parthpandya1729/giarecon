import type { BaseEntity } from './common.types'
import type { FieldMapping, ValidationRule, ReconciliationConfig } from './config.types'

export type RecordStatus = 'matched' | 'unmatched' | 'discrepancy'

export interface ReconciliationRecord extends BaseEntity {
  workspaceId: string
  sourceRef: string
  targetRef?: string
  amount: number
  date: Date
  status: RecordStatus
  matchConfidence?: number // 0-1
  discrepancyAmount?: number
  discrepancyFields?: string[]
  metadata?: Record<string, any>
}

export interface ReconciliationResult {
  workspaceId: string
  totalRecords: number
  matched: ReconciliationRecord[]
  unmatched: ReconciliationRecord[]
  discrepancies: ReconciliationRecord[]
  summary: ReconciliationSummary
  processedAt: Date
}

export interface ReconciliationSummary {
  matchedCount: number
  unmatchedCount: number
  discrepancyCount: number
  matchPercentage: number
  totalAmount: number
  discrepancyAmount: number
  processingTime: number // milliseconds
}

export interface ReconciliationFilters {
  status?: RecordStatus[]
  minAmount?: number
  maxAmount?: number
  dateFrom?: Date
  dateTo?: Date
  searchQuery?: string
}

// Note: FieldMapping, ValidationRule, and ReconciliationConfig are imported from config.types.ts
// to avoid duplication. The comprehensive versions with additional fields are maintained there.
