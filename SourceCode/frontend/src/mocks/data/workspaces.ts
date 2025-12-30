import { nanoid } from 'nanoid'
import type { Workspace, WorkspaceStats, FileInfo } from '@/types/workspace.types'
import type { Status } from '@/types/common.types'

function createWorkspace(
  name: string,
  description: string,
  status: Status,
  stats: WorkspaceStats,
  files?: { file1?: FileInfo; file2?: FileInfo },
  daysAgo: number = 0
): Workspace {
  const createdAt = new Date()
  createdAt.setDate(createdAt.getDate() - daysAgo)

  const lastRunAt = status === 'pending' ? undefined : new Date(createdAt.getTime() + 60000)

  return {
    id: nanoid(),
    name,
    description,
    status,
    stats,
    files,
    createdAt,
    updatedAt: createdAt,
    lastRunAt,
    configId: nanoid(),
  }
}

export const mockWorkspaces: Workspace[] = [
  createWorkspace(
    'Samsung Q4 2024 Reconciliation',
    'Quarterly reconciliation for Samsung Electronics transactions',
    'completed',
    {
      totalRecords: 15847,
      matched: 13456,
      unmatched: 1893,
      discrepancies: 498,
      matchPercentage: 84.9,
      processingTime: 12500,
    },
    {
      file1: {
        name: 'samsung_q4_source.xlsx',
        size: 2457600,
        uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        rowCount: 15847,
      },
      file2: {
        name: 'samsung_q4_target.xlsx',
        size: 2398720,
        uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        rowCount: 15349,
      },
    },
    2
  ),

  createWorkspace(
    'December 2024 Monthly Recon',
    'Monthly reconciliation for December transactions across all vendors',
    'running',
    {
      totalRecords: 8432,
      matched: 6245,
      unmatched: 1987,
      discrepancies: 200,
      matchPercentage: 74.1,
      processingTime: 8200,
    },
    {
      file1: {
        name: 'dec_2024_transactions.csv',
        size: 1245600,
        uploadedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
        rowCount: 8432,
      },
      file2: {
        name: 'dec_2024_ledger.csv',
        size: 1198400,
        uploadedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
        rowCount: 8045,
      },
    },
    0
  ),

  createWorkspace(
    'Weekly Vendor Payments - Week 52',
    'Weekly reconciliation of vendor payment batches',
    'completed',
    {
      totalRecords: 3241,
      matched: 2987,
      unmatched: 189,
      discrepancies: 65,
      matchPercentage: 92.2,
      processingTime: 4100,
    },
    {
      file1: {
        name: 'week52_payments.xlsx',
        size: 456789,
        uploadedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        rowCount: 3241,
      },
      file2: {
        name: 'week52_receipts.xlsx',
        size: 445123,
        uploadedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        rowCount: 3176,
      },
    },
    5
  ),

  createWorkspace(
    'Apple Inc. Annual Reconciliation 2024',
    'Full year 2024 reconciliation for Apple transactions',
    'failed',
    {
      totalRecords: 45623,
      matched: 0,
      unmatched: 0,
      discrepancies: 0,
      matchPercentage: 0,
      processingTime: 2300,
    },
    {
      file1: {
        name: 'apple_2024_full.xlsx',
        size: 8945600,
        uploadedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        rowCount: 45623,
      },
    },
    1
  ),

  createWorkspace(
    'LG Electronics Q3 2024',
    'Third quarter reconciliation for LG Electronics',
    'completed',
    {
      totalRecords: 9876,
      matched: 8456,
      unmatched: 987,
      discrepancies: 433,
      matchPercentage: 85.6,
      processingTime: 9800,
    },
    {
      file1: {
        name: 'lg_q3_source.csv',
        size: 1567800,
        uploadedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        rowCount: 9876,
      },
      file2: {
        name: 'lg_q3_target.csv',
        size: 1534200,
        uploadedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        rowCount: 9443,
      },
    },
    30
  ),

  createWorkspace(
    'Daily Reconciliation - 2024-12-28',
    'Daily transaction reconciliation for December 28',
    'completed',
    {
      totalRecords: 1243,
      matched: 1156,
      unmatched: 67,
      discrepancies: 20,
      matchPercentage: 93.0,
      processingTime: 1200,
    },
    {
      file1: {
        name: 'daily_2024_12_28_source.xlsx',
        size: 234500,
        uploadedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        rowCount: 1243,
      },
      file2: {
        name: 'daily_2024_12_28_target.xlsx',
        size: 229800,
        uploadedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        rowCount: 1223,
      },
    },
    1
  ),

  createWorkspace(
    'New Workspace - Pending Setup',
    'Newly created workspace awaiting file upload and configuration',
    'pending',
    {
      totalRecords: 0,
      matched: 0,
      unmatched: 0,
      discrepancies: 0,
      matchPercentage: 0,
    },
    undefined,
    0
  ),

  createWorkspace(
    'Sony Corporation November 2024',
    'November monthly reconciliation for Sony transactions',
    'completed',
    {
      totalRecords: 6789,
      matched: 5432,
      unmatched: 1123,
      discrepancies: 234,
      matchPercentage: 80.0,
      processingTime: 6500,
    },
    {
      file1: {
        name: 'sony_nov_2024.xlsx',
        size: 987600,
        uploadedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        rowCount: 6789,
      },
      file2: {
        name: 'sony_nov_2024_ledger.xlsx',
        size: 956400,
        uploadedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        rowCount: 6666,
      },
    },
    45
  ),

  createWorkspace(
    'Microsoft Licensing Q4 2024',
    'Q4 2024 software licensing reconciliation for Microsoft products',
    'active',
    {
      totalRecords: 12456,
      matched: 10234,
      unmatched: 1876,
      discrepancies: 346,
      matchPercentage: 82.2,
      processingTime: 11200,
    },
    {
      file1: {
        name: 'msft_q4_licensing.csv',
        size: 1876500,
        uploadedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        rowCount: 12456,
      },
      file2: {
        name: 'msft_q4_payments.csv',
        size: 1834200,
        uploadedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        rowCount: 12110,
      },
    },
    7
  ),

  createWorkspace(
    'HP Inc. Hardware Purchases 2024',
    'Full year hardware purchase reconciliation for HP products',
    'completed',
    {
      totalRecords: 23456,
      matched: 19876,
      unmatched: 2987,
      discrepancies: 593,
      matchPercentage: 84.7,
      processingTime: 18900,
    },
    {
      file1: {
        name: 'hp_2024_purchases.xlsx',
        size: 3456700,
        uploadedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        rowCount: 23456,
      },
      file2: {
        name: 'hp_2024_invoices.xlsx',
        size: 3398400,
        uploadedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        rowCount: 22863,
      },
    },
    15
  ),

  createWorkspace(
    'Lenovo Enterprise Sales Q3 2024',
    'Q3 enterprise sales reconciliation for Lenovo',
    'completed',
    {
      totalRecords: 7654,
      matched: 6543,
      unmatched: 876,
      discrepancies: 235,
      matchPercentage: 85.5,
      processingTime: 7400,
    },
    {
      file1: {
        name: 'lenovo_q3_sales.csv',
        size: 1123400,
        uploadedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        rowCount: 7654,
      },
      file2: {
        name: 'lenovo_q3_receipts.csv',
        size: 1098700,
        uploadedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        rowCount: 7419,
      },
    },
    60
  ),

  createWorkspace(
    'Dell Technologies Monthly - October',
    'October 2024 monthly reconciliation for Dell Technologies',
    'completed',
    {
      totalRecords: 5432,
      matched: 4876,
      unmatched: 432,
      discrepancies: 124,
      matchPercentage: 89.8,
      processingTime: 5100,
    },
    {
      file1: {
        name: 'dell_oct_2024.xlsx',
        size: 876500,
        uploadedAt: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000),
        rowCount: 5432,
      },
      file2: {
        name: 'dell_oct_2024_ledger.xlsx',
        size: 854300,
        uploadedAt: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000),
        rowCount: 5308,
      },
    },
    75
  ),

  createWorkspace(
    'Test Workspace - Small Dataset',
    'Testing workspace with small sample dataset for validation',
    'completed',
    {
      totalRecords: 250,
      matched: 230,
      unmatched: 15,
      discrepancies: 5,
      matchPercentage: 92.0,
      processingTime: 450,
    },
    {
      file1: {
        name: 'test_sample_file1.csv',
        size: 45600,
        uploadedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        rowCount: 250,
      },
      file2: {
        name: 'test_sample_file2.csv',
        size: 44800,
        uploadedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        rowCount: 245,
      },
    },
    3
  ),
]

export function getWorkspaceById(id: string): Workspace | undefined {
  return mockWorkspaces.find((ws) => ws.id === id)
}

export function getWorkspacesByStatus(status: Status): Workspace[] {
  return mockWorkspaces.filter((ws) => ws.status === status)
}

export function getActiveWorkspaces(): Workspace[] {
  return mockWorkspaces.filter((ws) => ws.status === 'active' || ws.status === 'running')
}

export function getCompletedWorkspaces(): Workspace[] {
  return mockWorkspaces.filter((ws) => ws.status === 'completed')
}
