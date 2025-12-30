import { faker } from '@faker-js/faker'
import { nanoid } from 'nanoid'
import type {
  ReconciliationRecord,
  ReconciliationResult,
  ReconciliationSummary,
  RecordStatus,
} from '@/types/reconciliation.types'

interface GenerateRecordsOptions {
  count: number
  workspaceId: string
  matchPercentage?: number // 0-100, default 70
  discrepancyPercentage?: number // 0-100, default 10
  dateRange?: {
    from: Date
    to: Date
  }
  amountRange?: {
    min: number
    max: number
  }
}

export function generateReconciliationRecords(
  options: GenerateRecordsOptions
): ReconciliationRecord[] {
  const {
    count,
    workspaceId,
    matchPercentage = 70,
    discrepancyPercentage = 10,
    dateRange = {
      from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      to: new Date(),
    },
    amountRange = {
      min: 10,
      max: 10000,
    },
  } = options

  const records: ReconciliationRecord[] = []
  const matchCount = Math.floor((count * matchPercentage) / 100)
  const discrepancyCount = Math.floor((count * discrepancyPercentage) / 100)
  const unmatchedCount = count - matchCount - discrepancyCount

  // Generate matched records
  for (let i = 0; i < matchCount; i++) {
    records.push(
      generateRecord({
        workspaceId,
        status: 'matched',
        dateRange,
        amountRange,
      })
    )
  }

  // Generate discrepancy records
  for (let i = 0; i < discrepancyCount; i++) {
    records.push(
      generateRecord({
        workspaceId,
        status: 'discrepancy',
        dateRange,
        amountRange,
      })
    )
  }

  // Generate unmatched records
  for (let i = 0; i < unmatchedCount; i++) {
    records.push(
      generateRecord({
        workspaceId,
        status: 'unmatched',
        dateRange,
        amountRange,
      })
    )
  }

  // Shuffle records to mix statuses
  return faker.helpers.shuffle(records)
}

interface RecordOptions {
  workspaceId: string
  status: RecordStatus
  dateRange: { from: Date; to: Date }
  amountRange: { min: number; max: number }
}

function generateRecord(options: RecordOptions): ReconciliationRecord {
  const { workspaceId, status, dateRange, amountRange } = options

  const baseAmount = faker.number.float({
    min: amountRange.min,
    max: amountRange.max,
    precision: 0.01,
  })

  const record: ReconciliationRecord = {
    id: nanoid(),
    workspaceId,
    sourceRef: generateTransactionRef(),
    amount: baseAmount,
    date: faker.date.between(dateRange),
    status,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  if (status === 'matched') {
    record.targetRef = generateTransactionRef()
    record.matchConfidence = faker.number.float({ min: 0.85, max: 1.0, precision: 0.01 })
  } else if (status === 'discrepancy') {
    record.targetRef = generateTransactionRef()
    record.matchConfidence = faker.number.float({ min: 0.5, max: 0.84, precision: 0.01 })

    // Generate discrepancy amount (1-10% of base amount)
    const discrepancyPercent = faker.number.float({ min: 0.01, max: 0.1, precision: 0.001 })
    record.discrepancyAmount = parseFloat((baseAmount * discrepancyPercent).toFixed(2))

    // Random discrepancy fields
    const possibleFields = ['amount', 'date', 'description', 'account', 'reference']
    record.discrepancyFields = faker.helpers.arrayElements(possibleFields, {
      min: 1,
      max: 3,
    })

    record.metadata = {
      discrepancyReason: faker.helpers.arrayElement([
        'Amount mismatch',
        'Date mismatch',
        'Description mismatch',
        'Multiple matches found',
        'Partial match',
      ]),
      file1Value: baseAmount,
      file2Value: baseAmount + (record.discrepancyAmount || 0),
    }
  } else {
    // Unmatched
    record.matchConfidence = faker.number.float({ min: 0, max: 0.49, precision: 0.01 })
    record.metadata = {
      reason: faker.helpers.arrayElement([
        'No matching record found',
        'Reference number not found in target',
        'Date outside matching window',
        'Amount exceeds tolerance',
      ]),
    }
  }

  return record
}

function generateTransactionRef(): string {
  const prefix = faker.helpers.arrayElement(['TXN', 'INV', 'PAY', 'REF', 'ORD'])
  const year = new Date().getFullYear().toString().slice(-2)
  const number = faker.number.int({ min: 100000, max: 999999 })
  return `${prefix}${year}${number}`
}

export function generateReconciliationResult(
  workspaceId: string,
  recordCount: number = 1000
): ReconciliationResult {
  const startTime = Date.now()

  const records = generateReconciliationRecords({
    count: recordCount,
    workspaceId,
    matchPercentage: 70,
    discrepancyPercentage: 10,
  })

  const matched = records.filter((r) => r.status === 'matched')
  const unmatched = records.filter((r) => r.status === 'unmatched')
  const discrepancies = records.filter((r) => r.status === 'discrepancy')

  const processingTime = Date.now() - startTime + faker.number.int({ min: 500, max: 3000 })

  const totalAmount = records.reduce((sum, r) => sum + r.amount, 0)
  const discrepancyAmount = discrepancies.reduce((sum, r) => sum + (r.discrepancyAmount || 0), 0)

  const summary: ReconciliationSummary = {
    matchedCount: matched.length,
    unmatchedCount: unmatched.length,
    discrepancyCount: discrepancies.length,
    matchPercentage: parseFloat(((matched.length / records.length) * 100).toFixed(2)),
    totalAmount: parseFloat(totalAmount.toFixed(2)),
    discrepancyAmount: parseFloat(discrepancyAmount.toFixed(2)),
    processingTime,
  }

  return {
    workspaceId,
    totalRecords: records.length,
    matched,
    unmatched,
    discrepancies,
    summary,
    processedAt: new Date(),
  }
}

export function generateBatchRecords(
  workspaceIds: string[],
  recordsPerWorkspace: number = 500
): Record<string, ReconciliationRecord[]> {
  const batch: Record<string, ReconciliationRecord[]> = {}

  workspaceIds.forEach((workspaceId) => {
    batch[workspaceId] = generateReconciliationRecords({
      count: recordsPerWorkspace,
      workspaceId,
    })
  })

  return batch
}
