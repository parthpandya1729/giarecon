import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  FolderKanban,
  Clock,
  CheckCircle2,
  XCircle,
  PlayCircle,
  FileText,
  MoreVertical,
} from 'lucide-react'
import { format } from 'date-fns'
import Card from '@/shared/components/Card'
import type { Workspace } from '@/types/workspace.types'
import { cn } from '@/shared/utils/cn'

interface WorkspaceCardProps {
  workspace: Workspace
  index?: number
}

export default function WorkspaceCard({ workspace, index = 0 }: WorkspaceCardProps) {
  const navigate = useNavigate()

  const statusConfig = {
    active: {
      icon: FolderKanban,
      color: 'text-benow-blue-600',
      bg: 'bg-benow-blue-50',
      border: 'border-benow-blue-200',
      label: 'Active',
    },
    completed: {
      icon: CheckCircle2,
      color: 'text-success-600',
      bg: 'bg-success-50',
      border: 'border-success-200',
      label: 'Completed',
    },
    failed: {
      icon: XCircle,
      color: 'text-error-600',
      bg: 'bg-error-50',
      border: 'border-error-200',
      label: 'Failed',
    },
    running: {
      icon: PlayCircle,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      border: 'border-indigo-200',
      label: 'Running',
    },
    pending: {
      icon: Clock,
      color: 'text-warning-600',
      bg: 'bg-warning-50',
      border: 'border-warning-200',
      label: 'Pending',
    },
  }

  const config = statusConfig[workspace.status]
  const StatusIcon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      whileHover={{ y: -4 }}
    >
      <Card
        interactive
        className="cursor-pointer"
        onClick={() => navigate(`/workspaces/${workspace.id}`)}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3 flex-1">
            <div className={cn('p-2 rounded-lg', config.bg, config.border, 'border')}>
              <StatusIcon className={cn('w-5 h-5', config.color)} />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 mb-1 truncate">
                {workspace.name}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {workspace.description}
              </p>
            </div>
          </div>

          <button
            className="p-1 rounded hover:bg-gray-100 transition-colors"
            onClick={(e) => {
              e.stopPropagation()
              // Handle menu open
            }}
          >
            <MoreVertical className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Status badge */}
        <div className={cn('inline-flex items-center gap-1.5 px-2 py-1 rounded-full mb-4', config.bg, config.border, 'border')}>
          <div className={cn('w-1.5 h-1.5 rounded-full', config.color.replace('text-', 'bg-'), workspace.status === 'running' && 'animate-pulse')} />
          <span className={cn('text-xs font-medium', config.color)}>{config.label}</span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Total</div>
            <div className="text-lg font-bold text-gray-900">
              {workspace.stats.totalRecords.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Matched</div>
            <div className="text-lg font-bold text-success-600">
              {workspace.stats.matched.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Match %</div>
            <div className="text-lg font-bold text-benow-blue-600">
              {workspace.stats.matchPercentage?.toFixed(1) || 0}%
            </div>
          </div>
        </div>

        {/* Progress bar */}
        {workspace.stats.matchPercentage !== undefined && (
          <div className="mb-4 h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${workspace.stats.matchPercentage}%` }}
              transition={{ duration: 1, delay: index * 0.05 }}
              className="h-full bg-gradient-to-r from-success-600 to-benow-blue-600 rounded-full"
            />
          </div>
        )}

        {/* Files */}
        {workspace.files && (
          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
            {workspace.files.file1 && (
              <div className="flex items-center gap-1">
                <FileText className="w-3 h-3" />
                <span className="truncate max-w-[100px]">{workspace.files.file1.name}</span>
              </div>
            )}
            {workspace.files.file2 && (
              <div className="flex items-center gap-1">
                <FileText className="w-3 h-3" />
                <span className="truncate max-w-[100px]">{workspace.files.file2.name}</span>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-gray-200">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {workspace.lastRunAt
              ? `Last run ${format(workspace.lastRunAt, 'MMM dd, HH:mm')}`
              : 'Not run yet'}
          </div>
          {workspace.stats.processingTime && (
            <div>{(workspace.stats.processingTime / 1000).toFixed(1)}s</div>
          )}
        </div>
      </Card>
    </motion.div>
  )
}
