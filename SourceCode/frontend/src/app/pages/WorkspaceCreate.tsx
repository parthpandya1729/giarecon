import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Button from '@/shared/components/Button'
import CreateWorkspaceWizard from '@/features/workspaces/components/create/CreateWorkspaceWizard'

export default function WorkspaceCreate() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            onClick={() => navigate('/workspaces')}
            variant="ghost"
            size="sm"
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Workspaces
          </Button>

          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create Workspace</h1>
            <p className="text-gray-600 mt-2">
              Set up a new reconciliation workspace by following the steps below
            </p>
          </div>
        </div>

        {/* Wizard */}
        <CreateWorkspaceWizard />
      </div>
    </div>
  )
}
