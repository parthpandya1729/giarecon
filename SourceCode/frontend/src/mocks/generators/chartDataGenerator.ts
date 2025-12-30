import { faker } from '@faker-js/faker'
import { format, subDays, subMonths, subWeeks, startOfDay } from 'date-fns'

export interface TimeSeriesDataPoint {
  date: string
  value: number
  label?: string
}

export interface CategoryDataPoint {
  name: string
  value: number
  color?: string
  percentage?: number
}

export interface SankeyNode {
  name: string
  color?: string
}

export interface SankeyLink {
  source: number
  target: number
  value: number
  color?: string
}

export interface SankeyData {
  nodes: SankeyNode[]
  links: SankeyLink[]
}

export interface TrendData {
  period: string
  matched: number
  unmatched: number
  discrepancies: number
  total: number
}

// Generate time series data for line/area charts
export function generateTimeSeriesData(
  days: number = 30,
  valueRange: { min: number; max: number } = { min: 50, max: 500 }
): TimeSeriesDataPoint[] {
  const data: TimeSeriesDataPoint[] = []
  const today = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(today, i)
    data.push({
      date: format(startOfDay(date), 'yyyy-MM-dd'),
      value: faker.number.int({ min: valueRange.min, max: valueRange.max }),
    })
  }

  return data
}

// Generate multi-series time data for reconciliation trends
export function generateReconciliationTrend(
  period: 'daily' | 'weekly' | 'monthly' = 'daily',
  count: number = 30
): TrendData[] {
  const data: TrendData[] = []
  const today = new Date()

  for (let i = count - 1; i >= 0; i--) {
    let date: Date
    let periodLabel: string

    switch (period) {
      case 'weekly':
        date = subWeeks(today, i)
        periodLabel = `Week ${format(date, 'w, yyyy')}`
        break
      case 'monthly':
        date = subMonths(today, i)
        periodLabel = format(date, 'MMM yyyy')
        break
      default:
        date = subDays(today, i)
        periodLabel = format(date, 'MMM dd')
    }

    const total = faker.number.int({ min: 500, max: 2000 })
    const matchedPercent = faker.number.float({ min: 0.6, max: 0.8, precision: 0.01 })
    const discrepancyPercent = faker.number.float({ min: 0.05, max: 0.15, precision: 0.01 })

    const matched = Math.floor(total * matchedPercent)
    const discrepancies = Math.floor(total * discrepancyPercent)
    const unmatched = total - matched - discrepancies

    data.push({
      period: periodLabel,
      matched,
      unmatched,
      discrepancies,
      total,
    })
  }

  return data
}

// Generate pie chart data for match distribution
export function generateMatchDistribution(): CategoryDataPoint[] {
  const total = 1000
  const matched = faker.number.int({ min: 600, max: 800 })
  const discrepancies = faker.number.int({ min: 50, max: 150 })
  const unmatched = total - matched - discrepancies

  return [
    {
      name: 'Matched',
      value: matched,
      percentage: (matched / total) * 100,
      color: '#00ff88',
    },
    {
      name: 'Unmatched',
      value: unmatched,
      percentage: (unmatched / total) * 100,
      color: '#ff2d95',
    },
    {
      name: 'Discrepancies',
      value: discrepancies,
      percentage: (discrepancies / total) * 100,
      color: '#ff9d00',
    },
  ]
}

// Generate Sankey diagram data for reconciliation flow
export function generateSankeyFlowData(recordCount: number = 1000): SankeyData {
  // Calculate distributions
  const matchedCount = Math.floor(recordCount * 0.7)
  const discrepancyCount = Math.floor(recordCount * 0.1)
  const unmatchedCount = recordCount - matchedCount - discrepancyCount

  // Define nodes
  const nodes: SankeyNode[] = [
    { name: 'Source File', color: '#00f0ff' },
    { name: 'Matched Records', color: '#00ff88' },
    { name: 'Unmatched Records', color: '#ff2d95' },
    { name: 'Discrepancies', color: '#ff9d00' },
    { name: 'Target File', color: '#b026ff' },
  ]

  // Define links (flows)
  const links: SankeyLink[] = [
    {
      source: 0, // Source File
      target: 1, // Matched Records
      value: matchedCount,
      color: 'rgba(0, 255, 136, 0.3)',
    },
    {
      source: 0, // Source File
      target: 2, // Unmatched Records
      value: unmatchedCount,
      color: 'rgba(255, 45, 149, 0.3)',
    },
    {
      source: 0, // Source File
      target: 3, // Discrepancies
      value: discrepancyCount,
      color: 'rgba(255, 157, 0, 0.3)',
    },
    {
      source: 1, // Matched Records
      target: 4, // Target File
      value: matchedCount,
      color: 'rgba(0, 255, 136, 0.3)',
    },
    {
      source: 3, // Discrepancies
      target: 4, // Target File (partial matches)
      value: Math.floor(discrepancyCount * 0.6),
      color: 'rgba(255, 157, 0, 0.3)',
    },
  ]

  return { nodes, links }
}

