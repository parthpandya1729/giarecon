import { nanoid } from 'nanoid'
import type { ChatMessage, ChatThread, ChatCommand, AgentCapability } from '@/types/chat.types'

function createMessage(
  role: 'user' | 'assistant' | 'system',
  content: string,
  minutesAgo: number = 0,
  metadata?: ChatMessage['metadata']
): ChatMessage {
  const createdAt = new Date()
  createdAt.setMinutes(createdAt.getMinutes() - minutesAgo)

  return {
    id: nanoid(),
    role,
    content,
    status: 'delivered',
    createdAt,
    updatedAt: createdAt,
    metadata,
  }
}

// Sample conversation thread 1: Creating a workspace
const thread1Messages: ChatMessage[] = [
  createMessage('user', 'Hi, I need to reconcile Samsung Q4 2024 transactions', 30),
  createMessage(
    'assistant',
    "Hello! I'd be happy to help you reconcile Samsung Q4 2024 transactions. To get started, I'll need to create a new workspace. Do you have the source and target files ready to upload?",
    29
  ),
  createMessage('user', 'Yes, I have both files ready', 28),
  createMessage(
    'assistant',
    'Perfect! Let me create a workspace for you. What would you like to name this workspace?',
    27,
    { command: 'create_workspace' }
  ),
  createMessage('user', 'Samsung Q4 2024 Reconciliation', 26),
  createMessage(
    'assistant',
    'Great! I\'ve created the workspace "Samsung Q4 2024 Reconciliation". You can now upload your files. Would you like me to use the Samsung Electronics Standard Template for the reconciliation configuration?',
    25,
    { workspaceId: 'ws_samsung_q4' }
  ),
  createMessage('user', 'Yes, use the Samsung template', 24),
  createMessage(
    'assistant',
    "Excellent! The Samsung template has been applied. This template includes:\n• Primary key mapping: Transaction_ID → Reference_Number\n• Date mapping with format validation\n• Amount mapping with tolerance of $0.01\n• Vendor code validation\n\nPlease upload your source and target files when ready.",
    23,
    { configId: 'samsung_template' }
  ),
]

// Sample conversation thread 2: Running reconciliation
const thread2Messages: ChatMessage[] = [
  createMessage('user', 'Run reconciliation on December 2024 workspace', 15),
  createMessage(
    'assistant',
    'I\'ll start the reconciliation process for the "December 2024 Monthly Recon" workspace. Processing 8,432 records...',
    14,
    { command: 'run_reconciliation', workspaceId: 'ws_dec_2024' }
  ),
  createMessage(
    'assistant',
    'Reconciliation in progress... Current status:\n• Records processed: 4,216 / 8,432 (50%)\n• Matched: 3,123\n• Unmatched: 894\n• Discrepancies: 199',
    13,
    { workspaceId: 'ws_dec_2024' }
  ),
  createMessage(
    'assistant',
    'Reconciliation completed successfully!\n\n📊 Summary:\n• Total records: 8,432\n• Matched: 6,245 (74.1%)\n• Unmatched: 1,987\n• Discrepancies: 200\n• Processing time: 8.2 seconds\n\nWould you like me to export the results or view the discrepancies?',
    10,
    { workspaceId: 'ws_dec_2024' }
  ),
  createMessage('user', 'Show me the discrepancies', 9),
  createMessage(
    'assistant',
    'Here are the top discrepancies found:\n\n1. TXN2024543210 - Amount mismatch: $1,250.00 vs $1,251.50 (diff: $1.50)\n2. PAY2024876543 - Date mismatch: 2024-12-15 vs 2024-12-16\n3. INV2024234567 - Description mismatch\n\nWould you like to view the full discrepancy report or export to Excel?',
    8
  ),
]

