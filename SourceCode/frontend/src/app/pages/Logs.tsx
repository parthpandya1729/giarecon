import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { FileText } from 'lucide-react'
import { useLogStore } from '@/features/logs/store/logStore'
import LogStats from '@/features/logs/components/LogStats'
import LogFilters from '@/features/logs/components/LogFilters'
import LogViewer from '@/features/logs/components/LogViewer'
import LogDetails from '@/features/logs/components/LogDetails'
import LogExport from '@/features/logs/components/LogExport'
import type { LogEntry } from '@/types/log.types'

export default function Logs() {
  const {
    filteredLogs,
    filters,
    isLoading,
    stats,
    error,
    loadLogs,
    applyFilters,
    clearFilters,
    exportLogs,
    setError,
  } = useLogStore()

  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  useEffect(() => {
    document.title = 'Agent Activity Logs - GIA Reconciliation'
    loadLogs()
  }, [loadLogs])

  const handleSelectLog = (log: LogEntry) => {
    setSelectedLog(log)
    setIsDetailsOpen(true)
  }

  const handleCloseDetails = () => {
    setIsDetailsOpen(false)
    setTimeout(() => setSelectedLog(null), 300)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-benow-blue-600 mb-2 flex items-center gap-3">
          <FileText className="w-10 h-10" />
          Agent Activity Logs
        </h1>
        <p className="text-muted-foreground">
          Monitor all agent activities, system events, and reconciliation processes with detailed
          logs and filtering capabilities.
        </p>
      </motion.div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-error-500/10 border border-error-500/30 rounded-lg flex items-center justify-between"
        >
          <span className="text-sm text-error-600">{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-error-600 hover:text-error-700 text-sm font-medium"
          >
            Dismiss
          </button>
        </motion.div>
      )}

      {/* Stats Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-xl font-semibold text-white mb-4">Overview</h2>
        <LogStats stats={stats} isLoading={isLoading} />
      </motion.section>

      {/* Filters Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Filter Logs</h2>
          <LogExport onExport={exportLogs} logCount={filteredLogs.length} />
        </div>
        <LogFilters
          filters={filters}
          onApplyFilters={applyFilters}
          onClearFilters={clearFilters}
        />
      </motion.section>

      {/* Logs Table Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">
            Activity Logs
            {filteredLogs.length !== stats?.totalLogs && (
              <span className="ml-2 text-sm font-normal text-gray-400">
                (Filtered: {filteredLogs.length} of {stats?.totalLogs})
              </span>
            )}
          </h2>
        </div>
        <LogViewer logs={filteredLogs} isLoading={isLoading} onSelectLog={handleSelectLog} />
      </motion.section>

      {/* Log Details Drawer */}
      <LogDetails log={selectedLog} isOpen={isDetailsOpen} onClose={handleCloseDetails} />
    </div>
  )
}
