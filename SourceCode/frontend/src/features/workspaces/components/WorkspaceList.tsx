import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Filter, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import WorkspaceCard from './WorkspaceCard'
import Button from '@/shared/components/Button'
import LoadingSpinner from '@/shared/components/LoadingSpinner'
import type { Workspace } from '@/types/workspace.types'
import type { Status } from '@/types/common.types'

interface WorkspaceListProps {
  workspaces: Workspace[]
  isLoading?: boolean
  onSearch?: (query: string) => void
  onFilterStatus?: (status: Status[]) => void
}

export default function WorkspaceList({
  workspaces,
  isLoading,
  onSearch,
  onFilterStatus,
}: WorkspaceListProps) {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatuses, setSelectedStatuses] = useState<Status[]>([])
  const [showFilters, setShowFilters] = useState(false)

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    onSearch?.(value)
  }

  const handleStatusToggle = (status: Status) => {
    const newStatuses = selectedStatuses.includes(status)
      ? selectedStatuses.filter((s) => s !== status)
      : [...selectedStatuses, status]

    setSelectedStatuses(newStatuses)
    onFilterStatus?.(newStatuses)
  }

  const statuses: Status[] = ['active', 'completed', 'failed', 'running', 'pending']

  const statusColors = {
    active: 'bg-benow-blue-50 text-benow-blue-600 border-benow-blue-200',
    completed: 'bg-success-50 text-success-600 border-success-200',
    failed: 'bg-error-50 text-error-600 border-error-200',
    running: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    pending: 'bg-warning-50 text-warning-600 border-warning-200',
  }

  return (
    <div>
      {/* Header with search and filters */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search workspaces..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-benow-blue-600 focus:ring-2 focus:ring-benow-blue-600 transition-all"
            />
          </div>

          {/* Filter button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2.5 rounded-lg border transition-all flex items-center gap-2 ${
              showFilters
                ? 'bg-benow-blue-50 border-benow-blue-400 text-benow-blue-700'
                : 'bg-white border-gray-300 text-gray-700 hover:border-benow-blue-300'
            }`}
          >
            <Filter className="w-5 h-5" />
            Filters
            {selectedStatuses.length > 0 && (
              <span className="px-2 py-0.5 bg-benow-blue-600 text-white rounded-full text-xs font-bold">
                {selectedStatuses.length}
              </span>
            )}
          </button>

          {/* Create button */}
          <Button
            variant="primary"
            onClick={() => navigate('/workspaces/create')}
          >
            <Plus className="w-5 h-5 mr-2" />
            New Workspace
          </Button>
        </div>

        {/* Status filters */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-2"
          >
            <span className="text-sm text-muted-foreground py-2">Filter by status:</span>
            {statuses.map((status) => (
              <button
                key={status}
                onClick={() => handleStatusToggle(status)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all capitalize ${
                  selectedStatuses.includes(status)
                    ? statusColors[status]
                    : 'bg-white/5 text-muted-foreground border-white/10 hover:border-white/30'
                }`}
              >
                {status}
              </button>
            ))}
            {selectedStatuses.length > 0 && (
              <button
                onClick={() => {
                  setSelectedStatuses([])
                  onFilterStatus?.([])
                }}
                className="px-3 py-1.5 rounded-full text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
              >
                Clear
              </button>
            )}
          </motion.div>
        )}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && workspaces.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12"
        >
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-benow-blue-50 border border-benow-blue-200 flex items-center justify-center">
            <span className="text-4xl">📁</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No workspaces found</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            {searchQuery || selectedStatuses.length > 0
              ? 'No workspaces match your search criteria. Try adjusting your filters.'
              : 'Get started by creating your first reconciliation workspace.'}
          </p>
          <Button variant="primary" onClick={() => navigate('/workspaces/create')}>
            <Plus className="w-5 h-5 mr-2" />
            Create Workspace
          </Button>
        </motion.div>
      )}

      {/* Workspace grid */}
      {!isLoading && workspaces.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workspaces.map((workspace, index) => (
            <WorkspaceCard key={workspace.id} workspace={workspace} index={index} />
          ))}
        </div>
      )}

      {/* Results count */}
      {!isLoading && workspaces.length > 0 && (
        <div className="mt-6 text-center text-sm text-muted-foreground">
          Showing {workspaces.length} workspace{workspaces.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}
