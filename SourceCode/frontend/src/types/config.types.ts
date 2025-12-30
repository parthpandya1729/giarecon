import type { BaseEntity } from './common.types'

export type DataType = 'string' | 'number' | 'date' | 'boolean' | 'email' | 'phone' | 'currency'

export type RuleType =
  | 'text_format'
  | 'numeric_range'
  | 'date_format'
  | 'unique_value'
  | 'required'
  | 'expression'
  | 'length'
  | 'pattern'

export interface FieldMapping {
  id: string
  file1Column: string
  file2Column: string
  isPrimaryKey: boolean
  dataType: DataType
  isRequired?: boolean
  transformFunction?: string // e.g., "toLowerCase", "trim", "parseDate"
  defaultValue?: any
}

export interface ValidationRule {
  id: string
  name: string
  field: string
  ruleType: RuleType
  config: {
    pattern?: string // Regex pattern
    minValue?: number
    maxValue?: number
    minLength?: number
    maxLength?: number
    dateFormat?: string // e.g., "YYYY-MM-DD"
    expression?: string // Custom validation expression
    errorMessage?: string
    allowNull?: boolean
  }
  enabled: boolean
  severity: 'warning' | 'error'
}

export interface ReconciliationConfig extends BaseEntity {
  name: string
  description?: string
  isTemplate: boolean
  mappings: FieldMapping[]
  validationRules: ValidationRule[]
  matchingStrategy: 'exact' | 'fuzzy' | 'custom'
  fuzzyThreshold?: number // 0-1 for fuzzy matching
  toleranceAmount?: number // For amount discrepancies
  tolerancePercentage?: number // For percentage-based tolerance
  settings: ConfigSettings
}

export interface ConfigSettings {
  caseSensitive: boolean
  trimWhitespace: boolean
  ignoreEmptyRows: boolean
  dateFormat: string
  currencyFormat: string
  decimalSeparator: '.' | ','
  thousandsSeparator: ',' | '.' | ' ' | ''
  timezone?: string
}

export interface ConfigTemplate {
  id: string
  name: string
  description: string
  category: 'finance' | 'inventory' | 'hr' | 'sales' | 'custom'
  config: Omit<ReconciliationConfig, 'id' | 'createdAt' | 'updatedAt'>
  usageCount?: number
}

export interface FieldMappingValidation {
  isValid: boolean
  errors: string[]
  warnings: string[]
  unmappedColumns: {
    file1: string[]
    file2: string[]
  }
  duplicateMappings: string[]
}

export interface ConfigPreview {
  configId: string
  sampleData: {
    file1: Record<string, any>[]
    file2: Record<string, any>[]
  }
  mappingPreview: {
    field: string
    file1Value: any
    file2Value: any
    mapped: boolean
  }[]
  validationResults: {
    rule: ValidationRule
    passed: boolean
    failedRecords: number
    sampleErrors: string[]
  }[]
}

export interface CreateConfigInput {
  name: string
  description?: string
  isTemplate: boolean
  mappings: Omit<FieldMapping, 'id'>[]
  validationRules: Omit<ValidationRule, 'id'>[]
  matchingStrategy: 'exact' | 'fuzzy' | 'custom'
  fuzzyThreshold?: number
  toleranceAmount?: number
  tolerancePercentage?: number
  settings: ConfigSettings
}

export interface ConfigFilters {
  isTemplate?: boolean
  category?: string
  searchQuery?: string
  sortBy?: 'name' | 'createdAt' | 'usageCount'
  sortOrder?: 'asc' | 'desc'
}
