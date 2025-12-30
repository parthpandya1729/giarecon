import { useEffect, useRef } from 'react'
import type { ChatMessage } from '@/types/chat.types'
import MessageBubble from './MessageBubble'
import TypingIndicator from './TypingIndicator'

interface MessageListProps {
  messages: ChatMessage[]
  isTyping?: boolean
}

export default function MessageList({ messages, isTyping }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-benow-blue-50 border border-benow-blue-200 flex items-center justify-center">
            <span className="text-3xl">💬</span>
          </div>
          <h3 className="text-lg font-semibold text-benow-blue-600 mb-2">
            Start a Conversation
          </h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Ask me anything about reconciliation, workspaces, or how I can help you today.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto px-4 py-6 space-y-4 scroll-smooth"
    >
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}

      {isTyping && <TypingIndicator />}

      {/* Invisible div for auto-scroll target */}
      <div ref={messagesEndRef} />
    </div>
  )
}
