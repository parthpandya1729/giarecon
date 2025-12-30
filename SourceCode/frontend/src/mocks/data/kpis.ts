export interface KPIMetric {
  label: string
  value: number | string
  change: number // percentage change from previous period
  trend: 'up' | 'down' | 'neutral'
  format: 'number' | 'percentage' | 'currency' | 'time' | 'text'
  icon?: string
  color?: string
}

export interface DashboardKPIs {
  overview: KPIMetric[]
  performance: KPIMetric[]
  quality: KPIMetric[]
  system: KPIMetric[]
}

export const dashboardKPIs: DashboardKPIs = {
  overview: [
    {
      label: 'Total Workspaces',
      value: 13,
      change: 8.3,
      trend: 'up',
      format: 'number',
      icon: 'FolderKanban',
      color: 'cyan',
    },
    {
      label: 'Active Reconciliations',
      value: 2,
      change: 0,
      trend: 'neutral',
      format: 'number',
      icon: 'Activity',
      color: 'purple',
    },
    {
      label: 'Total Records Processed',
      value: 142567,
      change: 12.5,
      trend: 'up',
      format: 'number',
      icon: 'Database',
      color: 'green',
    },
    {
      label: 'Completed This Month',
      value: 8,
      change: -11.1,
      trend: 'down',
      format: 'number',
      icon: 'CheckCircle',
      color: 'green',
    },
  ],
  performance: [
    {
      label: 'Average Match Rate',
      value: 85.4,
      change: 2.1,
      trend: 'up',
      format: 'percentage',
      icon: 'Target',
      color: 'cyan',
    },
    {
      label: 'Average Processing Time',
      value: '8.2s',
      change: -15.3,
      trend: 'up', // Lower time is better, so up trend
      format: 'time',
      icon: 'Clock',
      color: 'purple',
    },
    {
      label: 'Records Per Second',
      value: 1247,
      change: 18.7,
      trend: 'up',
      format: 'number',
      icon: 'Zap',
      color: 'pink',
    },
    {
      label: 'Success Rate',
      value: 92.3,
      change: 3.4,
      trend: 'up',
      format: 'percentage',
      icon: 'TrendingUp',
      color: 'green',
    },
  ],
  quality: [
    {
      label: 'Matched Records',
      value: 121456,
      change: 14.2,
      trend: 'up',
      format: 'number',
      icon: 'CheckCircle2',
      color: 'green',
    },
    {
      label: 'Unmatched Records',
      value: 16543,
      change: 5.8,
      trend: 'down', // Fewer unmatched is better
      format: 'number',
      icon: 'XCircle',
      color: 'pink',
    },
    {
      label: 'Discrepancies Found',
      value: 4568,
      change: -8.9,
      trend: 'up', // Fewer discrepancies is better
      format: 'number',
      icon: 'AlertTriangle',
      color: 'orange',
    },
    {
      label: 'Accuracy Score',
      value: 96.8,
      change: 1.2,
      trend: 'up',
      format: 'percentage',
      icon: 'Award',
      color: 'cyan',
    },
  ],
  system: [
    {
      label: 'Email Service',
      value: 'Online',
      change: 0,
      trend: 'neutral',
      format: 'text',
      icon: 'Mail',
      color: 'green',
    },
    {
      label: 'Recon Engine',
      value: 'Online',
      change: 0,
      trend: 'neutral',
      format: 'text',
      icon: 'Cpu',
      color: 'green',
    },
    {
      label: 'Database',
      value: 'Online',
      change: 0,
      trend: 'neutral',
      format: 'text',
      icon: 'Database',
      color: 'green',
    },
  ],
}

export interface RecentActivity {
  id: string
  type: 'reconciliation' | 'upload' | 'export' | 'config' | 'error'
  title: string
  description: string
  timestamp: Date
  workspaceId?: string
  status: 'success' | 'warning' | 'error' | 'info'
  icon: string
}