// Sample conversation thread 3: Checking status
const thread3Messages: ChatMessage[] = [
  createMessage('user', 'What is the status of all my workspaces?', 5),
  createMessage(
    'assistant',
    "Here's the current status of your workspaces:\n\n✅ Completed (9):\n• Samsung Q4 2024 Reconciliation - 84.9% match\n• Weekly Vendor Payments - Week 52 - 92.2% match\n• Daily Reconciliation - 2024-12-28 - 93.0% match\n• LG Electronics Q3 2024 - 85.6% match\n• And 5 more...\n\n🔄 Running (1):\n• December 2024 Monthly Recon - 74.1% complete\n\n⚠️ Failed (1):\n• Apple Inc. Annual Reconciliation 2024\n\n📋 Pending (1):\n• New Workspace - Pending Setup\n\nWould you like details on any specific workspace?",
    4,
    { command: 'status' }
  ),
  createMessage('user', 'Why did the Apple reconciliation fail?', 3),
  createMessage(
    'assistant',
    'The Apple Inc. Annual Reconciliation 2024 failed due to:\n\n❌ Error: Missing target file\n• Source file uploaded: apple_2024_full.xlsx (45,623 records)\n• Target file: Not uploaded\n• Failed at: File validation stage\n• Time: 2.3 seconds\n\nTo resolve this:\n1. Upload the target file for comparison\n2. Restart the reconciliation process\n\nWould you like me to help you upload the target file now?',
    2,
    { workspaceId: 'ws_apple_2024', error: 'Missing target file' }
  ),
]

// Sample conversation thread 4: Export and logs
const thread4Messages: ChatMessage[] = [
  createMessage('user', 'Export the Samsung Q4 results to Excel', 2),
  createMessage(
    'assistant',
    'I\'ll export the Samsung Q4 2024 Reconciliation results to Excel. The export will include:\n\n• All matched records (13,456)\n• Unmatched records (1,893)\n• Discrepancy details (498)\n• Summary report with charts\n• Field-level analysis\n\nGenerating Excel file...',
    1,
    { command: 'export_results', workspaceId: 'ws_samsung_q4' }
  ),
  createMessage(
    'assistant',
    '✅ Export completed!\n\nFile: samsung_q4_2024_reconciliation_results.xlsx\nSize: 3.2 MB\nSheets: 5 (Matched, Unmatched, Discrepancies, Summary, Charts)\n\nThe file is ready for download. Would you like me to email it to you as well?',
    0
  ),
]

// Current active thread with recent messages
const currentThreadMessages: ChatMessage[] = [
  createMessage(
    'system',
    'GIA Reconciliation Agent initialized. How can I help you today?',
    120
  ),
  createMessage('user', 'Hello', 60),
  createMessage(
    'assistant',
    "Hello! I'm GIA, your Generative Intelligence Agent for reconciliation. I can help you with:\n\n💼 Workspace management\n🔄 Running reconciliations\n📊 Viewing results and analytics\n📁 File uploads and validation\n⚙️ Configuration management\n📋 Viewing logs and audit trails\n\nWhat would you like to do today?",
    59
  ),
]

export const mockChatThreads: ChatThread[] = [
  {
    id: nanoid(),
    title: 'Samsung Q4 2024 Setup',
    messages: thread1Messages,
    context: {
      currentWorkspace: 'ws_samsung_q4',
      currentConfig: 'samsung_template',
    },
    status: 'completed',
    lastMessageAt: thread1Messages[thread1Messages.length - 1].createdAt,
    messageCount: thread1Messages.length,
    unreadCount: 0,
    createdAt: thread1Messages[0].createdAt,
  },
  {
    id: nanoid(),
    title: 'December Reconciliation',
    messages: thread2Messages,
    context: {
      currentWorkspace: 'ws_dec_2024',
    },
    status: 'completed',
    lastMessageAt: thread2Messages[thread2Messages.length - 1].createdAt,
    messageCount: thread2Messages.length,
    unreadCount: 0,
    createdAt: thread2Messages[0].createdAt,
  },
  {
    id: nanoid(),
    title: 'Workspace Status Check',
    messages: thread3Messages,
    context: {},
    status: 'completed',
    lastMessageAt: thread3Messages[thread3Messages.length - 1].createdAt,
    messageCount: thread3Messages.length,
    unreadCount: 0,
    createdAt: thread3Messages[0].createdAt,
  },
  {
    id: nanoid(),
    title: 'Export Results',
    messages: thread4Messages,
    context: {
      currentWorkspace: 'ws_samsung_q4',
    },
    status: 'completed',
    lastMessageAt: thread4Messages[thread4Messages.length - 1].createdAt,
    messageCount: thread4Messages.length,
    unreadCount: 0,
    createdAt: thread4Messages[0].createdAt,
  },
  {
    id: 'current_thread',
    title: 'Current Session',
    messages: currentThreadMessages,
    context: {},
    status: 'active',
    lastMessageAt: currentThreadMessages[currentThreadMessages.length - 1].createdAt,
    messageCount: currentThreadMessages.length,
    unreadCount: 0,
    createdAt: currentThreadMessages[0].createdAt,
  },
]

