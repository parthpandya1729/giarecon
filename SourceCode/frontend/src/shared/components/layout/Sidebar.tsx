import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  FolderKanban,
  ScrollText,
  Settings,
} from 'lucide-react'
import { cn } from '@/shared/utils/cn'
import Card from '../Card'

const navigation = [
  {
    name: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    name: 'Workspaces',
    href: '/workspaces',
    icon: FolderKanban,
  },
  {
    name: 'Logs',
    href: '/logs',
    icon: ScrollText,
  },
  {
    name: 'Configuration',
    href: '/config',
    icon: Settings,
  },
]

export default function Sidebar() {
  return (
    <aside className="w-64 h-screen sticky top-0 p-4">
      <Card className="h-full flex flex-col">
        {/* Logo & Branding */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <img
              src="https://www.benow.in/assets/img/logo.png"
              alt="Benow Logo"
              className="h-10 w-auto"
            />
            <div>
              <h1 className="text-xl font-bold text-gray-900">GIA Recon</h1>
              <p className="text-xs text-gray-600">By Benow</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.href === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg',
                  'transition-all duration-200',
                  'hover:bg-gray-100',
                  isActive
                    ? 'bg-benow-blue-50 text-benow-blue-700 border-l-4 border-benow-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={cn(
                      'w-5 h-5 transition-colors',
                      isActive ? 'text-benow-blue-600' : 'text-gray-500'
                    )}
                  />
                  <span className="font-medium">{item.name}</span>
                  {isActive && (
                    <div className="ml-auto w-2 h-2 rounded-full bg-benow-blue-600" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg',
                'transition-all duration-200',
                'hover:bg-gray-100',
                isActive
                  ? 'bg-benow-blue-50 text-benow-blue-700'
                  : 'text-gray-600 hover:text-gray-900'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Settings className={cn('w-5 h-5', isActive ? 'text-benow-blue-600' : 'text-gray-500')} />
                <span className="font-medium">Settings</span>
              </>
            )}
          </NavLink>
        </div>
      </Card>
    </aside>
  )
}