// Generate bar chart data for field-level discrepancies
export function generateFieldDiscrepancies(): CategoryDataPoint[] {
  const fields = ['Amount', 'Date', 'Reference', 'Description', 'Account']

  return fields.map((field) => ({
    name: field,
    value: faker.number.int({ min: 5, max: 150 }),
  }))
}

// Generate processing time data
export function generateProcessingTimeData(days: number = 30): TimeSeriesDataPoint[] {
  const data: TimeSeriesDataPoint[] = []
  const today = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(today, i)
    // Processing time in seconds, with realistic variance
    const baseTime = 15
    const variance = faker.number.float({ min: -5, max: 10, precision: 0.1 })

    data.push({
      date: format(startOfDay(date), 'yyyy-MM-dd'),
      value: Math.max(1, baseTime + variance),
      label: `${(baseTime + variance).toFixed(1)}s`,
    })
  }

  return data
}

// Generate match confidence distribution (histogram data)
export function generateConfidenceDistribution(): CategoryDataPoint[] {
  const ranges = [
    '0-20%',
    '20-40%',
    '40-60%',
    '60-80%',
    '80-90%',
    '90-95%',
    '95-99%',
    '99-100%',
  ]

  return ranges.map((range, index) => {
    // Higher confidence ranges should have more records
    const multiplier = index < 3 ? 0.5 : index < 6 ? 1 : 3
    return {
      name: range,
      value: faker.number.int({ min: 10, max: 100 }) * multiplier,
    }
  })
}

// Generate workspace activity heatmap data
export function generateActivityHeatmap(
  weeks: number = 12
): { day: string; week: number; value: number }[] {
  const data: { day: string; week: number; value: number }[] = []
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  for (let week = 0; week < weeks; week++) {
    days.forEach((day) => {
      // Less activity on weekends
      const isWeekend = day === 'Sat' || day === 'Sun'
      const maxActivity = isWeekend ? 50 : 200

      data.push({
        day,
        week,
        value: faker.number.int({ min: 0, max: maxActivity }),
      })
    })
  }

  return data
}

// Generate performance metrics over time
export function generatePerformanceMetrics(days: number = 30) {
  const data = []
  const today = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(today, i)

    data.push({
      date: format(startOfDay(date), 'yyyy-MM-dd'),
      matchRate: faker.number.float({ min: 65, max: 85, precision: 0.1 }),
      processingSpeed: faker.number.int({ min: 800, max: 1500 }), // records per second
      accuracy: faker.number.float({ min: 92, max: 99.5, precision: 0.1 }),
      errorRate: faker.number.float({ min: 0.1, max: 2.5, precision: 0.1 }),
    })
  }

  return data
}

// Generate cumulative reconciliation progress
export function generateCumulativeProgress(hours: number = 24): TimeSeriesDataPoint[] {
  const data: TimeSeriesDataPoint[] = []
  const totalRecords = 10000
  let processed = 0

  for (let i = 0; i < hours; i++) {
    // Process more records in early hours, slow down towards end
    const rate = Math.max(100, 1000 - i * 30)
    processed = Math.min(totalRecords, processed + faker.number.int({ min: rate - 50, max: rate + 50 }))

    data.push({
      date: `${i}:00`,
      value: processed,
      label: `${((processed / totalRecords) * 100).toFixed(1)}%`,
    })
  }

  return data
}

// Generate status breakdown for multiple workspaces
export function generateWorkspaceStatusBreakdown(workspaceCount: number = 10) {
  const statuses = ['active', 'completed', 'failed', 'running', 'pending']

  return Array.from({ length: workspaceCount }, (_, i) => {
    const status = faker.helpers.arrayElement(statuses)
    return {
      workspaceId: `ws_${i + 1}`,
      workspaceName: `${faker.company.name()} Reconciliation`,
      status,
      totalRecords: faker.number.int({ min: 100, max: 5000 }),
      matchedRecords: faker.number.int({ min: 50, max: 4000 }),
      processingTime: faker.number.int({ min: 5000, max: 60000 }),
      lastRun: subDays(new Date(), faker.number.int({ min: 0, max: 30 })),
    }
  })
}

// Generate real-time metrics simulation
export function generateRealtimeMetrics() {
  return {
    currentRecordsProcessed: faker.number.int({ min: 0, max: 10000 }),
    processingRate: faker.number.int({ min: 50, max: 200 }), // records/second
    estimatedTimeRemaining: faker.number.int({ min: 10, max: 300 }), // seconds
    memoryUsage: faker.number.float({ min: 45, max: 85, precision: 0.1 }), // percentage
    cpuUsage: faker.number.float({ min: 30, max: 90, precision: 0.1 }), // percentage
    queueLength: faker.number.int({ min: 0, max: 1000 }),
  }
}
