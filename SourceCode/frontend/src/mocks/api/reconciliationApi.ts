import type {
  ReconciliationRecord,
  ReconciliationResult,
  ReconciliationFilters,
  RecordStatus,
} from '@/types/reconciliation.types'
import type { ApiResponse, PaginatedResponse, PaginationParams } from '@/types/common.types'
import {
  generateReconciliationResult,
  generateReconciliationRecords,
} from '../generators/reconciliationGenerator'

const delay = (ms: number = 300) => new Promise((resolve) => setTimeout(resolve, ms))

const simulateError = () => {
  if (Math.random() < 0.05) {
    throw new Error('Network error: Request failed')
  }
}

// In-memory storage for reconciliation results
const reconciliationResults = new Map<string, ReconciliationResult>()

export const reconciliationApi = {
  // Get reconciliation result for workspace
  async getReconciliationResult(
    workspaceId: string
  ): Promise<ApiResponse<ReconciliationResult>> {
    await delay(400)
    simulateError()

    let result = reconciliationResults.get(workspaceId)

    if (!result) {
      // Generate new result if doesn't exist
      result = generateReconciliationResult(workspaceId, 1000)
      reconciliationResults.set(workspaceId, result)
    }

    return {
      success: true,
      data: result,
    }
  },

  // Get reconciliation records with pagination and filtering
  async getReconciliationRecords(
    workspaceId: string,
    params: PaginationParams & ReconciliationFilters
  ): Promise<ApiResponse<PaginatedResponse<ReconciliationRecord>>> {
    await delay(300)
    simulateError()

    try {
      let result = reconciliationResults.get(workspaceId)

      if (!result) {
        result = generateReconciliationResult(workspaceId, 1000)
        reconciliationResults.set(workspaceId, result)
      }

      // Combine all records
      let records = [...result.matched, ...result.unmatched, ...result.discrepancies]

      // Apply filters
      if (params.status && params.status.length > 0) {
        records = records.filter((record) => params.status?.includes(record.status))
      }

      if (params.minAmount !== undefined) {
        records = records.filter((record) => record.amount >= params.minAmount!)
      }

      if (params.maxAmount !== undefined) {
        records = records.filter((record) => record.amount <= params.maxAmount!)
      }

      if (params.dateFrom) {
        records = records.filter((record) => record.date >= params.dateFrom!)
      }

      if (params.dateTo) {
        records = records.filter((record) => record.date <= params.dateTo!)
      }

      if (params.searchQuery) {
        const query = params.searchQuery.toLowerCase()
        records = records.filter(
          (record) =>
            record.sourceRef.toLowerCase().includes(query) ||
            record.targetRef?.toLowerCase().includes(query)
        )
      }

      // Apply sorting
      const sortBy = params.sortBy || 'createdAt'
      const sortOrder = params.sortOrder || 'desc'

      records.sort((a, b) => {
        let aValue: any
        let bValue: any

        if (sortBy === 'amount') {
          aValue = a.amount
          bValue = b.amount
        } else if (sortBy === 'date') {
          aValue = a.date.getTime()
          bValue = b.date.getTime()
        } else if (sortBy === 'status') {
          aValue = a.status
          bValue = b.status
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
      const total = records.length
      const totalPages = Math.ceil(total / limit)
      const start = (page - 1) * limit
      const end = start + limit
      const data = records.slice(start, end)

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
        error:
          error instanceof Error ? error.message : 'Failed to fetch reconciliation records',
      }
    }
  },

  // Get matched records
  async getMatchedRecords(
    workspaceId: string,
    params: PaginationParams
  ): Promise<ApiResponse<PaginatedResponse<ReconciliationRecord>>> {
    return this.getReconciliationRecords(workspaceId, {
      ...params,
      status: ['matched'],
    })
  },

  // Get unmatched records
  async getUnmatchedRecords(
    workspaceId: string,
    params: PaginationParams
  ): Promise<ApiResponse<PaginatedResponse<ReconciliationRecord>>> {
    return this.getReconciliationRecords(workspaceId, {
      ...params,
      status: ['unmatched'],
    })
  },

  // Get discrepancy records
  async getDiscrepancyRecords(
    workspaceId: string,
    params: PaginationParams
  ): Promise<ApiResponse<PaginatedResponse<ReconciliationRecord>>> {
    return this.getReconciliationRecords(workspaceId, {
      ...params,
      status: ['discrepancy'],
    })
  },

  // Export reconciliation results
  async exportResults(
    workspaceId: string,
    format: 'xlsx' | 'csv' | 'json' = 'xlsx'
  ): Promise<ApiResponse<Blob>> {
    await delay(800) // Longer delay for export
    simulateError()

    try {
      const result = reconciliationResults.get(workspaceId)

      if (!result) {
        return {
          success: false,
          error: 'Reconciliation result not found',
        }
      }

      // In a real app, this would generate actual file
      // For now, simulate with a blob
      const blob = new Blob(['Mock export data'], { type: 'application/octet-stream' })

      return {
        success: true,
        data: blob,
        message: `Export generated successfully in ${format.toUpperCase()} format`,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to export results',
      }
    }
  },

  // Update record status (for manual corrections)
  async updateRecordStatus(
    workspaceId: string,
    recordId: string,
    newStatus: RecordStatus
  ): Promise<ApiResponse<ReconciliationRecord>> {
    await delay(250)
    simulateError()

    const result = reconciliationResults.get(workspaceId)

    if (!result) {
      return {
        success: false,
        error: 'Reconciliation result not found',
      }
    }

    // Find record across all status arrays
    const allRecords = [...result.matched, ...result.unmatched, ...result.discrepancies]
    const record = allRecords.find((r) => r.id === recordId)

    if (!record) {
      return {
        success: false,
        error: 'Record not found',
      }
    }

    // Update record status
    const oldStatus = record.status
    record.status = newStatus
    record.updatedAt = new Date()

    // Move record to appropriate array
    if (oldStatus === 'matched') {
      result.matched = result.matched.filter((r) => r.id !== recordId)
    } else if (oldStatus === 'unmatched') {
      result.unmatched = result.unmatched.filter((r) => r.id !== recordId)
    } else {
      result.discrepancies = result.discrepancies.filter((r) => r.id !== recordId)
    }

    if (newStatus === 'matched') {
      result.matched.push(record)
    } else if (newStatus === 'unmatched') {
      result.unmatched.push(record)
    } else {
      result.discrepancies.push(record)
    }

    // Recalculate summary
    result.summary.matchedCount = result.matched.length
    result.summary.unmatchedCount = result.unmatched.length
    result.summary.discrepancyCount = result.discrepancies.length
    result.summary.matchPercentage = parseFloat(
      ((result.matched.length / result.totalRecords) * 100).toFixed(2)
    )

    return {
      success: true,
      data: record,
      message: 'Record status updated successfully',
    }
  },

  // Get field-level discrepancy analysis
  async getDiscrepancyAnalysis(
    workspaceId: string
  ): Promise<ApiResponse<Record<string, number>>> {
    await delay(350)
    simulateError()

    const result = reconciliationResults.get(workspaceId)

    if (!result) {
      return {
        success: false,
        error: 'Reconciliation result not found',
      }
    }

    // Count discrepancies by field
    const analysis: Record<string, number> = {}

    result.discrepancies.forEach((record) => {
      if (record.discrepancyFields) {
        record.discrepancyFields.forEach((field) => {
          analysis[field] = (analysis[field] || 0) + 1
        })
      }
    })

    return {
      success: true,
      data: analysis,
    }
  },
}
