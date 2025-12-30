import { nanoid } from 'nanoid'
import type {
  ChatMessage,
  ChatThread,
  ChatResponse,
  ParsedCommand,
  CommandExecutionResult,
  ChatSuggestion,
  AgentStatus,
  CommandType,
} from '@/types/chat.types'
import type { ApiResponse } from '@/types/common.types'
import {
  mockChatThreads,
  availableCommands,
  agentCapabilities,
} from '../data/chatHistory'

const delay = (ms: number = 300) => new Promise((resolve) => setTimeout(resolve, ms))

const simulateError = () => {
  if (Math.random() < 0.05) {
    throw new Error('Network error: Request failed')
  }
}

// In-memory storage
let threads = [...mockChatThreads]
const currentThreadId = threads[threads.length - 1].id

export const chatApi = {
  // Get current chat thread
  async getCurrentThread(): Promise<ApiResponse<ChatThread>> {
    await delay(150)
    simulateError()

    const thread = threads.find((t) => t.id === currentThreadId)

    if (!thread) {
      return {
        success: false,
        error: 'Thread not found',
      }
    }

    return {
      success: true,
      data: thread,
    }
  },

  // Get all chat threads
  async getThreads(): Promise<ApiResponse<ChatThread[]>> {
    await delay(200)
    simulateError()

    // Sort by last message date
    const sorted = [...threads].sort(
      (a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime()
    )

    return {
      success: true,
      data: sorted,
    }
  },

  // Send a message
  async sendMessage(content: string): Promise<ApiResponse<ChatResponse>> {
    await delay(300)
    simulateError()

    const thread = threads.find((t) => t.id === currentThreadId)

    if (!thread) {
      return {
        success: false,
        error: 'Thread not found',
      }
    }

    // Create user message
    const userMessage: ChatMessage = {
      id: nanoid(),
      role: 'user',
      content,
      status: 'delivered',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    thread.messages.push(userMessage)
    thread.lastMessageAt = new Date()
    thread.messageCount++

    // Parse command if it looks like one
    const parsedCommand = parseCommand(content)

    // Simulate typing delay before response
    await delay(500 + Math.random() * 1000)

    // Generate assistant response
    const assistantMessage = generateAssistantResponse(content, parsedCommand)

    thread.messages.push(assistantMessage)
    thread.lastMessageAt = new Date()
    thread.messageCount++

    // Generate suggestions based on context
    const suggestions = generateSuggestions(parsedCommand)

    const response: ChatResponse = {
      message: assistantMessage,
      suggestedActions: suggestions,
      requiresConfirmation: parsedCommand?.type === 'create_workspace',
    }

    return {
      success: true,
      data: response,
    }
  },

  // Parse user command
  async parseCommand(text: string): Promise<ApiResponse<ParsedCommand>> {
    await delay(100)

    const parsed = parseCommand(text)

    return {
      success: true,
      data: parsed,
    }
  },

  // Execute command
  async executeCommand(
    command: ParsedCommand
  ): Promise<ApiResponse<CommandExecutionResult>> {
    await delay(400)
    simulateError()

    const result = await executeCommand(command)

    return {
      success: result.success,
      data: result,
    }
  },

  // Get available commands
  async getAvailableCommands(): Promise<ApiResponse<typeof availableCommands>> {
    await delay(100)

    return {
      success: true,
      data: availableCommands,
    }
  },

  // Get agent status
  async getAgentStatus(): Promise<ApiResponse<AgentStatus>> {
    await delay(100)

    const status: AgentStatus = {
      isOnline: true,
      isTyping: false,
      lastSeen: new Date(),
      capabilities: agentCapabilities,
    }

    return {
      success: true,
      data: status,
    }
  },

  // Mark messages as read
  async markAsRead(threadId: string): Promise<ApiResponse<void>> {
    await delay(100)

    const thread = threads.find((t) => t.id === threadId)

    if (!thread) {
      return {
        success: false,
        error: 'Thread not found',
      }
    }

    thread.unreadCount = 0

    return {
      success: true,
    }
  },

  // Create new thread
  async createThread(title: string): Promise<ApiResponse<ChatThread>> {
    await delay(200)

    const newThread: ChatThread = {
      id: nanoid(),
      title,
      messages: [
        {
          id: nanoid(),
          role: 'system',
          content:
            'New conversation started. How can I help you with reconciliation today?',
          status: 'delivered',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      context: {},
      status: 'active',
      lastMessageAt: new Date(),
      messageCount: 1,
      unreadCount: 0,
      createdAt: new Date(),
    }

    threads.push(newThread)

    return {
      success: true,
      data: newThread,
    }
  },

  // Archive thread
  async archiveThread(threadId: string): Promise<ApiResponse<void>> {
    await delay(150)

    const thread = threads.find((t) => t.id === threadId)

    if (!thread) {
      return {
        success: false,
        error: 'Thread not found',
      }
    }

    thread.status = 'archived'

    return {
      success: true,
      message: 'Thread archived successfully',
    }
  },
}

// Helper functions

function parseCommand(text: string): ParsedCommand {
  const lowerText = text.toLowerCase().trim()

  let type: CommandType = 'unknown'
  let action = ''
  let confidence = 0
  const parameters: Record<string, any> = {}

  // Match against known command patterns
  if (
    lowerText.includes('create') &&
    (lowerText.includes('workspace') || lowerText.includes('project'))
  ) {
    type = 'create_workspace'
    action = 'create_workspace'
    confidence = 0.9
  } else if (
    lowerText.includes('run') &&
    (lowerText.includes('reconcil') || lowerText.includes('recon'))
  ) {
    type = 'run_reconciliation'
    action = 'run_reconciliation'
    confidence = 0.85
  } else if (lowerText.includes('upload') && lowerText.includes('file')) {
    type = 'upload_file'
    action = 'upload_file'
    confidence = 0.8
  } else if (
    lowerText.includes('export') &&
    (lowerText.includes('result') || lowerText.includes('excel'))
  ) {
    type = 'export_results'
    action = 'export_results'
    confidence = 0.85
  } else if (
    lowerText.includes('view') &&
    (lowerText.includes('log') || lowerText.includes('logs'))
  ) {
    type = 'view_logs'
    action = 'view_logs'
    confidence = 0.8
  } else if (
    lowerText.includes('create') &&
    (lowerText.includes('config') || lowerText.includes('template'))
  ) {
    type = 'create_config'
    action = 'create_config'
    confidence = 0.75
  } else if (lowerText.includes('help') || lowerText.includes('what can you')) {
    type = 'help'
    action = 'show_help'
    confidence = 0.95
  } else if (
    lowerText.includes('status') ||
    lowerText.includes('what is') ||
    lowerText.includes('check')
  ) {
    type = 'status'
    action = 'check_status'
    confidence = 0.7
  }

  return {
    type,
    action,
    parameters,
    confidence,
    originalText: text,
  }
}

function generateAssistantResponse(
  userMessage: string,
  parsedCommand: ParsedCommand
): ChatMessage {
  let content = ''

  switch (parsedCommand.type) {
    case 'create_workspace':
      content =
        "I'll help you create a new workspace. What would you like to name this workspace?"
      break

    case 'run_reconciliation':
      content =
        'To run a reconciliation, please specify which workspace you want to reconcile. You can say something like "run reconciliation on [workspace name]".'
      break

    case 'upload_file':
      content =
        "I'll help you upload files. Which workspace would you like to upload to? You can navigate to the workspace and use the upload button, or tell me the workspace name."
      break

    case 'export_results':
      content =
        'I can help you export reconciliation results. Which workspace results would you like to export? The default format is Excel (XLSX).'
      break

    case 'view_logs':
      content =
        "I'll show you the system logs. You can view them in the Logs section, or tell me what specific logs you're interested in (e.g., error logs, logs for a specific workspace)."
      break

    case 'create_config':
      content =
        "I'll help you create a new configuration template. You can use the Configuration Builder to set up field mappings and validation rules, or clone an existing template."
      break

    case 'help':
      content = `I'm GIA, your Generative Intelligence Agent for reconciliation. Here's what I can help you with:

💼 **Workspace Management**
• Create, update, and delete workspaces
• Upload source and target files
• View workspace details and history

🔄 **Reconciliation Operations**
• Run reconciliation processes
• View match results and discrepancies
• Export results to Excel/CSV

⚙️ **Configuration**
• Create field mapping templates
• Set up validation rules
• Use pre-configured templates (Samsung, Finance, etc.)

📊 **Analytics & Reporting**
• View reconciliation statistics
• Monitor processing performance
• Generate detailed reports

📋 **Logs & Audit**
• View system logs
• Track all actions
• Export audit trails

Just tell me what you'd like to do, and I'll guide you through it!`
      break

    case 'status':
      content = `Here's the current system status:

✅ **Services**
• Email Service: Online
• Reconciliation Engine: Online
• Database: Online
• File Storage: Online

📊 **Quick Stats**
• Active Workspaces: 2
• Completed Today: 3
• Average Match Rate: 85.4%
• System Health: Healthy

What would you like to know more about?`
      break

    default:
      content =
        "I'm here to help with reconciliation tasks. You can create workspaces, run reconciliations, upload files, view logs, and more. What would you like to do?"
  }

  return {
    id: nanoid(),
    role: 'assistant',
    content,
    status: 'delivered',
    createdAt: new Date(),
    updatedAt: new Date(),
    metadata: {
      command: parsedCommand.type,
    },
  }
}

function generateSuggestions(parsedCommand: ParsedCommand): ChatSuggestion[] {
  const suggestions: ChatSuggestion[] = []

  switch (parsedCommand.type) {
    case 'create_workspace':
      suggestions.push(
        {
          id: '1',
          text: 'Use Samsung template',
          command: 'create_config',
          icon: 'FileCode',
        },
        {
          id: '2',
          text: 'Upload files first',
          command: 'upload_file',
          icon: 'Upload',
        }
      )
      break

    case 'run_reconciliation':
      suggestions.push(
        {
          id: '1',
          text: 'View recent workspaces',
          command: 'status',
          icon: 'FolderKanban',
        },
        {
          id: '2',
          text: 'Check configuration',
          command: 'create_config',
          icon: 'Settings',
        }
      )
      break

    case 'help':
      suggestions.push(
        {
          id: '1',
          text: 'Create new workspace',
          command: 'create_workspace',
          icon: 'Plus',
        },
        {
          id: '2',
          text: 'View system status',
          command: 'status',
          icon: 'Activity',
        }
      )
      break

    default:
      suggestions.push(
        {
          id: '1',
          text: 'Show available commands',
          command: 'help',
          icon: 'HelpCircle',
        }
      )
  }

  return suggestions
}

async function executeCommand(
  command: ParsedCommand
): Promise<CommandExecutionResult> {
  // Simulate command execution
  await delay(500)

  const result: CommandExecutionResult = {
    success: true,
    message: `Command '${command.action}' executed successfully`,
    nextSteps: [],
  }

  switch (command.type) {
    case 'create_workspace':
      result.nextSteps = ['Upload source file', 'Upload target file', 'Run reconciliation']
      break

    case 'run_reconciliation':
      result.nextSteps = ['Monitor progress', 'View results', 'Export to Excel']
      break

    case 'export_results':
      result.nextSteps = ['Download file', 'Share via email', 'Archive workspace']
      break
  }

  return result
}
