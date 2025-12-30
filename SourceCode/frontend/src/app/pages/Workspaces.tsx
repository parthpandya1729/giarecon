import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { FolderKanban } from 'lucide-react'
import WorkspaceList from '@/features/workspaces/components/WorkspaceList'
import { useWorkspaceStore } from '@/features/workspaces/store/workspaceStore'

export default function Workspaces() {
  const {
    workspaces,
    isLoading,
    error,
    loadWorkspaces,
    setFilters,
    clearError,
  } = useWorkspaceStore()

  useEffect(() => {
    document.title = 'Workspaces - GIA Reconciliation'
    loadWorkspaces()
  }, [])

  const handleSearch = (query: string) => {
    setFilters({ searchQuery: query })
    loadWorkspaces()
  }

  const handleFilterStatus = (status: any[]) => {
    setFilters({ status })
    loadWorkspaces()
  }

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-benow-blue-600 mb-2 flex items-center gap-3">
          <FolderKanban className="w-10 h-10" />
          Workspaces
        </h1>
        <p className="text-muted-foreground">
          Manage your reconciliation workspaces, upload files, and run reconciliations.
        </p>
      </motion.div>

      {/* Error message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center justify-between"
        >
          <span className="text-sm text-red-400">{error}</span>
          <button
            onClick={clearError}
            className="text-red-400 hover:text-red-300 text-sm font-medium"
          >
            Dismiss
          </button>
        </motion.div>
      )}

      {/* Workspace list */}
      <WorkspaceList
        workspaces={workspaces}
        isLoading={isLoading}
        onSearch={handleSearch}
        onFilterStatus={handleFilterStatus}
      />
    </div>
  )
}
