import type { FieldMapping, ValidationRule } from './config.types'

export interface CreateWorkspaceInput {
  name: string
  description?: string
  tags?: string[]
  file1: UploadedFile
  file2: UploadedFile
  configId?: string // Existing template
  customConfig?: {
    mappings: FieldMapping[]
    validationRules: ValidationRule[]
  }
}

export interface UploadedFile {
  id: string
  name: string
  size: number
  rows: number
  columns: string[]
  preview: Record<string, any>[] // First 5 rows
}

export interface WizardStep {
  id: number
  name: string
  label: string
  isValid: (data: WizardFormData) => boolean
}

export interface WizardFormData {
  // Step 1: Basic Info
  name: string
  description: string
  tags: string[]

  // Step 2: Files
  file1?: UploadedFile
  file2?: UploadedFile

  // Step 3: Configuration
  selectedConfigId?: string
  useCustomConfig: boolean

  // Step 4: Field Mapping
  mappings: FieldMapping[]

  // Step 5: Validation Rules
  validationRules: ValidationRule[]
}

export interface FileUploadProgress {
  fileName: string
  progress: number
  status: 'idle' | 'uploading' | 'processing' | 'complete' | 'error'
  error?: string
}
