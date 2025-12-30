import { useState } from 'react'
import { X } from 'lucide-react'
import Card from '@/shared/components/Card'
import Button from '@/shared/components/Button'
import { cn } from '@/shared/utils/cn'

interface BasicInfoStepProps {
  data: {
    name: string
    description: string
    tags: string[]
  }
  onChange: (data: { name: string; description: string; tags: string[] }) => void
  onNext: () => void
}

export default function BasicInfoStep({ data, onChange, onNext }: BasicInfoStepProps) {
  const [tagInput, setTagInput] = useState('')
  const [errors, setErrors] = useState<{ name?: string }>({})

  const MAX_NAME_LENGTH = 100
  const MAX_DESCRIPTION_LENGTH = 500

  const handleNameChange = (value: string) => {
    onChange({ ...data, name: value })
    if (value.trim()) {
      setErrors({ ...errors, name: undefined })
    }
  }

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim()
    if (trimmedTag && !data.tags.includes(trimmedTag)) {
      onChange({ ...data, tags: [...data.tags, trimmedTag] })
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    onChange({ ...data, tags: data.tags.filter((tag) => tag !== tagToRemove) })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  const handleNext = () => {
    if (!data.name.trim()) {
      setErrors({ name: 'Workspace name is required' })
      return
    }
    onNext()
  }

  const isValid = data.name.trim().length > 0

  return (
    <div className="space-y-6">
      <Card>
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h3>
            <p className="text-sm text-gray-600">
              Provide basic details about your reconciliation workspace
            </p>
          </div>

          {/* Workspace Name */}
          <div>
            <label htmlFor="workspace-name" className="block text-sm font-medium text-gray-700 mb-2">
              Workspace Name <span className="text-error-600">*</span>
            </label>
            <input
              id="workspace-name"
              type="text"
              value={data.name}
              onChange={(e) => handleNameChange(e.target.value)}
              maxLength={MAX_NAME_LENGTH}
              placeholder="e.g., Samsung Q4 2024 Reconciliation"
              className={cn(
                'w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-benow-blue-600 focus:border-transparent transition-all',
                errors.name ? 'border-error-600' : 'border-gray-300'
              )}
            />
            <div className="flex justify-between items-center mt-1">
              <div>
                {errors.name && <p className="text-sm text-error-600">{errors.name}</p>}
              </div>
              <p className="text-xs text-gray-500">
                {data.name.length}/{MAX_NAME_LENGTH}
              </p>
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="workspace-description" className="block text-sm font-medium text-gray-700 mb-2">
              Description <span className="text-gray-400">(Optional)</span>
            </label>
            <textarea
              id="workspace-description"
              value={data.description}
              onChange={(e) => onChange({ ...data, description: e.target.value })}
              maxLength={MAX_DESCRIPTION_LENGTH}
              rows={4}
              placeholder="Describe the purpose of this reconciliation workspace..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-benow-blue-600 focus:border-transparent transition-all resize-none"
            />
            <p className="text-xs text-gray-500 mt-1 text-right">
              {data.description.length}/{MAX_DESCRIPTION_LENGTH}
            </p>
          </div>

          {/* Tags */}
          <div>
            <label htmlFor="workspace-tags" className="block text-sm font-medium text-gray-700 mb-2">
              Tags <span className="text-gray-400">(Optional)</span>
            </label>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  id="workspace-tags"
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Add tags (press Enter)"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-benow-blue-600 focus:border-transparent transition-all"
                />
                <Button
                  type="button"
                  onClick={handleAddTag}
                  disabled={!tagInput.trim()}
                  variant="secondary"
                >
                  Add Tag
                </Button>
              </div>

              {/* Tag List */}
              {data.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {data.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-benow-blue-50 text-benow-blue-700 rounded-full text-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:bg-benow-blue-100 rounded-full p-0.5 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Navigation */}
      <div className="flex justify-end">
        <Button onClick={handleNext} disabled={!isValid} size="lg">
          Next: Upload Files
        </Button>
      </div>
    </div>
  )
}
