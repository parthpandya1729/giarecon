import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import StepIndicator from './StepIndicator'
import BasicInfoStep from './BasicInfoStep'
import FileUploadStep from './FileUploadStep'
import ConfigurationStep from './ConfigurationStep'
import FieldMappingStep from './FieldMappingStep'
import ValidationRulesStep from './ValidationRulesStep'
import ReviewStep from './ReviewStep'
import type { WizardFormData, WizardStep } from '@/types/workspace-create.types'
import { useWorkspaceStore } from '@/features/workspaces/store/workspaceStore'
import { mockConfigTemplates } from '@/mocks/data/configs'

const steps: WizardStep[] = [
  {
    id: 1,
    name: 'basic-info',
    label: 'Info',
    isValid: (data) => data.name.trim().length > 0,
  },
  {
    id: 2,
    name: 'file-upload',
    label: 'Files',
    isValid: (data) => !!data.file1 && !!data.file2,
  },
  {
    id: 3,
    name: 'configuration',
    label: 'Config',
    isValid: (data) => !!data.selectedConfigId || data.useCustomConfig,
  },
  {
    id: 4,
    name: 'field-mapping',
    label: 'Mapping',
    isValid: (data) => data.mappings.some((m) => m.isPrimaryKey),
  },
  {
    id: 5,
    name: 'validation-rules',
    label: 'Rules',
    isValid: () => true, // Optional step
  },
  {
    id: 6,
    name: 'review',
    label: 'Review',
    isValid: () => true,
  },
]

export default function CreateWorkspaceWizard() {
  const navigate = useNavigate()
  const createWorkspace = useWorkspaceStore((state) => state.createWorkspace)

  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<WizardFormData>({
    name: '',
    description: '',
    tags: [],
    useCustomConfig: false,
    mappings: [],
    validationRules: [],
  })

  const handleStepClick = (stepId: number) => {
    if (stepId < currentStep) {
      setCurrentStep(stepId)
    }
  }

  const handleNext = () => {
    const nextStep = currentStep + 1

    // Skip field mapping and validation rules if using template
    if (currentStep === 3 && !formData.useCustomConfig) {
      setCurrentStep(6) // Jump to review
    } else if (nextStep <= steps.length) {
      setCurrentStep(nextStep)
    }
  }

  const handleBack = () => {
    const prevStep = currentStep - 1

    // Skip field mapping and validation rules if using template (going back)
    if (currentStep === 6 && !formData.useCustomConfig) {
      setCurrentStep(3) // Jump back to config
    } else if (prevStep >= 1) {
      setCurrentStep(prevStep)
    }
  }

  const handleBasicInfoChange = (data: {
    name: string
    description: string
    tags: string[]
  }) => {
    setFormData((prev) => ({ ...prev, ...data }))
  }

  const handleFilesChange = (data: WizardFormData['file1'] extends infer T ? { file1?: T; file2?: T } : never) => {
    setFormData((prev) => ({ ...prev, ...data }))
  }

  const handleConfigChange = (data: {
    selectedConfigId?: string
    useCustomConfig: boolean
  }) => {
    setFormData((prev) => {
      // If switching to template, load template mappings and rules
      if (data.selectedConfigId && !data.useCustomConfig) {
        const template = mockConfigTemplates.find((t) => t.id === data.selectedConfigId)
        if (template) {
          return {
            ...prev,
            ...data,
            mappings: template.config.mappings,
            validationRules: template.config.validationRules,
          }
        }
      }
      return { ...prev, ...data }
    })
  }

  const handleMappingsChange = (mappings: WizardFormData['mappings']) => {
    setFormData((prev) => ({ ...prev, mappings }))
  }

  const handleValidationRulesChange = (rules: WizardFormData['validationRules']) => {
    setFormData((prev) => ({ ...prev, validationRules: rules }))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 3000))

      // Create workspace
      const workspace = await createWorkspace({
        name: formData.name,
        description: formData.description,
        configName: formData.selectedConfigId
          ? mockConfigTemplates.find((t) => t.id === formData.selectedConfigId)?.name || 'Custom'
          : 'Custom',
      })

      if (workspace) {
        // Navigate to workspaces list
        navigate('/workspaces', {
          state: { message: 'Workspace created successfully!' },
        })
      }
    } catch (error) {
      console.error('Error creating workspace:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <BasicInfoStep
            data={{
              name: formData.name,
              description: formData.description,
              tags: formData.tags,
            }}
            onChange={handleBasicInfoChange}
            onNext={handleNext}
          />
        )

      case 2:
        return (
          <FileUploadStep
            data={{
              file1: formData.file1,
              file2: formData.file2,
            }}
            onChange={handleFilesChange}
            onNext={handleNext}
            onBack={handleBack}
          />
        )

      case 3:
        return (
          <ConfigurationStep
            data={{
              selectedConfigId: formData.selectedConfigId,
              useCustomConfig: formData.useCustomConfig,
            }}
            onChange={handleConfigChange}
            onNext={handleNext}
            onBack={handleBack}
          />
        )

      case 4:
        return (
          <FieldMappingStep
            data={{
              file1: formData.file1,
              file2: formData.file2,
              mappings: formData.mappings,
            }}
            onChange={handleMappingsChange}
            onNext={handleNext}
            onBack={handleBack}
          />
        )

      case 5:
        return (
          <ValidationRulesStep
            data={{
              mappings: formData.mappings,
              validationRules: formData.validationRules,
            }}
            onChange={handleValidationRulesChange}
            onNext={handleNext}
            onBack={handleBack}
          />
        )

      case 6:
        return (
          <ReviewStep
            data={formData}
            onEdit={setCurrentStep}
            onSubmit={handleSubmit}
            onBack={handleBack}
            isSubmitting={isSubmitting}
          />
        )

      default:
        return null
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Step Indicator */}
      <StepIndicator steps={steps} currentStep={currentStep} onStepClick={handleStepClick} />

      {/* Step Content with Animation */}
      <div className="mt-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
