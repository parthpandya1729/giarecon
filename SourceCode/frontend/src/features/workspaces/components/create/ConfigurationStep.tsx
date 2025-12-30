import { useState } from 'react'
import { Settings, CheckCircle2, FileText, AlertCircle } from 'lucide-react'
import Card from '@/shared/components/Card'
import Button from '@/shared/components/Button'
import { cn } from '@/shared/utils/cn'
import { mockConfigTemplates } from '@/mocks/data/configs'
import type { ConfigTemplate } from '@/types/config.types'

interface ConfigurationStepProps {
  data: {
    selectedConfigId?: string
    useCustomConfig: boolean
  }
  onChange: (data: { selectedConfigId?: string; useCustomConfig: boolean }) => void
  onNext: () => void
  onBack: () => void
}

export default function ConfigurationStep({ data, onChange, onNext, onBack }: ConfigurationStepProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<ConfigTemplate | null>(
    data.selectedConfigId
      ? mockConfigTemplates.find((t) => t.id === data.selectedConfigId) || null
      : null
  )

  const handleTemplateSelect = (template: ConfigTemplate) => {
    setSelectedTemplate(template)
    onChange({ selectedConfigId: template.id, useCustomConfig: false })
  }

  const handleCreateCustom = () => {
    setSelectedTemplate(null)
    onChange({ selectedConfigId: undefined, useCustomConfig: true })
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      finance: 'bg-blue-100 text-blue-700',
      inventory: 'bg-purple-100 text-purple-700',
      hr: 'bg-green-100 text-green-700',
      sales: 'bg-orange-100 text-orange-700',
      custom: 'bg-gray-100 text-gray-700',
    }
    return colors[category] || colors.custom
  }

  const isValid = data.selectedConfigId || data.useCustomConfig

  return (
    <div className="space-y-6">
      <Card>
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Select Configuration</h3>
            <p className="text-sm text-gray-600">
              Choose an existing template or create a custom configuration
            </p>
          </div>

          {/* Create Custom Option */}
          <Card
            variant="outlined"
            interactive
            className={cn(
              'transition-all cursor-pointer',
              data.useCustomConfig && 'ring-2 ring-benow-blue-600 border-benow-blue-600'
            )}
            onClick={handleCreateCustom}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-benow-blue-50 rounded-lg">
                <Settings className="w-6 h-6 text-benow-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">Create Custom Configuration</h4>
                <p className="text-sm text-gray-600">
                  Define your own field mappings and validation rules
                </p>
              </div>
              {data.useCustomConfig && (
                <CheckCircle2 className="w-6 h-6 text-benow-blue-600" />
              )}
            </div>
          </Card>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-gray-300" />
            <span className="text-sm text-gray-500 font-medium">OR</span>
            <div className="flex-1 h-px bg-gray-300" />
          </div>

          {/* Template List */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Choose from Templates</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mockConfigTemplates.map((template) => {
                const isSelected = selectedTemplate?.id === template.id

                return (
                  <Card
                    key={template.id}
                    variant="outlined"
                    interactive
                    className={cn(
                      'transition-all cursor-pointer',
                      isSelected && 'ring-2 ring-benow-blue-600 border-benow-blue-600'
                    )}
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900">{template.name}</h5>
                          <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="w-5 h-5 text-benow-blue-600 flex-shrink-0" />
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'px-2 py-1 rounded-full text-xs font-medium',
                            getCategoryColor(template.category)
                          )}
                        >
                          {template.category}
                        </span>
                        <span className="text-xs text-gray-500">
                          {template.usageCount} uses
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-gray-600">
                        <div className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          <span>{template.config.mappings.length} mappings</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          <span>{template.config.validationRules.length} rules</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Template Preview */}
          {selectedTemplate && (
            <Card variant="elevated" className="bg-benow-blue-50 border-benow-blue-200">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-benow-blue-100 rounded-lg">
                    <Settings className="w-5 h-5 text-benow-blue-600" />
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900">Selected Template</h5>
                    <p className="text-sm text-gray-600">{selectedTemplate.name}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h6 className="text-xs font-medium text-gray-700 mb-2">Field Mappings</h6>
                    <div className="space-y-1">
                      {selectedTemplate.config.mappings.slice(0, 3).map((mapping) => (
                        <div
                          key={mapping.id}
                          className="text-xs text-gray-600 flex items-center gap-2"
                        >
                          <span className="font-mono bg-white px-2 py-0.5 rounded">
                            {mapping.file1Column}
                          </span>
                          →
                          <span className="font-mono bg-white px-2 py-0.5 rounded">
                            {mapping.file2Column}
                          </span>
                        </div>
                      ))}
                      {selectedTemplate.config.mappings.length > 3 && (
                        <p className="text-xs text-gray-500 italic">
                          +{selectedTemplate.config.mappings.length - 3} more mappings
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h6 className="text-xs font-medium text-gray-700 mb-2">Validation Rules</h6>
                    <div className="space-y-1">
                      {selectedTemplate.config.validationRules.slice(0, 3).map((rule) => (
                        <div key={rule.id} className="text-xs text-gray-600">
                          <span className="font-medium">{rule.name}</span>
                          <span className="text-gray-500"> ({rule.ruleType})</span>
                        </div>
                      ))}
                      {selectedTemplate.config.validationRules.length > 3 && (
                        <p className="text-xs text-gray-500 italic">
                          +{selectedTemplate.config.validationRules.length - 3} more rules
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button onClick={onBack} variant="secondary" size="lg">
          Back
        </Button>
        <Button onClick={onNext} disabled={!isValid} size="lg">
          {data.useCustomConfig ? 'Next: Field Mapping' : 'Next: Review'}
        </Button>
      </div>
    </div>
  )
}
