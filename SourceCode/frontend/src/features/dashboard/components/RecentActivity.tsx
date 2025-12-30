import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import * as Icons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import Card from '@/shared/components/Card'
import type { RecentActivity as Activity } from '@/mocks/data/kpis'
import { cn } from '@/shared/utils/cn'

interface RecentActivityProps {
  activities: Activity[]
  maxItems?: number
}

export default function RecentActivity({ activities, maxItems = 8 }: RecentActivityProps) {
  const displayActivities = activities.slice(0, maxItems)

  const statusColors = {
    success: 'text-success-600 bg-success-50 border-success-200',
    error: 'text-error-600 bg-error-50 border-error-200',
    warning: 'text-warning-600 bg-warning-50 border-warning-200',
    info: 'text-benow-blue-600 bg-benow-blue-50 border-benow-blue-200',
  }

  return (
    <Card>
      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Icons.Activity className="w-5 h-5 text-benow-blue-600" />
        Recent Activity
      </h2>

      <div className="space-y-3">
        {displayActivities.map((activity, index) => {
          const IconComponent = (Icons[activity.icon as keyof typeof Icons] as LucideIcon) || Icons.Circle

          return (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group cursor-pointer"
            >
              {/* Icon */}
              <div
                className={cn(
                  'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center border',
                  statusColors[activity.status]
                )}
              >
                <IconComponent className="w-5 h-5" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 group-hover:text-benow-blue-600 transition-colors">
                  {activity.title}
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {activity.description}
                </p>
                <span className="text-xs text-muted-foreground mt-1 inline-block">
                  {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                </span>
              </div>

              {/* Status indicator */}
              <div
                className={cn(
                  'flex-shrink-0 w-2 h-2 rounded-full',
                  activity.status === 'success' && 'bg-success-600',
                  activity.status === 'error' && 'bg-error-600',
                  activity.status === 'warning' && 'bg-warning-600',
                  activity.status === 'info' && 'bg-benow-blue-600'
                )}
              />
            </motion.div>
          )
        })}
      </div>

      {/* View all button */}
      {activities.length > maxItems && (
        <button className="w-full mt-4 py-2 text-sm text-benow-blue-600 hover:text-benow-blue-700 transition-colors font-medium">
          View all {activities.length} activities →
        </button>
      )}
    </Card>
  )
}
