import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Minimize2, MessageSquare } from 'lucide-react'
import { useChatStore } from '../store/chatStore'
import MessageList from './MessageList'
import ChatInput from './ChatInput'
import CommandSuggestions from './CommandSuggestions'
import AgentAvatar from './AgentAvatar'
import LoadingSpinner from '@/shared/components/LoadingSpinner'

export default function ChatContainer() {
  const {
    isOpen,
    currentThread,
    isTyping,
    agentStatus,
    suggestions,
    error,
    isLoading,
    toggleChat,
    closeChat,
    sendMessage,
    loadCurrentThread,
    loadAgentStatus,
    clearError,
    setSuggestions,
  } = useChatStore()

  // Load initial data
  useEffect(() => {
    if (isOpen && !currentThread) {
      loadCurrentThread()
    }
    if (isOpen && !agentStatus) {
      loadAgentStatus()
    }
  }, [isOpen])

  const handleSendMessage = async (message: string) => {
    await sendMessage(message)
  }

  const handleSelectSuggestion = (suggestion: any) => {
    sendMessage(suggestion.text)
    setSuggestions([])
  }

  return (
    <>
      {/* Floating Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleChat}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-benow-blue-600 shadow-card-elevated flex items-center justify-center text-white hover:bg-benow-blue-700 hover:shadow-card-elevated transition-all"
          >
            <MessageSquare className="w-6 h-6" />
            {/* Notification badge (optional) */}
            {currentThread && currentThread.unreadCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-error-500 rounded-full flex items-center justify-center text-xs font-bold"
              >
                {currentThread.unreadCount}
              </motion.div>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeChat}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />

            {/* Chat Panel */}
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full md:w-[450px] z-50 flex flex-col bg-white border-l border-gray-200 shadow-card-elevated"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
                <div className="flex items-center gap-3">
                  <AgentAvatar status={agentStatus} size="md" />
                  <div>
                    <h3 className="font-semibold text-gray-900">GIA</h3>
                    <p className="text-xs text-muted-foreground">
                      {agentStatus?.isTyping
                        ? 'Typing...'
                        : agentStatus?.isOnline
                        ? 'Online'
                        : 'Offline'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={closeChat}
                    className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                    title="Minimize"
                  >
                    <Minimize2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={closeChat}
                    className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                    title="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="px-4 py-3 bg-error-50 border-b border-error-200 flex items-center justify-between"
                >
                  <span className="text-sm text-error-600">{error}</span>
                  <button
                    onClick={clearError}
                    className="text-error-600 hover:text-error-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              )}

              {/* Loading state */}
              {isLoading && !currentThread && (
                <div className="flex-1 flex items-center justify-center">
                  <LoadingSpinner size="lg" />
                </div>
              )}

              {/* Messages */}
              {currentThread && (
                <>
                  <MessageList
                    messages={currentThread.messages}
                    isTyping={isTyping}
                  />

                  {/* Suggestions */}
                  <CommandSuggestions
                    suggestions={suggestions}
                    onSelectSuggestion={handleSelectSuggestion}
                  />

                  {/* Input */}
                  <ChatInput
                    onSendMessage={handleSendMessage}
                    disabled={isLoading}
                  />
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
