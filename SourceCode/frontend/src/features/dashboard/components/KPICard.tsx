import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import * as Icons from 'lucide-react'
import Card from '@/shared/components/Card'
import LiveCounter from '@/features/visualizations/components/LiveCounter'
import type { KPIMetric } from '@/mocks/data/kpis'
import { cn } from '@/shared/utils/cn'

interface KPICardProps {
  metric: KPIMetric
  index?: number
}

export default function KPICard({ metric, index = 0 }: KPICardProps) {
  // Get the icon component dynamically
  const IconComponent = metric.icon
    ? (Icons[metric.icon as keyof typeof Icons] as LucideIcon)
    : Icons.Activity

  // Get trend icon
  const TrendIcon =
    metric.trend === 'up'
      ? TrendingUp
      : metric.trend === 'down'
      ? TrendingDown
      : Minus

  // Determine color classes based on metric color
  const colorClasses = {
    cyan: {
      icon: 'text-benow-blue-600',
      bg: 'bg-benow-blue-50',
      border: 'border-benow-blue-200',
      trend: 'text-benow-blue-600',
    },
    purple: {
      icon: 'text-indigo-600',
      bg: 'bg-indigo-50',
      border: 'border-indigo-200',
      trend: 'text-indigo-600',
    },
    pink: {
      icon: 'text-purple-600',
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      trend: 'text-purple-600',
    },
    green: {
      icon: 'text-success-600',
      bg: 'bg-success-50',
      border: 'border-success-200',
      trend: 'text-success-600',
    },
    orange: {
      icon: 'text-warning-600',
      bg: 'bg-warning-50',
      border: 'border-warning-200',
      trend: 'text-warning-600',
    },
  }

  const colors = colorClasses[metric.color as keyof typeof colorClasses] || colorClasses.cyan

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.1 }}
    >
      <Card interactive className="hover:scale-[1.02] transition-transform duration-200">
        <div className="flex items-start justify-between mb-4">
          {/* Icon */}
          <div className={cn('p-3 rounded-lg', colors.bg, colors.border, 'border')}>
            <IconComponent className={cn('w-6 h-6', colors.icon)} />
          </div>

          {/* Trend indicator */}
          {metric.change !== 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                metric.trend === 'up' ? 'bg-green-500/10 text-green-500' : '',
                metric.trend === 'down' ? 'bg-red-500/10 text-red-500' : '',
                metric.trend === 'neutral' ? 'bg-gray-500/10 text-gray-500' : ''
              )}
            >
              <TrendIcon className="w-3 h-3" />
              {Math.abs(metric.change).toFixed(1)}%
            </motion.div>
          )}
        </div>

        {/* Label */}
        <h3 className="text-sm text-muted-foreground mb-2">{metric.label}</h3>

        {/* Value with animation */}
        <div className={cn('text-3xl font-bold', colors.icon)}>
          {metric.format === 'text' ? (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 + index * 0.1 }}
            >
              {metric.value}
            </motion.span>
          ) : metric.format === 'time' ? (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 + index * 0.1 }}
            >
              {metric.value}
            </motion.span>
          ) : (
            <LiveCounter
              value={typeof metric.value === 'number' ? metric.value : 0}
              format={metric.format}
              decimals={metric.format === 'percentage' ? 1 : 0}
              duration={1200}
            />
          )}
        </div>

        {/* Animated progress bar (optional) */}
        {metric.format === 'percentage' && typeof metric.value === 'number' && (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ delay: 0.4 + index * 0.1, duration: 0.8 }}
            className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden"
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${metric.value}%` }}
              transition={{ delay: 0.6 + index * 0.1, duration: 1, ease: 'easeOut' }}
              className={cn('h-full rounded-full', colors.icon.replace('text-', 'bg-'))}
            />
          </motion.div>
        )}
      </Card>
    </motion.div>
  )
}
