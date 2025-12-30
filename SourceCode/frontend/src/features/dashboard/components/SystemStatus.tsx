import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { Server, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import Card from '@/shared/components/Card'
import type { SystemHealth } from '@/mocks/data/kpis'
import { cn } from '@/shared/utils/cn'

interface SystemStatusProps {
  health: SystemHealth
}

export default function SystemStatus({ health }: SystemStatusProps) {
  const overallStatusConfig = {
    healthy: {
      icon: CheckCircle2,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
      border: 'border-green-500/30',
      label: 'All Systems Operational',
    },
    degraded: {
      icon: AlertCircle,
      color: 'text-yellow-500',
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/30',
      label: 'Degraded Performance',
    },
    down: {
      icon: XCircle,
      color: 'text-red-500',
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      label: 'System Issues Detected',
    },
  }

  const statusConfig = overallStatusConfig[health.overall]
  const StatusIcon = statusConfig.icon

  const serviceStatusConfig = {
    online: {
      color: 'text-green-500',
      bg: 'bg-green-500',
      label: 'Online',
    },
    offline: {
      color: 'text-red-500',
      bg: 'bg-red-500',
      label: 'Offline',
    },
    degraded: {
      color: 'text-yellow-500',
      bg: 'bg-yellow-500',
      label: 'Degraded',
    },
  }

  return (
    <Card>
      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Server className="w-5 h-5 text-benow-blue-600" />
        System Status
      </h2>

      {/* Overall status */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'mb-6 p-4 rounded-lg border flex items-center gap-3',
          statusConfig.bg,
          statusConfig.border
        )}
      >
        <StatusIcon className={cn('w-6 h-6', statusConfig.color)} />
        <div className="flex-1">
          <h3 className={cn('font-semibold', statusConfig.color)}>
            {statusConfig.label}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Last updated {formatDistanceToNow(health.lastUpdate, { addSuffix: true })}
          </p>
        </div>
      </motion.div>

      {/* Individual services */}
      <div className="space-y-3">
        {health.services.map((service, index) => {
          const config = serviceStatusConfig[service.status]

          return (
            <motion.div
              key={service.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {/* Status indicator */}
                <div className="relative">
                  <div className={cn('w-3 h-3 rounded-full', config.bg)} />
                  {service.status === 'online' && (
                    <motion.div
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.7, 0, 0.7],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                      }}
                      className={cn('absolute inset-0 w-3 h-3 rounded-full', config.bg)}
                    />
                  )}
                </div>

                {/* Service name */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{service.name}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={cn('text-xs', config.color)}>
                      {config.label}
                    </span>
                    {service.responseTime && (
                      <>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">
                          {service.responseTime}ms
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Uptime */}
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  {service.uptime.toFixed(2)}%
                </div>
                <div className="text-xs text-muted-foreground">uptime</div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* View details button */}
      <button className="w-full mt-4 py-2 text-sm text-benow-blue-600 hover:text-benow-blue-700 transition-colors font-medium">
        View detailed status →
      </button>
    </Card>
  )
}
