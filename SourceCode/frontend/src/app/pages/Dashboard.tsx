import { useEffect } from 'react'
import { motion } from 'framer-motion'
import KPICard from '@/features/dashboard/components/KPICard'
import RecentActivity from '@/features/dashboard/components/RecentActivity'
import QuickActions from '@/features/dashboard/components/QuickActions'
import SystemStatus from '@/features/dashboard/components/SystemStatus'
import {
  dashboardKPIs,
  recentActivities,
  quickActions,
  systemHealth,
} from '@/mocks/data/kpis'

export default function Dashboard() {
  useEffect(() => {
    document.title = 'Dashboard - GIA Reconciliation'
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-benow-blue-600 mb-2 flex items-center gap-3">
          <span className="text-3xl">📊</span>
          Dashboard
        </h1>
        <p className="text-muted-foreground">
          Welcome to GIA Reconciliation Agent. Monitor your reconciliation workflows and
          system performance.
        </p>
      </motion.div>

      {/* Overview KPIs */}
      <section>
        <h2 className="text-xl font-semibold text-white mb-4">Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {dashboardKPIs.overview.map((metric, index) => (
            <KPICard key={metric.label} metric={metric} index={index} />
          ))}
        </div>
      </section>

      {/* Performance Metrics */}
      <section>
        <h2 className="text-xl font-semibold text-white mb-4">Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {dashboardKPIs.performance.map((metric, index) => (
            <KPICard key={metric.label} metric={metric} index={index} />
          ))}
        </div>
      </section>

      {/* Quality Metrics */}
      <section>
        <h2 className="text-xl font-semibold text-white mb-4">Quality Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {dashboardKPIs.quality.map((metric, index) => (
            <KPICard key={metric.label} metric={metric} index={index} />
          ))}
        </div>
      </section>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <RecentActivity activities={recentActivities} />

        {/* Quick Actions */}
        <QuickActions actions={quickActions} />
      </div>

      {/* System Status */}
      <SystemStatus health={systemHealth} />
    </div>
  )
}
