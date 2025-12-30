import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ChatMessage, ChatThread, ChatSuggestion, AgentStatus } from '@/types/chat.types'
import { chatApi } from '@/mocks/api/chatApi'

interface ChatState {
  // State
  currentThread: ChatThread | null
  threads: ChatThread[]
  isOpen: boolean
  isTyping: boolean
  agentStatus: AgentStatus | null
  suggestions: ChatSuggestion[]
  error: string | null
  isLoading: boolean

  // Actions
  toggleChat: () => void
  openChat: () => void
  closeChat: () => void
  sendMessage: (content: string) => Promise<void>
  loadCurrentThread: () => Promise<void>
  loadThreads: () => Promise<void>
  loadAgentStatus: () => Promise<void>
  createNewThread: (title: string) => Promise<void>
  switchThread: (threadId: string) => Promise<void>
  archiveThread: (threadId: string) => Promise<void>
  clearError: () => void
  setSuggestions: (suggestions: ChatSuggestion[]) => void
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentThread: null,
      threads: [],
      isOpen: false,
      isTyping: false,
      agentStatus: null,
      suggestions: [],
      error: null,
      isLoading: false,

      // Toggle chat overlay
      toggleChat: () => {
        set((state) => ({ isOpen: !state.isOpen }))
        if (!get().isOpen && !get().currentThread) {
          get().loadCurrentThread()
        }
      },

      openChat: () => {
        set({ isOpen: true })
        if (!get().currentThread) {
          get().loadCurrentThread()
        }
      },

      closeChat: () => {
        set({ isOpen: false })
      },

      // Send a message
      sendMessage: async (content: string) => {
        const { currentThread } = get()

        if (!currentThread || !content.trim()) return

        set({ isLoading: true, error: null })

        try {
          // Optimistically add user message to UI
          const tempUserMessage: ChatMessage = {
            id: `temp-${Date.now()}`,
            role: 'user',
            content: content.trim(),
            status: 'sending',
            createdAt: new Date(),
            updatedAt: new Date(),
          }

          set((state) => ({
            currentThread: state.currentThread
              ? {
                  ...state.currentThread,
                  messages: [...state.currentThread.messages, tempUserMessage],
                }
              : null,
          }))

          // Show typing indicator
          set({ isTyping: true })

          // Send message to API
          const response = await chatApi.sendMessage(content.trim())

          if (response.success && response.data) {
            // Update thread with actual messages
            await get().loadCurrentThread()

            // Set suggestions if provided
            if (response.data.suggestedActions) {
              set({ suggestions: response.data.suggestedActions })
            }
          } else {
            set({ error: response.error || 'Failed to send message' })
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to send message',
          })
        } finally {
          set({ isLoading: false, isTyping: false })
        }
      },

      // Load current thread
      loadCurrentThread: async () => {
        set({ isLoading: true, error: null })

        try {
          const response = await chatApi.getCurrentThread()

          if (response.success && response.data) {
            set({ currentThread: response.data })
          } else {
            set({ error: response.error || 'Failed to load thread' })
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to load thread',
          })
        } finally {
          set({ isLoading: false })
        }
      },

      // Load all threads
      loadThreads: async () => {
        try {
          const response = await chatApi.getThreads()

          if (response.success && response.data) {
            set({ threads: response.data })
          }
        } catch (error) {
          console.error('Failed to load threads:', error)
        }
      },

      // Load agent status
      loadAgentStatus: async () => {
        try {
          const response = await chatApi.getAgentStatus()

          if (response.success && response.data) {
            set({ agentStatus: response.data })
          }
        } catch (error) {
          console.error('Failed to load agent status:', error)
        }
      },

      // Create new thread
      createNewThread: async (title: string) => {
        set({ isLoading: true, error: null })

        try {
          const response = await chatApi.createThread(title)

          if (response.success && response.data) {
            set((state) => ({
              currentThread: response.data!,
              threads: [response.data!, ...state.threads],
            }))
          } else {
            set({ error: response.error || 'Failed to create thread' })
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to create thread',
          })
        } finally {
          set({ isLoading: false })
        }
      },

      // Switch to different thread
      switchThread: async (threadId: string) => {
        const { threads } = get()
        const thread = threads.find((t) => t.id === threadId)

        if (thread) {
          set({ currentThread: thread })
          await chatApi.markAsRead(threadId)
        }
      },

      // Archive thread
      archiveThread: async (threadId: string) => {
        try {
          const response = await chatApi.archiveThread(threadId)

          if (response.success) {
            set((state) => ({
              threads: state.threads.filter((t) => t.id !== threadId),
              currentThread:
                state.currentThread?.id === threadId ? null : state.currentThread,
            }))

            // Load current thread if we archived the active one
            if (get().currentThread === null) {
              await get().loadCurrentThread()
            }
          }
        } catch (error) {
          console.error('Failed to archive thread:', error)
        }
      },

      // Clear error
      clearError: () => {
        set({ error: null })
      },

      // Set suggestions
      setSuggestions: (suggestions: ChatSuggestion[]) => {
        set({ suggestions })
      },
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({
        // Only persist chat open/close state
        isOpen: state.isOpen,
      }),
    }
  )
)
