import type { BaseEntity } from './common.types'

export type MessageRole = 'user' | 'assistant' | 'system'

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'error'

export type CommandType =
  | 'create_workspace'
  | 'run_reconciliation'
  | 'upload_file'
  | 'export_results'
  | 'view_logs'
  | 'create_config'
  | 'help'
  | 'status'
  | 'unknown'

export interface ChatMessage extends BaseEntity {
  role: MessageRole
  content: string
  status: MessageStatus
  metadata?: {
    command?: CommandType
    workspaceId?: string
    configId?: string
    fileName?: string
    error?: string
    isTyping?: boolean
  }
  attachments?: ChatAttachment[]
  reactions?: string[]
}

export interface ChatAttachment {
  id: string
  type: 'file' | 'image' | 'link' | 'result'
  name: string
  url?: string
  size?: number
  mimeType?: string
  preview?: string
}

export interface ChatCommand {
  trigger: string
  description: string
  examples: string[]
  parameters?: ChatCommandParameter[]
  category: 'workspace' | 'reconciliation' | 'file' | 'config' | 'system'
}

export interface ChatCommandParameter {
  name: string
  description: string
  required: boolean
  type: 'string' | 'number' | 'file' | 'workspace' | 'config'
  defaultValue?: any
}

export interface ChatSuggestion {
  id: string
  text: string
  command?: CommandType
  icon?: string
  action?: () => void
}

export interface ChatContext {
  currentWorkspace?: string
  currentConfig?: string
  recentFiles?: string[]
  userPreferences?: {
    language?: string
    timezone?: string
    notifications?: boolean
  }
}

export interface AgentStatus {
  isOnline: boolean
  isTyping: boolean
  currentTask?: string
  lastSeen?: Date
  capabilities: AgentCapability[]
}

export interface AgentCapability {
  name: string
  description: string
  enabled: boolean
  icon?: string
}

export interface ChatThread extends BaseEntity {
  title: string
  messages: ChatMessage[]
  context: ChatContext
  status: 'active' | 'archived' | 'completed'
  lastMessageAt: Date
  messageCount: number
  unreadCount: number
}

export interface ChatFilters {
  dateFrom?: Date
  dateTo?: Date
  role?: MessageRole[]
  status?: MessageStatus[]
  searchQuery?: string
  threadId?: string
}

export interface ChatResponse {
  message: ChatMessage
  suggestedActions?: ChatSuggestion[]
  requiresConfirmation?: boolean
  confirmationPrompt?: string
}

export interface TypingIndicator {
  isTyping: boolean
  userId?: string
  userName?: string
  startedAt?: Date
}

export interface ChatExportOptions {
  format: 'txt' | 'json' | 'html' | 'pdf'
  includeAttachments: boolean
  includeMetadata: boolean
  dateRange?: {
    from: Date
    to: Date
  }
}

// Command parsing types
export interface ParsedCommand {
  type: CommandType
  action: string
  parameters: Record<string, any>
  confidence: number // 0-1
  originalText: string
}

export interface CommandExecutionResult {
  success: boolean
  message: string
  data?: any
  error?: string
  nextSteps?: string[]
}
