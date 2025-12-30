import { motion } from 'framer-motion'

export default function TypingIndicator() {
  return (
    <div className="flex items-center space-x-2 px-4 py-3 bg-gray-100 rounded-lg w-fit">
      <span className="text-sm text-muted-foreground">GIA is typing</span>
      <div className="flex space-x-1">
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className="w-2 h-2 bg-benow-blue-600 rounded-full"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: index * 0.2,
            }}
          />
        ))}
      </div>
    </div>
  )
}
