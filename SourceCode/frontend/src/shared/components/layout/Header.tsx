import { Bell, Search, User } from 'lucide-react'
import Card from '../Card'
import { cn } from '@/shared/utils/cn'

export default function Header() {
  return (
    <header className="sticky top-0 z-40 p-4">
      <Card className="flex items-center justify-between px-6 py-4">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search workspaces, logs, configs..."
              className={cn(
                'w-full pl-10 pr-4 py-2 rounded-lg',
                'bg-gray-50 border border-gray-300',
                'text-gray-900 placeholder:text-gray-500',
                'focus:outline-none focus:ring-2 focus:ring-benow-blue-600 focus:border-transparent',
                'transition-all duration-200'
              )}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 ml-6">
          {/* Notifications */}
          <button
            className={cn(
              'relative p-2 rounded-lg',
              'hover:bg-gray-100 transition-colors',
              'group'
            )}
          >
            <Bell className="w-5 h-5 text-gray-600 group-hover:text-benow-blue-600 transition-colors" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-error-500 rounded-full animate-pulse" />
          </button>

          {/* User Profile */}
          <button
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg',
              'hover:bg-gray-100 transition-colors'
            )}
          >
            <div className="w-8 h-8 rounded-full bg-benow-blue-600 flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900">Agent</p>
              <p className="text-xs text-gray-600">Online</p>
            </div>
          </button>
        </div>
      </Card>
    </header>
  )
}