export const recentActivities: RecentActivity[] = [
  {
    id: '1',
    type: 'reconciliation',
    title: 'Reconciliation Completed',
    description: 'Samsung Q4 2024: 84.9% match rate, 498 discrepancies',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    workspaceId: 'ws_samsung_q4',
    status: 'success',
    icon: 'CheckCircle',
  },
  {
    id: '2',
    type: 'reconciliation',
    title: 'Reconciliation In Progress',
    description: 'December 2024 Monthly Recon: 74% complete',
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    workspaceId: 'ws_dec_2024',
    status: 'info',
    icon: 'Activity',
  },
  {
    id: '3',
    type: 'upload',
    title: 'Files Uploaded',
    description: 'Samsung Q4: 2 files uploaded (15,847 + 15,349 records)',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
    workspaceId: 'ws_samsung_q4',
    status: 'success',
    icon: 'FileUp',
  },
  {
    id: '4',
    type: 'error',
    title: 'Reconciliation Failed',
    description: 'Apple Inc. Annual 2024: Missing target file',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
    workspaceId: 'ws_apple_2024',
    status: 'error',
    icon: 'XCircle',
  },
  {
    id: '5',
    type: 'export',
    title: 'Results Exported',
    description: 'Weekly Vendor Payments exported to Excel (3,241 records)',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    workspaceId: 'ws_week52',
    status: 'success',
    icon: 'Download',
  },
  {
    id: '6',
    type: 'config',
    title: 'Config Template Created',
    description: 'New finance reconciliation template created',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
    status: 'success',
    icon: 'Settings',
  },
  {
    id: '7',
    type: 'reconciliation',
    title: 'Reconciliation Completed',
    description: 'Daily Recon 2024-12-28: 93.0% match rate',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    workspaceId: 'ws_daily_1228',
    status: 'success',
    icon: 'CheckCircle',
  },
  {
    id: '8',
    type: 'upload',
    title: 'Files Uploaded',
    description: 'December 2024 files uploaded (8,432 records)',
    timestamp: new Date(Date.now() - 25 * 60 * 60 * 1000),
    workspaceId: 'ws_dec_2024',
    status: 'success',
    icon: 'FileUp',
  },
]

export interface QuickAction {
  id: string
  label: string
  description: string
  icon: string
  color: 'cyan' | 'purple' | 'pink' | 'green'
  action: string
  enabled: boolean
}

export const quickActions: QuickAction[] = [
  {
    id: 'create_workspace',
    label: 'New Workspace',
    description: 'Create a new reconciliation workspace',
    icon: 'Plus',
    color: 'cyan',
    action: '/workspaces/create',
    enabled: true,
  },
  {
    id: 'upload_files',
    label: 'Upload Files',
    description: 'Upload source and target files',
    icon: 'Upload',
    color: 'purple',
    action: '/workspaces',
    enabled: true,
  },
  {
    id: 'view_results',
    label: 'View Results',
    description: 'Browse recent reconciliation results',
    icon: 'BarChart3',
    color: 'pink',
    action: '/workspaces',
    enabled: true,
  },
  {
    id: 'create_config',
    label: 'New Template',
    description: 'Create a new configuration template',
    icon: 'FileCode',
    color: 'green',
    action: '/config/create',
    enabled: true,
  },
]

export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'down'
  services: {
    name: string
    status: 'online' | 'offline' | 'degraded'
    uptime: number // percentage
    lastCheck: Date
    responseTime?: number // ms
  }[]
  lastUpdate: Date
}

export const systemHealth: SystemHealth = {
  overall: 'healthy',
  services: [
    {
      name: 'Email Service',
      status: 'online',
      uptime: 99.8,
      lastCheck: new Date(),
      responseTime: 145,
    },
    {
      name: 'Reconciliation Engine',
      status: 'online',
      uptime: 100,
      lastCheck: new Date(),
      responseTime: 234,
    },
    {
      name: 'Database',
      status: 'online',
      uptime: 99.99,
      lastCheck: new Date(),
      responseTime: 12,
    },
    {
      name: 'File Storage',
      status: 'online',
      uptime: 99.95,
      lastCheck: new Date(),
      responseTime: 56,
    },
  ],
  lastUpdate: new Date(),
}

export const monthlyStats = {
  totalWorkspaces: 13,
  completedWorkspaces: 8,
  failedWorkspaces: 1,
  pendingWorkspaces: 1,
  runningWorkspaces: 2,
  totalRecordsProcessed: 142567,
  averageMatchRate: 85.4,
  averageProcessingTime: 8200, // milliseconds
  totalDiscrepancies: 4568,
  totalExports: 24,
}
