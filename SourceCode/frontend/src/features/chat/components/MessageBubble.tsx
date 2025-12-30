import { motion } from 'framer-motion'
import { Bot, User, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import type { ChatMessage } from '@/types/chat.types'
import { cn } from '@/shared/utils/cn'

interface MessageBubbleProps {
  message: ChatMessage
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const isSystem = message.role === 'system'
  const isError = message.status === 'error'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'flex gap-3 mb-4',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          isUser
            ? 'bg-indigo-100 border border-indigo-200'
            : 'bg-benow-blue-100 border border-benow-blue-200'
        )}
      >
        {isUser ? (
          <User className="w-4 h-4 text-indigo-600" />
        ) : (
          <Bot className="w-4 h-4 text-benow-blue-600" />
        )}
      </div>

      {/* Message content */}
      <div className={cn('flex flex-col', isUser ? 'items-end' : 'items-start', 'max-w-[80%]')}>
        {/* Message bubble */}
        <div
          className={cn(
            'px-4 py-2.5 rounded-2xl relative',
            isUser
              ? 'bg-benow-blue-600 text-white'
              : isSystem
              ? 'bg-gray-100 border border-gray-200'
              : 'bg-white border border-gray-200',
            isError && 'border-error-500 bg-error-50'
          )}
        >
          {isError && (
            <div className="flex items-center gap-2 mb-2 text-error-600">
              <AlertCircle className="w-4 h-4" />
              <span className="text-xs font-medium">Error</span>
            </div>
          )}

          <p
            className={cn(
              'text-sm leading-relaxed whitespace-pre-wrap',
              isUser ? 'text-white' : 'text-gray-900',
              isSystem && 'text-benow-blue-600 text-xs italic'
            )}
          >
            {message.content}
          </p>

          {/* Command badge */}
          {message.metadata?.command && !isUser && (
            <div className="mt-2 inline-block px-2 py-1 bg-benow-blue-50 border border-benow-blue-200 rounded text-xs text-benow-blue-600">
              {message.metadata.command.replace('_', ' ')}
            </div>
          )}
        </div>

        {/* Timestamp */}
        <div className="flex items-center gap-2 mt-1 px-2">
          <span className="text-xs text-muted-foreground">
            {format(message.createdAt, 'HH:mm')}
          </span>

          {message.status === 'sending' && (
            <div className="w-1 h-1 bg-benow-blue-600 rounded-full animate-pulse" />
          )}
        </div>
      </div>
    </motion.div>
  )
}