// Available chat commands
export const availableCommands: ChatCommand[] = [
  {
    trigger: 'create workspace',
    description: 'Create a new reconciliation workspace',
    examples: [
      'create workspace for Samsung Q4',
      'create a new workspace',
      'I want to create workspace',
    ],
    parameters: [
      {
        name: 'name',
        description: 'Workspace name',
        required: true,
        type: 'string',
      },
      {
        name: 'description',
        description: 'Workspace description',
        required: false,
        type: 'string',
      },
      {
        name: 'configName',
        description: 'Configuration template name',
        required: false,
        type: 'config',
      },
    ],
    category: 'workspace',
  },
  {
    trigger: 'run reconciliation',
    description: 'Execute reconciliation on a workspace',
    examples: [
      'run reconciliation on Samsung Q4',
      'start reconciliation',
      'reconcile the December workspace',
    ],
    parameters: [
      {
        name: 'workspaceId',
        description: 'Workspace to reconcile',
        required: true,
        type: 'workspace',
      },
    ],
    category: 'reconciliation',
  },
  {
    trigger: 'upload file',
    description: 'Upload a file to a workspace',
    examples: ['upload file to workspace', 'I want to upload a file', 'upload source file'],
    parameters: [
      {
        name: 'workspaceId',
        description: 'Target workspace',
        required: true,
        type: 'workspace',
      },
      {
        name: 'fileType',
        description: 'File type (source or target)',
        required: true,
        type: 'string',
      },
    ],
    category: 'file',
  },
  {
    trigger: 'export results',
    description: 'Export reconciliation results to Excel',
    examples: [
      'export results',
      'export Samsung Q4 to Excel',
      'download reconciliation results',
    ],
    parameters: [
      {
        name: 'workspaceId',
        description: 'Workspace to export',
        required: true,
        type: 'workspace',
      },
      {
        name: 'format',
        description: 'Export format',
        required: false,
        type: 'string',
        defaultValue: 'xlsx',
      },
    ],
    category: 'reconciliation',
  },
  {
    trigger: 'view logs',
    description: 'View system logs and audit trail',
    examples: ['show logs', 'view recent logs', 'show me the error logs'],
    parameters: [
      {
        name: 'filter',
        description: 'Log filter (severity, action, date)',
        required: false,
        type: 'string',
      },
    ],
    category: 'system',
  },
  {
    trigger: 'status',
    description: 'Check status of workspaces and reconciliations',
    examples: ['check status', 'what is the status?', 'show workspace status'],
    category: 'system',
  },
  {
    trigger: 'help',
    description: 'Get help with available commands',
    examples: ['help', 'what can you do?', 'show commands'],
    category: 'system',
  },
]

// Agent capabilities
export const agentCapabilities: AgentCapability[] = [
  {
    name: 'Workspace Management',
    description: 'Create, update, and delete reconciliation workspaces',
    enabled: true,
    icon: 'FolderKanban',
  },
  {
    name: 'File Processing',
    description: 'Upload and process Excel/CSV files for reconciliation',
    enabled: true,
    icon: 'FileUp',
  },
  {
    name: 'Reconciliation Execution',
    description: 'Execute matching algorithms and identify discrepancies',
    enabled: true,
    icon: 'Zap',
  },
  {
    name: 'Data Export',
    description: 'Export results to Excel, CSV, and other formats',
    enabled: true,
    icon: 'Download',
  },
  {
    name: 'Email Integration',
    description: 'Send and receive emails with reconciliation reports',
    enabled: true,
    icon: 'Mail',
  },
  {
    name: 'Real-time Monitoring',
    description: 'Monitor reconciliation progress in real-time',
    enabled: true,
    icon: 'Activity',
  },
  {
    name: 'Audit Logging',
    description: 'Complete audit trail of all actions',
    enabled: true,
    icon: 'Shield',
  },
]

export const currentThread = mockChatThreads[mockChatThreads.length - 1]

export function getChatThreadById(id: string): ChatThread | undefined {
  return mockChatThreads.find((thread) => thread.id === id)
}

export function getActiveThreads(): ChatThread[] {
  return mockChatThreads.filter((thread) => thread.status === 'active')
}
