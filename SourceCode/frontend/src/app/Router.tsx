import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import AppShell from '@/shared/components/layout/AppShell'
import Dashboard from './pages/Dashboard'
import Workspaces from './pages/Workspaces'
import WorkspaceCreate from './pages/WorkspaceCreate'
import Logs from './pages/Logs'
import Configuration from './pages/Configuration'

// Placeholder pages - will be created in later phases
const DashboardPage = Dashboard
const WorkspacesPage = Workspaces
const WorkspaceCreatePage = WorkspaceCreate
const LogsPage = Logs
const ConfigPage = Configuration

const SettingsPage = () => (
  <div className="p-6">
    <h1 className="text-4xl font-bold text-success-600 mb-4">Settings</h1>
    <p className="text-muted-foreground">Settings page coming soon...</p>
  </div>
)

const NotFoundPage = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <h1 className="text-9xl font-bold text-benow-blue-600 mb-4">
        404
      </h1>
      <p className="text-2xl text-muted-foreground mb-8">Page Not Found</p>
      <a href="/" className="text-benow-blue-600 hover:text-benow-blue-700 transition-colors">
        Return to Dashboard
      </a>
    </div>
  </div>
)

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'workspaces',
        element: <WorkspacesPage />,
      },
      {
        path: 'workspaces/create',
        element: <WorkspaceCreatePage />,
      },
      {
        path: 'logs',
        element: <LogsPage />,
      },
      {
        path: 'config',
        element: <ConfigPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])

export default function Router() {
  return <RouterProvider router={router} />
}
