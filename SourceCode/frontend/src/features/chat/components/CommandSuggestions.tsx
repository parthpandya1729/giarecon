import { motion, AnimatePresence } from 'framer-motion'
import type { ChatSuggestion } from '@/types/chat.types'
import { Sparkles } from 'lucide-react'

interface CommandSuggestionsProps {
  suggestions: ChatSuggestion[]
  onSelectSuggestion: (suggestion: ChatSuggestion) => void
}

export default function CommandSuggestions({
  suggestions,
  onSelectSuggestion,
}: CommandSuggestionsProps) {
  if (suggestions.length === 0) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="px-4 pb-3"
      >
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-benow-blue-600" />
          <span className="text-xs text-benow-blue-600 font-medium">
            Suggested Actions
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion) => (
            <motion.button
              key={suggestion.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelectSuggestion(suggestion)}
              className="px-3 py-1.5 text-sm rounded-full bg-white border border-benow-blue-200 hover:border-benow-blue-400 text-gray-700 hover:text-benow-blue-700 transition-all"
            >
              {suggestion.text}
            </motion.button>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
