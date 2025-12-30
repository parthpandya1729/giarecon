import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import * as Icons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import Card from '@/shared/components/Card'
import type { QuickAction } from '@/mocks/data/kpis'
import { cn } from '@/shared/utils/cn'

interface QuickActionsProps {
  actions: QuickAction[]
}

export default function QuickActions({ actions }: QuickActionsProps) {
  const navigate = useNavigate()

  const colorVariants = {
    cyan: 'bg-benow-blue-50 border-benow-blue-200 hover:border-benow-blue-400 hover:shadow-card-hover',
    purple: 'bg-indigo-50 border-indigo-200 hover:border-indigo-400 hover:shadow-card-hover',
    pink: 'bg-purple-50 border-purple-200 hover:border-purple-400 hover:shadow-card-hover',
    green: 'bg-success-50 border-success-200 hover:border-success-400 hover:shadow-card-hover',
  }

  const iconColors = {
    cyan: 'text-benow-blue-600',
    purple: 'text-indigo-600',
    pink: 'text-purple-600',
    green: 'text-success-600',
  }

  return (
    <Card>
      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Icons.Zap className="w-5 h-5 text-benow-blue-600" />
        Quick Actions
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {actions.map((action, index) => {
          const IconComponent =
            (Icons[action.icon as keyof typeof Icons] as LucideIcon) || Icons.Circle

          return (
            <motion.button
              key={action.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => action.enabled && navigate(action.action)}
              disabled={!action.enabled}
              className={cn(
                'p-4 rounded-lg border transition-all duration-200 text-left',
                colorVariants[action.color],
                !action.enabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div
                  className={cn(
                    'flex-shrink-0 w-10 h-10 rounded-lg bg-white flex items-center justify-center border',
                    iconColors[action.color]
                  )}
                >
                  <IconComponent className="w-5 h-5" />
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className={cn('font-semibold mb-1', iconColors[action.color])}>
                    {action.label}
                  </h3>
                  <p className="text-xs text-muted-foreground">{action.description}</p>
                </div>
              </div>
            </motion.button>
          )
        })}
      </div>
    </Card>
  )
}
