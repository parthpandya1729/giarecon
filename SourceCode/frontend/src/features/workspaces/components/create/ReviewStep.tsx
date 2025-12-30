import { Edit2, FileText, Settings, CheckCircle2, Tag } from 'lucide-react'
import Card from '@/shared/components/Card'
import Button from '@/shared/components/Button'
import { cn } from '@/shared/utils/cn'
import type { WizardFormData } from '@/types/workspace-create.types'
import { mockConfigTemplates } from '@/mocks/data/configs'

interface ReviewStepProps {
  data: WizardFormData
  onEdit: (step: number) => void
  onSubmit: () => void
  onBack: () => void
  isSubmitting: boolean
}

export default function ReviewStep({
  data,
  onEdit,
  onSubmit,
  onBack,
  isSubmitting,
}: ReviewStepProps) {
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const selectedTemplate = data.selectedConfigId
    ? mockConfigTemplates.find((t) => t.id === data.selectedConfigId)
    : null

  const primaryKeyMapping = data.mappings.find((m) => m.isPrimaryKey)

  return (
    <div className="space-y-6">
      <Card>
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Review & Submit</h3>
            <p className="text-sm text-gray-600">
              Review your workspace configuration before creating
            </p>
          </div>

          {/* Workspace Info */}
          <Card variant="outlined">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-benow-blue-50 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-benow-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Workspace Information</h4>
                  <p className="text-sm text-gray-500">Basic details</p>
                </div>
              </div>
              <button
                onClick={() => onEdit(1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Edit2 className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-700">Name:</span>
                <p className="text-gray-900 mt-1">{data.name}</p>
              </div>
              {data.description && (
                <div>
                  <span className="text-sm font-medium text-gray-700">Description:</span>
                  <p className="text-gray-600 mt-1">{data.description}</p>
                </div>
              )}
              {data.tags.length > 0 && (
                <div>
                  <span className="text-sm font-medium text-gray-700">Tags:</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {data.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-benow-blue-50 text-benow-blue-700 rounded-full text-sm"
                      >
                        <Tag className="w-3 h-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Files */}
          <Card variant="outlined">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-success-50 rounded-lg">
                  <FileText className="w-5 h-5 text-success-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Uploaded Files</h4>
                  <p className="text-sm text-gray-500">Files to reconcile</p>
                </div>
              </div>
              <button
                onClick={() => onEdit(2)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Edit2 className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.file1 && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-700 mb-2">File 1 (Internal)</div>
                  <p className="text-gray-900 font-medium mb-1">{data.file1.name}</p>
                  <div className="text-sm text-gray-600 space-y-0.5">
                    <p>{formatFileSize(data.file1.size)}</p>
                    <p>{data.file1.rows.toLocaleString()} rows</p>
                    <p>{data.file1.columns.length} columns</p>
                  </div>
                </div>
              )}
              {data.file2 && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-700 mb-2">File 2 (External)</div>
                  <p className="text-gray-900 font-medium mb-1">{data.file2.name}</p>
                  <div className="text-sm text-gray-600 space-y-0.5">
                    <p>{formatFileSize(data.file2.size)}</p>
                    <p>{data.file2.rows.toLocaleString()} rows</p>
                    <p>{data.file2.columns.length} columns</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Configuration */}
          <Card variant="outlined">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Settings className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Configuration</h4>
                  <p className="text-sm text-gray-500">
                    {data.useCustomConfig ? 'Custom configuration' : 'Template-based'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onEdit(3)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Edit2 className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            {selectedTemplate ? (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-900">{selectedTemplate.name}</p>
                <p className="text-sm text-gray-600 mt-1">{selectedTemplate.description}</p>
                <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                  <span>{selectedTemplate.config.mappings.length} mappings</span>
                  <span>{selectedTemplate.config.validationRules.length} validation rules</span>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-900">Custom Configuration</p>
                <p className="text-sm text-gray-600 mt-1">
                  Custom field mappings and validation rules
                </p>
              </div>
            )}
          </Card>

          {/* Field Mappings */}
          {data.useCustomConfig && (
            <Card variant="outlined">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-50 rounded-lg">
                    <FileText className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Field Mappings</h4>
                    <p className="text-sm text-gray-500">
                      {data.mappings.filter((m) => m.file2Column).length} of {data.mappings.length}{' '}
                      mapped
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onEdit(4)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4 text-gray-600" />
                </button>
              </div>
              <div className="space-y-2">
                {data.mappings
                  .filter((m) => m.file2Column)
                  .slice(0, 5)
                  .map((mapping) => (
                    <div
                      key={mapping.id}
                      className="flex items-center gap-2 text-sm p-2 bg-gray-50 rounded"
                    >
                      <span className="font-mono text-gray-700 bg-white px-2 py-0.5 rounded">
                        {mapping.file1Column}
                      </span>
                      <span className="text-gray-400">→</span>
                      <span className="font-mono text-gray-700 bg-white px-2 py-0.5 rounded">
                        {mapping.file2Column}
                      </span>
                      {mapping.isPrimaryKey && (
                        <span className="ml-auto px-2 py-0.5 bg-benow-blue-100 text-benow-blue-700 rounded text-xs font-medium">
                          Primary Key
                        </span>
                      )}
                    </div>
                  ))}
                {data.mappings.filter((m) => m.file2Column).length > 5 && (
                  <p className="text-sm text-gray-500 italic">
                    +{data.mappings.filter((m) => m.file2Column).length - 5} more mappings
                  </p>
                )}
              </div>
              {primaryKeyMapping && (
                <div className="mt-3 p-2 bg-benow-blue-50 rounded text-sm">
                  <span className="font-medium text-benow-blue-900">Primary Key:</span>{' '}
                  <span className="text-benow-blue-700">{primaryKeyMapping.file1Column}</span>
                </div>
              )}
            </Card>
          )}

          {/* Validation Rules */}
          {data.useCustomConfig && data.validationRules.length > 0 && (
            <Card variant="outlined">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-50 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Validation Rules</h4>
                    <p className="text-sm text-gray-500">{data.validationRules.length} rules</p>
                  </div>
                </div>
                <button
                  onClick={() => onEdit(5)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4 text-gray-600" />
                </button>
              </div>
              <div className="space-y-2">
                {data.validationRules.slice(0, 3).map((rule) => (
                  <div key={rule.id} className="p-2 bg-gray-50 rounded text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{rule.name}</span>
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-xs font-medium',
                          rule.severity === 'error'
                            ? 'bg-error-100 text-error-700'
                            : 'bg-warning-100 text-warning-700'
                        )}
                      >
                        {rule.severity}
                      </span>
                    </div>
                    <p className="text-gray-600 mt-1">
                      {rule.field} • {rule.ruleType}
                    </p>
                  </div>
                ))}
                {data.validationRules.length > 3 && (
                  <p className="text-sm text-gray-500 italic">
                    +{data.validationRules.length - 3} more rules
                  </p>
                )}
              </div>
            </Card>
          )}

          {/* Summary */}
          <Card variant="elevated" className="bg-benow-blue-50 border-benow-blue-200">
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Ready to Create</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Files</p>
                  <p className="font-medium text-gray-900">2 uploaded</p>
                </div>
                <div>
                  <p className="text-gray-600">Mappings</p>
                  <p className="font-medium text-gray-900">
                    {data.useCustomConfig
                      ? data.mappings.filter((m) => m.file2Column).length
                      : selectedTemplate?.config.mappings.length || 0}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Rules</p>
                  <p className="font-medium text-gray-900">
                    {data.useCustomConfig
                      ? data.validationRules.length
                      : selectedTemplate?.config.validationRules.length || 0}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Primary Key</p>
                  <p className="font-medium text-gray-900">
                    {data.useCustomConfig
                      ? primaryKeyMapping?.file1Column || 'None'
                      : selectedTemplate?.config.mappings.find((m) => m.isPrimaryKey)
                          ?.file1Column || 'None'}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button onClick={onBack} variant="secondary" size="lg" disabled={isSubmitting}>
          Back
        </Button>
        <Button onClick={onSubmit} size="lg" disabled={isSubmitting}>
          {isSubmitting ? 'Creating Workspace...' : 'Create Workspace'}
        </Button>
      </div>
    </div>
  )
}
