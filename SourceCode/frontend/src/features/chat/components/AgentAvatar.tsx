import { motion } from 'framer-motion'
import { Bot } from 'lucide-react'
import type { AgentStatus } from '@/types/chat.types'

interface AgentAvatarProps {
  status?: AgentStatus | null
  size?: 'sm' | 'md' | 'lg'
}

export default function AgentAvatar({ status, size = 'md' }: AgentAvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  }

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }

  const isOnline = status?.isOnline ?? true

  return (
    <div className="relative">
      {/* Avatar */}
      <motion.div
        animate={
          status?.isTyping
            ? {
                scale: [1, 1.05, 1],
              }
            : {}
        }
        transition={{
          duration: 1,
          repeat: status?.isTyping ? Infinity : 0,
        }}
        className={`${sizeClasses[size]} rounded-full bg-benow-blue-100 border-2 border-benow-blue-200`}
      >
        <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
          <Bot className={`${iconSizes[size]} text-benow-blue-600`} />
        </div>
      </motion.div>

      {/* Status indicator */}
      <div className="absolute -bottom-0.5 -right-0.5">
        <div className="relative">
          <div
            className={`w-3 h-3 rounded-full border-2 border-white ${
              isOnline ? 'bg-green-500' : 'bg-gray-500'
            }`}
          />
          {isOnline && (
            <motion.div
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.7, 0, 0.7],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
              className="absolute inset-0 w-3 h-3 rounded-full bg-green-500"
            />
          )}
        </div>
      </div>
    </div>
  )
}
