import { useState, useEffect } from 'react'
import { ArrowRight, Key, Wand2, AlertTriangle } from 'lucide-react'
import Card from '@/shared/components/Card'
import Button from '@/shared/components/Button'
import { cn } from '@/shared/utils/cn'
import type { FieldMapping, DataType } from '@/types/config.types'
import type { UploadedFile } from '@/types/workspace-create.types'
import { nanoid } from 'nanoid'

interface FieldMappingStepProps {
  data: {
    file1?: UploadedFile
    file2?: UploadedFile
    mappings: FieldMapping[]
  }
  onChange: (mappings: FieldMapping[]) => void
  onNext: () => void
  onBack: () => void
}

export default function FieldMappingStep({ data, onChange, onNext, onBack }: FieldMappingStepProps) {
  const [mappings, setMappings] = useState<FieldMapping[]>(data.mappings)
  const [unmappedColumns, setUnmappedColumns] = useState<string[]>([])

  useEffect(() => {
    // Initialize mappings if empty
    if (data.file1 && mappings.length === 0) {
      const initialMappings: FieldMapping[] = data.file1.columns.map((col, idx) => ({
        id: nanoid(),
        file1Column: col,
        file2Column: '',
        isPrimaryKey: idx === 0, // First column as primary key by default
        dataType: inferDataType(col),
        isRequired: idx === 0,
      }))
      setMappings(initialMappings)
    }
  }, [data.file1])

  useEffect(() => {
    // Track unmapped columns
    const unmapped = mappings.filter((m) => !m.file2Column).map((m) => m.file1Column)
    setUnmappedColumns(unmapped)
  }, [mappings])

  const inferDataType = (columnName: string): DataType => {
    const lower = columnName.toLowerCase()
    if (lower.includes('date')) return 'date'
    if (lower.includes('amount') || lower.includes('price') || lower.includes('cost')) return 'currency'
    if (lower.includes('email')) return 'email'
    if (lower.includes('phone')) return 'phone'
    if (lower.includes('count') || lower.includes('quantity') || lower.includes('qty')) return 'number'
    return 'string'
  }

  const getSimilarityScore = (str1: string, str2: string): number => {
    const s1 = str1.toLowerCase().replace(/[_\s-]/g, '')
    const s2 = str2.toLowerCase().replace(/[_\s-]/g, '')

    if (s1 === s2) return 1.0
    if (s1.includes(s2) || s2.includes(s1)) return 0.8

    // Simple Levenshtein-like scoring
    let matches = 0
    const minLen = Math.min(s1.length, s2.length)
    for (let i = 0; i < minLen; i++) {
      if (s1[i] === s2[i]) matches++
    }
    return matches / Math.max(s1.length, s2.length)
  }

  const handleAutoMap = () => {
    if (!data.file2) return

    const newMappings = mappings.map((mapping) => {
      if (mapping.file2Column) return mapping // Already mapped

      // Find best match
      let bestMatch = ''
      let bestScore = 0

      data.file2!.columns.forEach((col2) => {
        const score = getSimilarityScore(mapping.file1Column, col2)
        if (score > bestScore && score > 0.5) {
          bestScore = score
          bestMatch = col2
        }
      })

      return {
        ...mapping,
        file2Column: bestMatch,
      }
    })

    setMappings(newMappings)
  }

  const handleMappingChange = (
    mappingId: string,
    field: keyof FieldMapping,
    value: any
  ) => {
    setMappings((prev) =>
      prev.map((m) =>
        m.id === mappingId
          ? {
              ...m,
              [field]: value,
              // If setting as primary key, unset others
              ...(field === 'isPrimaryKey' && value
                ? { isRequired: true }
                : {}),
            }
          : field === 'isPrimaryKey' && value
          ? { ...m, isPrimaryKey: false }
          : m
      )
    )
  }

  const handleSave = () => {
    onChange(mappings)
    onNext()
  }

  const hasPrimaryKey = mappings.some((m) => m.isPrimaryKey)
  const hasUnmapped = unmappedColumns.length > 0
  const isValid = hasPrimaryKey

  const dataTypes: DataType[] = ['string', 'number', 'date', 'currency', 'email', 'phone', 'boolean']

  return (
    <div className="space-y-6">
      <Card>
        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Field Mapping</h3>
              <p className="text-sm text-gray-600">
                Map columns from File 1 to corresponding columns in File 2
              </p>
            </div>
            <Button onClick={handleAutoMap} variant="secondary" size="sm">
              <Wand2 className="w-4 h-4 mr-2" />
              Auto-Map
            </Button>
          </div>

          {/* Warnings */}
          {!hasPrimaryKey && (
            <div className="flex items-center gap-2 p-3 bg-error-50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-error-600" />
              <p className="text-sm text-error-700 font-medium">
                Please select at least one primary key field
              </p>
            </div>
          )}

          {hasUnmapped && hasPrimaryKey && (
            <div className="flex items-center gap-2 p-3 bg-warning-50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-warning-600" />
              <p className="text-sm text-warning-700">
                {unmappedColumns.length} column(s) are unmapped:{' '}
                <span className="font-medium">{unmappedColumns.slice(0, 3).join(', ')}</span>
                {unmappedColumns.length > 3 && ` +${unmappedColumns.length - 3} more`}
              </p>
            </div>
          )}

          {/* Mapping Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    File 1 Column
                  </th>
                  <th className="px-4 py-3 text-center w-10"></th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    File 2 Column
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Data Type
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                    Primary Key
                  </th>
                </tr>
              </thead>
              <tbody>
                {mappings.map((mapping) => (
                  <tr key={mapping.id} className="border-b border-gray-100 hover:bg-gray-50">
                    {/* File 1 Column */}
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm text-gray-900 bg-gray-100 px-2 py-1 rounded">
                        {mapping.file1Column}
                      </span>
                    </td>

                    {/* Arrow */}
                    <td className="px-4 py-3 text-center">
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    </td>

                    {/* File 2 Column */}
                    <td className="px-4 py-3">
                      <select
                        value={mapping.file2Column}
                        onChange={(e) =>
                          handleMappingChange(mapping.id, 'file2Column', e.target.value)
                        }
                        className={cn(
                          'w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-benow-blue-600',
                          mapping.file2Column
                            ? 'border-gray-300 bg-white'
                            : 'border-warning-300 bg-warning-50'
                        )}
                      >
                        <option value="">-- Select column --</option>
                        {data.file2?.columns.map((col) => (
                          <option key={col} value={col}>
                            {col}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Data Type */}
                    <td className="px-4 py-3">
                      <select
                        value={mapping.dataType}
                        onChange={(e) =>
                          handleMappingChange(mapping.id, 'dataType', e.target.value as DataType)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-benow-blue-600"
                      >
                        {dataTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Primary Key */}
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={mapping.isPrimaryKey}
                        onChange={(e) =>
                          handleMappingChange(mapping.id, 'isPrimaryKey', e.target.checked)
                        }
                        className="w-4 h-4 text-benow-blue-600 border-gray-300 rounded focus:ring-benow-blue-600"
                      />
                      {mapping.isPrimaryKey && (
                        <Key className="w-4 h-4 text-benow-blue-600 inline-block ml-2" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Total mappings:</span>
              <span className="font-medium text-gray-900">{mappings.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Mapped:</span>
              <span className="font-medium text-success-600">
                {mappings.filter((m) => m.file2Column).length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Unmapped:</span>
              <span className="font-medium text-warning-600">{unmappedColumns.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Primary key:</span>
              <span className="font-medium text-benow-blue-600">
                {mappings.find((m) => m.isPrimaryKey)?.file1Column || 'None'}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button onClick={onBack} variant="secondary" size="lg">
          Back
        </Button>
        <Button onClick={handleSave} disabled={!isValid} size="lg">
          Next: Validation Rules
        </Button>
      </div>
    </div>
  )
}
