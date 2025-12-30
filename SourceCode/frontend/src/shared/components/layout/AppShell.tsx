import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import GradientBackground from '../GradientBackground'
import ChatContainer from '@/features/chat/components/ChatContainer'

export default function AppShell() {
  return (
    <div className="relative min-h-screen">
      {/* Animated background */}
      <GradientBackground />

      {/* Main layout */}
      <div className="flex">
        {/* Sidebar */}
        <Sidebar />

        {/* Main content area */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Header */}
          <Header />

          {/* Page content */}
          <main className="flex-1 p-6">
            <div className="animate-fade-in">
              <Outlet />
            </div>
          </main>

          {/* Footer */}
          <footer className="p-6 text-center text-sm text-muted-foreground border-t border-gray-200">
            <p>
              Built with{' '}
              <span className="text-benow-blue-600">⚡</span> by GIA
              Development Team
            </p>
          </footer>
        </div>
      </div>

      {/* Chat overlay - accessible from all pages */}
      <ChatContainer />
    </div>
  )
}
