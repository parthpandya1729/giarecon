import { useState } from 'react'
import { Plus, Edit2, Trash2, AlertCircle } from 'lucide-react'
import Card from '@/shared/components/Card'
import Button from '@/shared/components/Button'
import { cn } from '@/shared/utils/cn'
import type { ValidationRule, RuleType } from '@/types/config.types'
import type { FieldMapping } from '@/types/config.types'
import { nanoid } from 'nanoid'

interface ValidationRulesStepProps {
  data: {
    mappings: FieldMapping[]
    validationRules: ValidationRule[]
  }
  onChange: (rules: ValidationRule[]) => void
  onNext: () => void
  onBack: () => void
}

interface RuleFormData {
  name: string
  field: string
  ruleType: RuleType
  config: ValidationRule['config']
  severity: 'warning' | 'error'
}

export default function ValidationRulesStep({
  data,
  onChange,
  onNext,
  onBack,
}: ValidationRulesStepProps) {
  const [rules, setRules] = useState<ValidationRule[]>(data.validationRules)
  const [showRuleForm, setShowRuleForm] = useState(false)
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null)
  const [formData, setFormData] = useState<RuleFormData>({
    name: '',
    field: '',
    ruleType: 'required',
    config: {},
    severity: 'error',
  })

  const ruleTypes: { value: RuleType; label: string }[] = [
    { value: 'required', label: 'Required Field' },
    { value: 'numeric_range', label: 'Numeric Range' },
    { value: 'pattern', label: 'Pattern (Regex)' },
    { value: 'length', label: 'Length Validation' },
    { value: 'date_format', label: 'Date Format' },
    { value: 'unique_value', label: 'Unique Value' },
    { value: 'expression', label: 'Custom Expression' },
  ]

  const handleAddRule = () => {
    setEditingRuleId(null)
    setFormData({
      name: '',
      field: '',
      ruleType: 'required',
      config: {},
      severity: 'error',
    })
    setShowRuleForm(true)
  }

  const handleEditRule = (rule: ValidationRule) => {
    setEditingRuleId(rule.id)
    setFormData({
      name: rule.name,
      field: rule.field,
      ruleType: rule.ruleType,
      config: rule.config,
      severity: rule.severity,
    })
    setShowRuleForm(true)
  }

  const handleDeleteRule = (ruleId: string) => {
    const newRules = rules.filter((r) => r.id !== ruleId)
    setRules(newRules)
  }

  const handleSaveRule = () => {
    if (!formData.name || !formData.field) return

    const rule: ValidationRule = {
      id: editingRuleId || nanoid(),
      name: formData.name,
      field: formData.field,
      ruleType: formData.ruleType,
      config: formData.config,
      enabled: true,
      severity: formData.severity,
    }

    if (editingRuleId) {
      setRules(rules.map((r) => (r.id === editingRuleId ? rule : r)))
    } else {
      setRules([...rules, rule])
    }

    setShowRuleForm(false)
    setEditingRuleId(null)
  }

  const handleCancelRule = () => {
    setShowRuleForm(false)
    setEditingRuleId(null)
  }

  const handleNext = () => {
    onChange(rules)
    onNext()
  }

  const renderRuleConfig = () => {
    const { ruleType } = formData

    switch (ruleType) {
      case 'required':
        return (
          <div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={!formData.config.allowNull}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    config: { ...formData.config, allowNull: !e.target.checked },
                  })
                }
                className="w-4 h-4 text-benow-blue-600 border-gray-300 rounded focus:ring-benow-blue-600"
              />
              <span className="text-gray-700">Do not allow null/empty values</span>
            </label>
          </div>
        )

      case 'numeric_range':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Value
              </label>
              <input
                type="number"
                value={formData.config.minValue || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    config: { ...formData.config, minValue: parseFloat(e.target.value) },
                  })
                }
                placeholder="e.g., 0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-benow-blue-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Value
              </label>
              <input
                type="number"
                value={formData.config.maxValue || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    config: { ...formData.config, maxValue: parseFloat(e.target.value) },
                  })
                }
                placeholder="e.g., 1000000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-benow-blue-600"
              />
            </div>
          </div>
        )

      case 'pattern':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Regex Pattern
            </label>
            <input
              type="text"
              value={formData.config.pattern || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  config: { ...formData.config, pattern: e.target.value },
                })
              }
              placeholder="e.g., ^[A-Z]{3}\\d{6}$"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-benow-blue-600 font-mono text-sm"
            />
          </div>
        )

      case 'length':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Length
              </label>
              <input
                type="number"
                value={formData.config.minLength || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    config: { ...formData.config, minLength: parseInt(e.target.value) },
                  })
                }
                placeholder="e.g., 1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-benow-blue-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Length
              </label>
              <input
                type="number"
                value={formData.config.maxLength || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    config: { ...formData.config, maxLength: parseInt(e.target.value) },
                  })
                }
                placeholder="e.g., 100"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-benow-blue-600"
              />
            </div>
          </div>
        )

      case 'date_format':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Format
            </label>
            <input
              type="text"
              value={formData.config.dateFormat || 'YYYY-MM-DD'}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  config: { ...formData.config, dateFormat: e.target.value },
                })
              }
              placeholder="e.g., YYYY-MM-DD"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-benow-blue-600 font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Use format: YYYY (year), MM (month), DD (day)
            </p>
          </div>
        )

      case 'expression':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expression
            </label>
            <input
              type="text"
              value={formData.config.expression || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  config: { ...formData.config, expression: e.target.value },
                })
              }
              placeholder="e.g., value > 0 && value < 100"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-benow-blue-600 font-mono text-sm"
            />
          </div>
        )

      case 'unique_value':
        return (
          <div className="text-sm text-gray-600">
            This rule will ensure all values in the field are unique.
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Validation Rules</h3>
              <p className="text-sm text-gray-600">
                Add validation rules to ensure data quality (optional)
              </p>
            </div>
            {!showRuleForm && (
              <Button onClick={handleAddRule} variant="secondary" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Rule
              </Button>
            )}
          </div>

          {/* Rule Form */}
          {showRuleForm && (
            <Card variant="outlined" className="bg-benow-blue-50 border-benow-blue-200">
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">
                  {editingRuleId ? 'Edit Rule' : 'Add Validation Rule'}
                </h4>

                {/* Rule Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rule Name <span className="text-error-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Amount must be positive"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-benow-blue-600"
                  />
                </div>

                {/* Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Field <span className="text-error-600">*</span>
                  </label>
                  <select
                    value={formData.field}
                    onChange={(e) => setFormData({ ...formData, field: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-benow-blue-600"
                  >
                    <option value="">-- Select field --</option>
                    {data.mappings
                      .filter((m) => m.file2Column)
                      .map((m) => (
                        <option key={m.id} value={m.file1Column}>
                          {m.file1Column} ({m.dataType})
                        </option>
                      ))}
                  </select>
                </div>

                {/* Rule Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rule Type <span className="text-error-600">*</span>
                  </label>
                  <select
                    value={formData.ruleType}
                    onChange={(e) =>
                      setFormData({ ...formData, ruleType: e.target.value as RuleType })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-benow-blue-600"
                  >
                    {ruleTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Rule Configuration */}
                {renderRuleConfig()}

                {/* Error Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Error Message
                  </label>
                  <input
                    type="text"
                    value={formData.config.errorMessage || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        config: { ...formData.config, errorMessage: e.target.value },
                      })
                    }
                    placeholder="Custom error message (optional)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-benow-blue-600"
                  />
                </div>

                {/* Severity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="warning"
                        checked={formData.severity === 'warning'}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            severity: e.target.value as 'warning' | 'error',
                          })
                        }
                        className="w-4 h-4 text-warning-600 border-gray-300 focus:ring-warning-600"
                      />
                      <span className="text-sm text-gray-700">Warning</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="error"
                        checked={formData.severity === 'error'}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            severity: e.target.value as 'warning' | 'error',
                          })
                        }
                        className="w-4 h-4 text-error-600 border-gray-300 focus:ring-error-600"
                      />
                      <span className="text-sm text-gray-700">Error</span>
                    </label>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end gap-2">
                  <Button onClick={handleCancelRule} variant="ghost" size="sm">
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveRule}
                    disabled={!formData.name || !formData.field}
                    size="sm"
                  >
                    {editingRuleId ? 'Update Rule' : 'Add Rule'}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Rules List */}
          {rules.length > 0 ? (
            <div className="space-y-3">
              {rules.map((rule) => (
                <Card key={rule.id} variant="outlined">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h5 className="font-medium text-gray-900">{rule.name}</h5>
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
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>
                          <span className="font-medium">Field:</span> {rule.field}
                        </p>
                        <p>
                          <span className="font-medium">Type:</span>{' '}
                          {ruleTypes.find((t) => t.value === rule.ruleType)?.label}
                        </p>
                        {rule.config.errorMessage && (
                          <p className="italic text-gray-500">{rule.config.errorMessage}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditRule(rule)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="p-2 hover:bg-error-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-error-600" />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            !showRuleForm && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertCircle className="w-12 h-12 text-gray-400 mb-3" />
                <p className="text-gray-600">No validation rules added yet</p>
                <p className="text-sm text-gray-500 mt-1">
                  Click "Add Rule" to create your first validation rule
                </p>
              </div>
            )
          )}
        </div>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button onClick={onBack} variant="secondary" size="lg">
          Back
        </Button>
        <Button onClick={handleNext} size="lg">
          Next: Review & Submit
        </Button>
      </div>
    </div>
  )
}
