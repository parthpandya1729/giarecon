import { useState, useRef, KeyboardEvent } from 'react'
import { Send, Paperclip } from 'lucide-react'
import { motion } from 'framer-motion'

interface ChatInputProps {
  onSendMessage: (message: string) => void
  disabled?: boolean
}

export default function ChatInput({ onSendMessage, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = () => {
    if (!message.trim() || disabled) return

    onSendMessage(message.trim())
    setMessage('')

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }

  return (
    <div className="p-4 border-t border-gray-200 bg-white">
      <div className="flex items-end gap-2">
        {/* Attachment button (future feature) */}
        <button
          className="p-2 rounded-lg text-gray-500 hover:text-benow-blue-600 hover:bg-benow-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled
          title="Attachments (coming soon)"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        {/* Text input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Ask GIA anything..."
            disabled={disabled}
            rows={1}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-benow-blue-600 focus:ring-2 focus:ring-benow-blue-600 resize-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ minHeight: '44px', maxHeight: '120px' }}
          />

          {/* Character count (optional) */}
          {message.length > 0 && (
            <div className="absolute bottom-1 right-2 text-xs text-muted-foreground">
              {message.length}
            </div>
          )}
        </div>

        {/* Send button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSend}
          disabled={!message.trim() || disabled}
          className="p-3 rounded-lg bg-benow-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:bg-benow-blue-700"
        >
          <Send className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Helper text */}
      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>Press Enter to send, Shift+Enter for new line</span>
        {disabled && <span className="text-warning-600">Sending...</span>}
      </div>
    </div>
  )
}
